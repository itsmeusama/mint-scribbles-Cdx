import type { Metadata } from "next";
import Link from "next/link";
import { getMintAdminAccess } from "../admin-access";
import { chatGPTSignOutPath } from "../chatgpt-auth";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mint Scribbles Admin",
  description: "Private owner administration for Mint Scribbles.",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, ownerEmail, isOwner } = await getMintAdminAccess("/admin");

  if (!ownerEmail) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <p className="admin-kicker">Mint Scribbles Admin</p>
          <h1>Owner access is not configured.</h1>
          <p>
            The approved owner email is missing from the secure site settings.
            Add it before using this private area.
          </p>
        </div>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="admin-gate">
        <div className="admin-gate-card">
          <span className="admin-lock-mark" aria-hidden="true">×</span>
          <p className="admin-kicker">Private owner area</p>
          <h1>This account is not authorised.</h1>
          <p>
            You are signed in as <strong>{user.email}</strong>. Only the approved
            Mint Scribbles owner account can access this area.
          </p>
          <a className="admin-primary-action" href={chatGPTSignOutPath("/admin")}>
            Sign out and use the owner account
          </a>
          <Link className="admin-text-link" href="/">Return to the shop</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span>Mint Scribbles</span>
          <small>Owner admin</small>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin">
            <span className="admin-nav-icon" aria-hidden="true">⌂</span>
            Overview
          </Link>
          <Link href="/admin/orders">
            <span className="admin-nav-icon" aria-hidden="true">□</span>
            Orders
          </Link>
          <Link href="/admin/products">
            <span className="admin-nav-icon" aria-hidden="true">◇</span>
            Products
          </Link>
        </nav>

        <div className="admin-phase-note">
          <small>Current release</small>
          <strong>Phase 4</strong>
          <p>Customer order tracking and visible status updates.</p>
        </div>

        <div className="admin-account">
          <span className="admin-avatar" aria-hidden="true">
            {(user.fullName ?? user.email).slice(0, 1).toUpperCase()}
          </span>
          <span>
            <strong>{user.fullName ?? "Business owner"}</strong>
            <small>{user.email}</small>
          </span>
          <a href={chatGPTSignOutPath("/")}>Sign out</a>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-mobile-brand">Mint Scribbles Admin</span>
            <small>Private owner area</small>
          </div>
          <Link href="/">View shop ↗</Link>
        </header>
        {children}
      </div>
    </div>
  );
}
