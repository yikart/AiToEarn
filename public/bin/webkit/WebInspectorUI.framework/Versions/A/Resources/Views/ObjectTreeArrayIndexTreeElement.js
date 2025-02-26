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

WI.ObjectTreeArrayIndexTreeElement = class ObjectTreeArrayIndexTreeElement extends WI.ObjectTreeBaseTreeElement
{
    constructor(property, propertyPath)
    {
        console.assert(property.isIndexProperty(), "ObjectTreeArrayIndexTreeElement expects numeric property names");

        super(property, propertyPath, property);

        this.mainTitle = this._titleFragment();
        this.addClassName("object-tree-property");
        this.addClassName("object-tree-array-index");

        if (!this.property.hasValue())
            this.addClassName("accessor");
    }

    // Protected

    invokedGetter()
    {
        this.mainTitle = this._titleFragment();

        this.removeClassName("accessor");
    }

    // Private

    _titleFragment()
    {
        var container = document.createDocumentFragment();

        // Array index name.
        var nameElement = container.appendChild(document.createElement("span"));
        nameElement.className = "index-name";
        nameElement.textContent = this.property.name;
        nameElement.title = this.propertyPathString(this.thisPropertyPath());

        // Space. For copy/paste to have space between the index and value.
        container.append(" ");

        // Value.
        var valueElement = container.appendChild(document.createElement("span"));
        valueElement.className = "index-value";

        var resolvedValue = this.resolvedValue();
        if (resolvedValue)
            valueElement.appendChild(WI.FormattedValue.createObjectTreeOrFormattedValueForRemoteObject(resolvedValue, this.resolvedValuePropertyPath()));
        else {
            if (this.property.hasGetter())
                container.appendChild(this.createGetterElement(true));
            if (this.property.hasSetter())
                container.appendChild(this.createSetterElement());
        }

        valueElement.classList.add("value");
        if (this.hadError())
            valueElement.classList.add("error");

        return container;
    }
};
