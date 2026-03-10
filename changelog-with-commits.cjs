const { execSync } = require('child_process');

const COMMIT_SEPARATOR = '---COMMIT_SEP---';

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function getCommitsSinceLastVersion() {
  const lastTag = exec('git describe --tags --abbrev=0 2>/dev/null');
  if (lastTag) {
    return getLogSince(`${lastTag}..HEAD`);
  }

  const lastChangelogCommit = exec(
    'git log -1 --format=%H -- "**/CHANGELOG.md"',
  );
  if (lastChangelogCommit) {
    return getLogSince(`${lastChangelogCommit}..HEAD`);
  }

  return null;
}

function getLogSince(range) {
  const raw = exec(
    `git log ${range} --pretty=format:"${COMMIT_SEPARATOR}%h%n%B" --no-merges`,
  );
  if (!raw) return null;

  const commits = raw
    .split(COMMIT_SEPARATOR)
    .map((block) => block.trim())
    .filter(Boolean);

  if (commits.length === 0) return null;

  const formatted = commits.map((block) => {
    const firstNewline = block.indexOf('\n');
    if (firstNewline === -1) return `- **${block}**`;

    const hash = block.slice(0, firstNewline).trim();
    const bodyLines = block
      .slice(firstNewline + 1)
      .split('\n')
      .map((l) => l.replace(/\r/g, '').trim())
      .filter(Boolean);

    const lines = [`- **${hash}**`];
    for (const line of bodyLines) {
      lines.push(`  ${line}`);
    }
    return lines.join('\n');
  });

  return formatted.join('\n');
}

async function getReleaseLine(changeset, _type) {
  const summary = changeset.summary.trim();
  const commits = getCommitsSinceLastVersion();

  const lines = [`\n\n### ${summary}`];
  if (commits) {
    lines.push('', commits);
  }

  return lines.join('\n');
}

async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return '';

  const updated = dependenciesUpdated.map(
    (dep) => `  - ${dep.name}@${dep.newVersion}`,
  );

  return ['\n- Updated dependencies:', ...updated].join('\n');
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
