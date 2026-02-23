export async function GET() {
  const body = `User-agent: *
Allow: /
Sitemap: https://travelasker.com/sitemap.xml
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
