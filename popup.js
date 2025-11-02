function showScreen(targetId) {
    // 1. Lấy tất cả các màn hình
    const screens = document.querySelectorAll('.screen');
    
    // 2. Ẩn tất cả các màn hình
    screens.forEach(screen => {
        screen.classList.remove('active');
        screen.classList.add('hidden');
    });

    // 3. Hiện màn hình mục tiêu
    const targetScreen = document.getElementById(targetId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('active');
    }
}

function displaySeedPhrase(seedPhrase) {
    const displayElement = document.getElementById('seedPhraseDisplay');
    if (!displayElement) return;

    displayElement.innerHTML = ''; // Xóa nội dung cũ

    seedPhrase.forEach((word, index) => {
        const seedItem = document.createElement('div');
        seedItem.classList.add('seed-item'); // Dùng class tương tự
        
        // Số thứ tự
        const numberSpan = document.createElement('span');
        numberSpan.classList.add('seed-number');
        numberSpan.textContent = `${index + 1}.`;

        // Từ (Sử dụng span để hiển thị thay vì input)
        const wordDisplay = document.createElement('span'); 
        wordDisplay.classList.add('seed-word-display'); // Class mới cho từ hiển thị
        wordDisplay.textContent = word;

        seedItem.appendChild(numberSpan);
        seedItem.appendChild(wordDisplay); // Thêm span hiển thị
        
        displayElement.appendChild(seedItem);
    });

    // Lưu Seed Phrase vào bộ nhớ tạm thời để xử lý nút Copy
    displayElement.dataset.seed = seedPhrase.join(' ');
}

function init() {
    const createWalletBtn = document.getElementById('createWalletBtn');
    const importWalletBtn = document.getElementById('importWalletBtn');
    const backToWelcomeBtn = document.querySelectorAll('.back-button');
    
    const createPasswordScreen = document.getElementById('createPasswordScreen');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    const seedPhraseSavedBtn = document.getElementById('seedPhraseSavedBtn');
    const copySeedBtn = document.getElementById('copySeedBtn');
    const seedPhraseDisplay = document.getElementById('seedPhraseDisplay');
    
    const mnemonicInputGrid = document.getElementById('mnemonicInputGrid');
    const mnemonicInputs = mnemonicInputGrid ? mnemonicInputGrid.querySelectorAll('input[type="text"]') : [];
    const resetMnemonicBtn = document.getElementById('resetMnemonicBtn');

    if (createWalletBtn) {
        createWalletBtn.addEventListener('click', () => {
            showScreen('createPasswordScreen');
            CreatePassword('showSeedScreen');
        });
    }
    function CreatePassword(IDScreen) {
        if (createPasswordScreen && newPasswordInput && confirmPasswordInput) {
            confirmPasswordInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Ngăn chặn hành vi submit form mặc định
                    
                    const newPass = newPasswordInput.value;
                    const confirmPass = confirmPasswordInput.value;

                    if (newPass === confirmPass && newPass.length >= 8) {
                        showScreen(IDScreen);

                        //Giả sử
                        const seedPhrase = ["abandon", "ability", "about", "above", "absent", "absorb", "abstract", "abuse", 
        "access", "account", "accuse", "achieve"];
                        displaySeedPhrase(seedPhrase);
                        
                        newPasswordInput.value = '';
                        confirmPasswordInput.value = '';
                    } else {
                        alert('Password does not match or is too short (min 8 chars suggested). Please try again.');
                        
                        newPasswordInput.value = '';
                        confirmPasswordInput.value = '';
                        newPasswordInput.focus();
                    }
                }
            });
        }
    }
    
    if (seedPhraseSavedBtn) {
        seedPhraseSavedBtn.addEventListener('click', () => {
            showScreen('HOMEPAGE'); // Chuyển sang Trang chủ
        });
    }
    if (copySeedBtn && seedPhraseDisplay) {
        copySeedBtn.addEventListener('click', () => {
            const seed = seedPhraseDisplay.dataset.seed;
            if (seed) {
                // Sử dụng Clipboard API để copy
                navigator.clipboard.writeText(seed).then(() => {
                    alert('Copied!');
                }).catch(err => {
                    console.error('Không thể sao chép: ', err);
                    alert('Copy error! Please copy manually.');
                });
            }
        });
    }
