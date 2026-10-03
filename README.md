# Echo Run

Grab the orb. The route you took to reach it comes back as an echo that keeps repeating. Touch any echo and the run is over.

```sh
npm install
npm run dev      # play at http://localhost:5173
npm test
npm run build    # outputs dist/
```

## Deploying

`npm run build` produces a static `dist/` folder with relative asset paths, so it runs from any static host:

- **itch.io:** zip the contents of `dist/` (not the folder itself), upload it as an HTML game, and tick "This file will be played in the browser".
- **GitHub Pages:** push `dist/` to a `gh-pages` branch, or point Pages at a workflow that runs `npm ci && npm run build`.
- **Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, output directory `dist`.

See `SPEC.md` for the rules and `AGENTS.md` for the code layout.
