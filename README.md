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
- **GitHub Pages:** `.github/workflows/deploy.yml` tests, builds, and deploys every push to `main` to https://eckorog2005.github.io/echo-run/. One-time setup: Settings → Pages → Source: "GitHub Actions" (or `gh api -X POST repos/<owner>/echo-run/pages -f build_type=workflow`).
- **Netlify / Vercel / Cloudflare Pages:** build command `npm run build`, output directory `dist`.

See `SPEC.md` for the rules and `AGENTS.md` for the code layout.
