import { ArtworkCaption } from "../artwork-caption";
import { artworks } from "../artworks";
import { SiteHeader } from "../site-header";

export const metadata = {
  title: "about — hannah gao ✶",
  description: "About Hannah Gao.",
};

const homeStudio = artworks.find((artwork) => artwork.placement === "about");

export default function AboutPage() {
  return (
    <>
      <SiteHeader currentPage="about" />
      <main className="about-page">
        <div className="about-content">
          {homeStudio && (
            <figure className="about-hero">
              <img
                src={homeStudio.src}
                alt={homeStudio.title}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={
                  homeStudio.displayScale
                    ? { width: `${homeStudio.displayScale * 100}%` }
                    : undefined
                }
              />
              <ArtworkCaption artwork={homeStudio} />
            </figure>
          )}
          <section className="about-copy" aria-label="About Hannah Gao">
            {/* Replace or extend this paragraph with your full bio. */}
            <p>hi! i'm hannah gao </p>
            <p>i'm a rising junior at stanford studying math and cs and a bit of art practice.</p>
            <p>--</p>
            <p>you can find some of my ramblings on <a href="https://x.com/@hannahgao">twitter</a> or <a href="https://substack.com/@hannahgao">substack</a>,</p>
            <p>or just email me at hannahgaoart@gmail.com.</p>

          </section>
        </div>
      </main>
    </>
  );
}
