import { ReadMnemonic } from '../walletService.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const DOM = {
    Common: {
        backButtons: $$('.back-button'),
    },
    start: {
        createWalletBtn: $('#createWalletBtn'),
        importWalletBtn: $('#importWalletBtn'),
    },
    password: {
        newPasswordInput: $('#newPassword'),
        confirmPasswordInput: $('#confirmPassword'),
    },
    importMnemonic: {
        mnemonicInputGrid: $('#mnemonicInputGrid'),
        resetMnemonicBtn: $('#resetMnemonicBtn'),
    },
    createMnemonic:{
        copySeedBtn: $('#copySeedBtn'),
        seedPhraseSavedBtn: $('#seedPhraseSavedBtn'),
    },
    MnemonicGridDisplay: {
        CreateSeedPhraseDisplay: $('#CreateSeedPhraseDisplay'),
        ImportSeedPhraseDisplay: $('#ImportSeedPhraseDisplay'),
    }
};
let currentAction = null;
let show;
function init() {
    show=new Show();
    
    if(DOM.start.createWalletBtn) {
        DOM.start.createWalletBtn.addEventListener('click', () => {
            currentAction = 'create';
            show.Screen('createPasswordScreen');
        });
    }
    
    if(DOM.start.importWalletBtn) {
        DOM.start.importWalletBtn.addEventListener('click', () => {
            currentAction = 'import';
            show.Screen('createPasswordScreen');
        });
    }
    if(DOM.password.newPasswordInput && DOM.password.confirmPasswordInput) {
        setupPasswordEnter(DOM.password.newPasswordInput, DOM.password.confirmPasswordInput);
    }
    if (DOM.createMnemonic.copySeedBtn) {
        DOM.createMnemonic.copySeedBtn.addEventListener('click', () => {
            const seed = seedPhrases.join(' ');
            if (seed) {
                navigator.clipboard.writeText(seed).then(() => {
                    alert('Copied!');
                }).catch(err => {
                    console.error('Không thể sao chép: ', err);
                    alert('Copy error! Please copy manually.');
                });
            }
        });
    }

    if (DOM.createMnemonic.seedPhraseSavedBtn) {
        DOM.createMnemonic.seedPhraseSavedBtn.addEventListener('click', () => {
            show.Screen('HOMEPAGE'); 
        });
    }
    if (DOM.importMnemonic.resetMnemonicBtn) {
        DOM.importMnemonic.resetMnemonicBtn.addEventListener('click', () => {
            const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');
    
            allInputs.forEach(input => {
                input.value = '';
            });
            
            if (allInputs.length > 0) {
                allInputs[0].focus();
            }
        });
    }
    
        //Logic Back
    DOM.Common.backButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.getAttribute('data-target') === 'welcomeScreen') {
                 currentAction = null; 
            }
            show.Screen(button.getAttribute('data-target') || 'welcomeScreen');
        });
    });
}

async function checkIfMnemonicComplete() {
    const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');
    
    let isComplete = true;
    let filledCount = 0;
    
    allInputs.forEach(input => {
        if (input.value.trim() === '') {
            isComplete = false;
        } else {
            filledCount++;
        }
    });

    if (isComplete && filledCount === 12) {
        let inputWords = Array.from(allInputs).map(input => input.value.trim());
        let seedPhrase = inputWords.join(' ');
        
        try {
            // Gọi hàm ReadMnemonic từ walletService.js
            const walletInfo = await ReadMnemonic(seedPhrase); 
            
            // Xử lý khi khôi phục thành công:
            show.Screen('HOMEPAGE'); 
            
            return true;
            
        } catch (error) {
            // Xử lý khi Seed Phrase không hợp lệ (lỗi từ ReadMnemonic)
            console.error("Lỗi khi khôi phục ví:", error.message);
            show.Notify('incorrectMnemonicNotification', 2500); // Giả định có ID thông báo này
            
            return false;
        }
    }
    return false;
}

//Hàm tự động paste
function handleMnemonicPaste(event) {
    event.preventDefault(); 
    
    const pastedData = event.clipboardData.getData('text');
    const words = pastedData.trim().split(/\s+/); 

    if (words.length === 0) return; // Không có từ nào

    const currentInput = event.target;
    const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');

    let startIndex = -1;
    for (let i = 0; i < allInputs.length; i++) {
        if (allInputs[i] === currentInput) {
            startIndex = i;
            break;
        }
    }
    
    for (let i = 0; i < words.length; i++) {
        const targetIndex = startIndex + i;
        
        if (targetIndex < allInputs.length) { 
            allInputs[targetIndex].value = words[i];
        } else {
            break; 
        }
    }
    
    if (startIndex + words.length < allInputs.length) {
        allInputs[startIndex + words.length].focus();
    }
}

