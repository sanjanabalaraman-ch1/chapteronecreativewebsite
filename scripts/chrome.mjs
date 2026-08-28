import { readFile, writeFile } from 'node:fs/promises';

// ============================================================
// Single source of truth for the site chrome (nav + footer).
// Edit NAV / FOOTER below, then run:  node scripts/chrome.mjs
// The "Refresh blog posts" Action runs this too, so index.html
// and blog/index.html never drift out of sync. Links are root-
// absolute (/#..., /blog/) so the same markup works on any page.
// ============================================================

const NAV = `<nav>
<div class="nav-inner">
<a class="wordmark" href="/#hero"><span class="top">ChapterOne</span><span class="bot">CREATIVE</span></a>
<div class="nav-links">
<a href="/#what-i-do">3 ways to work</a>
<a href="/blog/">Blog</a>
<a href="/#changes">Impact</a>
<a href="/#about">About</a>
<a href="mailto:sanjana@chapteronecreative.io?subject=Starting%20a%20conversation" class="nav-cta">Get in touch<span class="icon i-16"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15"></path><path d="m13.5 6.5 5.5 5.5-5.5 5.5"></path></g></svg></span></a>
</div>
</div>
</nav>`;

const FOOTER = `<footer>
<div class="footer-inner">
<div class="footer-top">
<div>
<a class="wordmark" href="/#hero"><span class="top">ChapterOne</span><span class="bot">CREATIVE</span></a>
<p class="footer-tag">A narrative-led content consultancy for B2B founders and marketing teams.</p>
</div>
<div class="footer-cols">
<div class="footer-col">
<h4>Pages</h4>
<a href="/#what-i-do">3 ways to work</a>
<a href="/blog/">Blog</a>
<a href="/#changes">Impact</a>
<a href="/#about">About</a>
</div>
<div class="footer-col">
<h4>Contact</h4>
<a href="mailto:sanjana@chapteronecreative.io"><span class="icon i-16"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-11Z"></path><path d="m3.5 6.8 8.5 6 8.5-6"></path></g></svg></span>sanjana@chapteronecreative.io</a>
<a href="https://www.linkedin.com/in/sanjana-balaraman/" target="_blank" rel="noopener"><span class="icon i-16"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2.75"></rect><path d="M8 10.75v5.75"></path><circle cx="8" cy="7.9" r="0.75"></circle><path d="M11.9 16.5v-5.75"></path><path d="M11.9 13.4a2.3 2.3 0 0 1 4.6 0v3.1"></path></g></svg></span>LinkedIn</a>
</div>
</div>
</div>
<div class="footer-bottom">
<span>&copy; 2026 ChapterOne Creative</span>
<span class="ink-spots" aria-hidden="true"><span style="background:#D3A6BB"></span><span style="background:#3A9470"></span><span style="background:#C7BAE4"></span><span style="background:#E8D3A8"></span></span>
<span>Story first.</span>
</div>
</div>
</footer>`;

const PAGES = ['index.html', 'blog/index.html'];

function inject(html, name, body) {
  const re = new RegExp('(<!--' + name + ':START-->)[^]*?(<!--' + name + ':END-->)');
  if (!re.test(html)) throw new Error(name + ' markers not found in a page');
  return html.replace(re, '$1\n' + body + '\n$2');
}

for (const page of PAGES) {
  let html = await readFile(page, 'utf8');
  html = inject(html, 'NAV', NAV);
  html = inject(html, 'FOOTER', FOOTER);
  await writeFile(page, html);
  console.log('chrome synced ->', page);
}
