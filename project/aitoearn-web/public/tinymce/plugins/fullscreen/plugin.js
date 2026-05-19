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
    const eq$1 = (t) => (a) => t === a;
    const isString = isType$1('string');
    const isObject = isType$1('object');
    const isArray = isType$1('array');
    const isNull = eq$1(null);
    const isBoolean = isSimpleType('boolean');
    const isUndefined = eq$1(undefined);
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');
    const isNumber = isSimpleType('number');

    const noop = () => { };
    /** Compose a unary function with an n-ary function */
    const compose = (fa, fb) => {
        return (...args) => {
            return fa(fb.apply(null, args));
        };
    };
    /** Compose two unary functions. Similar to compose, but avoids using Function.prototype.apply. */
    const compose1 = (fbc, fab) => (a) => fbc(fab(a));
    const constant = (value) => {
        return () => {
            return value;
        };
    };
    function curry(fn, ...initialArgs) {
        return (...restArgs) => {
            const all = initialArgs.concat(restArgs);
            return fn.apply(null, all);
        };
    }
    const never = constant(false);
    const always = constant(true);

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

    const nativePush = Array.prototype.push;
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
    const filter$1 = (xs, pred) => {
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
    const find$1 = (xs, pred) => {
        return findUntil(xs, pred, never);
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
    const bind$3 = (xs, f) => flatten(map(xs, f));
    const get$5 = (xs, i) => i >= 0 && i < xs.length ? Optional.some(xs[i]) : Optional.none();
    const head = (xs) => get$5(xs, 0);
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

    /*
    Notes on the lift functions:
    - We used to have a generic liftN, but we were concerned about its type-safety, and the below variants were faster in microbenchmarks.
    - The getOrDie calls are partial functions, but are checked beforehand. This is faster and more convenient (but less safe) than folds.
    - && is used instead of a loop for simplicity and performance.
    */
    const lift2 = (oa, ob, f) => oa.isSome() && ob.isSome() ? Optional.some(f(oa.getOrDie(), ob.getOrDie())) : Optional.none();

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
    const unbindable = () => singleton((s) => s.unbind());
    const value = () => {
        const subject = singleton(noop);
        const on = (f) => subject.get().each(f);
        return {
            ...subject,
            on
        };
    };

    const contains = (str, substr, start = 0, end) => {
        const idx = str.indexOf(substr, start);
        if (idx !== -1) {
            return isUndefined(end) ? true : idx + substr.length <= end;
        }
        else {
            return false;
        }
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

    const cached = (f) => {
        let called = false;
        let r;
        return (...args) => {
            if (!called) {
                called = true;
                r = f.apply(null, args);
            }
            return r;
        };
    };

    var global$3 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const get$4 = (fullscreenState) => ({
        isFullscreen: () => fullscreenState.get() !== null
    });

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

    const DOCUMENT = 9;
    const DOCUMENT_FRAGMENT = 11;
    const ELEMENT = 1;
    const TEXT = 3;

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
    const bypassSelector = (dom) => 
    // Only elements, documents and shadow roots support querySelector
    // shadow root element type is DOCUMENT_FRAGMENT
    dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT && dom.nodeType !== DOCUMENT_FRAGMENT ||
        // IE fix for complex queries on empty nodes: http://jsfiddle.net/spyder/fv9ptr5L/
        dom.childElementCount === 0;
    const all$1 = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
    };

    const eq = (e1, e2) => e1.dom === e2.dom;

    const DeviceType = (os, browser, userAgent, mediaMatch) => {
        const isiPad = os.isiOS() && /ipad/i.test(userAgent) === true;
        const isiPhone = os.isiOS() && !isiPad;
        const isMobile = os.isiOS() || os.isAndroid();
        const isTouch = isMobile || mediaMatch('(pointer:coarse)');
        const isTablet = isiPad || !isiPhone && isMobile && mediaMatch('(min-device-width:768px)');
        const isPhone = isiPhone || isMobile && !isTablet;
        const iOSwebview = browser.isSafari() && os.isiOS() && /safari/i.test(userAgent) === false;
        const isDesktop = !isPhone && !isTablet && !iOSwebview;
        return {
            isiPad: constant(isiPad),
            isiPhone: constant(isiPhone),
            isTablet: constant(isTablet),
            isPhone: constant(isPhone),
            isTouch: constant(isTouch),
            isAndroid: os.isAndroid,
            isiOS: os.isiOS,
            isWebView: constant(iOSwebview),
            isDesktop: constant(isDesktop)
        };
    };

    const firstMatch = (regexes, s) => {
        for (let i = 0; i < regexes.length; i++) {
            const x = regexes[i];
            if (x.test(s)) {
                return x;
            }
        }
        return undefined;
    };
    const find = (regexes, agent) => {
        const r = firstMatch(regexes, agent);
        if (!r) {
            return { major: 0, minor: 0 };
        }
        const group = (i) => {
            return Number(agent.replace(r, '$' + i));
        };
        return nu$2(group(1), group(2));
    };
    const detect$3 = (versionRegexes, agent) => {
        const cleanedAgent = String(agent).toLowerCase();
        if (versionRegexes.length === 0) {
            return unknown$2();
        }
        return find(versionRegexes, cleanedAgent);
    };
    const unknown$2 = () => {
        return nu$2(0, 0);
    };
    const nu$2 = (major, minor) => {
        return { major, minor };
    };
    const Version = {
        nu: nu$2,
        detect: detect$3,
        unknown: unknown$2
    };

    const detectBrowser$1 = (browsers, userAgentData) => {
        return findMap(userAgentData.brands, (uaBrand) => {
            const lcBrand = uaBrand.brand.toLowerCase();
            return find$1(browsers, (browser) => lcBrand === browser.brand?.toLowerCase())
                .map((info) => ({
                current: info.name,
                version: Version.nu(parseInt(uaBrand.version, 10), 0)
            }));
        });
    };

    const detect$2 = (candidates, userAgent) => {
        const agent = String(userAgent).toLowerCase();
        return find$1(candidates, (candidate) => {
            return candidate.search(agent);
        });
    };
    // They (browser and os) are the same at the moment, but they might
    // not stay that way.
    const detectBrowser = (browsers, userAgent) => {
        return detect$2(browsers, userAgent).map((browser) => {
            const version = Version.detect(browser.versionRegexes, userAgent);
            return {
                current: browser.name,
                version
            };
        });
    };
    const detectOs = (oses, userAgent) => {
        return detect$2(oses, userAgent).map((os) => {
            const version = Version.detect(os.versionRegexes, userAgent);
            return {
                current: os.name,
                version
            };
        });
    };

    const normalVersionRegex = /.*?version\/\ ?([0-9]+)\.([0-9]+).*/;
    const checkContains = (target) => {
        return (uastring) => {
            return contains(uastring, target);
        };
    };
    const browsers = [
        // This is legacy Edge
        {
            name: 'Edge',
            versionRegexes: [/.*?edge\/ ?([0-9]+)\.([0-9]+)$/],
            search: (uastring) => {
                return contains(uastring, 'edge/') && contains(uastring, 'chrome') && contains(uastring, 'safari') && contains(uastring, 'applewebkit');
            }
        },
        // This is Google Chrome and Chromium Edge
        {
            name: 'Chromium',
            brand: 'Chromium',
            versionRegexes: [/.*?chrome\/([0-9]+)\.([0-9]+).*/, normalVersionRegex],
            search: (uastring) => {
                return contains(uastring, 'chrome') && !contains(uastring, 'chromeframe');
            }
        },
        {
            name: 'IE',
            versionRegexes: [/.*?msie\ ?([0-9]+)\.([0-9]+).*/, /.*?rv:([0-9]+)\.([0-9]+).*/],
            search: (uastring) => {
                return contains(uastring, 'msie') || contains(uastring, 'trident');
            }
        },
        // INVESTIGATE: Is this still the Opera user agent?
        {
            name: 'Opera',
            versionRegexes: [normalVersionRegex, /.*?opera\/([0-9]+)\.([0-9]+).*/],
            search: checkContains('opera')
        },
        {
            name: 'Firefox',
            versionRegexes: [/.*?firefox\/\ ?([0-9]+)\.([0-9]+).*/],
            search: checkContains('firefox')
        },
        {
            name: 'Safari',
            versionRegexes: [normalVersionRegex, /.*?cpu os ([0-9]+)_([0-9]+).*/],
            search: (uastring) => {
                return (contains(uastring, 'safari') || contains(uastring, 'mobile/')) && contains(uastring, 'applewebkit');
            }
        }
    ];
    const oses = [
        {
            name: 'Windows',
            search: checkContains('win'),
            versionRegexes: [/.*?windows\ nt\ ?([0-9]+)\.([0-9]+).*/]
        },
        {
            name: 'iOS',
            search: (uastring) => {
                return contains(uastring, 'iphone') || contains(uastring, 'ipad');
            },
            versionRegexes: [/.*?version\/\ ?([0-9]+)\.([0-9]+).*/, /.*cpu os ([0-9]+)_([0-9]+).*/, /.*cpu iphone os ([0-9]+)_([0-9]+).*/]
        },
        {
            name: 'Android',
            search: checkContains('android'),
            versionRegexes: [/.*?android\ ?([0-9]+)\.([0-9]+).*/]
        },
        {
            name: 'macOS',
            search: checkContains('mac os x'),
            versionRegexes: [/.*?mac\ os\ x\ ?([0-9]+)_([0-9]+).*/]
        },
        {
            name: 'Linux',
            search: checkContains('linux'),
            versionRegexes: []
        },
        { name: 'Solaris',
            search: checkContains('sunos'),
            versionRegexes: []
        },
        {
            name: 'FreeBSD',
            search: checkContains('freebsd'),
            versionRegexes: []
        },
        {
            name: 'ChromeOS',
            search: checkContains('cros'),
            versionRegexes: [/.*?chrome\/([0-9]+)\.([0-9]+).*/]
        }
    ];
    const PlatformInfo = {
        browsers: constant(browsers),
        oses: constant(oses)
    };

    const edge = 'Edge';
    const chromium = 'Chromium';
    const ie = 'IE';
    const opera = 'Opera';
    const firefox = 'Firefox';
    const safari = 'Safari';
    const unknown$1 = () => {
        return nu$1({
            current: undefined,
            version: Version.unknown()
        });
    };
    const nu$1 = (info) => {
        const current = info.current;
        const version = info.version;
        const isBrowser = (name) => () => current === name;
        return {
            current,
            version,
            isEdge: isBrowser(edge),
            isChromium: isBrowser(chromium),
            // NOTE: isIe just looks too weird
            isIE: isBrowser(ie),
            isOpera: isBrowser(opera),
            isFirefox: isBrowser(firefox),
            isSafari: isBrowser(safari)
        };
    };
    const Browser = {
        unknown: unknown$1,
        nu: nu$1,
        edge: constant(edge),
        chromium: constant(chromium),
        ie: constant(ie),
        opera: constant(opera),
        firefox: constant(firefox),
        safari: constant(safari)
    };

    const windows = 'Windows';
    const ios = 'iOS';
    const android = 'Android';
    const linux = 'Linux';
    const macos = 'macOS';
    const solaris = 'Solaris';
    const freebsd = 'FreeBSD';
    const chromeos = 'ChromeOS';
    // Though there is a bit of dupe with this and Browser, trying to
    // reuse code makes it much harder to follow and change.
    const unknown = () => {
        return nu({
            current: undefined,
            version: Version.unknown()
        });
    };
    const nu = (info) => {
        const current = info.current;
        const version = info.version;
        const isOS = (name) => () => current === name;
        return {
            current,
            version,
            isWindows: isOS(windows),
            // TODO: Fix capitalisation
            isiOS: isOS(ios),
            isAndroid: isOS(android),
            isMacOS: isOS(macos),
            isLinux: isOS(linux),
            isSolaris: isOS(solaris),
            isFreeBSD: isOS(freebsd),
            isChromeOS: isOS(chromeos)
        };
    };
    const OperatingSystem = {
        unknown,
        nu,
        windows: constant(windows),
        ios: constant(ios),
        android: constant(android),
        linux: constant(linux),
        macos: constant(macos),
        solaris: constant(solaris),
        freebsd: constant(freebsd),
        chromeos: constant(chromeos)
    };

    const detect$1 = (userAgent, userAgentDataOpt, mediaMatch) => {
        const browsers = PlatformInfo.browsers();
        const oses = PlatformInfo.oses();
        const browser = userAgentDataOpt.bind((userAgentData) => detectBrowser$1(browsers, userAgentData))
            .orThunk(() => detectBrowser(browsers, userAgent))
            .fold(Browser.unknown, Browser.nu);
        const os = detectOs(oses, userAgent).fold(OperatingSystem.unknown, OperatingSystem.nu);
        const deviceType = DeviceType(os, browser, userAgent, mediaMatch);
        return {
            browser,
            os,
            deviceType
        };
    };
    const PlatformDetection = {
        detect: detect$1
    };

    const mediaMatch = (query) => window.matchMedia(query).matches;
    // IMPORTANT: Must be in a thunk, otherwise rollup thinks calling this immediately
    // causes side effects and won't tree shake this away
    // Note: navigator.userAgentData is not part of the native typescript types yet
    let platform = cached(() => PlatformDetection.detect(window.navigator.userAgent, Optional.from((window.navigator.userAgentData)), mediaMatch));
    const detect = () => platform();

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
    const isType = (t) => (element) => type(element) === t;
    const isHTMLElement = (element) => isElement(element) && isPrototypeOf(element.dom);
    const isElement = isType(ELEMENT);
    const isText = isType(TEXT);
    const isDocumentFragment = isType(DOCUMENT_FRAGMENT);

    /**
     * The document associated with the current element
     * NOTE: this will throw if the owner is null.
     */
    const owner = (element) => SugarElement.fromDom(element.dom.ownerDocument);
    const parent = (element) => Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
    const parents = (element, isRoot) => {
        const stop = isFunction(isRoot) ? isRoot : never;
        // This is used a *lot* so it needs to be performant, not recursive
        let dom = element.dom;
        const ret = [];
        while (dom.parentNode !== null && dom.parentNode !== undefined) {
            const rawParent = dom.parentNode;
            const p = SugarElement.fromDom(rawParent);
            ret.push(p);
            if (stop(p) === true) {
                break;
            }
            else {
                dom = rawParent;
            }
        }
        return ret;
    };
    const siblings$2 = (element) => {
        // TODO: Refactor out children so we can just not add self instead of filtering afterwards
        const filterSelf = (elements) => filter$1(elements, (x) => !eq(element, x));
        return parent(element).map(children).map(filterSelf).getOr([]);
    };
    const nextSibling = (element) => Optional.from(element.dom.nextSibling).map(SugarElement.fromDom);
    const children = (element) => map(element.dom.childNodes, SugarElement.fromDom);

    /**
     * Is the element a ShadowRoot?
     *
     * Note: this is insufficient to test if any element is a shadow root, but it is sufficient to differentiate between
     * a Document and a ShadowRoot.
     */
    const isShadowRoot = (dos) => isDocumentFragment(dos) && isNonNullable(dos.dom.host);
    const getRootNode = (e) => SugarElement.fromDom(e.dom.getRootNode());
    /** If this element is in a ShadowRoot, return it. */
    const getShadowRoot = (e) => {
        const r = getRootNode(e);
        return isShadowRoot(r) ? Optional.some(r) : Optional.none();
    };
    /** Return the host of a ShadowRoot.
     *
     * This function will throw if Shadow DOM is unsupported in the browser, or if the host is null.
     * If you actually have a ShadowRoot, this shouldn't happen.
     */
    const getShadowHost = (e) => SugarElement.fromDom(e.dom.host);
    /**
     * When Events bubble up through a ShadowRoot, the browser changes the target to be the shadow host.
     * This function gets the "original" event target if possible.
     * This only works if the shadow tree is open - if the shadow tree is closed, event.target is returned.
     * See: https://developers.google.com/web/fundamentals/web-components/shadowdom#events
     */
    const getOriginalEventTarget = (event) => {
        if (isNonNullable(event.target)) {
            const el = SugarElement.fromDom(event.target);
            if (isElement(el) && isOpenShadowHost(el)) {
                // When target element is inside Shadow DOM we need to take first element from composedPath
                // otherwise we'll get Shadow Root parent, not actual target element.
                if (event.composed && event.composedPath) {
                    const composedPath = event.composedPath();
                    if (composedPath) {
                        return head(composedPath);
                    }
                }
            }
        }
        return Optional.from(event.target);
    };
    /** Return true if the element is a host of an open shadow root.
     *  Return false if the element is a host of a closed shadow root, or if the element is not a host.
     */
    const isOpenShadowHost = (element) => isNonNullable(element.dom.shadowRoot);

    const mkEvent = (target, x, y, stop, prevent, kill, raw) => ({
        target,
        x,
        y,
        stop,
        prevent,
        kill,
        raw
    });
    /** Wraps an Event in an EventArgs structure.
     * The returned EventArgs structure has its target set to the "original" target if possible.
     * See SugarShadowDom.getOriginalEventTarget
     */
    const fromRawEvent = (rawEvent) => {
        const target = SugarElement.fromDom(getOriginalEventTarget(rawEvent).getOr(rawEvent.target));
        const stop = () => rawEvent.stopPropagation();
        const prevent = () => rawEvent.preventDefault();
        const kill = compose(prevent, stop); // more of a sequence than a compose, but same effect
        // FIX: Don't just expose the raw event. Need to identify what needs standardisation.
        return mkEvent(target, rawEvent.clientX, rawEvent.clientY, stop, prevent, kill, rawEvent);
    };
    const handle = (filter, handler) => (rawEvent) => {
        if (filter(rawEvent)) {
            handler(fromRawEvent(rawEvent));
        }
    };
    const binder = (element, event, filter, handler, useCapture) => {
        const wrapped = handle(filter, handler);
        // IE9 minimum
        element.dom.addEventListener(event, wrapped, useCapture);
        return {
            unbind: curry(unbind, element, event, wrapped, useCapture)
        };
    };
    const bind$2 = (element, event, filter, handler) => binder(element, event, filter, handler, false);
    const unbind = (element, event, handler, useCapture) => {
        // IE9 minimum
        element.dom.removeEventListener(event, handler, useCapture);
    };

    const filter = always; // no filter on plain DomEvents
    const bind$1 = (element, event, handler) => bind$2(element, event, filter, handler);

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
    const set$1 = (element, key, value) => {
        rawSet(element.dom, key, value);
    };
    const get$3 = (element, key) => {
        const v = element.dom.getAttribute(key);
        // undefined is the more appropriate value for JS, and this matches JQuery
        return v === null ? undefined : v;
    };
    const remove = (element, key) => {
        element.dom.removeAttribute(key);
    };

    // some elements, such as mathml, don't have style attributes
    // others, such as angular elements, have style attributes that aren't a CSSStyleDeclaration
    const isSupported = (dom) => dom.style !== undefined && isFunction(dom.style.getPropertyValue);

    // Node.contains() is very, very, very good performance
    // http://jsperf.com/closest-vs-contains/5
    const inBody = (element) => {
        // Technically this is only required on IE, where contains() returns false for text nodes.
        // But it's cheap enough to run everywhere and Sugar doesn't have platform detection (yet).
        const dom = isText(element) ? element.dom.parentNode : element.dom;
        // use ownerDocument.body to ensure this works inside iframes.
        // Normally contains is bad because an element "contains" itself, but here we want that.
        if (dom === undefined || dom === null || dom.ownerDocument === null) {
            return false;
        }
        const doc = dom.ownerDocument;
        return getShadowRoot(SugarElement.fromDom(dom)).fold(() => doc.body.contains(dom), compose1(inBody, getShadowHost));
    };
    const getBody = (doc) => {
        const b = doc.dom.body;
        if (b === null || b === undefined) {
            throw new Error('Body is not available yet');
        }
        return SugarElement.fromDom(b);
    };

    const internalSet = (dom, property, value) => {
        // This is going to hurt. Apologies.
        // JQuery coerces numbers to pixels for certain property names, and other times lets numbers through.
        // we're going to be explicit; strings only.
        if (!isString(value)) {
            // eslint-disable-next-line no-console
            console.error('Invalid call to CSS.set. Property ', property, ':: Value ', value, ':: Element ', dom);
            throw new Error('CSS value must be a string: ' + value);
        }
        // removed: support for dom().style[property] where prop is camel case instead of normal property name
        if (isSupported(dom)) {
            dom.style.setProperty(property, value);
        }
    };
    const set = (element, property, value) => {
        const dom = element.dom;
        internalSet(dom, property, value);
    };
    const setAll = (element, css) => {
        const dom = element.dom;
        each(css, (v, k) => {
            internalSet(dom, k, v);
        });
    };
    /*
     * NOTE: For certain properties, this returns the "used value" which is subtly different to the "computed value" (despite calling getComputedStyle).
     * Blame CSS 2.0.
     *
     * https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
     */
    const get$2 = (element, property) => {
        const dom = element.dom;
        /*
         * IE9 and above per
         * https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle
         *
         * Not in numerosity, because it doesn't memoize and looking this up dynamically in performance critical code would be horrendous.
         *
         * JQuery has some magic here for IE popups, but we don't really need that.
         * It also uses element.ownerDocument.defaultView to handle iframes but that hasn't been required since FF 3.6.
         */
        const styles = window.getComputedStyle(dom);
        const r = styles.getPropertyValue(property);
        // jquery-ism: If r is an empty string, check that the element is not in a document. If it isn't, return the raw value.
        // Turns out we do this a lot.
        return (r === '' && !inBody(element)) ? getUnsafeProperty(dom, property) : r;
    };
    // removed: support for dom().style[property] where prop is camel case instead of normal property name
    // empty string is what the browsers (IE11 and Chrome) return when the propertyValue doesn't exists.
    const getUnsafeProperty = (dom, property) => isSupported(dom) ? dom.style.getPropertyValue(property) : '';

    const r = (left, top) => {
        const translate = (x, y) => r(left + x, top + y);
        return {
            left,
            top,
            translate
        };
    };
    // tslint:disable-next-line:variable-name
    const SugarPosition = r;

    // get scroll position (x,y) relative to document _doc (or global if not supplied)
    const get$1 = (_DOC) => {
        const doc = _DOC !== undefined ? _DOC.dom : document;
        // ASSUMPTION: This is for cross-browser support, body works for Safari & EDGE, and when we have an iframe body scroller
        const x = doc.body.scrollLeft || doc.documentElement.scrollLeft;
        const y = doc.body.scrollTop || doc.documentElement.scrollTop;
        return SugarPosition(x, y);
    };

    // IE11 Can return undefined for a classList on elements such as math, so we make sure it's not undefined before attempting to use it.
    const supports = (element) => element.dom.classList !== undefined;

    const has = (element, clazz) => supports(element) && element.dom.classList.contains(clazz);

    const ancestors$1 = (scope, predicate, isRoot) => filter$1(parents(scope, isRoot), predicate);
    const siblings$1 = (scope, predicate) => filter$1(siblings$2(scope), predicate);

    const all = (selector) => all$1(selector);
    // For all of the following:
    //
    // jQuery does siblings of firstChild. IE9+ supports scope.dom.children (similar to Traverse.children but elements only).
    // Traverse should also do this (but probably not by default).
    //
    const ancestors = (scope, selector, isRoot) => 
    // It may surprise you to learn this is exactly what JQuery does
    // TODO: Avoid all this wrapping and unwrapping
    ancestors$1(scope, (e) => is(e, selector), isRoot);
    const siblings = (scope, selector) => 
    // It may surprise you to learn this is exactly what JQuery does
    // TODO: Avoid all the wrapping and unwrapping
    siblings$1(scope, (e) => is(e, selector));

    const get = (_win) => {
        const win = _win === undefined ? window : _win;
        if (detect().browser.isFirefox()) {
            // TINY-7984: Firefox 91 is returning incorrect values for visualViewport.pageTop, so disable it for now
            return Optional.none();
        }
        else {
            return Optional.from(win.visualViewport);
        }
    };
    const bounds = (x, y, width, height) => ({
        x,
        y,
        width,
        height,
        right: x + width,
        bottom: y + height
    });
    const getBounds = (_win) => {
        const win = _win === undefined ? window : _win;
        const doc = win.document;
        const scroll = get$1(SugarElement.fromDom(doc));
        return get(win).fold(() => {
            const html = win.document.documentElement;
            // Don't use window.innerWidth/innerHeight here, as we don't want to include scrollbars
            // since the right/bottom position is based on the edge of the scrollbar not the window
            const width = html.clientWidth;
            const height = html.clientHeight;
            return bounds(scroll.left, scroll.top, width, height);
        }, (visualViewport) => 
        // iOS doesn't update the pageTop/pageLeft when element.scrollIntoView() is called, so we need to fallback to the
        // scroll position which will always be less than the page top/left values when page top/left are accurate/correct.
        bounds(Math.max(visualViewport.pageLeft, scroll.left), Math.max(visualViewport.pageTop, scroll.top), visualViewport.width, visualViewport.height));
    };
    const bind = (name, callback, _win) => get(_win).map((visualViewport) => {
        const handler = (e) => callback(fromRawEvent(e));
        visualViewport.addEventListener(name, handler);
        return {
            unbind: () => visualViewport.removeEventListener(name, handler)
        };
    }).getOrThunk(() => ({
        unbind: noop
    }));

    var global$2 = tinymce.util.Tools.resolve('tinymce.dom.DOMUtils');

    var global$1 = tinymce.util.Tools.resolve('tinymce.Env');

    const fireFullscreenStateChanged = (editor, state) => {
        editor.dispatch('FullscreenStateChanged', { state });
        editor.dispatch('ResizeEditor');
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$2 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('fullscreen_native', {
            processor: 'boolean',
            default: false
        });
    };
    const getFullscreenNative = option('fullscreen_native');

    const getFullscreenRoot = (editor) => {
        const elem = SugarElement.fromDom(editor.getElement());
        return getShadowRoot(elem).map(getShadowHost)
            .getOrThunk(() => getBody(owner(elem)));
    };
    const getFullscreenElement = (root) => {
        if (root.fullscreenElement !== undefined) {
            return root.fullscreenElement;
        }
        else if (root.msFullscreenElement !== undefined) {
            return root.msFullscreenElement;
        }
        else if (root.webkitFullscreenElement !== undefined) {
            return root.webkitFullscreenElement;
        }
        else {
            return null;
        }
    };
    const getFullscreenchangeEventName = () => {
        if (document.fullscreenElement !== undefined) {
            return 'fullscreenchange';
        }
        else if (document.msFullscreenElement !== undefined) {
            return 'MSFullscreenChange'; // warning, seems to be case sensitive
        }
        else if (document.webkitFullscreenElement !== undefined) {
            return 'webkitfullscreenchange';
        }
        else {
            return 'fullscreenchange';
        }
    };
    const requestFullscreen = (sugarElem) => {
        const elem = sugarElem.dom;
        if (elem.requestFullscreen) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            elem.requestFullscreen();
        }
        else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        else if (elem.webkitRequestFullScreen) {
            elem.webkitRequestFullScreen();
        }
    };
    const exitFullscreen = (sugarDoc) => {
        const doc = sugarDoc.dom;
        if (doc.exitFullscreen) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            doc.exitFullscreen();
        }
        else if (doc.msExitFullscreen) {
            doc.msExitFullscreen();
        }
        else if (doc.webkitCancelFullScreen) {
            doc.webkitCancelFullScreen();
        }
    };
    const isFullscreenElement = (elem) => elem.dom === getFullscreenElement(owner(elem).dom);

    const attr = 'data-ephox-mobile-fullscreen-style';
    const siblingStyles = 'display:none!important;';
    const ancestorPosition = 'position:absolute!important;';
    // TINY-3407 ancestors need 'height:100%!important;overflow:visible!important;' to prevent collapsed ancestors hiding the editor
    const ancestorStyles = 'top:0!important;left:0!important;margin:0!important;padding:0!important;width:100%!important;height:100%!important;overflow:visible!important;';
    const bgFallback = 'background-color:rgb(255,255,255)!important;';
    const isAndroid = global$1.os.isAndroid();
    const matchColor = (editorBody) => {
        // in iOS you can overscroll, sometimes when you overscroll you can reveal the bgcolor of an element beneath,
        // by matching the bg color and clobbering ensures any reveals are 'camouflaged' the same color
        const color = get$2(editorBody, 'background-color');
        return (color !== undefined && color !== '') ? 'background-color:' + color + '!important' : bgFallback;
    };
    // We clobber all tags, direct ancestors to the editorBody get ancestorStyles, everything else gets siblingStyles
    const clobberStyles = (dom, container, editorBody) => {
        const gatherSiblings = (element) => {
            return siblings(element, '*:not(.tox-silver-sink)');
        };
        const clobber = (clobberStyle) => (element) => {
            const styles = get$3(element, 'style');
            const backup = styles === undefined ? 'no-styles' : styles.trim();
            if (backup === clobberStyle) {
                return;
            }
            else {
                set$1(element, attr, backup);
                setAll(element, dom.parseStyle(clobberStyle));
            }
        };
        const ancestors$1 = ancestors(container, '*');
        const siblings$1 = bind$3(ancestors$1, gatherSiblings);
        const bgColor = matchColor(editorBody);
        /* NOTE: This assumes that container has no siblings itself */
        each$1(siblings$1, clobber(siblingStyles));
        each$1(ancestors$1, clobber(ancestorPosition + ancestorStyles + bgColor));
        // position absolute on the outer-container breaks Android flex layout
        const containerStyles = isAndroid === true ? '' : ancestorPosition;
        clobber(containerStyles + ancestorStyles + bgColor)(container);
    };
    const restoreStyles = (dom) => {
        const clobberedEls = all('[' + attr + ']');
        each$1(clobberedEls, (element) => {
            const restore = get$3(element, attr);
            if (restore && restore !== 'no-styles') {
                setAll(element, dom.parseStyle(restore));
            }
            else {
                remove(element, 'style');
            }
            remove(element, attr);
        });
    };

    const DOM = global$2.DOM;
    const getScrollPos = () => getBounds(window);
    const setScrollPos = (pos) => window.scrollTo(pos.x, pos.y);
    const viewportUpdate = get().fold(() => ({ bind: noop, unbind: noop }), (visualViewport) => {
        const editorContainer = value();
        const resizeBinder = unbindable();
        const scrollBinder = unbindable();
        const refreshScroll = () => {
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
        };
        const refreshVisualViewport = () => {
            window.requestAnimationFrame(() => {
                editorContainer.on((container) => setAll(container, {
                    top: visualViewport.offsetTop + 'px',
                    left: visualViewport.offsetLeft + 'px',
                    height: visualViewport.height + 'px',
                    width: visualViewport.width + 'px'
                }));
            });
        };
        const update = first(() => {
            refreshScroll();
            refreshVisualViewport();
        }, 50);
        const bind$1 = (element) => {
            editorContainer.set(element);
            update.throttle();
            resizeBinder.set(bind('resize', update.throttle));
            scrollBinder.set(bind('scroll', update.throttle));
        };
        const unbind = () => {
            editorContainer.on(() => {
                resizeBinder.clear();
                scrollBinder.clear();
            });
            editorContainer.clear();
        };
        return {
            bind: bind$1,
            unbind
        };
    });
    const toggleFullscreen = (editor, fullscreenState) => {
        const body = document.body;
        const documentElement = document.documentElement;
        const editorContainer = editor.getContainer();
        const editorContainerS = SugarElement.fromDom(editorContainer);
        const sinkContainerS = nextSibling(editorContainerS)
            .filter((elm) => isHTMLElement(elm) && has(elm, 'tox-silver-sink'));
        const fullscreenRoot = getFullscreenRoot(editor);
        const fullscreenInfo = fullscreenState.get();
        const editorBody = SugarElement.fromDom(editor.getBody());
        const isTouch = global$1.deviceType.isTouch();
        const editorContainerStyle = editorContainer.style;
        const iframe = editor.iframeElement;
        const iframeStyle = iframe?.style;
        const handleClasses = (handler) => {
            handler(body, 'tox-fullscreen');
            handler(documentElement, 'tox-fullscreen');
            handler(editorContainer, 'tox-fullscreen');
            getShadowRoot(editorContainerS)
                .map((root) => getShadowHost(root).dom)
                .each((host) => {
                handler(host, 'tox-fullscreen');
                handler(host, 'tox-shadowhost');
            });
        };
        const cleanup = () => {
            if (isTouch) {
                restoreStyles(editor.dom);
            }
            handleClasses(DOM.removeClass);
            viewportUpdate.unbind();
            Optional.from(fullscreenState.get()).each((info) => info.fullscreenChangeHandler.unbind());
        };
        if (!fullscreenInfo) {
            const fullscreenChangeHandler = bind$1(owner(fullscreenRoot), getFullscreenchangeEventName(), (_evt) => {
                if (getFullscreenNative(editor)) {
                    // if we have exited browser fullscreen with Escape then exit editor fullscreen too
                    if (!isFullscreenElement(fullscreenRoot) && fullscreenState.get() !== null) {
                        toggleFullscreen(editor, fullscreenState);
                    }
                }
            });
            const newFullScreenInfo = {
                scrollPos: getScrollPos(),
                containerWidth: editorContainerStyle.width,
                containerHeight: editorContainerStyle.height,
                containerTop: editorContainerStyle.top,
                containerLeft: editorContainerStyle.left,
                iframeWidth: iframeStyle.width,
                iframeHeight: iframeStyle.height,
                fullscreenChangeHandler,
                sinkCssPosition: sinkContainerS.map((elm) => get$2(elm, 'position'))
            };
            if (isTouch) {
                clobberStyles(editor.dom, editorContainerS, editorBody);
            }
            iframeStyle.width = iframeStyle.height = '100%';
            editorContainerStyle.width = editorContainerStyle.height = '';
            handleClasses(DOM.addClass);
            sinkContainerS.each((elm) => {
                set(elm, 'position', 'fixed');
            });
            viewportUpdate.bind(editorContainerS);
            editor.on('remove', cleanup);
            fullscreenState.set(newFullScreenInfo);
            if (getFullscreenNative(editor)) {
                requestFullscreen(fullscreenRoot);
            }
            fireFullscreenStateChanged(editor, true);
        }
        else {
            fullscreenInfo.fullscreenChangeHandler.unbind();
            if (getFullscreenNative(editor) && isFullscreenElement(fullscreenRoot)) {
                exitFullscreen(owner(fullscreenRoot));
            }
            iframeStyle.width = fullscreenInfo.iframeWidth;
            iframeStyle.height = fullscreenInfo.iframeHeight;
            editorContainerStyle.width = fullscreenInfo.containerWidth;
            editorContainerStyle.height = fullscreenInfo.containerHeight;
            editorContainerStyle.top = fullscreenInfo.containerTop;
            editorContainerStyle.left = fullscreenInfo.containerLeft;
            lift2(sinkContainerS, fullscreenInfo.sinkCssPosition, (elm, val) => {
                set(elm, 'position', val);
            });
            cleanup();
            setScrollPos(fullscreenInfo.scrollPos);
            fullscreenState.set(null);
            fireFullscreenStateChanged(editor, false);
            editor.off('remove', cleanup);
        }
    };

    const register$1 = (editor, fullscreenState) => {
        editor.addCommand('mceFullScreen', () => {
            toggleFullscreen(editor, fullscreenState);
        });
    };

    var global = tinymce.util.Tools.resolve('tinymce.util.VK');

    const setup = (editor, fullscreenState) => {
        editor.on('init', () => {
            editor.on('keydown', (e) => {
                if (e.keyCode === global.TAB && !(e.metaKey || e.ctrlKey) && fullscreenState.get()) {
                    e.preventDefault();
                }
            });
        });
    };

    const makeSetupHandler = (editor, fullscreenState) => (api) => {
        api.setActive(fullscreenState.get() !== null);
        const editorEventCallback = (e) => api.setActive(e.state);
        editor.on('FullscreenStateChanged', editorEventCallback);
        return () => editor.off('FullscreenStateChanged', editorEventCallback);
    };
    const register = (editor, fullscreenState) => {
        const onAction = () => editor.execCommand('mceFullScreen');
        editor.ui.registry.addToggleMenuItem('fullscreen', {
            text: 'Fullscreen',
            icon: 'fullscreen',
            shortcut: 'Meta+Shift+F',
            onAction,
            onSetup: makeSetupHandler(editor, fullscreenState),
            context: 'any'
        });
        editor.ui.registry.addToggleButton('fullscreen', {
            tooltip: 'Fullscreen',
            icon: 'fullscreen',
            onAction,
            onSetup: makeSetupHandler(editor, fullscreenState),
            shortcut: 'Meta+Shift+F',
            context: 'any'
        });
    };

    var Plugin = () => {
        global$3.add('fullscreen', (editor) => {
            const fullscreenState = Cell(null);
            if (editor.inline) {
                return get$4(fullscreenState);
            }
            register$2(editor);
            register$1(editor, fullscreenState);
            register(editor, fullscreenState);
            setup(editor, fullscreenState);
            editor.addShortcut('Meta+Shift+F', '', 'mceFullScreen');
            return get$4(fullscreenState);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
