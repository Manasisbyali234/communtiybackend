"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marketRates_controller_1 = require("../../controllers/marketRates.controller");
const router = (0, express_1.Router)();
// GET /api/v1/market-rates?crop=Coffee
router.get('/', marketRates_controller_1.getMarketRates);
exports.default = router;
//# sourceMappingURL=marketRates.routes.js.map