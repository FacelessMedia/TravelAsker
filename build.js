const fs = require('fs');
const path = require('path');
const sax = require('sax');

const DIST = path.join(__dirname, 'dist');
const TEMPLATES = path.join(__dirname, 'templates');
const XML_PATH = path.join(__dirname, 'travelasker.WordPress.2026-02-23.xml');
const SITE_URL = 'https://travelasker.com';
const SITE_NAME = 'TravelAsker';

// ── Data stores ──
const categories = [];  // {slug, name, parent, description}
const posts = [];       // {title, slug, date, dateGmt, modified, author, content, excerpt, categories[], tags[], status, postType}
const pages = [];       // same as posts but for pages
const authors = {};     // id -> {login, email, displayName}

// ── Template loader ──
function loadTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES, `${name}.html`), 'utf8');
}

// ── HTML helpers ──
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function generateTOC(content) {
  const headingRegex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = stripHtml(match[1]);
    if (text && !text.toLowerCase().includes('conclusion')) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ id, text });
    }
  }
  // Also include conclusion headings
  headingRegex.lastIndex = 0;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = stripHtml(match[1]);
    if (text && text.toLowerCase().includes('conclusion')) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      headings.push({ id, text });
    }
  }
  // Dedupe and rebuild in order
  const seen = new Set();
  const allHeadings = [];
  headingRegex.lastIndex = 0;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = stripHtml(match[1]);
    if (text) {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!seen.has(id)) {
        seen.add(id);
        allHeadings.push({ id, text });
      }
    }
  }
  return allHeadings;
}

function addHeadingIds(content) {
  return content.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (match, attrs, inner) => {
    const text = stripHtml(inner);
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (attrs.includes('id=')) return match;
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });
}

function buildTOCHtml(headings) {
  if (headings.length < 2) return '';
  let html = '<div class="toc-container">\n';
  html += '  <div class="toc-header" onclick="this.parentElement.classList.toggle(\'toc-collapsed\')">\n';
  html += '    <span class="toc-title">Table of Contents</span>\n';
  html += '    <span class="toc-toggle">▼</span>\n';
  html += '  </div>\n';
  html += '  <ol class="toc-list">\n';
  headings.forEach((h, i) => {
    html += `    <li><a href="#${h.id}">${escapeHtml(h.text)}</a></li>\n`;
  });
  html += '  </ol>\n';
  html += '</div>\n';
  return html;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function isoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString();
}

