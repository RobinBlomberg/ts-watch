import Fs from 'fs';
import Path from 'path';
import { watch } from '../lib/index.js';

const TEST_FILE_DIR = Path.join(process.cwd(), 'test', '.files');
const TEST_FILE_PATH = Path.join(TEST_FILE_DIR, 'test.js');

Fs.rmdirSync(TEST_FILE_DIR, { recursive: true });
Fs.mkdirSync(TEST_FILE_DIR);
Fs.writeFileSync(TEST_FILE_PATH, '/** @type {string} */ let s = 4;');

const killTsWatch = watch({
  args: [TEST_FILE_PATH, '--checkJs', '--noEmit'],
  onError: () => {
    Fs.writeFileSync(TEST_FILE_PATH, '/** @type {number} */ let s = 4;');
  },
  onSuccess: () => {
    killTsWatch();

    Fs.rmdirSync(TEST_FILE_DIR, { recursive: true });
  }
});
