const mods = require('./constants');
const modValues = Object.values(mods);

let engineSubs = [];

let isMetaPressed = false;
let isCtrlPressed = false;
let isShiftPressed = false;
let isAltPressed = false;

const defaultOptions = {
    ignoreInputTargets: true,
    preventDefaultIfMatch: true
};

// document.addEventListener('keydown', (e) => {
//     engineSubs.forEach(sub => sub('keydown', e));
// });

document.addEventListener('keyup', (e) => {
    engineSubs.forEach(sub => sub('keyup', e));
});

function eventHasModifier (e, key) {
    switch (key) {
        case mods.CMD_CTL:
            return (e.ctrlKey || e.metaKey) || (isMetaPressed || isCtrlPressed);
        case mods.CTL:
            return e.ctrlKey || isCtrlPressed;
        case mods.CMD:
            return e.metaKey || isMetaPressed;
        case mods.SFT:
            return e.shiftKey || isShiftPressed;
    }
}

function isInputField (e) {
    return ['SELECT', 'INPUT', 'TEXTAREA'].indexOf(e.target.tagName.toUpperCase()) > -1;
}

function isEligible (e, combinations) {
    const hasFailed = combinations.every(key => {
        if (modValues.indexOf(key) > -1 && !eventHasModifier(e, key)) {
            return false;
        } else {
            const code = e.code || e.keyCode || e.charCode || e.keyIdentifier;
            return (key[0].toLowerCase().charCodeAt(0) === code) || (key[0].toUpperCase().charCodeAt(0) === code);
        }
    });
}

function KeyEngine (options, cb, ctx) {
    if (!(this instanceof KeyEngine)) return new KeyEngine(options);

    this._notifyMe = this._notifyMe.bind(this);

    this.options = Object.assign({}, defaultOptions, options);
    this.bindings = [].concat(cb === undefined ? [] : cb);
    this.callingCtx = ctx;
    
    engineSubs = engineSubs.concat(this._notifyMe);
}

Object.assign(KeyEngine.prototype, {
    _notifyMe (type, evt) {
        if (this.bindings.length === 0) return;
        if (this.options.ignoreInputTargets && isInputField(evt)) return;

        this.bindings.forEach(({combinations, cb}) => {
            if (isEligible(evt, combinations)) {
                cb.call(this.callingCtx || this, evt);
            }
        });
    },
    listen (combinations, cb) {
        this.bindings = this.bindings.concat({combinations, cb});
        return () => this.bindings = this.bindings.filter(bind => bind.cb !== cb);
    },
    destroy () {
        engineSubs = engineSubs.filter(sub => sub !== this._notifyMe);
        
        this.bindings.length = 0;
        
        delete this.callingCtx;
        delete this.listen;
        delete this._notifyMe;
    }
});

Object.assign(KeyEngine, mods);

module.exports = KeyEngine;