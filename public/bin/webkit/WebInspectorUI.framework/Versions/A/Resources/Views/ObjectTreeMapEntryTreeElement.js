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

WI.ObjectTreeMapEntryTreeElement = class ObjectTreeMapEntryTreeElement extends WI.ObjectTreeBaseTreeElement
{
    constructor(object, propertyPath)
    {
        console.assert(object instanceof WI.RemoteObject);

        // Treat the same as an array-index just with different strings and widths.
        super(object, propertyPath);

        this._object = object;

        this.addClassName("object-tree-array-index");
        this.addClassName("object-tree-map-entry");
    }

    // Public

    get object()
    {
        return this._object;
    }

    // Protected

    resolvedValue()
    {
        return this._object;
    }

    propertyPathType()
    {
        return WI.PropertyPath.Type.Value;
    }

    titleFragment()
    {
        var container = document.createDocumentFragment();

        var propertyPath = this.resolvedValuePropertyPath();

        // Index name.
        var nameElement = container.appendChild(document.createElement("span"));
        nameElement.className = "index-name";
        nameElement.textContent = this.displayPropertyName();
        nameElement.title = this.propertyPathString(propertyPath);

        // Space. For copy/paste to have space between the key and value.
        container.append(" ");

        // Value.
        var valueElement = container.appendChild(document.createElement("span"));
        valueElement.className = "index-value";
        valueElement.appendChild(WI.FormattedValue.createObjectTreeOrFormattedValueForRemoteObject(this._object, propertyPath));

        return container;
    }
};

WI.ObjectTreeMapKeyTreeElement = class ObjectTreeMapKeyTreeElement extends WI.ObjectTreeMapEntryTreeElement
{
    constructor(object, propertyPath)
    {
        super(object, propertyPath);

        this.mainTitle = this.titleFragment();

        this.addClassName("key");
    }

    // Protected

    displayPropertyName()
    {
        return WI.UIString("key");
    }

    resolvedValuePropertyPath()
    {
        return this._propertyPath.appendMapKey(this._object);
    }
};

WI.ObjectTreeMapValueTreeElement = class ObjectTreeMapValueTreeElement extends WI.ObjectTreeMapEntryTreeElement
{
    constructor(object, propertyPath, key)
    {
        super(object, propertyPath);

        this._key = key;

        this.mainTitle = this.titleFragment();

        this.addClassName("value");
    }

    // Protected

    displayPropertyName()
    {
        return WI.UIString("value");
    }

    resolvedValuePropertyPath()
    {
        return this._propertyPath.appendMapValue(this._object, this._key);
    }
};
