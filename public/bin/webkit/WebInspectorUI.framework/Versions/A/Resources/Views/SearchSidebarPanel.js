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

WI.SearchSidebarPanel = class SearchSidebarPanel extends WI.NavigationSidebarPanel
{
    constructor()
    {
        super("search", WI.UIString("Search"), true, true);

        this._searchInputSettings = WI.SearchUtilities.createSettings("search-sidebar");
        for (let setting of Object.values(this._searchInputSettings)) {
            setting.addEventListener(WI.Setting.Event.Changed, function(event) {
                this.focusSearchField(true);
            }, this);
        }

        this._inputContainer = this.element.appendChild(document.createElement("div"));
        this._inputContainer.classList.add("search-bar");

        this._inputElement = this._inputContainer.appendChild(document.createElement("input"));
        this._inputElement.type = "search";
        this._inputElement.spellcheck = false;
        this._inputElement.addEventListener("change", this._searchFieldChanged.bind(this));
        this._inputElement.addEventListener("input", this._searchFieldInput.bind(this));
        this._inputElement.setAttribute("results", 5);
        this._inputElement.setAttribute("autosave", "inspector-search-autosave");
        this._inputElement.setAttribute("placeholder", WI.UIString("Search Resource Content"));

        this._inputContainer.appendChild(WI.SearchUtilities.createSettingsButton(this._searchInputSettings));

        this._searchQuerySetting = new WI.Setting("search-sidebar-query", "");
        this._inputElement.value = this._searchQuerySetting.value;

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        const treeItemHeight = 20;
        this.contentTreeOutline.registerScrollVirtualizer(this.contentView.element, treeItemHeight);
        this.contentTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
    }

    // Public

    showDefaultContentView()
    {
        let contentView = new WI.ContentView;

        let contentPlaceholder = WI.createMessageTextView(this._searchQuerySetting.value ? WI.UIString("No search results") : WI.UIString("No search string"));
        contentView.element.appendChild(contentPlaceholder);

        let searchNavigationItem = new WI.ButtonNavigationItem("search", WI.UIString("Search Resource Content"), "Images/Search.svg", 15, 15);
        searchNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleDefaultContentViewSearchNavigationItemClicked, this);

        let importHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to see recent searches."), searchNavigationItem);
        contentPlaceholder.appendChild(importHelpElement);

        this.contentBrowser.showContentView(contentView);
    }

    closed()
    {
        super.closed();

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
    }

    focusSearchField(performSearch)
    {
        if (!this.parentSidebar)
            return;

        this.parentSidebar.selectedSidebarPanel = this;
        this.parentSidebar.collapsed = false;

        this._inputElement.select();

        if (performSearch)
            this.performSearch(this._inputElement.value, {omitFocus: true});
    }

    performSearch(searchQuery, {omitFocus} = {})
    {
        this._inputElement.value = searchQuery;
        this._searchQuerySetting.value = searchQuery;

        this.element.classList.remove("changed");
        if (this._changedBanner)
            this._changedBanner.remove();

        if (!searchQuery.length) {
            this._inputContainer.classList.remove("invalid");
            this.hideEmptyContentPlaceholder();
            this.showDefaultContentView();
            return;
        }

        let isCaseSensitive = !!this._searchInputSettings.caseSensitive.value;
        let isRegex = !!this._searchInputSettings.regularExpression.value;
        let searchRegex = WI.SearchUtilities.searchRegExpForString(searchQuery, {
            caseSensitive: isCaseSensitive,
            regularExpression: isRegex,
        });
        this._inputContainer.classList.toggle("invalid", !searchRegex);
        if (!searchRegex)
            return;

        this.hideEmptyContentPlaceholder();

        // Before performing a new search, clear the old search.
        this.contentTreeOutline.removeChildren();
        this.contentBrowser.contentViewContainer.closeAllContentViews();

        let createSearchingPlaceholder = () => {
            let searchingPlaceholder = WI.createMessageTextView("");
            String.format(WI.UIString("Searching %s"), [(new WI.IndeterminateProgressSpinner).element], String.standardFormatters, searchingPlaceholder, (a, b) => {
                a.append(b);
                return a;
            });
            this.updateEmptyContentPlaceholder(searchingPlaceholder);
        };

        if (!WI.targetsAvailable() && WI.sharedApp.isWebDebuggable()) {
            createSearchingPlaceholder();
            WI.whenTargetsAvailable().then(() => {
                if (this._searchQuerySetting.value === searchQuery)
                    this.performSearch(searchQuery, {omitFocus});
            });
            return;
        }

        let target = WI.assumingMainTarget();

        let promiseCount = 0;
        let countPromise = async (promise, callback) => {
            ++promiseCount;
            if (promiseCount === 1)
                createSearchingPlaceholder();

            let value = await promise;

            if (callback)
                callback(value);

            --promiseCount;
            console.assert(promiseCount >= 0);
            if (promiseCount === 0) {
                this.updateEmptyContentPlaceholder(WI.UIString("No Search Results"));

                if (!this.contentTreeOutline.children.length)
                    this.showDefaultContentView();
            }
        };

        function createTreeElementForMatchObject(matchObject, parentTreeElement)
        {
            let matchTreeElement = new WI.SearchResultTreeElement(matchObject);
            matchTreeElement.addEventListener(WI.TreeElement.Event.DoubleClick, this._treeElementDoubleClick, this);

            parentTreeElement.appendChild(matchTreeElement);

            if (!this.contentTreeOutline.selectedTreeElement) {
                const selectedByUser = true;
                matchTreeElement.revealAndSelect(omitFocus ?? false, selectedByUser);
            }
        }

        function forEachMatch(lineContent, callback)
        {
            var lineMatch;
            while ((searchRegex.lastIndex < lineContent.length) && (lineMatch = searchRegex.exec(lineContent)))
                callback(lineMatch, searchRegex.lastIndex);
        }

        let resourceCallback = (frameId, url, {result}) => {
            if (!result || !result.length)
                return;

            var frame = WI.networkManager.frameForIdentifier(frameId);
            if (!frame)
                return;

            let resource = frame.url === url ? frame.mainResource : frame.resourcesForURL(url).firstValue;
            if (!resource)
                return;

            var resourceTreeElement = this._searchTreeElementForResource(resource);

            for (var i = 0; i < result.length; ++i) {
                var match = result[i];
                forEachMatch(match.lineContent, (lineMatch, lastIndex) => {
                    var matchObject = new WI.SourceCodeSearchMatchObject(resource, match.lineContent, searchQuery, new WI.TextRange(match.lineNumber, lineMatch.index, match.lineNumber, lastIndex));
                    createTreeElementForMatchObject.call(this, matchObject, resourceTreeElement);
                });
            }

            if (!resourceTreeElement.children.length)
                this.contentTreeOutline.removeChild(resourceTreeElement);
        };

        let resourcesCallback = ({result}) => {
            let preventDuplicates = new Set;

            for (let searchResult of result) {
                if (!searchResult.url || !searchResult.frameId)
                    continue;

                // FIXME: Backend sometimes searches files twice.
                // <https://webkit.org/b/188287> Web Inspector: [Backend] Page.searchInResources sometimes returns duplicate results for a resource
                // Note we will still want this to fix legacy backends.
                let key = searchResult.frameId + ":" + searchResult.url;
                if (preventDuplicates.has(key))
                    continue;
                preventDuplicates.add(key);

                countPromise(target.PageAgent.searchInResource(searchResult.frameId, searchResult.url, searchQuery, isCaseSensitive, isRegex, searchResult.requestId), resourceCallback.bind(this, searchResult.frameId, searchResult.url));
            }

            let promises = [
                WI.Frame.awaitEvent(WI.Frame.Event.ResourceWasAdded, this),
                WI.Target.awaitEvent(WI.Target.Event.ResourceAdded, this),
            ];
            Promise.race(promises).then(this._contentChanged.bind(this));
        };

        let scriptCallback = (script, {result}) => {
            if (!result || !result.length)
                return;

            var scriptTreeElement = this._searchTreeElementForScript(script);

            for (let match of result) {
                forEachMatch(match.lineContent, (lineMatch, lastIndex) => {
                    var matchObject = new WI.SourceCodeSearchMatchObject(script, match.lineContent, searchQuery, new WI.TextRange(match.lineNumber, lineMatch.index, match.lineNumber, lastIndex));
                    createTreeElementForMatchObject.call(this, matchObject, scriptTreeElement);
                });
            }

            if (!scriptTreeElement.children.length)
                this.contentTreeOutline.removeChild(scriptTreeElement);
        };

        let searchScripts = (scriptsToSearch) => {
            if (!scriptsToSearch.length)
                return;

            for (let script of scriptsToSearch)
                countPromise(script.target.DebuggerAgent.searchInContent(script.id, searchQuery, isCaseSensitive, isRegex), scriptCallback.bind(this, script));
        };

        let domCallback = ({searchId, resultCount}) => {
            if (!resultCount)
                return;

            console.assert(searchId);

            this._domSearchIdentifier = searchId;

            let domSearchResults = ({nodeIds}) => {
                // If someone started a new search, then return early and stop showing search results from the old query.
                if (this._domSearchIdentifier !== searchId)
                    return;

                for (let nodeId of nodeIds) {
                    let domNode = WI.domManager.nodeForId(nodeId);
                    if (!domNode || !domNode.ownerDocument)
                        continue;

                    // We do not display the document node when the search query is "/". We don't have anything to display in the content view for it.
                    if (domNode.nodeType() === Node.DOCUMENT_NODE)
                        continue;

                    // FIXME: This should use a frame to do resourceForURL, but DOMAgent does not provide a frameId.
                    let resource = WI.networkManager.resourcesForURL(domNode.ownerDocument.documentURL).firstValue;
                    if (!resource)
                        continue;

                    var resourceTreeElement = this._searchTreeElementForResource(resource);
                    var domNodeTitle = WI.DOMSearchMatchObject.titleForDOMNode(domNode);

                    // Textual matches.
                    var didFindTextualMatch = false;
                    forEachMatch(domNodeTitle, (lineMatch, lastIndex) => {
                        var matchObject = new WI.DOMSearchMatchObject(resource, domNode, domNodeTitle, searchQuery, new WI.TextRange(0, lineMatch.index, 0, lastIndex));
                        createTreeElementForMatchObject.call(this, matchObject, resourceTreeElement);
                        didFindTextualMatch = true;
                    });

                    // Non-textual matches are CSS Selector or XPath matches. In such cases, display the node entirely highlighted.
                    if (!didFindTextualMatch) {
                        var matchObject = new WI.DOMSearchMatchObject(resource, domNode, domNodeTitle, domNodeTitle, new WI.TextRange(0, 0, 0, domNodeTitle.length));
                        createTreeElementForMatchObject.call(this, matchObject, resourceTreeElement);
                    }

                    if (!resourceTreeElement.children.length)
                        this.contentTreeOutline.removeChild(resourceTreeElement);

                }
            };

            countPromise(target.DOMAgent.getSearchResults(searchId, 0, resultCount), domSearchResults);
        };

        WI.domManager.ensureDocument();

        if (target.hasCommand("Page.searchInResources"))
            countPromise(target.PageAgent.searchInResources(searchQuery, isCaseSensitive, isRegex), resourcesCallback);

        setTimeout(searchScripts.bind(this, WI.debuggerManager.searchableScripts), 0);

        if (target.hasDomain("DOM")) {
            if (this._domSearchIdentifier) {
                target.DOMAgent.discardSearchResults(this._domSearchIdentifier);
                this._domSearchIdentifier = undefined;
            }

            let commandArguments = {
                query: searchQuery,
                caseSensitive: isCaseSensitive,
            };
            countPromise(target.DOMAgent.performSearch.invoke(commandArguments), domCallback);
        }

        // FIXME: Resource search should work with Local Overrides if enabled.

        // FIXME: Resource search should work with Console Snippets.

        // FIXME: Resource search should work in JSContext inspection.
        // <https://webkit.org/b/131252> Web Inspector: JSContext inspection Resource search does not work
    }

    // Private

    _searchFieldChanged(event)
    {
        this.performSearch(event.target.value);
    }

    _searchFieldInput(event)
    {
        // If the search field is cleared, immediately clear the search results tree outline.
        if (!event.target.value.length)
            this.performSearch("");
    }

    _searchTreeElementForResource(resource)
    {
        var resourceTreeElement = this.contentTreeOutline.getCachedTreeElement(resource);
        if (!resourceTreeElement) {
            resourceTreeElement = new WI.ResourceTreeElement(resource);
            resourceTreeElement.hasChildren = true;
            resourceTreeElement.expand();

            this.contentTreeOutline.appendChild(resourceTreeElement);
        }

        return resourceTreeElement;
    }

    _searchTreeElementForScript(script)
    {
        var scriptTreeElement = this.contentTreeOutline.getCachedTreeElement(script);
        if (!scriptTreeElement) {
            scriptTreeElement = new WI.ScriptTreeElement(script);
            scriptTreeElement.hasChildren = true;
            scriptTreeElement.expand();

            this.contentTreeOutline.appendChild(scriptTreeElement);
        }

        return scriptTreeElement;
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        if (this._delayedSearchTimeout) {
            clearTimeout(this._delayedSearchTimeout);
            this._delayedSearchTimeout = undefined;
        }

        this.contentTreeOutline.removeChildren();
        this.contentBrowser.contentViewContainer.closeAllContentViews();

        if (this.visible) {
            const performSearch = true;
            this.focusSearchField(performSearch);
        }
    }

    _treeSelectionDidChange(event)
    {
        if (!this.selected)
            return;

        let treeElement = this.contentTreeOutline.selectedTreeElement;
        if (!treeElement || treeElement instanceof WI.FolderTreeElement)
            return;

        const options = {
            ignoreNetworkTab: true,
        };

        if (treeElement instanceof WI.ResourceTreeElement || treeElement instanceof WI.ScriptTreeElement) {
            const cookie = null;
            WI.showRepresentedObject(treeElement.representedObject, cookie, options);
            return;
        }

        console.assert(treeElement instanceof WI.SearchResultTreeElement);
        if (!(treeElement instanceof WI.SearchResultTreeElement))
            return;

        if (treeElement.representedObject instanceof WI.DOMSearchMatchObject)
            WI.showMainFrameDOMTree(treeElement.representedObject.domNode);
        else if (treeElement.representedObject instanceof WI.SourceCodeSearchMatchObject)
            WI.showOriginalOrFormattedSourceCodeTextRange(treeElement.representedObject.sourceCodeTextRange, options);
    }

    _treeElementDoubleClick(event)
    {
        let treeElement = event.target;
        if (!treeElement)
            return;

        if (treeElement.representedObject instanceof WI.DOMSearchMatchObject) {
            WI.showMainFrameDOMTree(treeElement.representedObject.domNode, {
                ignoreSearchTab: true,
            });
        } else if (treeElement.representedObject instanceof WI.SourceCodeSearchMatchObject) {
            WI.showOriginalOrFormattedSourceCodeTextRange(treeElement.representedObject.sourceCodeTextRange, {
                ignoreNetworkTab: true,
                ignoreSearchTab: true,
            });
        }
    }

    _contentChanged(event)
    {
        this.element.classList.add("changed");

        if (!this._changedBanner) {
            this._changedBanner = document.createElement("div");
            this._changedBanner.classList.add("banner");
            this._changedBanner.append(WI.UIString("The page\u2019s content has changed"), document.createElement("br"));

            let performSearchLink = this._changedBanner.appendChild(document.createElement("a"));
            performSearchLink.textContent = WI.UIString("Search Again");
            performSearchLink.addEventListener("click", () => {
                const performSearch = true;
                this.focusSearchField(performSearch);
            });
        }

        this.element.appendChild(this._changedBanner);
    }

    _handleDefaultContentViewSearchNavigationItemClicked(event)
    {
        this.focusSearchField();
    }
};
