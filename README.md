# Portfolio

Personal portfolio at [qader.ca](https://qader.ca), built with Jekyll for GitHub Pages. No frontend framework or JavaScript packages are required.

## Local preview

With Ruby, Bundler, and Node installed:

```sh
bundle install
node _scripts/resume-metadata.cjs
bundle exec jekyll serve
```

Open the address printed by Jekyll. After replacing the PDF locally, rerun the metadata script and restart Jekyll. To build without serving, use `bundle exec jekyll build`.

## Resume update workflow

1. Replace **`abdulkader-alturkmani-resume.pdf`**, the sole canonical public resume. Use a phone-free PDF. The original download stays outside the repository. For the supplied PDF format, the optional privacy helper is `python _scripts/prepare-public-resume.py PATH_TO_ORIGINAL.pdf` (requires pypdf); it removes phone text and the adjacent separator rather than merely covering them. Review its output before committing.
2. If facts changed, update **`_data/profile.json`** and run `node _scripts/resume-metadata.cjs --accept-profile` after reviewing those facts. About and Work both read this data. If only PDF formatting changed, accepting the reviewed profile hash is sufficient.
3. Commit the PDF and any content changes. Once publication is approved and GitHub Pages uses **GitHub Actions** as its build source, `.github/workflows/pages.yml` regenerates resume metadata, builds/checks the site, and deploys on pushes to `main`.

Replacing/committing an already phone-free PDF is the only recurring step for serving that file and refreshing its date. Profile copy is deliberately reviewed, not inferred automatically from arbitrary PDF layouts. The build warns if the PDF hash differs from the last reviewed profile hash, but still serves the new PDF. No claim is made that PDF text automatically rewrites About/Work.

### Date and cache behavior

`_scripts/resume-metadata.cjs` reads the last **committer date of the commit that changed the canonical PDF**, following renames with full Git history. It never uses deployment time, filesystem modification time, or the visitor's clock. Uncommitted replacements display “Résumé update awaiting commit” instead of an old or invented date. A content hash versions every resume link to avoid stale cached downloads. `_data/resume.json` is generated; do not hand-edit its date.

The Actions workflow uses `fetch-depth: 0` and regenerates metadata immediately before Jekyll. One-time setup after approval: choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub's default branch-based Jekyll builder does not run arbitrary prebuild scripts, so it cannot provide this automatic Git-based date by itself. No repository settings have been changed by this task. The workflow is prepared locally and has not run remotely.

## Content and design

- `_data/profile.json`: shared factual profile, experience, education, certifications, selected skills, and projects.
- `_layouts/post.html`: essay layout. Posts retain their original dates and text; optional `updated:` front matter produces a separately labelled update date.
- `blog.html`: editorial article index.
- `memory-game.html`, `assets/js/memory-game.js`: playable CS50P adaptation. Original Python, tests, and README are under `assets/projects/memory-game/`.
- `_includes/header.html`: centered uppercase serif identity and compact pill navigation; articles highlight Blog and project pages highlight Work.
- `assets/css/style.css`: charcoal background, ivory text, sage accents, responsive layouts, a sticky shared header, and essay reading styles.
- `assets/texture.svg`: one fine, seamless static texture repeated at native scale. It scrolls with the document and requires no JavaScript, randomization, or fixed overlay.

Othello retains the prior owner-supplied description; its Java implementation is not in this repository. No source links, screenshots, or demos have been invented for projects whose assets were not supplied.

## Checks

```sh
node _checks/resume-metadata.cjs
node _checks/memory-game.cjs
node _scripts/resume-metadata.cjs
bundle exec jekyll build
node _checks/site.cjs
```

The resume tests use an isolated temporary Git repository, not this repository's history. Site checks verify titles, author/published metadata, project count, internal links, resume date/version, and the exact built PDF. Game checks cover presets, custom validation, matching, winning, and timer cleanup. Underscore-prefixed tooling directories are excluded by Jekyll; README is explicitly excluded. The favicon is unchanged.
