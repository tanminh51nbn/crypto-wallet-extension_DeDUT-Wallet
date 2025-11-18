const e = e => document.querySelector(e), t = {
    Common: {
        backButtons: (s = ".back-button", document.querySelectorAll(s)),
        loadingOverlay: e("#loadingOverlay")
    },
    start: {
        createWalletBtn: e("#createWalletBtn"),
        importWalletBtn: e("#importWalletBtn")
    },
    password: {
        newPasswordInput: e("#newPassword"),
        confirmPasswordInput: e("#confirmPassword")
    },
    unlock: {
        unlockPasswordInput: e("#unlockPasswordInput")
    },
    importMnemonic: {
        resetMnemonicBtn: e("#resetMnemonicBtn"),
        completeImportBtn: e("#completeImportBtn")
    },
    createMnemonic: {
        copySeedBtn: e("#copySeedBtn"),
        seedPhraseSavedBtn: e("#seedPhraseSavedBtn")
    },
    MnemonicGridDisplay: {
        CreateSeedPhraseDisplay: e("#CreateSeedPhraseDisplay"),
        ImportSeedPhraseDisplay: e("#ImportSeedPhraseDisplay")
    },
    home: {
        HOMEPAGE: document.getElementById("HOMEPAGE"),
        NetworkName: document.getElementById("NetworkName"),
        WalletAddressDisplay: document.getElementById("WalletAddressDisplay"),
        CopyAddressBtn: document.getElementById("CopyAddressBtn"),
        WalletBalanceAmount: document.getElementById("WalletBalanceAmount"),
        SendTxBtn: document.getElementById("SendTxBtn"),
        ReceiveTxBtn: document.getElementById("ReceiveTxBtn"),
        LockWalletManually: document.getElementById("LockWalletManually")
    }
};

var s;

async function n(e, t = {}) {
    return chrome.runtime.sendMessage({
        action: e,
        payload: t
    });
}

class a {
    constructor() {
        this.majorScreens = document.querySelectorAll(".screen"), this.toastTimeoutHandle = null, 
        this.allNotifications = document.querySelectorAll(".notification-toast"), this.loadingOverlay = document.getElementById("loadingOverlay");
    }
    _Switch(e) {
        this.toastTimeoutHandle && (clearTimeout(this.toastTimeoutHandle), this.toastTimeoutHandle = null), 
        this.allNotifications && this.allNotifications.forEach(e => {
            e.classList.remove("active"), e.classList.add("hidden");
        }), this.majorScreens.forEach(e => {
            e.classList.remove("active"), e.classList.add("hidden");
        });
        const t = document.getElementById(e);
        t && (t.classList.remove("hidden"), t.classList.add("active"));
    }
    Screen(e) {
        this._Switch(e);
    }
    LoadingOverlay(e) {
        this.loadingOverlay && (e ? (this.loadingOverlay.classList.remove("hidden"), this.loadingOverlay.classList.add("active")) : (this.loadingOverlay.classList.remove("active"), 
        this.loadingOverlay.classList.add("hidden")));
    }
    Notify(e, t = 1500) {
        const s = document.getElementById(e);
        this.toastTimeoutHandle && clearTimeout(this.toastTimeoutHandle), s.classList.remove("hidden"), 
        s.classList.add("active"), this.toastTimeoutHandle = setTimeout(() => {
            s.classList.remove("active"), setTimeout(() => {
                s.classList.add("hidden"), this.toastTimeoutHandle = null;
            }, 500);
        }, t);
    }
}

class i {
    constructor(e, t, s, n, a) {
        this.dom = e, this.show = s, this.handlePasswordSuccess = n, this.newPassInput = e.newPasswordInput, 
        this.confirmPassInput = e.confirmPasswordInput, this.unlockPassInput = t.unlockPasswordInput, 
        this.handleUnlockSuccess = a, this.setupCreationListeners(), this.setupUnlockListeners();
    }
    setupCreationListeners() {
        this.newPassInput && this.confirmPassInput && (this.newPassInput.addEventListener("keypress", e => {
            this.handleEnterSubmit(e, () => this.confirmPassInput.focus());
        }), this.confirmPassInput.addEventListener("keypress", e => {
            this.handleEnterSubmit(e, () => this.checkPassword());
        }));
    }
    setupUnlockListeners() {
        this.unlockPassInput && this.unlockPassInput.addEventListener("keypress", e => {
            this.handleEnterSubmit(e, () => this.handleUnlock());
        });
    }
    handleUnlock() {
        const e = this.unlockPassInput.value;
        e ? (this.handleUnlockSuccess(e), this.unlockPassInput.value = "") : this.show.Notify("passwordRequiredNotification", 1500);
    }
    checkPassword() {
        const e = this.newPassInput.value, t = this.confirmPassInput.value;
        e === t && e.length >= 8 ? (this.clearInputs(), this.handlePasswordSuccess(t)) : (this.clearInputs(), 
        this.newPassInput.focus(), this.show.Notify("ErrorCreatingPasswordNotification", 1500));
    }
    handleEnterSubmit(e, t) {
        "Enter" === e.key && (e.preventDefault(), t());
    }
    clearInputs() {
        this.newPassInput.value = "", this.confirmPassInput.value = "";
    }
}

