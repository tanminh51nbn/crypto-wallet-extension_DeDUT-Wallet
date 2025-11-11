import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';


const outputDir = 'build';
export default {
  
  input: 'popup/popup.js',
  output: {
    dir: outputDir, 
    format: 'esm',          
    sourcemap: false,        
  },
  
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    
    copy({
      targets: [
        {
          src: 'node_modules/argon2-browser/dist/argon2.wasm',
          dest: outputDir,
        },
        { src: 'public/*', dest: outputDir }
      ]
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
  ],
  
  onwarn: function(warning, warn) {
    warn(warning);
  }
};