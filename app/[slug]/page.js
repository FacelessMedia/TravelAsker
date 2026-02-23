import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getPage, getCategoryMap, getCategoryHierarchy, getCategoryPath, stripHtml, formatDate, isoDate } from '../../lib/data';

const SITE_URL = 'https://travelasker.com';

export const revalidate = 3600;
export const dynamicParams = true;

function generateTOC(content) {
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const seen = new Set();
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = stripHtml(match[1]);
    if (text) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!seen.has(id)) {
        seen.add(id);
        headings.push({ id, text });
      }
    }
  }
  return headings;
}

function addHeadingIds(content) {
  return content.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, inner) => {
    const text = stripHtml(inner);
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (attrs.includes('id=')) return match;
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });
}

function processContent(content) {
  if (!content) return '';
  let processed = content.replace(/\[subcategory[^\]]*\]/g, '');
  processed = processed.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, '$1');
  return processed;
}

function buildSchemas(post, headings, catMap, breadcrumbItems, processedContent) {
  const cats = (post.categories || []).map(c => catMap[c]?.name || c);
  const postUrl = `${SITE_URL}/${post.slug}/`;
  const authorName = post.authorDisplay || post.author;
  const authorSlug = authorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const description = stripHtml(post.excerpt).substring(0, 160);

  const orgEntity = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    "name": "TravelAsker",
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      "url": `${SITE_URL}/travelasker_logo.svg`,
      "contentUrl": `${SITE_URL}/travelasker_logo.svg`,
      "caption": "TravelAsker",
      "inLanguage": "en-US",
      "width": 512,
      "height": 512
    }
  };

  const websiteEntity = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "url": SITE_URL,
    "name": "TravelAsker",
    "publisher": { "@type": "Organization", "@id": `${SITE_URL}/#organization` },
    "inLanguage": "en-US"
  };

  const breadcrumbEntity = {
    "@type": "BreadcrumbList",
    "@id": `${postUrl}#breadcrumb`,
    "itemListElement": breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "item": { "@type": "Thing", "@id": item.url, "name": item.name }
    }))
  };

  const webpageEntity = {
    "@type": "WebPage",
    "@id": `${postUrl}#webpage`,
    "url": postUrl,
    "name": post.title,
    "datePublished": isoDate(post.dateGmt),
    "dateModified": isoDate(post.modifiedGmt),
    "isPartOf": { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
    "inLanguage": "en-US",
    "breadcrumb": { "@type": "BreadcrumbList", "@id": `${postUrl}#breadcrumb` }
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "name": post.title,
    "description": description,
    "datePublished": isoDate(post.dateGmt),
    "dateModified": isoDate(post.modifiedGmt),
    "articleSection": cats.length > 0 ? cats[0] : "Travel",
    "author": {
      "@type": "Person",
      "@id": `${SITE_URL}/author/${authorSlug}/`,
      "name": authorName,
      "url": `${SITE_URL}/author/${authorSlug}/`,
      "worksFor": { "@type": "Organization", "@id": `${SITE_URL}/#organization` }
    },
    "publisher": orgEntity,
    "inLanguage": "en-US",
    "@id": `${postUrl}#richSnippet`,
    "isPartOf": webpageEntity,
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${postUrl}#webpage` },
    "breadcrumb": breadcrumbEntity,
    "keywords": (post.tags || []).join(', ')
  };

  const schemas = [articleSchema];

  // FAQ schema for question-style headings
  const questions = headings.filter(h =>
    h.text.includes('?') || /^(what|how|why|when|where|is |are |can |do )/i.test(h.text)
  );

  if (questions.length >= 2) {
    const faqItems = [];
    for (const q of questions) {
      const regex = new RegExp(`<h2[^>]*id="${q.id}"[^>]*>.*?</h2>\\s*(<p>.*?</p>)`, 'is');
      const match = processedContent.match(regex);
      if (match) {
        const answer = stripHtml(match[1]).substring(0, 300);
        if (answer.length > 20) {
          faqItems.push({
            "@type": "Question",
            "name": q.text,
            "acceptedAnswer": { "@type": "Answer", "text": answer }
          });
        }
      }
    }
    if (faqItems.length >= 2) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems
      });
    }
  }

  return schemas;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = (await getPostBySlug(slug)) || getPage(slug);
  if (!post) return { title: 'Not Found' };

  const description = stripHtml(post.excerpt || post.content).substring(0, 160);
  return {
    title: post.title,
    description,
    alternates: { canonical: `${SITE_URL}/${slug}/` },
    openGraph: {
      title: `${post.title} - TravelAsker`,
      description,
      url: `${SITE_URL}/${slug}/`,
      type: 'article'
    },
    twitter: {
      title: `${post.title} - TravelAsker`,
      description
    }
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const page = !post ? getPage(slug) : null;
  const item = post || page;

  if (!item) notFound();

  const catMap = getCategoryMap();
  let content = processContent(item.content);
  content = addHeadingIds(content);
  const headings = generateTOC(content);

  // Insert TOC after first heading
  let finalContent = content;
  if (headings.length >= 2) {
    const firstH2 = content.indexOf('<h2');
    if (firstH2 > -1) {
      finalContent = content.substring(0, firstH2) + '{{TOC_PLACEHOLDER}}' + content.substring(firstH2);
    }
  }

  // Build breadcrumbs
  const postCats = (item.categories || []).map(s => catMap[s]).filter(Boolean);
  const primaryCat = postCats[0];
  const catHierarchy = primaryCat ? getCategoryHierarchy(primaryCat.slug, catMap) : [];

  const breadcrumbItems = [{ name: 'Home', url: SITE_URL }];
  for (const c of catHierarchy) {
    const cPath = getCategoryPath(c.slug);
    breadcrumbItems.push({ name: c.name, url: `${SITE_URL}/category/${cPath}/` });
  }
  breadcrumbItems.push({ name: item.title, url: `${SITE_URL}/${item.slug}/` });

  // Schemas
  const schemas = post ? buildSchemas(post, headings, catMap, breadcrumbItems, content) : [{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((it, i) => ({
      "@type": "ListItem", "position": i + 1, "name": it.name, "item": it.url
    }))
  }];

  return (
    <>
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}

      <main className="post-page">
        <div className="post-container">
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

          <article className="post-article" itemScope itemType="https://schema.org/Article">
            <header className="post-header">
              <div className="post-meta-top">
                {postCats.map(c => {
                  const cPath = getCategoryPath(c.slug);
                  return <Link key={c.slug} href={`/category/${cPath}/`} className="category-link">{c.name}</Link>;
                })}
              </div>
              <h1 className="post-title" itemProp="headline">{item.title}</h1>
              {(item.authorDisplay || item.date) && (
                <div className="post-meta">
                  <div className="post-meta-left">
                    {item.authorDisplay && (
                      <span className="post-author" itemProp="author" itemScope itemType="https://schema.org/Person">
                        By <Link href={`/author/${item.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}/`} itemProp="url"><span itemProp="name">{item.authorDisplay}</span></Link>
                      </span>
                    )}
                    {item.dateGmt && (
                      <time className="post-date" dateTime={isoDate(item.dateGmt)} itemProp="datePublished">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="meta-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {formatDate(item.dateGmt)}
                      </time>
                    )}
                  </div>
                  <div className="post-share">
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${SITE_URL}/${item.slug}/`} target="_blank" rel="noopener noreferrer" className="share-btn share-facebook" aria-label="Share on Facebook">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                    <a href={`https://twitter.com/intent/tweet?url=${SITE_URL}/${item.slug}/&text=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" className="share-btn share-twitter" aria-label="Share on Twitter">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                    <a href={`https://pinterest.com/pin/create/button/?url=${SITE_URL}/${item.slug}/&description=${encodeURIComponent(item.title)}`} target="_blank" rel="noopener noreferrer" className="share-btn share-pinterest" aria-label="Pin on Pinterest">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                    </a>
                  </div>
                </div>
              )}
            </header>

            <div className="post-content" itemProp="articleBody">
              {headings.length >= 2 && finalContent.includes('{{TOC_PLACEHOLDER}}') ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: finalContent.split('{{TOC_PLACEHOLDER}}')[0] }} />
                  <TOC headings={headings} />
                  <div dangerouslySetInnerHTML={{ __html: finalContent.split('{{TOC_PLACEHOLDER}}')[1] }} />
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: finalContent.replace('{{TOC_PLACEHOLDER}}', '') }} />
              )}
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="post-tags">
                {item.tags.map((tag, i) => (
                  <span key={i} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </article>
        </div>
      </main>
    </>
  );
}

function TOC({ headings }) {
  return (
    <div className="toc-container">
      <div className="toc-header">
        <span className="toc-title">Table of Contents</span>
        <span className="toc-toggle">{'\u25BC'}</span>
      </div>
      <ol className="toc-list">
        {headings.map((h, i) => (
          <li key={i}><a href={`#${h.id}`}>{h.text}</a></li>
        ))}
      </ol>
    </div>
  );
}
