import { getSitemapPosts, getCategories } from '../../lib/data';

const SITE_URL = 'https://travelasker.com';

export async function GET() {
  const posts = getSitemapPosts();
  const categories = getCategories();

  const URLS_PER_SITEMAP = 1000;
  const totalSitemaps = Math.ceil(posts.length / URLS_PER_SITEMAP);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (let i = 1; i <= totalSitemaps; i++) {
    xml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/post-sitemap${i}.xml</loc>\n\t</sitemap>\n`;
  }
  xml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/category-sitemap.xml</loc>\n\t</sitemap>\n`;
  xml += '</sitemapindex>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
