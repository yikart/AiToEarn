/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 * Copyright (C) 2017 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.FrameCollection = class FrameCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Frames");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.Frame;
    }
};

WI.ScriptCollection = class ScriptCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Scripts");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.Script;
    }
};

WI.CSSStyleSheetCollection = class CSSStyleSheetCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Style Sheets");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.CSSStyleSheet;
    }
};


WI.CanvasCollection = class CanvasCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Canvases");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.Canvas;
    }
};

WI.ShaderProgramCollection = class ShaderProgramCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Shader Programs");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.ShaderProgram;
    }
};

WI.RecordingCollection = class RecordingCollection extends WI.Collection
{
    // Public

    get displayName()
    {
        return WI.UIString("Recordings");
    }

    objectIsRequiredType(object)
    {
        return object instanceof WI.Recording;
    }
};
