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

WI.DOMTreeContentView = class DOMTreeContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject);

        super(representedObject);

        // COMPATIBILITY (macOS 12.0, iOS 15.0): CSS.nodeLayoutContextTypeChanged did not exist yet.
        // COMPATIBILITY (macOS 13.0, iOS 16.0): CSS.nodeLayoutContextTypeChanged was renamed/expanded to CSS.nodeLayoutFlagsChanged.
        this._configureDOMTreeBadgesNavigationItem = new WI.ButtonNavigationItem("configure-dom-tree-badges", WI.UIString("Badges", "Badges @ Elements Tab", "Label for navigation item that controls what badges are shown in the main DOM tree."));
        this._configureDOMTreeBadgesNavigationItem.tooltip = WI.UIString("Choose which badges are shown in the DOM tree");
        this._configureDOMTreeBadgesNavigationItem.enabled = InspectorBackend.hasEvent("CSS.nodeLayoutFlagsChanged") || InspectorBackend.hasEvent("CSS.nodeLayoutContextTypeChanged");
        this._configureDOMTreeBadgesNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        WI.addMouseDownContextMenuHandlers(this._configureDOMTreeBadgesNavigationItem.element, this._populateConfigureDOMTreeBadgesNavigationItemContextMenu.bind(this));

        // COMPATIBILITY (iOS 12)
        WI.settings.showRulers.addEventListener(WI.Setting.Event.Changed, this._showRulersChanged, this);
        this._showRulersButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-rulers", WI.UIString("Show rulers"), WI.UIString("Hide rulers"), "Images/Rulers.svg", 16, 16);
        this._showRulersButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleShowRulers, this);
        this._showRulersButtonNavigationItem.enabled = InspectorBackend.hasCommand("Page.setShowRulers");
        this._showRulersButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._showRulersChanged();

        this._showPrintStylesButtonNavigationItem = new WI.ActivateButtonNavigationItem("print-styles", WI.UIString("Force print media styles"), WI.UIString("Use default media styles"), "Images/Printer.svg", 16, 16);
        this._showPrintStylesButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._togglePrintStyles, this);
        this._showPrintStylesButtonNavigationItem.enabled = InspectorBackend.hasCommand("Page.setEmulatedMedia");
        this._showPrintStylesButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._showPrintStylesChanged();

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `Page.overrideUserPreference` did not exist yet.
        this._overrideUserPreferencesNavigationItem = new WI.ActivateButtonNavigationItem("toggle-user-preferences", WI.UIString("Override user preferences"), WI.UIString("User preferences overridden"), "Images/AppearanceOverride.svg", 16, 16);
        this._overrideUserPreferencesNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleOverrideUserPreferencesButtonClicked, this);
        this._overrideUserPreferencesNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._compositingBordersButtonNavigationItem = new WI.ActivateButtonNavigationItem("layer-borders", WI.UIString("Show compositing borders"), WI.UIString("Hide compositing borders"), "Images/LayerBorders.svg", 13, 13);
        this._compositingBordersButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCompositingBordersButtonClicked, this);
        this._compositingBordersButtonNavigationItem.enabled = WI.LayerTreeManager.supportsVisibleCompositingBorders();
        this._compositingBordersButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._paintFlashingButtonNavigationItem = new WI.ActivateButtonNavigationItem("paint-flashing", WI.UIString("Enable paint flashing"), WI.UIString("Disable paint flashing"), "Images/Paint.svg", 16, 16);
        this._paintFlashingButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handlePaingFlashingButtonClicked, this);
        this._paintFlashingButtonNavigationItem.enabled = WI.LayerTreeManager.supportsShowingPaintRects();
        this._paintFlashingButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this.element.classList.add("dom-tree");
        this.element.addEventListener("click", this._mouseWasClicked.bind(this), false);

        this._domTreeOutline = new WI.DOMTreeOutline({omitRootDOMNode: true, excludeRevealElementContextMenu: true, showInspectedNode: true, showBadges: true});
        this._domTreeOutline.allowsEmptySelection = false;
        this._domTreeOutline.allowsMultipleSelection = true;
        this._domTreeOutline.addEventListener(WI.TreeOutline.Event.ElementAdded, this._domTreeElementAdded, this);
        this._domTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._domTreeSelectionDidChange, this);
        this._domTreeOutline.addEventListener(WI.DOMTreeOutline.Event.SelectedNodeChanged, this._selectedNodeDidChange, this);
        this._domTreeOutline.wireToDomAgent();
        this._domTreeOutline.editable = true;
        this.element.appendChild(this._domTreeOutline.element);

        WI.domManager.addEventListener(WI.DOMManager.Event.AttributeModified, this._domNodeChanged, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.AttributeRemoved, this._domNodeChanged, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.CharacterDataModified, this._domNodeChanged, this);

        WI.cssManager.addEventListener(WI.CSSManager.Event.DefaultUserPreferencesDidChange, this._defaultUserPreferencesDidChange, this);
        this._defaultUserPreferencesDidChange();

        WI.cssManager.addEventListener(WI.CSSManager.Event.OverriddenUserPreferencesDidChange, this._overriddenUserPreferencesDidChange, this);
        this._overriddenUserPreferencesDidChange();

        this._lastSelectedNodePathSetting = new WI.Setting("last-selected-node-path", null);

        this._numberOfSearchResults = null;

        this._breakpointGutterEnabled = false;
        this._pendingBreakpointNodes = new Set;


        if (WI.domDebuggerManager.supported) {
            WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._breakpointsEnabledDidChange, this);

            WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointAdded, this._domBreakpointAddedOrRemoved, this);
            WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointRemoved, this._domBreakpointAddedOrRemoved, this);

            WI.DOMBreakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._handleDOMBreakpointDisabledStateChanged, this);
            WI.DOMBreakpoint.addEventListener(WI.DOMBreakpoint.Event.DOMNodeWillChange, this._handleDOMBreakpointDOMNodeWillChange, this);
            WI.DOMBreakpoint.addEventListener(WI.DOMBreakpoint.Event.DOMNodeDidChange, this._handleDOMBreakpointDOMNodeDidChange, this);

            this._breakpointsEnabledDidChange();
        }

        WI.settings.domTreeDeemphasizesNodesThatAreNotRendered.addEventListener(WI.Setting.Event.Changed, this._handleDOMTreeDeemphasizesNodesThatAreNotRenderedChanged, this);
        this._updateDOMTreeDeemphasizesNodesThatAreNotRendered();
    }

    // Public

    get navigationItems()
    {
        return [
            this._configureDOMTreeBadgesNavigationItem,
            this._showRulersButtonNavigationItem,
            this._showPrintStylesButtonNavigationItem,
            this._overrideUserPreferencesNavigationItem,
            this._compositingBordersButtonNavigationItem,
            this._paintFlashingButtonNavigationItem,
        ];
    }

    get domTreeOutline()
    {
        return this._domTreeOutline;
    }

    get scrollableElements()
    {
        return [this.element];
    }

    get breakpointGutterEnabled()
    {
        return this._breakpointGutterEnabled;
    }

    set breakpointGutterEnabled(flag)
    {
        if (this._breakpointGutterEnabled === flag)
            return;

        this._breakpointGutterEnabled = flag;
        this.element.classList.toggle("show-gutter", this._breakpointGutterEnabled);
    }

    closed()
    {
        super.closed();

        WI.settings.showRulers.removeEventListener(WI.Setting.Event.Changed, this._showRulersChanged, this);

        WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeModified, this._domNodeChanged, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeRemoved, this._domNodeChanged, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.CharacterDataModified, this._domNodeChanged, this);

        if (WI.domDebuggerManager.supported) {
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._breakpointsEnabledDidChange, this);

            WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointAdded, this._domBreakpointAddedOrRemoved, this);
            WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointRemoved, this._domBreakpointAddedOrRemoved, this);

            WI.DOMBreakpoint.removeEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._handleDOMBreakpointDisabledStateChanged, this);
            WI.DOMBreakpoint.removeEventListener(WI.DOMBreakpoint.Event.DOMNodeWillChange, this._handleDOMBreakpointDOMNodeWillChange, this);
            WI.DOMBreakpoint.removeEventListener(WI.DOMBreakpoint.Event.DOMNodeDidChange, this._handleDOMBreakpointDOMNodeDidChange, this);
        }

        WI.settings.domTreeDeemphasizesNodesThatAreNotRendered.removeEventListener(WI.Setting.Event.Changed, this._handleDOMTreeDeemphasizesNodesThatAreNotRenderedChanged, this);

        this._domTreeOutline.close();
        this._pendingBreakpointNodes.clear();
    }

    get selectionPathComponents()
    {
        var treeElement = this._domTreeOutline.selectedTreeElement;
        var pathComponents = [];

        while (treeElement && !treeElement.root) {
            // The close tag is contained within the element it closes. So skip it since we don't want to
            // show the same node twice in the hierarchy.
            if (treeElement.isCloseTag()) {
                treeElement = treeElement.parent;
                continue;
            }

            var pathComponent = new WI.DOMTreeElementPathComponent(treeElement, treeElement.representedObject);
            pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.Clicked, this._handlePathComponentSelected, this);
            pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._handlePathComponentSelected, this);
            pathComponents.unshift(pathComponent);
            treeElement = treeElement.parent;
        }

        return pathComponents;
    }

    restoreFromCookie(cookie)
    {
        if (!cookie || !cookie.nodeToSelect)
            return;

        this.selectAndRevealDOMNode(cookie.nodeToSelect);

        // Because nodeToSelect is ephemeral, we don't want to keep
        // it around in the back-forward history entries.
        cookie.nodeToSelect = undefined;
    }

    selectAndRevealDOMNode(domNode, preventFocusChange)
    {
        this._domTreeOutline.selectDOMNode(domNode, !preventFocusChange);
    }

    async handleCopyEvent(event)
    {
        let promises = [];

        for (let treeElement of this._domTreeOutline.selectedTreeElements) {
            if (treeElement.representedObject instanceof WI.DOMNode)
                promises.push(treeElement.representedObject.getOuterHTML());
        }

        if (!promises.length)
            return;

        event.clipboardData.clearData();
        event.preventDefault();

        let outerHTMLs = await Promise.all(promises);
        InspectorFrontendHost.copyText(outerHTMLs.join("\n"));
    }

    handlePasteEvent(event)
    {
        let selectedDOMNode = this._domTreeOutline.selectedDOMNode();
        if (!selectedDOMNode)
            return;

        let text = event.clipboardData.getData("text/plain");
        if (!text)
            return;

        selectedDOMNode.insertAdjacentHTML("afterend", text);
    }

    get supportsSave()
    {
        return WI.canArchiveMainFrame();
    }

    get saveMode()
    {
        return WI.FileUtilities.SaveMode.SingleFile;
    }

    get saveData()
    {
        return {customSaveHandler: () => { WI.archiveMainFrame(); }};
    }

    get supportsSearch()
    {
        return true;
    }

    get numberOfSearchResults()
    {
        return this._numberOfSearchResults;
    }

    get hasPerformedSearch()
    {
        return this._numberOfSearchResults !== null;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        this._automaticallyRevealFirstSearchResult = reveal;

        // If we haven't shown a search result yet, reveal one now.
        if (this._automaticallyRevealFirstSearchResult && this._numberOfSearchResults > 0) {
            if (this._currentSearchResultIndex === -1)
                this.revealNextSearchResult();
        }
    }

    performSearch(query)
    {
        if (this._searchQuery === query)
            return;

        let target = WI.assumingMainTarget();

        if (this._searchIdentifier) {
            target.DOMAgent.discardSearchResults(this._searchIdentifier);
            this._hideSearchHighlights();
        }

        this._searchQuery = query;
        this._searchIdentifier = null;
        this._numberOfSearchResults = null;
        this._currentSearchResultIndex = -1;

        function searchResultsReady(error, searchIdentifier, resultsCount)
        {
            if (error)
                return;

            this._searchIdentifier = searchIdentifier;
            this._numberOfSearchResults = resultsCount;

            this.dispatchEventToListeners(WI.ContentView.Event.NumberOfSearchResultsDidChange);

            this._showSearchHighlights();

            if (this._automaticallyRevealFirstSearchResult)
                this.revealNextSearchResult();
        }

        function contextNodesReady(nodeIds)
        {
            if (this._searchQuery !== query)
                return;

            let commandArguments = {
                query: this._searchQuery,
                nodeIds,
                caseSensitive: WI.SearchUtilities.defaultSettings.caseSensitive.value,
            };
            target.DOMAgent.performSearch.invoke(commandArguments, searchResultsReady.bind(this));
        }

        this.getSearchContextNodes(contextNodesReady.bind(this));
    }

    getSearchContextNodes(callback)
    {
        // Overwrite this to limit the search to just a subtree.
        // Passing undefined will make DOM.performSearch search through all the documents.
        callback(undefined);
    }

    searchCleared()
    {
        if (this._searchIdentifier) {
            let target = WI.assumingMainTarget();
            target.DOMAgent.discardSearchResults(this._searchIdentifier);
            this._hideSearchHighlights();
        }

        this._searchQuery = null;
        this._searchIdentifier = null;
        this._numberOfSearchResults = null;
        this._currentSearchResultIndex = -1;
    }

    revealPreviousSearchResult(changeFocus)
    {
        if (!this._numberOfSearchResults)
            return;

        if (this._currentSearchResultIndex > 0)
            --this._currentSearchResultIndex;
        else
            this._currentSearchResultIndex = this._numberOfSearchResults - 1;

        this._revealSearchResult(this._currentSearchResultIndex, changeFocus);
    }

    revealNextSearchResult(changeFocus)
    {
        if (!this._numberOfSearchResults)
            return;

        if (this._currentSearchResultIndex + 1 < this._numberOfSearchResults)
            ++this._currentSearchResultIndex;
        else
            this._currentSearchResultIndex = 0;

        this._revealSearchResult(this._currentSearchResultIndex, changeFocus);
    }

    // Protected

    attached()
    {
        super.attached();

        this._domTreeOutline.setVisible(true, WI.isConsoleFocused());
        if (this._domTreeOutline.rootDOMNode)
            this._restoreBreakpointsAfterUpdate();

        WI.layerTreeManager.updateCompositingBordersVisibleFromPageIfNeeded();

        WI.layerTreeManager.addEventListener(WI.LayerTreeManager.Event.CompositingBordersVisibleChanged, this._handleCompositingBordersVisibleChanged, this);
        this._handleCompositingBordersVisibleChanged();

        WI.layerTreeManager.addEventListener(WI.LayerTreeManager.Event.ShowPaintRectsChanged, this._handleShowPaintRectsChanged, this);
        this._handleShowPaintRectsChanged();
    }

    detached()
    {
        WI.domManager.hideDOMNodeHighlight();
        this._domTreeOutline.setVisible(false);

        WI.layerTreeManager.removeEventListener(WI.LayerTreeManager.Event.ShowPaintRectsChanged, this._handleShowPaintRectsChanged, this);
        WI.layerTreeManager.removeEventListener(WI.LayerTreeManager.Event.CompositingBordersVisibleChanged, this._handleCompositingBordersVisibleChanged, this);

        super.detached();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        this._domTreeOutline.selectDOMNode(this._domTreeOutline.selectedDOMNode());
    }

    layout()
    {
        super.layout();

        this._domTreeOutline.updateSelectionArea();
    }

    // Private

    _revealSearchResult(index, changeFocus)
    {
        console.assert(this._searchIdentifier);

        var searchIdentifier = this._searchIdentifier;

        function revealResult(error, nodeIdentifiers)
        {
            if (error)
                return;

            // Bail if the searchIdentifier changed since we started.
            if (this._searchIdentifier !== searchIdentifier)
                return;

            console.assert(nodeIdentifiers.length === 1);

            var domNode = WI.domManager.nodeForId(nodeIdentifiers[0]);
            console.assert(domNode);
            if (!domNode)
                return;

            this._domTreeOutline.selectDOMNode(domNode, changeFocus);

            var selectedTreeElement = this._domTreeOutline.selectedTreeElement;
            if (selectedTreeElement)
                selectedTreeElement.emphasizeSearchHighlight();
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.getSearchResults(this._searchIdentifier, index, index + 1, revealResult.bind(this));
    }

    _restoreSelectedNodeAfterUpdate(documentURL, defaultNode)
    {
        if (!WI.domManager.restoreSelectedNodeIsAllowed)
            return;

        function selectNode(lastSelectedNode)
        {
            var nodeToFocus = lastSelectedNode;
            if (!nodeToFocus)
                nodeToFocus = defaultNode;

            if (!nodeToFocus)
                return;

            this._dontSetLastSelectedNodePath = true;
            this.selectAndRevealDOMNode(nodeToFocus, WI.isConsoleFocused());
            this._dontSetLastSelectedNodePath = false;

            // If this wasn't the last selected node, then expand it.
            if (!lastSelectedNode && this._domTreeOutline.selectedTreeElement)
                this._domTreeOutline.selectedTreeElement.expand();
        }

        function selectLastSelectedNode(nodeId)
        {
            if (!WI.domManager.restoreSelectedNodeIsAllowed)
                return;

            selectNode.call(this, WI.domManager.nodeForId(nodeId));
        }

        if (InspectorBackend.hasCommand("DOM.pushNodeByPathToFrontend") && documentURL && this._lastSelectedNodePathSetting.value && this._lastSelectedNodePathSetting.value.path && this._lastSelectedNodePathSetting.value.url === documentURL.hash)
            WI.domManager.pushNodeByPathToFrontend(this._lastSelectedNodePathSetting.value.path, selectLastSelectedNode.bind(this));
        else
            selectNode.call(this);
    }

    _populateConfigureDOMTreeBadgesNavigationItemContextMenu(contextMenu)
    {
        if (!this._configureDOMTreeBadgesNavigationItem.enabled)
            return;

        // COMPATIBILITY (iOS 14.5): `DOM.showGridOverlay` did not exist yet.
        if (InspectorBackend.hasCommand("DOM.showGridOverlay")) {
            contextMenu.appendCheckboxItem(WI.unlocalizedString("grid"), () => {
                WI.settings.enabledDOMTreeBadgeTypes.value.toggleIncludes(WI.DOMTreeElement.BadgeType.Grid);
                WI.settings.enabledDOMTreeBadgeTypes.save();
            }, WI.settings.enabledDOMTreeBadgeTypes.value.includes(WI.DOMTreeElement.BadgeType.Grid));
        }

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `DOM.showFlexOverlay` did not exist yet.
        if (InspectorBackend.hasCommand("DOM.showFlexOverlay")) {
            contextMenu.appendCheckboxItem(WI.unlocalizedString("flex"), () => {
                WI.settings.enabledDOMTreeBadgeTypes.value.toggleIncludes(WI.DOMTreeElement.BadgeType.Flex);
                WI.settings.enabledDOMTreeBadgeTypes.save();
            }, WI.settings.enabledDOMTreeBadgeTypes.value.includes(WI.DOMTreeElement.BadgeType.Flex));
        }

        // COMPATIBILITY (macOS 13.0, iOS 16.0): the `includeAncestors` parameter of `DOM.getEventListenersForNode` did not exist yet.
        if (InspectorBackend.hasCommand("DOM.getEventListenersForNode", "includeAncestors")) {
            contextMenu.appendCheckboxItem(WI.UIString("Event"), () => {
                WI.settings.enabledDOMTreeBadgeTypes.value.toggleIncludes(WI.DOMTreeElement.BadgeType.Event);
                WI.settings.enabledDOMTreeBadgeTypes.save();
            }, WI.settings.enabledDOMTreeBadgeTypes.value.includes(WI.DOMTreeElement.BadgeType.Event));
        }

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `Scrollable` value for `CSS.LayoutFlag` did not exist yet.
        if (InspectorBackend.Enum.CSS?.LayoutFlag?.Scrollable) {
            contextMenu.appendCheckboxItem(WI.UIString("Scroll", "Title for a badge applied to DOM nodes that are a scrollable container."), () => {
                WI.settings.enabledDOMTreeBadgeTypes.value.toggleIncludes(WI.DOMTreeElement.BadgeType.Scrollable);
                WI.settings.enabledDOMTreeBadgeTypes.save();
            }, WI.settings.enabledDOMTreeBadgeTypes.value.includes(WI.DOMTreeElement.BadgeType.Scrollable));
        }
    }

    _domTreeElementAdded(event)
    {
        if (!this._pendingBreakpointNodes.size)
            return;

        let treeElement = event.data.element;
        let node = treeElement.representedObject;
        console.assert(node instanceof WI.DOMNode);
        if (!(node instanceof WI.DOMNode))
            return;

        if (!this._pendingBreakpointNodes.delete(node))
            return;

        this._updateBreakpointStatus(node);
    }

    _domTreeSelectionDidChange(event)
    {
        let treeElement = this._domTreeOutline.selectedTreeElement;
        let domNode = treeElement ? treeElement.representedObject : null;
        let selectedByUser = event.data.selectedByUser;

        this._domTreeOutline.suppressRevealAndSelect = true;
        this._domTreeOutline.selectDOMNode(domNode, selectedByUser);

        if (domNode && selectedByUser)
            domNode.highlight();

        this._domTreeOutline.updateSelectionArea();
        this._domTreeOutline.suppressRevealAndSelect = false;
    }

    _selectedNodeDidChange(event)
    {
        var selectedDOMNode = this._domTreeOutline.selectedDOMNode();
        if (selectedDOMNode && !this._dontSetLastSelectedNodePath)
            this._lastSelectedNodePathSetting.value = {url: WI.networkManager.mainFrame.url.hash, path: selectedDOMNode.path()};

        if (selectedDOMNode)
            WI.domManager.setInspectedNode(selectedDOMNode);

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _handlePathComponentSelected(event)
    {
        if (!event.data.pathComponent)
            return;

        console.assert(event.data.pathComponent instanceof WI.DOMTreeElementPathComponent);
        console.assert(event.data.pathComponent.domTreeElement instanceof WI.DOMTreeElement);

        this._domTreeOutline.selectDOMNode(event.data.pathComponent.domTreeElement.representedObject, true);
    }

    _domNodeChanged(event)
    {
        var selectedDOMNode = this._domTreeOutline.selectedDOMNode();
        if (selectedDOMNode !== event.data.node)
            return;

        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _mouseWasClicked(event)
    {
        var anchorElement = event.target.closest("a");
        if (!anchorElement || !anchorElement.href)
            return;

        // Prevent the link from navigating, since we don't do any navigation by following links normally.
        event.preventDefault();
        event.stopPropagation();

        if (WI.isBeingEdited(anchorElement)) {
            // Don't follow the link when it is being edited.
            return;
        }

        // Cancel any pending link navigation.
        if (this._followLinkTimeoutIdentifier) {
            clearTimeout(this._followLinkTimeoutIdentifier);
            delete this._followLinkTimeoutIdentifier;
        }

        // If this is a double-click (or multiple-click), return early.
        if (event.detail > 1)
            return;

        function followLink()
        {
            // Since followLink is delayed, the call to WI.openURL can't look at window.event
            // to see if the command key is down like it normally would. So we need to do that check
            // before calling WI.openURL.
            const options = {
                alwaysOpenExternally: event?.metaKey ?? false,
                frame: this._frame,
                lineNumber: anchorElement.lineNumber,
                ignoreNetworkTab: true,
                ignoreSearchTab: true,
            };
            WI.openURL(anchorElement.href, options);
        }

        // Start a timeout since this is a single click, if the timeout is canceled before it fires,
        // then a double-click happened or another link was clicked.
        // FIXME: The duration might be longer or shorter than the user's configured double click speed.
        this._followLinkTimeoutIdentifier = setTimeout(followLink.bind(this), 333);
    }

    _handleCompositingBordersVisibleChanged(event)
    {
        this._compositingBordersButtonNavigationItem.activated = WI.layerTreeManager.compositingBordersVisible;
    }

    _handleCompositingBordersButtonClicked(event)
    {
        WI.layerTreeManager.compositingBordersVisible = !WI.layerTreeManager.compositingBordersVisible;
    }

    _handleShowPaintRectsChanged(event)
    {
        this._paintFlashingButtonNavigationItem.activated = WI.layerTreeManager.showPaintRects;
    }

    _handlePaingFlashingButtonClicked(event)
    {
        WI.layerTreeManager.showPaintRects = !WI.layerTreeManager.showPaintRects;
    }

    _showPrintStylesChanged()
    {
        this._showPrintStylesButtonNavigationItem.activated = WI.printStylesEnabled;

        let mediaType = WI.printStylesEnabled ? "print" : "";
        for (let target of WI.targets) {
            if (target.hasCommand("Page.setEmulatedMedia"))
                target.PageAgent.setEmulatedMedia(mediaType);
        }

        WI.cssManager.mediaTypeChanged();
    }

    _togglePrintStyles(event)
    {
        WI.printStylesEnabled = !WI.printStylesEnabled;
        this._showPrintStylesChanged();
    }

    _handleOverrideUserPreferencesButtonClicked()
    {
        if (this._userPreferencesOverridesPopover)
            return; // Clicking the button while the popover is shown will automatically dismiss the popover.

        this._userPreferencesOverridesPopover = new WI.OverrideUserPreferencesPopover(this);
        this._userPreferencesOverridesPopover.show(this._overrideUserPreferencesNavigationItem.element);
    }

    _overriddenUserPreferencesDidChange()
    {
        this._overrideUserPreferencesNavigationItem.activated = WI.cssManager.overriddenUserPreferences.size > 0;
    }

    _defaultUserPreferencesDidChange()
    {
        this._overrideUserPreferencesNavigationItem.enabled = WI.cssManager.supportsOverrideUserPreference || WI.cssManager.supportsOverrideColorScheme;
    }

    _showRulersChanged()
    {
        let activated = WI.settings.showRulers.value;
        this._showRulersButtonNavigationItem.activated = activated;

        for (let target of WI.targets) {
            if (target.hasCommand("Page.setShowRulers"))
                target.PageAgent.setShowRulers(activated).catch((error) => {
                    // FIXME <rdar://105244623> iOS platforms without a matching legacy protocol definition will fall back to the local macOS protocol definition.
                    console.error(error);
                });
        }
    }

    _toggleShowRulers(event)
    {
        WI.settings.showRulers.value = !WI.settings.showRulers.value;

        this._showRulersChanged();
    }

    _showSearchHighlights()
    {
        console.assert(this._searchIdentifier);

        this._searchResultNodes = [];

        var searchIdentifier = this._searchIdentifier;

        let target = WI.assumingMainTarget();
        target.DOMAgent.getSearchResults(this._searchIdentifier, 0, this._numberOfSearchResults, function(error, nodeIdentifiers) {
            if (error)
                return;

            if (this._searchIdentifier !== searchIdentifier)
                return;

            console.assert(nodeIdentifiers.length === this._numberOfSearchResults);

            for (var i = 0; i < nodeIdentifiers.length; ++i) {
                var domNode = WI.domManager.nodeForId(nodeIdentifiers[i]);
                console.assert(domNode);
                if (!domNode)
                    continue;

                this._searchResultNodes.push(domNode);

                var treeElement = this._domTreeOutline.findTreeElement(domNode);
                console.assert(treeElement);
                if (treeElement)
                    treeElement.highlightSearchResults(this._searchQuery);
            }
        }.bind(this));
    }

    _hideSearchHighlights()
    {
        if (!this._searchResultNodes)
            return;

        for (var domNode of this._searchResultNodes) {
            var treeElement = this._domTreeOutline.findTreeElement(domNode);
            if (treeElement)
                treeElement.hideSearchHighlights();
        }

        delete this._searchResultNodes;
    }

    _domBreakpointAddedOrRemoved(event)
    {
        let breakpoint = event.data.breakpoint;
        this._updateBreakpointStatus(breakpoint.domNode);
    }

    _handleDOMBreakpointDisabledStateChanged(event)
    {
        let breakpoint = event.target;
        this._updateBreakpointStatus(breakpoint.domNode);
    }

    _handleDOMBreakpointDOMNodeWillChange(event)
    {
        let breakpoint = event.target;
        this._updateBreakpointStatus(breakpoint.domNode);
    }

    _handleDOMBreakpointDOMNodeDidChange(event)
    {
        let breakpoint = event.target;
        this._updateBreakpointStatus(breakpoint.domNode);
    }

    _updateBreakpointStatus(domNode)
    {
        if (!domNode)
            return;

        let treeElement = this._domTreeOutline.findTreeElement(domNode);
        if (!treeElement) {
            this._pendingBreakpointNodes.add(domNode);
            return;
        }

        let breakpoints = WI.domDebuggerManager.domBreakpointsForNode(domNode);
        if (breakpoints.length) {
            if (breakpoints.some((item) => item.disabled))
                treeElement.breakpointStatus = WI.DOMTreeElement.BreakpointStatus.DisabledBreakpoint;
            else
                treeElement.breakpointStatus = WI.DOMTreeElement.BreakpointStatus.Breakpoint;
        } else
            treeElement.breakpointStatus = WI.DOMTreeElement.BreakpointStatus.None;

        this.breakpointGutterEnabled = this._domTreeOutline.children.some((child) => child.hasBreakpoint);
    }

    _restoreBreakpointsAfterUpdate()
    {
        this._pendingBreakpointNodes.clear();

        this.breakpointGutterEnabled = false;

        let updatedNodes = new Set;
        for (let breakpoint of WI.domDebuggerManager.domBreakpoints) {
            if (updatedNodes.has(breakpoint.domNode))
                continue;

            this._updateBreakpointStatus(breakpoint.domNode);
        }
    }

    _breakpointsEnabledDidChange(event)
    {
        this._domTreeOutline.element.classList.toggle("breakpoints-disabled", !WI.debuggerManager.breakpointsEnabled);
    }

    _updateDOMTreeDeemphasizesNodesThatAreNotRendered()
    {
        this.element.classList.toggle("deemphasize-unrendered", WI.settings.domTreeDeemphasizesNodesThatAreNotRendered.value);
    }

    _handleDOMTreeDeemphasizesNodesThatAreNotRenderedChanged(event)
    {
        this._updateDOMTreeDeemphasizesNodesThatAreNotRendered()
    }

    // Popover delegate

    didDismissPopover(popover)
    {
        if (popover === this._userPreferencesOverridesPopover)
            this._userPreferencesOverridesPopover = null;
    };
};
