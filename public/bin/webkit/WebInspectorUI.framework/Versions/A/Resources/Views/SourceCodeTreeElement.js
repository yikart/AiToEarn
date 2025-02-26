/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.SourceCodeTreeElement = class SourceCodeTreeElement extends WI.FolderizedTreeElement
{
    constructor(sourceCode, classNames, title, subtitle, representedObject)
    {
        console.assert(sourceCode instanceof WI.SourceCode);

        super(classNames, title, subtitle, representedObject || sourceCode);

        this._updateSourceCode(sourceCode);
    }

    // Public

    updateSourceMapResources()
    {
        if (!this.treeOutline || !this.treeOutline.includeSourceMapResourceChildren)
            return;

        this.hasChildren = !!this._sourceCode.sourceMaps.length;
        this.shouldRefreshChildren = this.hasChildren;

        if (!this.hasChildren)
            this.removeChildren();
    }

    // Overrides from TreeElement

    onattach()
    {
        super.onattach();

        this.updateSourceMapResources();
    }

    onpopulate()
    {
        if (!this.treeOutline || !this.treeOutline.includeSourceMapResourceChildren)
            return;

        if (!this.hasChildren || !this.shouldRefreshChildren)
            return;

        this.shouldRefreshChildren = false;

        this.removeChildren();

        function combineFolderChain(topFolder, bottomFolder)
        {
            console.assert(topFolder.children.length === 1);

            var components = [];

            for (var currentFolder = bottomFolder; currentFolder !== topFolder; currentFolder = currentFolder.parent)
                components.push(currentFolder.mainTitle);
            components.push(topFolder.mainTitle);

            var folderName = components.reverse().join("/");
            var newFolder = new WI.FolderTreeElement(folderName);

            var folderIndex = topFolder.parent.children.indexOf(topFolder);
            topFolder.parent.insertChild(newFolder, folderIndex);
            topFolder.parent.removeChild(topFolder);

            var children = bottomFolder.children;
            bottomFolder.removeChildren();
            for (var i = 0; i < children.length; ++i)
                newFolder.appendChild(children[i]);
        }

        function findAndCombineFolderChains(treeElement, previousSingleTreeElement)
        {
            if (!(treeElement instanceof WI.FolderTreeElement)) {
                if (previousSingleTreeElement && previousSingleTreeElement !== treeElement.parent)
                    combineFolderChain(previousSingleTreeElement, treeElement.parent);
                return;
            }

            if (previousSingleTreeElement && treeElement.children.length !== 1) {
                combineFolderChain(previousSingleTreeElement, treeElement);
                previousSingleTreeElement = null;
            }

            if (!previousSingleTreeElement && treeElement.children.length === 1)
                previousSingleTreeElement = treeElement;

            for (var i = 0; i < treeElement.children.length; ++i)
                findAndCombineFolderChains(treeElement.children[i], previousSingleTreeElement);
        }

        var sourceMaps = this._sourceCode.sourceMaps;
        for (var i = 0; i < sourceMaps.length; ++i) {
            var sourceMap = sourceMaps[i];
            for (var j = 0; j < sourceMap.resources.length; ++j) {
                var sourceMapResource = sourceMap.resources[j];
                var relativeSubpath = sourceMapResource.sourceMapDisplaySubpath;
                var folderTreeElement = this.createFoldersAsNeededForSubpath(relativeSubpath);
                var sourceMapTreeElement = new WI.SourceMapResourceTreeElement(sourceMapResource);
                folderTreeElement.insertChild(sourceMapTreeElement, insertionIndexForObjectInListSortedByFunction(sourceMapTreeElement, folderTreeElement.children, WI.ResourceTreeElement.compareFolderAndResourceTreeElements));
            }
        }

        if (WI.settings.resourceGroupingMode.value === WI.Resource.GroupingMode.Type) {
            for (let child of this.children)
                findAndCombineFolderChains(child);
        }
    }

    canSelectOnMouseDown(event)
    {
        if (this._toggleBlackboxedImageElement && this._toggleBlackboxedImageElement.contains(event.target))
            return false;
        return super.canSelectOnMouseDown(event);
    }

    // Protected

    descendantResourceTreeElementTypeDidChange(childTreeElement, oldType)
    {
        // Called by descendant SourceMapResourceTreeElements.

        console.assert(this.hasChildren);

        let parentTreeElement = childTreeElement.parent;

        let wasParentExpanded = parentTreeElement.expanded;
        let wasSelected = childTreeElement.selected;

        parentTreeElement.removeChild(childTreeElement, true, true);
        parentTreeElement.insertChild(childTreeElement, insertionIndexForObjectInListSortedByFunction(childTreeElement, parentTreeElement.children, WI.ResourceTreeElement.compareFolderAndResourceTreeElements));

        if (wasParentExpanded)
            parentTreeElement.expand();
        if (wasSelected)
            childTreeElement.revealAndSelect(true, false, true);
    }

    updateStatus()
    {
        if (this._sourceCode.supportsScriptBlackboxing) {
            if (!this._toggleBlackboxedImageElement) {
                this._toggleBlackboxedImageElement = document.createElement("img");
                this._toggleBlackboxedImageElement.classList.add("toggle-script-blackbox");
                this._toggleBlackboxedImageElement.addEventListener("click", this._handleToggleBlackboxedImageElementClicked.bind(this));
            }

            this.status = this._toggleBlackboxedImageElement;
            this._updateToggleBlackboxImageElementState();
        } else if (this.status === this._toggleBlackboxedImageElement)
            this.status = null;
    }

    // Protected (ResourceTreeElement calls this when its Resource changes dynamically for Frames)

    _updateSourceCode(sourceCode)
    {
        console.assert(sourceCode instanceof WI.SourceCode);

        if (this._sourceCode === sourceCode)
            return;

        let oldSupportsScriptBlackboxing = false;

        if (this._sourceCode) {
            oldSupportsScriptBlackboxing = this._sourceCode.supportsScriptBlackboxing;

            this._sourceCode.removeEventListener(WI.SourceCode.Event.SourceMapAdded, this.updateSourceMapResources, this);
        }

        this._sourceCode = sourceCode;
        this._sourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, this.updateSourceMapResources, this);

        let newSupportsScriptBlackboxing = this._sourceCode.supportsScriptBlackboxing;
        if (oldSupportsScriptBlackboxing !== newSupportsScriptBlackboxing) {
            if (newSupportsScriptBlackboxing)
                WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BlackboxChanged, this._updateToggleBlackboxImageElementState, this);
            else if (oldSupportsScriptBlackboxing)
                WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BlackboxChanged, this._updateToggleBlackboxImageElementState, this);
        }

        this.updateSourceMapResources();

        this.updateStatus();
    }

    // Private

    _updateToggleBlackboxImageElementState()
    {
        let blackboxData = WI.debuggerManager.blackboxDataForSourceCode(this._sourceCode);

        this._toggleBlackboxedImageElement.classList.toggle("pattern-blackboxed", blackboxData && blackboxData.type === WI.DebuggerManager.BlackboxType.Pattern);
        this._toggleBlackboxedImageElement.classList.toggle("url-blackboxed", blackboxData && blackboxData.type === WI.DebuggerManager.BlackboxType.URL);

        if (blackboxData) {
            switch (blackboxData.type) {
            case WI.DebuggerManager.BlackboxType.Pattern:
                this._toggleBlackboxedImageElement.title = WI.UIString("Script ignored when debugging due to URL pattern blackbox");
                break;

            case WI.DebuggerManager.BlackboxType.URL:
                this._toggleBlackboxedImageElement.title = WI.UIString("Unblackbox script to include it when debugging");
                break;
            }

            console.assert(this._toggleBlackboxedImageElement.title);
        } else
            this._toggleBlackboxedImageElement.title = WI.UIString("Blackbox script to ignore it when debugging");
    }

    _handleToggleBlackboxedImageElementClicked(event)
    {
        let blackboxData = WI.debuggerManager.blackboxDataForSourceCode(this._sourceCode);
        if (blackboxData && blackboxData.type === WI.DebuggerManager.BlackboxType.Pattern) {
            WI.showSettingsTab({
                blackboxPatternToSelect: blackboxData.regex,
                initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
            });
            return;
        }

        WI.debuggerManager.setShouldBlackboxScript(this._sourceCode, !blackboxData);

        this._updateToggleBlackboxImageElementState();
    }
};
