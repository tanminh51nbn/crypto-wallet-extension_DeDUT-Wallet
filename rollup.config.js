import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';

export default {
  // Điểm vào (Entry point)
  input: 'popup/popup.js',
  
  // Cấu hình đầu ra (Output)
  output: {
    file: 'build/bundle.js', 
    format: 'iife',          
    name: 'MyCryptoWallet',  
    sourcemap: false,        
  },
  
  plugins: [
    // 1. Cho phép Rollup tìm các module trong node_modules
    resolve({
      browser: true, 
    }),
    
    // 2. Chuyển đổi các module CommonJS thành ES Modules (Quan trọng cho ethers.js)
    commonjs(),
    
    // 3. Chuyển đổi cú pháp JavaScript (Transpiling)
    babel({ 
      babelHelpers: 'bundled',
      exclude: 'node_modules/**', // Loại trừ mã thư viện đã được commonjs xử lý
      // Cấu hình Babel inline: lý tưởng nếu bạn không muốn dùng file .babelrc
      presets: [
          ['@babel/preset-env', {
              targets: 'defaults',
              modules: false // KHÔNG chuyển đổi modules, để Rollup tự xử lý
          }]
      ]
    }),
  ],
  
  // Gộp cấu hình cảnh báo vào một hàm duy nhất
  onwarn: function(warning, warn) {
    // Bỏ qua các cảnh báo không quan trọng và đã biết
    if (
        warning.code === 'CIRCULAR_DEPENDENCY' || 
        warning.code === 'THIS_IS_UNDEFINED' // Khắc phục cảnh báo aes-js
    ) {
      return; 
    }
    // Giữ lại các cảnh báo khác để theo dõi
    warn(warning);
  }
};