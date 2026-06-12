# How to publish your website (one-time setup)

Your site is ready to go live. These are the one-time steps to put it on the
internet for free, with your own domain (chapteronecreative.io) and HTTPS.

You only do this **once**. After that, every edit you make (see `EDITING.md`)
publishes automatically.

---

## Step 1 — Get the code onto GitHub

1. Create a free account at **github.com** if you don't have one.
2. Create a new **repository** (call it anything, e.g. `chapterone-site`).
   Set it to **Public**.
3. Upload these files/folders into it (drag-and-drop on GitHub works):
   - `index.html`
   - `styles.css`
   - the `assets/` folder (with your two photos)
   - `.nojekyll`
   - `EDITING.md` and `DEPLOY.md` (optional, just your guides)

   You can skip the `project/` and `chats/` folders — they're design history,
   not part of the live site. (Keeping them does no harm either.)

---

## Step 2 — Turn on GitHub Pages

1. In your repository, go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Pick branch **main** and folder **/ (root)**. Click **Save**.
4. Wait ~1 minute. GitHub shows a live link like
   `https://yourname.github.io/chapterone-site/` — your site is live!

---

## Step 3 — Connect your custom domain (chapteronecreative.io)

1. In **Settings → Pages → Custom domain**, type `chapteronecreative.io` and save.
2. Go to wherever you bought the domain (your registrar) and add these DNS records:
   - Four **A records** for `@` pointing to GitHub's IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - One **CNAME record** for `www` pointing to `yourname.github.io`
3. Back on GitHub, tick **Enforce HTTPS** once it becomes available
   (can take up to a few hours for the secure padlock to activate).

If the DNS step feels daunting, your domain registrar's support can add those
records for you in a couple of minutes — just give them the list above.

---

## Alternative hosts (also free)

If you'd rather use a nicer dashboard, **Cloudflare Pages** or **Netlify** both
connect to the same GitHub repo, deploy automatically, and handle the custom
domain + HTTPS for you. Any of the three works — GitHub Pages is just the
fewest moving parts.

---

## Updating after launch

Once this is set up, you never repeat it. To change the site, just edit
`index.html` on GitHub (see `EDITING.md`) — it republishes on its own.
