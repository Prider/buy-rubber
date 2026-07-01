#!/usr/bin/env node

/**
 * Remove dist/ before Electron builds.
 * Uses fs.rmSync with retries — more reliable than `rm -rf` when macOS
 * holds locks on .app bundles or Finder leaves .DS_Store behind.
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeDist() {
  if (!fs.existsSync(distPath)) {
    return;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      fs.rmSync(distPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.error(`Failed to remove dist/ after ${MAX_ATTEMPTS} attempts: ${error.message}`);
        console.error('Quit any running build of the app (dist/ or Applications/) and retry.');
        process.exit(1);
      }
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
}

removeDist().then(() => {
  console.log('Cleaned dist/');
});
