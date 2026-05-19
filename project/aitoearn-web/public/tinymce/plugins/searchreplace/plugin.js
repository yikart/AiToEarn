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
    const isString = isType$1('string');
    const isArray = isType$1('array');
    const isBoolean = isSimpleType('boolean');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isNumber = isSimpleType('number');

    const noop = () => { };
    const constant = (value) => {
        return () => {
            return value;
        };
    };
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

    const nativeSlice = Array.prototype.slice;
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
    const each = (xs, f) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            f(x, i);
        }
    };
    const eachr = (xs, f) => {
        for (let i = xs.length - 1; i >= 0; i--) {
            const x = xs[i];
            f(x, i);
        }
    };
    /*
     * Groups an array into contiguous arrays of like elements. Whether an element is like or not depends on f.
     *
     * f is a function that derives a value from an element - e.g. true or false, or a string.
     * Elements are like if this function generates the same value for them (according to ===).
     *
     *
     * Order of the elements is preserved. Arr.flatten() on the result will return the original list, as with Haskell groupBy function.
     *  For a good explanation, see the group function (which is a special case of groupBy)
     *  http://hackage.haskell.org/package/base-4.7.0.0/docs/Data-List.html#v:group
     */
    const groupBy = (xs, f) => {
        if (xs.length === 0) {
            return [];
        }
        else {
            let wasType = f(xs[0]); // initial case for matching
            const r = [];
            let group = [];
            for (let i = 0, len = xs.length; i < len; i++) {
                const x = xs[i];
                const type = f(x);
                if (type !== wasType) {
                    r.push(group);
                    group = [];
                }
                wasType = type;
                group.push(x);
            }
            if (group.length !== 0) {
                r.push(group);
            }
            return r;
        }
    };
    const foldl = (xs, f, acc) => {
        each(xs, (x, i) => {
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
    const sort = (xs, comparator) => {
        const copy = nativeSlice.call(xs, 0);
        copy.sort(comparator);
        return copy;
    };

    const hasOwnProperty = Object.hasOwnProperty;
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

    var global$3 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    /* eslint-disable max-len */
    const punctuationStr = `[~№|!-*+-\\/:;?@\\[-\`{}\u00A1\u00AB\u00B7\u00BB\u00BF;\u00B7\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1361-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u3008\u3009\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30\u2E31\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]`;

    const punctuation$1 = constant(punctuationStr);

    // tslint:disable-next-line:variable-name
    const Custom = (regex, prefix, suffix, flags) => {
        const term = () => {
            return new RegExp(regex, flags.getOr('g'));
        };
        return {
            term,
            prefix,
            suffix
        };
    };

    Custom;
    const punctuation = punctuation$1;

    var global$2 = tinymce.util.Tools.resolve('tinymce.Env');

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');

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

    const bypassSelector = (dom) => 
    // Only elements, documents and shadow roots support querySelector
    // shadow root element type is DOCUMENT_FRAGMENT
    dom.nodeType !== ELEMENT && dom.nodeType !== DOCUMENT && dom.nodeType !== DOCUMENT_FRAGMENT ||
        // IE fix for complex queries on empty nodes: http://jsfiddle.net/spyder/fv9ptr5L/
        dom.childElementCount === 0;
    const all = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
    };

    /*
     * Most of sand doesn't alter the methods on the object.
     * We're making an exception for Node, because bitwise and is so easy to get wrong.
     *
     * Might be nice to ADT this at some point instead of having individual methods.
     */
    const compareDocumentPosition = (a, b, match) => {
        // Returns: 0 if e1 and e2 are the same node, or a bitmask comparing the positions
        // of nodes e1 and e2 in their documents. See the URL below for bitmask interpretation
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition
        // eslint-disable-next-line no-bitwise
        return (a.compareDocumentPosition(b) & match) !== 0;
    };
    const documentPositionPreceding = (a, b) => {
        return compareDocumentPosition(a, b, Node.DOCUMENT_POSITION_PRECEDING);
    };

    const type = (element) => element.dom.nodeType;
    const isType = (t) => (element) => type(element) === t;
    const isText$1 = isType(TEXT);

    const parent = (element) => Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
    const children = (element) => map(element.dom.childNodes, SugarElement.fromDom);
    const spot = (element, offset) => ({
        element,
        offset
    });
    const leaf = (element, offset) => {
        const cs = children(element);
        return cs.length > 0 && offset < cs.length ? spot(cs[offset], 0) : spot(element, offset);
    };

    const before = (marker, element) => {
        const parent$1 = parent(marker);
        parent$1.each((v) => {
            v.dom.insertBefore(element.dom, marker.dom);
        });
    };
    const append = (parent, element) => {
        parent.dom.appendChild(element.dom);
    };
    const wrap = (element, wrapper) => {
        before(element, wrapper);
        append(wrapper, element);
    };

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

    const NodeValue = (is, name) => {
        const get = (element) => {
            if (!is(element)) {
                throw new Error('Can only get ' + name + ' value of a ' + name + ' node');
            }
            return getOption(element).getOr('');
        };
        const getOption = (element) => is(element) ? Optional.from(element.dom.nodeValue) : Optional.none();
        const set = (element, value) => {
            if (!is(element)) {
                throw new Error('Can only set raw ' + name + ' value of a ' + name + ' node');
            }
            element.dom.nodeValue = value;
        };
        return {
            get,
            getOption,
            set
        };
    };

    const api = NodeValue(isText$1, 'text');
    const get$1 = (element) => api.get(element);

    const descendants = (scope, selector) => all(selector, scope);

    var global = tinymce.util.Tools.resolve('tinymce.dom.TreeWalker');

    const isSimpleBoundary = (dom, node) => dom.isBlock(node) || has(dom.schema.getVoidElements(), node.nodeName);
    const isContentEditableFalse = (dom, node) => !dom.isEditable(node);
    const isContentEditableTrueInCef = (dom, node) => dom.getContentEditable(node) === 'true' && node.parentNode && !dom.isEditable(node.parentNode);
    const isHidden = (dom, node) => !dom.isBlock(node) && has(dom.schema.getWhitespaceElements(), node.nodeName);
    const isBoundary = (dom, node) => isSimpleBoundary(dom, node) || isContentEditableFalse(dom, node) || isHidden(dom, node) || isContentEditableTrueInCef(dom, node);
    const isText = (node) => node.nodeType === 3;
    const nuSection = () => ({
        sOffset: 0,
        fOffset: 0,
        elements: []
    });
    const toLeaf = (node, offset) => leaf(SugarElement.fromDom(node), offset);
    const walk = (dom, walkerFn, startNode, callbacks, endNode, skipStart = true) => {
        let next = skipStart ? walkerFn(false) : startNode;
        while (next) {
            // Walk over content editable or hidden elements
            const isCefNode = isContentEditableFalse(dom, next);
            if (isCefNode || isHidden(dom, next)) {
                const stopWalking = isCefNode ? callbacks.cef(next) : callbacks.boundary(next);
                if (stopWalking) {
                    break;
                }
                else {
                    next = walkerFn(true);
                    continue;
                }
            }
            else if (isSimpleBoundary(dom, next)) {
                if (callbacks.boundary(next)) {
                    break;
                }
            }
            else if (isText(next)) {
                callbacks.text(next);
            }
            if (next === endNode) {
                break;
            }
            else {
                next = walkerFn(false);
            }
        }
    };
    const collectTextToBoundary = (dom, section, node, rootNode, forwards) => {
        // Don't bother collecting text nodes if we're already at a boundary
        if (isBoundary(dom, node)) {
            return;
        }
        const rootBlock = dom.getParent(rootNode, dom.isBlock) ?? dom.getRoot();
        const walker = new global(node, rootBlock);
        const walkerFn = forwards ? walker.next.bind(walker) : walker.prev.bind(walker);
        // Walk over and add text nodes to the section and increase the offsets
        // so we know to ignore the additional text when matching
        walk(dom, walkerFn, node, {
            boundary: always,
            cef: always,
            text: (next) => {
                if (forwards) {
                    section.fOffset += next.length;
                }
                else {
                    section.sOffset += next.length;
                }
                section.elements.push(SugarElement.fromDom(next));
            }
        });
    };
    const collect = (dom, rootNode, startNode, endNode, callbacks, skipStart = true) => {
        const walker = new global(startNode, rootNode);
        const sections = [];
        let current = nuSection();
        // Find any text between the start node and the closest boundary
        collectTextToBoundary(dom, current, startNode, rootNode, false);
        const finishSection = () => {
            if (current.elements.length > 0) {
                sections.push(current);
                current = nuSection();
            }
            return false;
        };
        // Collect all the text nodes in the specified range and create sections from the
        // boundaries within the range
        walk(dom, walker.next.bind(walker), startNode, {
            boundary: finishSection,
            cef: (node) => {
                finishSection();
                // Collect additional nested contenteditable true content
                if (callbacks) {
                    sections.push(...callbacks.cef(node));
                }
                return false;
            },
            text: (next) => {
                current.elements.push(SugarElement.fromDom(next));
                if (callbacks) {
                    callbacks.text(next, current);
                }
            }
        }, endNode, skipStart);
        // Find any text between the end node and the closest boundary, then finalise the section
        if (endNode) {
            collectTextToBoundary(dom, current, endNode, rootNode, true);
        }
        finishSection();
        return sections;
    };
    const collectRangeSections = (dom, rng) => {
        const start = toLeaf(rng.startContainer, rng.startOffset);
        const startNode = start.element.dom;
        const end = toLeaf(rng.endContainer, rng.endOffset);
        const endNode = end.element.dom;
        return collect(dom, rng.commonAncestorContainer, startNode, endNode, {
            text: (node, section) => {
                // Set the start/end offset of the section
                if (node === endNode) {
                    section.fOffset += node.length - end.offset;
                }
                else if (node === startNode) {
                    section.sOffset += start.offset;
                }
            },
            cef: (node) => {
                // Collect the sections and then order them appropriately, as nested sections maybe out of order
                // TODO: See if we can improve this to avoid the sort overhead
                const sections = bind(descendants(SugarElement.fromDom(node), '*[contenteditable=true]'), (e) => {
                    const ceTrueNode = e.dom;
                    return collect(dom, ceTrueNode, ceTrueNode);
                });
                return sort(sections, (a, b) => (documentPositionPreceding(a.elements[0].dom, b.elements[0].dom)) ? 1 : -1);
            }
        }, false);
    };
    const fromRng = (dom, rng) => rng.collapsed ? [] : collectRangeSections(dom, rng);
    const fromNode = (dom, node) => {
        const rng = dom.createRng();
        rng.selectNode(node);
        return fromRng(dom, rng);
    };
    const fromNodes = (dom, nodes) => bind(nodes, (node) => fromNode(dom, node));

    const find$2 = (text, pattern, start = 0, finish = text.length) => {
        const regex = pattern.regex;
        regex.lastIndex = start;
        const results = [];
        let match;
        while ((match = regex.exec(text))) {
            const matchedText = match[pattern.matchIndex];
            const matchStart = match.index + match[0].indexOf(matchedText);
            const matchFinish = matchStart + matchedText.length;
            // Stop finding matches if we've hit the finish mark
            if (matchFinish > finish) {
                break;
            }
            results.push({
                start: matchStart,
                finish: matchFinish
            });
            regex.lastIndex = matchFinish;
        }
        return results;
    };
    const extract = (elements, matches) => {
        // Walk over each text node and compare with the matches
        const nodePositions = foldl(elements, (acc, element) => {
            const content = get$1(element);
            const start = acc.last;
            const finish = start + content.length;
            // Find positions for any matches in the current text node
            const positions = bind(matches, (match, matchIdx) => {
                // Check to see if the match overlaps with the text position
                if (match.start < finish && match.finish > start) {
                    return [{
                            element,
                            start: Math.max(start, match.start) - start,
                            finish: Math.min(finish, match.finish) - start,
                            matchId: matchIdx
                        }];
                }
                else {
                    return [];
                }
            });
            return {
                results: acc.results.concat(positions),
                last: finish
            };
        }, { results: [], last: 0 }).results;
        // Group the positions by the match id
        return groupBy(nodePositions, (position) => position.matchId);
    };

    const find$1 = (pattern, sections) => bind(sections, (section) => {
        const elements = section.elements;
        const content = map(elements, get$1).join('');
        const positions = find$2(content, pattern, section.sOffset, content.length - section.fOffset);
        return extract(elements, positions);
    });
    const mark = (matches, replacementNode) => {
        // Walk backwards and mark the positions
        // Note: We need to walk backwards so the position indexes don't change
        eachr(matches, (match, idx) => {
            eachr(match, (pos) => {
                const wrapper = SugarElement.fromDom(replacementNode.cloneNode(false));
                set(wrapper, 'data-mce-index', idx);
                const textNode = pos.element.dom;
                if (textNode.length === pos.finish && pos.start === 0) {
                    wrap(pos.element, wrapper);
                }
                else {
                    if (textNode.length !== pos.finish) {
                        textNode.splitText(pos.finish);
                    }
                    const matchNode = textNode.splitText(pos.start);
                    wrap(SugarElement.fromDom(matchNode), wrapper);
                }
            });
        });
    };
    const findAndMark = (dom, pattern, node, replacementNode) => {
        const textSections = fromNode(dom, node);
        const matches = find$1(pattern, textSections);
        mark(matches, replacementNode);
        return matches.length;
    };
    const findAndMarkInSelection = (dom, pattern, selection, replacementNode) => {
        const bookmark = selection.getBookmark();
        // Handle table cell selection as the table plugin enables
        // you to fake select table cells and perform actions on them
        const nodes = dom.select('td[data-mce-selected],th[data-mce-selected]');
        const textSections = nodes.length > 0 ? fromNodes(dom, nodes) : fromRng(dom, selection.getRng());
        // Find and mark matches
        const matches = find$1(pattern, textSections);
        mark(matches, replacementNode);
        // Restore the selection
        selection.moveToBookmark(bookmark);
        return matches.length;
    };

    const getElmIndex = (elm) => {
        return elm.getAttribute('data-mce-index');
    };
    const markAllMatches = (editor, currentSearchState, pattern, inSelection) => {
        const marker = editor.dom.create('span', {
            'data-mce-bogus': 1
        });
        marker.className = 'mce-match-marker';
        const node = editor.getBody();
        done(editor, currentSearchState, false);
        if (inSelection) {
            return findAndMarkInSelection(editor.dom, pattern, editor.selection, marker);
        }
        else {
            return findAndMark(editor.dom, pattern, node, marker);
        }
    };
    const unwrap = (node) => {
        const parentNode = node.parentNode;
        if (node.firstChild) {
            parentNode.insertBefore(node.firstChild, node);
        }
        node.parentNode?.removeChild(node);
    };
    const findSpansByIndex = (editor, index) => {
        const spans = [];
        const nodes = global$1.toArray(editor.getBody().getElementsByTagName('span'));
        if (nodes.length) {
            for (let i = 0; i < nodes.length; i++) {
                const nodeIndex = getElmIndex(nodes[i]);
                if (nodeIndex === null || !nodeIndex.length) {
                    continue;
                }
                if (nodeIndex === index.toString()) {
                    spans.push(nodes[i]);
                }
            }
        }
        return spans;
    };
    const moveSelection = (editor, currentSearchState, forward) => {
        const searchState = currentSearchState.get();
        let testIndex = searchState.index;
        const dom = editor.dom;
        if (forward) {
            if (testIndex + 1 === searchState.count) {
                testIndex = 0;
            }
            else {
                testIndex++;
            }
        }
        else {
            if (testIndex - 1 === -1) {
                testIndex = searchState.count - 1;
            }
            else {
                testIndex--;
            }
        }
        dom.removeClass(findSpansByIndex(editor, searchState.index), 'mce-match-marker-selected');
        const spans = findSpansByIndex(editor, testIndex);
        if (spans.length) {
            dom.addClass(findSpansByIndex(editor, testIndex), 'mce-match-marker-selected');
            editor.selection.scrollIntoView(spans[0]);
            return testIndex;
        }
        return -1;
    };
    const removeNode = (dom, node) => {
        const parent = node.parentNode;
        dom.remove(node);
        if (parent && dom.isEmpty(parent)) {
            dom.remove(parent);
        }
    };
    const escapeSearchText = (text, wholeWord) => {
        const escapedText = text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&').replace(/\s/g, '[^\\S\\r\\n\\uFEFF]');
        const wordRegex = '(' + escapedText + ')';
        return wholeWord ? `(?:^|\\s|${punctuation()})` + wordRegex + `(?=$|\\s|${punctuation()})` : wordRegex;
    };
    const find = (editor, currentSearchState, text, matchCase, wholeWord, inSelection) => {
        const selection = editor.selection;
        const escapedText = escapeSearchText(text, wholeWord);
        const isForwardSelection = selection.isForward();
        const pattern = {
            regex: new RegExp(escapedText, matchCase ? 'g' : 'gi'),
            matchIndex: 1
        };
        const count = markAllMatches(editor, currentSearchState, pattern, inSelection);
        // Safari has a bug whereby splitting text nodes breaks the selection (which is done when marking matches).
        // As such we need to manually reset it after doing a find action. See https://bugs.webkit.org/show_bug.cgi?id=230594
        if (global$2.browser.isSafari()) {
            selection.setRng(selection.getRng(), isForwardSelection);
        }
        if (count) {
            const newIndex = moveSelection(editor, currentSearchState, true);
            currentSearchState.set({
                index: newIndex,
                count,
                text,
                matchCase,
                wholeWord,
                inSelection
            });
        }
        return count;
    };
    const next = (editor, currentSearchState) => {
        const index = moveSelection(editor, currentSearchState, true);
        currentSearchState.set({ ...currentSearchState.get(), index });
    };
    const prev = (editor, currentSearchState) => {
        const index = moveSelection(editor, currentSearchState, false);
        currentSearchState.set({ ...currentSearchState.get(), index });
    };
    const isMatchSpan = (node) => {
        const matchIndex = getElmIndex(node);
        return matchIndex !== null && matchIndex.length > 0;
    };
    const replace = (editor, currentSearchState, text, forward, all) => {
        const searchState = currentSearchState.get();
        const currentIndex = searchState.index;
        let currentMatchIndex, nextIndex = currentIndex;
        forward = forward !== false;
        const node = editor.getBody();
        const nodes = global$1.grep(global$1.toArray(node.getElementsByTagName('span')), isMatchSpan);
        for (let i = 0; i < nodes.length; i++) {
            const nodeIndex = getElmIndex(nodes[i]);
            let matchIndex = currentMatchIndex = parseInt(nodeIndex, 10);
            if (all || matchIndex === searchState.index) {
                if (text.length) {
                    nodes[i].innerText = text;
                    unwrap(nodes[i]);
                }
                else {
                    removeNode(editor.dom, nodes[i]);
                }
                while (nodes[++i]) {
                    matchIndex = parseInt(getElmIndex(nodes[i]), 10);
                    if (matchIndex === currentMatchIndex) {
                        removeNode(editor.dom, nodes[i]);
                    }
                    else {
                        i--;
                        break;
                    }
                }
                if (forward) {
                    nextIndex--;
                }
            }
            else if (currentMatchIndex > currentIndex) {
                nodes[i].setAttribute('data-mce-index', String(currentMatchIndex - 1));
            }
        }
        currentSearchState.set({
            ...searchState,
            count: all ? 0 : searchState.count - 1,
            index: nextIndex
        });
        if (forward) {
            next(editor, currentSearchState);
        }
        else {
            prev(editor, currentSearchState);
        }
        return !all && currentSearchState.get().count > 0;
    };
    const done = (editor, currentSearchState, keepEditorSelection) => {
        let startContainer;
        let endContainer;
        const searchState = currentSearchState.get();
        const nodes = global$1.toArray(editor.getBody().getElementsByTagName('span'));
        for (let i = 0; i < nodes.length; i++) {
            const nodeIndex = getElmIndex(nodes[i]);
            if (nodeIndex !== null && nodeIndex.length) {
                if (nodeIndex === searchState.index.toString()) {
                    // Note: The first child of the span node will be the highlighted text node
                    if (!startContainer) {
                        startContainer = nodes[i].firstChild;
                    }
                    endContainer = nodes[i].firstChild;
                }
                unwrap(nodes[i]);
            }
        }
        // Reset the search state
        currentSearchState.set({
            ...searchState,
            index: -1,
            count: 0,
            text: ''
        });
        if (startContainer && endContainer) {
            const rng = editor.dom.createRng();
            rng.setStart(startContainer, 0);
            rng.setEnd(endContainer, endContainer.data.length);
            if (keepEditorSelection !== false) {
                editor.selection.setRng(rng);
            }
            return rng;
        }
        else {
            return undefined;
        }
    };
    const hasNext = (editor, currentSearchState) => currentSearchState.get().count > 1;
    const hasPrev = (editor, currentSearchState) => currentSearchState.get().count > 1;

    const get = (editor, currentState) => {
        const done$1 = (keepEditorSelection) => {
            return done(editor, currentState, keepEditorSelection);
        };
        const find$1 = (text, matchCase, wholeWord, inSelection = false) => {
            return find(editor, currentState, text, matchCase, wholeWord, inSelection);
        };
        const next$1 = () => {
            return next(editor, currentState);
        };
        const prev$1 = () => {
            return prev(editor, currentState);
        };
        const replace$1 = (text, forward, all) => {
            return replace(editor, currentState, text, forward, all);
        };
        return {
            done: done$1,
            find: find$1,
            next: next$1,
            prev: prev$1,
            replace: replace$1
        };
    };

    const open = (editor, currentSearchState) => {
        const dialogApi = value();
        editor.undoManager.add();
        const selectedText = global$1.trim(editor.selection.getContent({ format: 'text' }));
        const updateButtonStates = (api) => {
            api.setEnabled('next', hasNext(editor, currentSearchState));
            api.setEnabled('prev', hasPrev(editor, currentSearchState));
        };
        const updateSearchState = (api) => {
            const data = api.getData();
            const current = currentSearchState.get();
            currentSearchState.set({
                ...current,
                matchCase: data.matchcase,
                wholeWord: data.wholewords,
                inSelection: data.inselection
            });
        };
        const disableAll = (api, disable) => {
            const buttons = ['replace', 'replaceall', 'prev', 'next'];
            const toggle = (name) => api.setEnabled(name, !disable);
            each(buttons, toggle);
        };
        const toggleNotFoundAlert = (isVisible, api) => {
            api.redial(getDialogSpec(isVisible, api.getData()));
        };
        // Temporarily workaround for iOS/iPadOS dialog placement to hide the keyboard
        // TODO: Remove in 5.2 once iOS fixed positioning is fixed. See TINY-4441
        const focusButtonIfRequired = (api, name) => {
            if (global$2.browser.isSafari() && global$2.deviceType.isTouch() && (name === 'find' || name === 'replace' || name === 'replaceall')) {
                api.focus(name);
            }
        };
        const reset = (api) => {
            // Clean up the markers if required
            done(editor, currentSearchState, false);
            // Disable the buttons
            disableAll(api, true);
            updateButtonStates(api);
        };
        const doFind = (api) => {
            const data = api.getData();
            const last = currentSearchState.get();
            if (!data.findtext.length) {
                reset(api);
                return;
            }
            // Same search text, so treat the find as a next click instead
            if (last.text === data.findtext && last.matchCase === data.matchcase && last.wholeWord === data.wholewords) {
                next(editor, currentSearchState);
            }
            else {
                // Find new matches
                const count = find(editor, currentSearchState, data.findtext, data.matchcase, data.wholewords, data.inselection);
                if (count <= 0) {
                    toggleNotFoundAlert(true, api);
                }
                disableAll(api, count === 0);
            }
            updateButtonStates(api);
        };
        const initialState = currentSearchState.get();
        const initialData = {
            findtext: selectedText,
            replacetext: '',
            wholewords: initialState.wholeWord,
            matchcase: initialState.matchCase,
            inselection: initialState.inSelection
        };
        const getPanelItems = (error) => {
            const items = [
                {
                    type: 'label',
                    label: 'Find',
                    for: 'findtext',
                    items: [
                        {
                            type: 'bar',
                            items: [
                                {
                                    type: 'input',
                                    name: 'findtext',
                                    maximized: true,
                                    inputMode: 'search'
                                },
                                {
                                    type: 'button',
                                    name: 'prev',
                                    text: 'Previous',
                                    icon: 'action-prev',
                                    enabled: false,
                                    borderless: true
                                },
                                {
                                    type: 'button',
                                    name: 'next',
                                    text: 'Next',
                                    icon: 'action-next',
                                    enabled: false,
                                    borderless: true
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'input',
                    name: 'replacetext',
                    label: 'Replace with',
                    inputMode: 'search'
                },
            ];
            if (error) {
                items.push({
                    type: 'alertbanner',
                    level: 'error',
                    text: 'Could not find the specified string.',
                    icon: 'warning',
                });
            }
            return items;
        };
        const getDialogSpec = (showNoMatchesAlertBanner, initialData) => ({
            title: 'Find and Replace',
            size: 'normal',
            body: {
                type: 'panel',
                items: getPanelItems(showNoMatchesAlertBanner)
            },
            buttons: [
                {
                    type: 'menu',
                    name: 'options',
                    icon: 'preferences',
                    tooltip: 'Preferences',
                    align: 'start',
                    items: [
                        {
                            type: 'togglemenuitem',
                            name: 'matchcase',
                            text: 'Match case'
                        }, {
                            type: 'togglemenuitem',
                            name: 'wholewords',
                            text: 'Find whole words only'
                        },
                        {
                            type: 'togglemenuitem',
                            name: 'inselection',
                            text: 'Find in selection'
                        }
                    ]
                },
                {
                    type: 'custom',
                    name: 'find',
                    text: 'Find',
                    primary: true
                },
                {
                    type: 'custom',
                    name: 'replace',
                    text: 'Replace',
                    enabled: false
                },
                {
                    type: 'custom',
                    name: 'replaceall',
                    text: 'Replace all',
                    enabled: false,
                }
            ],
            initialData,
            onChange: (api, details) => {
                if (showNoMatchesAlertBanner) {
                    toggleNotFoundAlert(false, api);
                }
                if (details.name === 'findtext' && currentSearchState.get().count > 0) {
                    reset(api);
                }
            },
            onAction: (api, details) => {
                const data = api.getData();
                switch (details.name) {
                    case 'find':
                        doFind(api);
                        break;
                    case 'replace':
                        if (!replace(editor, currentSearchState, data.replacetext)) {
                            reset(api);
                        }
                        else {
                            updateButtonStates(api);
                        }
                        break;
                    case 'replaceall':
                        replace(editor, currentSearchState, data.replacetext, true, true);
                        reset(api);
                        break;
                    case 'prev':
                        prev(editor, currentSearchState);
                        updateButtonStates(api);
                        break;
                    case 'next':
                        next(editor, currentSearchState);
                        updateButtonStates(api);
                        break;
                    case 'matchcase':
                    case 'wholewords':
                    case 'inselection':
                        toggleNotFoundAlert(false, api);
                        updateSearchState(api);
                        reset(api);
                        break;
                }
                focusButtonIfRequired(api, details.name);
            },
            onSubmit: (api) => {
                doFind(api);
                focusButtonIfRequired(api, 'find');
            },
            onClose: () => {
                editor.focus();
                done(editor, currentSearchState);
                editor.undoManager.add();
            }
        });
        dialogApi.set(editor.windowManager.open(getDialogSpec(false, initialData), { inline: 'toolbar' }));
    };

    const register$1 = (editor, currentSearchState) => {
        editor.addCommand('SearchReplace', () => {
            open(editor, currentSearchState);
        });
    };

    const showDialog = (editor, currentSearchState) => () => {
        open(editor, currentSearchState);
    };
    const register = (editor, currentSearchState) => {
        editor.ui.registry.addMenuItem('searchreplace', {
            text: 'Find and replace...',
            shortcut: 'Meta+F',
            onAction: showDialog(editor, currentSearchState),
            icon: 'search'
        });
        editor.ui.registry.addButton('searchreplace', {
            tooltip: 'Find and replace',
            onAction: showDialog(editor, currentSearchState),
            icon: 'search',
            shortcut: 'Meta+F'
        });
        editor.shortcuts.add('Meta+F', '', showDialog(editor, currentSearchState));
    };

    var Plugin = () => {
        global$3.add('searchreplace', (editor) => {
            const currentSearchState = Cell({
                index: -1,
                count: 0,
                text: '',
                matchCase: false,
                wholeWord: false,
                inSelection: false
            });
            register$1(editor, currentSearchState);
            register(editor, currentSearchState);
            return get(editor, currentSearchState);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
