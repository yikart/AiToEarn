/*
 * Copyright (C) 2007, 2008, 2013, 2015 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
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

WI.DOMTreeOutline = class DOMTreeOutline extends WI.TreeOutline
{
    constructor({selectable, omitRootDOMNode, excludeRevealElementContextMenu, showInspectedNode, showBadges} = {})
    {
        super(selectable);

        this.element.addEventListener("mousedown", this._onmousedown.bind(this), false);
        this.element.addEventListener("mousemove", this._onmousemove.bind(this), false);
        this.element.addEventListener("mouseout", this._onmouseout.bind(this), false);
        this.element.addEventListener("dragstart", this._ondragstart.bind(this), false);
        this.element.addEventListener("dragover", this._ondragover.bind(this), false);
        this.element.addEventListener("dragleave", this._ondragleave.bind(this), false);
        this.element.addEventListener("drop", this._ondrop.bind(this), false);
        this.element.addEventListener("dragend", this._ondragend.bind(this), false);

        this.element.classList.add("dom", WI.SyntaxHighlightedStyleClassName);
        this.element.dir = "ltr";
        this.element.role = "tree";

        this._includeRootDOMNode = !omitRootDOMNode;
        this._excludeRevealElementContextMenu = excludeRevealElementContextMenu;
        this._rootDOMNode = null;
        this._selectedDOMNode = null;
        this._treeElementsToRemove = null;

        this._editable = false;
        this._editing = false;
        this._visible = false;
        this._usingLocalDOMNode = false;

        this._hideElementsKeyboardShortcut = new WI.KeyboardShortcut(null, "H", this._hideElements.bind(this), this.element);
        this._hideElementsKeyboardShortcut.implicitlyPreventsDefault = false;

        this._showInspectedNode = !!showInspectedNode;
        if (this._showInspectedNode)
            WI.domManager.addEventListener(WI.DOMManager.Event.InspectedNodeChanged, this._handleInspectedNodeChanged, this);

        this._showBadges = !!showBadges;
    }

    // Public

    wireToDomAgent()
    {
        this._elementsTreeUpdater = new WI.DOMTreeUpdater(this);
    }

    close()
    {
        if (this._elementsTreeUpdater) {
            this._elementsTreeUpdater.close();
            this._elementsTreeUpdater = null;
        }
    }

    setVisible(visible, omitFocus)
    {
        this._visible = visible;
        if (!this._visible)
            return;

        this._updateModifiedNodes();

        if (this._selectedDOMNode)
            this._revealAndSelectNode(this._selectedDOMNode, omitFocus);

        this.update();
    }

    get rootDOMNode()
    {
        return this._rootDOMNode;
    }

    set rootDOMNode(x)
    {
        if (this._rootDOMNode === x)
            return;

        this._rootDOMNode = x;

        this._isXMLMimeType = x && x.isXMLNode();

        this.update();
    }

    get isXMLMimeType()
    {
        return this._isXMLMimeType;
    }

    markAsUsingLocalDOMNode()
    {
        this._editable = false;
        this._usingLocalDOMNode = true;
    }

    selectedDOMNode()
    {
        return this._selectedDOMNode;
    }

    selectDOMNode(node, focus)
    {
        if (this._selectedDOMNode === node) {
            this._revealAndSelectNode(node, !focus);
            return;
        }

        this._selectedDOMNode = node;
        this._revealAndSelectNode(node, !focus);

        // The _revealAndSelectNode() method might find a different element if there is inlined text,
        // and the select() call would change the selectedDOMNode and reenter this setter. So to
        // avoid calling _selectedNodeChanged() twice, first check if _selectedDOMNode is the same
        // node as the one passed in.
        // Note that _revealAndSelectNode will not do anything for a null node.
        if (!node || this._selectedDOMNode === node)
            this._selectedNodeChanged();
    }

    get editable()
    {
        return this._editable && this.rootDOMNode && !this.rootDOMNode.destroyed;
    }

    set editable(x)
    {
        this._editable = x;
    }

    get editing()
    {
        return this._editing;
    }

    update()
    {
        if (!this.rootDOMNode)
            return;

        let selectedTreeElements = this.selectedTreeElements;

        this.removeChildren();

        const elementCloseTag = false;

        var treeElement;
        if (this._includeRootDOMNode) {
            treeElement = new WI.DOMTreeElement(this.rootDOMNode, elementCloseTag, {showBadges: this._showBadges});
            treeElement.selectable = this.selectable;
            this.appendChild(treeElement);
        } else {
            // FIXME: this could use findTreeElement to reuse a tree element if it already exists
            var node = this.rootDOMNode.firstChild;
            while (node) {
                treeElement = new WI.DOMTreeElement(node, elementCloseTag, {showBadges: this._showBadges});
                treeElement.selectable = this.selectable;
                this.appendChild(treeElement);
                node = node.nextSibling;

                if (treeElement.expandable && !treeElement.expanded)
                    treeElement.expand();
            }
        }

        if (this._showInspectedNode && WI.domManager.inspectedNode) {
            let inspectedNodeTreeElement = this.findTreeElement(WI.domManager.inspectedNode);
            if (inspectedNodeTreeElement) {
                inspectedNodeTreeElement.reveal();
                inspectedNodeTreeElement.listItemElement.classList.add("inspected-node");
            }
        }

        if (!selectedTreeElements.length)
            return;

        // The selection cannot be restored from represented objects alone,
        // since a closing tag DOMTreeElement has the same represented object
        // as its parent.
        selectedTreeElements = selectedTreeElements.map((oldTreeElement) => {
            let treeElement = this.findTreeElement(oldTreeElement.representedObject);
            if (treeElement && oldTreeElement.isCloseTag()) {
                console.assert(treeElement.closeTagTreeElement, "Missing close tag TreeElement.", treeElement);
                if (treeElement.closeTagTreeElement)
                    treeElement = treeElement.closeTagTreeElement;
            }
            return treeElement;
        });

        // It's possible that a previously selected node will no longer exist (e.g. after navigation).
        selectedTreeElements = selectedTreeElements.filter((x) => !!x);

        if (!selectedTreeElements.length)
            return;

        this.selectTreeElements(selectedTreeElements);

        if (this.selectedTreeElement)
            this.selectedTreeElement.reveal();
    }

    updateSelectionArea()
    {
        // This will miss updating selection areas used for the hovered tree element and
        // and those used to show forced pseudo class indicators, but this should be okay.
        // The hovered element will update when user moves the mouse, and indicators don't need the
        // selection area height to be accurate since they use ::before to place the indicator.
        let selectedTreeElements = this.selectedTreeElements;
        for (let treeElement of selectedTreeElements)
            treeElement.updateSelectionArea();
    }

    toggleSelectedElementsVisibility(forceHidden)
    {
        for (let treeElement of this.selectedTreeElements)
            treeElement.toggleElementVisibility(forceHidden);
    }

    _selectedNodeChanged()
    {
        this.dispatchEventToListeners(WI.DOMTreeOutline.Event.SelectedNodeChanged);
    }

    findTreeElement(node)
    {
        let isAncestorNode = (ancestor, node) => ancestor.isAncestor(node);
        let parentNode = (node) => node.parentNode;
        let treeElement = super.findTreeElement(node, isAncestorNode, parentNode);
        if (!treeElement && node.nodeType() === Node.TEXT_NODE) {
            // The text node might have been inlined if it was short, so try to find the parent element.
            treeElement = super.findTreeElement(node.parentNode, isAncestorNode, parentNode);
        }

        return treeElement;
    }

    createTreeElementFor(node)
    {
        var treeElement = this.findTreeElement(node);
        if (treeElement)
            return treeElement;

        if (!node.parentNode)
            return null;

        treeElement = this.createTreeElementFor(node.parentNode);
        if (!treeElement)
            return null;

        return treeElement.showChildNode(node);
    }

    set suppressRevealAndSelect(x)
    {
        if (this._suppressRevealAndSelect === x)
            return;
        this._suppressRevealAndSelect = x;
    }

    populateContextMenu(contextMenu, event, treeElement)
    {
        let subMenus = {
            add: new WI.ContextSubMenuItem(contextMenu, WI.UIString("Add")),
            edit: new WI.ContextSubMenuItem(contextMenu, WI.UIString("Edit")),
            copy: new WI.ContextSubMenuItem(contextMenu, WI.UIString("Copy")),
            delete: new WI.ContextSubMenuItem(contextMenu, WI.UIString("Delete")),
        };

        if (this.editable && treeElement.selected && this.selectedTreeElements.length > 1) {
            subMenus.delete.appendItem(WI.UIString("Nodes"), () => {
                this.ondelete();
            });
        }

        if (treeElement.populateDOMNodeContextMenu)
            treeElement.populateDOMNodeContextMenu(contextMenu, subMenus, event, subMenus);

        let options = {
            disallowEditing: !this.editable,
            usingLocalDOMNode: this._usingLocalDOMNode,
            excludeRevealElement: this._excludeRevealElementContextMenu,
            copySubMenu: subMenus.copy,
            popoverTargetElement: treeElement.statusImageElement,
        };

        if (treeElement.bindRevealDescendantBreakpointsMenuItemHandler)
            options.revealDescendantBreakpointsMenuItemHandler = treeElement.bindRevealDescendantBreakpointsMenuItemHandler();

        WI.appendContextMenuItemsForDOMNode(contextMenu, treeElement.representedObject, options);

        super.populateContextMenu(contextMenu, event, treeElement);
    }

    adjustCollapsedRange()
    {
    }

    ondelete()
    {
        if (!this.editable)
            return false;

        this._treeElementsToRemove = this.selectedTreeElements;

        // Reveal all of the elements being deleted so that if the node is hidden (e.g. the parent
        // is collapsed), we can select its siblings instead of the parent itself.
        for (let treeElement of this._treeElementsToRemove)
            treeElement.reveal();

        this._selectionController.removeSelectedItems();

        let levelMap = new Map;

        function getLevel(treeElement) {
            let level = levelMap.get(treeElement);
            if (isNaN(level)) {
                level = 0;
                let current = treeElement;
                while (current = current.parent)
                    level++;
                levelMap.set(treeElement, level);
            }
            return level;
        }

        // Sort in descending order by node level. This ensures that child nodes
        // are removed before their ancestors.
        this._treeElementsToRemove.sort((a, b) => getLevel(b) - getLevel(a));

        // Track removed elements, since the opening and closing tags for the
        // same WI.DOMNode can both be selected.
        let removedDOMNodes = new Set;

        for (let treeElement of this._treeElementsToRemove) {
            if (removedDOMNodes.has(treeElement.representedObject))
                continue;
            removedDOMNodes.add(treeElement.representedObject);
            treeElement.remove();
        }

        this._treeElementsToRemove = null;

        if (this.selectedTreeElement && !this.selectedTreeElement.isCloseTag()) {
            console.assert(this.selectedTreeElements.length === 1);
            this.selectedTreeElement.reveal();
        }

        return true;
    }

    // SelectionController delegate overrides

    selectionControllerPreviousSelectableItem(controller, item)
    {
        let treeElement = this.getCachedTreeElement(item);
        console.assert(treeElement, "Missing TreeElement for representedObject.", item);
        if (!treeElement)
            return null;

        if (this._treeElementsToRemove) {
            // When deleting, force the SelectionController to check siblings in
            // the opposite direction before searching up the parent chain.
            if (!treeElement.previousSelectableSibling && treeElement.nextSelectableSibling)
                return null;
        }

        return super.selectionControllerPreviousSelectableItem(controller, item);
    }

    // Protected

    canSelectTreeElement(treeElement)
    {
        if (!super.canSelectTreeElement(treeElement))
            return false;

        let willRemoveAncestorOrSelf = false;
        if (this._treeElementsToRemove) {
            while (treeElement && !willRemoveAncestorOrSelf) {
                willRemoveAncestorOrSelf = this._treeElementsToRemove.includes(treeElement);
                treeElement = treeElement.parent;
            }
        }

        return !willRemoveAncestorOrSelf;
    }

    objectForSelection(treeElement)
    {
        if (treeElement instanceof WI.DOMTreeElement && treeElement.isCloseTag()) {
            // SelectionController requires every selectable item to be unique.
            // The DOMTreeElement for a close tag has the same represented object
            // as it's parent (the open tag). Return a proxy object associated
            // with the tree element for the close tag so it can be selected.
            if (!treeElement.__closeTagProxyObject)
                treeElement.__closeTagProxyObject = {__proxyObjectTreeElement: treeElement};
            return treeElement.__closeTagProxyObject;
        }

        return super.objectForSelection(treeElement);
    }

    // Private

    _revealAndSelectNode(node, omitFocus)
    {
        if (!node || this._suppressRevealAndSelect)
            return;

        var treeElement = this.createTreeElementFor(node);
        if (!treeElement)
            return;

        treeElement.revealAndSelect(omitFocus);
    }

    _onmousedown(event)
    {
        let element = this.treeElementFromEvent(event);
        if (!element || element.isEventWithinDisclosureTriangle(event)) {
            event.preventDefault();
            return;
        }
    }

    _onmousemove(event)
    {
        if (this._usingLocalDOMNode)
            return;

        let element = this.treeElementFromEvent(event);
        if (element && this._previousHoveredElement === element)
            return;

        if (this._previousHoveredElement) {
            this._previousHoveredElement.hovered = false;
            this._previousHoveredElement = null;
        }

        if (element instanceof WI.DOMTreeElement) {
            element.hovered = true;
            this._previousHoveredElement = element;

            if (element.representedObject) {
                // Lazily compute tag-specific tooltips.
                if (!element.tooltip && element._createTooltipForNode)
                    element._createTooltipForNode();

                element.representedObject.highlight();
            } else
                WI.domManager.hideDOMNodeHighlight();
        } else
            WI.domManager.hideDOMNodeHighlight();
    }

    _onmouseout(event)
    {
        if (this._usingLocalDOMNode)
            return;

        var nodeUnderMouse = document.elementFromPoint(event.pageX, event.pageY);
        if (nodeUnderMouse && this.element.contains(nodeUnderMouse))
            return;

        if (this._previousHoveredElement) {
            this._previousHoveredElement.hovered = false;
            this._previousHoveredElement = null;
        }

        WI.domManager.hideDOMNodeHighlight();
    }

    _ondragstart(event)
    {
        if (!this.editable)
            return false;

        let treeElement = this.treeElementFromEvent(event);
        if (!treeElement)
            return false;

        event.dataTransfer.effectAllowed = "copyMove";
        event.dataTransfer.setData(DOMTreeOutline.DOMNodeIdDragType, treeElement.representedObject.id);

        if (!this._isValidDragSourceOrTarget(treeElement))
            return false;

        if (treeElement.representedObject.nodeName() === "BODY" || treeElement.representedObject.nodeName() === "HEAD")
            return false;

        event.dataTransfer.setData("text/plain", treeElement.listItemElement.textContent);
        this._nodeBeingDragged = treeElement.representedObject;

        WI.domManager.hideDOMNodeHighlight();

        return true;
    }

    _ondragover(event)
    {
        if (!this.editable)
            return false;

        if (event.dataTransfer.types.includes(WI.GeneralStyleDetailsSidebarPanel.ToggledClassesDragType)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            return false;
        }

        if (!this._nodeBeingDragged)
            return false;

        let treeElement = this.treeElementFromEvent(event);
        if (!this._isValidDragSourceOrTarget(treeElement))
            return false;

        let node = treeElement.representedObject;
        while (node) {
            if (node === this._nodeBeingDragged)
                return false;
            node = node.parentNode;
        }

        this.dragOverTreeElement = treeElement;
        treeElement.listItemElement.classList.add("elements-drag-over");
        treeElement.updateSelectionArea();

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        return false;
    }

    _ondragleave(event)
    {
        if (!this.editable)
            return false;

        this._clearDragOverTreeElementMarker();
        event.preventDefault();
        return false;
    }

    _isValidDragSourceOrTarget(treeElement)
    {
        if (!treeElement)
            return false;

        var node = treeElement.representedObject;
        if (!(node instanceof WI.DOMNode))
            return false;

        if (!node.parentNode || node.parentNode.nodeType() !== Node.ELEMENT_NODE)
            return false;

        return true;
    }

    _ondrop(event)
    {
        if (!this.editable)
            return;

        event.preventDefault();

        function callback(error, newNodeId)
        {
            if (error)
                return;

            this._updateModifiedNodes();
            var newNode = WI.domManager.nodeForId(newNodeId);
            if (newNode)
                this.selectDOMNode(newNode, true);
        }

        let treeElement = this.treeElementFromEvent(event);
        if (this._nodeBeingDragged && treeElement) {
            let parentNode = null;
            let anchorNode = null;

            if (treeElement._elementCloseTag) {
                // Drop onto closing tag -> insert as last child.
                parentNode = treeElement.representedObject;
            } else {
                let dragTargetNode = treeElement.representedObject;
                parentNode = dragTargetNode.parentNode;
                anchorNode = dragTargetNode;
            }

            this._nodeBeingDragged.moveTo(parentNode, anchorNode, callback.bind(this));
        } else {
            let className = event.dataTransfer.getData(WI.GeneralStyleDetailsSidebarPanel.ToggledClassesDragType);
            if (className && treeElement)
                treeElement.representedObject.toggleClass(className, true);
        }

        delete this._nodeBeingDragged;
    }

    _ondragend(event)
    {
        if (!this.editable)
            return;

        event.preventDefault();
        this._clearDragOverTreeElementMarker();
        delete this._nodeBeingDragged;
    }

    _clearDragOverTreeElementMarker()
    {
        if (this.dragOverTreeElement) {
            let element = this.dragOverTreeElement;
            this.dragOverTreeElement = null;

            element.listItemElement.classList.remove("elements-drag-over");
            element.updateSelectionArea();
        }
    }

    _updateModifiedNodes()
    {
        if (this._elementsTreeUpdater)
            this._elementsTreeUpdater._updateModifiedNodes();
    }

    _handleInspectedNodeChanged(event)
    {
        let {lastInspectedNode} = event.data;

        if (lastInspectedNode) {
            let lastInspectedNodeTreeElement = this.findTreeElement(lastInspectedNode);
            if (lastInspectedNodeTreeElement)
                lastInspectedNodeTreeElement.listItemElement.classList.remove("inspected-node");
        }

        let inspectedNodeTreeElement = this.findTreeElement(WI.domManager.inspectedNode);
        if (inspectedNodeTreeElement)
            inspectedNodeTreeElement.listItemElement.classList.add("inspected-node");
    }

    _hideElements(event, keyboardShortcut)
    {
        if (!this.editable)
            return;

        if (!this.selectedTreeElement || WI.isEditingAnyField())
            return;

        event.preventDefault();

        let forceHidden = !this.selectedTreeElements.every((treeElement) => treeElement.isNodeHidden);
        this.toggleSelectedElementsVisibility(forceHidden);
    }
};

WI.DOMTreeOutline.Event = {
    SelectedNodeChanged: "dom-tree-outline-selected-node-changed"
};

WI.DOMTreeOutline.DOMNodeIdDragType = "web-inspector/dom-node-id";
