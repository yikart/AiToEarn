/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

CodeMirror.defineMode("local-override-url", function() {
    function tokenBase(stream, state) {
        // Parse only the first line, ignore all other lines.
        if (state.parsedURL && stream.sol()) {
            stream.skipToEnd();
            return null;
        }

        // Parse once per tokenize.
        let url = stream.string;
        if (!state.parsedURL) {
            try {
                state.parsedURL = new URL(url);

                let indexOfFragment = -1;
                if (state.parsedURL.hash)
                    indexOfFragment = url.lastIndexOf(state.parsedURL.hash);
                else if (url.endsWith("#"))
                    indexOfFragment = url.length - 1;
                state.indexOfFragment = indexOfFragment;
            } catch {
                stream.skipToEnd();
                return null;
            }
        }

        // Scheme
        if (stream.pos < state.parsedURL.protocol.length) {
            if (state.parsedURL.protocol !== "http:" && state.parsedURL.protocol !== "https:") {
                while (stream.pos < state.parsedURL.protocol.length && !stream.eol())
                    stream.next();
                return "local-override-url-bad-scheme";
            }
        }

        // Pre-fragment string.
        let indexOfFragment = state.indexOfFragment;
        if (indexOfFragment === -1) {
            stream.skipToEnd();
            return null;
        }
        if (stream.pos < indexOfFragment) {
            while (stream.pos < indexOfFragment && !stream.eol())
                stream.next();
            return null;
        }

        // Fragment.
        stream.skipToEnd();
        return "local-override-url-fragment";
    }

    return {
        startState: function() {
            return {
                parsedURL: null,
                tokenize: tokenBase,
            };
        },
        token: function(stream, state) {
            return state.tokenize(stream, state);
        }
    };
});

CodeMirror.defineMIME("text/x-local-override-url", "local-override-url");
