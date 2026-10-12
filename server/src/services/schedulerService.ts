import cron, { ScheduledTask } from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../prisma/client.js';
import { NotificationType } from '../types/enums.js';
import { NotificationService } from './notificationService.js';
import { roundMoney } from '../utils/decimal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const SCHEDULER_HISTORY_FILE = path.join(DATA_DIR, 'scheduler-history.json');
const IDEMPOTENCY_FILE = path.join(DATA_DIR, 'reminder-idempotency.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface SchedulerExecutionLog {
  id: string;
  timestamp: string;
  triggerType: 'CRON_SCHEDULED' | 'MANUAL_TRIGGER';
  companiesProcessed: number;
  remindersSent: number;
  overdueAlertsSent: number;
  errors: string[];
}

export class SchedulerService {
  private static cronTask: ScheduledTask | null = null;
  private static isRunning = false;

  private static readIdempotencyMap(): Record<string, string> {
    try {
      if (!fs.existsSync(IDEMPOTENCY_FILE)) return {};
      const content = fs.readFileSync(IDEMPOTENCY_FILE, 'utf-8');
      return JSON.parse(content || '{}');
    } catch {
      return {};
    }
  }

  private static recordIdempotencyKey(key: string) {
    try {
      const map = this.readIdempotencyMap();
      map[key] = new Date().toISOString();
      // Keep map size reasonable (prune keys older than 30 days)
      const now = Date.now();
      const pruned: Record<string, string> = {};
      for (const [k, v] of Object.entries(map)) {
        if (now - new Date(v).getTime() < 30 * 24 * 60 * 60 * 1000) {
          pruned[k] = v;
        }
      }
      fs.writeFileSync(IDEMPOTENCY_FILE, JSON.stringify(pruned, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write reminder idempotency key:', err);
    }
  }

  private static hasBeenSent(key: string): boolean {
    const map = this.readIdempotencyMap();
    return !!map[key];
  }

  private static logExecution(log: SchedulerExecutionLog) {
    try {
      let history: SchedulerExecutionLog[] = [];
      if (fs.existsSync(SCHEDULER_HISTORY_FILE)) {
        history = JSON.parse(fs.readFileSync(SCHEDULER_HISTORY_FILE, 'utf-8') || '[]');
      }
      history.unshift(log);
      if (history.length > 50) history = history.slice(0, 50);
      fs.writeFileSync(SCHEDULER_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to log scheduler execution:', err);
    }
  }

  static getExecutionHistory(): SchedulerExecutionLog[] {
    try {
      if (!fs.existsSync(SCHEDULER_HISTORY_FILE)) return [];
      return JSON.parse(fs.readFileSync(SCHEDULER_HISTORY_FILE, 'utf-8') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Run financial reminder scans across all companies or a specific company
   */
  static async runDailyFinancialReminderScan(
    targetCompanyId?: string,
    triggerType: 'CRON_SCHEDULED' | 'MANUAL_TRIGGER' = 'MANUAL_TRIGGER'
  ): Promise<SchedulerExecutionLog> {
    if (this.isRunning) {
      console.log('[SchedulerService] Scan already in progress, skipping concurrent run.');
      return {
        id: `skip_${Date.now()}`,
        timestamp: new Date().toISOString(),
        triggerType,
        companiesProcessed: 0,
        remindersSent: 0,
        overdueAlertsSent: 0,
        errors: ['Concurrent execution prevented'],
      };
    }

    this.isRunning = true;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Tomorrow date range
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let companiesProcessed = 0;
    let remindersSent = 0;
    let overdueAlertsSent = 0;
    const errors: string[] = [];

    try {
      // Find companies
      const companies = targetCompanyId
        ? [{ id: targetCompanyId }]
        : await prisma.company.findMany({ select: { id: true } });

      for (const comp of companies) {
        companiesProcessed++;
        const companyId = comp.id;

        try {
          // 1. REPAYMENTS DUE TOMORROW
          const dueTomorrowSchedules = await prisma.repaymentSchedule.findMany({
            where: {
              deal: { companyId },
              status: { in: ['DUE', 'PARTIALLY_PAID', 'UPCOMING'] },
              dueDate: {
                gte: new Date(`${tomorrowStr}T00:00:00.000Z`),
                lte: new Date(`${tomorrowStr}T23:59:59.999Z`),
              },
            },
            include: {
              deal: {
                include: {
                  client: { select: { fullName: true } },
                },
              },
            },
          });

          for (const sch of dueTomorrowSchedules) {
            const idempotencyKey = `REMINDER_DUE_TOMORROW_${sch.id}_${tomorrowStr}`;
            if (!this.hasBeenSent(idempotencyKey)) {
              const balanceAmt = roundMoney(sch.balanceAmount).toNumber();
              const clientName = sch.deal.client?.fullName || 'Client';

              await NotificationService.createNotification(
                companyId,
                NotificationType.REPAYMENT_DUE,
                'Repayment Due Tomorrow',
                `Installment #${sch.installmentNumber} of ₹${balanceAmt.toLocaleString('en-IN')} for Deal ${sch.deal.dealNumber} (${clientName}) is due tomorrow.`,
                'REPAYMENT_SCHEDULE',
                sch.id,
                '/repayments'
              );

              this.recordIdempotencyKey(idempotencyKey);
              remindersSent++;
            }
          }

          // 2. REPAYMENTS OVERDUE
          const overdueSchedules = await prisma.repaymentSchedule.findMany({
            where: {
              deal: { companyId, status: { in: ['ACTIVE', 'OVERDUE'] } },
              status: { in: ['OVERDUE', 'DUE', 'PARTIALLY_PAID'] },
              dueDate: {
                lt: new Date(`${todayStr}T00:00:00.000Z`),
              },
            },
            include: {
              deal: {
                include: {
                  client: { select: { fullName: true } },
                },
              },
            },
            take: 100,
          });

          for (const sch of overdueSchedules) {
            const idempotencyKey = `ALERT_OVERDUE_${sch.id}_${todayStr}`;
            if (!this.hasBeenSent(idempotencyKey)) {
              const balanceAmt = roundMoney(sch.balanceAmount).toNumber();
              const daysOverdue = Math.max(
                1,
                Math.floor((now.getTime() - new Date(sch.dueDate).getTime()) / (1000 * 60 * 60 * 24))
              );
              const clientName = sch.deal.client?.fullName || 'Client';

              await NotificationService.createNotification(
                companyId,
                NotificationType.REPAYMENT_OVERDUE,
                'Repayment Overdue Alert',
                `Installment #${sch.installmentNumber} of ₹${balanceAmt.toLocaleString('en-IN')} (${clientName}, Deal ${sch.deal.dealNumber}) is overdue by ${daysOverdue} days.`,
                'REPAYMENT_SCHEDULE',
                sch.id,
                '/repayments'
              );

              this.recordIdempotencyKey(idempotencyKey);
              overdueAlertsSent++;
            }
          }
        } catch (compErr: any) {
          errors.push(`Company ${companyId}: ${compErr.message}`);
        }
      }
    } catch (globalErr: any) {
      errors.push(`Global: ${globalErr.message}`);
    } finally {
      this.isRunning = false;
    }

    const log: SchedulerExecutionLog = {
      id: `exec_${Date.now()}`,
      timestamp: now.toISOString(),
      triggerType,
      companiesProcessed,
      remindersSent,
      overdueAlertsSent,
      errors,
    };

    this.logExecution(log);
    console.log(
      `[SchedulerService] Scan completed (${triggerType}): ${companiesProcessed} companies, ${remindersSent} due reminders, ${overdueAlertsSent} overdue alerts.`
    );
    return log;
  }

  /**
   * Initialize cron job scheduler on server startup
   */
  static initScheduler() {
    if (this.cronTask) {
      console.log('[SchedulerService] Scheduler already initialized.');
      return;
    }

    // Run every day at 08:00 AM server time (0 8 * * *)
    const cronSchedule = process.env.REMINDER_CRON_SCHEDULE || '0 8 * * *';
    console.log(`[SchedulerService] Initializing Financial Reminders Cron (${cronSchedule})...`);

    this.cronTask = cron.schedule(cronSchedule, async () => {
      console.log('[SchedulerService] Executing scheduled daily financial reminders...');
      await this.runDailyFinancialReminderScan(undefined, 'CRON_SCHEDULED');
    });
  }

  static stopScheduler() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
      console.log('[SchedulerService] Financial Reminders Cron stopped.');
    }
  }
}
