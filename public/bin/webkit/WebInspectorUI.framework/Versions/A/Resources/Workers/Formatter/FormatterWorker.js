/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

importScripts(...[
    "../../External/Esprima/esprima.js",
    "CSSFormatter.js",
    "ESTreeWalker.js",
    "FormatterContentBuilder.js",
    "FormatterUtilities.js",
    "HTMLFormatter.js",
    "HTMLParser.js",
    "HTMLTreeBuilderFormatter.js",
    "JSFormatter.js",
]);

FormatterWorker = class FormatterWorker
{
    constructor()
    {
        self.addEventListener("message", this._handleMessage.bind(this));
    }

    // Actions

    formatJavaScript(sourceText, isModule, indentString, includeSourceMapData)
    {
        let sourceType = isModule ? JSFormatter.SourceType.Module : JSFormatter.SourceType.Script;

        // Format a JavaScript program.
        const builder = null;
        let formatter = new JSFormatter(sourceText, sourceType, builder, indentString);
        if (formatter.success) {
            let result = {formattedText: formatter.formattedText};
            if (includeSourceMapData) {
                result.sourceMapData = formatter.sourceMapData;
                // NOTE: With the JSFormatter, multi-line tokens, such as comments and strings,
                // would not have had their newlines counted properly by the builder. Rather then
                // modify the formatter to check and account for newlines in every token just
                // compute the list of line endings directly on the result.
                result.sourceMapData.formattedLineEndings = result.formattedText.lineEndings();
            }
            return result;
        }

        // Format valid JSON.
        // The formatter could fail if this was just a JSON string. So try a JSON.parse and stringify.
        // This will produce empty source map data, but it is not code, so it is not as important.
        try {
            let jsonStringified = JSON.stringify(JSON.parse(sourceText), null, indentString);
            let result = {formattedText: jsonStringified};
            if (includeSourceMapData)
                result.sourceMapData = {mapping: {original: [], formatted: []}, originalLineEndings: [], formattedLineEndings: []};
            return result;
        } catch { }

        // Format invalid JSON and anonymous functions.
        // Some applications do not use JSON.parse but eval on JSON content. That is more permissive
        // so try to format invalid JSON. Again no source map data since it is not code.
        // Likewise, an unnamed function's toString() produces a "function() { ... }", which is not
        // a valid program on its own. Wrap it in parenthesis to make it a function expression,
        // which is a valid program.
        let invalidJSONFormatter = new JSFormatter("(" + sourceText + ")", sourceType, builder, indentString);
        if (invalidJSONFormatter.success) {
            let formattedTextWithParens = invalidJSONFormatter.formattedText;
            let result = {formattedText: formattedTextWithParens.substring(1, formattedTextWithParens.length - 2)}; // Remove "(" and ")\n".
            if (includeSourceMapData)
                result.sourceMapData = {mapping: {original: [], formatted: []}, originalLineEndings: [], formattedLineEndings: []};
            return result;
        }

        return {formattedText: null};
    }

    formatCSS(sourceText, indentString, includeSourceMapData)
    {
        let result = {formattedText: null};
        const builder = null;
        let formatter = new CSSFormatter(sourceText, builder, indentString);
        if (formatter.success) {
            result.formattedText = formatter.formattedText;
            if (includeSourceMapData)
                result.sourceMapData = formatter.sourceMapData;
        }
        return result;
    }

    formatHTML(sourceText, indentString, includeSourceMapData)
    {
        let result = {formattedText: null};
        const builder = null;
        const sourceType = HTMLFormatter.SourceType.HTML;
        let formatter = new HTMLFormatter(sourceText, sourceType, builder, indentString);
        if (formatter.success) {
            result.formattedText = formatter.formattedText;
            if (includeSourceMapData)
                result.sourceMapData = formatter.sourceMapData;
        }
        return result;
    }

    formatXML(sourceText, indentString, includeSourceMapData)
    {
        let result = {formattedText: null};
        const builder = null;
        const sourceType = HTMLFormatter.SourceType.XML;
        let formatter = new HTMLFormatter(sourceText, sourceType, builder, indentString);
        if (formatter.success) {
            result.formattedText = formatter.formattedText;
            if (includeSourceMapData)
                result.sourceMapData = formatter.sourceMapData;
        }
        return result;
    }

    // Private

    _handleMessage(event)
    {
        let data = event.data;

        // Action.
        if (data.actionName) {
            let result = this[data.actionName](...data.actionArguments);
            self.postMessage({callId: data.callId, result});
            return;
        }

        console.error("Unexpected FormatterWorker message", data);
    }
};

self.formatterWorker = new FormatterWorker;
