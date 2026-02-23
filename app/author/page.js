import Link from 'next/link';
import { getAuthorIndex } from '../../lib/data';

const SITE_URL = 'https://travelasker.com';

export const revalidate = 3600;

export const metadata = {
  title: 'Authors - TravelAsker',
  description: 'Meet the travel writers and experts behind TravelAsker\'s guides and articles.',
  alternates: { canonical: `${SITE_URL}/author/` }
};

export default function AuthorsPage() {
  const authorIndex = getAuthorIndex();
  const authors = Object.entries(authorIndex)
    .map(([slug, info]) => ({ slug, ...info }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="category-page">
      <div className="category-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><span>Authors</span></li>
          </ol>
        </nav>

        <header className="category-header">
          <h1 className="category-title">Our Authors</h1>
          <p className="category-description">Meet the travel writers and experts behind TravelAsker</p>
          <span className="category-count">{authors.length} writers</span>
        </header>

        <div className="subcategories-grid" style={{ marginTop: '24px' }}>
          {authors.map(author => (
            <Link key={author.slug} href={`/author/${author.slug}/`} className="subcategory-card">
              <span className="subcategory-name">{author.name}</span>
              <span style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.6 }}>{author.count} articles</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
