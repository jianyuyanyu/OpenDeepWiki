#!/usr/bin/env python3
import argparse
import json
import re
import sys
import urllib.request
from html.parser import HTMLParser
from typing import List, Optional

class SimpleExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._capture: Optional[str] = None
        self._buffer: List[str] = []
        self.title: str = ""
        self.h1: List[str] = []
        self.h2: List[str] = []
        self.nav_links: List[dict] = []
        self._current_link: Optional[dict] = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        if tag in {"title", "h1", "h2"}:
            self._capture = tag
            self._buffer = []
        if tag == "a":
            href = attrs_dict.get("href")
            if href:
                self._current_link = {"href": href, "text": ""}
        if tag == "nav":
            self._capture = "nav"

    def handle_endtag(self, tag: str) -> None:
        if tag in {"title", "h1", "h2"} and self._capture == tag:
            text = self._flush_text()
            if tag == "title":
                self.title = text
            elif tag == "h1":
                if text:
                    self.h1.append(text)
            elif tag == "h2":
                if text:
                    self.h2.append(text)
            self._capture = None
        if tag == "a" and self._current_link is not None:
            text = self._current_link["text"].strip()
            if text:
                self._current_link["text"] = re.sub(r"\s+", " ", text)
                self.nav_links.append(self._current_link)
            self._current_link = None
        if tag == "nav" and self._capture == "nav":
            self._capture = None

    def handle_data(self, data: str) -> None:
        if self._capture in {"title", "h1", "h2"}:
            self._buffer.append(data)
        if self._current_link is not None:
            self._current_link["text"] += data

    def _flush_text(self) -> str:
        text = "".join(self._buffer).strip()
        text = re.sub(r"\s+", " ", text)
        self._buffer = []
        return text


def fetch_html(url: str, timeout: int) -> str:
    headers = {
        "User-Agent": "OpenDeepWikiBot/0.1 (+https://deepwiki.com)"
    }
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch and summarize a web page.")
    parser.add_argument("url", help="Target URL")
    parser.add_argument("--timeout", type=int, default=20, help="Timeout seconds")
    parser.add_argument("--save-html", help="Optional path to save raw HTML")
    args = parser.parse_args()

    html = fetch_html(args.url, args.timeout)

    if args.save_html:
        with open(args.save_html, "w", encoding="utf-8") as handle:
            handle.write(html)

    extractor = SimpleExtractor()
    extractor.feed(html)

    result = {
        "title": extractor.title,
        "h1": extractor.h1[:5],
        "h2": extractor.h2[:15],
        "nav_links": extractor.nav_links[:30],
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
