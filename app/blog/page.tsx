import { SiteHeader } from "../site-header";

export const metadata = {
  title: "blog — hannah gao ✶",
  description: "Essays by Hannah Gao.",
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader currentPage="blog" />
      <main className="blog-page">
        <section className="blog-content" aria-label="Blog posts">
          <h1 className="visually-hidden">Blog</h1>
          <ul className="blog-index-list" role="list">
            <li>
              <a href="/blog/new-frontiers">new frontiers</a>
              <time dateTime="2026-06-23">06.23.2026</time>
            </li>
            <li>
              <a href="/blog/thalassophilia">thalassophilia</a>
              <time dateTime="2025-12-18">12.18.2025</time>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
