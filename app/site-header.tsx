import { Fragment, type ReactNode } from "react";

type SiteHeaderProps = {
  currentPage: "gallery" | "about" | "blog";
  galleryControl?: ReactNode;
  isInert?: boolean;
};

const pages = [
  { id: "gallery", href: "/", label: "gallery" },
  { id: "about", href: "/about", label: "about" },
  { id: "blog", href: "/blog", label: "blog" },
] as const;

export function SiteHeader({
  currentPage,
  galleryControl,
  isInert = false,
}: SiteHeaderProps) {
  return (
    <header
      className={`site-header site-header--${currentPage}`}
      inert={isInert}
    >
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
        {pages.map((page) => {
          if (
            page.id === "gallery" &&
            currentPage === "gallery" &&
            galleryControl
          ) {
            return <Fragment key={page.id}>{galleryControl}</Fragment>;
          }

          return (
            <a
              aria-current={page.id === currentPage ? "page" : undefined}
              className="route-link"
              href={page.href}
              key={page.id}
            >
              {page.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
