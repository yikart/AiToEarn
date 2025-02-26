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

WI.SettingEditor = class SettingEditor extends WI.Object
{
    constructor(type, label, options)
    {
        super();

        this._type = type;
        this._value = null;

        this._editorElement = this._createEditorElement(options);
        console.assert(this._editorElement);

        this._element = document.createElement("div");
        this._element.classList.add("setting-editor");
        this._element.append(this._editorElement);

        this.label = label;
    }

    static createForSetting(setting, label, options)
    {
        let type;
        if (typeof setting.value === "boolean")
            type = WI.SettingEditor.Type.Checkbox;
        else if (typeof setting.value === "number")
            type = WI.SettingEditor.Type.Numeric;

        console.assert(type, "Cannot deduce editor type from setting value type.", setting);
        if (!type)
            return null;

        let editor = new WI.SettingEditor(type, label, options);
        editor.value = setting.value;
        editor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
            this.value = editor.value;
        }, setting);
        setting.addEventListener(WI.Setting.Event.Changed, function(event) {
            this.value = setting.value;
        }, editor);

        return editor;
    }

    // Public

    get element() { return this._element; }
    get type() { return this._type; }

    get label()
    {
        return this._label;
    }

    set label(label)
    {
        if (label === this._label)
            return;

        this._label = label;

        if (!this._label) {
            if (this._labelElement)
                this._labelElement.remove();

            this._editorElement.removeAttribute("id");
            this._labelElement = null;
            return;
        }

        if (!this._labelElement) {
            this._editorElement.id = "setting-editor-" + WI.SettingEditor._nextEditorIdentifier++;
            this._labelElement = this._element.appendChild(document.createElement("label"));
            this._labelElement.setAttribute("for", this._editorElement.id);
        }

        this._labelElement.textContent = this._label;
    }

    get value()
    {
        return this._value;
    }

    set value(value)
    {
        if (this._value === value)
            return;

        let oldValue = this._value;
        this._value = value;

        if (this._type === WI.SettingEditor.Type.Checkbox)
            this._editorElement.checked = !!this._value;
        else
            this._editorElement.value = this._value;

        this.dispatchEventToListeners(WI.SettingEditor.Event.ValueDidChange, {oldValue});
    }

    // Private

    _createEditorElement(options)
    {
        let editorElement;

        switch (this._type) {
        case WI.SettingEditor.Type.Checkbox:
            editorElement = document.createElement("input");
            editorElement.type = "checkbox";
            editorElement.addEventListener("change", (event) => { this.value = event.target.checked; });
            break;

        case WI.SettingEditor.Type.Numeric:
            editorElement = document.createElement("input");
            editorElement.type = "number";

            if (options.min !== undefined)
                editorElement.min = options.min;
            if (options.max !== undefined)
                editorElement.max = options.max;

            editorElement.addEventListener("change", (event) => {
                let currentValue = this._value;
                let newValue = parseInt(event.target.value);
                this.value = isNaN(newValue) ? currentValue : newValue;
            });
            break;

        case WI.SettingEditor.Type.Select:
            editorElement = document.createElement("select");
            var keyValuePairs = [];

            console.assert(Array.isArray(options.values), "Expected values array for select editor.", options);

            if (Array.isArray(options.values[0]))
                keyValuePairs = options.values;
            else
                keyValuePairs = options.values.map((value) => [value, value]);

            for (let [key, value] of keyValuePairs) {
                if (key === WI.SettingEditor.SelectSpacerKey) {
                    editorElement.appendChild(document.createElement("hr"));
                    continue;
                }

                let optionElement = editorElement.appendChild(document.createElement("option"));
                optionElement.value = key;
                optionElement.textContent = value;
            }

            editorElement.addEventListener("change", (event) => { this.value = event.target.value; });
            break;

        default:
            console.error("Unknown editor type: " + this._type);
        }

        return editorElement;
    }
};

WI.SettingEditor._nextEditorIdentifier = 1;

WI.SettingEditor.Type = {
    Checkbox: "setting-editor-type-checkbox",
    Numeric: "setting-editor-type-numeric",
    Select: "setting-editor-type-select",
};

WI.SettingEditor.SelectSpacerKey = Symbol("setting-editor-select-spacer-key");

WI.SettingEditor.Event = {
    ValueDidChange: "value-did-change",
};
