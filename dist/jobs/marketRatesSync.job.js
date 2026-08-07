"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncMarketRates = syncMarketRates;
exports.startMarketRatesSyncJob = startMarketRatesSyncJob;
const cron_1 = require("cron");
const database_1 = require("../config/database");
const logger_1 = require("../config/logger");
const DATA_GOV_API_KEY = process.env.DATA_GOV_API_KEY ?? '';
// data.gov.in resource ID for daily APMC commodity prices
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
// Crops to sync (must match commodity names in the API)
const CROP_FILTERS = [
    'Coffee', 'Black Pepper', 'Cardamom', 'Arecanut', 'Coconut',
    'Paddy(Dhan)(Common)', 'Banana', 'Mango', 'Tea', 'Vanilla', 'Cinnamon',
    'Orange', 'Jackfruit',
];
const STATE_NAME_FIX = {
    'keralam': 'Kerala',
    'uttarakhand': 'Uttarakhand',
    'orissa': 'Odisha',
};
function fixStateName(s) {
    return STATE_NAME_FIX[s.trim().toLowerCase()] ?? s.trim();
}
async function fetchAndSyncCrop(crop) {
    const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`);
    url.searchParams.set('api-key', DATA_GOV_API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '500');
    url.searchParams.set('filters[commodity]', crop);
    const res = await fetch(url.toString());
    if (!res.ok) {
        logger_1.logger.warn(`Market rates API error for ${crop}: ${res.status}`);
        return 0;
    }
    const json = (await res.json());
    const records = json.records ?? [];
    if (records.length === 0)
        return 0;
    const data = records
        .map((r) => {
        const parts = r.arrival_date?.split('/'); // DD/MM/YYYY
        if (!parts || parts.length !== 3)
            return null;
        const arrivalDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`);
        if (isNaN(arrivalDate.getTime()))
            return null;
        return {
            cropName: r.commodity,
            marketName: r.market,
            district: r.district,
            state: fixStateName(r.state),
            arrivalDate,
            variety: r.variety || 'Other',
            grade: r.grade || 'FAQ',
            minPrice: parseFloat(r.min_price) || 0,
            modalPrice: parseFloat(r.modal_price) || 0,
            maxPrice: parseFloat(r.max_price) || 0,
        };
    })
        .filter(Boolean);
    if (data.length === 0)
        return 0;
    await database_1.prisma.marketRate.createMany({ data, skipDuplicates: true });
    return data.length;
}
async function syncMarketRates() {
    if (!DATA_GOV_API_KEY) {
        logger_1.logger.warn('DATA_GOV_API_KEY not set — skipping market rates sync');
        return;
    }
    logger_1.logger.info('Starting market rates sync from data.gov.in...');
    let total = 0;
    for (const crop of CROP_FILTERS) {
        try {
            const count = await fetchAndSyncCrop(crop);
            total += count;
        }
        catch (err) {
            logger_1.logger.error({ err, crop }, 'Failed to sync market rates for crop');
        }
    }
    // Keep only last 30 days of data
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - 30);
    await database_1.prisma.marketRate.deleteMany({ where: { arrivalDate: { lt: cutoff } } });
    logger_1.logger.info(`Market rates sync complete — ${total} records inserted`);
}
function startMarketRatesSyncJob() {
    // Run daily at 6:00 AM IST (00:30 UTC)
    const job = new cron_1.CronJob('30 0 * * *', async () => {
        await syncMarketRates();
    }, null, true, 'UTC');
    logger_1.logger.info('Market rates sync job scheduled (daily 6AM IST)');
    // Also run immediately on startup
    syncMarketRates().catch((err) => logger_1.logger.error({ err }, 'Initial market rates sync failed'));
}
//# sourceMappingURL=marketRatesSync.job.js.map