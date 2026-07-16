import 'dotenv/config';
import { syncMarketRates } from './src/jobs/marketRatesSync.job';

syncMarketRates()
  .then(() => { console.log('✅ Sync complete'); process.exit(0); })
  .catch((e) => { console.error('❌ Sync failed:', e); process.exit(1); });
