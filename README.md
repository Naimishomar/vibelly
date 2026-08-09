# Vibelly — Free Random Video Chat

[![Vibelly](https://vibelly.fun/badge.svg)](https://vibelly.fun)

**Vibelly** is a free, anonymous [random video chat](https://vibelly.fun/random-video-chat)
platform — a modern alternative to Omegle (shut down 2023). Connect with strangers
instantly over HD video, voice, or text. No sign-up, no email, no app download.

> Try it live: **[https://vibelly.fun](https://vibelly.fun)**

## Features

- One-click matching with strangers worldwide (WebRTC, sub-second queue)
- [Talk to strangers](https://vibelly.fun/talk-to-strangers) — anonymous by default, no login
- HD video + voice + text modes in the browser
- AI moderation and one-tap reporting on every room
- Ephemeral conversations that leave no trace
- Gender / country filters with Vibelly Premium
- Group chat, live streaming, and creator subscriptions

## What is Vibelly?

Omegle shut down in November 2023. Vibelly is the safest, fastest, and most aesthetic
[Omegle alternative](https://vibelly.fun/omegle-alternative) on the internet: the same
one-click stranger chat magic, rebuilt on modern WebRTC with real moderation and real
privacy. Works on any phone or desktop browser — nothing to install.

## Embeddable live widget

Sites embed a live "people online now" counter that links straight back:

```html
<iframe src="https://vibelly.fun/embed.html" width="100%" height="300" style="border:0;border-radius:16px;overflow:hidden" loading="lazy" title="Vibelly - free random video chat"></iframe>
```

Grab badge/banner/link HTML at **[https://vibelly.fun/backlinks](https://vibelly.fun/backlinks)**.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind v4, Socket.IO client, PWA
- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose), Upstash Redis, WebRTC signaling
- **Deploy:** Frontend → Vercel (static prerender + sitemaps), Backend → Docker / EC2

## Development

```bash
# backend
cd backend && npm install && npm run dev

# frontend
cd frontend && npm install && npm run dev
```

## Links

- [Random video chat online](https://vibelly.fun/random-video-chat)
- [Talk to strangers online](https://vibelly.fun/talk-to-strangers)
- [Anonymous chat](https://vibelly.fun/anonymous-chat)
- [Chatroulette alternative](https://vibelly.fun/chatroulette-alternative)
- [OmeTV alternative](https://vibelly.fun/ometv-alternative)

## License

MIT
