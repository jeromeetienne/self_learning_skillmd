#!/usr/bin/env node
import Path from 'node:path';
import Url from 'node:url';
import * as TsxEsmApi from 'tsx/esm/api';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

// The source of the tools is TypeScript, so tsx compiles it before Node.js imports it. A published package ships
// compiled JavaScript instead, and then this wrapper imports the JavaScript directly.
TsxEsmApi.register();
await import(Url.pathToFileURL(Path.join(__dirname, '..', 'src', 'cli.ts')).href);
