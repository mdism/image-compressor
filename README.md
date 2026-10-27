# Image Compressor

Shrink JPG, PNG and WebP images in your browser. Pick a quality, an optional max width and an output format, then download one file or all of them as a zip.

**Live:** https://img.shaikhismail.com · part of the [free tools](https://shaikhismail.com/tools/) by [Mohammed Ismail Shaikh](https://shaikhismail.com)

- 100% client-side: files and numbers never leave your browser
- Nothing is uploaded, saved or tracked; no cookies, analytics or third-party scripts
- No build step, no server, no cost to host
- Works on phones, light and dark theme

## Run locally

Open `public/index.html` in a browser, or serve the folder:

```
cd public
python -m http.server 8080
```

Then visit http://localhost:8080.

## Project layout

```
public/                 Everything that gets published
├── index.html          The page
├── privacy.html        Privacy policy
├── .htaccess           HTTPS, security headers, bot blocking
├── robots.txt, sitemap.xml, .well-known/security.txt
└── assets/
    ├── fonts/          JetBrains Mono, self-hosted (OFL)
    ├── css/tool.css    Shared look (same tokens as shaikhismail.com)
    ├── js/common.js    Theme toggle, drop zone, download helpers
    ├── js/app.js       The tool's logic
    └── vendor/         Third-party libraries, saved locally (no CDN)
.cpanel.yml             Tells cPanel to copy only public/ to the subdomain
```

Third-party libraries: [fflate](https://github.com/101arrowz/fflate) 0.8.2 (MIT) for the zip download

## Privacy and security

Nothing is uploaded, saved or tracked: see [PRIVACY.md](PRIVACY.md) (also published as `privacy.html`) and [SECURITY.md](SECURITY.md).

`public/.htaccess` adds the security headers, forces HTTPS and blocks spam bots and scanners. Optional, also free: put the domain behind [Cloudflare](https://www.cloudflare.com/plans/free/) (change the nameservers at your registrar, keep "Proxied" on for each subdomain, turn on *Bot Fight Mode* and *Always Use HTTPS*). That hides the hosting server and absorbs bot floods before they reach MilesWeb.

## Deploy on MilesWeb (cPanel)

One-time setup:

1. cPanel → **Domains** → Create a new domain → `img.shaikhismail.com`. Untick "Share document root" and set the document root to `img.shaikhismail.com` (that is `/home/qyotupjl/img.shaikhismail.com`). If you pick a different folder, update `DEPLOYPATH` in `.cpanel.yml`.
2. cPanel → **SSL/TLS Status** → Run AutoSSL so the subdomain gets a free certificate.
3. cPanel → **Git Version Control** → Create → Clone a Repository:
   - Clone URL: `https://github.com/mdism/tool-image-compressor.git`
   - Repository path: `repositories/tool-image-compressor`

Each update: push to GitHub, then cPanel → Git Version Control → Manage → **Pull or Deploy** → *Update from Remote*, then *Deploy HEAD Commit*.

Finally set this tool to `status: "live"` in the TOOLS list at the bottom of `site/tools/index.html` in the [mdism/mdism](https://github.com/mdism/mdism) repo.

## License

MIT, see [LICENSE](LICENSE).
