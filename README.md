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

## Cloudflare deployment

The site is configured as a Cloudflare Worker with Static Assets in `wrangler.jsonc`. A production
build publishes `dist/client`; unmatched routes use the generated `404.html` instead of an SPA
fallback, and extensionless chapter URLs are canonicalized without a trailing slash.

For Workers Builds, connect the GitHub repository and use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production branch: `main`

Set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ASSET_BASE_URL` as build environment variables after the
public site and media hostnames are chosen. The website hostname is attached as a Worker Custom
Domain. The media hostname points to a public R2 bucket; production should not use the rate-limited
`r2.dev` development URL.

## Language behavior

- Catalog languages are the union of languages found in generated content.
- A title missing the selected catalog language remains visible but disabled.
- Inside the reader, the language selector contains only translations of the current release unit.
- Website hierarchy is controlled by each project's optional `publication.website.hierarchy` block.
