# How to edit your website

Your site is two main files plus your photos:

- `index.html` — all the **words** and structure of the page
- `styles.css` — the **colors, fonts, and layout** (you normally won't touch this)
- `assets/` — your **photos**

You can edit everything from your web browser on GitHub — no software to install.
The site updates itself about a minute after you save.

---

## Changing text (the most common edit)

1. On GitHub, open the file `index.html`.
2. Click the **pencil icon ✏️** (top right) to edit.
3. Use your browser's Find (Ctrl-F / Cmd-F) to search for the words you want to change.
4. Type your new words **in place of the old ones**.
5. Scroll to the bottom and click the green **Commit changes** button.

That's it — your site updates on its own.

### The one rule: only change words, never the tags

Text is wrapped in `<tags>` that control how it looks. Change what's **between**
the tags, not the tags themselves.

✅ Safe — change only the words:

    <h3 class="sv-title">Homepage messaging</h3>
                         ^^^^^^^^^^^^^^^^^^  ← change this part

    <h3 class="sv-title">Website copy review</h3>   ← like this

❌ Don't touch the parts in angle brackets like `<h3 class="sv-title">` or `</h3>`.

If you ever delete a bracket by accident, don't panic — just click "Cancel"
instead of committing, and nothing changes. GitHub also keeps every old version,
so a broken edit can always be undone.

---

## Where to find each piece of text

Search (Ctrl-F / Cmd-F) inside `index.html` for these to jump to the right spot:

| You want to edit…              | Search for…                       |
|--------------------------------|-----------------------------------|
| The big headline               | `afterthought`                    |
| The line under the headline    | `For B2B founders`                |
| "The approach" section         | `Know what's broken`              |
| A service name or description  | `Homepage messaging`              |
| "Who this is for" section      | `Built for founders`              |
| The About / bio paragraphs     | `I've spent 15 years`             |
| Your email address             | `sanjana@chapteronecreative.io`   |
| LinkedIn link                  | `linkedin.com`                    |
| Footer text                    | `Story first`                     |

---

## Swapping a photo

Your photos live in the `assets/` folder: `sanjana-hero.jpg` (top of page) and
`sanjana-about.jpg` (About section).

Easiest way to replace one **without renaming anything**:

1. On GitHub, go into the `assets/` folder and open the photo you want to replace.
2. Click the **trash/delete icon**, then commit the deletion.
3. Go back into the `assets/` folder, click **Add file → Upload files**.
4. Upload your new photo, **renamed to the exact same filename** (e.g. `sanjana-hero.jpg`).
5. Commit. The site picks it up automatically.

**Tip:** keep photos reasonably small — under ~1 MB and around 900–1200 pixels
wide is plenty. Huge phone photos (3–5 MB) slow the page down. If you're not sure
how to resize one, just ask Claude Code and it'll shrink it for you.

---

## When you want a real design change

For anything beyond text and photos — new sections, colors, layout, a fresh look —
open this project in **Claude Code** and describe what you want. It edits the design
files directly. Your content stays exactly as you left it.
