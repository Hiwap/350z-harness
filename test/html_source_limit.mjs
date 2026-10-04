import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const LIMIT = 117;
const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(here, 'harness_page_tests.mjs');

let text;
try {
  text = fs.readFileSync(target, 'utf8');
} catch (err) {
  console.error('Cannot read ' + target + '. ' + err.message);
  process.exit(1);
}

const count = text.split('.test(html)').length - 1;
if (count > LIMIT) {
  console.error(
    target + ' has ' + count + ' .test(html) calls. The limit is ' + LIMIT + '.\n'
    + 'Assert the loaded value from test/load_map.mjs.\n'
    + 'Do not match a sentence of the page.'
  );
  process.exit(1);
}

console.log(count + ' .test(html) calls. The limit is ' + LIMIT + '.');
