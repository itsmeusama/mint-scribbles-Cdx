import type { Metadata } from "next";
import Link from "next/link";
import TrackOrder from "./TrackOrder";

export const metadata: Metadata = {
  title: "Track your order | Mint Scribbles",
  description: "Check the latest status of your Mint Scribbles collection order.",
};

export default function TrackOrderPage() {
  return (
    <main className="tracking-page">
      <header className="tracking-header">
        <Link className="tracking-brand" href="/">Mint Scribbles <small>Stationery studio</small></Link>
        <Link href="/">Return to shop</Link>
      </header>
      <TrackOrder />
      <footer className="tracking-footer">
        <span>Need help with an order?</span>
        <a href="mailto:mohamedusama881@gmail.com">mohamedusama881@gmail.com</a>
      </footer>
    </main>
  );
}
