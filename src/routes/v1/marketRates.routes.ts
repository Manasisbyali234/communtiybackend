import { Router } from 'express';
import { getMarketRates } from '../../controllers/marketRates.controller';

const router = Router();

// GET /api/v1/market-rates?crop=Coffee
router.get('/', getMarketRates);

export default router;
