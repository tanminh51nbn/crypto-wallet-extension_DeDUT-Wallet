import { sendMessage } from '../utils/dom-selectors.js';

export class MnemonicController {
    constructor(domElements, showInstance) {
        this.dom = domElements;
        this.show = showInstance;
        this._tempPassword = null;
        this.isProcessing = false;
        this._TempMnemonic = null;
        this.setupListeners();
    }
    
    setupListeners() {
        this.dom.createMnemonic.copySeedBtn?.addEventListener('click', () => this.copySeedPhrase());
        this.dom.createMnemonic.seedPhraseSavedBtn?.addEventListener('click', () => {
            window.close(); 
        });
        this.dom.importMnemonic.resetMnemonicBtn?.addEventListener('click', () => this.resetMnemonicInputs());
        this.dom.importMnemonic.completeImportBtn?.addEventListener('click', () => this.ImportMnemonicComplete());
    }
    
    // --- Created Logic ---
    async handleCreateWalletSetup(password) {
        const response = await sendMessage('createWallet', { password });
        if (response.status === 'success') {
            this._TempMnemonic = response.mnemonic;
            const displayElement = this.dom.MnemonicGridDisplay.CreateSeedPhraseDisplay;
            this.renderSeedPhrase(response.mnemonic, displayElement, 'display');
        } else {
            console.error(response.message);
        }
    }
    async copySeedPhrase() {
        const seed = await this._TempMnemonic.join(' ');
        if (seed) {
            navigator.clipboard.writeText(seed).then(() => {
                this.show.MakeAlert('success', 'Copied!', 3000);
            })
        }
    }

    // --- Imported Logic ---
    handleImportWalletSetup(password) {
        this._tempPassword = password; 
        const displayElement = this.dom.MnemonicGridDisplay.ImportSeedPhraseDisplay;
        this.renderSeedPhrase([], displayElement, 'input');
    }

    resetMnemonicInputs() {
        const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');
        allInputs.forEach(input => input.value = '');
        if (allInputs.length > 0) {
            allInputs[0].focus();
        }
    }

    async ImportMnemonicComplete() {
        const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');
        const inputWords = Array.from(allInputs).map(input => input.value.trim());
        const filledCount = inputWords.filter(word => word !== '').length;

        const seedPhrase = inputWords.join(' ');
        if (filledCount === 12) {
            try {
                const password = this._tempPassword; 
                this._tempPassword = null;

                this.show.LoadingOverlay(true);
                const response = await sendMessage('importWallet', { seedPhrase, password });
                this.show.LoadingOverlay(false);

                if (response.status === 'success') {
                    window.close();
                } else {
                    throw new Error(response.message);
                } 
            } catch (error) {
                this.show.MakeAlert('error', 'Invalid seed phrase!', 3000);
            }
        } else {
            this.show.MakeAlert('error', 'You have not entered all 12 words!', 3000);
        }
    }

    handleMnemonicPaste(event) {
        event.preventDefault(); 
        const pastedData = event.clipboardData.getData('text');
        const words = pastedData.trim().split(/\s+/); 
        if (words.length === 0) return;

        const currentInput = event.target;
        const allInputs = document.querySelectorAll('#ImportSeedPhraseDisplay .seed-word');

        let startIndex = Array.from(allInputs).indexOf(currentInput);
        
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

    // đóng vai trò tạo thẻ trong HTML
    renderSeedPhrase(seedPhrase, displayElement, action) {
        if (!displayElement) return;

        displayElement.innerHTML = '';
        const loopCount = (action === 'input') ? 12 : seedPhrase.length;

        for (let index = 0; index < loopCount; index++) {
            const word = seedPhrase[index] || ''; 
            
            const seedItem = document.createElement('div');
            seedItem.classList.add('seed-item');
            
            const number = document.createElement('span');
            number.classList.add('seed-number');
            number.textContent = `${index + 1}.`;
            seedItem.appendChild(number);

            if(action === 'display'){
                const wordDisplay = document.createElement('span'); 
                wordDisplay.classList.add('seed-word'); 
                wordDisplay.textContent = word;
                seedItem.appendChild(wordDisplay);
            }
            if(action === 'input'){
                const wordDisplay = document.createElement('input'); 
                wordDisplay.type = 'text';
                wordDisplay.dataset.index = index + 1;
                wordDisplay.classList.add('seed-word');

                wordDisplay.addEventListener('paste', this.handleMnemonicPaste.bind(this));
                
                seedItem.appendChild(wordDisplay);
            }
            displayElement.appendChild(seedItem);
        }
    }
}