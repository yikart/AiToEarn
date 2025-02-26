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

WI.TextRange = class TextRange
{
    constructor(startLineOrStartOffset, startColumnOrEndOffset, endLine, endColumn)
    {
        if (arguments.length === 4) {
            console.assert(startLineOrStartOffset <= endLine);
            console.assert(startLineOrStartOffset !== endLine || startColumnOrEndOffset <= endColumn);

            this._startLine = typeof startLineOrStartOffset === "number" ? startLineOrStartOffset : NaN;
            this._startColumn = typeof startColumnOrEndOffset === "number" ? startColumnOrEndOffset : NaN;
            this._endLine = typeof endLine === "number" ? endLine : NaN;
            this._endColumn = typeof endColumn === "number" ? endColumn : NaN;

            this._startOffset = NaN;
            this._endOffset = NaN;
        } else if (arguments.length === 2) {
            console.assert(startLineOrStartOffset <= startColumnOrEndOffset);

            this._startOffset = typeof startLineOrStartOffset === "number" ? startLineOrStartOffset : NaN;
            this._endOffset = typeof startColumnOrEndOffset === "number" ? startColumnOrEndOffset : NaN;

            this._startLine = NaN;
            this._startColumn = NaN;
            this._endLine = NaN;
            this._endColumn = NaN;
        }
    }

    // Static

    static fromText(text)
    {
        let lines = text.split("\n");
        return new WI.TextRange(0, 0, lines.length - 1, lines.lastValue.length);
    }

    // Public

    get startLine() { return this._startLine; }
    get startColumn() { return this._startColumn; }
    get endLine() { return this._endLine; }
    get endColumn() { return this._endColumn; }
    get startOffset() { return this._startOffset; }
    get endOffset() { return this._endOffset; }

    startPosition()
    {
        return new WI.SourceCodePosition(this._startLine, this._startColumn);
    }

    endPosition()
    {
        return new WI.SourceCodePosition(this._endLine, this._endColumn);
    }

    resolveOffsets(text)
    {
        console.assert(typeof text === "string");
        if (typeof text !== "string")
            return;

        console.assert(!isNaN(this._startLine));
        console.assert(!isNaN(this._startColumn));
        console.assert(!isNaN(this._endLine));
        console.assert(!isNaN(this._endColumn));
        if (isNaN(this._startLine) || isNaN(this._startColumn) || isNaN(this._endLine) || isNaN(this._endColumn))
            return;

        var lastNewLineOffset = 0;
        for (var i = 0; i < this._startLine; ++i)
            lastNewLineOffset = text.indexOf("\n", lastNewLineOffset) + 1;

        this._startOffset = lastNewLineOffset + this._startColumn;

        for (var i = this._startLine; i < this._endLine; ++i)
            lastNewLineOffset = text.indexOf("\n", lastNewLineOffset) + 1;

        this._endOffset = lastNewLineOffset + this._endColumn;
    }

    contains(line, column)
    {
        console.assert(!isNaN(this._startLine), "TextRange needs line/column data");

        if (line < this._startLine || line > this._endLine)
            return false;
        if (line === this._startLine && column < this._startColumn)
            return false;
        if (line === this._endLine && column > this._endColumn)
            return false;

        return true;
    }

    clone()
    {
        console.assert(!isNaN(this._startLine), "TextRange needs line/column data.");
        return new WI.TextRange(this._startLine, this._startColumn, this._endLine, this._endColumn);
    }

    cloneAndModify(deltaStartLine, deltaStartColumn, deltaEndLine, deltaEndColumn)
    {
        console.assert(!isNaN(this._startLine), "TextRange needs line/column data.");

        let startLine = this._startLine + deltaStartLine;
        let startColumn = this._startColumn + deltaStartColumn;
        let endLine = this._endLine + deltaEndLine;
        let endColumn = this._endColumn + deltaEndColumn;
        console.assert(startLine >= 0 && startColumn >= 0 && endLine >= 0 && endColumn >= 0, `Cannot have negative numbers in TextRange ${startLine}:${startColumn}...${endLine}:${endColumn}`);

        return new WI.TextRange(startLine, startColumn, endLine, endColumn);
    }

    collapseToStart()
    {
        console.assert(!isNaN(this._startLine), "TextRange needs line/column data.");
        return new WI.TextRange(this._startLine, this._startColumn, this._startLine, this._startColumn);
    }

    collapseToEnd()
    {
        console.assert(!isNaN(this._endLine), "TextRange needs line/column data.");
        return new WI.TextRange(this._endLine, this._endColumn, this._endLine, this._endColumn);
    }

    relativeTo(line, column)
    {
        let deltaStartColumn = 0;
        if (this._startLine === line)
            deltaStartColumn = -column;

        let deltaEndColumn = 0;
        if (this._endLine === line)
            deltaEndColumn = -column;

        return this.cloneAndModify(-line, deltaStartColumn, -line, deltaEndColumn);
    }
};
