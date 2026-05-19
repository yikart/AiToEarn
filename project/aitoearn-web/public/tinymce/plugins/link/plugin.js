/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$5 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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
    const isType = (type) => (value) => typeOf(value) === type;
    const isSimpleType = (type) => (value) => typeof value === type;
    const eq = (t) => (a) => t === a;
    const isString = isType('string');
    const isObject = isType('object');
    const isArray = isType('array');
    const isNull = eq(null);
    const isBoolean = isSimpleType('boolean');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');
    const isArrayOf = (value, pred) => {
        if (isArray(value)) {
            for (let i = 0, len = value.length; i < len; ++i) {
                if (!(pred(value[i]))) {
                    return false;
                }
            }
            return true;
        }
        return false;
    };

    const noop = () => { };
    const constant = (value) => {
        return () => {
            return value;
        };
    };
    const identity = (x) => {
        return x;
    };
    const tripleEquals = (a, b) => {
        return a === b;
    };

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
    const nativeIndexOf = Array.prototype.indexOf;
    const nativePush = Array.prototype.push;
    const rawIndexOf = (ts, t) => nativeIndexOf.call(ts, t);
    const contains = (xs, x) => rawIndexOf(xs, x) > -1;
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
    const foldl = (xs, f, acc) => {
        each$1(xs, (x, i) => {
            acc = f(acc, x, i);
        });
        return acc;
    };
    const flatten = (xs) => {
        // Note, this is possible because push supports multiple arguments:
        // http://jsperf.com/concat-push/6
        // Note that in the past, concat() would silently work (very slowly) for array-like objects.
        // With this change it will throw an error.
        const r = [];
        for (let i = 0, len = xs.length; i < len; ++i) {
            // Ensure that each value is an array itself
            if (!isArray(xs[i])) {
                throw new Error('Arr.flatten item ' + i + ' was not an array, input: ' + xs);
            }
            nativePush.apply(r, xs[i]);
        }
        return r;
    };
    const bind = (xs, f) => flatten(map(xs, f));
    const get = (xs, i) => i >= 0 && i < xs.length ? Optional.some(xs[i]) : Optional.none();
    const head = (xs) => get(xs, 0);
    isFunction(Array.from) ? Array.from : (x) => nativeSlice.call(x);
    const findMap = (arr, f) => {
        for (let i = 0; i < arr.length; i++) {
            const r = f(arr[i], i);
            if (r.isSome()) {
                return r;
            }
        }
        return Optional.none();
    };

    // There are many variations of Object iteration that are faster than the 'for-in' style:
    // http://jsperf.com/object-keys-iteration/107
    //
    // Use the native keys if it is available (IE9+), otherwise fall back to manually filtering
    const keys = Object.keys;
    const hasOwnProperty = Object.hasOwnProperty;
    const each = (obj, f) => {
        const props = keys(obj);
        for (let k = 0, len = props.length; k < len; k++) {
            const i = props[k];
            const x = obj[i];
            f(x, i);
        }
    };
    const objAcc = (r) => (x, i) => {
        r[i] = x;
    };
    const internalFilter = (obj, pred, onTrue, onFalse) => {
        each(obj, (x, i) => {
            (pred(x, i) ? onTrue : onFalse)(x, i);
        });
    };
    const filter = (obj, pred) => {
        const t = {};
        internalFilter(obj, pred, objAcc(t), noop);
        return t;
    };
    const has = (obj, key) => hasOwnProperty.call(obj, key);
    const hasNonNullableKey = (obj, key) => has(obj, key) && obj[key] !== undefined && obj[key] !== null;

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

    /**
     * **Is** the value stored inside this Optional object equal to `rhs`?
     */
    const is = (lhs, rhs, comparator = tripleEquals) => lhs.exists((left) => comparator(left, rhs));
    const cat = (arr) => {
        const r = [];
        const push = (x) => {
            r.push(x);
        };
        for (let i = 0; i < arr.length; i++) {
            arr[i].each(push);
        }
        return r;
    };
    // This can help with type inference, by specifying the type param on the none case, so the caller doesn't have to.
    const someIf = (b, a) => b ? Optional.some(a) : Optional.none();

    const singleton = (doRevoke) => {
        const subject = Cell(Optional.none());
        const revoke = () => subject.get().each(doRevoke);
        const clear = () => {
            revoke();
            subject.set(Optional.none());
        };
        const isSet = () => subject.get().isSome();
        const get = () => subject.get();
        const set = (s) => {
            revoke();
            subject.set(Optional.some(s));
        };
        return {
            clear,
            isSet,
            get,
            set
        };
    };
    const value = () => {
        const subject = singleton(noop);
        const on = (f) => subject.get().each(f);
        return {
            ...subject,
            on
        };
    };

    const removeFromStart = (str, numChars) => {
        return str.substring(numChars);
    };

    const checkRange = (str, substr, start) => substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
    const removeLeading = (str, prefix) => {
        return startsWith(str, prefix) ? removeFromStart(str, prefix.length) : str;
    };
    /** Does 'str' start with 'prefix'?
     *  Note: all strings start with the empty string.
     *        More formally, for all strings x, startsWith(x, "").
     *        This is so that for all strings x and y, startsWith(y + x, y)
     */
    const startsWith = (str, prefix) => {
        return checkRange(str, prefix, 0);
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('link_assume_external_targets', {
            processor: (value) => {
                const valid = isString(value) || isBoolean(value);
                if (valid) {
                    if (value === true) {
                        return { value: 1 /* AssumeExternalTargets.WARN */, valid };
                    }
                    else if (value === "http" /* AssumeExternalTargets.ALWAYS_HTTP */ || value === "https" /* AssumeExternalTargets.ALWAYS_HTTPS */) {
                        return { value, valid };
                    }
                    else {
                        return { value: 0 /* AssumeExternalTargets.OFF */, valid };
                    }
                }
                else {
                    return { valid: false, message: 'Must be a string or a boolean.' };
                }
            },
            default: false
        });
        registerOption('link_context_toolbar', {
            processor: 'boolean',
            default: false
        });
        registerOption('link_list', {
            processor: (value) => isString(value) || isFunction(value) || isArrayOf(value, isObject)
        });
        registerOption('link_default_target', {
            processor: 'string'
        });
        registerOption('link_default_protocol', {
            processor: 'string',
            default: 'https'
        });
        registerOption('link_target_list', {
            processor: (value) => isBoolean(value) || isArrayOf(value, isObject),
            default: true
        });
        registerOption('link_rel_list', {
            processor: 'object[]',
            default: []
        });
        registerOption('link_class_list', {
            processor: 'object[]',
            default: []
        });
        registerOption('link_title', {
            processor: 'boolean',
            default: true
        });
        registerOption('allow_unsafe_link_target', {
            processor: 'boolean',
            default: false
        });
        registerOption('link_quicklink', {
            processor: 'boolean',
            default: false
        });
        registerOption('link_attributes_postprocess', {
            processor: 'function',
        });
        registerOption('files_upload_handler', {
            processor: 'function'
        });
        registerOption('link_uploadtab', {
            processor: 'boolean',
            default: true
        });
    };
    const assumeExternalTargets = option('link_assume_external_targets');
    const hasContextToolbar = option('link_context_toolbar');
    const getLinkList = option('link_list');
    const getDefaultLinkTarget = option('link_default_target');
    const getDefaultLinkProtocol = option('link_default_protocol');
    const getTargetList = option('link_target_list');
    const getRelList = option('link_rel_list');
    const getLinkClassList = option('link_class_list');
    const shouldShowLinkTitle = option('link_title');
    const allowUnsafeLinkTarget = option('allow_unsafe_link_target');
    const useQuickLink = option('link_quicklink');
    const attributesPostProcess = option('link_attributes_postprocess');
    const getFilesUploadHandler = option('files_upload_handler');
    const hasLinkUploadtab = option('link_uploadtab');
    const getDocumentsFileTypes = option('documents_file_types');
    const hasFilesUploadHandler = (editor) => isNonNullable(editor.options.get('files_upload_handler'));
    const hasDocumentsFileTypes = (editor) => isNonNullable(editor.options.get('documents_file_types'));

    var global$4 = tinymce.util.Tools.resolve('tinymce.util.URI');

    var global$3 = tinymce.util.Tools.resolve('tinymce.dom.TreeWalker');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    const isAnchor = (elm) => isNonNullable(elm) && elm.nodeName.toLowerCase() === 'a';
    const isLink = (elm) => isAnchor(elm) && !!getHref(elm);
    const collectNodesInRange = (rng, predicate) => {
        if (rng.collapsed) {
            return [];
        }
        else {
            const contents = rng.cloneContents();
            const firstChild = contents.firstChild;
            const walker = new global$3(firstChild, contents);
            const elements = [];
            let current = firstChild;
            do {
                if (predicate(current)) {
                    elements.push(current);
                }
            } while ((current = walker.next()));
            return elements;
        }
    };
    const hasProtocol = (url) => /^\w+:/i.test(url);
    const getHref = (elm) => {
        // Returns the real href value not the resolved a.href value
        return elm.getAttribute('data-mce-href') ?? elm.getAttribute('href') ?? '';
    };
    const applyRelTargetRules = (rel, isUnsafe) => {
        const rules = ['noopener'];
        const rels = rel ? rel.split(/\s+/) : [];
        const toString = (rels) => global$2.trim(rels.sort().join(' '));
        const addTargetRules = (rels) => {
            rels = removeTargetRules(rels);
            return rels.length > 0 ? rels.concat(rules) : rules;
        };
        const removeTargetRules = (rels) => rels.filter((val) => global$2.inArray(rules, val) === -1);
        const newRels = isUnsafe ? addTargetRules(rels) : removeTargetRules(rels);
        return newRels.length > 0 ? toString(newRels) : '';
    };
    const trimCaretContainers = (text) => text.replace(/\uFEFF/g, '');
    const getAnchorElement = (editor, selectedElm) => {
        selectedElm = selectedElm || getLinksInSelection(editor.selection.getRng())[0] || editor.selection.getNode();
        if (isImageFigure(selectedElm)) {
            // for an image contained in a figure we look for a link inside the selected element
            return Optional.from(editor.dom.select('a[href]', selectedElm)[0]);
        }
        else {
            return Optional.from(editor.dom.getParent(selectedElm, 'a[href]'));
        }
    };
    const isInAnchor = (editor, selectedElm) => getAnchorElement(editor, selectedElm).isSome();
    const getAnchorText = (selection, anchorElm) => {
        const text = anchorElm.fold(() => selection.getContent({ format: 'text' }), (anchorElm) => anchorElm.innerText || anchorElm.textContent || '');
        return trimCaretContainers(text);
    };
    const getLinksInSelection = (rng) => collectNodesInRange(rng, isLink);
    const getLinks$1 = (elements) => global$2.grep(elements, isLink);
    const hasLinks = (elements) => getLinks$1(elements).length > 0;
    const hasLinksInSelection = (rng) => getLinksInSelection(rng).length > 0;
    const isOnlyTextSelected = (editor) => {
        // Allow anchor and inline text elements to be in the selection but nothing else
        const inlineTextElements = editor.schema.getTextInlineElements();
        const isElement = (elm) => elm.nodeType === 1 && !isAnchor(elm) && !has(inlineTextElements, elm.nodeName.toLowerCase());
        // If selection is inside a block anchor then always treat it as non text only
        const isInBlockAnchor = getAnchorElement(editor).exists((anchor) => anchor.hasAttribute('data-mce-block'));
        if (isInBlockAnchor) {
            return false;
        }
        const rng = editor.selection.getRng();
        if (!rng.collapsed) {
            // Collect all non inline text elements in the range and make sure no elements were found
            const elements = collectNodesInRange(rng, isElement);
            return elements.length === 0;
        }
        else {
            return true;
        }
    };
    const isImageFigure = (elm) => isNonNullable(elm) && elm.nodeName === 'FIGURE' && /\bimage\b/i.test(elm.className);
    const blobToDataUri = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        };
        reader.onerror = () => {
            reject(new Error(reader.error?.message ?? 'Failed to convert blob to a data url'));
        };
        reader.readAsDataURL(blob);
    });

    const getLinkAttrs = (data) => {
        const attrs = ['title', 'rel', 'class', 'target'];
        return foldl(attrs, (acc, key) => {
            data[key].each((value) => {
                // If dealing with an empty string, then treat that as being null so the attribute is removed
                acc[key] = value.length > 0 ? value : null;
            });
            return acc;
        }, {
            href: data.href
        });
    };
    const handleExternalTargets = (href, assumeExternalTargets) => {
        if ((assumeExternalTargets === "http" /* AssumeExternalTargets.ALWAYS_HTTP */
            || assumeExternalTargets === "https" /* AssumeExternalTargets.ALWAYS_HTTPS */)
            && !hasProtocol(href)) {
            return assumeExternalTargets + '://' + href;
        }
        return href;
    };
    const applyLinkOverrides = (editor, linkAttrs) => {
        const newLinkAttrs = { ...linkAttrs };
        if (getRelList(editor).length === 0 && !allowUnsafeLinkTarget(editor)) {
            const newRel = applyRelTargetRules(newLinkAttrs.rel, newLinkAttrs.target === '_blank');
            newLinkAttrs.rel = newRel ? newRel : null;
        }
        if (Optional.from(newLinkAttrs.target).isNone() && getTargetList(editor) === false) {
            newLinkAttrs.target = getDefaultLinkTarget(editor);
        }
        newLinkAttrs.href = handleExternalTargets(newLinkAttrs.href, assumeExternalTargets(editor));
        return newLinkAttrs;
    };
    const updateLink = (editor, anchorElm, text, linkAttrs) => {
        // If we have text, then update the anchor elements text content
        text.each((text) => {
            if (has(anchorElm, 'innerText')) {
                anchorElm.innerText = text;
            }
            else {
                anchorElm.textContent = text;
            }
        });
        editor.dom.setAttribs(anchorElm, linkAttrs);
        // Move the cursor behind the updated link, so the user can go on typing.
        const rng = editor.dom.createRng();
        rng.setStartAfter(anchorElm);
        rng.setEndAfter(anchorElm);
        editor.selection.setRng(rng);
    };
    const createLink = (editor, selectedElm, text, linkAttrs) => {
        const dom = editor.dom;
        if (isImageFigure(selectedElm)) {
            linkImageFigure(dom, selectedElm, linkAttrs);
        }
        else {
            text.fold(() => {
                editor.execCommand('mceInsertLink', false, linkAttrs);
                // Now the newly inserted link is selected. Move the cursor behind the new link, so the user can go on typing.
                const end = editor.selection.getEnd();
                const rng = dom.createRng();
                rng.setStartAfter(end);
                rng.setEndAfter(end);
                editor.selection.setRng(rng);
            }, (text) => {
                editor.insertContent(dom.createHTML('a', linkAttrs, dom.encode(text)));
            });
        }
    };
    const linkDomMutation = (editor, attachState, data) => {
        const selectedElm = editor.selection.getNode();
        const anchorElm = getAnchorElement(editor, selectedElm);
        const linkAttrs = applyLinkOverrides(editor, getLinkAttrs(data));
        const attributesPostProcess$1 = attributesPostProcess(editor);
        if (isNonNullable(attributesPostProcess$1)) {
            attributesPostProcess$1(linkAttrs);
        }
        editor.undoManager.transact(() => {
            if (data.href === attachState.href) {
                attachState.attach();
            }
            anchorElm.fold(() => {
                createLink(editor, selectedElm, data.text, linkAttrs);
            }, (elm) => {
                editor.focus();
                updateLink(editor, elm, data.text, linkAttrs);
            });
        });
    };
    const unlinkSelection = (editor) => {
        const dom = editor.dom, selection = editor.selection;
        const rng = selection.getRng().cloneRange();
        const bookmark = selection.getBookmark();
        // Extend the selection out to the entire anchor element
        const startAnchorElm = dom.getParent(rng.startContainer, 'a[href]', editor.getBody());
        const endAnchorElm = dom.getParent(rng.endContainer, 'a[href]', editor.getBody());
        if (startAnchorElm) {
            rng.setStartBefore(startAnchorElm);
        }
        if (endAnchorElm) {
            rng.setEndAfter(endAnchorElm);
        }
        selection.setRng(rng);
        // Remove the link
        editor.execCommand('unlink');
        selection.moveToBookmark(bookmark);
    };
    const unlinkDomMutation = (editor) => {
        editor.undoManager.transact(() => {
            const node = editor.selection.getNode();
            if (isImageFigure(node)) {
                unlinkImageFigure(editor, node);
            }
            else {
                unlinkSelection(editor);
            }
            editor.focus();
        });
    };
    /*
     * RTC uses unwrapped options.
     *
     * To best simulate this, we unwrap to null and filter out empty values.
     */
    const unwrapOptions = (data) => {
        const { class: cls, href, rel, target, text, title } = data;
        return filter({
            class: cls.getOrNull(),
            href,
            rel: rel.getOrNull(),
            target: target.getOrNull(),
            text: text.getOrNull(),
            title: title.getOrNull()
        }, (v, _k) => isNull(v) === false);
    };
    const sanitizeData = (editor, data) => {
        const getOption = editor.options.get;
        const uriOptions = {
            allow_html_data_urls: getOption('allow_html_data_urls'),
            allow_script_urls: getOption('allow_script_urls'),
            allow_svg_data_urls: getOption('allow_svg_data_urls')
        };
        // Sanitize the URL
        const href = data.href;
        return {
            ...data,
            href: global$4.isDomSafe(href, 'a', uriOptions) ? href : ''
        };
    };
    const link = (editor, attachState, data) => {
        const sanitizedData = sanitizeData(editor, data);
        editor.hasPlugin('rtc', true) ? editor.execCommand('createlink', false, unwrapOptions(sanitizedData)) : linkDomMutation(editor, attachState, sanitizedData);
    };
    const unlink = (editor) => {
        editor.hasPlugin('rtc', true) ? editor.execCommand('unlink') : unlinkDomMutation(editor);
    };
    const unlinkImageFigure = (editor, fig) => {
        const img = editor.dom.select('img', fig)[0];
        if (img) {
            const a = editor.dom.getParents(img, 'a[href]', fig)[0];
            if (a) {
                a.parentNode?.insertBefore(img, a);
                editor.dom.remove(a);
            }
        }
    };
    const linkImageFigure = (dom, fig, attrs) => {
        const img = dom.select('img', fig)[0];
        if (img) {
            const a = dom.create('a', attrs);
            img.parentNode?.insertBefore(a, img);
            a.appendChild(img);
        }
    };

    const getValue = (item) => isString(item.value) ? item.value : '';
    const getText = (item) => {
        if (isString(item.text)) {
            return item.text;
        }
        else if (isString(item.title)) {
            return item.title;
        }
        else {
            return '';
        }
    };
    const sanitizeList = (list, extractValue) => {
        const out = [];
        global$2.each(list, (item) => {
            const text = getText(item);
            if (item.menu !== undefined) {
                const items = sanitizeList(item.menu, extractValue);
                out.push({ text, items }); // list group
            }
            else {
                const value = extractValue(item);
                out.push({ text, value }); // list value
            }
        });
        return out;
    };
    const sanitizeWith = (extracter = getValue) => (list) => Optional.from(list).map((list) => sanitizeList(list, extracter));
    const sanitize = (list) => sanitizeWith(getValue)(list);
    // NOTE: May need to care about flattening.
    const createUi = (name, label) => (items) => ({
        name,
        type: 'listbox',
        label,
        items
    });
    const ListOptions = {
        sanitize,
        sanitizeWith,
        createUi,
        getValue
    };

    const isListGroup = (item) => hasNonNullableKey(item, 'items');
    const findTextByValue = (value, catalog) => findMap(catalog, (item) => {
        if (isListGroup(item)) {
            return findTextByValue(value, item.items);
        }
        else {
            return someIf(item.value === value, item);
        }
    });
    const getDelta = (persistentText, fieldName, catalog, data) => {
        const value = data[fieldName];
        const hasPersistentText = persistentText.length > 0;
        return value !== undefined ? findTextByValue(value, catalog).map((i) => ({
            url: {
                value: i.value,
                meta: {
                    text: hasPersistentText ? persistentText : i.text,
                    attach: noop
                }
            },
            text: hasPersistentText ? persistentText : i.text
        })) : Optional.none();
    };
    const findCatalog = (catalogs, fieldName) => {
        if (fieldName === 'link') {
            return catalogs.link;
        }
        else if (fieldName === 'anchor') {
            return catalogs.anchor;
        }
        else {
            return Optional.none();
        }
    };
    const init = (initialData, linkCatalog) => {
        const persistentData = {
            text: initialData.text,
            title: initialData.title
        };
        const getTitleFromUrlChange = (url) => someIf(persistentData.title.length <= 0, Optional.from(url.meta?.title).getOr(''));
        const getTextFromUrlChange = (url) => someIf(persistentData.text.length <= 0, Optional.from(url.meta?.text).getOr(url.value));
        const onUrlChange = (data) => {
            const text = getTextFromUrlChange(data.url);
            const title = getTitleFromUrlChange(data.url);
            // We are going to change the text/title because it has not been manually entered by the user.
            if (text.isSome() || title.isSome()) {
                return Optional.some({
                    ...text.map((text) => ({ text })).getOr({}),
                    ...title.map((title) => ({ title })).getOr({})
                });
            }
            else {
                return Optional.none();
            }
        };
        const onCatalogChange = (data, change) => {
            const catalog = findCatalog(linkCatalog, change).getOr([]);
            return getDelta(persistentData.text, change, catalog, data);
        };
        const onChange = (getData, change) => {
            const name = change.name;
            if (name === 'url') {
                return onUrlChange(getData());
            }
            else if (contains(['anchor', 'link'], name)) {
                return onCatalogChange(getData(), name);
            }
            else if (name === 'text' || name === 'title') {
                // Update the persistent text/title state, as a user has input custom text
                persistentData[name] = getData()[name];
                return Optional.none();
            }
            else {
                return Optional.none();
            }
        };
        return {
            onChange
        };
    };
    const DialogChanges = {
        init,
        getDelta
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Delay');

    // Delay confirm since onSubmit will move focus
    const delayedConfirm = (editor, message, callback) => {
        const rng = editor.selection.getRng();
        global$1.setEditorTimeout(editor, () => {
            editor.windowManager.confirm(message, (state) => {
                editor.selection.setRng(rng);
                callback(state);
            });
        });
    };
    const tryEmailTransform = (data) => {
        const url = data.href;
        const suggestMailTo = url.indexOf('@') > 0 && url.indexOf('/') === -1 && url.indexOf('mailto:') === -1;
        return suggestMailTo ? Optional.some({
            message: 'The URL you entered seems to be an email address. Do you want to add the required mailto: prefix?',
            preprocess: (oldData) => ({ ...oldData, href: 'mailto:' + url })
        }) : Optional.none();
    };
    const tryProtocolTransform = (assumeExternalTargets, defaultLinkProtocol) => (data) => {
        const url = data.href;
        const suggestProtocol = (assumeExternalTargets === 1 /* AssumeExternalTargets.WARN */ && !hasProtocol(url) ||
            assumeExternalTargets === 0 /* AssumeExternalTargets.OFF */ && /^\s*www(\.|\d\.)/i.test(url));
        return suggestProtocol ? Optional.some({
            message: `The URL you entered seems to be an external link. Do you want to add the required ${defaultLinkProtocol}:// prefix?`,
            preprocess: (oldData) => ({ ...oldData, href: defaultLinkProtocol + '://' + url })
        }) : Optional.none();
    };
    const preprocess = (editor, data) => findMap([tryEmailTransform, tryProtocolTransform(assumeExternalTargets(editor), getDefaultLinkProtocol(editor))], (f) => f(data)).fold(() => Promise.resolve(data), (transform) => new Promise((callback) => {
        delayedConfirm(editor, transform.message, (state) => {
            callback(state ? transform.preprocess(data) : data);
        });
    }));
    const DialogConfirms = {
        preprocess
    };

    // NOTE: you currently need anchors in the content for this field to appear
    const getAnchors = (editor) => {
        const anchorNodes = editor.dom.select('a:not([href])');
        const anchors = bind(anchorNodes, (anchor) => {
            const id = anchor.name || anchor.id;
            return id ? [{ text: id, value: '#' + id }] : [];
        });
        return anchors.length > 0 ? Optional.some([{ text: 'None', value: '' }].concat(anchors)) : Optional.none();
    };
    const AnchorListOptions = {
        getAnchors
    };

    // Looks like tinymce currently renders menus, but doesn't
    // let you choose from one.
    const getClasses = (editor) => {
        const list = getLinkClassList(editor);
        if (list.length > 0) {
            return ListOptions.sanitize(list);
        }
        return Optional.none();
    };
    const ClassListOptions = {
        getClasses
    };

    const parseJson = (text) => {
        // Do some proper modelling.
        try {
            return Optional.some(JSON.parse(text));
        }
        catch {
            return Optional.none();
        }
    };
    const getLinks = (editor) => {
        const extractor = (item) => editor.convertURL(item.value || item.url || '', 'href');
        const linkList = getLinkList(editor);
        return new Promise((resolve) => {
            // TODO - better handling of failure
            if (isString(linkList)) {
                fetch(linkList)
                    .then((res) => res.ok ? res.text().then(parseJson) : Promise.reject())
                    .then(resolve, () => resolve(Optional.none()));
            }
            else if (isFunction(linkList)) {
                linkList((output) => resolve(Optional.some(output)));
            }
            else {
                resolve(Optional.from(linkList));
            }
        }).then((optItems) => optItems.bind(ListOptions.sanitizeWith(extractor)).map((items) => {
            if (items.length > 0) {
                const noneItem = [{ text: 'None', value: '' }];
                return noneItem.concat(items);
            }
            else {
                return items;
            }
        }));
    };
    const LinkListOptions = {
        getLinks
    };

    const getRels = (editor, initialTarget) => {
        const list = getRelList(editor);
        if (list.length > 0) {
            const isTargetBlank = is(initialTarget, '_blank');
            const enforceSafe = allowUnsafeLinkTarget(editor) === false;
            const safeRelExtractor = (item) => applyRelTargetRules(ListOptions.getValue(item), isTargetBlank);
            const sanitizer = enforceSafe ? ListOptions.sanitizeWith(safeRelExtractor) : ListOptions.sanitize;
            return sanitizer(list);
        }
        return Optional.none();
    };
    const RelOptions = {
        getRels
    };

    // In current tinymce, targets can be nested menus.
    // Do we really want to support that?
    const fallbacks = [
        { text: 'Current window', value: '' },
        { text: 'New window', value: '_blank' }
    ];
    const getTargets = (editor) => {
        const list = getTargetList(editor);
        if (isArray(list)) {
            return ListOptions.sanitize(list).orThunk(() => Optional.some(fallbacks));
        }
        else if (list === false) {
            return Optional.none();
        }
        return Optional.some(fallbacks);
    };
    const TargetOptions = {
        getTargets
    };

    const nonEmptyAttr = (dom, elem, name) => {
        const val = dom.getAttrib(elem, name);
        return val !== null && val.length > 0 ? Optional.some(val) : Optional.none();
    };
    const extractFromAnchor = (editor, anchor) => {
        const dom = editor.dom;
        const onlyText = isOnlyTextSelected(editor);
        const text = onlyText ? Optional.some(getAnchorText(editor.selection, anchor)) : Optional.none();
        const url = anchor.bind((anchorElm) => Optional.from(dom.getAttrib(anchorElm, 'href')));
        const target = anchor.bind((anchorElm) => Optional.from(dom.getAttrib(anchorElm, 'target')));
        const rel = anchor.bind((anchorElm) => nonEmptyAttr(dom, anchorElm, 'rel'));
        const linkClass = anchor.bind((anchorElm) => nonEmptyAttr(dom, anchorElm, 'class'));
        const title = anchor.bind((anchorElm) => nonEmptyAttr(dom, anchorElm, 'title'));
        return {
            url,
            text,
            title,
            target,
            rel,
            linkClass
        };
    };
    const collect = (editor, linkNode) => LinkListOptions.getLinks(editor).then((links) => {
        const hasUploadPanel = hasFilesUploadHandler(editor) && hasDocumentsFileTypes(editor) && hasLinkUploadtab(editor);
        const anchor = extractFromAnchor(editor, linkNode);
        return {
            anchor,
            catalogs: {
                targets: TargetOptions.getTargets(editor),
                // This should be initial target. Is anchor.target that?
                rels: RelOptions.getRels(editor, anchor.target),
                classes: ClassListOptions.getClasses(editor),
                anchor: AnchorListOptions.getAnchors(editor),
                link: links
            },
            hasUploadPanel,
            optNode: linkNode,
            flags: {
                titleEnabled: shouldShowLinkTitle(editor)
            }
        };
    });
    const DialogInfo = {
        collect
    };

    const makeTab = (fileTypes, onInvalidFiles) => {
        const items = [
            {
                type: 'dropzone',
                name: 'fileinput',
                buttonLabel: 'Browse for a file',
                dropAreaLabel: 'Drop a file here',
                allowedFileTypes: fileTypes.map((e) => e.mimeType).join(','),
                allowedFileExtensions: flatten(fileTypes.map((e) => e.extensions)),
                onInvalidFiles
            }
        ];
        return {
            title: 'Upload',
            name: 'upload',
            items
        };
    };
    const UploadTab = {
        makeTab
    };

    const handleSubmit = (editor, info) => (api) => {
        const data = api.getData();
        if (!data.url.value) {
            unlink(editor);
            // Temporary fix. TODO: TINY-2811
            api.close();
            return;
        }
        // Check if a key is defined, meaning it was a field in the dialog. If it is,
        // then check if it's changed and return none if nothing has changed.
        const getChangedValue = (key) => Optional.from(data[key]).filter((value) => !is(info.anchor[key], value));
        const changedData = {
            href: data.url.value,
            text: getChangedValue('text'),
            target: getChangedValue('target'),
            rel: getChangedValue('rel'),
            class: getChangedValue('linkClass'),
            title: getChangedValue('title')
        };
        const attachState = {
            href: data.url.value,
            attach: data.url.meta !== undefined && data.url.meta.attach ? data.url.meta.attach : noop
        };
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        DialogConfirms.preprocess(editor, changedData).then((pData) => {
            link(editor, attachState, pData);
        });
        api.close();
    };
    const uploadFile = (editor) => (blobInfo, progress) => {
        const fileUploadHandler = getFilesUploadHandler(editor);
        return fileUploadHandler(blobInfo, progress);
    };
    const dataUrlToBase64 = (dataUrl) => Optional.from(dataUrl.split(',')[1]).getOr('');
    const changeFileInput = (helpers, api) => {
        const data = api.getData();
        api.block('Uploading file');
        head(data.fileinput)
            .fold(() => {
            api.unblock();
        }, (file) => {
            const blobUri = URL.createObjectURL(file);
            const updateUrlAndSwitchTab = ({ url, fileName }) => {
                api.setData({ text: fileName, title: fileName, url: { value: url, meta: {} } });
                api.showTab('general');
                api.focus('url');
            };
            const finalize = () => {
                api.unblock();
                URL.revokeObjectURL(blobUri);
            };
            blobToDataUri(file).then((dataUrl) => {
                const existingBlobInfo = helpers.getExistingBlobInfo(dataUrlToBase64(dataUrl), file.type);
                const blobInfo = existingBlobInfo && existingBlobInfo.filename() === file.name ? existingBlobInfo : helpers.createBlobCache(file, blobUri, dataUrl);
                helpers.addToBlobCache(blobInfo);
                return helpers.uploadFile(blobInfo, identity);
            }).then((result) => {
                updateUrlAndSwitchTab(result);
                finalize();
            }).catch((err) => {
                finalize();
                helpers.alertErr(err, () => {
                    api.focus('fileinput');
                });
            });
        });
    };
    const createBlobCache = (editor) => (file, blobUri, dataUrl) => editor.editorUpload.blobCache.create({
        blob: file,
        blobUri,
        name: file.name?.replace(/\.[^\.]+$/, ''),
        filename: file.name,
        base64: dataUrl.split(',')[1],
        allowEmptyFile: true
    });
    const addToBlobCache = (editor) => (blobInfo) => {
        editor.editorUpload.blobCache.add(blobInfo);
    };
    const getExistingBlobInfo = (editor) => (base64, type) => {
        return editor.editorUpload.blobCache.getByData(base64, type);
    };
    const alertErr = (editor) => (message, callback) => {
        editor.windowManager.alert(message, callback);
    };
    const collectData = (editor) => {
        const anchorNode = getAnchorElement(editor);
        return DialogInfo.collect(editor, anchorNode);
    };
    const getInitialData = (info, defaultTarget) => {
        const anchor = info.anchor;
        const url = anchor.url.getOr('');
        return {
            url: {
                value: url,
                meta: {
                    original: {
                        value: url
                    }
                }
            },
            text: anchor.text.getOr(''),
            title: anchor.title.getOr(''),
            anchor: url,
            link: url,
            rel: anchor.rel.getOr(''),
            target: anchor.target.or(defaultTarget).getOr(''),
            linkClass: anchor.linkClass.getOr(''),
            fileinput: []
        };
    };
    const makeDialogBody = (urlInput, displayText, titleText, catalogs, hasUploadPanel, fileTypes, onInvalidFiles) => {
        const generalPanelItems = flatten([
            urlInput,
            displayText,
            titleText,
            cat([
                catalogs.anchor.map(ListOptions.createUi('anchor', 'Anchors')),
                catalogs.rels.map(ListOptions.createUi('rel', 'Rel')),
                catalogs.targets.map(ListOptions.createUi('target', 'Open link in...')),
                catalogs.link.map(ListOptions.createUi('link', 'Link list')),
                catalogs.classes.map(ListOptions.createUi('linkClass', 'Class'))
            ])
        ]);
        if (hasUploadPanel) {
            const tabPanel = {
                type: 'tabpanel',
                tabs: flatten([
                    [{
                            title: 'General',
                            name: 'general',
                            items: generalPanelItems
                        }],
                    [UploadTab.makeTab(fileTypes, onInvalidFiles)]
                ])
            };
            return tabPanel;
        }
        else {
            return {
                type: 'panel',
                items: generalPanelItems
            };
        }
    };
    const makeDialog = (settings, onSubmit, editor) => {
        const urlInput = [
            {
                name: 'url',
                type: 'urlinput',
                filetype: 'file',
                label: 'URL',
                picker_text: 'Browse links'
            }
        ];
        const displayText = settings.anchor.text.map(() => ({
            name: 'text',
            type: 'input',
            label: 'Text to display'
        })).toArray();
        const titleText = settings.flags.titleEnabled ? [
            {
                name: 'title',
                type: 'input',
                label: 'Title'
            }
        ] : [];
        const defaultTarget = Optional.from(getDefaultLinkTarget(editor));
        const initialData = getInitialData(settings, defaultTarget);
        const catalogs = settings.catalogs;
        const dialogDelta = DialogChanges.init(initialData, catalogs);
        const helpers = {
            addToBlobCache: addToBlobCache(editor),
            createBlobCache: createBlobCache(editor),
            alertErr: alertErr(editor),
            uploadFile: uploadFile(editor),
            getExistingBlobInfo: getExistingBlobInfo(editor)
        };
        const body = makeDialogBody(urlInput, displayText, titleText, catalogs, settings.hasUploadPanel, getDocumentsFileTypes(editor), () => new Promise((r) => helpers.alertErr('Selected files do not have allowed extensions', r)));
        return {
            title: 'Insert/Edit Link',
            size: 'normal',
            body,
            buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Save',
                    primary: true
                }
            ],
            initialData,
            onChange: (api, { name }) => {
                if (name === 'fileinput') {
                    changeFileInput(helpers, api);
                }
                else {
                    dialogDelta.onChange(api.getData, { name }).each((newData) => {
                        api.setData(newData);
                    });
                }
            },
            onSubmit
        };
    };
    const open = (editor) => {
        const data = collectData(editor);
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        data.then((info) => {
            const onSubmit = handleSubmit(editor, info);
            return makeDialog(info, onSubmit, editor);
        }).then((spec) => {
            editor.windowManager.open(spec);
        });
    };

    const register = (editor) => {
        editor.addCommand('mceLink', (_ui, value) => {
            if (value?.dialog === true || !useQuickLink(editor)) {
                open(editor);
            }
            else {
                editor.dispatch('contexttoolbar-show', {
                    toolbarKey: 'quicklink'
                });
            }
        });
    };

    const setup$2 = (editor) => {
        editor.addShortcut('Meta+K', '', () => {
            editor.execCommand('mceLink');
        });
    };

    var global = tinymce.util.Tools.resolve('tinymce.util.VK');

    const appendClickRemove = (link, evt) => {
        document.body.appendChild(link);
        link.dispatchEvent(evt);
        document.body.removeChild(link);
    };
    const openLink = (url) => {
        const link = document.createElement('a');
        link.target = '_blank';
        link.href = url;
        link.rel = 'noreferrer noopener';
        const evt = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        document.dispatchEvent(evt);
        appendClickRemove(link, evt);
    };
    const hasOnlyAltModifier = (e) => {
        return e.altKey === true && e.shiftKey === false && e.ctrlKey === false && e.metaKey === false;
    };
    const gotoLink = (editor, a) => {
        if (a) {
            const href = getHref(a);
            if (/^#/.test(href)) {
                const targetEl = editor.dom.select(`${href},[name="${removeLeading(href, '#')}"]`);
                if (targetEl.length) {
                    editor.selection.scrollIntoView(targetEl[0], true);
                }
            }
            else {
                openLink(a.href);
            }
        }
    };
    const isSelectionOnImageWithEmbeddedLink = (editor) => {
        const rng = editor.selection.getRng();
        const node = rng.startContainer;
        // Handle a case where an image embedded with a link is selected
        return isLink(node) && rng.startContainer === rng.endContainer && editor.dom.select('img', node).length === 1;
    };
    const getLinkFromElement = (editor, element) => {
        const links = getLinks$1(editor.dom.getParents(element));
        return someIf(links.length === 1, links[0]);
    };
    const getLinkInSelection = (editor) => {
        const links = getLinksInSelection(editor.selection.getRng());
        return someIf(links.length > 0, links[0]).or(getLinkFromElement(editor, editor.selection.getNode()));
    };
    const getLinkFromSelection = (editor) => editor.selection.isCollapsed() || isSelectionOnImageWithEmbeddedLink(editor)
        ? getLinkFromElement(editor, editor.selection.getStart())
        : getLinkInSelection(editor);
    const setup$1 = (editor) => {
        const selectedLink = value();
        const getSelectedLink = () => selectedLink.get().or(getLinkFromSelection(editor));
        const gotoSelectedLink = () => getSelectedLink().each((link) => gotoLink(editor, link));
        editor.on('contextmenu', (e) => {
            getLinkFromElement(editor, e.target).each(selectedLink.set);
        });
        editor.on('SelectionChange', () => {
            if (!selectedLink.isSet()) {
                getLinkFromSelection(editor).each(selectedLink.set);
            }
        });
        editor.on('click', (e) => {
            selectedLink.clear();
            const links = getLinks$1(editor.dom.getParents(e.target));
            if (links.length === 1 && global.metaKeyPressed(e)) {
                e.preventDefault();
                gotoLink(editor, links[0]);
            }
        });
        editor.on('keydown', (e) => {
            selectedLink.clear();
            if (!e.isDefaultPrevented() && e.keyCode === 13 && hasOnlyAltModifier(e)) {
                getSelectedLink().each((link) => {
                    e.preventDefault();
                    gotoLink(editor, link);
                });
            }
        });
        return {
            gotoSelectedLink
        };
    };

    const openDialog = (editor) => () => {
        editor.execCommand('mceLink', false, { dialog: true });
    };
    const toggleState = (editor, toggler) => {
        editor.on('NodeChange', toggler);
        return () => editor.off('NodeChange', toggler);
    };
    const toggleLinkState = (editor) => (api) => {
        const updateState = () => {
            api.setActive(!editor.mode.isReadOnly() && isInAnchor(editor, editor.selection.getNode()));
            api.setEnabled(editor.selection.isEditable());
        };
        updateState();
        return toggleState(editor, updateState);
    };
    const toggleLinkMenuState = (editor) => (api) => {
        const updateState = () => {
            api.setEnabled(editor.selection.isEditable());
        };
        updateState();
        return toggleState(editor, updateState);
    };
    const toggleRequiresLinkState = (editor) => (api) => {
        const hasLinks$1 = (parents) => hasLinks(parents) || hasLinksInSelection(editor.selection.getRng());
        const parents = editor.dom.getParents(editor.selection.getStart());
        const updateEnabled = (parents) => {
            api.setEnabled(hasLinks$1(parents) && editor.selection.isEditable());
        };
        updateEnabled(parents);
        return toggleState(editor, (e) => updateEnabled(e.parents));
    };
    const setupButtons = (editor, openLink) => {
        editor.ui.registry.addToggleButton('link', {
            icon: 'link',
            tooltip: 'Insert/edit link',
            shortcut: 'Meta+K',
            onAction: openDialog(editor),
            onSetup: toggleLinkState(editor)
        });
        editor.ui.registry.addButton('openlink', {
            icon: 'new-tab',
            tooltip: 'Open link',
            onAction: openLink.gotoSelectedLink,
            onSetup: toggleRequiresLinkState(editor)
        });
        editor.ui.registry.addButton('unlink', {
            icon: 'unlink',
            tooltip: 'Remove link',
            onAction: () => unlink(editor),
            onSetup: toggleRequiresLinkState(editor)
        });
    };
    const setupMenuItems = (editor, openLink) => {
        editor.ui.registry.addMenuItem('openlink', {
            text: 'Open link',
            icon: 'new-tab',
            onAction: openLink.gotoSelectedLink,
            onSetup: toggleRequiresLinkState(editor)
        });
        editor.ui.registry.addMenuItem('link', {
            icon: 'link',
            text: 'Link...',
            shortcut: 'Meta+K',
            onAction: openDialog(editor),
            onSetup: toggleLinkMenuState(editor)
        });
        editor.ui.registry.addMenuItem('unlink', {
            icon: 'unlink',
            text: 'Remove link',
            onAction: () => unlink(editor),
            onSetup: toggleRequiresLinkState(editor)
        });
    };
    const setupContextMenu = (editor) => {
        const inLink = 'link unlink openlink';
        const noLink = 'link';
        editor.ui.registry.addContextMenu('link', {
            update: (element) => {
                const isEditable = editor.dom.isEditable(element);
                if (!isEditable) {
                    return '';
                }
                return hasLinks(editor.dom.getParents(element, 'a')) ? inLink : noLink;
            }
        });
    };
    const setupContextToolbars = (editor, openLink) => {
        const collapseSelectionToEnd = (editor) => {
            editor.selection.collapse(false);
        };
        const onSetupLink = (buttonApi) => {
            const node = editor.selection.getNode();
            buttonApi.setEnabled(isInAnchor(editor, node) && editor.selection.isEditable());
            return noop;
        };
        /**
         * if we're editing a link, don't change the text.
         * if anything other than text is selected, don't change the text.
         * TINY-9593: If there is a text selection return `Optional.none`
         * because `mceInsertLink` command will handle the selection.
         */
        const getLinkText = (value) => {
            const anchor = getAnchorElement(editor);
            const onlyText = isOnlyTextSelected(editor);
            if (anchor.isNone() && onlyText) {
                const text = getAnchorText(editor.selection, anchor);
                return someIf(text.length === 0, value);
            }
            else {
                return Optional.none();
            }
        };
        editor.ui.registry.addContextForm('quicklink', {
            launch: {
                type: 'contextformtogglebutton',
                icon: 'link',
                tooltip: 'Link',
                onSetup: toggleLinkState(editor)
            },
            label: 'Link',
            predicate: (node) => hasContextToolbar(editor) && isInAnchor(editor, node),
            initValue: () => {
                const elm = getAnchorElement(editor);
                return elm.fold(constant(''), getHref);
            },
            commands: [
                {
                    type: 'contextformtogglebutton',
                    icon: 'link',
                    tooltip: 'Link',
                    primary: true,
                    onSetup: (buttonApi) => {
                        const node = editor.selection.getNode();
                        // TODO: Make a test for this later.
                        buttonApi.setActive(isInAnchor(editor, node));
                        return toggleLinkState(editor)(buttonApi);
                    },
                    onAction: (formApi) => {
                        const value = formApi.getValue();
                        const text = getLinkText(value);
                        const attachState = { href: value, attach: noop };
                        link(editor, attachState, {
                            href: value,
                            text,
                            title: Optional.none(),
                            rel: Optional.none(),
                            target: Optional.from(getDefaultLinkTarget(editor)),
                            class: Optional.none()
                        });
                        collapseSelectionToEnd(editor);
                        formApi.hide();
                    }
                },
                {
                    type: 'contextformbutton',
                    icon: 'unlink',
                    tooltip: 'Remove link',
                    onSetup: onSetupLink,
                    // TODO: The original inlite action was quite complex. Are we missing something with this?
                    onAction: (formApi) => {
                        unlink(editor);
                        formApi.hide();
                    }
                },
                {
                    type: 'contextformbutton',
                    icon: 'new-tab',
                    tooltip: 'Open link',
                    onSetup: onSetupLink,
                    onAction: (formApi) => {
                        openLink.gotoSelectedLink();
                        formApi.hide();
                    }
                }
            ]
        });
    };
    const setup = (editor) => {
        const openLink = setup$1(editor);
        setupButtons(editor, openLink);
        setupMenuItems(editor, openLink);
        setupContextMenu(editor);
        setupContextToolbars(editor, openLink);
    };

    var Plugin = () => {
        global$5.add('link', (editor) => {
            register$1(editor);
            register(editor);
            setup(editor);
            setup$2(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