class o {
    constructor(e, t) {
        this.dom = e, this.show = t, this._tempPassword = null, this.isProcessing = !1, 
        this._TempMnemonic = null, this.setupListeners();
    }
    setupListeners() {
        var e, t, s, n;
        null === (e = this.dom.createMnemonic.copySeedBtn) || void 0 === e || e.addEventListener("click", () => this.copySeedPhrase()), 
        null === (t = this.dom.createMnemonic.seedPhraseSavedBtn) || void 0 === t || t.addEventListener("click", () => {
            window.close();
        }), null === (s = this.dom.importMnemonic.resetMnemonicBtn) || void 0 === s || s.addEventListener("click", () => this.resetMnemonicInputs()), 
        null === (n = this.dom.importMnemonic.completeImportBtn) || void 0 === n || n.addEventListener("click", () => this.ImportMnemonicComplete());
    }
    async handleCreateWalletSetup(e) {
        const t = await n("createWallet", {
            password: e
        });
        if ("success" === t.status) {
            this._TempMnemonic = t.mnemonic;
            const e = this.dom.MnemonicGridDisplay.CreateSeedPhraseDisplay;
            this.renderSeedPhrase(t.mnemonic, e, "display");
        }
    }
    async copySeedPhrase() {
        const e = await this._TempMnemonic.join(" ");
        e && navigator.clipboard.writeText(e).then(() => {
            this.show.Notify("copySuccessNotification", 1500);
        });
    }
    handleImportWalletSetup(e) {
        this._tempPassword = e;
        const t = this.dom.MnemonicGridDisplay.ImportSeedPhraseDisplay;
        this.renderSeedPhrase([], t, "input");
    }
    resetMnemonicInputs() {
        const e = document.querySelectorAll("#ImportSeedPhraseDisplay .seed-word");
        e.forEach(e => e.value = ""), e.length > 0 && e[0].focus();
    }
    async ImportMnemonicComplete() {
        const e = document.querySelectorAll("#ImportSeedPhraseDisplay .seed-word"), t = Array.from(e).map(e => e.value.trim()), s = t.filter(e => "" !== e).length, a = t.join(" ");
        if (12 === s) try {
            const e = this._tempPassword;
            this._tempPassword = null, this.show.LoadingOverlay(!0);
            const t = await n("importWallet", {
                seedPhrase: a,
                password: e
            });
            if (this.show.LoadingOverlay(!1), "success" !== t.status) throw new Error(t.message);
            window.close();
        } catch (e) {
            this.show.Notify("incorrectMnemonicNotification", 1500);
        } else this.show.Notify("Less-than-12-words", 1500);
    }
    handleMnemonicPaste(e) {
        e.preventDefault();
        const t = e.clipboardData.getData("text").trim().split(/\s+/);
        if (0 === t.length) return;
        const s = e.target, n = document.querySelectorAll("#ImportSeedPhraseDisplay .seed-word");
        let a = Array.from(n).indexOf(s);
        for (let e = 0; e < t.length; e++) {
            const s = a + e;
            if (!(s < n.length)) break;
            n[s].value = t[e];
        }
        a + t.length < n.length && n[a + t.length].focus();
    }
    renderSeedPhrase(e, t, s) {
        if (!t) return;
        t.innerHTML = "";
        const n = "input" === s ? 12 : e.length;
        for (let a = 0; a < n; a++) {
            const n = e[a] || "", i = document.createElement("div");
            i.classList.add("seed-item");
            const o = document.createElement("span");
            if (o.classList.add("seed-number"), o.textContent = `${a + 1}.`, i.appendChild(o), 
            "display" === s) {
                const e = document.createElement("span");
                e.classList.add("seed-word"), e.textContent = n, i.appendChild(e);
            }
            if ("input" === s) {
                const e = document.createElement("input");
                e.type = "text", e.dataset.index = a + 1, e.classList.add("seed-word"), e.addEventListener("paste", this.handleMnemonicPaste.bind(this)), 
                i.appendChild(e);
            }
            t.appendChild(i);
        }
    }
}

