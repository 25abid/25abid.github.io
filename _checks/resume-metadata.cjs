const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { metadata, PDF } = require('../_scripts/resume-metadata.cjs');
const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-resume-check-'));
function git(...args) { return execFileSync('git', args, { cwd, stdio: 'pipe' }); }
function commit(date) {
  execFileSync('git', ['-c', 'commit.gpgsign=false', 'commit', '-m', 'fixture'], {
    cwd, stdio: 'pipe', env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }
  });
}
try {
  git('init'); git('config', 'user.name', 'Fixture'); git('config', 'user.email', 'fixture@example.invalid');
  fs.writeFileSync(path.join(cwd, PDF), 'first pdf fixture');
  git('add', PDF); commit('2020-01-02T12:00:00-05:00');
  const first = metadata(cwd);
  assert.equal(first.updated, '2020-01-02');
  assert.equal(first.pending_commit, false);
  fs.writeFileSync(path.join(cwd, 'unrelated.txt'), 'unrelated deployment');
  git('add', 'unrelated.txt'); commit('2021-03-04T12:00:00-05:00');
  assert.equal(metadata(cwd).updated, first.updated, 'Unrelated commits cannot change PDF date');
  fs.writeFileSync(path.join(cwd, PDF), 'updated pdf fixture');
  const dirty = metadata(cwd);
  assert.equal(dirty.updated, null, 'Uncommitted PDF cannot inherit the old date');
  assert.notEqual(dirty.version, first.version, 'Changed PDF gets a different cache version');
  git('add', PDF); commit('2022-05-06T12:00:00-04:00');
  assert.equal(metadata(cwd).updated, '2022-05-06');
  assert.equal(metadata(cwd).version, dirty.version);
  console.log('PASS: PDF commit date, unrelated commits, uncommitted changes, and content-based cache version.');
} finally {
  const target = path.resolve(cwd);
  assert.equal(path.dirname(target), path.resolve(os.tmpdir()));
  assert.ok(path.basename(target).startsWith('portfolio-resume-check-'));
  fs.rmSync(target, { recursive: true, force: true });
}
