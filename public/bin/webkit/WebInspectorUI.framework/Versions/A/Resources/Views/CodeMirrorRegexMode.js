/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

CodeMirror.defineMode("regex", function() {
    function characterSetTokenizer(stream, state) {
        let context = state.currentContext();

        if (context.negatedCharacterSet === undefined) {
            context.negatedCharacterSet = stream.eat("^");
            if (context.negatedCharacterSet)
                return "regex-character-set-negate";
        }

        while (stream.peek()) {
            if (stream.eat("\\"))
                return consumeEscapeSequence(stream);

            if (stream.eat("]")) {
                state.tokenize = tokenBase;
                return state.popContext();
            }

            stream.next();
        }

        return "error";
    }

    function consumeEscapeSequence(stream) {
        if (stream.match(/[bBdDwWsStrnvf0]/))
            return "regex-special";

        if (stream.eat("x")) {
            if (stream.match(/[0-9a-fA-F]{2}/))
                return "regex-escape";
            return "error";
        }

        if (stream.eat("u")) {
            if (stream.match(/[0-9a-fA-F]{4}/))
                return "regex-escape-2";
            return "error";
        }

        if (stream.eat("c")) {
            if (stream.match(/[A-Z]/))
                return "regex-escape-3";
            return "error";
        }

        if (stream.match(/[1-9]/))
            return "regex-backreference";

        if (stream.next())
            return "regex-literal";

        return "error";
    }

    function tokenBase(stream, state) {
        let ch = stream.next();

        if (ch === "\\")
            return consumeEscapeSequence(stream);

        // Match start of capturing/noncapturing group, or positive/negative lookaheads.
        if (ch === "(") {
            let style;
            if (stream.match(/\?[=!]/))
                style = "regex-lookahead";
            else {
                stream.match(/\?:/);
                style = "regex-group";
            }

            return state.pushContext(stream, style, ")");
        }

        let context = state.currentContext();
        if (context && context.type === ch)
            return state.popContext();

        // Match quantifiers: *, +, ?, {n}, {n,}, and {n,m}
        if (/[*+?]/.test(ch))
            return "regex-quantifier";

        if (ch === "{") {
            if (stream.match(/\d+}/))
                return "regex-quantifier";

            let matches = stream.match(/(\d+),(\d+)?}/);
            if (!matches)
                return "error";

            let minimum = parseInt(matches[1]);
            let maximum = parseInt(matches[2]);
            if (minimum > maximum)
                return "error";

            return "regex-quantifier";
        }

        // Match character sets.
        if (ch === "[") {
            state.tokenize = characterSetTokenizer;
            return state.pushContext(stream, "regex-character-set");
        }

        // Match miscelleneous special characters.
        if (/[.^$|]/.test(ch))
            return "regex-special";

        return null;
    }

    return {
        startState: function() {
            let contextStack = [];
            return {
                currentContext: function() {
                    return contextStack.length ? contextStack[contextStack.length - 1] : null;
                },
                pushContext: function(stream, data, type) {
                    let context = {data, type};
                    contextStack.push(context);
                    return data;
                },
                popContext: function() {
                    console.assert(contextStack.length, "Tried to pop empty context stack.");
                    return contextStack.pop().data;
                },
                tokenize: tokenBase,
            };
        },
        token: function(stream, state) {
            return state.tokenize(stream, state);
        }
    };
});

CodeMirror.defineMIME("text/x-regex", "regex");
