import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../components/AuthProvider";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#F7F6F3", fontFamily: "var(--sans)" }}>

      {/* ── Nav ─────────────────────────────────────── */}
      <header style={{ borderBottom: "1px solid #E4E2DC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A1917", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 13 }}>
              2U
            </div>
            <span style={{ fontFamily: "var(--serif)", fontSize: 17, color: "#1A1917" }}>2U Postal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <Link to="/app" className="btn btn-primary btn-sm">Open Mailbox</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "96px 32px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", color: "#8A8784", border: "1px solid #E4E2DC", borderRadius: 999, padding: "5px 16px", marginBottom: 36 }}>
          Time-Capsule Letters
        </div>

        <h1 style={{ fontFamily: "var(--serif)", fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 400, lineHeight: 1.1, color: "#1A1917", marginBottom: 24, letterSpacing: "-0.015em" }}>
          Write a letter to<br />
          <span style={{ fontStyle: "italic", color: "#8A8784" }}>your future self</span>
        </h1>

        <p style={{ fontSize: 17, color: "#4A4844", lineHeight: 1.75, maxWidth: 520, margin: "0 auto 44px", fontWeight: 300 }}>
          Compose a heartfelt message today. Choose when to open it — six months, a year, or a decade from now.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: "13px 28px", fontSize: 15 }}>
            Write your first letter
          </Link>
          <Link to="/login" className="btn btn-secondary" style={{ padding: "13px 28px", fontSize: 15 }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ borderTop: "1px solid #E4E2DC" }} />
      </div>

      {/* ── Features ─────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, background: "#E4E2DC", border: "1px solid #E4E2DC", borderRadius: 12, overflow: "hidden" }}>
          {[
            { icon: "✒", title: "Typed or handwritten", body: "Write in our distraction-free studio, or upload a photo of your handwritten letter." },
            { icon: "⏳", title: "Custom time capsules", body: "Set delivery for 6 months, 1 year, 5 years — or any exact date you choose." },
            { icon: "🔒", title: "Sealed & private", body: "Letters stay locked until their delivery date, with a live countdown showing time remaining." },
          ].map(f => (
            <div key={f.title} style={{ background: "#FFFFFF", padding: "40px 36px" }}>
              <div style={{ fontSize: 22, marginBottom: 18, opacity: 0.6 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 400, marginBottom: 10, color: "#1A1917" }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "#4A4844", lineHeight: 1.65, fontWeight: 300 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────── */}
      <section style={{ background: "#FFFFFF", borderTop: "1px solid #E4E2DC", borderBottom: "1px solid #E4E2DC" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 32px" }}>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1.5px", color: "#8A8784", marginBottom: 48 }}>
            How it works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
            {[
              { n: "01", title: "Compose", body: "Write your message in our minimal editor. Pour your thoughts, hopes, and dreams onto the page." },
              { n: "02", title: "Seal", body: "Pick a future delivery date. Your letter is locked away until that exact moment." },
              { n: "03", title: "Rediscover", body: "When the day arrives, open your letter and meet the person you once were." },
            ].map(s => (
              <div key={s.n}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 13, color: "#B8B5B0", marginBottom: 20, letterSpacing: "0.05em" }}>{s.n}</div>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, marginBottom: 12, color: "#1A1917" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#4A4844", lineHeight: 1.65, fontWeight: 300 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400, color: "#1A1917", marginBottom: 20, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
          What would you tell<br />
          <span style={{ fontStyle: "italic", color: "#8A8784" }}>yourself in 5 years?</span>
        </h2>
        <p style={{ fontSize: 15, color: "#4A4844", marginBottom: 36, fontWeight: 300 }}>
          Start writing. Your future self is waiting.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: 15 }}>
          Begin writing →
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E4E2DC", padding: "28px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#B8B5B0" }}>
          © {new Date().getFullYear()} 2U Postal · Letters to Your Future Self
        </p>
      </footer>

    </div>
  );
}
