# PowerPlace Web

A minimalist mental health web app: diary, notes, planner, focus timer, and a supportive AI assistant.

## Dev
- npm install
- npm run dev

## Deploy (Vercel)
- Install Vercel CLI: `npm i -g vercel`
- From `web/`: `vercel` (first time), then `vercel --prod`
- Set secret: `vercel env add OPENAI_API_KEY` (optional; AI will stub if empty)

Serverless function: `api/chat.ts` proxies to OpenAI with your server-side key.
