import { getSitemapPosts, getCategories } from '../../lib/data';

const SITE_URL = 'https://travelasker.com';
const URLS_PER_SITEMAP = 1000;

export async function GET() {
  const posts = getSitemapPosts();
  const totalSitemaps = Math.ceil(posts.length / URLS_PER_SITEMAP);

  // Get lastmod for each sitemap chunk (first post's lastmod in each chunk)
  const sitemapLastmods = [];
  for (let i = 0; i < totalSitemaps; i++) {
    const start = i * URLS_PER_SITEMAP;
    const firstPost = posts[start];
    sitemapLastmods.push(firstPost ? firstPost.lastmod : '');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (let i = 1; i <= totalSitemaps; i++) {
    const lastmod = formatLastmod(sitemapLastmods[i - 1]);
    xml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/post-sitemap${i}.xml</loc>\n`;
    if (lastmod) xml += `\t\t<lastmod>${lastmod}</lastmod>\n`;
    xml += `\t</sitemap>\n`;
  }

  xml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/page-sitemap.xml</loc>\n\t</sitemap>\n`;
  xml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/category-sitemap.xml</loc>\n\t</sitemap>\n`;
  xml += '</sitemapindex>\n';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}

function formatLastmod(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace('.000Z', '+00:00');
}
