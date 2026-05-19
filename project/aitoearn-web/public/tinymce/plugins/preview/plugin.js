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
    const identity = (x) => {
        return x;
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
    const contains$1 = (xs, x) => rawIndexOf(xs, x) > -1;
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
    const unique = (xs, comparator) => {
        const r = [];
        const isDuplicated = isFunction(comparator) ?
            (x) => exists(r, (i) => comparator(i, x)) :
            (x) => contains$1(r, x);
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (!isDuplicated(x)) {
                r.push(x);
            }
        }
        return r;
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
    const mapToArray = (obj, f) => {
        const r = [];
        each(obj, (value, name) => {
            r.push(f(value, name));
        });
        return r;
    };
    const values = (obj) => {
        return mapToArray(obj, identity);
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

    var global$2 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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

    const isMacOS = () => detect().os.isMacOS();
    const isiOS = () => detect().os.isiOS();

    const getPreventClicksOnLinksScript = () => {
        const isMacOSOrIOS = isMacOS() || isiOS();
        const fn = (isMacOSOrIOS) => {
            document.addEventListener('click', (e) => {
                for (let elm = e.target; elm; elm = elm.parentNode) {
                    if (elm.nodeName === 'A') {
                        const anchor = elm;
                        const href = anchor.getAttribute('href');
                        if (href && href.startsWith('#')) {
                            e.preventDefault();
                            const targetElement = document.getElementById(href.substring(1));
                            if (targetElement) {
                                targetElement.scrollIntoView({ behavior: 'smooth' });
                            }
                            return;
                        }
                        const isMetaKeyPressed = isMacOSOrIOS ? e.metaKey : e.ctrlKey && !e.altKey;
                        if (!isMetaKeyPressed) {
                            e.preventDefault();
                        }
                    }
                }
            }, false);
        };
        return `<script>(${fn.toString()})(${isMacOSOrIOS})</script>`;
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.dom.ScriptLoader');

    var global = tinymce.util.Tools.resolve('tinymce.util.Tools');

    const option = (name) => (editor) => editor.options.get(name);
    const getContentStyle = option('content_style');
    const shouldUseContentCssCors = option('content_css_cors');
    const getBodyClass = option('body_class');
    const getBodyId = option('body_id');

    const getComponentScriptsHtml = (editor) => {
        const urls = unique(values(editor.schema.getComponentUrls()));
        return map(urls, (url) => {
            const attrs = mapToArray(global$1.ScriptLoader.getScriptAttributes(url), (v, k) => ` ${editor.dom.encode(k)}="${editor.dom.encode(v)}"`);
            return `<script src="${editor.dom.encode(url)}"${attrs.join('')}></script>`;
        }).join('');
    };
    const getPreviewHtml = (editor, contentCssResources) => {
        let headHtml = '';
        const encode = editor.dom.encode;
        const contentStyle = getContentStyle(editor) ?? '';
        headHtml += `<base href="${encode(editor.documentBaseURI.getURI())}">`;
        const cors = shouldUseContentCssCors(editor) ? ' crossorigin="anonymous"' : '';
        global.each(contentCssResources, (resource) => {
            if (resource.type === 'bundled') {
                headHtml += '<style type="text/css">' + resource.content + '</style>';
            }
            else {
                headHtml += '<link type="text/css" rel="stylesheet" href="' + encode(resource.url) + '"' + cors + '>';
            }
        });
        if (contentStyle) {
            headHtml += '<style type="text/css">' + contentStyle + '</style>';
        }
        headHtml += getComponentScriptsHtml(editor);
        const bodyId = getBodyId(editor);
        const bodyClass = getBodyClass(editor);
        const directionality = editor.getBody().dir;
        const dirAttr = directionality ? ' dir="' + encode(directionality) + '"' : '';
        const previewHtml = ('<!DOCTYPE html>' +
            '<html>' +
            '<head>' +
            headHtml +
            '</head>' +
            '<body id="' + encode(bodyId) + '" class="mce-content-body ' + encode(bodyClass) + '"' + dirAttr + '>' +
            editor.getContent() +
            getPreventClicksOnLinksScript() +
            '</body>' +
            '</html>');
        return previewHtml;
    };

    const open = (editor, contentCssResources) => {
        const content = getPreviewHtml(editor, contentCssResources);
        const dataApi = editor.windowManager.open({
            title: 'Preview',
            size: 'large',
            body: {
                type: 'panel',
                items: [
                    {
                        name: 'preview',
                        type: 'iframe',
                        sandboxed: true,
                        transparent: false
                    }
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'close',
                    text: 'Close',
                    primary: true
                }
            ],
            initialData: {
                preview: content
            }
        });
        // Focus the close button, as by default the first element in the body is selected
        // which we don't want to happen here since the body only has the iframe content
        dataApi.focus('close');
    };

    const register$1 = (editor, getContentCssResources) => {
        editor.addCommand('mcePreview', () => {
            open(editor, getContentCssResources());
        });
    };

    const register = (editor) => {
        const onAction = () => editor.execCommand('mcePreview');
        editor.ui.registry.addButton('preview', {
            icon: 'preview',
            tooltip: 'Preview',
            onAction,
            context: 'any'
        });
        editor.ui.registry.addMenuItem('preview', {
            icon: 'preview',
            text: 'Preview',
            onAction,
            context: 'any'
        });
    };

    var Plugin = () => {
        global$2.add('preview', (editor) => {
            const getContentCssResources = () => map(editor.contentCSS, (key) => Optional.from(tinymce.Resource.get(key))
                .filter(isString)
                .map((content) => ({ type: 'bundled', content }))
                .getOr({ type: 'link', url: editor.documentBaseURI.toAbsolute(key) }));
            register$1(editor, getContentCssResources);
            register(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
