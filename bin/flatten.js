#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ignore from "ignore";
import updateNotifier from 'update-notifier';
import pkg from '../package.json' assert { type: 'json' };

updateNotifier({ pkg }).notify();

/**
 * Load and parse .gitignore
 * @param {string} rootDir - The root directory.
 * @returns {import('ignore').Ignore} - The ignore instance.
 */
function loadGitignore(rootDir) {
  const ig = ignore();
  const gitignorePath = path.join(rootDir, ".gitignore");

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContents = fs.readFileSync(gitignorePath, "utf8");
    ig.add(gitignoreContents.split("\n"));
  }

  return ig;
}

/**
 * Recursively walks through a directory and returns an array of file paths.
 *
 * @param {string} dirPath - The directory to walk.
 * @param {string[]} fileList - Accumulator for file paths.
 * @param {string} rootDir - The root directory where "flattened" will be placed.
 * @param {import('ignore').Ignore} ig - The ignore instance (with .gitignore rules).
 * @returns {string[]} - Array of absolute file paths.
 */
function walkDirectory(dirPath, fileList = [], rootDir, ig) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "flattened") {
      continue;
    }

    if (entry.name === ".git") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    // Relative path from rootDir to check against ignore rules
    const relativePath = path.relative(rootDir, fullPath);

    // Check if this path is ignored
    if (ig.ignores(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDirectory(fullPath, fileList, rootDir, ig);
    } else {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Given an absolute file path and the root directory, return
 * the "flattened" filename where subdirectories are replaced with ^.
 * e.g., root/sub/test.js => sub^test.js
 *
 * @param {string} filePath - The absolute path of the file.
 * @param {string} rootDir - The root directory path.
 * @returns {string} - The filename for the flattened folder.
 */
function getFlattenedFileName(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath);
  return relative.replace(new RegExp(`\\${path.sep}`, "g"), "^");
}

/**
 * Perform the flattening of a directory.
 * @param {string} [providedPath] - The directory to flatten (defaults to CWD if not provided).
 */
function flattenProject(providedPath) {
  const rootDir = providedPath ? path.resolve(providedPath) : process.cwd();

  if (!fs.existsSync(rootDir)) {
    console.error(`Directory "${rootDir}" does not exist.`);
    process.exit(1);
  }
  if (!fs.lstatSync(rootDir).isDirectory()) {
    console.error(`Path "${rootDir}" is not a directory.`);
    process.exit(1);
  }

  const ig = loadGitignore(rootDir);

  const flattenedDir = path.join(rootDir, "flattened");
  if (fs.existsSync(flattenedDir)) {
    fs.rmSync(flattenedDir, { recursive: true, force: true });
  }
  fs.mkdirSync(flattenedDir);

  const filePaths = walkDirectory(rootDir, [], rootDir, ig);

  for (const filePath of filePaths) {
    const flattenedFileName = getFlattenedFileName(filePath, rootDir);
    const destPath = path.join(flattenedDir, flattenedFileName);
    fs.copyFileSync(filePath, destPath);
    console.log(`Copied: ${filePath} -> ${destPath}`);
  }

  console.log("Flattened project created successfully!");
}

function main() {
  const args = process.argv.slice(2);

  const command = args[0];

  if (command === "flatten") {
    const directoryArg = args[1];
    flattenProject(directoryArg);
  } else {
    console.log(`
Usage:
  flatbrain flatten <directory>

Examples:
  flatbrain flatten
  flatbrain flatten ./src
`);
  }
}

main();
