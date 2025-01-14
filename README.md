# Flatbrain: File Structure Flattener

Flatbrain is a command-line tool that flattens a directory's file structure by copying all files into a single directory. Subdirectories are represented in filenames using a `^` delimiter. This tool is particularly useful for LLM projects or managing files with nested structures.

## Features

- Recursively flattens files from a directory into a `flattened` directory.
- Allows excluding specific directories and files.
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

The `flatten` command processes the specified directory and creates a `flattened` folder containing all files with flattened paths.

### Command Syntax

```bash
flatbrain flatten <directory> [options]
```

### Options

- `--excludeDir=<directory>`: Exclude specific directories.
- `--excludeFile=<file>`: Exclude specific files.

### Examples

#### Basic Usage

Flatten all files in the `./src` directory:

```bash
flatbrain flatten ./src
```

#### Exclude Specific Directories

Exclude the `node_modules` directory:

```bash
flatbrain flatten ./src --excludeDir=node_modules
```

#### Exclude Specific Files

Exclude a specific file, e.g., `test.js`:

```bash
flatbrain flatten ./src --excludeFile=test.js
```

#### Combined Usage

Flatten `./src`, excluding `node_modules` and `test.js`:

```bash
flatbrain flatten ./src --excludeDir=node_modules --excludeFile=test.js
```

## Output

The flattened files are stored in a directory named `flattened` within the specified directory. Subdirectories are represented using a `^` character in filenames. For example:

```plaintext
./src/sub/test.js → ./flattened/sub^test.js
```

## License

MIT
