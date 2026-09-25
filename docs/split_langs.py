#!/usr/bin/env python3
"""Split bilingual .md files into en/ and ja/ subdirectories.

For each .md file containing <div class="lang-en"> and <div class="lang-ja">,
generates:
  en/<file>.md  — English content only
  ja/<file>.md  — Japanese content only

The original file is replaced with a redirect to the English version.
Files without lang-ja are copied as-is to en/ (and get a redirect original).

Usage: python3 split_langs.py
Run from the docs/ directory.
"""

import os
import re
import glob

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))


def extract_frontmatter(content):
    """Return (frontmatter_str, body) where frontmatter includes the --- delimiters."""
    m = re.match(r'^(---\n.*?\n---)\n?(.*)', content, re.DOTALL)
    if m:
        return m.group(1), m.group(2)
    return '', content


def parse_frontmatter(fm_str):
    """Parse YAML-like frontmatter into dict (simple key: value only)."""
    d = {}
    for line in fm_str.split('\n'):
        line = line.strip()
        if line == '---':
            continue
        m = re.match(r'^(\w[\w_]*)\s*:\s*(.+)$', line)
        if m:
            d[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return d


def extract_lang_blocks(body):
    """Extract content from lang-en and lang-ja divs."""
    en_match = re.search(
        r'<div\s+class="lang-en"[^>]*>\s*\n?(.*?)\n?</div>',
        body, re.DOTALL
    )
    ja_match = re.search(
        r'<div\s+class="lang-ja"[^>]*>\s*\n?(.*?)\n?</div>',
        body, re.DOTALL
    )
    en_content = en_match.group(1).strip() if en_match else None
    ja_content = ja_match.group(1).strip() if ja_match else None
    return en_content, ja_content


def build_frontmatter(fm_dict, lang, rel_path):
    """Build frontmatter string with hreflang info."""
    lines = ['---']
    for k, v in fm_dict.items():
        if k in ('alt_lang', 'alt_lang_url'):
            continue
        # Quote values that need it
        if k == 'title' or ' ' in str(v) or ':' in str(v):
            lines.append(f'{k}: "{v}"')
        else:
            lines.append(f'{k}: {v}')

    lines.append(f'lang: {lang}')

    # hreflang alternate
    if lang == 'en':
        alt_url = rel_path.replace('en/', 'ja/', 1).replace('.md', '')
    else:
        alt_url = rel_path.replace('ja/', 'en/', 1).replace('.md', '')
    lines.append(f'hreflang_alt: "{alt_url}"')
    lines.append(f'hreflang_lang: "{"ja" if lang == "en" else "en"}"')

    lines.append('---')
    return '\n'.join(lines)


def make_redirect_page(target_url, title="Redirect"):
    """Create a minimal redirect .md file."""
    return f"""---
layout: default
title: "{title}"
nav_exclude: true
redirect_to: "{target_url}"
sitemap: false
---
<meta http-equiv="refresh" content="0; url={target_url}">
<p><a href="{target_url}">Redirect</a></p>
"""


def process_file(md_path, subdir=''):
    """Process a single .md file. subdir is '' or 'python/'."""
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    fm_str, body = extract_frontmatter(content)
    fm_dict = parse_frontmatter(fm_str)
    filename = os.path.basename(md_path)

    en_content, ja_content = extract_lang_blocks(body)

    if en_content is None:
        # No bilingual content, skip
        return False

    # Build output paths
    en_dir = os.path.join(DOCS_DIR, 'en', subdir)
    ja_dir = os.path.join(DOCS_DIR, 'ja', subdir)
    os.makedirs(en_dir, exist_ok=True)
    os.makedirs(ja_dir, exist_ok=True)

    en_rel = f'en/{subdir}{filename}'
    ja_rel = f'ja/{subdir}{filename}'

    # Update alt_lang_url for C++/Python cross-links
    en_fm = dict(fm_dict)
    ja_fm = dict(fm_dict)

    # Fix alt_lang_url for en/ja versions
    if 'alt_lang_url' in fm_dict:
        orig_url = fm_dict['alt_lang_url']
        # If current is C++ page linking to python/
        if orig_url.startswith('python/'):
            en_fm['alt_lang'] = 'Python version'
            en_fm['alt_lang_url'] = f'../en/{orig_url}'
            ja_fm['alt_lang'] = 'Python version'
            ja_fm['alt_lang_url'] = f'../ja/{orig_url}'
        else:
            # Python page linking to C++ page
            en_fm['alt_lang'] = 'C++ version'
            en_fm['alt_lang_url'] = f'{orig_url}'
            ja_fm['alt_lang'] = 'C++ version'
            ja_fm['alt_lang_url'] = f'{orig_url}'

    # Write EN file
    en_fm_str = build_frontmatter(en_fm, 'en', en_rel)
    with open(os.path.join(en_dir, filename), 'w', encoding='utf-8') as f:
        f.write(en_fm_str + '\n\n' + en_content + '\n')

    # Write JA file
    ja_fm_str = build_frontmatter(ja_fm, 'ja', ja_rel)
    with open(os.path.join(ja_dir, filename), 'w', encoding='utf-8') as f:
        f.write(ja_fm_str + '\n\n' + ja_content + '\n')

    # Replace original with redirect to EN version
    target = f'/en/{subdir}{filename.replace(".md", "")}'
    title = fm_dict.get('title', filename.replace('.md', ''))
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(make_redirect_page(target, title))

    return True


def main():
    count = 0

    # Process docs/*.md (C++ pages)
    for md in sorted(glob.glob(os.path.join(DOCS_DIR, '*.md'))):
        filename = os.path.basename(md)
        if filename in ('404.md',):
            continue
        if process_file(md, ''):
            count += 1
            print(f'  split: {filename}')

    # Process docs/python/*.md (Python pages)
    python_dir = os.path.join(DOCS_DIR, 'python')
    if os.path.isdir(python_dir):
        for md in sorted(glob.glob(os.path.join(python_dir, '*.md'))):
            filename = os.path.basename(md)
            if process_file(md, 'python/'):
                count += 1
                print(f'  split: python/{filename}')

    print(f'\nDone: {count} files split into en/ and ja/')


if __name__ == '__main__':
    main()
