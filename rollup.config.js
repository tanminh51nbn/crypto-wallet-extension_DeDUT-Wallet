// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';

const outputDir = 'build';

// === PLUGINS CẦN THIẾT CHO EXTENSION ===
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
    extensions: ['.js', '.ts'], // nếu bạn dùng TypeScript
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
    input: 'popup/popup.js',
    output: {
      dir: outputDir,
      format: 'esm',
      entryFileNames: 'popup.js',
      sourcemap: false,
    },
    context: 'window',
    moduleContext: moduleContextConfig,
    plugins: commonPlugins,
  },

  // ==================== SERVICE WORKER (IIFE) ====================
  {
    input: 'service-worker.js',
    output: {
      dir: outputDir,
      format: 'iife',
      name: 'ServiceWorkerGlobal',
      entryFileNames: 'service-worker.js',
      sourcemap: false,
    },
    context: 'self',
    moduleContext: () => 'self',
    plugins: commonPlugins,
    moduleContext: moduleContextConfig,
  },
];