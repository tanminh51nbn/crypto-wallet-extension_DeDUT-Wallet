// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import terser from '@rollup/plugin-terser';

const outputDir = 'build';
const TerserOptions = terser({
    compress: {
        drop_console: true, 
        drop_debugger: true, 
        dead_code: true,
    },
    
    output: {
        comments: false, 
        beautify: true, 
    },
});
const commonPlugins = [
  // 1. Resolve node_modules (ethers, @noble/hashes, v.v.)
  resolve({
    browser: true,
    preferBuiltins: false,
    mainFields: ['browser', 'module', 'main'],
    extensions: ['.mjs', '.js', '.json'],
    exportConditions: ['module', 'import', 'default'],
  }),

  // 2. Chuyển CJS → ESM (ethers, aes-js, v.v.)
  commonjs({
    include: [/node_modules/],
    transformMixedEsModules: true,
    requireReturnsDefault: 'auto',
  }),

  // 3. Babel: hỗ trợ syntax hiện đại, bundled helpers
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    extensions: ['.js'],
  }),
];

// === CONTEXT FIX CHO aes-js (nếu dùng ethers) ===
const moduleContextConfig = {
  'node_modules/aes-js/': 'self',
  'node_modules/ethers/node_modules/aes-js/': 'self',
};

export default [
  // ==================== POPUP (ESM) ====================
  {
    input: 'src/popup/popup.js',
    output: {
      dir: `${outputDir}/src/popup`,
      format: 'esm',
      sourcemap: false,
    },
    context: 'window',
    moduleContext: moduleContextConfig,
    plugins: [
      ...commonPlugins,
      copy({
          targets: [
              // A. Copy Public Assets
              { src: 'manifest.json', dest: outputDir},
              { src: 'icons', dest: outputDir }, 

              // B. Copy Popup UI files
              { src: `src/popup/popup.html`, dest: `${outputDir}/src/popup` },
              { src: `src/popup/popup.css`, dest: `${outputDir}/src/popup` },
              
              // C. Copy WASM module
              { src: 'node_modules/argon2-wasm/generated/argon2.wasm', dest: `${outputDir}/src/background` },
          ],
          hook: 'writeBundle', 
      }),
      TerserOptions,
    ]
  },

  // ==================== SERVICE WORKER (IIFE) ====================
  {
    input: 'src/background/service-worker.js',
    output: {
      dir: `${outputDir}/src/background`,
      format: 'esm',
      entryFileNames: 'service-worker.js',
      sourcemap: false,
    },
    context: 'self',
    moduleContext: () => 'self',
    plugins: [
    ...commonPlugins,
    TerserOptions,
    ],
    moduleContext: moduleContextConfig,
  },
];