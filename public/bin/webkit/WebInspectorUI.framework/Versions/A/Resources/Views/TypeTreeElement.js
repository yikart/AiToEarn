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

WI.TypeTreeElement = class TypeTreeElement extends WI.GeneralTreeElement
{
    constructor(name, structureDescription, isPrototype)
    {
        const classNames = null;
        const title = null;
        const subtitle = null;
        super(classNames, title, subtitle, structureDescription || null);

        console.assert(!structureDescription || structureDescription instanceof WI.StructureDescription);

        this._name = name;
        this._structureDescription = structureDescription || null;
        this._isPrototype = isPrototype;

        this._populated = false;
        this._autoExpandedChildren = false;

        this.toggleOnClick = true;
        this.selectable = false;
        this.tooltipHandledSeparately = true;
        this.hasChildren = structureDescription;

        var displayName = this._isPrototype ? WI.UIString("%s Prototype").format(name.replace(/Prototype$/, "")) : name;
        var nameElement = document.createElement("span");
        nameElement.classList.add("type-name");
        nameElement.textContent = displayName;
        this.mainTitle = nameElement;

        this.addClassName("type-tree-element");
        if (this._isPrototype)
            this.addClassName("prototype");
    }

    // Public

    get name()
    {
        return this._name;
    }

    get isPrototype()
    {
        return this._isPrototype;
    }

    // Protected

    onpopulate()
    {
        if (this._populated)
            return;

        this._populated = true;

        var properties = [];
        for (var name of this._structureDescription.fields) {
            // FIXME: The backend can send us an empty string. Why? (Symbol?)
            if (name === "")
                continue;
            properties.push({name});
        }
        properties.sort(WI.ObjectTreeView.comparePropertyDescriptors);

        var optionalProperties = [];
        for (var name of this._structureDescription.optionalFields) {
            // FIXME: The backend can send us an empty string. Why? (Symbol?)
            if (name === "")
                continue;
            optionalProperties.push({name: name + "?"});
        }
        optionalProperties.sort(WI.ObjectTreeView.comparePropertyDescriptors);

        for (var property of properties)
            this.appendChild(new WI.TypeTreeElement(property.name, null));
        for (var property of optionalProperties)
            this.appendChild(new WI.TypeTreeElement(property.name, null));

        if (this._structureDescription.imprecise) {
            var truncatedMessageElement = WI.ObjectTreeView.createEmptyMessageElement(ellipsis);
            this.appendChild(new WI.TreeElement(truncatedMessageElement, null, false));
        }

        if (!this.children.length) {
            var emptyMessageElement = WI.ObjectTreeView.createEmptyMessageElement(WI.UIString("No Properties"));
            this.appendChild(new WI.TreeElement(emptyMessageElement, null, false));
        }

        console.assert(this.children.length > 0);

        var prototypeStructure = this._structureDescription.prototypeStructure;
        if (prototypeStructure)
            this.appendChild(new WI.TypeTreeElement(prototypeStructure.constructorName, prototypeStructure, true));
    }

    onexpand()
    {
        if (this._autoExpandedChildren)
            return;

        this._autoExpandedChildren = true;

        // On first expand, auto-expand children until "Object".
        var lastChild = this.children[this.children.length - 1];
        if (lastChild && lastChild.hasChildren && lastChild.isPrototype && lastChild.name !== "Object")
            lastChild.expand();
    }
};