//Hàm có chức năng khi enter sẽ dùng hàm checkPassword
function setupPasswordEnter(newPasswordInput, confirmPasswordInput) {
    newPasswordInput.addEventListener('keypress', (event) => {
        handleEnterSubmit(event, () => { 
            confirmPasswordInput.focus();
        });
    });
    confirmPasswordInput.addEventListener('keypress', (event) => {
        handleEnterSubmit(event, () => {
            handlePasswordCheck(newPasswordInput, confirmPasswordInput);
        });
    });
}
//Hàm để checkpasword
function handlePasswordCheck(newPasswordInput, confirmPasswordInput) {
    const newPass = newPasswordInput.value;
    const confirmPass = confirmPasswordInput.value;

    if (newPass === confirmPass && newPass.length >= 8) {
        // ... (Logic lưu mật khẩu,)

        newPasswordInput.value = '';
        confirmPasswordInput.value = '';

        if (currentAction == 'create') {
            let seedPhrases = "hospital spoon jeans company script glory diagram spell gap toy remind force";
            seedPhrases = seedPhrases.split(' ');
            displaySeedPhrase(seedPhrases, 'CreateSeedPhraseDisplay', 'display');
            show.Screen('showSeedCreatedScreen'); 
        } else if (currentAction == 'import') {
            displaySeedPhrase([], 'ImportSeedPhraseDisplay', 'input'); 
            show.Screen('importMnemonicScreen'); 
        }
    } else {
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        newPasswordInput.focus();
    }
}
//Hàm xử lí sự kiện enter (Làm cho gọn code thôi)
function handleEnterSubmit(event, callback) {
    if (event.key === 'Enter') {
        event.preventDefault();
        callback();
    }
}
//Hàm hiển thị seedPhrases dạng bảng
function displaySeedPhrase(seedPhrase, targetKey, action) {
    const displayElement = DOM.MnemonicGridDisplay[targetKey];
    if (!displayElement) return;

    displayElement.innerHTML = '';

    let loopCount = seedPhrase.length;
    if (action === 'input') {
        loopCount = Math.max(12, seedPhrase.length);
    }

    for (let index = 0; index < loopCount; index++) {
        const word = seedPhrase[index] || ''; 
        
        const seedItem = document.createElement('div');
        seedItem.classList.add('seed-item');
        
        const number = document.createElement('span');
        number.classList.add('seed-number');
        number.textContent = `${index + 1}.`;
        seedItem.appendChild(number);

        if(action=='display'){
            const wordDisplay = document.createElement('span'); 
            wordDisplay.classList.add('seed-word'); 
            wordDisplay.textContent = word;
            seedItem.appendChild(wordDisplay);
        }
        if((action=='input')){
            const wordDisplay = document.createElement('input'); 
            wordDisplay.type = 'text';
            wordDisplay.dataset.index = index + 1;
            wordDisplay.classList.add('seed-word');

            wordDisplay.addEventListener('paste', handleMnemonicPaste);
            wordDisplay.addEventListener('keyup', checkIfMnemonicComplete);
            
            seedItem.appendChild(wordDisplay);
        }

        displayElement.appendChild(seedItem);
    }
    //Lưu trữ ở đây
}
//Lớp chức năng tương tác với màn hình/hiển thị
class Show {
    constructor() {
        this.majorScreens = document.querySelectorAll('.screen');
        this.currentScreenId = null;
        this.toastTimeoutHandle = null;
    }
    _Switch(IDscreen) {
        if (this.toastTimeoutHandle) {
             clearTimeout(this.toastTimeoutHandle);
             this.toastTimeoutHandle = null;
        }
        this.majorScreens.forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        const targetScreen = document.getElementById(IDscreen);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
            this.currentScreenId = IDscreen;
        }
    }
    Screen(IDscreen) {
        this._Switch(IDscreen);
    }
    Notify(IDscreen, durationMs = 1500) {
        const targetNotification = document.getElementById(IDscreen);

        if (this.toastTimeoutHandle) {
            clearTimeout(this.toastTimeoutHandle);
        }

        targetNotification.classList.remove('hidden');
        targetNotification.classList.add('active');

        this.toastTimeoutHandle = setTimeout(() => {
            targetNotification.classList.remove('active');
            
            setTimeout(() => {
                targetNotification.classList.add('hidden');
                this.toastTimeoutHandle = null; 
            }, 500); 
            
        }, durationMs);
    }
}
document.addEventListener('DOMContentLoaded', init);