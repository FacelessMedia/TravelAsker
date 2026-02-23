import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSitemapPosts, getCategoryMap, stripHtml, formatDate, isoDate } from '../../../lib/data';
import PostCard from '../../components/PostCard';

const SITE_URL = 'https://travelasker.com';

export const revalidate = 3600;
export const dynamicParams = true;

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title: `${displayName} - TravelAsker`,
    description: `Articles by ${displayName} on TravelAsker.`,
    alternates: { canonical: `${SITE_URL}/author/${slug}/` }
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const catMap = getCategoryMap();
  const allPosts = getSitemapPosts();

  // Filter posts by author slug - we need to check against the sitemap data
  // Since sitemap only has slug+lastmod, show a simple author landing page
  const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <main className="category-page">
      <div className="category-container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><span>{displayName}</span></li>
          </ol>
        </nav>
        <header className="category-header">
          <h1 className="category-title">{displayName}</h1>
          <p className="category-description">Articles by {displayName}</p>
        </header>
      </div>
    </main>
  );
}
