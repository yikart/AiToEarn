/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const applyListFormat = (editor, listName, styleValue) => {
        const cmd = listName === 'UL' ? 'InsertUnorderedList' : 'InsertOrderedList';
        editor.execCommand(cmd, false, styleValue === false ? null : { 'list-style-type': styleValue });
    };

    const register$2 = (editor) => {
        editor.addCommand('ApplyUnorderedListStyle', (ui, value) => {
            applyListFormat(editor, 'UL', value['list-style-type']);
        });
        editor.addCommand('ApplyOrderedListStyle', (ui, value) => {
            applyListFormat(editor, 'OL', value['list-style-type']);
        });
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('advlist_number_styles', {
            processor: 'string[]',
            default: 'default,lower-alpha,lower-greek,lower-roman,upper-alpha,upper-roman'.split(',')
        });
        registerOption('advlist_bullet_styles', {
            processor: 'string[]',
            default: 'default,disc,circle,square'.split(',')
        });
    };
    const getNumberStyles = option('advlist_number_styles');
    const getBulletStyles = option('advlist_bullet_styles');

    /* eslint-disable @typescript-eslint/no-wrapper-object-types */
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);

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

    const nativeIndexOf = Array.prototype.indexOf;
    const rawIndexOf = (ts, t) => nativeIndexOf.call(ts, t);
    const contains = (xs, x) => rawIndexOf(xs, x) > -1;
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
    const map = (obj, f) => {
        return tupleMap(obj, (x, i) => ({
            k: i,
            v: f(x, i)
        }));
    };
    const tupleMap = (obj, f) => {
        const r = {};
        each(obj, (x, i) => {
            const tuple = f(x, i);
            r[tuple.k] = tuple.v;
        });
        return r;
    };

    var global = tinymce.util.Tools.resolve('tinymce.util.Tools');

    const isCustomList = (list) => /\btox\-/.test(list.className);
    const isChildOfBody = (editor, elm) => {
        return editor.dom.isChildOf(elm, editor.getBody());
    };
    const matchNodeNames = (regex) => (node) => isNonNullable(node) && regex.test(node.nodeName);
    const isListNode = matchNodeNames(/^(OL|UL|DL)$/);
    const isTableCellNode = matchNodeNames(/^(TH|TD)$/);
    const inList = (editor, parents, nodeName) => findUntil(parents, (parent) => isListNode(parent) && !isCustomList(parent), isTableCellNode)
        .exists((list) => list.nodeName === nodeName && isChildOfBody(editor, list));
    const getSelectedStyleType = (editor) => {
        const listElm = editor.dom.getParent(editor.selection.getNode(), 'ol,ul');
        const style = editor.dom.getStyle(listElm, 'listStyleType');
        return Optional.from(style);
    };
    // Lists/core/Util.ts - Duplicated in Lists plugin
    const isWithinNonEditable = (editor, element) => element !== null && !editor.dom.isEditable(element);
    const isWithinNonEditableList = (editor, element) => {
        const parentList = editor.dom.getParent(element, 'ol,ul,dl');
        return isWithinNonEditable(editor, parentList) || !editor.selection.isEditable();
    };
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

    // <ListStyles>
    const styleValueToText = (styleValue) => {
        return styleValue.replace(/\-/g, ' ').replace(/\b\w/g, (chr) => {
            return chr.toUpperCase();
        });
    };
    const normalizeStyleValue = (styleValue) => isNullable(styleValue) || styleValue === 'default' ? '' : styleValue;
    const makeSetupHandler = (editor, nodeName) => (api) => {
        const updateButtonState = (editor, parents) => {
            const element = editor.selection.getStart(true);
            api.setActive(inList(editor, parents, nodeName));
            api.setEnabled(!isWithinNonEditableList(editor, element));
        };
        const nodeChangeHandler = (e) => updateButtonState(editor, e.parents);
        return setNodeChangeHandler(editor, nodeChangeHandler);
    };
    const addSplitButton = (editor, id, tooltip, cmd, nodeName, styles) => {
        const listStyleTypeAliases = {
            'lower-latin': 'lower-alpha',
            'upper-latin': 'upper-alpha',
            'lower-alpha': 'lower-latin',
            'upper-alpha': 'upper-latin'
        };
        const stylesContainsAliasMap = map(listStyleTypeAliases, (alias) => contains(styles, alias));
        editor.ui.registry.addSplitButton(id, {
            tooltip,
            chevronTooltip: tooltip,
            icon: nodeName === "OL" /* ListType.OrderedList */ ? 'ordered-list' : 'unordered-list',
            presets: 'listpreview',
            columns: nodeName === "OL" /* ListType.OrderedList */ ? 3 : 4,
            fetch: (callback) => {
                const items = global.map(styles, (styleValue) => {
                    const iconStyle = nodeName === "OL" /* ListType.OrderedList */ ? 'num' : 'bull';
                    const iconName = styleValue === 'decimal' ? 'default' : styleValue;
                    const itemValue = normalizeStyleValue(styleValue);
                    const displayText = styleValueToText(styleValue);
                    return {
                        type: 'choiceitem',
                        value: itemValue,
                        icon: 'list-' + iconStyle + '-' + iconName,
                        text: displayText
                    };
                });
                callback(items);
            },
            onAction: () => editor.execCommand(cmd),
            onItemAction: (_splitButtonApi, value) => {
                applyListFormat(editor, nodeName, value);
            },
            select: (value) => {
                const listStyleType = getSelectedStyleType(editor);
                return listStyleType.exists((listStyle) => value === listStyle || (listStyleTypeAliases[listStyle] === value && !stylesContainsAliasMap[value]));
            },
            onSetup: makeSetupHandler(editor, nodeName)
        });
    };
    const addButton = (editor, id, tooltip, cmd, nodeName, styleValue) => {
        editor.ui.registry.addToggleButton(id, {
            active: false,
            tooltip,
            icon: nodeName === "OL" /* ListType.OrderedList */ ? 'ordered-list' : 'unordered-list',
            onSetup: makeSetupHandler(editor, nodeName),
            // Need to make sure the button removes rather than applies if a list of the same type is selected
            onAction: () => editor.queryCommandState(cmd) || styleValue === '' ? editor.execCommand(cmd) : applyListFormat(editor, nodeName, styleValue)
        });
    };
    const addControl = (editor, id, tooltip, cmd, nodeName, styles) => {
        if (styles.length > 1) {
            addSplitButton(editor, id, tooltip, cmd, nodeName, styles);
        }
        else {
            addButton(editor, id, tooltip, cmd, nodeName, normalizeStyleValue(styles[0]));
        }
    };
    const register = (editor) => {
        addControl(editor, 'numlist', 'Numbered list', 'InsertOrderedList', "OL" /* ListType.OrderedList */, getNumberStyles(editor));
        addControl(editor, 'bullist', 'Bullet list', 'InsertUnorderedList', "UL" /* ListType.UnorderedList */, getBulletStyles(editor));
    };

    var Plugin = () => {
        global$1.add('advlist', (editor) => {
            if (editor.hasPlugin('lists')) {
                register$1(editor);
                register(editor);
                register$2(editor);
            }
            else {
                // eslint-disable-next-line no-console
                console.error('Please use the Lists plugin together with the List Styles plugin.');
            }
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
