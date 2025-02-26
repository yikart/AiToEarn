/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

WI.SourceCodeSearchMatchObject = class SourceCodeSearchMatchObject
{
    constructor(sourceCode, lineText, searchTerm, textRange)
    {
        console.assert(sourceCode instanceof WI.SourceCode);
        console.assert(textRange instanceof WI.TextRange, textRange);

        this._sourceCode = sourceCode;
        this._lineText = lineText;
        this._searchTerm = searchTerm;
        this._textRange = textRange;
        this._sourceCodeTextRange = null;
    }

    // Public

    get sourceCode() { return this._sourceCode; }
    get title() { return this._lineText; }
    get searchTerm() { return this._searchTerm; }
    get textRange() { return this._textRange; }

    get sourceCodeTextRange()
    {
        this._sourceCodeTextRange ??= this._sourceCode.createSourceCodeTextRange(this._textRange);

        return this._sourceCodeTextRange;
    }

    get className()
    {
        return "source-code-match";
    }

    saveIdentityToCookie(cookie)
    {
        if (this._sourceCode.url)
            cookie[WI.SourceCodeSearchMatchObject.URLCookieKey] = this._sourceCode.url.hash;

        cookie[WI.SourceCodeSearchMatchObject.TextRangeKey] = [this._textRange.startLine, this._textRange.startColumn, this._textRange.endLine, this._textRange.endColumn].join();
    }
};

WI.SourceCodeSearchMatchObject.TypeIdentifier = "source-code-search-match-object";
WI.SourceCodeSearchMatchObject.URLCookieKey = "source-code-url";
WI.SourceCodeSearchMatchObject.TextRangeKey = "text-range";
