# Attic

A warm, multilingual static reading site for StoryForge publications. The UI discovers titles,
release units, translations, and reader navigation from versioned JSON in `public/data/`.

## Refresh publication data

From the StoryForge repository root:

```powershell
.\.venv\Scripts\python.exe scripts\publication.py build --all --site-dir site
```

The builder includes only the `publication.approved_through` range of enabled projects. It owns only
files listed in `public/data/publication-manifest.v1.json`; it does not run Git or delete handwritten
site assets. Canonical artwork selected in project configuration is staged to ignored `public/media/`
for local preview and recorded separately in the same manifest.

## Develop and verify

```powershell
npm install
npm run dev
npm test
```

Set `NEXT_PUBLIC_SITE_URL` to the public origin before a production build so Open Graph image URLs
are absolute. Set `NEXT_PUBLIC_ASSET_BASE_URL` to the image CDN origin in production; when omitted,
the local `/media` staging directory is used. The site requires Node.js 22.13 or newer.

The build is a static export. Every language, title, episode, and chapter is pre-rendered at a
shareable path. Optional collection and item slugs from `project.yml` produce human-readable paths;
canonical address components are the stable fallback.

## Production deployment

The website is deployed from `main` by `.github/workflows/deploy-pages.yml`. GitHub Actions builds
the static export in `dist/client` and publishes it to GitHub Pages with the custom hostname
`attic.wladyspb.pro`. The workflow sets `NEXT_PUBLIC_ASSET_BASE_URL=https://media.wladyspb.pro`, so
the website repository contains image URLs but not the image files themselves.

Artwork is deployed independently to the Cloudflare Pages Direct Upload project `attic-media`.
After authenticating once with `npx wrangler login`, upload the current ignored media tree with:

```powershell
npm run deploy:media
```

The media project uses `media.wladyspb.pro`; external authoritative DNS needs only a CNAME from that
hostname to `attic-media.pages.dev`. Do not move the `wladyspb.pro` zone or change unrelated records.

The earlier Worker configuration in `wrangler.jsonc` remains available as a preview/fallback and is
not part of the GitHub Pages production path.

## Language behavior

- Catalog languages are the union of languages found in generated content.
- A title missing the selected catalog language remains visible but disabled.
- Inside the reader, the language selector contains only translations of the current release unit.
- Website hierarchy is controlled by each project's optional `publication.website.hierarchy` block.
