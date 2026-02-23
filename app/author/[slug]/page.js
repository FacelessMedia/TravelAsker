import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthor, getCategoryMap, getCategoryPath, formatDate } from '../../../lib/data';

const SITE_URL = 'https://travelasker.com';
const POSTS_PER_PAGE = 30;

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return { title: 'Not Found' };

  return {
    title: `${author.name} - TravelAsker`,
    description: `Articles by ${author.name} on TravelAsker. ${author.posts.length} travel guides and articles.`,
    alternates: { canonical: `${SITE_URL}/author/${slug}/` },
    openGraph: {
      title: `${author.name} - TravelAsker`,
      description: `Articles by ${author.name} on TravelAsker.`,
      url: `${SITE_URL}/author/${slug}/`,
      type: 'profile'
    }
  };
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  const catMap = getCategoryMap();
  const displayPosts = author.posts.slice(0, POSTS_PER_PAGE);

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "@id": `${SITE_URL}/author/${slug}/`,
      "name": author.name,
      "url": `${SITE_URL}/author/${slug}/`,
      "worksFor": {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "TravelAsker"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "item": { "@type": "Thing", "@id": SITE_URL, "name": "Home" } },
      { "@type": "ListItem", "position": 2, "item": { "@type": "Thing", "@id": `${SITE_URL}/author/${slug}/`, "name": author.name } }
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="category-page">
        <div className="category-container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><Link href="/">Home</Link></li>
              <li><span>{author.name}</span></li>
            </ol>
          </nav>

          <header className="category-header">
            <h1 className="category-title">{author.name}</h1>
            <p className="category-description">Travel writer at TravelAsker</p>
            <span className="category-count">{author.posts.length} articles</span>
          </header>

          <section className="category-posts">
            <div className="posts-grid">
              {displayPosts.map(post => {
                const primaryCat = post.categories?.[0];
                const cat = primaryCat ? catMap[primaryCat] : null;
                const catPath = cat ? getCategoryPath(cat.slug) : null;
                return (
                  <article key={post.slug} className="post-card">
                    <div className="post-card-content">
                      {cat && (
                        <Link href={`/category/${catPath}/`} className="post-card-category">{cat.name}</Link>
                      )}
                      <h2 className="post-card-title">
                        <Link href={`/${post.slug}/`}>{post.title}</Link>
                      </h2>
                      {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
                      <div className="post-card-meta">
                        {post.date && <time>{formatDate(post.date)}</time>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
