/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    /* eslint-disable @typescript-eslint/no-wrapper-object-types */
    const isSimpleType = (type) => (value) => typeof value === type;
    const eq = (t) => (a) => t === a;
    const isNull = eq(null);
    const isUndefined = eq(undefined);
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');

    const noop = () => { };
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
    const exists = (xs, pred) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                return true;
            }
        }
        return false;
    };
    const map$1 = (xs, f) => {
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
    isFunction(Array.from) ? Array.from : (x) => nativeSlice.call(x);

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

    const shallow = (old, nu) => {
        return nu;
    };
    const baseMerge = (merger) => {
        return (...objects) => {
            if (objects.length === 0) {
                throw new Error(`Can't merge zero objects`);
            }
            const ret = {};
            for (let j = 0; j < objects.length; j++) {
                const curObject = objects[j];
                for (const key in curObject) {
                    if (has(curObject, key)) {
                        ret[key] = merger(ret[key], curObject[key]);
                    }
                }
            }
            return ret;
        };
    };
    const merge = baseMerge(shallow);

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

    const checkRange = (str, substr, start) => substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
    const contains = (str, substr, start = 0, end) => {
        const idx = str.indexOf(substr, start);
        if (idx !== -1) {
            return isUndefined(end) ? true : idx + substr.length <= end;
        }
        else {
            return false;
        }
    };
    /** Does 'str' start with 'prefix'?
     *  Note: all strings start with the empty string.
     *        More formally, for all strings x, startsWith(x, "").
     *        This is so that for all strings x and y, startsWith(y + x, y)
     */
    const startsWith = (str, prefix) => {
        return checkRange(str, prefix, 0);
    };

    // Run a function fn after rate ms. If another invocation occurs
    // during the time it is waiting, reschedule the function again
    // with the new arguments.
    const last = (fn, rate) => {
        let timer = null;
        const cancel = () => {
            if (!isNull(timer)) {
                clearTimeout(timer);
                timer = null;
            }
        };
        const throttle = (...args) => {
            cancel();
            timer = setTimeout(() => {
                timer = null;
                fn.apply(null, args);
            }, rate);
        };
        return {
            cancel,
            throttle
        };
    };

    const insertEmoticon = (editor, ch) => {
        editor.insertContent(ch);
    };

    var global = tinymce.util.Tools.resolve('tinymce.Resource');

    const DEFAULT_ID = 'tinymce.plugins.emoticons';
    const option = (name) => (editor) => editor.options.get(name);
    const register$2 = (editor, pluginUrl) => {
        const registerOption = editor.options.register;
        registerOption('emoticons_database', {
            processor: 'string',
            default: 'emojis'
        });
        registerOption('emoticons_database_url', {
            processor: 'string',
            default: `${pluginUrl}/js/${getEmojiDatabase(editor)}${editor.suffix}.js`
        });
        registerOption('emoticons_database_id', {
            processor: 'string',
            default: DEFAULT_ID
        });
        registerOption('emoticons_append', {
            processor: 'object',
            default: {}
        });
        registerOption('emoticons_images_url', {
            processor: 'string',
            default: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/15.1.0/72x72/'
        });
    };
    const getEmojiDatabase = option('emoticons_database');
    const getEmojiDatabaseUrl = option('emoticons_database_url');
    const getEmojiDatabaseId = option('emoticons_database_id');
    const getAppendedEmoji = option('emoticons_append');
    const getEmojiImageUrl = option('emoticons_images_url');

    const ALL_CATEGORY = 'All';
    const categoryNameMap = {
        symbols: 'Symbols',
        people: 'People',
        animals_and_nature: 'Animals and Nature',
        food_and_drink: 'Food and Drink',
        activity: 'Activity',
        travel_and_places: 'Travel and Places',
        objects: 'Objects',
        flags: 'Flags',
        user: 'User Defined'
    };
    const translateCategory = (categories, name) => has(categories, name) ? categories[name] : name;
    const getUserDefinedEmoji = (editor) => {
        const userDefinedEmoticons = getAppendedEmoji(editor);
        return map(userDefinedEmoticons, (value) => 
        // Set some sane defaults for the custom emoji entry
        ({ keywords: [], category: 'user', ...value }));
    };
    // TODO: Consider how to share this loading across different editors
    const initDatabase = (editor, databaseUrl, databaseId) => {
        const categories = value();
        const all = value();
        const emojiImagesUrl = getEmojiImageUrl(editor);
        const getEmoji = (lib) => {
            // Note: This is a little hacky, but the database doesn't provide a way for us to tell what sort of database is being used
            if (startsWith(lib.char, '<img')) {
                return lib.char.replace(/src="([^"]+)"/, (match, url) => `src="${emojiImagesUrl}${url}"`);
            }
            else {
                return lib.char;
            }
        };
        const processEmojis = (emojis) => {
            const cats = {};
            const everything = [];
            each(emojis, (lib, title) => {
                const entry = {
                    // Omitting fitzpatrick_scale
                    title,
                    keywords: lib.keywords,
                    char: getEmoji(lib),
                    category: translateCategory(categoryNameMap, lib.category)
                };
                const current = cats[entry.category] !== undefined ? cats[entry.category] : [];
                cats[entry.category] = current.concat([entry]);
                everything.push(entry);
            });
            categories.set(cats);
            all.set(everything);
        };
        editor.on('init', () => {
            global.load(databaseId, databaseUrl).then((emojis) => {
                const userEmojis = getUserDefinedEmoji(editor);
                processEmojis(merge(emojis, userEmojis));
            }, (err) => {
                // eslint-disable-next-line no-console
                console.log(`Failed to load emojis: ${err}`);
                categories.set({});
                all.set([]);
            });
        });
        const listCategory = (category) => {
            if (category === ALL_CATEGORY) {
                return listAll();
            }
            return categories.get().bind((cats) => Optional.from(cats[category])).getOr([]);
        };
        const listAll = () => all.get().getOr([]);
        const listCategories = () => 
        // TODO: Category key order should be adjusted to match the standard
        [ALL_CATEGORY].concat(keys(categories.get().getOr({})));
        const waitForLoad = () => {
            if (hasLoaded()) {
                return Promise.resolve(true);
            }
            else {
                return new Promise((resolve, reject) => {
                    let numRetries = 15;
                    const interval = setInterval(() => {
                        if (hasLoaded()) {
                            clearInterval(interval);
                            resolve(true);
                        }
                        else {
                            numRetries--;
                            if (numRetries < 0) {
                                // eslint-disable-next-line no-console
                                console.log('Could not load emojis from url: ' + databaseUrl);
                                clearInterval(interval);
                                reject(false);
                            }
                        }
                    }, 100);
                });
            }
        };
        const hasLoaded = () => categories.isSet() && all.isSet();
        return {
            listCategories,
            hasLoaded,
            waitForLoad,
            listAll,
            listCategory
        };
    };

    const emojiMatches = (emoji, lowerCasePattern) => contains(emoji.title.toLowerCase(), lowerCasePattern) ||
        exists(emoji.keywords, (k) => contains(k.toLowerCase(), lowerCasePattern));
    const emojisFrom = (list, pattern, maxResults) => {
        const matches = [];
        const lowerCasePattern = pattern.toLowerCase();
        const reachedLimit = maxResults.fold(() => never, (max) => (size) => size >= max);
        for (let i = 0; i < list.length; i++) {
            // TODO: more intelligent search by showing title matches at the top, keyword matches after that (use two arrays and concat at the end)
            if (pattern.length === 0 || emojiMatches(list[i], lowerCasePattern)) {
                matches.push({
                    value: list[i].char,
                    text: list[i].title,
                    icon: list[i].char
                });
                if (reachedLimit(matches.length)) {
                    break;
                }
            }
        }
        return matches;
    };

    const patternName = 'pattern';
    const open = (editor, database) => {
        const initialState = {
            pattern: '',
            results: emojisFrom(database.listAll(), '', Optional.some(300))
        };
        const currentTab = Cell(ALL_CATEGORY);
        const scan = (dialogApi) => {
            const dialogData = dialogApi.getData();
            const category = currentTab.get();
            const candidates = database.listCategory(category);
            const results = emojisFrom(candidates, dialogData[patternName], category === ALL_CATEGORY ? Optional.some(300) : Optional.none());
            dialogApi.setData({
                results
            });
        };
        const updateFilter = last((dialogApi) => {
            scan(dialogApi);
        }, 200);
        const searchField = {
            label: 'Search',
            type: 'input',
            name: patternName
        };
        const resultsField = {
            type: 'collection',
            name: 'results'
            // TODO TINY-3229 implement collection columns properly
            // columns: 'auto'
        };
        const getInitialState = () => {
            const body = {
                type: 'tabpanel',
                // All tabs have the same fields.
                tabs: map$1(database.listCategories(), (cat) => ({
                    title: cat,
                    name: cat,
                    items: [searchField, resultsField]
                }))
            };
            return {
                title: 'Emojis',
                size: 'normal',
                body,
                initialData: initialState,
                onTabChange: (dialogApi, details) => {
                    currentTab.set(details.newTabName);
                    updateFilter.throttle(dialogApi);
                },
                onChange: updateFilter.throttle,
                onAction: (dialogApi, actionData) => {
                    if (actionData.name === 'results') {
                        insertEmoticon(editor, actionData.value);
                        dialogApi.close();
                    }
                },
                buttons: [
                    {
                        type: 'cancel',
                        text: 'Close',
                        primary: true
                    }
                ]
            };
        };
        const dialogApi = editor.windowManager.open(getInitialState());
        dialogApi.focus(patternName);
        if (!database.hasLoaded()) {
            dialogApi.block('Loading emojis...');
            database.waitForLoad().then(() => {
                dialogApi.redial(getInitialState());
                updateFilter.throttle(dialogApi);
                dialogApi.focus(patternName);
                dialogApi.unblock();
            }).catch((_err) => {
                dialogApi.redial({
                    title: 'Emojis',
                    body: {
                        type: 'panel',
                        items: [
                            {
                                type: 'alertbanner',
                                level: 'error',
                                icon: 'warning',
                                text: 'Could not load emojis'
                            }
                        ]
                    },
                    buttons: [
                        {
                            type: 'cancel',
                            text: 'Close',
                            primary: true
                        }
                    ],
                    initialData: {
                        pattern: '',
                        results: []
                    }
                });
                dialogApi.focus(patternName);
                dialogApi.unblock();
            });
        }
    };

    const register$1 = (editor, database) => {
        editor.addCommand('mceEmoticons', () => open(editor, database));
    };

    const setup = (editor) => {
        editor.on('PreInit', () => {
            editor.parser.addAttributeFilter('data-emoticon', (nodes) => {
                each$1(nodes, (node) => {
                    node.attr('data-mce-resize', 'false');
                    node.attr('data-mce-placeholder', '1');
                });
            });
        });
    };

    const init = (editor, database) => {
        editor.ui.registry.addAutocompleter('emoticons', {
            trigger: ':',
            columns: 'auto',
            minChars: 2,
            fetch: (pattern, maxResults) => database.waitForLoad().then(() => {
                const candidates = database.listAll();
                return emojisFrom(candidates, pattern, Optional.some(maxResults));
            }),
            onAction: (autocompleteApi, rng, value) => {
                editor.selection.setRng(rng);
                editor.insertContent(value);
                autocompleteApi.hide();
            }
        });
    };

    const onSetupEditable = (editor) => (api) => {
        const nodeChanged = () => {
            api.setEnabled(editor.selection.isEditable());
        };
        editor.on('NodeChange', nodeChanged);
        nodeChanged();
        return () => {
            editor.off('NodeChange', nodeChanged);
        };
    };
    const register = (editor) => {
        const onAction = () => editor.execCommand('mceEmoticons');
        editor.ui.registry.addButton('emoticons', {
            tooltip: 'Emojis',
            icon: 'emoji',
            onAction,
            onSetup: onSetupEditable(editor)
        });
        editor.ui.registry.addMenuItem('emoticons', {
            text: 'Emojis...',
            icon: 'emoji',
            onAction,
            onSetup: onSetupEditable(editor)
        });
    };

    /**
     * This class contains all core logic for the emoticons plugin.
     *
     * @class tinymce.emoticons.Plugin
     * @private
     */
    var Plugin = () => {
        global$1.add('emoticons', (editor, pluginUrl) => {
            register$2(editor, pluginUrl);
            const databaseUrl = getEmojiDatabaseUrl(editor);
            const databaseId = getEmojiDatabaseId(editor);
            const database = initDatabase(editor, databaseUrl, databaseId);
            register$1(editor, database);
            register(editor);
            init(editor, database);
            setup(editor);
            return {
                getAllEmojis: () => database.waitForLoad().then(() => database.listAll())
            };
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
