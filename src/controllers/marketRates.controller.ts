import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

// Maps frontend crop names → possible DB crop name variants from data.gov.in
const CROP_ALIASES: Record<string, string[]> = {
  'Paddy (Rice)': ['Paddy(Common)', 'Paddy(Dhan)(Common)', 'Paddy(Basmati)', 'Paddy'],
  'Arecanut':     ['Arecanut', 'Arecanut(Betelnut/Supari)'],
  'Black Pepper': ['Black Pepper', 'Black pepper', 'Pepper garbled'],
  'Jackfruit':    ['Jackfruit', 'Jackfruit(Green/Raw/Unripe)'],
  'Banana':       ['Banana', 'Banana - Green'],
};

export const getMarketRates = asyncHandler(async (req: Request, res: Response) => {
  const { crop, date } = req.query;
  if (!crop || typeof crop !== 'string') {
    throw new ApiError(400, 'crop query parameter is required');
  }

  const aliases = CROP_ALIASES[crop];
  const where: any = aliases
    ? { cropName: { in: aliases, mode: 'insensitive' } }
    : { cropName: { equals: crop, mode: 'insensitive' } };

  // If date=YYYY-MM-DD is provided, filter to that single day
  if (date && typeof date === 'string') {
    const parsed = new Date(date + 'T00:00:00.000Z');
    if (!isNaN(parsed.getTime())) {
      const next = new Date(parsed);
      next.setUTCDate(next.getUTCDate() + 1);
      where.arrivalDate = { gte: parsed, lt: next };
    }
  }

  const records = await prisma.marketRate.findMany({
    where,
    orderBy: { arrivalDate: 'desc' },
  });

  const data = records.map((r) => ({
    crop_name: r.cropName,
    market_name: r.marketName,
    district: r.district,
    state: r.state,
    arrival_date: r.arrivalDate.toISOString().split('T')[0],
    variety: r.variety,
    grade: r.grade,
    min_price: r.minPrice,
    modal_price: r.modalPrice,
    max_price: r.maxPrice,
    unit: 'Quintal',
  }));

  const message = data.length === 0
    ? 'No market rates found. Data syncs daily from data.gov.in APMC API.'
    : 'Market rates fetched';

  res.json(new ApiResponse(200, data, message));
});
