import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, SignUp, UserButton } from "@clerk/react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
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
            <h2 className="auth-title">Account ready</h2>
            <p className="auth-subtitle">Your vault is active.</p>
            <div style={{ margin: "24px 0", display: "flex", justifyContent: "center" }}>
              <UserButton />
            </div>
            <Link to="/app" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
              Go to Mailbox
            </Link>
          </div>
        ) : (
          <div className="auth-card auth-clerk-container">
            <SignUp
              routing="hash"
              signInUrl="/login"
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
