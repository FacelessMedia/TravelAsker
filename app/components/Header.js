'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="site-logo">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span className="logo-text">TravelAsker</span>
        </Link>

        <nav className="main-nav">
          <div className="nav-dropdown">
            <button className="nav-link nav-dropdown-toggle">
              Explore <svg className="dropdown-arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3"/></svg>
            </button>
            <div className="nav-dropdown-menu">
              <Link href="/category/europe/" className="dropdown-item">Europe</Link>
              <Link href="/category/north-america/" className="dropdown-item">North America</Link>
              <Link href="/category/caribbean/" className="dropdown-item">Caribbean</Link>
              <Link href="/category/central-south-america/" className="dropdown-item">Central &amp; South America</Link>
              <Link href="/category/africa-and-middle-east/" className="dropdown-item">Africa &amp; Middle East</Link>
              <Link href="/category/asia-and-pacific/" className="dropdown-item">Asia &amp; Pacific</Link>
            </div>
          </div>
          <div className="nav-dropdown">
            <button className="nav-link nav-dropdown-toggle">
              Blog <svg className="dropdown-arrow" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5l3 3 3-3"/></svg>
            </button>
            <div className="nav-dropdown-menu">
              <Link href="/category/travel-destinations/" className="dropdown-item">Travel Destinations</Link>
              <Link href="/category/tourist-attractions/" className="dropdown-item">Tourist Attractions</Link>
              <Link href="/category/air-travel/" className="dropdown-item">Air Travel</Link>
              <Link href="/category/holidays-and-special-events/" className="dropdown-item">Holidays &amp; Special Events</Link>
            </div>
          </div>
          <Link href="/about-us/" className="nav-link">About</Link>
          <Link href="/contact-us/" className="nav-link">Contact</Link>
        </nav>

        <button className="mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
          {!mobileOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <nav className="mobile-nav active">
          <div className="mobile-nav-section">
            <span className="mobile-nav-label">Explore</span>
            <Link href="/category/europe/" onClick={() => setMobileOpen(false)}>Europe</Link>
            <Link href="/category/north-america/" onClick={() => setMobileOpen(false)}>North America</Link>
            <Link href="/category/caribbean/" onClick={() => setMobileOpen(false)}>Caribbean</Link>
            <Link href="/category/central-south-america/" onClick={() => setMobileOpen(false)}>Central &amp; South America</Link>
            <Link href="/category/africa-and-middle-east/" onClick={() => setMobileOpen(false)}>Africa &amp; Middle East</Link>
            <Link href="/category/asia-and-pacific/" onClick={() => setMobileOpen(false)}>Asia &amp; Pacific</Link>
          </div>
          <div className="mobile-nav-section">
            <span className="mobile-nav-label">Blog</span>
            <Link href="/category/travel-destinations/" onClick={() => setMobileOpen(false)}>Travel Destinations</Link>
            <Link href="/category/tourist-attractions/" onClick={() => setMobileOpen(false)}>Tourist Attractions</Link>
            <Link href="/category/air-travel/" onClick={() => setMobileOpen(false)}>Air Travel</Link>
            <Link href="/category/holidays-and-special-events/" onClick={() => setMobileOpen(false)}>Holidays &amp; Special Events</Link>
          </div>
          <Link href="/about-us/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>About</Link>
          <Link href="/contact-us/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>Contact</Link>
        </nav>
      )}
    </header>
  );
}
