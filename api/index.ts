import { Router } from 'express';
import healthHandler, { handleHealthCheck, handlePing, performHealthCheck } from './health';

export const apiRouter = Router();

// Health Check Endpoints for local Express server
apiRouter.get('/health', healthHandler);
apiRouter.get('/health/ping', handlePing);

/**
 * Default export for Vercel Serverless Function when calling /api or /api/index
 */
export default async function handler(req: any, res: any): Promise<void> {
  return healthHandler(req, res);
}

export { handleHealthCheck, handlePing, performHealthCheck };
