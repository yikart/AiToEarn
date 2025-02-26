/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

WI.SourceCodePosition = class SourceCodePosition
{
    constructor(lineNumber, columnNumber)
    {
        this._lineNumber = lineNumber || 0;
        this._columnNumber = columnNumber || 0;
    }

    // Public

    get lineNumber() { return this._lineNumber; }
    get columnNumber() { return this._columnNumber; }

    offsetColumn(delta)
    {
        console.assert(this._columnNumber + delta >= 0);
        return new WI.SourceCodePosition(this._lineNumber, this._columnNumber + delta);
    }

    equals(position)
    {
        return this._lineNumber === position.lineNumber && this._columnNumber === position.columnNumber;
    }

    isBefore(position)
    {
        if (this._lineNumber < position.lineNumber)
            return true;
        if (this._lineNumber === position.lineNumber && this._columnNumber < position.columnNumber)
            return true;

        return false;
    }

    isAfter(position)
    {
        if (this._lineNumber > position.lineNumber)
            return true;
        if (this._lineNumber === position.lineNumber && this._columnNumber > position.columnNumber)
            return true;

        return false;
    }

    isWithin(startPosition, endPosition)
    {
        console.assert(startPosition.isBefore(endPosition) || startPosition.equals(endPosition));

        if (this.equals(startPosition) || this.equals(endPosition))
            return true;
        if (this.isAfter(startPosition) && this.isBefore(endPosition))
            return true;

        return false;
    }

    toCodeMirror()
    {
        return {line: this._lineNumber, ch: this._columnNumber};
    }
};
