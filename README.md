# Kim Maturan — Portfolio

An Astro portfolio built from the approved monochrome design. Includes the transparent halftone hero portrait, a 2.8-second intro, pointer parallax, an interactive 3D knot, eight linked sections, and the HELLO WORLD brick-breaker after Certifications.

## Run on your computer

1. Install Node.js 24 LTS (this project was built with Node 24.19.0).
2. Extract this ZIP. Open the `kim-portfolio` folder in VS Code.
3. Open **Terminal → New Terminal**, then run:

```sh
npm ci
npm run dev
```

4. Open the local address printed in the terminal, normally `http://localhost:4321`.
5. Keep the terminal open while editing. Press Ctrl+C to stop.

You do not need Docker, XAMPP, a database, or an API key.

## Project structure

- `src/data/portfolio.ts`: profile, project descriptions and links, experience, certificate, toolkit, creative gallery.
- `src/components/`: each page section in its own Astro component.
- `src/styles/portfolio.css`: styling preserved from the approved design.
- `src/styles/site.css`: standalone page and responsive refinements.
- `src/scripts/intro.js`: opening animation, session storage, replay, skip, reduced motion.
- `src/scripts/hero-motion.js`: portrait parallax, 3D knot projection, scroll reveals.
- `src/scripts/game-engine.js`: brick-breaker physics and state.
- `src/scripts/game.js`: canvas rendering and mouse, touch, keyboard, pause/reset controls.
- `public/images/`: approved hero cutout and About portrait, plus your future images.
- `tests/game.test.mjs`: behavior checks for the game.
- `dist/`: included production build, ready for static hosting.

## Add your remaining content

Edit `src/data/portfolio.ts`. Save to update the local preview.

### Project screenshots and links

Put screenshots in `public/images/projects/`, then update the matching project:

```ts
images: [
  { src: '/images/projects/walangbrownout-dashboard.webp', alt: 'WalangBrownout dashboard', caption: 'Dashboard overview' },
  { src: '/images/projects/walangbrownout-inventory.webp', alt: 'WalangBrownout inventory', caption: 'Inventory management' },
],
liveUrl: 'https://your-real-project-url',
codeUrl: 'https://github.com/your-account/your-repository',
contribution: 'Describe what you personally designed or implemented.',
```

Leave unknown links as `null`: they will not render as buttons. Screenshots use labeled placeholders until supplied. The WalangBrownout source URL is already included; verify external destinations before public launch.

### Experience

Fill in `dates` and `description`. Blank dates, organization names, and descriptions stay hidden. Rename KNR Collectives here when your company name is final.

### Certificate

The supplied title is **AWS AI Practitioner Challenge**, dated June 23, 2026. It is not relabeled as an AWS professional certification. Fill in the issuer exactly as printed on your certificate, then add:

```ts
verificationUrl: 'https://your-actual-verification-link',
```

### Résumé

Place the PDF at `public/resume.pdf`, and change `profile.resume` from `null` to `'/resume.pdf'`. The download link appears automatically.

### Photography

Edit each `creative` entry's `image`, `title`, descriptive `alt`, and natural `width`/`height` in `src/data/portfolio.ts`. The existing Canva photography portfolio link is already connected.

## Behavior

- Intro runs once per tab session and can be replayed from the footer. Direct section links skip it. Storage-disabled browsers remain usable.
- Reduced-motion preference skips the intro and pointer motion, and removes smooth scrolling.
- The knot is a projected 3D torus-knot mesh, rendered using Canvas. It moves with the pointer and is idle at rest.
- The game starts only after pressing Play. Move your mouse, drag while playing, or focus the paddle slider and use arrow keys. Arrow keys also work while a game button has focus.
- Three lives, score, pause/resume, reset, win and loss states are included. The game pauses when it leaves the viewport or the browser tab is hidden.
- The core portfolio is static HTML and remains readable without JavaScript. Interactive features require JavaScript.
- Contact uses email and public profile links. No message is sent automatically, and there is no contact-form server.

## Stack

Astro 7.4, TypeScript content models, custom CSS, local Lucide icons, browser Web Animations API, and Canvas. The approved effects are implemented directly; React, GSAP, and Three.js are not required by this version. No runtime CDN or remote font dependencies.

## Verify and build

```sh
npm run check
npm test
npm run build
npm run preview
```

The production output goes to `dist/`. `npm run preview` prints a local preview address. Do not double-click `dist/index.html`: serve it with the preview command so root-relative assets and modules work correctly.

## Deploy on Cloudflare Pages using GitHub

1. Create an empty GitHub repository, then push this project (not `node_modules`).
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**. Dashboard wording may vary.
3. Select the repository and your production branch, usually `main`.
4. Use these build settings:

