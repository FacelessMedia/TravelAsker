import Link from 'next/link';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function isoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function PostCard({ post, showCategory, categoryMap }) {
  const excerpt = stripHtml(post.excerpt).substring(0, 140);
  const catSlug = post.categories?.[0];
  const cat = categoryMap && catSlug ? categoryMap[catSlug] : null;

  return (
    <article className="post-card">
      <Link href={`/${post.slug}/`} className="post-card-link">
        {showCategory && cat && (
          <span className="post-card-category">{cat.name}</span>
        )}
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-excerpt">{excerpt}</p>
        <div className="post-card-meta">
          <time dateTime={isoDate(post.date)}>{formatDate(post.date)}</time>
          {post.author && <span className="post-card-author">by {post.author}</span>}
        </div>
      </Link>
    </article>
  );
}
