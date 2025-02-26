/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.AlignmentData = class AlignmentData
{
    constructor(propertyName, text)
    {
        console.assert(Object.values(WI.AlignmentData.Type).includes(propertyName), propertyName);

        this._type = WI.AlignmentData._propertyNameToType(propertyName);
        this._propertyName = propertyName;
        this._text = text;
    }

    // Static

    static isAlignmentAwarePropertyName(propertyName)
    {
        return !!WI.AlignmentData._propertyNameToType(propertyName);
    }

    static _propertyNameToType(propertyName)
    {
        switch (propertyName) {
        case "align-content":
            return WI.AlignmentData.Type.AlignContent;
        case "align-items":
            return WI.AlignmentData.Type.AlignItems;
        case "align-self":
            return WI.AlignmentData.Type.AlignSelf;
        case "justify-content":
            return WI.AlignmentData.Type.JustifyContent;
        case "justify-items":
            return WI.AlignmentData.Type.JustifyItems;
        case "justify-self":
            return WI.AlignmentData.Type.JustifySelf;
        }
        return null;
    }

    // Public

    get type() { return this._type; }

    get text() { return this._text; }
    set text(text) { this._text = text; }

    toString()
    {
        return this._text;
    }
};

// FIXME: <https://webkit.org/b/233055> Web Inspector: Add a swatch for justify-content, justify-items, and justify-self
WI.AlignmentData.Type = {
    AlignContent: "align-content",
    AlignItems: "align-items",
    AlignSelf: "align-self",
    JustifyContent: "justify-content",
    JustifyItems: "justify-items",
    JustifySelf: "justify-self",
};
