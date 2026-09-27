import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, SignIn, UserButton } from "@clerk/react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <Link to="/" className="auth-logo-link" title="Return to Home">
          <div className="auth-brand">
            <div className="auth-seal-badge">2U</div>
            <div className="auth-brand-text">
              <span className="auth-brand-title">2U Postal</span>
              <span className="auth-brand-sub">Letters to your future self</span>
            </div>
          </div>
        </Link>

        {!isLoaded ? (
          <div className="auth-card auth-loading-card">
            <span className="spinner" />
            <p style={{ marginTop: 14, color: "var(--ink-3)", fontSize: 14 }}>
              Loading…
            </p>
          </div>
        ) : isSignedIn ? (
          <div className="auth-card auth-signed-in-card">
            <div className="auth-signed-in-stamp">✉</div>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Your vault is ready.</p>
            <div style={{ margin: "24px 0", display: "flex", justifyContent: "center" }}>
              <UserButton />
            </div>
            <Link to="/app" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Open Mailbox
            </Link>
          </div>
        ) : (
          <div className="auth-card auth-clerk-container">
            <SignIn
              routing="hash"
              signUpUrl="/register"
              fallbackRedirectUrl="/app"
              appearance={{
                elements: {
                  rootBox: { width: "100%" },
                  card: { width: "100%", boxShadow: "none", background: "transparent", padding: "8px 4px" },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
