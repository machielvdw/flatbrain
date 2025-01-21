#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import ignore from 'ignore';

/**
 * Load and parse .gitignore
 * @param {string} rootDir - The root directory.
 * @returns {import('ignore').Ignore} - The ignore instance.
 */
function loadGitignore(rootDir) {
  const ig = ignore();
  const gitignorePath = path.join(rootDir, '.gitignore');

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContents = fs.readFileSync(gitignorePath, 'utf8');
    ig.add(gitignoreContents.split('\n'));
  }

  return ig;
}

/**
 * Recursively walk a directory and collect file paths.
 *
 * @param {string} dirPath - The directory to walk.
 * @param {string[]} fileList - Accumulator for file paths.
 * @param {string} rootDir - The root directory.
 * @param {import('ignore').Ignore} ig - The ignore instance.
 * @param {Set<string>} excludeDirs - Directories to exclude by exact name.
 * @param {Set<string>} excludeFiles - Files to exclude by exact name.
 * @returns {string[]} - Array of absolute file paths.
 */
function walkDirectory(
  dirPath,
  fileList,
  rootDir,
  ig,
  excludeDirs,
  excludeFiles
) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    // Skip the top-level flatbrain directory itself
    if (entry.name === 'flatbrain') continue;
    // Skip .git
    if (entry.name === '.git') continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Exclude if the user specified this directory/file by name
    if (entry.isDirectory() && excludeDirs.has(entry.name)) {
      continue;
    }
    if (entry.isFile() && excludeFiles.has(entry.name)) {
      continue;
    }

    // Exclude if .gitignore says so
    if (ig.ignores(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walkDirectory(fullPath, fileList, rootDir, ig, excludeDirs, excludeFiles);
    } else {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Convert an absolute file path to a flattened filename, e.g.:
 *  /root/src/sub/test.js -> sub^test.js
 *
 * @param {string} filePath - The absolute path.
 * @param {string} rootDir - The root directory.
 * @returns {string} - The flattened filename.
 */
function getFlattenedFileName(filePath, rootDir) {
  const relative = path.relative(rootDir, filePath);
  // Replace directory separators with '^'
  return relative.replace(new RegExp(`\\${path.sep}`, 'g'), '^');
}

/**
 * The main flattening logic:
 *  1) Validate the directory
 *  2) Load .gitignore
 *  3) Walk the directory
 *  4) Copy files to "flatbrain/flattened", optionally converting certain extensions to .txt
 *
 * @param {string} directoryArg - Directory path (or undefined).
 * @param {Set<string>} excludeDirs - Directories to exclude.
 * @param {Set<string>} excludeFiles - Files to exclude.
 * @param {Set<string>} toTxtExtensions - Extensions to rename to .txt
 */
function flattenProject(directoryArg, excludeDirs, excludeFiles, toTxtExtensions) {
  // Default to current working directory if none provided
  const rootDir = directoryArg ? path.resolve(directoryArg) : process.cwd();

  // Validate directory
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory "${rootDir}" does not exist.`);
    process.exit(1);
  }
  if (!fs.lstatSync(rootDir).isDirectory()) {
    console.error(`Path "${rootDir}" is not a directory.`);
    process.exit(1);
  }

  // Load .gitignore
  const ig = loadGitignore(rootDir);

  // Prepare flatbrain output directories
  const flatbrainDir = path.join(rootDir, 'flatbrain');
  const flattenedDir = path.join(flatbrainDir, 'flattened');

  // Ensure a fresh "flatbrain/flattened" directory
  if (fs.existsSync(flatbrainDir)) {
    // Remove only the flattened dir if it exists
    if (fs.existsSync(flattenedDir)) {
      fs.rmSync(flattenedDir, { recursive: true, force: true });
    }
  } else {
    // Create the parent flatbrain folder
    fs.mkdirSync(flatbrainDir);
  }
  fs.mkdirSync(flattenedDir);

  // Gather all file paths (excluding .gitignore paths, user-specified exclusions)
  const filePaths = walkDirectory(rootDir, [], rootDir, ig, excludeDirs, excludeFiles);

  // Copy each file, rename extension if needed
  for (const filePath of filePaths) {
    let flattenedFileName = getFlattenedFileName(filePath, rootDir);
    const ext = path.extname(flattenedFileName);

    // If this extension is in the "toTxtExtensions" set, rename to .txt
    if (toTxtExtensions.has(ext)) {
      flattenedFileName = flattenedFileName.slice(0, -ext.length) + '.txt';
    }

    const destPath = path.join(flattenedDir, flattenedFileName);
    fs.copyFileSync(filePath, destPath);
  }

  console.log('Flattened project created successfully in flatbrain/flattened!');
}

/**
 * Concatenate all files into a single file, with file paths as headers.
 *
 * @param {string} directoryArg - Directory path (or undefined).
 * @param {Set<string>} excludeDirs - Directories to exclude.
 * @param {Set<string>} excludeFiles - Files to exclude.
 * @param {string} outputFile - The output file name (defaults to "all.txt").
 */
function concatenateFiles(directoryArg, excludeDirs, excludeFiles, outputFile) {
  // Default to current working directory if none provided
  const rootDir = directoryArg ? path.resolve(directoryArg) : process.cwd();

  // Validate directory
  if (!fs.existsSync(rootDir)) {
    console.error(`Directory "${rootDir}" does not exist.`);
    process.exit(1);
  }
  if (!fs.lstatSync(rootDir).isDirectory()) {
    console.error(`Path "${rootDir}" is not a directory.`);
    process.exit(1);
  }

  // Load .gitignore
  const ig = loadGitignore(rootDir);

  // Prepare flatbrain output directories
  const flatbrainDir = path.join(rootDir, 'flatbrain');
  const concatDir = path.join(flatbrainDir, 'concat');
  if (!fs.existsSync(flatbrainDir)) {
    fs.mkdirSync(flatbrainDir);
  }
  if (fs.existsSync(concatDir)) {
    // Optional: remove existing files if you want it fresh each time
    // or handle however you'd like
    // fs.rmSync(concatDir, { recursive: true, force: true });
  } else {
    fs.mkdirSync(concatDir);
  }

  // Default output file name if none provided
  outputFile = outputFile || 'all.txt';
  // Final path for the concatenated file
  const outPath = path.join(concatDir, outputFile);

  // Gather all file paths
  const filePaths = walkDirectory(rootDir, [], rootDir, ig, excludeDirs, excludeFiles);

  // If the file already exists, remove it first (optional)
  if (fs.existsSync(outPath)) {
    fs.rmSync(outPath);
  }

  // Open a write stream
  const writeStream = fs.createWriteStream(outPath, { flags: 'a', encoding: 'utf8' });

  // Loop through all files and append to outPath
  for (const filePath of filePaths) {
    const relative = path.relative(rootDir, filePath);
    // Write a header line
    writeStream.write(`\n=== ${relative} ===\n`);
    // Read file content
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      writeStream.write(content);
      // Ensure a newline
      if (!content.endsWith('\n')) {
        writeStream.write('\n');
      }
    } catch (err) {
      writeStream.write(`[Error reading file: ${err.message}]\n`);
    }
  }

  writeStream.end(() => {
    console.log(`All files concatenated into "${outPath}"`);
  });
}

// ----------------------------------------------------------------------------
// Commander Setup
// ----------------------------------------------------------------------------

const program = new Command();

const DEFAULT_LOCKFILES = new Set([
  'yarn.lock',
  'package-lock.json',
  'pnpm-lock.yaml',
]);

program
  .name('flatbrain')
  .description('Flatbrain: File Structure Flattener')
  .version('2.1.0', '-v, --version', 'Output the current version');

program
  .command('flatten [directory]')
  .description('Flattens the specified directory into flatbrain/flattened.')
  .option('--excludeDir <dir...>', 'Exclude specific directories (by name)', [])
  .option('--excludeFile <file...>', 'Exclude specific files (by name)', [])
  .option('--toTxt <ext...>', 'Convert files with these extensions to .txt (e.g. .vue, .prisma)', [])
  .action((directory, options) => {
    const userExcludeFiles = new Set(options.excludeFile ?? []);
    const excludeFiles = new Set([...DEFAULT_LOCKFILES, ...userExcludeFiles]);

    const excludeDirs = new Set(options.excludeDir ?? []);
    const toTxtExtensions = new Set(options.toTxt ?? []);

    flattenProject(directory, excludeDirs, excludeFiles, toTxtExtensions);
  });

program
  .command('concat [directory]')
  .description('Concatenate all files into a single file in flatbrain/concat.')
  .option('--excludeDir <dir...>', 'Exclude specific directories (by name)', [])
  .option('--excludeFile <file...>', 'Exclude specific files (by name)', [])
  .option('--output <file>', 'Output file name (defaults to "all.txt")', 'all.txt')
  .action((directory, options) => {
    const userExcludeFiles = new Set(options.excludeFile ?? []);
    const excludeFiles = new Set([...DEFAULT_LOCKFILES, ...userExcludeFiles]);

    const excludeDirs = new Set(options.excludeDir ?? []);
    const outputFile = options.output || 'all.txt';

    concatenateFiles(directory, excludeDirs, excludeFiles, outputFile);
  });

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
