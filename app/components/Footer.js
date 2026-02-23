import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="footer-logo">
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span className="logo-text">TravelAsker</span>
            </Link>
            <p className="footer-tagline">Travel Guides by Locals &amp; Experts. Maximize your travel with advice, guides, reviews, and more.</p>
          </div>
          <div className="footer-links">
            <h4>Explore</h4>
            <Link href="/category/europe/">Europe</Link>
            <Link href="/category/north-america/">North America</Link>
            <Link href="/category/caribbean/">Caribbean</Link>
            <Link href="/category/central-south-america/">Central &amp; South America</Link>
            <Link href="/category/africa-and-middle-east/">Africa &amp; Middle East</Link>
            <Link href="/category/asia-and-pacific/">Asia &amp; Pacific</Link>
          </div>
          <div className="footer-links">
            <h4>Categories</h4>
            <Link href="/category/travel-destinations/">Travel Destinations</Link>
            <Link href="/category/tourist-attractions/">Tourist Attractions</Link>
            <Link href="/category/air-travel/">Air Travel</Link>
            <Link href="/category/holidays-and-special-events/">Holidays &amp; Special Events</Link>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <Link href="/about-us/">About Us</Link>
            <Link href="/contact-us/">Contact Us</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 TravelAsker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
