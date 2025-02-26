/*
 * Copyright (C) 2007, 2008, 2013, 2016 Apple Inc.  All rights reserved.
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

WI.DOMTreeUpdater = function(treeOutline)
{
    WI.domManager.addEventListener(WI.DOMManager.Event.NodeInserted, this._nodeInserted, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.NodeRemoved, this._nodeRemoved, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.AttributeModified, this._attributesUpdated, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.AttributeRemoved, this._attributesUpdated, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.CharacterDataModified, this._characterDataModified, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.DocumentUpdated, this._documentUpdated, this);
    WI.domManager.addEventListener(WI.DOMManager.Event.ChildNodeCountUpdated, this._childNodeCountUpdated, this);

    this._treeOutline = treeOutline;

    this._recentlyInsertedNodes = new Map;
    this._recentlyDeletedNodes = new Map;
    this._recentlyModifiedNodes = new Set;
    // Map from attribute names to nodes that had the attributes.
    this._recentlyModifiedAttributes = new Map;

    // Dummy "attribute" that is used to track textContent changes.
    this._textContentAttributeSymbol = Symbol("text-content-attribute");

    this._updateModifiedNodesDebouncer = new Debouncer(() => {
        this._updateModifiedNodes();
    });
};

WI.DOMTreeUpdater.prototype = {
    close: function()
    {
        WI.domManager.removeEventListener(WI.DOMManager.Event.NodeInserted, this._nodeInserted, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.NodeRemoved, this._nodeRemoved, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeModified, this._attributesUpdated, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeRemoved, this._attributesUpdated, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.CharacterDataModified, this._characterDataModified, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.DocumentUpdated, this._documentUpdated, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.ChildNodeCountUpdated, this._childNodeCountUpdated, this);
    },

    _documentUpdated: function(event)
    {
        this._reset();
    },

    _attributesUpdated: function(event)
    {
        let {node, name} = event.data;
        this._nodeAttributeModified(node, name);
    },

    _characterDataModified: function(event)
    {
        let {node} = event.data;
        this._nodeAttributeModified(node, this._textContentAttributeSymbol);
    },

    _nodeAttributeModified: function(node, attribute)
    {
        if (!this._recentlyModifiedAttributes.has(attribute))
            this._recentlyModifiedAttributes.set(attribute, new Set);
        this._recentlyModifiedAttributes.get(attribute).add(node);
        this._recentlyModifiedNodes.add(node);

        if (this._treeOutline._visible)
            this._updateModifiedNodesDebouncer.delayForFrame();
      },

    _nodeInserted: function(event)
    {
        this._recentlyInsertedNodes.set(event.data.node, {parent: event.data.parent});
        if (this._treeOutline._visible)
            this._updateModifiedNodesDebouncer.delayForFrame();
    },

    _nodeRemoved: function(event)
    {
        let parent = event.data.parent;
        if (!parent)
            return;

        this._recentlyDeletedNodes.set(event.data.node, {parent});
        if (this._treeOutline._visible)
            this._updateModifiedNodesDebouncer.delayForFrame();
    },

    _childNodeCountUpdated: function(event)
    {
        var treeElement = this._treeOutline.findTreeElement(event.data);
        if (treeElement)
            treeElement.hasChildren = event.data.hasChildNodes();
    },

    _updateModifiedNodes: function()
    {
        let documentNeedsUpdated = false;

        // Update for insertions and deletions before attribute modifications. This ensures
        // tree elements get created for newly attached children before we try to update them.
        let parentElementsToUpdate = new Set;
        let markNodeParentForUpdate = (value, key, map) => {
            if (documentNeedsUpdated)
                return;

            let parentNode = value.parent;
            if (parentNode.nodeType() === Node.DOCUMENT_NODE) {
                documentNeedsUpdated = true;
                return;
            }

            let parentTreeElement = this._treeOutline.findTreeElement(parentNode);
            if (parentTreeElement)
                parentElementsToUpdate.add(parentTreeElement);
        };
        this._recentlyInsertedNodes.forEach(markNodeParentForUpdate);
        this._recentlyDeletedNodes.forEach(markNodeParentForUpdate);

        if (documentNeedsUpdated)
            this._treeOutline.update();
        else {
            for (let parentTreeElement of parentElementsToUpdate) {
                if (parentTreeElement.treeOutline && parentTreeElement.listItemElement) {
                    parentTreeElement.updateTitle();
                    parentTreeElement.updateChildren();
                }
            }

            for (let node of this._recentlyModifiedNodes.values()) {
                let nodeTreeElement = this._treeOutline.findTreeElement(node);
                if (!nodeTreeElement)
                    continue;

                for (let [attribute, nodes] of this._recentlyModifiedAttributes.entries()) {
                    // Don't report textContent changes as attribute modifications.
                    if (attribute === this._textContentAttributeSymbol)
                        continue;

                    if (nodes.has(node))
                        nodeTreeElement.attributeDidChange(attribute);
                }

                nodeTreeElement.updateTitle();
            }
        }

        this._recentlyInsertedNodes.clear();
        this._recentlyDeletedNodes.clear();
        this._recentlyModifiedNodes.clear();
        this._recentlyModifiedAttributes.clear();
    },

    _reset: function()
    {
        WI.domManager.hideDOMNodeHighlight();

        this._recentlyInsertedNodes.clear();
        this._recentlyDeletedNodes.clear();
        this._recentlyModifiedNodes.clear();
        this._recentlyModifiedAttributes.clear();
    }
};
