import axios from "axios";
import { useState } from "react";
import "./App.css";

// Read your key from .env (VITE_HAM_API_KEY=...)
const apiKey = import.meta.env.VITE_HAM_API_KEY;

function App() {
  // The currently displayed artwork fields
  const [inputs, setInputs] = useState({
    Title: "",
    Artist: "",
    Culture: "",
    Century: "",
    Date: "",
    Medium: "",
    Image: "",
  });

  // Ban list (use Sets for uniqueness + fast checks)
  const [bans, setBans] = useState({
    Artist: new Set(),
    Culture: new Set(),
    Century: new Set(),
  });

  // Loading + error UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helpers
  const safe = (s) => (s && String(s).trim()) || "N/A";
  const artistOf = (r) => safe(r?.people?.[0]?.name);

  const addBan = (attr, value) => {
    if (!value || value === "N/A") return;
    setBans((prev) => ({ ...prev, [attr]: new Set(prev[attr]).add(value) }));
  };

  const removeBan = (attr, value) => {
    setBans((prev) => {
      const next = new Set(prev[attr]);
      next.delete(value);
      return { ...prev, [attr]: next };
    });
  };

  // Core: fetch a batch, filter by bans, pick one, display
  const fetchArtwork = async () => {
    if (!apiKey) {
      alert("Missing API key. Add VITE_HAM_API_KEY to your .env and restart.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const url = `https://api.harvardartmuseums.org/object?apikey=${apiKey}&hasimage=1&size=50`;
      const response = await axios.get(url);
      const artworks = response?.data?.records || [];

      const eligible = artworks.filter((r) => {
        const a = artistOf(r);
        const cu = safe(r?.culture);
        const ce = safe(r?.century);
        if (bans.Artist.has(a)) return false;
        if (bans.Culture.has(cu)) return false;
        if (bans.Century.has(ce)) return false;
        return true;
      });

      if (eligible.length === 0) {
        setError("Nothing found that avoids your ban list. Try clearing some bans.");
        return;
      }

      const pick = eligible[Math.floor(Math.random() * eligible.length)];

      setInputs({
        Title: pick.title || "N/A",
        Artist: artistOf(pick),
        Culture: safe(pick.culture),
        Century: safe(pick.century),
        Date: pick.dated || "N/A",
        Medium: pick.medium || "N/A",
        Image: pick.primaryimageurl || "",
      });
    } catch (err) {
      console.error("Error fetching artwork:", err);
      setError("Couldn’t fetch artwork—try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Venci Venci</h1>
          <p>
            Click <strong>Artist</strong>, <strong>Culture</strong>, or <strong>Century</strong> to ban it.
            Discover avoids your bans.
          </p>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" onClick={fetchArtwork} disabled={loading}>
            {loading ? "Loading…" : "🔀 Discover"}
          </button>
          <button
            className="btn"
            onClick={() => setBans({ Artist: new Set(), Culture: new Set(), Century: new Set() })}
          >
            🚫 Clear Bans
          </button>
        </div>
      </header>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        {/* Viewer */}
        <section className="glass panel">
          <div className="head"><strong>Now Viewing</strong></div>
          <div className="body viewer">
            <div className="imagebox">
              {inputs.Image ? (
                <img src={inputs.Image} alt={inputs.Title || "Artwork"} />
              ) : (
                <div className="placeholder">No image yet</div>
              )}
            </div>
            <div className="fields">
              <KV k="Title" v={<span className="strong">{inputs.Title || "—"}</span>} />
              <KVC k="Artist" v={inputs.Artist || "—"} onClick={() => addBan("Artist", inputs.Artist)} />
              <KVC k="Culture" v={inputs.Culture || "—"} onClick={() => addBan("Culture", inputs.Culture)} />
              <KVC k="Century" v={inputs.Century || "—"} onClick={() => addBan("Century", inputs.Century)} />
              <KV k="Date" v={inputs.Date || "—"} />
              <KV k="Medium" v={inputs.Medium || "—"} />
            </div>
          </div>
        </section>

        {/* Ban list */}
        <section className="glass panel ban-panel">
          <div className="head">
            <strong>Ban List</strong>
            <span className="muted small">Click to remove</span>
          </div>
          <div className="chips">
            {[...bans.Artist].map((v) => (
              <Chip key={`Artist:${v}`} text={`Artist: ${v}`} onRemove={() => removeBan("Artist", v)} />
            ))}
            {[...bans.Culture].map((v) => (
              <Chip key={`Culture:${v}`} text={`Culture: ${v}`} onRemove={() => removeBan("Culture", v)} />
            ))}
            {[...bans.Century].map((v) => (
              <Chip key={`Century:${v}`} text={`Century: ${v}`} onRemove={() => removeBan("Century", v)} />
            ))}
            {!bans.Artist.size && !bans.Culture.size && !bans.Century.size && (
              <span className="muted">No bans yet — click Artist/Culture/Century above to add</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* small presentational helpers */
function KV({ k, v }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}

function KVC({ k, v, onClick }) {
  return (
    <div className="kv">
      <div className="k">{k}</div>
      <div className="v">
        <span className="pill" onClick={onClick} title={`Ban this ${k.toLowerCase()}`}>
          {v}
        </span>
      </div>
    </div>
  );
}

function Chip({ text, onRemove }) {
  return (
    <button className="chip" onClick={onRemove} title="Remove from ban list">
      {text} <span className="x">×</span>
    </button>
  );
}

export default App;
