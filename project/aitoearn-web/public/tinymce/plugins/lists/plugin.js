/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const get = (editor) => ({
        backspaceDelete: (isForward) => {
            editor.execCommand('mceListBackspaceDelete', false, isForward);
        }
    });

    /* eslint-disable @typescript-eslint/no-wrapper-object-types */
    const isSimpleType = (type) => (value) => typeof value === type;
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');

    const constant = (value) => {
        return () => {
            return value;
        };
    };
    const tripleEquals = (a, b) => {
        return a === b;
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

    const nativeSlice = Array.prototype.slice;
    const exists = (xs, pred) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                return true;
            }
        }
        return false;
    };
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
    const each = (xs, f) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            f(x, i);
        }
    };
    const foldl = (xs, f, acc) => {
        each(xs, (x, i) => {
            acc = f(acc, x, i);
        });
        return acc;
    };
    const findUntil = (xs, pred, until) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                return Optional.some(x);
            }
            else if (until(x, i)) {
                break;
            }
        }
        return Optional.none();
    };
    const find = (xs, pred) => {
        return findUntil(xs, pred, never);
    };
    const reverse = (xs) => {
        const r = nativeSlice.call(xs, 0);
        r.reverse();
        return r;
    };
    isFunction(Array.from) ? Array.from : (x) => nativeSlice.call(x);

    /**
     * **Is** the value stored inside this Optional object equal to `rhs`?
     */
    const is = (lhs, rhs, comparator = tripleEquals) => lhs.exists((left) => comparator(left, rhs));

    const blank = (r) => (s) => s.replace(r, '');
    /** removes all leading and trailing spaces */
    const trim = blank(/^\s+|\s+$/g);
    const isNotEmpty = (s) => s.length > 0;
    const isEmpty = (s) => !isNotEmpty(s);

    // Example: 'AB' -> 28
    const parseAlphabeticBase26 = (str) => {
        const chars = reverse(trim(str).split(''));
        const values = map(chars, (char, i) => {
            const charValue = char.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
            return Math.pow(26, i) * charValue;
        });
        return foldl(values, (sum, v) => sum + v, 0);
    };
    // Example: 28 -> 'AB'
    const composeAlphabeticBase26 = (value) => {
        value--;
        if (value < 0) {
            return '';
        }
        else {
            const remainder = value % 26;
            const quotient = Math.floor(value / 26);
            const rest = composeAlphabeticBase26(quotient);
            const char = String.fromCharCode('A'.charCodeAt(0) + remainder);
            return rest + char;
        }
    };
    const isUppercase = (str) => /^[A-Z]+$/.test(str);
    const isLowercase = (str) => /^[a-z]+$/.test(str);
    const isNumeric = (str) => /^[0-9]+$/.test(str);
    const deduceListType = (start) => {
        if (isNumeric(start)) {
            return 2 /* ListType.Numeric */;
        }
        else if (isUppercase(start)) {
            return 0 /* ListType.UpperAlpha */;
        }
        else if (isLowercase(start)) {
            return 1 /* ListType.LowerAlpha */;
        }
        else if (isEmpty(start)) {
            return 3 /* ListType.None */;
        }
        else {
            return 4 /* ListType.Unknown */;
        }
    };
    const parseStartValue = (start) => {
        switch (deduceListType(start)) {
            case 2 /* ListType.Numeric */:
                return Optional.some({
                    listStyleType: Optional.none(),
                    start
                });
            case 0 /* ListType.UpperAlpha */:
                return Optional.some({
                    listStyleType: Optional.some('upper-alpha'),
                    start: parseAlphabeticBase26(start).toString()
                });
            case 1 /* ListType.LowerAlpha */:
                return Optional.some({
                    listStyleType: Optional.some('lower-alpha'),
                    start: parseAlphabeticBase26(start).toString()
                });
            case 3 /* ListType.None */:
                return Optional.some({
                    listStyleType: Optional.none(),
                    start: ''
                });
            case 4 /* ListType.Unknown */:
                return Optional.none();
        }
    };
    const parseDetail = (detail) => {
        const start = parseInt(detail.start, 10);
        if (is(detail.listStyleType, 'upper-alpha')) {
            return composeAlphabeticBase26(start);
        }
        else if (is(detail.listStyleType, 'lower-alpha')) {
            return composeAlphabeticBase26(start).toLowerCase();
        }
        else {
            return detail.start;
        }
    };

    const option = (name) => (editor) => editor.options.get(name);
    const getForcedRootBlock = option('forced_root_block');

    const isCustomList = (list) => /\btox\-/.test(list.className);
    const matchNodeNames = (regex) => (node) => isNonNullable(node) && regex.test(node.nodeName);
    const matchNodeName = (name) => (node) => isNonNullable(node) && node.nodeName.toLowerCase() === name;
    const isListNode = matchNodeNames(/^(OL|UL|DL)$/);
    const isTableCellNode = matchNodeNames(/^(TH|TD)$/);
    const isListItemNode = matchNodeNames(/^(LI|DT|DD)$/);
    const inList = (parents, listName) => findUntil(parents, isListNode, isTableCellNode)
        .exists((list) => list.nodeName === listName && !isCustomList(list));
    const setNodeChangeHandler = (editor, nodeChangeHandler) => {
        const initialNode = editor.selection.getNode();
        // Set the initial state
        nodeChangeHandler({
            parents: editor.dom.getParents(initialNode),
            element: initialNode
        });
        editor.on('NodeChange', nodeChangeHandler);
        return () => editor.off('NodeChange', nodeChangeHandler);
    };
    const isWithinNonEditable = (editor, element) => element !== null && !editor.dom.isEditable(element);
    const isWithinNonEditableList = (editor, element) => {
        const parentList = editor.dom.getParent(element, 'ol,ul,dl');
        return isWithinNonEditable(editor, parentList) || !editor.selection.isEditable();
    };
    const isOlNode = matchNodeName('ol');
    const listNames = ['OL', 'UL', 'DL'];
    const listSelector = listNames.join(',');
    const getParentList = (editor, node) => {
        const selectionStart = node || editor.selection.getStart(true);
        return editor.dom.getParent(selectionStart, listSelector, getClosestListHost(editor, selectionStart, editor.selection.isCollapsed()));
    };
    const getClosestListHost = (editor, elm, isCollapsed) => {
        const parentBlocks = editor.dom.getParents(elm, editor.dom.isBlock);
        const isNotForcedRootBlock = (elm) => elm.nodeName.toLowerCase() !== getForcedRootBlock(editor);
        const parentBlock = find(parentBlocks, (elm) => (!isCollapsed || isNotForcedRootBlock(elm)) && isListHost(editor.schema, elm));
        return parentBlock.getOr(editor.getBody());
    };
    const isListHost = (schema, node) => !isListNode(node) && !isListItemNode(node) && exists(listNames, (listName) => schema.isValidChild(node.nodeName, listName));

    const open = (editor) => {
        // Find the current list and skip opening if the selection isn't in an ordered list
        const currentList = getParentList(editor);
        if (!isOlNode(currentList) || isWithinNonEditableList(editor, currentList)) {
            return;
        }
        editor.windowManager.open({
            title: 'List Properties',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'input',
                        name: 'start',
                        label: 'Start list at number',
                        inputMode: 'numeric'
                    }
                ]
            },
            initialData: {
                start: parseDetail({
                    start: editor.dom.getAttrib(currentList, 'start', '1'),
                    listStyleType: Optional.from(editor.dom.getStyle(currentList, 'list-style-type'))
                })
            },
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
            onSubmit: (api) => {
                const data = api.getData();
                parseStartValue(data.start).each((detail) => {
                    editor.execCommand('mceListUpdate', false, {
                        attrs: {
                            start: detail.start === '1' ? '' : detail.start
                        },
                        styles: {
                            'list-style-type': detail.listStyleType.getOr('')
                        }
                    });
                });
                api.close();
            }
        });
    };

    const register$2 = (editor) => {
        editor.addCommand('mceListProps', () => {
            open(editor);
        });
    };

    const setupToggleButtonHandler = (editor, listName) => (api) => {
        const toggleButtonHandler = (e) => {
            api.setActive(inList(e.parents, listName));
            api.setEnabled(!isWithinNonEditableList(editor, e.element) && editor.selection.isEditable());
        };
        api.setEnabled(editor.selection.isEditable());
        return setNodeChangeHandler(editor, toggleButtonHandler);
    };
    const register$1 = (editor) => {
        const exec = (command) => () => editor.execCommand(command);
        if (!editor.hasPlugin('advlist')) {
            editor.ui.registry.addToggleButton('numlist', {
                icon: 'ordered-list',
                active: false,
                tooltip: 'Numbered list',
                onAction: exec('InsertOrderedList'),
                onSetup: setupToggleButtonHandler(editor, 'OL')
            });
            editor.ui.registry.addToggleButton('bullist', {
                icon: 'unordered-list',
                active: false,
                tooltip: 'Bullet list',
                onAction: exec('InsertUnorderedList'),
                onSetup: setupToggleButtonHandler(editor, 'UL')
            });
        }
    };

    const setupMenuButtonHandler = (editor, listName) => (api) => {
        const menuButtonHandler = (e) => api.setEnabled(inList(e.parents, listName) && !isWithinNonEditableList(editor, e.element));
        return setNodeChangeHandler(editor, menuButtonHandler);
    };
    const register = (editor) => {
        const listProperties = {
            text: 'List properties...',
            icon: 'ordered-list',
            onAction: () => editor.execCommand('mceListProps'),
            onSetup: setupMenuButtonHandler(editor, 'OL')
        };
        editor.ui.registry.addMenuItem('listprops', listProperties);
        editor.ui.registry.addContextMenu('lists', {
            update: (node) => {
                const parentList = getParentList(editor, node);
                return isOlNode(parentList) ? ['listprops'] : [];
            }
        });
    };

    var Plugin = () => {
        global.add('lists', (editor) => {
            register$2(editor);
            register$1(editor);
            register(editor);
            return get(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
