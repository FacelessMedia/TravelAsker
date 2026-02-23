import { getCategories } from '../../lib/data';

const SITE_URL = 'https://travelasker.com';

export async function GET() {
  const categories = getCategories();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const cat of categories) {
    xml += `\t<url>\n\t\t<loc>${SITE_URL}/category/${cat.slug}/</loc>\n\t</url>\n`;
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
