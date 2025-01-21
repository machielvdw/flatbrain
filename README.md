# Flatbrain: File Structure Flattener

Flatbrain is a command-line tool that flattens a directory's file structure by copying all files into a single directory. Subdirectories are represented in filenames using a `^` delimiter. This tool is particularly useful for LLM projects or managing files with nested structures.

## Features

- Recursively flattens files from a directory into a `flattened` directory.
- Automatically excludes files and folders specified in `.gitignore`, and common lockfiles.
- Allows excluding specific directories and files via command-line options.
- Allows converting specific file extensions to `.txt`.
- Concatenates all files into a single text file with headers using the `concat` command.
- Ensures unique filenames in the flattened directory.

## Installation

Install globally via npm:

```bash
npm install -g flatbrain
```

Or use it directly with npx:

```bash
npx flatbrain
```

## Usage

Flatbrain provides two main commands: `flatten` and `concat`.

### Flatten Command

The `flatten` command processes the specified directory and creates a `flattened` folder containing all files with flattened paths.

#### Simplest Usage

The simplest way to run Flatbrain is:

```bash
flatbrain flatten
```

By default, this command:

- Processes the current working directory.
- Automatically excludes paths specified in `.gitignore`.
- Creates a `flattened` directory within the current directory.

#### Command Syntax

```bash
flatbrain flatten <directory> [options]
```

#### Options

- `--excludeDir=<directory>`: Exclude specific directories.
- `--excludeFile=<file>`: Exclude specific files.
- `--toTxt <extension>`: Convert files with these extensions to `.txt`.
  - Can be specified multiple times (e.g., `--toTxt=.vue --toTxt=.schema`).

#### Examples

Flatten all files in the `./src` directory:

```bash
flatbrain flatten ./src
```

Exclude the `node_modules` directory:

```bash
flatbrain flatten ./src --excludeDir=node_modules
```

Exclude a specific file, e.g., `test.js`:

```bash
flatbrain flatten ./src --excludeFile=test.js
```

Automatically exclude paths listed in `.gitignore`:

```bash
flatbrain flatten ./src
```

If `.gitignore` contains:

```plaintext
node_modules
*.log
```

These paths and files will be excluded from the flattening process.

Combine options:

```bash
flatbrain flatten ./src --excludeDir=node_modules --excludeFile=test.js
```

The flattened files are stored in a directory named `flattened` within the specified directory. Subdirectories are represented using a `^` character in filenames. For example:

```plaintext
./src/sub/test.js → ./flattened/sub^test.js
```

---

### Concat Command

The `concat` command concatenates the contents of all files in a directory into a single text file. Each file's content is prefixed by a header showing the relative file path.

#### Simplest Usage

The simplest way to run Flatbrain's concat command is:

```bash
flatbrain concat
```

This creates a file named `all.txt` in a `concat` directory under the current working directory.

#### Command Syntax

```bash
flatbrain concat <directory> [options]
```

#### Options

- `--excludeDir=<directory>`: Exclude specific directories.
- `--excludeFile=<file>`: Exclude specific files.
- `--output <file>`: Specify a custom output file name (default: `all.txt`).

#### Examples

Concatenate all files in `./src` into a single file:

```bash
flatbrain concat ./src
```

Exclude the `node_modules` directory and specify a custom output file:

```bash
flatbrain concat ./src --excludeDir=node_modules --output=myOutput.txt
```

#### Output Example

Contents of the concatenated file:

```plaintext
=== src/sub/test.js ===
console.log('Hello, world!');

=== src/index.js ===
import app from './app.js';
```

## License

MIT
