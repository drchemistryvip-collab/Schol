import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

// Find all HTML files in the project root for multi-page support
const htmlFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.html'))
  .reduce((entries: Record<string, string>, file) => {
    const name = file.replace(/\.html$/, '');
    entries[name] = path.resolve(__dirname, file);
    return entries;
  }, {});

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'copy-root-static-assets',
        closeBundle() {
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) return;

          const files = fs.readdirSync(__dirname);
          files.forEach(file => {
            // Copy all .js, .json, .css, .txt, .svg, .png and Netlify redirect files from root
            const isTargetExt = /\.(js|json|css|txt|svg|png|ico|webmanifest)$/i.test(file);
            const isSpecialFile = ['_redirects', '_headers', 'netlify.toml'].includes(file);
            const isExcluded = [
              'package.json',
              'package-lock.json',
              'tsconfig.json',
              'bun.lock'
            ].includes(file) || (file.startsWith('.') && !isSpecialFile);

            if ((isTargetExt || isSpecialFile) && !isExcluded) {
              const srcPath = path.resolve(__dirname, file);
              const destPath = path.resolve(distDir, file);
              try {
                fs.copyFileSync(srcPath, destPath);
              } catch (e) {
                console.warn(`Could not copy ${file}:`, e);
              }
            }
          });
          console.log('✓ Successfully copied all root scripts and static assets to dist/');
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: htmlFiles,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
