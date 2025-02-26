/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.TextMarker = class TextMarker
{
    constructor(codeMirrorTextMarker, type)
    {
        this._codeMirrorTextMarker = codeMirrorTextMarker;
        codeMirrorTextMarker.__webInspectorTextMarker = this;

        this._type = type || WI.TextMarker.Type.Plain;
    }

    // Static

    static textMarkerForCodeMirrorTextMarker(codeMirrorTextMarker)
    {
        return codeMirrorTextMarker.__webInspectorTextMarker || new WI.TextMarker(codeMirrorTextMarker);
    }

    // Public

    get codeMirrorTextMarker()
    {
        return this._codeMirrorTextMarker;
    }

    get type()
    {
        return this._type;
    }

    get range()
    {
        var range = this._codeMirrorTextMarker.find();
        if (!range)
            return null;
        return new WI.TextRange(range.from.line, range.from.ch, range.to.line, range.to.ch);
    }

    get rects()
    {
        var range = this._codeMirrorTextMarker.find();
        if (!range)
            return WI.Rect.ZERO_RECT;
        return this._codeMirrorTextMarker.doc.cm.rectsForRange({
            start: range.from,
            end: range.to
        });
    }

    clear()
    {
        this._codeMirrorTextMarker.clear();
    }
};

WI.TextMarker.Type = {
    Color: "text-marker-type-color",
    CubicBezierTimingFunction: "text-marker-type-cubic-bezier-timing-function",
    Gradient: "text-marker-type-gradient",
    LinearTimingFunction: "text-marker-type-linear-timing-function",
    Plain: "text-marker-type-plain",
    SpringTimingFunction: "text-marker-type-spring-timing-function",
    StepsTimingFunction: "text-marker-type-steps-timing-function",
    Variable: "text-marker-type-variable",
};
