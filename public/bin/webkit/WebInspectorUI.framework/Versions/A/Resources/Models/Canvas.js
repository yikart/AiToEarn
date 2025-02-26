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

WI.Canvas = class Canvas extends WI.Object
{
    constructor(target, identifier, contextType, size, {domNode, cssCanvasName, contextAttributes, memoryCost, stackTrace} = {})
    {
        super();

        console.assert(target instanceof WI.Target, target);
        console.assert(identifier);
        console.assert(contextType);
        console.assert(!size || size instanceof WI.Size, size);
        console.assert(!stackTrace || stackTrace instanceof WI.StackTrace, stackTrace);

        this._target = target;
        this._identifier = identifier;
        this._contextType = contextType;
        this._size = size || null;
        this._domNode = domNode || null;
        this._cssCanvasName = cssCanvasName || "";
        this._contextAttributes = contextAttributes || {};
        this._extensions = new Set;
        this._memoryCost = memoryCost || NaN;
        this._stackTrace = stackTrace || null;

        this._clientNodes = null;
        this._shaderProgramCollection = new WI.ShaderProgramCollection;
        this._recordingCollection = new WI.RecordingCollection;

        this._nextShaderProgramDisplayNumber = null;

        this._requestNodePromise = null;

        this._recordingState = WI.Canvas.RecordingState.Inactive;
        this._recordingFrames = [];
        this._recordingBufferUsed = 0;

        // COMPATIBILITY (macOS 14.2, iOS 17.2): `Canvas.canvasSizeChanged` did not exist yet.
        if (!InspectorBackend.hasEvent("Canvas.canvasSizeChanged")) {
            console.assert(!size);

            this.requestNode().then((node) => {
                if (node) {
                    node.addEventListener(WI.DOMNode.Event.AttributeModified, this._calculateSize, this);
                    node.addEventListener(WI.DOMNode.Event.AttributeRemoved, this._calculateSize, this);
                }
            });
            this._calculateSize();
        }
    }

    // Static

    static fromPayload(target, payload)
    {
        let contextType = null;
        switch (payload.contextType) {
        case InspectorBackend.Enum.Canvas.ContextType.Canvas2D:
            contextType = WI.Canvas.ContextType.Canvas2D;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.OffscreenCanvas2D:
            contextType = WI.Canvas.ContextType.OffscreenCanvas2D;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.BitmapRenderer:
            contextType = WI.Canvas.ContextType.BitmapRenderer;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.OffscreenBitmapRenderer:
            contextType = WI.Canvas.ContextType.OffscreenBitmapRenderer;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.WebGL:
            contextType = WI.Canvas.ContextType.WebGL;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.OffscreenWebGL:
            contextType = WI.Canvas.ContextType.OffscreenWebGL;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.WebGL2:
            contextType = WI.Canvas.ContextType.WebGL2;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.OffscreenWebGL2:
            contextType = WI.Canvas.ContextType.OffscreenWebGL2;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.WebGPU:
            contextType = WI.Canvas.ContextType.WebGPU;
            break;
        case InspectorBackend.Enum.Canvas.ContextType.WebMetal:
            contextType = WI.Canvas.ContextType.WebMetal;
            break;
        default:
            console.error("Invalid canvas context type", payload.contextType);
        }

        // COMPATIBILITY (macOS 14.2, iOS 17.2): `width` and `height` did not exist yet.
        let size = ("width" in payload && "height" in payload) ? new WI.Size(payload.width, payload.height) : null;

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `backtrace` was renamed to `stackTrace`.
        if (payload.backtrace)
            payload.stackTrace = {callFrames: payload.backtrace};

        return new WI.Canvas(target, payload.canvasId, contextType, size, {
            height: payload.height,
            domNode: payload.nodeId ? WI.domManager.nodeForId(payload.nodeId) : null,
            cssCanvasName: payload.cssCanvasName,
            contextAttributes: payload.contextAttributes,
            memoryCost: payload.memoryCost,
            stackTrace: WI.StackTrace.fromPayload(target, payload.stackTrace),
        });
    }

    static displayNameForContextType(contextType)
    {
        switch (contextType) {
        case WI.Canvas.ContextType.Canvas2D:
            return WI.UIString("2D", "2D @ Canvas Context Type", "2D is a type of rendering context associated with a <canvas> element.");
        case WI.Canvas.ContextType.OffscreenCanvas2D:
            return WI.UIString("Offscreen2D", "2D @ Offscreen Canvas Context Type", "2D is a type of rendering context associated with a OffscreenCanvas.");
        case WI.Canvas.ContextType.BitmapRenderer:
            return WI.UIString("Bitmap Renderer", "Bitmap Renderer @ Canvas Context Type", "Bitmap Renderer is a type of rendering context associated with a <canvas> element.");
        case WI.Canvas.ContextType.OffscreenBitmapRenderer:
            return WI.UIString("Bitmap Renderer (Offscreen)", "Bitmap Renderer @ Offscreen Canvas Context Type", "Bitmap Renderer is a type of rendering context associated with a OffscreenCanvas.");
        case WI.Canvas.ContextType.WebGL:
            return WI.UIString("WebGL", "WebGL @ Canvas Context Type", "WebGL is a type of rendering context associated with a <canvas> element.");
        case WI.Canvas.ContextType.OffscreenWebGL:
            return WI.UIString("WebGL (Offscreen)", "WebGL @ Offscreen Canvas Context Type", "WebGL is a type of rendering context associated with a OffscreenCanvas.");
        case WI.Canvas.ContextType.WebGL2:
            return WI.UIString("WebGL2", "WebGL2 @ Canvas Context Type", "WebGL2 is a type of rendering context associated with a <canvas> element.");
        case WI.Canvas.ContextType.OffscreenWebGL2:
            return WI.UIString("WebGL2 (Offscreen)", "WebGL2 @ Offscreen Canvas Context Type", "WebGL2 is a type of rendering context associated with a OffscreenCanvas.");
        case WI.Canvas.ContextType.WebGPU:
            return WI.UIString("WebGPU", "WebGPU @ Canvas Context Type", "WebGPU is a type of rendering context associated with a <canvas> element.");
        case WI.Canvas.ContextType.WebMetal:
            return WI.UIString("WebMetal", "WebMetal @ Canvas Context Type", "WebMetal is a type of rendering context associated with a <canvas> element.");
        }

        console.assert(false, "Unknown canvas context type", contextType);
        return null;
    }

    static displayNameForColorSpace(colorSpace)
    {
        switch(colorSpace) {
        case WI.Canvas.ColorSpace.SRGB:
            return WI.UIString("sRGB", "sRGB @ Color Space", "Label for a canvas that uses the sRGB color space.");
        case WI.Canvas.ColorSpace.DisplayP3:
            return WI.UIString("Display P3", "Display P3 @ Color Space", "Label for a canvas that uses the Display P3 color space.");
        }

        console.assert(false, "Unknown canvas color space", colorSpace);
        return null;
    }

    static resetUniqueDisplayNameNumbers()
    {
        Canvas._nextContextUniqueDisplayNameNumber = 1;
        Canvas._nextDeviceUniqueDisplayNameNumber = 1;
    }

    static supportsRequestContentForContextType(contextType)
    {
        switch (contextType) {
        case Canvas.ContextType.WebGPU:
        case Canvas.ContextType.WebMetal:
            return false;
        }
        return true;
    }

    // Public

    get target() { return this._target; }
    get identifier() { return this._identifier; }
    get contextType() { return this._contextType; }
    get size() { return this._size; }
    get memoryCost() { return this._memoryCost; }
    get cssCanvasName() { return this._cssCanvasName; }
    get contextAttributes() { return this._contextAttributes; }
    get extensions() { return this._extensions; }
    get stackTrace() { return this._stackTrace; }
    get shaderProgramCollection() { return this._shaderProgramCollection; }
    get recordingCollection() { return this._recordingCollection; }
    get recordingFrameCount() { return this._recordingFrames.length; }
    get recordingBufferUsed() { return this._recordingBufferUsed; }

    get supportsRecording()
    {
        switch (this._contextType) {
        case WI.Canvas.ContextType.Canvas2D:
        case WI.Canvas.ContextType.OffscreenCanvas2D:
        case WI.Canvas.ContextType.BitmapRenderer:
        case WI.Canvas.ContextType.OffscreenBitmapRenderer:
        case WI.Canvas.ContextType.WebGL:
        case WI.Canvas.ContextType.OffscreenWebGL:
        case WI.Canvas.ContextType.WebGL2:
        case WI.Canvas.ContextType.OffscreenWebGL2:
            return true;

        case WI.Canvas.ContextType.WebGPU:
        case WI.Canvas.ContextType.WebMetal:
            return false;
        }

        console.assert(false, "not reached");
        return false;
    }

    get recordingActive()
    {
        return this._recordingState !== WI.Canvas.RecordingState.Inactive;
    }

    get displayName()
    {
        if (this._cssCanvasName)
            return WI.UIString("CSS canvas \u201C%s\u201D").format(this._cssCanvasName);

        if (this._domNode) {
            let idSelector = this._domNode.escapedIdSelector;
            if (idSelector)
                return WI.UIString("Canvas %s").format(idSelector);
        }

        if (this._contextType === Canvas.ContextType.WebGPU) {
            if (!this._uniqueDisplayNameNumber)
                this._uniqueDisplayNameNumber = Canvas._nextDeviceUniqueDisplayNameNumber++;
            return WI.UIString("Device %d").format(this._uniqueDisplayNameNumber);
        }

        if (!this._uniqueDisplayNameNumber)
            this._uniqueDisplayNameNumber = Canvas._nextContextUniqueDisplayNameNumber++;
        return WI.UIString("Canvas %d").format(this._uniqueDisplayNameNumber);
    }

    get is2D()
    {
        return this._contextType === Canvas.ContextType.Canvas2D || this._contextType === Canvas.ContextType.OffscreenCanvas2D;
    }

    get isBitmapRender()
    {
        return this._contextType === Canvas.ContextType.BitmapRenderer || this._contextType === Canvas.ContextType.OffscreenBitmapRenderer;
    }

    get isWebGL()
    {
        return this._contextType === Canvas.ContextType.WebGL || this._contextType === Canvas.ContextType.OffscreenWebGL;
    }

    get isWebGL2()
    {
        return this._contextType === Canvas.ContextType.WebGL2 || this._contextType === Canvas.ContextType.OffscreenWebGL2;
    }

    requestNode()
    {
        if (!this._requestNodePromise) {
            this._requestNodePromise = new Promise((resolve, reject) => {
                WI.domManager.ensureDocument();

                if (!this._target.hasCommand("Canvas.requestNode")) {
                    resolve(null);
                    return;
                }

                this._target.CanvasAgent.requestNode(this._identifier, (error, nodeId) => {
                    if (error) {
                        resolve(null);
                        return;
                    }

                    this._domNode = WI.domManager.nodeForId(nodeId);
                    if (!this._domNode) {
                        resolve(null);
                        return;
                    }

                    resolve(this._domNode);
                });
            });
        }
        return this._requestNodePromise;
    }

    requestContent()
    {
        if (!Canvas.supportsRequestContentForContextType(this._contextType))
            return Promise.resolve(null);

        return this._target.CanvasAgent.requestContent(this._identifier).then((result) => result.content).catch((error) => console.error(error));
    }

    requestClientNodes(callback)
    {
        if (this._clientNodes) {
            callback(this._clientNodes);
            return;
        }

        WI.domManager.ensureDocument();

        let wrappedCallback = (error, clientNodeIds) => {
            if (error) {
                callback([]);
                return;
            }

            clientNodeIds = Array.isArray(clientNodeIds) ? clientNodeIds : [];
            this._clientNodes = clientNodeIds.map((clientNodeId) => WI.domManager.nodeForId(clientNodeId));
            callback(this._clientNodes);
        };

        if (this._target.hasCommand("Canvas.requestClientNodes")) {
            this._target.CanvasAgent.requestClientNodes(this._identifier, wrappedCallback);
            return;
        }

        // COMPATIBILITY (iOS 13): Canvas.requestCSSCanvasClientNodes was renamed to Canvas.requestClientNodes.
        if (this._target.hasCommand("Canvas.requestCSSCanvasClientNodes")) {
            this._target.CanvasAgent.requestCSSCanvasClientNodes(this._identifier, wrappedCallback);
            return;
        }

        wrappedCallback(null, []);
    }

    startRecording(singleFrame)
    {
        let handleStartRecording = (error) => {
            if (error) {
                console.error(error);
                return;
            }

            this._recordingState = WI.Canvas.RecordingState.ActiveFrontend;

            // COMPATIBILITY (iOS 12.1): Canvas.recordingStarted did not exist yet
            if (this._target.hasEvent("Canvas.recordingStarted"))
                return;

            this._recordingFrames = [];
            this._recordingBufferUsed = 0;

            this.dispatchEventToListeners(WI.Canvas.Event.RecordingStarted);
        };

        // COMPATIBILITY (iOS 12.1): `frameCount` did not exist yet.
        if (this._target.hasCommand("Canvas.startRecording", "singleFrame")) {
            this._target.CanvasAgent.startRecording(this._identifier, singleFrame, handleStartRecording);
            return;
        }

        if (singleFrame) {
            const frameCount = 1;
            this._target.CanvasAgent.startRecording(this._identifier, frameCount, handleStartRecording);
        } else
            this._target.CanvasAgent.startRecording(this._identifier, handleStartRecording);
    }

    stopRecording()
    {
        this._target.CanvasAgent.stopRecording(this._identifier);
    }

    saveIdentityToCookie(cookie)
    {
        if (this._cssCanvasName)
            cookie[WI.Canvas.CSSCanvasNameCookieKey] = this._cssCanvasName;
        else if (this._domNode)
            cookie[WI.Canvas.NodePathCookieKey] = this._domNode.path;

    }

    sizeChanged(size)
    {
        // Called from WI.CanvasManager.

        // COMPATIBILITY (macOS 14.2, iOS 17.2): `width` and `height` did not exist yet.
        if (this._size?.equals(size))
            return;

        this._size = size;

        this.dispatchEventToListeners(WI.Canvas.Event.SizeChanged);
    }

    memoryChanged(memoryCost)
    {
        // Called from WI.CanvasManager.

        if (memoryCost === this._memoryCost)
            return;

        this._memoryCost = memoryCost;

        this.dispatchEventToListeners(WI.Canvas.Event.MemoryChanged);
    }

    enableExtension(extension)
    {
        // Called from WI.CanvasManager.

        this._extensions.add(extension);

        this.dispatchEventToListeners(WI.Canvas.Event.ExtensionEnabled, {extension});
    }

    clientNodesChanged()
    {
        // Called from WI.CanvasManager.

        this._clientNodes = null;

        this.dispatchEventToListeners(Canvas.Event.ClientNodesChanged);
    }

    recordingStarted(initiator)
    {
        // Called from WI.CanvasManager.

        if (initiator === InspectorBackend.Enum.Recording.Initiator.Console)
            this._recordingState = WI.Canvas.RecordingState.ActiveConsole;
        else if (initiator === InspectorBackend.Enum.Recording.Initiator.AutoCapture)
            this._recordingState = WI.Canvas.RecordingState.ActiveAutoCapture;
        else {
            console.assert(initiator === InspectorBackend.Enum.Recording.Initiator.Frontend);
            this._recordingState = WI.Canvas.RecordingState.ActiveFrontend;
        }

        this._recordingFrames = [];
        this._recordingBufferUsed = 0;

        this.dispatchEventToListeners(WI.Canvas.Event.RecordingStarted);
    }

    recordingProgress(framesPayload, bufferUsed)
    {
        // Called from WI.CanvasManager.

        this._recordingFrames.pushAll(framesPayload.map(WI.RecordingFrame.fromPayload));

        this._recordingBufferUsed = bufferUsed;

        this.dispatchEventToListeners(WI.Canvas.Event.RecordingProgress);
    }

    recordingFinished(recordingPayload)
    {
        // Called from WI.CanvasManager.

        let initiatedByUser = this._recordingState === WI.Canvas.RecordingState.ActiveFrontend;

        // COMPATIBILITY (iOS 12.1): Canvas.recordingStarted did not exist yet
        if (!initiatedByUser && !InspectorBackend.hasEvent("Canvas.recordingStarted"))
            initiatedByUser = !!this.recordingActive;

        let recording = recordingPayload ? WI.Recording.fromPayload(recordingPayload, this._recordingFrames) : null;
        if (recording) {
            recording.source = this;
            recording.createDisplayName(recordingPayload.name);

            this._recordingCollection.add(recording);
        }

        this._recordingState = WI.Canvas.RecordingState.Inactive;
        this._recordingFrames = [];
        this._recordingBufferUsed = 0;

        this.dispatchEventToListeners(WI.Canvas.Event.RecordingStopped, {recording, initiatedByUser});
    }

    nextShaderProgramDisplayNumberForProgramType(programType)
    {
        // Called from WI.ShaderProgram.

        if (!this._nextShaderProgramDisplayNumber)
            this._nextShaderProgramDisplayNumber = {};

        this._nextShaderProgramDisplayNumber[programType] = (this._nextShaderProgramDisplayNumber[programType] || 0) + 1;
        return this._nextShaderProgramDisplayNumber[programType];
    }

    // Private

    async _calculateSize()
    {
        let remoteObject = await WI.RemoteObject.resolveCanvasContext(this);
        if (!remoteObject)
            return;

        function inspectedPage_context_getCanvasSize() {
            return {
                width: this.canvas.width,
                height: this.canvas.height,
            };
        }
        let size = await remoteObject.callFunctionJSON(inspectedPage_context_getCanvasSize);
        remoteObject.release();

        this.sizeChanged(WI.Size.fromJSON(size));
    }
};

