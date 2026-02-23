import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const DATA_DIR = path.join(process.cwd(), 'data');

let slugIndexCache = null;
let categoriesCache = null;
let categoryMapCache = null;
let sitemapCache = null;

function readGzip(filePath) {
  const gzPath = filePath + '.gz';
  if (!fs.existsSync(gzPath)) return null;
  const compressed = fs.readFileSync(gzPath);
  const decompressed = zlib.gunzipSync(compressed);
  return JSON.parse(decompressed.toString('utf8'));
}

function getSlugIndex() {
  if (slugIndexCache) return slugIndexCache;
  slugIndexCache = readGzip(path.join(DATA_DIR, 'slug-index.json'));
  return slugIndexCache;
}

export function getCategories() {
  if (categoriesCache) return categoriesCache;
  categoriesCache = readGzip(path.join(DATA_DIR, 'categories.json'));
  return categoriesCache;
}

export function getCategoryMap() {
  if (categoryMapCache) return categoryMapCache;
  const cats = getCategories();
  const map = {};
  for (const cat of cats) {
    map[cat.slug] = cat;
  }
  categoryMapCache = map;
  return map;
}

export function getPostBySlug(slug) {
  const index = getSlugIndex();
  const chunkNum = index[slug];
  if (chunkNum === undefined) return null;
  const chunk = readGzip(path.join(DATA_DIR, 'posts', `chunk-${chunkNum}.json`));
  return chunk ? (chunk[slug] || null) : null;
}

export function getCategoryPosts(catSlug) {
  return readGzip(path.join(DATA_DIR, 'categories', `${catSlug}.json`)) || [];
}

export function getRecentPosts() {
  return readGzip(path.join(DATA_DIR, 'recent.json')) || [];
}

export function getPage(slug) {
  return readGzip(path.join(DATA_DIR, 'pages', `${slug}.json`));
}

export function getAllPostSlugs() {
  const index = getSlugIndex();
  return Object.keys(index);
}

export function getSitemapPosts() {
  if (sitemapCache) return sitemapCache;
  sitemapCache = readGzip(path.join(DATA_DIR, 'sitemap-posts.json')) || [];
  return sitemapCache;
}

export function getCategoryHierarchy(catSlug, catMap) {
  const chain = [];
  let current = catSlug;
  while (current && catMap[current]) {
    chain.unshift(catMap[current]);
    current = catMap[current].parent;
  }
  return chain;
}

export function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function isoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
