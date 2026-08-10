# hannah-studio

The artwork portfolio served at [hannahgao.studio](https://hannahgao.studio).

## Update the gallery

1. Add an optimized image to `public/artwork/`.
2. Add its entry to `app/artworks.ts`, including `title`, `width`, `height`,
   `medium`, and `year`. Width and height are physical dimensions in inches.
   Set both dimensions to `null` when they should not be displayed.
3. The gallery sorts years newest-to-oldest automatically. Move entries to
   rearrange works within the same year, or comment out an object to hide it.
   Add an optional `displayScale` such as `0.8` to render an image smaller
   without changing its physical dimensions.
4. Push `main` to deploy through Cloudflare.

On laptop-sized screens, **to scale** opens a relative-scale overview using
these physical dimensions. Works without both dimensions stay in the standard
gallery and are omitted from the scale view.

## Update the personal site

- Edit the bio in `app/about/page.tsx`.
- The artwork with `placement: "about"` in `app/artworks.ts` is the About hero.
- Replace `public/signature.png` to update the signature shown in the header.

## Work locally

```bash
npm install
npm run dev
```

Requires Node.js 22.13 or newer. The local site runs at
`http://localhost:3000`.

```bash
npm test
```
