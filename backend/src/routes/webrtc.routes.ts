import { Router } from 'express';
import { getIceServers } from '../controllers/webrtc.controller';

const router = Router();

// STUN/TURN servers for the browser's RTCPeerConnection
router.get('/ice', getIceServers);

export default router;
