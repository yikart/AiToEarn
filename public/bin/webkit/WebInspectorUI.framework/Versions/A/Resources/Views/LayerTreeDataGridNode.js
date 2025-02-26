/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.LayerTreeDataGridNode = class LayerTreeDataGridNode extends WI.DataGridNode
{
    constructor(layer)
    {
        super();

        this._outlets = {};
        this.layer = layer;
    }

    // DataGridNode Overrides.

    createCells()
    {
        super.createCells();

        this._cellsWereCreated = true;
    }

    createCellContent(columnIdentifier, cell)
    {
        cell = columnIdentifier === "name" ? this._makeNameCell() : this._makeOutlet(columnIdentifier, document.createTextNode(enDash));
        this._updateCell(columnIdentifier);
        return cell;
    }

    // Public

    get layer()
    {
        return this._layer;
    }

    set layer(layer)
    {
        this._layer = layer;

        var domNode = WI.domManager.nodeForId(layer.nodeId);

        this.data = {
            name: domNode ? domNode.displayName : WI.UIString("Unknown node"),
            paintCount: layer.paintCount || emDash,
            memory: Number.bytesToString(layer.memory || 0)
        };
    }

    get data()
    {
        return this._data;
    }

    set data(data)
    {
        Object.keys(data).forEach(function(columnIdentifier) {
            if (this._data[columnIdentifier] === data[columnIdentifier])
                return;

            this._data[columnIdentifier] = data[columnIdentifier];
            if (this._cellsWereCreated)
                this._updateCell(columnIdentifier);
        }, this);
    }

    // Private

    _makeOutlet(name, element)
    {
        this._outlets[name] = element;
        return element;
    }

    _makeNameCell()
    {
        var fragment = document.createDocumentFragment();

        fragment.appendChild(document.createElement("img")).className = "icon";

        var goToButton = this._makeOutlet("goToButton", fragment.appendChild(WI.createGoToArrowButton()));
        goToButton.addEventListener("click", this._goToArrowWasClicked.bind(this), false);

        var label = this._makeOutlet("label", fragment.appendChild(document.createElement("span")));
        label.className = "label";

        var nameLabel = this._makeOutlet("nameLabel", label.appendChild(document.createElement("span")));
        nameLabel.className = "name";

        var pseudoLabel = this._makeOutlet("pseudoLabel", document.createElement("span"));
        pseudoLabel.className = "pseudo-element";

        var reflectionLabel = this._makeOutlet("reflectionLabel", document.createElement("span"));
        reflectionLabel.className = "reflection";
        reflectionLabel.textContent = " \u2014 " + WI.UIString("Reflection");

        return fragment;
    }

    _updateCell(columnIdentifier)
    {
        var data = this._data[columnIdentifier];
        if (columnIdentifier === "name")
            this._updateNameCellData(data);
        else
            this._outlets[columnIdentifier].textContent = data;
    }

    _updateNameCellData(data)
    {
        var layer = this._layer;
        var label = this._outlets.label;

        this._outlets.nameLabel.textContent = data;

        if (WI.domManager.nodeForId(layer.nodeId))
            label.parentNode.insertBefore(this._outlets.goToButton, label.parentNode.firstChild);
        else if (this._outlets.goToButton.parentNode)
            label.parentNode.removeChild(this._outlets.goToButton);

        if (layer.pseudoElement)
            label.appendChild(this._outlets.pseudoLabel).textContent = "::" + layer.pseudoElement;
        else if (this._outlets.pseudoLabel.parentNode)
            label.removeChild(this._outlets.pseudoLabel);

        if (layer.isReflection)
            label.appendChild(this._outlets.reflectionLabel);
        else if (this._outlets.reflectionLabel.parentNode)
            label.removeChild(this._outlets.reflectionLabel);

        var element = this.element;
        if (layer.isReflection)
            element.classList.add("reflection");
        else if (layer.pseudoElement)
            element.classList.add("pseudo-element");
    }

    _goToArrowWasClicked()
    {
        var domNode = WI.domManager.nodeForId(this._layer.nodeId);
        WI.showMainFrameDOMTree(domNode, {ignoreSearchTab: true});
    }
};
