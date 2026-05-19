/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$1 = tinymce.util.Tools.resolve('tinymce.ModelManager');

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
    const eq$2 = (t) => (a) => t === a;
    const isString = isType$1('string');
    const isObject = isType$1('object');
    const isArray = isType$1('array');
    const isNull = eq$2(null);
    const isBoolean = isSimpleType('boolean');
    const isUndefined = eq$2(undefined);
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
    const identity = (x) => {
        return x;
    };
    const tripleEquals = (a, b) => {
        return a === b;
    };
    function curry(fn, ...initialArgs) {
        return (...restArgs) => {
            const all = initialArgs.concat(restArgs);
            return fn.apply(null, all);
        };
    }
    const not = (f) => (t) => !f(t);
    const die = (msg) => {
        return () => {
            throw new Error(msg);
        };
    };
    const apply = (f) => {
        return f();
    };
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

    const nativeSlice = Array.prototype.slice;
    const nativeIndexOf = Array.prototype.indexOf;
    const nativePush = Array.prototype.push;
    const rawIndexOf = (ts, t) => nativeIndexOf.call(ts, t);
    const contains$2 = (xs, x) => rawIndexOf(xs, x) > -1;
    const exists = (xs, pred) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                return true;
            }
        }
        return false;
    };
    const range$1 = (num, f) => {
        const r = [];
        for (let i = 0; i < num; i++) {
            r.push(f(i));
        }
        return r;
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
    const each$2 = (xs, f) => {
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
    const partition = (xs, pred) => {
        const pass = [];
        const fail = [];
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            const arr = pred(x, i) ? pass : fail;
            arr.push(x);
        }
        return { pass, fail };
    };
    const filter$2 = (xs, pred) => {
        const r = [];
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                r.push(x);
            }
        }
        return r;
    };
    const foldr = (xs, f, acc) => {
        eachr(xs, (x, i) => {
            acc = f(acc, x, i);
        });
        return acc;
    };
    const foldl = (xs, f, acc) => {
        each$2(xs, (x, i) => {
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
    const find$1 = (xs, pred) => {
        return findUntil(xs, pred, never);
    };
    const findIndex = (xs, pred) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            if (pred(x, i)) {
                return Optional.some(i);
            }
        }
        return Optional.none();
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
    const bind$2 = (xs, f) => flatten(map$1(xs, f));
    const forall = (xs, pred) => {
        for (let i = 0, len = xs.length; i < len; ++i) {
            const x = xs[i];
            if (pred(x, i) !== true) {
                return false;
            }
        }
        return true;
    };
    const reverse = (xs) => {
        const r = nativeSlice.call(xs, 0);
        r.reverse();
        return r;
    };
    const mapToObject = (xs, f) => {
        const r = {};
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            r[String(x)] = f(x, i);
        }
        return r;
    };
    const sort$1 = (xs, comparator) => {
        const copy = nativeSlice.call(xs, 0);
        copy.sort(comparator);
        return copy;
    };
    const get$d = (xs, i) => i >= 0 && i < xs.length ? Optional.some(xs[i]) : Optional.none();
    const head = (xs) => get$d(xs, 0);
    const last$2 = (xs) => get$d(xs, xs.length - 1);
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
    const each$1 = (obj, f) => {
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
        each$1(obj, (x, i) => {
            const tuple = f(x, i);
            r[tuple.k] = tuple.v;
        });
        return r;
    };
    const objAcc = (r) => (x, i) => {
        r[i] = x;
    };
    const internalFilter = (obj, pred, onTrue, onFalse) => {
        each$1(obj, (x, i) => {
            (pred(x, i) ? onTrue : onFalse)(x, i);
        });
    };
    const filter$1 = (obj, pred) => {
        const t = {};
        internalFilter(obj, pred, objAcc(t), noop);
        return t;
    };
    const mapToArray = (obj, f) => {
        const r = [];
        each$1(obj, (value, name) => {
            r.push(f(value, name));
        });
        return r;
    };
    const values = (obj) => {
        return mapToArray(obj, identity);
    };
    const get$c = (obj, key) => {
        return has$1(obj, key) ? Optional.from(obj[key]) : Optional.none();
    };
    const has$1 = (obj, key) => hasOwnProperty.call(obj, key);
    const hasNonNullableKey = (obj, key) => has$1(obj, key) && obj[key] !== undefined && obj[key] !== null;
    const isEmpty = (r) => {
        for (const x in r) {
            if (hasOwnProperty.call(r, x)) {
                return false;
            }
        }
        return true;
    };

    /*
     * Generates a church encoded ADT (https://en.wikipedia.org/wiki/Church_encoding)
     * For syntax and use, look at the test code.
     */
    const generate$1 = (cases) => {
        // validation
        if (!isArray(cases)) {
            throw new Error('cases must be an array');
        }
        if (cases.length === 0) {
            throw new Error('there must be at least one case');
        }
        const constructors = [];
        // adt is mutated to add the individual cases
        const adt = {};
        each$2(cases, (acase, count) => {
            const keys$1 = keys(acase);
            // validation
            if (keys$1.length !== 1) {
                throw new Error('one and only one name per case');
            }
            const key = keys$1[0];
            const value = acase[key];
            // validation
            if (adt[key] !== undefined) {
                throw new Error('duplicate key detected:' + key);
            }
            else if (key === 'cata') {
                throw new Error('cannot have a case named cata (sorry)');
            }
            else if (!isArray(value)) {
                // this implicitly checks if acase is an object
                throw new Error('case arguments must be an array');
            }
            constructors.push(key);
            //
            // constructor for key
            //
            adt[key] = (...args) => {
                const argLength = args.length;
                // validation
                if (argLength !== value.length) {
                    throw new Error('Wrong number of arguments to case ' + key + '. Expected ' + value.length + ' (' + value + '), got ' + argLength);
                }
                const match = (branches) => {
                    const branchKeys = keys(branches);
                    if (constructors.length !== branchKeys.length) {
                        throw new Error('Wrong number of arguments to match. Expected: ' + constructors.join(',') + '\nActual: ' + branchKeys.join(','));
                    }
                    const allReqd = forall(constructors, (reqKey) => {
                        return contains$2(branchKeys, reqKey);
                    });
                    if (!allReqd) {
                        throw new Error('Not all branches were specified when using match. Specified: ' + branchKeys.join(', ') + '\nRequired: ' + constructors.join(', '));
                    }
                    return branches[key].apply(null, args);
                };
                //
                // the fold function for key
                //
                return {
                    fold: (...foldArgs) => {
                        // runtime validation
                        if (foldArgs.length !== cases.length) {
                            throw new Error('Wrong number of arguments to fold. Expected ' + cases.length + ', got ' + foldArgs.length);
                        }
                        const target = foldArgs[count];
                        return target.apply(null, args);
                    },
                    match,
                    // NOTE: Only for debugging.
                    log: (label) => {
                        // eslint-disable-next-line no-console
                        console.log(label, {
                            constructors,
                            constructor: key,
                            params: args
                        });
                    }
                };
            };
        });
        return adt;
    };
    const Adt = {
        generate: generate$1
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

    const sort = (arr) => {
        return arr.slice(0).sort();
    };
    const reqMessage = (required, keys) => {
        throw new Error('All required keys (' + sort(required).join(', ') + ') were not specified. Specified keys were: ' + sort(keys).join(', ') + '.');
    };
    const unsuppMessage = (unsupported) => {
        throw new Error('Unsupported keys for object: ' + sort(unsupported).join(', '));
    };
    const validateStrArr = (label, array) => {
        if (!isArray(array)) {
            throw new Error('The ' + label + ' fields must be an array. Was: ' + array + '.');
        }
        each$2(array, (a) => {
            if (!isString(a)) {
                throw new Error('The value ' + a + ' in the ' + label + ' fields was not a string.');
            }
        });
    };
    const invalidTypeMessage = (incorrect, type) => {
        throw new Error('All values need to be of type: ' + type + '. Keys (' + sort(incorrect).join(', ') + ') were not.');
    };
    const checkDupes = (everything) => {
        const sorted = sort(everything);
        const dupe = find$1(sorted, (s, i) => {
            return i < sorted.length - 1 && s === sorted[i + 1];
        });
        dupe.each((d) => {
            throw new Error('The field: ' + d + ' occurs more than once in the combined fields: [' + sorted.join(', ') + '].');
        });
    };

    // Ensure that the object has all required fields. They must be functions.
    const base = (handleUnsupported, required) => {
        return baseWith(handleUnsupported, required, {
            validate: isFunction,
            label: 'function'
        });
    };
    // Ensure that the object has all required fields. They must satisy predicates.
    const baseWith = (handleUnsupported, required, pred) => {
        if (required.length === 0) {
            throw new Error('You must specify at least one required field.');
        }
        validateStrArr('required', required);
        checkDupes(required);
        return (obj) => {
            const keys$1 = keys(obj);
            // Ensure all required keys are present.
            const allReqd = forall(required, (req) => {
                return contains$2(keys$1, req);
            });
            if (!allReqd) {
                reqMessage(required, keys$1);
            }
            handleUnsupported(required, keys$1);
            const invalidKeys = filter$2(required, (key) => {
                return !pred.validate(obj[key], key);
            });
            if (invalidKeys.length > 0) {
                invalidTypeMessage(invalidKeys, pred.label);
            }
            return obj;
        };
    };
    const handleExact = (required, keys) => {
        const unsupported = filter$2(keys, (key) => {
            return !contains$2(required, key);
        });
        if (unsupported.length > 0) {
            unsuppMessage(unsupported);
        }
    };
    const exactly = (required) => base(handleExact, required);

    /**
     * Creates a new `Result<T, E>` that **does** contain a value.
     */
    const value$1 = (value) => {
        const applyHelper = (fn) => fn(value);
        const constHelper = constant(value);
        const outputHelper = () => output;
        const output = {
            // Debug info
            tag: true,
            inner: value,
            // Actual Result methods
            fold: (_onError, onValue) => onValue(value),
            isValue: always,
            isError: never,
            map: (mapper) => Result.value(mapper(value)),
            mapError: outputHelper,
            bind: applyHelper,
            exists: applyHelper,
            forall: applyHelper,
            getOr: constHelper,
            or: outputHelper,
            getOrThunk: constHelper,
            orThunk: outputHelper,
            getOrDie: constHelper,
            each: (fn) => {
                // Can't write the function inline because we don't want to return something by mistake
                fn(value);
            },
            toOptional: () => Optional.some(value),
        };
        return output;
    };
    /**
     * Creates a new `Result<T, E>` that **does not** contain a value, and therefore
     * contains an error.
     */
    const error = (error) => {
        const outputHelper = () => output;
        const output = {
            // Debug info
            tag: false,
            inner: error,
            // Actual Result methods
            fold: (onError, _onValue) => onError(error),
            isValue: never,
            isError: always,
            map: outputHelper,
            mapError: (mapper) => Result.error(mapper(error)),
            bind: outputHelper,
            exists: never,
            forall: always,
            getOr: identity,
            or: identity,
            getOrThunk: apply,
            orThunk: apply,
            getOrDie: die(String(error)),
            each: noop,
            toOptional: Optional.none,
        };
        return output;
    };
    /**
     * Creates a new `Result<T, E>` from an `Optional<T>` and an `E`. If the
     * `Optional` contains a value, so will the outputted `Result`. If it does not,
     * the outputted `Result` will contain an error (and that error will be the
     * error passed in).
     */
    const fromOption = (optional, err) => optional.fold(() => error(err), value$1);
    const Result = {
        value: value$1,
        error,
        fromOption
    };

    // Use window object as the global if it's available since CSP will block script evals
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const Global = typeof window !== 'undefined' ? window : Function('return this;')();

    // This API is intended to give the capability to return namespaced strings.
    // For CSS, since dots are not valid class names, the dots are turned into dashes.
    const css = (namespace) => {
        const dashNamespace = namespace.replace(/\./g, '-');
        const resolve = (str) => {
            return dashNamespace + '-' + str;
        };
        return {
            resolve
        };
    };

    /**
     * **Is** the value stored inside this Optional object equal to `rhs`?
     */
    const is$2 = (lhs, rhs, comparator = tripleEquals) => lhs.exists((left) => comparator(left, rhs));
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
    const bindFrom = (a, f) => (a !== undefined && a !== null) ? f(a) : Optional.none();
    // This can help with type inference, by specifying the type param on the none case, so the caller doesn't have to.
    const someIf = (b, a) => b ? Optional.some(a) : Optional.none();

    /** path :: ([String], JsObj?) -> JsObj */
    const path = (parts, scope) => {
        let o = scope !== undefined && scope !== null ? scope : Global;
        for (let i = 0; i < parts.length && o !== undefined && o !== null; ++i) {
            o = o[parts[i]];
        }
        return o;
    };
    /** resolve :: (String, JsObj?) -> JsObj */
    const resolve$2 = (p, scope) => {
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
    const contains$1 = (str, substr, start = 0, end) => {
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
    /** Does 'str' end with 'suffix'?
     *  Note: all strings end with the empty string.
     *        More formally, for all strings x, endsWith(x, "").
     *        This is so that for all strings x and y, endsWith(x + y, y)
     */
    const endsWith = (str, suffix) => {
        return checkRange(str, suffix, str.length - suffix.length);
    };
    const blank = (r) => (s) => s.replace(r, '');
    /** removes all leading and trailing spaces */
    const trim = blank(/^\s+|\s+$/g);
    const isNotEmpty = (s) => s.length > 0;
    const toFloat = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? Optional.none() : Optional.some(num);
    };

    // Run a function fn after rate ms. If another invocation occurs
    // during the time it is waiting, reschedule the function again
    // with the new arguments.
    const last$1 = (fn, rate) => {
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

    const nbsp = '\u00A0';

    const validSectionList = ['tfoot', 'thead', 'tbody', 'colgroup'];
    const isValidSection = (parentName) => contains$2(validSectionList, parentName);
    const grid = (rows, columns) => ({
        rows,
        columns
    });
    const address = (row, column) => ({
        row,
        column
    });
    const detail = (element, rowspan, colspan) => ({
        element,
        rowspan,
        colspan
    });
    const detailnew = (element, rowspan, colspan, isNew) => ({
        element,
        rowspan,
        colspan,
        isNew
    });
    const extended = (element, rowspan, colspan, row, column, isLocked) => ({
        element,
        rowspan,
        colspan,
        row,
        column,
        isLocked
    });
    const rowdetail = (element, cells, section) => ({
        element,
        cells,
        section
    });
    const rowdetailnew = (element, cells, section, isNew) => ({
        element,
        cells,
        section,
        isNew
    });
    const elementnew = (element, isNew, isLocked) => ({
        element,
        isNew,
        isLocked
    });
    const rowcells = (element, cells, section, isNew) => ({
        element,
        cells,
        section,
        isNew
    });
    const bounds = (startRow, startCol, finishRow, finishCol) => ({
        startRow,
        startCol,
        finishRow,
        finishCol
    });
    const columnext = (element, colspan, column) => ({
        element,
        colspan,
        column
    });
    const colgroup = (element, columns) => ({
        element,
        columns
    });

    const addCells = (gridRow, index, cells) => {
        const existingCells = gridRow.cells;
        const before = existingCells.slice(0, index);
        const after = existingCells.slice(index);
        const newCells = before.concat(cells).concat(after);
        return setCells(gridRow, newCells);
    };
    const addCell = (gridRow, index, cell) => addCells(gridRow, index, [cell]);
    const mutateCell = (gridRow, index, cell) => {
        const cells = gridRow.cells;
        cells[index] = cell;
    };
    const setCells = (gridRow, cells) => rowcells(gridRow.element, cells, gridRow.section, gridRow.isNew);
    const mapCells = (gridRow, f) => {
        const cells = gridRow.cells;
        const r = map$1(cells, f);
        return rowcells(gridRow.element, r, gridRow.section, gridRow.isNew);
    };
    const getCell = (gridRow, index) => gridRow.cells[index];
    const getCellElement = (gridRow, index) => getCell(gridRow, index).element;
    const cellLength = (gridRow) => gridRow.cells.length;
    const extractGridDetails = (grid) => {
        const result = partition(grid, (row) => row.section === 'colgroup');
        return {
            rows: result.fail,
            cols: result.pass
        };
    };
    const clone$2 = (gridRow, cloneRow, cloneCell) => {
        const newCells = map$1(gridRow.cells, cloneCell);
        return rowcells(cloneRow(gridRow.element), newCells, gridRow.section, true);
    };

    const fromHtml$1 = (html, scope) => {
        const doc = scope || document;
        const div = doc.createElement('div');
        div.innerHTML = html;
        if (!div.hasChildNodes() || div.childNodes.length > 1) {
            const message = 'HTML does not have a single root node';
            // eslint-disable-next-line no-console
            console.error(message, html);
            throw new Error(message);
        }
        return fromDom$1(div.childNodes[0]);
    };
    const fromTag = (tag, scope) => {
        const doc = scope || document;
        const node = doc.createElement(tag);
        return fromDom$1(node);
    };
    const fromText = (text, scope) => {
        const doc = scope || document;
        const node = doc.createTextNode(text);
        return fromDom$1(node);
    };
    const fromDom$1 = (node) => {
        // TODO: Consider removing this check, but left atm for safety
        if (node === null || node === undefined) {
            throw new Error('Node cannot be null or undefined');
        }
        return {
            dom: node
        };
    };
    const fromPoint$1 = (docElm, x, y) => Optional.from(docElm.dom.elementFromPoint(x, y)).map(fromDom$1);
    // tslint:disable-next-line:variable-name
    const SugarElement = {
        fromHtml: fromHtml$1,
        fromTag,
        fromText,
        fromDom: fromDom$1,
        fromPoint: fromPoint$1
    };

    const selectNode = (win, element) => {
        const rng = win.document.createRange();
        rng.selectNode(element.dom);
        return rng;
    };
    const selectNodeContents = (win, element) => {
        const rng = win.document.createRange();
        selectNodeContentsUsing(rng, element);
        return rng;
    };
    const selectNodeContentsUsing = (rng, element) => rng.selectNodeContents(element.dom);
    // NOTE: Mutates the range.
    const setStart = (rng, situ) => {
        situ.fold((e) => {
            rng.setStartBefore(e.dom);
        }, (e, o) => {
            rng.setStart(e.dom, o);
        }, (e) => {
            rng.setStartAfter(e.dom);
        });
    };
    const setFinish = (rng, situ) => {
        situ.fold((e) => {
            rng.setEndBefore(e.dom);
        }, (e, o) => {
            rng.setEnd(e.dom, o);
        }, (e) => {
            rng.setEndAfter(e.dom);
        });
    };
    const relativeToNative = (win, startSitu, finishSitu) => {
        const range = win.document.createRange();
        setStart(range, startSitu);
        setFinish(range, finishSitu);
        return range;
    };
    const exactToNative = (win, start, soffset, finish, foffset) => {
        const rng = win.document.createRange();
        rng.setStart(start.dom, soffset);
        rng.setEnd(finish.dom, foffset);
        return rng;
    };
    const toRect = (rect) => ({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
    });
    const getFirstRect$1 = (rng) => {
        const rects = rng.getClientRects();
        // ASSUMPTION: The first rectangle is the start of the selection
        const rect = rects.length > 0 ? rects[0] : rng.getBoundingClientRect();
        return rect.width > 0 || rect.height > 0 ? Optional.some(rect).map(toRect) : Optional.none();
    };

    const adt$6 = Adt.generate([
        { ltr: ['start', 'soffset', 'finish', 'foffset'] },
        { rtl: ['start', 'soffset', 'finish', 'foffset'] }
    ]);
    const fromRange = (win, type, range) => type(SugarElement.fromDom(range.startContainer), range.startOffset, SugarElement.fromDom(range.endContainer), range.endOffset);
    const getRanges = (win, selection) => selection.match({
        domRange: (rng) => {
            return {
                ltr: constant(rng),
                rtl: Optional.none
            };
        },
        relative: (startSitu, finishSitu) => {
            return {
                ltr: cached(() => relativeToNative(win, startSitu, finishSitu)),
                rtl: cached(() => Optional.some(relativeToNative(win, finishSitu, startSitu)))
            };
        },
        exact: (start, soffset, finish, foffset) => {
            return {
                ltr: cached(() => exactToNative(win, start, soffset, finish, foffset)),
                rtl: cached(() => Optional.some(exactToNative(win, finish, foffset, start, soffset)))
            };
        }
    });
    const doDiagnose = (win, ranges) => {
        // If we cannot create a ranged selection from start > finish, it could be RTL
        const rng = ranges.ltr();
        if (rng.collapsed) {
            // Let's check if it's RTL ... if it is, then reversing the direction will not be collapsed
            const reversed = ranges.rtl().filter((rev) => rev.collapsed === false);
            return reversed.map((rev) => 
            // We need to use "reversed" here, because the original only has one point (collapsed)
            adt$6.rtl(SugarElement.fromDom(rev.endContainer), rev.endOffset, SugarElement.fromDom(rev.startContainer), rev.startOffset)).getOrThunk(() => fromRange(win, adt$6.ltr, rng));
        }
        else {
            return fromRange(win, adt$6.ltr, rng);
        }
    };
    const diagnose = (win, selection) => {
        const ranges = getRanges(win, selection);
        return doDiagnose(win, ranges);
    };
    const asLtrRange = (win, selection) => {
        const diagnosis = diagnose(win, selection);
        return diagnosis.match({
            ltr: (start, soffset, finish, foffset) => {
                const rng = win.document.createRange();
                rng.setStart(start.dom, soffset);
                rng.setEnd(finish.dom, foffset);
                return rng;
            },
            rtl: (start, soffset, finish, foffset) => {
                // NOTE: Reversing start and finish
                const rng = win.document.createRange();
                rng.setStart(finish.dom, foffset);
                rng.setEnd(start.dom, soffset);
                return rng;
            }
        });
    };
    adt$6.ltr;
    adt$6.rtl;

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
    const all$1 = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? [] : map$1(base.querySelectorAll(selector), SugarElement.fromDom);
    };
    const one = (selector, scope) => {
        const base = scope === undefined ? document : scope.dom;
        return bypassSelector(base) ? Optional.none() : Optional.from(base.querySelector(selector)).map(SugarElement.fromDom);
    };

    const eq$1 = (e1, e2) => e1.dom === e2.dom;
    // Returns: true if node e1 contains e2, otherwise false.
    // (returns false if e1===e2: A node does not contain itself).
    const contains = (e1, e2) => {
        const d1 = e1.dom;
        const d2 = e2.dom;
        return d1 === d2 ? false : d1.contains(d2);
    };
    const is = is$1;

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
    const detect$5 = (versionRegexes, agent) => {
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
        detect: detect$5,
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

    const detect$4 = (candidates, userAgent) => {
        const agent = String(userAgent).toLowerCase();
        return find$1(candidates, (candidate) => {
            return candidate.search(agent);
        });
    };
    // They (browser and os) are the same at the moment, but they might
    // not stay that way.
    const detectBrowser = (browsers, userAgent) => {
        return detect$4(browsers, userAgent).map((browser) => {
            const version = Version.detect(browser.versionRegexes, userAgent);
            return {
                current: browser.name,
                version
            };
        });
    };
    const detectOs = (oses, userAgent) => {
        return detect$4(oses, userAgent).map((os) => {
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
            return contains$1(uastring, target);
        };
    };
    const browsers = [
        // This is legacy Edge
        {
            name: 'Edge',
            versionRegexes: [/.*?edge\/ ?([0-9]+)\.([0-9]+)$/],
            search: (uastring) => {
                return contains$1(uastring, 'edge/') && contains$1(uastring, 'chrome') && contains$1(uastring, 'safari') && contains$1(uastring, 'applewebkit');
            }
        },
        // This is Google Chrome and Chromium Edge
        {
            name: 'Chromium',
            brand: 'Chromium',
            versionRegexes: [/.*?chrome\/([0-9]+)\.([0-9]+).*/, normalVersionRegex],
            search: (uastring) => {
                return contains$1(uastring, 'chrome') && !contains$1(uastring, 'chromeframe');
            }
        },
        {
            name: 'IE',
            versionRegexes: [/.*?msie\ ?([0-9]+)\.([0-9]+).*/, /.*?rv:([0-9]+)\.([0-9]+).*/],
            search: (uastring) => {
                return contains$1(uastring, 'msie') || contains$1(uastring, 'trident');
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
                return (contains$1(uastring, 'safari') || contains$1(uastring, 'mobile/')) && contains$1(uastring, 'applewebkit');
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
                return contains$1(uastring, 'iphone') || contains$1(uastring, 'ipad');
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

    const detect$3 = (userAgent, userAgentDataOpt, mediaMatch) => {
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
        detect: detect$3
    };

    const mediaMatch = (query) => window.matchMedia(query).matches;
    // IMPORTANT: Must be in a thunk, otherwise rollup thinks calling this immediately
    // causes side effects and won't tree shake this away
    // Note: navigator.userAgentData is not part of the native typescript types yet
    let platform = cached(() => PlatformDetection.detect(window.navigator.userAgent, Optional.from((window.navigator.userAgentData)), mediaMatch));
    const detect$2 = () => platform();

    const unsafe = (name, scope) => {
        return resolve$2(name, scope);
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
        const scope = resolve$2('ownerDocument.defaultView', x);
        // TINY-7374: We can't rely on looking at the owner window HTMLElement as the element may have
        // been constructed in a different window and then appended to the current window document.
        return isObject(x) && (sandHTMLElement(scope).prototype.isPrototypeOf(x) || /^HTML\w*Element$/.test(getPrototypeOf(x).constructor.name));
    };

    const name = (element) => {
        const r = element.dom.nodeName;
        return r.toLowerCase();
    };
    const type = (element) => element.dom.nodeType;
    const isType = (t) => (element) => type(element) === t;
    const isComment = (element) => type(element) === COMMENT || name(element) === '#comment';
    const isHTMLElement = (element) => isElement(element) && isPrototypeOf(element.dom);
    const isElement = isType(ELEMENT);
    const isText = isType(TEXT);
    const isDocument = isType(DOCUMENT);
    const isDocumentFragment = isType(DOCUMENT_FRAGMENT);
    const isTag = (tag) => (e) => isElement(e) && name(e) === tag;

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
    const documentElement = (element) => SugarElement.fromDom(documentOrOwner(element).dom.documentElement);
    /**
     * The window element associated with the element
     * NOTE: this will throw if the defaultView is null.
     */
    const defaultView = (element) => SugarElement.fromDom(documentOrOwner(element).dom.defaultView);
    const parent = (element) => Optional.from(element.dom.parentNode).map(SugarElement.fromDom);
    const parentElement = (element) => Optional.from(element.dom.parentElement).map(SugarElement.fromDom);
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
    const children$2 = (element) => map$1(element.dom.childNodes, SugarElement.fromDom);
    const child$2 = (element, index) => {
        const cs = element.dom.childNodes;
        return Optional.from(cs[index]).map(SugarElement.fromDom);
    };
    const firstChild = (element) => child$2(element, 0);

    const makeRange = (start, soffset, finish, foffset) => {
        const doc = owner(start);
        // TODO: We need to think about a better place to put native range creation code. Does it even belong in sugar?
        // Could the `Compare` checks (node.compareDocumentPosition) handle these situations better?
        const rng = doc.dom.createRange();
        rng.setStart(start.dom, soffset);
        rng.setEnd(finish.dom, foffset);
        return rng;
    };
    const after$5 = (start, soffset, finish, foffset) => {
        const r = makeRange(start, soffset, finish, foffset);
        const same = eq$1(start, finish) && soffset === foffset;
        return r.collapsed && !same;
    };

    /**
     * Is the element a ShadowRoot?
     *
     * Note: this is insufficient to test if any element is a shadow root, but it is sufficient to differentiate between
     * a Document and a ShadowRoot.
     */
    const isShadowRoot = (dos) => isDocumentFragment(dos) && isNonNullable(dos.dom.host);
    const getRootNode = (e) => SugarElement.fromDom(e.dom.getRootNode());
    /** Where content needs to go. ShadowRoot or document body */
    const getContentContainer = (dos) => 
    // Can't use SugarBody.body without causing a circular module reference (since SugarBody.inBody uses SugarShadowDom)
    isShadowRoot(dos) ? dos : SugarElement.fromDom(documentOrOwner(dos).dom.body);
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
    const fromRawEvent$1 = (rawEvent) => {
        const target = SugarElement.fromDom(getOriginalEventTarget(rawEvent).getOr(rawEvent.target));
        const stop = () => rawEvent.stopPropagation();
        const prevent = () => rawEvent.preventDefault();
        const kill = compose(prevent, stop); // more of a sequence than a compose, but same effect
        // FIX: Don't just expose the raw event. Need to identify what needs standardisation.
        return mkEvent(target, rawEvent.clientX, rawEvent.clientY, stop, prevent, kill, rawEvent);
    };
    const handle$1 = (filter, handler) => (rawEvent) => {
        if (filter(rawEvent)) {
            handler(fromRawEvent$1(rawEvent));
        }
    };
    const binder = (element, event, filter, handler, useCapture) => {
        const wrapped = handle$1(filter, handler);
        // IE9 minimum
        element.dom.addEventListener(event, wrapped, useCapture);
        return {
            unbind: curry(unbind, element, event, wrapped, useCapture)
        };
    };
    const bind$1 = (element, event, filter, handler) => binder(element, event, filter, handler, false);
    const unbind = (element, event, handler, useCapture) => {
        // IE9 minimum
        element.dom.removeEventListener(event, handler, useCapture);
    };

    const filter = always; // no filter on plain DomEvents
    const bind = (element, event, handler) => bind$1(element, event, filter, handler);
    const fromRawEvent = fromRawEvent$1;

    const before$3 = (marker, element) => {
        const parent$1 = parent(marker);
        parent$1.each((v) => {
            v.dom.insertBefore(element.dom, marker.dom);
        });
    };
    const after$4 = (marker, element) => {
        const sibling = nextSibling(marker);
        sibling.fold(() => {
            const parent$1 = parent(marker);
            parent$1.each((v) => {
                append$1(v, element);
            });
        }, (v) => {
            before$3(v, element);
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
    const appendAt = (parent, element, index) => {
        child$2(parent, index).fold(() => {
            append$1(parent, element);
        }, (v) => {
            before$3(v, element);
        });
    };
    const wrap = (element, wrapper) => {
        before$3(element, wrapper);
        append$1(wrapper, element);
    };

    const after$3 = (marker, elements) => {
        each$2(elements, (x, i) => {
            const e = i === 0 ? marker : elements[i - 1];
            after$4(e, x);
        });
    };
    const append = (parent, elements) => {
        each$2(elements, (x) => {
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
    const setAll$1 = (element, attrs) => {
        const dom = element.dom;
        each$1(attrs, (v, k) => {
            rawSet(dom, k, v);
        });
    };
    const setOptions = (element, attrs) => {
        each$1(attrs, (v, k) => {
            v.fold(() => {
                remove$6(element, k);
            }, (value) => {
                rawSet(element.dom, k, value);
            });
        });
    };
    const get$b = (element, key) => {
        const v = element.dom.getAttribute(key);
        // undefined is the more appropriate value for JS, and this matches JQuery
        return v === null ? undefined : v;
    };
    const getOpt = (element, key) => Optional.from(get$b(element, key));
    const remove$6 = (element, key) => {
        element.dom.removeAttribute(key);
    };
    const clone$1 = (element) => foldl(element.dom.attributes, (acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
    }, {});

    const empty = (element) => {
        // shortcut "empty node" trick. Requires IE 9.
        element.dom.textContent = '';
        // If the contents was a single empty text node, the above doesn't remove it. But, it's still faster in general
        // than removing every child node manually.
        // The following is (probably) safe for performance as 99.9% of the time the trick works and
        // Traverse.children will return an empty array.
        each$2(children$2(element), (rogue) => {
            remove$5(rogue);
        });
    };
    const remove$5 = (element) => {
        const dom = element.dom;
        if (dom.parentNode !== null) {
            dom.parentNode.removeChild(dom);
        }
    };
    const unwrap = (wrapper) => {
        const children = children$2(wrapper);
        if (children.length > 0) {
            after$3(wrapper, children);
        }
        remove$5(wrapper);
    };

    const clone = (original, isDeep) => SugarElement.fromDom(original.dom.cloneNode(isDeep));
    /** Shallow clone - just the tag, no children */
    const shallow = (original) => clone(original, false);
    /** Deep clone - everything copied including children */
    const deep = (original) => clone(original, true);
    /** Shallow clone, with a new tag */
    const shallowAs = (original, tag) => {
        const nu = SugarElement.fromTag(tag);
        const attributes = clone$1(original);
        setAll$1(nu, attributes);
        return nu;
    };
    /** Deep clone, with a new tag */
    const copy$2 = (original, tag) => {
        const nu = shallowAs(original, tag);
        // NOTE
        // previously this used serialisation:
        // nu.dom.innerHTML = original.dom.innerHTML;
        //
        // Clone should be equivalent (and faster), but if TD <-> TH toggle breaks, put it back.
        const cloneChildren = children$2(deep(original));
        append(nu, cloneChildren);
        return nu;
    };
    /** Change the tag name, but keep all children */
    const mutate$1 = (original, tag) => {
        const nu = shallowAs(original, tag);
        after$4(original, nu);
        const children = children$2(original);
        append(nu, children);
        remove$5(original);
        return nu;
    };

    const fromHtml = (html, scope) => {
        const doc = scope || document;
        const div = doc.createElement('div');
        div.innerHTML = html;
        return children$2(SugarElement.fromDom(div));
    };
    const fromDom = (nodes) => map$1(nodes, SugarElement.fromDom);

    const get$a = (element) => element.dom.innerHTML;
    const getOuter$2 = (element) => {
        const container = SugarElement.fromTag('div');
        const clone = SugarElement.fromDom(element.dom.cloneNode(true));
        append$1(container, clone);
        return get$a(container);
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
    const getBody$1 = (doc) => {
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
    const setAll = (element, css) => {
        const dom = element.dom;
        each$1(css, (v, k) => {
            internalSet(dom, k, v);
        });
    };
    /*
     * NOTE: For certain properties, this returns the "used value" which is subtly different to the "computed value" (despite calling getComputedStyle).
     * Blame CSS 2.0.
     *
     * https://developer.mozilla.org/en-US/docs/Web/CSS/used_value
     */
    const get$9 = (element, property) => {
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
    const getRaw$2 = (element, property) => {
        const dom = element.dom;
        const raw = getUnsafeProperty(dom, property);
        return Optional.from(raw).filter((r) => r.length > 0);
    };
    const remove$4 = (element, property) => {
        const dom = element.dom;
        internalRemove(dom, property);
        if (is$2(getOpt(element, 'style').map(trim), '')) {
            // No more styles left, remove the style attribute as well
            remove$6(element, 'style');
        }
    };
    const copy$1 = (source, target) => {
        const sourceDom = source.dom;
        const targetDom = target.dom;
        if (isSupported(sourceDom) && isSupported(targetDom)) {
            targetDom.style.cssText = sourceDom.style.cssText;
        }
    };

    const Dimension = (name, getOffset) => {
        const set = (element, h) => {
            if (!isNumber(h) && !h.match(/^[0-9]+$/)) {
                throw new Error(name + '.set accepts only positive integer values. Value was ' + h);
            }
            const dom = element.dom;
            if (isSupported(dom)) {
                dom.style[name] = h + 'px';
            }
        };
        /*
         * jQuery supports querying width and height on the document and window objects.
         *
         * TBIO doesn't do this, so the code is removed to save space, but left here just in case.
         */
        /*
        var getDocumentWidth = (element) => {
          var dom = element.dom;
          if (Node.isDocument(element)) {
            var body = dom.body;
            var doc = dom.documentElement;
            return Math.max(
              body.scrollHeight,
              doc.scrollHeight,
              body.offsetHeight,
              doc.offsetHeight,
              doc.clientHeight
            );
          }
        };
      
        var getWindowWidth = (element) => {
          var dom = element.dom;
          if (dom.window === dom) {
            // There is no offsetHeight on a window, so use the clientHeight of the document
            return dom.document.documentElement.clientHeight;
          }
        };
      */
        const get = (element) => {
            const r = getOffset(element);
            // zero or null means non-standard or disconnected, fall back to CSS
            if (r <= 0 || r === null) {
                const css = get$9(element, name);
                // ugh this feels dirty, but it saves cycles
                return parseFloat(css) || 0;
            }
            return r;
        };
        // in jQuery, getOuter replicates (or uses) box-sizing: border-box calculations
        // although these calculations only seem relevant for quirks mode, and edge cases TBIO doesn't rely on
        const getOuter = get;
        const aggregate = (element, properties) => foldl(properties, (acc, property) => {
            const val = get$9(element, property);
            const value = val === undefined ? 0 : parseInt(val, 10);
            return isNaN(value) ? acc : acc + value;
        }, 0);
        const max = (element, value, properties) => {
            const cumulativeInclusions = aggregate(element, properties);
            // if max-height is 100px and your cumulativeInclusions is 150px, there is no way max-height can be 100px, so we return 0.
            const absoluteMax = value > cumulativeInclusions ? value - cumulativeInclusions : 0;
            return absoluteMax;
        };
        return {
            set,
            get,
            getOuter,
            aggregate,
            max
        };
    };

    const toNumber = (px, fallback) => toFloat(px).getOr(fallback);
    const getProp = (element, name, fallback) => toNumber(get$9(element, name), fallback);
    const calcContentBoxSize = (element, size, upper, lower) => {
        const paddingUpper = getProp(element, `padding-${upper}`, 0);
        const paddingLower = getProp(element, `padding-${lower}`, 0);
        const borderUpper = getProp(element, `border-${upper}-width`, 0);
        const borderLower = getProp(element, `border-${lower}-width`, 0);
        return size - paddingUpper - paddingLower - borderUpper - borderLower;
    };
    const getCalculatedWidth = (element, boxSizing) => {
        const dom = element.dom;
        const width = dom.getBoundingClientRect().width || dom.offsetWidth;
        return boxSizing === 'border-box' ? width : calcContentBoxSize(element, width, 'left', 'right');
    };
    const getHeight$1 = (element) => getProp(element, 'height', element.dom.offsetHeight);
    const getWidth = (element) => getProp(element, 'width', element.dom.offsetWidth);
    const getInnerWidth = (element) => getCalculatedWidth(element, 'content-box');

    const api$2 = Dimension('height', (element) => {
        // getBoundingClientRect gives better results than offsetHeight for tables with captions on Firefox
        const dom = element.dom;
        return inBody(element) ? dom.getBoundingClientRect().height : dom.offsetHeight;
    });
    const get$8 = (element) => api$2.get(element);
    const getOuter$1 = (element) => api$2.getOuter(element);
    const getRuntime$1 = getHeight$1;

    const api$1 = Dimension('width', (element) => {
        const dom = element.dom;
        return inBody(element) ? dom.getBoundingClientRect().width : dom.offsetWidth;
    });
    const get$7 = (element) => api$1.get(element);
    const getOuter = (element) => api$1.getOuter(element);
    const getInner = getInnerWidth;
    const getRuntime = getWidth;

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

    const boxPosition = (dom) => {
        const box = dom.getBoundingClientRect();
        return SugarPosition(box.left, box.top);
    };
    // Avoids falsy false fallthrough
    const firstDefinedOrZero = (a, b) => {
        if (a !== undefined) {
            return a;
        }
        else {
            return b !== undefined ? b : 0;
        }
    };
    const absolute = (element) => {
        const doc = element.dom.ownerDocument;
        const body = doc.body;
        const win = doc.defaultView;
        const html = doc.documentElement;
        if (body === element.dom) {
            return SugarPosition(body.offsetLeft, body.offsetTop);
        }
        const scrollTop = firstDefinedOrZero(win?.pageYOffset, html.scrollTop);
        const scrollLeft = firstDefinedOrZero(win?.pageXOffset, html.scrollLeft);
        const clientTop = firstDefinedOrZero(html.clientTop, body.clientTop);
        const clientLeft = firstDefinedOrZero(html.clientLeft, body.clientLeft);
        return viewport(element).translate(scrollLeft - clientLeft, scrollTop - clientTop);
    };
    const viewport = (element) => {
        const dom = element.dom;
        const doc = dom.ownerDocument;
        const body = doc.body;
        if (body === dom) {
            return SugarPosition(body.offsetLeft, body.offsetTop);
        }
        if (!inBody(element)) {
            return SugarPosition(0, 0);
        }
        return boxPosition(dom);
    };

    // get scroll position (x,y) relative to document _doc (or global if not supplied)
    const get$6 = (_DOC) => {
        const doc = _DOC !== undefined ? _DOC.dom : document;
        // ASSUMPTION: This is for cross-browser support, body works for Safari & EDGE, and when we have an iframe body scroller
        const x = doc.body.scrollLeft || doc.documentElement.scrollLeft;
        const y = doc.body.scrollTop || doc.documentElement.scrollTop;
        return SugarPosition(x, y);
    };
    // Scroll content by (x,y) relative to document _doc (or global if not supplied)
    const by = (x, y, _DOC) => {
        const doc = _DOC !== undefined ? _DOC.dom : document;
        const win = doc.defaultView;
        if (win) {
            win.scrollBy(x, y);
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
    const get$5 = (element) => api.get(element);
    const getOption = (element) => api.getOption(element);
    const set = (element, value) => api.set(element, value);

    const onDirection = (isLtr, isRtl) => (element) => getDirection(element) === 'rtl' ? isRtl : isLtr;
    const getDirection = (element) => get$9(element, 'direction') === 'rtl' ? 'rtl' : 'ltr';

    // Methods for handling attributes that contain a list of values <div foo="alpha beta theta">
    const read = (element, attr) => {
        const value = get$b(element, attr);
        return value === undefined || value === '' ? [] : value.split(' ');
    };
    const add$3 = (element, attr, id) => {
        const old = read(element, attr);
        const nu = old.concat([id]);
        set$2(element, attr, nu.join(' '));
        return true;
    };
    const remove$3 = (element, attr, id) => {
        const nu = filter$2(read(element, attr), (v) => v !== id);
        if (nu.length > 0) {
            set$2(element, attr, nu.join(' '));
        }
        else {
            remove$6(element, attr);
        }
        return false;
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

    const ancestor$2 = (scope, predicate, isRoot) => {
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
        return ClosestOrAncestor(is, ancestor$2, scope, predicate, isRoot);
    };
    const child$1 = (scope, predicate) => {
        const pred = (node) => predicate(SugarElement.fromDom(node));
        const result = find$1(scope.dom.childNodes, pred);
        return result.map(SugarElement.fromDom);
    };
    const descendant$1 = (scope, predicate) => {
        const descend = (node) => {
            // tslint:disable-next-line:prefer-for-of
            for (let i = 0; i < node.childNodes.length; i++) {
                const child = SugarElement.fromDom(node.childNodes[i]);
                if (predicate(child)) {
                    return Optional.some(child);
                }
                const res = descend(node.childNodes[i]);
                if (res.isSome()) {
                    return res;
                }
            }
            return Optional.none();
        };
        return descend(scope.dom);
    };

    const ancestor$1 = (scope, selector, isRoot) => ancestor$2(scope, (e) => is$1(e, selector), isRoot);
    const child = (scope, selector) => child$1(scope, (e) => is$1(e, selector));
    const descendant = (scope, selector) => one(selector, scope);
    // Returns Some(closest ancestor element (sugared)) matching 'selector' up to isRoot, or None() otherwise
    const closest$1 = (scope, selector, isRoot) => {
        const is = (element, selector) => is$1(element, selector);
        return ClosestOrAncestor(is, ancestor$1, scope, selector, isRoot);
    };

    // IE11 Can return undefined for a classList on elements such as math, so we make sure it's not undefined before attempting to use it.
    const supports = (element) => element.dom.classList !== undefined;
    const get$4 = (element) => read(element, 'class');
    const add$2 = (element, clazz) => add$3(element, 'class', clazz);
    const remove$2 = (element, clazz) => remove$3(element, 'class', clazz);

    /*
     * ClassList is IE10 minimum:
     * https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
     *
     * Note that IE doesn't support the second argument to toggle (at all).
     * If it did, the toggler could be better.
     */
    const add$1 = (element, clazz) => {
        if (supports(element)) {
            element.dom.classList.add(clazz);
        }
        else {
            add$2(element, clazz);
        }
    };
    const cleanClass = (element) => {
        const classList = supports(element) ? element.dom.classList : get$4(element);
        // classList is a "live list", so this is up to date already
        if (classList.length === 0) {
            // No more classes left, remove the class attribute as well
            remove$6(element, 'class');
        }
    };
    const remove$1 = (element, clazz) => {
        if (supports(element)) {
            const classList = element.dom.classList;
            classList.remove(clazz);
        }
        else {
            remove$2(element, clazz);
        }
        cleanClass(element);
    };
    const has = (element, clazz) => supports(element) && element.dom.classList.contains(clazz);

    const remove = (element, classes) => {
        each$2(classes, (x) => {
            remove$1(element, x);
        });
    };

    const closest = (target) => closest$1(target, '[contenteditable]');
    const isEditable$1 = (element, assumeEditable = false) => {
        if (inBody(element)) {
            return element.dom.isContentEditable;
        }
        else {
            // Find the closest contenteditable element and check if it's editable
            return closest(element).fold(constant(assumeEditable), (editable) => getRaw$1(editable) === 'true');
        }
    };
    const getRaw$1 = (element) => element.dom.contentEditable;

    const addClass = (clazz) => (element) => {
        add$1(element, clazz);
    };
    const removeClasses = (classes) => (element) => {
        remove(element, classes);
    };

    const ancestors$4 = (scope, predicate, isRoot) => filter$2(parents(scope, isRoot), predicate);
    const children$1 = (scope, predicate) => filter$2(children$2(scope), predicate);
    const descendants$1 = (scope, predicate) => {
        let result = [];
        // Recurse.toArray() might help here
        each$2(children$2(scope), (x) => {
            if (predicate(x)) {
                result = result.concat([x]);
            }
            result = result.concat(descendants$1(x, predicate));
        });
        return result;
    };

    // For all of the following:
    //
    // jQuery does siblings of firstChild. IE9+ supports scope.dom.children (similar to Traverse.children but elements only).
    // Traverse should also do this (but probably not by default).
    //
    const ancestors$3 = (scope, selector, isRoot) => 
    // It may surprise you to learn this is exactly what JQuery does
    // TODO: Avoid all this wrapping and unwrapping
    ancestors$4(scope, (e) => is$1(e, selector), isRoot);
    const children = (scope, selector) => 
    // It may surprise you to learn this is exactly what JQuery does
    // TODO: Avoid all the wrapping and unwrapping
    children$1(scope, (e) => is$1(e, selector));
    const descendants = (scope, selector) => all$1(selector, scope);

    const inParent = (parent, children, element, index) => ({
        parent,
        children,
        element,
        index
    });
    const indexInParent = (element) => parent(element).bind((parent) => {
        const children = children$2(parent);
        return indexOf(children, element).map((index) => inParent(parent, children, element, index));
    });
    const indexOf = (elements, element) => findIndex(elements, curry(eq$1, element));

    const ancestor = (scope, predicate, isRoot) => ancestor$2(scope, predicate, isRoot).isSome();

    const getEnd = (element) => name(element) === 'img' ? 1 : getOption(element).fold(() => children$2(element).length, (v) => v.length);
    const isTextNodeWithCursorPosition = (el) => getOption(el).filter((text) => 
    // For the purposes of finding cursor positions only allow text nodes with content,
    // but trim removes &nbsp; and that's allowed
    text.trim().length !== 0 || text.indexOf(nbsp) > -1).isSome();
    const isContentEditableFalse = (elem) => isHTMLElement(elem) && (get$b(elem, 'contenteditable') === 'false');
    const elementsWithCursorPosition = ['img', 'br'];
    const isCursorPosition = (elem) => {
        const hasCursorPosition = isTextNodeWithCursorPosition(elem);
        return hasCursorPosition || contains$2(elementsWithCursorPosition, name(elem)) || isContentEditableFalse(elem);
    };

    const first = (element) => descendant$1(element, isCursorPosition);
    const last = (element) => descendantRtl(element, isCursorPosition);
    // Note, sugar probably needs some RTL traversals.
    const descendantRtl = (scope, predicate) => {
        const descend = (element) => {
            const children = children$2(element);
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i];
                if (predicate(child)) {
                    return Optional.some(child);
                }
                const res = descend(child);
                if (res.isSome()) {
                    return res;
                }
            }
            return Optional.none();
        };
        return descend(scope);
    };

    const create$4 = (start, soffset, finish, foffset) => ({
        start,
        soffset,
        finish,
        foffset
    });
    // tslint:disable-next-line:variable-name
    const SimRange = {
        create: create$4
    };

    const adt$5 = Adt.generate([
        { before: ['element'] },
        { on: ['element', 'offset'] },
        { after: ['element'] }
    ]);
    // Probably don't need this given that we now have "match"
    const cata$1 = (subject, onBefore, onOn, onAfter) => subject.fold(onBefore, onOn, onAfter);
    const getStart$1 = (situ) => situ.fold(identity, identity, identity);
    const before$2 = adt$5.before;
    const on = adt$5.on;
    const after$2 = adt$5.after;
    // tslint:disable-next-line:variable-name
    const Situ = {
        before: before$2,
        on,
        after: after$2,
        cata: cata$1,
        getStart: getStart$1
    };

    // Consider adding a type for "element"
    const adt$4 = Adt.generate([
        { domRange: ['rng'] },
        { relative: ['startSitu', 'finishSitu'] },
        { exact: ['start', 'soffset', 'finish', 'foffset'] }
    ]);
    const exactFromRange = (simRange) => adt$4.exact(simRange.start, simRange.soffset, simRange.finish, simRange.foffset);
    const getStart = (selection) => selection.match({
        domRange: (rng) => SugarElement.fromDom(rng.startContainer),
        relative: (startSitu, _finishSitu) => Situ.getStart(startSitu),
        exact: (start, _soffset, _finish, _foffset) => start
    });
    const domRange = adt$4.domRange;
    const relative = adt$4.relative;
    const exact = adt$4.exact;
    const getWin = (selection) => {
        const start = getStart(selection);
        return defaultView(start);
    };
    // This is out of place but it's API so I can't remove it
    const range = SimRange.create;
    // tslint:disable-next-line:variable-name
    const SimSelection = {
        domRange,
        relative,
        exact,
        exactFromRange,
        getWin,
        range
    };

    const caretPositionFromPoint = (doc, x, y) => Optional.from(doc.caretPositionFromPoint?.(x, y))
        .bind((pos) => {
        // It turns out that Firefox can return null for pos.offsetNode
        if (pos.offsetNode === null) {
            return Optional.none();
        }
        const r = doc.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.collapse();
        return Optional.some(r);
    });
    const caretRangeFromPoint = (doc, x, y) => Optional.from(doc.caretRangeFromPoint?.(x, y));
    const availableSearch = (doc, x, y) => {
        if (doc.caretPositionFromPoint) {
            return caretPositionFromPoint(doc, x, y); // defined standard, firefox only
        }
        else if (doc.caretRangeFromPoint) {
            return caretRangeFromPoint(doc, x, y); // webkit/blink implementation
        }
        else {
            return Optional.none(); // unsupported browser
        }
    };
    const fromPoint = (win, x, y) => {
        const doc = win.document;
        return availableSearch(doc, x, y).map((rng) => SimRange.create(SugarElement.fromDom(rng.startContainer), rng.startOffset, SugarElement.fromDom(rng.endContainer), rng.endOffset));
    };

    const beforeSpecial = (element, offset) => {
        // From memory, we don't want to use <br> directly on Firefox because it locks the keyboard input.
        // It turns out that <img> directly on IE locks the keyboard as well.
        // If the offset is 0, use before. If the offset is 1, use after.
        // TBIO-3889: Firefox Situ.on <input> results in a child of the <input>; Situ.before <input> results in platform inconsistencies
        const name$1 = name(element);
        if ('input' === name$1) {
            return Situ.after(element);
        }
        else if (!contains$2(['br', 'img'], name$1)) {
            return Situ.on(element, offset);
        }
        else {
            return offset === 0 ? Situ.before(element) : Situ.after(element);
        }
    };
    const preprocessRelative = (startSitu, finishSitu) => {
        const start = startSitu.fold(Situ.before, beforeSpecial, Situ.after);
        const finish = finishSitu.fold(Situ.before, beforeSpecial, Situ.after);
        return SimSelection.relative(start, finish);
    };
    const preprocessExact = (start, soffset, finish, foffset) => {
        const startSitu = beforeSpecial(start, soffset);
        const finishSitu = beforeSpecial(finish, foffset);
        return SimSelection.relative(startSitu, finishSitu);
    };

    const getNativeSelection = (win) => Optional.from(win.getSelection());
    const doSetNativeRange = (win, rng) => {
        getNativeSelection(win).each((selection) => {
            selection.removeAllRanges();
            selection.addRange(rng);
        });
    };
    const doSetRange = (win, start, soffset, finish, foffset) => {
        const rng = exactToNative(win, start, soffset, finish, foffset);
        doSetNativeRange(win, rng);
    };
    const setLegacyRtlRange = (win, selection, start, soffset, finish, foffset) => {
        selection.collapse(start.dom, soffset);
        selection.extend(finish.dom, foffset);
    };
    const setRangeFromRelative = (win, relative) => diagnose(win, relative).match({
        ltr: (start, soffset, finish, foffset) => {
            doSetRange(win, start, soffset, finish, foffset);
        },
        rtl: (start, soffset, finish, foffset) => {
            getNativeSelection(win).each((selection) => {
                // If this selection is backwards, then we need to use extend.
                if (selection.setBaseAndExtent) {
                    selection.setBaseAndExtent(start.dom, soffset, finish.dom, foffset);
                }
                else if (selection.extend) {
                    // This try catch is for older browsers (Firefox 52) as they're sometimes unable to handle setting backwards selections using selection.extend and error out.
                    try {
                        setLegacyRtlRange(win, selection, start, soffset, finish, foffset);
                    }
                    catch {
                        // If it does fail, try again with ltr.
                        doSetRange(win, finish, foffset, start, soffset);
                    }
                }
                else {
                    doSetRange(win, finish, foffset, start, soffset);
                }
            });
        }
    });
    const setExact = (win, start, soffset, finish, foffset) => {
        const relative = preprocessExact(start, soffset, finish, foffset);
        setRangeFromRelative(win, relative);
    };
    const setRelative = (win, startSitu, finishSitu) => {
        const relative = preprocessRelative(startSitu, finishSitu);
        setRangeFromRelative(win, relative);
    };
    // NOTE: We are still reading the range because it gives subtly different behaviour
    // than using the anchorNode and focusNode. I'm not sure if this behaviour is any
    // better or worse; it's just different.
    const readRange = (selection) => {
        if (selection.rangeCount > 0) {
            const firstRng = selection.getRangeAt(0);
            const lastRng = selection.getRangeAt(selection.rangeCount - 1);
            return Optional.some(SimRange.create(SugarElement.fromDom(firstRng.startContainer), firstRng.startOffset, SugarElement.fromDom(lastRng.endContainer), lastRng.endOffset));
        }
        else {
            return Optional.none();
        }
    };
    const doGetExact = (selection) => {
        if (selection.anchorNode === null || selection.focusNode === null) {
            return readRange(selection);
        }
        else {
            const anchor = SugarElement.fromDom(selection.anchorNode);
            const focus = SugarElement.fromDom(selection.focusNode);
            // if this returns true anchor is _after_ focus, so we need a custom selection object to maintain the RTL selection
            return after$5(anchor, selection.anchorOffset, focus, selection.focusOffset) ? Optional.some(SimRange.create(anchor, selection.anchorOffset, focus, selection.focusOffset)) : readRange(selection);
        }
    };
    const setToElement = (win, element, selectNodeContents$1 = true) => {
        const rngGetter = selectNodeContents$1 ? selectNodeContents : selectNode;
        const rng = rngGetter(win, element);
        doSetNativeRange(win, rng);
    };
    const getExact = (win) => 
    // We want to retrieve the selection as it is.
    getNativeSelection(win)
        .filter((sel) => sel.rangeCount > 0)
        .bind(doGetExact);
    // TODO: Test this.
    const get$3 = (win) => getExact(win).map((range) => SimSelection.exact(range.start, range.soffset, range.finish, range.foffset));
    const getFirstRect = (win, selection) => {
        const rng = asLtrRange(win, selection);
        return getFirstRect$1(rng);
    };
    const getAtPoint = (win, x, y) => fromPoint(win, x, y);
    const clear = (win) => {
        getNativeSelection(win).each((selection) => selection.removeAllRanges());
    };

    const units = {
        // we don't really support all of these different ways to express a length
        unsupportedLength: [
            'em',
            'ex',
            'cap',
            'ch',
            'ic',
            'rem',
            'lh',
            'rlh',
            'vw',
            'vh',
            'vi',
            'vb',
            'vmin',
            'vmax',
            'cm',
            'mm',
            'Q',
            'in',
            'pc',
            'pt',
            'px'
        ],
        // these are the length values we do support
        fixed: ['px', 'pt'],
        relative: ['%'],
        empty: ['']
    };
    // Built from https://tc39.es/ecma262/#prod-StrDecimalLiteral
    // Matches a float followed by a trailing set of characters
    const pattern = (() => {
        const decimalDigits = '[0-9]+';
        const signedInteger = '[+-]?' + decimalDigits;
        const exponentPart = '[eE]' + signedInteger;
        const dot = '\\.';
        const opt = (input) => `(?:${input})?`;
        const unsignedDecimalLiteral = [
            'Infinity',
            decimalDigits + dot + opt(decimalDigits) + opt(exponentPart),
            dot + decimalDigits + opt(exponentPart),
            decimalDigits + opt(exponentPart)
        ].join('|');
        const float = `[+-]?(?:${unsignedDecimalLiteral})`;
        return new RegExp(`^(${float})(.*)$`);
    })();
    const isUnit = (unit, accepted) => exists(accepted, (acc) => exists(units[acc], (check) => unit === check));
    const parse = (input, accepted) => {
        const match = Optional.from(pattern.exec(input));
        return match.bind((array) => {
            const value = Number(array[1]);
            const unitRaw = array[2];
            if (isUnit(unitRaw, accepted)) {
                return Optional.some({
                    value,
                    unit: unitRaw
                });
            }
            else {
                return Optional.none();
            }
        });
    };

    const zero = (array) => map$1(array, constant(0));
    const surround = (sizes, startIndex, endIndex, results, f) => f(sizes.slice(0, startIndex)).concat(results).concat(f(sizes.slice(endIndex)));
    // Clamp positive or negative delta so that a column/row cannot be reduced past its min size
    const clampDeltaHelper = (predicate) => (sizes, index, delta, minCellSize) => {
        if (!predicate(delta)) {
            return delta;
        }
        else {
            const newSize = Math.max(minCellSize, sizes[index] - Math.abs(delta));
            const diff = Math.abs(newSize - sizes[index]);
            return delta >= 0 ? diff : -diff;
        }
    };
    const clampNegativeDelta = clampDeltaHelper((delta) => delta < 0);
    const clampDelta = clampDeltaHelper(always);
    // Preserve the size of the columns/rows and adjust the table size
    const resizeTable = () => {
        const calcFixedDeltas = (sizes, index, next, delta, minCellSize) => {
            const clampedDelta = clampNegativeDelta(sizes, index, delta, minCellSize);
            return surround(sizes, index, next + 1, [clampedDelta, 0], zero);
        };
        // Calculate delta for adjusted column
        // Also need to calculate deltas for all other columns/rows to ensure they stay at the same visual width/height
        // when the table width/height is adjusted
        const calcRelativeDeltas = (sizes, index, delta, minCellSize) => {
            // ASSUMPTION: The delta will be a percentage. This may not be correct if other relative sizing is added, so we probably
            // need a better way to calc the ratio.
            const ratio = (100 + delta) / 100;
            const newThis = Math.max(minCellSize, (sizes[index] + delta) / ratio);
            return map$1(sizes, (size, idx) => {
                const newSize = idx === index ? newThis : size / ratio;
                return newSize - size;
            });
        };
        // Calculations for the inner columns/rows
        const calcLeftEdgeDeltas = (sizes, index, next, delta, minCellSize, isRelative) => {
            if (isRelative) {
                return calcRelativeDeltas(sizes, index, delta, minCellSize);
            }
            else {
                return calcFixedDeltas(sizes, index, next, delta, minCellSize);
            }
        };
        const calcMiddleDeltas = (sizes, _prev, index, next, delta, minCellSize, isRelative) => calcLeftEdgeDeltas(sizes, index, next, delta, minCellSize, isRelative);
        const resizeTable = (resizer, delta) => resizer(delta);
        // Calculations for the last column/row resizer
        const calcRightEdgeDeltas = (sizes, _prev, index, delta, minCellSize, isRelative) => {
            if (isRelative) {
                return calcRelativeDeltas(sizes, index, delta, minCellSize);
            }
            else {
                const clampedDelta = clampNegativeDelta(sizes, index, delta, minCellSize);
                return zero(sizes.slice(0, index)).concat([clampedDelta]);
            }
        };
        const calcRedestributedWidths = (sizes, totalWidth, pixelDelta, isRelative) => {
            if (isRelative) {
                const tableWidth = totalWidth + pixelDelta;
                const ratio = tableWidth / totalWidth;
                const newSizes = map$1(sizes, (size) => size / ratio);
                return {
                    delta: (ratio * 100) - 100,
                    newSizes,
                };
            }
            else {
                return {
                    delta: pixelDelta,
                    newSizes: sizes,
                };
            }
        };
        return {
            resizeTable,
            clampTableDelta: clampNegativeDelta,
            calcLeftEdgeDeltas,
            calcMiddleDeltas,
            calcRightEdgeDeltas,
            calcRedestributedWidths,
        };
    };
    // Distribute the column/rows and try to preserve the table size
    const preserveTable = () => {
        // Calculations for the inner columns/rows
        const calcLeftEdgeDeltas = (sizes, index, next, delta, minCellSize) => {
            const idx = delta >= 0 ? next : index;
            const clampedDelta = clampDelta(sizes, idx, delta, minCellSize);
            // negative delta -> deltas becomes [ neg, pos ], positive delta -> deltas becomes [ pos, neg ]
            return surround(sizes, index, next + 1, [clampedDelta, -clampedDelta], zero);
        };
        const calcMiddleDeltas = (sizes, _prev, index, next, delta, minCellSize) => calcLeftEdgeDeltas(sizes, index, next, delta, minCellSize);
        const resizeTable = (resizer, delta, isLastColumn) => {
            if (isLastColumn) {
                resizer(delta);
            }
        };
        // Calculations for the last column/row resizer
        const calcRightEdgeDeltas = (sizes, _prev, _index, delta, _minCellSize, isRelative) => {
            if (isRelative) {
                return zero(sizes);
            }
            else {
                // Distribute the delta amongst all of the columns/rows
                const diff = delta / sizes.length;
                return map$1(sizes, constant(diff));
            }
        };
        const clampTableDelta = (sizes, index, delta, minCellSize, isLastColumn) => {
            // Don't clamp the last resizer using normal methods
            // Need to allow table width to be reduced past the last column position to allow for distributive resizing
            if (isLastColumn) {
                if (delta >= 0) {
                    return delta;
                }
                else {
                    // Clamp delta so that none of the columns/rows can reduce below their min size
                    const maxDelta = foldl(sizes, (a, b) => a + b - minCellSize, 0);
                    return Math.max(-maxDelta, delta);
                }
            }
            else {
                return clampNegativeDelta(sizes, index, delta, minCellSize);
            }
        };
        const calcRedestributedWidths = (sizes, _totalWidth, _pixelDelta, _isRelative) => ({
            delta: 0,
            newSizes: sizes,
        });
        return {
            resizeTable,
            clampTableDelta,
            calcLeftEdgeDeltas,
            calcMiddleDeltas,
            calcRightEdgeDeltas,
            calcRedestributedWidths
        };
    };

    const getAttrValue = (cell, name, fallback = 0) => getOpt(cell, name).map((value) => parseInt(value, 10)).getOr(fallback);
    const getSpan = (cell, type) => getAttrValue(cell, type, 1);
    const hasColspan = (cellOrCol) => {
        if (isTag('col')(cellOrCol)) {
            return getAttrValue(cellOrCol, 'span', 1) > 1;
        }
        else {
            return getSpan(cellOrCol, 'colspan') > 1;
        }
    };
    const hasRowspan = (cell) => getSpan(cell, 'rowspan') > 1;
    const getCssValue = (element, property) => parseInt(get$9(element, property), 10);
    const minWidth = constant(10);
    const minHeight = constant(10);

    const firstLayer = (scope, selector) => {
        return filterFirstLayer(scope, selector, always);
    };
    const filterFirstLayer = (scope, selector, predicate) => {
        return bind$2(children$2(scope), (x) => {
            if (is$1(x, selector)) {
                return predicate(x) ? [x] : [];
            }
            else {
                return filterFirstLayer(x, selector, predicate);
            }
        });
    };

    // lookup inside this table
    const lookup = (tags, element, isRoot = never) => {
        // If the element we're inspecting is the root, we definitely don't want it.
        if (isRoot(element)) {
            return Optional.none();
        }
        // This looks a lot like SelectorFind.closest, with one big exception - the isRoot check.
        // The code here will look for parents if passed a table, SelectorFind.closest with that specific isRoot check won't.
        if (contains$2(tags, name(element))) {
            return Optional.some(element);
        }
        const isRootOrUpperTable = (elm) => is$1(elm, 'table') || isRoot(elm);
        return ancestor$1(element, tags.join(','), isRootOrUpperTable);
    };
    /*
     * Identify the optional cell that element represents.
     */
    const cell = (element, isRoot) => lookup(['td', 'th'], element, isRoot);
    const cells$1 = (ancestor) => firstLayer(ancestor, 'th,td');
    const columns$1 = (ancestor) => {
        if (is$1(ancestor, 'colgroup')) {
            return children(ancestor, 'col');
        }
        else {
            return bind$2(columnGroups(ancestor), (columnGroup) => children(columnGroup, 'col'));
        }
    };
    const table = (element, isRoot) => closest$1(element, 'table', isRoot);
    const rows$1 = (ancestor) => firstLayer(ancestor, 'tr');
    const columnGroups = (ancestor) => table(ancestor).fold(constant([]), (table) => children(table, 'colgroup'));

    const isHeaderCell = isTag('th');
    const isHeaderCells = (cells) => forall(cells, (cell) => isHeaderCell(cell.element));
    const getRowHeaderType = (isHeaderRow, isHeaderCells) => {
        if (isHeaderRow && isHeaderCells) {
            return 'sectionCells';
        }
        else if (isHeaderRow) {
            return 'section';
        }
        else {
            return 'cells';
        }
    };
    const getRowType = (row) => {
        // Header rows can use a combination of theads and ths - want to detect the different combinations
        const isHeaderRow = row.section === 'thead';
        const isHeaderCells = is$2(findCommonCellType(row.cells), 'th');
        if (row.section === 'tfoot') {
            return { type: 'footer' };
        }
        else if (isHeaderRow || isHeaderCells) {
            return { type: 'header', subType: getRowHeaderType(isHeaderRow, isHeaderCells) };
        }
        else {
            return { type: 'body' };
        }
    };
    const findCommonCellType = (cells) => {
        const headerCells = filter$2(cells, (cell) => isHeaderCell(cell.element));
        if (headerCells.length === 0) {
            return Optional.some('td');
        }
        else if (headerCells.length === cells.length) {
            return Optional.some('th');
        }
        else {
            return Optional.none();
        }
    };
    const findCommonRowType = (rows) => {
        const rowTypes = map$1(rows, (row) => getRowType(row).type);
        const hasHeader = contains$2(rowTypes, 'header');
        const hasFooter = contains$2(rowTypes, 'footer');
        if (!hasHeader && !hasFooter) {
            return Optional.some('body');
        }
        else {
            const hasBody = contains$2(rowTypes, 'body');
            if (hasHeader && !hasBody && !hasFooter) {
                return Optional.some('header');
            }
            else if (!hasHeader && !hasBody && hasFooter) {
                return Optional.some('footer');
            }
            else {
                return Optional.none();
            }
        }
    };
    const findTableRowHeaderType = (warehouse) => findMap(warehouse.all, (row) => {
        const rowType = getRowType(row);
        return rowType.type === 'header' ? Optional.from(rowType.subType) : Optional.none();
    });

    const fromRowsOrColGroups = (elems, getSection) => map$1(elems, (row) => {
        if (name(row) === 'colgroup') {
            const cells = map$1(columns$1(row), (column) => {
                const colspan = getAttrValue(column, 'span', 1);
                return detail(column, 1, colspan);
            });
            return rowdetail(row, cells, 'colgroup');
        }
        else {
            const cells = map$1(cells$1(row), (cell) => {
                const rowspan = getAttrValue(cell, 'rowspan', 1);
                const colspan = getAttrValue(cell, 'colspan', 1);
                return detail(cell, rowspan, colspan);
            });
            return rowdetail(row, cells, getSection(row));
        }
    });
    const getParentSection = (group) => parent(group).map((parent) => {
        const parentName = name(parent);
        return isValidSection(parentName) ? parentName : 'tbody';
    }).getOr('tbody');
    /*
     * Takes a DOM table and returns a list of list of:
       element: row element
       cells: (id, rowspan, colspan) structs
     */
    const fromTable$1 = (table) => {
        const rows = rows$1(table);
        const columnGroups$1 = columnGroups(table);
        const elems = [...columnGroups$1, ...rows];
        return fromRowsOrColGroups(elems, getParentSection);
    };
    const fromPastedRows = (elems, section) => fromRowsOrColGroups(elems, () => section);

    const LOCKED_COL_ATTR = 'data-snooker-locked-cols';
    const getLockedColumnsFromTable = (table) => getOpt(table, LOCKED_COL_ATTR)
        .bind((lockedColStr) => Optional.from(lockedColStr.match(/\d+/g)))
        .map((lockedCols) => mapToObject(lockedCols, always));
    // Need to check all of the cells to determine which columns are locked - reasoning is because rowspan and colspan cells where the same cell is used by multiple columns
    const getLockedColumnsFromGrid = (grid) => {
        const locked = foldl(extractGridDetails(grid).rows, (acc, row) => {
            each$2(row.cells, (cell, idx) => {
                if (cell.isLocked) {
                    acc[idx] = true;
                }
            });
            return acc;
        }, {});
        const lockedArr = mapToArray(locked, (_val, key) => parseInt(key, 10));
        return sort$1(lockedArr);
    };

    const key = (row, column) => {
        return row + ',' + column;
    };
    const getAt = (warehouse, row, column) => Optional.from(warehouse.access[key(row, column)]);
    const findItem = (warehouse, item, comparator) => {
        const filtered = filterItems(warehouse, (detail) => {
            return comparator(item, detail.element);
        });
        return filtered.length > 0 ? Optional.some(filtered[0]) : Optional.none();
    };
    const filterItems = (warehouse, predicate) => {
        const all = bind$2(warehouse.all, (r) => {
            return r.cells;
        });
        return filter$2(all, predicate);
    };
    const generateColumns = (rowData) => {
        const columnsGroup = {};
        let index = 0;
        each$2(rowData.cells, (column) => {
            const colspan = column.colspan;
            range$1(colspan, (columnIndex) => {
                const colIndex = index + columnIndex;
                columnsGroup[colIndex] = columnext(column.element, colspan, colIndex);
            });
            index += colspan;
        });
        return columnsGroup;
    };
    /*
     * From a list of list of Detail, generate three pieces of information:
     *  1. the grid size
     *  2. a data structure which can efficiently identify which cell is in which row,column position
     *  3. a list of all cells in order left-to-right, top-to-bottom
     */
    const generate = (list) => {
        // list is an array of objects, made by cells and elements
        // elements: is the TR
        // cells: is an array of objects representing the cells in the row.
        //        It is made of:
        //          colspan (merge cell)
        //          element
        //          rowspan (merge cols)
        const access = {};
        const cells = [];
        const tableOpt = head(list).map((rowData) => rowData.element).bind(table);
        const lockedColumns = tableOpt.bind(getLockedColumnsFromTable).getOr({});
        let maxRows = 0;
        let maxColumns = 0;
        let rowCount = 0;
        const { pass: colgroupRows, fail: rows } = partition(list, (rowData) => rowData.section === 'colgroup');
        // Handle rows first
        each$2(rows, (rowData) => {
            const currentRow = [];
            each$2(rowData.cells, (rowCell) => {
                let start = 0;
                // If this spot has been taken by a previous rowspan, skip it.
                while (access[key(rowCount, start)] !== undefined) {
                    start++;
                }
                const isLocked = hasNonNullableKey(lockedColumns, start.toString());
                const current = extended(rowCell.element, rowCell.rowspan, rowCell.colspan, rowCount, start, isLocked);
                // Occupy all the (row, column) positions that this cell spans for.
                for (let occupiedColumnPosition = 0; occupiedColumnPosition < rowCell.colspan; occupiedColumnPosition++) {
                    for (let occupiedRowPosition = 0; occupiedRowPosition < rowCell.rowspan; occupiedRowPosition++) {
                        const rowPosition = rowCount + occupiedRowPosition;
                        const columnPosition = start + occupiedColumnPosition;
                        const newpos = key(rowPosition, columnPosition);
                        access[newpos] = current;
                        maxColumns = Math.max(maxColumns, columnPosition + 1);
                    }
                }
                currentRow.push(current);
            });
            maxRows++;
            cells.push(rowdetail(rowData.element, currentRow, rowData.section));
            rowCount++;
        });
        // Handle colgroups
        // Note: Currently only a single colgroup is supported so just use the last one
        const { columns, colgroups } = last$2(colgroupRows).map((rowData) => {
            const columns = generateColumns(rowData);
            const colgroup$1 = colgroup(rowData.element, values(columns));
            return {
                colgroups: [colgroup$1],
                columns
            };
        }).getOrThunk(() => ({
            colgroups: [],
            columns: {}
        }));
        const grid$1 = grid(maxRows, maxColumns);
        return {
            grid: grid$1,
            access,
            all: cells,
            columns,
            colgroups
        };
    };
    const fromTable = (table) => {
        const list = fromTable$1(table);
        return generate(list);
    };
    const justCells = (warehouse) => bind$2(warehouse.all, (w) => w.cells);
    const justColumns = (warehouse) => values(warehouse.columns);
    const hasColumns = (warehouse) => keys(warehouse.columns).length > 0;
    const getColumnAt = (warehouse, columnIndex) => Optional.from(warehouse.columns[columnIndex]);
    const Warehouse = {
        fromTable,
        generate,
        getAt,
        findItem,
        filterItems,
        justCells,
        justColumns,
        hasColumns,
        getColumnAt
    };

    const transformCell = (cell, comparator, substitution) => elementnew(substitution(cell.element, comparator), true, cell.isLocked);
    const transformRow = (row, section) => row.section !== section ? rowcells(row.element, row.cells, section, row.isNew) : row;
    const section = () => ({
        transformRow,
        transformCell: (cell, comparator, substitution) => {
            const newCell = substitution(cell.element, comparator);
            // Convert the cell to a td element as "section" should always use td element
            const fixedCell = name(newCell) !== 'td' ? mutate$1(newCell, 'td') : newCell;
            return elementnew(fixedCell, cell.isNew, cell.isLocked);
        }
    });
    const sectionCells = () => ({
        transformRow,
        transformCell
    });
    const cells = () => ({
        transformRow: (row, section) => {
            // Ensure that cells are always within the tbody for headers
            const newSection = section === 'thead' ? 'tbody' : section;
            return transformRow(row, newSection);
        },
        transformCell
    });
    // A fallback legacy type that won't adjust the row/section type
    // and instead will only modify cells
    const fallback = () => ({
        transformRow: identity,
        transformCell
    });
    const getTableSectionType = (table, fallback) => {
        const warehouse = Warehouse.fromTable(table);
        const type = findTableRowHeaderType(warehouse).getOr(fallback);
        switch (type) {
            case 'section':
                return section();
            case 'sectionCells':
                return sectionCells();
            case 'cells':
                return cells();
        }
    };
    const TableSection = {
        getTableSectionType,
        section,
        sectionCells,
        cells,
        fallback
    };

    /*
     * Identify for each column, a cell that has colspan 1. Note, this
     * may actually fail, and future work will be to calculate column
     * sizes that are only available through the difference of two
     * spanning columns.
     */
    const columns = (warehouse, isValidCell = always) => {
        const grid = warehouse.grid;
        const cols = range$1(grid.columns, identity);
        const rowsArr = range$1(grid.rows, identity);
        return map$1(cols, (col) => {
            const getBlock = () => bind$2(rowsArr, (r) => Warehouse.getAt(warehouse, r, col)
                .filter((detail) => detail.column === col)
                .toArray());
            const isValid = (detail) => detail.colspan === 1 && isValidCell(detail.element);
            const getFallback = () => Warehouse.getAt(warehouse, 0, col);
            return decide(getBlock, isValid, getFallback);
        });
    };
    const decide = (getBlock, isValid, getFallback) => {
        const inBlock = getBlock();
        const validInBlock = find$1(inBlock, isValid);
        const detailOption = validInBlock.orThunk(() => Optional.from(inBlock[0]).orThunk(getFallback));
        return detailOption.map((detail) => detail.element);
    };
    const rows = (warehouse) => {
        const grid = warehouse.grid;
        const rowsArr = range$1(grid.rows, identity);
        const cols = range$1(grid.columns, identity);
        return map$1(rowsArr, (row) => {
            const getBlock = () => bind$2(cols, (c) => Warehouse.getAt(warehouse, row, c)
                .filter((detail) => detail.row === row)
                .fold(constant([]), (detail) => [detail]));
            const isSingle = (detail) => detail.rowspan === 1;
            const getFallback = () => Warehouse.getAt(warehouse, row, 0);
            return decide(getBlock, isSingle, getFallback);
        });
    };

    const deduce = (xs, index) => {
        if (index < 0 || index >= xs.length - 1) {
            return Optional.none();
        }
        const current = xs[index].fold(() => {
            const rest = reverse(xs.slice(0, index));
            return findMap(rest, (a, i) => a.map((aa) => ({ value: aa, delta: i + 1 })));
        }, (c) => Optional.some({ value: c, delta: 0 }));
        const next = xs[index + 1].fold(() => {
            const rest = xs.slice(index + 1);
            return findMap(rest, (a, i) => a.map((aa) => ({ value: aa, delta: i + 1 })));
        }, (n) => Optional.some({ value: n, delta: 1 }));
        return current.bind((c) => next.map((n) => {
            const extras = n.delta + c.delta;
            return Math.abs(n.value - c.value) / extras;
        }));
    };

    const rowInfo = (row, y) => ({
        row,
        y
    });
    const colInfo = (col, x) => ({
        col,
        x
    });
    const rtlEdge = (cell) => {
        const pos = absolute(cell);
        return pos.left + getOuter(cell);
    };
    const ltrEdge = (cell) => {
        return absolute(cell).left;
    };
    const getLeftEdge = (index, cell) => {
        return colInfo(index, ltrEdge(cell));
    };
    const getRightEdge = (index, cell) => {
        return colInfo(index, rtlEdge(cell));
    };
    const getTop$1 = (cell) => {
        return absolute(cell).top;
    };
    const getTopEdge = (index, cell) => {
        return rowInfo(index, getTop$1(cell));
    };
    const getBottomEdge = (index, cell) => {
        return rowInfo(index, getTop$1(cell) + getOuter$1(cell));
    };
    const findPositions = (getInnerEdge, getOuterEdge, array) => {
        if (array.length === 0) {
            return [];
        }
        const lines = map$1(array.slice(1), (cellOption, index) => {
            return cellOption.map((cell) => {
                return getInnerEdge(index, cell);
            });
        });
        const lastLine = array[array.length - 1].map((cell) => {
            return getOuterEdge(array.length - 1, cell);
        });
        return lines.concat([lastLine]);
    };
    const negate = (step) => {
        return -step;
    };
    const height = {
        delta: identity,
        positions: (optElements) => findPositions(getTopEdge, getBottomEdge, optElements),
        edge: getTop$1
    };
    const ltr$1 = {
        delta: identity,
        edge: ltrEdge,
        positions: (optElements) => findPositions(getLeftEdge, getRightEdge, optElements)
    };
    const rtl$1 = {
        delta: negate,
        edge: rtlEdge,
        positions: (optElements) => findPositions(getRightEdge, getLeftEdge, optElements)
    };
    const detect$1 = onDirection(ltr$1, rtl$1);
    const width = {
        delta: (amount, table) => detect$1(table).delta(amount, table),
        positions: (cols, table) => detect$1(table).positions(cols, table),
        edge: (cell) => detect$1(cell).edge(cell)
    };

    const rPercentageBasedSizeRegex = /(\d+(\.\d+)?)%/;
    const rPixelBasedSizeRegex = /(\d+(\.\d+)?)px|em/;
    const isCol$2 = isTag('col');
    const isRow$2 = isTag('tr');
    const getPercentSize = (elm, outerGetter, innerGetter) => {
        const relativeParent = parentElement(elm).getOrThunk(() => getBody$1(owner(elm)));
        return outerGetter(elm) / innerGetter(relativeParent) * 100;
    };
    const setPixelWidth = (cell, amount) => {
        set$1(cell, 'width', amount + 'px');
    };
    const setPercentageWidth = (cell, amount) => {
        set$1(cell, 'width', amount + '%');
    };
    const setHeight = (cell, amount) => {
        set$1(cell, 'height', amount + 'px');
    };
    const removeHeight = (cell) => {
        remove$4(cell, 'height');
    };
    const getHeightValue = (cell) => getRuntime$1(cell) + 'px';
    const convert = (cell, number, getter, setter) => {
        const newSize = table(cell).map((table) => {
            const total = getter(table);
            return Math.floor((number / 100.0) * total);
        }).getOr(number);
        setter(cell, newSize);
        return newSize;
    };
    const normalizePixelSize = (value, cell, getter, setter) => {
        const number = parseFloat(value);
        return endsWith(value, '%') && name(cell) !== 'table' ? convert(cell, number, getter, setter) : number;
    };
    const getTotalHeight = (cell) => {
        const value = getHeightValue(cell);
        if (!value) {
            return get$8(cell);
        }
        return normalizePixelSize(value, cell, get$8, setHeight);
    };
    const get$2 = (cell, type, f) => {
        const v = f(cell);
        const span = getSpan(cell, type);
        return v / span;
    };
    const getRaw = (element, prop) => {
        // Try to use the style first, otherwise attempt to get the value from an attribute
        return getRaw$2(element, prop).orThunk(() => {
            return getOpt(element, prop).map((val) => val + 'px');
        });
    };
    const getRawWidth$1 = (element) => getRaw(element, 'width');
    const getRawHeight$1 = (element) => getRaw(element, 'height');
    // Get a percentage size for a percentage parent table
    const getPercentageWidth = (cell) => getPercentSize(cell, get$7, getInner);
    const getPixelWidth$1 = (cell) => 
    // For col elements use the computed width as col elements aren't affected by borders, padding, etc...
    isCol$2(cell) ? Math.round(get$7(cell)) : getRuntime(cell);
    const getHeight = (cell) => {
        return isRow$2(cell) ? get$8(cell) : get$2(cell, 'rowspan', getTotalHeight);
    };
    const getGenericWidth = (cell) => {
        const width = getRawWidth$1(cell);
        return width.bind((w) => parse(w, ['fixed', 'relative', 'empty']));
    };
    const setGenericWidth = (cell, amount, unit) => {
        set$1(cell, 'width', amount + unit);
    };
    const getPixelTableWidth = (table) => get$7(table) + 'px';
    const getPixelTableHeight = (table) => get$8(table) + 'px';
    const getPercentTableWidth = (table) => getPercentSize(table, get$7, getInner) + '%';
    const isPercentSizing$1 = (table) => getRawWidth$1(table).exists((size) => rPercentageBasedSizeRegex.test(size));
    const isPixelSizing$1 = (table) => getRawWidth$1(table).exists((size) => rPixelBasedSizeRegex.test(size));
    const isNoneSizing$1 = (table) => getRawWidth$1(table).isNone();
    const percentageBasedSizeRegex = constant(rPercentageBasedSizeRegex);

    const isCol$1 = isTag('col');
    const getRawW = (cell) => {
        return getRawWidth$1(cell).getOrThunk(() => getPixelWidth$1(cell) + 'px');
    };
    const getRawH = (cell) => {
        return getRawHeight$1(cell).getOrThunk(() => getHeight(cell) + 'px');
    };
    const justCols = (warehouse) => map$1(Warehouse.justColumns(warehouse), (column) => Optional.from(column.element));
    // Col elements don't have valid computed widths/positions in all browsers, so treat them as invalid in that case
    const isValidColumn = (cell) => {
        const browser = detect$2().browser;
        const supportsColWidths = browser.isChromium() || browser.isFirefox();
        return isCol$1(cell) ? supportsColWidths : true;
    };
    const getDimension = (cellOpt, index, backups, filter, getter, fallback) => cellOpt.filter(filter).fold(
    // Can't just read the width of a cell, so calculate.
    () => fallback(deduce(backups, index)), (cell) => getter(cell));
    const getWidthFrom = (warehouse, table, getWidth, fallback) => {
        // Only treat a cell as being valid for a column representation if it has a raw width, otherwise we won't be able to calculate the expected width.
        // This is needed as one cell may have a width but others may not, so we need to try and use one with a specified width first.
        const columnCells = columns(warehouse);
        const columns$1 = Warehouse.hasColumns(warehouse) ? justCols(warehouse) : columnCells;
        const backups = [Optional.some(width.edge(table))].concat(map$1(width.positions(columnCells, table), (pos) => pos.map((p) => p.x)));
        // Only use the width of cells that have no column span (or colspan 1)
        const colFilter = not(hasColspan);
        return map$1(columns$1, (cellOption, c) => {
            return getDimension(cellOption, c, backups, colFilter, (column) => {
                if (isValidColumn(column)) {
                    return getWidth(column);
                }
                else {
                    // Invalid column so fallback to trying to get the computed width from the cell
                    const cell = bindFrom(columnCells[c], identity);
                    return getDimension(cell, c, backups, colFilter, (cell) => fallback(Optional.some(Math.round(get$7(cell)))), fallback);
                }
            }, fallback);
        });
    };
    const getDeduced = (deduced) => {
        return deduced.map((d) => {
            return d + 'px';
        }).getOr('');
    };
    const getRawWidths = (warehouse, table) => {
        return getWidthFrom(warehouse, table, getRawW, getDeduced);
    };
    const getPercentageWidths = (warehouse, table, tableSize) => {
        return getWidthFrom(warehouse, table, getPercentageWidth, (deduced) => {
            return deduced.fold(() => {
                return tableSize.minCellWidth();
            }, (cellWidth) => {
                return cellWidth / tableSize.pixelWidth() * 100;
            });
        });
    };
    const getPixelWidths = (warehouse, table, tableSize) => {
        return getWidthFrom(warehouse, table, getPixelWidth$1, (deduced) => {
            // Minimum cell width when all else fails.
            return deduced.getOrThunk(tableSize.minCellWidth);
        });
    };
    const getHeightFrom = (warehouse, table, getHeight, fallback) => {
        const rowCells = rows(warehouse);
        const rows$1 = map$1(warehouse.all, (r) => Optional.some(r.element));
        const backups = [Optional.some(height.edge(table))].concat(map$1(height.positions(rowCells, table), (pos) => pos.map((p) => p.y)));
        return map$1(rows$1, (row, i) => getDimension(row, i, backups, always, getHeight, fallback));
    };
    const getPixelHeights = (warehouse, table) => {
        return getHeightFrom(warehouse, table, getHeight, (deduced) => {
            return deduced.getOrThunk(minHeight);
        });
    };
    const getRawHeights = (warehouse, table) => {
        return getHeightFrom(warehouse, table, getRawH, getDeduced);
    };

    const widthLookup = (table, getter) => () => {
        // Use the actual width if attached, otherwise fallback to the raw width
        if (inBody(table)) {
            return getter(table);
        }
        else {
            return parseFloat(getRaw$2(table, 'width').getOr('0'));
        }
    };
    const noneSize = (table) => {
        const getWidth = widthLookup(table, get$7);
        const zero = constant(0);
        const getWidths = (warehouse, tableSize) => getPixelWidths(warehouse, table, tableSize);
        // Note: The 3 delta functions below return 0 to signify a change shouldn't be made
        // however this is currently not used, so may need changing if ever used
        return {
            width: getWidth,
            pixelWidth: getWidth,
            getWidths,
            getCellDelta: zero,
            singleColumnWidth: constant([0]),
            minCellWidth: zero,
            setElementWidth: noop,
            adjustTableWidth: noop,
            isRelative: true,
            label: 'none'
        };
    };
    const percentageSize = (table) => {
        const getFloatWidth = widthLookup(table, (elem) => parseFloat(getPercentTableWidth(elem)));
        const getWidth = widthLookup(table, get$7);
        const getCellDelta = (delta) => delta / getWidth() * 100;
        // If we have one column in a percent based table, that column should be 100% of the width of the table.
        const singleColumnWidth = (w, _delta) => [100 - w];
        // Get the width of a 10 pixel wide cell over the width of the table as a percentage
        const minCellWidth = () => minWidth() / getWidth() * 100;
        const adjustTableWidth = (delta) => {
            const currentWidth = getFloatWidth();
            const change = delta / 100 * currentWidth;
            const newWidth = currentWidth + change;
            setPercentageWidth(table, newWidth);
        };
        const getWidths = (warehouse, tableSize) => getPercentageWidths(warehouse, table, tableSize);
        return {
            width: getFloatWidth,
            pixelWidth: getWidth,
            getWidths,
            getCellDelta,
            singleColumnWidth,
            minCellWidth,
            setElementWidth: setPercentageWidth,
            adjustTableWidth,
            isRelative: true,
            label: 'percent'
        };
    };
    const pixelSize = (table) => {
        const getWidth = widthLookup(table, get$7);
        const getCellDelta = identity;
        const singleColumnWidth = (w, delta) => {
            const newNext = Math.max(minWidth(), w + delta);
            return [newNext - w];
        };
        const adjustTableWidth = (delta) => {
            const newWidth = getWidth() + delta;
            setPixelWidth(table, newWidth);
        };
        const getWidths = (warehouse, tableSize) => getPixelWidths(warehouse, table, tableSize);
        return {
            width: getWidth,
            pixelWidth: getWidth,
            getWidths,
            getCellDelta,
            singleColumnWidth,
            minCellWidth: minWidth,
            setElementWidth: setPixelWidth,
            adjustTableWidth,
            isRelative: false,
            label: 'pixel'
        };
    };
    const chooseSize = (element, width) => {
        const percentMatch = percentageBasedSizeRegex().exec(width);
        if (percentMatch !== null) {
            return percentageSize(element);
        }
        else {
            return pixelSize(element);
        }
    };
    const getTableSize = (table) => {
        const width = getRawWidth$1(table);
        return width.fold(() => noneSize(table), (w) => chooseSize(table, w));
    };
    const TableSize = {
        getTableSize,
        pixelSize,
        percentageSize,
        noneSize
    };

    const setIfNot = (element, property, value, ignore) => {
        if (value === ignore) {
            remove$6(element, property);
        }
        else {
            set$2(element, property, value);
        }
    };
    const insert$1 = (table, selector, element) => {
        last$2(children(table, selector)).fold(() => prepend(table, element), (child) => after$4(child, element));
    };
    const generateSection = (table, sectionName) => {
        const section = child(table, sectionName).getOrThunk(() => {
            const newSection = SugarElement.fromTag(sectionName, owner(table).dom);
            if (sectionName === 'thead') {
                insert$1(table, 'caption,colgroup', newSection);
            }
            else if (sectionName === 'colgroup') {
                insert$1(table, 'caption', newSection);
            }
            else {
                append$1(table, newSection);
            }
            return newSection;
        });
        empty(section);
        return section;
    };
    const render$1 = (table, grid) => {
        const newRows = [];
        const newCells = [];
        const syncRows = (gridSection) => map$1(gridSection, (row) => {
            if (row.isNew) {
                newRows.push(row.element);
            }
            const tr = row.element;
            empty(tr);
            each$2(row.cells, (cell) => {
                if (cell.isNew) {
                    newCells.push(cell.element);
                }
                setIfNot(cell.element, 'colspan', cell.colspan, 1);
                setIfNot(cell.element, 'rowspan', cell.rowspan, 1);
                append$1(tr, cell.element);
            });
            return tr;
        });
        // Assumption we should only ever have 1 colgroup. The spec allows for multiple, however it's currently unsupported
        const syncColGroup = (gridSection) => bind$2(gridSection, (colGroup) => map$1(colGroup.cells, (col) => {
            setIfNot(col.element, 'span', col.colspan, 1);
            return col.element;
        }));
        const renderSection = (gridSection, sectionName) => {
            const section = generateSection(table, sectionName);
            const sync = sectionName === 'colgroup' ? syncColGroup : syncRows;
            const sectionElems = sync(gridSection);
            append(section, sectionElems);
        };
        const removeSection = (sectionName) => {
            child(table, sectionName).each(remove$5);
        };
        const renderOrRemoveSection = (gridSection, sectionName) => {
            if (gridSection.length > 0) {
                renderSection(gridSection, sectionName);
            }
            else {
                removeSection(sectionName);
            }
        };
        const headSection = [];
        const bodySection = [];
        const footSection = [];
        const columnGroupsSection = [];
        each$2(grid, (row) => {
            switch (row.section) {
                case 'thead':
                    headSection.push(row);
                    break;
                case 'tbody':
                    bodySection.push(row);
                    break;
                case 'tfoot':
                    footSection.push(row);
                    break;
                case 'colgroup':
                    columnGroupsSection.push(row);
                    break;
            }
        });
        renderOrRemoveSection(columnGroupsSection, 'colgroup');
        renderOrRemoveSection(headSection, 'thead');
        renderOrRemoveSection(bodySection, 'tbody');
        renderOrRemoveSection(footSection, 'tfoot');
        return {
            newRows,
            newCells
        };
    };
    const copy = (grid) => map$1(grid, (row) => {
        // Shallow copy the row element
        const tr = shallow(row.element);
        each$2(row.cells, (cell) => {
            const clonedCell = deep(cell.element);
            setIfNot(clonedCell, 'colspan', cell.colspan, 1);
            setIfNot(clonedCell, 'rowspan', cell.rowspan, 1);
            append$1(tr, clonedCell);
        });
        return tr;
    });

    const getColumn = (grid, index) => {
        return map$1(grid, (row) => {
            return getCell(row, index);
        });
    };
    const getRow = (grid, index) => {
        return grid[index];
    };
    const findDiff = (xs, comp) => {
        if (xs.length === 0) {
            return 0;
        }
        const first = xs[0];
        const index = findIndex(xs, (x) => {
            return !comp(first.element, x.element);
        });
        return index.getOr(xs.length);
    };
    /*
     * grid is the grid
     * row is the row index into the grid
     * column in the column index into the grid
     *
     * Return
     *   colspan: column span of the cell at (row, column)
     *   rowspan: row span of the cell at (row, column)
     */
    const subgrid = (grid, row, column, comparator) => {
        const gridRow = getRow(grid, row);
        const isColRow = gridRow.section === 'colgroup';
        const colspan = findDiff(gridRow.cells.slice(column), comparator);
        const rowspan = isColRow ? 1 : findDiff(getColumn(grid.slice(row), column), comparator);
        return {
            colspan,
            rowspan
        };
    };

    const toDetails = (grid, comparator) => {
        const seen = map$1(grid, (row) => map$1(row.cells, never));
        const updateSeen = (rowIndex, columnIndex, rowspan, colspan) => {
            for (let row = rowIndex; row < rowIndex + rowspan; row++) {
                for (let column = columnIndex; column < columnIndex + colspan; column++) {
                    seen[row][column] = true;
                }
            }
        };
        return map$1(grid, (row, rowIndex) => {
            const details = bind$2(row.cells, (cell, columnIndex) => {
                // if we have seen this one, then skip it.
                if (seen[rowIndex][columnIndex] === false) {
                    const result = subgrid(grid, rowIndex, columnIndex, comparator);
                    updateSeen(rowIndex, columnIndex, result.rowspan, result.colspan);
                    return [detailnew(cell.element, result.rowspan, result.colspan, cell.isNew)];
                }
                else {
                    return [];
                }
            });
            return rowdetailnew(row.element, details, row.section, row.isNew);
        });
    };
    const toGrid = (warehouse, generators, isNew) => {
        const grid = [];
        each$2(warehouse.colgroups, (colgroup) => {
            const colgroupCols = [];
            // This will add missing cols as well as clamp the number of cols to the max number of actual columns
            // Note: Spans on cols are unsupported so clamping cols may result in a span on a col element being incorrect
            for (let columnIndex = 0; columnIndex < warehouse.grid.columns; columnIndex++) {
                const element = Warehouse.getColumnAt(warehouse, columnIndex)
                    .map((column) => elementnew(column.element, isNew, false))
                    .getOrThunk(() => elementnew(generators.colGap(), true, false));
                colgroupCols.push(element);
            }
            grid.push(rowcells(colgroup.element, colgroupCols, 'colgroup', isNew));
        });
        for (let rowIndex = 0; rowIndex < warehouse.grid.rows; rowIndex++) {
            const rowCells = [];
            for (let columnIndex = 0; columnIndex < warehouse.grid.columns; columnIndex++) {
                // The element is going to be the element at that position, or a newly generated gap.
                const element = Warehouse.getAt(warehouse, rowIndex, columnIndex).map((item) => elementnew(item.element, isNew, item.isLocked)).getOrThunk(() => elementnew(generators.gap(), true, false));
                rowCells.push(element);
            }
            const rowDetail = warehouse.all[rowIndex];
            const row = rowcells(rowDetail.element, rowCells, rowDetail.section, isNew);
            grid.push(row);
        }
        return grid;
    };

    const fromWarehouse = (warehouse, generators) => toGrid(warehouse, generators, false);
    const toDetailList = (grid) => toDetails(grid, eq$1);
    const findInWarehouse = (warehouse, element) => findMap(warehouse.all, (r) => find$1(r.cells, (e) => eq$1(element, e.element)));
    const extractCells = (warehouse, target, predicate) => {
        const details = map$1(target.selection, (cell$1) => {
            return cell(cell$1)
                .bind((lc) => findInWarehouse(warehouse, lc))
                .filter(predicate);
        });
        const cells = cat(details);
        return someIf(cells.length > 0, cells);
    };
    const run = (operation, extract, adjustment, postAction, genWrappers, table, target, generators, behaviours) => {
        const warehouse = Warehouse.fromTable(table);
        const tableSection = Optional.from(behaviours?.section).getOrThunk(TableSection.fallback);
        const output = extract(warehouse, target).map((info) => {
            const model = fromWarehouse(warehouse, generators);
            const result = operation(model, info, eq$1, genWrappers(generators), tableSection);
            const lockedColumns = getLockedColumnsFromGrid(result.grid);
            const grid = toDetailList(result.grid);
            return {
                info,
                grid,
                cursor: result.cursor,
                lockedColumns
            };
        });
        return output.bind((out) => {
            const newElements = render$1(table, out.grid);
            const tableSizing = Optional.from(behaviours?.sizing).getOrThunk(() => TableSize.getTableSize(table));
            const resizing = Optional.from(behaviours?.resize).getOrThunk(preserveTable);
            adjustment(table, out.grid, out.info, { sizing: tableSizing, resize: resizing, section: tableSection });
            postAction(table);
            // Update locked cols attribute
            remove$6(table, LOCKED_COL_ATTR);
            if (out.lockedColumns.length > 0) {
                set$2(table, LOCKED_COL_ATTR, out.lockedColumns.join(','));
            }
            return Optional.some({
                cursor: out.cursor,
                newRows: newElements.newRows,
                newCells: newElements.newCells
            });
        });
    };
    const onPaste = (warehouse, target) => cell(target.element).bind((cell) => findInWarehouse(warehouse, cell).map((details) => {
        const value = {
            ...details,
            generators: target.generators,
            clipboard: target.clipboard
        };
        return value;
    }));
    const onPasteByEditor = (warehouse, target) => extractCells(warehouse, target, always).map((cells) => ({
        cells,
        generators: target.generators,
        clipboard: target.clipboard
    }));
    const onMergable = (_warehouse, target) => target.mergable;
    const onUnmergable = (_warehouse, target) => target.unmergable;
    const onCells = (warehouse, target) => extractCells(warehouse, target, always);
    const onUnlockedCells = (warehouse, target) => extractCells(warehouse, target, (detail) => !detail.isLocked);
    const isUnlockedTableCell = (warehouse, cell) => findInWarehouse(warehouse, cell).exists((detail) => !detail.isLocked);
    const allUnlocked = (warehouse, cells) => forall(cells, (cell) => isUnlockedTableCell(warehouse, cell));
    // If any locked columns are present in the selection, then don't want to be able to merge
    const onUnlockedMergable = (warehouse, target) => onMergable(warehouse, target).filter((mergeable) => allUnlocked(warehouse, mergeable.cells));
    // If any locked columns are present in the selection, then don't want to be able to unmerge
    const onUnlockedUnmergable = (warehouse, target) => onUnmergable(warehouse, target).filter((cells) => allUnlocked(warehouse, cells));

    const adt$3 = Adt.generate([
        { none: [] },
        { only: ['index'] },
        { left: ['index', 'next'] },
        { middle: ['prev', 'index', 'next'] },
        { right: ['prev', 'index'] }
    ]);
    const ColumnContext = {
        ...adt$3
    };

    /*
     * Based on the column index, identify the context
     */
    const neighbours = (input, index) => {
        if (input.length === 0) {
            return ColumnContext.none();
        }
        if (input.length === 1) {
            return ColumnContext.only(0);
        }
        if (index === 0) {
            return ColumnContext.left(0, 1);
        }
        if (index === input.length - 1) {
            return ColumnContext.right(index - 1, index);
        }
        if (index > 0 && index < input.length - 1) {
            return ColumnContext.middle(index - 1, index, index + 1);
        }
        return ColumnContext.none();
    };
    /*
     * Calculate the offsets to apply to each column width (not the absolute widths themselves)
     * based on a resize at column: column of step: step
     */
    const determine = (input, column, step, tableSize, resize) => {
        const result = input.slice(0);
        const context = neighbours(input, column);
        const onNone = constant(map$1(result, constant(0)));
        const onOnly = (index) => tableSize.singleColumnWidth(result[index], step);
        const onLeft = (index, next) => resize.calcLeftEdgeDeltas(result, index, next, step, tableSize.minCellWidth(), tableSize.isRelative);
        const onMiddle = (prev, index, next) => resize.calcMiddleDeltas(result, prev, index, next, step, tableSize.minCellWidth(), tableSize.isRelative);
        // Applies to the last column bar
        const onRight = (prev, index) => resize.calcRightEdgeDeltas(result, prev, index, step, tableSize.minCellWidth(), tableSize.isRelative);
        return context.fold(onNone, onOnly, onLeft, onMiddle, onRight);
    };

    // Returns the sum of elements of measures in the half-open range [start, end)
    // Measures is in pixels, treated as an array of integers or integers in string format.
    // NOTE: beware of accumulated rounding errors over multiple columns - could result in noticeable table width changes
    const total = (start, end, measures) => {
        let r = 0;
        for (let i = start; i < end; i++) {
            r += measures[i] !== undefined ? measures[i] : 0;
        }
        return r;
    };
    // Returns an array of all cells in warehouse with updated cell-widths, using
    // the array 'widths' of the representative widths of each column of the table 'warehouse'
    const recalculateWidthForCells = (warehouse, widths) => {
        const all = Warehouse.justCells(warehouse);
        return map$1(all, (cell) => {
            // width of a spanning cell is sum of widths of representative columns it spans
            const width = total(cell.column, cell.column + cell.colspan, widths);
            return {
                element: cell.element,
                width,
                colspan: cell.colspan
            };
        });
    };
    const recalculateWidthForColumns = (warehouse, widths) => {
        const groups = Warehouse.justColumns(warehouse);
        return map$1(groups, (column, index) => ({
            element: column.element,
            width: widths[index],
            colspan: column.colspan
        }));
    };
    const matchRowHeight = (warehouse, heights) => {
        return map$1(warehouse.all, (row, i) => {
            return {
                element: row.element,
                height: heights[i]
            };
        });
    };

    const sumUp = (newSize) => foldr(newSize, (b, a) => b + a, 0);
    const recalculate = (warehouse, widths) => {
        if (Warehouse.hasColumns(warehouse)) {
            return recalculateWidthForColumns(warehouse, widths);
        }
        else {
            return recalculateWidthForCells(warehouse, widths);
        }
    };
    const recalculateAndApply = (warehouse, widths, tableSize) => {
        // Set the width of each cell based on the column widths
        const newSizes = recalculate(warehouse, widths);
        each$2(newSizes, (cell) => {
            tableSize.setElementWidth(cell.element, cell.width);
        });
    };
    const adjustWidth = (table, delta, index, resizing, tableSize) => {
        const warehouse = Warehouse.fromTable(table);
        const step = tableSize.getCellDelta(delta);
        const widths = tableSize.getWidths(warehouse, tableSize);
        const isLastColumn = index === warehouse.grid.columns - 1;
        const clampedStep = resizing.clampTableDelta(widths, index, step, tableSize.minCellWidth(), isLastColumn);
        // Calculate all of the new widths for columns
        const deltas = determine(widths, index, clampedStep, tableSize, resizing);
        const newWidths = map$1(deltas, (dx, i) => dx + widths[i]);
        recalculateAndApply(warehouse, newWidths, tableSize);
        resizing.resizeTable(tableSize.adjustTableWidth, clampedStep, isLastColumn);
    };
    const adjustHeight = (table, delta, index) => {
        const warehouse = Warehouse.fromTable(table);
        const heights = getPixelHeights(warehouse, table);
        const newHeights = map$1(heights, (dy, i) => index === i ? Math.max(delta + dy, minHeight()) : dy);
        const newRowSizes = matchRowHeight(warehouse, newHeights);
        each$2(newRowSizes, (row) => {
            setHeight(row.element, row.height);
        });
        each$2(Warehouse.justCells(warehouse), (cell) => {
            removeHeight(cell.element);
        });
        const total = sumUp(newHeights);
        setHeight(table, total);
    };
    // Using the width of the added/removed columns gathered on extraction (pixelDelta), get and apply the new column sizes and overall table width delta
    const adjustAndRedistributeWidths$1 = (_table, list, details, tableSize, resizeBehaviour) => {
        const warehouse = Warehouse.generate(list);
        const sizes = tableSize.getWidths(warehouse, tableSize);
        const tablePixelWidth = tableSize.pixelWidth();
        const { newSizes, delta } = resizeBehaviour.calcRedestributedWidths(sizes, tablePixelWidth, details.pixelDelta, tableSize.isRelative);
        recalculateAndApply(warehouse, newSizes, tableSize);
        tableSize.adjustTableWidth(delta);
    };
    // Ensure that the width of table cells match the passed in table information.
    const adjustWidthTo = (_table, list, _info, tableSize) => {
        const warehouse = Warehouse.generate(list);
        const widths = tableSize.getWidths(warehouse, tableSize);
        recalculateAndApply(warehouse, widths, tableSize);
    };

    const halve = (main, other) => {
        // Only set width on the new cell if we have a colspan of 1 (or no colspan) as we can only safely do that for cells
        // that are a single column, since we don't know the individual column widths for a cell with a colspan.
        // Instead, we'll rely on the adjustments/postAction logic to set the widths based on other cells in the column
        if (!hasColspan(main)) {
            const width = getGenericWidth(main);
            width.each((w) => {
                const newWidth = w.value / 2;
                setGenericWidth(main, newWidth, w.unit);
                setGenericWidth(other, newWidth, w.unit);
            });
        }
    };

    const constrainSpan = (element, property, value) => {
        const currentColspan = getAttrValue(element, property, 1);
        if (value === 1 || currentColspan <= 1) {
            remove$6(element, property);
        }
        else {
            set$2(element, property, Math.min(value, currentColspan));
        }
    };
    const isColInRange = (minColRange, maxColRange) => (cell) => {
        const endCol = cell.column + cell.colspan - 1;
        const startCol = cell.column;
        return endCol >= minColRange && startCol < maxColRange;
    };
    const generateColGroup = (house, minColRange, maxColRange) => {
        if (Warehouse.hasColumns(house)) {
            const colsToCopy = filter$2(Warehouse.justColumns(house), isColInRange(minColRange, maxColRange));
            const copiedCols = map$1(colsToCopy, (c) => {
                const clonedCol = deep(c.element);
                constrainSpan(clonedCol, 'span', maxColRange - minColRange);
                return clonedCol;
            });
            const fakeColgroup = SugarElement.fromTag('colgroup');
            append(fakeColgroup, copiedCols);
            return [fakeColgroup];
        }
        else {
            return [];
        }
    };
    const generateRows = (house, minColRange, maxColRange) => map$1(house.all, (row) => {
        const cellsToCopy = filter$2(row.cells, isColInRange(minColRange, maxColRange));
        const copiedCells = map$1(cellsToCopy, (cell) => {
            const clonedCell = deep(cell.element);
            constrainSpan(clonedCell, 'colspan', maxColRange - minColRange);
            return clonedCell;
        });
        const fakeTR = SugarElement.fromTag('tr');
        append(fakeTR, copiedCells);
        return fakeTR;
    });
    const copyCols = (table, target) => {
        const house = Warehouse.fromTable(table);
        const details = onUnlockedCells(house, target);
        return details.map((selectedCells) => {
            const lastSelectedCell = selectedCells[selectedCells.length - 1];
            const minColRange = selectedCells[0].column;
            const maxColRange = lastSelectedCell.column + lastSelectedCell.colspan;
            const fakeColGroups = generateColGroup(house, minColRange, maxColRange);
            const fakeRows = generateRows(house, minColRange, maxColRange);
            return [...fakeColGroups, ...fakeRows];
        });
    };

    const copyRows = (table, target, generators) => {
        const warehouse = Warehouse.fromTable(table);
        // Cannot use onUnlockedCells like extractor here as if only cells in a locked column are selected, then this will be Optional.none and
        // there is now no way of knowing which rows are selected
        const details = onCells(warehouse, target);
        return details.bind((selectedCells) => {
            const grid = toGrid(warehouse, generators, false);
            const rows = extractGridDetails(grid).rows;
            const slicedGrid = rows.slice(selectedCells[0].row, selectedCells[selectedCells.length - 1].row + selectedCells[selectedCells.length - 1].rowspan);
            // Remove any locked cells from the copied grid rows
            const filteredGrid = bind$2(slicedGrid, (row) => {
                const newCells = filter$2(row.cells, (cell) => !cell.isLocked);
                return newCells.length > 0 ? [{ ...row, cells: newCells }] : [];
            });
            const slicedDetails = toDetailList(filteredGrid);
            return someIf(slicedDetails.length > 0, slicedDetails);
        }).map((slicedDetails) => copy(slicedDetails));
    };

    const statsStruct = (minRow, minCol, maxRow, maxCol, allCells, selectedCells) => ({
        minRow,
        minCol,
        maxRow,
        maxCol,
        allCells,
        selectedCells,
    });
    const findSelectedStats = (house, isSelected) => {
        const totalColumns = house.grid.columns;
        const totalRows = house.grid.rows;
        /* Refactor into a method returning a struct to hide the mutation */
        let minRow = totalRows;
        let minCol = totalColumns;
        let maxRow = 0;
        let maxCol = 0;
        const allCells = [];
        const selectedCells = [];
        each$1(house.access, (detail) => {
            allCells.push(detail);
            if (isSelected(detail)) {
                selectedCells.push(detail);
                const startRow = detail.row;
                const endRow = startRow + detail.rowspan - 1;
                const startCol = detail.column;
                const endCol = startCol + detail.colspan - 1;
                if (startRow < minRow) {
                    minRow = startRow;
                }
                else if (endRow > maxRow) {
                    maxRow = endRow;
                }
                if (startCol < minCol) {
                    minCol = startCol;
                }
                else if (endCol > maxCol) {
                    maxCol = endCol;
                }
            }
        });
        return statsStruct(minRow, minCol, maxRow, maxCol, allCells, selectedCells);
    };
    const makeCell = (list, seenSelected, rowIndex) => {
        // no need to check bounds, as anything outside this index is removed in the nested for loop
        const row = list[rowIndex].element;
        const td = SugarElement.fromTag('td');
        append$1(td, SugarElement.fromTag('br'));
        const f = seenSelected ? append$1 : prepend;
        f(row, td);
    };
    const fillInGaps = (list, house, stats, isSelected) => {
        const rows = filter$2(list, (row) => row.section !== 'colgroup');
        const totalColumns = house.grid.columns;
        const totalRows = house.grid.rows;
        // unselected cells have been deleted, now fill in the gaps in the model
        for (let i = 0; i < totalRows; i++) {
            let seenSelected = false;
            for (let j = 0; j < totalColumns; j++) {
                if (!(i < stats.minRow || i > stats.maxRow || j < stats.minCol || j > stats.maxCol)) {
                    // if there is a hole in the table itself, or it's an unselected position, we need a cell
                    const needCell = Warehouse.getAt(house, i, j).filter(isSelected).isNone();
                    if (needCell) {
                        makeCell(rows, seenSelected, i);
                    }
                    else {
                        seenSelected = true;
                    }
                }
            }
        }
    };
    const clean = (replica, stats, house, widthDelta) => {
        // remove columns that are not in the new table
        each$1(house.columns, (col) => {
            if (col.column < stats.minCol || col.column > stats.maxCol) {
                remove$5(col.element);
            }
        });
        // can't use :empty selector as that will not include TRs made up of whitespace
        const emptyRows = filter$2(firstLayer(replica, 'tr'), (row) => 
        // there is no sugar method for this, and Traverse.children() does too much processing
        row.dom.childElementCount === 0);
        each$2(emptyRows, remove$5);
        // If there is only one column, or only one row, delete all the colspan/rowspan
        if (stats.minCol === stats.maxCol || stats.minRow === stats.maxRow) {
            each$2(firstLayer(replica, 'th,td'), (cell) => {
                remove$6(cell, 'rowspan');
                remove$6(cell, 'colspan');
            });
        }
        // Remove any attributes that should not be in the replicated table
        remove$6(replica, LOCKED_COL_ATTR);
        // TODO: TINY-6944 - need to figure out a better way of handling this
        remove$6(replica, 'data-snooker-col-series'); // For advtable series column feature
        const tableSize = TableSize.getTableSize(replica);
        tableSize.adjustTableWidth(widthDelta);
        // TODO TINY-6863: If using relative widths, ensure cell and column widths are redistributed
    };
    const getTableWidthDelta = (table, warehouse, tableSize, stats) => {
        // short circuit entire table selected
        if (stats.minCol === 0 && warehouse.grid.columns === stats.maxCol + 1) {
            return 0;
        }
        const colWidths = getPixelWidths(warehouse, table, tableSize);
        const allColsWidth = foldl(colWidths, (acc, width) => acc + width, 0);
        const selectedColsWidth = foldl(colWidths.slice(stats.minCol, stats.maxCol + 1), (acc, width) => acc + width, 0);
        const newWidth = (selectedColsWidth / allColsWidth) * tableSize.pixelWidth();
        const delta = newWidth - tableSize.pixelWidth();
        return tableSize.getCellDelta(delta);
    };
    const extract$1 = (table, selectedSelector) => {
        const isSelected = (detail) => is$1(detail.element, selectedSelector);
        const replica = deep(table);
        const list = fromTable$1(replica);
        const tableSize = TableSize.getTableSize(table);
        const replicaHouse = Warehouse.generate(list);
        const replicaStats = findSelectedStats(replicaHouse, isSelected);
        // remove unselected cells
        const selector = 'th:not(' + selectedSelector + ')' + ',td:not(' + selectedSelector + ')';
        const unselectedCells = filterFirstLayer(replica, 'th,td', (cell) => is$1(cell, selector));
        each$2(unselectedCells, remove$5);
        fillInGaps(list, replicaHouse, replicaStats, isSelected);
        const house = Warehouse.fromTable(table);
        const widthDelta = getTableWidthDelta(table, house, tableSize, replicaStats);
        clean(replica, replicaStats, replicaHouse, widthDelta);
        return replica;
    };

    const isCol = isTag('col');
    const isColgroup = isTag('colgroup');
    const isRow$1 = (element) => name(element) === 'tr' || isColgroup(element);
    const elementToData = (element) => {
        const colspan = getAttrValue(element, 'colspan', 1);
        const rowspan = getAttrValue(element, 'rowspan', 1);
        return {
            element,
            colspan,
            rowspan
        };
    };
    // note that `toData` seems to be only for testing
    const modification = (generators, toData = elementToData) => {
        const nuCell = (data) => isCol(data.element) ? generators.col(data) : generators.cell(data);
        const nuRow = (data) => isColgroup(data.element) ? generators.colgroup(data) : generators.row(data);
        const add = (element) => {
            if (isRow$1(element)) {
                return nuRow({ element });
            }
            else {
                const cell = element;
                const replacement = nuCell(toData(cell));
                recent = Optional.some({ item: cell, replacement });
                return replacement;
            }
        };
        let recent = Optional.none();
        const getOrInit = (element, comparator) => {
            return recent.fold(() => {
                return add(element);
            }, (p) => {
                return comparator(element, p.item) ? p.replacement : add(element);
            });
        };
        return {
            getOrInit
        };
    };
    const transform$1 = (tag) => {
        return (generators) => {
            const list = [];
            const find = (element, comparator) => {
                return find$1(list, (x) => {
                    return comparator(x.item, element);
                });
            };
            const makeNew = (element) => {
                // Ensure scope is never set on a td element as it's a deprecated attribute
                const attrs = tag === 'td' ? { scope: null } : {};
                const cell = generators.replace(element, tag, attrs);
                list.push({
                    item: element,
                    sub: cell
                });
                return cell;
            };
            const replaceOrInit = (element, comparator) => {
                if (isRow$1(element) || isCol(element)) {
                    return element;
                }
                else {
                    const cell = element;
                    return find(cell, comparator).fold(() => {
                        return makeNew(cell);
                    }, (p) => {
                        return comparator(element, p.item) ? p.sub : makeNew(cell);
                    });
                }
            };
            return {
                replaceOrInit
            };
        };
    };
    const getScopeAttribute = (cell) => getOpt(cell, 'scope').map(
    // Attribute can be col, colgroup, row, and rowgroup.
    // As col and colgroup are to be treated as if they are the same, lob off everything after the first three characters and there is no difference.
    (attribute) => attribute.substr(0, 3));
    const merging = (generators) => {
        const unmerge = (cell) => {
            const scope = getScopeAttribute(cell);
            scope.each((attribute) => set$2(cell, 'scope', attribute));
            return () => {
                const raw = generators.cell({
                    element: cell,
                    colspan: 1,
                    rowspan: 1
                });
                // Remove any width calculations because they are no longer relevant.
                remove$4(raw, 'width');
                remove$4(cell, 'width');
                scope.each((attribute) => set$2(raw, 'scope', attribute));
                return raw;
            };
        };
        const merge = (cells) => {
            const getScopeProperty = () => {
                const stringAttributes = cat(map$1(cells, getScopeAttribute));
                if (stringAttributes.length === 0) {
                    return Optional.none();
                }
                else {
                    const baseScope = stringAttributes[0];
                    const scopes = ['row', 'col'];
                    const isMixed = exists(stringAttributes, (attribute) => {
                        return attribute !== baseScope && contains$2(scopes, attribute);
                    });
                    return isMixed ? Optional.none() : Optional.from(baseScope);
                }
            };
            remove$4(cells[0], 'width');
            getScopeProperty().fold(() => remove$6(cells[0], 'scope'), (attribute) => set$2(cells[0], 'scope', attribute + 'group'));
            return constant(cells[0]);
        };
        return {
            unmerge,
            merge
        };
    };
    const Generators = {
        modification,
        transform: transform$1,
        merging
    };

    const getUpOrLeftCells = (grid, selectedCells) => {
        // Get rows up or at the row of the bottom right cell
        const upGrid = grid.slice(0, selectedCells[selectedCells.length - 1].row + 1);
        const upDetails = toDetailList(upGrid);
        // Get an array of the cells up or to the left of the bottom right cell
        return bind$2(upDetails, (detail) => {
            const slicedCells = detail.cells.slice(0, selectedCells[selectedCells.length - 1].column + 1);
            return map$1(slicedCells, (cell) => cell.element);
        });
    };
    const getDownOrRightCells = (grid, selectedCells) => {
        // Get rows down or at the row of the top left cell (including rowspans)
        const downGrid = grid.slice(selectedCells[0].row + selectedCells[0].rowspan - 1, grid.length);
        const downDetails = toDetailList(downGrid);
        // Get an array of the cells down or to the right of the bottom right cell
        return bind$2(downDetails, (detail) => {
            const slicedCells = detail.cells.slice(selectedCells[0].column + selectedCells[0].colspan - 1, detail.cells.length);
            return map$1(slicedCells, (cell) => cell.element);
        });
    };
    const getOtherCells = (table, target, generators) => {
        const warehouse = Warehouse.fromTable(table);
        const details = onCells(warehouse, target);
        return details.map((selectedCells) => {
            const grid = toGrid(warehouse, generators, false);
            const { rows } = extractGridDetails(grid);
            const upOrLeftCells = getUpOrLeftCells(rows, selectedCells);
            const downOrRightCells = getDownOrRightCells(rows, selectedCells);
            return {
                upOrLeftCells,
                downOrRightCells
            };
        });
    };

    const only = (element, isResizable) => {
        // If element is a 'document', use the document element ('HTML' tag) for appending.
        const parent = isDocument(element) ? documentElement(element) : element;
        return {
            parent: constant(parent),
            view: constant(element),
            dragContainer: constant(parent),
            origin: constant(SugarPosition(0, 0)),
            isResizable
        };
    };
    const detached = (editable, chrome, isResizable) => {
        const origin = () => absolute(chrome);
        return {
            parent: constant(chrome),
            view: constant(editable),
            dragContainer: constant(chrome),
            origin,
            isResizable
        };
    };
    const body = (editable, isResizable) => {
        return {
            parent: constant(editable),
            view: constant(editable),
            dragContainer: constant(editable),
            origin: () => absolute(editable),
            isResizable
        };
    };
    const ResizeWire = {
        only,
        detached,
        body
    };

    const adt$2 = Adt.generate([
        { invalid: ['raw'] },
        { pixels: ['value'] },
        { percent: ['value'] }
    ]);
    const validateFor = (suffix, type, value) => {
        const rawAmount = value.substring(0, value.length - suffix.length);
        const amount = parseFloat(rawAmount);
        return rawAmount === amount.toString() ? type(amount) : adt$2.invalid(value);
    };
    const from = (value) => {
        if (endsWith(value, '%')) {
            return validateFor('%', adt$2.percent, value);
        }
        if (endsWith(value, 'px')) {
            return validateFor('px', adt$2.pixels, value);
        }
        return adt$2.invalid(value);
    };
    const Size = {
        ...adt$2,
        from
    };

    // Convert all column widths to percent.
    const redistributeToPercent = (widths, totalWidth) => {
        return map$1(widths, (w) => {
            const colType = Size.from(w);
            return colType.fold(() => {
                return w;
            }, (px) => {
                const ratio = px / totalWidth * 100;
                return ratio + '%';
            }, (pc) => {
                return pc + '%';
            });
        });
    };
    const redistributeToPx = (widths, totalWidth, newTotalWidth) => {
        const scale = newTotalWidth / totalWidth;
        return map$1(widths, (w) => {
            const colType = Size.from(w);
            return colType.fold(() => {
                return w;
            }, (px) => {
                return (px * scale) + 'px';
            }, (pc) => {
                return (pc / 100 * newTotalWidth) + 'px';
            });
        });
    };
    const redistributeEmpty = (newWidthType, columns) => {
        const f = newWidthType.fold(() => constant(''), (pixels) => {
            const num = pixels / columns;
            return constant(num + 'px');
        }, () => {
            const num = 100 / columns;
            return constant(num + '%');
        });
        return range$1(columns, f);
    };
    const redistributeValues = (newWidthType, widths, totalWidth) => {
        return newWidthType.fold(() => {
            return widths;
        }, (px) => {
            return redistributeToPx(widths, totalWidth, px);
        }, (_pc) => {
            return redistributeToPercent(widths, totalWidth);
        });
    };
    const redistribute$1 = (widths, totalWidth, newWidth) => {
        const newType = Size.from(newWidth);
        const floats = forall(widths, (s) => {
            return s === '0px';
        }) ? redistributeEmpty(newType, widths.length) : redistributeValues(newType, widths, totalWidth);
        return normalize(floats);
    };
    const sum = (values, fallback) => {
        if (values.length === 0) {
            return fallback;
        }
        return foldr(values, (rest, v) => {
            return Size.from(v).fold(constant(0), identity, identity) + rest;
        }, 0);
    };
    const roundDown = (num, unit) => {
        const floored = Math.floor(num);
        return { value: floored + unit, remainder: num - floored };
    };
    const add = (value, amount) => {
        return Size.from(value).fold(constant(value), (px) => {
            return (px + amount) + 'px';
        }, (pc) => {
            return (pc + amount) + '%';
        });
    };
    const normalize = (values) => {
        if (values.length === 0) {
            return values;
        }
        const scan = foldr(values, (rest, value) => {
            const info = Size.from(value).fold(() => ({ value, remainder: 0 }), (num) => roundDown(num, 'px'), (num) => ({ value: num + '%', remainder: 0 }));
            return {
                output: [info.value].concat(rest.output),
                remainder: rest.remainder + info.remainder
            };
        }, { output: [], remainder: 0 });
        const r = scan.output;
        return r.slice(0, r.length - 1).concat([add(r[r.length - 1], Math.round(scan.remainder))]);
    };
    const validate = Size.from;

    const redistributeToW = (newWidths, cells, unit) => {
        each$2(cells, (cell) => {
            const widths = newWidths.slice(cell.column, cell.colspan + cell.column);
            const w = sum(widths, minWidth());
            set$1(cell.element, 'width', w + unit);
        });
    };
    const redistributeToColumns = (newWidths, columns, unit) => {
        each$2(columns, (column, index) => {
            const width = sum([newWidths[index]], minWidth());
            set$1(column.element, 'width', width + unit);
        });
    };
    const redistributeToH = (newHeights, rows, cells) => {
        each$2(cells, (cell) => {
            remove$4(cell.element, 'height');
        });
        each$2(rows, (row, i) => {
            set$1(row.element, 'height', newHeights[i]);
        });
    };
    const getUnit = (newSize) => {
        return validate(newSize).fold(constant('px'), constant('px'), constant('%'));
    };
    // Procedure to resize table dimensions to optWidth x optHeight and redistribute cell and row dimensions.
    // Updates CSS of the table, rows, and cells.
    const redistribute = (table, optWidth, optHeight) => {
        const warehouse = Warehouse.fromTable(table);
        const rows = warehouse.all;
        const cells = Warehouse.justCells(warehouse);
        const columns = Warehouse.justColumns(warehouse);
        optWidth.each((newWidth) => {
            const widthUnit = getUnit(newWidth);
            const totalWidth = get$7(table);
            const oldWidths = getRawWidths(warehouse, table);
            const nuWidths = redistribute$1(oldWidths, totalWidth, newWidth);
            if (Warehouse.hasColumns(warehouse)) {
                redistributeToColumns(nuWidths, columns, widthUnit);
            }
            else {
                redistributeToW(nuWidths, cells, widthUnit);
            }
            set$1(table, 'width', newWidth);
        });
        optHeight.each((newHeight) => {
            const totalHeight = get$8(table);
            const oldHeights = getRawHeights(warehouse, table);
            const nuHeights = redistribute$1(oldHeights, totalHeight, newHeight);
            redistributeToH(nuHeights, rows, cells);
            set$1(table, 'height', newHeight);
        });
    };
    const isPercentSizing = isPercentSizing$1;
    const isPixelSizing = isPixelSizing$1;
    const isNoneSizing = isNoneSizing$1;

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
        const clone = (element) => {
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
            return contains$2(TagBoundaries, name(element));
        };
        const isEmptyTag = (element) => {
            if (!isElement(element)) {
                return false;
            }
            return contains$2(['br', 'img', 'hr', 'input'], name(element));
        };
        const isNonEditable = (element) => isElement(element) && get$b(element, 'contenteditable') === 'false';
        const comparePosition = (element, other) => {
            return element.dom.compareDocumentPosition(other.dom);
        };
        const copyAttributesTo = (source, destination) => {
            const as = clone$1(source);
            setAll$1(destination, as);
        };
        const isSpecial = (element) => {
            const tag = name(element);
            return contains$2([
                'script', 'noscript', 'iframe', 'noframes', 'noembed', 'title', 'style', 'textarea', 'xmp'
            ], tag);
        };
        const getLanguage = (element) => isElement(element) ? getOpt(element, 'lang') : Optional.none();
        return {
            up: constant({
                selector: ancestor$1,
                closest: closest$1,
                predicate: ancestor$2,
                all: parents
            }),
            down: constant({
                selector: descendants,
                predicate: descendants$1
            }),
            styles: constant({
                get: get$9,
                getRaw: getRaw$2,
                set: set$1,
                remove: remove$4
            }),
            attrs: constant({
                get: get$b,
                set: set$2,
                remove: remove$6,
                copyTo: copyAttributesTo
            }),
            insert: constant({
                before: before$3,
                after: after$4,
                afterAll: after$3,
                append: append$1,
                appendAll: append,
                prepend: prepend,
                wrap: wrap
            }),
            remove: constant({
                unwrap: unwrap,
                remove: remove$5
            }),
            create: constant({
                nu: SugarElement.fromTag,
                clone,
                text: SugarElement.fromText
            }),
            query: constant({
                comparePosition,
                prevSibling: prevSibling,
                nextSibling: nextSibling
            }),
            property: constant({
                children: children$2,
                name: name,
                parent: parent,
                document,
                isText: isText,
                isComment: isComment,
                isElement: isElement,
                isSpecial,
                getLanguage,
                getText: get$5,
                setText: set,
                isBoundary,
                isEmptyTag,
                isNonEditable
            }),
            eq: eq$1,
            is: is
        };
    };

    const traverse = (item, mode) => ({
        item,
        mode
    });
    const backtrack = (universe, item, _direction, transition = sidestep) => {
        return universe.property().parent(item).map((p) => {
            return traverse(p, transition);
        });
    };
    const sidestep = (universe, item, direction, transition = advance) => {
        return direction.sibling(universe, item).map((p) => {
            return traverse(p, transition);
        });
    };
    const advance = (universe, item, direction, transition = advance) => {
        const children = universe.property().children(item);
        const result = direction.first(children);
        return result.map((r) => {
            return traverse(r, transition);
        });
    };
    /*
     * Rule breakdown:
     *
     * current: the traversal that we are applying.
     * next: the next traversal to apply if the current traversal succeeds (e.g. advance after sidestepping)
     * fallback: the traversal to fallback to when the current traversal does not find a node
     */
    const successors = [
        { current: backtrack, next: sidestep, fallback: Optional.none() },
        { current: sidestep, next: advance, fallback: Optional.some(backtrack) },
        { current: advance, next: advance, fallback: Optional.some(sidestep) }
    ];
    const go = (universe, item, mode, direction, rules = successors) => {
        // INVESTIGATE: Find a way which doesn't require an array search first to identify the current mode.
        const ruleOpt = find$1(rules, (succ) => {
            return succ.current === mode;
        });
        return ruleOpt.bind((rule) => {
            // Attempt the current mode. If not, use the fallback and try again.
            return rule.current(universe, item, direction, rule.next).orThunk(() => {
                return rule.fallback.bind((fb) => {
                    return go(universe, item, fb, direction);
                });
            });
        });
    };

    const left$1 = () => {
        const sibling = (universe, item) => {
            return universe.query().prevSibling(item);
        };
        const first = (children) => {
            return children.length > 0 ? Optional.some(children[children.length - 1]) : Optional.none();
        };
        return {
            sibling,
            first
        };
    };
    const right$1 = () => {
        const sibling = (universe, item) => {
            return universe.query().nextSibling(item);
        };
        const first = (children) => {
            return children.length > 0 ? Optional.some(children[0]) : Optional.none();
        };
        return {
            sibling,
            first
        };
    };
    const Walkers = {
        left: left$1,
        right: right$1
    };

    const hone = (universe, item, predicate, mode, direction, isRoot) => {
        const next = go(universe, item, mode, direction);
        return next.bind((n) => {
            if (isRoot(n.item)) {
                return Optional.none();
            }
            else {
                return predicate(n.item) ? Optional.some(n.item) : hone(universe, n.item, predicate, n.mode, direction, isRoot);
            }
        });
    };
    const left = (universe, item, predicate, isRoot) => {
        return hone(universe, item, predicate, sidestep, Walkers.left(), isRoot);
    };
    const right = (universe, item, predicate, isRoot) => {
        return hone(universe, item, predicate, sidestep, Walkers.right(), isRoot);
    };

    const point = (element, offset) => ({
        element,
        offset
    });

    const scan$1 = (universe, element, direction) => {
        // if a comment or zero-length text, scan the siblings
        if ((universe.property().isText(element) && universe.property().getText(element).trim().length === 0)
            || universe.property().isComment(element)) {
            return direction(element).bind((elem) => {
                return scan$1(universe, elem, direction).orThunk(() => {
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
        const candidate = scan$1(universe, element, universe.query().prevSibling).getOr(element);
        if (universe.property().isText(candidate)) {
            return point(candidate, toEnd(universe, candidate));
        }
        const children = universe.property().children(candidate);
        return children.length > 0 ? freefallRtl$2(universe, children[children.length - 1]) : point(candidate, toEnd(universe, candidate));
    };

    const freefallRtl$1 = freefallRtl$2;

    const universe$3 = DomUniverse();
    const freefallRtl = (element) => {
        return freefallRtl$1(universe$3, element);
    };

    const isLeaf = (universe) => (element) => universe.property().children(element).length === 0;
    const before$1 = (universe, item, isRoot) => {
        return seekLeft$1(universe, item, isLeaf(universe), isRoot);
    };
    const after$1 = (universe, item, isRoot) => {
        return seekRight$1(universe, item, isLeaf(universe), isRoot);
    };
    const seekLeft$1 = left;
    const seekRight$1 = right;
    go;

    const universe$2 = DomUniverse();
    const before = (element, isRoot) => {
        return before$1(universe$2, element, isRoot);
    };
    const after = (element, isRoot) => {
        return after$1(universe$2, element, isRoot);
    };
    const seekLeft = (element, predicate, isRoot) => {
        return seekLeft$1(universe$2, element, predicate, isRoot);
    };
    const seekRight = (element, predicate, isRoot) => {
        return seekRight$1(universe$2, element, predicate, isRoot);
    };

    const blockList = [
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
        // --- NOTE, TagBoundaries has li here. That means universe.isBoundary => true for li tags.
        'table',
        'thead',
        'tfoot',
        'tbody',
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
    const isList$1 = (universe, item) => {
        const tagName = universe.property().name(item);
        return contains$2(['ol', 'ul'], tagName);
    };
    const isBlock$1 = (universe, item) => {
        const tagName = universe.property().name(item);
        return contains$2(blockList, tagName);
    };
    const isEmptyTag$1 = (universe, item) => {
        return contains$2(['br', 'img', 'hr', 'input'], universe.property().name(item));
    };

    const leftRight = (left, right) => ({
        left,
        right
    });
    const brokenPath = (first, second, splits) => ({
        first,
        second,
        splits
    });
    const bisect = (universe, parent, child) => {
        const children = universe.property().children(parent);
        const index = findIndex(children, curry(universe.eq, child));
        return index.map((ind) => {
            return {
                before: children.slice(0, ind),
                after: children.slice(ind + 1)
            };
        });
    };
    /**
     * Clone parent to the RIGHT and move everything after child in the parent element into
     * a clone of the parent (placed after parent).
     */
    const breakToRight = (universe, parent, child) => {
        return bisect(universe, parent, child).map((parts) => {
            const second = universe.create().clone(parent);
            universe.insert().appendAll(second, parts.after);
            universe.insert().after(parent, second);
            return leftRight(parent, second);
        });
    };
    /**
     * Clone parent to the LEFT and move everything before and including child into
     * the a clone of the parent (placed before parent)
     */
    const breakToLeft = (universe, parent, child) => {
        return bisect(universe, parent, child).map((parts) => {
            const prior = universe.create().clone(parent);
            universe.insert().appendAll(prior, parts.before.concat([child]));
            universe.insert().appendAll(parent, parts.after);
            universe.insert().before(parent, prior);
            return leftRight(prior, parent);
        });
    };
    /*
     * Using the breaker, break from the child up to the top element defined by the predicate.
     * It returns three values:
     *   first: the top level element that completed the break
     *   second: the optional element representing second part of the top-level split if the breaking completed successfully to the top
     *   splits: a list of (Element, Element) pairs that represent the splits that have occurred on the way to the top.
     */
    const breakPath = (universe, item, isTop, breaker) => {
        const next = (child, group, splits) => {
            const fallback = brokenPath(child, Optional.none(), splits);
            // Found the top, so stop.
            if (isTop(child)) {
                return brokenPath(child, group, splits);
            }
            else {
                // Split the child at parent, and keep going
                return universe.property().parent(child).bind((parent) => {
                    return breaker(universe, parent, child).map((breakage) => {
                        const extra = [{ first: breakage.left, second: breakage.right }];
                        // Our isTop is based on the left-side parent, so keep it regardless of split.
                        const nextChild = isTop(parent) ? parent : breakage.left;
                        return next(nextChild, Optional.some(breakage.right), splits.concat(extra));
                    });
                }).getOr(fallback);
            }
        };
        return next(item, Optional.none(), []);
    };

    const all = (universe, look, elements, f) => {
        const head = elements[0];
        const tail = elements.slice(1);
        return f(universe, look, head, tail);
    };
    /**
     * Check if look returns the same element for all elements, and return it if it exists.
     */
    const oneAll = (universe, look, elements) => {
        return elements.length > 0 ?
            all(universe, look, elements, unsafeOne) :
            Optional.none();
    };
    const unsafeOne = (universe, look, head, tail) => {
        const start = look(universe, head);
        return foldr(tail, (b, a) => {
            const current = look(universe, a);
            return commonElement(universe, b, current);
        }, start);
    };
    const commonElement = (universe, start, end) => {
        return start.bind((s) => {
            return end.filter(curry(universe.eq, s));
        });
    };

    const eq = (universe, item) => {
        return curry(universe.eq, item);
    };
    // Note: this can be exported if it is required in the future.
    const ancestors$2 = (universe, start, end, isRoot = never) => {
        // Inefficient if no isRoot is supplied.
        // TODO: Andy knows there is a graph-based algorithm to find a common parent, but can't remember it
        //        This also includes something to get the subset after finding the common parent
        const ps1 = [start].concat(universe.up().all(start));
        const ps2 = [end].concat(universe.up().all(end));
        const prune = (path) => {
            const index = findIndex(path, isRoot);
            return index.fold(() => {
                return path;
            }, (ind) => {
                return path.slice(0, ind + 1);
            });
        };
        const pruned1 = prune(ps1);
        const pruned2 = prune(ps2);
        const shared = find$1(pruned1, (x) => {
            return exists(pruned2, eq(universe, x));
        });
        return {
            firstpath: pruned1,
            secondpath: pruned2,
            shared
        };
    };

    const sharedOne$1 = oneAll;
    const ancestors$1 = ancestors$2;
    breakToLeft;
    breakToRight;
    breakPath;

    const universe$1 = DomUniverse();
    const sharedOne = (look, elements) => {
        return sharedOne$1(universe$1, (_universe, element) => {
            return look(element);
        }, elements);
    };
    const ancestors = (start, finish, isRoot) => {
        return ancestors$1(universe$1, start, finish, isRoot);
    };

    const universe = DomUniverse();
    const isBlock = (element) => {
        return isBlock$1(universe, element);
    };
    const isList = (element) => {
        return isList$1(universe, element);
    };
    const isEmptyTag = (element) => {
        return isEmptyTag$1(universe, element);
    };

    const merge$2 = (cells) => {
        const isBr = isTag('br');
        const advancedBr = (children) => {
            return forall(children, (c) => {
                return isBr(c) || (isText(c) && get$5(c).trim().length === 0);
            });
        };
        const isListItem = (el) => {
            return name(el) === 'li' || ancestor$2(el, isList).isSome();
        };
        const siblingIsBlock = (el) => {
            return nextSibling(el).map((rightSibling) => {
                if (isBlock(rightSibling)) {
                    return true;
                }
                if (isEmptyTag(rightSibling)) {
                    return name(rightSibling) === 'img' ? false : true;
                }
                return false;
            }).getOr(false);
        };
        const markCell = (cell) => {
            return last(cell).bind((rightEdge) => {
                const rightSiblingIsBlock = siblingIsBlock(rightEdge);
                return parent(rightEdge).map((parent) => {
                    return rightSiblingIsBlock === true || isListItem(parent) || isBr(rightEdge) || (isBlock(parent) && !eq$1(cell, parent)) ? [] : [SugarElement.fromTag('br')];
                });
            }).getOr([]);
        };
        const markContent = () => {
            const content = bind$2(cells, (cell) => {
                const children = children$2(cell);
                return advancedBr(children) ? [] : children.concat(markCell(cell));
            });
            return content.length === 0 ? [SugarElement.fromTag('br')] : content;
        };
        const contents = markContent();
        empty(cells[0]);
        append(cells[0], contents);
    };

    // Remove legacy sizing attributes such as "width"
    const cleanupLegacyAttributes = (element) => {
        remove$6(element, 'width');
        remove$6(element, 'height');
    };
    const convertToPercentSizeWidth = (table) => {
        const newWidth = getPercentTableWidth(table);
        redistribute(table, Optional.some(newWidth), Optional.none());
        cleanupLegacyAttributes(table);
    };
    const convertToPixelSizeWidth = (table) => {
        const newWidth = getPixelTableWidth(table);
        redistribute(table, Optional.some(newWidth), Optional.none());
        cleanupLegacyAttributes(table);
    };
    const convertToPixelSizeHeight = (table) => {
        const newHeight = getPixelTableHeight(table);
        redistribute(table, Optional.none(), Optional.some(newHeight));
        cleanupLegacyAttributes(table);
    };
    const convertToNoneSizeWidth = (table) => {
        remove$4(table, 'width');
        const columns = columns$1(table);
        const rowElements = columns.length > 0 ? columns : cells$1(table);
        each$2(rowElements, (cell) => {
            remove$4(cell, 'width');
            cleanupLegacyAttributes(cell);
        });
        cleanupLegacyAttributes(table);
    };

    const transferableAttributes = {
        scope: [
            'row',
            'col'
        ]
    };
    // NOTE: This may create a td instead of a th, but it is for irregular table handling.
    const createCell = (doc) => () => {
        const td = SugarElement.fromTag('td', doc.dom);
        append$1(td, SugarElement.fromTag('br', doc.dom));
        return td;
    };
    const createCol = (doc) => () => {
        return SugarElement.fromTag('col', doc.dom);
    };
    const createColgroup = (doc) => () => {
        return SugarElement.fromTag('colgroup', doc.dom);
    };
    const createRow$1 = (doc) => () => {
        return SugarElement.fromTag('tr', doc.dom);
    };
    const replace$1 = (cell, tag, attrs) => {
        const replica = copy$2(cell, tag);
        // TODO: Snooker passes null to indicate 'remove attribute'
        each$1(attrs, (v, k) => {
            if (v === null) {
                remove$6(replica, k);
            }
            else {
                set$2(replica, k, v);
            }
        });
        return replica;
    };
    // eslint-disable-next-line @tinymce/prefer-fun
    const pasteReplace = (cell) => {
        // TODO: check for empty content and don't return anything
        return cell;
    };
    const cloneFormats = (oldCell, newCell, formats) => {
        const first$1 = first(oldCell);
        return first$1.map((firstText) => {
            const formatSelector = formats.join(',');
            // Find the ancestors of the first text node that match the given formats.
            const parents = ancestors$3(firstText, formatSelector, (element) => {
                return eq$1(element, oldCell);
            });
            // Add the matched ancestors to the new cell, then return the new cell.
            return foldr(parents, (last, parent) => {
                const clonedFormat = shallow(parent);
                append$1(last, clonedFormat);
                return clonedFormat;
            }, newCell);
        }).getOr(newCell);
    };
    const cloneAppropriateAttributes = (original, clone) => {
        each$1(transferableAttributes, (validAttributes, attributeName) => getOpt(original, attributeName)
            .filter((attribute) => contains$2(validAttributes, attribute))
            .each((attribute) => set$2(clone, attributeName, attribute)));
    };
    const cellOperations = (mutate, doc, formatsToClone) => {
        const cloneCss = (prev, clone) => {
            // inherit the style and width, dont inherit the row height
            copy$1(prev.element, clone);
            remove$4(clone, 'height');
            // dont inherit the width of spanning columns
            if (prev.colspan !== 1) {
                remove$4(clone, 'width');
            }
        };
        const newCell = (prev) => {
            const td = SugarElement.fromTag(name(prev.element), doc.dom);
            const formats = formatsToClone.getOr(['strong', 'em', 'b', 'i', 'span', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div']);
            // If we aren't cloning the child formatting, we can just give back the new td immediately.
            const lastNode = formats.length > 0 ? cloneFormats(prev.element, td, formats) : td;
            append$1(lastNode, SugarElement.fromTag('br'));
            cloneCss(prev, td);
            cloneAppropriateAttributes(prev.element, td);
            mutate(prev.element, td);
            return td;
        };
        const newCol = (prev) => {
            const col = SugarElement.fromTag(name(prev.element), doc.dom);
            cloneCss(prev, col);
            mutate(prev.element, col);
            return col;
        };
        return {
            col: newCol,
            colgroup: createColgroup(doc),
            row: createRow$1(doc),
            cell: newCell,
            replace: replace$1,
            colGap: createCol(doc),
            gap: createCell(doc)
        };
    };
    const paste$1 = (doc) => {
        return {
            col: createCol(doc),
            colgroup: createColgroup(doc),
            row: createRow$1(doc),
            cell: createCell(doc),
            replace: pasteReplace,
            colGap: createCol(doc),
            gap: createCell(doc)
        };
    };

    const getGridSize = (table) => {
        const warehouse = Warehouse.fromTable(table);
        return warehouse.grid;
    };

    // substitution: () -> item
    const merge$1 = (grid, bounds, comparator, substitution) => {
        const rows = extractGridDetails(grid).rows;
        // Mutating. Do we care about the efficiency gain?
        if (rows.length === 0) {
            return grid;
        }
        for (let i = bounds.startRow; i <= bounds.finishRow; i++) {
            for (let j = bounds.startCol; j <= bounds.finishCol; j++) {
                // We can probably simplify this again now that we aren't reusing merge.
                const row = rows[i];
                const isLocked = getCell(row, j).isLocked;
                mutateCell(row, j, elementnew(substitution(), false, isLocked));
            }
        }
        return grid;
    };
    // substitution: () -> item
    const unmerge = (grid, target, comparator, substitution) => {
        const rows = extractGridDetails(grid).rows;
        // Mutating. Do we care about the efficiency gain?
        let first = true;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < cellLength(rows[0]); j++) {
                const row = rows[i];
                const currentCell = getCell(row, j);
                const currentCellElm = currentCell.element;
                const isToReplace = comparator(currentCellElm, target);
                if (isToReplace && !first) {
                    mutateCell(row, j, elementnew(substitution(), true, currentCell.isLocked));
                }
                else if (isToReplace) {
                    first = false;
                }
            }
        }
        return grid;
    };
    const uniqueCells = (row, comparator) => {
        return foldl(row, (rest, cell) => {
            return exists(rest, (currentCell) => {
                return comparator(currentCell.element, cell.element);
            }) ? rest : rest.concat([cell]);
        }, []);
    };
    const splitCols = (grid, index, comparator, substitution) => {
        // We don't need to split rows if we're inserting at the first or last row of the old table
        if (index > 0 && index < grid[0].cells.length) {
            each$2(grid, (row) => {
                const prevCell = row.cells[index - 1];
                let offset = 0;
                const substitute = substitution();
                while (row.cells.length > index + offset && comparator(prevCell.element, row.cells[index + offset].element)) {
                    mutateCell(row, index + offset, elementnew(substitute, true, row.cells[index + offset].isLocked));
                    offset++;
                }
            });
        }
        return grid;
    };
    const splitRows = (grid, index, comparator, substitution) => {
        // We don't need to split rows if we're inserting at the first or last row of the old table
        const rows = extractGridDetails(grid).rows;
        if (index > 0 && index < rows.length) {
            const rowPrevCells = rows[index - 1].cells;
            const cells = uniqueCells(rowPrevCells, comparator);
            each$2(cells, (cell) => {
                // only make a sub when we have to
                let replacement = Optional.none();
                for (let i = index; i < rows.length; i++) {
                    for (let j = 0; j < cellLength(rows[0]); j++) {
                        const row = rows[i];
                        const current = getCell(row, j);
                        const isToReplace = comparator(current.element, cell.element);
                        if (isToReplace) {
                            if (replacement.isNone()) {
                                replacement = Optional.some(substitution());
                            }
                            replacement.each((sub) => {
                                mutateCell(row, j, elementnew(sub, true, current.isLocked));
                            });
                        }
                    }
                }
            });
        }
        return grid;
    };

    /*
      Fitment, is a module used to ensure that the Inserted table (gridB) can fit squareley within the Host table (gridA).
        - measure returns a delta of rows and cols, eg:
            - col: 3 means gridB can fit with 3 spaces to spare
            - row: -5 means gridB can needs 5 more rows to completely fit into gridA
            - col: 0, row: 0 depics perfect fitment

        - tailor, requires a delta and returns grid that is built to match the delta, tailored to fit.
          eg: 3x3 gridA, with a delta col: -3, row: 2 returns a new grid 3 rows x 6 cols

        - assumptions: All grids used by this module should be rectangular
    */
    const measure = (startAddress, gridA, gridB) => {
        if (startAddress.row >= gridA.length || startAddress.column > cellLength(gridA[0])) {
            return Result.error('invalid start address out of table bounds, row: ' + startAddress.row + ', column: ' + startAddress.column);
        }
        const rowRemainder = gridA.slice(startAddress.row);
        const colRemainder = rowRemainder[0].cells.slice(startAddress.column);
        const colRequired = cellLength(gridB[0]);
        const rowRequired = gridB.length;
        return Result.value({
            rowDelta: rowRemainder.length - rowRequired,
            colDelta: colRemainder.length - colRequired
        });
    };
    const measureWidth = (gridA, gridB) => {
        const colLengthA = cellLength(gridA[0]);
        const colLengthB = cellLength(gridB[0]);
        return {
            rowDelta: 0,
            colDelta: colLengthA - colLengthB
        };
    };
    const measureHeight = (gridA, gridB) => {
        const rowLengthA = gridA.length;
        const rowLengthB = gridB.length;
        return {
            rowDelta: rowLengthA - rowLengthB,
            colDelta: 0
        };
    };
    const generateElements = (amount, row, generators, isLocked) => {
        const generator = row.section === 'colgroup' ? generators.col : generators.cell;
        return range$1(amount, (idx) => elementnew(generator(), true, isLocked(idx)));
    };
    const rowFill = (grid, amount, generators, lockedColumns) => {
        const exampleRow = grid[grid.length - 1];
        return grid.concat(range$1(amount, () => {
            const generator = exampleRow.section === 'colgroup' ? generators.colgroup : generators.row;
            const row = clone$2(exampleRow, generator, identity);
            const elements = generateElements(row.cells.length, row, generators, (idx) => has$1(lockedColumns, idx.toString()));
            return setCells(row, elements);
        }));
    };
    const colFill = (grid, amount, generators, startIndex) => map$1(grid, (row) => {
        const newChildren = generateElements(amount, row, generators, never);
        return addCells(row, startIndex, newChildren);
    });
    const lockedColFill = (grid, generators, lockedColumns) => map$1(grid, (row) => {
        return foldl(lockedColumns, (acc, colNum) => {
            const newChild = generateElements(1, row, generators, always)[0];
            return addCell(acc, colNum, newChild);
        }, row);
    });
    const tailor = (gridA, delta, generators) => {
        const fillCols = delta.colDelta < 0 ? colFill : identity;
        const fillRows = delta.rowDelta < 0 ? rowFill : identity;
        const lockedColumns = getLockedColumnsFromGrid(gridA);
        const gridWidth = cellLength(gridA[0]);
        const isLastColLocked = exists(lockedColumns, (locked) => locked === gridWidth - 1);
        const modifiedCols = fillCols(gridA, Math.abs(delta.colDelta), generators, isLastColLocked ? gridWidth - 1 : gridWidth);
        // Need to recalculate locked column positions
        const newLockedColumns = getLockedColumnsFromGrid(modifiedCols);
        return fillRows(modifiedCols, Math.abs(delta.rowDelta), generators, mapToObject(newLockedColumns, always));
    };

    const isSpanning = (grid, row, col, comparator) => {
        const candidate = getCell(grid[row], col);
        const matching = curry(comparator, candidate.element);
        const currentRow = grid[row];
        // sanity check, 1x1 has no spans
        return grid.length > 1 && cellLength(currentRow) > 1 &&
            (
            // search left, if we're not on the left edge
            // search down, if we're not on the bottom edge
            (col > 0 && matching(getCellElement(currentRow, col - 1))) ||
                // search right, if we're not on the right edge
                (col < currentRow.cells.length - 1 && matching(getCellElement(currentRow, col + 1))) ||
                // search up, if we're not on the top edge
                (row > 0 && matching(getCellElement(grid[row - 1], col))) ||
                (row < grid.length - 1 && matching(getCellElement(grid[row + 1], col))));
    };
    const mergeTables = (startAddress, gridA, gridBRows, generator, comparator, lockedColumns) => {
        // Assumes
        //  - gridA is square and gridB is square
        const startRow = startAddress.row;
        const startCol = startAddress.column;
        const mergeHeight = gridBRows.length;
        const mergeWidth = cellLength(gridBRows[0]);
        const endRow = startRow + mergeHeight;
        const endCol = startCol + mergeWidth + lockedColumns.length;
        const lockedColumnObj = mapToObject(lockedColumns, always);
        // embrace the mutation - I think this is easier to follow? To discuss.
        for (let r = startRow; r < endRow; r++) {
            let skippedCol = 0;
            for (let c = startCol; c < endCol; c++) {
                if (lockedColumnObj[c]) {
                    skippedCol++;
                    continue;
                }
                if (isSpanning(gridA, r, c, comparator)) {
                    // mutation within mutation, it's mutatception
                    unmerge(gridA, getCellElement(gridA[r], c), comparator, generator.cell);
                }
                const gridBColIndex = c - startCol - skippedCol;
                const newCell = getCell(gridBRows[r - startRow], gridBColIndex);
                // This can't be a col element at this point so we can cast it to a cell
                const newCellElm = newCell.element;
                const replacement = generator.replace(newCellElm);
                mutateCell(gridA[r], c, elementnew(replacement, true, newCell.isLocked));
            }
        }
        return gridA;
    };
    const getValidStartAddress = (currentStartAddress, grid, lockedColumns) => {
        const gridColLength = cellLength(grid[0]);
        /*
          When we paste from a table without colgroups to a table that has them, we need to ensure we are inserting them at
          the correct row index (the `col`s are treated as cells in the Structs.RowCells array).
      
          To do this, we get the number of `col`s in the destination table and add that to the startAddress row.
        */
        const adjustedRowAddress = extractGridDetails(grid).cols.length + currentStartAddress.row;
        const possibleColAddresses = range$1(gridColLength - currentStartAddress.column, (num) => num + currentStartAddress.column);
        // Find a starting column address that isn't a locked column
        const validColAddress = find$1(possibleColAddresses, (num) => forall(lockedColumns, (col) => col !== num)).getOr(gridColLength - 1);
        return {
            row: adjustedRowAddress,
            column: validColAddress
        };
    };
    const getLockedColumnsWithinBounds = (startAddress, rows, lockedColumns) => filter$2(lockedColumns, (colNum) => colNum >= startAddress.column && colNum <= cellLength(rows[0]) + startAddress.column);
    const merge = (startAddress, gridA, gridB, generator, comparator) => {
        const lockedColumns = getLockedColumnsFromGrid(gridA);
        const validStartAddress = getValidStartAddress(startAddress, gridA, lockedColumns);
        /*
          We always remove the cols (extract the rows) from the table being pasted. This ensures that if we are pasting from a table with colgroups into a table
          without them, we don't insert the `col` elements as if they were `td`s
        */
        const gridBRows = extractGridDetails(gridB).rows;
        const lockedColumnsWithinBounds = getLockedColumnsWithinBounds(validStartAddress, gridBRows, lockedColumns);
        const result = measure(validStartAddress, gridA, gridBRows);
        /*
          Need to subtract extra delta for locked columns between startAddress and the startAddress + gridB column count as
          locked column cells cannot be merged into. Therefore, extra column cells need to be added to gridA to allow gridB cells to be merged
        */
        return result.map((diff) => {
            const delta = {
                ...diff,
                colDelta: diff.colDelta - lockedColumnsWithinBounds.length
            };
            const fittedGrid = tailor(gridA, delta, generator);
            // Need to recalculate lockedColumnsWithinBounds as tailoring may have inserted columns before last locked column which changes the locked index
            const newLockedColumns = getLockedColumnsFromGrid(fittedGrid);
            const newLockedColumnsWithinBounds = getLockedColumnsWithinBounds(validStartAddress, gridBRows, newLockedColumns);
            return mergeTables(validStartAddress, fittedGrid, gridBRows, generator, comparator, newLockedColumnsWithinBounds);
        });
    };
    const insertCols = (index, gridA, gridB, generator, comparator) => {
        splitCols(gridA, index, comparator, generator.cell);
        const delta = measureHeight(gridB, gridA);
        const fittedNewGrid = tailor(gridB, delta, generator);
        const secondDelta = measureHeight(gridA, fittedNewGrid);
        const fittedOldGrid = tailor(gridA, secondDelta, generator);
        return map$1(fittedOldGrid, (gridRow, i) => {
            return addCells(gridRow, index, fittedNewGrid[i].cells);
        });
    };
    /*
      Inserting rows with locked columns
      - Tailor gridA first (this needs to be done first as the position of the locked columns may change when tailoring gridA and the location of the locked columns needs to be stable before tailoring gridB)
        - measure delta between gridA and gridB (pasted rows) - if negative colDelta, gridA needs extra columns added to match gridB
        - need to calculate how many columns in gridB cannot be directly inserted into gridA - this is how many extra columns need to be added to gridA (this consideres the fact locked column cannot be inserted into)
          - nonLockedGridA + lockedGridA - gridB = colDelta (By subtracting locked column count, can get required diff)
        - tailor gridA by adding the required extra columns if necessary either at the end of gridA or before the last column depending on whether it is locked
      - Recalculate where the locked columns are in gridA after tailoring
      - Measure and determine if extra columns need to be added to gridB (locked columns should not count towards the delta as colFilling (adding extra columns) for locked columns is handled separately)
      - Do a lockedColFill on gridB
      - Tailor gridB by adding extra columns to end of gridB if required
    */
    const insertRows = (index, gridA, gridB, generator, comparator) => {
        splitRows(gridA, index, comparator, generator.cell);
        const locked = getLockedColumnsFromGrid(gridA);
        const diff = measureWidth(gridA, gridB);
        const delta = {
            ...diff,
            colDelta: diff.colDelta - locked.length
        };
        const fittedOldGrid = tailor(gridA, delta, generator);
        const { cols: oldCols, rows: oldRows } = extractGridDetails(fittedOldGrid);
        const newLocked = getLockedColumnsFromGrid(fittedOldGrid);
        const secondDiff = measureWidth(gridB, gridA);
        // Don't want the locked columns to count towards to the colDelta as column filling for locked columns is handled separately
        const secondDelta = {
            ...secondDiff,
            colDelta: secondDiff.colDelta + newLocked.length
        };
        const fittedGridB = lockedColFill(gridB, generator, newLocked);
        const fittedNewGrid = tailor(fittedGridB, secondDelta, generator);
        return [
            ...oldCols,
            ...oldRows.slice(0, index),
            ...fittedNewGrid,
            ...oldRows.slice(index, oldRows.length)
        ];
    };

    const cloneRow = (row, cloneCell, comparator, substitution) => clone$2(row, (elem) => substitution(elem, comparator), cloneCell);
    // substitution :: (item, comparator) -> item
    // example is the location of the cursor (the row index)
    // index is the insert position (at - or after - example) (the row index)
    const insertRowAt = (grid, index, example, comparator, substitution) => {
        const { rows, cols } = extractGridDetails(grid);
        const before = rows.slice(0, index);
        const after = rows.slice(index);
        const newRow = cloneRow(rows[example], (ex, c) => {
            const withinSpan = index > 0 && index < rows.length && comparator(getCellElement(rows[index - 1], c), getCellElement(rows[index], c));
            const ret = withinSpan ? getCell(rows[index], c) : elementnew(substitution(ex.element, comparator), true, ex.isLocked);
            return ret;
        }, comparator, substitution);
        return [
            ...cols,
            ...before,
            newRow,
            ...after
        ];
    };
    const getElementFor = (row, column, section, withinSpan, example, comparator, substitution) => {
        if (section === 'colgroup' || !withinSpan) {
            const cell = getCell(row, example);
            // locked is explicitly set to false so the newly inserted column doesn't inherit example column locked state
            return elementnew(substitution(cell.element, comparator), true, false);
        }
        else {
            return getCell(row, column);
        }
    };
    // substitution :: (item, comparator) -> item
    // example is the location of the cursor (the column index)
    // index is the insert position (at - or after - example) (the column index)
    const insertColumnAt = (grid, index, example, comparator, substitution) => map$1(grid, (row) => {
        const withinSpan = index > 0 && index < cellLength(row) && comparator(getCellElement(row, index - 1), getCellElement(row, index));
        const sub = getElementFor(row, index, row.section, withinSpan, example, comparator, substitution);
        return addCell(row, index, sub);
    });
    const deleteColumnsAt = (grid, columns) => bind$2(grid, (row) => {
        const existingCells = row.cells;
        const cells = foldr(columns, (acc, column) => column >= 0 && column < acc.length ? acc.slice(0, column).concat(acc.slice(column + 1)) : acc, existingCells);
        return cells.length > 0 ? [rowcells(row.element, cells, row.section, row.isNew)] : [];
    });
    const deleteRowsAt = (grid, start, finish) => {
        const { rows, cols } = extractGridDetails(grid);
        return [
            ...cols,
            ...rows.slice(0, start),
            ...rows.slice(finish + 1)
        ];
    };

    const notInStartRow = (grid, rowIndex, colIndex, comparator) => getCellElement(grid[rowIndex], colIndex) !== undefined && (rowIndex > 0 && comparator(getCellElement(grid[rowIndex - 1], colIndex), getCellElement(grid[rowIndex], colIndex)));
    const notInStartColumn = (row, index, comparator) => index > 0 && comparator(getCellElement(row, index - 1), getCellElement(row, index));
    // This checks for cells that aren't in the "start" position as the model will create duplicate element references for
    // each column/row that the cell spans. As an example, for a merged cell with rowspan="2", the cell in the second row is a duplicate
    // of the cell in the first row.
    const isDuplicatedCell = (grid, rowIndex, colIndex, comparator) => notInStartRow(grid, rowIndex, colIndex, comparator) || notInStartColumn(grid[rowIndex], colIndex, comparator);
    const rowReplacerPredicate = (targetRow, columnHeaders) => {
        const entireTableIsHeader = forall(columnHeaders, identity) && isHeaderCells(targetRow.cells);
        return entireTableIsHeader ? always : (cell, _rowIndex, colIndex) => {
            const type = name(cell.element);
            return !(type === 'th' && columnHeaders[colIndex]);
        };
    };
    const columnReplacePredicate = (targetColumn, rowHeaders) => {
        const entireTableIsHeader = forall(rowHeaders, identity) && isHeaderCells(targetColumn);
        return entireTableIsHeader ? always : (cell, rowIndex, _colIndex) => {
            const type = name(cell.element);
            return !(type === 'th' && rowHeaders[rowIndex]);
        };
    };
    const determineScope = (applyScope, cell, newScope, isInHeader) => {
        const hasSpan = (scope) => scope === 'row' ? hasRowspan(cell) : hasColspan(cell);
        const getScope = (scope) => hasSpan(scope) ? `${scope}group` : scope;
        if (applyScope) {
            return isHeaderCell(cell) ? getScope(newScope) : null;
        }
        else if (isInHeader && isHeaderCell(cell)) {
            // The cell is still in a header row/column so ensure the right scope is reverted to
            const oppositeScope = newScope === 'row' ? 'col' : 'row';
            return getScope(oppositeScope);
        }
        else {
            // No longer a header so ensure the scope is removed
            return null;
        }
    };
    const rowScopeGenerator = (applyScope, columnHeaders) => (cell, rowIndex, columnIndex) => Optional.some(determineScope(applyScope, cell.element, 'col', columnHeaders[columnIndex]));
    const columnScopeGenerator = (applyScope, rowHeaders) => (cell, rowIndex) => Optional.some(determineScope(applyScope, cell.element, 'row', rowHeaders[rowIndex]));
    const replace = (cell, comparator, substitute) => elementnew(substitute(cell.element, comparator), true, cell.isLocked);
    const replaceIn = (grid, targets, comparator, substitute, replacer, genScope, shouldReplace) => {
        const isTarget = (cell) => {
            return exists(targets, (target) => {
                return comparator(cell.element, target.element);
            });
        };
        return map$1(grid, (row, rowIndex) => {
            return mapCells(row, (cell, colIndex) => {
                if (isTarget(cell)) {
                    const newCell = shouldReplace(cell, rowIndex, colIndex) ? replacer(cell, comparator, substitute) : cell;
                    // Update the scope
                    genScope(newCell, rowIndex, colIndex).each((scope) => {
                        setOptions(newCell.element, { scope: Optional.from(scope) });
                    });
                    return newCell;
                }
                else {
                    return cell;
                }
            });
        });
    };
    const getColumnCells = (rows, columnIndex, comparator) => bind$2(rows, (row, i) => {
        // check if already added.
        return isDuplicatedCell(rows, i, columnIndex, comparator) ? [] : [getCell(row, columnIndex)];
    });
    const getRowCells = (rows, rowIndex, comparator) => {
        const targetRow = rows[rowIndex];
        return bind$2(targetRow.cells, (item, i) => {
            // Check that we haven't already added this one.
            return isDuplicatedCell(rows, rowIndex, i, comparator) ? [] : [item];
        });
    };
    const replaceColumns = (grid, indexes, applyScope, comparator, substitution) => {
        // Make this efficient later.
        const rows = extractGridDetails(grid).rows;
        const targets = bind$2(indexes, (index) => getColumnCells(rows, index, comparator));
        const rowHeaders = map$1(rows, (row) => isHeaderCells(row.cells));
        const shouldReplaceCell = columnReplacePredicate(targets, rowHeaders);
        const scopeGenerator = columnScopeGenerator(applyScope, rowHeaders);
        return replaceIn(grid, targets, comparator, substitution, replace, scopeGenerator, shouldReplaceCell);
    };
    const replaceRows = (grid, indexes, section, applyScope, comparator, substitution, tableSection) => {
        const { cols, rows } = extractGridDetails(grid);
        const targetRow = rows[indexes[0]];
        const targets = bind$2(indexes, (index) => getRowCells(rows, index, comparator));
        const columnHeaders = map$1(targetRow.cells, (_cell, index) => isHeaderCells(getColumnCells(rows, index, comparator)));
        // Transform and replace the target row
        // TODO: TINY-7776: This doesn't deal with rowspans which can break the layout when moving to a new section
        const newRows = [...rows];
        each$2(indexes, (index) => {
            newRows[index] = tableSection.transformRow(rows[index], section);
        });
        const newGrid = [...cols, ...newRows];
        const shouldReplaceCell = rowReplacerPredicate(targetRow, columnHeaders);
        const scopeGenerator = rowScopeGenerator(applyScope, columnHeaders);
        return replaceIn(newGrid, targets, comparator, substitution, tableSection.transformCell, scopeGenerator, shouldReplaceCell);
    };
    const replaceCells = (grid, details, comparator, substitution) => {
        const rows = extractGridDetails(grid).rows;
        const targetCells = map$1(details, (detail) => getCell(rows[detail.row], detail.column));
        return replaceIn(grid, targetCells, comparator, substitution, replace, Optional.none, always);
    };

    const uniqueColumns = (details) => {
        const uniqueCheck = (rest, detail) => {
            const columnExists = exists(rest, (currentDetail) => currentDetail.column === detail.column);
            return columnExists ? rest : rest.concat([detail]);
        };
        return foldl(details, uniqueCheck, []).sort((detailA, detailB) => detailA.column - detailB.column);
    };

    // This uses a slight variation to the default `ContentEditable.isEditable` behaviour,
    // as when the element is detached we assume it is editable because it is a new cell.
    const isEditable = (elem) => isEditable$1(elem, true);
    const prune = (table) => {
        const cells = cells$1(table);
        if (cells.length === 0) {
            remove$5(table);
        }
    };
    const outcome = (grid, cursor) => ({
        grid,
        cursor
    });
    const findEditableCursorPosition = (rows) => findMap(rows, (row) => findMap(row.cells, (cell) => {
        const elem = cell.element;
        return someIf(isEditable(elem), elem);
    }));
    const elementFromGrid = (grid, row, column) => {
        const rows = extractGridDetails(grid).rows;
        return Optional.from(rows[row]?.cells[column]?.element)
            .filter(isEditable)
            // Fallback to the first valid position in the table
            .orThunk(() => findEditableCursorPosition(rows));
    };
    const bundle = (grid, row, column) => {
        const cursorElement = elementFromGrid(grid, row, column);
        return outcome(grid, cursorElement);
    };
    const uniqueRows = (details) => {
        const rowCompilation = (rest, detail) => {
            const rowExists = exists(rest, (currentDetail) => currentDetail.row === detail.row);
            return rowExists ? rest : rest.concat([detail]);
        };
        return foldl(details, rowCompilation, []).sort((detailA, detailB) => detailA.row - detailB.row);
    };
    const opInsertRowsBefore = (grid, details, comparator, genWrappers) => {
        const targetIndex = details[0].row;
        const rows = uniqueRows(details);
        const newGrid = foldr(rows, (acc, row) => {
            const newG = insertRowAt(acc.grid, targetIndex, row.row + acc.delta, comparator, genWrappers.getOrInit);
            return { grid: newG, delta: acc.delta + 1 };
        }, { grid, delta: 0 }).grid;
        return bundle(newGrid, targetIndex, details[0].column);
    };
    const opInsertRowsAfter = (grid, details, comparator, genWrappers) => {
        const rows = uniqueRows(details);
        const target = rows[rows.length - 1];
        const targetIndex = target.row + target.rowspan;
        const newGrid = foldr(rows, (newG, row) => {
            return insertRowAt(newG, targetIndex, row.row, comparator, genWrappers.getOrInit);
        }, grid);
        return bundle(newGrid, targetIndex, details[0].column);
    };
    const opInsertColumnsBefore = (grid, extractDetail, comparator, genWrappers) => {
        const details = extractDetail.details;
        const columns = uniqueColumns(details);
        const targetIndex = columns[0].column;
        const newGrid = foldr(columns, (acc, col) => {
            const newG = insertColumnAt(acc.grid, targetIndex, col.column + acc.delta, comparator, genWrappers.getOrInit);
            return { grid: newG, delta: acc.delta + 1 };
        }, { grid, delta: 0 }).grid;
        return bundle(newGrid, details[0].row, targetIndex);
    };
    const opInsertColumnsAfter = (grid, extractDetail, comparator, genWrappers) => {
        const details = extractDetail.details;
        const target = details[details.length - 1];
        const targetIndex = target.column + target.colspan;
        const columns = uniqueColumns(details);
        const newGrid = foldr(columns, (newG, col) => {
            return insertColumnAt(newG, targetIndex, col.column, comparator, genWrappers.getOrInit);
        }, grid);
        return bundle(newGrid, details[0].row, targetIndex);
    };
    const opMakeColumnsHeader = (initialGrid, details, comparator, genWrappers) => {
        const columns = uniqueColumns(details);
        const columnIndexes = map$1(columns, (detail) => detail.column);
        const newGrid = replaceColumns(initialGrid, columnIndexes, true, comparator, genWrappers.replaceOrInit);
        return bundle(newGrid, details[0].row, details[0].column);
    };
    const opMakeCellsHeader = (initialGrid, details, comparator, genWrappers) => {
        const newGrid = replaceCells(initialGrid, details, comparator, genWrappers.replaceOrInit);
        return bundle(newGrid, details[0].row, details[0].column);
    };
    const opUnmakeColumnsHeader = (initialGrid, details, comparator, genWrappers) => {
        const columns = uniqueColumns(details);
        const columnIndexes = map$1(columns, (detail) => detail.column);
        const newGrid = replaceColumns(initialGrid, columnIndexes, false, comparator, genWrappers.replaceOrInit);
        return bundle(newGrid, details[0].row, details[0].column);
    };
    const opUnmakeCellsHeader = (initialGrid, details, comparator, genWrappers) => {
        const newGrid = replaceCells(initialGrid, details, comparator, genWrappers.replaceOrInit);
        return bundle(newGrid, details[0].row, details[0].column);
    };
    const makeRowsSection = (section, applyScope) => (initialGrid, details, comparator, genWrappers, tableSection) => {
        const rows = uniqueRows(details);
        const rowIndexes = map$1(rows, (detail) => detail.row);
        const newGrid = replaceRows(initialGrid, rowIndexes, section, applyScope, comparator, genWrappers.replaceOrInit, tableSection);
        return bundle(newGrid, details[0].row, details[0].column);
    };
    const opMakeRowsHeader = makeRowsSection('thead', true);
    const opMakeRowsBody = makeRowsSection('tbody', false);
    const opMakeRowsFooter = makeRowsSection('tfoot', false);
    const opEraseColumns = (grid, extractDetail, _comparator, _genWrappers) => {
        const columns = uniqueColumns(extractDetail.details);
        const newGrid = deleteColumnsAt(grid, map$1(columns, (column) => column.column));
        const maxColIndex = newGrid.length > 0 ? newGrid[0].cells.length - 1 : 0;
        return bundle(newGrid, columns[0].row, Math.min(columns[0].column, maxColIndex));
    };
    const opEraseRows = (grid, details, _comparator, _genWrappers) => {
        const rows = uniqueRows(details);
        const newGrid = deleteRowsAt(grid, rows[0].row, rows[rows.length - 1].row);
        const maxRowIndex = Math.max(extractGridDetails(newGrid).rows.length - 1, 0);
        return bundle(newGrid, Math.min(details[0].row, maxRowIndex), details[0].column);
    };
    const opMergeCells = (grid, mergable, comparator, genWrappers) => {
        const cells = mergable.cells;
        merge$2(cells);
        const newGrid = merge$1(grid, mergable.bounds, comparator, genWrappers.merge(cells));
        return outcome(newGrid, Optional.from(cells[0]));
    };
    const opUnmergeCells = (grid, unmergable, comparator, genWrappers) => {
        const unmerge$1 = (b, cell) => unmerge(b, cell, comparator, genWrappers.unmerge(cell));
        const newGrid = foldr(unmergable, unmerge$1, grid);
        return outcome(newGrid, Optional.from(unmergable[0]));
    };
    const opPasteCells = (grid, pasteDetails, comparator, _genWrappers) => {
        const gridify = (table, generators) => {
            const wh = Warehouse.fromTable(table);
            return toGrid(wh, generators, true);
        };
        const gridB = gridify(pasteDetails.clipboard, pasteDetails.generators);
        const startAddress = address(pasteDetails.row, pasteDetails.column);
        const mergedGrid = merge(startAddress, grid, gridB, pasteDetails.generators, comparator);
        return mergedGrid.fold(() => outcome(grid, Optional.some(pasteDetails.element)), (newGrid) => {
            return bundle(newGrid, pasteDetails.row, pasteDetails.column);
        });
    };
    const gridifyRows = (rows, generators, context) => {
        const pasteDetails = fromPastedRows(rows, context.section);
        const wh = Warehouse.generate(pasteDetails);
        return toGrid(wh, generators, true);
    };
    const opPasteColsBefore = (grid, pasteDetails, comparator, _genWrappers) => {
        const rows = extractGridDetails(grid).rows;
        const index = pasteDetails.cells[0].column;
        const context = rows[pasteDetails.cells[0].row];
        const gridB = gridifyRows(pasteDetails.clipboard, pasteDetails.generators, context);
        const mergedGrid = insertCols(index, grid, gridB, pasteDetails.generators, comparator);
        return bundle(mergedGrid, pasteDetails.cells[0].row, pasteDetails.cells[0].column);
    };
    const opPasteColsAfter = (grid, pasteDetails, comparator, _genWrappers) => {
        const rows = extractGridDetails(grid).rows;
        const index = pasteDetails.cells[pasteDetails.cells.length - 1].column + pasteDetails.cells[pasteDetails.cells.length - 1].colspan;
        const context = rows[pasteDetails.cells[0].row];
        const gridB = gridifyRows(pasteDetails.clipboard, pasteDetails.generators, context);
        const mergedGrid = insertCols(index, grid, gridB, pasteDetails.generators, comparator);
        return bundle(mergedGrid, pasteDetails.cells[0].row, index);
    };
    const opPasteRowsBefore = (grid, pasteDetails, comparator, _genWrappers) => {
        const rows = extractGridDetails(grid).rows;
        const index = pasteDetails.cells[0].row;
        const context = rows[index];
        const gridB = gridifyRows(pasteDetails.clipboard, pasteDetails.generators, context);
        const mergedGrid = insertRows(index, grid, gridB, pasteDetails.generators, comparator);
        return bundle(mergedGrid, pasteDetails.cells[0].row, pasteDetails.cells[0].column);
    };
    const opPasteRowsAfter = (grid, pasteDetails, comparator, _genWrappers) => {
        const rows = extractGridDetails(grid).rows;
        const index = pasteDetails.cells[pasteDetails.cells.length - 1].row + pasteDetails.cells[pasteDetails.cells.length - 1].rowspan;
        const context = rows[pasteDetails.cells[0].row];
        const gridB = gridifyRows(pasteDetails.clipboard, pasteDetails.generators, context);
        const mergedGrid = insertRows(index, grid, gridB, pasteDetails.generators, comparator);
        return bundle(mergedGrid, index, pasteDetails.cells[0].column);
    };
    const opGetColumnsType = (table, target) => {
        const house = Warehouse.fromTable(table);
        const details = onCells(house, target);
        return details.bind((selectedCells) => {
            const lastSelectedCell = selectedCells[selectedCells.length - 1];
            const minColRange = selectedCells[0].column;
            const maxColRange = lastSelectedCell.column + lastSelectedCell.colspan;
            const selectedColumnCells = flatten(map$1(house.all, (row) => filter$2(row.cells, (cell) => cell.column >= minColRange && cell.column < maxColRange)));
            return findCommonCellType(selectedColumnCells);
        }).getOr('');
    };
    const opGetCellsType = (table, target) => {
        const house = Warehouse.fromTable(table);
        const details = onCells(house, target);
        return details.bind(findCommonCellType).getOr('');
    };
    const opGetRowsType = (table, target) => {
        const house = Warehouse.fromTable(table);
        const details = onCells(house, target);
        return details.bind((selectedCells) => {
            const lastSelectedCell = selectedCells[selectedCells.length - 1];
            const minRowRange = selectedCells[0].row;
            const maxRowRange = lastSelectedCell.row + lastSelectedCell.rowspan;
            const selectedRows = house.all.slice(minRowRange, maxRowRange);
            return findCommonRowType(selectedRows);
        }).getOr('');
    };
    // Only column modifications force a resizing. Everything else just tries to preserve the table as is.
    const resize = (table, list, details, behaviours) => adjustWidthTo(table, list, details, behaviours.sizing);
    const adjustAndRedistributeWidths = (table, list, details, behaviours) => adjustAndRedistributeWidths$1(table, list, details, behaviours.sizing, behaviours.resize);
    // Custom selection extractors
    const firstColumnIsLocked = (_warehouse, details) => exists(details, (detail) => detail.column === 0 && detail.isLocked);
    // TODO: Maybe have an Arr.existsR which would be more efficient for most cases below
    const lastColumnIsLocked = (warehouse, details) => exists(details, (detail) => detail.column + detail.colspan >= warehouse.grid.columns && detail.isLocked);
    const getColumnsWidth = (warehouse, details) => {
        const columns$1 = columns(warehouse);
        const uniqueCols = uniqueColumns(details);
        return foldl(uniqueCols, (acc, detail) => {
            const column = columns$1[detail.column];
            const colWidth = column.map(getOuter).getOr(0);
            return acc + colWidth;
        }, 0);
    };
    const insertColumnsExtractor = (before) => (warehouse, target) => onCells(warehouse, target).filter((details) => {
        const checkLocked = before ? firstColumnIsLocked : lastColumnIsLocked;
        return !checkLocked(warehouse, details);
    }).map((details) => ({
        details,
        pixelDelta: getColumnsWidth(warehouse, details),
    }));
    const eraseColumnsExtractor = (warehouse, target) => onUnlockedCells(warehouse, target).map((details) => ({
        details,
        pixelDelta: -getColumnsWidth(warehouse, details), // needs to be negative as we are removing columns
    }));
    const pasteColumnsExtractor = (before) => (warehouse, target) => onPasteByEditor(warehouse, target).filter((details) => {
        const checkLocked = before ? firstColumnIsLocked : lastColumnIsLocked;
        return !checkLocked(warehouse, details.cells);
    });
    const headerCellGenerator = Generators.transform('th');
    const bodyCellGenerator = Generators.transform('td');
    const insertRowsBefore = (table, target, generators, behaviours) => run(opInsertRowsBefore, onCells, noop, noop, Generators.modification, table, target, generators, behaviours);
    const insertRowsAfter = (table, target, generators, behaviours) => run(opInsertRowsAfter, onCells, noop, noop, Generators.modification, table, target, generators, behaviours);
    const insertColumnsBefore = (table, target, generators, behaviours) => run(opInsertColumnsBefore, insertColumnsExtractor(true), adjustAndRedistributeWidths, noop, Generators.modification, table, target, generators, behaviours);
    const insertColumnsAfter = (table, target, generators, behaviours) => run(opInsertColumnsAfter, insertColumnsExtractor(false), adjustAndRedistributeWidths, noop, Generators.modification, table, target, generators, behaviours);
    const eraseColumns = (table, target, generators, behaviours) => run(opEraseColumns, eraseColumnsExtractor, adjustAndRedistributeWidths, prune, Generators.modification, table, target, generators, behaviours);
    const eraseRows = (table, target, generators, behaviours) => run(opEraseRows, onCells, noop, prune, Generators.modification, table, target, generators, behaviours);
    const makeColumnsHeader = (table, target, generators, behaviours) => run(opMakeColumnsHeader, onUnlockedCells, noop, noop, headerCellGenerator, table, target, generators, behaviours);
    const unmakeColumnsHeader = (table, target, generators, behaviours) => run(opUnmakeColumnsHeader, onUnlockedCells, noop, noop, bodyCellGenerator, table, target, generators, behaviours);
    const makeRowsHeader = (table, target, generators, behaviours) => run(opMakeRowsHeader, onCells, noop, noop, headerCellGenerator, table, target, generators, behaviours);
    const makeRowsBody = (table, target, generators, behaviours) => run(opMakeRowsBody, onCells, noop, noop, bodyCellGenerator, table, target, generators, behaviours);
    const makeRowsFooter = (table, target, generators, behaviours) => run(opMakeRowsFooter, onCells, noop, noop, bodyCellGenerator, table, target, generators, behaviours);
    const makeCellsHeader = (table, target, generators, behaviours) => run(opMakeCellsHeader, onUnlockedCells, noop, noop, headerCellGenerator, table, target, generators, behaviours);
    const unmakeCellsHeader = (table, target, generators, behaviours) => run(opUnmakeCellsHeader, onUnlockedCells, noop, noop, bodyCellGenerator, table, target, generators, behaviours);
    const mergeCells = (table, target, generators, behaviours) => run(opMergeCells, onUnlockedMergable, resize, noop, Generators.merging, table, target, generators, behaviours);
    const unmergeCells = (table, target, generators, behaviours) => run(opUnmergeCells, onUnlockedUnmergable, resize, noop, Generators.merging, table, target, generators, behaviours);
    const pasteCells = (table, target, generators, behaviours) => run(opPasteCells, onPaste, resize, noop, Generators.modification, table, target, generators, behaviours);
    const pasteColsBefore = (table, target, generators, behaviours) => run(opPasteColsBefore, pasteColumnsExtractor(true), noop, noop, Generators.modification, table, target, generators, behaviours);
    const pasteColsAfter = (table, target, generators, behaviours) => run(opPasteColsAfter, pasteColumnsExtractor(false), noop, noop, Generators.modification, table, target, generators, behaviours);
    const pasteRowsBefore = (table, target, generators, behaviours) => run(opPasteRowsBefore, onPasteByEditor, noop, noop, Generators.modification, table, target, generators, behaviours);
    const pasteRowsAfter = (table, target, generators, behaviours) => run(opPasteRowsAfter, onPasteByEditor, noop, noop, Generators.modification, table, target, generators, behaviours);
    const getColumnsType = opGetColumnsType;
    const getCellsType = opGetCellsType;
    const getRowsType = opGetRowsType;

    const inSelection = (bounds, detail) => {
        const leftEdge = detail.column;
        const rightEdge = detail.column + detail.colspan - 1;
        const topEdge = detail.row;
        const bottomEdge = detail.row + detail.rowspan - 1;
        return (leftEdge <= bounds.finishCol && rightEdge >= bounds.startCol) && (topEdge <= bounds.finishRow && bottomEdge >= bounds.startRow);
    };
    // Note, something is *within* if it is completely contained within the bounds.
    const isWithin = (bounds, detail) => {
        return (detail.column >= bounds.startCol &&
            (detail.column + detail.colspan - 1) <= bounds.finishCol &&
            detail.row >= bounds.startRow &&
            (detail.row + detail.rowspan - 1) <= bounds.finishRow);
    };
    const isRectangular = (warehouse, bounds) => {
        let isRect = true;
        const detailIsWithin = curry(isWithin, bounds);
        for (let i = bounds.startRow; i <= bounds.finishRow; i++) {
            for (let j = bounds.startCol; j <= bounds.finishCol; j++) {
                isRect = isRect && Warehouse.getAt(warehouse, i, j).exists(detailIsWithin);
            }
        }
        return isRect ? Optional.some(bounds) : Optional.none();
    };

    const getBounds = (detailA, detailB) => {
        return bounds(Math.min(detailA.row, detailB.row), Math.min(detailA.column, detailB.column), Math.max(detailA.row + detailA.rowspan - 1, detailB.row + detailB.rowspan - 1), Math.max(detailA.column + detailA.colspan - 1, detailB.column + detailB.colspan - 1));
    };
    const getAnyBox = (warehouse, startCell, finishCell) => {
        const startCoords = Warehouse.findItem(warehouse, startCell, eq$1);
        const finishCoords = Warehouse.findItem(warehouse, finishCell, eq$1);
        return startCoords.bind((sc) => {
            return finishCoords.map((fc) => {
                return getBounds(sc, fc);
            });
        });
    };
    const getBox$1 = (warehouse, startCell, finishCell) => {
        return getAnyBox(warehouse, startCell, finishCell).bind((bounds) => {
            return isRectangular(warehouse, bounds);
        });
    };

    const moveBy$1 = (warehouse, cell, row, column) => {
        return Warehouse.findItem(warehouse, cell, eq$1).bind((detail) => {
            const startRow = row > 0 ? detail.row + detail.rowspan - 1 : detail.row;
            const startCol = column > 0 ? detail.column + detail.colspan - 1 : detail.column;
            const dest = Warehouse.getAt(warehouse, startRow + row, startCol + column);
            return dest.map((d) => {
                return d.element;
            });
        });
    };
    const intercepts$1 = (warehouse, start, finish) => {
        return getAnyBox(warehouse, start, finish).map((bounds) => {
            const inside = Warehouse.filterItems(warehouse, curry(inSelection, bounds));
            return map$1(inside, (detail) => {
                return detail.element;
            });
        });
    };
    const parentCell = (warehouse, innerCell) => {
        const isContainedBy = (c1, c2) => {
            return contains(c2, c1);
        };
        return Warehouse.findItem(warehouse, innerCell, isContainedBy).map((detail) => {
            return detail.element;
        });
    };

    const moveBy = (cell, deltaRow, deltaColumn) => {
        return table(cell).bind((table) => {
            const warehouse = getWarehouse(table);
            return moveBy$1(warehouse, cell, deltaRow, deltaColumn);
        });
    };
    const intercepts = (table, first, last) => {
        const warehouse = getWarehouse(table);
        return intercepts$1(warehouse, first, last);
    };
    const nestedIntercepts = (table, first, firstTable, last, lastTable) => {
        const warehouse = getWarehouse(table);
        const optStartCell = eq$1(table, firstTable) ? Optional.some(first) : parentCell(warehouse, first);
        const optLastCell = eq$1(table, lastTable) ? Optional.some(last) : parentCell(warehouse, last);
        return optStartCell.bind((startCell) => optLastCell.bind((lastCell) => intercepts$1(warehouse, startCell, lastCell)));
    };
    const getBox = (table, first, last) => {
        const warehouse = getWarehouse(table);
        return getBox$1(warehouse, first, last);
    };
    // Private method ... keep warehouse in snooker, please.
    const getWarehouse = Warehouse.fromTable;

    const DefaultRenderOptions = {
        styles: {
            'border-collapse': 'collapse',
            'width': '100%'
        },
        attributes: {
            border: '1'
        },
        colGroups: false
    };
    const tableHeaderCell = () => SugarElement.fromTag('th');
    const tableCell = () => SugarElement.fromTag('td');
    const tableColumn = () => SugarElement.fromTag('col');
    const createRow = (columns, rowHeaders, columnHeaders, rowIndex) => {
        const tr = SugarElement.fromTag('tr');
        for (let j = 0; j < columns; j++) {
            const td = rowIndex < rowHeaders || j < columnHeaders ? tableHeaderCell() : tableCell();
            if (j < columnHeaders) {
                set$2(td, 'scope', 'row');
            }
            if (rowIndex < rowHeaders) {
                set$2(td, 'scope', 'col');
            }
            // Note, this is a placeholder so that the cells have height. The unicode character didn't work in IE10.
            append$1(td, SugarElement.fromTag('br'));
            append$1(tr, td);
        }
        return tr;
    };
    const createGroupRow = (columns) => {
        const columnGroup = SugarElement.fromTag('colgroup');
        range$1(columns, () => append$1(columnGroup, tableColumn()));
        return columnGroup;
    };
    const createRows = (rows, columns, rowHeaders, columnHeaders) => range$1(rows, (r) => createRow(columns, rowHeaders, columnHeaders, r));
    const render = (rows, columns, rowHeaders, columnHeaders, headerType, renderOpts = DefaultRenderOptions) => {
        const table = SugarElement.fromTag('table');
        const rowHeadersGoInThead = headerType !== 'cells';
        setAll(table, renderOpts.styles);
        setAll$1(table, renderOpts.attributes);
        if (renderOpts.colGroups) {
            append$1(table, createGroupRow(columns));
        }
        const actualRowHeaders = Math.min(rows, rowHeaders);
        if (rowHeadersGoInThead && rowHeaders > 0) {
            const thead = SugarElement.fromTag('thead');
            append$1(table, thead);
            const theadRowHeaders = headerType === 'sectionCells' ? actualRowHeaders : 0;
            const theadRows = createRows(rowHeaders, columns, theadRowHeaders, columnHeaders);
            append(thead, theadRows);
        }
        const tbody = SugarElement.fromTag('tbody');
        append$1(table, tbody);
        const numRows = rowHeadersGoInThead ? rows - actualRowHeaders : rows;
        const numRowHeaders = rowHeadersGoInThead ? 0 : rowHeaders;
        const tbodyRows = createRows(numRows, columns, numRowHeaders, columnHeaders);
        append(tbody, tbodyRows);
        return table;
    };

    const Event = (fields) => {
        let handlers = [];
        const bind = (handler) => {
            if (handler === undefined) {
                throw new Error('Event bind error: undefined handler');
            }
            handlers.push(handler);
        };
        const unbind = (handler) => {
            // This is quite a bit slower than handlers.splice() but we hate mutation.
            // Unbind isn't used very often so it should be ok.
            handlers = filter$2(handlers, (h) => {
                return h !== handler;
            });
        };
        const trigger = (...args) => {
            const event = {};
            each$2(fields, (name, i) => {
                event[name] = args[i];
            });
            each$2(handlers, (handler) => {
                handler(event);
            });
        };
        return {
            bind,
            unbind,
            trigger
        };
    };

    /** :: {name : Event} -> Events */
    const create$3 = (typeDefs) => {
        const registry = map(typeDefs, (event) => {
            return {
                bind: event.bind,
                unbind: event.unbind
            };
        });
        const trigger = map(typeDefs, (event) => {
            return event.trigger;
        });
        return {
            registry,
            trigger
        };
    };

    const DragMode = exactly([
        'compare',
        'extract',
        'mutate',
        'sink'
    ]);
    const DragSink = exactly([
        'element',
        'start',
        'stop',
        'destroy'
    ]);
    const DragApi = exactly([
        'forceDrop',
        'drop',
        'move',
        'delayDrop'
    ]);

    const InDrag = () => {
        let previous = Optional.none();
        const reset = () => {
            previous = Optional.none();
        };
        // Return position delta between previous position and nu position,
        // or None if this is the first. Set the previous position to nu.
        const update = (mode, nu) => {
            const result = previous.map((old) => {
                return mode.compare(old, nu);
            });
            previous = Optional.some(nu);
            return result;
        };
        const onEvent = (event, mode) => {
            const dataOption = mode.extract(event);
            // Dragster move events require a position delta. The moveevent is only triggered
            // on the second and subsequent dragster move events. The first is dropped.
            dataOption.each((data) => {
                const offset = update(mode, data);
                offset.each((d) => {
                    events.trigger.move(d);
                });
            });
        };
        const events = create$3({
            move: Event(['info'])
        });
        return {
            onEvent,
            reset,
            events: events.registry
        };
    };

    const NoDrag = () => {
        const events = create$3({
            move: Event(['info'])
        });
        return {
            onEvent: noop,
            reset: noop,
            events: events.registry
        };
    };

    const Movement = () => {
        const noDragState = NoDrag();
        const inDragState = InDrag();
        let dragState = noDragState;
        const on = () => {
            dragState.reset();
            dragState = inDragState;
        };
        const off = () => {
            dragState.reset();
            dragState = noDragState;
        };
        const onEvent = (event, mode) => {
            dragState.onEvent(event, mode);
        };
        const isOn = () => {
            return dragState === inDragState;
        };
        return {
            on,
            off,
            isOn,
            onEvent,
            events: inDragState.events
        };
    };

    const setup = (mutation, mode, settings) => {
        let active = false;
        const events = create$3({
            start: Event([]),
            stop: Event([])
        });
        const movement = Movement();
        const drop = () => {
            sink.stop();
            if (movement.isOn()) {
                movement.off();
                events.trigger.stop();
            }
        };
        const throttledDrop = last$1(drop, 200);
        const go = (parent) => {
            sink.start(parent);
            movement.on();
            events.trigger.start();
        };
        const mousemove = (event) => {
            throttledDrop.cancel();
            movement.onEvent(event, mode);
        };
        movement.events.move.bind((event) => {
            mode.mutate(mutation, event.info);
        });
        const on = () => {
            active = true;
        };
        const off = () => {
            active = false;
            // acivate some events here?
        };
        const isActive = () => active;
        const runIfActive = (f) => {
            return (...args) => {
                if (active) {
                    f.apply(null, args);
                }
            };
        };
        const sink = mode.sink(DragApi({
            // ASSUMPTION: runIfActive is not needed for mousedown. This is pretty much a safety measure for
            // inconsistent situations so that we don't block input.
            forceDrop: drop,
            drop: runIfActive(drop),
            move: runIfActive(mousemove),
            delayDrop: runIfActive(throttledDrop.throttle)
        }), settings);
        const destroy = () => {
            sink.destroy();
        };
        return {
            element: sink.element,
            go,
            on,
            off,
            isActive,
            destroy,
            events: events.registry
        };
    };

    const styles$1 = css('ephox-dragster');
    const resolve$1 = styles$1.resolve;

    const Blocker = (options) => {
        const settings = {
            layerClass: resolve$1('blocker'),
            ...options
        };
        const div = SugarElement.fromTag('div');
        set$2(div, 'role', 'presentation');
        set$2(div, 'data-mce-bogus', 'all');
        setAll(div, {
            position: 'fixed',
            left: '0px',
            top: '0px',
            width: '100%',
            height: '100%'
        });
        add$1(div, resolve$1('blocker'));
        add$1(div, settings.layerClass);
        const element = constant(div);
        const destroy = () => {
            remove$5(div);
        };
        return {
            element,
            destroy
        };
    };

    const compare = (old, nu) => {
        return SugarPosition(nu.left - old.left, nu.top - old.top);
    };
    const extract = (event) => {
        return Optional.some(SugarPosition(event.x, event.y));
    };
    const mutate = (mutation, info) => {
        mutation.mutate(info.left, info.top);
    };
    const sink = (dragApi, settings) => {
        const blocker = Blocker(settings);
        // Included for safety. If the blocker has stayed on the screen, get rid of it on a click.
        const mdown = bind(blocker.element(), 'mousedown', dragApi.forceDrop);
        const mup = bind(blocker.element(), 'mouseup', dragApi.drop);
        const mmove = bind(blocker.element(), 'mousemove', dragApi.move);
        const mout = bind(blocker.element(), 'mouseout', dragApi.delayDrop);
        const destroy = () => {
            blocker.destroy();
            mup.unbind();
            mmove.unbind();
            mout.unbind();
            mdown.unbind();
        };
        const start = (parent) => {
            append$1(parent, blocker.element());
        };
        const stop = () => {
            remove$5(blocker.element());
        };
        return DragSink({
            element: blocker.element,
            start,
            stop,
            destroy
        });
    };
    var MouseDrag = DragMode({
        compare,
        extract,
        sink,
        mutate
    });

    const transform = (mutation, settings = {}) => {
        const mode = settings.mode ?? MouseDrag;
        return setup(mutation, mode, settings);
    };

    const styles = css('ephox-snooker');
    const resolve = styles.resolve;

    const Mutation = () => {
        const events = create$3({
            drag: Event(['xDelta', 'yDelta'])
        });
        const mutate = (x, y) => {
            events.trigger.drag(x, y);
        };
        return {
            mutate,
            events: events.registry
        };
    };

    const BarMutation = () => {
        const events = create$3({
            drag: Event(['xDelta', 'yDelta', 'target'])
        });
        let target = Optional.none();
        const delegate = Mutation();
        delegate.events.drag.bind((event) => {
            target.each((t) => {
                // There is always going to be this padding / border collapse / margin problem with widths. I'll have to resolve that.
                events.trigger.drag(event.xDelta, event.yDelta, t);
            });
        });
        const assign = (t) => {
            target = Optional.some(t);
        };
        const get = () => {
            return target;
        };
        return {
            assign,
            get,
            mutate: delegate.mutate,
            events: events.registry
        };
    };

    const col = (column, x, y, w, h) => {
        const bar = SugarElement.fromTag('div');
        setAll(bar, {
            position: 'absolute',
            left: x - w / 2 + 'px',
            top: y + 'px',
            height: h + 'px',
            width: w + 'px'
        });
        setAll$1(bar, { 'data-mce-bogus': 'all', 'data-column': column, 'role': 'presentation' });
        return bar;
    };
    const row = (r, x, y, w, h) => {
        const bar = SugarElement.fromTag('div');
        setAll(bar, {
            position: 'absolute',
            left: x + 'px',
            top: y - h / 2 + 'px',
            height: h + 'px',
            width: w + 'px'
        });
        setAll$1(bar, { 'data-mce-bogus': 'all', 'data-row': r, 'role': 'presentation' });
        return bar;
    };

    const resizeBar = resolve('resizer-bar');
    const resizeRowBar = resolve('resizer-rows');
    const resizeColBar = resolve('resizer-cols');
    const BAR_THICKNESS = 7;
    const resizableRows = (warehouse, isResizable) => bind$2(warehouse.all, (row, i) => isResizable(row.element) ? [i] : []);
    const resizableColumns = (warehouse, isResizable) => {
        const resizableCols = [];
        // Check col elements and see if they are resizable
        range$1(warehouse.grid.columns, (index) => {
            // With use of forall, index will be included if col doesn't exist meaning the column cells will be checked below
            const colElmOpt = Warehouse.getColumnAt(warehouse, index).map((col) => col.element);
            if (colElmOpt.forall(isResizable)) {
                resizableCols.push(index);
            }
        });
        // Check cells of the resizable columns and make sure they are resizable
        return filter$2(resizableCols, (colIndex) => {
            const columnCells = Warehouse.filterItems(warehouse, (cell) => cell.column === colIndex);
            return forall(columnCells, (cell) => isResizable(cell.element));
        });
    };
    const destroy = (wire) => {
        const previous = descendants(wire.parent(), '.' + resizeBar);
        each$2(previous, remove$5);
    };
    const drawBar = (wire, positions, create) => {
        const origin = wire.origin();
        each$2(positions, (cpOption) => {
            cpOption.each((cp) => {
                const bar = create(origin, cp);
                add$1(bar, resizeBar);
                append$1(wire.parent(), bar);
            });
        });
    };
    const refreshCol = (wire, colPositions, position, tableHeight) => {
        drawBar(wire, colPositions, (origin, cp) => {
            const colBar = col(cp.col, cp.x - origin.left, position.top - origin.top, BAR_THICKNESS, tableHeight);
            add$1(colBar, resizeColBar);
            return colBar;
        });
    };
    const refreshRow = (wire, rowPositions, position, tableWidth) => {
        drawBar(wire, rowPositions, (origin, cp) => {
            const rowBar = row(cp.row, position.left - origin.left, cp.y - origin.top, tableWidth, BAR_THICKNESS);
            add$1(rowBar, resizeRowBar);
            return rowBar;
        });
    };
    const refreshGrid = (warhouse, wire, table, rows, cols) => {
        const position = absolute(table);
        const isResizable = wire.isResizable;
        const rowPositions = rows.length > 0 ? height.positions(rows, table) : [];
        const resizableRowBars = rowPositions.length > 0 ? resizableRows(warhouse, isResizable) : [];
        const resizableRowPositions = filter$2(rowPositions, (_pos, i) => exists(resizableRowBars, (barIndex) => i === barIndex));
        refreshRow(wire, resizableRowPositions, position, getOuter(table));
        const colPositions = cols.length > 0 ? width.positions(cols, table) : [];
        const resizableColBars = colPositions.length > 0 ? resizableColumns(warhouse, isResizable) : [];
        const resizableColPositions = filter$2(colPositions, (_pos, i) => exists(resizableColBars, (barIndex) => i === barIndex));
        refreshCol(wire, resizableColPositions, position, getOuter$1(table));
    };
    const refresh = (wire, table) => {
        destroy(wire);
        if (wire.isResizable(table)) {
            const warehouse = Warehouse.fromTable(table);
            const rows$1 = rows(warehouse);
            const cols = columns(warehouse);
            refreshGrid(warehouse, wire, table, rows$1, cols);
        }
    };
    const each = (wire, f) => {
        const bars = descendants(wire.parent(), '.' + resizeBar);
        each$2(bars, f);
    };
    const hide = (wire) => {
        each(wire, (bar) => {
            set$1(bar, 'display', 'none');
        });
    };
    const show = (wire) => {
        each(wire, (bar) => {
            set$1(bar, 'display', 'block');
        });
    };
    const isRowBar = (element) => {
        return has(element, resizeRowBar);
    };
    const isColBar = (element) => {
        return has(element, resizeColBar);
    };

    const resizeBarDragging = resolve('resizer-bar-dragging');
    const BarManager = (wire) => {
        const mutation = BarMutation();
        const resizing = transform(mutation, {});
        let hoverTable = Optional.none();
        const getResizer = (element, type) => {
            return Optional.from(get$b(element, type));
        };
        /* Reposition the bar as the user drags */
        mutation.events.drag.bind((event) => {
            getResizer(event.target, 'data-row').each((_dataRow) => {
                const currentRow = getCssValue(event.target, 'top');
                set$1(event.target, 'top', currentRow + event.yDelta + 'px');
            });
            getResizer(event.target, 'data-column').each((_dataCol) => {
                const currentCol = getCssValue(event.target, 'left');
                set$1(event.target, 'left', currentCol + event.xDelta + 'px');
            });
        });
        const getDelta = (target, dir) => {
            const newX = getCssValue(target, dir);
            const oldX = getAttrValue(target, 'data-initial-' + dir, 0);
            return newX - oldX;
        };
        /* Resize the column once the user releases the mouse */
        resizing.events.stop.bind(() => {
            mutation.get().each((target) => {
                hoverTable.each((table) => {
                    getResizer(target, 'data-row').each((row) => {
                        const delta = getDelta(target, 'top');
                        remove$6(target, 'data-initial-top');
                        events.trigger.adjustHeight(table, delta, parseInt(row, 10));
                    });
                    getResizer(target, 'data-column').each((column) => {
                        const delta = getDelta(target, 'left');
                        remove$6(target, 'data-initial-left');
                        events.trigger.adjustWidth(table, delta, parseInt(column, 10));
                    });
                    refresh(wire, table);
                });
            });
        });
        const handler = (target, dir) => {
            events.trigger.startAdjust();
            mutation.assign(target);
            set$2(target, 'data-initial-' + dir, getCssValue(target, dir));
            add$1(target, resizeBarDragging);
            set$1(target, 'opacity', '0.2');
            resizing.go(wire.dragContainer());
        };
        /* mousedown on resize bar: start dragging when the bar is clicked, storing the initial position. */
        const mousedown = bind(wire.parent(), 'mousedown', (event) => {
            if (isRowBar(event.target)) {
                handler(event.target, 'top');
            }
            if (isColBar(event.target)) {
                handler(event.target, 'left');
            }
        });
        const isRoot = (e) => {
            return eq$1(e, wire.view());
        };
        const findClosestEditableTable = (target) => closest$1(target, 'table', isRoot).filter(isEditable$1);
        const isResizer = (target) => has(target, 'ephox-snooker-resizer-bar') || has(target, 'ephox-dragster-blocker');
        /* mouseover on table: When the mouse moves within the CONTENT AREA (NOT THE TABLE), refresh the bars. */
        const mouseover = bind(wire.view(), 'mouseover', (event) => {
            findClosestEditableTable(event.target).fold(() => {
                /*
                * mouseout is not reliable within ContentEditable, so for all other mouseover events we clear bars.
                * This is fairly safe to do frequently; it's a single querySelectorAll() on the content and Arr.map on the result.
                * If we _really_ need to optimise it further, we can start caching the bar references in the wire somehow.
                *
                * Because the resizers were moved into the editor for inline mode, we need to check if the event target is not a resizer.
                */
                if (inBody(event.target) && !isResizer(event.target)) {
                    destroy(wire);
                }
            }, (table) => {
                if (resizing.isActive()) {
                    hoverTable = Optional.some(table);
                    refresh(wire, table);
                }
            });
        });
        const destroy$1 = () => {
            mousedown.unbind();
            mouseover.unbind();
            resizing.destroy();
            destroy(wire);
        };
        const refresh$1 = (tbl) => {
            refresh(wire, tbl);
        };
        const events = create$3({
            adjustHeight: Event(['table', 'delta', 'row']),
            adjustWidth: Event(['table', 'delta', 'column']),
            startAdjust: Event([])
        });
        return {
            destroy: destroy$1,
            refresh: refresh$1,
            on: resizing.on,
            off: resizing.off,
            hideBars: curry(hide, wire),
            showBars: curry(show, wire),
            events: events.registry
        };
    };

    const create$2 = (wire, resizing, lazySizing) => {
        const hdirection = height;
        const vdirection = width;
        const manager = BarManager(wire);
        const events = create$3({
            beforeResize: Event(['table', 'type']),
            afterResize: Event(['table', 'type']),
            startDrag: Event([]),
        });
        manager.events.adjustHeight.bind((event) => {
            const table = event.table;
            events.trigger.beforeResize(table, 'row');
            const delta = hdirection.delta(event.delta, table);
            // TODO: Use the resizing behaviour for heights as well
            adjustHeight(table, delta, event.row);
            events.trigger.afterResize(table, 'row');
        });
        manager.events.startAdjust.bind((_event) => {
            events.trigger.startDrag();
        });
        manager.events.adjustWidth.bind((event) => {
            const table = event.table;
            events.trigger.beforeResize(table, 'col');
            const delta = vdirection.delta(event.delta, table);
            const tableSize = lazySizing(table);
            adjustWidth(table, delta, event.column, resizing, tableSize);
            events.trigger.afterResize(table, 'col');
        });
        return {
            on: manager.on,
            off: manager.off,
            refreshBars: manager.refresh,
            hideBars: manager.hideBars,
            showBars: manager.showBars,
            destroy: manager.destroy,
            events: events.registry
        };
    };
    const TableResize = {
        create: create$2
    };

    const option = (name) => (editor) => editor.options.get(name);
    // Note: This is also contained in the table plugin Options.ts file
    const defaultWidth = '100%';
    const getPixelForcedWidth = (editor) => {
        // Determine the inner size of the parent block element where the table will be inserted
        const dom = editor.dom;
        const parentBlock = dom.getParent(editor.selection.getStart(), dom.isBlock) ?? editor.getBody();
        return getInner(SugarElement.fromDom(parentBlock)) + 'px';
    };
    // Note: This is also contained in the table plugin Options.ts file
    const determineDefaultTableStyles = (editor, defaultStyles) => {
        if (isTableResponsiveForced(editor) || !shouldStyleWithCss(editor)) {
            return defaultStyles;
        }
        else if (isTablePixelsForced(editor)) {
            return { ...defaultStyles, width: getPixelForcedWidth(editor) };
        }
        else {
            return { ...defaultStyles, width: defaultWidth };
        }
    };
    // Note: This is also contained in the table plugin Options.ts file
    const determineDefaultTableAttributes = (editor, defaultAttributes) => {
        if (isTableResponsiveForced(editor) || shouldStyleWithCss(editor)) {
            return defaultAttributes;
        }
        else if (isTablePixelsForced(editor)) {
            return { ...defaultAttributes, width: getPixelForcedWidth(editor) };
        }
        else {
            return { ...defaultAttributes, width: defaultWidth };
        }
    };
    const register = (editor) => {
        const registerOption = editor.options.register;
        registerOption('table_clone_elements', {
            processor: 'string[]'
        });
        registerOption('table_use_colgroups', {
            processor: 'boolean',
            default: true
        });
        registerOption('table_header_type', {
            processor: (value) => {
                const valid = contains$2(['section', 'cells', 'sectionCells', 'auto'], value);
                return valid ? { value, valid } : { valid: false, message: 'Must be one of: section, cells, sectionCells or auto.' };
            },
            default: 'section'
        });
        registerOption('table_sizing_mode', {
            processor: 'string',
            default: 'auto'
        });
        registerOption('table_default_attributes', {
            processor: 'object',
            default: {
                border: '1'
            }
        });
        registerOption('table_default_styles', {
            processor: 'object',
            default: {
                'border-collapse': 'collapse',
            }
        });
        registerOption('table_column_resizing', {
            processor: (value) => {
                const valid = contains$2(['preservetable', 'resizetable'], value);
                return valid ? { value, valid } : { valid: false, message: 'Must be preservetable, or resizetable.' };
            },
            default: 'preservetable'
        });
        registerOption('table_resize_bars', {
            processor: 'boolean',
            default: true
        });
        registerOption('table_style_by_css', {
            processor: 'boolean',
            default: true
        });
        registerOption('table_merge_content_on_paste', {
            processor: 'boolean',
            default: true
        });
        registerOption('table_default_header_rows', {
            processor: 'number',
            default: 0
        });
        registerOption('table_default_header_cols', {
            processor: 'number',
            default: 0
        });
    };
    const getTableCloneElements = (editor) => {
        return Optional.from(editor.options.get('table_clone_elements'));
    };
    const hasTableObjectResizing = (editor) => {
        const objectResizing = editor.options.get('object_resizing');
        return contains$2(objectResizing.split(','), 'table');
    };
    const getTableHeaderType = option('table_header_type');
    const getTableColumnResizingBehaviour = option('table_column_resizing');
    const isPreserveTableColumnResizing = (editor) => getTableColumnResizingBehaviour(editor) === 'preservetable';
    const isResizeTableColumnResizing = (editor) => getTableColumnResizingBehaviour(editor) === 'resizetable';
    const getTableSizingMode = option('table_sizing_mode');
    const isTablePercentagesForced = (editor) => getTableSizingMode(editor) === 'relative';
    const isTablePixelsForced = (editor) => getTableSizingMode(editor) === 'fixed';
    const isTableResponsiveForced = (editor) => getTableSizingMode(editor) === 'responsive';
    const hasTableResizeBars = option('table_resize_bars');
    const shouldStyleWithCss = option('table_style_by_css');
    const shouldMergeContentOnPaste = option('table_merge_content_on_paste');
    const defaultHeaderRows = option('table_default_header_rows');
    const defaultHeaderCols = option('table_default_header_cols');
    const getTableDefaultAttributes = (editor) => {
        // Note: The we don't rely on the default here as we need to dynamically lookup the widths based on the current editor state
        const options = editor.options;
        const defaultAttributes = options.get('table_default_attributes');
        return options.isSet('table_default_attributes') ? defaultAttributes : determineDefaultTableAttributes(editor, defaultAttributes);
    };
    const getTableDefaultStyles = (editor) => {
        // Note: The we don't rely on the default here as we need to dynamically lookup the widths based on the current editor state
        const options = editor.options;
        const defaultStyles = options.get('table_default_styles');
        return options.isSet('table_default_styles') ? defaultStyles : determineDefaultTableStyles(editor, defaultStyles);
    };
    const tableUseColumnGroup = option('table_use_colgroups');

    /*
     NOTE: This file is partially duplicated in the following locations:
      - plugins/table/core/Utils.ts
      - advtable
     Make sure that if making changes to this file, the other files are updated as well
     */
    const getBody = (editor) => SugarElement.fromDom(editor.getBody());
    const getIsRoot = (editor) => (element) => eq$1(element, getBody(editor));
    const removeDataStyle = (table) => {
        remove$6(table, 'data-mce-style');
        const removeStyleAttribute = (element) => remove$6(element, 'data-mce-style');
        each$2(cells$1(table), removeStyleAttribute);
        each$2(columns$1(table), removeStyleAttribute);
        each$2(rows$1(table), removeStyleAttribute);
    };
    const getSelectionStart = (editor) => SugarElement.fromDom(editor.selection.getStart());
    const getPixelWidth = (elm) => elm.getBoundingClientRect().width;
    const getPixelHeight = (elm) => elm.getBoundingClientRect().height;
    const addPxSuffix = (size) => /^\d+(\.\d+)?$/.test(size) ? size + 'px' : size;
    const getRawValue = (prop) => (editor, elm) => {
        const raw = editor.dom.getStyle(elm, prop) || editor.dom.getAttrib(elm, prop);
        // If a value has no unit, assume it is a pixel value
        return Optional.from(raw)
            .filter(isNotEmpty)
            .map(addPxSuffix);
    };
    const isPercentage$1 = (value) => /^(\d+(\.\d+)?)%$/.test(value);
    const isPixel = (value) => /^(\d+(\.\d+)?)px$/.test(value);
    const getRawWidth = getRawValue('width');
    const getRawHeight = getRawValue('height');
    const isInEditableContext$1 = (cell) => closest$2(cell, isTag('table')).exists(isEditable$1);

    const lookupTable = (container) => {
        return ancestor$1(container, 'table');
    };
    const identify = (start, finish, isRoot) => {
        const getIsRoot = (rootTable) => {
            return (element) => {
                return (isRoot !== undefined && isRoot(element)) || eq$1(element, rootTable);
            };
        };
        // Optimisation: If the cells are equal, it's a single cell array
        if (eq$1(start, finish)) {
            return Optional.some({
                boxes: Optional.some([start]),
                start,
                finish
            });
        }
        else {
            return lookupTable(start).bind((startTable) => {
                return lookupTable(finish).bind((finishTable) => {
                    if (eq$1(startTable, finishTable)) { // Selecting from within the same table.
                        return Optional.some({
                            boxes: intercepts(startTable, start, finish),
                            start,
                            finish
                        });
                    }
                    else if (contains(startTable, finishTable)) { // Selecting from the parent table to the nested table.
                        const ancestorCells = ancestors$3(finish, 'td,th', getIsRoot(startTable));
                        const finishCell = ancestorCells.length > 0 ? ancestorCells[ancestorCells.length - 1] : finish;
                        return Optional.some({
                            boxes: nestedIntercepts(startTable, start, startTable, finish, finishTable),
                            start,
                            finish: finishCell
                        });
                    }
                    else if (contains(finishTable, startTable)) { // Selecting from the nested table to the parent table.
                        const ancestorCells = ancestors$3(start, 'td,th', getIsRoot(finishTable));
                        const startCell = ancestorCells.length > 0 ? ancestorCells[ancestorCells.length - 1] : start;
                        return Optional.some({
                            boxes: nestedIntercepts(finishTable, start, startTable, finish, finishTable),
                            start,
                            finish: startCell
                        });
                    }
                    else { // Selecting from a nested table to a different nested table.
                        return ancestors(start, finish).shared.bind((lca) => {
                            return closest$1(lca, 'table', isRoot).bind((lcaTable) => {
                                const finishAncestorCells = ancestors$3(finish, 'td,th', getIsRoot(lcaTable));
                                const finishCell = finishAncestorCells.length > 0 ? finishAncestorCells[finishAncestorCells.length - 1] : finish;
                                const startAncestorCells = ancestors$3(start, 'td,th', getIsRoot(lcaTable));
                                const startCell = startAncestorCells.length > 0 ? startAncestorCells[startAncestorCells.length - 1] : start;
                                return Optional.some({
                                    boxes: nestedIntercepts(lcaTable, start, startTable, finish, finishTable),
                                    start: startCell,
                                    finish: finishCell
                                });
                            });
                        });
                    }
                });
            });
        }
    };
    const retrieve$1 = (container, selector) => {
        const sels = descendants(container, selector);
        return sels.length > 0 ? Optional.some(sels) : Optional.none();
    };
    const getLast = (boxes, lastSelectedSelector) => {
        return find$1(boxes, (box) => {
            return is$1(box, lastSelectedSelector);
        });
    };
    const getEdges = (container, firstSelectedSelector, lastSelectedSelector) => {
        return descendant(container, firstSelectedSelector).bind((first) => {
            return descendant(container, lastSelectedSelector).bind((last) => {
                return sharedOne(lookupTable, [first, last]).map((table) => {
                    return {
                        first,
                        last,
                        table
                    };
                });
            });
        });
    };
    const expandTo = (finish, firstSelectedSelector) => {
        return ancestor$1(finish, 'table').bind((table) => {
            return descendant(table, firstSelectedSelector).bind((start) => {
                return identify(start, finish).bind((identified) => {
                    return identified.boxes.map((boxes) => {
                        return {
                            boxes,
                            start: identified.start,
                            finish: identified.finish
                        };
                    });
                });
            });
        });
    };
    const shiftSelection = (boxes, deltaRow, deltaColumn, firstSelectedSelector, lastSelectedSelector) => {
        return getLast(boxes, lastSelectedSelector).bind((last) => {
            return moveBy(last, deltaRow, deltaColumn).bind((finish) => {
                return expandTo(finish, firstSelectedSelector);
            });
        });
    };

    // Explicitly calling CellSelection.retrieve so that we can see the API signature.
    const retrieve = (container, selector) => {
        return retrieve$1(container, selector);
    };
    const retrieveBox = (container, firstSelectedSelector, lastSelectedSelector) => {
        return getEdges(container, firstSelectedSelector, lastSelectedSelector).bind((edges) => {
            const isRoot = (ancestor) => {
                return eq$1(container, ancestor);
            };
            const sectionSelector = 'thead,tfoot,tbody,table';
            const firstAncestor = ancestor$1(edges.first, sectionSelector, isRoot);
            const lastAncestor = ancestor$1(edges.last, sectionSelector, isRoot);
            return firstAncestor.bind((fA) => {
                return lastAncestor.bind((lA) => {
                    return eq$1(fA, lA) ? getBox(edges.table, edges.first, edges.last) : Optional.none();
                });
            });
        });
    };

    const selection = identity;
    const unmergable = (selectedCells) => {
        const hasSpan = (elem, type) => getOpt(elem, type).exists((span) => parseInt(span, 10) > 1);
        const hasRowOrColSpan = (elem) => hasSpan(elem, 'rowspan') || hasSpan(elem, 'colspan');
        return selectedCells.length > 0 && forall(selectedCells, hasRowOrColSpan) ? Optional.some(selectedCells) : Optional.none();
    };
    const mergable = (table, selectedCells, ephemera) => {
        if (selectedCells.length <= 1) {
            return Optional.none();
        }
        else {
            return retrieveBox(table, ephemera.firstSelectedSelector, ephemera.lastSelectedSelector)
                .map((bounds) => ({ bounds, cells: selectedCells }));
        }
    };

    const create$1 = (selection, kill) => ({
        selection,
        kill
    });
    const Response = {
        create: create$1
    };

    const fold = (subject, onNone, onMultiple, onSingle) => {
        switch (subject.tag) {
            case "none" /* SelectionTypeTag.None */:
                return onNone();
            case "single" /* SelectionTypeTag.Single */:
                return onSingle(subject.element);
            case "multiple" /* SelectionTypeTag.Multiple */:
                return onMultiple(subject.elements);
        }
    };
    const none = () => ({ tag: "none" /* SelectionTypeTag.None */ });
    const multiple = (elements) => ({ tag: "multiple" /* SelectionTypeTag.Multiple */, elements });
    const single = (element) => ({ tag: "single" /* SelectionTypeTag.Single */, element });

    const Selections = (lazyRoot, getStart, selectedSelector) => {
        const get = () => retrieve(lazyRoot(), selectedSelector).fold(() => getStart().fold(none, single), multiple);
        return {
            get
        };
    };

    const create = (start, soffset, finish, foffset) => {
        return {
            start: Situ.on(start, soffset),
            finish: Situ.on(finish, foffset)
        };
    };
    const Situs = {
        create
    };

    const convertToRange = (win, selection) => {
        // TODO: Use API packages of sugar
        const rng = asLtrRange(win, selection);
        return SimRange.create(SugarElement.fromDom(rng.startContainer), rng.startOffset, SugarElement.fromDom(rng.endContainer), rng.endOffset);
    };
    const makeSitus = Situs.create;

    // Based on a start and finish, select the appropriate box of cells
    const sync = (container, isRoot, start, soffset, finish, foffset, selectRange) => {
        if (!(eq$1(start, finish) && soffset === foffset)) {
            return closest$1(start, 'td,th', isRoot).bind((s) => {
                return closest$1(finish, 'td,th', isRoot).bind((f) => {
                    return detect(container, isRoot, s, f, selectRange);
                });
            });
        }
        else {
            return Optional.none();
        }
    };
    // If the cells are different, and there is a rectangle to connect them, select the cells.
    const detect = (container, isRoot, start, finish, selectRange) => {
        if (!eq$1(start, finish)) {
            return identify(start, finish, isRoot).bind((cellSel) => {
                const boxes = cellSel.boxes.getOr([]);
                if (boxes.length > 1) {
                    selectRange(container, boxes, cellSel.start, cellSel.finish);
                    return Optional.some(Response.create(Optional.some(makeSitus(start, 0, start, getEnd(start))), true));
                }
                else {
                    return Optional.none();
                }
            });
        }
        else {
            return Optional.none();
        }
    };
    const update = (rows, columns, container, selected, annotations) => {
        const updateSelection = (newSels) => {
            annotations.clearBeforeUpdate(container);
            annotations.selectRange(container, newSels.boxes, newSels.start, newSels.finish);
            return newSels.boxes;
        };
        return shiftSelection(selected, rows, columns, annotations.firstSelectedSelector, annotations.lastSelectedSelector).map(updateSelection);
    };

    const adt$1 = Adt.generate([
        { none: ['message'] },
        { success: [] },
        { failedUp: ['cell'] },
        { failedDown: ['cell'] }
    ]);
    // Let's get some bounding rects, and see if they overlap (x-wise)
    const isOverlapping = (bridge, before, after) => {
        const beforeBounds = bridge.getRect(before);
        const afterBounds = bridge.getRect(after);
        return afterBounds.right > beforeBounds.left && afterBounds.left < beforeBounds.right;
    };
    const isRow = (elem) => {
        return closest$1(elem, 'tr');
    };
    const verify = (bridge, before, beforeOffset, after, afterOffset, failure, isRoot) => {
        // Identify the cells that the before and after are in.
        return closest$1(after, 'td,th', isRoot).bind((afterCell) => {
            return closest$1(before, 'td,th', isRoot).map((beforeCell) => {
                // If they are not in the same cell
                if (!eq$1(afterCell, beforeCell)) {
                    return sharedOne(isRow, [afterCell, beforeCell]).fold(() => {
                        // No shared row, and they overlap x-wise -> success, otherwise: failed
                        return isOverlapping(bridge, beforeCell, afterCell) ? adt$1.success() : failure(beforeCell);
                    }, (_sharedRow) => {
                        // In the same row, so it failed.
                        return failure(beforeCell);
                    });
                }
                else {
                    return eq$1(after, afterCell) && getEnd(afterCell) === afterOffset ? failure(beforeCell) : adt$1.none('in same cell');
                }
            });
        }).getOr(adt$1.none('default'));
    };
    const cata = (subject, onNone, onSuccess, onFailedUp, onFailedDown) => {
        return subject.fold(onNone, onSuccess, onFailedUp, onFailedDown);
    };
    const BeforeAfter = {
        ...adt$1,
        verify,
        cata
    };

    const isBr = isTag('br');
    const gatherer = (cand, gather, isRoot) => {
        return gather(cand, isRoot).bind((target) => {
            return isText(target) && get$5(target).trim().length === 0 ? gatherer(target, gather, isRoot) : Optional.some(target);
        });
    };
    const handleBr = (isRoot, element, direction) => {
        // 1. Has a neighbouring sibling ... position relative to neighbouring element
        // 2. Has no neighbouring sibling ... position relative to gathered element
        return direction.traverse(element).orThunk(() => {
            return gatherer(element, direction.gather, isRoot);
        }).map(direction.relative);
    };
    const findBr = (element, offset) => {
        return child$2(element, offset).filter(isBr).orThunk(() => {
            // Can be either side of the br, and still be a br.
            return child$2(element, offset - 1).filter(isBr);
        });
    };
    const handleParent = (isRoot, element, offset, direction) => {
        // 1. Has no neighbouring sibling, position relative to gathered element
        // 2. Has a neighbouring sibling, position at the neighbouring sibling with respect to parent
        return findBr(element, offset).bind((br) => {
            return direction.traverse(br).fold(() => {
                return gatherer(br, direction.gather, isRoot).map(direction.relative);
            }, (adjacent) => {
                return indexInParent(adjacent).map((info) => {
                    return Situ.on(info.parent, info.index);
                });
            });
        });
    };
    const tryBr = (isRoot, element, offset, direction) => {
        // Three different situations
        // 1. the br is the child, and it has a previous sibling. Use parent, index-1)
        // 2. the br is the child and it has no previous sibling, set to before the previous gather result
        // 3. the br is the element and it has a previous sibling, use parent index-1)
        // 4. the br is the element and it has no previous sibling, set to before the previous gather result.
        // 2. the element is the br itself,
        const target = isBr(element) ? handleBr(isRoot, element, direction) : handleParent(isRoot, element, offset, direction);
        return target.map((tgt) => {
            return {
                start: tgt,
                finish: tgt
            };
        });
    };
    const process = (analysis) => {
        return BeforeAfter.cata(analysis, (_message) => {
            return Optional.none();
        }, () => {
            return Optional.none();
        }, (cell) => {
            return Optional.some(point(cell, 0));
        }, (cell) => {
            return Optional.some(point(cell, getEnd(cell)));
        });
    };

    const moveDown = (caret, amount) => {
        return {
            left: caret.left,
            top: caret.top + amount,
            right: caret.right,
            bottom: caret.bottom + amount
        };
    };
    const moveUp = (caret, amount) => {
        return {
            left: caret.left,
            top: caret.top - amount,
            right: caret.right,
            bottom: caret.bottom - amount
        };
    };
    const translate = (caret, xDelta, yDelta) => {
        return {
            left: caret.left + xDelta,
            top: caret.top + yDelta,
            right: caret.right + xDelta,
            bottom: caret.bottom + yDelta
        };
    };
    const getTop = (caret) => {
        return caret.top;
    };
    const getBottom = (caret) => {
        return caret.bottom;
    };

    const getPartialBox = (bridge, element, offset) => {
        if (offset >= 0 && offset < getEnd(element)) {
            return bridge.getRangedRect(element, offset, element, offset + 1);
        }
        else if (offset > 0) {
            return bridge.getRangedRect(element, offset - 1, element, offset);
        }
        return Optional.none();
    };
    const toCaret = (rect) => ({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom
    });
    const getElemBox = (bridge, element) => {
        return Optional.some(bridge.getRect(element));
    };
    const getBoxAt = (bridge, element, offset) => {
        // Note, we might need to consider this offset and descend.
        if (isElement(element)) {
            return getElemBox(bridge, element).map(toCaret);
        }
        else if (isText(element)) {
            return getPartialBox(bridge, element, offset).map(toCaret);
        }
        else {
            return Optional.none();
        }
    };
    const getEntireBox = (bridge, element) => {
        if (isElement(element)) {
            return getElemBox(bridge, element).map(toCaret);
        }
        else if (isText(element)) {
            return bridge.getRangedRect(element, 0, element, getEnd(element)).map(toCaret);
        }
        else {
            return Optional.none();
        }
    };

    const JUMP_SIZE = 5;
    const NUM_RETRIES = 100;
    const adt = Adt.generate([
        { none: [] },
        { retry: ['caret'] }
    ]);
    const isOutside = (caret, box) => {
        return caret.left < box.left || Math.abs(box.right - caret.left) < 1 || caret.left > box.right;
    };
    // Find the block and determine whether or not that block is outside. If it is outside, move up/down and right.
    const inOutsideBlock = (bridge, element, caret) => {
        return closest$2(element, isBlock).fold(never, (cell) => {
            return getEntireBox(bridge, cell).exists((box) => {
                return isOutside(caret, box);
            });
        });
    };
    /*
     * The approach is as follows.
     *
     * The browser APIs for caret ranges return elements that are the closest text elements to your (x, y) position, even if those
     * closest elements are miles away. This causes problems when you are trying to identify what is immediately above or below
     * a cell, because often the closest text is in a cell that is in a completely different column. Therefore, the approach needs
     * to keep moving down until the thing that we are hitting is likely to be a true positive.
     *
     * Steps:
     *
     * 1. If the y position of the next guess is not different from the original, keep going.
     * 2a. If the guess box doesn't actually include the position looked for, then the browser has returned a node that does not have
     *    a rectangle which truly intercepts the point. So, keep going. Note, we used to jump straight away here, but that means that
     *    we might skip over something that wasn't considered close enough but was a better guess than just making the y value skip.
     * 2b. If the guess box exactly aligns with the caret, then adjust by 1 and go again. This is to get a more accurate offset.
     * 3. if the guess box does include the caret, but the guess box's parent cell does not *really* contain the caret, try again shifting
     *    only the x value. If the guess box's parent cell does *really* contain the caret (i.e. it is horizontally-aligned), then stop
     *    because the guess is GOOD.
     */
    const adjustDown = (bridge, element, guessBox, original, caret) => {
        const lowerCaret = moveDown(caret, JUMP_SIZE);
        if (Math.abs(guessBox.bottom - original.bottom) < 1) {
            return adt.retry(lowerCaret);
        }
        else if (guessBox.top > caret.bottom) {
            return adt.retry(lowerCaret);
        }
        else if (guessBox.top === caret.bottom) {
            return adt.retry(moveDown(caret, 1));
        }
        else {
            return inOutsideBlock(bridge, element, caret) ? adt.retry(translate(lowerCaret, JUMP_SIZE, 0)) : adt.none();
        }
    };
    const adjustUp = (bridge, element, guessBox, original, caret) => {
        const higherCaret = moveUp(caret, JUMP_SIZE);
        if (Math.abs(guessBox.top - original.top) < 1) {
            return adt.retry(higherCaret);
        }
        else if (guessBox.bottom < caret.top) {
            return adt.retry(higherCaret);
        }
        else if (guessBox.bottom === caret.top) {
            return adt.retry(moveUp(caret, 1));
        }
        else {
            return inOutsideBlock(bridge, element, caret) ? adt.retry(translate(higherCaret, JUMP_SIZE, 0)) : adt.none();
        }
    };
    const upMovement = {
        point: getTop,
        adjuster: adjustUp,
        move: moveUp,
        gather: before
    };
    const downMovement = {
        point: getBottom,
        adjuster: adjustDown,
        move: moveDown,
        gather: after
    };
    const isAtTable = (bridge, x, y) => {
        return bridge.elementFromPoint(x, y).filter((elm) => {
            return name(elm) === 'table';
        }).isSome();
    };
    const adjustForTable = (bridge, movement, original, caret, numRetries) => {
        return adjustTil(bridge, movement, original, movement.move(caret, JUMP_SIZE), numRetries);
    };
    const adjustTil = (bridge, movement, original, caret, numRetries) => {
        if (numRetries === 0) {
            return Optional.some(caret);
        }
        if (isAtTable(bridge, caret.left, movement.point(caret))) {
            return adjustForTable(bridge, movement, original, caret, numRetries - 1);
        }
        return bridge.situsFromPoint(caret.left, movement.point(caret)).bind((guess) => {
            return guess.start.fold(Optional.none, (element) => {
                return getEntireBox(bridge, element).bind((guessBox) => {
                    return movement.adjuster(bridge, element, guessBox, original, caret).fold(Optional.none, (newCaret) => {
                        return adjustTil(bridge, movement, original, newCaret, numRetries - 1);
                    });
                }).orThunk(() => {
                    return Optional.some(caret);
                });
            }, Optional.none);
        });
    };
    const checkScroll = (movement, adjusted, bridge) => {
        // I'm not convinced that this is right. Let's re-examine it later.
        if (movement.point(adjusted) > bridge.getInnerHeight()) {
            return Optional.some(movement.point(adjusted) - bridge.getInnerHeight());
        }
        else if (movement.point(adjusted) < 0) {
            return Optional.some(-movement.point(adjusted));
        }
        else {
            return Optional.none();
        }
    };
    const retry = (movement, bridge, caret) => {
        const moved = movement.move(caret, JUMP_SIZE);
        const adjusted = adjustTil(bridge, movement, caret, moved, NUM_RETRIES).getOr(moved);
        return checkScroll(movement, adjusted, bridge).fold(() => {
            return bridge.situsFromPoint(adjusted.left, movement.point(adjusted));
        }, (delta) => {
            bridge.scrollBy(0, delta);
            return bridge.situsFromPoint(adjusted.left, movement.point(adjusted) - delta);
        });
    };
    const Retries = {
        tryUp: curry(retry, upMovement),
        tryDown: curry(retry, downMovement),
        getJumpSize: constant(JUMP_SIZE)
    };

    const MAX_RETRIES = 20;
    const findSpot = (bridge, isRoot, direction) => {
        return bridge.getSelection().bind((sel) => {
            return tryBr(isRoot, sel.finish, sel.foffset, direction).fold(() => {
                return Optional.some(point(sel.finish, sel.foffset));
            }, (brNeighbour) => {
                const range = bridge.fromSitus(brNeighbour);
                const analysis = BeforeAfter.verify(bridge, sel.finish, sel.foffset, range.finish, range.foffset, direction.failure, isRoot);
                return process(analysis);
            });
        });
    };
    const scan = (bridge, isRoot, element, offset, direction, numRetries) => {
        if (numRetries === 0) {
            return Optional.none();
        }
        // Firstly, move the (x, y) and see what element we end up on.
        return tryCursor(bridge, isRoot, element, offset, direction).bind((situs) => {
            const range = bridge.fromSitus(situs);
            // Now, check to see if the element is a new cell.
            const analysis = BeforeAfter.verify(bridge, element, offset, range.finish, range.foffset, direction.failure, isRoot);
            return BeforeAfter.cata(analysis, () => {
                return Optional.none();
            }, () => {
                // We have a new cell, so we stop looking.
                return Optional.some(situs);
            }, (cell) => {
                if (eq$1(element, cell) && offset === 0) {
                    return tryAgain(bridge, element, offset, moveUp, direction);
                }
                else { // We need to look again from the start of our current cell
                    return scan(bridge, isRoot, cell, 0, direction, numRetries - 1);
                }
            }, (cell) => {
                // If we were here last time, move and try again.
                if (eq$1(element, cell) && offset === getEnd(cell)) {
                    return tryAgain(bridge, element, offset, moveDown, direction);
                }
                else { // We need to look again from the end of our current cell
                    return scan(bridge, isRoot, cell, getEnd(cell), direction, numRetries - 1);
                }
            });
        });
    };
    const tryAgain = (bridge, element, offset, move, direction) => {
        return getBoxAt(bridge, element, offset).bind((box) => {
            return tryAt(bridge, direction, move(box, Retries.getJumpSize()));
        });
    };
    const tryAt = (bridge, direction, box) => {
        const browser = detect$2().browser;
        // NOTE: As we attempt to take over selection everywhere, we'll probably need to separate these again.
        if (browser.isChromium() || browser.isSafari() || browser.isFirefox()) {
            return direction.retry(bridge, box);
        }
        else {
            return Optional.none();
        }
    };
    const tryCursor = (bridge, isRoot, element, offset, direction) => {
        return getBoxAt(bridge, element, offset).bind((box) => {
            return tryAt(bridge, direction, box);
        });
    };
    const handle = (bridge, isRoot, direction) => {
        return findSpot(bridge, isRoot, direction).bind((spot) => {
            // There is a point to start doing box-hitting from
            return scan(bridge, isRoot, spot.element, spot.offset, direction, MAX_RETRIES).map(bridge.fromSitus);
        });
    };

    const inSameTable = (elem, table) => {
        return ancestor(elem, (e) => {
            return parent(e).exists((p) => {
                return eq$1(p, table);
            });
        });
    };
    // Note: initial is the finishing element, because that's where the cursor starts from
    // Anchor is the starting element, and is only used to work out if we are in the same table
    const simulate = (bridge, isRoot, direction, initial, anchor) => {
        return closest$1(initial, 'td,th', isRoot).bind((start) => {
            return closest$1(start, 'table', isRoot).bind((table) => {
                if (!inSameTable(anchor, table)) {
                    return Optional.none();
                }
                return handle(bridge, isRoot, direction).bind((range) => {
                    return closest$1(range.finish, 'td,th', isRoot).map((finish) => {
                        return {
                            start,
                            finish,
                            range
                        };
                    });
                });
            });
        });
    };
    const navigate = (bridge, isRoot, direction, initial, anchor, precheck) => {
        return precheck(initial, isRoot).orThunk(() => {
            return simulate(bridge, isRoot, direction, initial, anchor).map((info) => {
                const range = info.range;
                return Response.create(Optional.some(makeSitus(range.start, range.soffset, range.finish, range.foffset)), true);
            });
        });
    };
    const firstUpCheck = (initial, isRoot) => {
        return closest$1(initial, 'tr', isRoot).bind((startRow) => {
            return closest$1(startRow, 'table', isRoot).bind((table) => {
                const rows = descendants(table, 'tr');
                if (eq$1(startRow, rows[0])) {
                    return seekLeft(table, (element) => {
                        return last(element).isSome();
                    }, isRoot).map((last) => {
                        const lastOffset = getEnd(last);
                        return Response.create(Optional.some(makeSitus(last, lastOffset, last, lastOffset)), true);
                    });
                }
                else {
                    return Optional.none();
                }
            });
        });
    };
    const lastDownCheck = (initial, isRoot) => {
        return closest$1(initial, 'tr', isRoot).bind((startRow) => {
            return closest$1(startRow, 'table', isRoot).bind((table) => {
                const rows = descendants(table, 'tr');
                if (eq$1(startRow, rows[rows.length - 1])) {
                    return seekRight(table, (element) => {
                        return first(element).isSome();
                    }, isRoot).map((first) => {
                        return Response.create(Optional.some(makeSitus(first, 0, first, 0)), true);
                    });
                }
                else {
                    return Optional.none();
                }
            });
        });
    };
    const select = (bridge, container, isRoot, direction, initial, anchor, selectRange) => {
        return simulate(bridge, isRoot, direction, initial, anchor).bind((info) => {
            return detect(container, isRoot, info.start, info.finish, selectRange);
        });
    };

    const findCell = (target, isRoot) => closest$1(target, 'td,th', isRoot);
    const isInEditableContext = (cell) => parentElement(cell).exists(isEditable$1);
    const MouseSelection = (bridge, container, isRoot, annotations) => {
        const cursor = value();
        const clearstate = cursor.clear;
        const applySelection = (event) => {
            cursor.on((start) => {
                annotations.clearBeforeUpdate(container);
                findCell(event.target, isRoot).each((finish) => {
                    identify(start, finish, isRoot).each((cellSel) => {
                        const boxes = cellSel.boxes.getOr([]);
                        if (boxes.length === 1) {
                            // If a single noneditable cell is selected and the actual selection target within the cell
                            // is also noneditable, make sure it is annotated
                            const singleCell = boxes[0];
                            const isNonEditableCell = getRaw$1(singleCell) === 'false';
                            const isCellClosestContentEditable = is$2(closest(event.target), singleCell, eq$1);
                            if (isNonEditableCell && isCellClosestContentEditable) {
                                // Not selecting the contents or the node of the actual cell as shown below, keeping the selection on the offscreen element.
                                annotations.selectRange(container, boxes, singleCell, singleCell);
                            }
                        }
                        else if (boxes.length > 1) {
                            // Wait until we have more than one, otherwise you can't do text selection inside a cell.
                            annotations.selectRange(container, boxes, cellSel.start, cellSel.finish);
                            // stop the browser from creating a big text selection, select the cell where the cursor is
                            bridge.selectContents(finish);
                        }
                    });
                });
            });
        };
        /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
        const mousedown = (event) => {
            annotations.clear(container);
            findCell(event.target, isRoot).filter(isInEditableContext).each(cursor.set);
        };
        /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
        const mouseover = (event) => {
            applySelection(event);
        };
        /* Keep this as lightweight as possible when we're not in a table selection, it runs constantly */
        const mouseup = (event) => {
            // Needed as Firefox will change the selection between the mouseover and mouseup when selecting
            // just 2 cells as Firefox supports multiple selection ranges
            applySelection(event);
            clearstate();
        };
        return {
            clearstate,
            mousedown,
            mouseover,
            mouseup
        };
    };

    const down = {
        traverse: nextSibling,
        gather: after,
        relative: Situ.before,
        retry: Retries.tryDown,
        failure: BeforeAfter.failedDown
    };
    const up = {
        traverse: prevSibling,
        gather: before,
        relative: Situ.before,
        retry: Retries.tryUp,
        failure: BeforeAfter.failedUp
    };

    const isKey = (key) => {
        return (keycode) => {
            return keycode === key;
        };
    };
    const isUp = isKey(38);
    const isDown = isKey(40);
    const isNavigation = (keycode) => {
        return keycode >= 37 && keycode <= 40;
    };
    const ltr = {
        // We need to move KEYS out of keytar and into something much more low-level.
        isBackward: isKey(37),
        isForward: isKey(39)
    };
    const rtl = {
        isBackward: isKey(39),
        isForward: isKey(37)
    };

    const WindowBridge = (win) => {
        const elementFromPoint = (x, y) => {
            return SugarElement.fromPoint(SugarElement.fromDom(win.document), x, y);
        };
        const getRect = (element) => {
            return element.dom.getBoundingClientRect();
        };
        const getRangedRect = (start, soffset, finish, foffset) => {
            const sel = SimSelection.exact(start, soffset, finish, foffset);
            return getFirstRect(win, sel);
        };
        const getSelection = () => {
            return get$3(win).map((exactAdt) => {
                return convertToRange(win, exactAdt);
            });
        };
        const fromSitus = (situs) => {
            const relative = SimSelection.relative(situs.start, situs.finish);
            return convertToRange(win, relative);
        };
        const situsFromPoint = (x, y) => {
            return getAtPoint(win, x, y).map((exact) => {
                return Situs.create(exact.start, exact.soffset, exact.finish, exact.foffset);
            });
        };
        const clearSelection = () => {
            clear(win);
        };
        const collapseSelection = (toStart = false) => {
            get$3(win).each((sel) => sel.fold((rng) => rng.collapse(toStart), (startSitu, finishSitu) => {
                const situ = toStart ? startSitu : finishSitu;
                setRelative(win, situ, situ);
            }, (start, soffset, finish, foffset) => {
                const node = toStart ? start : finish;
                const offset = toStart ? soffset : foffset;
                setExact(win, node, offset, node, offset);
            }));
        };
        const selectNode = (element) => {
            setToElement(win, element, false);
        };
        const selectContents = (element) => {
            setToElement(win, element);
        };
        const setSelection = (sel) => {
            setExact(win, sel.start, sel.soffset, sel.finish, sel.foffset);
        };
        const setRelativeSelection = (start, finish) => {
            setRelative(win, start, finish);
        };
        const getInnerHeight = () => {
            return win.innerHeight;
        };
        const getScrollY = () => {
            const pos = get$6(SugarElement.fromDom(win.document));
            return pos.top;
        };
        const scrollBy = (x, y) => {
            by(x, y, SugarElement.fromDom(win.document));
        };
        return {
            elementFromPoint,
            getRect,
            getRangedRect,
            getSelection,
            fromSitus,
            situsFromPoint,
            clearSelection,
            collapseSelection,
            setSelection,
            setRelativeSelection,
            selectNode,
            selectContents,
            getInnerHeight,
            getScrollY,
            scrollBy
        };
    };

    const rc = (rows, cols) => ({ rows, cols });
    const mouse = (win, container, isRoot, annotations) => {
        const bridge = WindowBridge(win);
        const handlers = MouseSelection(bridge, container, isRoot, annotations);
        return {
            clearstate: handlers.clearstate,
            mousedown: handlers.mousedown,
            mouseover: handlers.mouseover,
            mouseup: handlers.mouseup
        };
    };
    const isEditableNode = (node) => closest$2(node, isHTMLElement).exists(isEditable$1);
    const isEditableSelection = (start, finish) => isEditableNode(start) || isEditableNode(finish);
    const keyboard = (win, container, isRoot, annotations) => {
        const bridge = WindowBridge(win);
        const clearToNavigate = () => {
            annotations.clear(container);
            return Optional.none();
        };
        const keydown = (event, start, soffset, finish, foffset, direction) => {
            const realEvent = event.raw;
            const keycode = realEvent.which;
            const shiftKey = realEvent.shiftKey === true;
            const handler = retrieve$1(container, annotations.selectedSelector).fold(() => {
                // Make sure any possible lingering annotations are cleared
                if (isNavigation(keycode) && !shiftKey) {
                    annotations.clearBeforeUpdate(container);
                }
                // Shift down should predict the movement and set the selection.
                if (isNavigation(keycode) && shiftKey && !isEditableSelection(start, finish)) {
                    return Optional.none;
                }
                else if (isDown(keycode) && shiftKey) {
                    return curry(select, bridge, container, isRoot, down, finish, start, annotations.selectRange);
                }
                else if (isUp(keycode) && shiftKey) { // Shift up should predict the movement and set the selection.
                    return curry(select, bridge, container, isRoot, up, finish, start, annotations.selectRange);
                }
                else if (isDown(keycode)) { // Down should predict the movement and set the cursor
                    return curry(navigate, bridge, isRoot, down, finish, start, lastDownCheck);
                }
                else if (isUp(keycode)) { // Up should predict the movement and set the cursor
                    return curry(navigate, bridge, isRoot, up, finish, start, firstUpCheck);
                }
                else {
                    return Optional.none;
                }
            }, (selected) => {
                const update$1 = (attempts) => {
                    return () => {
                        const navigation = findMap(attempts, (delta) => {
                            return update(delta.rows, delta.cols, container, selected, annotations);
                        });
                        // Shift the selected rows and update the selection.
                        return navigation.fold(() => {
                            // The cell selection went outside the table, so clear it and bridge from the first box to before/after
                            // the table
                            return getEdges(container, annotations.firstSelectedSelector, annotations.lastSelectedSelector).map((edges) => {
                                const relative = isDown(keycode) || direction.isForward(keycode) ? Situ.after : Situ.before;
                                bridge.setRelativeSelection(Situ.on(edges.first, 0), relative(edges.table));
                                annotations.clear(container);
                                return Response.create(Optional.none(), true);
                            });
                        }, (_) => {
                            return Optional.some(Response.create(Optional.none(), true));
                        });
                    };
                };
                if (isNavigation(keycode) && shiftKey && !isEditableSelection(start, finish)) {
                    return Optional.none;
                }
                else if (isDown(keycode) && shiftKey) {
                    return update$1([rc(+1, 0)]);
                }
                else if (isUp(keycode) && shiftKey) {
                    return update$1([rc(-1, 0)]);
                }
                else if (direction.isBackward(keycode) && shiftKey) { // Left and right should try up/down respectively if they fail.
                    return update$1([rc(0, -1), rc(-1, 0)]);
                }
                else if (direction.isForward(keycode) && shiftKey) {
                    return update$1([rc(0, +1), rc(+1, 0)]);
                }
                else if (isNavigation(keycode) && !shiftKey) { // Clear the selection on normal arrow keys.
                    return clearToNavigate;
                }
                else {
                    return Optional.none;
                }
            });
            return handler();
        };
        const keyup = (event, start, soffset, finish, foffset) => {
            return retrieve$1(container, annotations.selectedSelector).fold(() => {
                const realEvent = event.raw;
                const keycode = realEvent.which;
                const shiftKey = realEvent.shiftKey === true;
                if (!shiftKey) {
                    return Optional.none();
                }
                if (isNavigation(keycode) && isEditableSelection(start, finish)) {
                    return sync(container, isRoot, start, soffset, finish, foffset, annotations.selectRange);
                }
                else {
                    return Optional.none();
                }
            }, Optional.none);
        };
        return {
            keydown,
            keyup
        };
    };
    const external = (win, container, isRoot, annotations) => {
        const bridge = WindowBridge(win);
        return (start, finish) => {
            annotations.clearBeforeUpdate(container);
            identify(start, finish, isRoot).each((cellSel) => {
                const boxes = cellSel.boxes.getOr([]);
                annotations.selectRange(container, boxes, cellSel.start, cellSel.finish);
                // stop the browser from creating a big text selection, place the selection at the end of the cell where the cursor is
                bridge.selectContents(finish);
                bridge.collapseSelection();
            });
        };
    };

    const byClass = (ephemera) => {
        const addSelectionClass = addClass(ephemera.selected);
        const removeSelectionClasses = removeClasses([ephemera.selected, ephemera.lastSelected, ephemera.firstSelected]);
        const clear = (container) => {
            const sels = descendants(container, ephemera.selectedSelector);
            each$2(sels, removeSelectionClasses);
        };
        const selectRange = (container, cells, start, finish) => {
            clear(container);
            each$2(cells, addSelectionClass);
            add$1(start, ephemera.firstSelected);
            add$1(finish, ephemera.lastSelected);
        };
        return {
            clearBeforeUpdate: clear,
            clear,
            selectRange,
            selectedSelector: ephemera.selectedSelector,
            firstSelectedSelector: ephemera.firstSelectedSelector,
            lastSelectedSelector: ephemera.lastSelectedSelector
        };
    };
    const byAttr = (ephemera, onSelection, onClear) => {
        const removeSelectionAttributes = (element) => {
            remove$6(element, ephemera.selected);
            remove$6(element, ephemera.firstSelected);
            remove$6(element, ephemera.lastSelected);
        };
        const addSelectionAttribute = (element) => {
            set$2(element, ephemera.selected, '1');
        };
        const clear = (container) => {
            clearBeforeUpdate(container);
            onClear();
        };
        const clearBeforeUpdate = (container) => {
            const sels = descendants(container, `${ephemera.selectedSelector},${ephemera.firstSelectedSelector},${ephemera.lastSelectedSelector}`);
            each$2(sels, removeSelectionAttributes);
        };
        const selectRange = (container, cells, start, finish) => {
            clear(container);
            each$2(cells, addSelectionAttribute);
            set$2(start, ephemera.firstSelected, '1');
            set$2(finish, ephemera.lastSelected, '1');
            onSelection(cells, start, finish);
        };
        return {
            clearBeforeUpdate,
            clear,
            selectRange,
            selectedSelector: ephemera.selectedSelector,
            firstSelectedSelector: ephemera.firstSelectedSelector,
            lastSelectedSelector: ephemera.lastSelectedSelector
        };
    };
    const SelectionAnnotation = {
        byClass,
        byAttr
    };

    /*
     NOTE: This file is duplicated in the following locations:
      - plugins/table/selection/Ephemera.ts
      - advtable
     Make sure that if making changes to this file, the other files are updated as well
     */
    const strSelected = 'data-mce-selected';
    const strSelectedSelector = 'td[' + strSelected + '],th[' + strSelected + ']';
    // used with not selectors
    const strAttributeSelector = '[' + strSelected + ']';
    const strFirstSelected = 'data-mce-first-selected';
    const strFirstSelectedSelector = 'td[' + strFirstSelected + '],th[' + strFirstSelected + ']';
    const strLastSelected = 'data-mce-last-selected';
    const strLastSelectedSelector = 'td[' + strLastSelected + '],th[' + strLastSelected + ']';
    const attributeSelector = strAttributeSelector;
    const ephemera = {
        selected: strSelected,
        selectedSelector: strSelectedSelector,
        firstSelected: strFirstSelected,
        firstSelectedSelector: strFirstSelectedSelector,
        lastSelected: strLastSelected,
        lastSelectedSelector: strLastSelectedSelector
    };

    /*
     NOTE: This file is partially duplicated in the following locations:
      - plugins/table/queries/TableTargets.ts
      - advtable
     Make sure that if making changes to this file, the other files are updated as well
     */
    const forMenu = (selectedCells, table, cell) => ({
        element: cell,
        mergable: mergable(table, selectedCells, ephemera),
        unmergable: unmergable(selectedCells),
        selection: selection(selectedCells)
    });
    const paste = (element, clipboard, generators) => ({
        element,
        clipboard,
        generators
    });
    const pasteRows = (selectedCells, _cell, clipboard, generators) => ({
        selection: selection(selectedCells),
        clipboard,
        generators
    });

    /*
     NOTE: This file is partially duplicated in the following locations:
      - plugins/table/selection/TableSelection.ts
      - advtable
     Make sure that if making changes to this file, the other files are updated as well
     */
    const getSelectionCellFallback = (element) => table(element).bind((table) => retrieve(table, ephemera.firstSelectedSelector)).fold(constant(element), (cells) => cells[0]);
    const getSelectionFromSelector = (selector) => (initCell, isRoot) => {
        const cellName = name(initCell);
        const cell = cellName === 'col' || cellName === 'colgroup' ? getSelectionCellFallback(initCell) : initCell;
        return closest$1(cell, selector, isRoot);
    };
    const getSelectionCellOrCaption = getSelectionFromSelector('th,td,caption');
    const getSelectionCell = getSelectionFromSelector('th,td');
    // Note: Includes single cell if the start of the selection whether collapsed or ranged is within a table cell
    const getCellsFromSelection = (editor) => fromDom(editor.model.table.getSelectedCells());
    const getCellsFromFakeSelection = (editor) => filter$2(getCellsFromSelection(editor), (cell) => is$1(cell, ephemera.selectedSelector));

    const extractSelected = (cells) => {
        // Assume for now that we only have one table (also handles the case where we multi select outside a table)
        return table(cells[0]).map((table) => {
            const replica = extract$1(table, attributeSelector);
            removeDataStyle(replica);
            return [replica];
        });
    };
    const serializeElements = (editor, elements) => map$1(elements, (elm) => editor.selection.serializer.serialize(elm.dom, {})).join('');
    const getTextContent = (editor, replicaElements) => {
        const doc = editor.getDoc();
        const dos = getRootNode(SugarElement.fromDom(editor.getBody()));
        // Set up offscreen div so that the extracted table element can be inserted into the DOM
        // TINY-10847: If the table element is detached from the DOM, calling innerText is equivalent to calling
        // textContent which does not include '\n' and '\t' characters to separate rows and cells respectively
        const offscreenDiv = SugarElement.fromTag('div', doc);
        set$2(offscreenDiv, 'data-mce-bogus', 'all');
        setAll(offscreenDiv, {
            position: 'fixed',
            left: '-9999999px',
            top: '0',
            overflow: 'hidden',
            opacity: '0'
        });
        const root = getContentContainer(dos);
        append(offscreenDiv, replicaElements);
        append$1(root, offscreenDiv);
        const textContent = offscreenDiv.dom.innerText;
        remove$5(offscreenDiv);
        return textContent;
    };
    const registerEvents = (editor, actions) => {
        editor.on('BeforeGetContent', (e) => {
            const multiCellContext = (cells) => {
                e.preventDefault();
                extractSelected(cells).each((replicaElements) => {
                    const content = e.format === 'text' ? getTextContent(editor, replicaElements) : serializeElements(editor, replicaElements);
                    e.content = content;
                });
            };
            if (e.selection === true) {
                const cells = getCellsFromFakeSelection(editor);
                if (cells.length >= 1) {
                    multiCellContext(cells);
                }
            }
        });
        editor.on('BeforeSetContent', (e) => {
            if (e.selection === true && e.paste === true) {
                const selectedCells = getCellsFromSelection(editor);
                head(selectedCells).each((cell) => {
                    table(cell).each((table) => {
                        const elements = filter$2(fromHtml(e.content), (content) => {
                            return name(content) !== 'meta';
                        });
                        const isTable = isTag('table');
                        if (shouldMergeContentOnPaste(editor) && elements.length === 1 && isTable(elements[0])) {
                            e.preventDefault();
                            const doc = SugarElement.fromDom(editor.getDoc());
                            const generators = paste$1(doc);
                            const targets = paste(cell, elements[0], generators);
                            actions.pasteCells(table, targets).each(() => {
                                editor.focus();
                            });
                        }
                    });
                });
            }
        });
    };

    /*
     NOTE: This file is duplicated in the following locations:
      - core/api/TableEvents.ts
      - plugins/table/api/Events.ts
      - advtable
     Make sure that if making changes to this file, the other files are updated as well
     */
    const fireNewRow = (editor, row) => editor.dispatch('NewRow', { node: row });
    const fireNewCell = (editor, cell) => editor.dispatch('NewCell', { node: cell });
    const fireTableModified = (editor, table, data) => {
        editor.dispatch('TableModified', { ...data, table });
    };
    const fireTableSelectionChange = (editor, cells, start, finish, otherCells) => {
        editor.dispatch('TableSelectionChange', {
            cells,
            start,
            finish,
            otherCells
        });
    };
    const fireTableSelectionClear = (editor) => {
        editor.dispatch('TableSelectionClear');
    };
    const fireObjectResizeStart = (editor, target, width, height, origin) => {
        editor.dispatch('ObjectResizeStart', { target, width, height, origin });
    };
    const fireObjectResized = (editor, target, width, height, origin) => {
        editor.dispatch('ObjectResized', { target, width, height, origin });
    };
    const styleModified = { structure: false, style: true };
    const structureModified = { structure: true, style: false };
    const styleAndStructureModified = { structure: true, style: true };

    const get$1 = (editor, table) => {
        // Note: We can't enforce none (responsive), as if someone manually resizes a table
        // then it must switch to either pixel (fixed) or percentage (relative) sizing
        if (isTablePercentagesForced(editor)) {
            return TableSize.percentageSize(table);
        }
        else if (isTablePixelsForced(editor)) {
            return TableSize.pixelSize(table);
        }
        else {
            // Detect based on the table width
            return TableSize.getTableSize(table);
        }
    };

    const TableActions = (editor, resizeHandler, cellSelectionHandler) => {
        const isTableBody = (editor) => name(getBody(editor)) === 'table';
        const lastRowGuard = (table) => !isTableBody(editor) || getGridSize(table).rows > 1;
        const lastColumnGuard = (table) => !isTableBody(editor) || getGridSize(table).columns > 1;
        // Optional.none gives the default cloneFormats.
        const cloneFormats = getTableCloneElements(editor);
        const colMutationOp = isResizeTableColumnResizing(editor) ? noop : halve;
        const getTableSectionType = (table) => {
            switch (getTableHeaderType(editor)) {
                case 'section':
                    return TableSection.section();
                case 'sectionCells':
                    return TableSection.sectionCells();
                case 'cells':
                    return TableSection.cells();
                default:
                    // Attempt to automatically find the type. If a type can't be found
                    // then fallback to "section" to maintain backwards compatibility.
                    return TableSection.getTableSectionType(table, 'section');
            }
        };
        const setSelectionFromAction = (table, result) => result.cursor.fold(() => {
            // Snooker has reported we don't have a good cursor position. However, we may have a locked column
            // with noneditable cells, so lets check if we have a noneditable cell and if so place the selection
            const cells = cells$1(table);
            return head(cells).filter(inBody).map((firstCell) => {
                cellSelectionHandler.clearSelectedCells(table.dom);
                const rng = editor.dom.createRng();
                rng.selectNode(firstCell.dom);
                editor.selection.setRng(rng);
                set$2(firstCell, 'data-mce-selected', '1');
                return rng;
            });
        }, (cell) => {
            const des = freefallRtl(cell);
            const rng = editor.dom.createRng();
            rng.setStart(des.element.dom, des.offset);
            rng.setEnd(des.element.dom, des.offset);
            editor.selection.setRng(rng);
            cellSelectionHandler.clearSelectedCells(table.dom);
            return Optional.some(rng);
        });
        const execute = (operation, guard, mutate, effect) => (table, target, noEvents = false) => {
            removeDataStyle(table);
            const doc = SugarElement.fromDom(editor.getDoc());
            const generators = cellOperations(mutate, doc, cloneFormats);
            const behaviours = {
                sizing: get$1(editor, table),
                resize: isResizeTableColumnResizing(editor) ? resizeTable() : preserveTable(),
                section: getTableSectionType(table)
            };
            return guard(table) ? operation(table, target, generators, behaviours).bind((result) => {
                // Update the resize bars after the table operation
                resizeHandler.refresh(table.dom);
                // INVESTIGATE: Should "noEvents" prevent these from firing as well?
                each$2(result.newRows, (row) => {
                    fireNewRow(editor, row.dom);
                });
                each$2(result.newCells, (cell) => {
                    fireNewCell(editor, cell.dom);
                });
                const range = setSelectionFromAction(table, result);
                if (inBody(table)) {
                    removeDataStyle(table);
                    if (!noEvents) {
                        fireTableModified(editor, table.dom, effect);
                    }
                }
                return range.map((rng) => ({
                    rng,
                    effect
                }));
            }) : Optional.none();
        };
        const deleteRow = execute(eraseRows, lastRowGuard, noop, structureModified);
        const deleteColumn = execute(eraseColumns, lastColumnGuard, noop, structureModified);
        const insertRowsBefore$1 = execute(insertRowsBefore, always, noop, structureModified);
        const insertRowsAfter$1 = execute(insertRowsAfter, always, noop, structureModified);
        const insertColumnsBefore$1 = execute(insertColumnsBefore, always, colMutationOp, structureModified);
        const insertColumnsAfter$1 = execute(insertColumnsAfter, always, colMutationOp, structureModified);
        const mergeCells$1 = execute(mergeCells, always, noop, structureModified);
        const unmergeCells$1 = execute(unmergeCells, always, noop, structureModified);
        const pasteColsBefore$1 = execute(pasteColsBefore, always, noop, structureModified);
        const pasteColsAfter$1 = execute(pasteColsAfter, always, noop, structureModified);
        const pasteRowsBefore$1 = execute(pasteRowsBefore, always, noop, structureModified);
        const pasteRowsAfter$1 = execute(pasteRowsAfter, always, noop, structureModified);
        const pasteCells$1 = execute(pasteCells, always, noop, styleAndStructureModified);
        const makeCellsHeader$1 = execute(makeCellsHeader, always, noop, structureModified);
        const unmakeCellsHeader$1 = execute(unmakeCellsHeader, always, noop, structureModified);
        const makeColumnsHeader$1 = execute(makeColumnsHeader, always, noop, structureModified);
        const unmakeColumnsHeader$1 = execute(unmakeColumnsHeader, always, noop, structureModified);
        const makeRowsHeader$1 = execute(makeRowsHeader, always, noop, structureModified);
        const makeRowsBody$1 = execute(makeRowsBody, always, noop, structureModified);
        const makeRowsFooter$1 = execute(makeRowsFooter, always, noop, structureModified);
        const getTableCellType = getCellsType;
        const getTableColType = getColumnsType;
        const getTableRowType = getRowsType;
        return {
            deleteRow,
            deleteColumn,
            insertRowsBefore: insertRowsBefore$1,
            insertRowsAfter: insertRowsAfter$1,
            insertColumnsBefore: insertColumnsBefore$1,
            insertColumnsAfter: insertColumnsAfter$1,
            mergeCells: mergeCells$1,
            unmergeCells: unmergeCells$1,
            pasteColsBefore: pasteColsBefore$1,
            pasteColsAfter: pasteColsAfter$1,
            pasteRowsBefore: pasteRowsBefore$1,
            pasteRowsAfter: pasteRowsAfter$1,
            pasteCells: pasteCells$1,
            makeCellsHeader: makeCellsHeader$1,
            unmakeCellsHeader: unmakeCellsHeader$1,
            makeColumnsHeader: makeColumnsHeader$1,
            unmakeColumnsHeader: unmakeColumnsHeader$1,
            makeRowsHeader: makeRowsHeader$1,
            makeRowsBody: makeRowsBody$1,
            makeRowsFooter: makeRowsFooter$1,
            getTableRowType,
            getTableCellType,
            getTableColType
        };
    };

    const placeCaretInCell = (editor, cell) => {
        editor.selection.select(cell.dom, true);
        editor.selection.collapse(true);
    };
    const selectFirstCellInTable = (editor, tableElm) => {
        descendant(tableElm, 'td,th').each(curry(placeCaretInCell, editor));
    };
    const fireEvents = (editor, table) => {
        each$2(descendants(table, 'tr'), (row) => {
            fireNewRow(editor, row.dom);
            each$2(descendants(row, 'th,td'), (cell) => {
                fireNewCell(editor, cell.dom);
            });
        });
    };
    const isPercentage = (width) => isString(width) && width.indexOf('%') !== -1;
    const insert = (editor, columns, rows, colHeaders, rowHeaders) => {
        const defaultStyles = getTableDefaultStyles(editor);
        const options = {
            styles: defaultStyles,
            attributes: getTableDefaultAttributes(editor),
            colGroups: tableUseColumnGroup(editor)
        };
        // Don't create an undo level when inserting the base table HTML otherwise we can end up with 2 undo levels
        editor.undoManager.ignore(() => {
            const table = render(rows, columns, rowHeaders, colHeaders, getTableHeaderType(editor), options);
            set$2(table, 'data-mce-id', '__mce');
            const html = getOuter$2(table);
            editor.insertContent(html);
            editor.addVisual();
        });
        // Enforce the sizing mode of the table
        return descendant(getBody(editor), 'table[data-mce-id="__mce"]').map((table) => {
            if (isTablePixelsForced(editor)) {
                convertToPixelSizeWidth(table);
            }
            else if (isTableResponsiveForced(editor)) {
                convertToNoneSizeWidth(table);
            }
            else if (isTablePercentagesForced(editor) || isPercentage(defaultStyles.width)) {
                convertToPercentSizeWidth(table);
            }
            removeDataStyle(table);
            remove$6(table, 'data-mce-id');
            fireEvents(editor, table);
            selectFirstCellInTable(editor, table);
            return table.dom;
        }).getOrNull();
    };
    const insertTable = (editor, rows, columns, options = {}) => {
        const checkInput = (val) => isNumber(val) && val > 0;
        if (checkInput(rows) && checkInput(columns)) {
            const headerRows = options.headerRows ?? defaultHeaderRows(editor);
            const headerColumns = options.headerColumns ?? defaultHeaderCols(editor);
            return insert(editor, columns, rows, headerColumns, headerRows);
        }
        else {
            // eslint-disable-next-line no-console
            console.error('Invalid values for mceInsertTable - rows and columns values are required to insert a table.');
            return null;
        }
    };

    var global = tinymce.util.Tools.resolve('tinymce.FakeClipboard');

    /*
     NOTE: This file is duplicated in the following locations:
      - plugins/table/api/Clipboard.ts
     Make sure that if making changes to this file, the other files are updated as well
     */
    const tableTypeBase = 'x-tinymce/dom-table-';
    const tableTypeRow = tableTypeBase + 'rows';
    const tableTypeColumn = tableTypeBase + 'columns';
    const setData = (items) => {
        const fakeClipboardItem = global.FakeClipboardItem(items);
        global.write([fakeClipboardItem]);
    };
    const getData = (type) => {
        const items = global.read() ?? [];
        return findMap(items, (item) => Optional.from(item.getType(type)));
    };
    const clearData = (type) => {
        if (getData(type).isSome()) {
            global.clear();
        }
    };
    const setRows = (rowsOpt) => {
        rowsOpt.fold(clearRows, (rows) => setData({ [tableTypeRow]: rows }));
    };
    const getRows = () => getData(tableTypeRow);
    const clearRows = () => clearData(tableTypeRow);
    const setColumns = (columnsOpt) => {
        columnsOpt.fold(clearColumns, (columns) => setData({ [tableTypeColumn]: columns }));
    };
    const getColumns = () => getData(tableTypeColumn);
    const clearColumns = () => clearData(tableTypeColumn);

    const getSelectionStartCellOrCaption = (editor) => getSelectionCellOrCaption(getSelectionStart(editor), getIsRoot(editor)).filter(isInEditableContext$1);
    const getSelectionStartCell = (editor) => getSelectionCell(getSelectionStart(editor), getIsRoot(editor)).filter(isInEditableContext$1);
    const registerCommands = (editor, actions) => {
        const isRoot = getIsRoot(editor);
        const eraseTable = () => getSelectionStartCellOrCaption(editor).each((cellOrCaption) => {
            table(cellOrCaption, isRoot).filter(not(isRoot)).each((table) => {
                const cursor = SugarElement.fromText('');
                after$4(table, cursor);
                remove$5(table);
                if (editor.dom.isEmpty(editor.getBody())) {
                    editor.setContent('');
                    editor.selection.setCursorLocation();
                }
                else {
                    const rng = editor.dom.createRng();
                    rng.setStart(cursor.dom, 0);
                    rng.setEnd(cursor.dom, 0);
                    editor.selection.setRng(rng);
                    editor.nodeChanged();
                }
            });
        });
        const setSizingMode = (sizing) => getSelectionStartCellOrCaption(editor).each((cellOrCaption) => {
            // Do nothing if tables are forced to use a specific sizing mode
            const isForcedSizing = isTableResponsiveForced(editor) || isTablePixelsForced(editor) || isTablePercentagesForced(editor);
            if (!isForcedSizing) {
                table(cellOrCaption, isRoot).each((table) => {
                    if (sizing === 'relative' && !isPercentSizing(table)) {
                        convertToPercentSizeWidth(table);
                    }
                    else if (sizing === 'fixed' && !isPixelSizing(table)) {
                        convertToPixelSizeWidth(table);
                    }
                    else if (sizing === 'responsive' && !isNoneSizing(table)) {
                        convertToNoneSizeWidth(table);
                    }
                    removeDataStyle(table);
                    fireTableModified(editor, table.dom, structureModified);
                });
            }
        });
        const getTableFromCell = (cell) => table(cell, isRoot);
        const performActionOnSelection = (action) => getSelectionStartCell(editor).bind((cell) => getTableFromCell(cell).map((table) => action(table, cell)));
        const toggleTableClass = (_ui, clazz) => {
            performActionOnSelection((table) => {
                editor.formatter.toggle('tableclass', { value: clazz }, table.dom);
                fireTableModified(editor, table.dom, styleModified);
            });
        };
        const toggleTableCellClass = (_ui, clazz) => {
            performActionOnSelection((table) => {
                const selectedCells = getCellsFromSelection(editor);
                const allHaveClass = forall(selectedCells, (cell) => editor.formatter.match('tablecellclass', { value: clazz }, cell.dom));
                const formatterAction = allHaveClass ? editor.formatter.remove : editor.formatter.apply;
                each$2(selectedCells, (cell) => formatterAction('tablecellclass', { value: clazz }, cell.dom));
                fireTableModified(editor, table.dom, styleModified);
            });
        };
        const toggleCaption = () => {
            getSelectionStartCellOrCaption(editor).each((cellOrCaption) => {
                table(cellOrCaption, isRoot).each((table) => {
                    child(table, 'caption').fold(() => {
                        const caption = SugarElement.fromTag('caption');
                        append$1(caption, SugarElement.fromText('Caption'));
                        appendAt(table, caption, 0);
                        editor.selection.setCursorLocation(caption.dom, 0);
                    }, (caption) => {
                        if (isTag('caption')(cellOrCaption)) {
                            one('td', table).each((td) => editor.selection.setCursorLocation(td.dom, 0));
                        }
                        remove$5(caption);
                    });
                    fireTableModified(editor, table.dom, structureModified);
                });
            });
        };
        const postExecute = (_data) => {
            editor.focus();
        };
        const actOnSelection = (execute, noEvents = false) => performActionOnSelection((table, startCell) => {
            const targets = forMenu(getCellsFromSelection(editor), table, startCell);
            execute(table, targets, noEvents).each(postExecute);
        });
        const copyRowSelection = () => performActionOnSelection((table, startCell) => {
            const targets = forMenu(getCellsFromSelection(editor), table, startCell);
            const generators = cellOperations(noop, SugarElement.fromDom(editor.getDoc()), Optional.none());
            return copyRows(table, targets, generators);
        });
        const copyColSelection = () => performActionOnSelection((table, startCell) => {
            const targets = forMenu(getCellsFromSelection(editor), table, startCell);
            return copyCols(table, targets);
        });
        const pasteOnSelection = (execute, getRows) => 
        // If we have FakeClipboard rows to paste
        getRows().each((rows) => {
            const clonedRows = map$1(rows, (row) => deep(row));
            performActionOnSelection((table, startCell) => {
                const generators = paste$1(SugarElement.fromDom(editor.getDoc()));
                const targets = pasteRows(getCellsFromSelection(editor), startCell, clonedRows, generators);
                execute(table, targets).each(postExecute);
            });
        });
        const actOnType = (getAction) => (_ui, args) => get$c(args, 'type').each((type) => {
            actOnSelection(getAction(type), args.no_events);
        });
        // Register action commands
        each$1({
            mceTableSplitCells: () => actOnSelection(actions.unmergeCells),
            mceTableMergeCells: () => actOnSelection(actions.mergeCells),
            mceTableInsertRowBefore: () => actOnSelection(actions.insertRowsBefore),
            mceTableInsertRowAfter: () => actOnSelection(actions.insertRowsAfter),
            mceTableInsertColBefore: () => actOnSelection(actions.insertColumnsBefore),
            mceTableInsertColAfter: () => actOnSelection(actions.insertColumnsAfter),
            mceTableDeleteCol: () => actOnSelection(actions.deleteColumn),
            mceTableDeleteRow: () => actOnSelection(actions.deleteRow),
            mceTableCutCol: () => copyColSelection().each((selection) => {
                setColumns(selection);
                actOnSelection(actions.deleteColumn);
            }),
            mceTableCutRow: () => copyRowSelection().each((selection) => {
                setRows(selection);
                actOnSelection(actions.deleteRow);
            }),
            mceTableCopyCol: () => copyColSelection().each((selection) => setColumns(selection)),
            mceTableCopyRow: () => copyRowSelection().each((selection) => setRows(selection)),
            mceTablePasteColBefore: () => pasteOnSelection(actions.pasteColsBefore, getColumns),
            mceTablePasteColAfter: () => pasteOnSelection(actions.pasteColsAfter, getColumns),
            mceTablePasteRowBefore: () => pasteOnSelection(actions.pasteRowsBefore, getRows),
            mceTablePasteRowAfter: () => pasteOnSelection(actions.pasteRowsAfter, getRows),
            mceTableDelete: eraseTable,
            mceTableCellToggleClass: toggleTableCellClass,
            mceTableToggleClass: toggleTableClass,
            mceTableToggleCaption: toggleCaption,
            mceTableSizingMode: (_ui, sizing) => setSizingMode(sizing),
            mceTableCellType: actOnType((type) => type === 'th' ? actions.makeCellsHeader : actions.unmakeCellsHeader),
            mceTableColType: actOnType((type) => type === 'th' ? actions.makeColumnsHeader : actions.unmakeColumnsHeader),
            mceTableRowType: actOnType((type) => {
                switch (type) {
                    case 'header':
                        return actions.makeRowsHeader;
                    case 'footer':
                        return actions.makeRowsFooter;
                    default:
                        return actions.makeRowsBody;
                }
            })
        }, (func, name) => editor.addCommand(name, func));
        editor.addCommand('mceInsertTable', (_ui, args) => {
            insertTable(editor, args.rows, args.columns, args.options);
        });
        // Apply cell style using command (background color, border color, border style and border width)
        // tinyMCE.activeEditor.execCommand('mceTableApplyCellStyle', false, { backgroundColor: 'red', borderColor: 'blue' })
        // Remove cell style using command (an empty string indicates to remove the style)
        // tinyMCE.activeEditor.execCommand('mceTableApplyCellStyle', false, { backgroundColor: '' })
        editor.addCommand('mceTableApplyCellStyle', (_ui, args) => {
            const getFormatName = (style) => 'tablecell' + style.toLowerCase().replace('-', '');
            if (!isObject(args)) {
                return;
            }
            const cells = filter$2(getCellsFromSelection(editor), isInEditableContext$1);
            if (cells.length === 0) {
                return;
            }
            const validArgs = filter$1(args, (value, style) => editor.formatter.has(getFormatName(style)) && isString(value));
            if (isEmpty(validArgs)) {
                return;
            }
            each$1(validArgs, (value, style) => {
                const formatName = getFormatName(style);
                each$2(cells, (cell) => {
                    if (value === '') {
                        editor.formatter.remove(formatName, { value: null }, cell.dom, true);
                    }
                    else {
                        editor.formatter.apply(formatName, { value }, cell.dom);
                    }
                });
            });
            /*
              Use the first cell in the selection to get the table and fire the TableModified event.
              If this command is applied over multiple tables, only the first table selected
              will have a TableModified event thrown.
            */
            getTableFromCell(cells[0]).each((table) => fireTableModified(editor, table.dom, styleModified));
        });
    };

    const registerQueryCommands = (editor, actions) => {
        const isRoot = getIsRoot(editor);
        const lookupOnSelection = (action) => getSelectionCell(getSelectionStart(editor)).bind((cell) => table(cell, isRoot).map((table) => {
            const targets = forMenu(getCellsFromSelection(editor), table, cell);
            return action(table, targets);
        })).getOr('');
        each$1({
            mceTableRowType: () => lookupOnSelection(actions.getTableRowType),
            mceTableCellType: () => lookupOnSelection(actions.getTableCellType),
            mceTableColType: () => lookupOnSelection(actions.getTableColType)
        }, (func, name) => editor.addQueryValueHandler(name, func));
    };

    const hasInternalTarget = (e) => !has(SugarElement.fromDom(e.target), 'ephox-snooker-resizer-bar');
    const TableCellSelectionHandler = (editor, resizeHandler) => {
        const cellSelection = Selections(() => SugarElement.fromDom(editor.getBody()), () => getSelectionCell(getSelectionStart(editor), getIsRoot(editor)), ephemera.selectedSelector);
        const onSelection = (cells, start, finish) => {
            const tableOpt = table(start);
            tableOpt.each((table) => {
                const cellsDom = map$1(cells, (cell) => cell.dom);
                const cloneFormats = getTableCloneElements(editor);
                const generators = cellOperations(noop, SugarElement.fromDom(editor.getDoc()), cloneFormats);
                const selectedCells = getCellsFromSelection(editor);
                const otherCellsDom = getOtherCells(table, { selection: selectedCells }, generators)
                    .map((otherCells) => map(otherCells, (cellArr) => map$1(cellArr, (cell) => cell.dom)))
                    .getOrUndefined();
                fireTableSelectionChange(editor, cellsDom, start.dom, finish.dom, otherCellsDom);
            });
        };
        const onClear = () => fireTableSelectionClear(editor);
        const annotations = SelectionAnnotation.byAttr(ephemera, onSelection, onClear);
        editor.on('init', (_e) => {
            const win = editor.getWin();
            const body = getBody(editor);
            const isRoot = getIsRoot(editor);
            // When the selection changes through either the mouse or keyboard, and the selection is no longer within the table.
            // Remove the selection.
            const syncSelection = () => {
                const sel = editor.selection;
                const start = SugarElement.fromDom(sel.getStart());
                const end = SugarElement.fromDom(sel.getEnd());
                const shared = sharedOne(table, [start, end]);
                shared.fold(() => annotations.clear(body), noop);
            };
            const mouseHandlers = mouse(win, body, isRoot, annotations);
            const keyHandlers = keyboard(win, body, isRoot, annotations);
            const external$1 = external(win, body, isRoot, annotations);
            const hasShiftKey = (event) => event.raw.shiftKey === true;
            editor.on('TableSelectorChange', (e) => external$1(e.start, e.finish));
            const handleResponse = (event, response) => {
                // Only handle shift key non shiftkey cell navigation is handled by core
                if (!hasShiftKey(event)) {
                    return;
                }
                if (response.kill) {
                    event.kill();
                }
                response.selection.each((ns) => {
                    const relative = SimSelection.relative(ns.start, ns.finish);
                    const rng = asLtrRange(win, relative);
                    editor.selection.setRng(rng);
                });
            };
            const keyup = (event) => {
                const wrappedEvent = fromRawEvent(event);
                // Note, this is an optimisation.
                if (wrappedEvent.raw.shiftKey && isNavigation(wrappedEvent.raw.which)) {
                    const rng = editor.selection.getRng();
                    const start = SugarElement.fromDom(rng.startContainer);
                    const end = SugarElement.fromDom(rng.endContainer);
                    keyHandlers.keyup(wrappedEvent, start, rng.startOffset, end, rng.endOffset).each((response) => {
                        handleResponse(wrappedEvent, response);
                    });
                }
            };
            const keydown = (event) => {
                const wrappedEvent = fromRawEvent(event);
                resizeHandler.hide();
                const rng = editor.selection.getRng();
                const start = SugarElement.fromDom(rng.startContainer);
                const end = SugarElement.fromDom(rng.endContainer);
                const direction = onDirection(ltr, rtl)(SugarElement.fromDom(editor.selection.getStart()));
                keyHandlers.keydown(wrappedEvent, start, rng.startOffset, end, rng.endOffset, direction).each((response) => {
                    handleResponse(wrappedEvent, response);
                });
                resizeHandler.show();
            };
            const isLeftMouse = (raw) => raw.button === 0;
            // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
            const isLeftButtonPressed = (raw) => {
                // Only added by Chrome/Firefox in June 2015.
                // This is only to fix a 1px bug (TBIO-2836) so return true if we're on an older browser
                if (raw.buttons === undefined) {
                    return true;
                }
                // use bitwise & for optimal comparison
                // eslint-disable-next-line no-bitwise
                return (raw.buttons & 1) !== 0;
            };
            const dragStart = (_e) => {
                mouseHandlers.clearstate();
            };
            const mouseDown = (e) => {
                if (isLeftMouse(e) && hasInternalTarget(e)) {
                    mouseHandlers.mousedown(fromRawEvent(e));
                }
            };
            const mouseOver = (e) => {
                if (isLeftButtonPressed(e) && hasInternalTarget(e)) {
                    mouseHandlers.mouseover(fromRawEvent(e));
                }
            };
            const mouseUp = (e) => {
                if (isLeftMouse(e) && hasInternalTarget(e)) {
                    mouseHandlers.mouseup(fromRawEvent(e));
                }
            };
            const getDoubleTap = () => {
                const lastTarget = Cell(SugarElement.fromDom(body));
                const lastTimeStamp = Cell(0);
                const touchEnd = (t) => {
                    const target = SugarElement.fromDom(t.target);
                    if (isTag('td')(target) || isTag('th')(target)) {
                        const lT = lastTarget.get();
                        const lTS = lastTimeStamp.get();
                        if (eq$1(lT, target) && (t.timeStamp - lTS) < 300) {
                            t.preventDefault();
                            external$1(target, target);
                        }
                    }
                    lastTarget.set(target);
                    lastTimeStamp.set(t.timeStamp);
                };
                return {
                    touchEnd
                };
            };
            const doubleTap = getDoubleTap();
            editor.on('dragstart', dragStart);
            editor.on('mousedown', mouseDown);
            editor.on('mouseover', mouseOver);
            editor.on('mouseup', mouseUp);
            editor.on('touchend', doubleTap.touchEnd);
            editor.on('keyup', keyup);
            editor.on('keydown', keydown);
            editor.on('NodeChange', syncSelection);
        });
        editor.on('PreInit', () => {
            editor.serializer.addTempAttr(ephemera.firstSelected);
            editor.serializer.addTempAttr(ephemera.lastSelected);
        });
        const clearSelectedCells = (container) => annotations.clear(SugarElement.fromDom(container));
        const getSelectedCells = () => fold(cellSelection.get(), 
        // No fake selected cells
        constant([]), 
        // This path is taken whenever there is fake cell selection even for just a single selected cell
        (cells) => {
            return map$1(cells, (cell) => cell.dom);
        }, 
        // For this path, the start of the selection whether collapsed or ranged is within a table cell
        (cell) => [cell.dom]);
        return {
            getSelectedCells,
            clearSelectedCells
        };
    };

    const get = (editor, isResizable) => {
        const editorBody = SugarElement.fromDom(editor.getBody());
        return ResizeWire.body(editorBody, isResizable);
    };

    const isTable = (node) => isNonNullable(node) && node.nodeName === 'TABLE';
    const barResizerPrefix = 'bar-';
    const isResizable = (elm) => get$b(elm, 'data-mce-resize') !== 'false';
    const syncTableCellPixels = (table) => {
        const warehouse = Warehouse.fromTable(table);
        if (!Warehouse.hasColumns(warehouse)) {
            // Ensure the specified width matches the actual cell width
            each$2(cells$1(table), (cell) => {
                const computedWidth = get$9(cell, 'width');
                set$1(cell, 'width', computedWidth);
                remove$6(cell, 'width');
            });
        }
    };
    const isCornerResize = (origin) => startsWith(origin, 'corner-');
    const getCornerLocation = (origin) => removeLeading(origin, 'corner-');
    const TableResizeHandler = (editor) => {
        const selectionRng = value();
        const tableResize = value();
        const resizeWire = value();
        let startW;
        let startRawW;
        let startH;
        let startRawH;
        const lazySizing = (table) => get$1(editor, table);
        const lazyResizingBehaviour = () => isPreserveTableColumnResizing(editor) ? preserveTable() : resizeTable();
        const getNumColumns = (table) => getGridSize(table).columns;
        const getNumRows = (table) => getGridSize(table).rows;
        const afterCornerResize = (table, origin, width, height) => {
            // Origin will tell us which handle was clicked, eg corner-se or corner-nw
            // so check to see if it ends with `e` (eg east edge)
            const location = getCornerLocation(origin);
            const isRightEdgeResize = endsWith(location, 'e');
            const isNorthEdgeResize = startsWith(location, 'n');
            // Responsive tables don't have a width so we need to convert it to a relative/percent
            // table instead, as that's closer to responsive sizing than fixed sizing
            if (startRawW === '') {
                convertToPercentSizeWidth(table);
            }
            // Responsive tables don't have a height so we need to convert it to a fixed value to be able to resize the table height
            if (startRawH === '') {
                convertToPixelSizeHeight(table);
            }
            // Adjust the column sizes and update the table width to use the right sizing, if the table changed size.
            // This is needed as core will always use pixels when setting the width.
            if (width !== startW && startRawW !== '') {
                // Restore the original size and then let snooker resize appropriately
                set$1(table, 'width', startRawW);
                const resizing = lazyResizingBehaviour();
                const tableSize = lazySizing(table);
                // For preserve table we want to always resize the entire table. So pretend the last column is being resized
                const col = isPreserveTableColumnResizing(editor) || isRightEdgeResize ? getNumColumns(table) - 1 : 0;
                adjustWidth(table, width - startW, col, resizing, tableSize);
                // Handle the edge case where someone might fire this event without resizing.
                // If so then we need to ensure the table is still using percent
            }
            else if (isPercentage$1(startRawW)) {
                const percentW = parseFloat(startRawW.replace('%', ''));
                const targetPercentW = width * percentW / startW;
                set$1(table, 'width', targetPercentW + '%');
            }
            // Sync the cell sizes, as the core resizing logic doesn't update them, but snooker does
            if (isPixel(startRawW)) {
                syncTableCellPixels(table);
            }
            // NOTE: This will only change the height of the first or last tr
            if (height !== startH && startRawH !== '') {
                // Restore the original size and then let snooker resize appropriately
                set$1(table, 'height', startRawH);
                const idx = isNorthEdgeResize ? 0 : getNumRows(table) - 1;
                adjustHeight(table, height - startH, idx);
            }
        };
        const destroy = () => {
            tableResize.on((sz) => {
                sz.destroy();
            });
        };
        editor.on('init', () => {
            const rawWire = get(editor, isResizable);
            resizeWire.set(rawWire);
            if (hasTableObjectResizing(editor) && hasTableResizeBars(editor)) {
                const resizing = lazyResizingBehaviour();
                const sz = TableResize.create(rawWire, resizing, lazySizing);
                if (!editor.mode.isReadOnly()) {
                    sz.on();
                }
                sz.events.startDrag.bind((_event) => {
                    selectionRng.set(editor.selection.getRng());
                });
                sz.events.beforeResize.bind((event) => {
                    const rawTable = event.table.dom;
                    fireObjectResizeStart(editor, rawTable, getPixelWidth(rawTable), getPixelHeight(rawTable), barResizerPrefix + event.type);
                });
                sz.events.afterResize.bind((event) => {
                    const table = event.table;
                    const rawTable = table.dom;
                    removeDataStyle(table);
                    selectionRng.on((rng) => {
                        editor.selection.setRng(rng);
                        editor.focus();
                    });
                    fireObjectResized(editor, rawTable, getPixelWidth(rawTable), getPixelHeight(rawTable), barResizerPrefix + event.type);
                    editor.undoManager.add();
                });
                tableResize.set(sz);
            }
        });
        // If we're updating the table width via the old mechanic, we need to update the constituent cells' widths/heights too.
        editor.on('ObjectResizeStart', (e) => {
            const targetElm = e.target;
            if (isTable(targetElm) && !editor.mode.isReadOnly()) {
                const table = SugarElement.fromDom(targetElm);
                // Add a class based on the resizing mode
                each$2(editor.dom.select('.mce-clonedresizable'), (clone) => {
                    editor.dom.addClass(clone, 'mce-' + getTableColumnResizingBehaviour(editor) + '-columns');
                });
                if (!isPixelSizing(table) && isTablePixelsForced(editor)) {
                    convertToPixelSizeWidth(table);
                }
                else if (!isPercentSizing(table) && isTablePercentagesForced(editor)) {
                    convertToPercentSizeWidth(table);
                }
                // TINY-6601: If resizing using a bar, then snooker will base the resizing on the initial size. So
                // when using a responsive table we need to ensure we convert to a relative table before resizing
                if (isNoneSizing(table) && startsWith(e.origin, barResizerPrefix)) {
                    convertToPercentSizeWidth(table);
                }
                startW = e.width;
                startRawW = isTableResponsiveForced(editor) ? '' : getRawWidth(editor, targetElm).getOr('');
                startH = e.height;
                startRawH = getRawHeight(editor, targetElm).getOr('');
            }
        });
        editor.on('ObjectResized', (e) => {
            const targetElm = e.target;
            if (isTable(targetElm)) {
                const table = SugarElement.fromDom(targetElm);
                // Resize based on the snooker logic to adjust the individual col/rows if resized from a corner
                const origin = e.origin;
                if (isCornerResize(origin)) {
                    afterCornerResize(table, origin, e.width, e.height);
                }
                removeDataStyle(table);
                fireTableModified(editor, table.dom, styleModified);
            }
        });
        const showResizeBars = () => {
            tableResize.on((resize) => {
                resize.on();
                resize.showBars();
            });
        };
        const hideResizeBars = () => {
            tableResize.on((resize) => {
                resize.off();
                resize.hideBars();
            });
        };
        editor.on('DisabledStateChange', (e) => {
            e.state ? hideResizeBars() : showResizeBars();
        });
        editor.on('SwitchMode', () => {
            editor.mode.isReadOnly() ? hideResizeBars() : showResizeBars();
        });
        editor.on('dragstart dragend', (e) => {
            e.type === 'dragstart' ? hideResizeBars() : showResizeBars();
        });
        editor.on('remove', () => {
            destroy();
        });
        const refresh = (table) => {
            tableResize.on((resize) => resize.refreshBars(SugarElement.fromDom(table)));
        };
        const hide = () => {
            tableResize.on((resize) => resize.hideBars());
        };
        const show = () => {
            tableResize.on((resize) => resize.showBars());
        };
        return {
            refresh,
            hide,
            show
        };
    };

    const setupTable = (editor) => {
        register(editor);
        const resizeHandler = TableResizeHandler(editor);
        const cellSelectionHandler = TableCellSelectionHandler(editor, resizeHandler);
        const actions = TableActions(editor, resizeHandler, cellSelectionHandler);
        registerCommands(editor, actions);
        registerQueryCommands(editor, actions);
        // TODO: TINY-8385 Maybe move to core. Although, will need RTC to have that working first
        registerEvents(editor, actions);
        return {
            getSelectedCells: cellSelectionHandler.getSelectedCells,
            clearSelectedCells: cellSelectionHandler.clearSelectedCells
        };
    };

    const DomModel = (editor) => {
        const table = setupTable(editor);
        return {
            table
        };
    };
    var Model = () => {
        global$1.add('dom', DomModel);
    };

    Model();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
