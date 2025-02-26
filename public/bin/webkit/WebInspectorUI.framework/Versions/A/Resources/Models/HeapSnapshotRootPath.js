/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.HeapSnapshotRootPath = class HeapSnapshotRootPath
{
    constructor(node, pathComponent, parent, isGlobalScope)
    {
        console.assert(!node || node instanceof WI.HeapSnapshotNodeProxy);
        console.assert(!pathComponent || typeof pathComponent === "string");
        console.assert(!parent || parent instanceof WI.HeapSnapshotRootPath);

        this._node = node || null;
        this._parent = parent || null;
        this._pathComponent = typeof pathComponent === "string" ? pathComponent : null;
        this._isGlobalScope = isGlobalScope || false;

        // Become the new root when appended to an empty path.
        if (this._parent && this._parent.isEmpty())
            this._parent = null;
    }

    // Static

    static emptyPath()
    {
        return new WI.HeapSnapshotRootPath(null);
    }

    static pathComponentForIndividualEdge(edge)
    {
        switch (edge.type) {
        case WI.HeapSnapshotEdgeProxy.EdgeType.Internal:
            return null;
        case WI.HeapSnapshotEdgeProxy.EdgeType.Index:
            return "[" + edge.data + "]";
        case WI.HeapSnapshotEdgeProxy.EdgeType.Property:
        case WI.HeapSnapshotEdgeProxy.EdgeType.Variable:
            if (WI.HeapSnapshotRootPath.canPropertyNameBeDotAccess(edge.data))
                return edge.data;
            return "[" + doubleQuotedString(edge.data) + "]";
        }
    }

    static canPropertyNameBeDotAccess(propertyName)
    {
        return /^(?![0-9])\w+$/.test(propertyName);
    }

    // Public

    get node() { return this._node; }
    get parent() { return this._parent; }
    get pathComponent() { return this._pathComponent; }

    get rootNode()
    {
        return this._parent ? this._parent.rootNode : this._node;
    }

    get fullPath()
    {
        let components = [];
        for (let p = this; p && p.pathComponent; p = p.parent)
            components.push(p.pathComponent);
        components.reverse();
        return components.join("");
    }

    isRoot()
    {
        return !this._parent;
    }

    isEmpty()
    {
        return !this._node;
    }

    isGlobalScope()
    {
        return this._isGlobalScope;
    }

    isPathComponentImpossible()
    {
        return this._pathComponent && this._pathComponent.startsWith("@");
    }

    isFullPathImpossible()
    {
        if (this.isEmpty())
            return true;

        if (this.isPathComponentImpossible())
            return true;

        if (this._parent)
            return this._parent.isFullPathImpossible();

        return false;
    }

    appendInternal(node)
    {
        return new WI.HeapSnapshotRootPath(node, WI.HeapSnapshotRootPath.SpecialPathComponent.InternalPropertyName, this);
    }

    appendArrayIndex(node, index)
    {
        let component = "[" + index + "]";
        return new WI.HeapSnapshotRootPath(node, component, this);
    }

    appendPropertyName(node, propertyName)
    {
        let component = WI.HeapSnapshotRootPath.canPropertyNameBeDotAccess(propertyName) ? "." + propertyName : "[" + doubleQuotedString(propertyName) + "]";
        return new WI.HeapSnapshotRootPath(node, component, this);
    }

    appendVariableName(node, variableName)
    {
        // Treat as a property of the global object, e.g. "window.foo".
        if (this._isGlobalScope)
            return this.appendPropertyName(node, variableName);
        return new WI.HeapSnapshotRootPath(node, variableName, this);
    }

    appendGlobalScopeName(node, globalScopeName)
    {
        return new WI.HeapSnapshotRootPath(node, globalScopeName, this, true);
    }

    appendEdge(edge)
    {
        console.assert(edge instanceof WI.HeapSnapshotEdgeProxy);

        switch (edge.type) {
        case WI.HeapSnapshotEdgeProxy.EdgeType.Internal:
            return this.appendInternal(edge.to);
        case WI.HeapSnapshotEdgeProxy.EdgeType.Index:
            return this.appendArrayIndex(edge.to, edge.data);
        case WI.HeapSnapshotEdgeProxy.EdgeType.Property:
            return this.appendPropertyName(edge.to, edge.data);
        case WI.HeapSnapshotEdgeProxy.EdgeType.Variable:
            return this.appendVariableName(edge.to, edge.data);
        }

        console.error("Unexpected edge type", edge.type);
    }
};

WI.HeapSnapshotRootPath.SpecialPathComponent = {
    InternalPropertyName: "@internal",
};
