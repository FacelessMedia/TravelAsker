export async function GET() {
  return new Response(null, {
    status: 301,
    headers: { 'Location': '/sitemap_index.xml' }
  });
}