// ── Schema generators ──
function articleSchema(post, catMap) {
  const cats = (post.categories || []).map(c => {
    const cat = catMap[c];
    return cat ? cat.name : c;
  });
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": stripHtml(post.excerpt).substring(0, 160),
    "datePublished": isoDate(post.dateGmt),
    "dateModified": isoDate(post.modifiedGmt),
    "author": {
      "@type": "Person",
      "name": post.authorDisplay || post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/assets/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${post.slug}/`
    },
    "articleSection": cats.length > 0 ? cats[0] : "Travel",
    "keywords": (post.tags || []).join(', ')
  });
}

function breadcrumbSchema(items) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url
    }))
  });
}

function websiteSchema() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "description": "Travel Guides by Locals & Experts. Maximize your travel with travel advice, guides, reviews, and more.",
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/?s={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  });
}

function faqSchema(headings, content) {
  // Extract Q&A pairs from h2 headings that are questions
  const questions = headings.filter(h => h.text.includes('?') || h.text.toLowerCase().startsWith('what') || h.text.toLowerCase().startsWith('how') || h.text.toLowerCase().startsWith('why') || h.text.toLowerCase().startsWith('when') || h.text.toLowerCase().startsWith('where') || h.text.toLowerCase().startsWith('is ') || h.text.toLowerCase().startsWith('are ') || h.text.toLowerCase().startsWith('can ') || h.text.toLowerCase().startsWith('do '));

  if (questions.length < 2) return null;

  // Extract answer text for each question heading
  const faqItems = [];
  for (const q of questions) {
    const regex = new RegExp(`<h2[^>]*id="${q.id}"[^>]*>.*?<\/h2>\\s*(<p>.*?<\/p>)`, 'is');
    const match = content.match(regex);
    if (match) {
      const answer = stripHtml(match[1]).substring(0, 300);
      if (answer.length > 20) {
        faqItems.push({
          "@type": "Question",
          "name": q.text,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": answer
          }
        });
      }
    }
  }

  if (faqItems.length < 2) return null;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems
  });
}

// ── Process video embeds ──
function processContent(content) {
  if (!content) return '';
  // Make YouTube iframes responsive
  let processed = content.replace(
    /<div class="video-container">/g,
    '<div class="video-container aspect-video">'
  );
  // Clean up any WordPress shortcodes
  processed = processed.replace(/\[subcategory[^\]]*\]/g, '');
  processed = processed.replace(/\[caption[^\]]*\](.*?)\[\/caption\]/gs, '$1');
  return processed;
}

// ── Streaming XML Parser ──
function parseXML() {
  return new Promise((resolve, reject) => {
    const parser = sax.createStream(false, {
      lowercase: true,
      normalize: true,
      trim: false
    });

    let currentPath = [];
    let currentText = '';
    let currentItem = null;
    let currentMeta = null;
    let inItem = false;
    let inCategory = false;
    let inAuthor = false;
    let currentCat = {};
    let currentAuthor = {};
    let catMetas = [];
    let postCount = 0;

    parser.on('opentag', (node) => {
      currentPath.push(node.name);
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
        catMetas = [];
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

    parser.on('text', (text) => {
      currentText += text;
    });

    parser.on('cdata', (cdata) => {
      currentText += cdata;
    });

    parser.on('closetag', (tag) => {
      const text = currentText.trim();

      if (inAuthor) {
        if (tag === 'wp:author_id') currentAuthor.id = text;
        else if (tag === 'wp:author_login') currentAuthor.login = text;
        else if (tag === 'wp:author_email') currentAuthor.email = text;
        else if (tag === 'wp:author_display_name') currentAuthor.displayName = text;
        else if (tag === 'wp:author') {
          inAuthor = false;
          if (currentAuthor.login) {
            authors[currentAuthor.login] = currentAuthor;
          }
        }
      }

      if (inCategory && !inItem) {
        if (tag === 'wp:category_nicename') currentCat.slug = text;
        else if (tag === 'wp:cat_name') currentCat.name = text;
        else if (tag === 'wp:category_parent') currentCat.parent = text;
        else if (tag === 'wp:category_description') currentCat.description = text;
        else if (tag === 'wp:category') {
          inCategory = false;
          if (currentCat.slug) {
            categories.push(currentCat);
          }
        }
      }

      if (inItem) {
        if (tag === 'title') currentItem.title = text;
        else if (tag === 'link') currentItem.link = text;
        else if (tag === 'dc:creator') currentItem.author = text;
        else if (tag === 'content:encoded') currentItem.content = currentText; // don't trim content
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
          else if (tag === 'wp:meta_value') currentMeta.value = currentText; // don't trim meta values
          else if (tag === 'wp:postmeta') {
            if (currentMeta.key) {
              currentItem.metas[currentMeta.key] = currentMeta.value;
            }
            currentMeta = null;
          }
        }
        else if (tag === 'item') {
          inItem = false;
          if (currentItem.status === 'publish') {
            // Resolve author display name
            const authorData = authors[currentItem.author];
            currentItem.authorDisplay = authorData ? authorData.displayName : currentItem.author;

            if (currentItem.postType === 'post') {
              posts.push(currentItem);
              postCount++;
              if (postCount % 500 === 0) {
                process.stdout.write(`\r  Parsed ${postCount} posts...`);
              }
            } else if (currentItem.postType === 'page') {
              pages.push(currentItem);
            }
          }
        }
      }

      currentPath.pop();
      currentText = '';
    });

    parser.on('error', (err) => {
      // SAX can be noisy with malformed XML, continue
      parser._parser.error = null;
      parser._parser.resume();
    });

    parser.on('end', () => {
      console.log(`\n  Total posts: ${posts.length}`);
      console.log(`  Total pages: ${pages.length}`);
      console.log(`  Total categories: ${categories.length}`);
      console.log(`  Total authors: ${Object.keys(authors).length}`);
      resolve();
    });

    console.log('Parsing WordPress XML export...');
    const stream = fs.createReadStream(XML_PATH, { encoding: 'utf8', highWaterMark: 64 * 1024 });
    stream.pipe(parser);

    stream.on('error', reject);
  });
}

// ── Build category map ──
function buildCategoryMap() {
  const map = {};
  for (const cat of categories) {
    map[cat.slug] = cat;
  }
  return map;
}

function getCategoryHierarchy(catSlug, catMap) {
  const chain = [];
  let current = catSlug;
  while (current && catMap[current]) {
    chain.unshift(catMap[current]);
    current = catMap[current].parent;
  }
  return chain;
}

// ── Ensure directory ──
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ── Generate static site ──
async function build() {
  console.log('=== TravelAsker Static Site Generator ===\n');

  // Parse XML
  await parseXML();

  const catMap = buildCategoryMap();

  // Load templates
  const headerTpl = loadTemplate('header');
  const footerTpl = loadTemplate('footer');
  const postTpl = loadTemplate('post');
  const categoryTpl = loadTemplate('category');
  const homeTpl = loadTemplate('home');

  // Clean dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  ensureDir(DIST);

  // Copy static assets
  const assetsDir = path.join(__dirname, 'assets');
  if (fs.existsSync(assetsDir)) {
    copyDir(assetsDir, path.join(DIST, 'assets'));
  }
  ensureDir(path.join(DIST, 'assets'));

  // ── Generate post pages ──
  console.log('\nGenerating post pages...');
  let generated = 0;

  for (const post of posts) {
    if (!post.slug) continue;

    const postDir = path.join(DIST, post.slug);
    ensureDir(postDir);

    // Process content
    let content = processContent(post.content);
    content = addHeadingIds(content);
    const headings = generateTOC(content);
    const tocHtml = buildTOCHtml(headings);

    // Insert TOC after first paragraph or first heading
    const firstH2 = content.indexOf('<h2');
    if (tocHtml && firstH2 > -1) {
      content = content.substring(0, firstH2) + tocHtml + content.substring(firstH2);
    }

    // Category info
    const postCats = post.categories.map(slug => catMap[slug]).filter(Boolean);
    const primaryCat = postCats[0] || { slug: 'travel-destinations', name: 'Travel Destinations' };
    const catHierarchy = getCategoryHierarchy(primaryCat.slug, catMap);

    // Breadcrumbs
    const breadcrumbItems = [{ name: 'Home', url: SITE_URL }];
    for (const c of catHierarchy) {
      breadcrumbItems.push({ name: c.name, url: `${SITE_URL}/category/${c.slug}/` });
    }
    breadcrumbItems.push({ name: post.title, url: `${SITE_URL}/${post.slug}/` });

    let breadcrumbHtml = '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>';
    breadcrumbItems.forEach((item, i) => {
      const isLast = i === breadcrumbItems.length - 1;
      if (isLast) {
        breadcrumbHtml += `<li><span>${escapeHtml(item.name)}</span></li>`;
      } else {
        breadcrumbHtml += `<li><a href="${item.url}">${escapeHtml(item.name)}</a></li>`;
      }
    });
    breadcrumbHtml += '</ol></nav>';

    // Schema
    const schemas = [
      `<script type="application/ld+json">${articleSchema(post, catMap)}</script>`,
      `<script type="application/ld+json">${breadcrumbSchema(breadcrumbItems)}</script>`
    ];

    const faq = faqSchema(headings, content);
    if (faq) {
      schemas.push(`<script type="application/ld+json">${faq}</script>`);
    }

    // Tags HTML
    const tagsHtml = post.tags.length > 0
      ? '<div class="post-tags">' + post.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') + '</div>'
      : '';

    // Category links HTML
    const catLinksHtml = postCats.map(c =>
      `<a href="/category/${c.slug}/" class="category-link">${escapeHtml(c.name)}</a>`
    ).join('');

    // Build page
    let html = postTpl
      .replace(/{{TITLE}}/g, escapeHtml(post.title))
      .replace(/{{META_DESCRIPTION}}/g, escapeHtml(stripHtml(post.excerpt).substring(0, 160)))
      .replace(/{{CANONICAL_URL}}/g, `${SITE_URL}/${post.slug}/`)
      .replace(/{{OG_TITLE}}/g, escapeHtml(post.title) + ' - ' + SITE_NAME)
      .replace(/{{OG_DESCRIPTION}}/g, escapeHtml(stripHtml(post.excerpt).substring(0, 160)))
      .replace(/{{OG_URL}}/g, `${SITE_URL}/${post.slug}/`)
      .replace(/{{SCHEMA_MARKUP}}/g, schemas.join('\n'))
      .replace(/{{HEADER}}/g, headerTpl)
      .replace(/{{FOOTER}}/g, footerTpl)
      .replace(/{{BREADCRUMBS}}/g, breadcrumbHtml)
      .replace(/{{POST_TITLE}}/g, post.title)
      .replace(/{{POST_DATE}}/g, formatDate(post.dateGmt))
      .replace(/{{POST_DATE_ISO}}/g, isoDate(post.dateGmt))
      .replace(/{{POST_AUTHOR}}/g, escapeHtml(post.authorDisplay))
      .replace(/{{POST_CONTENT}}/g, content)
      .replace(/{{POST_CATEGORIES}}/g, catLinksHtml)
      .replace(/{{POST_TAGS}}/g, tagsHtml)
      .replace(/{{POST_SLUG}}/g, post.slug);

    fs.writeFileSync(path.join(postDir, 'index.html'), html, 'utf8');
    generated++;
    if (generated % 500 === 0) {
      process.stdout.write(`\r  Generated ${generated}/${posts.length} posts...`);
    }
  }
  console.log(`\n  Generated ${generated} post pages`);

  // ── Generate category pages ──
  console.log('Generating category pages...');
  // Group posts by category
  const postsByCat = {};
  for (const post of posts) {
    for (const catSlug of post.categories) {
      if (!postsByCat[catSlug]) postsByCat[catSlug] = [];
      postsByCat[catSlug].push(post);
    }
  }

  // Sort posts within each category by date (newest first)
  for (const slug in postsByCat) {
    postsByCat[slug].sort((a, b) => new Date(b.dateGmt) - new Date(a.dateGmt));
  }

  for (const cat of categories) {
    const catDir = path.join(DIST, 'category', cat.slug);
    ensureDir(catDir);

    const catPosts = postsByCat[cat.slug] || [];
    const hierarchy = getCategoryHierarchy(cat.slug, catMap);

    // Subcategories
    const subcats = categories.filter(c => c.parent === cat.slug);

    // Breadcrumbs
    const breadcrumbItems = [{ name: 'Home', url: SITE_URL }];
    for (const c of hierarchy) {
      breadcrumbItems.push({ name: c.name, url: `${SITE_URL}/category/${c.slug}/` });
    }

    let breadcrumbHtml = '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>';
    breadcrumbItems.forEach((item, i) => {
      const isLast = i === breadcrumbItems.length - 1;
      if (isLast) {
        breadcrumbHtml += `<li><span>${escapeHtml(item.name)}</span></li>`;
      } else {
        breadcrumbHtml += `<li><a href="${item.url}">${escapeHtml(item.name)}</a></li>`;
      }
    });
    breadcrumbHtml += '</ol></nav>';

    // Schema
    const catSchemas = [
      `<script type="application/ld+json">${breadcrumbSchema(breadcrumbItems)}</script>`
    ];

    // Subcategory HTML
    let subcatHtml = '';
    if (subcats.length > 0) {
      subcatHtml = '<div class="subcategories-grid">';
      for (const sc of subcats) {
        subcatHtml += `<a href="/category/${sc.slug}/" class="subcategory-card"><span class="subcategory-name">${escapeHtml(sc.name)}</span></a>`;
      }
      subcatHtml += '</div>';
    }

    // Post list HTML
    let postListHtml = '';
    const displayPosts = catPosts.slice(0, 100); // paginate later if needed
    for (const p of displayPosts) {
      const pExcerpt = stripHtml(p.excerpt).substring(0, 160);
      postListHtml += `
        <article class="post-card">
          <a href="/${p.slug}/" class="post-card-link">
            <h3 class="post-card-title">${escapeHtml(p.title)}</h3>
            <p class="post-card-excerpt">${escapeHtml(pExcerpt)}</p>
            <div class="post-card-meta">
              <time datetime="${isoDate(p.dateGmt)}">${formatDate(p.dateGmt)}</time>
              <span class="post-card-author">by ${escapeHtml(p.authorDisplay)}</span>
            </div>
          </a>
        </article>`;
    }

    // Clean description (remove shortcodes)
    const catDesc = (cat.description || '').replace(/\[subcategory[^\]]*\]/g, '').trim();

    let html = categoryTpl
      .replace(/{{TITLE}}/g, escapeHtml(cat.name))
      .replace(/{{META_DESCRIPTION}}/g, escapeHtml(stripHtml(catDesc).substring(0, 160)))
      .replace(/{{CANONICAL_URL}}/g, `${SITE_URL}/category/${cat.slug}/`)
      .replace(/{{OG_TITLE}}/g, escapeHtml(cat.name) + ' - ' + SITE_NAME)
      .replace(/{{OG_DESCRIPTION}}/g, escapeHtml(stripHtml(catDesc).substring(0, 160)))
      .replace(/{{OG_URL}}/g, `${SITE_URL}/category/${cat.slug}/`)
      .replace(/{{SCHEMA_MARKUP}}/g, catSchemas.join('\n'))
      .replace(/{{HEADER}}/g, headerTpl)
      .replace(/{{FOOTER}}/g, footerTpl)
      .replace(/{{BREADCRUMBS}}/g, breadcrumbHtml)
      .replace(/{{CATEGORY_NAME}}/g, cat.name)
      .replace(/{{CATEGORY_DESCRIPTION}}/g, catDesc ? `<p class="category-description">${catDesc}</p>` : '')
      .replace(/{{SUBCATEGORIES}}/g, subcatHtml)
      .replace(/{{POST_LIST}}/g, postListHtml)
      .replace(/{{POST_COUNT}}/g, String(catPosts.length));

    fs.writeFileSync(path.join(catDir, 'index.html'), html, 'utf8');
  }
  console.log(`  Generated ${categories.length} category pages`);

  // ── Generate homepage ──
  console.log('Generating homepage...');

  // Recent posts (newest first)
  const recentPosts = [...posts].sort((a, b) => new Date(b.dateGmt) - new Date(a.dateGmt)).slice(0, 12);

  let recentPostsHtml = '';
  for (const p of recentPosts) {
    const pExcerpt = stripHtml(p.excerpt).substring(0, 140);
    const pCats = p.categories.map(slug => catMap[slug]).filter(Boolean);
    const pCat = pCats[0];
    recentPostsHtml += `
      <article class="post-card">
        <a href="/${p.slug}/" class="post-card-link">
          ${pCat ? `<span class="post-card-category">${escapeHtml(pCat.name)}</span>` : ''}
          <h3 class="post-card-title">${escapeHtml(p.title)}</h3>
          <p class="post-card-excerpt">${escapeHtml(pExcerpt)}</p>
          <div class="post-card-meta">
            <time datetime="${isoDate(p.dateGmt)}">${formatDate(p.dateGmt)}</time>
          </div>
        </a>
      </article>`;
  }

  // Top-level continent categories
  const continentSlugs = ['europe', 'north-america', 'caribbean', 'central-south-america', 'africa-and-middle-east', 'asia-and-pacific'];
  let continentsHtml = '';
  const continentIcons = {
    'europe': '🏰',
    'north-america': '🗽',
    'caribbean': '🏝️',
    'central-south-america': '🌎',
    'africa-and-middle-east': '🌍',
    'asia-and-pacific': '⛩️'
  };

  for (const slug of continentSlugs) {
    const cat = catMap[slug];
    if (!cat) continue;
    const count = (postsByCat[slug] || []).length;
    const subcats = categories.filter(c => c.parent === slug).slice(0, 6);
    const subcatLinks = subcats.map(sc =>
      `<a href="/category/${sc.slug}/" class="continent-sublink">${escapeHtml(sc.name)}</a>`
    ).join('');

    continentsHtml += `
      <a href="/category/${slug}/" class="continent-card">
        <span class="continent-icon">${continentIcons[slug] || '🌏'}</span>
        <h3 class="continent-name">${escapeHtml(cat.name)}</h3>
        <p class="continent-count">${count} articles</p>
        <div class="continent-subcats">${subcatLinks}</div>
      </a>`;
  }

  // Homepage schema
  const homeSchemas = [
    `<script type="application/ld+json">${websiteSchema()}</script>`,
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": `${SITE_URL}/assets/logo.png`,
      "sameAs": []
    })}</script>`
  ];

  let homeHtml = homeTpl
    .replace(/{{TITLE}}/g, SITE_NAME + ' - Travel Guides by Locals &amp; Experts')
    .replace(/{{META_DESCRIPTION}}/g, 'Maximize your travel with travel advice, guides, reviews, and more from TravelAsker. Explore tourist attractions around the world!')
    .replace(/{{CANONICAL_URL}}/g, SITE_URL + '/')
    .replace(/{{OG_TITLE}}/g, SITE_NAME + ' - Travel Guides by Locals &amp; Experts')
    .replace(/{{OG_DESCRIPTION}}/g, 'Maximize your travel with travel advice, guides, reviews, and more from TravelAsker.')
    .replace(/{{OG_URL}}/g, SITE_URL + '/')
    .replace(/{{SCHEMA_MARKUP}}/g, homeSchemas.join('\n'))
    .replace(/{{HEADER}}/g, headerTpl)
    .replace(/{{FOOTER}}/g, footerTpl)
    .replace(/{{CONTINENTS}}/g, continentsHtml)
    .replace(/{{RECENT_POSTS}}/g, recentPostsHtml)
    .replace(/{{TOTAL_POSTS}}/g, String(posts.length));

  fs.writeFileSync(path.join(DIST, 'index.html'), homeHtml, 'utf8');
  console.log('  Generated homepage');

  // ── Generate about and contact pages ──
  for (const page of pages) {
    if (page.slug) {
      const pageDir = path.join(DIST, page.slug);
      ensureDir(pageDir);

      let pageContent = processContent(page.content);
      pageContent = addHeadingIds(pageContent);

      const breadcrumbItems = [
        { name: 'Home', url: SITE_URL },
        { name: page.title, url: `${SITE_URL}/${page.slug}/` }
      ];

      let breadcrumbHtml = '<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>';
      breadcrumbItems.forEach((item, i) => {
        const isLast = i === breadcrumbItems.length - 1;
        if (isLast) {
          breadcrumbHtml += `<li><span>${escapeHtml(item.name)}</span></li>`;
        } else {
          breadcrumbHtml += `<li><a href="${item.url}">${escapeHtml(item.name)}</a></li>`;
        }
      });
      breadcrumbHtml += '</ol></nav>';

      const pageSchemas = [
        `<script type="application/ld+json">${breadcrumbSchema(breadcrumbItems)}</script>`
      ];

      let html = postTpl
        .replace(/{{TITLE}}/g, escapeHtml(page.title))
        .replace(/{{META_DESCRIPTION}}/g, escapeHtml(stripHtml(page.excerpt || page.content).substring(0, 160)))
        .replace(/{{CANONICAL_URL}}/g, `${SITE_URL}/${page.slug}/`)
        .replace(/{{OG_TITLE}}/g, escapeHtml(page.title) + ' - ' + SITE_NAME)
        .replace(/{{OG_DESCRIPTION}}/g, escapeHtml(stripHtml(page.excerpt || page.content).substring(0, 160)))
        .replace(/{{OG_URL}}/g, `${SITE_URL}/${page.slug}/`)
        .replace(/{{SCHEMA_MARKUP}}/g, pageSchemas.join('\n'))
        .replace(/{{HEADER}}/g, headerTpl)
        .replace(/{{FOOTER}}/g, footerTpl)
        .replace(/{{BREADCRUMBS}}/g, breadcrumbHtml)
        .replace(/{{POST_TITLE}}/g, page.title)
        .replace(/{{POST_DATE}}/g, '')
        .replace(/{{POST_DATE_ISO}}/g, '')
        .replace(/{{POST_AUTHOR}}/g, '')
        .replace(/{{POST_CONTENT}}/g, pageContent)
        .replace(/{{POST_CATEGORIES}}/g, '')
        .replace(/{{POST_TAGS}}/g, '')
        .replace(/{{POST_SLUG}}/g, page.slug);

      fs.writeFileSync(path.join(pageDir, 'index.html'), html, 'utf8');
    }
  }
  console.log(`  Generated ${pages.length} pages`);

  // ── Generate sitemap ──
  console.log('Generating sitemap...');
  generateSitemap(catMap);

  // ── Generate robots.txt ──
  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  fs.writeFileSync(path.join(DIST, 'robots.txt'), robotsTxt, 'utf8');
  console.log('  Generated robots.txt');

  console.log('\n=== Build complete! ===');
  console.log(`Output: ${DIST}`);
}

