import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';


const outputDir = 'build';
const onwarnFunction = function(warning, warn) {
    if (warning.code === 'THIS_IS_UNDEFINED') {
        if (warning.loc && warning.loc.file && warning.loc.file.includes('aes-js')) {
            return; 
        }
    }
    warn(warning);
};
const commonPlugins = [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs({
      transformMixedEsModules: true,
    }),
    babel({ 
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
          ['@babel/preset-env', {
              targets: 'defaults',
              modules: false
          }]
      ]
    }),
];
const moduleContextConfig = {
    'node_modules/aes-js/': 'window',
    'node_modules/ethers/node_modules/aes-js/': 'window'
};
const copyPluginConfig = copy({
    targets: [
      {
        src: 'node_modules/argon2-browser/dist/argon2.wasm',
        dest: outputDir,
      },
      // TƯƠNG LAI: Nếu thư viện X cần file data/wasm khác
      // {
      //   src: 'node_modules/X/dist/-filelib.xxx',
      //   dest: outputDir,
      // },
      { src: 'public/*', dest: outputDir }
    ]
});

export default [
  // Cấu hình 1: popup/popup.js (Popup UI)
  {
    input: 'popup/popup.js',
    output: {
      file: `${outputDir}/popup.js`, 
      format: 'esm',          
      sourcemap: false,        
    },
    plugins: [
        ...commonPlugins,
        //copyPluginConfig,
    ],
    moduleContext: moduleContextConfig,
    onwarn: onwarnFunction,
  },
  
  // Cấu hình 2: service-worker.js (Background Script)
  {
    input: 'service-worker.js',
    output: {
      file: `${outputDir}/service-worker.js`, 
      format: 'esm', 
      sourcemap: false,
    },
    plugins: commonPlugins,
    moduleContext: moduleContextConfig,
    onwarn: onwarnFunction,
  }
];
