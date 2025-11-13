const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);
const DOM = {
  Common: {
    backButtons: $$('.back-button')
  },
  start: {
    createWalletBtn: $('#createWalletBtn'),
    importWalletBtn: $('#importWalletBtn')
  },
  password: {
    newPasswordInput: $('#newPassword'),
    confirmPasswordInput: $('#confirmPassword')
  },
  importMnemonic: {
    resetMnemonicBtn: $('#resetMnemonicBtn'),
    completeImportBtn: $('#completeImportBtn')
  },
  createMnemonic: {
    copySeedBtn: $('#copySeedBtn'),
    seedPhraseSavedBtn: $('#seedPhraseSavedBtn')
  },
  MnemonicGridDisplay: {
    CreateSeedPhraseDisplay: $('#CreateSeedPhraseDisplay'),
    ImportSeedPhraseDisplay: $('#ImportSeedPhraseDisplay')
  }
};
async function sendMessage(action, payload = {}) {
  return chrome.runtime.sendMessage({
    action,
    payload
  });
}
class Show {
  constructor() {
    this.majorScreens = document.querySelectorAll('.screen');
    this.toastTimeoutHandle = null;
    this.allNotifications = document.querySelectorAll('.notification-toast');
  }
  _Switch(IDscreen) {
    if (this.toastTimeoutHandle) {
      clearTimeout(this.toastTimeoutHandle);
      this.toastTimeoutHandle = null;
    }
    if (this.allNotifications) {
      this.allNotifications.forEach(notification => {
        notification.classList.remove('active');
        notification.classList.add('hidden');
      });
    }
    this.majorScreens.forEach(screen => {
      screen.classList.remove('active');
      screen.classList.add('hidden');
    });
    const targetScreen = document.getElementById(IDscreen);
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      targetScreen.classList.add('active');
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
class PasswordManager {
  constructor(domElements, showInstance, handlePasswordSuccess) {
    this.dom = domElements;
    this.show = showInstance;
    this.handlePasswordSuccess = handlePasswordSuccess;
    this.newPassInput = domElements.newPasswordInput;
    this.confirmPassInput = domElements.confirmPasswordInput;
    this.setupListeners();
  }
  setupListeners() {
    if (this.newPassInput && this.confirmPassInput) {
      this.newPassInput.addEventListener('keypress', event => {
        this.handleEnterSubmit(event, () => this.confirmPassInput.focus());
      });
      this.confirmPassInput.addEventListener('keypress', event => {
        this.handleEnterSubmit(event, () => this.checkPassword());
      });
    }
  }
  checkPassword() {
    const newPass = this.newPassInput.value;
    const confirmPass = this.confirmPassInput.value;
    if (newPass === confirmPass && newPass.length >= 8) {
      this.clearInputs();
      this.handlePasswordSuccess(confirmPass);
    } else {
      this.clearInputs();
      this.newPassInput.focus();
      this.show.Notify('ErrorCreatingPasswordNotification', 1500);
    }
  }
  handleEnterSubmit(event, callback) {
    if (event.key === 'Enter') {
      event.preventDefault();
      callback();
    }
  }
  clearInputs() {
    this.newPassInput.value = '';
    this.confirmPassInput.value = '';
  }
}
class MnemonicController {
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
      this.show.Screen('HOMEPAGE');
    });
    this.dom.importMnemonic.resetMnemonicBtn?.addEventListener('click', () => this.resetMnemonicInputs());
    this.dom.importMnemonic.completeImportBtn?.addEventListener('click', () => this.ImportMnemonicComplete());
  }

  // --- Created Logic ---
  async handleCreateWalletSetup(password) {
    const response = await sendMessage('createWallet', {
      password
    });
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
        this.show.Notify('copySuccessNotification', 1500);
      });
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
        const response = await sendMessage('importWallet', {
          seedPhrase,
          password
        });
        if (response.status === 'success') {
          this.show.Screen('HOMEPAGE');
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        this.show.Notify('incorrectMnemonicNotification', 1500);
      }
    } else {
      this.show.Notify('Less-than-12-words', 1500);
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

  //đóng vai trò như tạo thẻ trong HTML
  renderSeedPhrase(seedPhrase, displayElement, action) {
    if (!displayElement) return;
    displayElement.innerHTML = '';
    const loopCount = action === 'input' ? 12 : seedPhrase.length;
    for (let index = 0; index < loopCount; index++) {
      const word = seedPhrase[index] || '';
      const seedItem = document.createElement('div');
      seedItem.classList.add('seed-item');
      const number = document.createElement('span');
      number.classList.add('seed-number');
      number.textContent = `${index + 1}.`;
      seedItem.appendChild(number);
      if (action === 'display') {
        const wordDisplay = document.createElement('span');
        wordDisplay.classList.add('seed-word');
        wordDisplay.textContent = word;
        seedItem.appendChild(wordDisplay);
      }
      if (action === 'input') {
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
class AppController {
  constructor() {
    this.show = new Show();
    this.currentAction = null;
    this.mnemonicController = new MnemonicController(DOM, this.show);
    this.passwordManager = new PasswordManager(DOM.password, this.show, this.handlePasswordSuccess.bind(this));
  }
  handlePasswordSuccess(password) {
    if (!password) {
      return;
    }
    if (this.currentAction === 'create') {
      this.mnemonicController.handleCreateWalletSetup(password);
      this.show.Screen('showSeedCreatedScreen');
    } else if (this.currentAction === 'import') {
      this.mnemonicController.handleImportWalletSetup(password);
      this.show.Screen('importMnemonicScreen');
    }
  }
  setupMainListeners() {
    DOM.start.createWalletBtn?.addEventListener('click', () => {
      this.currentAction = 'create';
      this.show.Screen('createPasswordScreen');
    });
    DOM.start.importWalletBtn?.addEventListener('click', () => {
      this.currentAction = 'import';
      this.show.Screen('createPasswordScreen');
    });
    DOM.Common.backButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (button.getAttribute('data-target') === 'welcomeScreen') {
          this.currentAction = null;
        }
        this.show.Screen(button.getAttribute('data-target') || 'welcomeScreen');
      });
    });
  }
  async init() {
    const statusResponse = await sendMessage('checkWalletStatus');
    if (statusResponse.status === 'success' && statusResponse.exists) {
      this.show.Screen('HOMEPAGE');
    } else {
      this.show.Screen('welcomeScreen');
    }
    this.setupMainListeners();
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