//-----------------------------------------------------------------------------------------------
    if (importWalletBtn) {
        importWalletBtn.addEventListener('click', () => {
            showScreen('importMnemonicScreen'); 
        });
    }
    function areAllMnemonicInputsFilled() {
        if (mnemonicInputs.length !== 12) return false;
        for (const input of mnemonicInputs) {
            // Kiểm tra xem ô có giá trị và không rỗng
            if (!input.value.trim()) {
                return false;
            }
        }
        return true;
    }
    function handleSmartPaste(event) {
        // Chỉ xử lý nếu event là paste
        if (event.type !== 'paste') return; 

        const clipboardData = event.clipboardData || window.clipboardData;
        // Lấy nội dung clipboard, loại bỏ khoảng trắng thừa
        const pastedText = clipboardData.getData('Text').trim();
        // Tách chuỗi thành mảng các từ bằng khoảng trắng
        const words = pastedText.split(/\s+/).filter(word => word.length > 0); 

        // Nếu có nhiều hơn 1 từ, thực hiện dán thông minh
        if (words.length > 1) {
            event.preventDefault(); // Ngăn chặn hành vi dán mặc định

            // Lấy index của ô input hiện tại (dùng data-index)
            const currentInput = event.target;
            const startIndex = parseInt(currentInput.getAttribute('data-index')) - 1; // index trong mảng (0-11)

            for (let i = 0; i < words.length; i++) {
                const inputIndex = startIndex + i;
                if (inputIndex < mnemonicInputs.length) {
                    // Điền từ vào ô input tương ứng
                    mnemonicInputs[inputIndex].value = words[i];
                }
            }
            
            // Di chuyển focus đến ô cuối cùng nếu điền đủ
            const lastFilledIndex = startIndex + words.length - 1;
            if (lastFilledIndex < mnemonicInputs.length - 1) {
                mnemonicInputs[lastFilledIndex + 1].focus();
            } else {
                // Nếu 12 ô đã điền, focus vào ô cuối cùng (để người dùng Enter)
                mnemonicInputs[11].focus();
            }
        }
    }
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            const currentInput = event.target;
            const currentIndex = parseInt(currentInput.getAttribute('data-index'));

            // Chỉ xử lý Enter ở ô thứ 12
            if (currentIndex === 12) {
                event.preventDefault(); 
                
                // Kiểm tra đủ 12 từ
                if (areAllMnemonicInputsFilled()) {
                    
                    // --- GHI CHÚ: Logic xác thực Seed Phrase sẽ được thêm vào ĐÂY ---
                    // if (validateSeedPhrase(mnemonicInputs.map(i => i.value))) {
                    //     showScreen('createPasswordScreen');
                    // } else {
                    //     alert('Seed Phrase không hợp lệ. Vui lòng kiểm tra lại.');
                    // }
                    
                    // Hiện tại, giả định là đúng và chuyển sang tạo mật khẩu
                    showScreen('createPasswordScreen');
                    CreatePassword('HOMEPAGE')
                    // Xóa các ô nhập sau khi chuyển màn hình (giữ cho sạch sẽ)
                    resetMnemonicInputs();

                } else {
                    alert('Please enter all 12 Seed Phrases.');
                }
            } else if (currentIndex < 12) {
                // Nếu Enter ở ô 1-11, chuyển đến ô tiếp theo
                event.preventDefault();
                mnemonicInputs[currentIndex].focus();
            }
        }
    }
    function resetMnemonicInputs() {
        mnemonicInputs.forEach(input => input.value = '');
        if (mnemonicInputs.length > 0) {
            mnemonicInputs[0].focus(); // Focus vào ô đầu tiên
        }
    }
    if (mnemonicInputGrid) {
        mnemonicInputs.forEach(input => {
            // Lắng nghe sự kiện paste
            input.addEventListener('paste', handleSmartPaste);
            // Lắng nghe sự kiện keypress (để xử lý Enter)
            input.addEventListener('keypress', handleEnterKey);
        });
    }
    if (resetMnemonicBtn) {
        resetMnemonicBtn.addEventListener('click', resetMnemonicInputs);
    }
//-----------------------------------------------------------------------------------------------
    if (backToWelcomeBtn) {
        backToWelcomeBtn.forEach(button => {
            button.addEventListener('click', () => {
                const targetScreenId = button.getAttribute('data-target');
                if (targetScreenId) {
                    showScreen(targetScreenId);
                } else {
                    showScreen('welcomeScreen');
                }
            });
        });
    }
}
document.addEventListener('DOMContentLoaded', init);