WI.Canvas._nextContextUniqueDisplayNameNumber = 1;
WI.Canvas._nextDeviceUniqueDisplayNameNumber = 1;

WI.Canvas.FrameURLCookieKey = "canvas-frame-url";
WI.Canvas.CSSCanvasNameCookieKey = "canvas-css-canvas-name";

WI.Canvas.ContextType = {
    Canvas2D: "canvas-2d",
    OffscreenCanvas2D: "offscreen-canvas-2d",
    BitmapRenderer: "bitmaprenderer",
    OffscreenBitmapRenderer: "offscreen-bitmaprenderer",
    WebGL: "webgl",
    OffscreenWebGL: "offscreen-webgl",
    WebGL2: "webgl2",
    OffscreenWebGL2: "offscreen-webgl2",
    WebGPU: "webgpu",
    WebMetal: "webmetal",
};

WI.Canvas.ColorSpace = {
    SRGB: "srgb",
    DisplayP3: "display-p3",
};

WI.Canvas.RecordingState = {
    Inactive: "canvas-recording-state-inactive",
    ActiveFrontend: "canvas-recording-state-active-frontend",
    ActiveConsole: "canvas-recording-state-active-console",
    ActiveAutoCapture: "canvas-recording-state-active-auto-capture",
};

WI.Canvas.Event = {
    SizeChanged: "canvas-size-changed",
    MemoryChanged: "canvas-memory-changed",
    ExtensionEnabled: "canvas-extension-enabled",
    ClientNodesChanged: "canvas-client-nodes-changed",
    RecordingStarted: "canvas-recording-started",
    RecordingProgress: "canvas-recording-progress",
    RecordingStopped: "canvas-recording-stopped",
};
