import type { ReactNode } from "react";

type SiteHeaderProps = {
  currentPage: "gallery" | "about";
  galleryControl?: ReactNode;
};

export function SiteHeader({ currentPage, galleryControl }: SiteHeaderProps) {
  const isAbout = currentPage === "about";

  return (
    <header className="site-header">
      <a className="signature-slot" href="/" aria-label="Hannah Gao — home">
        <img
          src="/signature.png"
          alt=""
          width="1536"
          height="1024"
          decoding="async"
        />
      </a>
      <nav className="site-navigation" aria-label="Main navigation">
        {galleryControl}
        <a
          className="route-link"
          href={isAbout ? "/" : "/about"}
          aria-label={isAbout ? "Gallery" : "About"}
        >
          {isAbout ? "gallery" : "about"}
        </a>
      </nav>
    </header>
  );
}
