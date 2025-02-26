/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.RecordingState = class RecordingState
{
    constructor(data, {source} = {})
    {
        this._data = data;
        this._source = source || null;
    }

    // Static

    static fromCanvasContext2D(context, options = {})
    {
        console.assert(context instanceof CanvasRenderingContext2D || (window.OffscreenCanvasRenderingContext2D && context instanceof OffscreenCanvasRenderingContext2D), context);

        let matrix = context.getTransform();

        let data = {};

        data.direction = context.direction;
        data.fillStyle = context.fillStyle;
        data.font = context.font;
        data.globalAlpha = context.globalAlpha;
        data.globalCompositeOperation = context.globalCompositeOperation;
        data.imageSmoothingEnabled = context.imageSmoothingEnabled;
        data.imageSmoothingQuality = context.imageSmoothingQuality;
        data.lineCap = context.lineCap;
        data.lineDash = context.getLineDash();
        data.lineDashOffset = context.lineDashOffset;
        data.lineJoin = context.lineJoin;
        data.lineWidth = context.lineWidth;
        data.miterLimit = context.miterLimit;
        data.shadowBlur = context.shadowBlur;
        data.shadowColor = context.shadowColor;
        data.shadowOffsetX = context.shadowOffsetX;
        data.shadowOffsetY = context.shadowOffsetY;
        data.strokeStyle = context.strokeStyle;
        data.textAlign = context.textAlign;
        data.textBaseline = context.textBaseline;
        data.transform = [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f];
        data.webkitImageSmoothingEnabled = context.webkitImageSmoothingEnabled;
        data.webkitLineDash = context.webkitLineDash;
        data.webkitLineDashOffset = context.webkitLineDashOffset;

        data.currentX = context.currentX;
        data.currentY = context.currentY;
        data.setPath = [context.getPath()];

        return new WI.RecordingState(data, options);
    }

    static async swizzleInitialState(recording, initialState)
    {
        if (recording.isCanvas2D) {
            let swizzledState = {};

            for (let [name, value] of Object.entries(initialState)) {
                // COMPATIBILITY (iOS 12.0): Recording.InitialState.states did not exist yet
                let nameIndex = parseInt(name);
                if (!isNaN(nameIndex))
                    name = await recording.swizzle(nameIndex, WI.Recording.Swizzle.String);

                switch (name) {
                case "setTransform":
                    value = [await recording.swizzle(value, WI.Recording.Swizzle.DOMMatrix)];
                    break;

                case "fillStyle":
                case "strokeStyle":
                    var [gradient, pattern, string] = await Promise.all([
                        recording.swizzle(value, WI.Recording.Swizzle.CanvasGradient),
                        recording.swizzle(value, WI.Recording.Swizzle.CanvasPattern),
                        recording.swizzle(value, WI.Recording.Swizzle.String),
                    ]);
                    if (gradient && !pattern)
                        value = gradient;
                    else if (pattern && !gradient)
                        value = pattern;
                    else
                        value = string;
                    break;

                case "direction":
                case "font":
                case "globalCompositeOperation":
                case "imageSmoothingQuality":
                case "lineCap":
                case "lineJoin":
                case "shadowColor":
                case "textAlign":
                case "textBaseline":
                    value = await recording.swizzle(value, WI.Recording.Swizzle.String);
                    break;

                case "globalAlpha":
                case "lineWidth":
                case "miterLimit":
                case "shadowOffsetX":
                case "shadowOffsetY":
                case "shadowBlur":
                case "lineDashOffset":
                    value = await recording.swizzle(value, WI.Recording.Swizzle.Number);
                    break;

                case "setPath":
                    value = [await recording.swizzle(value[0], WI.Recording.Swizzle.Path2D)];
                    break;
                }

                if (value === undefined || (Array.isArray(value) && value.includes(undefined)))
                    continue;

                swizzledState[name] = value;
            }

            return new WI.RecordingState(swizzledState);
        }

        return null;
    }

    // Public

    get source() { return this._source; }

    has(name)
    {
        return name in this._data;
    }

    get(name)
    {
        return this._data[name];
    }

    apply(type, context)
    {
        for (let [name, value] of this) {
            if (!(name in context))
                continue;

            // Skip internal state used for path debugging.
            if (name === "currentX" || name === "currentY")
                continue;

            try {
                if (WI.RecordingAction.isFunctionForType(type, name))
                    context[name](...value);
                else
                    context[name] = value;
            } catch { }
        }
    }

    toJSON()
    {
        return this._data;
    }

    [Symbol.iterator]()
    {
        return Object.entries(this._data)[Symbol.iterator]();
    }
};
