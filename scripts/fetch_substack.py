#!/usr/bin/env python3
"""Fetch the latest posts from the ChapterOne Creative Substack RSS feed and
write them to blog/posts.json for the /blog page to render as cards.

Runs in GitHub Actions (see .github/workflows/blog.yml). Substack blocks
cross-origin browser requests, so we fetch server-side and commit the result.
"""
import datetime
import html
import json
import re
import sys

import feedparser

FEED = "https://chapteronecreative.substack.com/feed"
OUT = "blog/posts.json"
MAX_POSTS = 12
EXCERPT_LEN = 180


def strip_html(text):
    text = re.sub(r"<[^>]+>", "", text or "")
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def first_image(entry):
    for key in ("media_thumbnail", "media_content"):
        media = entry.get(key)
        if media and isinstance(media, list) and media[0].get("url"):
            return media[0]["url"]
    for enc in entry.get("enclosures", []) or []:
        if str(enc.get("type", "")).startswith("image") and enc.get("href"):
            return enc["href"]
    content = ""
    if entry.get("content"):
        content = entry["content"][0].get("value", "")
    content = content or entry.get("summary", "")
    match = re.search(r'<img[^>]+src="([^"]+)"', content)
    return match.group(1) if match else None


def post_date(entry):
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        return datetime.date(parsed.tm_year, parsed.tm_mon, parsed.tm_mday).isoformat()
    return None


def main():
    feed = feedparser.parse(FEED)
    posts = []
    for entry in feed.entries[:MAX_POSTS]:
        excerpt = strip_html(entry.get("summary", ""))
        if len(excerpt) > EXCERPT_LEN:
            excerpt = excerpt[:EXCERPT_LEN].rstrip() + "…"
        posts.append({
            "title": strip_html(entry.get("title", "")),
            "url": entry.get("link", ""),
            "date": post_date(entry),
            "excerpt": excerpt,
            "image": first_image(entry),
        })

    data = {
        "updated": datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "posts": posts,
    }
    with open(OUT, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write("\n")

    print(f"Wrote {len(posts)} posts to {OUT}")
    if feed.bozo and not posts:
        print(f"Warning: feed parse issue: {feed.bozo_exception}", file=sys.stderr)


if __name__ == "__main__":
    main()
