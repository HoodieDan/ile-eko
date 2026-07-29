#!/usr/bin/env node
/**
 * Version manager for the Expo apps.
 *
 *   node scripts/version.mjs <landlord|tenant|all> <major|minor|patch|x.y.z>
 *
 * `expo.version` in app.json is the single source of truth for the user-facing
 * version. This script keeps package.json in lockstep so the workspace and the
 * binary never disagree.
 *
 * Native build numbers (iOS buildNumber / Android versionCode) are NOT set here:
 * the production profile uses EAS `autoIncrement`, so every production build
 * gets a fresh, monotonically increasing number without touching the repo.
 *
 * Bumping the version also rolls the OTA runtime version, because app.json uses
 * `runtimeVersion: { policy: "appVersion" }` — updates only reach builds of the
 * same version, which is what stops an incompatible JS bundle shipping to an
 * older native binary.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPS = ['landlord', 'tenant'];

const [targetArg, bumpArg] = process.argv.slice(2);
if (!targetArg || !bumpArg) {
  console.error('usage: node scripts/version.mjs <landlord|tenant|all> <major|minor|patch|x.y.z>');
  process.exit(1);
}

const targets = targetArg === 'all' ? APPS : [targetArg];
for (const t of targets) {
  if (!APPS.includes(t)) {
    console.error(`unknown app "${t}" — expected one of: ${APPS.join(', ')}, all`);
    process.exit(1);
  }
}

function nextVersion(current, bump) {
  if (/^\d+\.\d+\.\d+$/.test(bump)) return bump;
  const [maj, min, pat] = current.split('.').map(Number);
  if (bump === 'major') return `${maj + 1}.0.0`;
  if (bump === 'minor') return `${maj}.${min + 1}.0`;
  if (bump === 'patch') return `${maj}.${min}.${pat + 1}`;
  console.error(`invalid bump "${bump}" — use major, minor, patch or an explicit x.y.z`);
  process.exit(1);
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function writeJson(p, value) {
  writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`);
}

for (const app of targets) {
  const appJsonPath = join(ROOT, 'apps', app, 'app.json');
  const pkgJsonPath = join(ROOT, 'apps', app, 'package.json');

  const appJson = readJson(appJsonPath);
  const pkgJson = readJson(pkgJsonPath);

  const current = appJson.expo.version;
  const next = nextVersion(current, bumpArg);

  appJson.expo.version = next;
  pkgJson.version = next;

  writeJson(appJsonPath, appJson);
  writeJson(pkgJsonPath, pkgJson);

  console.log(`${app.padEnd(9)} ${current} → ${next}`);
}

console.log('\nNative build numbers auto-increment on EAS for production builds.');
console.log('Commit this change before building so the binary matches the repo.');
