/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    /* eslint-disable @typescript-eslint/no-wrapper-object-types */
    const hasProto = (v, constructor, predicate) => {
        if (predicate(v, constructor.prototype)) {
            return true;
        }
        else {
            // String-based fallback time
            return v.constructor?.name === constructor.name;
        }
    };
    const typeOf = (x) => {
        const t = typeof x;
        if (x === null) {
            return 'null';
        }
        else if (t === 'object' && Array.isArray(x)) {
            return 'array';
        }
        else if (t === 'object' && hasProto(x, String, (o, proto) => proto.isPrototypeOf(o))) {
            return 'string';
        }
        else {
            return t;
        }
    };
    const isType$1 = (type) => (value) => typeOf(value) === type;
    const isSimpleType = (type) => (value) => typeof value === type;
    const eq = (t) => (a) => t === a;
    const isString = isType$1('string');
    const isObject = isType$1('object');
    const isNull = eq(null);
    const isBoolean = isSimpleType('boolean');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');
    const isNumber = isSimpleType('number');

    /**
     * The `Optional` type represents a value (of any type) that potentially does
     * not exist. Any `Optional<T>` can either be a `Some<T>` (in which case the
     * value does exist) or a `None` (in which case the value does not exist). This
     * module defines a whole lot of FP-inspired utility functions for dealing with
     * `Optional` objects.
     *
     * Comparison with null or undefined:
     * - We don't get fancy null coalescing operators with `Optional`
     * - We do get fancy helper functions with `Optional`
     * - `Optional` support nesting, and allow for the type to still be nullable (or
     * another `Optional`)
     * - There is no option to turn off strict-optional-checks like there is for
     * strict-null-checks
     */
    class Optional {
        tag;
        value;
        // Sneaky optimisation: every instance of Optional.none is identical, so just
        // reuse the same object
        static singletonNone = new Optional(false);
        // The internal representation has a `tag` and a `value`, but both are
        // private: able to be console.logged, but not able to be accessed by code
        constructor(tag, value) {
            this.tag = tag;
            this.value = value;
        }
        // --- Identities ---
        /**
         * Creates a new `Optional<T>` that **does** contain a value.
         */
        static some(value) {
            return new Optional(true, value);
        }
        /**
         * Create a new `Optional<T>` that **does not** contain a value. `T` can be
         * any type because we don't actually have a `T`.
         */
        static none() {
            return Optional.singletonNone;
        }
        /**
         * Perform a transform on an `Optional` type. Regardless of whether this
         * `Optional` contains a value or not, `fold` will return a value of type `U`.
         * If this `Optional` does not contain a value, the `U` will be created by
         * calling `onNone`. If this `Optional` does contain a value, the `U` will be
         * created by calling `onSome`.
         *
         * For the FP enthusiasts in the room, this function:
         * 1. Could be used to implement all of the functions below
         * 2. Forms a catamorphism
         */
        fold(onNone, onSome) {
            if (this.tag) {
                return onSome(this.value);
            }
            else {
                return onNone();
            }
        }
        /**
         * Determine if this `Optional` object contains a value.
         */
        isSome() {
            return this.tag;
        }
        /**
         * Determine if this `Optional` object **does not** contain a value.
         */
        isNone() {
            return !this.tag;
        }
        // --- Functor (name stolen from Haskell / maths) ---
        /**
         * Perform a transform on an `Optional` object, **if** there is a value. If
         * you provide a function to turn a T into a U, this is the function you use
         * to turn an `Optional<T>` into an `Optional<U>`. If this **does** contain
         * a value then the output will also contain a value (that value being the
         * output of `mapper(this.value)`), and if this **does not** contain a value
         * then neither will the output.
         */
        map(mapper) {
            if (this.tag) {
                return Optional.some(mapper(this.value));
            }
            else {
                return Optional.none();
            }
        }
        // --- Monad (name stolen from Haskell / maths) ---
        /**
         * Perform a transform on an `Optional` object, **if** there is a value.
         * Unlike `map`, here the transform itself also returns an `Optional`.
         */
        bind(binder) {
            if (this.tag) {
                return binder(this.value);
            }
            else {
                return Optional.none();
            }
        }
        // --- Traversable (name stolen from Haskell / maths) ---
        /**
         * For a given predicate, this function finds out if there **exists** a value
         * inside this `Optional` object that meets the predicate. In practice, this
         * means that for `Optional`s that do not contain a value it returns false (as
         * no predicate-meeting value exists).
         */
        exists(predicate) {
            return this.tag && predicate(this.value);
        }
        /**
         * For a given predicate, this function finds out if **all** the values inside
         * this `Optional` object meet the predicate. In practice, this means that
         * for `Optional`s that do not contain a value it returns true (as all 0
         * objects do meet the predicate).
         */
        forall(predicate) {
            return !this.tag || predicate(this.value);
        }
        filter(predicate) {
            if (!this.tag || predicate(this.value)) {
                return this;
            }
            else {
                return Optional.none();
            }
        }
        // --- Getters ---
        /**
         * Get the value out of the inside of the `Optional` object, using a default
         * `replacement` value if the provided `Optional` object does not contain a
         * value.
         */
        getOr(replacement) {
            return this.tag ? this.value : replacement;
        }
        /**
         * Get the value out of the inside of the `Optional` object, using a default
         * `replacement` value if the provided `Optional` object does not contain a
         * value.  Unlike `getOr`, in this method the `replacement` object is also
         * `Optional` - meaning that this method will always return an `Optional`.
         */
        or(replacement) {
            return this.tag ? this : replacement;
        }
        /**
         * Get the value out of the inside of the `Optional` object, using a default
         * `replacement` value if the provided `Optional` object does not contain a
         * value. Unlike `getOr`, in this method the `replacement` value is
         * "thunked" - that is to say that you don't pass a value to `getOrThunk`, you
         * pass a function which (if called) will **return** the `value` you want to
         * use.
         */
        getOrThunk(thunk) {
            return this.tag ? this.value : thunk();
        }
        /**
         * Get the value out of the inside of the `Optional` object, using a default
         * `replacement` value if the provided Optional object does not contain a
         * value.
         *
         * Unlike `or`, in this method the `replacement` value is "thunked" - that is
         * to say that you don't pass a value to `orThunk`, you pass a function which
         * (if called) will **return** the `value` you want to use.
         *
         * Unlike `getOrThunk`, in this method the `replacement` value is also
         * `Optional`, meaning that this method will always return an `Optional`.
         */
        orThunk(thunk) {
            return this.tag ? this : thunk();
        }
        /**
         * Get the value out of the inside of the `Optional` object, throwing an
         * exception if the provided `Optional` object does not contain a value.
         *
         * WARNING:
         * You should only be using this function if you know that the `Optional`
         * object **is not** empty (otherwise you're throwing exceptions in production
         * code, which is bad).
         *
         * In tests this is more acceptable.
         *
         * Prefer other methods to this, such as `.each`.
         */
        getOrDie(message) {
            if (!this.tag) {
                throw new Error(message ?? 'Called getOrDie on None');
            }
            else {
                return this.value;
            }
        }
        // --- Interop with null and undefined ---
        /**
         * Creates an `Optional` value from a nullable (or undefined-able) input.
         * Null, or undefined, is converted to `None`, and anything else is converted
         * to `Some`.
         */
        static from(value) {
            return isNonNullable(value) ? Optional.some(value) : Optional.none();
        }
        /**
         * Converts an `Optional` to a nullable type, by getting the value if it
         * exists, or returning `null` if it does not.
         */
        getOrNull() {
            return this.tag ? this.value : null;
        }
        /**
         * Converts an `Optional` to an undefined-able type, by getting the value if
         * it exists, or returning `undefined` if it does not.
         */
        getOrUndefined() {
            return this.value;
        }
        // --- Utilities ---
        /**
         * If the `Optional` contains a value, perform an action on that value.
         * Unlike the rest of the methods on this type, `.each` has side-effects. If
         * you want to transform an `Optional<T>` **into** something, then this is not
         * the method for you. If you want to use an `Optional<T>` to **do**
         * something, then this is the method for you - provided you're okay with not
         * doing anything in the case where the `Optional` doesn't have a value inside
         * it. If you're not sure whether your use-case fits into transforming
         * **into** something or **doing** something, check whether it has a return
         * value. If it does, you should be performing a transform.
         */
        each(worker) {
            if (this.tag) {
                worker(this.value);
            }
        }
        /**
         * Turn the `Optional` object into an array that contains all of the values
         * stored inside the `Optional`. In practice, this means the output will have
         * either 0 or 1 elements.
         */
        toArray() {
            return this.tag ? [this.value] : [];
        }
        /**
         * Turn the `Optional` object into a string for debugging or printing. Not
         * recommended for production code, but good for debugging. Also note that
         * these days an `Optional` object can be logged to the console directly, and
         * its inner value (if it exists) will be visible.
         */
        toString() {
            return this.tag ? `some(${this.value})` : 'none()';
        }
    }

    const nativeSlice = Array.prototype.slice;
    const map = (xs, f) => {
        // pre-allocating array size when it's guaranteed to be known
        // http://jsperf.com/push-allocated-vs-dynamic/22
        const len = xs.length;
        const r = new Array(len);
        for (let i = 0; i < len; i++) {
            const x = xs[i];
            r[i] = f(x, i);
        }
        return r;
    };
    // Unwound implementing other functions in terms of each.
    // The code size is roughly the same, and it should allow for better optimisation.
    // const each = function<T, U>(xs: T[], f: (x: T, i?: number, xs?: T[]) => void): void {
    const each$1 = (xs, f) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            f(x, i);
        }
    };
    const filter = (xs, pred) => {
        const r = [];
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                r.push(x);
            }
        }
        return r;
    };
    isFunction(Array.from) ? Array.from : (x) => nativeSlice.call(x);

    // There are many variations of Object iteration that are faster than the 'for-in' style:
    // http://jsperf.com/object-keys-iteration/107
    //
    // Use the native keys if it is available (IE9+), otherwise fall back to manually filtering
    const keys = Object.keys;
    const each = (obj, f) => {
        const props = keys(obj);
        for (let k = 0, len = props.length; k < len; k++) {
            const i = props[k];
            const x = obj[i];
            f(x, i);
        }
    };

    const Cell = (initial) => {
        let value = initial;
        const get = () => {
            return value;
        };
        const set = (v) => {
            value = v;
        };
        return {
            get,
            set
        };
    };

    // Use window object as the global if it's available since CSP will block script evals
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const Global = typeof window !== 'undefined' ? window : Function('return this;')();

    /** path :: ([String], JsObj?) -> JsObj */
    const path = (parts, scope) => {
        let o = scope !== undefined && scope !== null ? scope : Global;
        for (let i = 0; i < parts.length && o !== undefined && o !== null; ++i) {
            o = o[parts[i]];
        }
        return o;
    };
    /** resolve :: (String, JsObj?) -> JsObj */
    const resolve = (p, scope) => {
        const parts = p.split('.');
        return path(parts, scope);
    };

    // Run a function fn after rate ms. If another invocation occurs
    // during the time it is waiting, ignore it completely.
    const first = (fn, rate) => {
        let timer = null;
        const cancel = () => {
            if (!isNull(timer)) {
                clearTimeout(timer);
                timer = null;
            }
        };
        const throttle = (...args) => {
            if (isNull(timer)) {
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(null, args);
                }, rate);
            }
        };
        return {
            cancel,
            throttle
        };
    };

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const get$2 = (toggleState) => {
        const isEnabled = () => {
            return toggleState.get();
        };
        return {
            isEnabled
        };
    };

    const fireVisualChars = (editor, state) => {
        return editor.dispatch('VisualChars', { state });
    };

    const fromHtml = (html, scope) => {
        const doc = scope || document;
        const div = doc.createElement('div');
        div.innerHTML = html;
        if (!div.hasChildNodes() || div.childNodes.length > 1) {
            const message = 'HTML does not have a single root node';
            // eslint-disable-next-line no-console
            console.error(message, html);
            throw new Error(message);
        }
        return fromDom(div.childNodes[0]);
    };
    const fromTag = (tag, scope) => {
        const doc = scope || document;
        const node = doc.createElement(tag);
        return fromDom(node);
    };
    const fromText = (text, scope) => {
        const doc = scope || document;
        const node = doc.createTextNode(text);
        return fromDom(node);
    };
    const fromDom = (node) => {
        // TODO: Consider removing this check, but left atm for safety
        if (node === null || node === undefined) {
            throw new Error('Node cannot be null or undefined');
        }
        return {
            dom: node
        };
    };
    const fromPoint = (docElm, x, y) => Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom);
    // tslint:disable-next-line:variable-name
    const SugarElement = {
        fromHtml,
        fromTag,
        fromText,
        fromDom,
        fromPoint
    };

    const ELEMENT = 1;
    const TEXT = 3;

    const unsafe = (name, scope) => {
        return resolve(name, scope);
    };
    const getOrDie = (name, scope) => {
        const actual = unsafe(name, scope);
        if (actual === undefined || actual === null) {
            throw new Error(name + ' not available on this browser');
        }
        return actual;
    };

    const getPrototypeOf = Object.getPrototypeOf;
    /*
     * IE9 and above
     *
     * MDN no use on this one, but here's the link anyway:
     * https://developer.mozilla.org/en/docs/Web/API/HTMLElement
     */
    const sandHTMLElement = (scope) => {
        return getOrDie('HTMLElement', scope);
    };
    const isPrototypeOf = (x) => {
        // use Resolve to get the window object for x and just return undefined if it can't find it.
        // undefined scope later triggers using the global window.
        const scope = resolve('ownerDocument.defaultView', x);
        // TINY-7374: We can't rely on looking at the owner window HTMLElement as the element may have
        // been constructed in a different window and then appended to the current window document.
        return isObject(x) && (sandHTMLElement(scope).prototype.isPrototypeOf(x) || /^HTML\w*Element$/.test(getPrototypeOf(x).constructor.name));
    };

    const type = (element) => element.dom.nodeType;
    const value = (element) => element.dom.nodeValue;
    const isType = (t) => (element) => type(element) === t;
    const isHTMLElement = (element) => isElement(element) && isPrototypeOf(element.dom);
    const isElement = isType(ELEMENT);
    const isText = isType(TEXT);

    const rawSet = (dom, key, value) => {
        /*
         * JQuery coerced everything to a string, and silently did nothing on text node/null/undefined.
         *
         * We fail on those invalid cases, only allowing numbers and booleans.
         */
        if (isString(value) || isBoolean(value) || isNumber(value)) {
            dom.setAttribute(key, value + '');
        }
        else {
            // eslint-disable-next-line no-console
            console.error('Invalid call to Attribute.set. Key ', key, ':: Value ', value, ':: Element ', dom);
            throw new Error('Attribute value was not simple');
        }
    };
    const set = (element, key, value) => {
        rawSet(element.dom, key, value);
    };
    const get$1 = (element, key) => {
        const v = element.dom.getAttribute(key);
        // undefined is the more appropriate value for JS, and this matches JQuery
        return v === null ? undefined : v;
    };
    const remove$3 = (element, key) => {
        element.dom.removeAttribute(key);
    };

    // Methods for handling attributes that contain a list of values <div foo="alpha beta theta">
    const read = (element, attr) => {
        const value = get$1(element, attr);
        return value === undefined || value === '' ? [] : value.split(' ');
    };
    const add$2 = (element, attr, id) => {
        const old = read(element, attr);
        const nu = old.concat([id]);
        set(element, attr, nu.join(' '));
        return true;
    };
    const remove$2 = (element, attr, id) => {
        const nu = filter(read(element, attr), (v) => v !== id);
        if (nu.length > 0) {
            set(element, attr, nu.join(' '));
        }
        else {
            remove$3(element, attr);
        }
        return false;
    };

    // IE11 Can return undefined for a classList on elements such as math, so we make sure it's not undefined before attempting to use it.
    const supports = (element) => element.dom.classList !== undefined;
    const get = (element) => read(element, 'class');
    const add$1 = (element, clazz) => add$2(element, 'class', clazz);
    const remove$1 = (element, clazz) => remove$2(element, 'class', clazz);

    /*
     * ClassList is IE10 minimum:
     * https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
     *
     * Note that IE doesn't support the second argument to toggle (at all).
     * If it did, the toggler could be better.
     */
    const add = (element, clazz) => {
        if (supports(element)) {
            element.dom.classList.add(clazz);
        }
        else {
            add$1(element, clazz);
        }
    };
    const cleanClass = (element) => {
        const classList = supports(element) ? element.dom.classList : get(element);
        // classList is a "live list", so this is up to date already
        if (classList.length === 0) {
            // No more classes left, remove the class attribute as well
            remove$3(element, 'class');
        }
    };
    const remove = (element, clazz) => {
        if (supports(element)) {
            const classList = element.dom.classList;
            classList.remove(clazz);
        }
        else {
            remove$1(element, clazz);
        }
        cleanClass(element);
    };

    const getRaw = (element) => element.dom.contentEditable;

    const charMap = {
        '\u00a0': 'nbsp',
        '\u00ad': 'shy'
    };
    const charMapToRegExp = (charMap, global) => {
        let regExp = '';
        each(charMap, (_value, key) => {
            regExp += key;
        });
        return new RegExp('[' + regExp + ']', global ? 'g' : '');
    };
    const charMapToSelector = (charMap) => {
        let selector = '';
        each(charMap, (value) => {
            if (selector) {
                selector += ',';
            }
            selector += 'span.mce-' + value;
        });
        return selector;
    };
    const regExp = charMapToRegExp(charMap);
    const regExpGlobal = charMapToRegExp(charMap, true);
    const selector = charMapToSelector(charMap);
    const nbspClass = 'mce-nbsp';

    const wrapCharWithSpan = (value) => '<span data-mce-bogus="1" class="mce-' + charMap[value] + '">' + value + '</span>';

    const isWrappedNbsp = (node) => node.nodeName.toLowerCase() === 'span' && node.classList.contains('mce-nbsp-wrap');
    const isMatch = (n) => {
        const value$1 = value(n);
        return isText(n) &&
            isString(value$1) &&
            regExp.test(value$1);
    };
    const isContentEditableFalse = (node) => isHTMLElement(node) && getRaw(node) === 'false';
    const isChildEditable = (node, currentState) => {
        if (isHTMLElement(node) && !isWrappedNbsp(node.dom)) {
            const value = getRaw(node);
            if (value === 'true') {
                return true;
            }
            else if (value === 'false') {
                return false;
            }
        }
        return currentState;
    };
    // inlined sugars PredicateFilter.descendants for file size but also make it only act on editable nodes it changes the current editable state when it traveses down
    const filterEditableDescendants = (scope, predicate, editable) => {
        let result = [];
        const dom = scope.dom;
        const children = map(dom.childNodes, SugarElement.fromDom);
        const isEditable = (node) => isWrappedNbsp(node.dom) || !isContentEditableFalse(node);
        each$1(children, (x) => {
            if (editable && isEditable(x) && predicate(x)) {
                result = result.concat([x]);
            }
            result = result.concat(filterEditableDescendants(x, predicate, isChildEditable(x, editable)));
        });
        return result;
    };
    const findParentElm = (elm, rootElm) => {
        while (elm.parentNode) {
            if (elm.parentNode === rootElm) {
                return rootElm;
            }
            elm = elm.parentNode;
        }
        return undefined;
    };
    const replaceWithSpans = (text) => text.replace(regExpGlobal, wrapCharWithSpan);

    const show = (editor, rootElm) => {
        const dom = editor.dom;
        const nodeList = filterEditableDescendants(SugarElement.fromDom(rootElm), isMatch, editor.dom.isEditable(rootElm));
        each$1(nodeList, (n) => {
            const parent = n.dom.parentNode;
            if (isWrappedNbsp(parent)) {
                add(SugarElement.fromDom(parent), nbspClass);
            }
            else {
                const withSpans = replaceWithSpans(dom.encode(value(n) ?? ''));
                const div = dom.create('div', {}, withSpans);
                let node;
                while ((node = div.lastChild)) {
                    dom.insertAfter(node, n.dom);
                }
                editor.dom.remove(n.dom);
            }
        });
    };
    const hide = (editor, rootElm) => {
        const nodeList = editor.dom.select(selector, rootElm);
        each$1(nodeList, (node) => {
            if (isWrappedNbsp(node)) {
                remove(SugarElement.fromDom(node), nbspClass);
            }
            else {
                editor.dom.remove(node, true);
            }
        });
    };
    const toggle = (editor) => {
        const body = editor.getBody();
        const bookmark = editor.selection.getBookmark();
        let parentNode = findParentElm(editor.selection.getNode(), body);
        // if user does select all the parentNode will be undefined
        parentNode = parentNode !== undefined ? parentNode : body;
        hide(editor, parentNode);
        show(editor, parentNode);
        editor.selection.moveToBookmark(bookmark);
    };

    const applyVisualChars = (editor, toggleState) => {
        fireVisualChars(editor, toggleState.get());
        const body = editor.getBody();
        if (toggleState.get() === true) {
            show(editor, body);
        }
        else {
            hide(editor, body);
        }
    };
    // Toggle state and save selection bookmark before applying visualChars
    const toggleVisualChars = (editor, toggleState) => {
        toggleState.set(!toggleState.get());
        const bookmark = editor.selection.getBookmark();
        applyVisualChars(editor, toggleState);
        editor.selection.moveToBookmark(bookmark);
    };

    const register$2 = (editor, toggleState) => {
        editor.addCommand('mceVisualChars', () => {
            toggleVisualChars(editor, toggleState);
        });
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('visualchars_default_state', {
            processor: 'boolean',
            default: false
        });
    };
    const isEnabledByDefault = option('visualchars_default_state');

    const setup$1 = (editor, toggleState) => {
        /*
          Note: applyVisualChars does not place a bookmark before modifying the DOM on init.
          This will cause a loss of selection if the following conditions are met:
            - Autofocus enabled, or editor is manually focused on init
            - The first piece of text in the editor must be a nbsp
            - Integrator has manually set the selection before init
      
          Another improvement would be to ensure DOM elements aren't destroyed/recreated,
          but rather wrapped/unwrapped when applying styling for visualchars so that selection
          is not lost.
        */
        editor.on('init', () => {
            applyVisualChars(editor, toggleState);
        });
    };

    const setup = (editor, toggleState) => {
        const debouncedToggle = first(() => {
            toggle(editor);
        }, 300);
        editor.on('keydown', (e) => {
            if (toggleState.get() === true) {
                e.keyCode === 13 ? toggle(editor) : debouncedToggle.throttle();
            }
        });
        editor.on('remove', debouncedToggle.cancel);
    };

    const toggleActiveState = (editor, enabledStated) => (api) => {
        api.setActive(enabledStated.get());
        const editorEventCallback = (e) => api.setActive(e.state);
        editor.on('VisualChars', editorEventCallback);
        return () => editor.off('VisualChars', editorEventCallback);
    };
    const register = (editor, toggleState) => {
        const onAction = () => editor.execCommand('mceVisualChars');
        editor.ui.registry.addToggleButton('visualchars', {
            tooltip: 'Show invisible characters',
            icon: 'visualchars',
            onAction,
            onSetup: toggleActiveState(editor, toggleState),
            context: 'any'
        });
        editor.ui.registry.addToggleMenuItem('visualchars', {
            text: 'Show invisible characters',
            icon: 'visualchars',
            onAction,
            onSetup: toggleActiveState(editor, toggleState),
            context: 'any'
        });
    };

    var Plugin = () => {
        global.add('visualchars', (editor) => {
            register$1(editor);
            const toggleState = Cell(isEnabledByDefault(editor));
            register$2(editor, toggleState);
            register(editor, toggleState);
            setup(editor, toggleState);
            setup$1(editor, toggleState);
            return get$2(toggleState);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
