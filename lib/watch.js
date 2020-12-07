/**
 * @typedef {import('child_process').ChildProcessWithoutNullStreams} ChildProcessWithoutNullStreams
 * @typedef {import('../main').WatchOptions} WatchOptions
 */

import { spawn } from 'child_process';
import * as Path from 'path';
import * as Readline from 'readline';
import * as Ansi from '@robinblomberg/ansi';

const COMPILATION_ERROR_REGEXP = /^\[?[0-9]{2}:[0-9]{2}:[0-9]{2}\]? (?:- )?Found ([0-9]+) errors?\. Watching for file changes\./;
const COMPILATION_START_REGEXP = /^\[?[0-9]{2}:[0-9]{2}:[0-9]{2}\]? (?:- )?(?:Starting compilation in watch mode\.\.\.|File change detected\. Starting incremental compilation\.\.\.)/;
const FILE_PATH_REGEXP = /^(.*)(?=:[0-9]+:[0-9]+ - error TS[0-9]+: )|^error TS[0-9]+: File '([^']+)'/;
const TYPESCRIPT_PATH = Path.join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');

/**
 * A TypeScript --watch wrapper API.
 *
 * @see https://www.typescriptlang.org/docs/handbook/configuring-watch.html
 */
class Watcher {
  /** @type {string[]} */
  #errorFiles = [];

  /** @type {WatchOptions} */
  #options;

  /** @type {ChildProcessWithoutNullStreams | null} */
  #process = null;

  /**
   * @param {WatchOptions} [options]
   */
  constructor(options = {}) {
    this.#options = options;
  }

  kill() {
    this.#process?.kill();
  }

  watch() {
    this.#process = spawn('node', [TYPESCRIPT_PATH, '--watch', ...(this.#options.args ?? [])]);

    const readline = Readline.createInterface({
      input: this.#process.stdout
    });

    readline.on('line', (line) => {
      // Prevent console clearing:
      const buffer = Buffer.from(line);
      if (buffer.length >= 2 && buffer[0] === 0x1b && buffer[1] === 0x63) {
        line = line.substr(2);
      }

      const strippedLine = Ansi.strip(line);

      const compilationStartMatch = strippedLine.match(COMPILATION_START_REGEXP);
      if (compilationStartMatch) {
        this.#errorFiles = [];
        this.#options.onStart?.();

        return;
      }

      const compilationErrorMatch = strippedLine.match(COMPILATION_ERROR_REGEXP);
      if (compilationErrorMatch) {
        if (compilationErrorMatch[1] === '0') {
          this.#options.onSuccess?.();
        } else {
          this.#options.onError?.(this.#errorFiles);
        }

        this.#options.onFinish?.();
        this.#errorFiles = [];

        return;
      }

      const filePathMatch = strippedLine.match(FILE_PATH_REGEXP);
      if (filePathMatch) {
        const filePath = Path.resolve(process.cwd(), filePathMatch[1] ?? filePathMatch[2]);
        this.#errorFiles.push(filePath);
      }
    });
  }
}

/**
 * @param {WatchOptions} [options]
 * @return {() => void}
 */
export const watch = (options = {}) => {
  const watcher = new Watcher(options);

  watcher.watch();

  return () => watcher.kill();
};
