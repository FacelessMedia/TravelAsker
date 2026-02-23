const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sax = require('sax');

const XML_PATH = path.join(__dirname, 'travelasker.WordPress.2026-02-23.xml');
const DATA_DIR = path.join(__dirname, 'data');

function writeGzip(filePath, data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  const compressed = zlib.gzipSync(json, { level: 9 });
  fs.writeFileSync(filePath + '.gz', compressed);
  return compressed.length;
}

// ── Data stores ──
const categories = [];
const posts = [];
const pages = [];
const authors = {};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ── Streaming XML Parser ──
function parseXML() {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(false, {
      lowercase: true,
      normalize: true,
      trim: false
    });

    let currentText = '';
    let currentItem = null;
    let currentMeta = null;
    let inItem = false;
    let inCategory = false;
    let inAuthor = false;
    let currentCat = {};
    let currentAuthor = {};
    let postCount = 0;

    parser.on('opentag', (node) => {
      currentText = '';
      const tag = node.name;

      if (tag === 'item') {
        inItem = true;
        currentItem = {
          title: '', slug: '', date: '', dateGmt: '', modified: '', modifiedGmt: '',
          author: '', content: '', excerpt: '', categories: [], tags: [],
          status: '', postType: '', postId: '', link: '', metas: {}
        };
      } else if (tag === 'wp:category') {
        inCategory = true;
        currentCat = { slug: '', name: '', parent: '', description: '' };
      } else if (tag === 'wp:author') {
        inAuthor = true;
        currentAuthor = { id: '', login: '', email: '', displayName: '' };
      } else if (tag === 'wp:postmeta') {
        currentMeta = { key: '', value: '' };
      } else if (tag === 'category' && inItem && node.attributes) {
        currentItem._catDomain = node.attributes.domain || '';
        currentItem._catNicename = node.attributes.nicename || '';
      }
    });

    parser.on('text', (text) => { currentText += text; });
    parser.on('cdata', (cdata) => { currentText += cdata; });

    parser.on('closetag', (tag) => {
      const text = currentText.trim();

      if (inAuthor) {
        if (tag === 'wp:author_id') currentAuthor.id = text;
        else if (tag === 'wp:author_login') currentAuthor.login = text;
        else if (tag === 'wp:author_email') currentAuthor.email = text;
        else if (tag === 'wp:author_display_name') currentAuthor.displayName = text;
        else if (tag === 'wp:author') {
          inAuthor = false;
          if (currentAuthor.login) authors[currentAuthor.login] = currentAuthor;
        }
      }

      if (inCategory && !inItem) {
        if (tag === 'wp:category_nicename') currentCat.slug = text;
        else if (tag === 'wp:cat_name') currentCat.name = text;
        else if (tag === 'wp:category_parent') currentCat.parent = text;
        else if (tag === 'wp:category_description') currentCat.description = text;
        else if (tag === 'wp:category') {
          inCategory = false;
          if (currentCat.slug) categories.push(currentCat);
        }
      }

      if (inItem) {
        if (tag === 'title') currentItem.title = text;
        else if (tag === 'link') currentItem.link = text;
        else if (tag === 'dc:creator') currentItem.author = text;
        else if (tag === 'content:encoded') currentItem.content = currentText;
        else if (tag === 'excerpt:encoded') currentItem.excerpt = text;
        else if (tag === 'wp:post_id') currentItem.postId = text;
        else if (tag === 'wp:post_date') currentItem.date = text;
        else if (tag === 'wp:post_date_gmt') currentItem.dateGmt = text;
        else if (tag === 'wp:post_modified') currentItem.modified = text;
        else if (tag === 'wp:post_modified_gmt') currentItem.modifiedGmt = text;
        else if (tag === 'wp:post_name') currentItem.slug = text;
        else if (tag === 'wp:status') currentItem.status = text;
        else if (tag === 'wp:post_type') currentItem.postType = text;
        else if (tag === 'category') {
          if (currentItem._catDomain === 'category') {
            currentItem.categories.push(currentItem._catNicename);
          } else if (currentItem._catDomain === 'post_tag') {
            currentItem.tags.push(text);
          }
        }
        else if (currentMeta) {
          if (tag === 'wp:meta_key') currentMeta.key = text;
          else if (tag === 'wp:meta_value') currentMeta.value = currentText;
          else if (tag === 'wp:postmeta') {
            if (currentMeta.key) currentItem.metas[currentMeta.key] = currentMeta.value;
            currentMeta = null;
          }
        }
        else if (tag === 'item') {
          inItem = false;
          if (currentItem.status === 'publish') {
            const authorData = authors[currentItem.author];
            currentItem.authorDisplay = authorData ? authorData.displayName : currentItem.author;
            delete currentItem.metas;
            delete currentItem._catDomain;
            delete currentItem._catNicename;

            if (currentItem.postType === 'post') {
              posts.push(currentItem);
              postCount++;
              if (postCount % 500 === 0) process.stdout.write(`\r  Parsed ${postCount} posts...`);
            } else if (currentItem.postType === 'page') {
              pages.push(currentItem);
            }
          }
        }
      }

      currentText = '';
    });

    parser.on('error', () => {
      parser._parser.error = null;
      parser._parser.resume();
    });

    parser.on('end', () => {
      console.log(`\n  Total posts: ${posts.length}`);
      console.log(`  Total pages: ${pages.length}`);
      console.log(`  Total categories: ${categories.length}`);
      resolve();
    });

    console.log('Parsing WordPress XML...');
    fs.createReadStream(XML_PATH, { encoding: 'utf8', highWaterMark: 64 * 1024 }).pipe(parser);
  });
}

