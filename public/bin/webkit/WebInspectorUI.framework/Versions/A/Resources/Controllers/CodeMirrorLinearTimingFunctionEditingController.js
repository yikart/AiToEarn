/*
 * Copyright (C) 2023 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.CodeMirrorLinearTimingFunctionEditingController = class CodeMirrorLinearTimingFunctionEditingController extends WI.CodeMirrorEditingController
{
    // Public

    get initialValue()
    {
        return WI.LinearTimingFunction.fromString(this.text);
    }

    get cssClassName()
    {
        return "linear";
    }

    // WI.Popover delegate

    popoverWillPresent(popover)
    {
        this._linearTimingFunctionEditor = new WI.LinearTimingFunctionEditor;
        this._linearTimingFunctionEditor.addEventListener(WI.LinearTimingFunctionEditor.Event.LinearTimingFunctionChanged, this._handleLinearTimingFunctionEditorLinearTimingFunctionChanged, this);
        popover.content = this._linearTimingFunctionEditor.element;
    }

    popoverDidPresent(popover)
    {
        this._linearTimingFunctionEditor.linearTimingFunction = this.value;
    }

    // Private

    _handleLinearTimingFunctionEditorLinearTimingFunctionChanged(event)
    {
        this.value = event.data.linearTimingFunction;
    }
};
