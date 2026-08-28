"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Verifies that the configured TURN servers actually relay media.
// A dead TURN server is invisible in the app: calls still signal (peer name
// appears) but no video ever arrives. Run: npx ts-node src/scripts/checkTurn.ts
const dgram_1 = __importDefault(require("dgram"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const MAGIC_COOKIE = 0x2112a442;
const ALLOCATE_REQUEST = 0x0003;
const ALLOCATE_ERROR = 0x0113;
const ATTR_ERROR_CODE = 0x0009;
const ATTR_REALM = 0x0014;
function attribute(type, value) {
    const padding = (4 - (value.length % 4)) % 4;
    const buf = Buffer.alloc(4 + value.length + padding);
    buf.writeUInt16BE(type, 0);
    buf.writeUInt16BE(value.length, 2);
    value.copy(buf, 4);
    return buf;
}
function allocateRequest() {
    // REQUESTED-TRANSPORT = UDP (17)
    const body = attribute(0x0019, Buffer.from([17, 0, 0, 0]));
    const header = Buffer.alloc(20);
    header.writeUInt16BE(ALLOCATE_REQUEST, 0);
    header.writeUInt16BE(body.length, 2);
    header.writeUInt32BE(MAGIC_COOKIE, 4);
    crypto_1.default.randomBytes(12).copy(header, 8);
    return Buffer.concat([header, body]);
}
// An unauthenticated Allocate must be answered with 401 + a realm. Silence means
// nothing is listening, so the server is useless as a relay.
function probe(host, port) {
    return new Promise((resolve) => {
        const socket = dgram_1.default.createSocket('udp4');
        const timer = setTimeout(() => {
            socket.close();
            resolve('NO RESPONSE — server is not answering, media will not relay');
        }, 4000);
        socket.on('message', (msg) => {
            clearTimeout(timer);
            socket.close();
            let code = null;
            let realm = null;
            let offset = 20;
            const end = 20 + msg.readUInt16BE(2);
            while (offset < end) {
                const type = msg.readUInt16BE(offset);
                const length = msg.readUInt16BE(offset + 2);
                const value = msg.subarray(offset + 4, offset + 4 + length);
                if (type === ATTR_ERROR_CODE)
                    code = value.readUInt8(2) * 100 + value.readUInt8(3);
                if (type === ATTR_REALM)
                    realm = value.toString();
                offset += 4 + length + ((4 - (length % 4)) % 4);
            }
            const alive = msg.readUInt16BE(0) === ALLOCATE_ERROR && code === 401;
            resolve(alive ? `OK — TURN alive (401 challenge, realm "${realm}")` : `unexpected reply (error ${code})`);
        });
        socket.on('error', (err) => {
            clearTimeout(timer);
            resolve(`socket error: ${err.message}`);
        });
        socket.send(allocateRequest(), port, host);
    });
}
async function main() {
    const urls = env_1.ENV.TURN_URLS
        ? env_1.ENV.TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean)
        : [];
    if (!urls.length) {
        console.log(env_1.ENV.TURN_KEY_ID
            ? 'Using Cloudflare TURN — check GET /api/webrtc/ice returns turn: urls instead.'
            : 'No TURN configured. Calls will be black-screen for anyone behind symmetric NAT.');
        return;
    }
    for (const url of urls) {
        const [host = '', port] = (url.replace(/^turns?:/, '').split('?')[0] ?? '').split(':');
        console.log(`${url}: ${await probe(host, Number(port) || 3478)}`);
    }
}
main().catch(console.error);
//# sourceMappingURL=checkTurn.js.map