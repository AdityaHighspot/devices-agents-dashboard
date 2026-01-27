#!/usr/bin/env node

/**
 * Fetches Zephyr test cases from the Devices Crew folder and generates a JSON file.
 * Run during GitHub Actions build to bundle with the frontend.
 *
 * Usage: ZEPHYR_TOKEN=xxx node scripts/fetch-zephyr-tests.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ZEPHYR_API = 'https://api.zephyrscale.smartbear.com/v2';
const PROJECT_KEY = 'HS';
const DEVICES_CREW_FOLDER_ID = '8194838';

async function fetchJson(endpoint, token) {
  const response = await fetch(`${ZEPHYR_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Zephyr API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchAllPages(endpoint, token, maxResults = 100) {
  let allValues = [];
  let startAt = 0;
  let isLast = false;

  while (!isLast) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const data = await fetchJson(`${endpoint}${separator}startAt=${startAt}&maxResults=${maxResults}`, token);
    allValues = allValues.concat(data.values || []);
    isLast = data.isLast;
    startAt += maxResults;

    // Safety limit
    if (allValues.length > 5000) {
      console.warn('Hit safety limit of 5000 items');
      break;
    }
  }

  return allValues;
}

async function fetchChildFolders(parentId, token) {
  // Fetch all folders and filter by parentId client-side
  // (Zephyr API doesn't have a good parent filter)
  const allFolders = await fetchAllPages(`/folders?projectKey=${PROJECT_KEY}`, token, 500);

  return allFolders
    .filter((f) => f.parentId === parseInt(parentId) && f.folderType === 'TEST_CASE')
    .map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchTestsInFolder(folderId, token) {
  const tests = await fetchAllPages(`/testcases?projectKey=${PROJECT_KEY}&folderId=${folderId}`, token, 100);

  return tests.map((t) => ({
    key: t.key,
    name: t.name,
    folderId: folderId,
    status: t.status?.name || 'Unknown',
  }));
}

async function main() {
  const token = process.env.ZEPHYR_TOKEN;

  if (!token) {
    console.error('Error: ZEPHYR_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log('Fetching Zephyr test data...');
  console.log(`Root folder: ${DEVICES_CREW_FOLDER_ID}`);

  // Fetch child folders under Devices Crew
  console.log('Fetching folders...');
  const folders = await fetchChildFolders(DEVICES_CREW_FOLDER_ID, token);
  console.log(`Found ${folders.length} folders`);

  // Fetch tests for each folder
  const result = {
    rootFolderId: DEVICES_CREW_FOLDER_ID,
    rootFolderName: 'Devices Crew',
    generatedAt: new Date().toISOString(),
    folders: [],
  };

  for (const folder of folders) {
    console.log(`Fetching tests for: ${folder.name}`);
    const tests = await fetchTestsInFolder(folder.id, token);

    result.folders.push({
      id: folder.id,
      name: folder.name,
      tests: tests,
    });
  }

  // Write to public folder so it's included in build
  const outputPath = path.join(__dirname, '..', 'public', 'zephyr-tests.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  console.log(`\nGenerated: ${outputPath}`);
  console.log(`Total folders: ${result.folders.length}`);
  console.log(`Total tests: ${result.folders.reduce((sum, f) => sum + f.tests.length, 0)}`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
