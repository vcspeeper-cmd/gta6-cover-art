# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/vcspeeper-cmd/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/vcspeeper-cmd/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover turns your own photos and a caption into a GTA-style multi-panel poster: a neon sunset backdrop with
palms and a skyline, a hero panel plus a grid of smaller panels, bold caption lettering and an original badge,
exported as a PNG at 1080 x 1080, 1080 x 1350 or 1920 x 1080. It is a static, offline web app: no build step, no
network request, and the photos never leave the machine.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Pick one or several photos, type a caption, choose a colour grade and an export size, click a panel and drag to
pan or scroll to zoom its crop, then press **Export PNG**. `node main.ts` hands the app in: it copies `app/` and
`screenshots/` to `$MAKEFUN_OUTPUT_DIR` (or `/output`) and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
