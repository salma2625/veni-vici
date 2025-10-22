return (
    <div className="artwork-card">
      <h2>{artwork.title ? artwork.title : "  "}</h2>
      <p>{artwork.artist ? artwork.artist : "  "}</p>
      <p>{artwork.date ? artwork.date : "  "}</p>
      <p>{artwork.medium ? artwork.medium : "  "}</p>
      <img src={artwork.image ? artwork.image : "  "} alt={artwork.title ? artwork.title : "  "} />
    </div>
)