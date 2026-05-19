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
    const isType = (type) => (value) => typeOf(value) === type;
    const isSimpleType = (type) => (value) => typeof value === type;
    const eq = (t) => (a) => t === a;
    const isString = isType('string');
    const isUndefined = eq(undefined);
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

    const nativeSlice = Array.prototype.slice;
    const nativeIndexOf = Array.prototype.indexOf;
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
    const sort = (xs, comparator) => {
        const copy = nativeSlice.call(xs, 0);
        copy.sort(comparator);
        return copy;
    };
    isFunction(Array.from) ? Array.from : (x) => nativeSlice.call(x);

    // There are many variations of Object iteration that are faster than the 'for-in' style:
    // http://jsperf.com/object-keys-iteration/107
    //
    // Use the native keys if it is available (IE9+), otherwise fall back to manually filtering
    const keys = Object.keys;
    const hasOwnProperty = Object.hasOwnProperty;
    const get$1 = (obj, key) => {
        return has(obj, key) ? Optional.from(obj[key]) : Optional.none();
    };
    const has = (obj, key) => hasOwnProperty.call(obj, key);

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

    var global$4 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const get = (customTabs) => {
        const addTab = (spec) => {
            const name = spec.name ?? generate('tab-name');
            const currentCustomTabs = customTabs.get();
            currentCustomTabs[name] = spec;
            customTabs.set(currentCustomTabs);
        };
        return {
            addTab
        };
    };

    const register$2 = (editor, dialogOpener) => {
        editor.addCommand('mceHelp', dialogOpener);
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('help_tabs', {
            processor: 'array'
        });
    };
    const getHelpTabs = option('help_tabs');
    const getForcedPlugins = option('forced_plugins');

    const register = (editor, dialogOpener) => {
        editor.ui.registry.addButton('help', {
            icon: 'help',
            tooltip: 'Help',
            onAction: dialogOpener,
            context: 'any'
        });
        editor.ui.registry.addMenuItem('help', {
            text: 'Help',
            icon: 'help',
            shortcut: 'Alt+0',
            onAction: dialogOpener,
            context: 'any'
        });
    };

    var global$3 = tinymce.util.Tools.resolve('tinymce.Resource');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.I18n');

    const pLoadHtmlByLangCode = (baseUrl, langCode) => global$3.load(`tinymce.html-i18n.help-keynav.${langCode}`, `${baseUrl}/js/i18n/keynav/${langCode}.js`);
    const pLoadI18nHtml = (baseUrl) => 
    // TINY-9928: Load language file for the current language, or English if the file is not available
    pLoadHtmlByLangCode(baseUrl, global$2.getCode()).catch(() => pLoadHtmlByLangCode(baseUrl, 'en'));
    const initI18nLoad = (editor, baseUrl) => {
        editor.on('init', () => {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            pLoadI18nHtml(baseUrl);
        });
    };

    const pTab = async (pluginUrl) => {
        const body = {
            type: 'htmlpanel',
            presets: 'document',
            html: await pLoadI18nHtml(pluginUrl)
        };
        return {
            name: 'keyboardnav',
            title: 'Keyboard Navigation',
            items: [body]
        };
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.Env');

    // Converts shortcut format to Mac/PC variants
    const convertText = (source) => {
        const isMac = global$1.os.isMacOS() || global$1.os.isiOS();
        const mac = {
            alt: '&#x2325;',
            ctrl: '&#x2303;',
            shift: '&#x21E7;',
            meta: '&#x2318;',
            access: '&#x2303;&#x2325;'
        };
        const other = {
            meta: 'Ctrl ',
            access: 'Shift + Alt '
        };
        const replace = isMac ? mac : other;
        const shortcut = source.split('+');
        const updated = map(shortcut, (segment) => {
            // search lowercase, but if not found use the original
            const search = segment.toLowerCase().trim();
            return has(replace, search) ? replace[search] : segment;
        });
        return isMac ? (updated.join('')).replace(/\s/, '') : updated.join('+');
    };

    const shortcuts = [
        { shortcuts: ['Meta + B'], action: 'Bold' },
        { shortcuts: ['Meta + I'], action: 'Italic' },
        { shortcuts: ['Meta + U'], action: 'Underline' },
        { shortcuts: ['Meta + A'], action: 'Select all' },
        { shortcuts: ['Meta + Y', 'Meta + Shift + Z'], action: 'Redo' },
        { shortcuts: ['Meta + Z'], action: 'Undo' },
        { shortcuts: ['Access + 1'], action: 'Heading 1' },
        { shortcuts: ['Access + 2'], action: 'Heading 2' },
        { shortcuts: ['Access + 3'], action: 'Heading 3' },
        { shortcuts: ['Access + 4'], action: 'Heading 4' },
        { shortcuts: ['Access + 5'], action: 'Heading 5' },
        { shortcuts: ['Access + 6'], action: 'Heading 6' },
        { shortcuts: ['Access + 7'], action: 'Paragraph' },
        { shortcuts: ['Access + 8'], action: 'Div' },
        { shortcuts: ['Access + 9'], action: 'Address' },
        { shortcuts: ['Alt + 0'], action: 'Open help dialog' },
        { shortcuts: ['Alt + F9'], action: 'Focus to menubar' },
        { shortcuts: ['Alt + F10'], action: 'Focus to toolbar' },
        { shortcuts: ['Alt + F11'], action: 'Focus to element path' },
        { shortcuts: ['Alt + F12'], action: 'Focus to notification' },
        { shortcuts: ['Ctrl + F9'], action: 'Focus to contextual toolbar' },
        { shortcuts: ['Shift + Enter'], action: 'Open popup menu for split buttons' },
        { shortcuts: ['Meta + K'], action: 'Insert link (if link plugin activated)' },
        { shortcuts: ['Meta + S'], action: 'Save (if save plugin activated)' },
        { shortcuts: ['Meta + F'], action: 'Find (if searchreplace plugin activated)' },
        { shortcuts: ['Meta + Shift + F'], action: 'Switch to or from fullscreen mode' }
    ];

    const tab$2 = () => {
        const shortcutList = map(shortcuts, (shortcut) => {
            const shortcutText = map(shortcut.shortcuts, convertText).join(' or ');
            return [shortcut.action, shortcutText];
        });
        const tablePanel = {
            type: 'table',
            // TODO: Fix table styles #TINY-2909
            header: ['Action', 'Shortcut'],
            cells: shortcutList
        };
        return {
            name: 'shortcuts',
            title: 'Handy Shortcuts',
            items: [
                tablePanel
            ]
        };
    };

    // These lists are automatically sorted when generating the dialog.
    const urls = map([
        { key: 'accordion', name: 'Accordion' },
        { key: 'anchor', name: 'Anchor' },
        { key: 'autolink', name: 'Autolink' },
        { key: 'autoresize', name: 'Autoresize' },
        { key: 'autosave', name: 'Autosave' },
        { key: 'charmap', name: 'Character Map' },
        { key: 'code', name: 'Code' },
        { key: 'codesample', name: 'Code Sample' },
        { key: 'colorpicker', name: 'Color Picker' },
        { key: 'directionality', name: 'Directionality' },
        { key: 'emoticons', name: 'Emoticons' },
        { key: 'fullscreen', name: 'Full Screen' },
        { key: 'help', name: 'Help' },
        { key: 'image', name: 'Image' },
        { key: 'importcss', name: 'Import CSS' },
        { key: 'insertdatetime', name: 'Insert Date/Time' },
        { key: 'link', name: 'Link' },
        { key: 'lists', name: 'Lists' },
        { key: 'advlist', name: 'List Styles' },
        { key: 'media', name: 'Media' },
        { key: 'nonbreaking', name: 'Nonbreaking' },
        { key: 'pagebreak', name: 'Page Break' },
        { key: 'preview', name: 'Preview' },
        { key: 'quickbars', name: 'Quick Toolbars' },
        { key: 'save', name: 'Save' },
        { key: 'searchreplace', name: 'Search and Replace' },
        { key: 'table', name: 'Table' },
        { key: 'textcolor', name: 'Text Color' },
        { key: 'visualblocks', name: 'Visual Blocks' },
        { key: 'visualchars', name: 'Visual Characters' },
        { key: 'wordcount', name: 'Word Count' },
        // TODO: Add other premium plugins when they are included in the website
        { key: 'a11ychecker', name: 'Accessibility Checker', type: "premium" /* PluginType.Premium */ },
        { key: 'typography', name: 'Advanced Typography', type: "premium" /* PluginType.Premium */, slug: 'advanced-typography' },
        { key: 'ai', name: 'AI Assistant', type: "premium" /* PluginType.Premium */ },
        { key: 'casechange', name: 'Case Change', type: "premium" /* PluginType.Premium */ },
        { key: 'checklist', name: 'Checklist', type: "premium" /* PluginType.Premium */ },
        { key: 'advcode', name: 'Enhanced Code Editor', type: "premium" /* PluginType.Premium */ },
        { key: 'mediaembed', name: 'Enhanced Media Embed', type: "premium" /* PluginType.Premium */, slug: 'introduction-to-mediaembed' },
        { key: 'advtable', name: 'Enhanced Tables', type: "premium" /* PluginType.Premium */ },
        { key: 'exportpdf', name: 'Export to PDF', type: "premium" /* PluginType.Premium */ },
        { key: 'exportword', name: 'Export to Word', type: "premium" /* PluginType.Premium */ },
        { key: 'footnotes', name: 'Footnotes', type: "premium" /* PluginType.Premium */ },
        { key: 'formatpainter', name: 'Format Painter', type: "premium" /* PluginType.Premium */ },
        { key: 'editimage', name: 'Image Editing', type: "premium" /* PluginType.Premium */ },
        { key: 'uploadcare', name: 'Image Optimizer Powered by Uploadcare', type: "premium" /* PluginType.Premium */ },
        { key: 'importword', name: 'Import from Word', type: "premium" /* PluginType.Premium */ },
        { key: 'inlinecss', name: 'Inline CSS', type: "premium" /* PluginType.Premium */, slug: 'inline-css' },
        { key: 'linkchecker', name: 'Link Checker', type: "premium" /* PluginType.Premium */ },
        { key: 'math', name: 'Math', type: "premium" /* PluginType.Premium */ },
        { key: 'markdown', name: 'Markdown', type: "premium" /* PluginType.Premium */ },
        { key: 'mentions', name: 'Mentions', type: "premium" /* PluginType.Premium */ },
        { key: 'mergetags', name: 'Merge Tags', type: "premium" /* PluginType.Premium */ },
        { key: 'pageembed', name: 'Page Embed', type: "premium" /* PluginType.Premium */ },
        { key: 'permanentpen', name: 'Permanent Pen', type: "premium" /* PluginType.Premium */ },
        { key: 'powerpaste', name: 'PowerPaste', type: "premium" /* PluginType.Premium */, slug: 'introduction-to-powerpaste' },
        { key: 'revisionhistory', name: 'Revision History', type: "premium" /* PluginType.Premium */ },
        { key: 'tinymcespellchecker', name: 'Spell Checker', type: "premium" /* PluginType.Premium */, slug: 'introduction-to-tiny-spellchecker' },
        { key: 'suggestededits', name: 'Suggested Edits', type: "premium" /* PluginType.Premium */ },
        { key: 'tinymceai', name: 'TinyMCE AI', type: "premium" /* PluginType.Premium */ },
        { key: 'autocorrect', name: 'Spelling Autocorrect', type: "premium" /* PluginType.Premium */ },
        { key: 'tableofcontents', name: 'Table of Contents', type: "premium" /* PluginType.Premium */ },
        { key: 'fullpagehtml', name: 'Fullpage HTML', type: "premium" /* PluginType.Premium */ },
        { key: 'advtemplate', name: 'Templates', type: "premium" /* PluginType.Premium */, slug: 'advanced-templates' },
        { key: 'tinycomments', name: 'Tiny Comments', type: "premium" /* PluginType.Premium */, slug: 'introduction-to-tiny-comments' },
        { key: 'tinydrive', name: 'Tiny Drive', type: "premium" /* PluginType.Premium */, slug: 'tinydrive-introduction' },
    ], (item) => ({
        ...item,
        // Set the defaults/fallbacks for the plugin urls
        type: item.type || "opensource" /* PluginType.OpenSource */,
        slug: item.slug || item.key
    }));

    const tab$1 = (editor) => {
        const availablePlugins = () => {
            const premiumPlugins = filter(urls, ({ type }) => {
                return type === "premium" /* PluginUrls.PluginType.Premium */;
            });
            const sortedPremiumPlugins = sort(map(premiumPlugins, (p) => p.name), (s1, s2) => s1.localeCompare(s2));
            const premiumPluginList = map(sortedPremiumPlugins, (pluginName) => `<li>${pluginName}</li>`).join('');
            return '<div>' +
                '<p><b>' + global$2.translate('Premium plugins:') + '</b></p>' +
                '<ul>' +
                premiumPluginList +
                '<li class="tox-help__more-link" ">' +
                '<a href="https://www.tiny.cloud/pricing/?utm_campaign=help_dialog_plugin_tab&utm_source=tiny&utm_medium=referral&utm_term=read_more&utm_content=premium_plugin_heading" rel="noopener" target="_blank"' +
                ' data-alloy-tabstop="true" tabindex="-1">' + global$2.translate('Learn more...') + '</a></li>' +
                '</ul>' +
                '</div>';
        };
        const makeLink = (p) => `<a data-alloy-tabstop="true" tabindex="-1" href="${p.url}" target="_blank" rel="noopener">${p.name}</a>`;
        const identifyUnknownPlugin = (editor, key) => {
            const getMetadata = editor.plugins[key].getMetadata;
            if (isFunction(getMetadata)) {
                const metadata = getMetadata();
                return { name: metadata.name, html: makeLink(metadata) };
            }
            else {
                return { name: key, html: key };
            }
        };
        const getPluginData = (editor, key) => find(urls, (x) => {
            return x.key === key;
        }).fold(() => {
            return identifyUnknownPlugin(editor, key);
        }, (x) => {
            // We know this plugin, so use our stored details.
            const name = x.type === "premium" /* PluginUrls.PluginType.Premium */ ? `${x.name}*` : x.name;
            const html = makeLink({ name, url: `https://www.tiny.cloud/docs/tinymce/${tinymce.majorVersion}/${x.slug}/` });
            return { name, html };
        });
        const getPluginKeys = (editor) => {
            const keys$1 = keys(editor.plugins);
            const forcedPlugins = getForcedPlugins(editor);
            const hiddenPlugins = isUndefined(forcedPlugins) ? ['onboarding', 'licensekeymanager'] : forcedPlugins.concat(['onboarding', 'licensekeymanager']);
            return filter(keys$1, (k) => !contains(hiddenPlugins, k));
        };
        const pluginLister = (editor) => {
            const pluginKeys = getPluginKeys(editor);
            const sortedPluginData = sort(map(pluginKeys, (k) => getPluginData(editor, k)), (pd1, pd2) => pd1.name.localeCompare(pd2.name));
            const pluginLis = map(sortedPluginData, (key) => {
                return '<li>' + key.html + '</li>';
            });
            const count = pluginLis.length;
            const pluginsString = pluginLis.join('');
            const html = '<p><b>' + global$2.translate(['Plugins installed ({0}):', count]) + '</b></p>' +
                '<ul>' + pluginsString + '</ul>';
            return html;
        };
        const installedPlugins = (editor) => {
            if (editor == null) {
                return '';
            }
            return '<div>' +
                pluginLister(editor) +
                '</div>';
        };
        const htmlPanel = {
            type: 'htmlpanel',
            presets: 'document',
            html: [
                installedPlugins(editor),
                availablePlugins()
            ].join('')
        };
        return {
            name: 'plugins',
            title: 'Plugins',
            items: [
                htmlPanel
            ]
        };
    };

    var global = tinymce.util.Tools.resolve('tinymce.EditorManager');

    const tab = () => {
        const getVersion = (major, minor) => major.indexOf('@') === 0 ? 'X.X.X' : major + '.' + minor;
        const version = getVersion(global.majorVersion, global.minorVersion);
        const changeLogLink = '<a data-alloy-tabstop="true" tabindex="-1" href="https://www.tiny.cloud/docs/tinymce/8/changelog/?utm_campaign=help_dialog_version_tab&utm_source=tiny&utm_medium=referral" rel="noopener" target="_blank">TinyMCE ' + version + '</a>';
        const htmlPanel = {
            type: 'htmlpanel',
            html: '<p>' + global$2.translate(['You are using {0}', changeLogLink]) + '</p>',
            presets: 'document'
        };
        return {
            name: 'versions',
            title: 'Version',
            items: [
                htmlPanel
            ]
        };
    };

    const parseHelpTabsSetting = (tabsFromSettings, tabs) => {
        const newTabs = {};
        const names = map(tabsFromSettings, (t) => {
            if (isString(t)) {
                // Code below shouldn't care if a tab name doesn't have a spec.
                // If we find it does, we'll need to make this smarter.
                // CustomTabsTest has a case for this.
                if (has(tabs, t)) {
                    newTabs[t] = tabs[t];
                }
                return t;
            }
            else {
                const name = t.name ?? generate('tab-name');
                newTabs[name] = t;
                return name;
            }
        });
        return { tabs: newTabs, names };
    };
    const getNamesFromTabs = (tabs) => {
        const names = keys(tabs);
        // Move the versions tab to the end if it exists
        const idx = names.indexOf('versions');
        if (idx !== -1) {
            names.splice(idx, 1);
            names.push('versions');
        }
        return { tabs, names };
    };
    const pParseCustomTabs = async (editor, customTabs, pluginUrl) => {
        const shortcuts = tab$2();
        const nav = await pTab(pluginUrl);
        const plugins = tab$1(editor);
        const versions = tab();
        const tabs = {
            [shortcuts.name]: shortcuts,
            [nav.name]: nav,
            [plugins.name]: plugins,
            [versions.name]: versions,
            ...customTabs.get()
        };
        return Optional.from(getHelpTabs(editor)).fold(() => getNamesFromTabs(tabs), (tabsFromSettings) => parseHelpTabsSetting(tabsFromSettings, tabs));
    };
    const init = (editor, customTabs, pluginUrl) => () => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        pParseCustomTabs(editor, customTabs, pluginUrl).then(({ tabs, names }) => {
            const foundTabs = map(names, (name) => get$1(tabs, name));
            const dialogTabs = cat(foundTabs);
            const body = {
                type: 'tabpanel',
                tabs: dialogTabs
            };
            editor.windowManager.open({
                title: 'Help',
                size: 'medium',
                body,
                buttons: [
                    {
                        type: 'cancel',
                        name: 'close',
                        text: 'Close',
                        primary: true
                    }
                ],
                initialData: {}
            });
        });
    };

    var Plugin = () => {
        global$4.add('help', (editor, pluginUrl) => {
            const customTabs = Cell({});
            const api = get(customTabs);
            register$1(editor);
            const dialogOpener = init(editor, customTabs, pluginUrl);
            register(editor, dialogOpener);
            register$2(editor, dialogOpener);
            editor.shortcuts.add('Alt+0', 'Open help dialog', 'mceHelp');
            initI18nLoad(editor, pluginUrl);
            return api;
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