class l {
    constructor(e, t) {
        this.dom = e, this.show = t, this.currentWallet = null, this.setupListeners();
    }
    setWallet(e) {
        this.currentWallet = e, this.updateUI();
    }
    setupListeners() {
        var e, t;
        null === (e = this.dom.LockWalletManually) || void 0 === e || e.addEventListener("click", () => this.lockWallet()), 
        null === (t = this.dom.CopyAddressBtn) || void 0 === t || t.addEventListener("click", () => this.copyAddress());
    }
    async updateUI() {
        if (!this.currentWallet) return;
        const e = this.currentWallet.address, t = `${e.substring(0, 6)}...${e.substring(e.length - 4)}`;
        this.dom.WalletAddressDisplay.textContent = t, this.dom.WalletBalanceAmount.textContent = "Loading...";
        try {
            const t = await n("getWalletBalance", {
                address: e
            });
            "success" === t.status ? this.dom.WalletBalanceAmount.textContent = t.balance : this.dom.WalletBalanceAmount.textContent = "Error";
        } catch (e) {
            this.dom.WalletBalanceAmount.textContent = "Error";
        }
    }
    async copyAddress() {
        if (this.currentWallet) try {
            await navigator.clipboard.writeText(this.currentWallet.address), this.show.Notify("copySuccessNotification", 1500);
        } catch (e) {}
    }
    async lockWallet() {
        this.show.LoadingOverlay(!0), await n("lockWalletManually"), this.currentWallet = null, 
        this.show.LoadingOverlay(!1), this.show.Screen("unlockPasswordScreen");
    }
}

class r {
    constructor() {
        this.show = new a, this.currentAction = null, this.unlockedWallet = null, this.mnemonicController = new o(t, this.show), 
        this.passwordManager = new i(t.password, t.unlock, this.show, this.handlePasswordSuccess.bind(this), this.handleUnlock.bind(this)), 
        this.homepageController = new l(t.home, this.show), chrome.runtime.onMessage.addListener(e => {
            "walletLocked" === e.action && this.handleWalletLocked();
        });
    }
    handleWalletLocked() {
        this.show.Screen("unlockPasswordScreen");
    }
    handlePasswordSuccess(e) {
        e && ("create" === this.currentAction ? (this.mnemonicController.handleCreateWalletSetup(e), 
        this.show.Screen("showSeedCreatedScreen")) : "import" === this.currentAction && (this.mnemonicController.handleImportWalletSetup(e), 
        this.show.Screen("importMnemonicScreen")));
    }
    async handleUnlock(e) {
        this.show.LoadingOverlay(!0);
        const t = await n("unlockWallet", {
            password: e
        });
        this.show.LoadingOverlay(!1), "success" === t.status ? (this.unlockedWallet = {
            address: t.address
        }, this.homepageController.setWallet(this.unlockedWallet), this.show.Screen("HOMEPAGE")) : this.show.Notify("incorrectPasswordNotification", 1500);
    }
    setupMainListeners() {
        var e, s;
        null === (e = t.start.createWalletBtn) || void 0 === e || e.addEventListener("click", () => {
            this.currentAction = "create", this.show.Screen("createPasswordScreen");
        }), null === (s = t.start.importWalletBtn) || void 0 === s || s.addEventListener("click", () => {
            this.currentAction = "import", this.show.Screen("createPasswordScreen");
        }), t.Common.backButtons.forEach(e => {
            e.addEventListener("click", () => {
                "welcomeScreen" === e.getAttribute("data-target") && (this.currentAction = null), 
                this.show.Screen(e.getAttribute("data-target") || "welcomeScreen");
            });
        });
    }
    async init() {
        const e = await n("getUnlockStatus");
        if ("success" === e.status && !1 === e.isLocked) {
            const e = await n("getWalletInfo");
            "success" === e.status ? (this.unlockedWallet = {
                address: e.address
            }, this.homepageController.setWallet(this.unlockedWallet), this.show.Screen("HOMEPAGE")) : this.show.Screen("unlockPasswordScreen");
        } else {
            const e = await n("checkWalletStatus");
            "success" === e.status && e.exists ? this.show.Screen("unlockPasswordScreen") : this.show.Screen("welcomeScreen");
        }
        this.setupMainListeners();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    (new r).init();
});
