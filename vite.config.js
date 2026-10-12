import { defineConfig } from 'vite';
import {resolve} from 'node:path';
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {input: Object.fromEntries(['index','stock','sold','request','contact','phone','admin'].map(name=>[name,resolve(import.meta.dirname,`${name}.html`)]))}
  }
});
