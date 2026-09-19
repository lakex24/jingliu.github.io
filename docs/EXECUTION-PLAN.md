# Personal website — implementation handoff

Updated September 19, 2026. Jing has authorized implementation, to continue in a coding session on the Mac mini. This handoff does not deploy the website.

## Approved direction

Use **11C Photo Zine — Botanical Margins**, shown in [the desktop/mobile reference](design/11c-photo-zine-botanical.png). This supersedes earlier explorations. Four Doors (08) was rejected as overwhelming. Keep Photo Zine's photography and editorial layout, borrowing restrained side illustrations from Grand Index (09) and Aurora Diptych (10).

- Light lavender paper `#f4f0fa`; plum ink `#241a38`; violet `#7c4dff`; subtle teal `#12a897` and magenta `#c93fb2` aurora accents.
- Expressive serif headings, widely spaced JING LIU wordmark, quiet monospace details and readable body text. Choose an appropriately licensed font close to the reference; exact font selection remains an implementation choice.
- Desktop: central quote/poem, slender flowering stems and ferns at the sides, small mushrooms/fox detail, then four photographic navigation tiles in one row.
- Mobile: compact wordmark; prominent text navigation; comfortable quote reading width; photographic navigation in a 2×2 grid. Reduce illustrations to small corner accents. Never squeeze desktop side art into the text column.
- Natural grain and watercolor should be subtle. No emoji icons, crowded gardens, invented handwritten slogans, or dominant decorative scenery.
- The mockup is an art-direction reference, not a finished asset sheet or proof of responsive behavior. Rebuild with real semantic HTML, text, images and CSS; do not use the entire screenshot as the website.
- Light is the default. A light/dark toggle is welcome but secondary to completing the light design. Motion is optional; respect reduced-motion settings.

## Information architecture

Home is a warm, poetic welcome, with no résumé facts. Clicking the name returns home. Four prominent destinations, in this order:

1. **Startups** — public angel-investment portfolio and help/notes for entrepreneurs. No private deal data, invented investments or financial details.
2. **Career** — preserve the old site's professional introduction, news, roles, shipped features, publications, media and real contact links.
3. **Blogs** — article archive and individual article pages. Include Ai Self and the older grandfather, photography and TikTok referral posts.
4. **Goodies** — favorite books and movies. Do not invent Jing's recommendations.

Recommended routes: `/`, `/startups/`, `/career/`, `/blogs/`, `/blogs/<slug>/`, `/goodies/`. These routes are proposed implementation defaults, not deployed URLs.

## Central quote behavior

- Make the central quote/poem editable as a curated content collection, with text, optional title, author, source, stable ID and enabled status.
- Support optional random selection when someone visits. Recommended default: select once per browser session, retain it across internal navigation, and do not auto-rotate while someone is reading. This session policy is an implementation proposal; the user requested per-visit randomization.
- Keep author/source synchronized with the chosen text. Support short quotes and longer poems without cropping, unreadably small fonts or artwork overlap.
- Render a safe default without JavaScript; enhance with random selection and handle unavailable browser storage gracefully. Provide a sensible empty/one-entry fallback.
- Initial desired poem: **Make the Ordinary Come Alive**, William Martin, *The Parent's Tao Te Ching*. Do not retrieve or commit the full copyrighted poem. The user intends to supply licensed text. Use clearly labeled preview placeholders or approved public-domain material until supplied; decide the permitted delivery/storage of licensed text before launch.

## Repository and deployment facts

- Existing repository: `https://github.com/lakex24/jingliu.github.io` (public).
- Existing live domain: `https://jingliu.mind-pixels.com/`.
- Last checked hosting: GitHub Pages builds from `main`, repository root; `CNAME` contains the custom domain. Recheck current settings before release.
- Current production source is plain HTML/CSS/JS with Bootstrap. Base commit before this handoff: `2359b007fec7bac4420ad4ff60c7647e1a9e4b1c`.
- Laptop main checkout is on `feat/career-blog`. Another clean worktree exists on `feat/genlab-redesign`. Do not assume worktrees or local uncommitted files exist on the Mac mini.
- Local experimental files include `package.json`, `package-lock.json`, `content/posts/ai-self.md`, and `.gitignore` edits. They are unfinished and are NOT part of this handoff commit. The package points to missing `scripts/build.mjs`; no working redesign/build exists yet. Do not depend on those files or overwrite another session's changes.
- `images/profiles/jing-python.png` exists locally but is ignored. Check whether a production portrait asset is available from the existing site; recover or replace only with approved user imagery. Never fabricate a portrait.

## Implementation sequence

