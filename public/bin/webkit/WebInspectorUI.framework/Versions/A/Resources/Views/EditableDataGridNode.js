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

WI.EditableDataGridNode = class EditableDataGridNode extends WI.DataGridNode
{
    // Public

    get element()
    {
        let element = super.element;
        if (element)
            element.classList.add("editable");

        return element;
    }

    // Protected

    createCellContent(columnIdentifier, cell)
    {
        let content = super.createCellContent(columnIdentifier, cell);
        console.assert(typeof content === "string");
        if (typeof content !== "string")
            return content;

        let inputElement = document.createElement("input");
        inputElement.spellcheck = false;
        inputElement.value = content;
        inputElement.addEventListener("keypress", this._handleKeyPress.bind(this, columnIdentifier));
        inputElement.addEventListener("blur", this._handleBlur.bind(this, columnIdentifier));
        return inputElement;
    }

    // Private

    _handleKeyPress(columnIdentifier, event)
    {
        if (event.keyCode === WI.KeyboardShortcut.Key.Escape.keyCode)
            this.dataGrid.element.focus();

        if (event.keyCode === WI.KeyboardShortcut.Key.Enter.keyCode)
            this._notifyInputElementValueChanged(columnIdentifier, event.target.value);
    }

    _handleBlur(columnIdentifier, event)
    {
        this._notifyInputElementValueChanged(columnIdentifier, event.target.value);
    }

    _notifyInputElementValueChanged(columnIdentifier, value)
    {
        if (value !== this.data[columnIdentifier])
            this.dispatchEventToListeners(WI.EditableDataGridNode.Event.ValueChanged, {value, columnIdentifier});
    }
};

WI.EditableDataGridNode.Event = {
    ValueChanged: "editable-data-grid-node-value-changed",
};
