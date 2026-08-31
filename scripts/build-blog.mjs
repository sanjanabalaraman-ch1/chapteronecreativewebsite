// Regenerates the post cards in blog/index.html from the Substack RSS feed.
// Node 18+, no dependencies. Run: node scripts/build-blog.mjs
//
// Design rules encoded here (see blog.css):
//   · newest post is the featured card, always mauve
//   · the rest rotate mauve → green → lavender by position
//   · sand is reserved for the static archive card
//   · icon comes from the post's first Substack tag; ghost numeral is its position
// Everything between <!--POSTS:START--> and <!--POSTS:END--> is machine-written.
// Edit the markup in this file, not in blog/index.html.

import { readFile, writeFile } from 'node:fs/promises';

const FEED = process.env.SUBSTACK_FEED || 'https://chapteronecreative.substack.com/feed';
const PROFILE = process.env.SUBSTACK_PROFILE || 'https://chapteronecreative.substack.com/';
const TARGET = new URL('../blog/index.html', import.meta.url);
const MAX_POSTS = Number(process.env.MAX_POSTS || 6);   // featured + grid
const SUMMARY_MAX = 150;

const FAMILIES = ['mauve', 'green', 'lavender'];
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

// Brand icon set — 24px grid, 1.25px stroke. Keys are matched against the post's tag.
// Icon inner-shapes from the design-system icon pack (24px grid, 1.25 stroke;
// they inherit currentColor from the wrapping <g>).
const ICON = {
  article:    '<rect x="3" y="4" width="18" height="16" rx="1.5"></rect><path d="M6.5 8h5v4h-5z"></path><path d="M14 8h3.5M14 11h3.5M6.5 15h11"></path>',
  newsletter: '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3.5 6.5 8.5 6.5 8.5-6.5"></path>',
  scale:      '<path d="M12 4v16M7 20h10"></path><path d="M4 9h16"></path><path d="M4 9 1.8 14a3 3 0 0 0 4.4 0L4 9Z"></path><path d="M20 9l-2.2 5a3 3 0 0 0 4.4 0L20 9Z"></path>',
  target:     '<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1.3"></circle>',
  bookmark:   '<path d="M6.5 3h11v18l-5.5-4.5L6.5 21V3Z"></path>',
  book:       '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5v-15Z"></path><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"></path><path d="M8 7.5h7"></path>',
  pen:        '<path d="M4 20h4L20 8a2.83 2.83 0 0 0-4-4L4 16v4Z"></path><path d="M14.5 5.5 18.5 9.5"></path>',
  sparkle:    '<path d="M10.5 3.5c.95 4.35 2.4 5.8 6.75 6.75-4.35.95-5.8 2.4-6.75 6.75-.95-4.35-2.4-5.8-6.75-6.75 4.35-.95 5.8-2.4 6.75-6.75Z"></path><path d="M18.6 15.4c.36 1.72.92 2.28 2.64 2.64-1.72.36-2.28.92-2.64 2.64-.36-1.72-.92-2.28-2.64-2.64 1.72-.36 2.28-.92 2.64-2.64Z"></path>',
  compass:    '<circle cx="12" cy="12" r="9"></circle><path d="M15.6 8.4 13.1 13.1 8.4 15.6 10.9 10.9 15.6 8.4Z"></path>',
  funnel:     '<path d="M3.5 4.5h17L14 12.5V20l-4-2v-5.5L3.5 4.5Z"></path>',
  megaphone:  '<path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H8l6 4V6.5l-6 4H5.5A1.5 1.5 0 0 0 4 12Z"></path><path d="M17.5 9.5a4 4 0 0 1 0 5"></path>',
  microphone: '<rect x="9.5" y="3" width="5" height="10" rx="2.5"></rect><path d="M6 11.5a6 6 0 0 0 12 0"></path><path d="M12 17.5V21"></path>',
  award:      '<circle cx="12" cy="9" r="5.5"></circle><path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7"></path>',
  quote:      '<path d="M9.5 6.5C7 7.8 5.5 10 5.5 12.8c0 2.4 1.4 4 3.3 4 1.7 0 3-1.2 3-2.9 0-1.6-1.1-2.8-2.7-2.8-.3 0-.6 0-.9.1.3-1.5 1.3-2.7 2.7-3.5Z"></path><path d="M18.5 6.5c-2.5 1.3-4 3.5-4 6.3 0 2.4 1.4 4 3.3 4 1.7 0 3-1.2 3-2.9 0-1.6-1.1-2.8-2.7-2.8-.3 0-.6 0-.9.1.3-1.5 1.3-2.7 2.7-3.5Z"></path>',
  people:     '<circle cx="9.2" cy="8" r="3.2"></circle><path d="M3 19.5a6.2 6.2 0 0 1 12.4 0"></path><path d="M16.2 5.4a3.2 3.2 0 0 1 0 6.4"></path><path d="M17.4 14a6.2 6.2 0 0 1 3.6 5.5"></path>',
  chartUp:    '<path d="M3 20h18"></path><path d="m5 15 4.5-5 3.5 3 6-7"></path><path d="M14.5 6H19v4.5"></path>',
  search:     '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 4.5 4.5"></path>',
  video:      '<rect x="3" y="6" width="12" height="12" rx="2"></rect><path d="M15 10.5 21 7.5v9L15 13.5Z"></path>',
  briefcase:  '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2"></path><path d="M3 12.5h18"></path>',
  lightbulb:  '<path d="M9 16.5a6 6 0 1 1 6 0v1.5H9v-1.5Z"></path><path d="M10 21h4"></path>',
};

