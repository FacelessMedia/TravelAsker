const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CHUNKS_DIR = path.join(__dirname, 'public', 'data', 'posts');
const AUTHORS_DIR = path.join(__dirname, 'data', 'authors');

// Ensure output directory exists
if (!fs.existsSync(AUTHORS_DIR)) {
  fs.mkdirSync(AUTHORS_DIR, { recursive: true });
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

console.log('Scanning post chunks for author data...');

const authors = {}; // authorSlug -> { name, posts: [{slug, title, date, categories, excerpt}] }
const chunkFiles = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith('.json.gz')).sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)[0]);
  const numB = parseInt(b.match(/\d+/)[0]);
  return numA - numB;
});

let totalPosts = 0;

for (const file of chunkFiles) {
  const filePath = path.join(CHUNKS_DIR, file);
  const compressed = fs.readFileSync(filePath);
  const chunk = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));

  for (const [slug, post] of Object.entries(chunk)) {
    const authorName = post.authorDisplay || post.author;
    if (!authorName) continue;

    const authorSlug = slugify(authorName);
    if (!authors[authorSlug]) {
      authors[authorSlug] = { name: authorName, slug: authorSlug, posts: [] };
    }

    // Store lightweight post info (no content)
    const excerpt = (post.excerpt || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);

    authors[authorSlug].posts.push({
      slug: post.slug,
      title: post.title,
      date: post.dateGmt || post.date,
      categories: post.categories || [],
      excerpt
    });

    totalPosts++;
  }
}

// Sort each author's posts by date descending
for (const authorSlug of Object.keys(authors)) {
  authors[authorSlug].posts.sort((a, b) => {
    const da = new Date(a.date?.replace(' ', 'T') + 'Z');
    const db = new Date(b.date?.replace(' ', 'T') + 'Z');
    return db - da;
  });
}

// Write individual author files (gzipped)
const authorSlugs = Object.keys(authors);
for (const authorSlug of authorSlugs) {
  const data = JSON.stringify(authors[authorSlug]);
  const compressed = zlib.gzipSync(data);
  fs.writeFileSync(path.join(AUTHORS_DIR, `${authorSlug}.json.gz`), compressed);
}

// Write author index (slug -> name + post count)
const authorIndex = {};
for (const [slug, data] of Object.entries(authors)) {
  authorIndex[slug] = { name: data.name, count: data.posts.length };
}
const indexData = JSON.stringify(authorIndex);
const indexCompressed = zlib.gzipSync(indexData);
fs.writeFileSync(path.join(AUTHORS_DIR, '_index.json.gz'), indexCompressed);

console.log(`Done! ${authorSlugs.length} authors, ${totalPosts} posts total.`);
console.log('Top authors:');
Object.entries(authorIndex)
  .sort((a, b) => b[1].count - a[1].count)
  .slice(0, 10)
  .forEach(([slug, info]) => console.log(`  ${info.name}: ${info.count} posts`));
