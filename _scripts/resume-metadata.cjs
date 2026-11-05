// Build-time metadata from the canonical PDF's Git history, never wall-clock time.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const PDF = 'abdulkader-alturkmani-resume.pdf';

function git(cwd, ...args) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
  catch (error) { throw new Error('Resume metadata requires a Git checkout with full history: ' + error.message); }
}

function metadata(cwd) {
  if (git(cwd, 'rev-parse', '--is-shallow-repository') === 'true') {
    throw new Error('Fetch full Git history before generating resume dates (checkout fetch-depth: 0).');
  }
  const bytes = fs.readFileSync(path.join(cwd, PDF));
  const version = crypto.createHash('sha256').update(bytes).digest('hex');
  const currentBlob = git(cwd, 'hash-object', '--', PDF);
  let committedBlob = '';
  try { committedBlob = git(cwd, 'rev-parse', 'HEAD:' + PDF); } catch { /* New, uncommitted PDF. */ }
  const clean = currentBlob === committedBlob;
  const stamp = clean ? git(cwd, 'log', '-1', '--follow', '--format=%cI', '--', PDF) : '';
  if (clean && !/^\d{4}-\d{2}-\d{2}T/.test(stamp)) throw new Error('No reliable Git date found for resume.');
  return { path: '/' + PDF, version: version.slice(0, 16), sha256: version, updated: stamp ? stamp.slice(0, 10) : null, pending_commit: !clean };
}

function generate(cwd, acceptProfile = false) {
  const result = metadata(cwd);
  const profilePath = path.join(cwd, '_data/profile.json');
  const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
  if (acceptProfile) {
    profile.resume_sha256 = result.sha256;
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2) + '\n');
  }
  if (profile.resume_sha256 !== result.sha256) {
    console.warn('Resume changed: review _data/profile.json facts, then run this script with --accept-profile. PDF replacement and its date still build automatically.');
  }
  fs.writeFileSync(path.join(cwd, '_data/resume.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(result.updated ? 'Resume date from PDF commit: ' + result.updated : 'Resume has uncommitted changes; no committed update date displayed.');
  return result;
}
if (require.main === module) generate(path.resolve(__dirname, '..'), process.argv.includes('--accept-profile'));
module.exports = { metadata, generate, PDF };
