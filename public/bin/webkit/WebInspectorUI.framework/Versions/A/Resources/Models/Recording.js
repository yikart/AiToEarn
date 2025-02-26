/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.Recording = class Recording extends WI.Object
{
    constructor(version, type, initialState, frames, data)
    {
        super();

        this._version = version;
        this._type = type;
        this._initialState = initialState;
        this._frames = frames;
        this._data = data;
        this._displayName = WI.UIString("Recording");

        this._swizzle = null;
        this._actions = [new WI.RecordingInitialStateAction].concat(...this._frames.map((frame) => frame.actions));
        this._visualActionIndexes = [];
        this._source = null;

        this._processContext = null;
        this._processStates = [];
        this._processing = false;
    }

    static fromPayload(payload, frames)
    {
        if (typeof payload !== "object" || payload === null)
            return null;

        if (typeof payload.version !== "number") {
            WI.Recording.synthesizeError(WI.UIString("non-number %s").format(WI.unlocalizedString("version")));
            return null;
        }

        if (payload.version < 1 || payload.version > WI.Recording.Version) {
            WI.Recording.synthesizeError(WI.UIString("unsupported %s").format(WI.unlocalizedString("version")));
            return null;
        }

        if (parseInt(payload.version) !== payload.version) {
            WI.Recording.synthesizeWarning(WI.UIString("non-integer %s").format(WI.unlocalizedString("version")));
            payload.version = parseInt(payload.version);
        }

        let type = null;
        switch (payload.type) {
        case InspectorBackend.Enum.Recording.Type.Canvas2D:
            type = WI.Recording.Type.Canvas2D;
            break;
        case InspectorBackend.Enum.Recording.Type.OffscreenCanvas2D:
            type = WI.Recording.Type.OffscreenCanvas2D;
            break;
        case InspectorBackend.Enum.Recording.Type.CanvasBitmapRenderer:
            type = WI.Recording.Type.CanvasBitmapRenderer;
            break;
        case InspectorBackend.Enum.Recording.Type.OffscreenCanvasBitmapRenderer:
            type = WI.Recording.Type.OffscreenCanvasBitmapRenderer;
            break;
        case InspectorBackend.Enum.Recording.Type.CanvasWebGL:
            type = WI.Recording.Type.CanvasWebGL;
            break;
        case InspectorBackend.Enum.Recording.Type.OffscreenCanvasWebGL:
            type = WI.Recording.Type.OffscreenCanvasWebGL;
            break;
        case InspectorBackend.Enum.Recording.Type.CanvasWebGL2:
            type = WI.Recording.Type.CanvasWebGL2;
            break;
        case InspectorBackend.Enum.Recording.Type.OffscreenCanvasWebGL2:
            type = WI.Recording.Type.OffscreenCanvasWebGL2;
            break;
        default:
            WI.Recording.synthesizeWarning(WI.UIString("unknown %s \u0022%s\u0022").format(WI.unlocalizedString("type"), payload.type));
            type = String(payload.type);
            break;
        }

        if (typeof payload.initialState !== "object" || payload.initialState === null) {
            if ("initialState" in payload)
                WI.Recording.synthesizeWarning(WI.UIString("non-object %s").format(WI.unlocalizedString("initialState")));

            payload.initialState = {};
        }

        if (typeof payload.initialState.attributes !== "object" || payload.initialState.attributes === null) {
            if ("attributes" in payload.initialState)
                WI.Recording.synthesizeWarning(WI.UIString("non-object %s").format(WI.unlocalizedString("initialState.attributes")));

            payload.initialState.attributes = {};
        }

        if (!Array.isArray(payload.initialState.states) || payload.initialState.states.some((item) => typeof item !== "object" || item === null)) {
            if ("states" in payload.initialState)
                WI.Recording.synthesizeWarning(WI.UIString("non-array %s").format(WI.unlocalizedString("initialState.states")));

            payload.initialState.states = [];

            // COMPATIBILITY (iOS 12.0): Recording.InitialState.states did not exist yet
            if (!isEmptyObject(payload.initialState.attributes)) {
                let {width, height, ...state} = payload.initialState.attributes;
                if (!isEmptyObject(state))
                    payload.initialState.states.push(state);
            }
        }

        if (!Array.isArray(payload.initialState.parameters)) {
            if ("parameters" in payload.initialState)
                WI.Recording.synthesizeWarning(WI.UIString("non-array %s").format(WI.unlocalizedString("initialState.attributes")));

            payload.initialState.parameters = [];
        }

        if (typeof payload.initialState.content !== "string") {
            if ("content" in payload.initialState)
                WI.Recording.synthesizeWarning(WI.UIString("non-string %s").format(WI.unlocalizedString("initialState.content")));

            payload.initialState.content = "";
        }

        if (!Array.isArray(payload.frames)) {
            if ("frames" in payload)
                WI.Recording.synthesizeWarning(WI.UIString("non-array %s").format(WI.unlocalizedString("frames")));

            payload.frames = [];
        }

        if (!Array.isArray(payload.data)) {
            if ("data" in payload)
                WI.Recording.synthesizeWarning(WI.UIString("non-array %s").format(WI.unlocalizedString("data")));

            payload.data = [];
        }

        if (!frames)
            frames = payload.frames.map(WI.RecordingFrame.fromPayload)

        return new WI.Recording(payload.version, type, payload.initialState, frames, payload.data);
    }

    static displayNameForRecordingType(recordingType)
    {
        switch (recordingType) {
        case Recording.Type.Canvas2D:
            return WI.UIString("2D", "Recording Type Canvas 2D", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.OffscreenCanvas2D:
            return WI.UIString("Offscreen2D", "Recording Type Offscreen Canvas 2D", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.CanvasBitmapRenderer:
            return WI.UIString("Bitmap Renderer", "Recording Type Canvas Bitmap Renderer", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.OffscreenCanvasBitmapRenderer:
            return WI.UIString("Bitmap Renderer (Offscreen)", "Recording Type Offscreen Canvas Bitmap Renderer", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.CanvasWebGL:
            return WI.UIString("WebGL", "Recording Type Canvas WebGL", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.OffscreenCanvasWebGL:
            return WI.UIString("WebGL (Offscreen)", "Recording Type Offscreen Canvas WebGL", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.CanvasWebGL2:
            return WI.UIString("WebGL2", "Recording Type Canvas WebGL2", "A type of canvas recording in the Graphics Tab.");
        case Recording.Type.OffscreenCanvasWebGL2:
            return WI.UIString("WebGL2 (Offscreen)", "Recording Type Offscreen Canvas WebGL2", "A type of canvas recording in the Graphics Tab.");
        }

        console.assert(false, "Unknown recording type", recordingType);
        return null;
    }

    static displayNameForSwizzleType(swizzleType)
    {
        switch (swizzleType) {
        case WI.Recording.Swizzle.None:
            return WI.unlocalizedString("None");
        case WI.Recording.Swizzle.Number:
            return WI.unlocalizedString("Number");
        case WI.Recording.Swizzle.Boolean:
            return WI.unlocalizedString("Boolean");
        case WI.Recording.Swizzle.String:
            return WI.unlocalizedString("String");
        case WI.Recording.Swizzle.Array:
            return WI.unlocalizedString("Array");
        case WI.Recording.Swizzle.TypedArray:
            return WI.unlocalizedString("TypedArray");
        case WI.Recording.Swizzle.Image:
            return WI.unlocalizedString("Image");
        case WI.Recording.Swizzle.ImageData:
            return WI.unlocalizedString("ImageData");
        case WI.Recording.Swizzle.DOMMatrix:
            return WI.unlocalizedString("DOMMatrix");
        case WI.Recording.Swizzle.Path2D:
            return WI.unlocalizedString("Path2D");
        case WI.Recording.Swizzle.CanvasGradient:
            return WI.unlocalizedString("CanvasGradient");
        case WI.Recording.Swizzle.CanvasPattern:
            return WI.unlocalizedString("CanvasPattern");
        case WI.Recording.Swizzle.WebGLBuffer:
            return WI.unlocalizedString("WebGLBuffer");
        case WI.Recording.Swizzle.WebGLFramebuffer:
            return WI.unlocalizedString("WebGLFramebuffer");
        case WI.Recording.Swizzle.WebGLRenderbuffer:
            return WI.unlocalizedString("WebGLRenderbuffer");
        case WI.Recording.Swizzle.WebGLTexture:
            return WI.unlocalizedString("WebGLTexture");
        case WI.Recording.Swizzle.WebGLShader:
            return WI.unlocalizedString("WebGLShader");
        case WI.Recording.Swizzle.WebGLProgram:
            return WI.unlocalizedString("WebGLProgram");
        case WI.Recording.Swizzle.WebGLUniformLocation:
            return WI.unlocalizedString("WebGLUniformLocation");
        case WI.Recording.Swizzle.ImageBitmap:
            return WI.unlocalizedString("ImageBitmap");
        case WI.Recording.Swizzle.WebGLQuery:
            return WI.unlocalizedString("WebGLQuery");
        case WI.Recording.Swizzle.WebGLSampler:
            return WI.unlocalizedString("WebGLSampler");
        case WI.Recording.Swizzle.WebGLSync:
            return WI.unlocalizedString("WebGLSync");
        case WI.Recording.Swizzle.WebGLTransformFeedback:
            return WI.unlocalizedString("WebGLTransformFeedback");
        case WI.Recording.Swizzle.WebGLVertexArrayObject:
            return WI.unlocalizedString("WebGLVertexArrayObject");
        case WI.Recording.Swizzle.DOMPointInit:
            return WI.unlocalizedString("DOMPointInit");
        default:
            console.error("Unknown swizzle type", swizzleType);
            return null;
        }
    }

    static synthesizeWarning(message)
    {
        message = WI.UIString("Recording Warning: %s").format(message);

        if (window.InspectorTest) {
            console.warn(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Warning, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    static synthesizeError(message)
    {
        message = WI.UIString("Recording Error: %s").format(message);

        if (window.InspectorTest) {
            console.error(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    // Public

    get displayName() { return this._displayName; }
    get type() { return this._type; }
    get initialState() { return this._initialState; }
    get frames() { return this._frames; }
    get data() { return this._data; }
    get actions() { return this._actions; }
    get visualActionIndexes() { return this._visualActionIndexes; }

    get source() { return this._source; }
    set source(source) { this._source = source; }

    get processing() { return this._processing; }

    get ready()
    {
        return this._actions.lastValue.ready;
    }

    get isCanvas()
    {
        return this.isCanvas2D || this.isCanvasBitmapRender || this.isCanvasWebGL || this.isCanvasWebGL2;
    }

    get isCanvas2D()
    {
        return this._type === WI.Recording.Type.Canvas2D || this._type === WI.Recording.Type.OffscreenCanvas2D;
    }

    get isCanvasBitmapRender()
    {
        return this._type === WI.Recording.Type.CanvasBitmapRenderer || this._type === WI.Recording.Type.OffscreenCanvasBitmapRenderer;
    }

    get isCanvasWebGL()
    {
        return this._type === WI.Recording.Type.CanvasWebGL || this._type === WI.Recording.Type.OffscreenCanvasWebGL;
    }

    get isCanvasWebGL2()
    {
        return this._type === WI.Recording.Type.CanvasWebGL2 || this._type === WI.Recording.Type.OffscreenCanvasWebGL2;
    }

    startProcessing()
    {
        console.assert(!this._processing, "Cannot start an already started process().");
        console.assert(!this.ready, "Cannot start a completed process().");
        if (this._processing || this.ready)
            return;

        this._processing = true;

        this._process();
    }

    stopProcessing()
    {
        console.assert(this._processing, "Cannot stop an already stopped process().");
        console.assert(!this.ready, "Cannot stop a completed process().");
        if (!this._processing || this.ready)
            return;

        this._processing = false;
    }

    createDisplayName(suggestedName)
    {
        let recordingNameSet;
        if (this._source) {
            recordingNameSet = this._source[WI.Recording.CanvasRecordingNamesSymbol];
            if (!recordingNameSet)
                this._source[WI.Recording.CanvasRecordingNamesSymbol] = recordingNameSet = new Set;
        } else
            recordingNameSet = WI.Recording._importedRecordingNameSet;

        let name;
        if (suggestedName) {
            name = suggestedName;
            let duplicateNumber = 2;
            while (recordingNameSet.has(name))
                name = `${suggestedName} (${duplicateNumber++})`;
        } else {
            let recordingNumber = 1;
            do {
                name = WI.UIString("Recording %d").format(recordingNumber++);
            } while (recordingNameSet.has(name));
        }

        recordingNameSet.add(name);
        this._displayName = name;
    }

    is2D()
    {
        return WI.Recording.is2D(this._type);
    }

    async swizzle(index, type)
    {
        if (!this._swizzle)
            this._swizzle = {};

        if (typeof this._swizzle[index] !== "object")
            this._swizzle[index] = {};

        if (type === WI.Recording.Swizzle.Number)
            return parseFloat(index);

        if (type === WI.Recording.Swizzle.Boolean)
            return !!index;

        if (type === WI.Recording.Swizzle.Array)
            return Array.isArray(index) ? index : [];

        if (type === WI.Recording.Swizzle.DOMMatrix)
            return new DOMMatrix(index);

        // FIXME: <https://webkit.org/b/176009> Web Inspector: send data for WebGL objects during a recording instead of a placeholder string
        if (type === WI.Recording.Swizzle.TypedArray
            || type === WI.Recording.Swizzle.WebGLBuffer
            || type === WI.Recording.Swizzle.WebGLFramebuffer
            || type === WI.Recording.Swizzle.WebGLRenderbuffer
            || type === WI.Recording.Swizzle.WebGLTexture
            || type === WI.Recording.Swizzle.WebGLShader
            || type === WI.Recording.Swizzle.WebGLProgram
            || type === WI.Recording.Swizzle.WebGLUniformLocation
            || type === WI.Recording.Swizzle.WebGLQuery
            || type === WI.Recording.Swizzle.WebGLSampler
            || type === WI.Recording.Swizzle.WebGLSync
            || type === WI.Recording.Swizzle.WebGLTransformFeedback
            || type === WI.Recording.Swizzle.WebGLVertexArrayObject) {
            return index;
        }

        if (!(type in this._swizzle[index])) {
            try {
                let data = this._data[index];
                switch (type) {
                case WI.Recording.Swizzle.None:
                    this._swizzle[index][type] = data;
                    break;

                case WI.Recording.Swizzle.String:
                    if (Array.isArray(data))
                        this._swizzle[index][type] = await Promise.all(data.map((item) => this.swizzle(item, WI.Recording.Swizzle.String)));
                    else
                        this._swizzle[index][type] = String(data);
                    break;

                case WI.Recording.Swizzle.Image:
                    this._swizzle[index][type] = await WI.ImageUtilities.promisifyLoad(data);
                    this._swizzle[index][type].__data = data;
                    break;

                case WI.Recording.Swizzle.ImageData: {
                    let [object, width, height] = await Promise.all([
                        this.swizzle(data[0], WI.Recording.Swizzle.Array),
                        this.swizzle(data[1], WI.Recording.Swizzle.Number),
                        this.swizzle(data[2], WI.Recording.Swizzle.Number),
                    ]);

                    object = await Promise.all(object.map((item) => this.swizzle(item, WI.Recording.Swizzle.Number)));

                    this._swizzle[index][type] = new ImageData(new Uint8ClampedArray(object), width, height);
                    this._swizzle[index][type].__data = {data: object, width, height};
                    break;
                }

                case WI.Recording.Swizzle.Path2D:
                    this._swizzle[index][type] = new Path2D(data);
                    this._swizzle[index][type].__data = data;
                    break;

                case WI.Recording.Swizzle.CanvasGradient: {
                    let [gradientType, points] = await Promise.all([
                        this.swizzle(data[0], WI.Recording.Swizzle.String),
                        this.swizzle(data[1], WI.Recording.Swizzle.Array),
                    ]);

                    points = await Promise.all(points.map((item) => this.swizzle(item, WI.Recording.Swizzle.Number)));

                    WI.ImageUtilities.scratchCanvasContext2D((context) => {
                        if (gradientType == "radial-gradient")
                            this._swizzle[index][type] = context.createRadialGradient(...points);
                        else if (gradientType == "linear-gradient")
                            this._swizzle[index][type] = context.createLinearGradient(...points);
                        else
                            this._swizzle[index][type] = context.createConicGradient(...points);
                    });

                    let stops = [];
                    for (let stop of data[2]) {
                        let [offset, color] = await Promise.all([
                            this.swizzle(stop[0], WI.Recording.Swizzle.Number),
                            this.swizzle(stop[1], WI.Recording.Swizzle.String),
                        ]);
                        this._swizzle[index][type].addColorStop(offset, color);

                        stops.push({offset, color});
                    }

                    this._swizzle[index][type].__data = {type: gradientType, points, stops};
                    break;
                }

                case WI.Recording.Swizzle.CanvasPattern: {
                    let [image, repeat] = await Promise.all([
                        this.swizzle(data[0], WI.Recording.Swizzle.Image),
                        this.swizzle(data[1], WI.Recording.Swizzle.String),
                    ]);

                    WI.ImageUtilities.scratchCanvasContext2D((context) => {
                        this._swizzle[index][type] = context.createPattern(image, repeat);
                        this._swizzle[index][type].__image = image;
                    });

                    this._swizzle[index][type].__data = {image: image.__data, repeat};
                    break;
                }

                case WI.Recording.Swizzle.ImageBitmap: {
                    let image = await this.swizzle(index, WI.Recording.Swizzle.Image);
                    this._swizzle[index][type] = await createImageBitmap(image);
                    this._swizzle[index][type].__data = data;
                    break;
                }

                case WI.Recording.Swizzle.CallStack: {
                    let array = await this.swizzle(data, WI.Recording.Swizzle.Array);
                    if (!isNaN(array[0])) {
                        // COMPATIBILITY (macOS 13.0, iOS 16.0): "stackTrace" was sent as an array of call frames instead of a single call stack
                        array = [array];
                    }

                    let promises = [];

                    // callFrames
                    promises.push(Promise.all(array[0].map((item) => this.swizzle(item, WI.Recording.Swizzle.CallFramePayload))));

                    // topCallFrameIsBoundary
                    if (array.length > 1)
                        promises.push(this.swizzle(array[1], WI.Recording.Swizzle.Boolean));

                    // truncated
                    if (array.length > 2)
                        promises.push(this.swizzle(array[2], WI.Recording.Swizzle.Boolean));

                    // parentStackTrace
                    if (array.length > 3)
                        promises.push(this.swizzle(array[3], WI.Recording.Swizzle.StackTrace));

                    let [callFrames, topCallFrameIsBoundary, truncated, parentStackTrace] = await Promise.all(promises);
                    this._swizzle[index][type] = WI.StackTrace.fromPayload(WI.assumingMainTarget(), {callFrames, topCallFrameIsBoundary, truncated, parentStackTrace});
                    break;
                }

                case WI.Recording.Swizzle.CallFramePayload: {
                    let array = await this.swizzle(data, WI.Recording.Swizzle.Array);
                    let [functionName, url] = await Promise.all([
                        this.swizzle(array[0], WI.Recording.Swizzle.String),
                        this.swizzle(array[1], WI.Recording.Swizzle.String),
                    ]);
                    this._swizzle[index][type] = {
                        functionName,
                        url,
                        lineNumber: array[2],
                        columnNumber: array[3],
                    };
                    break;
                }
                }
            } catch { }
        }

        return this._swizzle[index][type];
    }

    createContext()
    {
        let createCanvasContext = (type) => {
            let canvas = document.createElement("canvas");
            if ("width" in this._initialState.attributes)
                canvas.width = this._initialState.attributes.width;
            if ("height" in this._initialState.attributes)
                canvas.height = this._initialState.attributes.height;
            return canvas.getContext(type, ...this._initialState.parameters);
        };
        let createOffscreenCanvasContext = (type) => {
            let width = 1;
            let height = 1;
            if ("width" in this._initialState.attributes)
                width = this._initialState.attributes.width;
            if ("height" in this._initialState.attributes)
                height = this._initialState.attributes.height;
            let canvas = new OffscreenCanvas(width, height);
            return canvas.getContext(type, ...this._initialState.parameters);
        };

        switch (this._type) {
        case WI.Recording.Type.Canvas2D:
            return createCanvasContext("2d");
        case WI.Recording.Type.OffscreenCanvas2D:
            return createOffscreenCanvasContext("2d");
        case WI.Recording.Type.CanvasBitmapRenderer:
            return createCanvasContext("bitmaprenderer");
        case WI.Recording.Type.OffscreenCanvasBitmapRenderer:
            return createOffscreenCanvasContext("bitmaprenderer");
        case WI.Recording.Type.CanvasWebGL:
            return createCanvasContext("webgl");
        case WI.Recording.Type.OffscreenCanvasWebGL:
            return createOffscreenCanvasContext("webgl");
        case WI.Recording.Type.CanvasWebGL2:
            return createCanvasContext("webgl2");
        case WI.Recording.Type.OffscreenCanvasWebGL2:
            return createOffscreenCanvasContext("webgl2");
        }

        console.error("Unknown recording type", this._type);
        return null;
    }

    toJSON()
    {
        let initialState = {};
        if (!isEmptyObject(this._initialState.attributes))
            initialState.attributes = this._initialState.attributes;
        if (this._initialState.states.length)
            initialState.states = this._initialState.states;
        if (this._initialState.parameters.length)
            initialState.parameters = this._initialState.parameters;
        if (this._initialState.content && this._initialState.content.length)
            initialState.content = this._initialState.content;

        return {
            version: this._version,
            type: this._type,
            initialState,
            frames: this._frames.map((frame) => frame.toJSON()),
            data: this._data,
        };
    }

    toHTML()
    {
        console.assert(this.isCanvas2D);
        console.assert(this.ready);

        let lines = [];
        let objects = [];

        function processObject(object) {
            objects.push({object, index: objects.length});
            return `objects[${objects.length - 1}]`;
        }

        function processValue(value) {
            if (typeof value === "object" && !Array.isArray(value))
                return processObject(value);
            return JSON.stringify(value);
        }

        function escapeHTML(s) {
            return s.replace(/[^0-9A-Za-z ]/g, (c) => {
                return `&#${c.charCodeAt(0)};`;
            });
        }

        lines.push(`<!DOCTYPE html>`);
        lines.push(`<head>`);
        lines.push(`<title>${escapeHTML(this._displayName)}</title>`);
        lines.push(`<style>`);
        lines.push(`    body {`);
        lines.push(`        margin: 0;`);
        lines.push(`    }`);
        lines.push(`    canvas {`);
        lines.push(`        max-width: calc(100% - 40px);`);
        lines.push(`        max-height: calc(100% - 40px);`);
        lines.push(`        padding: 20px;`);
        lines.push(`    }`);
        lines.push(`</style>`);
        lines.push(`</head>`);
        lines.push(`<body>`);
        lines.push(`<script>`);
        lines.push(`"use strict";`);

        lines.push(``);

        lines.push(`let promises = [];`);
        lines.push(`let objects = {};`);

        lines.push(``);

        lines.push(`let canvas = document.body.appendChild(document.createElement("canvas"));`);
        for (let [attribute, value] of Object.entries(this._initialState.attributes))
            lines.push(`canvas.${attribute} = ${JSON.stringify(value)};`);

        lines.push(``);

        let parametersString = this._initialState.parameters.map(processValue).join(`, `);
        lines.push(`let context = canvas.getContext("2d"${parametersString ? ", " + parametersString : ""});`);

        lines.push(``);

        lines.push(`let frames = [`);

        lines.push(`    function initialState() {`);
        if (this._initialState.content) {
            let image = new Image;
            image.__data = this._initialState.content;
            lines.push(`        context.drawImage(${processObject(image)}, 0, 0);`);
            lines.push(``);
        }
        for (let state of this._actions[0].states) {
            for (let [name, value] of state) {
                if (name === "getPath" || name === "currentX" || name === "currentY")
                    continue;

                let contextString = `context`;
                if (name === "setPath") {
                    lines.push(`        if (${JSON.stringify(name)} in context)`);
                    contextString = `    ` + contextString;
                }

                let callString = ``;
                if (WI.RecordingAction.isFunctionForType(this._type, name))
                    callString = `(` + value.map(processValue).join(`, `) + `)`;
                else
                    callString = ` = ${processValue(value)}`;

                lines.push(`        ${contextString}.${name}${callString};`);
            }

            if (state !== this._actions[0].states.lastValue) {
                lines.push(`        context.save();`);
                lines.push(``);
            }
        }
        lines.push(`    },`);

        lines.push(`    function startRecording() {`);
        lines.push(`        if (typeof console.record === "function")`);
        lines.push(`            console.record(context, {name: ${JSON.stringify(this._displayName)}});`);
        lines.push(`    },`);

        for (let i = 0; i < this._frames.length; ++i) {
            lines.push(`    function frame${i + 1}() {`);

            for (let action of this._frames[i].actions) {
                let contextString = `context`;
                if (action.contextReplacer)
                    contextString += `.${action.contextReplacer}`;

                if (!action.valid)
                    contextString = `// ` + contextString;

                let callString = ``;
                if (action.isFunction)
                    callString += `(` + action.parameters.map(processValue).join(`, `) + `)`;
                else if (!action.isGetter)
                    callString += ` = ` + processValue(action.parameters[0]);

                lines.push(`        ${contextString}.${action.name}${callString};`);
            }

            lines.push(`    },`);
        }

        lines.push(`    function stopRecording() {`);
        lines.push(`        if (typeof console.recordEnd === "function")`);
        lines.push(`            console.recordEnd(context);`);
        lines.push(`    },`);

        lines.push(`];`);

        lines.push(``);

        if (objects.length) {
            if (objects.some(({object}) => object instanceof CanvasGradient)) {
                lines.push(`function rebuildCanvasGradient(key, data) {`);
                lines.push(`    let gradient = null;`);
                lines.push(`    if (data.type === "radial-gradient")`);
                lines.push(`        gradient = context.createRadialGradient(data.points[0], data.points[1], data.points[2], data.points[3], data.points[4], data.points[5]);`);
                lines.push(`    else if (data.type === "linear-gradient")`);
                lines.push(`        gradient = context.createLinearGradient(data.points[0], data.points[1], data.points[2], data.points[3]);`);
                lines.push(`    else`);
                lines.push(`        gradient = context.createConicGradient(data.points[0], data.points[1], data.points[2]);`);
                lines.push(`    for (let stop of data.stops)`);
                lines.push(`        gradient.addColorStop(stop.offset, stop.color);`);
                lines.push(`    objects[key] = gradient;`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof CanvasPattern)) {
                lines.push(`function rebuildCanvasPattern(key, data) {`);
                lines.push(`    promises.push(new Promise(function(resolve, reject) {`);
                lines.push(`        let image = new Image;`);
                lines.push(`        function resolveWithImage(event) {`);
                lines.push(`            objects[key] = context.createPattern(image, data.repeat);`);
                lines.push(`            resolve();`);
                lines.push(`        }`);
                lines.push(`        image.addEventListener("load", resolveWithImage);`);
                lines.push(`        image.addEventListener("error", resolveWithImage);`);
                lines.push(`        image.src = data.image;`);
                lines.push(`    }));`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof DOMMatrix)) {
                lines.push(`function rebuildDOMMatrix(key, data) {`);
                lines.push(`    objects[key] = new DOMMatrix(data);`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof Image)) {
                lines.push(`function rebuildImage(key, data) {`);
                lines.push(`    promises.push(new Promise(function(resolve, reject) {`);
                lines.push(`        let image = new Image;`);
                lines.push(`        function resolveWithImage(event) {`);
                lines.push(`            objects[key] = image;`);
                lines.push(`            resolve();`);
                lines.push(`        }`);
                lines.push(`        image.addEventListener("load", resolveWithImage);`);
                lines.push(`        image.addEventListener("error", resolveWithImage);`);
                lines.push(`        image.src = data;`);
                lines.push(`    }));`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof ImageBitmap)) {
                lines.push(`function rebuildImageBitmap(key, data) {`);
                lines.push(`    promises.push(new Promise(function(resolve, reject) {`);
                lines.push(`        let image = new Image;`);
                lines.push(`        function resolveWithImage(event) {`);
                lines.push(`            createImageBitmap(image).then(function(imageBitmap) {`);
                lines.push(`                objects[key] = imageBitmap;`);
                lines.push(`                resolve();`);
                lines.push(`            });`);
                lines.push(`        }`);
                lines.push(`        image.addEventListener("load", resolveWithImage);`);
                lines.push(`        image.addEventListener("error", resolveWithImage);`);
                lines.push(`        image.src = data;`);
                lines.push(`    }));`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof ImageData)) {
                lines.push(`function rebuildImageData(key, data) {`);
                lines.push(`    objects[key] = new ImageData(new Uint8ClampedArray(data.data), parseInt(data.width), parseInt(data.height));`);
                lines.push(`}`);
            }

            if (objects.some(({object}) => object instanceof Path2D)) {
                lines.push(`function rebuildPath2D(key, data) {`);
                lines.push(`    objects[key] = new Path2D(data);`);
                lines.push(`}`);
            }

            lines.push(``);

            for (let {object, index} of objects) {
                if (object instanceof CanvasGradient) {
                    lines.push(`rebuildCanvasGradient(${index}, ${JSON.stringify(object.__data)});`);
                    continue;
                }

                if (object instanceof CanvasPattern) {
                    lines.push(`rebuildCanvasPattern(${index}, ${JSON.stringify(object.__data)});`);
                    continue;
                }

                if (object instanceof DOMMatrix) {
                    lines.push(`rebuildDOMMatrix(${index}, ${JSON.stringify(object.toString())});`)
                    continue;
                }

                if (object instanceof Image) {
                    lines.push(`rebuildImage(${index}, ${JSON.stringify(object.__data)});`)
                    continue;
                }

                if (object instanceof ImageBitmap) {
                    lines.push(`rebuildImageBitmap(${index}, ${JSON.stringify(object.__data)});`)
                    continue;
                }

                if (object instanceof ImageData) {
                    lines.push(`rebuildImageData(${index}, ${JSON.stringify(object.__data)});`);
                    continue;
                }

                if (object instanceof Path2D) {
                    lines.push(`rebuildPath2D(${index}, ${JSON.stringify(object.__data || "")});`)
                    continue;
                }
            }

            lines.push(``);
        }

        lines.push(`Promise.all(promises).then(function() {`);
        lines.push(`    window.requestAnimationFrame(function executeFrame() {`);
        lines.push(`        frames.shift()();`);
        lines.push(`        if (frames.length)`);
        lines.push(`            window.requestAnimationFrame(executeFrame);`);
        lines.push(`    });`);
        lines.push(`});`);

        lines.push(`</script>`);
        lines.push(`</body>`);
        return lines.join(`\n`);
    }

    // Private

    async _process()
    {
        if (!this._processContext) {
            this._processContext = this.createContext();

            if (this.isCanvas2D) {
                let initialContent = await WI.ImageUtilities.promisifyLoad(this._initialState.content);
                this._processContext.drawImage(initialContent, 0, 0);

                for (let initialState of this._initialState.states) {
                    let state = await WI.RecordingState.swizzleInitialState(this, initialState);
                    state.apply(this._type, this._processContext);

                    // The last state represents the current state, which should not be saved.
                    if (initialState !== this._initialState.states.lastValue) {
                        this._processContext.save();
                        this._processStates.push(WI.RecordingState.fromCanvasContext2D(this._processContext));
                    }
                }
            }
        }

        // The first action is always a WI.RecordingInitialStateAction, which doesn't need to swizzle().
        // Since it is not associated with a WI.RecordingFrame, it has to manually process().
        if (!this._actions[0].ready) {
            this._actions[0].process(this, this._processContext, this._processStates);
            this.dispatchEventToListeners(WI.Recording.Event.ProcessedAction, {action: this._actions[0], index: 0});
        }

        const workInterval = 10;
        let startTime = Date.now();

        let cumulativeActionIndex = 0;
        let lastAction = this._actions[cumulativeActionIndex];
        for (let frameIndex = 0; frameIndex < this._frames.length; ++frameIndex) {
            let frame = this._frames[frameIndex];

            if (frame.actions.lastValue.ready) {
                cumulativeActionIndex += frame.actions.length;
                lastAction = frame.actions.lastValue;
                continue;
            }

            for (let actionIndex = 0; actionIndex < frame.actions.length; ++actionIndex) {
                ++cumulativeActionIndex;

                let action = frame.actions[actionIndex];
                if (action.ready) {
                    lastAction = action;
                    continue;
                }

                await action.swizzle(this);

                action.process(this, this._processContext, this._processStates, {lastAction});

                if (action.isVisual)
                    this._visualActionIndexes.push(cumulativeActionIndex);

                if (!actionIndex)
                    this.dispatchEventToListeners(WI.Recording.Event.StartProcessingFrame, {frame, index: frameIndex});

                this.dispatchEventToListeners(WI.Recording.Event.ProcessedAction, {action, index: cumulativeActionIndex});

                if (Date.now() - startTime > workInterval) {
                    await Promise.delay(); // yield

                    startTime = Date.now();
                }

                lastAction = action;

                if (!this._processing)
                    return;
            }

            if (!this._processing)
                return;
        }

        this._swizzle = null;
        this._processContext = null;
        this._processing = false;
    }
};

// Keep this in sync with Inspector::Protocol::Recording::VERSION.
WI.Recording.Version = 2;

WI.Recording.Event = {
    ProcessedAction: "recording-processed-action",
    StartProcessingFrame: "recording-start-processing-frame",
};

WI.Recording._importedRecordingNameSet = new Set;

WI.Recording.CanvasRecordingNamesSymbol = Symbol("canvas-recording-names");

WI.Recording.Type = {
    Canvas2D: "canvas-2d",
    OffscreenCanvas2D: "offscreen-canvas-2d",
    CanvasBitmapRenderer: "canvas-bitmaprenderer",
    OffscreenCanvasBitmapRenderer: "offscreen-canvas-bitmaprenderer",
    CanvasWebGL: "canvas-webgl",
    OffscreenCanvasWebGL: "offscreen-canvas-webgl",
    CanvasWebGL2: "canvas-webgl2",
    OffscreenCanvasWebGL2: "offscreen-canvas-webgl2",
};

// Keep this in sync with WebCore::RecordingSwizzleType.
WI.Recording.Swizzle = {
    None: 0,
    Number: 1,
    Boolean: 2,
    String: 3,
    Array: 4,
    TypedArray: 5,
    Image: 6,
    ImageData: 7,
    DOMMatrix: 8,
    Path2D: 9,
    CanvasGradient: 10,
    CanvasPattern: 11,
    WebGLBuffer: 12,
    WebGLFramebuffer: 13,
    WebGLRenderbuffer: 14,
    WebGLTexture: 15,
    WebGLShader: 16,
    WebGLProgram: 17,
    WebGLUniformLocation: 18,
    ImageBitmap: 19,
    WebGLQuery: 20,
    WebGLSampler: 21,
    WebGLSync: 22,
    WebGLTransformFeedback: 23,
    WebGLVertexArrayObject: 24,

    // Special frontend-only swizzle types.
    CallStack: Symbol("CallStack"),
    CallFramePayload: Symbol("CallFramePayload"),
};
