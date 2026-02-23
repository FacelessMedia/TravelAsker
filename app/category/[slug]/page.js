import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategories, getCategoryMap, getCategoryPosts, getCategoryHierarchy, stripHtml, formatDate, isoDate } from '../../../lib/data';
import PostCard from '../../components/PostCard';

const SITE_URL = 'https://travelasker.com';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const catMap = getCategoryMap();
  const cat = catMap[slug];
  if (!cat) return { title: 'Not Found' };

  const desc = stripHtml((cat.description || '').replace(/\[subcategory[^\]]*\]/g, '')).substring(0, 160);
  return {
    title: cat.name,
    description: desc || `Explore ${cat.name} travel guides and articles on TravelAsker.`,
    alternates: { canonical: `${SITE_URL}/category/${slug}/` },
    openGraph: {
      title: `${cat.name} - TravelAsker`,
      description: desc,
      url: `${SITE_URL}/category/${slug}/`,
      type: 'website'
    }
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const catMap = getCategoryMap();
  const cat = catMap[slug];
  if (!cat) notFound();

  const categories = getCategories();
  const posts = getCategoryPosts(slug);
  const hierarchy = getCategoryHierarchy(slug, catMap);
  const subcats = categories.filter(c => c.parent === slug);

  const breadcrumbItems = [{ name: 'Home', url: SITE_URL }];
  for (const c of hierarchy) {
    breadcrumbItems.push({ name: c.name, url: `${SITE_URL}/category/${c.slug}/` });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, i) => ({
      "@type": "ListItem", "position": i + 1, "name": item.name, "item": item.url
    }))
  };

  const catDesc = (cat.description || '').replace(/\[subcategory[^\]]*\]/g, '').trim();
  const displayPosts = posts.slice(0, 100);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="category-page">
        <div className="category-container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbItems.map((item, i) => (
                <li key={i}>
                  {i < breadcrumbItems.length - 1 ? (
                    <Link href={item.url.replace(SITE_URL, '') || '/'}>{item.name}</Link>
                  ) : (
                    <span>{item.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <header className="category-header">
            <h1 className="category-title">{cat.name}</h1>
            {catDesc && <p className="category-description">{catDesc}</p>}
            <span className="category-count">{posts.length} articles</span>
          </header>

          {subcats.length > 0 && (
            <div className="subcategories-grid">
              {subcats.map(sc => (
                <Link key={sc.slug} href={`/category/${sc.slug}/`} className="subcategory-card">
                  <span className="subcategory-name">{sc.name}</span>
                </Link>
              ))}
            </div>
          )}

          <section className="category-posts">
            <div className="posts-grid">
              {displayPosts.map(post => (
                <PostCard key={post.slug} post={post} showCategory={false} categoryMap={catMap} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
