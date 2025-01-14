#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

/**
 * Recursively walks through a directory and returns an array of file paths.
 * @param {string} dirPath - The directory to walk.
 * @param {string[]} fileList - Accumulator for file paths.
 * @param {string} rootDir - The root directory where "flattened" will be placed.
 * @returns {string[]} - Array of absolute file paths.
 */
function walkDirectory(dirPath, fileList = [], rootDir) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    // Skip the flattened directory if it exists
    if (entry.name === "flattened") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkDirectory(fullPath, fileList, rootDir);
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
 * @param {string} filePath - The absolute path of the file.
 * @param {string} rootDir - The root directory path.
 * @returns {string} - The filename for the flattened folder.
 */
function getFlattenedFileName(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath);
  return relative.replace(new RegExp(`\\${path.sep}`, "g"), "^");
}

/**
 * Main function to create the flattened directory and copy files.
 */
function flattenProject() {
  // If a path is provided, use that; otherwise, default to current directory
  const providedPath = process.argv[2];
  const rootDir = providedPath ? path.resolve(providedPath) : process.cwd();

  // Validate directory
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory "${rootDir}" does not exist.`);
    process.exit(1);
  }
  if (!fs.lstatSync(rootDir).isDirectory()) {
    console.error(`Path "${rootDir}" is not a directory.`);
    process.exit(1);
  }

  // Create (or re-create) the flattened directory
  const flattenedDir = path.join(rootDir, "flattened");
  if (fs.existsSync(flattenedDir)) {
    fs.rmSync(flattenedDir, { recursive: true, force: true });
  }
  fs.mkdirSync(flattenedDir);

  // Recursively collect all file paths from root
  const filePaths = walkDirectory(rootDir, [], rootDir);

  // Copy each file into the flattened folder
  for (const filePath of filePaths) {
    const flattenedFileName = getFlattenedFileName(filePath, rootDir);
    const destPath = path.join(flattenedDir, flattenedFileName);
    fs.copyFileSync(filePath, destPath);
    console.log(`Copied: ${filePath} -> ${destPath}`);
  }

  console.log("Flattened project created successfully!");
}

// Run immediately
flattenProject();
