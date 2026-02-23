import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const SITE_URL = 'https://travelasker.com';

export async function GET() {
  // Read pages data
  const gzPath = path.join(process.cwd(), 'data', 'pages.json.gz');
  let pages = [];
  if (fs.existsSync(gzPath)) {
    const compressed = fs.readFileSync(gzPath);
    pages = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const page of pages) {
    if (page.slug) {
      xml += `\t<url>\n\t\t<loc>${SITE_URL}/${page.slug}/</loc>\n\t</url>\n`;
    }
  }
  xml += '</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