// Exact Substack tag (lowercased) -> icon. Reliable when a post is tagged.
const TAG_ICON = {
  'pricing': 'scale', 'content marketing': 'newsletter', 'content': 'newsletter',
  'messaging': 'target', 'positioning': 'target', 'personal note': 'bookmark',
  'narrative': 'book', 'storytelling': 'book', 'writing': 'pen', 'ai': 'sparkle',
  'strategy': 'compass', 'sales': 'funnel', 'social media': 'megaphone',
  'podcast': 'microphone', 'branding': 'award', 'customer stories': 'quote',
};

// Fallback when there's no matching tag: scan tag + title for a keyword.
// First match wins, so order specific -> general. Keys are substrings; the
// text is space-padded, so a leading/trailing space acts as a word boundary.
const KEYWORD_ICON = [
  [['narrative', 'storytell', ' story', 'stories', ' book'], 'book'],
  [['pric', 'value', 'worth', 'rate card', 'charge', 'justif', ' fee'], 'scale'],
  [[' ai', 'ai ', 'a.i', 'artificial intelligence', 'chatgpt', ' gpt', 'llm', 'genai', 'gen ai', 'automation', 'the machine', 'slop'], 'sparkle'],
  [['podcast', 'audio '], 'microphone'],
  [['webinar', 'video', 'youtube'], 'video'],
  [['ghostwrit', 'copywrit', 'writing', 'writer', ' write ', 'draft', 'prose', 'essay', 'editing'], 'pen'],
  [['newsletter', ' email', 'inbox'], 'newsletter'],
  [['linkedin', 'social media', ' social ', ' feed'], 'megaphone'],
  [['branding', ' brand ', 'rebrand'], 'award'],
  [['messag', 'position', 'homepage', 'website copy', 'landing page', 'headline', 'tagline', 'value prop'], 'target'],
  [['strateg', ' plan', 'roadmap', 'framework'], 'compass'],
  [['presales', 'pmm', 'gtm', 'pipeline', 'demand', 'funnel', ' leads', 'outbound', 'inbound', 'prospect', ' deal', 'sales '], 'funnel'],
  [['customer stor', 'case stud', 'testimonial', 'proof'], 'quote'],
  [['founder', 'entrepreneur', 'journey', 'personal', 'monday', 'leaving', 'solo', 'freelanc', 'quit'], 'bookmark'],
  [['audience', 'community', ' team ', 'people', 'hiring', 'colleague'], 'people'],
  [['growth', 'metric', 'result', ' roi', 'convert', 'conversion', ' revenue'], 'chartUp'],
  [[' seo', 'search ', 'discover', 'ranking'], 'search'],
  [[' idea', 'lesson', 'learned', 'learning', 'insight'], 'lightbulb'],
  [['content', 'marketing'], 'newsletter'],
  [['career', ' job', ' work', 'business'], 'briefcase'],
];
const ARROW = '<path d="M4 12h15"></path><path d="m13.5 6.5 5.5 5.5-5.5 5.5"></path>';

