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

WI.SettingsView = class SettingsView extends WI.View
{
    constructor(identifier, displayName)
    {
        super();

        this._identifier = identifier;
        this._displayName = displayName;

        this.element.classList.add("settings-view", identifier);
    }

    // Public

    get identifier() { return this._identifier; }
    get displayName() { return this._displayName; }

    addSetting(title, setting, label, options)
    {
        let settingsGroup = this.addGroup(title);
        return settingsGroup.addSetting(setting, label, options);
    }

    addGroupWithCustomSetting(title, editorType, options)
    {
        let settingsGroup = this.addGroup(title);
        return settingsGroup.addCustomSetting(editorType, options);
    }

    addGroupWithCustomEditor(title, element)
    {
        let settingsGroup = this.addGroup(title);
        return settingsGroup.addCustomEditor();
    }

    addGroup(title)
    {
        let settingsGroup = new WI.SettingsGroup(title);
        this.element.append(settingsGroup.element);

        return settingsGroup;
    }

    addSeparator()
    {
        if (this.element.lastChild && this.element.lastChild.classList.contains("separator"))
            return;

        let separatorElement = this.element.appendChild(document.createElement("div"));
        separatorElement.classList.add("separator");
    }

    addCenteredContainer(...nodes)
    {
        let containerElement = document.createElement("div");
        containerElement.append(...nodes);
        containerElement.classList.add("container", "centered");
        this.element.append(containerElement);

        return containerElement;
    }
};

WI.SettingsView.EditorType = {
    Checkbox: "settings-view-editor-type-checkbox",
    Numeric: "settings-view-editor-type-numeric",
    Select: "settings-view-editor-type-select",
};
