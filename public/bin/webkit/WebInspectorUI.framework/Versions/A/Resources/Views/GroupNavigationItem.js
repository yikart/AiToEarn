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

WI.GroupNavigationItem = class GroupNavigationItem extends WI.NavigationItem
{
    constructor(navigationItems)
    {
        console.assert(!navigationItems || Array.isArray(navigationItems));

        super();

        this._needsUpdate = false;

        this.navigationItems = navigationItems || [];
    }

    // Public

    get navigationItems()
    {
        return this._navigationItems;
    }

    set navigationItems(items)
    {
        this._navigationItems = items;

        // Wait until a layout to update the DOM.
        this._needsUpdate = true;
    }

    get hidden()
    {
        return super.hidden || this._navigationItems.every((item) => item.hidden);
    }

    set hidden(flag)
    {
        super.hidden = flag;
    }

    get width()
    {
        this._updateItems();

        return super.width;
    }

    get minimumWidth()
    {
        this._updateItems();

        return this._navigationItems.reduce((total, item) => total + item.minimumWidth, 0);
    }

    // Protected

    get additionalClassNames()
    {
        return ["group"];
    }

    update(options = {})
    {
        super.update(options);

        this._updateItems();

        for (let item of this._navigationItems)
            item.update(options);
    }

    didAttach(navigationBar)
    {
        super.didAttach(navigationBar);

        this._updateItems();

        for (let item of this._navigationItems)
            item.didAttach(navigationBar);
    }

    didDetach()
    {
        for (let item of this._navigationItems)
            item.didDetach();

        super.didDetach();
    }

    // Private

    _updateItems()
    {
        if (!this._needsUpdate)
            return;

        this._needsUpdate = false;

        this.element.removeChildren();

        for (let item of this._navigationItems) {
            console.assert(item instanceof WI.NavigationItem);
            this.element.appendChild(item.element);
        }
    }
};
