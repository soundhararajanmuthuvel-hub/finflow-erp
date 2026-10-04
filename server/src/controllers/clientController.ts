import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { ClientService } from '../services/clientService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class ClientController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const search = req.query.search as string | undefined;
      const clients = await ClientService.listClients(companyId, search);
      sendSuccess(res, clients, 'Clients retrieved');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const client = await ClientService.getClientById(companyId, id);
      sendSuccess(res, client, 'Client details retrieved');
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const client = await ClientService.createClient(companyId, req.body);
      sendSuccess(res, client, 'Client created successfully', 201);
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      const client = await ClientService.updateClient(companyId, id, req.body);
      sendSuccess(res, client, 'Client updated successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const companyId = req.user!.companyId;
      const id = req.params.id as string;
      await ClientService.deleteClient(companyId, id);
      sendSuccess(res, { id }, 'Client deleted successfully');
    } catch (error: any) {
      sendError(res, error.message);
    }
  }
}
