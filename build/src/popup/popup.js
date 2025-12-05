const e = e => document.querySelector(e), t = e => document.querySelectorAll(e), s = {
    Common: {
        backButtons: t(".back-button"),
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
        HOMEPAGE: e("#HOMEPAGE"),
        NetworkName: e("#NetworkName"),
        WalletAddressDisplay: e("#WalletAddressDisplay"),
        CopyAddressBtn: t(".copyAddress-button"),
        WalletBalanceAmount: t(".balance-amount"),
        SendTxBtn: e("#SendTxBtn"),
        ReceiveTxBtn: e("#ReceiveTxBtn"),
        LockWalletManually: e("#LockWalletManually")
    },
    send: {
        RecipientInput: e("#SendAddress"),
        AmountInput: e("#SendAmount"),
        ConfirmSendBtn: e("#ConfirmSend")
    }
};

async function n(e, t = {}) {
    return chrome.runtime.sendMessage({
        action: e,
        payload: t
    });
}

class i {
    constructor() {
        this.majorScreens = document.querySelectorAll(".screen"), this.toastTimeoutHandle = null, 
        this.loadingOverlay = document.getElementById("loadingOverlay"), this.toastElement = document.getElementById("NotificationToast"), 
        this.toastMessage = document.getElementById("toastMessage"), this.type = null, this.dialogElement = document.getElementById("NotificationDialog"), 
        this.dialogTitle = document.getElementById("dialog-title"), this.dialogMessage = document.getElementById("DialogMessage"), 
        this.dialogCloseBtn = document.getElementById("dialogCloseBtn");
    }
    _Switch(e) {
        this.toastTimeoutHandle && (clearTimeout(this.toastTimeoutHandle), this.toastTimeoutHandle = null), 
        this.toastElement && (this.toastElement.classList.remove("active"), this.toastElement.classList.add("hidden"), 
        this.toastElement.classList.remove(this.type)), this.majorScreens.forEach(e => {
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
    MakeAlert(e, t, s) {
        this.type = e, this.toastTimeoutHandle && (clearTimeout(this.toastTimeoutHandle), 
        this.toastTimeoutHandle = null), this.toastMessage.innerHTML = t, this.toastElement.classList.add(e), 
        this.toastElement.classList.remove("hidden"), this.toastElement.classList.add("active"), 
        this.toastTimeoutHandle = setTimeout(() => {
            this.toastElement.classList.remove("active"), this.toastElement.classList.add("hidden"), 
            this.toastTimeoutHandle = null, this.toastElement.classList.remove(e);
        }, s);
    }
}

class a {
    constructor(e, t, s, n, i) {
        this.dom = e, this.show = s, this.handlePasswordSuccess = n, this.newPassInput = e.newPasswordInput, 
        this.confirmPassInput = e.confirmPasswordInput, this.unlockPassInput = t.unlockPasswordInput, 
        this.handleUnlockSuccess = i, this.setupCreationListeners(), this.setupUnlockListeners();
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
        e ? (this.handleUnlockSuccess(e), this.unlockPassInput.value = "") : this.show.MakeAlert("error", "Please ENTER YOUR PASSWORD", 3e3);
    }
    checkPassword() {
        const e = this.newPassInput.value, t = this.confirmPassInput.value;
        e === t && e.length >= 8 ? (this.clearInputs(), this.handlePasswordSuccess(t)) : (this.clearInputs(), 
        this.newPassInput.focus(), this.show.MakeAlert("error", "Password must be longer than 8 chars!", 3e3));
    }
    handleEnterSubmit(e, t) {
        "Enter" === e.key && (e.preventDefault(), t());
    }
    clearInputs() {
        this.newPassInput.value = "", this.confirmPassInput.value = "";
    }
}

class r {
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
            this.show.MakeAlert("success", "Copied!", 3e3);
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
        const e = document.querySelectorAll("#ImportSeedPhraseDisplay .seed-word"), t = Array.from(e).map(e => e.value.trim()), s = t.filter(e => "" !== e).length, i = t.join(" ");
        if (12 === s) try {
            const e = this._tempPassword;
            this._tempPassword = null, this.show.LoadingOverlay(!0);
            const t = await n("importWallet", {
                seedPhrase: i,
                password: e
            });
            if (this.show.LoadingOverlay(!1), "success" !== t.status) throw new Error(t.message);
            window.close();
        } catch (e) {
            this.show.MakeAlert("error", "Invalid seed phrase!", 3e3);
        } else this.show.MakeAlert("error", "You have not entered all 12 words!", 3e3);
    }
    handleMnemonicPaste(e) {
        e.preventDefault();
        const t = e.clipboardData.getData("text").trim().split(/\s+/);
        if (0 === t.length) return;
        const s = e.target, n = document.querySelectorAll("#ImportSeedPhraseDisplay .seed-word");
        let i = Array.from(n).indexOf(s);
        for (let e = 0; e < t.length; e++) {
            const s = i + e;
            if (!(s < n.length)) break;
            n[s].value = t[e];
        }
        i + t.length < n.length && n[i + t.length].focus();
    }
    renderSeedPhrase(e, t, s) {
        if (!t) return;
        t.innerHTML = "";
        const n = "input" === s ? 12 : e.length;
        for (let i = 0; i < n; i++) {
            const n = e[i] || "", a = document.createElement("div");
            a.classList.add("seed-item");
            const r = document.createElement("span");
            if (r.classList.add("seed-number"), r.textContent = `${i + 1}.`, a.appendChild(r), 
            "display" === s) {
                const e = document.createElement("span");
                e.classList.add("seed-word"), e.textContent = n, a.appendChild(e);
            }
            if ("input" === s) {
                const e = document.createElement("input");
                e.type = "text", e.dataset.index = i + 1, e.classList.add("seed-word"), e.addEventListener("paste", this.handleMnemonicPaste.bind(this)), 
                a.appendChild(e);
            }
            t.appendChild(a);
        }
    }
}

"undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self && self;

function o(e) {
    return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}

var l = {
    exports: {}
};

l.exports = function() {
    var e = function() {}, t = Object.prototype.hasOwnProperty, s = Array.prototype.slice;
    function n(t, s) {
        var n;
        return "function" == typeof Object.create ? n = Object.create(t) : (e.prototype = t, 
        n = new e, e.prototype = null), s && a(!0, n, s), n;
    }
    function i(e, t, s, i) {
        var r = this;
        return "string" != typeof e && (i = s, s = t, t = e, e = null), "function" != typeof t && (i = s, 
        s = t, t = function() {
            return r.apply(this, arguments);
        }), a(!1, t, r, i), t.prototype = n(r.prototype, s), t.prototype.constructor = t, 
        t.class_ = e || r.class_, t.super_ = r, t;
    }
    function a(e, n, i) {
        for (var a, r, o = 0, l = (i = s.call(arguments, 2)).length; o < l; o++) for (a in r = i[o]) e && !t.call(r, a) || (n[a] = r[a]);
    }
    var r = i;
    function o() {}
    o.class_ = "Nevis", o.super_ = Object, o.extend = r;
    var l = o, c = l.extend(function(e, t, s) {
        this.qrious = e, this.element = t, this.element.qrious = e, this.enabled = Boolean(s);
    }, {
        draw: function(e) {},
        getElement: function() {
            return this.enabled || (this.enabled = !0, this.render()), this.element;
        },
        getModuleSize: function(e) {
            var t = this.qrious, s = t.padding || 0, n = Math.floor((t.size - 2 * s) / e.width);
            return Math.max(1, n);
        },
        getOffset: function(e) {
            var t = this.qrious, s = t.padding;
            if (null != s) return s;
            var n = this.getModuleSize(e), i = Math.floor((t.size - n * e.width) / 2);
            return Math.max(0, i);
        },
        render: function(e) {
            this.enabled && (this.resize(), this.reset(), this.draw(e));
        },
        reset: function() {},
        resize: function() {}
    }), h = c, d = h.extend({
        draw: function(e) {
            var t, s, n = this.qrious, i = this.getModuleSize(e), a = this.getOffset(e), r = this.element.getContext("2d");
            for (r.fillStyle = n.foreground, r.globalAlpha = n.foregroundAlpha, t = 0; t < e.width; t++) for (s = 0; s < e.width; s++) e.buffer[s * e.width + t] && r.fillRect(i * t + a, i * s + a, i, i);
        },
        reset: function() {
            var e = this.qrious, t = this.element.getContext("2d"), s = e.size;
            t.lineWidth = 1, t.clearRect(0, 0, s, s), t.fillStyle = e.background, t.globalAlpha = e.backgroundAlpha, 
            t.fillRect(0, 0, s, s);
        },
        resize: function() {
            var e = this.element;
            e.width = e.height = this.qrious.size;
        }
    }), u = d, f = l.extend(null, {
        BLOCK: [ 0, 11, 15, 19, 23, 27, 31, 16, 18, 20, 22, 24, 26, 28, 20, 22, 24, 24, 26, 28, 28, 22, 24, 24, 26, 26, 28, 28, 24, 24, 26, 26, 26, 28, 28, 24, 26, 26, 26, 28, 28 ]
    }), m = l.extend(null, {
        BLOCKS: [ 1, 0, 19, 7, 1, 0, 16, 10, 1, 0, 13, 13, 1, 0, 9, 17, 1, 0, 34, 10, 1, 0, 28, 16, 1, 0, 22, 22, 1, 0, 16, 28, 1, 0, 55, 15, 1, 0, 44, 26, 2, 0, 17, 18, 2, 0, 13, 22, 1, 0, 80, 20, 2, 0, 32, 18, 2, 0, 24, 26, 4, 0, 9, 16, 1, 0, 108, 26, 2, 0, 43, 24, 2, 2, 15, 18, 2, 2, 11, 22, 2, 0, 68, 18, 4, 0, 27, 16, 4, 0, 19, 24, 4, 0, 15, 28, 2, 0, 78, 20, 4, 0, 31, 18, 2, 4, 14, 18, 4, 1, 13, 26, 2, 0, 97, 24, 2, 2, 38, 22, 4, 2, 18, 22, 4, 2, 14, 26, 2, 0, 116, 30, 3, 2, 36, 22, 4, 4, 16, 20, 4, 4, 12, 24, 2, 2, 68, 18, 4, 1, 43, 26, 6, 2, 19, 24, 6, 2, 15, 28, 4, 0, 81, 20, 1, 4, 50, 30, 4, 4, 22, 28, 3, 8, 12, 24, 2, 2, 92, 24, 6, 2, 36, 22, 4, 6, 20, 26, 7, 4, 14, 28, 4, 0, 107, 26, 8, 1, 37, 22, 8, 4, 20, 24, 12, 4, 11, 22, 3, 1, 115, 30, 4, 5, 40, 24, 11, 5, 16, 20, 11, 5, 12, 24, 5, 1, 87, 22, 5, 5, 41, 24, 5, 7, 24, 30, 11, 7, 12, 24, 5, 1, 98, 24, 7, 3, 45, 28, 15, 2, 19, 24, 3, 13, 15, 30, 1, 5, 107, 28, 10, 1, 46, 28, 1, 15, 22, 28, 2, 17, 14, 28, 5, 1, 120, 30, 9, 4, 43, 26, 17, 1, 22, 28, 2, 19, 14, 28, 3, 4, 113, 28, 3, 11, 44, 26, 17, 4, 21, 26, 9, 16, 13, 26, 3, 5, 107, 28, 3, 13, 41, 26, 15, 5, 24, 30, 15, 10, 15, 28, 4, 4, 116, 28, 17, 0, 42, 26, 17, 6, 22, 28, 19, 6, 16, 30, 2, 7, 111, 28, 17, 0, 46, 28, 7, 16, 24, 30, 34, 0, 13, 24, 4, 5, 121, 30, 4, 14, 47, 28, 11, 14, 24, 30, 16, 14, 15, 30, 6, 4, 117, 30, 6, 14, 45, 28, 11, 16, 24, 30, 30, 2, 16, 30, 8, 4, 106, 26, 8, 13, 47, 28, 7, 22, 24, 30, 22, 13, 15, 30, 10, 2, 114, 28, 19, 4, 46, 28, 28, 6, 22, 28, 33, 4, 16, 30, 8, 4, 122, 30, 22, 3, 45, 28, 8, 26, 23, 30, 12, 28, 15, 30, 3, 10, 117, 30, 3, 23, 45, 28, 4, 31, 24, 30, 11, 31, 15, 30, 7, 7, 116, 30, 21, 7, 45, 28, 1, 37, 23, 30, 19, 26, 15, 30, 5, 10, 115, 30, 19, 10, 47, 28, 15, 25, 24, 30, 23, 25, 15, 30, 13, 3, 115, 30, 2, 29, 46, 28, 42, 1, 24, 30, 23, 28, 15, 30, 17, 0, 115, 30, 10, 23, 46, 28, 10, 35, 24, 30, 19, 35, 15, 30, 17, 1, 115, 30, 14, 21, 46, 28, 29, 19, 24, 30, 11, 46, 15, 30, 13, 6, 115, 30, 14, 23, 46, 28, 44, 7, 24, 30, 59, 1, 16, 30, 12, 7, 121, 30, 12, 26, 47, 28, 39, 14, 24, 30, 22, 41, 15, 30, 6, 14, 121, 30, 6, 34, 47, 28, 46, 10, 24, 30, 2, 64, 15, 30, 17, 4, 122, 30, 29, 14, 46, 28, 49, 10, 24, 30, 24, 46, 15, 30, 4, 18, 122, 30, 13, 32, 46, 28, 48, 14, 24, 30, 42, 32, 15, 30, 20, 4, 117, 30, 40, 7, 47, 28, 43, 22, 24, 30, 10, 67, 15, 30, 19, 6, 118, 30, 18, 31, 47, 28, 34, 34, 24, 30, 20, 61, 15, 30 ],
        FINAL_FORMAT: [ 30660, 29427, 32170, 30877, 26159, 25368, 27713, 26998, 21522, 20773, 24188, 23371, 17913, 16590, 20375, 19104, 13663, 12392, 16177, 14854, 9396, 8579, 11994, 11245, 5769, 5054, 7399, 6608, 1890, 597, 3340, 2107 ],
        LEVELS: {
            L: 1,
            M: 2,
            Q: 3,
            H: 4
        }
    }), p = l.extend(null, {
        EXPONENT: [ 1, 2, 4, 8, 16, 32, 64, 128, 29, 58, 116, 232, 205, 135, 19, 38, 76, 152, 45, 90, 180, 117, 234, 201, 143, 3, 6, 12, 24, 48, 96, 192, 157, 39, 78, 156, 37, 74, 148, 53, 106, 212, 181, 119, 238, 193, 159, 35, 70, 140, 5, 10, 20, 40, 80, 160, 93, 186, 105, 210, 185, 111, 222, 161, 95, 190, 97, 194, 153, 47, 94, 188, 101, 202, 137, 15, 30, 60, 120, 240, 253, 231, 211, 187, 107, 214, 177, 127, 254, 225, 223, 163, 91, 182, 113, 226, 217, 175, 67, 134, 17, 34, 68, 136, 13, 26, 52, 104, 208, 189, 103, 206, 129, 31, 62, 124, 248, 237, 199, 147, 59, 118, 236, 197, 151, 51, 102, 204, 133, 23, 46, 92, 184, 109, 218, 169, 79, 158, 33, 66, 132, 21, 42, 84, 168, 77, 154, 41, 82, 164, 85, 170, 73, 146, 57, 114, 228, 213, 183, 115, 230, 209, 191, 99, 198, 145, 63, 126, 252, 229, 215, 179, 123, 246, 241, 255, 227, 219, 171, 75, 150, 49, 98, 196, 149, 55, 110, 220, 165, 87, 174, 65, 130, 25, 50, 100, 200, 141, 7, 14, 28, 56, 112, 224, 221, 167, 83, 166, 81, 162, 89, 178, 121, 242, 249, 239, 195, 155, 43, 86, 172, 69, 138, 9, 18, 36, 72, 144, 61, 122, 244, 245, 247, 243, 251, 235, 203, 139, 11, 22, 44, 88, 176, 125, 250, 233, 207, 131, 27, 54, 108, 216, 173, 71, 142, 0 ],
        LOG: [ 255, 0, 1, 25, 2, 50, 26, 198, 3, 223, 51, 238, 27, 104, 199, 75, 4, 100, 224, 14, 52, 141, 239, 129, 28, 193, 105, 248, 200, 8, 76, 113, 5, 138, 101, 47, 225, 36, 15, 33, 53, 147, 142, 218, 240, 18, 130, 69, 29, 181, 194, 125, 106, 39, 249, 185, 201, 154, 9, 120, 77, 228, 114, 166, 6, 191, 139, 98, 102, 221, 48, 253, 226, 152, 37, 179, 16, 145, 34, 136, 54, 208, 148, 206, 143, 150, 219, 189, 241, 210, 19, 92, 131, 56, 70, 64, 30, 66, 182, 163, 195, 72, 126, 110, 107, 58, 40, 84, 250, 133, 186, 61, 202, 94, 155, 159, 10, 21, 121, 43, 78, 212, 229, 172, 115, 243, 167, 87, 7, 112, 192, 247, 140, 128, 99, 13, 103, 74, 222, 237, 49, 197, 254, 24, 227, 165, 153, 119, 38, 184, 180, 124, 17, 68, 146, 217, 35, 32, 137, 46, 55, 63, 209, 91, 149, 188, 207, 205, 144, 135, 151, 178, 220, 252, 190, 97, 242, 86, 211, 171, 20, 42, 93, 158, 132, 60, 57, 83, 71, 109, 65, 162, 31, 45, 67, 216, 183, 123, 164, 118, 196, 23, 73, 236, 127, 12, 111, 246, 108, 161, 59, 82, 41, 157, 85, 170, 251, 96, 134, 177, 187, 204, 62, 90, 203, 89, 95, 176, 156, 169, 160, 81, 11, 245, 22, 235, 122, 117, 44, 215, 79, 174, 213, 233, 230, 231, 173, 232, 116, 214, 244, 234, 168, 80, 88, 175 ]
    }), v = l.extend(null, {
        BLOCK: [ 3220, 1468, 2713, 1235, 3062, 1890, 2119, 1549, 2344, 2936, 1117, 2583, 1330, 2470, 1667, 2249, 2028, 3780, 481, 4011, 142, 3098, 831, 3445, 592, 2517, 1776, 2234, 1951, 2827, 1070, 2660, 1345, 3177 ]
    }), _ = l.extend(function(e) {
        var t, s, n, i, a, r = e.value.length;
        for (this._badness = [], this._level = m.LEVELS[e.level], this._polynomial = [], 
        this._value = e.value, this._version = 0, this._stringBuffer = []; this._version < 40 && (this._version++, 
        n = 4 * (this._level - 1) + 16 * (this._version - 1), i = m.BLOCKS[n++], a = m.BLOCKS[n++], 
        t = m.BLOCKS[n++], s = m.BLOCKS[n], !(r <= (n = t * (i + a) + a - 3 + (this._version <= 9)))); ) ;
        this._dataBlock = t, this._eccBlock = s, this._neccBlock1 = i, this._neccBlock2 = a;
        var o = this.width = 17 + 4 * this._version;
        this.buffer = _._createArray(o * o), this._ecc = _._createArray(t + (t + s) * (i + a) + a), 
        this._mask = _._createArray((o * (o + 1) + 1) / 2), this._insertFinders(), this._insertAlignments(), 
        this.buffer[8 + o * (o - 8)] = 1, this._insertTimingGap(), this._reverseMask(), 
        this._insertTimingRowAndColumn(), this._insertVersion(), this._syncMask(), this._convertBitStream(r), 
        this._calculatePolynomial(), this._appendEccToData(), this._interleaveBlocks(), 
        this._pack(), this._finish();
    }, {
        _addAlignment: function(e, t) {
            var s, n = this.buffer, i = this.width;
            for (n[e + i * t] = 1, s = -2; s < 2; s++) n[e + s + i * (t - 2)] = 1, n[e - 2 + i * (t + s + 1)] = 1, 
            n[e + 2 + i * (t + s)] = 1, n[e + s + 1 + i * (t + 2)] = 1;
            for (s = 0; s < 2; s++) this._setMask(e - 1, t + s), this._setMask(e + 1, t - s), 
            this._setMask(e - s, t - 1), this._setMask(e + s, t + 1);
        },
        _appendData: function(e, t, s, n) {
            var i, a, r, o = this._polynomial, l = this._stringBuffer;
            for (a = 0; a < n; a++) l[s + a] = 0;
            for (a = 0; a < t; a++) {
                if (255 !== (i = p.LOG[l[e + a] ^ l[s]])) for (r = 1; r < n; r++) l[s + r - 1] = l[s + r] ^ p.EXPONENT[_._modN(i + o[n - r])]; else for (r = s; r < s + n; r++) l[r] = l[r + 1];
                l[s + n - 1] = 255 === i ? 0 : p.EXPONENT[_._modN(i + o[0])];
            }
        },
        _appendEccToData: function() {
            var e, t = 0, s = this._dataBlock, n = this._calculateMaxLength(), i = this._eccBlock;
            for (e = 0; e < this._neccBlock1; e++) this._appendData(t, s, n, i), t += s, n += i;
            for (e = 0; e < this._neccBlock2; e++) this._appendData(t, s + 1, n, i), t += s + 1, 
            n += i;
        },
        _applyMask: function(e) {
            var t, s, n, i, a = this.buffer, r = this.width;
            switch (e) {
              case 0:
                for (i = 0; i < r; i++) for (n = 0; n < r; n++) n + i & 1 || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 1:
                for (i = 0; i < r; i++) for (n = 0; n < r; n++) 1 & i || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 2:
                for (i = 0; i < r; i++) for (t = 0, n = 0; n < r; n++, t++) 3 === t && (t = 0), 
                t || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 3:
                for (s = 0, i = 0; i < r; i++, s++) for (3 === s && (s = 0), t = s, n = 0; n < r; n++, 
                t++) 3 === t && (t = 0), t || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 4:
                for (i = 0; i < r; i++) for (t = 0, s = i >> 1 & 1, n = 0; n < r; n++, t++) 3 === t && (t = 0, 
                s = !s), s || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 5:
                for (s = 0, i = 0; i < r; i++, s++) for (3 === s && (s = 0), t = 0, n = 0; n < r; n++, 
                t++) 3 === t && (t = 0), (n & i & 1) + !(!t | !s) || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 6:
                for (s = 0, i = 0; i < r; i++, s++) for (3 === s && (s = 0), t = 0, n = 0; n < r; n++, 
                t++) 3 === t && (t = 0), (n & i & 1) + (t && t === s) & 1 || this._isMasked(n, i) || (a[n + i * r] ^= 1);
                break;

              case 7:
                for (s = 0, i = 0; i < r; i++, s++) for (3 === s && (s = 0), t = 0, n = 0; n < r; n++, 
                t++) 3 === t && (t = 0), (t && t === s) + (n + i & 1) & 1 || this._isMasked(n, i) || (a[n + i * r] ^= 1);
            }
        },
        _calculateMaxLength: function() {
            return this._dataBlock * (this._neccBlock1 + this._neccBlock2) + this._neccBlock2;
        },
        _calculatePolynomial: function() {
            var e, t, s = this._eccBlock, n = this._polynomial;
            for (n[0] = 1, e = 0; e < s; e++) {
                for (n[e + 1] = 1, t = e; t > 0; t--) n[t] = n[t] ? n[t - 1] ^ p.EXPONENT[_._modN(p.LOG[n[t]] + e)] : n[t - 1];
                n[0] = p.EXPONENT[_._modN(p.LOG[n[0]] + e)];
            }
            for (e = 0; e <= s; e++) n[e] = p.LOG[n[e]];
        },
        _checkBadness: function() {
            var e, t, s, n, i, a = 0, r = this._badness, o = this.buffer, l = this.width;
            for (i = 0; i < l - 1; i++) for (n = 0; n < l - 1; n++) (o[n + l * i] && o[n + 1 + l * i] && o[n + l * (i + 1)] && o[n + 1 + l * (i + 1)] || !(o[n + l * i] || o[n + 1 + l * i] || o[n + l * (i + 1)] || o[n + 1 + l * (i + 1)])) && (a += _.N2);
            var c = 0;
            for (i = 0; i < l; i++) {
                for (s = 0, r[0] = 0, e = 0, n = 0; n < l; n++) e === (t = o[n + l * i]) ? r[s]++ : r[++s] = 1, 
                c += (e = t) ? 1 : -1;
                a += this._getBadness(s);
            }
            c < 0 && (c = -c);
            var h = 0, d = c;
            for (d += d << 2, d <<= 1; d > l * l; ) d -= l * l, h++;
            for (a += h * _.N4, n = 0; n < l; n++) {
                for (s = 0, r[0] = 0, e = 0, i = 0; i < l; i++) e === (t = o[n + l * i]) ? r[s]++ : r[++s] = 1, 
                e = t;
                a += this._getBadness(s);
            }
            return a;
        },
        _convertBitStream: function(e) {
            var t, s, n = this._ecc, i = this._version;
            for (s = 0; s < e; s++) n[s] = this._value.charCodeAt(s);
            var a = this._stringBuffer = n.slice(), r = this._calculateMaxLength();
            e >= r - 2 && (e = r - 2, i > 9 && e--);
            var o = e;
            if (i > 9) {
                for (a[o + 2] = 0, a[o + 3] = 0; o--; ) t = a[o], a[o + 3] |= 255 & t << 4, a[o + 2] = t >> 4;
                a[2] |= 255 & e << 4, a[1] = e >> 4, a[0] = 64 | e >> 12;
            } else {
                for (a[o + 1] = 0, a[o + 2] = 0; o--; ) t = a[o], a[o + 2] |= 255 & t << 4, a[o + 1] = t >> 4;
                a[1] |= 255 & e << 4, a[0] = 64 | e >> 4;
            }
            for (o = e + 3 - (i < 10); o < r; ) a[o++] = 236, a[o++] = 17;
        },
        _getBadness: function(e) {
            var t, s = 0, n = this._badness;
            for (t = 0; t <= e; t++) n[t] >= 5 && (s += _.N1 + n[t] - 5);
            for (t = 3; t < e - 1; t += 2) n[t - 2] === n[t + 2] && n[t + 2] === n[t - 1] && n[t - 1] === n[t + 1] && 3 * n[t - 1] === n[t] && (0 === n[t - 3] || t + 3 > e || 3 * n[t - 3] >= 4 * n[t] || 3 * n[t + 3] >= 4 * n[t]) && (s += _.N3);
            return s;
        },
        _finish: function() {
            var e, t;
            this._stringBuffer = this.buffer.slice();
            var s = 0, n = 3e4;
            for (t = 0; t < 8 && (this._applyMask(t), (e = this._checkBadness()) < n && (n = e, 
            s = t), 7 !== s); t++) this.buffer = this._stringBuffer.slice();
            s !== t && this._applyMask(s), n = m.FINAL_FORMAT[s + (this._level - 1 << 3)];
            var i = this.buffer, a = this.width;
            for (t = 0; t < 8; t++, n >>= 1) 1 & n && (i[a - 1 - t + 8 * a] = 1, t < 6 ? i[8 + a * t] = 1 : i[8 + a * (t + 1)] = 1);
            for (t = 0; t < 7; t++, n >>= 1) 1 & n && (i[8 + a * (a - 7 + t)] = 1, t ? i[6 - t + 8 * a] = 1 : i[7 + 8 * a] = 1);
        },
        _interleaveBlocks: function() {
            var e, t, s = this._dataBlock, n = this._ecc, i = this._eccBlock, a = 0, r = this._calculateMaxLength(), o = this._neccBlock1, l = this._neccBlock2, c = this._stringBuffer;
            for (e = 0; e < s; e++) {
                for (t = 0; t < o; t++) n[a++] = c[e + t * s];
                for (t = 0; t < l; t++) n[a++] = c[o * s + e + t * (s + 1)];
            }
            for (t = 0; t < l; t++) n[a++] = c[o * s + e + t * (s + 1)];
            for (e = 0; e < i; e++) for (t = 0; t < o + l; t++) n[a++] = c[r + e + t * i];
            this._stringBuffer = n;
        },
        _insertAlignments: function() {
            var e, t, s, n = this._version, i = this.width;
            if (n > 1) for (e = f.BLOCK[n], s = i - 7; ;) {
                for (t = i - 7; t > e - 3 && (this._addAlignment(t, s), !(t < e)); ) t -= e;
                if (s <= e + 9) break;
                s -= e, this._addAlignment(6, s), this._addAlignment(s, 6);
            }
        },
        _insertFinders: function() {
            var e, t, s, n, i = this.buffer, a = this.width;
            for (e = 0; e < 3; e++) {
                for (t = 0, n = 0, 1 === e && (t = a - 7), 2 === e && (n = a - 7), i[n + 3 + a * (t + 3)] = 1, 
                s = 0; s < 6; s++) i[n + s + a * t] = 1, i[n + a * (t + s + 1)] = 1, i[n + 6 + a * (t + s)] = 1, 
                i[n + s + 1 + a * (t + 6)] = 1;
                for (s = 1; s < 5; s++) this._setMask(n + s, t + 1), this._setMask(n + 1, t + s + 1), 
                this._setMask(n + 5, t + s), this._setMask(n + s + 1, t + 5);
                for (s = 2; s < 4; s++) i[n + s + a * (t + 2)] = 1, i[n + 2 + a * (t + s + 1)] = 1, 
                i[n + 4 + a * (t + s)] = 1, i[n + s + 1 + a * (t + 4)] = 1;
            }
        },
        _insertTimingGap: function() {
            var e, t, s = this.width;
            for (t = 0; t < 7; t++) this._setMask(7, t), this._setMask(s - 8, t), this._setMask(7, t + s - 7);
            for (e = 0; e < 8; e++) this._setMask(e, 7), this._setMask(e + s - 8, 7), this._setMask(e, s - 8);
        },
        _insertTimingRowAndColumn: function() {
            var e, t = this.buffer, s = this.width;
            for (e = 0; e < s - 14; e++) 1 & e ? (this._setMask(8 + e, 6), this._setMask(6, 8 + e)) : (t[8 + e + 6 * s] = 1, 
            t[6 + s * (8 + e)] = 1);
        },
        _insertVersion: function() {
            var e, t, s, n, i = this.buffer, a = this._version, r = this.width;
            if (a > 6) for (e = v.BLOCK[a - 7], t = 17, s = 0; s < 6; s++) for (n = 0; n < 3; n++, 
            t--) 1 & (t > 11 ? a >> t - 12 : e >> t) ? (i[5 - s + r * (2 - n + r - 11)] = 1, 
            i[2 - n + r - 11 + r * (5 - s)] = 1) : (this._setMask(5 - s, 2 - n + r - 11), this._setMask(2 - n + r - 11, 5 - s));
        },
        _isMasked: function(e, t) {
            var s = _._getMaskBit(e, t);
            return 1 === this._mask[s];
        },
        _pack: function() {
            var e, t, s, n = 1, i = 1, a = this.width, r = a - 1, o = a - 1, l = (this._dataBlock + this._eccBlock) * (this._neccBlock1 + this._neccBlock2) + this._neccBlock2;
            for (t = 0; t < l; t++) for (e = this._stringBuffer[t], s = 0; s < 8; s++, e <<= 1) {
                128 & e && (this.buffer[r + a * o] = 1);
                do {
                    i ? r-- : (r++, n ? 0 !== o ? o-- : (n = !n, 6 == (r -= 2) && (r--, o = 9)) : o !== a - 1 ? o++ : (n = !n, 
                    6 == (r -= 2) && (r--, o -= 8))), i = !i;
                } while (this._isMasked(r, o));
            }
        },
        _reverseMask: function() {
            var e, t, s = this.width;
            for (e = 0; e < 9; e++) this._setMask(e, 8);
            for (e = 0; e < 8; e++) this._setMask(e + s - 8, 8), this._setMask(8, e);
            for (t = 0; t < 7; t++) this._setMask(8, t + s - 7);
        },
        _setMask: function(e, t) {
            var s = _._getMaskBit(e, t);
            this._mask[s] = 1;
        },
        _syncMask: function() {
            var e, t, s = this.width;
            for (t = 0; t < s; t++) for (e = 0; e <= t; e++) this.buffer[e + s * t] && this._setMask(e, t);
        }
    }, {
        _createArray: function(e) {
            var t, s = [];
            for (t = 0; t < e; t++) s[t] = 0;
            return s;
        },
        _getMaskBit: function(e, t) {
            var s;
            return e > t && (s = e, e = t, t = s), s = t, s += t * t, s >>= 1, s += e;
        },
        _modN: function(e) {
            for (;e >= 255; ) e = ((e -= 255) >> 8) + (255 & e);
            return e;
        },
        N1: 3,
        N2: 3,
        N3: 40,
        N4: 10
    }), w = _, g = h.extend({
        draw: function() {
            this.element.src = this.qrious.toDataURL();
        },
        reset: function() {
            this.element.src = "";
        },
        resize: function() {
            var e = this.element;
            e.width = e.height = this.qrious.size;
        }
    }), k = l.extend(function(e, t, s, n) {
        this.name = e, this.modifiable = Boolean(t), this.defaultValue = s, this._valueTransformer = n;
    }, {
        transform: function(e) {
            var t = this._valueTransformer;
            return "function" == typeof t ? t(e, this) : e;
        }
    }), y = l.extend(null, {
        abs: function(e) {
            return null != e ? Math.abs(e) : null;
        },
        hasOwn: function(e, t) {
            return Object.prototype.hasOwnProperty.call(e, t);
        },
        noop: function() {},
        toUpperCase: function(e) {
            return null != e ? e.toUpperCase() : null;
        }
    }), M = l.extend(function(e) {
        this.options = {}, e.forEach(function(e) {
            this.options[e.name] = e;
        }, this);
    }, {
        exists: function(e) {
            return null != this.options[e];
        },
        get: function(e, t) {
            return M._get(this.options[e], t);
        },
        getAll: function(e) {
            var t, s = this.options, n = {};
            for (t in s) y.hasOwn(s, t) && (n[t] = M._get(s[t], e));
            return n;
        },
        init: function(e, t, s) {
            var n, i;
            for (n in "function" != typeof s && (s = y.noop), this.options) y.hasOwn(this.options, n) && (i = this.options[n], 
            M._set(i, i.defaultValue, t), M._createAccessor(i, t, s));
            this._setAll(e, t, !0);
        },
        set: function(e, t, s) {
            return this._set(e, t, s);
        },
        setAll: function(e, t) {
            return this._setAll(e, t);
        },
        _set: function(e, t, s, n) {
            var i = this.options[e];
            if (!i) throw new Error("Invalid option: " + e);
            if (!i.modifiable && !n) throw new Error("Option cannot be modified: " + e);
            return M._set(i, t, s);
        },
        _setAll: function(e, t, s) {
            if (!e) return !1;
            var n, i = !1;
            for (n in e) y.hasOwn(e, n) && this._set(n, e[n], t, s) && (i = !0);
            return i;
        }
    }, {
        _createAccessor: function(e, t, s) {
            var n = {
                get: function() {
                    return M._get(e, t);
                }
            };
            e.modifiable && (n.set = function(n) {
                M._set(e, n, t) && s(n, e);
            }), Object.defineProperty(t, e.name, n);
        },
        _get: function(e, t) {
            return t["_" + e.name];
        },
        _set: function(e, t, s) {
            var n = "_" + e.name, i = s[n], a = e.transform(null != t ? t : e.defaultValue);
            return s[n] = a, a !== i;
        }
    }), E = M, S = l.extend(function() {
        this._services = {};
    }, {
        getService: function(e) {
            var t = this._services[e];
            if (!t) throw new Error("Service is not being managed with name: " + e);
            return t;
        },
        setService: function(e, t) {
            if (this._services[e]) throw new Error("Service is already managed with name: " + e);
            t && (this._services[e] = t);
        }
    }), L = new E([ new k("background", !0, "white"), new k("backgroundAlpha", !0, 1, y.abs), new k("element"), new k("foreground", !0, "black"), new k("foregroundAlpha", !0, 1, y.abs), new k("level", !0, "L", y.toUpperCase), new k("mime", !0, "image/png"), new k("padding", !0, null, y.abs), new k("size", !0, 100, y.abs), new k("value", !0, "") ]), B = new S, A = l.extend(function(e) {
        L.init(e, this, this.update.bind(this));
        var t = L.get("element", this), s = B.getService("element"), n = t && s.isCanvas(t) ? t : s.createCanvas(), i = t && s.isImage(t) ? t : s.createImage();
        this._canvasRenderer = new u(this, n, !0), this._imageRenderer = new g(this, i, i === t), 
        this.update();
    }, {
        get: function() {
            return L.getAll(this);
        },
        set: function(e) {
            L.setAll(e, this) && this.update();
        },
        toDataURL: function(e) {
            return this.canvas.toDataURL(e || this.mime);
        },
        update: function() {
            var e = new w({
                level: this.level,
                value: this.value
            });
            this._canvasRenderer.render(e), this._imageRenderer.render(e);
        }
    }, {
        use: function(e) {
            B.setService(e.getName(), e);
        }
    });
    Object.defineProperties(A.prototype, {
        canvas: {
            get: function() {
                return this._canvasRenderer.getElement();
            }
        },
        image: {
            get: function() {
                return this._imageRenderer.getElement();
            }
        }
    });
    var b = A, P = b, I = l.extend({
        getName: function() {}
    }).extend({
        createCanvas: function() {},
        createImage: function() {},
        getName: function() {
            return "element";
        },
        isCanvas: function(e) {},
        isImage: function(e) {}
    }).extend({
        createCanvas: function() {
            return document.createElement("canvas");
        },
        createImage: function() {
            return document.createElement("img");
        },
        isCanvas: function(e) {
            return e instanceof HTMLCanvasElement;
        },
        isImage: function(e) {
            return e instanceof HTMLImageElement;
        }
    });
    return P.use(new I), P;
}();

var c = o(l.exports);

class h {
    constructor(e, t) {
        this.dom = e, this.show = t, this.currentWallet = null, this.setupListeners();
    }
    setWallet(e) {
        this.currentWallet = e, this.updateUI();
    }
    setupListeners() {
        var e, t, s, n;
        null === (e = this.dom.home.LockWalletManually) || void 0 === e || e.addEventListener("click", () => this.lockWallet()), 
        this.dom.home.CopyAddressBtn.forEach(e => {
            e.addEventListener("click", () => this.copyAddress());
        }), null === (t = this.dom.home.SendTxBtn) || void 0 === t || t.addEventListener("click", () => this.show.Screen("SENDPAGE")), 
        null === (s = this.dom.send.ConfirmSendBtn) || void 0 === s || s.addEventListener("click", () => this.ConfirmSend()), 
        null === (n = this.dom.home.ReceiveTxBtn) || void 0 === n || n.addEventListener("click", () => {
            if (this.currentWallet && this.currentWallet.address) {
                this.show.Screen("RECEIVEPAGE");
                const e = this.currentWallet.address;
                walletAddressInput.value = e, new c({
                    element: qrCanvas,
                    value: e,
                    size: 200,
                    level: "H"
                });
            }
        }), this.dom.Common.backButtons.forEach(e => {
            e.addEventListener("click", () => {
                "HOMEPAGE" === e.getAttribute("data-target") && (this.currentAction = null), this.show.Screen(e.getAttribute("data-target") || "HOMEPAGE");
            });
        });
    }
    async ConfirmSend() {
        if (!this.currentWallet) return;
        const e = this.dom.send.RecipientInput.value.trim(), t = this.dom.send.AmountInput.value.trim();
        if (!e || !t || isNaN(parseFloat(t)) || parseFloat(t) <= 0) this.show.MakeAlert("error", "Please enter a valid recipient and amount.", 3e3); else try {
            this.show.LoadingOverlay(!0);
            const s = await n("sendEthTransaction", {
                recipient: e,
                amountInEther: t
            });
            if ("success" === s.status) {
                const e = s.txHash, t = "https://sepolia.etherscan.io/tx/" + e;
                this.show.MakeAlert("success", 'Check Hash on Etherscan: <br><a id = "hashLink"href="' + t + '" target="_blank" rel="noopener noreferrer">Check on Etherscan</a>', 1e4), 
                this.dom.send.RecipientInput.value = "", this.dom.send.AmountInput.value = "", this.updateUI();
            }
        } catch {} finally {
            this.show.LoadingOverlay(!1);
        }
    }
    async updateUI() {
        if (!this.currentWallet) return;
        const e = this.currentWallet.address, t = `${e.substring(0, 6)}...${e.substring(e.length - 6)}`;
        this.dom.home.WalletAddressDisplay.textContent = t, this.dom.home.WalletBalanceAmount.forEach(e => {
            e.textContent = "Loading...";
        });
        try {
            const t = await n("getWalletBalance", {
                address: e
            });
            "success" === t.status ? this.dom.home.WalletBalanceAmount.forEach(e => {
                e.textContent = t.balance;
            }) : this.dom.home.WalletBalanceAmount.forEach(e => {
                e.textContent = "ERROR...";
            });
        } catch (e) {
            this.dom.home.WalletBalanceAmount.textContent = "Error";
        }
    }
    async copyAddress() {
        if (this.currentWallet) try {
            await navigator.clipboard.writeText(this.currentWallet.address), this.show.MakeAlert("success", "Copied!", 3e3);
        } catch (e) {}
    }
    async lockWallet() {
        this.show.LoadingOverlay(!0), await n("lockWalletManually"), this.currentWallet = null, 
        this.show.LoadingOverlay(!1), this.show.Screen("unlockPasswordScreen");
    }
}

class d {
    constructor() {
        this.show = new i, this.currentAction = null, this.unlockedWallet = null, this.mnemonicController = new r(s, this.show), 
        this.passwordManager = new a(s.password, s.unlock, this.show, this.handlePasswordSuccess.bind(this), this.handleUnlock.bind(this)), 
        this.homepageController = new h(s, this.show), chrome.runtime.onMessage.addListener(e => {
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
        }, this.homepageController.setWallet(this.unlockedWallet), this.show.Screen("HOMEPAGE")) : this.show.MakeAlert("error", "INCORRECT PASSWORD", 3e3);
    }
    setupMainListeners() {
        var e, t;
        null === (e = s.start.createWalletBtn) || void 0 === e || e.addEventListener("click", () => {
            this.currentAction = "create", this.show.Screen("createPasswordScreen");
        }), null === (t = s.start.importWalletBtn) || void 0 === t || t.addEventListener("click", () => {
            this.currentAction = "import", this.show.Screen("createPasswordScreen");
        }), s.Common.backButtons.forEach(e => {
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
    (new d).init();
});