| Setting | Value |
| --- | --- |
| Framework | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Root directory | Leave blank if package.json is at the repository root |
| Node version | `24.19.0` (set `NODE_VERSION` if needed) |

5. Deploy. Cloudflare assigns the available `*.pages.dev` address.
6. Set the `SITE_URL` build environment variable to that actual HTTPS address, then redeploy. This enables correct canonical and Open Graph URL metadata.
7. Future pushes rebuild the site. A custom domain is optional and separate from the free Pages subdomain.

No Cloudflare adapter is needed because this project builds static pages.

Official guide: https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/

Astro setup: https://docs.astro.build/en/install-and-setup/

## Deployment status and verification

This package has not been published to your Cloudflare account. A production build, Astro diagnostics, game behavior tests, and generated-output checks were run. Browser visual and interactive QA could not be run in this environment; check desktop and mobile in your browser before public launch.

Before launch, replace remaining placeholders, verify project links, check the intro and game on your phone, and test the résumé/certificate links after adding those files.

## Project screenshots

Edit `src/data/portfolio.ts`: each project's `images` array accepts up to two
`{ src, alt, caption }` entries. Put files in `public/images/projects/` (create
that directory), and use paths such as `/images/projects/walangbrownout-dashboard.webp`.
Use descriptive alt text and retain the original screenshot colors.

WalangBrownout has two labeled slots: **Dashboard overview** and **Inventory management**.
Replace their `src: null` values with your image paths. KNR NFC Cards and PinaCall
start with `images: []`; add one or two entries when screenshots are ready.
Every project has two screenshot slots; missing entries or null sources show labeled
placeholders without enlargement. Thumbnail buttons select images within that project.
Previous/Next project buttons, project-name selectors, arrow keys, and horizontal swipes
switch the complete project. The slides and selectors come from the `projects` array,
so adding a project includes it automatically. Inactive projects are inert and excluded
from keyboard navigation. Real screenshots open a modal with Escape/Close and focus
restoration. Nothing autoplays.


## Appearance and interaction preferences

The navbar provides light/dark and sound controls. Theme follows the system until
an explicit choice is saved in `localStorage` (`kim-theme`). Sound defaults to muted;
`kim-sound` remembers the choice. Local WAV playback starts only following a deliberate interaction.
Theme colors live in `src/styles/preferences.css`; Contact keeps its dark palette.
The progress line measures page scrolling. Reduced motion disables the circular reveal.

Certifications are link-only. Set `certifications[0].verificationUrl` in
`src/data/portfolio.ts` to your real certificate URL; null omits the link.
The favicon PNGs and Apple touch icon are derived from `public/images/about-halftone.jpg`,
with a face crop at x=160, y=85, width=390, height=450 and a pale outer border.
The original portrait is unchanged.


### Interaction sounds

`src/scripts/interaction-sounds.js` owns audio playback: click/navigation uses
`/sounds/thock-click.wav`, theme/project changes use `thock-switch.wav`, and image
selection/dialog closing use `thock-soft.wav`, at volume 0.35. Mouse hover uses
`thock-soft.wav` at 0.12 after audio is unlocked by a deliberate gesture. Hover has a
180ms global cooldown; clicks have an 80ms cooldown and replace the current effect.
Mute stops playback immediately. Development console warnings include the asset URL
when loading or playback fails. No sounds play automatically on page load.


### Connected galleries

All six screenshots are connected under `public/images/projects/`, with original
PNG colors and dimensions. Each project retains two screenshot selectors and its own
viewer. The photography collection uses `flower.jpg`, `kite.jpg`, and `withered.jpg`
from `public/images/photography/`. These original JPGs total approximately 644 KB;
no recompression was needed. Photos keep their complete natural framing, including
embedded white borders. All gallery images are lazy-loaded with reserved dimensions.
The photo viewer has Previous/Next, arrow keys, native Escape/Close, focus restoration,
and background-scroll locking. The short opening transition is skipped for reduced motion.


## Editorial motion

`src/styles/editorial.css` coordinates the showcase, asymmetric photo layout, and
stable-target link/button feedback. `hero-motion.js` leaves the portrait untouched:
it composes bounded name/knot `translate` with intro-owned `transform`, observes the
Skip control to gate movement, and reveals About once. Offscreen/hidden-tab work pauses.
`project-carousel.js` animates whole slides for 420ms in the requested direction,
including wraparound, cancels superseded effects, and prepares adjacent images as
Selected Work approaches the viewport. Screenshot selection updates the decorative,
inert rear image separately. Photo dialogs open with a 220ms fade/scale. Reduced motion
skips these effects; content is visible in its final state without waiting for animation.
No additional dependencies or sound handlers were added.