const svg = (paths, cls = 'icon') =>
  `<span class="${cls}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg></span>`;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unwrap = s => (s || '').replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? unwrap(m[1]) : '';
};
const allTags = (xml, name) => [...xml.matchAll(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'gi'))].map(m => unwrap(m[1]));

const decode = s => s
  .replace(/&nbsp;/g, ' ').replace(/&#8217;|&rsquo;/g, '\u2019').replace(/&#8216;|&lsquo;/g, '\u2018')
  .replace(/&#8220;|&ldquo;/g, '\u201c').replace(/&#8221;|&rdquo;/g, '\u201d')
  .replace(/&#8212;|&mdash;/g, '\u2014').replace(/&#8211;|&ndash;/g, '\u2013')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const strip = html => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// One or two whole sentences, never a mid-word cut.
function summarize(text) {
  if (!text) return '';
  if (text.length <= SUMMARY_MAX) return text;
  let out = '';
  for (const part of text.split(/(?<=[.?!])\s+/)) {
    if (out && (out + ' ' + part).length > SUMMARY_MAX) break;
    out = out ? out + ' ' + part : part;
    if (out.length >= SUMMARY_MAX * 0.6) break;
  }
  if (!out) out = text.slice(0, SUMMARY_MAX).replace(/\s+\S*$/, '') + '\u2026';
  return out;
}

function iconFor(post) {
  const tag = (post.category || '').trim().toLowerCase();
  if (TAG_ICON[tag]) return ICON[TAG_ICON[tag]];
  const text = ` ${tag} ${(post.title || '').toLowerCase()} `;
  for (const [keys, name] of KEYWORD_ICON) {
    if (keys.some(k => text.includes(k))) return ICON[name];
  }
  return ICON.article;
}
const monthYear = d => Number.isNaN(d.getTime()) ? '' :
  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

function parseFeed(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, item]) => {
    const body = tag(item, 'content:encoded');
    const desc = strip(tag(item, 'description'));
    return {
      title: decode(tag(item, 'title')),
      link: tag(item, 'link'),
      date: monthYear(new Date(tag(item, 'pubDate'))),
      category: allTags(item, 'category')[0] || '',
      summary: summarize(desc || strip(body))
    };
  }).filter(p => p.title && p.link);
}

const meta = p => `<div class="post-meta">${p.category ? `<span class="post-tag">${esc(p.category)}</span>` : ''}${p.category && p.date ? '<span class="sep"></span>' : ''}${p.date ? `<span>${esc(p.date)}</span>` : ''}</div>`;

const card = (p, i, featured) => {
  const no = String(i + 1).padStart(2, '0');
  const family = featured ? 'mauve' : FAMILIES[i % FAMILIES.length];
  return `<a class="post ${featured ? 'post--feature ' : ''}post--${family} reveal" href="${esc(p.link)}" target="_blank" rel="noopener">
<div class="cover">
<div class="cover-top"><span class="cover-no">${no}</span>${svg(iconFor(p))}</div>
<span class="cover-ghost" aria-hidden="true">${no}</span>
</div>
<div class="post-body">
${meta(p)}
<h3>${esc(p.title)}</h3>
<p>${esc(p.summary)}</p>
<span class="post-foot">Read on Substack${svg(ARROW, 'icon i-16')}</span>
</div>
</a>`;
};

const archiveCard = () => `<a class="post post--more post--sand reveal" href="${esc(PROFILE)}" target="_blank" rel="noopener">
<div class="post-body">
<div class="post-meta"><span class="post-tag">The archive</span></div>
<span class="more-mark" aria-hidden="true">&amp;c.</span>
<h3>Everything else lives on Substack</h3>
<p>Older posts, the ones still in drafts, and whatever goes out next.</p>
<span class="post-foot">Open the archive${svg(ARROW, 'icon i-16')}</span>
</div>
</a>`;

