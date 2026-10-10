# hannah-studio

The artwork portfolio served at [hannahgao.studio](https://hannahgao.studio).

## Update the gallery

1. Add an optimized image to `public/artwork/`.
2. Add its entry to `app/artworks.ts`, including `title`, `width`, `height`,
   `medium`, and `year`. Width and height are physical dimensions in inches.
   Set both dimensions to `null` when they should not be displayed.
3. Add the source to a section in `GALLERY_SECTIONS` in
   `app/gallery-sections.ts` to set its exhibition and grid order. Add its pixel
   dimensions to `EDITORIAL_IMAGE_SIZES` and an optimized preview to
   `GRID_PREVIEWS` in `app/gallery-explorer.tsx`. Works outside the named sections
   remain available at the end of the grid.
4. Push `main` to deploy through Cloudflare.

On mobile screens, **grid** opens a compact two-column overview. On
laptop-sized screens, **gallery** opens five exhibition sections using these
physical dimensions, with a salon arrangement for **cats, sketches**. The
Stanford studio photograph has a display size without physical dimensions.
Hover or focus the bars at the lower right to preview an artwork, then select
one to move to its section and reveal its title. Scroll horizontally or
vertically, or use the gallery's arrow keys, to move between sections. The
active section has a darker label. Thin SVG bars draw upward on hover,
then reset when selected. Within the bar, arrow keys preview artworks and
Enter selects one. Clicking elsewhere or hovering another painting dismisses
the selected caption. Click the artwork itself to open focus mode. Reduced
motion disables transitions.

## Update the personal site

- Edit the bio in `app/about/page.tsx`.
- The artwork with `placement: "about"` in `app/artworks.ts` is the About hero.
- Replace `public/signature.svg` to update the signature shown in the header.

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
