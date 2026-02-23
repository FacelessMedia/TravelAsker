import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo-row">
              <svg className="footer-logo-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>
              <span className="footer-logo-text">TravelAsker</span>
            </div>
            <p className="footer-tagline">Your essential travel companion. Maximize your travel with destination guides, travel advice, reviews, and more from TravelAsker.</p>
            <div className="footer-brand-links">
              <Link href="/about-us/">About</Link>
              <Link href="/terms-and-conditions/">Terms &amp; Conditions</Link>
              <Link href="/privacy-policy/">Privacy Policy</Link>
              <Link href="/contact-us/">Contact</Link>
            </div>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Browse by Continent</h3>
            <div className="footer-links-list">
              <Link href="/category/europe/">Europe</Link>
              <Link href="/category/north-america/">North America</Link>
              <Link href="/category/caribbean/">Caribbean</Link>
              <Link href="/category/central-south-america/">Central &amp; South America</Link>
              <Link href="/category/africa-and-middle-east/">Africa &amp; Middle East</Link>
              <Link href="/category/asia-and-pacific/">Asia &amp; Pacific</Link>
            </div>
          </div>
          <div className="footer-section">
            <h3 className="footer-heading">Popular Destinations</h3>
            <div className="footer-links-list">
              <Link href="/category/europe/france/">France</Link>
              <Link href="/category/europe/spain/">Spain</Link>
              <Link href="/category/asia-and-pacific/china/">China</Link>
              <Link href="/category/asia-and-pacific/turkey/">Turkey</Link>
              <Link href="/category/asia-and-pacific/thailand/">Thailand</Link>
              <Link href="/category/europe/germany/">Germany</Link>
              <Link href="/category/north-america/mexico/">Mexico</Link>
              <Link href="/category/europe/greece/">Greece</Link>
            </div>
          </div>
          <div className="footer-section footer-section-no-heading">
            <h3 className="footer-heading">&nbsp;</h3>
            <div className="footer-links-list">
              <Link href="/category/europe/austria/">Austria</Link>
              <Link href="/category/asia-and-pacific/new-zealand/">New Zealand</Link>
              <Link href="/category/north-america/canada/">Canada</Link>
              <Link href="/category/europe/ireland/">Ireland</Link>
              <Link href="/category/africa-and-middle-east/kenya/">Kenya</Link>
              <Link href="/category/africa-and-middle-east/united-arab-emirates/">United Arab Emirates</Link>
              <Link href="/category/asia-and-pacific/australia/">Australia</Link>
              <Link href="/category/europe/england/">England</Link>
              <Link href="/category/asia-and-pacific/japan/">Japan</Link>
              <Link href="/category/europe/italy/">Italy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 TravelAsker</p>
        </div>
      </div>
    </footer>
  );
}
