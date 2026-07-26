const images = [
  { src: "/artwork/01-fullsizerender-1.jpg", width: 1612, height: 2000 },
  { src: "/artwork/02-fullsizerender.jpg", width: 2000, height: 1457 },
  { src: "/artwork/03-img-0681.jpg", width: 1341, height: 2000 },
  { src: "/artwork/04-img-0736.jpg", width: 2000, height: 1999 },
  { src: "/artwork/05-img-0753.jpg", width: 1027, height: 2000 },
  { src: "/artwork/06-img-0769.jpg", width: 2000, height: 1978 },
  { src: "/artwork/07-img-0875.jpg", width: 1521, height: 2000 },
  { src: "/artwork/08-img-0912.jpg", width: 1506, height: 2000 },
  { src: "/artwork/09-img-0914.jpg", width: 2000, height: 1500 },
  { src: "/artwork/10-img-1296.jpg", width: 1996, height: 2000 },
  { src: "/artwork/11-img-1608.jpg", width: 2000, height: 1500 },
  { src: "/artwork/12-img-1856.jpg", width: 1589, height: 2000 },
  { src: "/artwork/13-img-2973.jpg", width: 2000, height: 1500 },
  { src: "/artwork/14-img-3633.jpg", width: 2000, height: 1988 },
  { src: "/artwork/15-img-5690.jpg", width: 2000, height: 1500 },
  { src: "/artwork/16-img-5950.jpg", width: 1984, height: 2000 },
  { src: "/artwork/17-img-5978.jpg", width: 1399, height: 2000 },
  { src: "/artwork/18-img-7180.jpg", width: 2000, height: 1500 },
  { src: "/artwork/19-img-7452.jpg", width: 1526, height: 2000 },
  { src: "/artwork/20-img-7454.jpg", width: 990, height: 2000 },
  { src: "/artwork/21-img-7458.jpg", width: 1572, height: 2000 },
  { src: "/artwork/22-img-7459.jpg", width: 2000, height: 1933 },
  { src: "/artwork/23-img-7464.jpg", width: 1321, height: 2000 },
  { src: "/artwork/24-img-7467.jpg", width: 1500, height: 2000 },
  { src: "/artwork/25-img-7469.jpg", width: 2000, height: 1984 },
  { src: "/artwork/26-img-7694.jpg", width: 2000, height: 1977 },
  { src: "/artwork/27-img-9399.jpg", width: 2000, height: 1416 },
  { src: "/artwork/28-oasis.jpg", width: 1500, height: 2000 },
  { src: "/artwork/29-the-walls-we-build.jpg", width: 1970, height: 2000 },
];

export default function Home() {
  return (
    <main className="gallery">
      {images.map((image, index) => (
        <figure className="artwork" key={image.src}>
          <img
            src={image.src}
            alt={`Artwork ${index + 1} by Hannah Gao`}
            width={image.width}
            height={image.height}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
          />
        </figure>
      ))}
    </main>
  );
}
