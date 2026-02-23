export async function GET() {
  const body = `User-agent: *
Disallow:

Sitemap: https://travelasker.com/sitemap_index.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
