export default function RootPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>OneAtlas API</h1>
      <p style={{ color: "#666", marginTop: "1rem" }}>
        The API is successfully running on Cloudflare Edge!
      </p>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>
        Navigate to <code>/api/*</code> to access the endpoints.
      </p>
    </div>
  );
}
