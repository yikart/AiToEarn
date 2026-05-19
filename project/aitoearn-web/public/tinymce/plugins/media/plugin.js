/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$6 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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
    const isObject = isType('object');
    const isArray = isType('array');
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);
    const isFunction = isSimpleType('function');

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
    // Unwound implementing other functions in terms of each.
    // The code size is roughly the same, and it should allow for better optimisation.
    // const each = function<T, U>(xs: T[], f: (x: T, i?: number, xs?: T[]) => void): void {
    const each$1 = (xs, f) => {
        for (let i = 0, len = xs.length; i < len; i++) {
            const x = xs[i];
            f(x, i);
        }
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

    const checkRange = (str, substr, start) => substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
    /** Does 'str' start with 'prefix'?
     *  Note: all strings start with the empty string.
     *        More formally, for all strings x, startsWith(x, "").
     *        This is so that for all strings x and y, startsWith(y + x, y)
     */
    const startsWith = (str, prefix) => {
        return checkRange(str, prefix, 0);
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$2 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('audio_template_callback', {
            processor: 'function'
        });
        registerOption('video_template_callback', {
            processor: 'function'
        });
        registerOption('iframe_template_callback', {
            processor: 'function'
        });
        registerOption('media_live_embeds', {
            processor: 'boolean',
            default: true
        });
        registerOption('media_filter_html', {
            processor: 'boolean',
            default: true
        });
        registerOption('media_url_resolver', {
            processor: 'function'
        });
        registerOption('media_alt_source', {
            processor: 'boolean',
            default: true
        });
        registerOption('media_poster', {
            processor: 'boolean',
            default: true
        });
        registerOption('media_dimensions', {
            processor: 'boolean',
            default: true
        });
    };
    const getAudioTemplateCallback = option('audio_template_callback');
    const getVideoTemplateCallback = option('video_template_callback');
    const getIframeTemplateCallback = option('iframe_template_callback');
    const hasLiveEmbeds = option('media_live_embeds');
    const shouldFilterHtml = option('media_filter_html');
    const getUrlResolver = option('media_url_resolver');
    const hasAltSource = option('media_alt_source');
    const hasPoster = option('media_poster');
    const hasDimensions = option('media_dimensions');

    var global$5 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    var global$4 = tinymce.util.Tools.resolve('tinymce.dom.DOMUtils');

    var global$3 = tinymce.util.Tools.resolve('tinymce.html.DomParser');

    const DOM$1 = global$4.DOM;
    const trimPx = (value) => value.replace(/px$/, '');
    const getEphoxEmbedData = (node) => {
        const style = node.attr('style');
        const styles = style ? DOM$1.parseStyle(style) : {};
        return {
            type: 'ephox-embed-iri',
            source: node.attr('data-ephox-embed-iri'),
            altsource: '',
            poster: '',
            width: get$1(styles, 'max-width').map(trimPx).getOr(''),
            height: get$1(styles, 'max-height').map(trimPx).getOr('')
        };
    };
    const htmlToData = (html, schema) => {
        let data = {};
        const parser = global$3({ validate: false, forced_root_block: false }, schema);
        const rootNode = parser.parse(html);
        for (let node = rootNode; node; node = node.walk()) {
            if (node.type === 1) {
                const name = node.name;
                if (node.attr('data-ephox-embed-iri')) {
                    data = getEphoxEmbedData(node);
                    // Don't continue to collect if we find an EME embed
                    break;
                }
                else {
                    if (!data.source && name === 'param') {
                        data.source = node.attr('movie');
                    }
                    if (name === 'iframe' || name === 'object' || name === 'embed' || name === 'video' || name === 'audio') {
                        if (!data.type) {
                            data.type = name;
                        }
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        data = global$5.extend(node.attributes.map, data);
                    }
                    if (name === 'source') {
                        if (!data.source) {
                            data.source = node.attr('src');
                        }
                        else if (!data.altsource) {
                            data.altsource = node.attr('src');
                        }
                    }
                    if (name === 'img' && !data.poster) {
                        data.poster = node.attr('src');
                    }
                }
            }
        }
        data.source = data.source || data.src || '';
        data.altsource = data.altsource || '';
        data.poster = data.poster || '';
        return data;
    };

    const guess = (url) => {
        const mimes = {
            mp3: 'audio/mpeg',
            m4a: 'audio/x-m4a',
            wav: 'audio/wav',
            mp4: 'video/mp4',
            webm: 'video/webm',
            ogg: 'video/ogg',
            swf: 'application/x-shockwave-flash'
        };
        const fileEnd = url.toLowerCase().split('.').pop() ?? '';
        return get$1(mimes, fileEnd).getOr('');
    };

    var global$2 = tinymce.util.Tools.resolve('tinymce.html.Node');

    var global$1 = tinymce.util.Tools.resolve('tinymce.html.Serializer');

    const Parser = (schema, settings = {}) => global$3({
        forced_root_block: false,
        validate: false,
        allow_conditional_comments: true,
        ...settings
    }, schema);

    const DOM = global$4.DOM;
    const addPx = (value) => /^[0-9.]+$/.test(value) ? (value + 'px') : value;
    const updateEphoxEmbed = (data, node) => {
        const style = node.attr('style');
        const styleMap = style ? DOM.parseStyle(style) : {};
        if (isNonNullable(data.width)) {
            styleMap['max-width'] = addPx(data.width);
        }
        if (isNonNullable(data.height)) {
            styleMap['max-height'] = addPx(data.height);
        }
        node.attr('style', DOM.serializeStyle(styleMap));
    };
    const sources = ['source', 'altsource'];
    const updateHtml = (html, data, updateAll, schema) => {
        let numSources = 0;
        let sourceCount = 0;
        const parser = Parser(schema);
        parser.addNodeFilter('source', (nodes) => numSources = nodes.length);
        const rootNode = parser.parse(html);
        for (let node = rootNode; node; node = node.walk()) {
            if (node.type === 1) {
                const name = node.name;
                if (node.attr('data-ephox-embed-iri')) {
                    updateEphoxEmbed(data, node);
                    // Don't continue to update if we find an EME embed
                    break;
                }
                else {
                    switch (name) {
                        case 'video':
                        case 'object':
                        case 'embed':
                        case 'img':
                        case 'iframe':
                            if (data.height !== undefined && data.width !== undefined) {
                                node.attr('width', data.width);
                                node.attr('height', data.height);
                            }
                            break;
                    }
                    if (updateAll) {
                        switch (name) {
                            case 'video':
                                node.attr('poster', data.poster);
                                node.attr('src', null);
                                // Add <source> child elements
                                for (let index = numSources; index < 2; index++) {
                                    if (data[sources[index]]) {
                                        const source = new global$2('source', 1);
                                        source.attr('src', data[sources[index]]);
                                        source.attr('type', data[sources[index] + 'mime'] || null);
                                        node.append(source);
                                    }
                                }
                                break;
                            case 'iframe':
                                node.attr('src', data.source);
                                break;
                            case 'object':
                                const hasImage = node.getAll('img').length > 0;
                                if (data.poster && !hasImage) {
                                    node.attr('src', data.poster);
                                    const img = new global$2('img', 1);
                                    img.attr('src', data.poster);
                                    img.attr('width', data.width);
                                    img.attr('height', data.height);
                                    node.append(img);
                                }
                                break;
                            case 'source':
                                if (sourceCount < 2) {
                                    node.attr('src', data[sources[sourceCount]]);
                                    node.attr('type', data[sources[sourceCount] + 'mime'] || null);
                                    if (!data[sources[sourceCount]]) {
                                        node.remove();
                                        continue;
                                    }
                                }
                                sourceCount++;
                                break;
                            case 'img':
                                if (!data.poster) {
                                    node.remove();
                                }
                                break;
                        }
                    }
                }
            }
        }
        return global$1({}, schema).serialize(rootNode);
    };

    const urlPatterns = [
        {
            regex: /youtu\.be\/([\w\-_\?&=.]+)/i,
            type: 'iframe', w: 560, h: 314,
            url: 'www.youtube.com/embed/$1',
            allowFullscreen: true
        },
        {
            regex: /youtube\.com(.+)v=([^&]+)(&([a-z0-9&=\-_]+))?/i,
            type: 'iframe', w: 560, h: 314,
            url: 'www.youtube.com/embed/$2?$4',
            allowFullscreen: true
        },
        {
            regex: /youtube.com\/embed\/([a-z0-9\?&=\-_]+)/i,
            type: 'iframe', w: 560, h: 314,
            url: 'www.youtube.com/embed/$1',
            allowFullscreen: true
        },
        {
            regex: /vimeo\.com\/([0-9]+)\?h=(\w+)/,
            type: 'iframe', w: 425, h: 350,
            url: 'player.vimeo.com/video/$1?h=$2&title=0&byline=0&portrait=0&color=8dc7dc',
            allowFullscreen: true
        },
        {
            regex: /vimeo\.com\/(.*)\/([0-9]+)\?h=(\w+)/,
            type: 'iframe', w: 425, h: 350,
            url: 'player.vimeo.com/video/$2?h=$3&title=0&amp;byline=0',
            allowFullscreen: true
        },
        {
            regex: /vimeo\.com\/([0-9]+)/,
            type: 'iframe', w: 425, h: 350,
            url: 'player.vimeo.com/video/$1?title=0&byline=0&portrait=0&color=8dc7dc',
            allowFullscreen: true
        },
        {
            regex: /vimeo\.com\/(.*)\/([0-9]+)/,
            type: 'iframe', w: 425, h: 350,
            url: 'player.vimeo.com/video/$2?title=0&amp;byline=0',
            allowFullscreen: true
        },
        {
            regex: /maps\.google\.([a-z]{2,3})\/maps\/(.+)msid=(.+)/,
            type: 'iframe', w: 425, h: 350,
            url: 'maps.google.com/maps/ms?msid=$2&output=embed"',
            allowFullscreen: false
        },
        {
            regex: /dailymotion\.com\/video\/([^_]+)/,
            type: 'iframe', w: 480, h: 270,
            url: 'www.dailymotion.com/embed/video/$1',
            allowFullscreen: true
        },
        {
            regex: /dai\.ly\/([^_]+)/,
            type: 'iframe', w: 480, h: 270,
            url: 'www.dailymotion.com/embed/video/$1',
            allowFullscreen: true
        }
    ];
    const getProtocol = (url) => {
        const protocolMatches = url.match(/^(https?:\/\/|www\.)(.+)$/i);
        if (protocolMatches && protocolMatches.length > 1) {
            return protocolMatches[1] === 'www.' ? 'https://' : protocolMatches[1];
        }
        else {
            return 'https://';
        }
    };
    const getUrl = (pattern, url) => {
        const protocol = getProtocol(url);
        const match = pattern.regex.exec(url);
        let newUrl = protocol + pattern.url;
        if (isNonNullable(match)) {
            for (let i = 0; i < match.length; i++) {
                newUrl = newUrl.replace('$' + i, () => match[i] ? match[i] : '');
            }
        }
        return newUrl.replace(/\?$/, '');
    };
    const matchPattern = (url) => {
        const patterns = urlPatterns.filter((pattern) => pattern.regex.test(url));
        if (patterns.length > 0) {
            return global$5.extend({}, patterns[0], { url: getUrl(patterns[0], url) });
        }
        else {
            return null;
        }
    };

    const getIframeHtml = (data, iframeTemplateCallback) => {
        if (iframeTemplateCallback) {
            return iframeTemplateCallback(data);
        }
        else {
            const allowFullscreen = data.allowfullscreen ? ' allowFullscreen="1"' : '';
            return '<iframe src="' + data.source + '" width="' + data.width + '" height="' + data.height + '"' + allowFullscreen + '></iframe>';
        }
    };
    const getFlashHtml = (data) => {
        let html = '<object data="' + data.source + '" width="' + data.width + '" height="' + data.height + '" type="application/x-shockwave-flash">';
        if (data.poster) {
            html += '<img src="' + data.poster + '" width="' + data.width + '" height="' + data.height + '" />';
        }
        html += '</object>';
        return html;
    };
    const getAudioHtml = (data, audioTemplateCallback) => {
        if (audioTemplateCallback) {
            return audioTemplateCallback(data);
        }
        else {
            return ('<audio controls="controls" src="' + data.source + '">' +
                (data.altsource ?
                    '\n<source src="' + data.altsource + '"' +
                        (data.altsourcemime ? ' type="' + data.altsourcemime + '"' : '') +
                        ' />\n' : '') +
                '</audio>');
        }
    };
    const getVideoHtml = (data, videoTemplateCallback) => {
        if (videoTemplateCallback) {
            return videoTemplateCallback(data);
        }
        else {
            return ('<video width="' + data.width +
                '" height="' + data.height + '"' +
                (data.poster ? ' poster="' + data.poster + '"' : '') + ' controls="controls">\n' +
                '<source src="' + data.source + '"' +
                (data.sourcemime ? ' type="' + data.sourcemime + '"' : '') + ' />\n' +
                (data.altsource ? '<source src="' + data.altsource + '"' +
                    (data.altsourcemime ? ' type="' + data.altsourcemime + '"' : '') + ' />\n' : '') +
                '</video>');
        }
    };
    const dataToHtml = (editor, dataIn) => {
        const data = global$5.extend({}, dataIn);
        if (!data.source) {
            global$5.extend(data, htmlToData(data.embed ?? '', editor.schema));
            if (!data.source) {
                return '';
            }
        }
        if (!data.altsource) {
            data.altsource = '';
        }
        if (!data.poster) {
            data.poster = '';
        }
        data.source = editor.convertURL(data.source, 'source');
        data.altsource = editor.convertURL(data.altsource, 'source');
        data.sourcemime = guess(data.source);
        data.altsourcemime = guess(data.altsource);
        data.poster = editor.convertURL(data.poster, 'poster');
        const pattern = matchPattern(data.source);
        if (pattern) {
            data.source = pattern.url;
            data.type = pattern.type;
            data.allowfullscreen = pattern.allowFullscreen;
            data.width = data.width || String(pattern.w);
            data.height = data.height || String(pattern.h);
        }
        if (data.embed) {
            return updateHtml(data.embed, data, true, editor.schema);
        }
        else {
            const audioTemplateCallback = getAudioTemplateCallback(editor);
            const videoTemplateCallback = getVideoTemplateCallback(editor);
            const iframeTemplateCallback = getIframeTemplateCallback(editor);
            data.width = data.width || '300';
            data.height = data.height || '150';
            global$5.each(data, (value, key) => {
                data[key] = editor.dom.encode('' + value);
            });
            if (data.type === 'iframe') {
                return getIframeHtml(data, iframeTemplateCallback);
            }
            else if (data.sourcemime === 'application/x-shockwave-flash') {
                return getFlashHtml(data);
            }
            else if (data.sourcemime.indexOf('audio') !== -1) {
                return getAudioHtml(data, audioTemplateCallback);
            }
            else {
                return getVideoHtml(data, videoTemplateCallback);
            }
        }
    };

    const isMediaElement = (element) => element.hasAttribute('data-mce-object') || element.hasAttribute('data-ephox-embed-iri');
    const setup$2 = (editor) => {
        // TINY-10774: On Safari all events bubble out even if you click on the video play button on other browsers the video element doesn't bubble the event
        editor.on('mousedown', (e) => {
            const previewObj = editor.dom.getParent(e.target, '.mce-preview-object');
            if (previewObj && editor.dom.getAttrib(previewObj, 'data-mce-selected') === '2') {
                e.stopImmediatePropagation();
            }
        });
        editor.on('click keyup touchend', () => {
            const selectedNode = editor.selection.getNode();
            if (selectedNode && editor.dom.hasClass(selectedNode, 'mce-preview-object')) {
                if (editor.dom.getAttrib(selectedNode, 'data-mce-selected')) {
                    selectedNode.setAttribute('data-mce-selected', '2');
                }
            }
        });
        editor.on('ObjectResized', (e) => {
            const target = e.target;
            if (target.getAttribute('data-mce-object')) {
                let html = target.getAttribute('data-mce-html');
                if (html) {
                    html = unescape(html);
                    target.setAttribute('data-mce-html', escape(updateHtml(html, {
                        width: String(e.width),
                        height: String(e.height)
                    }, false, editor.schema)));
                }
            }
        });
    };

    const cache = {};
    const embedPromise = (data, dataToHtml, handler) => {
        return new Promise((res, rej) => {
            const wrappedResolve = (response) => {
                if (response.html) {
                    cache[data.source] = response;
                }
                return res({
                    url: data.source,
                    html: response.html ? response.html : dataToHtml(data)
                });
            };
            if (cache[data.source]) {
                wrappedResolve(cache[data.source]);
            }
            else {
                handler({ url: data.source }).then(wrappedResolve).catch(rej);
            }
        });
    };
    const defaultPromise = (data, dataToHtml) => Promise.resolve({ html: dataToHtml(data), url: data.source });
    const loadedData = (editor) => (data) => dataToHtml(editor, data);
    const getEmbedHtml = (editor, data) => {
        const embedHandler = getUrlResolver(editor);
        return embedHandler ? embedPromise(data, loadedData(editor), embedHandler) : defaultPromise(data, loadedData(editor));
    };
    const isCached = (url) => has(cache, url);

    const extractMeta = (sourceInput, data) => get$1(data, sourceInput).bind((mainData) => get$1(mainData, 'meta'));
    const getValue = (data, metaData, sourceInput) => (prop) => {
        // Cases:
        // 1. Get the nested value prop (component is the executed urlinput)
        // 2. Get from metadata (a urlinput was executed but urlinput != this component)
        // 3. Not a urlinput so just get string
        // If prop === sourceInput do 1, 2 then 3, else do 2 then 1 or 3
        // ASSUMPTION: we only want to get values for props that already exist in data
        const getFromData = () => get$1(data, prop);
        const getFromMetaData = () => get$1(metaData, prop);
        const getNonEmptyValue = (c) => get$1(c, 'value').bind((v) => v.length > 0 ? Optional.some(v) : Optional.none());
        const getFromValueFirst = () => getFromData().bind((child) => isObject(child)
            ? getNonEmptyValue(child).orThunk(getFromMetaData)
            : getFromMetaData().orThunk(() => Optional.from(child)));
        const getFromMetaFirst = () => getFromMetaData().orThunk(() => getFromData().bind((child) => isObject(child)
            ? getNonEmptyValue(child)
            : Optional.from(child)));
        return { [prop]: (prop === sourceInput ? getFromValueFirst() : getFromMetaFirst()).getOr('') };
    };
    const getDimensions = (data, metaData) => {
        const dimensions = {};
        get$1(data, 'dimensions').each((dims) => {
            each$1(['width', 'height'], (prop) => {
                get$1(metaData, prop).orThunk(() => get$1(dims, prop)).each((value) => dimensions[prop] = value);
            });
        });
        return dimensions;
    };
    const unwrap = (data, sourceInput) => {
        const metaData = sourceInput && sourceInput !== 'dimensions' ? extractMeta(sourceInput, data).getOr({}) : {};
        const get = getValue(data, metaData, sourceInput);
        return {
            ...get('source'),
            ...get('altsource'),
            ...get('poster'),
            ...get('embed'),
            ...getDimensions(data, metaData)
        };
    };
    const wrap = (data) => {
        const wrapped = {
            ...data,
            source: { value: get$1(data, 'source').getOr('') },
            altsource: { value: get$1(data, 'altsource').getOr('') },
            poster: { value: get$1(data, 'poster').getOr('') }
        };
        // Add additional size values that may or may not have been in the html
        each$1(['width', 'height'], (prop) => {
            get$1(data, prop).each((value) => {
                const dimensions = wrapped.dimensions || {};
                dimensions[prop] = value;
                wrapped.dimensions = dimensions;
            });
        });
        return wrapped;
    };
    const handleError = (editor) => (error) => {
        const errorMessage = error && error.msg ?
            'Media embed handler error: ' + error.msg :
            'Media embed handler threw unknown error.';
        editor.notificationManager.open({ type: 'error', text: errorMessage });
    };
    const getEditorData = (editor) => {
        const element = editor.selection.getNode();
        const snippet = isMediaElement(element) ? editor.serializer.serialize(element, { selection: true }) : '';
        const data = htmlToData(snippet, editor.schema);
        const getDimensionsOfElement = () => {
            if (isEmbedIframe(data.source, data.type)) {
                const rect = editor.dom.getRect(element);
                return {
                    width: rect.w.toString().replace(/px$/, ''),
                    height: rect.h.toString().replace(/px$/, ''),
                };
            }
            else {
                return {};
            }
        };
        const dimensions = getDimensionsOfElement();
        return {
            embed: snippet,
            ...data,
            ...dimensions
        };
    };
    const addEmbedHtml = (api, editor) => (response) => {
        // Only set values if a URL has been defined
        if (isString(response.url) && response.url.trim().length > 0) {
            const html = response.html;
            const snippetData = htmlToData(html, editor.schema);
            const nuData = {
                ...snippetData,
                source: response.url,
                embed: html
            };
            api.setData(wrap(nuData));
        }
    };
    const selectPlaceholder = (editor, beforeObjects) => {
        const afterObjects = editor.dom.select('*[data-mce-object]');
        // Find new image placeholder so we can select it
        for (let i = 0; i < beforeObjects.length; i++) {
            for (let y = afterObjects.length - 1; y >= 0; y--) {
                if (beforeObjects[i] === afterObjects[y]) {
                    afterObjects.splice(y, 1);
                }
            }
        }
        editor.selection.select(afterObjects[0]);
    };
    const handleInsert = (editor, html) => {
        const beforeObjects = editor.dom.select('*[data-mce-object]');
        editor.insertContent(html);
        selectPlaceholder(editor, beforeObjects);
        editor.nodeChanged();
    };
    const isEmbedIframe = (url, mediaDataType) => isNonNullable(mediaDataType) && mediaDataType === 'ephox-embed-iri' && isNonNullable(matchPattern(url));
    const shouldInsertAsNewIframe = (prevData, newData) => {
        const hasDimensionsChanged = (prevData, newData) => prevData.width !== newData.width || prevData.height !== newData.height;
        return hasDimensionsChanged(prevData, newData) && isEmbedIframe(newData.source, prevData.type);
    };
    const submitForm = (prevData, newData, editor) => {
        newData.embed =
            shouldInsertAsNewIframe(prevData, newData) && hasDimensions(editor)
                ? dataToHtml(editor, { ...newData, embed: '' })
                : updateHtml(newData.embed ?? '', newData, false, editor.schema);
        // Only fetch the embed HTML content if the URL has changed from what it previously was
        if (newData.embed && (prevData.source === newData.source || isCached(newData.source))) {
            handleInsert(editor, newData.embed);
        }
        else {
            getEmbedHtml(editor, newData)
                .then((response) => {
                handleInsert(editor, response.html);
            }).catch(handleError(editor));
        }
    };
    const showDialog = (editor) => {
        const editorData = getEditorData(editor);
        const currentData = Cell(editorData);
        const initialData = wrap(editorData);
        const handleSource = (prevData, api) => {
            const serviceData = unwrap(api.getData(), 'source');
            // If a new URL is entered, then clear the embed html and fetch the new data
            if (prevData.source !== serviceData.source) {
                addEmbedHtml(win, editor)({ url: serviceData.source, html: '' });
                getEmbedHtml(editor, serviceData)
                    .then(addEmbedHtml(win, editor))
                    .catch(handleError(editor));
            }
        };
        const handleEmbed = (api) => {
            const data = unwrap(api.getData());
            const dataFromEmbed = htmlToData(data.embed ?? '', editor.schema);
            api.setData(wrap(dataFromEmbed));
        };
        const handleUpdate = (api, sourceInput, prevData) => {
            const dialogData = unwrap(api.getData(), sourceInput);
            const data = shouldInsertAsNewIframe(prevData, dialogData) && hasDimensions(editor)
                ? { ...dialogData, embed: '' }
                : dialogData;
            const embed = dataToHtml(editor, data);
            api.setData(wrap({
                ...data,
                embed
            }));
        };
        const mediaInput = [{
                name: 'source',
                type: 'urlinput',
                filetype: 'media',
                label: 'Source',
                picker_text: 'Browse files'
            }];
        const sizeInput = !hasDimensions(editor) ? [] : [{
                type: 'sizeinput',
                name: 'dimensions',
                label: 'Constrain proportions',
                constrain: true
            }];
        const generalTab = {
            title: 'General',
            name: 'general',
            items: flatten([mediaInput, sizeInput])
        };
        const embedTextarea = {
            type: 'textarea',
            name: 'embed',
            label: 'Paste your embed code below:'
        };
        const embedTab = {
            title: 'Embed',
            items: [
                embedTextarea
            ]
        };
        const advancedFormItems = [];
        if (hasAltSource(editor)) {
            advancedFormItems.push({
                name: 'altsource',
                type: 'urlinput',
                filetype: 'media',
                label: 'Alternative source URL'
            });
        }
        if (hasPoster(editor)) {
            advancedFormItems.push({
                name: 'poster',
                type: 'urlinput',
                filetype: 'image',
                label: 'Media poster (Image URL)'
            });
        }
        const advancedTab = {
            title: 'Advanced',
            name: 'advanced',
            items: advancedFormItems
        };
        const tabs = [
            generalTab,
            embedTab
        ];
        if (advancedFormItems.length > 0) {
            tabs.push(advancedTab);
        }
        const body = {
            type: 'tabpanel',
            tabs
        };
        const win = editor.windowManager.open({
            title: 'Insert/Edit Media',
            size: 'normal',
            body,
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
                const serviceData = unwrap(api.getData());
                submitForm(currentData.get(), serviceData, editor);
                api.close();
            },
            onChange: (api, detail) => {
                switch (detail.name) {
                    case 'source':
                        handleSource(currentData.get(), api);
                        break;
                    case 'embed':
                        handleEmbed(api);
                        break;
                    case 'dimensions':
                    case 'altsource':
                    case 'poster':
                        handleUpdate(api, detail.name, currentData.get());
                        break;
                }
                currentData.set(unwrap(api.getData()));
            },
            initialData
        });
    };

    const get = (editor) => {
        const showDialog$1 = () => {
            showDialog(editor);
        };
        return {
            showDialog: showDialog$1
        };
    };

    const register$1 = (editor) => {
        const showDialog$1 = () => {
            showDialog(editor);
        };
        editor.addCommand('mceMedia', showDialog$1);
    };

    var global = tinymce.util.Tools.resolve('tinymce.Env');

    const isLiveEmbedNode = (node) => {
        const name = node.name;
        return name === 'iframe' || name === 'video' || name === 'audio';
    };
    const getDimension = (node, styles, dimension, defaultValue = null) => {
        const value = node.attr(dimension);
        if (isNonNullable(value)) {
            return value;
        }
        else if (!has(styles, dimension)) {
            return defaultValue;
        }
        else {
            return null;
        }
    };
    const setDimensions = (node, previewNode, styles) => {
        // Apply dimensions for video elements to maintain legacy behaviour
        const useDefaults = previewNode.name === 'img' || node.name === 'video';
        // Determine the defaults
        const defaultWidth = useDefaults ? '300' : null;
        const fallbackHeight = node.name === 'audio' ? '30' : '150';
        const defaultHeight = useDefaults ? fallbackHeight : null;
        previewNode.attr({
            width: getDimension(node, styles, 'width', defaultWidth),
            height: getDimension(node, styles, 'height', defaultHeight)
        });
    };
    const appendNodeContent = (editor, nodeName, previewNode, html) => {
        const newNode = Parser(editor.schema).parse(html, { context: nodeName });
        while (newNode.firstChild) {
            previewNode.append(newNode.firstChild);
        }
    };
    const createPlaceholderNode = (editor, node) => {
        const name = node.name;
        const placeHolder = new global$2('img', 1);
        retainAttributesAndInnerHtml(editor, node, placeHolder);
        setDimensions(node, placeHolder, {});
        placeHolder.attr({
            'style': node.attr('style'),
            'src': global.transparentSrc,
            'data-mce-object': name,
            'class': 'mce-object mce-object-' + name
        });
        return placeHolder;
    };
    const createPreviewNode = (editor, node) => {
        const name = node.name;
        const previewWrapper = new global$2('span', 1);
        previewWrapper.attr({
            'contentEditable': 'false',
            'style': node.attr('style'),
            'data-mce-object': name,
            'class': 'mce-preview-object mce-object-' + name
        });
        retainAttributesAndInnerHtml(editor, node, previewWrapper);
        const styles = editor.dom.parseStyle(node.attr('style') ?? '');
        const previewNode = new global$2(name, 1);
        setDimensions(node, previewNode, styles);
        previewNode.attr({
            src: node.attr('src'),
            style: node.attr('style'),
            class: node.attr('class')
        });
        if (name === 'iframe') {
            previewNode.attr({
                allowfullscreen: node.attr('allowfullscreen'),
                frameborder: '0',
                sandbox: node.attr('sandbox'),
                referrerpolicy: node.attr('referrerpolicy')
            });
        }
        else {
            // Exclude autoplay as we don't want video/audio to play by default
            const attrs = ['controls', 'crossorigin', 'currentTime', 'loop', 'muted', 'poster', 'preload'];
            each$1(attrs, (attrName) => {
                previewNode.attr(attrName, node.attr(attrName));
            });
            // Recreate the child nodes using the sanitized inner HTML
            const sanitizedHtml = previewWrapper.attr('data-mce-html');
            if (isNonNullable(sanitizedHtml)) {
                appendNodeContent(editor, name, previewNode, unescape(sanitizedHtml));
            }
        }
        const shimNode = new global$2('span', 1);
        shimNode.attr('class', 'mce-shim');
        previewWrapper.append(previewNode);
        previewWrapper.append(shimNode);
        return previewWrapper;
    };
    const retainAttributesAndInnerHtml = (editor, sourceNode, targetNode) => {
        // Prefix all attributes except internal (data-mce-*), width, height and style since we
        // will add these to the placeholder
        const attribs = sourceNode.attributes ?? [];
        let ai = attribs.length;
        while (ai--) {
            const attrName = attribs[ai].name;
            let attrValue = attribs[ai].value;
            if (attrName !== 'width' && attrName !== 'height' && attrName !== 'style' && !startsWith(attrName, 'data-mce-')) {
                if (attrName === 'data' || attrName === 'src') {
                    attrValue = editor.convertURL(attrValue, attrName);
                }
                targetNode.attr('data-mce-p-' + attrName, attrValue);
            }
        }
        // Place the inner HTML contents inside an escaped attribute
        // This enables us to copy/paste the fake object
        const serializer = global$1({ inner: true }, editor.schema);
        const tempNode = new global$2('div', 1);
        each$1(sourceNode.children(), (child) => tempNode.append(child));
        const innerHtml = serializer.serialize(tempNode);
        if (innerHtml) {
            targetNode.attr('data-mce-html', escape(innerHtml));
            targetNode.empty();
        }
    };
    const isPageEmbedWrapper = (node) => {
        const nodeClass = node.attr('class');
        return isString(nodeClass) && /\btiny-pageembed\b/.test(nodeClass);
    };
    const isWithinEmbedWrapper = (node) => {
        let tempNode = node;
        while ((tempNode = tempNode.parent)) {
            if (tempNode.attr('data-ephox-embed-iri') || isPageEmbedWrapper(tempNode)) {
                return true;
            }
        }
        return false;
    };
    const placeHolderConverter = (editor) => (nodes) => {
        let i = nodes.length;
        let node;
        while (i--) {
            node = nodes[i];
            if (!node.parent) {
                continue;
            }
            if (node.parent.attr('data-mce-object')) {
                continue;
            }
            if (isLiveEmbedNode(node) && hasLiveEmbeds(editor)) {
                if (!isWithinEmbedWrapper(node)) {
                    node.replace(createPreviewNode(editor, node));
                }
            }
            else {
                if (!isWithinEmbedWrapper(node)) {
                    node.replace(createPlaceholderNode(editor, node));
                }
            }
        }
    };

    const parseAndSanitize = (editor, context, html) => {
        const getEditorOption = editor.options.get;
        const sanitize = getEditorOption('xss_sanitization');
        const validate = shouldFilterHtml(editor);
        return Parser(editor.schema, { sanitize, validate }).parse(html, { context });
    };

    const setup$1 = (editor) => {
        editor.on('PreInit', () => {
            const { schema, serializer, parser } = editor;
            // Set browser specific allowFullscreen attribs as boolean
            const boolAttrs = schema.getBoolAttrs();
            each$1('webkitallowfullscreen mozallowfullscreen'.split(' '), (name) => {
                boolAttrs[name] = {};
            });
            // Add some non-standard attributes to the schema
            each({
                embed: ['wmode']
            }, (attrs, name) => {
                const rule = schema.getElementRule(name);
                if (rule) {
                    each$1(attrs, (attr) => {
                        rule.attributes[attr] = {};
                        rule.attributesOrder.push(attr);
                    });
                }
            });
            // Converts iframe, video etc into placeholder images
            parser.addNodeFilter('iframe,video,audio,object,embed', placeHolderConverter(editor));
            // Replaces placeholder images with real elements for video, object, iframe etc
            serializer.addAttributeFilter('data-mce-object', (nodes, name) => {
                let i = nodes.length;
                while (i--) {
                    const node = nodes[i];
                    if (!node.parent) {
                        continue;
                    }
                    const realElmName = node.attr(name);
                    const realElm = new global$2(realElmName, 1);
                    // Add width/height to everything but audio
                    if (realElmName !== 'audio') {
                        const className = node.attr('class');
                        if (className && className.indexOf('mce-preview-object') !== -1 && node.firstChild) {
                            realElm.attr({
                                width: node.firstChild.attr('width'),
                                height: node.firstChild.attr('height')
                            });
                        }
                        else {
                            realElm.attr({
                                width: node.attr('width'),
                                height: node.attr('height')
                            });
                        }
                    }
                    realElm.attr({
                        style: node.attr('style')
                    });
                    // Unprefix all placeholder attributes
                    const attribs = node.attributes ?? [];
                    let ai = attribs.length;
                    while (ai--) {
                        const attrName = attribs[ai].name;
                        if (attrName.indexOf('data-mce-p-') === 0) {
                            realElm.attr(attrName.substr(11), attribs[ai].value);
                        }
                    }
                    // Inject innerhtml
                    const innerHtml = node.attr('data-mce-html');
                    if (innerHtml) {
                        const fragment = parseAndSanitize(editor, realElmName, unescape(innerHtml));
                        each$1(fragment.children(), (child) => realElm.append(child));
                    }
                    node.replace(realElm);
                }
            });
        });
        editor.on('SetContent', () => {
            // TODO: This shouldn't be needed there should be a way to mark bogus
            // elements so they are never removed except external save
            const dom = editor.dom;
            each$1(dom.select('span.mce-preview-object'), (elm) => {
                if (dom.select('span.mce-shim', elm).length === 0) {
                    dom.add(elm, 'span', { class: 'mce-shim' });
                }
            });
        });
    };

    const setup = (editor) => {
        editor.on('ResolveName', (e) => {
            let name;
            if (e.target.nodeType === 1 && (name = e.target.getAttribute('data-mce-object'))) {
                e.name = name;
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
        const onAction = () => editor.execCommand('mceMedia');
        editor.ui.registry.addToggleButton('media', {
            tooltip: 'Insert/edit media',
            icon: 'embed',
            onAction,
            onSetup: (buttonApi) => {
                const selection = editor.selection;
                buttonApi.setActive(isMediaElement(selection.getNode()));
                const unbindSelectorChanged = selection.selectorChangedWithUnbind('img[data-mce-object],span[data-mce-object],div[data-ephox-embed-iri]', buttonApi.setActive).unbind;
                const unbindEditable = onSetupEditable(editor)(buttonApi);
                return () => {
                    unbindSelectorChanged();
                    unbindEditable();
                };
            }
        });
        editor.ui.registry.addMenuItem('media', {
            icon: 'embed',
            text: 'Media...',
            onAction,
            onSetup: onSetupEditable(editor)
        });
    };

    var Plugin = () => {
        global$6.add('media', (editor) => {
            register$2(editor);
            register$1(editor);
            register(editor);
            setup(editor);
            setup$1(editor);
            setup$2(editor);
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
