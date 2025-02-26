/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

function createCodeMirrorTextMarkers({codeMirror, range, type, pattern, matchFunction, allowedTokens, callback})
{
    var createdMarkers = [];
    var start = range instanceof WI.TextRange ? range.startLine : 0;
    var end = range instanceof WI.TextRange ? range.endLine + 1 : codeMirror.lineCount();
    for (var lineNumber = start; lineNumber < end; ++lineNumber) {
        var lineContent = codeMirror.getLine(lineNumber);
        var match = pattern.exec(lineContent);
        while (match) {
            if (typeof matchFunction === "function" && !matchFunction(lineContent, match)) {
                match = pattern.exec(lineContent);
                continue;
            }

            var from = {line: lineNumber, ch: match.index};
            var to = {line: lineNumber, ch: match.index + match[0].length};

            var foundMarker = false;
            var markers = codeMirror.findMarksAt(to);
            for (var j = 0; j < markers.length; ++j) {
                if (WI.TextMarker.textMarkerForCodeMirrorTextMarker(markers[j]).type === WI.TextMarker.Type[type]) {
                    foundMarker = true;
                    break;
                }
            }

            if (foundMarker) {
                match = pattern.exec(lineContent);
                continue;
            }

            // We're not interested if the value is not inside a keyword.
            var tokenType = codeMirror.getTokenTypeAt(from);
            if (tokenType && !tokenType.includes("keyword") && (!allowedTokens || !allowedTokens.test(tokenType))) {
                match = pattern.exec(lineContent);
                continue;
            }

            let valueString = match[1];
            let value = WI[type] ? WI[type].fromString(valueString) : null;
            if (WI[type] && !value) {
                match = pattern.exec(lineContent);
                continue;
            }

            var marker = codeMirror.markText(from, to);
            marker = new WI.TextMarker(marker, WI.TextMarker.Type[type]);
            createdMarkers.push(marker);

            if (typeof callback === "function")
                callback(marker, value, valueString);

            match = pattern.exec(lineContent);
        }
    }

    return createdMarkers;
}

function createCodeMirrorColorTextMarkers(codeMirror, range, options = {})
{
    // Matches rgba(0, 0, 0, 0.5), rgb(0, 0, 0), hsl(), hsla(), #fff, #ffff, #ffffff, #ffffffff, white
    const pattern = /((?:rgb|hsl)a?\([^)]+\)|#[0-9a-fA-F]{8}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3,4}|\b\w+\b(?![-.]))/g;
    function matchFunction(lineContent, match) {
        if (!lineContent || !lineContent.length)
            return false;

        // In order determine if the matched color is inside a gradient, first
        // look before the text to find the first unmatched open parenthesis.
        // This parenthesis, if it exists, will be immediately after the CSS
        // funciton whose name can be checked to see if it matches a gradient.
        let openParenthesis = 0;
        let index = match.index;
        let c = null;
        while (c = lineContent[index]) {
            if (c === "(")
                ++openParenthesis;
            if (c === ")")
                --openParenthesis;

            if (openParenthesis > 0)
                break;

            --index;
            if (index < 0)
                break;
        }

        if (/(repeating-)?(linear|radial|conic)-gradient$/.test(lineContent.substring(0, index)))
            return false;

        // Act as a negative look-behind and disallow the color from being prefixing with certain characters.
        return !(match.index > 0 && /[-.\"\']/.test(lineContent[match.index - 1]));
    }

    return createCodeMirrorTextMarkers({codeMirror, range, type: "Color", pattern, matchFunction, ...options});
}

function createCodeMirrorGradientTextMarkers(codeMirror, range, options = {})
{
    var createdMarkers = [];

    var start = range instanceof WI.TextRange ? range.startLine : 0;
    var end = range instanceof WI.TextRange ? range.endLine + 1 : codeMirror.lineCount();

    var gradientRegex = /(repeating-)?(linear|radial|conic)-gradient\s*\(\s*/g;

    for (var lineNumber = start; lineNumber < end; ++lineNumber) {
        var lineContent = codeMirror.getLine(lineNumber);
        var match = gradientRegex.exec(lineContent);
        while (match) {
            var startLine = lineNumber;
            var startChar = match.index;
            var endChar = match.index + match[0].length;

            var openParentheses = 0;
            var c = null;
            while (c = lineContent[endChar]) {
                if (c === "(")
                    openParentheses++;
                if (c === ")")
                    openParentheses--;

                if (openParentheses === -1) {
                    endChar++;
                    break;
                }

                endChar++;
                if (endChar >= lineContent.length) {
                    lineNumber++;
                    endChar = 0;
                    lineContent = codeMirror.getLine(lineNumber);
                    if (!lineContent)
                        break;
                }
            }

            if (openParentheses !== -1) {
                match = gradientRegex.exec(lineContent);
                continue;
            }

            var from = {line: startLine, ch: startChar};
            var to = {line: lineNumber, ch: endChar};

            var gradientString = codeMirror.getRange(from, to);
            var gradient = WI.Gradient.fromString(gradientString);
            if (!gradient) {
                match = gradientRegex.exec(lineContent);
                continue;
            }

            var marker = new WI.TextMarker(codeMirror.markText(from, to), WI.TextMarker.Type.Gradient);

            createdMarkers.push(marker);

            if (typeof callback === "function")
                options.callback(marker, gradient, gradientString);

            match = gradientRegex.exec(lineContent);
        }
    }

    return createdMarkers;
}

function createCodeMirrorCubicBezierTimingFunctionTextMarkers(codeMirror, range, options = {})
{
    const pattern = /(cubic-bezier\([^)]+\)|\b\w+\b(?:-\b\w+\b){0,2})/g;
    return createCodeMirrorTextMarkers({codeMirror, range, type: "CubicBezierTimingFunction", pattern, ...options});
}

function createCodeMirrorLinearTimingFunctionTextMarkers(codeMirror, range, options = {})
{
    const pattern = /(linear\([^)]+\))/g;
    return createCodeMirrorTextMarkers({codeMirror, range, type: "LinearTimingFunction", pattern, ...options});
}

function createCodeMirrorSpringTimingFunctionTextMarkers(codeMirror, range, options = {})
{
    const pattern = /(spring\([^)]+\))/g;
    return createCodeMirrorTextMarkers({codeMirror, range, type: "SpringTimingFunction", pattern, ...options});
}

function createCodeMirrorStepsTimingFunctionTextMarkers(codeMirror, range, options = {})
{
    const pattern = /(steps\([^)]+\))/g;
    return createCodeMirrorTextMarkers({codeMirror, range, type: "StepsTimingFunction", pattern, ...options});
}
