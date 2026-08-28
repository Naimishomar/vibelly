"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIceServers = void 0;
const env_1 = require("../config/env");
const STUN = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];
let cachedIce = null;
const TURN_TTL_SECONDS = 3600;
async function fetchTurnServers() {
    if (env_1.ENV.TURN_URLS) {
        return [{
                urls: env_1.ENV.TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean),
                username: env_1.ENV.TURN_USERNAME,
                credential: env_1.ENV.TURN_CREDENTIAL,
            }];
    }
    if (!env_1.ENV.TURN_KEY_ID || !env_1.ENV.TURN_API_TOKEN)
        return [];
    const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${env_1.ENV.TURN_KEY_ID}/credentials/generate-ice-servers`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env_1.ENV.TURN_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ttl: TURN_TTL_SECONDS }),
    });
    if (!response.ok)
        throw new Error(await response.text());
    const data = await response.json();
    return Array.isArray(data.iceServers) ? data.iceServers : [data.iceServers];
}
// Clients call this before every peer connection. Falls back to STUN-only so a
// TURN outage degrades to "works on open networks" instead of failing outright.
const getIceServers = async (_req, res) => {
    if (cachedIce && cachedIce.expiresAt > Date.now()) {
        res.json({ iceServers: cachedIce.servers });
        return;
    }
    try {
        const turn = await fetchTurnServers();
        const servers = [...STUN, ...turn];
        if (turn.length) {
            // Renew a few minutes before the credential actually expires.
            cachedIce = { servers, expiresAt: Date.now() + (TURN_TTL_SECONDS - 300) * 1000 };
        }
        res.json({ iceServers: servers });
    }
    catch (error) {
        console.error('Failed to fetch TURN credentials:', error);
        res.json({ iceServers: STUN });
    }
};
exports.getIceServers = getIceServers;
//# sourceMappingURL=webrtc.controller.js.map