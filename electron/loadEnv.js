/**
 * Load license env vars into process.env for the packaged Electron app.
 * Next.js only inlines NEXT_PUBLIC_* at build time; LICENSE_VALIDATION_KEY is
 * read at runtime and .env is not shipped in the installer.
 */

const fs = require('fs');
const path = require('path');

const LICENSE_ENV_KEYS = [
  'LICENSE_API_URL',
  'LICENSE_VALIDATION_KEY',
  'LICENSE_PUBLIC_KEY',
  'SKIP_LICENSE_CHECK',
];

const DEFAULT_LICENSE_API_URL = 'https://license-api.punsookinnotech.co';

function parseEnvText(text) {
  const result = {};
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value.replace(/\\n/g, '\n');
  }
  return result;
}

function readEnvFile(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return {};
    return parseEnvText(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function pickLicenseEnv(source) {
  const picked = {};
  for (const key of LICENSE_ENV_KEYS) {
    const value = typeof source[key] === 'string' ? source[key].trim() : '';
    if (value) picked[key] = value;
  }
  return picked;
}

function applyLicenseEnv(values, { override = false } = {}) {
  for (const [key, value] of Object.entries(values)) {
    if (!value) continue;
    if (!override && process.env[key]) continue;
    process.env[key] = value;
  }
}

function collectLicenseEnv(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..');
  const fromFiles = {
    ...readEnvFile(path.join(root, '.env')),
    ...readEnvFile(path.join(root, 'electron.env')),
  };

  return {
    LICENSE_API_URL:
      process.env.LICENSE_API_URL ||
      fromFiles.LICENSE_API_URL ||
      DEFAULT_LICENSE_API_URL,
    LICENSE_VALIDATION_KEY:
      process.env.LICENSE_VALIDATION_KEY || fromFiles.LICENSE_VALIDATION_KEY || '',
    LICENSE_PUBLIC_KEY:
      process.env.LICENSE_PUBLIC_KEY || fromFiles.LICENSE_PUBLIC_KEY || '',
    SKIP_LICENSE_CHECK:
      process.env.SKIP_LICENSE_CHECK || fromFiles.SKIP_LICENSE_CHECK || 'false',
  };
}

function serializeEnvValue(value) {
  const text = String(value ?? '');
  if (/[\n\r]/.test(text) || /[#"]/.test(text) || /\s/.test(text)) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return text;
}

function writePackagedLicenseEnv(projectRoot) {
  const root = projectRoot || path.join(__dirname, '..');
  const dest = path.join(__dirname, 'license.env');
  const env = collectLicenseEnv(root);

  if (!env.LICENSE_VALIDATION_KEY) {
    throw new Error(
      'LICENSE_VALIDATION_KEY is missing. Set it in .env or electron.env before building the Electron app.'
    );
  }

  const lines = LICENSE_ENV_KEYS.filter((key) => env[key]).map(
    (key) => `${key}=${serializeEnvValue(env[key])}`
  );
  fs.writeFileSync(dest, `${lines.join('\n')}\n`, 'utf8');
  return dest;
}

function loadElectronLicenseEnv(appPath) {
  const candidates = [
    path.join(__dirname, 'license.env'),
    appPath ? path.join(appPath, 'electron', 'license.env') : null,
    appPath ? path.join(appPath, 'electron.env') : null,
    appPath ? path.join(appPath, '.env') : null,
    path.join(__dirname, '..', 'electron.env'),
    path.join(__dirname, '..', '.env'),
  ].filter(Boolean);

  for (const filePath of candidates) {
    applyLicenseEnv(pickLicenseEnv(readEnvFile(filePath)), { override: false });
  }

  if (!process.env.LICENSE_API_URL) {
    process.env.LICENSE_API_URL = DEFAULT_LICENSE_API_URL;
  }
}

module.exports = {
  LICENSE_ENV_KEYS,
  collectLicenseEnv,
  loadElectronLicenseEnv,
  writePackagedLicenseEnv,
};
