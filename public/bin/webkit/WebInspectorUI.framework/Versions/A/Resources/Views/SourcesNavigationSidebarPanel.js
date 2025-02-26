/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.SourcesNavigationSidebarPanel = class SourcesNavigationSidebarPanel extends WI.NavigationSidebarPanel
{
    constructor()
    {
        const shouldAutoPruneStaleTopLevelResourceTreeElements = true;
        super("sources", WI.UIString("Sources"), shouldAutoPruneStaleTopLevelResourceTreeElements);

        this._workerTargetTreeElementMap = new Map;
        this._mainFrameTreeElement = null;
        this._extensionScriptsFolderTreeElement = null;
        this._extensionStyleSheetsFolderTreeElement = null;
        this._extraScriptsFolderTreeElement = null;
        this._extraStyleSheetsFolderTreeElement = null;
        this._anonymousScriptsFolderTreeElement = null;
        this._anonymousStyleSheetsFolderTreeElement = null;

        this._originTreeElementMap = new Map;

        this._boundCompareTreeElements = this._compareTreeElements.bind(this);

        this._debuggerNavigationBar = new WI.NavigationBar;
        this.addSubview(this._debuggerNavigationBar);

        let createActivateNavigationItem = ({identifier, defaultToolTip, activatedToolTip, image}) => {
            let navigationItem = new WI.ActivateButtonNavigationItem(identifier, defaultToolTip, activatedToolTip, image, 15, 15);
            this._debuggerNavigationBar.addNavigationItem(navigationItem);
            return navigationItem;
        };

        let createToggleNavigationItem = ({identifier, defaultToolTip, alternateToolTip, defaultImage, alternateImage}) => {
            let navigationItem = new WI.ToggleButtonNavigationItem(identifier, defaultToolTip, alternateToolTip, defaultImage, alternateImage, 15, 15);
            this._debuggerNavigationBar.addNavigationItem(navigationItem);
            return navigationItem;
        };

        let createButtonNavigationitem = ({identifier, toolTipOrLabel, image}) => {
            let navigationItem = new WI.ButtonNavigationItem(identifier, toolTipOrLabel, image, 15, 15);
            this._debuggerNavigationBar.addNavigationItem(navigationItem);
            return navigationItem;
        };

        this._debuggerBreakpointsButtonItem = createActivateNavigationItem({
            identifier: "debugger-breakpoints",
            defaultToolTip: WI.UIString("Enable all breakpoints (%s)").format(WI.toggleBreakpointsKeyboardShortcut.displayName),
            activatedToolTip: WI.UIString("Disable all breakpoints (%s)").format(WI.toggleBreakpointsKeyboardShortcut.displayName),
            image: "Images/Breakpoints.svg",
        });
        this._debuggerBreakpointsButtonItem.activated = WI.debuggerManager.breakpointsEnabled;
        this._debuggerBreakpointsButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerToggleBreakpoints, this);

        this._debuggerPauseResumeButtonItem = createToggleNavigationItem({
            identifier: "debugger-pause-resume",
            defaultToolTip: WI.UIString("Pause script execution (%s or %s)").format(WI.pauseOrResumeKeyboardShortcut.displayName, WI.pauseOrResumeAlternateKeyboardShortcut.displayName),
            alternateToolTip: WI.UIString("Continue script execution (%s or %s)").format(WI.pauseOrResumeKeyboardShortcut.displayName, WI.pauseOrResumeAlternateKeyboardShortcut.displayName),
            defaultImage: "Images/Pause.svg",
            alternateImage: "Images/Resume.svg",
        });
        this._debuggerPauseResumeButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerPauseResumeToggle, this);

        this._debuggerStepOverButtonItem = createButtonNavigationitem({
            identifier: "debugger-step-over",
            toolTipOrLabel: WI.UIString("Step over (%s or %s)").format(WI.stepOverKeyboardShortcut.displayName, WI.stepOverAlternateKeyboardShortcut.displayName),
            image: "Images/StepOver.svg",
        });
        this._debuggerStepOverButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerStepOver, this);
        this._debuggerStepOverButtonItem.enabled = false;

        this._debuggerStepIntoButtonItem = createButtonNavigationitem({
            identifier: "debugger-step-into",
            toolTipOrLabel: WI.UIString("Step into (%s or %s)").format(WI.stepIntoKeyboardShortcut.displayName, WI.stepIntoAlternateKeyboardShortcut.displayName),
            image: "Images/StepInto.svg",
        });
        this._debuggerStepIntoButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerStepInto, this);
        this._debuggerStepIntoButtonItem.enabled = false;

        this._debuggerStepOutButtonItem = createButtonNavigationitem({
            identifier: "debugger-step-out",
            toolTipOrLabel: WI.UIString("Step out (%s or %s)").format(WI.stepOutKeyboardShortcut.displayName, WI.stepOutAlternateKeyboardShortcut.displayName),
            image: "Images/StepOut.svg",
        });
        this._debuggerStepOutButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerStepOut, this);
        this._debuggerStepOutButtonItem.enabled = false;

        // COMPATIBILITY (iOS 13.4): Debugger.stepNext did not exist yet.
        if (InspectorBackend.hasCommand("Debugger.stepNext")) {
            this._debuggerStepNextButtonItem = createButtonNavigationitem({
                identifier: "debugger-step-next",
                toolTipOrLabel: WI.UIString("Step (%s or %s)").format(WI.stepNextKeyboardShortcut.displayName, WI.stepNextAlternateKeyboardShortcut.displayName),
                image: "Images/StepNext.svg",
            });
            this._debuggerStepNextButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI.debuggerStepNext, this);
            this._debuggerStepNextButtonItem.enabled = false;
        }

        this._timelineRecordingWarningElement = null;
        this._auditTestWarningElement = null;
        this._breakpointsDisabledWarningElement = null;

        this._pauseReasonTreeOutline = null;
        this._pauseReasonLinkContainerElement = document.createElement("span");
        this._pauseReasonTextRow = new WI.DetailsSectionTextRow;
        this._pauseReasonGroup = new WI.DetailsSectionGroup([this._pauseReasonTextRow]);
        this._pauseReasonSection = new WI.DetailsSection("paused-reason", WI.UIString("Pause Reason"), [this._pauseReasonGroup], this._pauseReasonLinkContainerElement);

        this._pauseReasonContainer = this.contentView.element.appendChild(document.createElement("div"));
        this._pauseReasonContainer.classList.add("pause-reason-container");
        this._pauseReasonContainer.hidden = true;
        this._pauseReasonContainer.appendChild(this._pauseReasonSection.element);

        this._callStackTreeOutline = this.createContentTreeOutline({suppressFiltering: true});
        this._callStackTreeOutline.allowsMultipleSelection = true;
        this._callStackTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);
        this._callStackTreeOutline.populateContextMenu = (contextMenu, event, treeElement) => {
            if (this._callStackTreeOutline.selectedTreeElements.length) {
                contextMenu.appendItem(WI.UIString("Copy"), () => {
                    this.handleCopyEvent(event);
                });

                contextMenu.appendSeparator();
            }

            WI.TreeOutline.prototype.populateContextMenu(contextMenu, event, treeElement);
        };

        let callStackRow = new WI.DetailsSectionRow;
        callStackRow.element.appendChild(this._callStackTreeOutline.element);

        let callStackGroup = new WI.DetailsSectionGroup([callStackRow]);
        this._callStackSection = new WI.DetailsSection("call-stack", WI.UIString("Call Stack"), [callStackGroup]);

        this._callStackContainer = this.contentView.element.appendChild(document.createElement("div"));
        this._callStackContainer.classList.add("call-stack-container");
        this._callStackContainer.hidden = true;
        this._callStackContainer.appendChild(this._callStackSection.element);

        this._mainTargetTreeElement = null;
        this._activeCallFrameTreeElement = null;

        // Prevent the breakpoints list from being used as the source of selection restoration (e.g. on reload or navigation).
        this._breakpointsTreeOutline = this.createContentTreeOutline({ignoreCookieRestoration: true});
        this._breakpointsTreeOutline.addEventListener(WI.TreeOutline.Event.ElementRemoved, this._handleBreakpointTreeOutlineElementRemoved, this);
        this._breakpointsTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);
        this._breakpointsTreeOutline.ondelete = (selectedTreeElement) => {
            console.assert(selectedTreeElement.selected);

            if (selectedTreeElement.representedObject instanceof WI.Breakpoint && !selectedTreeElement.representedObject.removable) {
                let treeElementToSelect = selectedTreeElement.nextSelectableSibling;
                if (treeElementToSelect) {
                    const omitFocus = true;
                    const selectedByUser = true;
                    treeElementToSelect.select(omitFocus, selectedByUser);
                }
            } else if (selectedTreeElement instanceof WI.ResourceTreeElement || selectedTreeElement instanceof WI.ScriptTreeElement) {
                let breakpoints = this._breakpointsBeneathTreeElement(selectedTreeElement);
                this._removeAllBreakpoints(breakpoints);
            } else if (selectedTreeElement.representedObject === SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject) {
                let eventBreakpointsOnWindow = WI.domManager.eventListenerBreakpoints.filter((eventBreakpoint) => eventBreakpoint.eventListener.onWindow);
                for (let eventBreakpoint of eventBreakpointsOnWindow)
                    WI.domManager.removeBreakpointForEventListener(eventBreakpoint.eventListener);
            }

            return true;
        };
        this._breakpointsTreeOutline.populateContextMenu = (contextMenu, event, treeElement) => {
            // This check is necessary since the context menu is created by the TreeOutline, meaning
            // that any child could be the target of the context menu event.
            if (treeElement instanceof WI.ResourceTreeElement || treeElement instanceof WI.ScriptTreeElement) {
                let breakpoints = this._breakpointsBeneathTreeElement(treeElement);

                let shouldDisable = breakpoints.some((breakpoint) => !breakpoint.disabled);
                contextMenu.appendItem(shouldDisable ? WI.UIString("Disable Breakpoints") : WI.UIString("Enable Breakpoints"), () => {
                    this._toggleAllBreakpoints(breakpoints, shouldDisable);
                });

                contextMenu.appendItem(WI.UIString("Delete Breakpoints"), () => {
                    this._removeAllBreakpoints(breakpoints);
                });
            }

            WI.TreeOutline.prototype.populateContextMenu(contextMenu, event, treeElement);
        };

        let breakpointsRow = new WI.DetailsSectionRow;
        breakpointsRow.element.appendChild(this._breakpointsTreeOutline.element);

        let breakpointNavigationBarWrapper = document.createElement("div");

        let breakpointNavigationBar = new WI.NavigationBar;
        breakpointNavigationBarWrapper.appendChild(breakpointNavigationBar.element);

        this._createBreakpointButton = new WI.ButtonNavigationItem("create-breakpoint", WI.UIString("Create Breakpoint"), "Images/Plus13.svg", 13, 13);
        WI.addMouseDownContextMenuHandlers(this._createBreakpointButton.element, this._populateCreateBreakpointContextMenu.bind(this));
        breakpointNavigationBar.addNavigationItem(this._createBreakpointButton);

        let breakpointsGroup = new WI.DetailsSectionGroup([breakpointsRow]);
        this._breakpointsSection = new WI.DetailsSection("breakpoints", WI.UIString("Breakpoints"), [breakpointsGroup], breakpointNavigationBarWrapper);

        let breakpointsContainer = this.contentView.element.appendChild(document.createElement("div"));
        breakpointsContainer.classList.add("breakpoints-container");
        breakpointsContainer.appendChild(this._breakpointsSection.element);

        this._localOverridesTreeOutline = this.createContentTreeOutline({suppressFiltering: true});
        this._localOverridesTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);

        this._localOverridesRow = new WI.DetailsSectionRow(WI.UIString("No Overrides"));

        let localOverrideNavigationBarWrapper = document.createElement("div");

        let localOverrideNavigationBar = new WI.NavigationBar;
        localOverrideNavigationBarWrapper.appendChild(localOverrideNavigationBar.element);

        this._createLocalOverrideButton = new WI.ButtonNavigationItem("create-local-override", WI.UIString("Create Local Override"), "Images/Plus13.svg", 13, 13);
        WI.addMouseDownContextMenuHandlers(this._createLocalOverrideButton.element, this._populateCreateLocalOverrideContextMenu.bind(this));
        localOverrideNavigationBar.addNavigationItem(this._createLocalOverrideButton);

        let localOverridesGroup = new WI.DetailsSectionGroup([this._localOverridesRow]);
        this._localOverridesSection = new WI.DetailsSection("local-overrides", WI.UIString("Local Overrides"), [localOverridesGroup], localOverrideNavigationBarWrapper);

        this._localOverridesContainer = this.contentView.element.appendChild(document.createElement("div"));
        this._localOverridesContainer.classList.add("local-overrides-container");
        this._localOverridesContainer.hidden = true;
        this._localOverridesContainer.appendChild(this._localOverridesSection.element);

        this._consoleSnippetsTreeOutline = this.createContentTreeOutline({suppressFiltering: true});
        this._consoleSnippetsTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);

        this._consoleSnippetsRow = new WI.DetailsSectionRow(WI.UIString("No Console Snippets"));

        let consoleSnippetNavigationBarWrapper = document.createElement("div");

        let consoleSnippetNavigationBar = new WI.NavigationBar;
        consoleSnippetNavigationBarWrapper.appendChild(consoleSnippetNavigationBar.element);

        this._createConsoleSnippetButton = new WI.ButtonNavigationItem("create-console-snippet", WI.UIString("Create Console Snippet"), "Images/Plus13.svg", 13, 13);
        this._createConsoleSnippetButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCreateConsoleSnippetButtonClicked, this);
        consoleSnippetNavigationBar.addNavigationItem(this._createConsoleSnippetButton);

        let consoleSnippetsGroup = new WI.DetailsSectionGroup([this._consoleSnippetsRow]);
        this._consoleSnippetsSection = new WI.DetailsSection("console-snippets", WI.UIString("Console Snippets"), [consoleSnippetsGroup], consoleSnippetNavigationBarWrapper);

        this._consoleSnippetsContainer = this.contentView.element.appendChild(document.createElement("div"));
        this._consoleSnippetsContainer.classList.add("console-snippets-container");
        this._consoleSnippetsContainer.hidden = true;
        this._consoleSnippetsContainer.appendChild(this._consoleSnippetsSection.element);

        this._resourcesNavigationBar = new WI.NavigationBar;
        this.contentView.addSubview(this._resourcesNavigationBar);

        this._resourceGroupingModeScopeBarItems = {};
        let createResourceGroupingModeScopeBarItem = (mode, label) => {
            this._resourceGroupingModeScopeBarItems[mode] = new WI.ScopeBarItem("sources-resource-grouping-mode-" + mode, label, {exclusive: true});
            this._resourceGroupingModeScopeBarItems[mode][SourcesNavigationSidebarPanel.ResourceGroupingModeSymbol] = mode;
        };
        createResourceGroupingModeScopeBarItem(WI.Resource.GroupingMode.Type, WI.UIString("By Type"));
        createResourceGroupingModeScopeBarItem(WI.Resource.GroupingMode.Path, WI.UIString("By Path"));

        this._resourceGroupingModeScopeBar = new WI.ScopeBar("sources-resource-grouping-mode-scope-bar", Object.values(this._resourceGroupingModeScopeBarItems), this._resourceGroupingModeScopeBarItems[WI.settings.resourceGroupingMode.value]);
        this._resourceGroupingModeScopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._handleResourceGroupingModeScopeBarSelectionChanged, this);
        this._resourcesNavigationBar.addNavigationItem(this._resourceGroupingModeScopeBar);

        let resourcesContainer = this.contentView.element.appendChild(document.createElement("div"));
        resourcesContainer.classList.add("resources-container");

        this._resourcesTreeOutline = this.contentTreeOutline;
        this._resourcesTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);
        this._resourcesTreeOutline.includeSourceMapResourceChildren = true;
        resourcesContainer.appendChild(this._resourcesTreeOutline.element);

        if (WI.NetworkManager.supportsOverridingResponses() || WI.NetworkManager.supportsBootstrapScript() || WI.CSSManager.supportsInspectorStyleSheet()) {
            let createResourceNavigationBar = new WI.NavigationBar;

            let createResourceButtonNavigationItem = new WI.ButtonNavigationItem("create-resource", WI.UIString("Create Resource"), "Images/Plus15.svg", 15, 15);
            WI.addMouseDownContextMenuHandlers(createResourceButtonNavigationItem.element, this._populateCreateResourceContextMenu.bind(this));
            createResourceNavigationBar.addNavigationItem(createResourceButtonNavigationItem);

            this.filterBar.element.insertBefore(createResourceNavigationBar.element, this.filterBar.element.firstChild);
        }

        const activatedByDefault = false;
        this.filterBar.addFilterBarButton("sources-only-show-resources-with-issues", this._filterByResourcesWithIssues.bind(this), activatedByDefault, WI.UIString("Only show resources with issues"), WI.UIString("Show all resources"), "Images/Errors.svg", 15, 15);

        const resourceTypeScopeItemPrefix = "sources-resource-type-";
        let resourceTypeScopeBarItems = [];
        resourceTypeScopeBarItems.push(new WI.ScopeBarItem(resourceTypeScopeItemPrefix + "all", WI.UIString("All")));
        for (let value of Object.values(WI.Resource.Type)) {
            let scopeBarItem = new WI.ScopeBarItem(resourceTypeScopeItemPrefix + value, WI.Resource.displayNameForType(value, true));
            scopeBarItem[SourcesNavigationSidebarPanel.ResourceTypeSymbol] = value;
            resourceTypeScopeBarItems.push(scopeBarItem);
        }

        const shouldGroupNonExclusiveItems = true;
        this._resourceTypeScopeBar = new WI.ScopeBar("sources-resource-type-scope-bar", resourceTypeScopeBarItems, resourceTypeScopeBarItems[0], shouldGroupNonExclusiveItems);
        this._resourceTypeScopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._handleResourceTypeScopeBarSelectionChanged, this);
        this.filterBar.addFilterNavigationItem(this._resourceTypeScopeBar);

        WI.settings.resourceGroupingMode.addEventListener(WI.Setting.Event.Changed, this._handleResourceGroupingModeChanged, this);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._handleResourceAdded, this);
        WI.Target.addEventListener(WI.Target.Event.ResourceAdded, this._handleResourceAdded, this);

        WI.networkManager.addEventListener(WI.NetworkManager.Event.FrameWasAdded, this._handleFrameWasAdded, this);

        if (WI.NetworkManager.supportsBootstrapScript()) {
            WI.networkManager.addEventListener(WI.NetworkManager.Event.BootstrapScriptCreated, this._handleBootstrapScriptCreated, this);
            WI.networkManager.addEventListener(WI.NetworkManager.Event.BootstrapScriptDestroyed, this._handleBootstrapScriptDestroyed, this);
        }

        if (WI.NetworkManager.supportsOverridingResponses()) {
            WI.networkManager.addEventListener(WI.NetworkManager.Event.LocalResourceOverrideAdded, this._handleLocalResourceOverrideAdded, this);
            WI.networkManager.addEventListener(WI.NetworkManager.Event.LocalResourceOverrideRemoved, this._handleLocalResourceOverrideRemoved, this);
        }

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.SymbolicBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.EventBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.URLBreakpointAdded, this._handleDebuggerBreakpointAdded, this);

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.SymbolicBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.EventBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.addEventListener(WI.DOMDebuggerManager.Event.URLBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._handleDebuggerBreakpointsEnabledDidChange, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ScriptAdded, this._handleDebuggerScriptAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ScriptRemoved, this._handleDebuggerScriptRemoved, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ScriptsCleared, this._handleDebuggerScriptsCleared, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Paused, this._handleDebuggerPaused, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Resumed, this._handleDebuggerResumed, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.CallFramesDidChange, this._handleDebuggerCallFramesDidChange, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._handleDebuggerActiveCallFrameDidChange, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.WaitingToPause, this._handleDebuggerWaitingToPause, this);

        WI.JavaScriptBreakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.DisplayLocationDidChange, this._handleDebuggerObjectDisplayLocationDidChange, this);
        WI.IssueMessage.addEventListener(WI.IssueMessage.Event.DisplayLocationDidChange, this._handleDebuggerObjectDisplayLocationDidChange, this);

        WI.DOMBreakpoint.addEventListener(WI.DOMBreakpoint.Event.DOMNodeWillChange, this._handleDOMBreakpointDOMNodeWillChange, this);
        WI.DOMBreakpoint.addEventListener(WI.DOMBreakpoint.Event.DOMNodeDidChange, this._handleDOMBreakpointDOMNodeDidChange, this);

        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.IssueAdded, this._handleConsoleIssueAdded, this);
        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.Cleared, this._handleConsoleCleared, this);
        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.SnippetAdded, this._handleConsoleSnippetAdded, this);
        WI.consoleManager.addEventListener(WI.ConsoleManager.Event.SnippetRemoved, this._handleConsoleSnippetRemoved, this);

        WI.timelineManager.addEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);

        WI.auditManager.addEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditManagerTestScheduled, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditManagerTestCompleted, this);

        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetAdded, this._handleCSSStyleSheetAdded, this);
        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._handleCSSStyleSheetRemoved, this);

        WI.targetManager.addEventListener(WI.TargetManager.Event.TargetAdded, this._handleTargetAdded, this);
        WI.targetManager.addEventListener(WI.TargetManager.Event.TargetRemoved, this._handleTargetRemoved, this);

        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type
        WI.notifications.addEventListener(WI.Notification.ExtraDomainsActivated, this._handleExtraDomainsActivated, this);

        if (WI.SourcesNavigationSidebarPanel.shouldPlaceResourcesAtTopLevel()) {
            this._resourcesTreeOutline.disclosureButtons = false;
            WI.SourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, function(event) {
                this._resourcesTreeOutline.disclosureButtons = true;
            }, this);
        }

        if (WI.debuggerManager.debuggerStatementsBreakpoint)
            this._addBreakpoint(WI.debuggerManager.debuggerStatementsBreakpoint);

        if (WI.debuggerManager.allExceptionsBreakpoint)
            this._addBreakpoint(WI.debuggerManager.allExceptionsBreakpoint);

        if (WI.debuggerManager.uncaughtExceptionsBreakpoint)
            this._addBreakpoint(WI.debuggerManager.uncaughtExceptionsBreakpoint);

        if (WI.debuggerManager.assertionFailuresBreakpoint)
            this._addBreakpoint(WI.debuggerManager.assertionFailuresBreakpoint);

        if (WI.debuggerManager.allMicrotasksBreakpoint)
            this._addBreakpoint(WI.debuggerManager.allMicrotasksBreakpoint);

        for (let target of WI.targets)
            this._addTarget(target);

        this._updateCallStackTreeOutline();

        this._handleResourceGroupingModeChanged();

        if (WI.NetworkManager.supportsBootstrapScript()) {
            let bootstrapScript = WI.networkManager.bootstrapScript;
            if (bootstrapScript)
                this._addLocalOverride(bootstrapScript);
        }

        if (WI.NetworkManager.supportsOverridingResponses()) {
            for (let localResourceOverride of WI.networkManager.localResourceOverrides)
                this._addLocalOverride(localResourceOverride);
        }

        if (WI.domDebuggerManager.supported) {
            if (WI.domDebuggerManager.allAnimationFramesBreakpoint)
                this._addBreakpoint(WI.domDebuggerManager.allAnimationFramesBreakpoint);

            if (WI.domDebuggerManager.allTimeoutsBreakpoint)
                this._addBreakpoint(WI.domDebuggerManager.allTimeoutsBreakpoint);

            if (WI.domDebuggerManager.allIntervalsBreakpoint)
                this._addBreakpoint(WI.domDebuggerManager.allIntervalsBreakpoint);

            if (WI.domDebuggerManager.allListenersBreakpoint)
                this._addBreakpoint(WI.domDebuggerManager.allListenersBreakpoint);

            for (let eventBreakpoint of WI.domDebuggerManager.listenerBreakpoints)
                this._addBreakpoint(eventBreakpoint);

            for (let eventListenerBreakpoint of WI.domManager.eventListenerBreakpoints)
                this._addBreakpoint(eventListenerBreakpoint);

            for (let domBreakpoint of WI.domDebuggerManager.domBreakpoints)
                this._addBreakpoint(domBreakpoint);

            if (WI.domDebuggerManager.allRequestsBreakpoint)
                this._addBreakpoint(WI.domDebuggerManager.allRequestsBreakpoint);

            for (let urlBreakpoints of WI.domDebuggerManager.urlBreakpoints)
                this._addBreakpoint(urlBreakpoints);
        }

        if (WI.debuggerManager.paused)
            this._handleDebuggerPaused();

        if (WI.debuggerManager.breakpointsDisabledTemporarily) {
            this._handleTimelineCapturingStateChanged();

            if (WI.auditManager.runningState === WI.AuditManager.RunningState.Active || WI.auditManager.runningState === WI.AuditManager.RunningState.Stopping)
                this._handleAuditManagerTestScheduled();
        }

        for (let consoleSnippet of WI.consoleManager.snippets)
            this._addConsoleSnippet(consoleSnippet);

        this._updateBreakpointsDisabledBanner();
    }

    // Static

    static shouldPlaceResourcesAtTopLevel()
    {
        return WI.sharedApp.debuggableType === WI.DebuggableType.ITML
            || WI.sharedApp.debuggableType === WI.DebuggableType.JavaScript
            || WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker;
    }

    // Public

    get minimumWidth()
    {
        return Math.max(this._debuggerNavigationBar.minimumWidth, this._resourcesNavigationBar.minimumWidth);
    }

    closed()
    {
        WI.settings.resourceGroupingMode.removeEventListener(WI.Setting.Event.Changed, this._handleResourceGroupingModeChanged, this);

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ResourceWasAdded, this._handleResourceAdded, this);
        WI.Target.removeEventListener(WI.Target.Event.ResourceAdded, this._handleResourceAdded, this);

        WI.networkManager.removeEventListener(WI.NetworkManager.Event.FrameWasAdded, this._handleFrameWasAdded, this);

        if (WI.NetworkManager.supportsBootstrapScript()) {
            WI.networkManager.removeEventListener(WI.NetworkManager.Event.BootstrapScriptCreated, this._handleBootstrapScriptCreated, this);
            WI.networkManager.removeEventListener(WI.NetworkManager.Event.BootstrapScriptDestroyed, this._handleBootstrapScriptDestroyed, this);
        }

        if (WI.NetworkManager.supportsOverridingResponses()) {
            WI.networkManager.removeEventListener(WI.NetworkManager.Event.LocalResourceOverrideAdded, this._handleLocalResourceOverrideAdded, this);
            WI.networkManager.removeEventListener(WI.NetworkManager.Event.LocalResourceOverrideRemoved, this._handleLocalResourceOverrideRemoved, this);
        }

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.SymbolicBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.EventBreakpointAdded, this._handleDebuggerBreakpointAdded, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.URLBreakpointAdded, this._handleDebuggerBreakpointAdded, this);

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.SymbolicBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.DOMBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.EventBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);
        WI.domDebuggerManager.removeEventListener(WI.DOMDebuggerManager.Event.URLBreakpointRemoved, this._handleDebuggerBreakpointRemoved, this);

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this._handleDebuggerBreakpointsEnabledDidChange, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ScriptAdded, this._handleDebuggerScriptAdded, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ScriptRemoved, this._handleDebuggerScriptRemoved, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ScriptsCleared, this._handleDebuggerScriptsCleared, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Paused, this._handleDebuggerPaused, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.Resumed, this._handleDebuggerResumed, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.CallFramesDidChange, this._handleDebuggerCallFramesDidChange, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this._handleDebuggerActiveCallFrameDidChange, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.WaitingToPause, this._handleDebuggerWaitingToPause, this);

        WI.JavaScriptBreakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.DisplayLocationDidChange, this._handleDebuggerObjectDisplayLocationDidChange, this);
        WI.IssueMessage.removeEventListener(WI.IssueMessage.Event.DisplayLocationDidChange, this._handleDebuggerObjectDisplayLocationDidChange, this);

        WI.DOMBreakpoint.removeEventListener(WI.DOMBreakpoint.Event.DOMNodeWillChange, this._handleDOMBreakpointDOMNodeWillChange, this);
        WI.DOMBreakpoint.removeEventListener(WI.DOMBreakpoint.Event.DOMNodeDidChange, this._handleDOMBreakpointDOMNodeDidChange, this);

        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.IssueAdded, this._handleConsoleIssueAdded, this);
        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.Cleared, this._handleConsoleCleared, this);
        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.SnippetAdded, this._handleConsoleSnippetAdded, this);
        WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.SnippetRemoved, this._handleConsoleSnippetRemoved, this);

        WI.timelineManager.removeEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);

        WI.auditManager.removeEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditManagerTestScheduled, this);
        WI.auditManager.removeEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditManagerTestCompleted, this);

        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetAdded, this._handleCSSStyleSheetAdded, this);
        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._handleCSSStyleSheetRemoved, this);

        WI.targetManager.removeEventListener(WI.TargetManager.Event.TargetAdded, this._handleTargetAdded, this);
        WI.targetManager.removeEventListener(WI.TargetManager.Event.TargetRemoved, this._handleTargetRemoved, this);

        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type
        WI.notifications.removeEventListener(WI.Notification.ExtraDomainsActivated, this._handleExtraDomainsActivated, this);

        super.closed();
    }

    showDefaultContentView()
    {
        if (WI.networkManager.mainFrame) {
            this.contentBrowser.showContentViewForRepresentedObject(WI.networkManager.mainFrame);
            return;
        }

        let firstTreeElement = this._resourcesTreeOutline.children[0];
        if (firstTreeElement)
            this.showDefaultContentViewForTreeElement(firstTreeElement);
    }

    treeElementForRepresentedObject(representedObject)
    {
        // A custom implementation is needed for this since the frames are populated lazily.

        if (representedObject instanceof WI.LocalResourceOverride)
            return this._localOverridesTreeOutline.findTreeElement(representedObject);

        if (representedObject instanceof WI.LocalResource) {
            let localResourceOverride = representedObject.localResourceOverride || WI.networkManager.localResourceOverridesForURL(representedObject.url)[0];
            return this._localOverridesTreeOutline.findTreeElement(localResourceOverride);
        }

        if (representedObject instanceof WI.Script && representedObject === WI.networkManager.bootstrapScript)
            return this._localOverridesTreeOutline.findTreeElement(representedObject);

        if (representedObject instanceof WI.ConsoleSnippet)
            return this._consoleSnippetsTreeOutline.findTreeElement(representedObject);

        if (!this._mainFrameTreeElement && (representedObject instanceof WI.Resource || representedObject instanceof WI.Frame || representedObject instanceof WI.Collection)) {
            // All resources are under the main frame, so we need to return early if we don't have the main frame yet.
            return null;
        }

        switch (WI.settings.resourceGroupingMode.value) {
        case WI.Resource.GroupingMode.Path:
            if (representedObject instanceof WI.Frame)
                representedObject = representedObject.mainResource;
            break;

        default:
            WI.reportInternalError("Unknown resource grouping mode", {"Resource Grouping Mode": WI.settings.resourceGroupingMode.value});
            // Fallthrough for default value.

        case WI.Resource.GroupingMode.Type:
            if (representedObject instanceof WI.Resource && representedObject.parentFrame && representedObject.parentFrame.mainResource === representedObject)
                representedObject = representedObject.parentFrame;
            break;
        }

        function isAncestor(ancestor, resourceOrFrame) {
            // SourceMapResources are descendants of another SourceCode object.
            if (resourceOrFrame instanceof WI.SourceMapResource) {
                if (resourceOrFrame.sourceMap.originalSourceCode === ancestor)
                    return true;

                // Not a direct ancestor, so check the ancestors of the parent SourceCode object.
                resourceOrFrame = resourceOrFrame.sourceMap.originalSourceCode;
            }

            let currentFrame = resourceOrFrame.parentFrame;
            while (currentFrame) {
                if (currentFrame === ancestor)
                    return true;
                currentFrame = currentFrame.parentFrame;
            }
            return false;
        }

        function getParent(resourceOrFrame) {
            // SourceMapResources are descendants of another SourceCode object.
            if (resourceOrFrame instanceof WI.SourceMapResource)
                return resourceOrFrame.sourceMap.originalSourceCode;
            return resourceOrFrame.parentFrame;
        }

        function searchTreeOutline(treeOutline, forceSearch) {
            if (!treeOutline || (!treeOutline.selectedTreeElement && !forceSearch))
                return null;
            return treeOutline.findTreeElement(representedObject, isAncestor, getParent);
        }
        let treeElement = searchTreeOutline(this._pauseReasonTreeOutline) || searchTreeOutline(this._callStackTreeOutline) || searchTreeOutline(this._breakpointsTreeOutline) || searchTreeOutline(this._resourcesTreeOutline, true);
        if (treeElement)
            return treeElement;

        if (representedObject instanceof WI.Script) {
            // If the Script has a URL we should have found it earlier.
            if (representedObject.url) {
                console.assert(false, "Didn't find a ScriptTreeElement for a Script with a URL.", representedObject);
                return null;
            }

            console.assert(representedObject.anonymous, representedObject);

            // Since the Script does not have a URL we consider it an 'anonymous' script. These scripts happen from calls to
            // window.eval() or browser features like Auto Fill and Reader. They are not normally added to the sidebar, but since
            // we have a ScriptContentView asking for the tree element we will make a ScriptTreeElement on demand and add it.

            if (!this._anonymousScriptsFolderTreeElement)
                this._anonymousScriptsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Anonymous Scripts"), new WI.ScriptCollection);

            if (!this._anonymousScriptsFolderTreeElement.parent) {
                let index = insertionIndexForObjectInListSortedByFunction(this._anonymousScriptsFolderTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
                this._resourcesTreeOutline.insertChild(this._anonymousScriptsFolderTreeElement, index);
                this._resourcesTreeOutline.disclosureButtons = true;
            }

            this._anonymousScriptsFolderTreeElement.representedObject.add(representedObject);

            let scriptTreeElement = new WI.ScriptTreeElement(representedObject);
            this._anonymousScriptsFolderTreeElement.appendChild(scriptTreeElement);
            return scriptTreeElement;
        }

        if (representedObject instanceof WI.CSSStyleSheet) {
            // If the CSSStyleSheet has a URL we should have found it earlier.
            if (representedObject.url) {
                console.assert(false, "Didn't find a CSSStyleSheetTreeElement for a CSSStyleSheet with a URL.", representedObject);
                return null;
            }

            console.assert(representedObject.anonymous, representedObject);

            if (!this._anonymousStyleSheetsFolderTreeElement)
                this._anonymousStyleSheetsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Anonymous Style Sheets"), new WI.CSSStyleSheetCollection);

            if (!this._anonymousStyleSheetsFolderTreeElement.parent) {
                let index = insertionIndexForObjectInListSortedByFunction(this._anonymousStyleSheetsFolderTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
                this._resourcesTreeOutline.insertChild(this._anonymousStyleSheetsFolderTreeElement, index);
                this._resourcesTreeOutline.disclosureButtons = true;
            }

           let cssStyleSheetTreeElement = new WI.CSSStyleSheetTreeElement(representedObject);
           this._anonymousStyleSheetsFolderTreeElement.appendChild(cssStyleSheetTreeElement);
           return cssStyleSheetTreeElement;
        }

        console.assert(false, "Didn't find a TreeElement for representedObject", representedObject);
        return null;
    }

    handleCopyEvent(event)
    {
        let selectedTreeElements = new Set(this._callStackTreeOutline.selectedTreeElements);
        if (!selectedTreeElements.size)
            return;

        let treeElement = this._callStackTreeOutline.children[0];

        const ignoreHidden = true;
        const skipUnrevealed = true;
        const stayWithin = null;
        const dontPopulate = true;
        while (!treeElement.revealed(ignoreHidden))
            treeElement = treeElement.traverseNextTreeElement(skipUnrevealed, stayWithin, dontPopulate);

        let indentString = WI.indentString();
        let threads = [];
        let asyncBoundary = null;

        function addCallFrame(callFrame) {
            if (asyncBoundary) {
                threads.lastValue.frames.push("--- " + asyncBoundary + " ---");
                asyncBoundary = null;
            }

            let line = callFrame.displayName;

            let sourceCodeLocation = callFrame.sourceCodeLocation;
            if (sourceCodeLocation)
                line += " (" + sourceCodeLocation.displayLocationString() + ")";

            threads.lastValue.frames.push(line);
        }

        for (; treeElement; treeElement = treeElement.traverseNextTreeElement(skipUnrevealed, stayWithin, dontPopulate)) {
            if (treeElement instanceof WI.ThreadTreeElement) {
                threads.push({
                    name: treeElement.mainTitle,
                    frames: [],
                });

                asyncBoundary = null;

                continue;
            }

            if (treeElement.isAsyncBoundaryCallFrame || treeElement.isTruncatedBoundaryCallFrame)
                asyncBoundary = treeElement.mainTitle;

            if (!selectedTreeElements.has(treeElement))
                continue;

            if (treeElement instanceof WI.CallFrameTreeElement) {
                addCallFrame(treeElement.callFrame);
                continue;
            }

            if (treeElement instanceof WI.BlackboxedGroupTreeElement) {
                for (let callFrame of treeElement.callFrames)
                    addCallFrame(callFrame);

                continue;
            }
        }

        let multipleFramesSelected = threads.filter(({frames}) => frames.length).length > 1;

        let lines = [];
        for (let {name, frames} of threads) {
            if (multipleFramesSelected)
                lines.push(name);

            for (let frame of frames) {
                let prefix = "";
                if (multipleFramesSelected)
                    prefix = indentString;
                lines.push(prefix + frame);
            }
        }
        if (!lines.length)
            return;

        setTimeout(() => {
            InspectorFrontendHost.copyText(lines.join("\n"));
        });

        event.stop();
    }

    // Protected

    createContentTreeOutline(options = {})
    {
        let treeOutline = super.createContentTreeOutline(options);

        treeOutline.addEventListener(WI.TreeOutline.Event.ElementRevealed, function(event) {
            let treeElement = event.data.element;
            let detailsSections = [
                this._pauseReasonSection,
                this._callStackSection,
                this._breakpointsSection,
                this._localOverridesSection,
                this._consoleSnippetsSection,
            ];
            let detailsSection = detailsSections.find((detailsSection) => detailsSection.element.contains(treeElement.listItemElement));
            if (!detailsSection)
                return;

            // Revealing a TreeElement at the scroll container's topmost edge with
            // scrollIntoViewIfNeeded may result in the element being covered by the
            // DetailsSection header, which uses sticky positioning. Detect this case,
            // and adjust the sidebar content's scroll position to compensate.
            let offset = detailsSection.headerElement.totalOffsetBottom - treeElement.listItemElement.totalOffsetTop;
            if (offset > 0)
                this.scrollElement.scrollBy(0, -offset);
        }, this);

        return treeOutline;
    }

    resetFilter()
    {
        this._resourceTypeScopeBar.resetToDefault();

        super.resetFilter();
    }

    hasCustomFilters()
    {
        console.assert(this._resourceTypeScopeBar.selectedItems.length === 1);
        let selectedScopeBarItem = this._resourceTypeScopeBar.selectedItems[0];
        return selectedScopeBarItem && selectedScopeBarItem !== this._resourceTypeScopeBar.defaultItem;
    }

    matchTreeElementAgainstCustomFilters(treeElement, flags)
    {
        // Only apply the resource type filter to the resources list.
        if (treeElement.treeOutline !== this._resourcesTreeOutline)
            return true;

        console.assert(this._resourceTypeScopeBar.selectedItems.length === 1);
        let selectedScopeBarItem = this._resourceTypeScopeBar.selectedItems[0];

        // Show everything if there is no selection or "All Resources" is selected (the default item).
        if (!selectedScopeBarItem || selectedScopeBarItem === this._resourceTypeScopeBar.defaultItem)
            return true;

        // Folders are hidden on the first pass, but visible childen under the folder will force the folder visible again.
        if (treeElement instanceof WI.FolderTreeElement || treeElement instanceof WI.OriginTreeElement)
            return false;

        if (treeElement instanceof WI.IssueTreeElement)
            treeElement = treeElement.parent;

        function match()
        {
            if (treeElement instanceof WI.FrameTreeElement)
                return selectedScopeBarItem[WI.SourcesNavigationSidebarPanel.ResourceTypeSymbol] === WI.Resource.Type.Document;

            if (treeElement instanceof WI.ScriptTreeElement)
                return selectedScopeBarItem[WI.SourcesNavigationSidebarPanel.ResourceTypeSymbol] === WI.Resource.Type.Script;

            if (treeElement instanceof WI.CSSStyleSheetTreeElement)
                return selectedScopeBarItem[WI.SourcesNavigationSidebarPanel.ResourceTypeSymbol] === WI.Resource.Type.StyleSheet;

            console.assert(treeElement instanceof WI.ResourceTreeElement, "Unknown treeElement", treeElement);
            if (!(treeElement instanceof WI.ResourceTreeElement))
                return false;

            return treeElement.resource.type === selectedScopeBarItem[WI.SourcesNavigationSidebarPanel.ResourceTypeSymbol];
        }

        let matched = match();
        if (matched)
            flags.expandTreeElement = true;
        return matched;
    }

    // Popover delegate

    willDismissPopover(popover)
    {
        if (popover instanceof WI.LocalResourceOverridePopover) {
            this._willDismissLocalOverridePopover(popover);
            return;
        }

        if (popover instanceof WI.InputPopover) {
            this._willDismissConsoleSnippetPopover(popover);
            return;
        }

        if (popover instanceof WI.EventBreakpointPopover) {
            this._willDismissEventBreakpointPopover(popover);
            return;
        }

        if (popover instanceof WI.URLBreakpointPopover) {
            this._willDismissURLBreakpointPopover(popover);
            return;
        }

        if (popover instanceof WI.SymbolicBreakpointPopover) {
            this._willDismissSymbolicBreakpointPopover(popover);
            return;
        }

        console.assert(false, "not reached", popover);
    }

    // Private

    _willDismissLocalOverridePopover(popover)
    {
        let serializedData = popover.serializedData;
        if (!serializedData) {
            if (!this._localOverridesTreeOutline.children.length)
                this._localOverridesContainer.hidden = true;

            InspectorFrontendHost.beep();
            return;
        }

        // Do not conflict with an existing override.
        if (WI.networkManager.localResourceOverrides.some((existingOverride) => existingOverride.equals(serializedData))) {
            InspectorFrontendHost.beep();
            return;
        }

        let localResourceOverride = WI.LocalResourceOverride.create(serializedData.url, serializedData.type, serializedData);
        WI.networkManager.addLocalResourceOverride(localResourceOverride);
        WI.showLocalResourceOverride(localResourceOverride);
    }

    _willDismissConsoleSnippetPopover(popover)
    {
        let title = popover.value?.trim();
        if (!title) {
            if (!this._consoleSnippetsTreeOutline.children.length)
                this._consoleSnippetsContainer.hidden = true;

            InspectorFrontendHost.beep();
            return;
        }

        // Do not conflict with an existing consoleSnippet.
        if (WI.consoleManager.snippets.some((consoleSnippet) => consoleSnippet.title === title)) {
            InspectorFrontendHost.beep();
            return;
        }

        let consoleSnippet = WI.ConsoleSnippet.createDefaultWithTitle(title);
        WI.consoleManager.addSnippet(consoleSnippet);

        const cookie = null;
        WI.showRepresentedObject(consoleSnippet, cookie, {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        });
    }

    _willDismissEventBreakpointPopover(popover)
    {
        let breakpoint = popover.breakpoint;
        if (!breakpoint) {
            InspectorFrontendHost.beep();
            return;
        }

        if (!WI.domDebuggerManager.addEventBreakpoint(breakpoint))
            InspectorFrontendHost.beep();
    }

    _willDismissURLBreakpointPopover(popover)
    {
        let breakpoint = popover.breakpoint;
        if (!breakpoint) {
            InspectorFrontendHost.beep();
            return;
        }

        if (!WI.domDebuggerManager.addURLBreakpoint(breakpoint))
            InspectorFrontendHost.beep();
    }

    _willDismissSymbolicBreakpointPopover(popover)
    {
        let breakpoint = popover.breakpoint;
        if (!breakpoint) {
            InspectorFrontendHost.beep();
            return;
        }

        if (!WI.debuggerManager.addSymbolicBreakpoint(breakpoint))
            InspectorFrontendHost.beep();
    }

    _filterByResourcesWithIssues(treeElement)
    {
        if (treeElement.treeOutline !== this._resourcesTreeOutline)
            return true;

        if (treeElement instanceof WI.IssueTreeElement)
            return true;

        if (treeElement.hasChildren) {
            for (let child of treeElement.children) {
                if (child instanceof WI.IssueTreeElement)
                    return true;
            }
        }
        return false;
    }

    _compareTreeElements(a, b)
    {
        const rankFunctions = [
            (treeElement) => treeElement instanceof WI.ScriptTreeElement && treeElement.representedObject === WI.networkManager.bootstrapScript,
            (treeElement) => treeElement instanceof WI.LocalResourceOverrideTreeElement,
            (treeElement) => treeElement instanceof WI.ScriptTreeElement && treeElement.representedObject instanceof WI.ConsoleSnippet,
            (treeElement) => treeElement instanceof WI.CSSStyleSheetTreeElement && treeElement.representedObject.isInspectorStyleSheet(),
            (treeElement) => treeElement === this._mainFrameTreeElement,
            (treeElement) => treeElement instanceof WI.FrameTreeElement,
            (treeElement) => treeElement instanceof WI.OriginTreeElement,
            (treeElement) => {
                return treeElement !== this._extensionScriptsFolderTreeElement
                    && treeElement !== this._extensionStyleSheetsFolderTreeElement
                    && treeElement !== this._extraScriptsFolderTreeElement
                    && treeElement !== this._extraStyleSheetsFolderTreeElement
                    && treeElement !== this._anonymousScriptsFolderTreeElement
                    && treeElement !== this._anonymousStyleSheetsFolderTreeElement;
            },
            (treeElement) => treeElement === this._extensionScriptsFolderTreeElement,
            (treeElement) => treeElement === this._extensionStyleSheetsFolderTreeElement,
            (treeElement) => treeElement === this._extraScriptsFolderTreeElement,
            (treeElement) => treeElement === this._extraStyleSheetsFolderTreeElement,
            (treeElement) => treeElement === this._anonymousScriptsFolderTreeElement,
            (treeElement) => treeElement === this._anonymousStyleSheetsFolderTreeElement,
        ];

        let aRank = rankFunctions.findIndex((rankFunction) => rankFunction(a));
        let bRank = rankFunctions.findIndex((rankFunction) => rankFunction(b));
        if ((aRank >= 0 && bRank < 0) || aRank < bRank)
            return -1;
        if ((bRank >= 0 && aRank < 0) || bRank < aRank)
            return 1;

        return a.mainTitle.extendedLocaleCompare(b.mainTitle) || a.subtitle.extendedLocaleCompare(b.subtitle);
    }

    _closeContentViewsFilter(contentView)
    {
        // Local Resource Override content views do not need to be closed across page navigations.
        if (contentView.representedObject instanceof WI.LocalResource && contentView.representedObject.localResourceOverride)
            return false;

        return true;
    }

    _updateMainFrameTreeElement(mainFrame)
    {
        if (this.didInitialLayout)
            this.contentBrowser.contentViewContainer.closeAllContentViews(this._closeContentViewsFilter);

        let oldMainFrameTreeElement = this._mainFrameTreeElement;
        if (this._mainFrameTreeElement) {
            this._resourcesTreeOutline.removeChild(this._mainFrameTreeElement);
            this._mainFrameTreeElement = null;
        }

        if (!mainFrame)
            return;

        switch (WI.settings.resourceGroupingMode.value) {
        case WI.Resource.GroupingMode.Path: {
            for (let treeElement of this._originTreeElementMap.values()) {
                if (treeElement !== oldMainFrameTreeElement)
                    this._resourcesTreeOutline.removeChild(treeElement);
            }
            this._originTreeElementMap.clear();

            let origin = mainFrame.urlComponents.origin;
            this._mainFrameTreeElement = new WI.OriginTreeElement(origin, mainFrame, {hasChildren: true});
            this._originTreeElementMap.set(origin, this._mainFrameTreeElement);
            break;
        }

        default:
            WI.reportInternalError("Unknown resource grouping mode", {"Resource Grouping Mode": WI.settings.resourceGroupingMode.value});
            // Fallthrough for default value.

        case WI.Resource.GroupingMode.Type:
            this._mainFrameTreeElement = new WI.FrameTreeElement(mainFrame);
            break;
        }

        this._resourcesTreeOutline.insertChild(this._mainFrameTreeElement, 0);

        // Cookie restoration will attempt to re-select the resource we were showing.
        // Give it time to do that before selecting the main frame resource.
        setTimeout(() => {
            if (this._resourcesTreeOutline.selectedTreeElement)
                return;

            let currentContentView = this.contentBrowser.currentContentView;
            let treeElement = currentContentView ? this.treeElementForRepresentedObject(currentContentView.representedObject) : null;
            if (!treeElement)
                treeElement = this.treeElementForRepresentedObject(WI.networkManager.mainFrame);
            this.showDefaultContentViewForTreeElement(treeElement);
        });
    }

    _addTarget(target)
    {
        let treeElement = new WI.ThreadTreeElement(target);
        this._callStackTreeOutline.appendChild(treeElement);

        // FIXME: When WI.mainTarget changes?
        if (target === WI.mainTarget)
            this._mainTargetTreeElement = treeElement;

        this._updateCallStackTreeOutline();
    }

    _findCallStackTargetTreeElement(target)
    {
        for (let child of this._callStackTreeOutline.children) {
            if (child.target === target)
                return child;
        }
        return null;
    }

    _updateCallStackTreeOutline()
    {
        let singleThreadShowing = WI.targets.length <= 1;
        this._callStackTreeOutline.element.classList.toggle("single-thread", singleThreadShowing);
        if (this._mainTargetTreeElement)
            this._mainTargetTreeElement.selectable = !singleThreadShowing;
    }

    _addResource(resource)
    {
        if (WI.settings.resourceGroupingMode.value === WI.Resource.GroupingMode.Path) {
            if (!this._mainFrameTreeElement || this._resourcesTreeOutline.findTreeElement(resource))
                return;

            let parentTreeElement = null;

            if (resource instanceof WI.CSSStyleSheet) {
                console.assert(resource.isInspectorStyleSheet());
                parentTreeElement = this._resourcesTreeOutline.findTreeElement(resource.parentFrame.mainResource);
            }

            if (!parentTreeElement) {
                let origin = resource.urlComponents.origin;
                if (origin) {
                    let originTreeElement = this._originTreeElementMap.get(origin);
                    if (!originTreeElement) {
                        let representedObject = resource.type === WI.Resource.Type.Document ? resource.parentFrame : null;
                        originTreeElement = new WI.OriginTreeElement(origin, representedObject, {hasChildren: true});
                        this._originTreeElementMap.set(origin, originTreeElement);

                        let index = insertionIndexForObjectInListSortedByFunction(originTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
                        this._resourcesTreeOutline.insertChild(originTreeElement, index);
                    }

                    let subpath = resource.urlComponents.path;
                    if (subpath && subpath[0] === "/")
                        subpath = subpath.substring(1);

                    parentTreeElement = originTreeElement.createFoldersAsNeededForSubpath(subpath, this._boundCompareTreeElements);
                } else
                    parentTreeElement = this._resourcesTreeOutline;
            }

            let resourceTreeElement = null;
            if (resource instanceof WI.CSSStyleSheet)
                resourceTreeElement = new WI.CSSStyleSheetTreeElement(resource);
            else {
                let constructor = resource.type === WI.Resource.Type.WebSocket ? WI.WebSocketResourceTreeElement : WI.ResourceTreeElement;
                resourceTreeElement = new constructor(resource, resource, {allowDirectoryAsName: true, hideOrigin: true});
            }

            let index = insertionIndexForObjectInListSortedByFunction(resourceTreeElement, parentTreeElement.children, this._boundCompareTreeElements);
            parentTreeElement.insertChild(resourceTreeElement, index);
        }

        if (resource.type === WI.Resource.Type.Document || resource.type === WI.Resource.Type.Script) {
            this._addBreakpointsForSourceCode(resource);
            this._addIssuesForSourceCode(resource);
        }
    }

    _addResourcesRecursivelyForFrame(frame)
    {
        this._addResource(frame.mainResource);

        for (let resource of frame.resourceCollection)
            this._addResource(resource);

        for (let childFrame of frame.childFrameCollection)
            this._addResourcesRecursivelyForFrame(childFrame);

        if (WI.settings.resourceGroupingMode.value === WI.Resource.GroupingMode.Path) {
            for (let styleSheet of WI.cssManager.inspectorStyleSheetsForFrame(frame))
                this._addResource(styleSheet);
        }
    }

    _addStyleSheet(styleSheet)
    {
        console.assert(styleSheet instanceof WI.CSSStyleSheet);
        console.assert(!styleSheet.isInspectorStyleSheet());

        // We don't add style sheets without URLs here. Those style sheets can quickly clutter the
        // interface and are usually more transient. They will get added if/when they need to be
        // shown in a content view.
        if (styleSheet.anonymous)
            return;

        let parentTreeElement = null;

        if (WI.browserManager.isExtensionScheme(styleSheet.urlComponents.scheme)) {
            if (!this._extensionStyleSheetsFolderTreeElement)
                this._extensionStyleSheetsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Extension Style Sheets"), new WI.CSSStyleSheetCollection);
            parentTreeElement = this._extensionStyleSheetsFolderTreeElement;
        } else {
            if (!this._extraStyleSheetsFolderTreeElement)
                this._extraStyleSheetsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Extra Style Sheets"), new WI.CSSStyleSheetCollection);
            parentTreeElement = this._extraStyleSheetsFolderTreeElement;
        }

        if (!parentTreeElement.parent) {
            let index = insertionIndexForObjectInListSortedByFunction(parentTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
            this._resourcesTreeOutline.insertChild(parentTreeElement, index);
            this._resourcesTreeOutline.disclosureButtons = true;
        }

        let treeElement = new WI.CSSStyleSheetTreeElement(styleSheet);

        let index = insertionIndexForObjectInListSortedByFunction(treeElement, parentTreeElement.children, this._boundCompareTreeElements);
        parentTreeElement.insertChild(treeElement, index);
    }

    _addScript(script)
    {
        console.assert(script instanceof WI.Script);

        // We don't add scripts without URLs here. Those scripts can quickly clutter the interface and
        // are usually more transient. They will get added if/when they need to be shown in a content view.
        if (script.anonymous)
            return;

        // Target main resource.
        if (WI.sharedApp.debuggableType !== WI.DebuggableType.JavaScript && WI.sharedApp.debuggableType !== WI.DebuggableType.ITML) {
            if (script.target.type === WI.TargetType.Worker) {
                if (script.isMainResource()) {
                    this._addWorkerTargetWithMainResource(script.target);
                    this._addBreakpointsForSourceCode(script);
                    this._addIssuesForSourceCode(script);
                }
                this._resourcesTreeOutline.disclosureButtons = true;
                return;
            }
        }

        // If the script URL matches a resource we can assume it is part of that resource and does not need added.
        if (script.resource || script.dynamicallyAddedScriptElement)
            return;

        let scriptTreeElement = new WI.ScriptTreeElement(script);

        if (!script.injected && WI.SourcesNavigationSidebarPanel.shouldPlaceResourcesAtTopLevel()) {
            let index = insertionIndexForObjectInListSortedByFunction(scriptTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
            this._resourcesTreeOutline.insertChild(scriptTreeElement, index);
        } else {
            let parentFolderTreeElement = null;

            if (WI.browserManager.isExtensionScheme(script.urlComponents.scheme)) {
                if (!this._extensionScriptsFolderTreeElement) {
                    let collection = new WI.ScriptCollection;
                    this._extensionScriptsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Extension Scripts"), collection);
                }

                parentFolderTreeElement = this._extensionScriptsFolderTreeElement;
            } else {
                if (!this._extraScriptsFolderTreeElement) {
                    let collection = new WI.ScriptCollection;
                    this._extraScriptsFolderTreeElement = new WI.FolderTreeElement(WI.UIString("Extra Scripts"), collection);
                }

                parentFolderTreeElement = this._extraScriptsFolderTreeElement;
            }

            if (parentFolderTreeElement)
                parentFolderTreeElement.representedObject.add(script);

            if (!parentFolderTreeElement.parent) {
                let index = insertionIndexForObjectInListSortedByFunction(parentFolderTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
                this._resourcesTreeOutline.insertChild(parentFolderTreeElement, index);
                this._resourcesTreeOutline.disclosureButtons = true;
            }

            parentFolderTreeElement.appendChild(scriptTreeElement);
        }

        this._addBreakpointsForSourceCode(script);
        this._addIssuesForSourceCode(script);
    }

    _addWorkerTargetWithMainResource(target)
    {
        console.assert(target.type === WI.TargetType.Worker);

        if (this._workerTargetTreeElementMap.has(target))
            return;

        let targetTreeElement = new WI.WorkerTreeElement(target);
        this._workerTargetTreeElementMap.set(target, targetTreeElement);

        let index = insertionIndexForObjectInListSortedByFunction(targetTreeElement, this._resourcesTreeOutline.children, this._boundCompareTreeElements);
        this._resourcesTreeOutline.insertChild(targetTreeElement, index);
    }

    _addDebuggerTreeElementForSourceCode(sourceCode)
    {
        let treeElement = this._breakpointsTreeOutline.findTreeElement(sourceCode);
        if (!treeElement) {
            if (sourceCode instanceof WI.SourceMapResource)
                treeElement = new WI.SourceMapResourceTreeElement(sourceCode);
            else if (sourceCode instanceof WI.Resource)
                treeElement = new WI.ResourceTreeElement(sourceCode);
            else if (sourceCode instanceof WI.Script)
                treeElement = new WI.ScriptTreeElement(sourceCode);
        }

        if (!treeElement) {
            console.error("Unknown sourceCode instance", sourceCode);
            return null;
        }

        if (!treeElement.parent) {
            treeElement.hasChildren = false;
            treeElement.expand();

            this._insertDebuggerTreeElement(treeElement, this._breakpointsTreeOutline);
        }

        return treeElement;
    }

    _insertDebuggerTreeElement(treeElement, parentTreeElement)
    {
        let comparator = (a, b) => {
            const rankFunctions = [
                (treeElement) => treeElement.representedObject === WI.debuggerManager.debuggerStatementsBreakpoint,
                (treeElement) => treeElement.representedObject === WI.debuggerManager.allExceptionsBreakpoint,
                (treeElement) => treeElement.representedObject === WI.debuggerManager.uncaughtExceptionsBreakpoint,
                (treeElement) => treeElement.representedObject === WI.debuggerManager.assertionFailuresBreakpoint,
                (treeElement) => treeElement instanceof WI.ResourceTreeElement || treeElement instanceof WI.ScriptTreeElement || (treeElement instanceof WI.JavaScriptBreakpointTreeElement && !treeElement.representedObject.special),
                (treeElement) => treeElement instanceof WI.SymbolicBreakpointTreeElement,
                (treeElement) => treeElement.representedObject === WI.debuggerManager.allMicrotasksBreakpoint,
                (treeElement) => treeElement.representedObject === WI.domDebuggerManager.allAnimationFramesBreakpoint,
                (treeElement) => treeElement.representedObject === WI.domDebuggerManager.allTimeoutsBreakpoint,
                (treeElement) => treeElement.representedObject === WI.domDebuggerManager.allIntervalsBreakpoint,
                (treeElement) => treeElement.representedObject === WI.domDebuggerManager.allListenersBreakpoint,
                (treeElement) => treeElement instanceof WI.EventBreakpointTreeElement,
                (treeElement) => treeElement instanceof WI.DOMNodeTreeElement,
                (treeElement) => treeElement.representedObject === SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject,
                (treeElement) => treeElement instanceof WI.DOMBreakpointTreeElement,
                (treeElement) => treeElement.representedObject === WI.domDebuggerManager.allRequestsBreakpoint,
                (treeElement) => treeElement instanceof WI.URLBreakpointTreeElement,
            ];

            let aRank = rankFunctions.findIndex((rankFunction) => rankFunction(a));
            let bRank = rankFunctions.findIndex((rankFunction) => rankFunction(b));
            if (aRank >= 0 && bRank >= 0) {
                if (aRank < bRank)
                    return -1;
                if (bRank < aRank)
                    return 1;
            }

            if (a instanceof WI.JavaScriptBreakpointTreeElement && b instanceof WI.JavaScriptBreakpointTreeElement)
                return this._compareJavaScriptBreakpointTreeElements(a, b);

            return a.mainTitle.extendedLocaleCompare(b.mainTitle) || a.subtitle.extendedLocaleCompare(b.subtitle);
        };

        parentTreeElement.insertChild(treeElement, insertionIndexForObjectInListSortedByFunction(treeElement, parentTreeElement.children, comparator));
    }

    _compareJavaScriptBreakpointTreeElements(a, b)
    {
        if (!a.representedObject || !b.representedObject)
            return 0;

        let aLocation = a.representedObject.sourceCodeLocation;
        let bLocation = b.representedObject.sourceCodeLocation;
        if (!aLocation || !bLocation)
            return 0;

        return aLocation.displayLineNumber - bLocation.displayLineNumber || aLocation.displayColumnNumber - bLocation.displayColumnNumber;
    }

    _addBreakpoint(breakpoint)
    {
        if (this._breakpointsTreeOutline.findTreeElement(breakpoint))
            return null;

        let constructor = WI.JavaScriptBreakpointTreeElement;
        let options = {};
        let parentTreeElement = this._breakpointsTreeOutline;

        let getDOMNodeTreeElement = (domNode) => {
            let domNodeTreeElement = this._breakpointsTreeOutline.findTreeElement(domNode);
            if (!domNodeTreeElement) {
                domNodeTreeElement = new WI.DOMNodeTreeElement(domNode);
                this._insertDebuggerTreeElement(domNodeTreeElement, this._breakpointsTreeOutline);
            }
            return domNodeTreeElement;
        };

        if (breakpoint === WI.debuggerManager.debuggerStatementsBreakpoint)
            options.classNames = ["debugger-statement"];
        else if (breakpoint === WI.debuggerManager.allExceptionsBreakpoint)
            options.classNames = ["exception"];
        else if (breakpoint === WI.debuggerManager.uncaughtExceptionsBreakpoint)
            options.classNames = ["exception"];
        else if (breakpoint === WI.debuggerManager.assertionFailuresBreakpoint)
            options.classNames = ["assertion"];
        else if (breakpoint === WI.debuggerManager.allMicrotasksBreakpoint)
            options.classNames = ["microtask"];
        else if (breakpoint instanceof WI.DOMBreakpoint) {
            if (!breakpoint.domNode)
                return null;

            constructor = WI.DOMBreakpointTreeElement;

            parentTreeElement = getDOMNodeTreeElement(breakpoint.domNode);
        } else if (breakpoint instanceof WI.EventBreakpoint) {
            constructor = WI.EventBreakpointTreeElement;

            if (breakpoint.eventListener) {
                let eventTargetTreeElement = null;
                if (breakpoint.eventListener.onWindow) {
                    if (!SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject)
                        SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject = {__window: true};

                    eventTargetTreeElement = this._breakpointsTreeOutline.findTreeElement(SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject);
                    if (!eventTargetTreeElement) {
                        const subtitle = null;
                        eventTargetTreeElement = new WI.GeneralTreeElement(["event-target-window"], WI.unlocalizedString("window"), subtitle, SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject);
                        this._insertDebuggerTreeElement(eventTargetTreeElement, this._breakpointsTreeOutline);
                    }
                } else if (breakpoint.eventListener.node)
                    eventTargetTreeElement = getDOMNodeTreeElement(breakpoint.eventListener.node);
                if (eventTargetTreeElement)
                    parentTreeElement = eventTargetTreeElement;
            }
        } else if (breakpoint instanceof WI.URLBreakpoint)
            constructor = WI.URLBreakpointTreeElement;
        else if (breakpoint instanceof WI.SymbolicBreakpoint)
            constructor = WI.SymbolicBreakpointTreeElement;
        else {
            let sourceCode = breakpoint.sourceCodeLocation && breakpoint.sourceCodeLocation.displaySourceCode;
            if (!sourceCode)
                return null;

            parentTreeElement = this._addDebuggerTreeElementForSourceCode(sourceCode);

            // Mark disabled breakpoints as resolved if there is source code loaded with that URL.
            // This gives the illusion the breakpoint was resolved, but since we don't send disabled
            // breakpoints to the backend we don't know for sure. If the user enables the breakpoint
            // it will be resolved properly.
            if (breakpoint.disabled)
                breakpoint.resolved = true;
        }

        let breakpointTreeElement = new constructor(breakpoint, options);
        this._insertDebuggerTreeElement(breakpointTreeElement, parentTreeElement);
        if (parentTreeElement.children.length === 1)
            parentTreeElement.expand();
        return breakpointTreeElement;
    }

    _removeBreakpoint(breakpoint)
    {
        if (this._pauseReasonTreeOutline) {
            let pauseReasonBreakpointTreeElement = this._pauseReasonTreeOutline.findTreeElement(breakpoint);
            if (pauseReasonBreakpointTreeElement)
                pauseReasonBreakpointTreeElement.status = null;
        }

        let breakpointTreeElement = this._breakpointsTreeOutline.findTreeElement(breakpoint);
        if (!breakpointTreeElement)
            return;

        this._removeDebuggerTreeElement(breakpointTreeElement);
    }

    _removeAllBreakpoints(breakpoints)
    {
        for (let breakpoint of breakpoints) {
            if (breakpoint.removable)
                WI.debuggerManager.removeBreakpoint(breakpoint);
        }
    }

    _toggleAllBreakpoints(breakpoints, disabled)
    {
        for (let breakpoint of breakpoints)
            breakpoint.disabled = disabled;
    }

    _breakpointsBeneathTreeElement(treeElement)
    {
        console.assert(treeElement instanceof WI.ResourceTreeElement || treeElement instanceof WI.ScriptTreeElement);
        if (!(treeElement instanceof WI.ResourceTreeElement) && !(treeElement instanceof WI.ScriptTreeElement))
            return [];

        let breakpoints = [];
        for (let child of treeElement.children) {
            console.assert(child instanceof WI.JavaScriptBreakpointTreeElement);
            let breakpoint = child.breakpoint;
            console.assert(breakpoint);
            if (breakpoint)
                breakpoints.push(breakpoint);
        }
        return breakpoints;
    }

    _addIssue(issueMessage, sourceCode)
    {
        let issueTreeElement = this._resourcesTreeOutline.findTreeElement(issueMessage);
        if (!issueTreeElement) {
            console.assert(sourceCode || (issueMessage.sourceCodeLocation && issueMessage.sourceCodeLocation.sourceCode));
            let parentTreeElement = this._resourcesTreeOutline.findTreeElement(sourceCode || issueMessage.sourceCodeLocation.sourceCode);
            if (!parentTreeElement)
                return null;

            issueTreeElement = new WI.IssueTreeElement(issueMessage);

            parentTreeElement.insertChild(issueTreeElement, insertionIndexForObjectInListSortedByFunction(issueTreeElement, parentTreeElement.children, this._compareJavaScriptBreakpointTreeElements));
            if (parentTreeElement.children.length === 1)
                parentTreeElement.expand();
        }
        return issueTreeElement;
    }

    _removeDebuggerTreeElement(debuggerTreeElement)
    {
        // If this is a BreakpointTreeElement being deleted because of a cause
        // outside of the TreeOutline then deselect if it is selected to avoid
        // TreeOutline selection changes causing unexpected ContentView changes.
        if (!debuggerTreeElement.__deletedViaDeleteKeyboardShortcut)
            debuggerTreeElement.deselect();

        let parentTreeElement = debuggerTreeElement.parent;
        parentTreeElement.removeChild(debuggerTreeElement);

        if (parentTreeElement.children.length || parentTreeElement === this._breakpointsTreeOutline)
            return;

        parentTreeElement.treeOutline.removeChild(parentTreeElement);
    }

    _addBreakpointsForSourceCode(sourceCode)
    {
        for (let breakpoint of WI.debuggerManager.breakpointsForSourceCode(sourceCode))
            this._addBreakpoint(breakpoint);
    }

    _addIssuesForSourceCode(sourceCode)
    {
        for (let issue of WI.consoleManager.issuesForSourceCode(sourceCode))
            this._addIssue(issue, sourceCode);
    }

    _addLocalOverride(localOverride)
    {
        console.assert(WI.NetworkManager.supportsBootstrapScript() || WI.NetworkManager.supportsOverridingResponses());

        if (this._localOverridesTreeOutline.findTreeElement(localOverride))
            return;

        let parentTreeElement = this._localOverridesTreeOutline;

        let localOverrideTreeElement = null;
        if (localOverride === WI.networkManager.bootstrapScript)
            localOverrideTreeElement = new WI.BootstrapScriptTreeElement(localOverride);
        else if (localOverride instanceof WI.LocalResourceOverride)
            localOverrideTreeElement = new WI.LocalResourceOverrideTreeElement(localOverride);
        console.assert(localOverrideTreeElement);

        let index = insertionIndexForObjectInListSortedByFunction(localOverrideTreeElement, parentTreeElement.children, this._boundCompareTreeElements);
        parentTreeElement.insertChild(localOverrideTreeElement, index);

        this._localOverridesRow.hideEmptyMessage();
        this._localOverridesRow.element.appendChild(this._localOverridesTreeOutline.element);
        this._localOverridesContainer.hidden = false;
    }

    _removeResourceOverride(localOverride)
    {
        console.assert(WI.NetworkManager.supportsBootstrapScript() || WI.NetworkManager.supportsOverridingResponses());

        let resourceTreeElement = this._localOverridesTreeOutline.findTreeElement(localOverride);
        if (!resourceTreeElement)
            return;

        let wasSelected = resourceTreeElement.selected;

        let parentTreeElement = this._localOverridesTreeOutline;
        parentTreeElement.removeChild(resourceTreeElement);

        if (!parentTreeElement.children.length) {
            this._localOverridesContainer.hidden = true;

            if (wasSelected && WI.networkManager.mainFrame && WI.networkManager.mainFrame.mainResource)
                WI.showRepresentedObject(WI.networkManager.mainFrame.mainResource);
        }
    }

    _addConsoleSnippet(consoleSnippet)
    {
        console.assert(consoleSnippet instanceof WI.ConsoleSnippet, consoleSnippet);

        if (this._consoleSnippetsTreeOutline.findTreeElement(consoleSnippet))
            return;

        let parentTreeElement = this._consoleSnippetsTreeOutline;

        let consoleSnippetTreeElement = new WI.ConsoleSnippetTreeElement(consoleSnippet);

        let index = insertionIndexForObjectInListSortedByFunction(consoleSnippetTreeElement, parentTreeElement.children, this._boundCompareTreeElements);
        parentTreeElement.insertChild(consoleSnippetTreeElement, index);

        this._consoleSnippetsRow.hideEmptyMessage();
        this._consoleSnippetsRow.element.appendChild(this._consoleSnippetsTreeOutline.element);
        this._consoleSnippetsContainer.hidden = false;
    }

    _removeConsoleSnippet(consoleSnippet)
    {
        console.assert(consoleSnippet instanceof WI.ConsoleSnippet, consoleSnippet);

        let consoleSnippetTreeElement = this._consoleSnippetsTreeOutline.findTreeElement(consoleSnippet);
        if (!consoleSnippetTreeElement)
            return;

        let wasSelected = consoleSnippetTreeElement.selected;

        let parentTreeElement = this._consoleSnippetsTreeOutline;
        parentTreeElement.removeChild(consoleSnippetTreeElement);

        if (!parentTreeElement.children.length) {
            this._consoleSnippetsContainer.hidden = true;

            if (wasSelected && WI.networkManager.mainFrame && WI.networkManager.mainFrame.mainResource)
                WI.showRepresentedObject(WI.networkManager.mainFrame.mainResource);
        }
    }

    _updateTemporarilyDisabledBreakpointsButtons()
    {
        let breakpointsDisabledTemporarily = WI.debuggerManager.breakpointsDisabledTemporarily;
        this._debuggerBreakpointsButtonItem.enabled = !breakpointsDisabledTemporarily;
        this._debuggerPauseResumeButtonItem.enabled = !breakpointsDisabledTemporarily;
    }

    _updateBreakpointsDisabledBanner()
    {
        if (!WI.debuggerManager.breakpointsEnabled && !this._timelineRecordingWarningElement && !this._auditTestWarningElement) {
            if (!this._breakpointsDisabledWarningElement) {
                let enableBreakpointsButton = document.createElement("button");
                enableBreakpointsButton.textContent = WI.UIString("Enable Breakpoints");
                enableBreakpointsButton.addEventListener("click", () => {
                    WI.debuggerToggleBreakpoints();
                });

                this._breakpointsDisabledWarningElement = document.createElement("div");
                this._breakpointsDisabledWarningElement.classList.add("warning-banner");
                this._breakpointsDisabledWarningElement.append(WI.UIString("Breakpoints disabled"), document.createElement("br"), enableBreakpointsButton);
            }

            this.contentView.element.insertBefore(this._breakpointsDisabledWarningElement, this.contentView.element.firstChild);
        } else if (this._breakpointsDisabledWarningElement) {
            this._breakpointsDisabledWarningElement.remove();
            this._breakpointsDisabledWarningElement = null;
        }
    }

    _updatePauseReason()
    {
        this._pauseReasonTreeOutline = null;

        this._updatePauseReasonGotoArrow();

        let target = WI.debuggerManager.activeCallFrame.target;
        let targetData = WI.debuggerManager.dataForTarget(target);
        return this._updatePauseReasonSection(target, targetData.pauseReason, targetData.pauseData);
    }

    _updatePauseReasonGotoArrow()
    {
        this._pauseReasonLinkContainerElement.removeChildren();

        let activeCallFrame = WI.debuggerManager.activeCallFrame;
        if (!activeCallFrame)
            return;

        let sourceCodeLocation = activeCallFrame.sourceCodeLocation;
        if (!sourceCodeLocation)
            return;

        const options = {
            useGoToArrowButton: true,
        };
        let linkElement = WI.createSourceCodeLocationLink(sourceCodeLocation, options);
        this._pauseReasonLinkContainerElement.appendChild(linkElement);
    }

    _updatePauseReasonSection(target, pauseReason, pauseData)
    {
        switch (pauseReason) {
        case WI.DebuggerManager.PauseReason.AnimationFrame:
            if (!this._updatePauseReasonForBreakpoint(WI.domDebuggerManager.allAnimationFramesBreakpoint, WI.UIString("requestAnimationFrame Fired"))) {
                console.assert(false, "not reached");
                break;
            }
            return true;

        case WI.DebuggerManager.PauseReason.Assertion: {
            // FIXME: We should include the assertion condition string.
            console.assert(pauseData, "Expected data with an assertion, but found none.");

            let title = pauseData?.message ? this._createBreakpointPauseReasonTitleWithTooltip(WI.UIString("Assertion Failed: %s"), pauseData.message) : WI.UIString("Assertion Failed");
            if (!this._updatePauseReasonForBreakpoint(WI.debuggerManager.assertionFailuresBreakpoint, title)) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.BlackboxedScript: {
            console.assert(pauseData);
            if (pauseData)
                this._updatePauseReasonSection(target, WI.DebuggerManager.pauseReasonFromPayload(pauseData.originalReason), pauseData.originalData);

            // Don't use `_pauseReasonTextRow` as it may have already been set.
            let blackboxReasonTextRow = new WI.DetailsSectionTextRow(WI.UIString("Deferred pause from blackboxed script"));
            blackboxReasonTextRow.__blackboxReason = true;

            let existingRows = this._pauseReasonGroup.rows.filter((row) => !row.__blackboxReason);
            this._pauseReasonGroup.rows = [blackboxReasonTextRow, ...existingRows];
            return true;
        }

        case WI.DebuggerManager.PauseReason.Breakpoint: {
            console.assert(pauseData, "Expected breakpoint identifier, but found none.");
            if (!pauseData || !pauseData.breakpointId)
                break;

            let breakpoint = WI.debuggerManager.breakpointForIdentifier(pauseData.breakpointId);
            console.assert(breakpoint, pauseData.breakpointId);
            if (!breakpoint)
                break;

            if (!this._updatePauseReasonForBreakpoint(breakpoint, WI.UIString("Triggered Breakpoint"))) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.CSPViolation: {
            console.assert(pauseData, "Expected data with a CSP Violation, but found none.");
            if (!pauseData)
                break;

            let breakpoint = WI.debuggerManager.allExceptionsBreakpoint || WI.debuggerManager.uncaughtExceptionsBreakpoint;
            let titleElement = this._createBreakpointPauseReasonTitleWithTooltip(WI.UIString("Content Security Policy violation of directive: %s"), pauseData.directive);
            if (!this._updatePauseReasonForBreakpoint(breakpoint, titleElement)) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.DebuggerStatement:
            if (!WI.JavaScriptBreakpoint.supportsDebuggerStatements()) {
                this._pauseReasonTextRow.text = WI.UIString("Debugger Statement");
                this._pauseReasonGroup.rows = [this._pauseReasonTextRow];
                return true;
            }

            if (!this._updatePauseReasonForBreakpoint(WI.debuggerManager.debuggerStatementsBreakpoint, WI.UIString("Debugger Statement"))) {
                console.assert(false, "not reached");
                break;
            }
            return true;

        case WI.DebuggerManager.PauseReason.DOM: {
            console.assert(WI.domDebuggerManager.supported);
            console.assert(pauseData, "Expected DOM breakpoint data, but found none.");
            if (!pauseData || !pauseData.nodeId)
                break;

            let domNode = WI.domManager.nodeForId(pauseData.nodeId);
            let domBreakpoints = WI.domDebuggerManager.domBreakpointsForNode(domNode);
            let domBreakpoint;
            for (let breakpoint of domBreakpoints) {
                if (breakpoint.type === pauseData.type) {
                    domBreakpoint = breakpoint;
                    break;
                }
            }

            console.assert(domBreakpoint, "Missing DOM breakpoint of type for node", pauseData.type, domNode);
            if (!domBreakpoint)
                break;

            if (!this._updatePauseReasonForBreakpoint(domBreakpoint, WI.DOMBreakpoint.displayNameForType(domBreakpoint.type))) {
                console.assert(false, "not reached");
                break;
            }

            let ownerElementRow = new WI.DetailsSectionSimpleRow(WI.UIString("Element"), WI.linkifyNodeReference(domNode));
            this._pauseReasonGroup.rows = this._pauseReasonGroup.rows.concat(ownerElementRow);

            let updateTargetDescription = (nodeId) => {
                if (!nodeId)
                    return;

                let node = WI.domManager.nodeForId(nodeId);
                console.assert(node, "Missing node for id.", nodeId);
                if (!node)
                    return;

                let fragment = document.createDocumentFragment();

                let description = null;
                switch (domBreakpoint.type) {
                case WI.DOMBreakpoint.Type.SubtreeModified:
                    description = pauseData.insertion ? WI.UIString("Child added to ") : WI.UIString("Removed descendant ");
                    break;
                case WI.DOMBreakpoint.Type.NodeRemoved:
                    description = WI.UIString("Removed ancestor ");
                    break;
                }
                console.assert(description);
                fragment.append(description, WI.linkifyNodeReference(node));

                let targetDescriptionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Details"), fragment);
                targetDescriptionRow.element.classList.add("target-description");

                this._pauseReasonGroup.rows = this._pauseReasonGroup.rows.concat(targetDescriptionRow);
            };

            if (pauseData.targetNodeId) {
                console.assert(domBreakpoint.type === WI.DOMBreakpoint.Type.SubtreeModified || domBreakpoint.type === WI.DOMBreakpoint.Type.NodeRemoved);
                console.assert(pauseData.targetNodeId !== domBreakpoint.domNode.id, pauseData.targetNodeId, domBreakpoint);
                updateTargetDescription(pauseData.targetNodeId);
            } else if (pauseData.targetNode) { // COMPATIBILITY (iOS 13): `targetNode` was renamed to `targetNodeId` and was changed from a `Runtime.RemoteObject` to a `DOM.NodeId`.
                console.assert(domBreakpoint.type === WI.DOMBreakpoint.Type.SubtreeModified);
                let remoteObject = WI.RemoteObject.fromPayload(pauseData.targetNode, target);
                remoteObject.pushNodeToFrontend(updateTargetDescription);
            }

            return true;
        }

        case WI.DebuggerManager.PauseReason.Listener:
        case WI.DebuggerManager.PauseReason.EventListener: {
            console.assert(pauseData, "Expected data with an event listener, but found none.");
            if (!pauseData)
                break;

            let eventBreakpoint = null;
            if (pauseData.eventListenerId)
                eventBreakpoint = WI.domManager.breakpointForEventListenerId(pauseData.eventListenerId);
            if (!eventBreakpoint)
                eventBreakpoint = WI.domDebuggerManager.listenerBreakpointsForEventName(pauseData.eventName)[0];

            console.assert(eventBreakpoint, "Expected Event Listener breakpoint for event name.", pauseData.eventName);
            if (!eventBreakpoint)
                break;

            let titleElement = this._createBreakpointPauseReasonTitleWithTooltip(WI.UIString("\u201C%s\u201D Event Fired"), pauseData.eventName);
            if (!this._updatePauseReasonForBreakpoint(eventBreakpoint, titleElement)) {
                console.assert(false, "not reached");
                break;
            }

            let eventListener = eventBreakpoint.eventListener;
            if (eventListener) {
                console.assert(eventListener.eventListenerId === pauseData.eventListenerId);

                let value = null;
                if (eventListener.onWindow)
                    value = WI.unlocalizedString("window");
                else if (eventListener.node)
                    value = WI.linkifyNodeReference(eventListener.node);
                if (value)
                    this._pauseReasonGroup.rows = this._pauseReasonGroup.rows.concat(new WI.DetailsSectionSimpleRow(WI.UIString("Target"), value));
            }

            return true;
        }

        case WI.DebuggerManager.PauseReason.Exception: {
            console.assert(pauseData, "Expected data with an exception, but found none.");
            if (!pauseData)
                break;

            // FIXME: We should improve the appearance of thrown objects. This works well for exception strings.
            let data = WI.RemoteObject.fromPayload(pauseData, target);

            let breakpoint = WI.debuggerManager.allExceptionsBreakpoint || WI.debuggerManager.uncaughtExceptionsBreakpoint;
            let titleElement = this._createBreakpointPauseReasonTitleWithTooltip(WI.UIString("Exception with thrown value: %s"), data.description);
            if (!this._updatePauseReasonForBreakpoint(breakpoint, titleElement)) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.FunctionCall: {
            console.assert(pauseData, "Expected data with an event listener, but found none.");
            if (!pauseData)
                break;

            let symbolicBreakpoint = WI.debuggerManager.symbolicBreakpointsForSymbol(pauseData.name)[0];
            console.assert(symbolicBreakpoint, "Expected Symbolic breakpoint for function name.", pauseData.name);
            if (!symbolicBreakpoint)
                break;

            const format = WI.UIString("Calling Function \u201C%s\u201D", "Calling Function \u201C%s\u201D @ Sources Navigation Sidebar Panel", "Label shown when JavaScript execution is paused due to a symbolic breakpoint.");
            let titleElement = this._createBreakpointPauseReasonTitleWithTooltip(format, pauseData.name);
            if (!this._updatePauseReasonForBreakpoint(symbolicBreakpoint, titleElement)) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.Interval:
            if (!this._updatePauseReasonForBreakpoint(WI.debuggerManager.allIntervalsBreakpoint, WI.UIString("setInterval Fired"))) {
                console.assert(false, "not reached");
                break;
            }
            return true;

        case WI.DebuggerManager.PauseReason.Microtask:
            if (!this._updatePauseReasonForBreakpoint(WI.debuggerManager.allMicrotasksBreakpoint, WI.UIString("Microtask Fired"))) {
                console.assert(false, "not reached");
                break;
            }
            return true;

        case WI.DebuggerManager.PauseReason.PauseOnNextStatement:
            this._pauseReasonTextRow.text = WI.UIString("Immediate Pause Requested");
            this._pauseReasonGroup.rows = [this._pauseReasonTextRow];
            return true;

        case WI.DebuggerManager.PauseReason.Timer: {
            console.assert(pauseData, "Expected data with a timer, but found none.");
            if (!pauseData)
                break;

            switch (pauseData.eventName) {
            case "setTimeout":
                if (!this._updatePauseReasonForBreakpoint(WI.domDebuggerManager.allTimeoutsBreakpoint, WI.UIString("setTimeout Fired")))
                    break;
                return true;

            case "setInterval":
                if (!this._updatePauseReasonForBreakpoint(WI.domDebuggerManager.allIntervalsBreakpoint, WI.UIString("setInterval Fired")))
                    break;
                return true;
            }

            console.assert(false, "not reached");
            break;
        }

        case WI.DebuggerManager.PauseReason.Timeout:
            this._updatePauseReasonForBreakpoint(WI.domDebuggerManager.allTimeoutsBreakpoint, WI.UIString("setTimeout Fired"));
            return true;

        case WI.DebuggerManager.PauseReason.URL: {
            console.assert(WI.domDebuggerManager.supported);
            console.assert(pauseData, "Expected URL breakpoint data, but found none.");
            if (!pauseData)
                break;

            let urlBreakpoint = null;
            if (pauseData.breakpointURL)
                urlBreakpoint = WI.domDebuggerManager.urlBreakpointForURL(pauseData.breakpointURL);
            else {
                console.assert(pauseData.breakpointURL === "", "Should be the All Requests breakpoint which has an empty URL");
                urlBreakpoint = WI.domDebuggerManager.allRequestsBreakpoint;
            }
            console.assert(urlBreakpoint, pauseData.breakpointURL);
            if (!urlBreakpoint)
                break;

            let titleElement = this._createBreakpointPauseReasonTitleWithTooltip(WI.UIString("Requesting \u201C%s\u201D"), pauseData.url);
            if (!this._updatePauseReasonForBreakpoint(urlBreakpoint, titleElement)) {
                console.assert(false, "not reached");
                break;
            }
            return true;
        }

        case WI.DebuggerManager.PauseReason.Other:
            console.error("Paused for unknown reason. We should always have a reason.");
            break;
        }

        return false;
    }

    _updatePauseReasonForBreakpoint(breakpoint, title)
    {
        let Constructor = null;
        if (breakpoint instanceof WI.JavaScriptBreakpoint)
            Constructor = WI.JavaScriptBreakpointTreeElement;
        else if (breakpoint instanceof WI.DOMBreakpoint)
            Constructor = WI.DOMBreakpointTreeElement;
        else if (breakpoint instanceof WI.EventBreakpoint)
            Constructor = WI.EventBreakpointTreeElement;
        else if (breakpoint instanceof WI.URLBreakpoint)
            Constructor = WI.URLBreakpointTreeElement;
        else if (breakpoint instanceof WI.SymbolicBreakpoint)
            Constructor = WI.SymbolicBreakpointTreeElement;
        console.assert(Constructor);
        if (!Constructor)
            return false;

        this._pauseReasonTreeOutline = this.createContentTreeOutline({suppressFiltering: true});
        this._pauseReasonTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleTreeSelectionDidChange, this);

        let breakpointTreeElement = new Constructor(breakpoint, {
            classNames: ["paused"],
            title,
        })
        this._pauseReasonTreeOutline.appendChild(breakpointTreeElement);

        let breakpointRow = new WI.DetailsSectionRow;
        breakpointRow.element.appendChild(this._pauseReasonTreeOutline.element);

        this._pauseReasonGroup.rows = [breakpointRow];

        return true;
    }

    _createBreakpointPauseReasonTitleWithTooltip(format, title)
    {
        let titleElement = document.createElement("span");
        titleElement.textContent = format.format(title);
        titleElement.title = title;
        return titleElement;
    }

    _handleResourceGroupingModeScopeBarSelectionChanged(event)
    {
        console.assert(this._resourceGroupingModeScopeBar.selectedItems.length === 1);
        let selectedScopeBarItem = this._resourceGroupingModeScopeBar.selectedItems[0];
        WI.settings.resourceGroupingMode.value = selectedScopeBarItem[SourcesNavigationSidebarPanel.ResourceGroupingModeSymbol] || WI.Resource.GroupingMode.Type;
    }

    _handleResourceTypeScopeBarSelectionChanged(event)
    {
        this.updateFilter();
    }

    _handleTreeSelectionDidChange(event)
    {
        if (!this.selected)
            return;

        let treeElement = event.target.selectedTreeElement;
        if (!treeElement)
            return;

        if (treeElement instanceof WI.DOMNodeTreeElement
            || treeElement instanceof WI.DOMBreakpointTreeElement
            || treeElement instanceof WI.EventBreakpointTreeElement
            || treeElement instanceof WI.URLBreakpointTreeElement
            || treeElement instanceof WI.SymbolicBreakpointTreeElement)
            return;

        if (treeElement.representedObject === SourcesNavigationSidebarPanel.__windowEventTargetRepresentedObject)
            return;

        if (treeElement instanceof WI.LocalResourceOverrideTreeElement) {
            WI.showRepresentedObject(treeElement.representedObject);
            return;
        }

        // Silently select the corresponding tree element in the resources tree outline to update
        // the hierarchical path components to show the right ancestor(s).
        let selectTreeElementInResourcesTreeOutline = (sourceCode) => {
            let resourceTreeElement = this._resourcesTreeOutline.findTreeElement(sourceCode);
            if (!resourceTreeElement)
                return;

            const omitFocus = true;
            const selectedByUser = false;
            const suppressNotification = true;
            resourceTreeElement.select(omitFocus, selectedByUser, suppressNotification);
        };

        if (treeElement instanceof WI.FolderTreeElement
            || treeElement instanceof WI.OriginTreeElement
            || treeElement instanceof WI.ResourceTreeElement
            || treeElement instanceof WI.ScriptTreeElement
            || treeElement instanceof WI.CSSStyleSheetTreeElement) {
            let representedObject = treeElement.representedObject;

            if (representedObject instanceof WI.Script && representedObject.resource && representedObject.target.mainResource !== representedObject)
                representedObject = representedObject.resource;

            if (treeElement.treeOutline !== this._resourcesTreeOutline)
                selectTreeElementInResourcesTreeOutline(representedObject);

            if (representedObject instanceof WI.Collection || representedObject instanceof WI.SourceCode || representedObject instanceof WI.Frame)
                WI.showRepresentedObject(representedObject);
            return;
        }

        if (treeElement instanceof WI.CallFrameTreeElement) {
            let callFrame = treeElement.callFrame;
            if (callFrame.id)
                WI.debuggerManager.activeCallFrame = callFrame;
            if (callFrame.sourceCodeLocation)
                WI.showSourceCodeLocation(callFrame.sourceCodeLocation);
            return;
        }

        if (treeElement instanceof WI.IssueTreeElement) {
            WI.showSourceCodeLocation(treeElement.issueMessage.sourceCodeLocation);
            return;
        }

        if (treeElement instanceof WI.JavaScriptBreakpointTreeElement) {
            let breakpoint = treeElement.breakpoint;
            if (breakpoint.special)
                return;

            let sourceCode = breakpoint.sourceCodeLocation.displaySourceCode;
            if (sourceCode instanceof WI.Script && sourceCode.resource)
                sourceCode = sourceCode.resource;
            selectTreeElementInResourcesTreeOutline(sourceCode);

            WI.showSourceCodeLocation(breakpoint.sourceCodeLocation);
            return;
        }

        if (treeElement instanceof WI.BlackboxedGroupTreeElement)
            return;

        console.error("Unknown tree element", treeElement);
    }

    _handleBreakpointTreeOutlineElementRemoved(event)
    {
        let selectedTreeElement = this._breakpointsTreeOutline.selectedTreeElement;
        if (!selectedTreeElement)
            return;

        // Select the next removable breakpoint instead of a non-removable breakpoint.
        if (selectedTreeElement.representedObject instanceof WI.Breakpoint && !selectedTreeElement.representedObject.removable) {
            const skipUnrevealed = true;
            const stayWithin = null;
            const dontPopulate = true;
            let treeElementToSelect = selectedTreeElement.traverseNextTreeElement(skipUnrevealed, stayWithin, dontPopulate);
            if (treeElementToSelect) {
                const omitFocus = true;
                const selectedByUser = true;
                treeElementToSelect.select(omitFocus, selectedByUser);
            }
        }
    }

    _populateCreateBreakpointContextMenu(contextMenu)
    {
        function addToggleForSpecialBreakpoint(label, breakpoint, callback) {
            contextMenu.appendCheckboxItem(label, () => {
                if (breakpoint)
                    breakpoint.remove();
                else
                    callback();
            }, !!breakpoint);
        }

        if (WI.SymbolicBreakpoint.supported()) {
            contextMenu.appendItem(WI.UIString("Symbolic Breakpoint\u2026", "Symbolic Breakpoint\u2026 @ Sources Navigation Sidebar Panel", "Context menu item for creating a new symbolic breakpoint."), () => {
                let popover = new WI.SymbolicBreakpointPopover(this);
                popover.show(this._createBreakpointButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            });

            contextMenu.appendSeparator();
        }

        addToggleForSpecialBreakpoint(WI.repeatedUIString.assertionFailures(), WI.debuggerManager.assertionFailuresBreakpoint, () => {
            WI.debuggerManager.createAssertionFailuresBreakpoint();
        });

        contextMenu.appendSeparator();

        if (WI.JavaScriptBreakpoint.supportsMicrotasks()) {
            addToggleForSpecialBreakpoint(WI.repeatedUIString.allMicrotasks(), WI.debuggerManager.allMicrotasksBreakpoint, () => {
                WI.debuggerManager.createAllMicrotasksBreakpoint();
            });
        }

        if (WI.DOMDebuggerManager.supportsEventBreakpoints() || WI.DOMDebuggerManager.supportsEventListenerBreakpoints()) {
            addToggleForSpecialBreakpoint(WI.repeatedUIString.allAnimationFrames(), WI.domDebuggerManager.allAnimationFramesBreakpoint, () => {
                WI.domDebuggerManager.addEventBreakpoint(new WI.EventBreakpoint(WI.EventBreakpoint.Type.AnimationFrame));
            });
            addToggleForSpecialBreakpoint(WI.repeatedUIString.allTimeouts(), WI.domDebuggerManager.allTimeoutsBreakpoint, () => {
                WI.domDebuggerManager.addEventBreakpoint(new WI.EventBreakpoint(WI.EventBreakpoint.Type.Timeout));
            });
            addToggleForSpecialBreakpoint(WI.repeatedUIString.allIntervals(), WI.domDebuggerManager.allIntervalsBreakpoint, () => {
                WI.domDebuggerManager.addEventBreakpoint(new WI.EventBreakpoint(WI.EventBreakpoint.Type.Interval));
            });

            contextMenu.appendSeparator();

            if (WI.DOMDebuggerManager.supportsAllListenersBreakpoint())
                addToggleForSpecialBreakpoint(WI.repeatedUIString.allEvents(), WI.domDebuggerManager.allListenersBreakpoint, () => {
                    WI.domDebuggerManager.addEventBreakpoint(new WI.EventBreakpoint(WI.EventBreakpoint.Type.Listener));
                });

            contextMenu.appendItem(WI.UIString("Event Breakpoint\u2026"), () => {
                let popover = new WI.EventBreakpointPopover(this);
                popover.show(this._createBreakpointButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            });
        }

        if (WI.DOMDebuggerManager.supportsURLBreakpoints() || WI.DOMDebuggerManager.supportsXHRBreakpoints()) {
            contextMenu.appendSeparator();

            addToggleForSpecialBreakpoint(WI.repeatedUIString.allRequests(), WI.domDebuggerManager.allRequestsBreakpoint, () => {
                const url = "";
                WI.domDebuggerManager.addURLBreakpoint(new WI.URLBreakpoint(WI.URLBreakpoint.Type.Text, url));
            });

            contextMenu.appendItem(WI.DOMDebuggerManager.supportsURLBreakpoints() ? WI.UIString("URL Breakpoint\u2026") : WI.UIString("XHR Breakpoint\u2026"), () => {
                let popover = new WI.URLBreakpointPopover(this);
                popover.show(this._createBreakpointButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            });
        }
    }

    _populateCreateLocalOverrideContextMenu(contextMenu)
    {
        if (WI.NetworkManager.supportsOverridingResponses()) {
            contextMenu.appendItem(WI.UIString("Local Override\u2026"), () => {
                let popover = new WI.LocalResourceOverridePopover(this);
                popover.show(null, this._createLocalOverrideButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            });
        }

        if (WI.NetworkManager.supportsBootstrapScript()) {
            contextMenu.appendItem(WI.UIString("Inspector Bootstrap Script"), async () => {
                await WI.networkManager.createBootstrapScript();
                WI.networkManager.bootstrapScriptEnabled = true;
                WI.showRepresentedObject(WI.networkManager.bootstrapScript);
            });
        }
    }

    _handleCreateConsoleSnippetButtonClicked(event)
    {
        let popover = new WI.InputPopover("create-snippet-popover", WI.UIString("Name"), this);
        popover.show(this._createConsoleSnippetButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
    }

    _populateCreateResourceContextMenu(contextMenu)
    {
        if (WI.NetworkManager.supportsOverridingResponses()) {
            contextMenu.appendItem(WI.UIString("Local Override\u2026"), () => {
                if (!this._localOverridesTreeOutline.children.length)
                    this._localOverridesRow.showEmptyMessage();

                this._localOverridesContainer.hidden = false;

                this._createLocalOverrideButton.element.scrollIntoViewIfNeeded(false);
                requestAnimationFrame(() => {
                    let popover = new WI.LocalResourceOverridePopover(this);
                    popover.show(null, this._createLocalOverrideButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
                });
            });
        }

        contextMenu.appendItem(WI.UIString("Console Snippet\u2026"), () => {
            if (!this._consoleSnippetsTreeOutline.children.length)
                this._consoleSnippetsRow.showEmptyMessage();

            this._consoleSnippetsContainer.hidden = false;

            this._createConsoleSnippetButton.element.scrollIntoViewIfNeeded(false);
            requestAnimationFrame(() => {
                let popover = new WI.InputPopover("create-snippet-popover", WI.UIString("Name"), this);
                popover.show(this._createConsoleSnippetButton.element, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            });
        });

        if (WI.NetworkManager.supportsBootstrapScript()) {
            contextMenu.appendItem(WI.UIString("Inspector Bootstrap Script"), async () => {
                await WI.networkManager.createBootstrapScript();
                WI.networkManager.bootstrapScriptEnabled = true;
                WI.showRepresentedObject(WI.networkManager.bootstrapScript);
            });
        }

        if (WI.CSSManager.supportsInspectorStyleSheet()) {
            let addInspectorStyleSheetItem = (menu, frame) => {
                menu.appendItem(WI.UIString("Inspector Style Sheet"), () => {
                    if (WI.settings.resourceGroupingMode.value === WI.Resource.GroupingMode.Path) {
                        // Force the parent to populate.
                        let parentFrameTreeElement = this._resourcesTreeOutline.findTreeElement(frame.mainResource);
                        parentFrameTreeElement.reveal();
                        parentFrameTreeElement.expand();
                    }

                    WI.cssManager.preferredInspectorStyleSheetForFrame(frame, (styleSheet) => {
                        WI.showRepresentedObject(styleSheet);
                    });
                });
            };

            addInspectorStyleSheetItem(contextMenu, WI.networkManager.mainFrame);

            let frames = WI.networkManager.frames;
            if (frames.length > 2) {
                let framesSubMenu = contextMenu.appendSubMenuItem(WI.UIString("Frames"));

                for (let frame of frames) {
                    if (frame === WI.networkManager.mainFrame || frame.mainResource.type !== WI.Resource.Type.Document)
                        continue;

                    let frameSubMenuItem = framesSubMenu.appendSubMenuItem(frame.name ? WI.UIString("%s (%s)").format(frame.name, frame.mainResource.displayName) : frame.mainResource.displayName);

                    addInspectorStyleSheetItem(frameSubMenuItem, frame);
                }
            }
        }
    }

    _handleResourceGroupingModeChanged(event)
    {
        this._workerTargetTreeElementMap.clear();
        this._mainFrameTreeElement = null;
        this._extensionScriptsFolderTreeElement = null;
        this._extensionStyleSheetsFolderTreeElement = null;
        this._extraScriptsFolderTreeElement = null;
        this._extraStyleSheetsFolderTreeElement = null;
        this._anonymousScriptsFolderTreeElement = null;
        this._anonymousStyleSheetsFolderTreeElement = null;

        this._originTreeElementMap.clear();

        let resourceGroupingModeScopeBarItem = this._resourceGroupingModeScopeBarItems[WI.settings.resourceGroupingMode.value];
        console.assert(resourceGroupingModeScopeBarItem);
        if (resourceGroupingModeScopeBarItem)
            resourceGroupingModeScopeBarItem.selected = true;

        this._resourcesTreeOutline.removeChildren();

        let mainFrame = WI.networkManager.mainFrame;
        if (mainFrame) {
            this._updateMainFrameTreeElement(mainFrame);
            this._addResourcesRecursivelyForFrame(mainFrame);

            for (let frame of WI.networkManager.frames) {
                if (frame !== mainFrame)
                    this._addResourcesRecursivelyForFrame(frame);
            }
        }

        for (let target of WI.targets) {
            if (target.type === WI.TargetType.Worker && target.mainResource) {
                this._addWorkerTargetWithMainResource(target);
                this._addBreakpointsForSourceCode(target.mainResource);
                this._addIssuesForSourceCode(target.mainResource);
            }
        }

        for (let script of WI.debuggerManager.knownNonResourceScripts) {
            this._addScript(script);

            if (script.sourceMaps.length && WI.SourcesNavigationSidebarPanel.shouldPlaceResourcesAtTopLevel())
                this._resourcesTreeOutline.disclosureButtons = true;
        }

        for (let styleSheet of WI.cssManager.styleSheets) {
            if (styleSheet.origin !== WI.CSSStyleSheet.Type.Author && !styleSheet.isInspectorStyleSheet())
                this._addStyleSheet(styleSheet);
        }
    }

    _handleFrameMainResourceDidChange(event)
    {
        let frame = event.target;
        if (frame.isMainFrame()) {
            this._updateMainFrameTreeElement(frame);
            this._addResourcesRecursivelyForFrame(frame);

            for (let domBreakpoint of WI.domDebuggerManager.domBreakpoints)
                this._removeBreakpoint(domBreakpoint);
        }

        if (!event.data.oldMainResource) {
            let resource = event.target.mainResource;
            this._addBreakpointsForSourceCode(resource);
            this._addIssuesForSourceCode(resource);
        }
    }

    _handleResourceAdded(event)
    {
        this._addResource(event.data.resource);
    }

    _handleFrameWasAdded(event)
    {
        let {frame} = event.data;

        if (frame.isMainFrame())
            this._updateMainFrameTreeElement(frame);

        this._addResourcesRecursivelyForFrame(frame);
    }

    _handleBootstrapScriptCreated(event)
    {
        this._addLocalOverride(event.data.bootstrapScript);
    }

    _handleBootstrapScriptDestroyed(event)
    {
        this._removeResourceOverride(event.data.bootstrapScript);
    }

    _handleLocalResourceOverrideAdded(event)
    {
        this._addLocalOverride(event.data.localResourceOverride);
    }

    _handleLocalResourceOverrideRemoved(event)
    {
        this._removeResourceOverride(event.data.localResourceOverride);
    }

    _handleDebuggerBreakpointAdded(event)
    {
        this._addBreakpoint(event.data.breakpoint);
    }

    _handleDebuggerBreakpointRemoved(event)
    {
        this._removeBreakpoint(event.data.breakpoint);
    }

    _handleDebuggerBreakpointsEnabledDidChange(event)
    {
        this._debuggerBreakpointsButtonItem.activated = WI.debuggerManager.breakpointsEnabled;

        this._updateBreakpointsDisabledBanner();
    }

    _handleDebuggerScriptAdded(event)
    {
        this._addScript(event.data.script);
    }

    _handleDebuggerScriptRemoved(event)
    {
        let script = event.data.script;
        let scriptTreeElement = this._resourcesTreeOutline.findTreeElement(script);
        if (!scriptTreeElement)
            return;

        let parentTreeElement = scriptTreeElement.parent;
        parentTreeElement.removeChild(scriptTreeElement);

        if (parentTreeElement instanceof WI.FolderTreeElement || parentTreeElement instanceof WI.OriginTreeElement) {
            parentTreeElement.representedObject.remove(script);

            if (!parentTreeElement.children.length)
                parentTreeElement.parent.removeChild(parentTreeElement);
        }
    }

    _handleDebuggerScriptsCleared(event)
    {
        const suppressOnDeselect = true;
        const suppressSelectSibling = true;

        for (let i = this._breakpointsTreeOutline.children.length - 1; i >= 0; --i) {
            let treeElement = this._breakpointsTreeOutline.children[i];
            if (!(treeElement instanceof WI.ScriptTreeElement))
                continue;

            this._breakpointsTreeOutline.removeChild(treeElement, suppressOnDeselect, suppressSelectSibling);
        }

        if (this._extensionScriptsFolderTreeElement) {
            if (this._extensionScriptsFolderTreeElement.parent)
                this._extensionScriptsFolderTreeElement.parent.removeChild(this._extensionScriptsFolderTreeElement, suppressOnDeselect, suppressSelectSibling);

            this._extensionScriptsFolderTreeElement.representedObject.clear();
            this._extensionScriptsFolderTreeElement = null;
        }

        if (this._extraScriptsFolderTreeElement) {
            if (this._extraScriptsFolderTreeElement.parent)
                this._extraScriptsFolderTreeElement.parent.removeChild(this._extraScriptsFolderTreeElement, suppressOnDeselect, suppressSelectSibling);

            this._extraScriptsFolderTreeElement.representedObject.clear();
            this._extraScriptsFolderTreeElement = null;
        }

        if (this._anonymousScriptsFolderTreeElement) {
            if (this._anonymousScriptsFolderTreeElement.parent)
                this._anonymousScriptsFolderTreeElement.parent.removeChild(this._anonymousScriptsFolderTreeElement, suppressOnDeselect, suppressSelectSibling);

            this._anonymousScriptsFolderTreeElement.representedObject.clear();
            this._anonymousScriptsFolderTreeElement = null;
        }

        if (this._workerTargetTreeElementMap.size) {
            for (let treeElement of this._workerTargetTreeElementMap.values())
                treeElement.parent.removeChild(treeElement, suppressOnDeselect, suppressSelectSibling);
            this._workerTargetTreeElementMap.clear();
        }

        this._addResourcesRecursivelyForFrame(WI.networkManager.mainFrame);
    }

    _handleDebuggerPaused(event)
    {
        this._callStackContainer.hidden = false;

        if (this._updatePauseReason())
            this._pauseReasonContainer.hidden = false;

        this._debuggerPauseResumeButtonItem.enabled = true;
        this._debuggerPauseResumeButtonItem.toggled = true;
        this._debuggerStepOverButtonItem.enabled = true;
        this._debuggerStepIntoButtonItem.enabled = true;
        this._debuggerStepOutButtonItem.enabled = true;
        if (this._debuggerStepNextButtonItem)
            this._debuggerStepNextButtonItem.enabled = true;

        this.element.classList.add("paused");
    }

    _handleDebuggerResumed(event)
    {
        this._callStackContainer.hidden = true;

        this._pauseReasonContainer.hidden = true;

        this._debuggerPauseResumeButtonItem.enabled = true;
        this._debuggerPauseResumeButtonItem.toggled = false;
        this._debuggerStepOverButtonItem.enabled = false;
        this._debuggerStepIntoButtonItem.enabled = false;
        this._debuggerStepOutButtonItem.enabled = false;
        if (this._debuggerStepNextButtonItem)
            this._debuggerStepNextButtonItem.enabled = false;

        this.element.classList.remove("paused");
    }

    _handleDebuggerCallFramesDidChange(event)
    {
        let {target} = event.data;
        let treeElement = this._findCallStackTargetTreeElement(target);
        console.assert(treeElement);
        if (treeElement)
            treeElement.refresh();

        let activeCallFrameTreeElement = this._callStackTreeOutline.findTreeElement(WI.debuggerManager.activeCallFrame);
        if (activeCallFrameTreeElement)
            activeCallFrameTreeElement.reveal();
    }

    _handleDebuggerActiveCallFrameDidChange(event)
    {
        if (this._activeCallFrameTreeElement) {
            this._activeCallFrameTreeElement.isActiveCallFrame = false;
            this._activeCallFrameTreeElement = null;
        }

        if (!WI.debuggerManager.activeCallFrame)
            return;

        this._activeCallFrameTreeElement = this._callStackTreeOutline.findTreeElement(WI.debuggerManager.activeCallFrame);
        if (this._activeCallFrameTreeElement)
            this._activeCallFrameTreeElement.isActiveCallFrame = true;
    }

    _handleDebuggerWaitingToPause(event)
    {
        this._debuggerPauseResumeButtonItem.enabled = false;
    }

    _handleDebuggerObjectDisplayLocationDidChange(event)
    {
        let debuggerObject = event.target;

        if (event.data.oldDisplaySourceCode === debuggerObject.sourceCodeLocation.displaySourceCode)
            return;

        // A known debugger object (breakpoint, issueMessage, etc.) moved between resources. Remove
        // the old tree element and create a new tree element with the updated file.

        let wasSelected = false;
        let oldDebuggerTreeElement = null;
        let newDebuggerTreeElement = null;
        if (debuggerObject instanceof WI.JavaScriptBreakpoint) {
            oldDebuggerTreeElement = this._breakpointsTreeOutline.findTreeElement(debuggerObject);
            if (!oldDebuggerTreeElement)
                return;

            wasSelected = oldDebuggerTreeElement.selected;

            newDebuggerTreeElement = this._addBreakpoint(debuggerObject);
        } else if (debuggerObject instanceof WI.IssueMessage) {
            oldDebuggerTreeElement = this._resourcesTreeOutline.findTreeElement(debuggerObject);
            if (!oldDebuggerTreeElement)
                return;

            wasSelected = oldDebuggerTreeElement.selected;

            newDebuggerTreeElement = this._addIssue(debuggerObject);
        }

        if (!newDebuggerTreeElement)
            return;

        if (oldDebuggerTreeElement)
            this._removeDebuggerTreeElement(oldDebuggerTreeElement);

        if (wasSelected)
            newDebuggerTreeElement.revealAndSelect(true, false, true);
    }

    _handleDOMBreakpointDOMNodeWillChange(event)
    {
        let breakpoint = event.target;
        this._removeBreakpoint(breakpoint);
    }

    _handleDOMBreakpointDOMNodeDidChange(event)
    {
        let breakpoint = event.target;
        this._addBreakpoint(breakpoint);
    }

    _handleConsoleIssueAdded(event)
    {
        let {issue} = event.data;

        // We only want to show issues originating from JavaScript source code.
        if (!issue.sourceCodeLocation || !issue.sourceCodeLocation.sourceCode || (issue.source !== "javascript" && issue.source !== "console-api"))
            return;

        this._addIssue(issue);
    }

    _handleConsoleCleared(event)
    {
        let issueTreeElements = [];
        let currentTreeElement = this._resourcesTreeOutline.children[0];
        while (currentTreeElement && !currentTreeElement.root) {
            if (currentTreeElement instanceof WI.IssueTreeElement)
                issueTreeElements.push(currentTreeElement);

            const skipUnrevealed = false;
            const stayWithin = null;
            const dontPopulate = true;
            currentTreeElement = currentTreeElement.traverseNextTreeElement(skipUnrevealed, stayWithin, dontPopulate);
        }

        issueTreeElements.forEach((treeElement) => treeElement.parent.removeChild(treeElement));
    }

    _handleConsoleSnippetAdded(event)
    {
        this._addConsoleSnippet(event.data.snippet);
    }

    _handleConsoleSnippetRemoved(event)
    {
        this._removeConsoleSnippet(event.data.snippet);
    }

    _handleTimelineCapturingStateChanged(event)
    {
        this._updateTemporarilyDisabledBreakpointsButtons();

        switch (WI.timelineManager.capturingState) {
        case WI.TimelineManager.CapturingState.Starting:
            if (!this._timelineRecordingWarningElement) {
                let stopRecordingButton = document.createElement("button");
                stopRecordingButton.textContent = WI.UIString("Stop recording");
                stopRecordingButton.addEventListener("click", () => {
                    WI.timelineManager.stopCapturing();
                });

                this._timelineRecordingWarningElement = document.createElement("div");
                this._timelineRecordingWarningElement.classList.add("warning-banner");
                this._timelineRecordingWarningElement.append(WI.UIString("Debugger disabled during Timeline recording"), document.createElement("br"), stopRecordingButton);
            }

            this.contentView.element.insertBefore(this._timelineRecordingWarningElement, this.contentView.element.firstChild);
            break;

        case WI.TimelineManager.CapturingState.Inactive:
            if (this._timelineRecordingWarningElement) {
                this._timelineRecordingWarningElement.remove();
                this._timelineRecordingWarningElement = null;
            }
            break;
        }

        this._updateBreakpointsDisabledBanner();
    }

    _handleAuditManagerTestScheduled(event)
    {
        this._updateTemporarilyDisabledBreakpointsButtons();

        if (!this._auditTestWarningElement) {
            let stopAuditButton = document.createElement("button");
            stopAuditButton.textContent = WI.UIString("Stop Audit");
            stopAuditButton.addEventListener("click", (event) => {
                WI.auditManager.stop();
            });

            this._auditTestWarningElement = document.createElement("div");
            this._auditTestWarningElement.classList.add("warning-banner");
            this._auditTestWarningElement.append(WI.UIString("Debugger disabled during Audit"), document.createElement("br"), stopAuditButton);
        }

        this.contentView.element.insertBefore(this._auditTestWarningElement, this.contentView.element.firstChild);

        this._updateBreakpointsDisabledBanner();
    }

    _handleAuditManagerTestCompleted(event)
    {
        this._updateTemporarilyDisabledBreakpointsButtons();

        if (this._auditTestWarningElement) {
            this._auditTestWarningElement.remove();
            this._auditTestWarningElement = null;
        }

        this._updateBreakpointsDisabledBanner();
    }

    _handleCSSStyleSheetAdded(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author)
            return;

        if (styleSheet.isInspectorStyleSheet()) {
            if (WI.settings.resourceGroupingMode.value === WI.Resource.GroupingMode.Type) {
                let frameTreeElement = this.treeElementForRepresentedObject(styleSheet.parentFrame);
                if (frameTreeElement) {
                    frameTreeElement.addRepresentedObjectToNewChildQueue(styleSheet);
                    return;
                }
            }

            this._addResource(styleSheet);
        } else
            this._addStyleSheet(styleSheet);
    }

    _handleCSSStyleSheetRemoved(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author)
            return;

        let treeElement = this._resourcesTreeOutline.findTreeElement(styleSheet);
        if (!treeElement)
            return;

        let parent = treeElement.parent;
        treeElement.parent.removeChild(treeElement);

        if (!parent.children.length)
            parent.parent.removeChild(parent);

        switch (parent) {
        case this._extensionStyleSheetsFolderTreeElement:
            this._extensionStyleSheetsFolderTreeElement = null;
            break;

        case this._extraStyleSheetsFolderTreeElement:
            this._extraStyleSheetsFolderTreeElement = null;
            break;

        case this._anonymousStyleSheetsFolderTreeElement:
            this._anonymousStyleSheetsFolderTreeElement = null;
            break;
        }
    }

    _handleTargetAdded(event)
    {
        this._addTarget(event.data.target);
    }

    _handleTargetRemoved(event)
    {
        let {target} = event.data;

        let workerTreeElement = this._workerTargetTreeElementMap.take(target);
        if (workerTreeElement)
            workerTreeElement.parent.removeChild(workerTreeElement);

        let callStackTreeElement = this._findCallStackTargetTreeElement(target);
        console.assert(callStackTreeElement);
        if (callStackTreeElement)
            this._callStackTreeOutline.removeChild(callStackTreeElement);

        this._updateCallStackTreeOutline();
    }

    _handleExtraDomainsActivated()
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        if (WI.SourcesNavigationSidebarPanel.shouldPlaceResourcesAtTopLevel())
            this._resourcesTreeOutline.disclosureButtons = true;
    }
};

WI.SourcesNavigationSidebarPanel.ResourceTypeSymbol = Symbol("resource-type");
WI.SourcesNavigationSidebarPanel.ResourceGroupingModeSymbol = Symbol("resource-grouping-mode");
