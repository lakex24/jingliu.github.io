# jingliu.github.io

Source for [jingliu.mind-pixels.com](https://jingliu.mind-pixels.com) — a static
site built with [Astro](https://astro.build). Design direction: *11C Photo Zine —
Botanical Margins* (`docs/design/11c-photo-zine-botanical.png`); implementation
handoff in `docs/EXECUTION-PLAN.md`.

## Develop

    npm ci
    npm run dev        # http://localhost:4321, live reload
    npm run build      # static output in dist/
    npm run preview    # serve dist/ locally

Node ≥ 22. Dependencies are pinned in `package.json`.

## Authoring

| What | Where | Notes |
| --- | --- | --- |
| Blog post | `src/content/posts/<slug>/index.md` + images beside it | Frontmatter: `title`, `description`, `date`, `lang` (`en`/`zh`), optional `dateNote`, `historical`, `draft`. Relative images (`./photo.jpg`) are optimized at build. URL is `/blogs/<slug>/`. |
| Home quote / poem | `src/content/quotes/<id>.json` | `title?`, `author`, `source?`, `text` (use `\n` for line breaks), `enabled`, `default`. Exactly one entry should be `default: true` — it is what renders without JavaScript. With ≥2 enabled entries the page picks one at random per browser session and keeps it while you navigate. |
| Career content | `src/pages/career/index.astro` | News, roles, shipped features, publications, contact — plain arrays at the top of the file. Images in `src/assets/career/`. |
| Startups / Goodies | `src/pages/startups/index.astro`, `src/pages/goodies/index.astro` | Currently honest empty states. |
| Site strings & nav | `src/data/site.ts` | Items marked `PLACEHOLDER` are mockup copy awaiting confirmation. |
| Home tile photos | `src/assets/tiles/*.jpg` | 4:3 crops look best. |
| Design tokens | `src/styles/global.css` (`:root`) | Colors, fonts, spacing. |

Old URLs: `/blog-ai-self.html` redirects to `/blogs/ai-self/`; the old homepage
anchors (`/#roles`, `/#features`, `/#publication`, `/#blogs`, `/#contact`) are
forwarded by a small script on the home page.

## Deploy

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub
Actions**. The custom domain comes from `public/CNAME`.
