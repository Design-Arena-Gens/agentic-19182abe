# Grok Playground

A polished Next.js web application that lets you chat with xAI's Grok model. It provides a rich, responsive UI, server-side proxying for your Grok API key, and temperature controls for creative exploration.

## Requirements

- Node.js 18+
- npm 9+
- A Grok API key from [xAI](https://x.ai)

Create a `.env.local` file with the following secrets before running the app locally or deploying:

```bash
GROK_API_KEY=your-xai-api-key
# Optional overrides
GROK_MODEL=grok-beta
GROK_SYSTEM_PROMPT=You are Grok, xAI's conversational assistant...
```

## Local Development

Install dependencies and launch the dev server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
npm run start
```

## Testing

This project uses ESLint for static analysis:

```bash
npm run lint
```

## Deployment

The project is optimised for Vercel. Ensure the production environment contains the same Grok environment variables. Then deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-19182abe
```

After deployment finishes, verify the site:

```bash
curl https://agentic-19182abe.vercel.app
```

Enjoy chatting with Grok! :rocket:
