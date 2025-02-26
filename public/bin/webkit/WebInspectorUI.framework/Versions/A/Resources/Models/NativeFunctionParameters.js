/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

// FIXME: Provide Parameter lists for the constructors themselves? (new RegExp(...)).
// FIXME: Provide Parameter lists for global functions (eval, decodeURI, ...).

WI.NativeConstructorFunctionParameters = {
    Object: {
        assign: "target, ...sources",
        create: "prototype, [propertiesObject]",
        defineProperties: "object, properties",
        defineProperty: "object, propertyName, descriptor",
        freeze: "object",
        getOwnPropertyDescriptor: "object, propertyName",
        getOwnPropertyNames: "object",
        getOwnPropertySymbols: "object",
        getPrototypeOf: "object",
        is: "value1, value2",
        isExtensible: "object",
        isFrozen: "object",
        isSealed: "object",
        keys: "object",
        preventExtensions: "object",
        seal: "object",
        setPrototypeOf: "object, prototype",
        __proto__: null,
    },

    Array: {
        from: "arrayLike, [mapFunction], [thisArg]",
        isArray: "object",
        of: "[...values]",
        __proto__: null,
    },

    ArrayBuffer: {
        isView: "object",
        transfer: "oldBuffer, [newByteLength=length]",
        __proto__: null,
    },

    Number: {
        isFinite: "value",
        isInteger: "value",
        isNaN: "value",
        isSafeInteger: "value",
        parseFloat: "string",
        parseInt: "string, [radix]",
        __proto__: null,
    },

    Math: {
        abs: "x",
        acos: "x",
        acosh: "x",
        asin: "x",
        asinh: "x",
        atan2: "y, x",
        atan: "x",
        atanh: "x",
        cbrt: "x",
        ceil: "x",
        clz32: "x",
        cos: "x",
        cosh: "x",
        exp: "x",
        expm1: "x",
        floor: "x",
        fround: "x",
        hypot: "[...x]",
        imul: "x",
        log: "x",
        log1p: "x",
        log2: "x",
        log10: "x",
        max: "[...x]",
        min: "[...x]",
        pow: "x, y",
        round: "x",
        sign: "x",
        sin: "x",
        sinh: "x",
        sqrt: "x",
        tan: "x",
        tanh: "x",
        trunc: "x",
        __proto__: null,
    },

    JSON: {
        parse: "text, [reviver]",
        stringify: "value, [replacer], [space]",
        __proto__: null,
    },

    Date: {
        parse: "dateString",
        UTC: "year, [month], [day], [hour], [minute], [second], [ms]",
        __proto__: null,
    },

    Promise: {
        all: "iterable",
        race: "iterable",
        reject: "reason",
        resolve: "value",
        __proto__: null,
    },

    Reflect: {
        apply: "target, thisArgument, argumentsList",
        construct: "target, argumentsList, [newTarget=target]",
        defineProperty: "target, propertyKey, attributes",
        deleteProperty: "target, propertyKey",
        get: "target, propertyKey, [receiver]",
        getOwnPropertyDescriptor: "target, propertyKey",
        getPrototypeOf: "target",
        has: "target, propertyKey",
        isExtensible: "target",
        ownKeys: "target",
        preventExtensions: "target",
        set: "target, propertyKey, value, [receiver]",
        setPrototypeOf: "target, prototype",
        __proto__: null,
    },

    String: {
        fromCharCode: "...codeUnits",
        fromCodePoint: "...codePoints",
        raw: "template, ...substitutions",
        __proto__: null,
    },

    Symbol: {
        for: "key",
        keyFor: "symbol",
        __proto__: null,
    },

    Console: {
        assert: "condition, [message], [...values]",
        count: "label = \"default\"",
        countReset: "label = \"default\"",
        debug: "message, [...values]",
        dir: "object",
        dirxml: "object",
        error: "message, [...values]",
        group: "[name]",
        groupCollapsed: "[name]",
        groupEnd: "[name]",
        info: "message, [...values]",
        log: "message, [...values]",
        profile: "name",
        profileEnd: "name",
        record: "object, [options]",
        recordEnd: "object",
        screenshot: "[node]",
        table: "data, [columns]",
        takeHeapSnapshot: "[label]",
        time: "label = \"default\"",
        timeLog: "label = \"default\"",
        timeEnd: "label = \"default\"",
        timeStamp: "[label]",
        trace: "message, [...values]",
        warn: "message, [...values]",
        __proto__: null,
    },

    // Autogenerated DOM Interface static methods.

    IDBKeyRangeConstructor: {
        bound: "lower, upper, [lowerOpen], [upperOpen]",
        lowerBound: "lower, [open]",
        only: "value",
        upperBound: "upper, [open]",
        __proto__: null,
    },

    MediaSourceConstructor: {
        isTypeSupported: "type",
        __proto__: null,
    },

    MediaStreamTrackConstructor: {
        getSources: "callback",
        __proto__: null,
    },

    NotificationConstructor: {
        requestPermission: "[callback]",
        __proto__: null,
    },

    URLConstructor: {
        createObjectURL: "blob",
        revokeObjectURL: "url",
        __proto__: null,
    },

    WebKitMediaKeysConstructor: {
        isTypeSupported: "keySystem, [type]",
        __proto__: null,
    },
};

WI.NativePrototypeFunctionParameters = {

    // Built-in JavaScript objects.
    // FIXME: TypedArrays (Int8Array, etc),

    Object: {
        __defineGetter__: "propertyName, getterFunction",
        __defineSetter__: "propertyName, setterFunction",
        __lookupGetter__: "propertyName",
        __lookupSetter__: "propertyName",
        hasOwnProperty: "propertyName",
        isPrototypeOf: "property",
        propertyIsEnumerable: "propertyName",
        __proto__: null,
    },

    Array: {
        concat: "value, ...",
        copyWithin: "targetIndex, startIndex, [endIndex=length]",
        every: "callback, [thisArg]",
        fill: "value, [startIndex=0], [endIndex=length]",
        filter: "callback, [thisArg]",
        find: "callback, [thisArg]",
        findIndex: "callback, [thisArg]",
        findLast: "callback, [thisArg]",
        findLastIndex: "callback, [thisArg]",
        forEach: "callback, [thisArg]",
        includes: "searchValue, [startIndex=0]",
        indexOf: "searchValue, [startIndex=0]",
        join: "[separator=\",\"]",
        lastIndexOf: "searchValue, [startIndex=length]",
        map: "callback, [thisArg]",
        push: "value, ...",
        reduce: "callback, [initialValue]",
        reduceRight: "callback, [initialValue]",
        slice: "[startIndex=0], [endIndex=length]",
        some: "callback, [thisArg]",
        sort: "[compareFunction]",
        splice: "startIndex, [deleteCount=0], ...itemsToAdd",
        __proto__: null,
    },

    ArrayBuffer: {
        slice: "startIndex, [endIndex=byteLength]",
        __proto__: null,
    },

    DataView: {
        setInt8: "byteOffset, value",
        setInt16: "byteOffset, value, [littleEndian=false]",
        setInt23: "byteOffset, value, [littleEndian=false]",
        setUint8: "byteOffset, value",
        setUint16: "byteOffset, value, [littleEndian=false]",
        setUint32: "byteOffset, value, [littleEndian=false]",
        setFloat32: "byteOffset, value, [littleEndian=false]",
        setFloat64: "byteOffset, value, [littleEndian=false]",
        getInt8: "byteOffset",
        getInt16: "byteOffset, [littleEndian=false]",
        getInt23: "byteOffset, [littleEndian=false]",
        getUint8: "byteOffset",
        getUint16: "byteOffset, [littleEndian=false]",
        getUint32: "byteOffset, [littleEndian=false]",
        getFloat32: "byteOffset, [littleEndian=false]",
        getFloat64: "byteOffset, [littleEndian=false]",
        __proto__: null,
    },

    Date: {
        setDate: "day",
        setFullYear: "year, [month=getMonth()], [day=getDate()]",
        setHours: "hours, [minutes=getMinutes()], [seconds=getSeconds()], [ms=getMilliseconds()]",
        setMilliseconds: "ms",
        setMinutes: "minutes, [seconds=getSeconds()], [ms=getMilliseconds()]",
        setMonth: "month, [day=getDate()]",
        setSeconds: "seconds, [ms=getMilliseconds()]",
        setTime: "time",
        setUTCDate: "day",
        setUTCFullYear: "year, [month=getUTCMonth()], [day=getUTCDate()]",
        setUTCHours: "hours, [minutes=getUTCMinutes()], [seconds=getUTCSeconds()], [ms=getUTCMilliseconds()]",
        setUTCMilliseconds: "ms",
        setUTCMinutes: "minutes, [seconds=getUTCSeconds()], [ms=getUTCMilliseconds()]",
        setUTCMonth: "month, [day=getUTCDate()]",
        setUTCSeconds: "seconds, [ms=getUTCMilliseconds()]",
        setUTCTime: "time",
        setYear: "year",
        __proto__: null,
    },

    Function: {
        apply: "thisObject, [argumentsArray]",
        bind: "thisObject, ...arguments",
        call: "thisObject, ...arguments",
        __proto__: null,
    },

    Map: {
        delete: "key",
        forEach: "callback, [thisArg]",
        get: "key",
        has: "key",
        set: "key, value",
        __proto__: null,
    },

    Number: {
        toExponential: "[digits]",
        toFixed: "[digits]",
        toPrecision: "[significantDigits]",
        toString: "[radix=10]",
        __proto__: null,
    },

    RegExp: {
        compile: "pattern, flags",
        exec: "string",
        test: "string",
        __proto__: null,
    },

    Set: {
        delete: "value",
        forEach: "callback, [thisArg]",
        has: "value",
        add: "value",
        __proto__: null,
    },

    String: {
        charAt: "index",
        charCodeAt: "index",
        codePoints: "index",
        concat: "string, ...",
        includes: "searchValue, [startIndex=0]",
        indexOf: "searchValue, [startIndex=0]",
        lastIndexOf: "searchValue, [startIndex=length]",
        localeCompare: "string",
        match: "regex",
        repeat: "count",
        replace: "regex|string, replaceString|replaceHandler, [flags]",
        search: "regex",
        slice: "startIndex, [endIndex=length]",
        split: "[separator], [limit]",
        substr: "startIndex, [numberOfCharacters]",
        substring: "startIndex, [endIndex=length]",
        __proto__: null,
    },

    WeakMap: {
        delete: "key",
        get: "key",
        has: "key",
        set: "key, value",
        __proto__: null,
    },

    WeakSet: {
        delete: "value",
        has: "value",
        add: "value",
        __proto__: null,
    },

    Promise: {
        catch: "rejectionHandler",
        then: "resolvedHandler, rejectionHandler",
        __proto__: null,
    },

    Generator: {
        next: "value",
        return: "value",
        throw: "exception",
        __proto__: null,
    },

    // Curated DOM Interfaces.

    Element: {
        closest: "selectors",
        getAttribute: "attributeName",
        getAttributeNS: "namespace, attributeName",
        getAttributeNode: "attributeName",
        getAttributeNodeNS: "namespace, attributeName",
        hasAttribute: "attributeName",
        hasAttributeNS: "namespace, attributeName",
        matches: "selector",
        removeAttribute: "attributeName",
        removeAttributeNS: "namespace, attributeName",
        removeAttributeNode: "attributeName",
        scrollIntoView: "[alignWithTop]",
        scrollIntoViewIfNeeded: "[centerIfNeeded]",
        setAttribute: "name, value",
        setAttributeNS: "namespace, name, value",
        setAttributeNode: "attributeNode",
        setAttributeNodeNS: "namespace, attributeNode",
        webkitMatchesSelector: "selectors",
        __proto__: null,
    },

    Node: {
        appendChild: "child",
        cloneNode: "[deep]",
        compareDocumentPosition: "[node]",
        contains: "[node]",
        insertBefore: "insertElement, referenceElement",
        isDefaultNamespace: "[namespace]",
        isEqualNode: "[node]",
        lookupNamespaceURI: "prefix",
        removeChild: "node",
        replaceChild: "newChild, oldChild",
        __proto__: null,
    },

    Window: {
        alert: "[message]",
        atob: "encodedData",
        btoa: "stringToEncode",
        cancelAnimationFrame: "id",
        clearInterval: "intervalId",
        clearTimeout: "timeoutId",
        confirm: "[message]",
        find: "string, [caseSensitive], [backwards], [wrapAround]",
        getComputedStyle: "[element], [pseudoElement]",
        getMatchedCSSRules: "[element], [pseudoElement]",
        matchMedia: "mediaQueryString",
        moveBy: "[deltaX], [deltaY]",
        moveTo: "[screenX], [screenY]",
        open: "url, windowName, [featuresString]",
        openDatabase: "name, version, displayName, estimatedSize, [creationCallback]",
        postMessage: "message, targetOrigin, [...transferables]",
        prompt: "[message], [value]",
        requestAnimationFrame: "callback",
        resizeBy: "[deltaX], [deltaY]",
        resizeTo: "[width], [height]",
        scrollBy: "[deltaX], [deltaY]",
        scrollTo: "[x], [y]",
        setInterval: "func, [delay], [...params]",
        setTimeout: "func, [delay], [...params]",
        showModalDialog: "url, [arguments], [options]",
        __proto__: null,
    },

    Document: {
        adoptNode: "[node]",
        caretRangeFromPoint: "[x], [y]",
        createAttribute: "attributeName",
        createAttributeNS: "namespace, qualifiedName",
        createCDATASection: "data",
        createComment: "data",
        createElement: "tagName",
        createElementNS: "namespace, qualifiedName",
        createEntityReference: "name",
        createEvent: "type",
        createExpression: "xpath, resolver",
        createNSResolver: "node",
        createNodeIterator: "root, whatToShow, filter",
        createProcessingInstruction: "target, data",
        createTextNode: "data",
        createTreeWalker: "root, whatToShow, filter, entityReferenceExpansion",
        elementFromPoint: "x, y",
        evaluate: "xpath, contextNode, namespaceResolver, resultType, result",
        execCommand: "command, userInterface, value",
        getCSSCanvasContext: "contextId, name, width, height",
        getElementById: "id",
        getElementsByName: "name",
        importNode: "node, deep",
        queryCommandEnabled: "command",
        queryCommandIndeterm: "command",
        queryCommandState: "command",
        queryCommandSupported: "command",
        queryCommandValue: "command",
        __proto__: null,
    },

    // Autogenerated DOM Interfaces.

    ANGLEInstancedArrays: {
        drawArraysInstancedANGLE: "mode, first, count, primcount",
        drawElementsInstancedANGLE: "mode, count, type, offset, primcount",
        vertexAttribDivisorANGLE: "index, divisor",
        __proto__: null,
    },

    AnalyserNode: {
        getByteFrequencyData: "array",
        getByteTimeDomainData: "array",
        getFloatFrequencyData: "array",
        __proto__: null,
    },

    AudioBuffer: {
        getChannelData: "channelIndex",
        __proto__: null,
    },

    AudioBufferCallback: {
        handleEvent: "audioBuffer",
        __proto__: null,
    },

    AudioBufferSourceNode: {
        noteGrainOn: "when, grainOffset, grainDuration",
        noteOff: "when",
        noteOn: "when",
        start: "[when], [grainOffset], [grainDuration]",
        stop: "[when]",
        __proto__: null,
    },

    AudioListener: {
        setOrientation: "x, y, z, xUp, yUp, zUp",
        setPosition: "x, y, z",
        setVelocity: "x, y, z",
        __proto__: null,
    },

    AudioNode: {
        connect: "destination, [output], [input]",
        disconnect: "[output]",
        __proto__: null,
    },

    AudioParam: {
        cancelScheduledValues: "startTime",
        exponentialRampToValueAtTime: "value, time",
        linearRampToValueAtTime: "value, time",
        setTargetAtTime: "target, time, timeConstant",
        setTargetValueAtTime: "targetValue, time, timeConstant",
        setValueAtTime: "value, time",
        setValueCurveAtTime: "values, time, duration",
        __proto__: null,
    },

    AudioTrackList: {
        getTrackById: "id",
        item: "index",
        __proto__: null,
    },

    BiquadFilterNode: {
        getFrequencyResponse: "frequencyHz, magResponse, phaseResponse",
        __proto__: null,
    },

    Blob: {
        slice: "[start], [end], [contentType]",
        __proto__: null,
    },

    CSS: {
        supports: "property, value",
        __proto__: null,
    },

    CSSKeyframesRule: {
        appendRule: "[rule]",
        deleteRule: "[key]",
        findRule: "[key]",
        insertRule: "[rule]",
        __proto__: null,
    },

    CSSMediaRule: {
        deleteRule: "[index]",
        insertRule: "[rule], [index]",
        __proto__: null,
    },

    CSSPrimitiveValue: {
        getFloatValue: "[unitType]",
        setFloatValue: "[unitType], [floatValue]",
        setStringValue: "[stringType], [stringValue]",
        __proto__: null,
    },

    CSSRuleList: {
        item: "[index]",
        __proto__: null,
    },

    CSSStyleDeclaration: {
        getPropertyCSSValue: "[propertyName]",
        getPropertyPriority: "[propertyName]",
        getPropertyValue: "[propertyName]",
        item: "[index]",
        removeProperty: "[propertyName]",
        setProperty: "[propertyName], [value], [priority]",
        __proto__: null,
    },

    CSSStyleSheet: {
        addRule: "[selector], [style], [index]",
        deleteRule: "[index]",
        insertRule: "[rule], [index]",
        removeRule: "[index]",
        __proto__: null,
    },

    CSSSupportsRule: {
        deleteRule: "[index]",
        insertRule: "[rule], [index]",
        __proto__: null,
    },

    CSSValueList: {
        item: "[index]",
        __proto__: null,
    },

    CanvasGradient: {
        addColorStop: "[offset], [color]",
        __proto__: null,
    },

    CanvasRenderingContext2D: {
        arc: "x, y, radius, startAngle, endAngle, [anticlockwise]",
        arcTo: "x1, y1, x2, y2, radius",
        bezierCurveTo: "cp1x, cp1y, cp2x, cp2y, x, y",
        clearRect: "x, y, width, height",
        clip: "path, [winding]",
        createImageData: "imagedata",
        createConicGradient: "angle, x, y",
        createLinearGradient: "x0, y0, x1, y1",
        createPattern: "canvas, repetitionType",
        createRadialGradient: "x0, y0, r0, x1, y1, r1",
        drawFocusIfNeeded: "element",
        drawImage: "image, x, y",
        drawImageFromRect: "image, [sx], [sy], [sw], [sh], [dx], [dy], [dw], [dh], [compositeOperation]",
        ellipse: "x, y, radiusX, radiusY, rotation, startAngle, endAngle, [anticlockwise]",
        fill: "path, [winding]",
        fillRect: "x, y, width, height",
        fillText: "text, x, y, [maxWidth]",
        getImageData: "sx, sy, sw, sh",
        isPointInPath: "path, x, y, [winding]",
        isPointInStroke: "path, x, y",
        lineTo: "x, y",
        measureText: "text",
        moveTo: "x, y",
        putImageData: "imagedata, dx, dy",
        quadraticCurveTo: "cpx, cpy, x, y",
        rect: "x, y, width, height",
        rotate: "angle",
        scale: "sx, sy",
        setAlpha: "[alpha]",
        setCompositeOperation: "[compositeOperation]",
        setFillColor: "color, [alpha]",
        setLineCap: "[cap]",
        setLineDash: "dash",
        setLineJoin: "[join]",
        setLineWidth: "[width]",
        setMiterLimit: "[limit]",
        setShadow: "width, height, blur, [color], [alpha]",
        setStrokeColor: "color, [alpha]",
        setTransform: "m11, m12, m21, m22, dx, dy",
        stroke: "path",
        strokeRect: "x, y, width, height",
        strokeText: "text, x, y, [maxWidth]",
        transform: "m11, m12, m21, m22, dx, dy",
        translate: "tx, ty",
        __proto__: null,
    },

    CharacterData: {
        appendData: "[data]",
        deleteData: "[offset], [length]",
        insertData: "[offset], [data]",
        replaceData: "[offset], [length], [data]",
        substringData: "[offset], [length]",
        __proto__: null,
    },

    CommandLineAPIHost: {
        copyText: "text",
        databaseId: "database",
        getEventListeners: "target",
        inspect: "objectId, hints",
        storageId: "storage",
        __proto__: null,
    },

    CompositionEvent: {
        initCompositionEvent: "[typeArg], [canBubbleArg], [cancelableArg], [viewArg], [dataArg]",
        __proto__: null,
    },

    Crypto: {
        getRandomValues: "array",
        __proto__: null,
    },

    CustomElementRegistry: {
        define: "name, constructor",
        get: "name",
        whenDefined: "name",
        __proto__: null,
    },

    CustomEvent: {
        initCustomEvent: "type, [bubbles], [cancelable], [detail]",
        __proto__: null,
    },

    DOMApplicationCache: {
        /* EventTarget */
        __proto__: null,
    },

    DOMImplementation: {
        createCSSStyleSheet: "[title], [media]",
        createDocument: "[namespaceURI], [qualifiedName], [doctype]",
        createDocumentType: "[qualifiedName], [publicId], [systemId]",
        createHTMLDocument: "[title]",
        hasFeature: "[feature], [version]",
        __proto__: null,
    },

    DOMParser: {
        parseFromString: "[str], [contentType]",
        __proto__: null,
    },

    DOMStringList: {
        contains: "[string]",
        item: "[index]",
        __proto__: null,
    },

    DOMTokenList: {
        add: "tokens...",
        contains: "token",
        item: "index",
        remove: "tokens...",
        toggle: "token, [force]",
        __proto__: null,
    },

    DataTransfer: {
        clearData: "[type]",
        getData: "type",
        setData: "type, data",
        setDragImage: "image, x, y",
        __proto__: null,
    },

    DataTransferItem: {
        getAsString: "[callback]",
        __proto__: null,
    },

    DataTransferItemList: {
        add: "file",
        item: "[index]",
        __proto__: null,
    },

    Database: {
        changeVersion: "oldVersion, newVersion, [callback], [errorCallback], [successCallback]",
        readTransaction: "callback, [errorCallback], [successCallback]",
        transaction: "callback, [errorCallback], [successCallback]",
        __proto__: null,
    },

    DatabaseCallback: {
        handleEvent: "database",
        __proto__: null,
    },

    DedicatedWorkerGlobalScope: {
        postMessage: "message, [messagePorts]",
        __proto__: null,
    },

    DeviceMotionEvent: {
        initDeviceMotionEvent: "[type], [bubbles], [cancelable], [acceleration], [accelerationIncludingGravity], [rotationRate], [interval]",
        __proto__: null,
    },

    DeviceOrientationEvent: {
        initDeviceOrientationEvent: "[type], [bubbles], [cancelable], [alpha], [beta], [gamma], [absolute]",
        __proto__: null,
    },

    DocumentFragment: {
        getElementById: "id",
        querySelector: "selectors",
        querySelectorAll: "selectors",
        __proto__: null,
    },

    Event: {
        initEvent: "type, [bubbles], [cancelable]",
        __proto__: null,
    },

    FileList: {
        item: "index",
        __proto__: null,
    },

    FileReader: {
        readAsArrayBuffer: "blob",
        readAsBinaryString: "blob",
        readAsDataURL: "blob",
        readAsText: "blob, [encoding]",
        __proto__: null,
    },

    FileReaderSync: {
        readAsArrayBuffer: "blob",
        readAsBinaryString: "blob",
        readAsDataURL: "blob",
        readAsText: "blob, [encoding]",
        __proto__: null,
    },

    FontFaceSet: {
        add: "font",
        check: "font, [text=\" \"]",
        delete: "font",
        load: "font, [text=\" \"]",
        __proto__: null,
    },

    FormData: {
        append: "[name], [value], [filename]",
        __proto__: null,
    },

    Geolocation: {
        clearWatch: "watchID",
        getCurrentPosition: "successCallback, [errorCallback], [options]",
        watchPosition: "successCallback, [errorCallback], [options]",
        __proto__: null,
    },

    HTMLAllCollection: {
        item: "[index]",
        namedItem: "name",
        tags: "name",
        __proto__: null,
    },

    HTMLButtonElement: {
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLCanvasElement: {
        getContext: "contextId",
        toDataURL: "[type]",
        __proto__: null,
    },

    HTMLCollection: {
        item: "[index]",
        namedItem: "[name]",
        __proto__: null,
    },

    HTMLDocument: {
        write: "[html]",
        writeln: "[html]",
        __proto__: null,
    },

    HTMLElement: {
        insertAdjacentElement: "[position], [element]",
        insertAdjacentHTML: "[position], [html]",
        insertAdjacentText: "[position], [text]",
        __proto__: null,
    },

    HTMLFieldSetElement: {
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLFormControlsCollection: {
        namedItem: "[name]",
        __proto__: null,
    },

    HTMLInputElement: {
        setCustomValidity: "error",
        setRangeText: "replacement",
        setSelectionRange: "start, end, [direction]",
        stepDown: "[n]",
        stepUp: "[n]",
        __proto__: null,
    },

    HTMLKeygenElement: {
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLMediaElement: {
        addTextTrack: "kind, [label], [language]",
        canPlayType: "[type], [keySystem]",
        fastSeek: "time",
        webkitAddKey: "keySystem, key, [initData], [sessionId]",
        webkitCancelKeyRequest: "keySystem, [sessionId]",
        webkitGenerateKeyRequest: "keySystem, [initData]",
        webkitSetMediaKeys: "mediaKeys",
        __proto__: null,
    },

    HTMLObjectElement: {
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLOptionsCollection: {
        add: "element, [before]",
        namedItem: "[name]",
        remove: "[index]",
        __proto__: null,
    },

    HTMLOutputElement: {
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLSelectElement: {
        add: "element, [before]",
        item: "index",
        namedItem: "[name]",
        setCustomValidity: "error",
        __proto__: null,
    },

    HTMLSlotElement: {
        assignedNodes: "[options]",
        __proto__: null,
    },

    HTMLTableElement: {
        deleteRow: "index",
        insertRow: "[index]",
        __proto__: null,
    },

    HTMLTableRowElement: {
        deleteCell: "index",
        insertCell: "[index]",
        __proto__: null,
    },

    HTMLTableSectionElement: {
        deleteRow: "index",
        insertRow: "[index]",
        __proto__: null,
    },

    HTMLTextAreaElement: {
        setCustomValidity: "error",
        setRangeText: "replacement",
        setSelectionRange: "[start], [end], [direction]",
        __proto__: null,
    },

    HTMLVideoElement: {
        webkitSetPresentationMode: "mode",
        webkitSupportsPresentationMode: "mode",
        __proto__: null,
    },

    HashChangeEvent: {
        initHashChangeEvent: "[type], [canBubble], [cancelable], [oldURL], [newURL]",
        __proto__: null,
    },

    History: {
        go: "[distance]",
        pushState: "data, title, [url]",
        replaceState: "data, title, [url]",
        __proto__: null,
    },

    IDBCursor: {
        advance: "count",
        continue: "[key]",
        update: "value",
        __proto__: null,
    },

    IDBDatabase: {
        createObjectStore: "name, [options]",
        deleteObjectStore: "name",
        transaction: "storeName, [mode]",
        __proto__: null,
    },

    IDBFactory: {
        cmp: "first, second",
        deleteDatabase: "name",
        open: "name, [version]",
        __proto__: null,
    },

    IDBIndex: {
        count: "[range]",
        get: "key",
        getKey: "key",
        openCursor: "[range], [direction]",
        openKeyCursor: "[range], [direction]",
        __proto__: null,
    },

    IDBObjectStore: {
        add: "value, [key]",
        count: "[range]",
        createIndex: "name, keyPath, [options]",
        delete: "keyRange",
        deleteIndex: "name",
        get: "key",
        index: "name",
        openCursor: "[range], [direction]",
        put: "value, [key]",
        __proto__: null,
    },

    IDBTransaction: {
        objectStore: "name",
        __proto__: null,
    },

    ImageBitmapRenderingContext: {
        transferFromImageBitmap: "[bitmap]",
        __proto__: null,
    },

    KeyboardEvent: {
        initKeyboardEvent: "[type], [canBubble], [cancelable], [view], [keyIdentifier], [location], [ctrlKey], [altKey], [shiftKey], [metaKey], [altGraphKey]",
        __proto__: null,
    },

    Location: {
        assign: "[url]",
        reload: "[force=false]",
        replace: "[url]",
        __proto__: null,
    },

    MediaController: {
        /* EventTarget */
        __proto__: null,
    },

    MediaControlsHost: {
        displayNameForTrack: "track",
        mediaUIImageData: "partID",
        setSelectedTextTrack: "track",
        sortedTrackListForMenu: "trackList",
        __proto__: null,
    },

    MediaList: {
        appendMedium: "[newMedium]",
        deleteMedium: "[oldMedium]",
        item: "[index]",
        __proto__: null,
    },

    MediaQueryList: {
        addListener: "[listener]",
        removeListener: "[listener]",
        __proto__: null,
    },

    MediaSource: {
        addSourceBuffer: "type",
        endOfStream: "[error]",
        removeSourceBuffer: "buffer",
        __proto__: null,
    },

    MediaStreamTrack: {
        applyConstraints: "constraints",
        __proto__: null,
    },

    MediaStreamTrackSourcesCallback: {
        handleEvent: "sources",
        __proto__: null,
    },

    MessageEvent: {
        initMessageEvent: "type, [bubbles], [cancelable], [data], [origin], [lastEventId], [source], [messagePorts]",
        __proto__: null,
    },

    MessagePort: {
        /* EventTarget */
        __proto__: null,
    },

    MimeTypeArray: {
        item: "[index]",
        namedItem: "[name]",
        __proto__: null,
    },

    MouseEvent: {
        initMouseEvent: "[type], [canBubble], [cancelable], [view], [detail], [screenX], [screenY], [clientX], [clientY], [ctrlKey], [altKey], [shiftKey], [metaKey], [button], [relatedTarget]",
        __proto__: null,
    },

    MutationEvent: {
        initMutationEvent: "[type], [canBubble], [cancelable], [relatedNode], [prevValue], [newValue], [attrName], [attrChange]",
        __proto__: null,
    },

    MutationObserver: {
        observe: "target, options",
        __proto__: null,
    },

    NamedNodeMap: {
        getNamedItem: "[name]",
        getNamedItemNS: "[namespaceURI], [localName]",
        item: "[index]",
        removeNamedItem: "[name]",
        removeNamedItemNS: "[namespaceURI], [localName]",
        setNamedItem: "[node]",
        setNamedItemNS: "[node]",
        __proto__: null,
    },

    Navigator: {
        getUserMedia: "options, successCallback, errorCallback",
        __proto__: null,
    },

    NavigatorUserMediaErrorCallback: {
        handleEvent: "error",
        __proto__: null,
    },

    NavigatorUserMediaSuccessCallback: {
        handleEvent: "stream",
        __proto__: null,
    },

    NodeFilter: {
        acceptNode: "[n]",
        __proto__: null,
    },

    NodeList: {
        item: "index",
        __proto__: null,
    },

    Notification: {
        /* EventTarget */
        __proto__: null,
    },

    NotificationCenter: {
        createNotification: "iconUrl, title, body",
        requestPermission: "[callback]",
        __proto__: null,
    },

    NotificationPermissionCallback: {
        handleEvent: "permission",
        __proto__: null,
    },

    OESVertexArrayObject: {
        bindVertexArrayOES: "[arrayObject]",
        deleteVertexArrayOES: "[arrayObject]",
        isVertexArrayOES: "[arrayObject]",
        __proto__: null,
    },

    OscillatorNode: {
        noteOff: "when",
        noteOn: "when",
        setPeriodicWave: "wave",
        start: "[when]",
        stop: "[when]",
        __proto__: null,
    },

    Path2D: {
        addPath: "path, [transform]",
        arc: "[x], [y], [radius], [startAngle], [endAngle], [anticlockwise]",
        arcTo: "[x1], [y1], [x2], [y2], [radius]",
        bezierCurveTo: "[cp1x], [cp1y], [cp2x], [cp2y], [x], [y]",
        ellipse: "x, y, radiusX, radiusY, rotation, startAngle, endAngle, [anticlockwise]",
        lineTo: "[x], [y]",
        moveTo: "[x], [y]",
        quadraticCurveTo: "[cpx], [cpy], [x], [y]",
        rect: "[x], [y], [width], [height]",
        __proto__: null,
    },

    Performance: {
        clearMarks: "[name]",
        clearMeasures: "name",
        getEntriesByName: "name, [type]",
        getEntriesByType: "type",
        mark: "name",
        measure: "name, [startMark], [endMark]",
        __proto__: null,
    },

    PerformanceObserver: {
        observe: "options",
        __proto__: null,
    },

    PerformanceObserverEntryList: {
        getEntriesByName: "name, [type]",
        getEntriesByType: "type",
        __proto__: null,
    },

    Plugin: {
        item: "[index]",
        namedItem: "[name]",
        __proto__: null,
    },

    PluginArray: {
        item: "[index]",
        namedItem: "[name]",
        refresh: "[reload]",
        __proto__: null,
    },

    PositionCallback: {
        handleEvent: "position",
        __proto__: null,
    },

    PositionErrorCallback: {
        handleEvent: "error",
        __proto__: null,
    },

    RTCDTMFSender: {
        insertDTMF: "tones, [duration], [interToneGap]",
        __proto__: null,
    },

    RTCDataChannel: {
        send: "data",
        __proto__: null,
    },

    RTCPeerConnectionErrorCallback: {
        handleEvent: "error",
        __proto__: null,
    },

    RTCSessionDescriptionCallback: {
        handleEvent: "sdp",
        __proto__: null,
    },

    RTCStatsCallback: {
        handleEvent: "response",
        __proto__: null,
    },

    RTCStatsReport: {
        stat: "name",
        __proto__: null,
    },

    RTCStatsResponse: {
        namedItem: "[name]",
        __proto__: null,
    },

    Range: {
        collapse: "[toStart]",
        compareBoundaryPoints: "[how], [sourceRange]",
        compareNode: "[refNode]",
        comparePoint: "[refNode], [offset]",
        createContextualFragment: "[html]",
        expand: "[unit]",
        insertNode: "[newNode]",
        intersectsNode: "[refNode]",
        isPointInRange: "[refNode], [offset]",
        selectNode: "[refNode]",
        selectNodeContents: "[refNode]",
        setEnd: "[refNode], [offset]",
        setEndAfter: "[refNode]",
        setEndBefore: "[refNode]",
        setStart: "[refNode], [offset]",
        setStartAfter: "[refNode]",
        setStartBefore: "[refNode]",
        surroundContents: "[newParent]",
        __proto__: null,
    },

    ReadableStream: {
        cancel: "reason",
        pipeThrough: "dest, options",
        pipeTo: "streams, options",
        __proto__: null,
    },

    WritableStream: {
        abort: "reason",
        close: "",
        write: "chunk",
        __proto__: null,
    },

    RequestAnimationFrameCallback: {
        handleEvent: "highResTime",
        __proto__: null,
    },

    SQLResultSetRowList: {
        item: "index",
        __proto__: null,
    },

    SQLStatementCallback: {
        handleEvent: "transaction, resultSet",
        __proto__: null,
    },

    SQLStatementErrorCallback: {
        handleEvent: "transaction, error",
        __proto__: null,
    },

    SQLTransaction: {
        executeSql: "sqlStatement, arguments, [callback], [errorCallback]",
        __proto__: null,
    },

    SQLTransactionCallback: {
        handleEvent: "transaction",
        __proto__: null,
    },

    SQLTransactionErrorCallback: {
        handleEvent: "error",
        __proto__: null,
    },

    SVGAngle: {
        convertToSpecifiedUnits: "unitType",
        newValueSpecifiedUnits: "unitType, valueInSpecifiedUnits",
        __proto__: null,
    },

    SVGAnimationElement: {
        beginElementAt: "[offset]",
        endElementAt: "[offset]",
        hasExtension: "[extension]",
        __proto__: null,
    },

    SVGColor: {
        setColor: "colorType, rgbColor, iccColor",
        setRGBColor: "rgbColor",
        setRGBColorICCColor: "rgbColor, iccColor",
        __proto__: null,
    },

    SVGCursorElement: {
        hasExtension: "[extension]",
        __proto__: null,
    },

    SVGDocument: {
        createEvent: "[eventType]",
        __proto__: null,
    },

    SVGElement: {
        getPresentationAttribute: "[name]",
        __proto__: null,
    },

    SVGFEDropShadowElement: {
        setStdDeviation: "[stdDeviationX], [stdDeviationY]",
        __proto__: null,
    },

    SVGFEGaussianBlurElement: {
        setStdDeviation: "[stdDeviationX], [stdDeviationY]",
        __proto__: null,
    },

    SVGFEMorphologyElement: {
        setRadius: "[radiusX], [radiusY]",
        __proto__: null,
    },

    SVGFilterElement: {
        setFilterRes: "[filterResX], [filterResY]",
        __proto__: null,
    },

    SVGGraphicsElement: {
        getTransformToElement: "[element]",
        hasExtension: "[extension]",
        __proto__: null,
    },

    SVGLength: {
        convertToSpecifiedUnits: "unitType",
        newValueSpecifiedUnits: "unitType, valueInSpecifiedUnits",
        __proto__: null,
    },

    SVGLengthList: {
        appendItem: "item",
        getItem: "index",
        initialize: "item",
        insertItemBefore: "item, index",
        removeItem: "index",
        replaceItem: "item, index",
        __proto__: null,
    },

    SVGMarkerElement: {
        setOrientToAngle: "[angle]",
        __proto__: null,
    },

    SVGMaskElement: {
        hasExtension: "[extension]",
        __proto__: null,
    },

    SVGMatrix: {
        multiply: "secondMatrix",
        rotate: "angle",
        rotateFromVector: "x, y",
        scale: "scaleFactor",
        scaleNonUniform: "scaleFactorX, scaleFactorY",
        skewX: "angle",
        skewY: "angle",
        translate: "x, y",
        __proto__: null,
    },

    SVGNumberList: {
        appendItem: "item",
        getItem: "index",
        initialize: "item",
        insertItemBefore: "item, index",
        removeItem: "index",
        replaceItem: "item, index",
        __proto__: null,
    },

    SVGPaint: {
        setPaint: "paintType, uri, rgbColor, iccColor",
        setUri: "uri",
        __proto__: null,
    },

    SVGPathElement: {
        createSVGPathSegArcAbs: "[x], [y], [r1], [r2], [angle], [largeArcFlag], [sweepFlag]",
        createSVGPathSegArcRel: "[x], [y], [r1], [r2], [angle], [largeArcFlag], [sweepFlag]",
        createSVGPathSegCurvetoCubicAbs: "[x], [y], [x1], [y1], [x2], [y2]",
        createSVGPathSegCurvetoCubicRel: "[x], [y], [x1], [y1], [x2], [y2]",
        createSVGPathSegCurvetoCubicSmoothAbs: "[x], [y], [x2], [y2]",
        createSVGPathSegCurvetoCubicSmoothRel: "[x], [y], [x2], [y2]",
        createSVGPathSegCurvetoQuadraticAbs: "[x], [y], [x1], [y1]",
        createSVGPathSegCurvetoQuadraticRel: "[x], [y], [x1], [y1]",
        createSVGPathSegCurvetoQuadraticSmoothAbs: "[x], [y]",
        createSVGPathSegCurvetoQuadraticSmoothRel: "[x], [y]",
        createSVGPathSegLinetoAbs: "[x], [y]",
        createSVGPathSegLinetoHorizontalAbs: "[x]",
        createSVGPathSegLinetoHorizontalRel: "[x]",
        createSVGPathSegLinetoRel: "[x], [y]",
        createSVGPathSegLinetoVerticalAbs: "[y]",
        createSVGPathSegLinetoVerticalRel: "[y]",
        createSVGPathSegMovetoAbs: "[x], [y]",
        createSVGPathSegMovetoRel: "[x], [y]",
        getPathSegAtLength: "[distance]",
        getPointAtLength: "[distance]",
        __proto__: null,
    },

    SVGPathSegList: {
        appendItem: "newItem",
        getItem: "index",
        initialize: "newItem",
        insertItemBefore: "newItem, index",
        removeItem: "index",
        replaceItem: "newItem, index",
        __proto__: null,
    },

    SVGPatternElement: {
        hasExtension: "[extension]",
        __proto__: null,
    },

    SVGPoint: {
        matrixTransform: "matrix",
        __proto__: null,
    },

    SVGPointList: {
        appendItem: "item",
        getItem: "index",
        initialize: "item",
        insertItemBefore: "item, index",
        removeItem: "index",
        replaceItem: "item, index",
        __proto__: null,
    },

    SVGSVGElement: {
        checkEnclosure: "[element], [rect]",
        checkIntersection: "[element], [rect]",
        createSVGTransformFromMatrix: "[matrix]",
        getElementById: "[elementId]",
        getEnclosureList: "[rect], [referenceElement]",
        getIntersectionList: "[rect], [referenceElement]",
        setCurrentTime: "[seconds]",
        suspendRedraw: "[maxWaitMilliseconds]",
        unsuspendRedraw: "[suspendHandleId]",
        __proto__: null,
    },

    SVGStringList: {
        appendItem: "item",
        getItem: "index",
        initialize: "item",
        insertItemBefore: "item, index",
        removeItem: "index",
        replaceItem: "item, index",
        __proto__: null,
    },

    SVGTextContentElement: {
        getCharNumAtPosition: "[point]",
        getEndPositionOfChar: "[offset]",
        getExtentOfChar: "[offset]",
        getRotationOfChar: "[offset]",
        getStartPositionOfChar: "[offset]",
        getSubStringLength: "[offset], [length]",
        selectSubString: "[offset], [length]",
        __proto__: null,
    },

    SVGTransform: {
        setMatrix: "matrix",
        setRotate: "angle, cx, cy",
        setScale: "sx, sy",
        setSkewX: "angle",
        setSkewY: "angle",
        setTranslate: "tx, ty",
        __proto__: null,
    },

    SVGTransformList: {
        appendItem: "item",
        createSVGTransformFromMatrix: "matrix",
        getItem: "index",
        initialize: "item",
        insertItemBefore: "item, index",
        removeItem: "index",
        replaceItem: "item, index",
        __proto__: null,
    },

    SecurityPolicy: {
        allowsConnectionTo: "url",
        allowsFontFrom: "url",
        allowsFormAction: "url",
        allowsFrameFrom: "url",
        allowsImageFrom: "url",
        allowsMediaFrom: "url",
        allowsObjectFrom: "url",
        allowsPluginType: "type",
        allowsScriptFrom: "url",
        allowsStyleFrom: "url",
        __proto__: null,
    },

    Selection: {
        addRange: "[range]",
        collapse: "[node], [index]",
        containsNode: "[node], [allowPartial]",
        extend: "[node], [offset]",
        getRangeAt: "[index]",
        modify: "[alter], [direction], [granularity]",
        selectAllChildren: "[node]",
        setBaseAndExtent: "[baseNode], [baseOffset], [extentNode], [extentOffset]",
        setPosition: "[node], [offset]",
        __proto__: null,
    },

    SourceBuffer: {
        appendBuffer: "data",
        remove: "start, end",
        __proto__: null,
    },

    SourceBufferList: {
        item: "index",
        __proto__: null,
    },

    SpeechSynthesis: {
        speak: "utterance",
        __proto__: null,
    },

    SpeechSynthesisUtterance: {
        /* EventTarget */
        __proto__: null,
    },

    Storage: {
        getItem: "key",
        key: "index",
        removeItem: "key",
        setItem: "key, data",
        __proto__: null,
    },

    StorageErrorCallback: {
        handleEvent: "error",
        __proto__: null,
    },

    StorageEvent: {
        initStorageEvent: "[typeArg], [canBubbleArg], [cancelableArg], [keyArg], [oldValueArg], [newValueArg], [urlArg], [storageAreaArg]",
        __proto__: null,
    },

    StorageInfo: {
        queryUsageAndQuota: "storageType, [usageCallback], [errorCallback]",
        requestQuota: "storageType, newQuotaInBytes, [quotaCallback], [errorCallback]",
        __proto__: null,
    },

    StorageQuota: {
        queryUsageAndQuota: "usageCallback, [errorCallback]",
        requestQuota: "newQuotaInBytes, [quotaCallback], [errorCallback]",
        __proto__: null,
    },

    StorageQuotaCallback: {
        handleEvent: "grantedQuotaInBytes",
        __proto__: null,
    },

    StorageUsageCallback: {
        handleEvent: "currentUsageInBytes, currentQuotaInBytes",
        __proto__: null,
    },

    StringCallback: {
        handleEvent: "data",
        __proto__: null,
    },

    StyleSheetList: {
        item: "[index]",
        __proto__: null,
    },

    Text: {
        replaceWholeText: "[content]",
        splitText: "offset",
        __proto__: null,
    },

    TextEvent: {
        initTextEvent: "[typeArg], [canBubbleArg], [cancelableArg], [viewArg], [dataArg]",
        __proto__: null,
    },

    TextTrack: {
        addCue: "cue",
        addRegion: "region",
        removeCue: "cue",
        removeRegion: "region",
        __proto__: null,
    },

    TextTrackCue: {
        /* EventTarget */
        __proto__: null,
    },

    TextTrackCueList: {
        getCueById: "id",
        item: "index",
        __proto__: null,
    },

    TextTrackList: {
        getTrackById: "id",
        item: "index",
        __proto__: null,
    },

    TimeRanges: {
        end: "index",
        start: "index",
        __proto__: null,
    },

    TouchEvent: {
        initTouchEvent: "[touches], [targetTouches], [changedTouches], [type], [view], [screenX], [screenY], [clientX], [clientY], [ctrlKey], [altKey], [shiftKey], [metaKey]",
        __proto__: null,
    },

    TouchList: {
        item: "index",
        __proto__: null,
    },

    UIEvent: {
        initUIEvent: "[type], [canBubble], [cancelable], [view], [detail]",
        __proto__: null,
    },

    UserMessageHandler: {
        postMessage: "message",
        __proto__: null,
    },

    VTTRegionList: {
        getRegionById: "id",
        item: "index",
        __proto__: null,
    },

    VideoTrackList: {
        getTrackById: "id",
        item: "index",
        __proto__: null,
    },

    WebGL2RenderingContext: {
        beginQuery: "target, query",
        beginTransformFeedback: "primitiveMode",
        bindBufferBase: "target, index, buffer",
        bindBufferRange: "target, index, buffer, offset, size",
        bindSampler: "unit, sampler",
        bindTransformFeedback: "target, id",
        bindVertexArray: "vertexArray",
        blitFramebuffer: "srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter",
        clearBufferfi: "buffer, drawbuffer, depth, stencil",
        clearBufferfv: "buffer, drawbuffer, value",
        clearBufferiv: "buffer, drawbuffer, value",
        clearBufferuiv: "buffer, drawbuffer, value",
        clientWaitSync: "sync, flags, timeout",
        compressedTexImage3D: "target, level, internalformat, width, height, depth, border, imageSize, data",
        compressedTexSubImage3D: "target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data",
        copyBufferSubData: "readTarget, writeTarget, readOffset, writeOffset, size",
        copyTexSubImage3D: "target, level, xoffset, yoffset, zoffset, x, y, width, height",
        deleteQuery: "query",
        deleteSampler: "sampler",
        deleteSync: "sync",
        deleteTransformFeedback: "id",
        deleteVertexArray: "vertexArray",
        drawArraysInstanced: "mode, first, count, instanceCount",
        drawBuffers: "buffers",
        drawElementsInstanced: "mode, count, type, offset, instanceCount",
        drawRangeElements: "mode, start, end, count, type, offset",
        endQuery: "target",
        fenceSync: "condition, flags",
        framebufferTextureLayer: "target, attachment, texture, level, layer",
        getActiveUniformBlockName: "program, uniformBlockIndex",
        getActiveUniformBlockParameter: "program, uniformBlockIndex, pname",
        getActiveUniforms: "program, uniformIndices, pname",
        getBufferSubData: "target, offset, returnedData",
        getFragDataLocation: "program, name",
        getIndexedParameter: "target, index",
        getInternalformatParameter: "target, internalformat, pname",
        getQuery: "target, pname",
        getQueryParameter: "query, pname",
        getSamplerParameter: "sampler, pname",
        getSyncParameter: "sync, pname",
        getTransformFeedbackVarying: "program, index",
        getUniformBlockIndex: "program, uniformBlockName",
        getUniformIndices: "program, uniformNames",
        invalidateFramebuffer: "target, attachments",
        invalidateSubFramebuffer: "target, attachments, x, y, width, height",
        isQuery: "query",
        isSampler: "sampler",
        isSync: "sync",
        isTransformFeedback: "id",
        isVertexArray: "vertexArray",
        readBuffer: "src",
        renderbufferStorageMultisample: "target, samples, internalformat, width, height",
        samplerParameterf: "sampler, pname, param",
        samplerParameteri: "sampler, pname, param",
        texImage3D: "target, level, internalformat, width, height, depth, border, format, type, pixels",
        texStorage2D: "target, levels, internalformat, width, height",
        texStorage3D: "target, levels, internalformat, width, height, depth",
        texSubImage3D: "target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels",
        transformFeedbackVaryings: "program, varyings, bufferMode",
        uniform1ui: "location, v0",
        uniform1uiv: "location, value",
        uniform2ui: "location, v0, v1",
        uniform2uiv: "location, value",
        uniform3ui: "location, v0, v1, v2",
        uniform3uiv: "location, value",
        uniform4ui: "location, v0, v1, v2, v3",
        uniform4uiv: "location, value",
        uniformBlockBinding: "program, uniformBlockIndex, uniformBlockBinding",
        uniformMatrix2x3fv: "location, transpose, value",
        uniformMatrix2x4fv: "location, transpose, value",
        uniformMatrix3x2fv: "location, transpose, value",
        uniformMatrix3x4fv: "location, transpose, value",
        uniformMatrix4x2fv: "location, transpose, value",
        uniformMatrix4x3fv: "location, transpose, value",
        vertexAttribDivisor: "index, divisor",
        vertexAttribI4i: "index, x, y, z, w",
        vertexAttribI4iv: "index, v",
        vertexAttribI4ui: "index, x, y, z, w",
        vertexAttribI4uiv: "index, v",
        vertexAttribIPointer: "index, size, type, stride, offset",
        waitSync: "sync, flags, timeout",
        __proto__: null,
    },

    WebGLDebugShaders: {
        getTranslatedShaderSource: "shader",
        __proto__: null,
    },

    WebGLDrawBuffers: {
        drawBuffersWEBGL: "buffers",
        __proto__: null,
    },

    WebGLMultiDraw: {
        multiDrawArraysWebGL: "mode, firstsList, firstsOffset, countsList, countsOffset, drawcount",
        multiDrawArraysInstancedWebGL: "mode, firstsList, firstsOffset, countsList, countsOffset, instanceCountsList, instanceCountsOffset, drawcount",
        multiDrawElementsWebGL: "mode, countsList, countsOffset, type, offsetsList, offsetsOffset, drawcount",
        multiDrawElementsInstancedWebGL: "mode, countsList, countsOffset, type, offsetsList, offsetsOffset, instanceCountsList, instanceCountsOffset, drawcount",
        __proto__: null,
    },

    WebGLRenderingContextBase: {
        activeTexture: "texture",
        attachShader: "program, shader",
        bindAttribLocation: "program, index, name",
        bindBuffer: "target, buffer",
        bindFramebuffer: "target, framebuffer",
        bindRenderbuffer: "target, renderbuffer",
        bindTexture: "target, texture",
        blendColor: "red, green, blue, alpha",
        blendEquation: "mode",
        blendEquationSeparate: "modeRGB, modeAlpha",
        blendFunc: "sfactor, dfactor",
        blendFuncSeparate: "srcRGB, dstRGB, srcAlpha, dstAlpha",
        bufferData: "target, data, usage",
        bufferSubData: "target, offset, data",
        checkFramebufferStatus: "target",
        clear: "mask",
        clearColor: "red, green, blue, alpha",
        clearDepth: "depth",
        clearStencil: "s",
        colorMask: "red, green, blue, alpha",
        compileShader: "shader",
        compressedTexImage2D: "target, level, internalformat, width, height, border, data",
        compressedTexSubImage2D: "target, level, xoffset, yoffset, width, height, format, data",
        copyTexImage2D: "target, level, internalformat, x, y, width, height, border",
        copyTexSubImage2D: "target, level, xoffset, yoffset, x, y, width, height",
        createShader: "type",
        cullFace: "mode",
        deleteBuffer: "buffer",
        deleteFramebuffer: "framebuffer",
        deleteProgram: "program",
        deleteRenderbuffer: "renderbuffer",
        deleteShader: "shader",
        deleteTexture: "texture",
        depthFunc: "func",
        depthMask: "flag",
        depthRange: "zNear, zFar",
        detachShader: "program, shader",
        disable: "cap",
        disableVertexAttribArray: "index",
        drawArrays: "mode, first, count",
        drawElements: "mode, count, type, offset",
        enable: "cap",
        enableVertexAttribArray: "index",
        framebufferRenderbuffer: "target, attachment, renderbuffertarget, renderbuffer",
        framebufferTexture2D: "target, attachment, textarget, texture, level",
        frontFace: "mode",
        generateMipmap: "target",
        getActiveAttrib: "program, index",
        getActiveUniform: "program, index",
        getAttachedShaders: "program",
        getAttribLocation: "program, name",
        getBufferParameter: "target, pname",
        getExtension: "name",
        getFramebufferAttachmentParameter: "target, attachment, pname",
        getParameter: "pname",
        getProgramInfoLog: "program",
        getProgramParameter: "program, pname",
        getRenderbufferParameter: "target, pname",
        getShaderInfoLog: "shader",
        getShaderParameter: "shader, pname",
        getShaderPrecisionFormat: "shadertype, precisiontype",
        getShaderSource: "shader",
        getTexParameter: "target, pname",
        getUniform: "program, location",
        getUniformLocation: "program, name",
        getVertexAttrib: "index, pname",
        getVertexAttribOffset: "index, pname",
        hint: "target, mode",
        isBuffer: "buffer",
        isEnabled: "cap",
        isFramebuffer: "framebuffer",
        isProgram: "program",
        isRenderbuffer: "renderbuffer",
        isShader: "shader",
        isTexture: "texture",
        lineWidth: "width",
        linkProgram: "program",
        pixelStorei: "pname, param",
        polygonOffset: "factor, units",
        readPixels: "x, y, width, height, format, type, pixels",
        renderbufferStorage: "target, internalformat, width, height",
        sampleCoverage: "value, invert",
        scissor: "x, y, width, height",
        shaderSource: "shader, string",
        stencilFunc: "func, ref, mask",
        stencilFuncSeparate: "face, func, ref, mask",
        stencilMask: "mask",
        stencilMaskSeparate: "face, mask",
        stencilOp: "fail, zfail, zpass",
        stencilOpSeparate: "face, fail, zfail, zpass",
        texImage2D: "target, level, internalformat, width, height, border, format, type, pixels",
        texParameterf: "target, pname, param",
        texParameteri: "target, pname, param",
        texSubImage2D: "target, level, xoffset, yoffset, width, height, format, type, pixels",
        uniform1f: "location, x",
        uniform1fv: "location, v",
        uniform1i: "location, x",
        uniform1iv: "location, v",
        uniform2f: "location, x, y",
        uniform2fv: "location, v",
        uniform2i: "location, x, y",
        uniform2iv: "location, v",
        uniform3f: "location, x, y, z",
        uniform3fv: "location, v",
        uniform3i: "location, x, y, z",
        uniform3iv: "location, v",
        uniform4f: "location, x, y, z, w",
        uniform4fv: "location, v",
        uniform4i: "location, x, y, z, w",
        uniform4iv: "location, v",
        uniformMatrix2fv: "location, transpose, array",
        uniformMatrix3fv: "location, transpose, array",
        uniformMatrix4fv: "location, transpose, array",
        useProgram: "program",
        validateProgram: "program",
        vertexAttrib1f: "indx, x",
        vertexAttrib1fv: "indx, values",
        vertexAttrib2f: "indx, x, y",
        vertexAttrib2fv: "indx, values",
        vertexAttrib3f: "indx, x, y, z",
        vertexAttrib3fv: "indx, values",
        vertexAttrib4f: "indx, x, y, z, w",
        vertexAttrib4fv: "indx, values",
        vertexAttribPointer: "indx, size, type, normalized, stride, offset",
        viewport: "x, y, width, height",
        __proto__: null,
    },

    WebKitCSSMatrix: {
        multiply: "[secondMatrix]",
        rotate: "[rotX], [rotY], [rotZ]",
        rotateAxisAngle: "[x], [y], [z], [angle]",
        scale: "[scaleX], [scaleY], [scaleZ]",
        setMatrixValue: "[string]",
        skewX: "[angle]",
        skewY: "[angle]",
        translate: "[x], [y], [z]",
        __proto__: null,
    },

    WebKitMediaKeySession: {
        update: "key",
        __proto__: null,
    },

    WebKitMediaKeys: {
        createSession: "[type], [initData]",
        __proto__: null,
    },

    WebKitNamedFlow: {
        getRegionsByContent: "contentNode",
        __proto__: null,
    },

    WebKitNamedFlowCollection: {
        item: "index",
        namedItem: "name",
        __proto__: null,
    },

    WebKitSubtleCrypto: {
        decrypt: "algorithm, key, data",
        digest: "algorithm, data",
        encrypt: "algorithm, key, data",
        exportKey: "format, key",
        generateKey: "algorithm, [extractable], [keyUsages]",
        importKey: "format, keyData, algorithm, [extractable], [keyUsages]",
        sign: "algorithm, key, data",
        unwrapKey: "format, wrappedKey, unwrappingKey, unwrapAlgorithm, unwrappedKeyAlgorithm, [extractable], [keyUsages]",
        verify: "algorithm, key, signature, data",
        wrapKey: "format, key, wrappingKey, wrapAlgorithm",
        __proto__: null,
    },

    WebSocket: {
        close: "[code], [reason]",
        send: "data",
        __proto__: null,
    },

    WheelEvent: {
        initWebKitWheelEvent: "[wheelDeltaX], [wheelDeltaY], [view], [screenX], [screenY], [clientX], [clientY], [ctrlKey], [altKey], [shiftKey], [metaKey]",
        __proto__: null,
    },

    Worker: {
        postMessage: "message, [messagePorts]",
        __proto__: null,
    },

    WorkerGlobalScope: {
        clearInterval: "[handle]",
        clearTimeout: "[handle]",
        setInterval: "handler, [timeout]",
        setTimeout: "handler, [timeout]",
        __proto__: null,
    },

    XMLHttpRequest: {
        getResponseHeader: "header",
        open: "method, url, [async], [user], [password]",
        overrideMimeType: "override",
        setRequestHeader: "header, value",
        __proto__: null,
    },

    XMLHttpRequestUpload: {
        /* EventTarget */
        __proto__: null,
    },

    XMLSerializer: {
        serializeToString: "[node]",
        __proto__: null,
    },

    XPathEvaluator: {
        createExpression: "[expression], [resolver]",
        createNSResolver: "[nodeResolver]",
        evaluate: "[expression], [contextNode], [resolver], [type], [inResult]",
        __proto__: null,
    },

    XPathExpression: {
        evaluate: "[contextNode], [type], [inResult]",
        __proto__: null,
    },

    XPathNSResolver: {
        lookupNamespaceURI: "[prefix]",
        __proto__: null,
    },

    XPathResult: {
        snapshotItem: "[index]",
        __proto__: null,
    },

    XSLTProcessor: {
        getParameter: "namespaceURI, localName",
        importStylesheet: "[stylesheet]",
        removeParameter: "namespaceURI, localName",
        setParameter: "namespaceURI, localName, value",
        transformToDocument: "[source]",
        transformToFragment: "[source], [docVal]",
        __proto__: null,
    },

    webkitAudioContext: {
        createBuffer: "numberOfChannels, numberOfFrames, sampleRate",
        createChannelMerger: "[numberOfInputs]",
        createChannelSplitter: "[numberOfOutputs]",
        createDelay: "[maxDelayTime]",
        createDelayNode: "[maxDelayTime]",
        createJavaScriptNode: "bufferSize, [numberOfInputChannels], [numberOfOutputChannels]",
        createMediaElementSource: "mediaElement",
        createPeriodicWave: "real, imag",
        createScriptProcessor: "bufferSize, [numberOfInputChannels], [numberOfOutputChannels]",
        decodeAudioData: "audioData, successCallback, [errorCallback]",
        __proto__: null,
    },

    webkitAudioPannerNode: {
        setOrientation: "x, y, z",
        setPosition: "x, y, z",
        setVelocity: "x, y, z",
        __proto__: null,
    },

    webkitMediaStream: {
        addTrack: "track",
        getTrackById: "trackId",
        removeTrack: "track",
        __proto__: null,
    },

    webkitRTCPeerConnection: {
        addIceCandidate: "candidate, successCallback, failureCallback",
        addStream: "stream",
        createAnswer: "successCallback, failureCallback, [answerOptions]",
        createDTMFSender: "track",
        createDataChannel: "label, [options]",
        createOffer: "successCallback, failureCallback, [offerOptions]",
        getStats: "successCallback, failureCallback, [selector]",
        getStreamById: "streamId",
        removeStream: "stream",
        setLocalDescription: "description, successCallback, failureCallback",
        setRemoteDescription: "description, successCallback, failureCallback",
        updateIce: "configuration",
        __proto__: null,
    },

    EventTarget: {
        addEventListener: "type, listener, [useCapture=false]",
        removeEventListener: "type, listener, [useCapture=false]",
        dispatchEvent: "event",
        __proto__: null,
    },
};

(function() {
    var ElementQueries = {
        getElementsByClassName: "classNames",
        getElementsByTagName: "tagName",
        getElementsByTagNameNS: "namespace, localName",
        querySelector: "selectors",
        querySelectorAll: "selectors",
    };
    Object.assign(WI.NativePrototypeFunctionParameters.Element, ElementQueries);
    Object.assign(WI.NativePrototypeFunctionParameters.Document, ElementQueries);

    var ChildNode = {
        after: "[node|string]...",
        before: "[node|string]...",
        replaceWith: "[node|string]...",
    };
    Object.assign(WI.NativePrototypeFunctionParameters.Element, ChildNode);
    Object.assign(WI.NativePrototypeFunctionParameters.CharacterData, ChildNode);

    var ParentNode = {
        append: "[node|string]...",
        prepend: "[node|string]...",
    };
    Object.assign(WI.NativePrototypeFunctionParameters.Element, ParentNode);
    Object.assign(WI.NativePrototypeFunctionParameters.Document, ParentNode);
    Object.assign(WI.NativePrototypeFunctionParameters.DocumentFragment, ParentNode);

})();
