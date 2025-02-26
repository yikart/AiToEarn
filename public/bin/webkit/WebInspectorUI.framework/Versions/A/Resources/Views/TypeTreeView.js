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

WI.TypeTreeView = class TypeTreeView extends WI.Object
{
    constructor(typeDescription)
    {
        super();

        console.assert(typeDescription instanceof WI.TypeDescription);

        this._typeDescription = typeDescription;

        this._element = document.createElement("div");
        this._element.className = "type-tree";

        this._outline = new WI.TreeOutline;
        this._outline.customIndent = true;
        this._outline.element.classList.add("type");
        this._element.appendChild(this._outline.element);

        this._populate();

        // Auto-expand if there is one sub-type. TypeTreeElement handles further auto-expansion.
        if (this._outline.children.length === 1)
            this._outline.children[0].expand();
    }

    // Public

    get typeDescription()
    {
        return this._typeDescription;
    }

    get element()
    {
        return this._element;
    }

    get treeOutline()
    {
        return this._outline;
    }

    // Private

    _populate()
    {
        var types = [];
        for (var structure of this._typeDescription.structures)
            types.push({name: structure.constructorName, structure});
        for (var primitiveName of this._typeDescription.typeSet.primitiveTypeNames)
            types.push({name: primitiveName});
        types.sort(WI.ObjectTreeView.comparePropertyDescriptors);

        for (var type of types)
            this._outline.appendChild(new WI.TypeTreeElement(type.name, type.structure, false));

        if (this._typeDescription.truncated) {
            var truncatedMessageElement = WI.ObjectTreeView.createEmptyMessageElement(ellipsis);
            this._outline.appendChild(new WI.TreeElement(truncatedMessageElement, null, false));
        }

        if (!this._outline.children.length) {
            var errorMessageElement = WI.ObjectTreeView.createEmptyMessageElement(WI.UIString("No Properties"));
            this._outline.appendChild(new WI.TreeElement(errorMessageElement, null, false));
        }
    }
};
