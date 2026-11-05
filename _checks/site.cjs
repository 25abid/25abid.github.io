// Run after bundle exec jekyll build: node _checks/site.cjs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve('_site');
const profile = JSON.parse(fs.readFileSync('_data/profile.json', 'utf8'));
const resume = JSON.parse(fs.readFileSync('_data/resume.json', 'utf8'));
let pages = 0, links = 0;
function walk(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const filename = path.join(dir, file.name);
    if (file.isDirectory()) walk(filename);
    else if (file.name.endsWith('.html')) {
      pages++;
      const html = fs.readFileSync(filename, 'utf8');
      assert.ok(!html.includes('{%'), 'Unresolved Liquid in ' + filename);
      assert.match(html, /<title>\s*[^<]+ — Abdulkader\s*<\/title>/, 'Consistent title in ' + filename);
      assert.ok(html.includes('>ABDULKADER ALTURKMANI</a>'), 'Shared uppercase identity in ' + filename);
      assert.ok(!html.includes('/assets/js/grain.js'), 'No procedural texture script');
      const nav = html.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
      const relative = path.relative(root, filename).replaceAll('\\', '/');
      let active;
      if (relative === 'index.html') active = 'Home';
      else if (relative.startsWith('work/')) active = 'Work';
      else if (relative.startsWith('about/')) active = 'About';
      else if (relative.startsWith('blog/') || html.includes('class="essay"')) active = 'Blog';
      if (active) {
        assert.equal((nav.match(/aria-current="page"/g) || []).length, 1, 'Exactly one active tab in ' + filename);
        assert.ok(nav.includes('aria-current="page">' + active + '</a>'), 'Correct parent tab in ' + filename);
      }
      for (const [, ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        if (!ref.startsWith('/') || ref.startsWith('//')) continue;
        const target = path.join(root, decodeURIComponent(ref.split(/[?#]/)[0]));
        assert.ok(fs.existsSync(target), 'Missing ' + ref + ' in ' + filename);
        links++;
      }
    }
  }
}
walk(root);
assert.ok(fs.readFileSync('_site/index.html', 'utf8').includes('Home — Abdulkader'));
const work = fs.readFileSync('_site/work/index.html', 'utf8');
assert.equal((work.match(/class="project-row /g) || []).length, profile.projects.length);
assert.ok(work.includes('153.14 km²'));
const about = fs.readFileSync('_site/about/index.html', 'utf8');
assert.ok(about.includes('Pepperdean') && about.includes('November 2027') && about.includes('In progress'));
assert.ok(about.includes('download="Abdulkader-Alturkmani-Resume.pdf"'));
assert.ok(about.includes('?v=' + resume.version));
assert.equal(fs.readFileSync('_site/abdulkader-alturkmani-resume.pdf').compare(fs.readFileSync('abdulkader-alturkmani-resume.pdf')), 0);
if (resume.pending_commit) assert.ok(about.includes('Résumé update awaiting commit.'));
else assert.ok(about.includes('datetime="' + resume.updated + '"'));
for (const dir of ['My-Website-is-Live!', 'welcome-to-jekyll']) {
  const post = fs.readFileSync(path.join(root, dir, 'index.html'), 'utf8');
  assert.ok(post.includes('itemprop="author"') && post.includes('Abdulkader Alturkmani'));
  assert.ok(post.includes('itemprop="datePublished"'));
  assert.ok(!post.includes('itemprop="dateModified"'), 'No invented update dates');
}
assert.ok(!fs.existsSync('_site/_checks'));
assert.ok(!fs.existsSync('_site/_scripts'));
console.log(`PASS: ${pages} pages, ${links} internal references, ${profile.projects.length} projects, shared header/parent navigation, titles, article metadata, and resume links/date/version/PDF.`);
