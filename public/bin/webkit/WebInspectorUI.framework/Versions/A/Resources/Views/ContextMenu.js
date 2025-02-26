/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2009 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.ContextMenuItem = class ContextMenuItem extends WI.Object
{
    constructor(topLevelMenu, type, label, disabled, checked)
    {
        super();

        this._type = type;
        this._label = label;
        this._disabled = disabled;
        this._checked = checked;
        this._contextMenu = topLevelMenu || this;

        if (type === "item" || type === "checkbox")
            this._id = topLevelMenu.nextId();
    }

    // Public

    id()
    {
        return this._id;
    }

    type()
    {
        return this._type;
    }

    isEnabled()
    {
        return !this._disabled;
    }

    setEnabled(enabled)
    {
        this._disabled = !enabled;
    }

    // Private

    _buildDescriptor()
    {
        switch (this._type) {
        case "item":
            return {type: "item", id: this._id, label: this._label, enabled: !this._disabled};
        case "separator":
            return {type: "separator"};
        case "checkbox":
            return {type: "checkbox", id: this._id, label: this._label, checked: !!this._checked, enabled: !this._disabled};
        }
    }
};

WI.ContextSubMenuItem = class ContextSubMenuItem extends WI.ContextMenuItem
{
    constructor(topLevelMenu, label, disabled)
    {
        super(topLevelMenu, "subMenu", label, disabled);

        this._items = [];
    }

    // Public

    appendItem(label, handler, disabled)
    {
        let item = new WI.ContextMenuItem(this._contextMenu, "item", label, disabled);
        this.pushItem(item);
        this._contextMenu._setHandler(item.id(), handler);
        return item;
    }

    appendSubMenuItem(label, disabled)
    {
        let item = new WI.ContextSubMenuItem(this._contextMenu, label, disabled);
        this.pushItem(item);
        return item;
    }

    appendCheckboxItem(label, handler, checked, disabled)
    {
        let item = new WI.ContextMenuItem(this._contextMenu, "checkbox", label, disabled, checked);
        this.pushItem(item);
        this._contextMenu._setHandler(item.id(), handler);
        return item;
    }

    appendHeader(label)
    {
        return this.appendItem(label, () => {
            console.assert(false, "not reached");
        }, true);
    }

    appendSeparator()
    {
        if (this._items.length)
            this._pendingSeparator = true;
    }

    pushItem(item)
    {
        if (this._pendingSeparator) {
            this._items.push(new WI.ContextMenuItem(this._contextMenu, "separator"));
            this._pendingSeparator = null;
        }
        this._items.push(item);
    }

    isEmpty()
    {
        return !this._items.length;
    }

    // Private

    _buildDescriptor()
    {
        if (this.isEmpty())
            return null;

        let subItems = this._items.map((item) => item._buildDescriptor()).filter((item) => !!item);
        return {type: "subMenu", label: this._label, enabled: !this._disabled, subItems};
    }
};

WI.ContextMenu = class ContextMenu extends WI.ContextSubMenuItem
{
    constructor(event)
    {
        super(null, "");

        this._event = event;
        this._handlers = {};
        this._id = 0;

        this._beforeShowCallbacks = [];
    }

    // Static

    static createFromEvent(event, onlyExisting = false)
    {
        if (!event[WI.ContextMenu.ProposedMenuSymbol] && !onlyExisting)
            event[WI.ContextMenu.ProposedMenuSymbol] = new WI.ContextMenu(event);

        return event[WI.ContextMenu.ProposedMenuSymbol] || null;
    }

    static contextMenuItemSelected(id)
    {
        if (WI.ContextMenu._lastContextMenu)
            WI.ContextMenu._lastContextMenu._itemSelected(id);
    }

    static contextMenuCleared()
    {
        // FIXME: Unfortunately, contextMenuCleared is invoked between show and item selected
        // so we can't delete last menu object from WI. Fix the contract.
    }

    // Public

    nextId()
    {
        return this._id++;
    }

    show()
    {
        console.assert(this._event instanceof MouseEvent);

        let menuObject = this._buildDescriptor();
        if (menuObject.length) {
            WI.ContextMenu._lastContextMenu = this;

            if (this._event.type !== "contextmenu" && typeof InspectorFrontendHost.dispatchEventAsContextMenuEvent === "function") {
                console.assert(event.type !== "mousedown" || this._beforeShowCallbacks.length > 0, "Calling show() in a mousedown handler should have a before show callback to enable quick selection.");

                this._menuObject = menuObject;
                this._event.target.addEventListener("contextmenu", this, true);
                InspectorFrontendHost.dispatchEventAsContextMenuEvent(this._event);
            } else
                InspectorFrontendHost.showContextMenu(this._event, menuObject);
        }

        if (this._event)
            this._event.stopImmediatePropagation();
    }

    addBeforeShowCallback(callback)
    {
        this._beforeShowCallbacks.push(callback);
    }

    // Protected

    handleEvent(event)
    {
        console.assert(event.type === "contextmenu");

        for (let callback of this._beforeShowCallbacks)
            callback(this);

        this._event.target.removeEventListener("contextmenu", this, true);
        InspectorFrontendHost.showContextMenu(event, this._menuObject);
        this._menuObject = null;

        event.stopImmediatePropagation();
    }

    // Private

    _setHandler(id, handler)
    {
        if (handler)
            this._handlers[id] = handler;
    }

    _buildDescriptor()
    {
        return this._items.map((item) => item._buildDescriptor()).filter((item) => !!item);
    }

    _itemSelected(id)
    {
        try {
            if (this._handlers[id])
                this._handlers[id].call(this);
        } catch (e) {
            WI.reportInternalError(e);
        }
    }
};

WI.ContextMenu.ProposedMenuSymbol = Symbol("context-menu-proposed-menu");
