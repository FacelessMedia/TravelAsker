const SITE_URL = 'https://travelasker.com';

export async function GET() {
  // Match original site's page-sitemap exactly: homepage, about-us, contact-us
  const pages = [
    { loc: `${SITE_URL}/`, lastmod: '2024-02-28T19:44:18+00:00' },
    { loc: `${SITE_URL}/about-us/`, lastmod: '2024-02-28T21:16:24+00:00' },
    { loc: `${SITE_URL}/contact-us/`, lastmod: '2024-02-28T18:17:08+00:00' }
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const page of pages) {
    xml += `\t<url>\n\t\t<loc>${page.loc}</loc>\n\t\t<lastmod>${page.lastmod}</lastmod>\n\t</url>\n`;
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
