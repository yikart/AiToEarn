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

WI.SettingsGroup = class SettingsGroup extends WI.Object
{
    constructor(title)
    {
        super();

        this._element = document.createElement("div");
        this._element.classList.add("settings-group");

        let titleElement = this._element.appendChild(document.createElement("div"));
        titleElement.classList.add("title");
        titleElement.textContent = title;

        this._editorGroupElement = this._element.appendChild(document.createElement("div"));
        this._editorGroupElement.classList.add("editor-group");
    }

    // Public

    get element() { return this._element; }

    addSetting(setting, label, options)
    {
        let editor = WI.SettingEditor.createForSetting(setting, label, options);
        console.assert(editor, "Could not create default editor for setting. Use addCustomSetting instead.", setting);
        if (!editor)
            return null;

        this._editorGroupElement.append(editor.element);
        return editor;
    }

    addCustomSetting(editorType, options)
    {
        let editor = new WI.SettingEditor(editorType, options.label, options);
        if (!editor)
            return null;

        this._editorGroupElement.append(editor.element);
        return editor;
    }

    addCustomEditor()
    {
        let element = this._editorGroupElement.appendChild(document.createElement("div"));
        element.classList.add("editor");
        return element;
    }
};
