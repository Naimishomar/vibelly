// STUN alone only works when at least one peer is directly reachable. Behind
// symmetric NAT or mobile CGNAT the call still signals (peer name appears) but
// no media ever arrives — a black remote video. TURN credentials come from the
// backend so they are short-lived and not baked into the client bundle.
const STUN: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// Mutated in place so synchronous `new RTCPeerConnection({ iceServers: ICE_SERVERS })`
// call sites pick up TURN without being rewritten as async.
export const ICE_SERVERS: RTCIceServer[] = [...STUN];

let pending: Promise<RTCIceServer[]> | null = null;

export function loadIceServers(): Promise<RTCIceServer[]> {
  if (!pending) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    pending = fetch(`${backendUrl}/api/webrtc/ice`)
      .then((res) => res.json())
      .then((data: { iceServers?: RTCIceServer[] }) => {
        if (data.iceServers?.length) ICE_SERVERS.splice(0, ICE_SERVERS.length, ...data.iceServers);
        return ICE_SERVERS;
      })
      .catch((err) => {
        console.warn('Could not load TURN servers, falling back to STUN only:', err);
        pending = null; // retry on the next call
        return ICE_SERVERS;
      });
  }
  return pending;
}

// Warm the config as soon as a calling page loads, before any match arrives.
void loadIceServers();
