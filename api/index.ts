import { Router } from 'express';
import { handleHealthCheck, handlePing, performHealthCheck } from './health';

export const apiRouter = Router();

// Health Check Endpoints
apiRouter.get('/health', handleHealthCheck);
apiRouter.get('/health/ping', handlePing);

export { handleHealthCheck, handlePing, performHealthCheck };
export default apiRouter;
