import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
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
            <div className="footer-destinations">
              <Link href="/category/europe/france/">France</Link>
              <Link href="/category/europe/spain/">Spain</Link>
              <Link href="/category/asia-and-pacific/china/">China</Link>
              <Link href="/category/asia-and-pacific/turkey/">Turkey</Link>
              <Link href="/category/asia-and-pacific/thailand/">Thailand</Link>
              <Link href="/category/europe/germany/">Germany</Link>
              <Link href="/category/north-america/mexico/">Mexico</Link>
              <Link href="/category/europe/greece/">Greece</Link>
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