// ── Sitemap generator ──
function generateSitemap(catMap) {
  const URLS_PER_SITEMAP = 1000;

  // Sort posts by modified date (newest first) to match original
  const sortedPosts = [...posts].sort((a, b) => new Date(b.modifiedGmt || b.dateGmt) - new Date(a.modifiedGmt || a.dateGmt));

  // Split into sub-sitemaps
  const totalSitemaps = Math.ceil(sortedPosts.length / URLS_PER_SITEMAP);

  for (let i = 0; i < totalSitemaps; i++) {
    const chunk = sortedPosts.slice(i * URLS_PER_SITEMAP, (i + 1) * URLS_PER_SITEMAP);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const post of chunk) {
      const lastmod = isoDate(post.modifiedGmt || post.dateGmt);
      xml += `\t<url>\n\t\t<loc>${SITE_URL}/${post.slug}/</loc>\n`;
      if (lastmod) xml += `\t\t<lastmod>${lastmod}</lastmod>\n`;
      xml += `\t</url>\n`;
    }

    xml += '</urlset>';
    fs.writeFileSync(path.join(DIST, `post-sitemap${i + 1}.xml`), xml, 'utf8');
  }

  // Category sitemap
  let catXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  catXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const cat of categories) {
    catXml += `\t<url>\n\t\t<loc>${SITE_URL}/category/${cat.slug}/</loc>\n\t</url>\n`;
  }
  catXml += '</urlset>';
  fs.writeFileSync(path.join(DIST, 'category-sitemap.xml'), catXml, 'utf8');

  // Sitemap index
  let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (let i = 1; i <= totalSitemaps; i++) {
    indexXml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/post-sitemap${i}.xml</loc>\n\t</sitemap>\n`;
  }
  indexXml += `\t<sitemap>\n\t\t<loc>${SITE_URL}/category-sitemap.xml</loc>\n\t</sitemap>\n`;
  indexXml += '</sitemapindex>';
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), indexXml, 'utf8');

  console.log(`  Generated sitemap index + ${totalSitemaps} post sitemaps + 1 category sitemap`);
}

// ── Copy directory ──
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
