/*
 * Copyright (C) 2020-2022 Apple Inc. All rights reserved.
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

WI.Font = class Font
{
    constructor(name, variationAxes, {synthesizedBold, synthesizedOblique} = {})
    {
        this._name = name;
        this._variationAxes = variationAxes;

        // COMPATIBILITY (macOS 13.0, iOS 16.0): CSS.Font.synthesizedBold and CSS.Font.synthesizedOblique did not exist yet.
        this._synthesizedBold = !!synthesizedBold;
        this._synthesizedOblique = !!synthesizedOblique;
    }

    // Static

    static fromPayload(payload)
    {
        let variationAxes = payload.variationAxes.map((axisPayload) => WI.FontVariationAxis.fromPayload(axisPayload));

        let synthesizedBold = payload.synthesizedBold;
        let synthesizedOblique = payload.synthesizedOblique;

        return new WI.Font(payload.displayName, variationAxes, {synthesizedBold, synthesizedOblique});
    }

    // Public

    get name() { return this._name; }
    get variationAxes() { return this._variationAxes; }
    get synthesizedBold() { return this._synthesizedBold; }
    get synthesizedOblique() { return this._synthesizedOblique; }

    variationAxis(tag)
    {
        return this._variationAxes.find((axis) => axis.tag === tag);
    }
};
