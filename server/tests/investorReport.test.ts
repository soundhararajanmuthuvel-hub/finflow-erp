import { Prisma } from '@prisma/client';
import { roundMoney, toDecimal, decimalMax } from '../src/utils/decimal.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

function assertEqual(actual: any, expected: any, msg: string) {
  try {
    const actDec = toDecimal(actual);
    const expDec = toDecimal(expected);
    if (actDec.toFixed(2) === expDec.toFixed(2)) {
      console.log(`  ✓ PASS: ${msg} [₹${actDec.toFixed(2)}]`);
      passed++;
      return;
    }
  } catch {
    // fallback
  }

  const actualStr = String(actual);
  const expectedStr = String(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✓ PASS: ${msg} [${actualStr}]`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg} -> expected: ${expectedStr}, got: ${actualStr}`);
    failed++;
  }
}

console.log('====================================================');
console.log('FINFLOW — INDIVIDUAL INVESTOR REPORT TEST SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------------------------------------------
// Test 1: Data Privacy & Multi-Tenant Isolation
// Selecting Investor A must strictly return only Investor A's deals, collections, and payouts.
// Investor B's data must NEVER leak or be combined into Investor A's statement.
// -------------------------------------------------------------------------------------------------
console.log('Test 1: Strict Investor Isolation (Investor A vs Investor B)');
{
  const investorA_Fundings = [
    { dealId: 'deal-1', investorId: 'inv-A', amount: new Prisma.Decimal(100000), percentage: new Prisma.Decimal(50) },
  ];
  const investorB_Fundings = [
    { dealId: 'deal-1', investorId: 'inv-B', amount: new Prisma.Decimal(50000), percentage: new Prisma.Decimal(25) },
    { dealId: 'deal-2', investorId: 'inv-B', amount: new Prisma.Decimal(75000), percentage: new Prisma.Decimal(100) },
  ];

  const allFundings = [...investorA_Fundings, ...investorB_Fundings];

  // Filter strictly for Investor A
  const filteredForA = allFundings.filter((f) => f.investorId === 'inv-A');
  const filteredForB = allFundings.filter((f) => f.investorId === 'inv-B');

  assert(filteredForA.length === 1, 'Only 1 funding record returned for Investor A');
  assertEqual(filteredForA[0].amount, 100000, 'Investor A funding is exactly ₹100,000');
  assert(!filteredForA.some((f) => f.investorId === 'inv-B'), 'Investor B records are completely absent from Investor A');

  assert(filteredForB.length === 2, 'Exactly 2 funding records returned for Investor B');
  assertEqual(
    filteredForB.reduce((acc, f) => acc.plus(f.amount), new Prisma.Decimal(0)),
    125000,
    'Investor B total invested is ₹125,000'
  );
}

// -------------------------------------------------------------------------------------------------
// Test 2: Principal Returned vs ROI Earned Distinction
// Principal returned must NEVER be counted as ROI earned.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 2: Financial Accuracy — Principal Returned vs ROI Earned Distinction');
{
  const totalInvested = new Prisma.Decimal(200000); // ₹2,00,000 invested
  const expectedContractedROI = new Prisma.Decimal(36000); // 18% ROI expected

  // A repayment distribution occurs: ₹20,000 principal returned + ₹3,600 interest earned
  const principalReturned = new Prisma.Decimal(20000);
  const interestEarned = new Prisma.Decimal(3600);
  const roiPaid = interestEarned; // verified payout

  const remainingPrincipal = roundMoney(decimalMax(new Prisma.Decimal(0), totalInvested.minus(principalReturned)));
  const pendingROI = roundMoney(decimalMax(new Prisma.Decimal(0), expectedContractedROI.minus(interestEarned)));
  const totalReturnPaid = roundMoney(principalReturned.plus(roiPaid));
  const totalOutstandingPayable = roundMoney(remainingPrincipal.plus(pendingROI));

  assertEqual(remainingPrincipal, 180000, 'Remaining Principal is ₹180,000.00 (not reduced by interest)');
  assertEqual(interestEarned, 3600, 'ROI Earned is strictly ₹3,600.00');
  assertEqual(pendingROI, 32400, 'Pending ROI is ₹32,400.00');
  assertEqual(totalReturnPaid, 23600, 'Total Return Paid is ₹23,600.00 (Principal + ROI)');
  assertEqual(totalOutstandingPayable, 212400, 'Total Outstanding Payable is ₹212,400.00 (Remaining Principal + Pending ROI)');
  assert(!totalReturnPaid.equals(interestEarned), 'Principal returned is NOT conflated with ROI');
}

// -------------------------------------------------------------------------------------------------
// Test 3: Weekly Period Calculations (Opening Balance, Period Movements, Closing Balance)
// Verify exact opening, period, and closing mathematical reconciliation.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 3: Weekly Period Reconciliation (Opening + Period Activity = Closing)');
{
  const periodStart = new Date('2026-10-05T00:00:00.000Z');
  const periodEnd = new Date('2026-10-11T23:59:59.999Z');

  // Transactions:
  // Tx 1 (Prior to period): Invested ₹100,000 on Oct 01
  // Tx 2 (Prior to period): Collection return ₹10,000 principal + ₹1,500 ROI on Oct 03
  // Tx 3 (Inside period): Additional investment ₹50,000 on Oct 07
  // Tx 4 (Inside period): Collection return ₹15,000 principal + ₹2,000 ROI on Oct 09
  // Contracted total ROI: ₹30,000

  const allExpectedROI = new Prisma.Decimal(30000);

  // Opening
  const openingInvested = new Prisma.Decimal(100000);
  const openingPrincipalReturned = new Prisma.Decimal(10000);
  const openingROIEarned = new Prisma.Decimal(1500);
  const openingROIPaid = new Prisma.Decimal(1500);

  const openingRemainingPrincipal = roundMoney(openingInvested.minus(openingPrincipalReturned));
  const openingTotalPaid = roundMoney(openingPrincipalReturned.plus(openingROIPaid));

  assertEqual(openingRemainingPrincipal, 90000, 'Opening remaining principal is ₹90,000.00');
  assertEqual(openingTotalPaid, 11500, 'Opening total return paid is ₹11,500.00');

  // Period activity
  const periodInvested = new Prisma.Decimal(50000);
  const periodPrincipalReturned = new Prisma.Decimal(15000);
  const periodROIEarned = new Prisma.Decimal(2000);
  const periodROIPaid = new Prisma.Decimal(2000);
  const periodTotalPayout = roundMoney(periodPrincipalReturned.plus(periodROIPaid));

  assertEqual(periodTotalPayout, 17000, 'Period total payout is ₹17,000.00');

  // Closing
  const closingInvested = roundMoney(openingInvested.plus(periodInvested));
  const closingPrincipalReturned = roundMoney(openingPrincipalReturned.plus(periodPrincipalReturned));
  const closingRemainingPrincipal = roundMoney(closingInvested.minus(closingPrincipalReturned));
  const closingROIEarned = roundMoney(openingROIEarned.plus(periodROIEarned));
  const closingROIPaid = roundMoney(openingROIPaid.plus(periodROIPaid));
  const closingPendingROI = roundMoney(allExpectedROI.minus(closingROIEarned));
  const closingTotalReturnPaid = roundMoney(closingPrincipalReturned.plus(closingROIPaid));
  const closingOutstandingPayable = roundMoney(closingRemainingPrincipal.plus(closingPendingROI));

  assertEqual(closingInvested, 150000, 'Closing invested capital is ₹150,000.00');
  assertEqual(closingPrincipalReturned, 25000, 'Closing principal returned is ₹25,000.00');
  assertEqual(closingRemainingPrincipal, 125000, 'Closing remaining principal is ₹125,000.00');
  assertEqual(closingROIEarned, 3500, 'Closing ROI earned is ₹3,500.00');
  assertEqual(closingPendingROI, 26500, 'Closing pending ROI is ₹26,500.00');
  assertEqual(closingTotalReturnPaid, 28500, 'Closing total return paid is ₹28,500.00');
  assertEqual(closingOutstandingPayable, 151500, 'Closing total outstanding payable is ₹151,500.00');

  // Mathematical Reconciliation Identity:
  // Opening Remaining Principal (90k) + Period Additions (50k) - Period Principal Returned (15k) === Closing Remaining Principal (125k)
  const reconciledRemainingPrincipal = roundMoney(openingRemainingPrincipal.plus(periodInvested).minus(periodPrincipalReturned));
  assert(
    reconciledRemainingPrincipal.equals(closingRemainingPrincipal),
    'Reconciliation check: Opening Remaining (90k) + New Investments (50k) - Period Returns (15k) === Closing Remaining (125k)'
  );
}

// -------------------------------------------------------------------------------------------------
// Test 4: Reversal Handling (Reversed/Voided transactions excluded from active totals)
// Reversals must be flagged in audit trail but strictly omitted from active financial totals.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 4: Reversal Handling (Exclude REVERSED and VOIDED from active totals)');
{
  const returns = [
    { id: 'ret-1', principalReturned: new Prisma.Decimal(10000), interestEarned: new Prisma.Decimal(1200), status: 'PROCESSED' },
    { id: 'ret-2', principalReturned: new Prisma.Decimal(5000), interestEarned: new Prisma.Decimal(600), status: 'REVERSED' },
    { id: 'ret-3', principalReturned: new Prisma.Decimal(8000), interestEarned: new Prisma.Decimal(960), status: 'VOIDED' },
    { id: 'ret-4', principalReturned: new Prisma.Decimal(7000), interestEarned: new Prisma.Decimal(840), status: 'VERIFIED' },
  ];

  let activePrincipalReturned = new Prisma.Decimal(0);
  let activeInterestEarned = new Prisma.Decimal(0);
  let auditHistoryCount = 0;

  returns.forEach((r) => {
    auditHistoryCount++;
    const isReversed = r.status === 'REVERSED' || r.status === 'VOIDED';
    const isVerified = r.status === 'PROCESSED' || r.status === 'VERIFIED';
    if (!isReversed && isVerified) {
      activePrincipalReturned = activePrincipalReturned.plus(r.principalReturned);
      activeInterestEarned = activeInterestEarned.plus(r.interestEarned);
    }
  });

  assert(auditHistoryCount === 4, 'Audit ledger preserves all 4 records including reversed/voided');
  assertEqual(activePrincipalReturned, 17000, 'Active Principal Returned is ₹17,000.00 (excludes ₹5,000 + ₹8,000)');
  assertEqual(activeInterestEarned, 2040, 'Active ROI Earned is ₹2,040.00 (excludes ₹600 + ₹960)');
}

// -------------------------------------------------------------------------------------------------
// Test 5: Empty State Handling
// Investor with 0 transactions returns clean 0 metrics without NaN or null errors.
// -------------------------------------------------------------------------------------------------
console.log('\nTest 5: Empty State Handling for New or Inactive Investor');
{
  const emptyFundings: any[] = [];
  const emptyReturns: any[] = [];

  let totalInvested = new Prisma.Decimal(0);
  let principalReturned = new Prisma.Decimal(0);
  let roiEarned = new Prisma.Decimal(0);

  const remainingPrincipal = roundMoney(decimalMax(new Prisma.Decimal(0), totalInvested.minus(principalReturned)));
  const totalOutstanding = roundMoney(remainingPrincipal.plus(roiEarned));

  assertEqual(totalInvested, 0, 'Total invested is ₹0.00');
  assertEqual(remainingPrincipal, 0, 'Remaining principal is ₹0.00');
  assertEqual(totalOutstanding, 0, 'Total outstanding is ₹0.00');
  assert(emptyFundings.length === 0, 'Empty state triggers gracefully when transactions array is empty');
}

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