function replaceBlock(html, name, body) {
  const re = new RegExp(`(<!--${name}:START-->)[\\s\\S]*?(<!--${name}:END-->)`);
  if (!re.test(html)) throw new Error(`Marker ${name} not found in blog/index.html`);
  return html.replace(re, `$1${body}$2`);
}

const BROWSER_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'accept': 'application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8, */*;q=0.7',
  'accept-language': 'en-US,en;q=0.9'
};

// Substack sits behind Cloudflare, which 403s GitHub Actions' datacenter IPs
// no matter the headers, so the feed must be fetched by something that pulls
// it server-side. Primary is rss2json (reliable, returns structured JSON);
// raw-XML readers/proxies are fallbacks; last resort keeps the current cards.
const RSS2JSON = `https://api.rss2json.com/v1/api.json?count=${MAX_POSTS + 2}&rss_url=${encodeURIComponent(FEED)}`;
const XML_SOURCES = [
  FEED,
  `https://r.jina.ai/${FEED}`,
  `https://api.allorigins.win/raw?url=${encodeURIComponent(FEED)}`,
  `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(FEED)}`,
];

function postsFromRss2Json(data) {
  return (data.items || []).map(it => ({
    title: decode(it.title || ''),
    link: it.link || '',
    date: monthYear(new Date(it.pubDate)),
    category: (it.categories && it.categories[0]) || '',
    summary: summarize(strip(it.description || it.content || '')),
  })).filter(p => p.title && p.link);
}

async function fetchPosts() {
  const errors = [];

  // 1) rss2json — server-side fetch, structured JSON, most reliable.
  try {
    const res = await fetch(RSS2JSON, { headers: BROWSER_HEADERS });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length) {
        console.log(`Feed fetched via rss2json (${data.items.length} items)`);
        return postsFromRss2Json(data);
      }
      errors.push(`rss2json -> status ${data.status || 'unknown'}, ${(data.items || []).length} items`);
    } else {
      errors.push(`rss2json -> HTTP ${res.status}`);
    }
  } catch (err) {
    errors.push(`rss2json -> ${err.message}`);
  }

  // 2) raw-XML readers/proxies.
  for (const url of XML_SOURCES) {
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      if (!res.ok) { errors.push(`${url.split('?')[0]} -> HTTP ${res.status}`); continue; }
      const xml = await res.text();
      if (/<item[\s>]/i.test(xml)) {
        console.log(`Feed fetched via ${url.split('?')[0]}`);
        return parseFeed(xml);
      }
      errors.push(`${url.split('?')[0]} -> ok but no <item> found`);
    } catch (err) {
      errors.push(`${url.split('?')[0]} -> ${err.message}`);
    }
  }

  console.warn(`Could not fetch the feed from any source:\n  ${errors.join('\n  ')}`);
  return null;
}

const allPosts = await fetchPosts();
if (!allPosts) {
  // Everything was unreachable this run — keep the existing cards rather than
  // failing the run or blanking the page. The next run will refresh.
  console.log('Feed unavailable this run — leaving blog/index.html cards unchanged.');
  process.exit(0);
}

const posts = allPosts.slice(0, MAX_POSTS);
if (!posts.length) throw new Error('Feed reached but contained no posts — refusing to blank the page');

const [lead, ...rest] = posts;
const block = `\n${card(lead, 0, true)}\n\n<div class="post-grid">\n${[...rest.map((p, i) => card(p, i + 1, false)), archiveCard()].join('\n\n')}\n</div>\n`;
const count = `${WORDS[posts.length] || posts.length} post${posts.length === 1 ? '' : 's'}`;

let html = await readFile(TARGET, 'utf8');
html = replaceBlock(html, 'POSTS', block);
html = replaceBlock(html, 'COUNT', count);
await writeFile(TARGET, html);

console.log(`blog/index.html updated — ${posts.length} post(s):`);
posts.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2, '0')}  ${p.date.padEnd(9)} ${p.category.padEnd(20)} ${p.title}`));
