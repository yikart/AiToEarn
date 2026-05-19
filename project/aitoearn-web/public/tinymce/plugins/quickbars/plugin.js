/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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
    const isString = isType('string');
    const isBoolean = isSimpleType('boolean');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');

    const constant = (value) => {
        return () => {
            return value;
        };
    };
    const never = constant(false);

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

    /**
     * Adds two numbers, and wrap to a range.
     * If the result overflows to the right, snap to the left.
     * If the result overflows to the left, snap to the right.
     */
    // the division is meant to get a number between 0 and 1 for more information check this discussion: https://stackoverflow.com/questions/58285941/how-to-replace-math-random-with-crypto-getrandomvalues-and-keep-same-result
    const random = () => window.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295;

    /**
     * Generate a unique identifier.
     *
     * The unique portion of the identifier only contains an underscore
     * and digits, so that it may safely be used within HTML attributes.
     *
     * The chance of generating a non-unique identifier has been minimized
     * by combining the current time, a random number and a one-up counter.
     *
     * generate :: String -> String
     */
    let unique = 0;
    const generate = (prefix) => {
        const date = new Date();
        const time = date.getTime();
        const random$1 = Math.floor(random() * 1000000000);
        unique++;
        return prefix + '_' + random$1 + unique + String(time);
    };

    const insertTable = (editor, columns, rows) => {
        editor.execCommand('mceInsertTable', false, { rows, columns });
    };
    const insertBlob = (editor, base64, blob) => {
        const blobCache = editor.editorUpload.blobCache;
        const blobInfo = blobCache.create(generate('mceu'), blob, base64);
        blobCache.add(blobInfo);
        editor.insertContent(editor.dom.createHTML('img', { src: blobInfo.blobUri() }));
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result.split(',')[1]);
            };
            reader.readAsDataURL(blob);
        });
    };

    var global = tinymce.util.Tools.resolve('tinymce.util.Delay');

    const pickFile = (editor) => new Promise((resolve) => {
        let resolved = false;
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.position = 'fixed';
        fileInput.style.left = '0';
        fileInput.style.top = '0';
        fileInput.style.opacity = '0.001';
        document.body.appendChild(fileInput);
        const resolveFileInput = (value) => {
            if (!resolved) {
                fileInput.parentNode?.removeChild(fileInput);
                resolved = true;
                resolve(value);
            }
        };
        const changeHandler = (e) => {
            resolveFileInput(Array.prototype.slice.call(e.target.files));
        };
        fileInput.addEventListener('input', changeHandler);
        fileInput.addEventListener('change', changeHandler);
        const cancelHandler = (e) => {
            const cleanup = () => {
                resolveFileInput([]);
            };
            if (!resolved) {
                if (e.type === 'focusin') {
                    // Chrome will fire `focusin` before the input `change` event
                    global.setEditorTimeout(editor, cleanup, 1000);
                }
                else {
                    cleanup();
                }
            }
            editor.off('focusin remove', cancelHandler);
        };
        editor.on('focusin remove', cancelHandler);
        fileInput.click();
    });

    const register$1 = (editor) => {
        editor.on('PreInit', () => {
            if (!editor.queryCommandSupported('QuickbarInsertImage')) {
                editor.addCommand('QuickbarInsertImage', () => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    pickFile(editor).then((files) => {
                        if (files.length > 0) {
                            const blob = files[0];
                            // eslint-disable-next-line @typescript-eslint/no-floating-promises
                            blobToBase64(blob).then((base64) => {
                                insertBlob(editor, base64, blob);
                            });
                        }
                    });
                });
            }
        });
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register = (editor) => {
        const registerOption = editor.options.register;
        const toolbarProcessor = (defaultValue) => (value) => {
            const valid = isBoolean(value) || isString(value);
            if (valid) {
                if (isBoolean(value)) {
                    return { value: value ? defaultValue : '', valid };
                }
                else {
                    return { value: value.trim(), valid };
                }
            }
            else {
                return { valid: false, message: 'Must be a boolean or string.' };
            }
        };
        const defaultSelectionToolbar = 'bold italic | quicklink h2 h3 blockquote';
        registerOption('quickbars_selection_toolbar', {
            processor: toolbarProcessor(defaultSelectionToolbar),
            default: defaultSelectionToolbar
        });
        const defaultInsertToolbar = 'quickimage quicktable';
        registerOption('quickbars_insert_toolbar', {
            processor: toolbarProcessor(defaultInsertToolbar),
            default: defaultInsertToolbar
        });
        const defaultImageToolbar = 'alignleft aligncenter alignright';
        registerOption('quickbars_image_toolbar', {
            processor: toolbarProcessor(defaultImageToolbar),
            default: defaultImageToolbar
        });
    };
    const getTextSelectionToolbarItems = option('quickbars_selection_toolbar');
    const getInsertToolbarItems = option('quickbars_insert_toolbar');
    const getImageToolbarItems = option('quickbars_image_toolbar');

    const setupButtons = (editor) => {
        editor.ui.registry.addButton('quickimage', {
            icon: 'image',
            tooltip: 'Insert image',
            onAction: () => editor.execCommand('QuickbarInsertImage')
        });
        editor.ui.registry.addButton('quicktable', {
            icon: 'table',
            tooltip: 'Insert table',
            onAction: () => {
                insertTable(editor, 2, 2);
            }
        });
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

    const is = (element, selector) => {
        const dom = element.dom;
        if (dom.nodeType !== ELEMENT) {
            return false;
        }
        else {
            const elem = dom;
            if (elem.matches !== undefined) {
                return elem.matches(selector);
            }
            else if (elem.msMatchesSelector !== undefined) {
                return elem.msMatchesSelector(selector);
            }
            else if (elem.webkitMatchesSelector !== undefined) {
                return elem.webkitMatchesSelector(selector);
            }
            else if (elem.mozMatchesSelector !== undefined) {
                // cast to any as mozMatchesSelector doesn't exist in TS DOM lib
                return elem.mozMatchesSelector(selector);
            }
            else {
                throw new Error('Browser lacks native selectors');
            } // unfortunately we can't throw this on startup :(
        }
    };

    const name = (element) => {
        const r = element.dom.nodeName;
        return r.toLowerCase();
    };

    const has$1 = (element, key) => {
        const dom = element.dom;
        // return false for non-element nodes, no point in throwing an error
        return dom && dom.hasAttribute ? dom.hasAttribute(key) : false;
    };

    var ClosestOrAncestor = (is, ancestor, scope, a, isRoot) => {
        if (is(scope, a)) {
            return Optional.some(scope);
        }
        else if (isFunction(isRoot) && isRoot(scope)) {
            return Optional.none();
        }
        else {
            return ancestor(scope, a, isRoot);
        }
    };

    const ancestor$1 = (scope, predicate, isRoot) => {
        let element = scope.dom;
        const stop = isFunction(isRoot) ? isRoot : never;
        while (element.parentNode) {
            element = element.parentNode;
            const el = SugarElement.fromDom(element);
            if (predicate(el)) {
                return Optional.some(el);
            }
            else if (stop(el)) {
                break;
            }
        }
        return Optional.none();
    };
    const closest$2 = (scope, predicate, isRoot) => {
        // This is required to avoid ClosestOrAncestor passing the predicate to itself
        const is = (s, test) => test(s);
        return ClosestOrAncestor(is, ancestor$1, scope, predicate, isRoot);
    };

    const ancestor = (scope, selector, isRoot) => ancestor$1(scope, (e) => is(e, selector), isRoot);
    // Returns Some(closest ancestor element (sugared)) matching 'selector' up to isRoot, or None() otherwise
    const closest$1 = (scope, selector, isRoot) => {
        const is$1 = (element, selector) => is(element, selector);
        return ClosestOrAncestor(is$1, ancestor, scope, selector, isRoot);
    };

    // IE11 Can return undefined for a classList on elements such as math, so we make sure it's not undefined before attempting to use it.
    const supports = (element) => element.dom.classList !== undefined;

    const has = (element, clazz) => supports(element) && element.dom.classList.contains(clazz);

    const closest = (scope, predicate, isRoot) => closest$2(scope, predicate, isRoot).isSome();

    const addToEditor$1 = (editor) => {
        const insertToolbarItems = getInsertToolbarItems(editor);
        if (insertToolbarItems.length > 0) {
            editor.ui.registry.addContextToolbar('quickblock', {
                predicate: (node) => {
                    const sugarNode = SugarElement.fromDom(node);
                    const textBlockElementsMap = editor.schema.getTextBlockElements();
                    const isRoot = (elem) => elem.dom === editor.getBody();
                    return !has$1(sugarNode, 'data-mce-bogus') && closest$1(sugarNode, 'table,[data-mce-bogus="all"]', isRoot).fold(() => closest(sugarNode, (elem) => name(elem) in textBlockElementsMap && editor.dom.isEmpty(elem.dom), isRoot), never);
                },
                items: insertToolbarItems,
                position: 'line',
                scope: 'editor'
            });
        }
    };

    const addToEditor = (editor) => {
        const isEditable = (node) => editor.dom.isEditable(node);
        const isInEditableContext = (el) => isEditable(el.parentElement);
        const isImage = (node) => {
            const isImageFigure = node.nodeName === 'FIGURE' && /image/i.test(node.className);
            const isImage = node.nodeName === 'IMG' || isImageFigure;
            const isPagebreak = has(SugarElement.fromDom(node), 'mce-pagebreak');
            return isImage && isInEditableContext(node) && !isPagebreak;
        };
        const imageToolbarItems = getImageToolbarItems(editor);
        if (imageToolbarItems.length > 0) {
            editor.ui.registry.addContextToolbar('imageselection', {
                predicate: isImage,
                items: imageToolbarItems,
                position: 'node'
            });
        }
        const textToolbarItems = getTextSelectionToolbarItems(editor);
        if (textToolbarItems.length > 0) {
            editor.ui.registry.addContextToolbar('textselection', {
                predicate: (node) => !isImage(node) && !editor.selection.isCollapsed() && isEditable(node),
                items: textToolbarItems,
                position: 'selection',
                scope: 'editor'
            });
        }
    };

    var Plugin = () => {
        global$1.add('quickbars', (editor) => {
            register(editor);
            register$1(editor);
            setupButtons(editor);
            addToEditor$1(editor);
            addToEditor(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