1. **Start safely.** Fetch the handoff branch, read this plan and inspect the image. Check repository status and current remote branches. Work on a new implementation branch. Inventory old content and local URLs before moving anything.
2. **Create a static publishing foundation.** Recommended: Astro with Markdown content collections and static output; an equivalent small static generator is acceptable. No database, accounts or CMS are required. Verify current framework docs and Node requirements, pin dependencies, and document build/preview commands. Preserve GitHub Pages compatibility and the custom domain. This stack is a recommendation, not an earlier user decision.
3. **Build the responsive homepage first.** Create shared type/color/spacing tokens, masthead, quote area, botanical margins and four photo links. Match 11C at desktop and narrow phone widths. Make all destinations real accessible links. Prepare the curated quote data/selection behavior. Show a local desktop/mobile preview before completing secondary page styling; continue independent content migration while feedback is pending.
4. **Prepare production artwork.** Generate or obtain separate approved botanical and photographic assets consistent with the reference. Optimize responsive images (WebP/AVIF where suitable), include dimensions, meaningful alt text for informative photos, and empty alt text for decoration. Keep text live and selectable. Avoid shipping the full reference board as a runtime asset.
5. **Migrate Career without losing content.** Move current professional content into `/career/`, retaining genuine descriptions and external links. Fix broken shared-script assumptions, missing images and empty links. Preserve the old `blog-ai-self.html` URL using a working static compatibility page/redirect. Handle old home anchors (`#roles`, `#features`, `#publication`, `#blogs`, `#contact`) so existing deep links reach the appropriate new page/section.
6. **Build Blogs and import writing.** Read the original sources and bring over article text and local media. Preserve language, dates and attribution. Store writing as Markdown with metadata. Build a chronological archive and readable individual pages, page titles/descriptions, canonical links, sitemap and RSS. Search/category filtering is optional, only if useful for the small archive.
7. **Build Startups and Goodies.** Implement the layouts and content models. If real content is missing, use honest empty states in preview; request only the actual investment/recommendation content needed to finish. Never populate personal claims from guesses.
8. **Verify and review.** Complete the checks below and provide working local/preview URLs plus desktop and mobile screenshots. Update the README with authoring and deployment instructions. Open a reviewable PR; get launch approval before merging to the publishing branch or deploying.

## Writing sources

- Current repo: `blog-ai-self.html` and `images/blog/aiself/analysis.jpeg`.
- Ai Self date conflict: article says April 2023; old homepage card says June 2024. Use the article's April 2023 as a provisional date, retain month-level precision and flag it for Jing to confirm. Preserve the unfinished original ending rather than inventing continuation.
- Older repo: `https://github.com/lakex24/lakex24.old-site`, branch `master`.
- Original Hugo Markdown sources: `mysite/content/blogs/grandpa-memory/index.md`, `mysite/content/blogs/photography-24-part1/index.md`, `mysite/content/blogs/job-referral-tiktok.md`.
- Inspect adjacent assets and Hugo shortcodes before conversion. Do not import template/example posts. Older employment/referral articles should retain their historical dates rather than imply present hiring status.

## Acceptance checks

- All four destinations, article pages and home links work, including direct refresh/deep links under GitHub Pages.
- Homepage matches the approved Photo Zine direction; no professional bio on home. Career content is preserved and all four requested articles are present.
- Test widths 360, 390, 430, 768, 1024 and 1440 px, portrait/landscape, and 200% zoom. No horizontal overflow, clipped headings, obscured text or overlapping art. Do not force the whole mobile page above the fold.
- Mobile links are easy to tap (target about 44×44 CSS px); headings wrap naturally; reading text is comfortably sized with generous line height. Test long titles and short/long quotes.
- Keyboard navigation, visible focus, logical heading order, skip link, alt text and text contrast work. Verify actual colors rather than assuming brand accents are suitable for small text.
- Quote selection works with zero/one/many entries, retains correct attribution, stays stable during reading and survives disabled storage/JavaScript gracefully.
- Check console errors, local links, image loading, video controls, generated metadata and a clean production build. Test at least Chromium and WebKit/iPhone emulation; actual iPhone Safari review if available.
- Optimize hero artwork, fonts and existing video; avoid autoplay/heavy initial downloads. Run an accessibility/performance audit and fix material issues.
- Generated mockup placeholder slogans/copy must not accidentally become final personal claims. No licensed poem text or private investment data committed to this public repository.
- Launch requires review of missing content, final public copy, old URL compatibility and deployment configuration. The live site remains unchanged until approved.

## Mac mini session starter

Read `docs/EXECUTION-PLAN.md` and `docs/design/11c-photo-zine-botanical.png` on branch `feat/career-blog` in `lakex24/jingliu.github.io`. Implement the approved Photo Zine with botanical margins, beginning with the desktop/mobile homepage. Keep the four destinations, updateable/randomizable quote, full Career migration and four original blog posts. Work on a fresh branch and deliver a local preview/PR; do not deploy to production without launch approval. Treat the plan's recommendations as implementation defaults and clearly flag missing personal content.
