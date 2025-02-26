/*
 * Copyright (C) 2009 Google Inc. All rights reserved.
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.Setting = class Setting extends WI.Object
{
    constructor(name, defaultValue)
    {
        super();

        this._name = name;

        this._defaultValue = defaultValue;
    }

    // Static

    static migrateValue(key)
    {
        let localStorageKey = WI.Setting._localStorageKeyPrefix + key;

        let value = undefined;
        if (!window.InspectorTest && window.localStorage) {
            let item = window.localStorage.getItem(localStorageKey);
            if (item !== null) {
                try {
                    value = JSON.parse(item);
                } catch { }

                window.localStorage.removeItem(localStorageKey);
            }
        }
        return value;
    }

    static reset()
    {
        let prefix = WI.Setting._localStorageKeyPrefix;

        let keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; ++i) {
            let key = window.localStorage.key(i);
            if (key.startsWith(prefix))
                keysToRemove.push(key);
        }

        for (let key of keysToRemove)
            window.localStorage.removeItem(key);
    }

    // Public

    get name() { return this._name; }
    get defaultValue() { return this._defaultValue; }

    get value()
    {
        if ("_value" in this)
            return this._value;

        // Make a copy of the default value so changes to object values don't modify the default value.
        this._value = JSON.parse(JSON.stringify(this._defaultValue));

        if (!window.InspectorTest && window.localStorage) {
            let key = WI.Setting._localStorageKeyPrefix + this._name;
            let item = window.localStorage.getItem(key);
            if (item !== null) {
                try {
                    this._value = JSON.parse(item);
                } catch {
                    window.localStorage.removeItem(key);
                }
            }
        }

        return this._value;
    }

    set value(value)
    {
        if (this._value === value)
            return;

        this._value = value;

        this.save();
    }

    save()
    {
        if (!window.InspectorTest && window.localStorage) {
            let key = WI.Setting._localStorageKeyPrefix + this._name;
            try {
                if (Object.shallowEqual(this._value, this._defaultValue))
                    window.localStorage.removeItem(key);
                else
                    window.localStorage.setItem(key, JSON.stringify(this._value));
            } catch {
                console.error("Error saving setting with name: " + this._name);
            }
        }

        this.dispatchEventToListeners(WI.Setting.Event.Changed, this._value, {name: this._name});
    }

    reset()
    {
        // Make a copy of the default value so changes to object values don't modify the default value.
        this.value = JSON.parse(JSON.stringify(this._defaultValue));
    }
};

WI.Setting._localStorageKeyPrefix = (function() {
    let inspectionLevel = InspectorFrontendHost ? InspectorFrontendHost.inspectionLevel : 1;
    let levelString = inspectionLevel > 1 ? "-" + inspectionLevel : "";
    return `com.apple.WebInspector${levelString}.`;
})();

WI.Setting.isFirstLaunch = !!window.InspectorTest || (window.localStorage && Object.keys(window.localStorage).every((key) => !key.startsWith(WI.Setting._localStorageKeyPrefix)));

WI.Setting.Event = {
    Changed: "setting-changed"
};

WI.EngineeringSetting = class EngineeringSetting extends WI.Setting
{
    get value()
    {
        if (WI.engineeringSettingsAllowed())
            return super.value;
        return this.defaultValue;
    }

    set value(value)
    {
        console.assert(WI.engineeringSettingsAllowed());
        if (WI.engineeringSettingsAllowed())
            super.value = value;
    }
};

WI.DebugSetting = class DebugSetting extends WI.Setting
{
    get value()
    {
        if (WI.isDebugUIEnabled())
            return super.value;
        return this.defaultValue;
    }

    set value(value)
    {
        console.assert(WI.isDebugUIEnabled());
        if (WI.isDebugUIEnabled())
            super.value = value;
    }
};

WI.settings = {
    blackboxBreakpointEvaluations: new WI.Setting("blackbox-breakpoint-evaluations", true),
    canvasRecordingAutoCaptureEnabled: new WI.Setting("canvas-recording-auto-capture-enabled", false),
    canvasRecordingAutoCaptureFrameCount: new WI.Setting("canvas-recording-auto-capture-frame-count", 1),
    consoleAutoExpandTrace: new WI.Setting("console-auto-expand-trace", true),
    consoleClearAPIEnabled: new WI.Setting("console-clear-api-enabled", true),
    consoleSavedResultAlias: new WI.Setting("console-saved-result-alias", ""),
    cssChangesPerNode: new WI.Setting("css-changes-per-node", false),
    clearLogOnNavigate: new WI.Setting("clear-log-on-navigate", true),
    clearNetworkOnNavigate: new WI.Setting("clear-network-on-navigate", true),
    cpuTimelineThreadDetailsExpanded: new WI.Setting("cpu-timeline-thread-details-expanded", false),
    domTreeDeemphasizesNodesThatAreNotRendered: new WI.Setting("dom-tree-deemphasizes-nodes-that-are-not-rendered", true),
    emulateInUserGesture: new WI.Setting("emulate-in-user-gesture", false),
    enableControlFlowProfiler: new WI.Setting("enable-control-flow-profiler", false),
    enableElementsTabIndependentStylesDetailsSidebarPanel: new WI.Setting("elements-tab-independent-styles-details-panel", true),
    enableLineWrapping: new WI.Setting("enable-line-wrapping", true),
    enableNarrowLayoutMode: new WI.Setting("enable-narrow-layout-mode", true),
    flexOverlayShowOrderNumbers: new WI.Setting("flex-overlay-show-order-numbers", false),
    frontendAppearance: new WI.Setting("frontend-appearance", "system"),
    gridOverlayShowAreaNames: new WI.Setting("grid-overlay-show-area-names", false),
    gridOverlayShowExtendedGridLines: new WI.Setting("grid-overlay-show-extended-grid-lines", false),
    gridOverlayShowLineNames: new WI.Setting("grid-overlay-show-line-names", false),
    gridOverlayShowLineNumbers: new WI.Setting("grid-overlay-show-line-numbers", true),
    gridOverlayShowTrackSizes: new WI.Setting("grid-overlay-show-track-sizes", true),
    groupMediaRequestsByDOMNode: new WI.Setting("group-media-requests-by-dom-node", WI.Setting.migrateValue("group-by-dom-node") || false),
    indentUnit: new WI.Setting("indent-unit", 4),
    indentWithTabs: new WI.Setting("indent-with-tabs", false),
    resourceCachingDisabled: new WI.Setting("disable-resource-caching", false),
    searchCaseSensitive: new WI.Setting("search-case-sensitive", false),
    searchFromSelection: new WI.Setting("search-from-selection", false),
    searchRegularExpression: new WI.Setting("search-regular-expression", false),
    selectedNetworkDetailContentViewIdentifier: new WI.Setting("network-detail-content-view-identifier", "preview"),
    sourceMapsEnabled: new WI.Setting("source-maps-enabled", true),
    showConsoleMessageTimestamps: new WI.Setting("show-console-message-timestamps", false),
    showCSSPropertySyntaxInDocumentationPopover: new WI.Setting("show-css-property-syntax-in-documentation-popover", false),
    showCanvasPath: new WI.Setting("show-canvas-path", false),
    showFlexOverlayDuringElementSelection: new WI.Setting("show-grid-overlay-during-element-selection", true),
    showGridOverlayDuringElementSelection: new WI.Setting("show-flex-overlay-during-element-selection", true),
    showImageGrid: new WI.Setting("show-image-grid", true),
    showInvisibleCharacters: new WI.Setting("show-invisible-characters", !!WI.Setting.migrateValue("show-invalid-characters")),
    showJavaScriptTypeInformation: new WI.Setting("show-javascript-type-information", false),
    showRulers: new WI.Setting("show-rulers", false),
    showRulersDuringElementSelection: new WI.Setting("show-rulers-during-element-selection", true),
    showScopeChainOnPause: new WI.Setting("show-scope-chain-sidebar", true),
    showWhitespaceCharacters: new WI.Setting("show-whitespace-characters", false),
    tabSize: new WI.Setting("tab-size", 4),
    timelinesAutoStop: new WI.Setting("timelines-auto-stop", true),
    timelineOverviewGroupBySourceCode: new WI.Setting("timeline-overview-group-by-source-code", true),
    zoomFactor: new WI.Setting("zoom-factor", 1),

    // Experimental
    experimentalEnableStylesJumpToEffective: new WI.Setting("experimental-styles-jump-to-effective", false),
    experimentalEnableStylesJumpToVariableDeclaration: new WI.Setting("experimental-styles-jump-to-variable-declaration", false),
    experimentalAllowInspectingInspector: new WI.Setting("experimental-allow-inspecting-inspector", false),
    experimentalCSSSortPropertyNameAutocompletionByUsage: new WI.Setting("experimental-css-sort-property-name-autocompletion-by-usage", true),
    experimentalEnableNetworkEmulatedCondition: new WI.Setting("experimental-enable-network-emulated-condition", false),
    experimentalGroupSourceMapErrors: new WI.Setting("experimental-group-source-map-errors", true),
    experimentalShowCaseSensitiveAutocomplete: new WI.Setting("experimental-show-case-sensitive-auto-complete", false),
    experimentalLimitSourceCodeHighlighting: new WI.Setting("engineering-limit-source-code-highlighting", false),
    experimentalUseFuzzyMatchingForCSSCodeCompletion: new WI.Setting("experimental-use-fuzzy-matching-for-css-code-completion", true),

    // Protocol
    protocolLogAsText: new WI.Setting("protocol-log-as-text", false),
    protocolAutoLogMessages: new WI.Setting("protocol-auto-log-messages", false),
    protocolAutoLogTimeStats: new WI.Setting("protocol-auto-log-time-stats", false),
    protocolFilterMultiplexingBackendMessages: new WI.Setting("protocol-filter-multiplexing-backend-messages", true),

    // Engineering
    engineeringShowInternalExecutionContexts: new WI.EngineeringSetting("engineering-show-internal-execution-contexts", false),
    engineeringShowInternalScripts: new WI.EngineeringSetting("engineering-show-internal-scripts", false),
    engineeringPauseForInternalScripts: new WI.EngineeringSetting("engineering-pause-for-internal-scripts", false),
    engineeringShowInternalObjectsInHeapSnapshot: new WI.EngineeringSetting("engineering-show-internal-objects-in-heap-snapshot", false),
    engineeringShowPrivateSymbolsInHeapSnapshot: new WI.EngineeringSetting("engineering-show-private-symbols-in-heap-snapshot", false),
    engineeringAllowEditingUserAgentShadowTrees: new WI.EngineeringSetting("engineering-allow-editing-user-agent-shadow-trees", false),

    // Debug
    debugShowConsoleEvaluations: new WI.DebugSetting("debug-show-console-evaluations", false),
    debugOutlineFocusedElement: new WI.DebugSetting("debug-outline-focused-element", false),
    debugEnableLayoutFlashing: new WI.DebugSetting("debug-enable-layout-flashing", false),
    debugEnableStyleEditingDebugMode: new WI.DebugSetting("debug-enable-style-editing-debug-mode", false),
    debugEnableUncaughtExceptionReporter: new WI.DebugSetting("debug-enable-uncaught-exception-reporter", true),
    debugEnableDiagnosticLogging: new WI.DebugSetting("debug-enable-diagnostic-logging", true),
    debugAutoLogDiagnosticEvents: new WI.DebugSetting("debug-auto-log-diagnostic-events", false),
    debugLayoutDirection: new WI.DebugSetting("debug-layout-direction-override", "system"),
    debugShowMockWebExtensionTab: new WI.DebugSetting("debug-show-mock-web-extension-tab", false),
};
