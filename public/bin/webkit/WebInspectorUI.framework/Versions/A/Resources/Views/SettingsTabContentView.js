/*
 * Copyright (C) 2015-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2016 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.SettingsTabContentView = class SettingsTabContentView extends WI.TabContentView
{
    constructor()
    {
        super(SettingsTabContentView.tabInfo());

        this._selectedSettingsView = null;
        this._settingsViews = [];
    }

    static tabInfo()
    {
        return {
            identifier: SettingsTabContentView.Type,
            image: "Images/Gear.svg",
            displayName: WI.UIString("Settings", "Settings Tab Name", "Name of Settings Tab"),
            title: WI.UIString("Settings (%s)", "Settings Tab Title", "Title of Settings Tab with keyboard shortcut").format(WI.settingsKeyboardShortcut.displayName),
        };
    }

    static shouldPinTab()
    {
        return true;
    }

    static shouldSaveTab()
    {
        return false;
    }

    // Public

    get type() { return WI.SettingsTabContentView.Type; }

    get supportsSplitContentBrowser()
    {
        return false;
    }

    get selectedSettingsView()
    {
        return this._selectedSettingsView;
    }

    set selectedSettingsView(settingsView)
    {
        if (this._selectedSettingsView === settingsView)
            return;

        if (this._selectedSettingsView)
            this.replaceSubview(this._selectedSettingsView, settingsView);
        else
            this.addSubview(settingsView);

        this._selectedSettingsView = settingsView;
        this._selectedSettingsView.updateLayout();

        let navigationItem = this._navigationBar.findNavigationItem(settingsView.identifier);
        console.assert(navigationItem, "Missing navigation item for settings view.", settingsView);
        if (!navigationItem)
            return;

        this._navigationBar.selectedNavigationItem = navigationItem;
    }

    addSettingsView(settingsView)
    {
        if (this._settingsViews.includes(settingsView)) {
            console.assert(false, "SettingsView already exists.", settingsView);
            return;
        }

        this._settingsViews.push(settingsView);
        this._navigationBar.addNavigationItem(new WI.RadioButtonNavigationItem(settingsView.identifier, settingsView.displayName));

        this._updateNavigationBarVisibility();
    }

    setSettingsViewVisible(settingsView, visible)
    {
        let navigationItem = this._navigationBar.findNavigationItem(settingsView.identifier);
        console.assert(navigationItem, "Missing NavigationItem for identifier: " + settingsView.identifier);
        if (!navigationItem)
            return;

        if (navigationItem.hidden === !visible)
            return;

        navigationItem.hidden = !visible;
        settingsView.element.classList.toggle("hidden", !visible);

        this._updateNavigationBarVisibility();

        if (!this.selectedSettingsView) {
            if (visible)
                this.selectedSettingsView = settingsView;
            return;
        }

        if (this.selectedSettingsView !== settingsView)
            return;

        let index = this._settingsViews.indexOf(settingsView);
        console.assert(index !== -1, "SettingsView not found.", settingsView);
        if (index === -1)
            return;

        let previousIndex = index;
        while (--previousIndex >= 0) {
            let previousNavigationItem = this._navigationBar.navigationItems[previousIndex];
            console.assert(previousNavigationItem);
            if (!previousNavigationItem || previousNavigationItem.hidden)
                continue;

            this.selectedSettingsView = this._settingsViews[previousIndex];
            return;
        }

        let nextIndex = index;
        while (++nextIndex < this._settingsViews.length) {
            let nextNavigationItem = this._navigationBar.navigationItems[nextIndex];
            console.assert(nextNavigationItem);
            if (!nextNavigationItem || nextNavigationItem.hidden)
                continue;

            this.selectedSettingsView = this._settingsViews[nextIndex];
            return;
        }
    }

    selectBlackboxPattern(regex)
    {
        console.assert(regex instanceof RegExp);

        console.assert(this._blackboxSettingsView);
        this.selectedSettingsView = this._blackboxSettingsView;

        this._blackboxSettingsView.selectBlackboxPattern(regex);
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._navigationBar = new WI.NavigationBar;
        this._navigationBar.addEventListener(WI.NavigationBar.Event.NavigationItemSelected, this._navigationItemSelected, this);
        this.addSubview(this._navigationBar);

        this._createGeneralSettingsView();
        this._createElementsSettingsView();
        this._createSourcesSettingsView();
        this._createConsoleSettingsView();

        if (WI.DebuggerManager.supportsBlackboxingScripts()) {
            this._blackboxSettingsView = new WI.BlackboxSettingsView;
            this._createReferenceLink(this._blackboxSettingsView);
            this.addSettingsView(this._blackboxSettingsView);
        }

        this._createExperimentalSettingsView();

        if (WI.engineeringSettingsAllowed())
            this._createEngineeringSettingsView();

        if (WI.isEngineeringBuild) {
            WI.showDebugUISetting.addEventListener(WI.Setting.Event.Changed, this._updateDebugSettingsViewVisibility, this);
            this._updateDebugSettingsViewVisibility();
        }

        this.selectedSettingsView = this._settingsViews[0];
    }

    // Private

    _createGeneralSettingsView()
    {
        let generalSettingsView = new WI.SettingsView("general", WI.UIString("General"));

        if (CSS.supports("color-scheme", "light") && CSS.supports("color-scheme", "dark")) {
            const appearanceValues = [
                ["system", WI.UIString("System", "System @ Settings General Appearance", "Label of dropdown item used for forcing Web Inspector to be shown using the system's theme")],
                [WI.SettingEditor.SelectSpacerKey, null],
                ["light", WI.UIString("Light", "Light @ Settings General Appearance", "Label of dropdown item used for forcing Web Inspector to be shown using a light theme")],
                ["dark", WI.UIString("Dark", "Dark @ Settings General Appearance", "Label of dropdown item used for forcing Web Inspector to be shown using a dark theme")],
            ];
            let appearanceEditor = generalSettingsView.addGroupWithCustomSetting(WI.UIString("Appearance:"), WI.SettingEditor.Type.Select, {values: appearanceValues});
            appearanceEditor.value = WI.settings.frontendAppearance.value;
            appearanceEditor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
                WI.settings.frontendAppearance.value = this.value;
            }, appearanceEditor);

            generalSettingsView.addSeparator();
        }

        const indentValues = [WI.UIString("Tabs"), WI.UIString("Spaces")];
        let indentEditor = generalSettingsView.addGroupWithCustomSetting(WI.UIString("Prefer indent using:"), WI.SettingEditor.Type.Select, {values: indentValues});
        indentEditor.value = indentValues[WI.settings.indentWithTabs.value ? 0 : 1];
        indentEditor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
            WI.settings.indentWithTabs.value = this.value === indentValues[0];
        }, indentEditor);

        function addSpacesSetting(title, setting) {
            let editor = generalSettingsView.addSetting(title, setting, WI.UIString("spaces"), {min: 1});

            function updateLabel() {
                editor.label = setting.value === 1 ? WI.UIString("space") : WI.UIString("spaces");
            }
            setting.addEventListener(WI.Setting.Event.Changed, function(event) {
                updateLabel();
            }, editor);
            updateLabel();
        }
        addSpacesSetting(WI.UIString("Tab width:"), WI.settings.tabSize);
        addSpacesSetting(WI.UIString("Indent width:"), WI.settings.indentUnit);

        generalSettingsView.addSetting(WI.UIString("Line wrapping:"), WI.settings.enableLineWrapping, WI.UIString("Wrap lines to editor width"));

        let showGroup = generalSettingsView.addGroup(WI.UIString("Show:"));
        showGroup.addSetting(WI.settings.showWhitespaceCharacters, WI.UIString("Whitespace characters"));
        showGroup.addSetting(WI.settings.showInvisibleCharacters, WI.UIString("Invisible characters"));

        generalSettingsView.addSeparator();

        let searchGroup = generalSettingsView.addGroup(WI.UIString("Search:", "Search: @ Settings", "Settings tab label for search related settings"));
        searchGroup.addSetting(WI.settings.searchCaseSensitive, WI.UIString("Case Sensitive", "Case Sensitive @ Settings", "Settings tab checkbox label for whether searches should be case sensitive."));
        searchGroup.addSetting(WI.settings.searchRegularExpression, WI.UIString("Regular Expression", "Regular Expression @ Settings", "Settings tab checkbox label for whether searches should be treated as regular expressions."));
        searchGroup.addSetting(WI.settings.searchFromSelection, WI.UIString("%s from selection", "Global Search From Selection @ Settings", "Settings tab checkbox label for whether the global search should populate from the current selection.").format(WI.searchKeyboardShortcut.displayName));

        generalSettingsView.addSeparator();
        
        generalSettingsView.addSetting(WI.UIString("Details Sidebars:", "Details Sidebars: @ Settings General Pane", "Category label for detail sidebar settings."), WI.settings.enableNarrowLayoutMode, WI.UIString("Show on bottom when narrow", "Show on bottom when narrow @ Settings General Pane", "Settings tab checkbox label for whether the details sidebars (on the right in LTR locales) are at the bottom"));
        
        generalSettingsView.addSeparator();
        
        const zoomLevels = [0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4];
        const zoomValues = zoomLevels.map((level) => [level, Number.percentageString(level, 0)]);

        let zoomEditor = generalSettingsView.addGroupWithCustomSetting(WI.UIString("Zoom:"), WI.SettingEditor.Type.Select, {values: zoomValues});
        zoomEditor.value = WI.getZoomFactor();
        zoomEditor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
            WI.setZoomFactor(this.value);
        }, zoomEditor);
        WI.settings.zoomFactor.addEventListener(WI.Setting.Event.Changed, function(event) {
            this.value = WI.getZoomFactor().maxDecimals(2);
        }, zoomEditor);

        this._createReferenceLink(generalSettingsView);

        this.addSettingsView(generalSettingsView);
    }

    _createElementsSettingsView()
    {
        if (!InspectorBackend.hasDomain("DOM"))
            return;

        let elementsSettingsView = new WI.SettingsView("elements", WI.UIString("Elements"));

        // COMPATIBILITY (macOS 13.0, iOS 16.0): CSS.LayoutFlag.Rendered did not exist yet.
        console.log(InspectorBackend.Enum.CSS);
        if (InspectorBackend.Enum.CSS?.LayoutFlag?.Rendered) {
            elementsSettingsView.addSetting(WI.UIString("DOM Tree:"), WI.settings.domTreeDeemphasizesNodesThatAreNotRendered, WI.UIString("De-emphasize nodes that are not rendered"));

            elementsSettingsView.addSeparator();
        }

        if (InspectorBackend.hasCommand("DOM.setInspectModeEnabled", "showRulers")) {
            let elementSelectionGroup = elementsSettingsView.addGroup(WI.UIString("Element Selection:"));
            elementSelectionGroup.addSetting(WI.settings.showRulersDuringElementSelection, WI.UIString("Show page rulers and node border lines"));
            elementSelectionGroup.addSetting(WI.settings.showFlexOverlayDuringElementSelection, WI.UIString("Show grid overlay"));
            elementSelectionGroup.addSetting(WI.settings.showGridOverlayDuringElementSelection, WI.UIString("Show flexbox overlay"));

            elementsSettingsView.addSeparator();
        }

        elementsSettingsView.addSetting(WI.UIString("Details Sidebars:", "Details Sidebars: @ Settings Elements Pane", "Category label for detail sidebar settings."), WI.settings.enableElementsTabIndependentStylesDetailsSidebarPanel, WI.UIString("Show independent Styles sidebar", "Show independent Styles sidebar @ Settings Elements Pane", "Settings tab checkbox label for whether the independent styles sidebar should be shown"));
        elementsSettingsView.addSeparator();

        let cssGroup = elementsSettingsView.addGroup(WI.UIString("CSS:"));
        cssGroup.addSetting(WI.settings.cssChangesPerNode, WI.UIString("Show changes only for selected node"));
        cssGroup.addSetting(WI.settings.showCSSPropertySyntaxInDocumentationPopover, WI.UIString("Show property syntax in documentation popover"));

        this._createReferenceLink(elementsSettingsView);

        this.addSettingsView(elementsSettingsView);
    }

    _createSourcesSettingsView()
    {
        let sourcesSettingsView = new WI.SettingsView("sources", WI.UIString("Sources"));

        sourcesSettingsView.addSetting(WI.UIString("Debugging:"), WI.settings.showScopeChainOnPause, WI.UIString("Show Scope Chain on pause"));

        sourcesSettingsView.addSeparator();

        sourcesSettingsView.addSetting(WI.UIString("Source Maps:"), WI.settings.sourceMapsEnabled, WI.UIString("Enable source maps"));

        sourcesSettingsView.addSeparator();

        sourcesSettingsView.addSetting(WI.UIString("Images:"), WI.settings.showImageGrid, WI.UIString("Show transparency grid", "Show transparency grid (settings label)", "Settings tab checkbox label for whether the transparency grid is shown by default"));

        this._createReferenceLink(sourcesSettingsView);

        this.addSettingsView(sourcesSettingsView);
    }

    _createConsoleSettingsView()
    {
        let consoleSettingsView = new WI.SettingsView("console", WI.UIString("Console"));

        // COMPATIBILITY (iOS 12.2): Runtime.setSavedResultAlias did not exist.
        if (InspectorBackend.hasCommand("Runtime.setSavedResultAlias")) {
            let consoleSavedResultAliasEditor = consoleSettingsView.addGroupWithCustomEditor(WI.UIString("Saved Result Alias:"));

            let consoleSavedResultAliasInput = consoleSavedResultAliasEditor.appendChild(document.createElement("input"));
            consoleSavedResultAliasInput.spellcheck = false;
            consoleSavedResultAliasInput.value = WI.settings.consoleSavedResultAlias.value;
            consoleSavedResultAliasInput.placeholder = WI.unlocalizedString("$");
            consoleSavedResultAliasInput.addEventListener("keydown", (event) => {
                if (!/[a-zA-Z0-9_$]/.test(event.key) || (consoleSavedResultAliasInput.selectionStart === 0 && /[0-9]/.test(event.key))) {
                    event.preventDefault();
                    InspectorFrontendHost.beep();
                }
            });
            consoleSavedResultAliasInput.addEventListener("input", (event) => {
                let savedResultAlias = consoleSavedResultAliasInput.value;
                if (savedResultAlias === "$")
                    savedResultAlias = "";
                WI.settings.consoleSavedResultAlias.value = savedResultAlias;
            });

            consoleSettingsView.addSeparator();
        }

        consoleSettingsView.addSetting(WI.UIString("Traces:"), WI.settings.consoleAutoExpandTrace, WI.UIString("Auto-expand"));
        consoleSettingsView.addSetting(WI.UIString("Show:"), WI.settings.showConsoleMessageTimestamps, WI.UIString("Timestamps"));

        // COMPATIBILITY (iOS 18.0, macOS 15.0): `Console.setConsoleClearAPIEnabled` did not exist yet.
        if (InspectorBackend.hasCommand("Console.setConsoleClearAPIEnabled"))
            consoleSettingsView.addSetting(WI.UIString("Clear:"), WI.settings.consoleClearAPIEnabled, WI.UIString("Allow page to clear Console"));

        if (WI.ConsoleManager.supportsLogChannels()) {
            consoleSettingsView.addSeparator();

            const logLevels = [
                [WI.LoggingChannel.Level.Off, WI.UIString("Off")],
                [WI.LoggingChannel.Level.Basic, WI.UIString("Basic")],
                [WI.LoggingChannel.Level.Verbose, WI.UIString("Verbose")],
            ];
            const editorLabels = {
                [WI.ConsoleMessage.MessageSource.Media]: WI.UIString("Media Logging:"),
                [WI.ConsoleMessage.MessageSource.MediaSource]: WI.UIString("MSE Logging:"),
                [WI.ConsoleMessage.MessageSource.WebRTC]: WI.UIString("WebRTC Logging:"),
            };

            let channels = WI.consoleManager.customLoggingChannels;
            for (let channel of channels) {
                let label = editorLabels[channel.source];
                if (!label)
                    continue;

                let logEditor = consoleSettingsView.addGroupWithCustomSetting(label, WI.SettingEditor.Type.Select, {values: logLevels});
                logEditor.value = channel.level;
                logEditor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
                    for (let target of WI.targets)
                        target.ConsoleAgent.setLoggingChannelLevel(channel.source, this.value);
                }, logEditor);
            }
        }

        this._createReferenceLink(consoleSettingsView);

        this.addSettingsView(consoleSettingsView);
    }

    _createExperimentalSettingsView()
    {
        let experimentalSettingsView = new WI.SettingsView("experimental", WI.UIString("Experimental"));

        let initialValues = new Map;
        
        let consoleGroup = experimentalSettingsView.addGroup(WI.UIString("Console:"));
        consoleGroup.addSetting(WI.settings.experimentalGroupSourceMapErrors, WI.UIString("Group source map network errors"));
        consoleGroup.addSetting(WI.settings.experimentalShowCaseSensitiveAutocomplete, WI.UIString("Use case sensitive autocomplete"));
        
        experimentalSettingsView.addSeparator();


        let hasCSSDomain = InspectorBackend.hasDomain("CSS");
        if (hasCSSDomain) {
            let stylesGroup = experimentalSettingsView.addGroup(WI.UIString("Styles:"));
            stylesGroup.addSetting(WI.settings.experimentalEnableStylesJumpToEffective, WI.UIString("Show jump to effective property button"));
            stylesGroup.addSetting(WI.settings.experimentalEnableStylesJumpToVariableDeclaration, WI.UIString("Show jump to variable declaration button"));
            stylesGroup.addSetting(WI.settings.experimentalCSSSortPropertyNameAutocompletionByUsage, WI.UIString("Suggest property names based on usage"));

            experimentalSettingsView.addSeparator();
        }

        let hasNetworkEmulatedCondition = InspectorBackend.hasCommand("Network.setEmulatedConditions");
        if (hasNetworkEmulatedCondition) {
            let networkGroup = experimentalSettingsView.addGroup(WI.UIString("Network:"));
            networkGroup.addSetting(WI.settings.experimentalEnableNetworkEmulatedCondition, WI.UIString("Allow throttling", "Label for checkbox that controls whether network throttling functionality is enabled."));

            experimentalSettingsView.addSeparator();
        }

        let sourcesGroup = experimentalSettingsView.addGroup(WI.UIString("Sources:"));
        sourcesGroup.addSetting(WI.settings.experimentalLimitSourceCodeHighlighting, WI.UIString("Limit syntax highlighting on long lines of code"));
        sourcesGroup.addSetting(WI.settings.experimentalUseFuzzyMatchingForCSSCodeCompletion, WI.UIString("Use fuzzy matching for CSS code completion"));

        experimentalSettingsView.addSeparator();

        let diagnosticsGroup = experimentalSettingsView.addGroup(WI.UIString("Diagnostics:", "Diagnostics: @ Experimental Settings", "Category label for experimental settings related to Web Inspector diagnostics."));
        diagnosticsGroup.addSetting(WI.settings.experimentalAllowInspectingInspector, WI.UIString("Allow Inspecting Web Inspector", "Allow Inspecting Web Inspector @ Experimental Settings", "Label for setting that allows the user to inspect the Web Inspector user interface."));
        experimentalSettingsView.addSeparator();

        let reloadInspectorButton = document.createElement("button");
        reloadInspectorButton.textContent = WI.UIString("Reload Web Inspector");
        reloadInspectorButton.addEventListener("click", (event) => {
            InspectorFrontendHost.reopen();
        });

        let reloadInspectorContainerElement = experimentalSettingsView.addCenteredContainer(reloadInspectorButton, WI.UIString("for changes to take effect"));
        reloadInspectorContainerElement.classList.add("hidden");

        function listenForChange(setting) {
            initialValues.set(setting, setting.value);
            setting.addEventListener(WI.Setting.Event.Changed, function(event) {
                this.classList.toggle("hidden", Array.from(initialValues).every(([setting, initialValue]) => setting.value === initialValue));
            }, reloadInspectorContainerElement);
        }

        if (hasCSSDomain) {
            listenForChange(WI.settings.experimentalEnableStylesJumpToEffective);
            listenForChange(WI.settings.experimentalEnableStylesJumpToVariableDeclaration);
        }

        if (hasNetworkEmulatedCondition)
            listenForChange(WI.settings.experimentalEnableNetworkEmulatedCondition);

        listenForChange(WI.settings.experimentalLimitSourceCodeHighlighting);

        this._createReferenceLink(experimentalSettingsView);

        this.addSettingsView(experimentalSettingsView);
    }

    _createEngineeringSettingsView()
    {
        // These settings are only ever shown when engineering tools are enabled or in engineering builds, so the strings are unlocalized.

        let engineeringSettingsView = new WI.SettingsView("engineering", WI.unlocalizedString("Engineering"));

        let elementsGroup = engineeringSettingsView.addGroup(WI.unlocalizedString("Elements:"));
        elementsGroup.addSetting(WI.settings.engineeringAllowEditingUserAgentShadowTrees, WI.unlocalizedString("Allow editing UserAgent shadow trees"));

        engineeringSettingsView.addSeparator();

        let debuggingGroup = engineeringSettingsView.addGroup(WI.unlocalizedString("Debugging:"));
        debuggingGroup.addSetting(WI.settings.engineeringShowInternalExecutionContexts, WI.unlocalizedString("Show WebKit-internal execution contexts"));
        debuggingGroup.addSetting(WI.settings.engineeringShowInternalScripts, WI.unlocalizedString("Show WebKit-internal scripts"));
        debuggingGroup.addSetting(WI.settings.engineeringPauseForInternalScripts, WI.unlocalizedString("Pause in WebKit-internal scripts"));

        engineeringSettingsView.addSeparator();

        let heapSnapshotGroup = engineeringSettingsView.addGroup(WI.unlocalizedString("Heap Snapshot:"));
        heapSnapshotGroup.addSetting(WI.settings.engineeringShowInternalObjectsInHeapSnapshot, WI.unlocalizedString("Show Internal Objects"));
        heapSnapshotGroup.addSetting(WI.settings.engineeringShowPrivateSymbolsInHeapSnapshot, WI.unlocalizedString("Show Private Symbols"));

        this.addSettingsView(engineeringSettingsView);
    }

    _createDebugSettingsView()
    {
        if (this._debugSettingsView)
            return;

        // These settings are only ever shown in engineering builds, so the strings are unlocalized.

        this._debugSettingsView = new WI.SettingsView("debug", WI.unlocalizedString("Debug"));

        let protocolMessagesGroup = this._debugSettingsView.addGroup(WI.unlocalizedString("Protocol Logging:"));

        let protocolAutoLogMessagesEditor = protocolMessagesGroup.addSetting(WI.settings.protocolAutoLogMessages, WI.unlocalizedString("Messages"));
        WI.settings.protocolAutoLogMessages.addEventListener(WI.Setting.Event.Changed, function(event) {
            this.value = InspectorBackend.dumpInspectorProtocolMessages;
        }, protocolAutoLogMessagesEditor);

        protocolMessagesGroup.addSetting(WI.settings.protocolAutoLogTimeStats, WI.unlocalizedString("Time Stats"));
        protocolMessagesGroup.addSetting(WI.settings.protocolLogAsText, WI.unlocalizedString("Log as Text"));

        this._debugSettingsView.addSeparator();

        let debuggingGroup = this._debugSettingsView.addGroup(WI.unlocalizedString("Debugging:"));
        debuggingGroup.addSetting(WI.settings.debugShowConsoleEvaluations, WI.unlocalizedString("Show Console Evaluations"));
        debuggingGroup.addSetting(WI.settings.debugOutlineFocusedElement, WI.unlocalizedString("Outline focused element"));

        this._debugSettingsView.addSeparator();

        this._debugSettingsView.addSetting(WI.unlocalizedString("Layout Flashing:"), WI.settings.debugEnableLayoutFlashing, WI.unlocalizedString("Draw borders when a view performs a layout"));

        this._debugSettingsView.addSeparator();

        this._debugSettingsView.addSetting(WI.unlocalizedString("Styles:"), WI.settings.debugEnableStyleEditingDebugMode, WI.unlocalizedString("Enable style editing debug mode"));

        this._debugSettingsView.addSeparator();

        let diagnosticsGroup = this._debugSettingsView.addGroup(WI.unlocalizedString("Diagnostics:"));
        diagnosticsGroup.addSetting(WI.settings.debugEnableUncaughtExceptionReporter, WI.unlocalizedString("Report Uncaught Exceptions"));
        diagnosticsGroup.addSetting(WI.settings.debugEnableDiagnosticLogging, WI.unlocalizedString("Enable Diagnostic Logging"));
        diagnosticsGroup.addSetting(WI.settings.debugAutoLogDiagnosticEvents, WI.unlocalizedString("Show Diagnostic Events in Console"));

        this._debugSettingsView.addSeparator();

        const layoutDirectionValues = [
            [WI.LayoutDirection.System, WI.unlocalizedString("System Default")],
            [WI.LayoutDirection.LTR, WI.unlocalizedString("Left to Right (LTR)")],
            [WI.LayoutDirection.RTL, WI.unlocalizedString("Right to Left (RTL)")],
        ];

        let layoutDirectionEditor = this._debugSettingsView.addGroupWithCustomSetting(WI.unlocalizedString("Layout Direction:"), WI.SettingEditor.Type.Select, {values: layoutDirectionValues});
        layoutDirectionEditor.value = WI.settings.debugLayoutDirection.value;
        layoutDirectionEditor.addEventListener(WI.SettingEditor.Event.ValueDidChange, function(event) {
            WI.setLayoutDirection(this.value);
        }, layoutDirectionEditor);

        this._debugSettingsView.addSeparator();

        let extensionsGroup = this._debugSettingsView.addGroup(WI.unlocalizedString("Web Extensions:"));
        extensionsGroup.addSetting(WI.settings.debugShowMockWebExtensionTab, WI.unlocalizedString("Show Mock Web Extension tab"));

        this._debugSettingsView.addSeparator();

        let resetInspectorButton = document.createElement("button");
        resetInspectorButton.textContent = WI.unlocalizedString("Reset Web Inspector");
        resetInspectorButton.addEventListener("click", (event) => {
            WI.reset();
        });
        this._debugSettingsView.addCenteredContainer(resetInspectorButton);

        this.addSettingsView(this._debugSettingsView);
    }

    _createReferenceLink(settingsView)
    {
        let link = document.createElement("a");
        link.href = link.title = "https://webkit.org/web-inspector/web-inspector-settings/#" + settingsView.identifier;
        link.textContent = WI.UIString("Web Inspector Reference");

        link.appendChild(WI.createGoToArrowButton());

        let container = settingsView.addCenteredContainer(link);
        container.classList.add("reference");
    }

    _updateNavigationBarVisibility()
    {
        let visibleItems = 0;
        for (let item of this._navigationBar.navigationItems) {
            if (!item.hidden && ++visibleItems > 1) {
                this._navigationBar.element.classList.remove("invisible");
                return;
            }
        }

        this._navigationBar.element.classList.add("invisible");
    }

    _navigationItemSelected(event)
    {
        let navigationItem = event.target.selectedNavigationItem;
        if (!navigationItem)
            return;

        let settingsView = this._settingsViews.find((view) => view.identifier === navigationItem.identifier);
        console.assert(settingsView, "Missing SettingsView for identifier " + navigationItem.identifier);
        if (!settingsView)
            return;

        this.selectedSettingsView = settingsView;
    }

    _updateDebugSettingsViewVisibility()
    {
        // Only create the Debug view if the debug UI is enabled.
        if (WI.isDebugUIEnabled())
            this._createDebugSettingsView();

        if (!this._debugSettingsView)
            return;

        this.setSettingsViewVisible(this._debugSettingsView, WI.isDebugUIEnabled());

        this.needsLayout();
    }
};

WI.SettingsTabContentView.Type = "settings";
