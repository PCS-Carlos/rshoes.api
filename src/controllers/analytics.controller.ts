import {Request, Response as ExpressResponse, Router} from 'express';
import {handleError} from '.';
import {validateJWT} from '../middlewares/auth.middleware';
import {AnalyticsPeriod, getPosthogDashboardData} from '../services/posthogAnalytics.service';

const AnalyticsController = () => {
  const router = Router();

  const getAnalyticsDashboard = async (req: Request, res: ExpressResponse) => {
    console.log('GET /analytics/posthog-dashboard');

    try {
      const periodCandidate = typeof req.query.period === 'string' ? req.query.period : '7d';
      const period: AnalyticsPeriod = periodCandidate === '30d' || periodCandidate === '90d' ? periodCandidate : '7d';

      const envCandidate = typeof req.query.env === 'string' ? req.query.env : 'prod';
      const env = envCandidate.trim() || 'prod';

      const response = await getPosthogDashboardData(period, env);
      return res.json(response);
    } catch (error) {
      return handleError(res, error, 'Analytics');
    }
  };

  router.get('/analytics/posthog-dashboard', validateJWT, getAnalyticsDashboard);

  return {
    router,
  };
};

export default AnalyticsController;
