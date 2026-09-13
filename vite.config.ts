import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {createHash} from 'crypto';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

/**
 * Bygger dist/sw.js ud fra src/pwa/sw-template.js. Indsætter listen over alle
 * byggede filer + public/ (så appen virker offline efter første besøg) og en
 * version udledt af filernes indhold (så gamle caches ryddes ved nyt build).
 * Ingen afhængigheder — det er hele PWA-opsætningen.
 */
function serviceWorker(): Plugin {
  const templatePath = path.resolve(__dirname, 'src/pwa/sw-template.js');
  const publicDir = path.resolve(__dirname, 'public');

  return {
    name: 'myphoto-service-worker',
    apply: 'build',
    // Efter Vites HTML-plugin, så index.html er med i bundtet
    enforce: 'post',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256');
      const files: string[] = [];

      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName.endsWith('.map')) continue;
        files.push(fileName);
        hash.update(fileName);
        hash.update(output.type === 'chunk' ? output.code : output.source);
      }

      for (const entry of fs.readdirSync(publicDir, {recursive: true, encoding: 'utf8'})) {
        const fullPath = path.join(publicDir, entry);
        if (!fs.statSync(fullPath).isFile()) continue;
        const fileName = entry.split(path.sep).join('/');
        files.push(fileName);
        hash.update(fileName);
        hash.update(fs.readFileSync(fullPath));
      }

      const precache = files
        .sort()
        .map((fileName) => (fileName === 'index.html' ? './' : `./${fileName}`));

      const template = fs.readFileSync(templatePath, 'utf8');
      const versionLine = 'const VERSION = __VERSION__;';
      const precacheLine = 'const PRECACHE = __PRECACHE__;';
      if (!template.includes(versionLine) || !template.includes(precacheLine)) {
        this.error(`sw-template.js mangler "${versionLine}" eller "${precacheLine}"`);
      }

      const source = template
        .replace(versionLine, `const VERSION = ${JSON.stringify(hash.digest('hex').slice(0, 12))};`)
        .replace(precacheLine, `const PRECACHE = ${JSON.stringify(precache, null, 2)};`);

      this.emitFile({type: 'asset', fileName: 'sw.js', source});
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), serviceWorker()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
