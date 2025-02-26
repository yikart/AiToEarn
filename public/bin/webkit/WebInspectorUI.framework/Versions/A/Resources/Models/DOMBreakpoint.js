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

WI.DOMBreakpoint = class DOMBreakpoint extends WI.Breakpoint
{
    constructor(domNodeOrInfo, type, {disabled, actions, condition, ignoreCount, autoContinue} = {})
    {
        console.assert(domNodeOrInfo instanceof WI.DOMNode || typeof domNodeOrInfo === "object", domNodeOrInfo);
        console.assert(Object.values(WI.DOMBreakpoint.Type).includes(type), type);

        super({disabled, actions, condition, ignoreCount, autoContinue});

        if (domNodeOrInfo instanceof WI.DOMNode) {
            this._domNode = domNodeOrInfo;
            this._path = domNodeOrInfo.path();
            console.assert(WI.networkManager.mainFrame);
            this._url = WI.networkManager.mainFrame.url;
        } else if (domNodeOrInfo && typeof domNodeOrInfo === "object") {
            this._domNode = null;
            this._path = domNodeOrInfo.path;
            this._url = domNodeOrInfo.url;
        }

        this._type = type;
    }

    // Static

    static displayNameForType(type)
    {
        console.assert(Object.values(WI.DOMBreakpoint.Type).includes(type), type);

        switch (type) {
        case WI.DOMBreakpoint.Type.SubtreeModified:
            return WI.UIString("Subtree Modified", "Subtree Modified @ DOM Breakpoint", "A submenu item of 'Break On' that breaks (pauses) before child DOM node is modified");

        case WI.DOMBreakpoint.Type.AttributeModified:
            return WI.UIString("Attribute Modified", "Attribute Modified @ DOM Breakpoint", "A submenu item of 'Break On' that breaks (pauses) before DOM attribute is modified");

        case WI.DOMBreakpoint.Type.NodeRemoved:
            return WI.UIString("Node Removed", "Node Removed @ DOM Breakpoint", "A submenu item of 'Break On' that breaks (pauses) before DOM node is removed");
        }

        console.assert(false, "Unknown DOM breakpoint type", type);
        return WI.UIString("DOM");
    }

    static fromJSON(json)
    {
        return new WI.DOMBreakpoint(json, json.type, {
            disabled: json.disabled,
            condition: json.condition,
            actions: json.actions?.map((actionJSON) => WI.BreakpointAction.fromJSON(actionJSON)) || [],
            ignoreCount: json.ignoreCount,
            autoContinue: json.autoContinue,
        });
    }

    // Public

    get type() { return this._type; }
    get url() { return this._url; }
    get path() { return this._path; }

    get displayName()
    {
        return WI.DOMBreakpoint.displayNameForType(this._type);
    }

    get editable()
    {
        // COMPATIBILITY (iOS 14): DOMDebugger.setDOMBreakpoint did not have an "options" parameter yet.
        return InspectorBackend.hasCommand("DOMDebugger.setDOMBreakpoint", "options");
    }

    get domNode()
    {
        return this._domNode;
    }

    set domNode(domNode)
    {
        console.assert(!domNode || domNode instanceof WI.DOMNode, domNode);
        console.assert(!domNode || xor(domNode, this._domNode), "domNode should not change once set", domNode, this._domNode);
        if (!xor(domNode, this._domNode))
            return;

        this.dispatchEventToListeners(WI.DOMBreakpoint.Event.DOMNodeWillChange);
        this._domNode = domNode;
        this.dispatchEventToListeners(WI.DOMBreakpoint.Event.DOMNodeDidChange);
    }

    remove()
    {
        super.remove();

        WI.domDebuggerManager.removeDOMBreakpoint(this);
    }

    saveIdentityToCookie(cookie)
    {
        cookie["dom-breakpoint-url"] = this._url;
        cookie["dom-breakpoint-path"] = this._path;
        cookie["dom-breakpoint-type"] = this._type;
    }

    toJSON(key)
    {
        let json = super.toJSON(key);
        json.url = this._url;
        json.path = this._path;
        json.type = this._type;
        if (key === WI.ObjectStore.toJSONSymbol)
            json[WI.objectStores.domBreakpoints.keyPath] = this._url + ":" + this._path + ":" + this._type;
        return json;
    }
};

WI.DOMBreakpoint.Type = {
    SubtreeModified: "subtree-modified",
    AttributeModified: "attribute-modified",
    NodeRemoved: "node-removed",
};

WI.DOMBreakpoint.Event = {
    DOMNodeDidChange: "dom-breakpoint-dom-node-did-change",
    DOMNodeWillChange: "dom-breakpoint-dom-node-will-change",
};

WI.DOMBreakpoint.ReferencePage = WI.ReferencePage.DOMBreakpoints;
