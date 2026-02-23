import Link from 'next/link';
import { getRecentPosts, getCategories, getCategoryPosts, getCategoryMap } from '../lib/data';
import PostCard from './components/PostCard';

const SITE_URL = 'https://travelasker.com';

export const revalidate = 3600;

export default function HomePage() {
  const recentPosts = getRecentPosts();
  const categories = getCategories();
  const categoryMap = getCategoryMap();

  const continentSlugs = ['europe', 'north-america', 'caribbean', 'central-south-america', 'africa-and-middle-east', 'asia-and-pacific'];
  const continentIcons = {
    'europe': '\u{1F3F0}',
    'north-america': '\u{1F5FD}',
    'caribbean': '\u{1F3DD}\uFE0F',
    'central-south-america': '\u{1F30E}',
    'africa-and-middle-east': '\u{1F30D}',
    'asia-and-pacific': '\u26E9\uFE0F'
  };

  const continents = continentSlugs.map(slug => {
    const cat = categoryMap[slug];
    if (!cat) return null;
    const posts = getCategoryPosts(slug);
    const subcats = categories.filter(c => c.parent === slug).slice(0, 6);
    return { ...cat, count: posts.length, subcats, icon: continentIcons[slug] || '\u{1F30F}' };
  }).filter(Boolean);

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TravelAsker",
    "url": SITE_URL,
    "description": "Travel Guides by Locals & Experts. Maximize your travel with travel advice, guides, reviews, and more.",
    "publisher": { "@type": "Organization", "name": "TravelAsker", "url": SITE_URL },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?s={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TravelAsker",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "sameAs": []
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      <main className="home-page">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-content">
              <h1 className="hero-title">Travel Guides by<br /><span className="hero-highlight">Locals &amp; Experts</span></h1>
              <p className="hero-subtitle">Maximize your travel with expert advice, in-depth guides, honest reviews, and insider tips from 142,000+ articles covering destinations worldwide.</p>
            </div>
            <div className="hero-decoration">
              <svg viewBox="0 0 200 200" className="hero-globe">
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2"/>
                <ellipse cx="100" cy="100" rx="90" ry="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" transform="rotate(-20, 100, 100)"/>
                <ellipse cx="100" cy="100" rx="40" ry="90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
              </svg>
            </div>
          </div>
        </section>

        <section className="continents-section">
          <div className="section-inner">
            <h2 className="section-title">Explore the World</h2>
            <p className="section-subtitle">Choose a continent to start your journey</p>
            <div className="continents-grid">
              {continents.map(cont => (
                <Link key={cont.slug} href={`/category/${cont.slug}/`} className="continent-card">
                  <span className="continent-icon">{cont.icon}</span>
                  <h3 className="continent-name">{cont.name}</h3>
                  <p className="continent-count">{cont.count} articles</p>
                  <div className="continent-subcats">
                    {cont.subcats.map(sc => (
                      <span key={sc.slug} className="continent-sublink">{sc.name}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="recent-section">
          <div className="section-inner">
            <h2 className="section-title">Recent Articles</h2>
            <p className="section-subtitle">The latest travel guides and insights</p>
            <div className="posts-grid">
              {recentPosts.map(post => (
                <PostCard key={post.slug} post={post} showCategory={true} categoryMap={categoryMap} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
