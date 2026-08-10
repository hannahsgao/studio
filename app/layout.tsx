import "./globals.css";

export const metadata = {
  title: "hannah gao ✶",
  description: "Paintings and works by Hannah Gao.",
  metadataBase: new URL("https://hannahgao.studio"),
  openGraph: {
    title: "hannah gao ✶",
    description: "Paintings and works by Hannah Gao.",
    type: "website",
    url: "https://hannahgao.studio",
    images: [
      {
        url: "/og.png",
        width: 1732,
        height: 908,
        alt: "Hannah Gao — paintings shown at relative scale",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hannah gao ✶",
    description: "Paintings and works by Hannah Gao.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
