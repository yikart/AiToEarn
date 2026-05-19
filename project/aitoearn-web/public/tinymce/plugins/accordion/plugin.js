/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$4 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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
    const isBoolean = isSimpleType('boolean');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');
    const isNumber = isSimpleType('number');

    /** Compose two unary functions. Similar to compose, but avoids using Function.prototype.apply. */
    const compose1 = (fbc, fab) => (a) => fbc(fab(a));
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
    const foldl = (xs, f, acc) => {
        each$1(xs, (x, i) => {
            acc = f(acc, x, i);
        });
        return acc;
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

    /**
     * **Is** the value stored inside this Optional object equal to `rhs`?
     */
    const is$2 = (lhs, rhs, comparator = tripleEquals) => lhs.exists((left) => comparator(left, rhs));

    const blank = (r) => (s) => s.replace(r, '');
    /** removes all leading and trailing spaces */
    const trim = blank(/^\s+|\s+$/g);

    const point = (element, offset) => ({
        element,
        offset
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

    const COMMENT = 8;
    const DOCUMENT = 9;
    const DOCUMENT_FRAGMENT = 11;
    const ELEMENT = 1;
    const TEXT = 3;

    const is$1 = (element, selector) => {
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
    const all = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? [] : map(base.querySelectorAll(selector), SugarElement.fromDom);
    };
    const one = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? Optional.none() : Optional.from(base.querySelector(selector)).map(SugarElement.fromDom);
    };

    const eq = (e1, e2) => e1.dom === e2.dom;
    const is = is$1;

    const name = (element) => {
        const r = element.dom.nodeName;
        return r.toLowerCase();
    };
    const type = (element) => element.dom.nodeType;
    const isType = (t) => (element) => type(element) === t;
    const isComment = (element) => type(element) === COMMENT || name(element) === '#comment';
    const isElement = isType(ELEMENT);
    const isText = isType(TEXT);
    const isDocument = isType(DOCUMENT);
    const isDocumentFragment = isType(DOCUMENT_FRAGMENT);

    /**
     * The document associated with the current element
     * NOTE: this will throw if the owner is null.
     */
    const owner = (element) => SugarElement.fromDom(element.dom.ownerDocument);
    /**
     * If the element is a document, return it. Otherwise, return its ownerDocument.
     * @param dos
     */
    const documentOrOwner = (dos) => isDocument(dos) ? dos : owner(dos);
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
    const prevSibling = (element) => Optional.from(element.dom.previousSibling).map(SugarElement.fromDom);
    const nextSibling = (element) => Optional.from(element.dom.nextSibling).map(SugarElement.fromDom);
    const children = (element) => map(element.dom.childNodes, SugarElement.fromDom);
    const child = (element, index) => {
        const cs = element.dom.childNodes;
        return Optional.from(cs[index]).map(SugarElement.fromDom);
    };
    const firstChild = (element) => child(element, 0);

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

    const before = (marker, element) => {
        const parent$1 = parent(marker);
        parent$1.each((v) => {
            v.dom.insertBefore(element.dom, marker.dom);
        });
    };
    const after$1 = (marker, element) => {
        const sibling = nextSibling(marker);
        sibling.fold(() => {
            const parent$1 = parent(marker);
            parent$1.each((v) => {
                append$1(v, element);
            });
        }, (v) => {
            before(v, element);
        });
    };
    const prepend = (parent, element) => {
        const firstChild$1 = firstChild(parent);
        firstChild$1.fold(() => {
            append$1(parent, element);
        }, (v) => {
            parent.dom.insertBefore(element.dom, v.dom);
        });
    };
    const append$1 = (parent, element) => {
        parent.dom.appendChild(element.dom);
    };
    const wrap = (element, wrapper) => {
        before(element, wrapper);
        append$1(wrapper, element);
    };

    const after = (marker, elements) => {
        each$1(elements, (x, i) => {
            const e = i === 0 ? marker : elements[i - 1];
            after$1(e, x);
        });
    };
    const append = (parent, elements) => {
        each$1(elements, (x) => {
            append$1(parent, x);
        });
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
    const set$2 = (element, key, value) => {
        rawSet(element.dom, key, value);
    };
    const setAll = (element, attrs) => {
        const dom = element.dom;
        each(attrs, (v, k) => {
            rawSet(dom, k, v);
        });
    };
    const get$2 = (element, key) => {
        const v = element.dom.getAttribute(key);
        // undefined is the more appropriate value for JS, and this matches JQuery
        return v === null ? undefined : v;
    };
    const getOpt = (element, key) => Optional.from(get$2(element, key));
    const remove$2 = (element, key) => {
        element.dom.removeAttribute(key);
    };
    const clone = (element) => foldl(element.dom.attributes, (acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
    }, {});

    const remove$1 = (element) => {
        const dom = element.dom;
        if (dom.parentNode !== null) {
            dom.parentNode.removeChild(dom);
        }
    };
    const unwrap = (wrapper) => {
        const children$1 = children(wrapper);
        if (children$1.length > 0) {
            after(wrapper, children$1);
        }
        remove$1(wrapper);
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
    const internalRemove = (dom, property) => {
        /*
         * IE9 and above - MDN doesn't have details, but here's a couple of random internet claims
         *
         * http://help.dottoro.com/ljopsjck.php
         * http://stackoverflow.com/a/7901886/7546
         */
        if (isSupported(dom)) {
            dom.style.removeProperty(property);
        }
    };
    const set$1 = (element, property, value) => {
        const dom = element.dom;
        internalSet(dom, property, value);
    };
    /*
     * NOTE: For certain properties, this returns the "used value" which is subtly different to the "computed value" (despite calling getComputedStyle).
     * Blame CSS 2.0.
     *
     * https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
     */
    const get$1 = (element, property) => {
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
    /*
     * Gets the raw value from the style attribute. Useful for retrieving "used values" from the DOM:
     * https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
     *
     * Returns NONE if the property isn't set, or the value is an empty string.
     */
    const getRaw = (element, property) => {
        const dom = element.dom;
        const raw = getUnsafeProperty(dom, property);
        return Optional.from(raw).filter((r) => r.length > 0);
    };
    const remove = (element, property) => {
        const dom = element.dom;
        internalRemove(dom, property);
        if (is$2(getOpt(element, 'style').map(trim), '')) {
            // No more styles left, remove the style attribute as well
            remove$2(element, 'style');
        }
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

    const api = NodeValue(isText, 'text');
    const get = (element) => api.get(element);
    const set = (element, value) => api.set(element, value);

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

    const ancestor = (scope, selector, isRoot) => ancestor$1(scope, (e) => is$1(e, selector), isRoot);
    const descendant = (scope, selector) => one(selector, scope);
    // Returns Some(closest ancestor element (sugared)) matching 'selector' up to isRoot, or None() otherwise
    const closest = (scope, selector, isRoot) => {
        const is = (element, selector) => is$1(element, selector);
        return ClosestOrAncestor(is, ancestor, scope, selector, isRoot);
    };

    const descendants$1 = (scope, predicate) => {
        let result = [];
        // Recurse.toArray() might help here
        each$1(children(scope), (x) => {
            if (predicate(x)) {
                result = result.concat([x]);
            }
            result = result.concat(descendants$1(x, predicate));
        });
        return result;
    };

    const descendants = (scope, selector) => all(selector, scope);

    var TagBoundaries = [
        'body',
        'p',
        'div',
        'article',
        'aside',
        'figcaption',
        'figure',
        'footer',
        'header',
        'nav',
        'section',
        'ol',
        'ul',
        'li',
        'table',
        'thead',
        'tbody',
        'tfoot',
        'caption',
        'tr',
        'td',
        'th',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'pre',
        'address'
    ];

    var DomUniverse = () => {
        const clone$1 = (element) => {
            return SugarElement.fromDom(element.dom.cloneNode(false));
        };
        const document = (element) => documentOrOwner(element).dom;
        const isBoundary = (element) => {
            if (!isElement(element)) {
                return false;
            }
            if (name(element) === 'body') {
                return true;
            }
            return contains(TagBoundaries, name(element));
        };
        const isEmptyTag = (element) => {
            if (!isElement(element)) {
                return false;
            }
            return contains(['br', 'img', 'hr', 'input'], name(element));
        };
        const isNonEditable = (element) => isElement(element) && get$2(element, 'contenteditable') === 'false';
        const comparePosition = (element, other) => {
            return element.dom.compareDocumentPosition(other.dom);
        };
        const copyAttributesTo = (source, destination) => {
            const as = clone(source);
            setAll(destination, as);
        };
        const isSpecial = (element) => {
            const tag = name(element);
            return contains([
                'script', 'noscript', 'iframe', 'noframes', 'noembed', 'title', 'style', 'textarea', 'xmp'
            ], tag);
        };
        const getLanguage = (element) => isElement(element) ? getOpt(element, 'lang') : Optional.none();
        return {
            up: constant({
                selector: ancestor,
                closest: closest,
                predicate: ancestor$1,
                all: parents
            }),
            down: constant({
                selector: descendants,
                predicate: descendants$1
            }),
            styles: constant({
                get: get$1,
                getRaw: getRaw,
                set: set$1,
                remove: remove
            }),
            attrs: constant({
                get: get$2,
                set: set$2,
                remove: remove$2,
                copyTo: copyAttributesTo
            }),
            insert: constant({
                before: before,
                after: after$1,
                afterAll: after,
                append: append$1,
                appendAll: append,
                prepend: prepend,
                wrap: wrap
            }),
            remove: constant({
                unwrap: unwrap,
                remove: remove$1
            }),
            create: constant({
                nu: SugarElement.fromTag,
                clone: clone$1,
                text: SugarElement.fromText
            }),
            query: constant({
                comparePosition,
                prevSibling: prevSibling,
                nextSibling: nextSibling
            }),
            property: constant({
                children: children,
                name: name,
                parent: parent,
                document,
                isText: isText,
                isComment: isComment,
                isElement: isElement,
                isSpecial,
                getLanguage,
                getText: get,
                setText: set,
                isBoundary,
                isEmptyTag,
                isNonEditable
            }),
            eq: eq,
            is: is
        };
    };

    const scan = (universe, element, direction) => {
        // if a comment or zero-length text, scan the siblings
        if ((universe.property().isText(element) && universe.property().getText(element).trim().length === 0)
            || universe.property().isComment(element)) {
            return direction(element).bind((elem) => {
                return scan(universe, elem, direction).orThunk(() => {
                    return Optional.some(elem);
                });
            });
        }
        else {
            return Optional.none();
        }
    };
    const toEnd = (universe, element) => {
        if (universe.property().isText(element)) {
            return universe.property().getText(element).length;
        }
        const children = universe.property().children(element);
        return children.length;
    };
    const freefallRtl$2 = (universe, element) => {
        const candidate = scan(universe, element, universe.query().prevSibling).getOr(element);
        if (universe.property().isText(candidate)) {
            return point(candidate, toEnd(universe, candidate));
        }
        const children = universe.property().children(candidate);
        return children.length > 0 ? freefallRtl$2(universe, children[children.length - 1]) : point(candidate, toEnd(universe, candidate));
    };

    const freefallRtl$1 = freefallRtl$2;

    const universe = DomUniverse();
    const freefallRtl = (element) => {
        return freefallRtl$1(universe, element);
    };

    const fireToggleAccordionEvent = (editor, element, state) => editor.dispatch('ToggledAccordion', { element, state });
    const fireToggleAllAccordionsEvent = (editor, elements, state) => editor.dispatch('ToggledAllAccordions', { elements, state });

    const option = (name) => (editor) => editor.options.get(name);
    const isDisabled = option('disabled');

    const accordionTag = 'details';
    const accordionDetailsClass = 'mce-accordion';
    const accordionSummaryClass = 'mce-accordion-summary';
    const accordionBodyWrapperClass = 'mce-accordion-body';
    const accordionBodyWrapperTag = 'div';
    const accordionReadonlyCompensationAttribute = 'data-mce-accordion-open';

    var global$3 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    const isSummary = (node) => node?.nodeName === 'SUMMARY';
    const isDetails = (node) => node?.nodeName === 'DETAILS';
    const isOpen = (details) => details.hasAttribute('open');
    const isInSummary = (editor) => {
        const node = editor.selection.getNode();
        return isSummary(node) || Boolean(editor.dom.getParent(node, isSummary));
    };
    const isAtDetailsStart = (editor) => {
        const rng = editor.selection.getRng();
        return isDetails(rng.startContainer)
            && rng.collapsed
            && rng.startOffset === 0;
    };
    const isInsertAllowed = (editor) => !isInSummary(editor) && editor.dom.isEditable(editor.selection.getNode()) && !editor.mode.isReadOnly();
    const getSelectedDetails = (editor) => Optional.from(editor.dom.getParent(editor.selection.getNode(), isDetails));
    const isDetailsSelected = (editor) => getSelectedDetails(editor).isSome();
    const insertBogus = (element) => {
        element.innerHTML = '<br data-mce-bogus="1" />';
        return element;
    };
    const createParagraph = (editor) => insertBogus(editor.dom.create('p'));
    const createSummary = (editor) => insertBogus(editor.dom.create('summary'));
    const insertAndSelectParagraphAfter = (editor, target) => {
        const paragraph = createParagraph(editor);
        target.insertAdjacentElement('afterend', paragraph);
        editor.selection.setCursorLocation(paragraph, 0);
    };
    const normalizeContent = (editor, accordion) => {
        if (isSummary(accordion?.lastChild)) {
            const paragraph = createParagraph(editor);
            accordion.appendChild(paragraph);
            editor.selection.setCursorLocation(paragraph, 0);
        }
    };
    const normalizeSummary = (editor, accordion) => {
        if (!isSummary(accordion?.firstChild)) {
            const summary = createSummary(editor);
            accordion.prepend(summary);
            editor.selection.setCursorLocation(summary, 0);
        }
    };
    const normalizeAccordion = (editor) => (accordion) => {
        normalizeContent(editor, accordion);
        normalizeSummary(editor, accordion);
    };
    const normalizeDetails = (editor) => {
        global$3.each(global$3.grep(editor.dom.select('details', editor.getBody())), normalizeAccordion(editor));
    };

    const insertAccordion = (editor) => {
        if (!isInsertAllowed(editor)) {
            return;
        }
        const editorBody = SugarElement.fromDom(editor.getBody());
        const uid = generate('acc');
        const summaryText = editor.dom.encode(editor.selection.getRng().toString() || editor.translate('Accordion summary...'));
        const bodyText = editor.dom.encode(editor.translate('Accordion body...'));
        const accordionSummaryHtml = `<summary class="${accordionSummaryClass}">${summaryText}</summary>`;
        const accordionBodyHtml = `<${accordionBodyWrapperTag} class="${accordionBodyWrapperClass}"><p>${bodyText}</p></${accordionBodyWrapperTag}>`;
        editor.undoManager.transact(() => {
            editor.insertContent([
                `<details data-mce-id="${uid}" class="${accordionDetailsClass}" open="open">`,
                accordionSummaryHtml,
                accordionBodyHtml,
                `</details>`
            ].join(''));
            descendant(editorBody, `[data-mce-id="${uid}"]`).each((detailsElm) => {
                remove$2(detailsElm, 'data-mce-id');
                descendant(detailsElm, `summary`).each((summaryElm) => {
                    // Set the cursor location to be at the end of the summary text
                    const rng = editor.dom.createRng();
                    const des = freefallRtl(summaryElm);
                    rng.setStart(des.element.dom, des.offset);
                    rng.setEnd(des.element.dom, des.offset);
                    editor.selection.setRng(rng);
                });
            });
        });
    };
    const toggleDetailsElement = (isReadonly, details, state) => {
        const shouldOpen = state ?? !isOpen(details);
        if (!isReadonly) {
            details.setAttribute(accordionReadonlyCompensationAttribute, shouldOpen ? 'open' : 'closed');
        }
        if (shouldOpen) {
            details.setAttribute('open', 'open');
        }
        else {
            details.removeAttribute('open');
        }
        return shouldOpen;
    };
    const toggleAccordion = (editor, state) => {
        if (isDisabled(editor)) {
            return;
        }
        getSelectedDetails(editor).each((details) => {
            fireToggleAccordionEvent(editor, details, toggleDetailsElement(editor.readonly, details, state));
        });
    };
    const removeAccordion = (editor) => {
        if (!editor.mode.isReadOnly()) {
            getSelectedDetails(editor)
                .each((details) => {
                const { nextSibling } = details;
                if (nextSibling) {
                    editor.selection.select(nextSibling, true);
                    editor.selection.collapse(true);
                }
                else {
                    insertAndSelectParagraphAfter(editor, details);
                }
                details.remove();
            });
        }
    };
    const toggleAllAccordions = (editor, state) => {
        const accordions = Array.from(editor.getBody().querySelectorAll('details'));
        if (accordions.length === 0) {
            return;
        }
        each$1(accordions, (accordion) => toggleDetailsElement(editor.readonly, accordion, state ?? !isOpen(accordion)));
        fireToggleAllAccordionsEvent(editor, accordions, state);
    };

    const register$1 = (editor) => {
        editor.addCommand('InsertAccordion', () => insertAccordion(editor));
        editor.addCommand('ToggleAccordion', (_ui, value) => toggleAccordion(editor, value));
        editor.addCommand('ToggleAllAccordions', (_ui, value) => toggleAllAccordions(editor, value));
        editor.addCommand('RemoveAccordion', () => removeAccordion(editor));
    };

    var global$2 = tinymce.util.Tools.resolve('tinymce.html.Node');

    const normalizeOpenAttribute = (node) => {
        if (hasAttribute(node, 'open')) {
            setAttribute(node, 'open', 'open');
        }
    };
    const hasAttribute = (node, attribute) => node.attr(attribute) !== undefined;
    const setAttribute = (node, attribute, value) => {
        node.attr(attribute, value);
    };

    const getClassList = (node) => node.attr('class')?.split(' ') ?? [];
    const addClasses = (node, classes) => {
        const classListSet = new Set([...getClassList(node), ...classes]);
        const newClassList = Array.from(classListSet);
        if (newClassList.length > 0) {
            node.attr('class', newClassList.join(' '));
        }
    };
    const removeClasses = (node, classes) => {
        const newClassList = filter(getClassList(node), (clazz) => !classes.has(clazz));
        node.attr('class', newClassList.length > 0 ? newClassList.join(' ') : null);
    };
    const isAccordionDetailsNode = (node) => node.name === accordionTag && contains(getClassList(node), accordionDetailsClass);
    const isAccordionBodyWrapperNode = (node) => node.name === accordionBodyWrapperTag && contains(getClassList(node), accordionBodyWrapperClass);
    const getAccordionChildren = (accordionNode) => {
        const children = accordionNode.children();
        let summaryNode;
        let wrapperNode;
        const otherNodes = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // Only want to get the first summary element
            if (child.name === 'summary' && isNullable(summaryNode)) {
                summaryNode = child;
            }
            else if (isAccordionBodyWrapperNode(child) && isNullable(wrapperNode)) {
                wrapperNode = child;
            }
            else {
                otherNodes.push(child);
            }
        }
        return {
            summaryNode,
            wrapperNode,
            otherNodes
        };
    };
    const padInputNode = (node) => {
        // Add br to node to ensure the cursor can be placed inside the node
        // Mark as bogus so that it is converted to an nbsp on serialization
        const br = new global$2('br', 1);
        br.attr('data-mce-bogus', '1');
        node.empty();
        node.append(br);
    };
    const setup$2 = (editor) => {
        editor.on('PreInit', () => {
            const { serializer, parser } = editor;
            // Purpose:
            // - add mce-accordion-summary class to summary node
            // - wrap details body in div and add mce-accordion-body class (TINY-9959 assists with Chrome selection issue)
            // - Normalize accordion 'open' attribute value to open="open"
            parser.addNodeFilter(accordionTag, (nodes) => {
                // Using a traditional for loop here as we may have to iterate over many nodes and it is the most performant way of doing so
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    normalizeOpenAttribute(node);
                    if (isAccordionDetailsNode(node)) {
                        const accordionNode = node;
                        accordionNode.attr(accordionReadonlyCompensationAttribute, accordionNode.attr('open') === 'open' ? 'open' : 'closed');
                        const { summaryNode, wrapperNode, otherNodes } = getAccordionChildren(accordionNode);
                        const hasSummaryNode = isNonNullable(summaryNode);
                        const newSummaryNode = hasSummaryNode ? summaryNode : new global$2('summary', 1);
                        // If there is nothing in the summary, pad it with a br
                        // so the cursor can be put inside the accordion summary
                        if (isNullable(newSummaryNode.firstChild)) {
                            padInputNode(newSummaryNode);
                        }
                        addClasses(newSummaryNode, [accordionSummaryClass]);
                        if (!hasSummaryNode) {
                            if (isNonNullable(accordionNode.firstChild)) {
                                accordionNode.insert(newSummaryNode, accordionNode.firstChild, true);
                            }
                            else {
                                accordionNode.append(newSummaryNode);
                            }
                        }
                        const hasWrapperNode = isNonNullable(wrapperNode);
                        const newWrapperNode = hasWrapperNode ? wrapperNode : new global$2(accordionBodyWrapperTag, 1);
                        newWrapperNode.attr('data-mce-bogus', '1');
                        addClasses(newWrapperNode, [accordionBodyWrapperClass]);
                        if (otherNodes.length > 0) {
                            for (let j = 0; j < otherNodes.length; j++) {
                                const otherNode = otherNodes[j];
                                newWrapperNode.append(otherNode);
                            }
                        }
                        // If there is nothing in the wrapper, append a placeholder p tag
                        // so the cursor can be put inside the accordion body
                        if (isNullable(newWrapperNode.firstChild)) {
                            const pNode = new global$2('p', 1);
                            padInputNode(pNode);
                            newWrapperNode.append(pNode);
                        }
                        if (!hasWrapperNode) {
                            accordionNode.append(newWrapperNode);
                        }
                    }
                }
            });
            // Purpose:
            // - remove div wrapping details content as it is only required during editor (see TINY-9959 for details)
            // - remove mce-accordion-summary class on the summary node
            serializer.addNodeFilter(accordionTag, (nodes) => {
                const summaryClassRemoveSet = new Set([accordionSummaryClass]);
                // Using a traditional for loop here as we may have to iterate over many nodes and it is the most performant way of doing so
                for (let i = 0; i < nodes.length; i++) {
                    const node = nodes[i];
                    if (isAccordionDetailsNode(node)) {
                        const accordionNode = node;
                        accordionNode.attr('open', accordionNode.attr(accordionReadonlyCompensationAttribute) === 'open' ? 'open' : null);
                        accordionNode.attr(accordionReadonlyCompensationAttribute, null);
                        const { summaryNode, wrapperNode } = getAccordionChildren(accordionNode);
                        if (isNonNullable(summaryNode)) {
                            removeClasses(summaryNode, summaryClassRemoveSet);
                        }
                        if (isNonNullable(wrapperNode)) {
                            wrapperNode.unwrap();
                        }
                    }
                }
            });
        });
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.VK');

    const setupEnterKeyInSummary = (editor) => {
        editor.on('keydown', (event) => {
            if (!event.shiftKey && event.keyCode === global$1.ENTER
                && isInSummary(editor) || isAtDetailsStart(editor)) {
                event.preventDefault();
                editor.execCommand('ToggleAccordion');
            }
        });
    };
    const setup$1 = (editor) => {
        setupEnterKeyInSummary(editor);
        editor.on('ExecCommand', (e) => {
            const cmd = e.command.toLowerCase();
            if ((cmd === 'delete' || cmd === 'forwarddelete') && isDetailsSelected(editor)) {
                normalizeDetails(editor);
            }
        });
    };

    var global = tinymce.util.Tools.resolve('tinymce.Env');

    const setup = (editor) => {
        // TINY-10177: On Safari, clicking on the expand arrow of the `details` element sets the selection before the `summary`,
        // so we override the selection to the beginning of `summary` content
        if (global.browser.isSafari()) {
            editor.on('click', (e) => {
                if (isSummary(e.target)) {
                    const summary = e.target;
                    const rng = editor.selection.getRng();
                    if (rng.collapsed && rng.startContainer === summary.parentNode && rng.startOffset === 0) {
                        editor.selection.setCursorLocation(summary, 0);
                    }
                }
            });
        }
    };

    const onSetup = (editor) => (buttonApi) => {
        const onNodeChange = () => buttonApi.setEnabled(isInsertAllowed(editor));
        editor.on('NodeChange', onNodeChange);
        return () => editor.off('NodeChange', onNodeChange);
    };
    const register = (editor) => {
        const onAction = () => editor.execCommand('InsertAccordion');
        editor.ui.registry.addButton('accordion', { icon: 'accordion', tooltip: 'Insert accordion', onSetup: onSetup(editor), onAction });
        editor.ui.registry.addMenuItem('accordion', { icon: 'accordion', text: 'Accordion', onSetup: onSetup(editor), onAction });
        editor.ui.registry.addToggleButton('accordiontoggle', {
            icon: 'accordion-toggle',
            tooltip: 'Toggle accordion',
            onAction: () => editor.execCommand('ToggleAccordion'),
            context: 'any',
        });
        editor.ui.registry.addToggleButton('accordionremove', {
            icon: 'remove',
            tooltip: 'Delete accordion',
            onAction: () => editor.execCommand('RemoveAccordion')
        });
        editor.ui.registry.addContextToolbar('accordion', {
            predicate: (accordion) => editor.dom.is(accordion, 'details') && editor.getBody().contains(accordion) && editor.dom.isEditable(accordion.parentNode),
            items: 'accordiontoggle accordionremove',
            scope: 'node',
            position: 'node'
        });
    };

    var Plugin = () => {
        global$4.add('accordion', (editor) => {
            register(editor);
            register$1(editor);
            setup$1(editor);
            setup$2(editor);
            setup(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
