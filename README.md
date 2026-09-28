# The Ink & Antler

Pixel-art portfolio of Michał Kulijewicz, Writer. Built for a Larian Studios application.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

- Copy: `src/content/copy.ts` (dialogue, UI strings, contact) and `src/content/documents.ts` (CV and letter, currently placeholders).
- Positions in the scene: `src/world/layout.ts`.
- Re-export art after editing `/sprites`: `npm run assets`.
- Replay the intro: "Begin anew" (top right) or clear the site's local storage.

## Deploy (Vercel)

Import the repo in Vercel. The Vite preset is detected automatically (build `npm run build`, output `dist`). `vercel.json` sets long cache headers for hashed assets.
