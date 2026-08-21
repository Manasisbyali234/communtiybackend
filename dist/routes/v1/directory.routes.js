"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const directory = __importStar(require("../../controllers/directory.controller"));
const router = (0, express_1.Router)();
router.use(auth_1.auth);
router.get('/businesses', directory.listBusinesses);
router.get('/businesses/mine', directory.myBusinesses);
router.get('/businesses/admin', directory.listBusinessesAdmin);
router.post('/businesses', directory.createBusiness);
router.get('/businesses/:id', directory.getBusiness);
router.patch('/businesses/:id', directory.updateBusiness);
router.delete('/businesses/:id', directory.deleteBusiness);
router.post('/businesses/:id/contact', directory.contactBusiness);
router.post('/businesses/:id/reviews', directory.addBusinessReview);
router.patch('/businesses/:id/moderate', directory.businessModeration);
router.get('/help-requests', directory.listHelp);
router.get('/help-requests/mine', directory.myHelp);
router.get('/help-requests/admin', directory.listHelpAdmin);
router.post('/help-requests', directory.createHelp);
router.get('/help-requests/:id', directory.getHelp);
router.post('/help-requests/:id/offers', directory.offerHelp);
router.patch('/help-requests/:id/moderate', directory.moderateHelp);
router.patch('/help-requests/:id/resolve', directory.resolveHelp);
router.delete('/help-requests/:id', directory.deleteHelp);
router.get('/community-stories', directory.listCommunityStories);
router.get('/community-stories/admin', directory.listCommunityStoriesAdmin);
router.post('/community-stories', directory.createCommunityStory);
router.get('/community-stories/:id', directory.getCommunityStory);
router.patch('/community-stories/:id', directory.updateCommunityStory);
router.delete('/community-stories/:id', directory.deleteCommunityStory);
exports.default = router;
//# sourceMappingURL=directory.routes.js.map