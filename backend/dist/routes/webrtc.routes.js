"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webrtc_controller_1 = require("../controllers/webrtc.controller");
const router = (0, express_1.Router)();
// STUN/TURN servers for the browser's RTCPeerConnection
router.get('/ice', webrtc_controller_1.getIceServers);
exports.default = router;
//# sourceMappingURL=webrtc.routes.js.map