import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useToast } from "../components/ToastProvider";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ textAlign: "center" }}>
          <span className="spinner" style={{ width: 28, height: 28 }} />
          <p style={{ marginTop: 16, fontSize: 14, color: "var(--ink-3)", fontFamily: "var(--sans)" }}>
            Loading your vault…
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    showToast("Signed out successfully.", "info");
    navigate({ to: "/" });
  };

  const navItems = [
    { to: "/app", label: "Mailbox", icon: "✉", exact: true },
    { to: "/app/compose", label: "Write a Letter", icon: "✏", exact: false },
  ];

  const pageTitle =
    location.pathname === "/app" ? "Mailbox" :
    location.pathname.startsWith("/app/compose") ? "Compose" :
    location.pathname.startsWith("/app/letters") ? "Letter" : "2U Postal";

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <Link to="/" className="sidebar-logo" title="Return to 2U Home">
          <div className="sidebar-logo-seal">2U</div>
          <div>
            <div className="sidebar-logo-text">2U Postal</div>
            <div className="sidebar-logo-sub">Letters to future self</div>
          </div>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Slots */}
        <div className="sidebar-slot-card">
          <div className="sidebar-slot-header">
            <span>Slots</span>
            <span>{user.slotsFree} / 5 free</span>
          </div>
          <div className="slot-dots">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`slot-dot ${i < user.slotsUsed ? "used" : "free"}`}
                title={i < user.slotsUsed ? "In transit" : "Available"}
              />
            ))}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
            {user.slotsUsed} letter{user.slotsUsed !== 1 ? "s" : ""} in transit
          </div>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: "var(--r-sm)", cursor: "pointer", padding: "7px 9px", fontSize: 13, transition: "all 0.15s", lineHeight: 1 }}
          >
            ↩
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Open menu"
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--ink-2)", display: "none" }}
            >
              ☰
            </button>
            <span className="topbar-title">{pageTitle}</span>
          </div>

          {location.pathname === "/app" && (
            <Link to="/app/compose" className="btn btn-primary btn-sm">
              Write a Letter
            </Link>
          )}
        </div>

        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
