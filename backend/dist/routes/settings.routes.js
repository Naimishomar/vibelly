"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// GET /api/settings
router.get('/', async (req, res) => {
    try {
        const guestAccessEnabled = await server_1.redisClient.get('appSettings:guestAccessEnabled');
        // If key doesn't exist, default to true
        if (guestAccessEnabled === null) {
            res.json({ guestAccessEnabled: true });
        }
        else {
            res.json({ guestAccessEnabled: guestAccessEnabled === 'true' || guestAccessEnabled === true });
        }
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        // Fail open by default
        res.json({ guestAccessEnabled: true });
    }
});
exports.default = router;
//# sourceMappingURL=settings.routes.js.map