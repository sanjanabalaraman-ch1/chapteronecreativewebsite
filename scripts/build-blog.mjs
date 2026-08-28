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
const ICONS = {
  pricing: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v10"></path><path d="M14.5 9.3A2.8 2.8 0 0 0 12 8c-1.6 0-2.8.9-2.8 2s1.2 2 2.8 2 2.8.9 2.8 2-1.2 2-2.8 2a2.8 2.8 0 0 1-2.5-1.3"></path>',
  'content marketing': '<path d="M17 12.5a2 2 0 0 1-2 2H8l-3.5 3.5V5.5a2 2 0 0 1 2-2H15a2 2 0 0 1 2 2v7Z"></path><path d="M20 8.5a2 2 0 0 1 1.5 2v9L18.5 17H11"></path>',
  messaging: '<path d="M4 20h4L20 8a2.83 2.83 0 0 0-4-4L4 16v4Z"></path><path d="M14.5 5.5 18.5 9.5"></path>',
  positioning: '<circle cx="12" cy="12" r="9"></circle><path d="M15.6 8.4 13.1 13.1 8.4 15.6 10.9 10.9 15.6 8.4Z"></path>',
  'personal note': '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M3 10h18"></path><path d="M8 3v4M16 3v4"></path>',
  _default: '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M3 9h18"></path><path d="M6.5 6.5h.01M9 6.5h.01"></path>'
};
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

const iconFor = t => ICONS[(t || '').trim().toLowerCase()] || ICONS._default;
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
<div class="cover-top"><span class="cover-no">${no}</span>${svg(iconFor(p.category))}</div>
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

const res = await fetch(FEED, { headers: { 'user-agent': 'chapterone-blog-build' } });
if (!res.ok) throw new Error(`Feed request failed: ${res.status} ${res.statusText}`);

const posts = parseFeed(await res.text()).slice(0, MAX_POSTS);
if (!posts.length) throw new Error('Feed parsed but contained no posts — refusing to blank the page');

const [lead, ...rest] = posts;
const block = `\n${card(lead, 0, true)}\n\n<div class="post-grid">\n${[...rest.map((p, i) => card(p, i + 1, false)), archiveCard()].join('\n\n')}\n</div>\n`;
const count = `${WORDS[posts.length] || posts.length} post${posts.length === 1 ? '' : 's'}`;

let html = await readFile(TARGET, 'utf8');
html = replaceBlock(html, 'POSTS', block);
html = replaceBlock(html, 'COUNT', count);
await writeFile(TARGET, html);

console.log(`blog/index.html updated — ${posts.length} post(s):`);
posts.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2, '0')}  ${p.date.padEnd(9)} ${p.category.padEnd(20)} ${p.title}`));
