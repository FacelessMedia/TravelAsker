import { getSitemapPosts } from '../../../../lib/data';

const SITE_URL = 'https://travelasker.com';
const URLS_PER_SITEMAP = 1000;

function isoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

export async function GET(request, { params }) {
  const { id } = await params;
  const num = parseInt(id, 10);
  if (isNaN(num) || num < 1) return new Response('Not found', { status: 404 });

  const posts = getSitemapPosts();
  const start = (num - 1) * URLS_PER_SITEMAP;
  const chunk = posts.slice(start, start + URLS_PER_SITEMAP);
  if (chunk.length === 0) return new Response('Not found', { status: 404 });

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const post of chunk) {
    const lastmod = isoDate(post.lastmod);
    xml += `\t<url>\n\t\t<loc>${SITE_URL}/${post.slug}/</loc>\n`;
    if (lastmod) xml += `\t\t<lastmod>${lastmod}</lastmod>\n`;
    xml += `\t</url>\n`;
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
