#!/usr/bin/env node
/** Thin alias — prefer harness_page_tests.mjs */
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const main = path.join(__dirname, 'harness_page_tests.mjs');
const args = [main, ...process.argv.slice(2)];
const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
