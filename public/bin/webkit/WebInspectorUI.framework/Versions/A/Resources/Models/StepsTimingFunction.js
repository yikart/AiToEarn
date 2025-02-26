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

WI.StepsTimingFunction = class StepsTimingFunction
{
    constructor(type, count)
    {
        console.assert(Object.values(WI.StepsTimingFunction.Type).includes(type), type);
        console.assert(count > 0, count);

        this._type = type;
        this._count = count;
    }

    // Static

    static fromString(text)
    {
        if (!text?.length)
            return null;

        let trimmedText = text.toLowerCase().replace(/\s/g, "");
        if (!trimmedText.length)
            return null;

        let keywordValue = WI.StepsTimingFunction.keywordValues[trimmedText];
        if (keywordValue)
            return new WI.StepsTimingFunction(...keywordValue);

        let matches = trimmedText.match(/^steps\((\d+)(?:,([a-z-]+))?\)$/);
        if (!matches)
            return null;

        let type = matches[2] || WI.StepsTimingFunction.Type.JumpEnd;
        if (Object.values(WI.StepsTimingFunction).includes(type))
            return null;

        let count = Number(matches[1]);
        if (isNaN(count) || count <= 0)
            return null;

        return new WI.StepsTimingFunction(type, count);
    }

    // Public

    get type() { return this._type; }
    get count() { return this._count; }

    copy()
    {
        return new WI.StepsTimingFunction(this._type, this._count);
    }

    toString()
    {
        if (this._type === WI.StepsTimingFunction.Type.JumpStart && this._count === 1)
            return "step-start";

        if (this._type === WI.StepsTimingFunction.Type.JumpEnd && this._count === 1)
            return "step-end";

        return `steps(${this._count}, ${this._type})`;
    }
};

WI.StepsTimingFunction.Type = {
    JumpStart: "jump-start",
    JumpEnd: "jump-end",
    JumpNone: "jump-none",
    JumpBoth: "jump-both",
    Start: "start",
    End: "end",
};

WI.StepsTimingFunction.keywordValues = {
    "step-start": [WI.StepsTimingFunction.Type.JumpStart, 1],
    "step-end": [WI.StepsTimingFunction.Type.JumpEnd, 1],
};
