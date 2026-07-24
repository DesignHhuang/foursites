# Four Sites Local Mirror

This folder contains local static mirrors of these Cloudflare Pages sites:

- `air-condition` from `https://air-condition.pages.dev/`
- `oled-tv` from `https://oled-tv.pages.dev/`
- `wn5-console` from `https://wn5-console.pages.dev/`
- `domino-pitch` from `https://domino-pitch.pages.dev/`

The public sites expose built static front-end source: HTML, CSS, JavaScript modules, vendor modules, and any runtime assets loaded by the browser. Original development history, unpublished source files, and build configuration cannot be recovered from a deployed static site unless they were published with it.

## Start Locally

Start all four sites:

```powershell
npm.cmd run serve
```

Then open:

- http://127.0.0.1:4173/ for `air-condition`
- http://127.0.0.1:4174/ for `oled-tv`
- http://127.0.0.1:4175/ for `wn5-console`
- http://127.0.0.1:4176/ for `domino-pitch`

Start one site:

```powershell
npm.cmd run serve:air-condition
npm.cmd run serve:oled-tv
npm.cmd run serve:wn5-console
npm.cmd run serve:domino-pitch
```

## Verify

```powershell
npm.cmd run verify
```

## Refresh The Mirror

```powershell
npm.cmd run download
```

The downloader uses local Chrome or Edge through Playwright. The mirrored sites themselves do not need Playwright to run.
