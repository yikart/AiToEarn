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

WI.OpenResourceDialog = class OpenResourceDialog extends WI.Dialog
{
    constructor(delegate)
    {
        super(delegate);

        this.element.classList.add("open-resource-dialog");

        let fieldElement = this.element.appendChild(document.createElement("div"));
        fieldElement.classList.add("field");

        this._inputElement = fieldElement.appendChild(document.createElement("input"));
        this._inputElement.type = "text";
        this._inputElement.placeholder = WI.UIString("File or Resource");
        this._inputElement.spellcheck = false;

        this._clearIconElement = fieldElement.appendChild(document.createElement("img"));

        this._inputElement.addEventListener("keydown", this._handleKeydownEvent.bind(this));
        this._inputElement.addEventListener("keyup", this._handleKeyupEvent.bind(this));
        this._inputElement.addEventListener("blur", this._handleBlurEvent.bind(this));
        this._clearIconElement.addEventListener("mousedown", this._handleMousedownEvent.bind(this));
        this._clearIconElement.addEventListener("click", this._handleClickEvent.bind(this));

        this._treeOutline = new WI.TreeOutline;
        this._treeOutline.allowsRepeatSelection = true;
        this._treeOutline.disclosureButtons = false;
        this._treeOutline.large = true;

        this._treeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
        this._treeOutline.element.addEventListener("focus", () => { this._inputElement.focus(); });

        this.element.appendChild(this._treeOutline.element);

        this._updateFilterThrottler = new Throttler(() => {
            this._updateFilter();
        }, 250);

        this._queryController = new WI.ResourceQueryController;
        this._filteredResults = [];
    }

    // Protected

    representedObjectIsValid(value)
    {
        if (value instanceof WI.Script && value.anonymous)
            return false;

        if (value instanceof WI.CSSStyleSheet && value.anonymous)
            return false;

        return super.representedObjectIsValid(value);
    }

    _populateResourceTreeOutline()
    {
        function createHighlightedTitleFragment(title, searchString, highlightTextRanges)
        {
            let shift = searchString.indexOf(title.toLowerCase());
            console.assert(shift >= 0);

            let titleFragment = document.createDocumentFragment();
            let lastIndex = 0;
            for (let textRange of highlightTextRanges) {
                let end = textRange.endColumn - shift;
                if (end >= 0) {
                    let start = textRange.startColumn - shift;
                    if (start > lastIndex)
                        titleFragment.append(title.substring(lastIndex, start));

                    let highlightSpan = document.createElement("span");
                    highlightSpan.classList.add("highlighted");
                    highlightSpan.append(title.substring(start, end));
                    titleFragment.append(highlightSpan);
                }

                lastIndex = end;
            }

            if (lastIndex < title.length)
                titleFragment.append(title.substring(lastIndex, title.length));

            return titleFragment;
        }

        function createTreeElement(representedObject)
        {
            let treeElement = null;

            if (representedObject instanceof WI.SourceMapResource)
                treeElement = new WI.SourceMapResourceTreeElement(representedObject);
            else if (representedObject instanceof WI.Resource)
                treeElement = new WI.ResourceTreeElement(representedObject);
            else if (representedObject instanceof WI.Script)
                treeElement = new WI.ScriptTreeElement(representedObject);
            else if (representedObject instanceof WI.CSSStyleSheet)
                treeElement = new WI.CSSStyleSheetTreeElement(representedObject);

            return treeElement;
        }

        for (let result of this._filteredResults) {
            let resource = result.resource;
            if (this._treeOutline.findTreeElement(resource))
                continue;

            let treeElement = createTreeElement(resource);
            if (!treeElement)
                continue;

            treeElement.mainTitle = createHighlightedTitleFragment(resource.displayName, result.searchString, result.matchingTextRanges);

            if (resource instanceof WI.LocalResource && resource.localResourceOverride)
                treeElement.subtitle = WI.UIString("Local Override");

            let path = resource.urlComponents.path;
            let lastPathComponent = resource.urlComponents.lastPathComponent;
            if (path && lastPathComponent) {
                let parentPath = path.substring(0, path.length - lastPathComponent.length);
                if (parentPath.length && parentPath !== "/")
                    treeElement.titlesElement.dataset.path = parentPath;
            }

            treeElement[WI.OpenResourceDialog.ResourceMatchCookieDataSymbol] = result.cookie;
            this._treeOutline.appendChild(treeElement);
        }

        if (this._treeOutline.children.length)
            this._treeOutline.children[0].select(true, false, true);
    }

    didDismissDialog()
    {
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceWasAdded, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasRemoved, this._resourceWasRemoved, this);
        WI.Target.removeEventListener(WI.Target.Event.ResourceAdded, this._resourceWasAdded, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ScriptAdded, this._scriptAdded, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ScriptRemoved, this._scriptRemoved, this);
        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetAdded, this._handleStyleSheetAdded, this);
        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._handleStyleSheetRemoved, this);
        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.SnippetAdded, this._handleConsoleSnippetAdded, this);
        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.SnippetRemoved, this._handleConsoleSnippetRemoved, this);

        this._queryController.reset();
        this._updateFilterThrottler.cancel();
    }

    didPresentDialog()
    {
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceWasAdded, this);
        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasRemoved, this._resourceWasRemoved, this);
        WI.Target.addEventListener(WI.Target.Event.ResourceAdded, this._resourceWasAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ScriptAdded, this._scriptAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ScriptRemoved, this._scriptRemoved, this);
        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetAdded, this._handleStyleSheetAdded, this);
        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._handleStyleSheetRemoved, this);
        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.SnippetAdded, this._handleConsoleSnippetAdded, this);
        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.SnippetRemoved, this._handleConsoleSnippetRemoved, this);

        if (WI.networkManager.mainFrame)
            this._addResourcesForFrame(WI.networkManager.mainFrame);

        this._addScriptsForTarget(WI.mainTarget);

        for (let target of WI.targets) {
            if (target !== WI.mainTarget)
                this._addResourcesForTarget(target);
        }

        this._addLocalResourceOverrides();

        if (WI.NetworkManager.supportsBootstrapScript()) {
            let bootstrapScript = WI.networkManager.bootstrapScript;
            if (bootstrapScript) {
                const suppressFilterUpdate = true;
                this._addResource(bootstrapScript, suppressFilterUpdate);
            }
        }

        for (let styleSheet of WI.cssManager.styleSheets) {
            if (styleSheet.origin !== WI.CSSStyleSheet.Type.Author && !styleSheet.anonymous)
                this._addResource(styleSheet);
        }

        for (let consoleSnippet of WI.consoleManager.snippets)
            this._addResource(consoleSnippet);

        this._updateFilterThrottler.force();

        this._inputElement.focus();
        this._clear();
    }

    // Private

    _handleKeydownEvent(event)
    {
        if (event.keyCode === WI.KeyboardShortcut.Key.Escape.keyCode) {
            if (this._inputElement.value === "") {
                this.dismiss();
                event.preventDefault();
            } else
                this._clear();

            event.preventDefault();
        } else if (event.keyCode === WI.KeyboardShortcut.Key.Enter.keyCode) {
            if (this._treeOutline.selectedTreeElement) {
                this.dismiss(this._treeOutline.selectedTreeElement.representedObject, this._treeOutline.selectedTreeElement[WI.OpenResourceDialog.ResourceMatchCookieDataSymbol]);
                event.preventDefault();
                return;
            }

            // ":<line>:<column>" jumps to a location for the current ContentView.
            if (/^:\d/.test(this._inputElement.value)) {
                let visibleContentView = WI.focusedOrVisibleContentView();
                let representedObject = visibleContentView ? visibleContentView.representedObject : null;
                if (representedObject && representedObject instanceof WI.SourceCode) {
                    let [, lineNumber, columnNumber] = this._inputElement.value.split(":");
                    lineNumber = lineNumber ? parseInt(lineNumber, 10) - 1 : 0;
                    columnNumber = columnNumber ? parseInt(columnNumber, 10) - 1 : 0;
                    this.dismiss(representedObject, {lineNumber, columnNumber});
                    event.preventDefault();
                    return;
                }
            }

            this._inputElement.select();
        } else if (event.keyCode === WI.KeyboardShortcut.Key.Up.keyCode || event.keyCode === WI.KeyboardShortcut.Key.Down.keyCode) {
            let treeElement = this._treeOutline.selectedTreeElement;
            if (!treeElement)
                return;

            let adjacentSiblingProperty = event.keyCode === WI.KeyboardShortcut.Key.Up.keyCode ? "previousSibling" : "nextSibling";
            treeElement = treeElement[adjacentSiblingProperty];
            if (treeElement)
                treeElement.revealAndSelect(true, false, true);

            event.preventDefault();
        }
    }

    _handleKeyupEvent(event)
    {
        if (event.keyCode === WI.KeyboardShortcut.Key.Up.keyCode || event.keyCode === WI.KeyboardShortcut.Key.Down.keyCode)
            return;

        if (this._inputElement.value)
            this._updateFilterThrottler.fire();
        else
            this._updateFilterThrottler.force();
    }

    _handleBlurEvent(event)
    {
        // Prevent the dialog from being dismissed while handling a tree item click event.
        if (event.relatedTarget === this._treeOutline.element)
            return;

        this.dismiss();
    }

    _handleMousedownEvent(event)
    {
        this._inputElement.select();

        // This ensures we don't get a "blur" event triggered for the text field
        // that would cause the dialog to be dismissed.
        event.preventDefault();
    }

    _handleClickEvent(event)
    {
        this._clear();
    }

    _clear()
    {
        this._inputElement.value = "";

        this._updateFilterThrottler.force();
    }

    _updateFilter()
    {
        this._filteredResults = [];
        this._treeOutline.removeChildren();

        let filterText = this._inputElement.value.trim();
        if (filterText) {
            this._filteredResults = this._queryController.executeQuery(filterText);
            this._populateResourceTreeOutline();
        }

        this.element.classList.toggle("non-empty", this._inputElement.value !== "");
        this.element.classList.toggle("has-results", this._treeOutline.children.length);
    }

    _treeSelectionDidChange(event)
    {
        let treeElement = this._treeOutline.selectedTreeElement;
        if (!treeElement)
            return;

        if (!event.data.selectedByUser)
            return;

        this.dismiss(treeElement.representedObject, treeElement[WI.OpenResourceDialog.ResourceMatchCookieDataSymbol]);
    }

    _addResource(resource, suppressFilterUpdate)
    {
        if (!this.representedObjectIsValid(resource))
            return;

        // Recurse on source maps if any exist.
        for (let sourceMap of resource.sourceMaps) {
            for (let sourceMapResource of sourceMap.resources)
                this._addResource(sourceMapResource, suppressFilterUpdate);
        }

        this._queryController.addResource(resource);
        if (suppressFilterUpdate)
            return;

        this._updateFilterThrottler.fire();
    }

    _removeResource(resource)
    {
        if (!this.representedObjectIsValid(resource))
            return;

        this._queryController.removeResource(resource);

        this._updateFilterThrottler.force();
    }

    _addResourcesForFrame(frame)
    {
        const suppressFilterUpdate = true;

        let frames = [frame];
        while (frames.length) {
            let currentFrame = frames.shift();
            this._addResource(currentFrame.mainResource, suppressFilterUpdate);
            for (let resource of currentFrame.resourceCollection)
                this._addResource(resource, suppressFilterUpdate);

            frames.pushAll(currentFrame.childFrameCollection);
        }
    }

    _addResourcesForTarget(target)
    {
        const suppressFilterUpdate = true;

        this._addResource(target.mainResource);

        for (let resource of target.resourceCollection)
            this._addResource(resource, suppressFilterUpdate);

        this._addScriptsForTarget(target);
    }

    _addScriptsForTarget(target)
    {
        const suppressFilterUpdate = true;

        let targetData = WI.debuggerManager.dataForTarget(target);
        for (let script of targetData.scripts) {
            if (script.anonymous || script.resource || script.dynamicallyAddedScriptElement)
                continue;
            if (!WI.settings.debugShowConsoleEvaluations.value && isWebInspectorConsoleEvaluationScript(script.sourceURL))
                continue;
            if (!WI.settings.engineeringShowInternalScripts.value && isWebKitInternalScript(script.sourceURL))
                continue;
            this._addResource(script, suppressFilterUpdate);
        }

        for (let script of target.extraScriptCollection) {
            if (script.resource)
                continue;
            this._addResource(script, suppressFilterUpdate);
        }
    }

    _addLocalResourceOverrides()
    {
        if (!WI.NetworkManager.supportsOverridingResponses())
            return;

        const suppressFilterUpdate = true;

        for (let localResourceOverride of WI.networkManager.localResourceOverrides)
            this._addResource(localResourceOverride.localResource, suppressFilterUpdate);
    }

    _mainResourceDidChange(event)
    {
        if (event.target.isMainFrame())
            this._queryController.reset();

        this._addResource(event.target.mainResource);
    }

    _resourceWasAdded(event)
    {
        this._addResource(event.data.resource);
    }

    _resourceWasRemoved(event)
    {
        this._removeResource(event.data.resource);
    }

    _scriptAdded(event)
    {
        let {script} = event.data;
        if (script.resource || script.target === WI.mainTarget)
            return;

        this._addResource(script);
    }

    _scriptRemoved(event)
    {
        let {script} = event.data;
        if (script.resource || script.target === WI.mainTarget)
            return;

        this._removeResource(script);
    }

    _handleStyleSheetAdded(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author || styleSheet.anonymous)
            return;

        this._addResource(styleSheet);
    }

    _handleStyleSheetRemoved(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author || styleSheet.anonymous)
            return;

        this._removeResource(styleSheet);
    }

    _handleConsoleSnippetAdded(event)
    {
        this._addResource(event.data.snippet);
    }

    _handleConsoleSnippetRemoved(event)
    {
        this._removeResource(event.data.snippet);
    }
};

WI.OpenResourceDialog.ResourceMatchCookieDataSymbol = Symbol("open-resource-dialog-resource-match-cookie-data");
