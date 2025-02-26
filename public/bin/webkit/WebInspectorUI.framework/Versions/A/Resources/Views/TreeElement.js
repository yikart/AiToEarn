/*
 * Copyright (C) 2007, 2013, 2015 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.TreeElement = class TreeElement extends WI.Object
{
    constructor(title, representedObject, options = {})
    {
        super();

        this._title = title;
        this.representedObject = representedObject || {};

        if (this.representedObject.__treeElementIdentifier)
            this.identifier = this.representedObject.__treeElementIdentifier;
        else {
            this.identifier = WI.TreeOutline._knownTreeElementNextIdentifier++;
            this.representedObject.__treeElementIdentifier = this.identifier;
        }

        this._hidden = false;
        this._selectable = true;
        this.expanded = false;
        this.selected = false;
        this.hasChildren = options.hasChildren;
        this.children = [];
        this.treeOutline = null;
        this.parent = null;
        this.previousSibling = null;
        this.nextSibling = null;
        this._listItemNode = null;
    }

    // Methods

    appendChild() { return WI.TreeOutline.prototype.appendChild.apply(this, arguments); }
    insertChild() { return WI.TreeOutline.prototype.insertChild.apply(this, arguments); }
    removeChild() { return WI.TreeOutline.prototype.removeChild.apply(this, arguments); }
    removeChildAtIndex() { return WI.TreeOutline.prototype.removeChildAtIndex.apply(this, arguments); }
    removeChildren() { return WI.TreeOutline.prototype.removeChildren.apply(this, arguments); }
    selfOrDescendant() { return WI.TreeOutline.prototype.selfOrDescendant.apply(this, arguments); }

    get arrowToggleWidth()
    {
        return 10;
    }

    get selectable()
    {
        if (this._hidden)
            return false;
        return this._selectable;
    }

    set selectable(x)
    {
        if (x === this._selectable)
            return;

        this._selectable = x;

        this._listItemNode?.classList.toggle("non-selectable", !this._selectable);
    }

    get expandable()
    {
        return this.hasChildren;
    }

    get listItemElement()
    {
        return this._listItemNode;
    }

    get title()
    {
        return this._title;
    }

    set title(x)
    {
        this._title = x;
        this._setListItemNodeContent();
        this.didChange();
    }

    get titleHTML()
    {
        return this._titleHTML;
    }

    set titleHTML(x)
    {
        this._titleHTML = x;
        this._setListItemNodeContent();
        this.didChange();
    }

    get tooltip()
    {
        return this._tooltip;
    }

    set tooltip(x)
    {
        this._tooltip = x;
        if (this._listItemNode)
            this._listItemNode.title = x ? x : "";
    }

    get hasChildren()
    {
        return this._hasChildren;
    }

    set hasChildren(x)
    {
        if (this._hasChildren === x)
            return;

        this._hasChildren = x;

        if (!this._listItemNode)
            return;

        if (x)
            this._listItemNode.classList.add("parent");
        else {
            this._listItemNode.classList.remove("parent");
            this.collapse();
        }

        this.didChange();
    }

    get hidden()
    {
        return this._hidden;
    }

    set hidden(x)
    {
        if (this._hidden === x)
            return;

        this._hidden = x;

        if (this._listItemNode)
            this._listItemNode.hidden = this._hidden;
        if (this._childrenListNode)
            this._childrenListNode.hidden = this._hidden;

        if (this.treeOutline) {
            if (this.treeOutline.virtualized)
                this.treeOutline.updateVirtualizedElementsDebouncer.delayForFrame();

            this.treeOutline.dispatchEventToListeners(WI.TreeOutline.Event.ElementVisibilityDidChange, {element: this});
        }
    }

    get shouldRefreshChildren()
    {
        return this._shouldRefreshChildren;
    }

    set shouldRefreshChildren(x)
    {
        this._shouldRefreshChildren = x;
        if (x && this.expanded)
            this.expand();
    }

    get previousSelectableSibling()
    {
        let treeElement = this.previousSibling;
        while (treeElement && !treeElement.selectable)
            treeElement = treeElement.previousSibling;
        return treeElement;
    }

    get nextSelectableSibling()
    {
        let treeElement = this.nextSibling;
        while (treeElement && !treeElement.selectable)
            treeElement = treeElement.nextSibling;
        return treeElement;
    }

    canSelectOnMouseDown(event)
    {
        // Overridden by subclasses if needed.
        return true;
    }

    _fireDidChange()
    {
        if (this.treeOutline)
            this.treeOutline._treeElementDidChange(this);
    }

    didChange()
    {
        if (!this.treeOutline)
            return;

        if (!this._fireDidChangeDebouncer) {
            this._fireDidChangeDebouncer = new Debouncer(() => {
                this._fireDidChange();
            });
        }

        this._fireDidChangeDebouncer.delayForFrame();
    }

    _setListItemNodeContent()
    {
        if (!this._listItemNode)
            return;

        if (!this._titleHTML && !this._title)
            this._listItemNode.removeChildren();
        else if (typeof this._titleHTML === "string")
            this._listItemNode.innerHTML = this._titleHTML;
        else if (typeof this._title === "string")
            this._listItemNode.textContent = this._title;
        else {
            this._listItemNode.removeChildren();
            if (this._title.parentNode)
                this._title.parentNode.removeChild(this._title);
            this._listItemNode.appendChild(this._title);
        }
    }

    _attach()
    {
        if (!this._listItemNode || this.parent._shouldRefreshChildren) {
            if (this.parent._shouldRefreshChildren)
                this._detach();

            this._listItemNode = this.treeOutline._childrenListNode.ownerDocument.createElement("li");
            this._listItemNode.treeElement = this;
            this._setListItemNodeContent();
            this._listItemNode.title = this._tooltip ? this._tooltip : "";
            this._listItemNode.hidden = this.hidden;
            this._listItemNode.role = "treeitem";

            if (this.hasChildren)
                this._listItemNode.classList.add("parent");
            if (this.expanded)
                this._listItemNode.classList.add("expanded");
            if (this.selected)
                this._listItemNode.classList.add("selected");
            if (!this.selectable)
                this._listItemNode.classList.add("non-selectable");

            this._listItemNode.addEventListener("click", WI.TreeElement.treeElementToggled);
            this._listItemNode.addEventListener("dblclick", WI.TreeElement.treeElementDoubleClicked);

            if (this.onattach)
                this.onattach(this);
        }

        var nextSibling = null;
        if (this.nextSibling && this.nextSibling._listItemNode && this.nextSibling._listItemNode.parentNode === this.parent._childrenListNode)
            nextSibling = this.nextSibling._listItemNode;

        if (!this.treeOutline || !this.treeOutline.virtualized) {
            this.parent._childrenListNode.insertBefore(this._listItemNode, nextSibling);
            if (this._childrenListNode)
                this.parent._childrenListNode.insertBefore(this._childrenListNode, this._listItemNode.nextSibling);
        }

        if (this.selected)
            this.select();
        if (this.expanded)
            this.expand();
    }

    _detach()
    {
        if (this.ondetach && this._listItemNode)
            this.ondetach(this);
        if (this._listItemNode && this._listItemNode.parentNode)
            this._listItemNode.parentNode.removeChild(this._listItemNode);
        if (this._childrenListNode && this._childrenListNode.parentNode)
            this._childrenListNode.parentNode.removeChild(this._childrenListNode);
    }

    static treeElementToggled(event)
    {
        let element = event.currentTarget;
        if (!element)
            return;

        let treeElement = element.treeElement;
        if (!treeElement)
            return;

        if (treeElement.toggleOnClick || treeElement.isEventWithinDisclosureTriangle(event)) {
            if (treeElement.expanded) {
                if (event.altKey)
                    treeElement.collapseRecursively();
                else
                    treeElement.collapse();
            } else {
                if (event.altKey)
                    treeElement.expandRecursively();
                else
                    treeElement.expand();
            }
            event.stopPropagation();
        }

        if (treeElement.treeOutline && !treeElement.treeOutline.selectable)
            treeElement.treeOutline.dispatchEventToListeners(WI.TreeOutline.Event.ElementClicked, {treeElement});
    }

    static treeElementDoubleClicked(event)
    {
        var element = event.currentTarget;
        if (!element || !element.treeElement)
            return;

        if (element.treeElement.isEventWithinDisclosureTriangle(event))
            return;

        if (element.treeElement.dispatchEventToListeners(WI.TreeElement.Event.DoubleClick))
            return;

        if (element.treeElement.ondblclick)
            element.treeElement.ondblclick.call(element.treeElement, event);
        else if (element.treeElement.hasChildren && !element.treeElement.expanded)
            element.treeElement.expand();
    }

    collapse()
    {
        if (this._listItemNode) {
            this._listItemNode.classList.remove("expanded");
            this._listItemNode.ariaExpanded = false;
        }
        if (this._childrenListNode) {
            this._childrenListNode.classList.remove("expanded");
            this._childrenListNode.ariaExpanded = false;
        }

        this.expanded = false;
        if (this.treeOutline)
            this.treeOutline._treeElementsExpandedState[this.identifier] = false;

        if (this.oncollapse)
            this.oncollapse(this);

        if (this.treeOutline) {
            if (this.treeOutline.virtualized)
                this.treeOutline.updateVirtualizedElementsDebouncer.delayForFrame();

            this.treeOutline.dispatchEventToListeners(WI.TreeOutline.Event.ElementDisclosureDidChanged, {element: this});
        }
    }

    collapseRecursively()
    {
        var item = this;
        while (item) {
            if (item.expanded)
                item.collapse();
            item = item.traverseNextTreeElement(false, this, true);
        }
    }

    expand()
    {
        if (this.expanded && !this._shouldRefreshChildren && this._childrenListNode)
            return;

        // Set this before onpopulate. Since onpopulate can add elements and dispatch an ElementAdded event,
        // this makes sure the expanded flag is true before calling those functions. This prevents the
        // possibility of an infinite loop if onpopulate or an event handler were to call expand.

        this.expanded = true;
        if (this.treeOutline)
            this.treeOutline._treeElementsExpandedState[this.identifier] = true;

        // If there are no children, return. We will be expanded once we have children.
        if (!this.hasChildren)
            return;

        if (this.treeOutline && (!this._childrenListNode || this._shouldRefreshChildren)) {
            if (this._childrenListNode && this._childrenListNode.parentNode)
                this._childrenListNode.parentNode.removeChild(this._childrenListNode);

            this._childrenListNode = this.treeOutline._childrenListNode.ownerDocument.createElement("ol");
            this._childrenListNode.parentTreeElement = this;
            this._childrenListNode.classList.add("children");
            this._childrenListNode.hidden = this.hidden;
            this._childrenListNode.role = "group";

            this.onpopulate();

            // It is necessary to set expanded to true again here because some subclasses will call
            // collapse in onpopulate (via removeChildren), which sets it back to false.
            this.expanded = true;

            for (var i = 0; i < this.children.length; ++i)
                this.children[i]._attach();

            this._shouldRefreshChildren = false;
        }

        if (this._listItemNode) {
            this._listItemNode.classList.add("expanded");
            this._listItemNode.ariaExpanded = true;

            if (this._childrenListNode && this._childrenListNode.parentNode !== this._listItemNode.parentNode)
                this.parent._childrenListNode.insertBefore(this._childrenListNode, this._listItemNode.nextSibling);
        }

        if (this._childrenListNode) {
            this._childrenListNode.classList.add("expanded");
            this._childrenListNode.ariaExpanded = true;
        }

        if (this.onexpand)
            this.onexpand(this);

        if (this.treeOutline) {
            if (this.treeOutline.virtualized)
                this.treeOutline.updateVirtualizedElementsDebouncer.delayForFrame();

            this.treeOutline.dispatchEventToListeners(WI.TreeOutline.Event.ElementDisclosureDidChanged, {element: this});
        }
    }

    expandRecursively(maxDepth)
    {
        var item = this;
        var info = {};
        var depth = 0;

        // The Inspector uses TreeOutlines to represents object properties, so recursive expansion
        // in some case can be infinite, since JavaScript objects can hold circular references.
        // So default to a recursion cap of 3 levels, since that gives fairly good results.
        if (maxDepth === undefined)
            maxDepth = 3;

        while (item) {
            if (depth < maxDepth)
                item.expand();
            item = item.traverseNextTreeElement(false, this, depth >= maxDepth, info);
            depth += info.depthChange;
        }
    }

    hasAncestor(ancestor)
        {
        if (!ancestor)
            return false;

        var currentNode = this.parent;
        while (currentNode) {
            if (ancestor === currentNode)
                return true;
            currentNode = currentNode.parent;
        }

        return false;
    }

    reveal({skipExpandingAncestors} = {})
    {
        if (!skipExpandingAncestors) {
            let currentAncestor = this.parent;
            while (currentAncestor && !currentAncestor.root) {
                if (!currentAncestor.expanded)
                    currentAncestor.expand();
                currentAncestor = currentAncestor.parent;
            }
        }

        // This must be called before onreveal, as some subclasses will scrollIntoViewIfNeeded and
        // we should update the visible elements before attempting to scroll.
        if (this.treeOutline && this.treeOutline.virtualized)
            this.treeOutline.updateVirtualizedElementsDebouncer.force(this);

        if (this.onreveal)
            this.onreveal(this);

        if (this.treeOutline)
            this.treeOutline.dispatchEventToListeners(WI.TreeOutline.Event.ElementRevealed, {element: this});
    }

    revealed(ignoreHidden)
    {
        if (!ignoreHidden && this.hidden)
            return false;

        var currentAncestor = this.parent;
        while (currentAncestor && !currentAncestor.root) {
            if (!currentAncestor.expanded)
                return false;
            if (!ignoreHidden && currentAncestor.hidden)
                return false;
            currentAncestor = currentAncestor.parent;
        }

        return true;
    }

    select(omitFocus, selectedByUser, suppressNotification)
    {
        let treeOutline = this.treeOutline;
        if (!treeOutline || !this.selectable)
            return;

        if (!omitFocus)
            this.focus();
        else if (treeOutline.element.contains(document.activeElement)) {
            // When treeOutline has focus, focus on the newly selected treeElement.
            this.focus();
        }

        if (this.selected && !this.treeOutline.allowsRepeatSelection)
            return;

        // Focusing on another node may detach "this" from tree.
        treeOutline = this.treeOutline;
        if (!treeOutline)
            return;

        this.selected = true;
        treeOutline.selectTreeElementInternal(this, suppressNotification, selectedByUser);

        if (this._listItemNode)
            this._listItemNode.ariaSelected = true;
    }

    revealAndSelect(omitFocus, selectedByUser, suppressNotification)
    {
        this.reveal();
        this.select(omitFocus, selectedByUser, suppressNotification);
    }

    deselect(suppressNotification)
    {
        if (!this.treeOutline || !this.selected)
            return false;

        this.selected = false;
        this.treeOutline.selectTreeElementInternal(null, suppressNotification);

        if (this._listItemNode) {
            this.unfocus();
            this._listItemNode.ariaSelected = false;
        }

        return true;
    }

    focus()
    {
        if (!this._listItemNode)
            return;

        this._listItemNode.tabIndex = 0;
        this._listItemNode.focus();
    }

    unfocus()
    {
        if (!this._listItemNode)
            return;

        this._listItemNode.removeAttribute("tabIndex");
    }

    onpopulate()
    {
        // Overridden by subclasses.
    }

    traverseNextTreeElement(skipUnrevealed, stayWithin, dontPopulate, info)
    {
        function shouldSkip(element) {
            return skipUnrevealed && !element.revealed(true);
        }

        var depthChange = 0;
        var element = this;

        if (!dontPopulate)
            element.onpopulate();

        do {
            if (element.hasChildren && element.children[0] && (!skipUnrevealed || element.expanded)) {
                element = element.children[0];
                depthChange += 1;
            } else {
                while (element && !element.nextSibling && element.parent && !element.parent.root && element.parent !== stayWithin) {
                    element = element.parent;
                    depthChange -= 1;
                }

                if (element)
                    element = element.nextSibling;
            }
        } while (element && shouldSkip(element));

        if (info)
            info.depthChange = depthChange;

        return element;
    }

    traversePreviousTreeElement(skipUnrevealed, dontPopulate)
    {
        function shouldSkip(element) {
            return skipUnrevealed && !element.revealed(true);
        }

        var element = this;

        do {
            if (element.previousSibling) {
                element = element.previousSibling;

                while (element && element.hasChildren && element.expanded && !shouldSkip(element)) {
                    if (!dontPopulate)
                        element.onpopulate();
                    element = element.children.lastValue;
                }
            } else
                element = element.parent && element.parent.root ? null : element.parent;
        } while (element && shouldSkip(element));

        return element;
    }

    isEventWithinDisclosureTriangle(event)
    {
        if (!document.contains(this._listItemNode))
            return false;

        // FIXME: We should not use getComputedStyle(). For that we need to get rid of using ::before for disclosure triangle. (http://webk.it/74446)
        let computedStyle = window.getComputedStyle(this._listItemNode);
        let start = 0;
        if (computedStyle.direction === WI.LayoutDirection.RTL)
            start += this._listItemNode.totalOffsetRight - this._listItemNode.getComputedCSSPropertyNumberValue("padding-right") - this.arrowToggleWidth;
        else
            start += this._listItemNode.totalOffsetLeft + this._listItemNode.getComputedCSSPropertyNumberValue("padding-left");

        return event.pageX >= start && event.pageX <= start + this.arrowToggleWidth && this.hasChildren;
    }

    populateContextMenu(contextMenu, event)
    {
        if (this.children.some((child) => child.hasChildren) || (this.hasChildren && !this.children.length)) {
            contextMenu.appendSeparator();

            contextMenu.appendItem(WI.UIString("Expand All"), this.expandRecursively.bind(this));
            contextMenu.appendItem(WI.UIString("Collapse All"), this.collapseRecursively.bind(this));
        }
    }
};

WI.TreeElement.Event = {
    DoubleClick: "tree-element-double-click",
};
