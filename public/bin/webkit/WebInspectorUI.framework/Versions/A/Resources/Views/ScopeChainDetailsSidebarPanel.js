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

WI.ScopeChainDetailsSidebarPanel = class ScopeChainDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("scope-chain", WI.UIString("Scope Chain"));

        this._callFrame = null;

        this._watchExpressionsSetting = new WI.Setting("watch-expressions", []);
        this._watchExpressionsSetting.addEventListener(WI.Setting.Event.Changed, this._updateWatchExpressionsNavigationBar, this);

        this._watchExpressionOptionsElement = document.createElement("div");
        this._watchExpressionOptionsElement.classList.add("options");

        this._navigationBar = new WI.NavigationBar;
        this._watchExpressionOptionsElement.appendChild(this._navigationBar.element);

        let addWatchExpressionButton = new WI.ButtonNavigationItem("add-watch-expression", WI.UIString("Add watch expression"), "Images/Plus13.svg", 13, 13);
        addWatchExpressionButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._addWatchExpressionButtonClicked, this);
        this._navigationBar.addNavigationItem(addWatchExpressionButton);

        this._clearAllWatchExpressionButton = new WI.ButtonNavigationItem("clear-watch-expressions", WI.UIString("Clear watch expressions"), "Images/NavigationItemTrash.svg", 15, 15);
        this._clearAllWatchExpressionButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._clearAllWatchExpressionsButtonClicked, this);
        this._navigationBar.addNavigationItem(this._clearAllWatchExpressionButton);

        this._refreshAllWatchExpressionButton = new WI.ButtonNavigationItem("refresh-watch-expressions", WI.UIString("Refresh watch expressions"), "Images/ReloadFull.svg", 13, 13);
        this._refreshAllWatchExpressionButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._refreshAllWatchExpressionsButtonClicked, this);
        this._navigationBar.addNavigationItem(this._refreshAllWatchExpressionButton);

        this._watchExpressionsSectionGroup = new WI.DetailsSectionGroup;
        this._watchExpressionsSection = new WI.DetailsSection("watch-expressions", WI.UIString("Watch Expressions"), [this._watchExpressionsSectionGroup], this._watchExpressionOptionsElement);
        this.contentView.element.appendChild(this._watchExpressionsSection.element);

        this._updateWatchExpressionsNavigationBar();

        this.needsLayout();

        // Update on console prompt eval as objects in the scope chain may have changed.
        WI.runtimeManager.addEventListener(WI.RuntimeManager.Event.DidEvaluate, this._didEvaluateExpression, this);

        // Update watch expressions when console execution context changes.
        WI.runtimeManager.addEventListener(WI.RuntimeManager.Event.ActiveExecutionContextChanged, this._activeExecutionContextChanged, this);

        // Update watch expressions on navigations.
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        // Update watch expressions on active call frame changes.
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._activeCallFrameDidChange, this);
    }

    // Public

    inspect(objects)
    {
        // Convert to a single item array if needed.
        if (!(objects instanceof Array))
            objects = [objects];

        var callFrameToInspect = null;

        // Iterate over the objects to find a WI.CallFrame to inspect.
        for (var i = 0; i < objects.length; ++i) {
            if (!(objects[i] instanceof WI.CallFrame))
                continue;
            callFrameToInspect = objects[i];
            break;
        }

        this.callFrame = callFrameToInspect;

        return true;
    }

    get callFrame()
    {
        return this._callFrame;
    }

    set callFrame(callFrame)
    {
        if (callFrame === this._callFrame)
            return;

        this._callFrame = callFrame;

        this.needsLayout();
    }

    closed()
    {
        WI.runtimeManager.removeEventListener(WI.RuntimeManager.Event.DidEvaluate, this._didEvaluateExpression, this);
        WI.runtimeManager.removeEventListener(WI.RuntimeManager.Event.ActiveExecutionContextChanged, this._activeExecutionContextChanged, this);

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._activeCallFrameDidChange, this);

        super.closed();
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.layoutReason !== WI.View.LayoutReason.Dirty)
            return;

        let callFrame = this._callFrame;

        Promise.all([this._generateWatchExpressionsSection(), this._generateCallFramesSection()]).then(function(sections) {
            let [watchExpressionsSection, callFrameSections] = sections;

            function delayedWork()
            {
                // Clear the timeout so we don't update the interface twice.
                clearTimeout(timeout);

                if (watchExpressionsSection)
                    this._watchExpressionsSectionGroup.rows = [watchExpressionsSection];
                else {
                    let emptyRow = new WI.DetailsSectionRow(WI.UIString("No Watch Expressions"));
                    this._watchExpressionsSectionGroup.rows = [emptyRow];
                    emptyRow.showEmptyMessage();
                }

                this.contentView.element.removeChildren();
                this.contentView.element.appendChild(this._watchExpressionsSection.element);

                // Bail if the call frame changed while we were waiting for the async response.
                if (this._callFrame !== callFrame)
                    return;

                if (!callFrameSections)
                    return;

                for (let callFrameSection of callFrameSections)
                    this.contentView.element.appendChild(callFrameSection.element);
            }

            // We need a timeout in place in case there are long running, pending backend dispatches. This can happen
            // if the debugger is paused in code that was executed from the console. The console will be waiting for
            // the result of the execution and without a timeout we would never update the scope variables.
            let delay = WI.ScopeChainDetailsSidebarPanel._autoExpandProperties.size === 0 ? 50 : 250;
            let timeout = setTimeout(delayedWork.bind(this), delay);

            // Since ObjectTreeView populates asynchronously, we want to wait to replace the existing content
            // until after all the pending asynchronous requests are completed. This prevents severe flashing while stepping.
            InspectorBackend.runAfterPendingDispatches(delayedWork.bind(this));
        }.bind(this)).catch(function(e) { console.error(e); });
    }

    _generateCallFramesSection()
    {
        let callFrame = this._callFrame;
        if (!callFrame)
            return Promise.resolve(null);

        let detailsSections = [];
        let foundLocalScope = false;

        let sectionCountByType = new Map;
        for (let type in WI.ScopeChainNode.Type)
            sectionCountByType.set(WI.ScopeChainNode.Type[type], 0);

        let scopeChain = callFrame.mergedScopeChain();
        for (let scope of scopeChain) {
            // Don't show sections for empty scopes unless it is the local scope, since it has "this".
            if (scope.empty && scope.type !== WI.ScopeChainNode.Type.Local)
                continue;

            let title = null;
            let extraPropertyDescriptor = null;
            let collapsedByDefault = false;

            let count = sectionCountByType.get(scope.type);
            sectionCountByType.set(scope.type, ++count);

            switch (scope.type) {
            case WI.ScopeChainNode.Type.Local:
                foundLocalScope = true;
                collapsedByDefault = false;
                title = WI.UIString("Local Variables");
                if (callFrame.thisObject)
                    extraPropertyDescriptor = new WI.PropertyDescriptor({name: "this", value: callFrame.thisObject});
                break;

            case WI.ScopeChainNode.Type.Closure:
                if (scope.__baseClosureScope && scope.name)
                    title = WI.UIString("Closure Variables (%s)").format(scope.name);
                else
                    title = WI.UIString("Closure Variables");
                collapsedByDefault = false;
                break;

            case WI.ScopeChainNode.Type.Block:
                title = WI.UIString("Block Variables");
                collapsedByDefault = false;
                break;

            case WI.ScopeChainNode.Type.Catch:
                title = WI.UIString("Catch Variables");
                collapsedByDefault = false;
                break;

            case WI.ScopeChainNode.Type.FunctionName:
                title = WI.UIString("Function Name Variable");
                collapsedByDefault = true;
                break;

            case WI.ScopeChainNode.Type.With:
                title = WI.UIString("With Object Properties");
                collapsedByDefault = foundLocalScope;
                break;

            case WI.ScopeChainNode.Type.Global:
                title = WI.UIString("Global Variables");
                collapsedByDefault = true;
                break;

            case WI.ScopeChainNode.Type.GlobalLexicalEnvironment:
                title = WI.UIString("Global Lexical Environment");
                collapsedByDefault = true;
                break;
            }

            let detailsSectionIdentifier = scope.type + "-" + sectionCountByType.get(scope.type);
            let detailsSection = new WI.DetailsSection(detailsSectionIdentifier, title, null, null, collapsedByDefault);

            // FIXME: This just puts two ObjectTreeViews next to each other, but that means
            // that properties are not nicely sorted between the two separate lists.

            let rows = [];
            for (let object of scope.objects) {
                let scopePropertyPath = WI.PropertyPath.emptyPropertyPathForScope(object);
                let objectTree = new WI.ObjectTreeView(object, WI.ObjectTreeView.Mode.Properties, scopePropertyPath);

                objectTree.showOnlyProperties();

                if (extraPropertyDescriptor) {
                    objectTree.appendExtraPropertyDescriptor(extraPropertyDescriptor);
                    extraPropertyDescriptor = null;
                }

                let treeOutline = objectTree.treeOutline;
                treeOutline.registerScrollVirtualizer(this.contentView.element, 16);
                treeOutline.addEventListener(WI.TreeOutline.Event.ElementAdded, function(event) {
                    this._treeElementAdded(detailsSectionIdentifier, event);
                }, this);
                treeOutline.addEventListener(WI.TreeOutline.Event.ElementDisclosureDidChanged, function(event) {
                    this._treeElementDisclosureDidChange(detailsSectionIdentifier, event);
                }, this);

                rows.push(new WI.ObjectPropertiesDetailSectionRow(objectTree, detailsSection));
            }

            detailsSection.groups[0].rows = rows;
            detailsSections.push(detailsSection);
        }

        return Promise.resolve(detailsSections);
    }

    _generateWatchExpressionsSection()
    {
        let watchExpressions = this._watchExpressionsSetting.value;
        if (!watchExpressions.length) {
            if (this._usedWatchExpressionsObjectGroup) {
                this._usedWatchExpressionsObjectGroup = false;
                for (let target of WI.targets)
                    target.RuntimeAgent.releaseObjectGroup(WI.ScopeChainDetailsSidebarPanel.WatchExpressionsObjectGroupName);
            }
            return Promise.resolve(null);
        }

        for (let target of WI.targets)
            target.RuntimeAgent.releaseObjectGroup(WI.ScopeChainDetailsSidebarPanel.WatchExpressionsObjectGroupName);
        this._usedWatchExpressionsObjectGroup = true;

        let watchExpressionsRemoteObject = WI.RemoteObject.createFakeRemoteObject();
        let fakePropertyPath = WI.PropertyPath.emptyPropertyPathForScope(watchExpressionsRemoteObject);
        let objectTree = new WI.ObjectTreeView(watchExpressionsRemoteObject, WI.ObjectTreeView.Mode.Properties, fakePropertyPath);
        objectTree.showOnlyProperties();

        let treeOutline = objectTree.treeOutline;
        const watchExpressionSectionIdentifier = "watch-expressions";
        treeOutline.addEventListener(WI.TreeOutline.Event.ElementAdded, function(event) {
            this._treeElementAdded(watchExpressionSectionIdentifier, event);
        }, this);
        treeOutline.addEventListener(WI.TreeOutline.Event.ElementDisclosureDidChanged, function(event) {
            this._treeElementDisclosureDidChange(watchExpressionSectionIdentifier, event);
        }, this);
        treeOutline.objectTreeElementAddContextMenuItems = this._objectTreeElementAddContextMenuItems.bind(this);

        let promises = [];
        for (let expression of watchExpressions) {
            promises.push(new Promise(function(resolve, reject) {
                let options = {objectGroup: WI.ScopeChainDetailsSidebarPanel.WatchExpressionsObjectGroupName, includeCommandLineAPI: false, doNotPauseOnExceptionsAndMuteConsole: true, returnByValue: false, generatePreview: true, saveResult: false};
                WI.runtimeManager.evaluateInInspectedWindow(expression, options, function(object, wasThrown) {
                    object = object || WI.RemoteObject.fromPrimitiveValue(undefined);
                    let propertyDescriptor = new WI.PropertyDescriptor({name: expression, value: object}, undefined, undefined, wasThrown);
                    objectTree.appendExtraPropertyDescriptor(propertyDescriptor);
                    resolve();
                });
            }));
        }

        return Promise.all(promises).then(function() {
            return Promise.resolve(new WI.ObjectPropertiesDetailSectionRow(objectTree));
        });
    }

    _addWatchExpression(expression)
    {
        let watchExpressions = this._watchExpressionsSetting.value.slice(0);
        watchExpressions.push(expression);
        this._watchExpressionsSetting.value = watchExpressions;

        this.needsLayout();
    }

    _removeWatchExpression(expression)
    {
        let watchExpressions = this._watchExpressionsSetting.value.slice(0);
        watchExpressions.remove(expression, true);
        this._watchExpressionsSetting.value = watchExpressions;

        this.needsLayout();
    }

    _clearAllWatchExpressions()
    {
        this._watchExpressionsSetting.value = [];

        this.needsLayout();
    }

    _addWatchExpressionButtonClicked(event)
    {
        function presentPopoverOverTargetElement()
        {
            let target = WI.Rect.rectFromClientRect(event.target.element.getBoundingClientRect());
            popover.present(target, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
        }

        let popover = new WI.Popover(this);
        let content = document.createElement("div");
        content.classList.add("watch-expression");
        content.appendChild(document.createElement("div")).textContent = WI.UIString("Add New Watch Expression");

        let editorElement = content.appendChild(document.createElement("div"));
        editorElement.classList.add("watch-expression-editor", WI.SyntaxHighlightedStyleClassName);

        this._codeMirror = WI.CodeMirrorEditor.create(editorElement, {
            lineWrapping: true,
            mode: "text/javascript",
            matchBrackets: true,
            value: "",
        });

        this._popoverCommitted = false;

        this._codeMirror.addKeyMap({
            "Enter": () => { this._popoverCommitted = true; popover.dismiss(); },
        });

        let completionController = new WI.CodeMirrorCompletionController(WI.CodeMirrorCompletionController.Mode.FullConsoleCommandLineAPI, this._codeMirror);
        completionController.addExtendedCompletionProvider("javascript", WI.javaScriptRuntimeCompletionProvider);

        // Resize the popover as best we can when the CodeMirror editor changes size.
        let previousHeight = 0;
        this._codeMirror.on("changes", function(cm, event) {
            let height = cm.getScrollInfo().height;
            if (previousHeight !== height) {
                previousHeight = height;
                popover.update(false);
            }
        });

        popover.content = content;

        popover.windowResizeHandler = presentPopoverOverTargetElement;
        presentPopoverOverTargetElement();

        // CodeMirror needs a refresh after the popover displays, to layout, otherwise it doesn't appear.
        setTimeout(() => {
            this._codeMirror.refresh();
            this._codeMirror.focus();
            popover.update();
        }, 0);
    }

    willDismissPopover(popover)
    {
        if (this._popoverCommitted) {
            let expression = this._codeMirror.getValue().trim();
            if (expression)
                this._addWatchExpression(expression);
        }

        this._codeMirror = null;
    }

    _refreshAllWatchExpressionsButtonClicked(event)
    {
        this.needsLayout();
    }

    _clearAllWatchExpressionsButtonClicked(event)
    {
        this._clearAllWatchExpressions();
    }

    _didEvaluateExpression(event)
    {
        if (event.data.objectGroup === WI.ScopeChainDetailsSidebarPanel.WatchExpressionsObjectGroupName)
            return;

        this.needsLayout();
    }

    _activeExecutionContextChanged()
    {
        this.needsLayout();
    }

    _activeCallFrameDidChange()
    {
        this.needsLayout();
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this.needsLayout();
    }

    _objectTreeElementAddContextMenuItems(objectTreeElement, contextMenu)
    {
        // Only add our watch expression context menus to the top level ObjectTree elements.
        if (objectTreeElement.parent !== objectTreeElement.treeOutline)
            return;

        contextMenu.appendItem(WI.UIString("Delete Watch Expression"), () => {
            let expression = objectTreeElement.property.name;
            this._removeWatchExpression(expression);
        });
    }

    _propertyPathIdentifierForTreeElement(identifier, objectPropertyTreeElement)
    {
        if (!objectPropertyTreeElement.property)
            return null;

        let propertyPath = objectPropertyTreeElement.thisPropertyPath();
        if (propertyPath.isFullPathImpossible())
            return null;

        return identifier + "-" + propertyPath.fullPath;
    }

    _treeElementAdded(identifier, event)
    {
        let treeElement = event.data.element;
        let propertyPathIdentifier = this._propertyPathIdentifierForTreeElement(identifier, treeElement);
        if (!propertyPathIdentifier)
            return;

        if (WI.ScopeChainDetailsSidebarPanel._autoExpandProperties.has(propertyPathIdentifier))
            treeElement.expand();
    }

    _treeElementDisclosureDidChange(identifier, event)
    {
        let treeElement = event.data.element;
        let propertyPathIdentifier = this._propertyPathIdentifierForTreeElement(identifier, treeElement);
        if (!propertyPathIdentifier)
            return;

        if (treeElement.expanded)
            WI.ScopeChainDetailsSidebarPanel._autoExpandProperties.add(propertyPathIdentifier);
        else
            WI.ScopeChainDetailsSidebarPanel._autoExpandProperties.delete(propertyPathIdentifier);
    }

    _updateWatchExpressionsNavigationBar()
    {
        let enabled = this._watchExpressionsSetting.value.length;
        this._refreshAllWatchExpressionButton.enabled = enabled;
        this._clearAllWatchExpressionButton.enabled = enabled;
    }
};

WI.ScopeChainDetailsSidebarPanel._autoExpandProperties = new Set;
WI.ScopeChainDetailsSidebarPanel.WatchExpressionsObjectGroupName = "watch-expressions";
