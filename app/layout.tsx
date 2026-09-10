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
        url: "/artwork/studio-pic.jpg",
        width: 2000,
        height: 1500,
        alt: "Hannah Gao painting in her home studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hannah gao ✶",
    description: "Paintings and works by Hannah Gao.",
    images: ["/artwork/studio-pic.jpg"],
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