async function extract() {
  console.log('=== TravelAsker Data Extraction ===\n');
  await parseXML();

  // Clean dist
  if (fs.existsSync(DATA_DIR)) fs.rmSync(DATA_DIR, { recursive: true });
  ensureDir(DATA_DIR);
  ensureDir(path.join(DATA_DIR, 'posts'));

  // ── Save categories ──
  const catSize = writeGzip(path.join(DATA_DIR, 'categories.json'), categories);
  console.log(`\nSaved categories.json.gz (${(catSize/1024).toFixed(1)}KB)`);

  // ── Save pages ──
  writeGzip(path.join(DATA_DIR, 'pages.json'), pages);
  console.log(`Saved pages.json.gz`);

  // ── Build slug index and save posts in chunks ──
  // Each post gets its own JSON file keyed by slug for O(1) lookup
  // But 142K files is too many — use chunked approach with index
  const CHUNK_SIZE = 500;
  const slugIndex = {}; // slug -> {chunk, index}
  const catIndex = {};  // catSlug -> [{slug, title, excerpt, date, author, cats}]

  // Sort posts by date descending for recent posts
  posts.sort((a, b) => new Date(b.dateGmt) - new Date(a.dateGmt));

  // Save recent posts list (for homepage)
  const recentPosts = posts.slice(0, 20).map(p => ({
    slug: p.slug, title: p.title, excerpt: p.excerpt,
    date: p.dateGmt, author: p.authorDisplay, categories: p.categories
  }));
  writeGzip(path.join(DATA_DIR, 'recent.json'), recentPosts);

  // Save posts in chunks
  let chunkNum = 0;
  for (let i = 0; i < posts.length; i += CHUNK_SIZE) {
    const chunk = posts.slice(i, i + CHUNK_SIZE);
    const chunkData = {};
    for (let j = 0; j < chunk.length; j++) {
      const post = chunk[j];
      chunkData[post.slug] = post;
      slugIndex[post.slug] = chunkNum;

      // Build category index
      for (const catSlug of post.categories) {
        if (!catIndex[catSlug]) catIndex[catSlug] = [];
        catIndex[catSlug].push({
          slug: post.slug, title: post.title,
          excerpt: (post.excerpt || '').substring(0, 200),
          date: post.dateGmt, author: post.authorDisplay
        });
      }
    }
    writeGzip(
      path.join(DATA_DIR, 'posts', `chunk-${chunkNum}.json`),
      chunkData
    );
    chunkNum++;
    if (chunkNum % 50 === 0) process.stdout.write(`\r  Saved ${chunkNum} chunks...`);
  }
  console.log(`\nSaved ${chunkNum} post chunks`);

  // Save slug index
  writeGzip(path.join(DATA_DIR, 'slug-index.json'), slugIndex);
  console.log(`Saved slug-index.json.gz (${Object.keys(slugIndex).length} entries)`);

  // Save category post index (chunked per category)
  ensureDir(path.join(DATA_DIR, 'categories'));
  for (const catSlug in catIndex) {
    // Sort by date desc
    catIndex[catSlug].sort((a, b) => new Date(b.date) - new Date(a.date));
    writeGzip(
      path.join(DATA_DIR, 'categories', `${catSlug}.json`),
      catIndex[catSlug]
    );
  }
  console.log(`Saved ${Object.keys(catIndex).length} category post indexes`);

  // Save pages individually
  ensureDir(path.join(DATA_DIR, 'pages'));
  for (const page of pages) {
    if (page.slug) {
      writeGzip(
        path.join(DATA_DIR, 'pages', `${page.slug}.json`),
        page
      );
    }
  }
  console.log(`Saved ${pages.length} individual pages`);

  // ── Generate sitemap data ──
  const sitemapData = posts.map(p => ({
    slug: p.slug,
    lastmod: p.modifiedGmt || p.dateGmt
  }));
  writeGzip(path.join(DATA_DIR, 'sitemap-posts.json'), sitemapData);
  console.log(`Saved sitemap-posts.json.gz`);

  console.log('\n=== Extraction complete! ===');
}

extract().catch(err => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
