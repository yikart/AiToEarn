/*
 * Copyright (C) 2015-2017 Apple Inc. All rights reserved.
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

WI.CodeMirrorEditor = class CodeMirrorEditor
{
    static create(element, options)
    {
        // CodeMirror's manual scrollbar positioning results in double scrollbars,
        // nor does it handle braces and brackets well, so default to using LTR.
        // Clients can override this if custom layout for RTL is available.
        element.setAttribute("dir", "ltr");
        element.classList.toggle("read-only", options.readOnly);

        let codeMirror = new CodeMirror(element, {
            // These values will be overridden by any value with the same key in `options`.
            indentWithTabs: WI.settings.indentWithTabs.value,
            indentUnit: WI.settings.indentUnit.value,
            tabSize: WI.settings.tabSize.value,
            lineWrapping: WI.settings.enableLineWrapping.value,
            showWhitespaceCharacters: WI.settings.showWhitespaceCharacters.value,
            maxHighlightLength: WI.settings.experimentalLimitSourceCodeHighlighting.value ? 120 : 10000,
            maxScanLineLength: WI.settings.experimentalLimitSourceCodeHighlighting.value ? 120 : 10000,
            maxHighlightLineLength: WI.settings.experimentalLimitSourceCodeHighlighting.value ? 120 : 1000,
            ...options,
        });

        function listenForChange(setting, codeMirrorOption) {
            if (options[codeMirrorOption] !== undefined)
                return;

            setting.addEventListener(WI.Setting.Event.Changed, function(event) {
                this.setOption(codeMirrorOption, setting.value);
            }, codeMirror);
        }
        listenForChange(WI.settings.indentWithTabs, "indentWithTabs");
        listenForChange(WI.settings.indentUnit, "indentUnit");
        listenForChange(WI.settings.tabSize, "tabSize");
        listenForChange(WI.settings.enableLineWrapping, "lineWrapping");
        listenForChange(WI.settings.showWhitespaceCharacters, "showWhitespaceCharacters");

        // Override some Mac specific keybindings.
        if (WI.Platform.name === "mac") {
            codeMirror.addKeyMap({
                "Home": () => { codeMirror.scrollIntoView({line: 0, ch: 0}); },
                "End": () => { codeMirror.scrollIntoView({line: codeMirror.lineCount() - 1, ch: null}); },
            });
        }

        // Set up default controllers that should be present for
        // all CodeMirror editor instances.
        new WI.CodeMirrorTextKillController(codeMirror);

        return codeMirror;
    }
};
