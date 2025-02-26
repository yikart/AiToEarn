/*
 * Copyright (C) 2013-2020 Apple Inc. All rights reserved.
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

WI.ContentViewCookieType = {
    ApplicationCache: "application-cache",
    CookieStorage: "cookie-storage",
    Database: "database",
    DatabaseTable: "database-table",
    DOMStorage: "dom-storage",
    Resource: "resource", // includes Frame too.
    Timelines: "timelines"
};

WI.SelectedSidebarPanelCookieKey = "selected-sidebar-panel";
WI.TypeIdentifierCookieKey = "represented-object-type";

WI.StateRestorationType = {
    Load: "state-restoration-load",
    Navigation: "state-restoration-navigation",
    Delayed: "state-restoration-delayed",
};

WI.LayoutDirection = {
    System: "system",
    LTR: "ltr",
    RTL: "rtl",
};

WI.LayoutMode = {
    Default: "default",
    Narrow: "narrow",
};

WI.NarrowLayoutMaximumWidth = 700;

WI.loaded = function()
{
    if (InspectorFrontendHost.connect)
        InspectorFrontendHost.connect();

    // Register observers for events from the InspectorBackend.
    if (InspectorBackend.registerAnimationDispatcher)
        InspectorBackend.registerAnimationDispatcher(WI.AnimationObserver);
    if (InspectorBackend.registerApplicationCacheDispatcher)
        InspectorBackend.registerApplicationCacheDispatcher(WI.ApplicationCacheObserver);
    if (InspectorBackend.registerBrowserDispatcher)
        InspectorBackend.registerBrowserDispatcher(WI.BrowserObserver);
    if (InspectorBackend.registerCPUProfilerDispatcher)
        InspectorBackend.registerCPUProfilerDispatcher(WI.CPUProfilerObserver);
    if (InspectorBackend.registerCSSDispatcher)
        InspectorBackend.registerCSSDispatcher(WI.CSSObserver);
    if (InspectorBackend.registerCanvasDispatcher)
        InspectorBackend.registerCanvasDispatcher(WI.CanvasObserver);
    if (InspectorBackend.registerConsoleDispatcher)
        InspectorBackend.registerConsoleDispatcher(WI.ConsoleObserver);
    if (InspectorBackend.registerDOMDispatcher)
        InspectorBackend.registerDOMDispatcher(WI.DOMObserver);
    if (InspectorBackend.registerDOMStorageDispatcher)
        InspectorBackend.registerDOMStorageDispatcher(WI.DOMStorageObserver);
    if (InspectorBackend.registerDatabaseDispatcher)
        InspectorBackend.registerDatabaseDispatcher(WI.DatabaseObserver);
    if (InspectorBackend.registerDebuggerDispatcher)
        InspectorBackend.registerDebuggerDispatcher(WI.DebuggerObserver);
    if (InspectorBackend.registerHeapDispatcher)
        InspectorBackend.registerHeapDispatcher(WI.HeapObserver);
    if (InspectorBackend.registerInspectorDispatcher)
        InspectorBackend.registerInspectorDispatcher(WI.InspectorObserver);
    if (InspectorBackend.registerLayerTreeDispatcher)
        InspectorBackend.registerLayerTreeDispatcher(WI.LayerTreeObserver);
    if (InspectorBackend.registerMemoryDispatcher)
        InspectorBackend.registerMemoryDispatcher(WI.MemoryObserver);
    if (InspectorBackend.registerNetworkDispatcher)
        InspectorBackend.registerNetworkDispatcher(WI.NetworkObserver);
    if (InspectorBackend.registerPageDispatcher)
        InspectorBackend.registerPageDispatcher(WI.PageObserver);
    if (InspectorBackend.registerRuntimeDispatcher)
        InspectorBackend.registerRuntimeDispatcher(WI.RuntimeObserver);
    if (InspectorBackend.registerScriptProfilerDispatcher)
        InspectorBackend.registerScriptProfilerDispatcher(WI.ScriptProfilerObserver);
    if (InspectorBackend.registerTargetDispatcher)
        InspectorBackend.registerTargetDispatcher(WI.TargetObserver);
    if (InspectorBackend.registerTimelineDispatcher)
        InspectorBackend.registerTimelineDispatcher(WI.TimelineObserver);
    if (InspectorBackend.registerWorkerDispatcher)
        InspectorBackend.registerWorkerDispatcher(WI.WorkerObserver);

    // Listen for the ProvisionalLoadStarted event before registering for events so our code gets called before any managers or sidebars.
    // This lets us save a state cookie before any managers or sidebars do any resets that would affect state (namely TimelineManager).
    WI.Frame.addEventListener(WI.Frame.Event.ProvisionalLoadStarted, WI._provisionalLoadStarted, WI);

    // Populate any UIStrings that must be done early after localized strings have loaded.
    WI.KeyboardShortcut.Key.Space._displayName = WI.UIString("Space");

    // Create the singleton managers next, before the user interface elements, so the user interface can register
    // as event listeners on these managers.
    WI.managers = [
        WI.browserManager = new WI.BrowserManager,
        WI.targetManager = new WI.TargetManager,
        WI.networkManager = new WI.NetworkManager,
        WI.domStorageManager = new WI.DOMStorageManager,
        WI.databaseManager = new WI.DatabaseManager,
        WI.indexedDBManager = new WI.IndexedDBManager,
        WI.domManager = new WI.DOMManager,
        WI.cssManager = new WI.CSSManager,
        WI.consoleManager = new WI.ConsoleManager,
        WI.runtimeManager = new WI.RuntimeManager,
        WI.heapManager = new WI.HeapManager,
        WI.memoryManager = new WI.MemoryManager,
        WI.applicationCacheManager = new WI.ApplicationCacheManager,
        WI.timelineManager = new WI.TimelineManager,
        WI.auditManager = new WI.AuditManager,
        WI.debuggerManager = new WI.DebuggerManager,
        WI.layerTreeManager = new WI.LayerTreeManager,
        WI.workerManager = new WI.WorkerManager,
        WI.domDebuggerManager = new WI.DOMDebuggerManager,
        WI.canvasManager = new WI.CanvasManager,
        WI.animationManager = new WI.AnimationManager,
        WI.deviceSettingsManager = new WI.DeviceSettingsManager,
    ];

    // Register for events.
    WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Paused, WI._debuggerDidPause, WI);
    WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Resumed, WI._debuggerDidResume, WI);
    WI.deviceSettingsManager.addEventListener(WI.DeviceSettingsManager.Event.SettingChanged, WI._handleDeviceSettingChanged, WI);
    WI.domManager.addEventListener(WI.DOMManager.Event.InspectModeStateChanged, WI._inspectModeStateChanged, WI);
    WI.domManager.addEventListener(WI.DOMManager.Event.DOMNodeWasInspected, WI._domNodeWasInspected, WI);
    WI.domStorageManager.addEventListener(WI.DOMStorageManager.Event.DOMStorageObjectWasInspected, WI._domStorageWasInspected, WI);
    WI.databaseManager.addEventListener(WI.DatabaseManager.Event.DatabaseWasInspected, WI._databaseWasInspected, WI);
    WI.networkManager.addEventListener(WI.NetworkManager.Event.MainFrameDidChange, WI._mainFrameDidChange, WI);
    WI.networkManager.addEventListener(WI.NetworkManager.Event.FrameWasAdded, WI._frameWasAdded, WI);
    WI.browserManager.enable();

    WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, WI._mainResourceDidChange, WI);

    document.addEventListener("DOMContentLoaded", WI.contentLoaded);

    // Create settings.
    WI._showingSplitConsoleSetting = new WI.Setting("showing-split-console", false);
    WI._openTabsSetting = new WI.Setting("open-tab-types", [
        WI.ElementsTabContentView.Type,
        WI.ConsoleTabContentView.Type,
        WI.SourcesTabContentView.Type,
        WI.NetworkTabContentView.Type,
        WI.TimelineTabContentView.Type,
        WI.StorageTabContentView.Type,
        WI.GraphicsTabContentView.Type,
        WI.LayersTabContentView.Type,
        WI.AuditTabContentView.Type,
    ]);
    WI._selectedTabIndexSetting = new WI.Setting("selected-tab-index", 0);

    // State.
    WI.printStylesEnabled = false;
    WI.setZoomFactor(WI.settings.zoomFactor.value);
    InspectorFrontendHost.setForcedAppearance(WI.settings.frontendAppearance.value);
    InspectorFrontendHost.setAllowsInspectingInspector(WI.settings.experimentalAllowInspectingInspector.value);
    WI.mouseCoords = {x: 0, y: 0};
    WI.modifierKeys = {altKey: false, metaKey: false, shiftKey: false};
    WI.visible = false;
    WI._windowKeydownListeners = [];

    // Targets.
    WI.backendTarget = null;
    WI._backendTargetAvailablePromise = new WI.WrappedPromise;

    WI.pageTarget = null;
    WI._pageTargetAvailablePromise = new WI.WrappedPromise;

    // COMPATIBILITY (iOS 13.0): Target.exists was "replaced" by differentiating "web" debuggables
    // into "page" (direct) and "web-page" debuggables (multiplexing).
    if (InspectorBackend.hasDomain("Target")) {
        if (InspectorBackend.hasCommand("Target.exists")) {
            console.assert(WI.sharedApp.debuggableType === WI.DebuggableType.WebPage);
            InspectorBackend.invokeCommand("Target.exists", WI.TargetType.WebPage, InspectorBackend.backendConnection, {}, (error) => {
                if (error) {
                    WI.sharedApp._debuggableType = WI.DebuggableType.Page;
                    WI.targetManager.createDirectBackendTarget();
                }
            });
        } else
            WI.targetManager.createMultiplexingBackendTarget();
    } else
        WI.targetManager.createDirectBackendTarget();
};

WI.contentLoaded = function()
{
    // If there was an uncaught exception earlier during loading, then
    // abort loading more content. We could be in an inconsistent state.
    if (window.__uncaughtExceptions)
        return;

    // Register for global events.
    document.addEventListener("beforecopy", WI._beforecopy);
    document.addEventListener("copy", WI._copy);
    document.addEventListener("paste", WI._paste);

    document.addEventListener("click", WI._mouseWasClicked);
    document.addEventListener("dragover", WI._handleDragOver);
    document.addEventListener("focus", WI._focusChanged, true);

    window.addEventListener("focus", WI._updateWindowInactiveState);
    window.addEventListener("blur", WI._updateWindowInactiveState);
    window.addEventListener("visibilitychange", WI._updateWindowInactiveState);
    window.addEventListener("resize", WI._windowResized);
    window.addEventListener("keydown", WI._windowKeyDown);
    window.addEventListener("keyup", WI._windowKeyUp);
    window.addEventListener("mousemove", WI._mouseMoved, true);
    window.addEventListener("pagehide", WI._pageHidden);
    window.addEventListener("contextmenu", WI._contextMenuRequested);

    // Add platform style classes so the UI can be tweaked per-platform.
    document.body.classList.add(WI.Platform.name + "-platform");
    if (WI.Platform.version.name)
        document.body.classList.add(WI.Platform.version.name);

    document.body.classList.add(WI.sharedApp.debuggableType);
    document.body.setAttribute("dir", WI.resolvedLayoutDirection());

    WI.layoutMeasurementContainer = document.body.appendChild(document.createElement("div"));
    WI.layoutMeasurementContainer.id = "layout-measurement-container";

    WI.settings.showJavaScriptTypeInformation.addEventListener(WI.Setting.Event.Changed, WI._showJavaScriptTypeInformationSettingChanged, WI);
    WI.settings.enableControlFlowProfiler.addEventListener(WI.Setting.Event.Changed, WI._enableControlFlowProfilerSettingChanged, WI);
    WI.settings.resourceCachingDisabled.addEventListener(WI.Setting.Event.Changed, WI._resourceCachingDisabledSettingChanged, WI);
    WI.settings.experimentalAllowInspectingInspector.addEventListener(WI.Setting.Event.Changed, WI._allowInspectingInspectorSettingChanged, WI);

    function setTabSize() {
        document.body.style.tabSize = WI.settings.tabSize.value;
    }
    WI.settings.tabSize.addEventListener(WI.Setting.Event.Changed, setTabSize, WI);
    setTabSize();

    function setInvisibleCharacterClassName() {
        document.body.classList.toggle("show-invisible-characters", WI.settings.showInvisibleCharacters.value);
    }
    WI.settings.showInvisibleCharacters.addEventListener(WI.Setting.Event.Changed, setInvisibleCharacterClassName, WI);
    setInvisibleCharacterClassName();

    function setWhitespaceCharacterClassName() {
        document.body.classList.toggle("show-whitespace-characters", WI.settings.showWhitespaceCharacters.value);
    }
    WI.settings.showWhitespaceCharacters.addEventListener(WI.Setting.Event.Changed, setWhitespaceCharacterClassName, WI);
    setWhitespaceCharacterClassName();

    // Create the user interface elements.
    WI.tabBar = new WI.TabBar(document.getElementById("tab-bar"));

    WI._contentElement = document.getElementById("content");
    WI._contentElement.role = "tabpanel";

    WI.clearKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "K", WI._clear);

    WI.findString = "";
    WI.populateFindKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "E", WI._populateFind);
    WI.populateFindKeyboardShortcut.implicitlyPreventsDefault = false;
    WI.findNextKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "G", WI._findNext);
    WI.findPreviousKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, "G", WI._findPrevious);

    WI.consoleDrawer = new WI.ConsoleDrawer(document.getElementById("console-drawer"));
    WI.consoleDrawer.addEventListener(WI.ConsoleDrawer.Event.CollapsedStateChanged, WI._consoleDrawerCollapsedStateDidChange, WI);
    WI.consoleDrawer.addEventListener(WI.ConsoleDrawer.Event.Resized, WI._consoleDrawerDidResize, WI);

    WI.quickConsole = new WI.QuickConsole(document.getElementById("quick-console"));

    WI._consoleRepresentedObject = new WI.LogObject;
    WI.consoleContentView = WI.consoleDrawer.contentViewForRepresentedObject(WI._consoleRepresentedObject);
    WI.consoleLogViewController = WI.consoleContentView.logViewController;

    WI.navigationSidebar = new WI.SingleSidebar(document.getElementById("navigation-sidebar"), WI.Sidebar.Sides.Leading, WI.UIString("Navigation", "Navigation @ Sidebar", "Label for the navigation sidebar."));
    WI.navigationSidebar.addEventListener(WI.Sidebar.Event.WidthDidChange, WI._sidebarSizeDidChange, WI);
    WI.navigationSidebar.addEventListener(WI.Sidebar.Event.CollapsedStateDidChange, WI._sidebarSizeDidChange, WI);

    WI.detailsSidebar = new WI.MultiSidebar(document.getElementById("details-sidebar"), WI.Sidebar.Sides.Trailing, WI.UIString("Details", "Details @ Sidebar", "Label for the details sidebar."));
    WI.detailsSidebar.addEventListener(WI.Sidebar.Event.WidthDidChange, WI._sidebarSizeDidChange, WI);
    WI.detailsSidebar.addEventListener(WI.Sidebar.Event.HeightDidChange, WI._sidebarSizeDidChange, WI);
    WI.detailsSidebar.addEventListener(WI.Sidebar.Event.CollapsedStateDidChange, WI._sidebarSizeDidChange, WI);
    WI.detailsSidebar.addEventListener(WI.MultiSidebar.Event.MultipleSidebarsVisibleChanged, WI._sidebarSizeDidChange, WI);
    WI.detailsSidebar.canMoveToBottom = true;
    
    WI.searchKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "F", WI._focusSearchField);
    WI._findKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "F", WI._find);
    WI.saveKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "S", WI._save);
    WI._saveAsKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, "S", WI._saveAs);

    WI.openResourceKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "O", WI._showOpenResourceDialog);
    new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "P", WI._showOpenResourceDialog);

    WI.navigationSidebarKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "0", WI.toggleNavigationSidebar);
    WI.detailsSidebarKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Option, "0", WI.toggleDetailsSidebar);

    let boundIncreaseZoom = WI._increaseZoom;
    let boundDecreaseZoom = WI._decreaseZoom;
    WI._increaseZoomKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Plus, boundIncreaseZoom);
    WI._decreaseZoomKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Minus, boundDecreaseZoom);
    WI._increaseZoomKeyboardShortcut2 = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, WI.KeyboardShortcut.Key.Plus, boundIncreaseZoom);
    WI._decreaseZoomKeyboardShortcut2 = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, WI.KeyboardShortcut.Key.Minus, boundDecreaseZoom);
    WI._resetZoomKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "0", WI._resetZoom);

    WI._showTabAtIndexKeyboardShortcuts = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Option, `${i}`, (event) => { WI._showTabAtIndexFromShortcut(i); }));

    WI.tabBrowser = new WI.TabBrowser(document.getElementById("tab-browser"), WI.tabBar, WI.navigationSidebar, WI.detailsSidebar);
    WI.tabBrowser.addEventListener(WI.TabBrowser.Event.SelectedTabContentViewDidChange, WI._tabBrowserSelectedTabContentViewDidChange, WI);

    WI._reloadPageKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "R", WI._reloadPage);
    WI._reloadPageFromOriginKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Option, "R", WI._reloadPageFromOrigin);
    WI._reloadPageKeyboardShortcut.implicitlyPreventsDefault = WI._reloadPageFromOriginKeyboardShortcut.implicitlyPreventsDefault = false;

    WI._consoleTabKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Option | WI.KeyboardShortcut.Modifier.CommandOrControl, "C", WI._showConsoleTab);
    WI._quickConsoleKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control, WI.KeyboardShortcut.Key.Apostrophe, WI._focusConsolePrompt);

    WI._inspectModeKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "C", WI._toggleInspectMode);

    WI._undoKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "Z", WI._undoKeyboardShortcut);
    WI._redoKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "Z", WI._redoKeyboardShortcut);
    WI._undoKeyboardShortcut.implicitlyPreventsDefault = WI._redoKeyboardShortcut.implicitlyPreventsDefault = false;

    WI.toggleBreakpointsKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "Y", WI.debuggerToggleBreakpoints);
    WI.pauseOrResumeKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Control | WI.KeyboardShortcut.Modifier.CommandOrControl, "Y", WI.debuggerPauseResumeToggle);
    WI.stepOverKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.F6, WI.debuggerStepOver);
    WI.stepIntoKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.F7, WI.debuggerStepInto);
    WI.stepOutKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.F8, WI.debuggerStepOut);

    WI.pauseOrResumeAlternateKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Backslash, WI.debuggerPauseResumeToggle);
    WI.stepOverAlternateKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.SingleQuote, WI.debuggerStepOver);
    WI.stepIntoAlternateKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Semicolon, WI.debuggerStepInto);
    WI.stepOutAlternateKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Semicolon, WI.debuggerStepOut);

    // COMPATIBILITY (iOS 13.4): Debugger.stepNext did not exist yet.
    if (InspectorBackend.hasCommand("Debugger.stepNext")) {
        WI.stepNextKeyboardShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.F9, WI.debuggerStepNext);
        WI.stepNextAlternateKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.SingleQuote, WI.debuggerStepNext);
    }

    WI._updateDebuggerKeyboardShortcuts();

    WI.settingsKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, WI.KeyboardShortcut.Key.Comma, WI._handleSettingsKeyboardShortcut);

    WI._togglePreviousDockConfigurationKeyboardShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "D", WI._togglePreviousDockConfiguration);

    let dockingConfigurationNavigationItems = [];

    let supportsDockRight = InspectorFrontendHost.supportsDockSide(WI.DockConfiguration.Right);
    let supportsDockLeft = InspectorFrontendHost.supportsDockSide(WI.DockConfiguration.Left);
    let supportsDockBottom = InspectorFrontendHost.supportsDockSide(WI.DockConfiguration.Bottom);
    let supportsUndocked = InspectorFrontendHost.supportsDockSide(WI.DockConfiguration.Undocked);

    function addDockButton(identifier, tooltip, image, handler) {
        let button = new WI.ButtonNavigationItem(identifier, tooltip, image);
        button.element.classList.add(WI.Popover.IgnoreAutoDismissClassName);
        button.addEventListener(WI.ButtonNavigationItem.Event.Clicked, handler, WI);
        dockingConfigurationNavigationItems.push(button);
        return button;
    }

    function addDockLeftButton() {
        if (!supportsDockLeft || (!supportsDockRight && !supportsDockBottom && !supportsUndocked))
            return;

        WI._dockLeftTabBarButton = addDockButton("dock-left", WI.UIString("Dock to left of window"), "Images/DockLeft.svg", WI._dockLeft);
    }

    function addDockRightButton() {
        if (!supportsDockRight || (!supportsDockLeft && !supportsDockBottom && !supportsUndocked))
            return;

        WI._dockRightTabBarButton = addDockButton("dock-right", WI.UIString("Dock to right of window"), "Images/DockRight.svg", WI._dockRight);
    }

    if (supportsDockRight || supportsDockLeft || supportsDockBottom)
        WI._closeTabBarButton = addDockButton("dock-close", WI.UIString("Close"), "Images/CloseLarge.svg", WI.close);

    if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
        addDockRightButton();
    else
        addDockLeftButton();

    if (supportsDockBottom && (supportsDockRight || supportsDockLeft || supportsUndocked))
        WI._dockBottomTabBarButton = addDockButton("dock-bottom", WI.UIString("Dock to bottom of window"), "Images/DockBottom.svg", WI._dockBottom);

    if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
        addDockLeftButton();
    else
        addDockRightButton();

    if (supportsUndocked && (supportsDockRight || supportsDockLeft || supportsDockBottom))
        WI._undockTabBarButton = addDockButton("undock", WI.UIString("Detach into separate window"), "Images/Undock.svg", WI._undock);

    let inspectedPageControlNavigationItems = [];

    let elementSelectionToolTip = WI.UIString("Start element selection (%s)").format(WI._inspectModeKeyboardShortcut.displayName);
    let activatedElementSelectionToolTip = WI.UIString("Stop element selection (%s)").format(WI._inspectModeKeyboardShortcut.displayName);
    WI._inspectModeTabBarButton = new WI.ActivateButtonNavigationItem("inspect", elementSelectionToolTip, activatedElementSelectionToolTip, "Images/Crosshair.svg");
    WI._inspectModeTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI._toggleInspectMode, WI);
    inspectedPageControlNavigationItems.push(WI._inspectModeTabBarButton);

    // COMPATIBILITY (iOS 12.2): Page.overrideSetting did not exist.
    if (InspectorBackend.hasCommand("Page.overrideUserAgent") && InspectorBackend.hasCommand("Page.overrideSetting")) {
        const deviceSettingsTooltip = WI.UIString("Device Settings");
        WI._deviceSettingsTabBarButton = new WI.ActivateButtonNavigationItem("device-settings", deviceSettingsTooltip, deviceSettingsTooltip, InspectorFrontendHost.isRemote ? "Images/Device.svg" : "Images/Computer.svg");
        WI._deviceSettingsTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI._handleDeviceSettingsTabBarButtonClicked, WI);
        inspectedPageControlNavigationItems.push(WI._deviceSettingsTabBarButton);

        WI._deviceSettingsPopover = null;
    }

    if (InspectorFrontendHost.isRemote || WI.isDebugUIEnabled()) {
        let reloadToolTip;
        if (WI.sharedApp.debuggableType === WI.DebuggableType.JavaScript || WI.sharedApp.debuggableType === WI.DebuggableType.ITML)
            reloadToolTip = WI.UIString("Restart (%s)").format(WI._reloadPageKeyboardShortcut.displayName);
        else
            reloadToolTip = WI.UIString("Reload page (%s)\nReload page ignoring cache (%s)").format(WI._reloadPageKeyboardShortcut.displayName, WI._reloadPageFromOriginKeyboardShortcut.displayName);
        WI._reloadTabBarButton = new WI.ButtonNavigationItem("reload", reloadToolTip, "Images/ReloadToolbar.svg");
        WI._reloadTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI._reloadTabBarButtonClicked, WI);
        inspectedPageControlNavigationItems.push(WI._reloadTabBarButton);

        WI._downloadTabBarButton = new WI.ButtonNavigationItem("download", WI.UIString("Download Web Archive"), "Images/DownloadArrow.svg");
        WI._downloadTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, WI._downloadWebArchive, WI);
        inspectedPageControlNavigationItems.push(WI._downloadTabBarButton);
    }

    WI.tabBar.addNavigationItemBefore(new WI.GroupNavigationItem([
        ...dockingConfigurationNavigationItems,
        ...inspectedPageControlNavigationItems,
    ]));

    WI._consoleDividerNavigationItem = new WI.DividerNavigationItem;
    WI.tabBar.addNavigationItemBefore(WI._consoleDividerNavigationItem);

    WI._consoleWarningsTabBarButton = new WI.ButtonNavigationItem("console-warnings", WI.UIString("0 Console warnings"), "Images/IssuesEnabled.svg");
    WI._consoleWarningsTabBarButton.imageType = WI.ButtonNavigationItem.ImageType.IMG;
    WI._consoleWarningsTabBarButton.hidden = true;
    WI._consoleWarningsTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
        WI.showConsoleTab({
            requestedScope: WI.LogContentView.Scopes.Warnings,
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.Dashboard,
        });
    }, WI);

    WI._consoleErrorsTabBarButton = new WI.ButtonNavigationItem("console-errors", WI.UIString("0 Console errors"), "Images/ErrorsEnabled.svg");
    WI._consoleErrorsTabBarButton.imageType = WI.ButtonNavigationItem.ImageType.IMG;
    WI._consoleErrorsTabBarButton.hidden = true;
    WI._consoleErrorsTabBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
        WI.showConsoleTab({
            requestedScope: WI.LogContentView.Scopes.Errors,
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.Dashboard,
        });
    }, WI);

    WI.tabBar.addNavigationItemBefore(new WI.GroupNavigationItem([
        WI._consoleWarningsTabBarButton,
        WI._consoleErrorsTabBarButton,
    ]));

    WI._updateInspectModeTabBarButton();
    WI._updateDownloadTabBarButton();
    WI._updateReloadTabBarButton();

    WI.consoleManager.addEventListener(WI.ConsoleManager.Event.MessageAdded, WI._updateConsoleTabBarButtons, WI);
    WI.consoleManager.addEventListener(WI.ConsoleManager.Event.PreviousMessageRepeatCountUpdated, WI._updateConsoleTabBarButtons, WI);
    WI.consoleManager.addEventListener(WI.ConsoleManager.Event.Cleared, WI._updateConsoleTabBarButtons, WI);
    WI._updateConsoleTabBarButtons();

    if (supportsDockRight || supportsDockLeft || supportsDockBottom) {
        WI._dockedResizerElement = document.getElementById("docked-resizer");
        WI._dockedResizerElement.classList.add(WI.Popover.IgnoreAutoDismissClassName);
        WI._dockedResizerElement.addEventListener("mousedown", WI._handleDockedResizerMouseDown);
    }

    if (supportsUndocked) {
        let undockedTitleAreaElement = document.getElementById("undocked-title-area");
        undockedTitleAreaElement.addEventListener("mousedown", WI._handleUndockedTitleAreaMouseDown);
    }

    WI._dockingAvailable = false;

    WI._updateDockNavigationItems();
    WI._setupViewHierarchy();

    // These tabs are always available for selecting, modulo isTabAllowed().
    // Other tabs may be engineering-only or toggled at runtime if incomplete.
    let productionTabClasses = [
        WI.ElementsTabContentView,
        WI.NetworkTabContentView,
        WI.SourcesTabContentView,
        WI.TimelineTabContentView,
        WI.StorageTabContentView,
        WI.GraphicsTabContentView,
        WI.LayersTabContentView,
        WI.AuditTabContentView,
        WI.ConsoleTabContentView,
        WI.SearchTabContentView,
        WI.SettingsTabContentView,
    ];

    WI._knownTabClassesByType = new Map;
    // Set tab classes directly. The public API triggers other updates and
    // notifications that won't work or have no listeners at WI point.
    for (let tabClass of productionTabClasses)
        WI._knownTabClassesByType.set(tabClass.Type, tabClass);

    WI._pendingOpenTabs = [];

    WI._searchTabContentView = new WI.SearchTabContentView;
    WI.tabBrowser.addTabForContentView(WI._searchTabContentView, {suppressAnimations: true});

    WI._settingsTabContentView = new WI.SettingsTabContentView;
    WI.tabBrowser.addTabForContentView(WI._settingsTabContentView, {suppressAnimations: true});

    // Previously we may have stored duplicates in WI setting. Avoid creating duplicate tabs.
    let openTabTypes = WI._openTabsSetting.value;
    let seenTabTypes = new Set;

    for (let i = 0; i < openTabTypes.length; ++i) {
        let tabType = openTabTypes[i];

        if (seenTabTypes.has(tabType))
            continue;
        seenTabTypes.add(tabType);

        if (!WI.isTabTypeAllowed(tabType)) {
            WI._pendingOpenTabs.push({tabType, index: i});
            continue;
        }

        if (!WI.isNewTabWithTypeAllowed(tabType))
            continue;

        let tabContentView = WI._createTabContentViewForType(tabType);
        if (!tabContentView)
            continue;
        WI.tabBrowser.addTabForContentView(tabContentView, {suppressAnimations: true});
    }

    WI._restoreCookieForOpenTabs(WI.StateRestorationType.Load);

    if (WI.tabBar.normalTabCount)
        WI.tabBar.selectedTabBarItem = WI._selectedTabIndexSetting.value;
    else {
        // If no tabs were able to be restored, show all tabs that are allowed.
        for (let tabType of WI._openTabsSetting.defaultValue) {
            if (WI.isNewTabWithTypeAllowed(tabType))
                WI.createNewTabWithType(tabType)
        }
        WI.tabBar.selectedTabBarItem = 0;
    }

    // Listen to the events after restoring the saved tabs to avoid recursion.
    WI.tabBar.addEventListener(WI.TabBar.Event.TabBarItemAdded, WI._rememberOpenTabs, WI);
    WI.tabBar.addEventListener(WI.TabBar.Event.TabBarItemRemoved, WI._rememberOpenTabs, WI);
    WI.tabBar.addEventListener(WI.TabBar.Event.TabBarItemsReordered, WI._rememberOpenTabs, WI);
    
    WI._updateLayoutMode();
    WI.settings.enableNarrowLayoutMode.addEventListener(WI.Setting.Event.Changed, WI._updateLayoutMode, WI);

    function updateConsoleSavedResultPrefixCSSVariable() {
        document.body.style.setProperty("--console-saved-result-prefix", "\"" + WI.RuntimeManager.preferredSavedResultPrefix() + "\"");
    }

    WI.settings.consoleSavedResultAlias.addEventListener(WI.Setting.Event.Changed, updateConsoleSavedResultPrefixCSSVariable, WI);

    updateConsoleSavedResultPrefixCSSVariable();

    function updateZoomFactorCSSVariable() {
        document.body.style.setProperty("--zoom-factor", WI.settings.zoomFactor.value);
    }

    WI.settings.zoomFactor.addEventListener(WI.Setting.Event.Changed, updateZoomFactorCSSVariable, WI);

    updateZoomFactorCSSVariable();

    WI.settings.frontendAppearance.addEventListener(WI.Setting.Event.Changed, function(event) {
        InspectorFrontendHost.setForcedAppearance(WI.settings.frontendAppearance.value);
    }, WI);

    // Signal that the frontend is now ready to receive messages.
    WI._backendTargetAvailablePromise.promise.then(() => {
        InspectorFrontendAPI.loadCompleted();
    });

    WI._updateSheetRect();

    // Tell the InspectorFrontendHost we loaded, which causes the window to display
    // and pending InspectorFrontendAPI commands to be sent.
    InspectorFrontendHost.loaded();

    if (WI._showingSplitConsoleSetting.value)
        WI.showSplitConsole();

    // Store WI on the window in case the WebInspector global gets corrupted.
    window.__frontendCompletedLoad = true;

    WI.frontendCompletedLoadTimestamp = performance.now();

    if (WI.runBootstrapOperations)
        WI.runBootstrapOperations();

    if (InspectorFrontendHost.supportsDiagnosticLogging) {
        WI.diagnosticController = new WI.DiagnosticController;
        WI.diagnosticController.addRecorder(new WI.InspectedTargetTypesDiagnosticEventRecorder(WI.diagnosticController));
        WI.diagnosticController.addRecorder(new WI.TabActivityDiagnosticEventRecorder(WI.diagnosticController));
        WI.diagnosticController.addRecorder(new WI.TabNavigationDiagnosticEventRecorder(WI.diagnosticController));

        if (InspectorFrontendHost.supportsWebExtensions)
            WI.diagnosticController.addRecorder(new WI.ExtensionTabActivationDiagnosticEventRecorder(WI.diagnosticController));
    }
};

WI.performOneTimeFrontendInitializationsUsingTarget = function(target)
{
    if (!WI.__didPerformConsoleInitialization && target.hasDomain("Console")) {
        WI.__didPerformConsoleInitialization = true;
        WI.consoleManager.initializeLogChannels(target);
    }

    if (!WI.__didPerformCSSInitialization && target.hasDomain("CSS")) {
        WI.__didPerformCSSInitialization = true;
        WI.cssManager.initializeCSSPropertyNameCompletions(target);
    }
};

WI.initializeTarget = function(target)
{
    if (target.hasDomain("Page")) {
        // COMPATIBILITY (iOS 13.4): Page.setShowRulers was removed.
        if (target.hasCommand("Page.setShowRulers") && WI.settings.showRulers.value)
            target.PageAgent.setShowRulers(true).catch((error) => {
                // FIXME <rdar://105244623> iOS platforms without a matching legacy protocol definition will fall back to the local macOS protocol definition.
                console.error(error);
            });
    }
};

WI.targetsAvailable = function()
{
    return WI._pageTargetAvailablePromise.settled;
};

WI.whenTargetsAvailable = function()
{
    return WI._pageTargetAvailablePromise.promise;
};

WI.isTabTypeAllowed = function(tabType)
{
    let tabClass = WI._knownTabClassesByType.get(tabType);
    if (!tabClass)
        return false;

    return tabClass.isTabAllowed();
};

WI.knownTabClasses = function()
{
    return new Set(WI._knownTabClassesByType.values());
};

WI._showOpenResourceDialog = function()
{
    if (!WI._openResourceDialog)
        WI._openResourceDialog = new WI.OpenResourceDialog(WI);

    if (WI._openResourceDialog.visible)
        return;

    WI._openResourceDialog.present(WI._contentElement);
};

WI._createTabContentViewForType = function(tabType)
{
    let tabClass = WI._knownTabClassesByType.get(tabType);
    if (!tabClass) {
        console.error("Unknown tab type", tabType);
        return null;
    }

    console.assert(tabClass !== WI.WebInspectorExtensionTabContentView, "Extension tabs must be created via WebInspectorExtensionController.createTabForExtension().");
    if (tabClass === WI.WebInspectorExtensionTabContentView)
        return null;

    console.assert(WI.TabContentView.isPrototypeOf(tabClass));
    return new tabClass;
};

WI._rememberOpenTabs = function()
{
    let seenTabTypes = new Set;
    let openTabs = [];

    for (let tabBarItem of WI.tabBar.tabBarItems) {
        let tabContentView = tabBarItem.representedObject;
        if (!(tabContentView instanceof WI.TabContentView))
            continue;
        if (!tabContentView.constructor.shouldSaveTab())
            continue;
        console.assert(tabContentView.type, "Tab type can't be null, undefined, or empty string", tabContentView.type, tabContentView);
        openTabs.push(tabContentView.type);
        seenTabTypes.add(tabContentView.type);
    }

    // Keep currently unsupported tabs in the setting at their previous index.
    for (let {tabType, index} of WI._pendingOpenTabs) {
        if (seenTabTypes.has(tabType))
            continue;
        openTabs.insertAtIndex(tabType, index);
        seenTabTypes.add(tabType);
    }

    WI._openTabsSetting.value = openTabs;
};

WI._handleSettingsKeyboardShortcut = function(event)
{
    if (event.keyIdentifier === "U+002C") { // ","
        WI.tabBrowser.showTabForContentView(WI._settingsTabContentView, {
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.KeyboardShortcut,
        });
    }
};

WI._tryToRestorePendingTabs = function()
{
    let stillPendingOpenTabs = [];
    for (let {tabType, index} of WI._pendingOpenTabs) {
        if (!WI.isTabTypeAllowed(tabType)) {
            stillPendingOpenTabs.push({tabType, index});
            continue;
        }

        let tabContentView = WI._createTabContentViewForType(tabType);
        if (!tabContentView)
            continue;

        WI.tabBrowser.addTabForContentView(tabContentView, {
            suppressAnimations: true,
            insertionIndex: index,
        });

        tabContentView.restoreStateFromCookie(WI.StateRestorationType.Load);
    }

    WI._pendingOpenTabs = stillPendingOpenTabs;
};

WI.isNewTabWithTypeAllowed = function(tabType)
{
    if (tabType === WI.WebInspectorExtensionTabContentView.Type)
        return false;

    let tabClass = WI._knownTabClassesByType.get(tabType);
    if (!tabClass || !tabClass.isTabAllowed())
        return false;

    // Only allow one tab per class for now.
    for (let tabBarItem of WI.tabBar.tabBarItems) {
        let tabContentView = tabBarItem.representedObject;
        if (!(tabContentView instanceof WI.TabContentView))
            continue;
        if (tabContentView.constructor === tabClass)
            return false;
    }

    return true;
};

WI.createNewTabWithType = function(tabType, options = {})
{
    console.assert(WI.isNewTabWithTypeAllowed(tabType));

    let {referencedView, shouldReplaceTab, shouldShowNewTab} = options;
    console.assert(!referencedView || referencedView instanceof WI.TabContentView, referencedView);
    console.assert(!shouldReplaceTab || referencedView, "Must provide a reference view to replace a tab.");

    let tabContentView = WI._createTabContentViewForType(tabType);
    const suppressAnimations = true;
    WI.tabBrowser.addTabForContentView(tabContentView, {
        suppressAnimations,
        insertionIndex: referencedView ? WI.tabBar.tabBarItems.indexOf(referencedView.tabBarItem) : undefined,
    });

    if (shouldReplaceTab)
        WI.tabBrowser.closeTabForContentView(referencedView, {...options, suppressAnimations});

    if (shouldShowNewTab)
        WI.tabBrowser.showTabForContentView(tabContentView, options);
};

// COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type
WI.activateExtraDomains = function(domains)
{
    WI.notifications.dispatchEventToListeners(WI.Notification.ExtraDomainsActivated, {domains});

    if (WI.mainTarget) {
        if (!WI.pageTarget && WI.mainTarget.hasDomain("DOM"))
            WI.pageTarget = WI.mainTarget;

        if (WI.mainTarget.hasDomain("CSS"))
            WI.cssManager.initializeCSSPropertyNameCompletions(WI.assumingMainTarget());

        if (WI.mainTarget.hasDomain("DOM"))
            WI.domManager.ensureDocument();

        if (WI.mainTarget.hasDomain("Page"))
            WI.networkManager.initializeTarget(WI.mainTarget);
    }

    WI._updateInspectModeTabBarButton();
    WI._updateDownloadTabBarButton();
    WI._updateReloadTabBarButton();

    WI._tryToRestorePendingTabs();
};

WI.updateWindowTitle = function()
{
    var mainFrame = WI.networkManager.mainFrame;
    if (!mainFrame)
        return;

    var urlComponents = mainFrame.mainResource.urlComponents;

    var lastPathComponent;
    try {
        lastPathComponent = decodeURIComponent(urlComponents.lastPathComponent || "");
    } catch {
        lastPathComponent = urlComponents.lastPathComponent;
    }

    // Build a title based on the URL components.
    if (urlComponents.host && lastPathComponent)
        var title = WI.displayNameForHost(urlComponents.host) + " \u2014 " + lastPathComponent;
    else if (urlComponents.host)
        var title = WI.displayNameForHost(urlComponents.host);
    else if (lastPathComponent)
        var title = lastPathComponent;
    else
        var title = mainFrame.url;

    // The name "inspectedURLChanged" sounds like the whole URL is required, however WI is only
    // used for updating the window title and it can be any string.
    InspectorFrontendHost.inspectedURLChanged(title);
};

WI.updateDockingAvailability = function(available)
{
    WI._dockingAvailable = available;

    WI._updateDockNavigationItems();

    if (!WI._dockingAvailable)
        WI.updateDockedState(WI.DockConfiguration.Undocked);
};

WI.updateDockedState = function(side)
{
    if (WI.dockConfiguration === side)
        return;

    WI._previousDockConfiguration = WI.dockConfiguration;

    if (!WI._previousDockConfiguration) {
        if (side === WI.DockConfiguration.Right || side === WI.DockConfiguration.Left)
            WI._previousDockConfiguration = WI.DockConfiguration.Bottom;
        else
            WI._previousDockConfiguration = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? WI.DockConfiguration.Left : WI.DockConfiguration.Right;
    }

    WI.dockConfiguration = side;

    switch (WI.dockConfiguration) {
    case WI.DockConfiguration.Bottom:
        document.body.classList.add("docked", WI.DockConfiguration.Bottom);
        document.body.classList.remove("window-inactive", WI.DockConfiguration.Right, WI.DockConfiguration.Left);
        break;

    case WI.DockConfiguration.Right:
        document.body.classList.add("docked", WI.DockConfiguration.Right);
        document.body.classList.remove("window-inactive", WI.DockConfiguration.Bottom, WI.DockConfiguration.Left);
        break;

    case WI.DockConfiguration.Left:
        document.body.classList.add("docked", WI.DockConfiguration.Left);
        document.body.classList.remove("window-inactive", WI.DockConfiguration.Bottom, WI.DockConfiguration.Right);
        break;

    default:
        document.body.classList.remove("docked", WI.DockConfiguration.Right, WI.DockConfiguration.Left, WI.DockConfiguration.Bottom);
        break;
    }

    WI._updateDockNavigationItems();

    if (!WI.dockedConfigurationSupportsSplitContentBrowser() && !WI.doesCurrentTabSupportSplitContentBrowser())
        WI.hideSplitConsole();

    if (side === WI.DockConfiguration.Undocked && WI.Platform.name === "mac") {
        // When undocking, the first visible focusable element steals focus. Undo this.
        document.body.addEventListener("focusin", function(event) {
            let firstFocusableElement = document.querySelector("[tabindex='0']:not(.hidden)");
            if (firstFocusableElement === event.target) {
                if (WI.previousFocusElement)
                    WI.previousFocusElement.focus();
                else
                    event.target.blur();
            }
        }, {once: true, capture: true});
    }
};

WI.resizeDockedFrameMouseDown = function(event)
{
    console.assert(WI.dockConfiguration && WI.dockConfiguration !== WI.DockConfiguration.Undocked);

    if (event.button !== 0 || event.ctrlKey)
        return;

    event[WI.Popover.EventPreventDismissSymbol] = true;

    let isDockedBottom = WI.dockConfiguration === WI.DockConfiguration.Bottom;

    let windowProperty = isDockedBottom ? "innerHeight" : "innerWidth";
    let eventScreenProperty = isDockedBottom ? "screenY" : "screenX";
    let eventClientProperty = isDockedBottom ? "clientY" : "clientX";

    let resizerElement = event.target;
    let firstClientPosition = event[eventClientProperty];
    let lastScreenPosition = event[eventScreenProperty];

    function dividerDrag(event)
    {
        if (event.button !== 0)
            return;

        let position = event[eventScreenProperty];
        let delta = position - lastScreenPosition;
        let clientPosition = event[eventClientProperty];

        lastScreenPosition = position;

        if (WI.dockConfiguration === WI.DockConfiguration.Left) {
            // If the mouse is travelling rightward but is positioned left of the resizer, ignore the event.
            if (delta > 0 && clientPosition < firstClientPosition)
                return;

            // If the mouse is travelling leftward but is positioned to the right of the resizer, ignore the event.
            if (delta < 0 && clientPosition > window[windowProperty])
                return;

            // We later subtract the delta from the current position, but since the inspected view and inspector view
            // are flipped when docked to left, we want dragging to have the opposite effect from docked to right.
            delta *= -1;
        } else {
            // If the mouse is travelling downward/rightward but is positioned above/left of the resizer, ignore the event.
            if (delta > 0 && clientPosition < firstClientPosition)
                return;

            // If the mouse is travelling upward/leftward but is positioned below/right of the resizer, ignore the event.
            if (delta < 0 && clientPosition > firstClientPosition)
                return;
        }

        let dimension = Math.max(0, window[windowProperty] - delta);
        // If zoomed in/out, there be greater/fewer document pixels shown, but the inspector's
        // width or height should be the same in device pixels regardless of the document zoom.
        dimension *= WI.getZoomFactor();

        if (isDockedBottom)
            InspectorFrontendHost.setAttachedWindowHeight(dimension);
        else
            InspectorFrontendHost.setAttachedWindowWidth(dimension);
    }

    function elementDragEnd(event)
    {
        if (event.button !== 0)
            return;

        WI.elementDragEnd(event);
    }

    let cursor = isDockedBottom ? "row-resize" : "col-resize";
    WI.elementDragStart(resizerElement, dividerDrag, elementDragEnd, event, cursor);
};

WI.moveUndockedWindowMouseDown = function(event)
{
    console.assert(WI.dockConfiguration === WI.DockConfiguration.Undocked);

    if (event.button !== 0 || event.ctrlKey)
        return;

    event[WI.Popover.EventPreventDismissSymbol] = true;

    if (WI.Platform.name === "mac") {
        InspectorFrontendHost.startWindowDrag();
        event.preventDefault();
        return;
    }

    let lastScreenX = event.screenX;
    let lastScreenY = event.screenY;

    function dividerDrag(event) {
        if (event.button !== 0)
            return;

        let x = event.screenX - lastScreenX;
        let y = event.screenY - lastScreenY;

        InspectorFrontendHost.moveWindowBy(x, y);

        lastScreenX = event.screenX;
        lastScreenY = event.screenY;
    }

    function elementDragEnd(event) {
        if (event.button !== 0)
            return;

        WI.elementDragEnd(event);
    }

    const cursor = "default";
    WI.elementDragStart(event.target, dividerDrag, elementDragEnd, event, cursor);
};

WI.updateVisibilityState = function(visible)
{
    WI.visible = visible;
    WI.notifications.dispatchEventToListeners(WI.Notification.VisibilityStateDidChange);
};

WI.updateFindString = function(findString)
{
    if (!findString || WI.findString === findString)
        return false;

    WI.findString = findString;

    return true;
};

WI.handlePossibleLinkClick = function(event, options = {})
{
    let anchorElement = event.target.closest("a");
    if (!anchorElement || !anchorElement.href)
        return false;

    if (WI.isBeingEdited(anchorElement)) {
        // Don't follow the link when it is being edited.
        return false;
    }

    // Prevent the link from navigating, since we don't do any navigation by following links normally.
    event.preventDefault();
    event.stopPropagation();

    WI.openURL(anchorElement.href, {
        ...options,
        lineNumber: anchorElement.lineNumber,
        ignoreSearchTab: !WI.isShowingSearchTab(),
    });

    return true;
};

WI.openURL = function(url, {alwaysOpenExternally, frame, ...options} = {})
{
    console.assert(url);
    if (!url)
        return;

    // If alwaysOpenExternally is not defined, base it off the command/meta key for the current event.
    if (alwaysOpenExternally === undefined || alwaysOpenExternally === null)
        alwaysOpenExternally = window.event?.metaKey ?? false;

    if (alwaysOpenExternally) {
        InspectorFrontendHost.openURLExternally(url);
        return;
    }

    let searchChildFrames = false;
    if (!frame) {
        frame = WI.networkManager.mainFrame;
        searchChildFrames = true;
    }

    let resource;
    let simplifiedURL = removeURLFragment(url);
    if (frame) {
        // WI.Frame.resourceForURL does not check the main resource, only sub-resources. So check both.
        resource = frame.url === simplifiedURL ? frame.mainResource : frame.resourcesForURL(simplifiedURL, searchChildFrames).firstValue;
    } else if (WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker)
        resource = WI.mainTarget.resourceCollection.resourcesForURL(removeURLFragment(url)).firstValue;

    if (resource) {
        // Context menu selections may go through this code path; don't clobber the previously-set hint.
        if (!options.initiatorHint)
            options.initiatorHint = WI.TabBrowser.TabNavigationInitiator.LinkClick;

        console.assert(typeof options.lineNumber === "undefined" || typeof options.lineNumber === "number");
        let positionToReveal = new WI.SourceCodePosition(options.lineNumber, 0);
        WI.showSourceCode(resource, {...options, positionToReveal});
        return;
    }

    InspectorFrontendHost.openURLExternally(url);
};

WI.close = function()
{
    if (WI._isClosing)
        return;

    WI._isClosing = true;

    InspectorFrontendHost.closeWindow();
};

WI.isContentAreaFocused = function()
{
    return WI._contentElement.contains(document.activeElement);
}

WI.isConsoleFocused = function()
{
    return !WI._didAutofocusConsolePrompt && WI.quickConsole.prompt.focused;
};

WI.isShowingSplitConsole = function()
{
    return !WI.consoleDrawer.collapsed;
};

WI.dockedConfigurationSupportsSplitContentBrowser = function()
{
    return !WI.dockConfiguration || WI.dockConfiguration !== WI.DockConfiguration.Bottom;
};

WI.doesCurrentTabSupportSplitContentBrowser = function()
{
    var currentContentView = WI.tabBrowser.selectedTabContentView;
    return !currentContentView || currentContentView.supportsSplitContentBrowser;
};

WI.toggleSplitConsole = function()
{
    if (!WI.doesCurrentTabSupportSplitContentBrowser()) {
        WI.showConsoleTab();
        return;
    }

    if (WI.isShowingSplitConsole())
        WI.hideSplitConsole();
    else
        WI.showSplitConsole();
};

WI.showSplitConsole = function()
{
    if (!WI.doesCurrentTabSupportSplitContentBrowser()) {
        WI.showConsoleTab();
        return;
    }

    WI.consoleDrawer.collapsed = false;

    if (WI.consoleDrawer.currentContentView === WI.consoleContentView)
        return;

    WI.consoleDrawer.showContentView(WI.consoleContentView);
};

WI.hideSplitConsole = function()
{
    if (!WI.isShowingSplitConsole())
        return;

    WI.consoleDrawer.collapsed = true;
};

WI.showConsoleTab = function(options = {})
{
    WI.hideSplitConsole();

    if (options.requestedScope)
        WI.consoleContentView.scopeBar.item(options.requestedScope).selected = true;

    const cookie = null;
    WI.showRepresentedObject(WI._consoleRepresentedObject, cookie, options);

    console.assert(WI.isShowingConsoleTab());
};

WI.isShowingConsoleTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.ConsoleTabContentView;
};

WI.showElementsTab = function(options = {})
{
    var tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.ElementsTabContentView);
    if (!tabContentView)
        tabContentView = new WI.ElementsTabContentView;
    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.isShowingElementsTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.ElementsTabContentView;
};

WI.showSourcesTab = function(options = {})
{
    let tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.SourcesTabContentView);
    if (!tabContentView)
        tabContentView = new WI.SourcesTabContentView;

    if (options.representedObjectToSelect)
        tabContentView.revealAndSelectRepresentedObject(options.representedObjectToSelect);

    if (options.showScopeChainSidebar)
        tabContentView.showScopeChainDetailsSidebarPanel();

    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.isShowingSourcesTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.SourcesTabContentView;
};

WI.showStorageTab = function(options = {})
{
    var tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.StorageTabContentView);
    if (!tabContentView)
        tabContentView = new WI.StorageTabContentView;
    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.showNetworkTab = function(options = {})
{
    let tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.NetworkTabContentView);
    if (!tabContentView)
        tabContentView = new WI.NetworkTabContentView;

    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.isShowingNetworkTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.NetworkTabContentView;
};

WI.isShowingSearchTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.SearchTabContentView;
};

WI.showTimelineTab = function(options = {})
{
    var tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.TimelineTabContentView);
    if (!tabContentView)
        tabContentView = new WI.TimelineTabContentView;
    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.isShowingTimelineTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.TimelineTabContentView;
};

WI.isShowingAuditTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.AuditTabContentView;
}

WI.showLayersTab = function(options = {})
{
    let tabContentView = WI.tabBrowser.bestTabContentViewForClass(WI.LayersTabContentView);
    if (!tabContentView)
        tabContentView = new WI.LayersTabContentView;
    if (options.nodeToSelect)
        tabContentView.selectLayerForNode(options.nodeToSelect);
    WI.tabBrowser.showTabForContentView(tabContentView, options);
};

WI.isShowingLayersTab = function()
{
    return WI.tabBrowser.selectedTabContentView instanceof WI.LayersTabContentView;
};

WI.showSettingsTab = function(options = {})
{
    WI.tabBrowser.showTabForContentView(WI._settingsTabContentView, options);

    if (options.blackboxPatternToSelect)
        WI._settingsTabContentView.selectBlackboxPattern(options.blackboxPatternToSelect);
};

WI.indentString = function()
{
    if (WI.settings.indentWithTabs.value)
        return "\t";
    return " ".repeat(WI.settings.indentUnit.value);
};

WI.restoreFocusFromElement = function(element)
{
    if (element && element.contains(WI.currentFocusElement))
        WI.previousFocusElement.focus();
};

WI.toggleNavigationSidebar = function(event)
{
    if (!WI.navigationSidebar.collapsed || !WI.navigationSidebar.sidebarPanels.length) {
        WI.navigationSidebar.collapsed = true;
        return;
    }

    if (!WI.navigationSidebar.selectedSidebarPanel)
        WI.navigationSidebar.selectedSidebarPanel = WI.navigationSidebar.sidebarPanels[0];
    WI.navigationSidebar.collapsed = false;
};

WI.toggleDetailsSidebar = function(event)
{
    if (!WI.detailsSidebar.collapsed || !WI.detailsSidebar.sidebarPanels.length) {
        WI.detailsSidebar.collapsed = true;
        return;
    }

    if (!WI.detailsSidebar.selectedSidebarPanel)
        WI.detailsSidebar.selectedSidebarPanel = WI.detailsSidebar.sidebarPanels[0];
    WI.detailsSidebar.collapsed = false;
};

WI.getMaximumSidebarWidth = function(sidebar)
{
    console.assert(sidebar instanceof WI.Sidebar);

    const minimumContentBrowserWidth = 200; // Keep in sync with `#tab-browser`

    let minimumWidth = window.innerWidth - minimumContentBrowserWidth;
    let tabContentView = WI.tabBrowser.selectedTabContentView;
    console.assert(tabContentView);
    if (!tabContentView)
        return minimumWidth;

    if (tabContentView.navigationSidebarPanel && sidebar !== WI.navigationSidebar)
        minimumWidth -= WI.navigationSidebar.width;

    if (tabContentView.detailsSidebarPanels && sidebar !== WI.detailsSidebar) {
        // A sidebar within the detailsSidebar needs the minimum width of its sibilings.
        for (let singleDetailsSidebar of WI.detailsSidebar.sidebars) {
            if (sidebar !== singleDetailsSidebar)
                minimumWidth -= singleDetailsSidebar.width;
        }
    }

    return minimumWidth;
};

WI.getMaximumSidebarHeight = function(sidebar)
{
    console.assert(sidebar instanceof WI.Sidebar);
    return WI._contentElement.offsetHeight - WI.TabBrowser.MinimumHeight;
};

WI.tabContentViewClassForRepresentedObject = function(representedObject)
{
    if (representedObject instanceof WI.DOMTree)
        return WI.ElementsTabContentView;

    if (representedObject instanceof WI.TimelineRecording)
        return WI.TimelineTabContentView;

    // We only support one console tab right now. So WI isn't an instanceof check.
    if (representedObject === WI._consoleRepresentedObject)
        return WI.ConsoleTabContentView;

    if (representedObject instanceof WI.Frame
        || representedObject instanceof WI.FrameCollection
        || representedObject instanceof WI.Resource
        || representedObject instanceof WI.ResourceCollection
        || representedObject instanceof WI.Script
        || representedObject instanceof WI.ScriptCollection
        || representedObject instanceof WI.CSSStyleSheet
        || representedObject instanceof WI.CSSStyleSheetCollection)
        return WI.SourcesTabContentView;

    if (representedObject instanceof WI.DOMStorageObject || representedObject instanceof WI.CookieStorageObject ||
        representedObject instanceof WI.DatabaseTableObject || representedObject instanceof WI.DatabaseObject ||
        representedObject instanceof WI.ApplicationCacheFrame || representedObject instanceof WI.IndexedDatabaseObjectStore ||
        representedObject instanceof WI.IndexedDatabase || representedObject instanceof WI.IndexedDatabaseObjectStoreIndex)
        return WI.StorageTabContentView;

    if (representedObject instanceof WI.AuditTestCase || representedObject instanceof WI.AuditTestGroup
        || representedObject instanceof WI.AuditTestCaseResult || representedObject instanceof WI.AuditTestGroupResult)
        return WI.AuditTabContentView;

    if (representedObject instanceof WI.CanvasCollection
        || representedObject instanceof WI.Canvas
        || representedObject instanceof WI.Recording
        || representedObject instanceof WI.ShaderProgram
        || representedObject instanceof WI.AnimationCollection
        || representedObject instanceof WI.Animation)
        return WI.GraphicsTabContentView;

    return null;
};

WI.tabContentViewForRepresentedObject = function(representedObject, options = {})
{
    let tabContentView = WI.tabBrowser.bestTabContentViewForRepresentedObject(representedObject, options);
    if (tabContentView)
        return tabContentView;

    var tabContentViewClass = WI.tabContentViewClassForRepresentedObject(representedObject);
    if (!tabContentViewClass) {
        console.error("Unknown representedObject, couldn't create TabContentView.", representedObject);
        return null;
    }

    tabContentView = new tabContentViewClass;

    WI.tabBrowser.addTabForContentView(tabContentView);

    return tabContentView;
};

WI.showRepresentedObject = function(representedObject, cookie, options = {})
{
    let tabContentView = WI.tabContentViewForRepresentedObject(representedObject, options);
    console.assert(tabContentView);
    if (!tabContentView)
        return;

    WI.tabBrowser.showTabForContentView(tabContentView, options);
    tabContentView.showRepresentedObject(representedObject, cookie);
};

WI.showLocalResourceOverride = function(localResourceOverride, options = {})
{
    console.assert(localResourceOverride instanceof WI.LocalResourceOverride);

    let cookie = {preventHighlight: true};

    switch (localResourceOverride.type) {
    case WI.LocalResourceOverride.InterceptType.Response:
    case WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory:
    case WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork:
        if (options.overriddenResource) {
            const onlyExisting = true;
            let contentView = WI.ContentView.contentViewForRepresentedObject(options.overriddenResource, onlyExisting);

            let textEditor = null;
            if (contentView instanceof WI.ResourceClusterContentView)
                contentView = contentView.responseContentView;
            if (contentView instanceof WI.TextResourceContentView)
                textEditor = contentView.textEditor;

            if (textEditor) {
                let selectedTextRange = textEditor.selectedTextRange;
                cookie.startLine = selectedTextRange.startLine;
                cookie.startColumn = selectedTextRange.startColumn;
                cookie.endLine = selectedTextRange.endLine;
                cookie.endColumn = selectedTextRange.endColumn;

                let scrollOffset = textEditor.scrollOffset;
                cookie.scrollOffsetX = scrollOffset.x;
                cookie.scrollOffsetY = scrollOffset.y;
            }
        }
        break;
    }

    WI.showRepresentedObject(localResourceOverride, cookie, {...options, ignoreNetworkTab: true, ignoreSearchTab: true});
};

WI.showMainFrameDOMTree = function(nodeToSelect, options = {})
{
    console.assert(WI.networkManager.mainFrame);
    if (!WI.networkManager.mainFrame)
        return;
    WI.showRepresentedObject(WI.networkManager.mainFrame.domTree, {nodeToSelect}, options);
};

WI.showSourceCodeForFrame = function(frameIdentifier, options = {})
{
    var frame = WI.networkManager.frameForIdentifier(frameIdentifier);
    if (!frame) {
        WI._frameIdentifierToShowSourceCodeWhenAvailable = frameIdentifier;
        return;
    }

    WI._frameIdentifierToShowSourceCodeWhenAvailable = undefined;

    const cookie = null;
    WI.showRepresentedObject(frame, cookie, options);
};

WI.showSourceCode = function(sourceCode, options = {})
{
    const positionToReveal = options.positionToReveal;

    console.assert(!positionToReveal || positionToReveal instanceof WI.SourceCodePosition, positionToReveal);
    var representedObject = sourceCode;

    if (representedObject instanceof WI.Script) {
        // A script represented by a resource should always show the resource.
        representedObject = representedObject.resource || representedObject;
    }

    var cookie = positionToReveal ? {lineNumber: positionToReveal.lineNumber, columnNumber: positionToReveal.columnNumber} : {};
    WI.showRepresentedObject(representedObject, cookie, options);
};

WI.showSourceCodeLocation = function(sourceCodeLocation, options = {})
{
    WI.showSourceCode(sourceCodeLocation.displaySourceCode, {
        ...options,
        positionToReveal: sourceCodeLocation.displayPosition(),
    });
};

WI.showOriginalUnformattedSourceCodeLocation = function(sourceCodeLocation, options = {})
{
    WI.showSourceCode(sourceCodeLocation.sourceCode, {
        ...options,
        positionToReveal: sourceCodeLocation.position(),
        forceUnformatted: true,
    });
};

WI.showOriginalOrFormattedSourceCodeLocation = function(sourceCodeLocation, options = {})
{
    WI.showSourceCode(sourceCodeLocation.sourceCode, {
        ...options,
        positionToReveal: sourceCodeLocation.formattedPosition(),
    });
};

WI.showOriginalOrFormattedSourceCodeTextRange = function(sourceCodeTextRange, options = {})
{
    var textRangeToSelect = sourceCodeTextRange.formattedTextRange;
    WI.showSourceCode(sourceCodeTextRange.sourceCode, {
        ...options,
        positionToReveal: textRangeToSelect.startPosition(),
        textRangeToSelect,
    });
};

WI.showResourceRequest = function(resource, options = {})
{
    WI.showRepresentedObject(resource, {[WI.ResourceClusterContentView.ContentViewIdentifierCookieKey]: WI.ResourceClusterContentView.Identifier.Request}, options);
};

WI.debuggerToggleBreakpoints = function(event)
{
    WI.debuggerManager.breakpointsEnabled = !WI.debuggerManager.breakpointsEnabled;
};

WI.debuggerPauseResumeToggle = function(event)
{
    if (WI.debuggerManager.paused)
        WI.debuggerManager.resume();
    else
        WI.debuggerManager.pause();
};

WI.debuggerStepNext = function(event)
{
    WI.debuggerManager.stepNext();
};

WI.debuggerStepOver = function(event)
{
    WI.debuggerManager.stepOver();
};

WI.debuggerStepInto = function(event)
{
    WI.debuggerManager.stepInto();
};

WI.debuggerStepOut = function(event)
{
    WI.debuggerManager.stepOut();
};

WI._focusSearchField = function(event)
{
    let searchQuery = "";

    if (WI.settings.searchFromSelection.value) {
        let selection = window.getSelection();
        if (selection.type === "Range" || !selection.isCollapsed)
            searchQuery = selection.toString().removeWordBreakCharacters();
    }

    WI.tabBrowser.showTabForContentView(WI._searchTabContentView, {
        // Classify this as a keyboard shortcut, as the only other way to get to Search Tab is via TabBar itself.
        initiatorHint: WI.TabBrowser.TabNavigationInitiator.KeyboardShortcut,
    });

    WI._searchTabContentView.focusSearchField();

    if (searchQuery)
        WI._searchTabContentView.performSearch(searchQuery);
};

WI._focusChanged = function(event)
{
    WI._didAutofocusConsolePrompt = false;

    // Make a caret selection inside the focused element if there isn't a range selection and there isn't already
    // a caret selection inside. This is needed (at least) to remove caret from console when focus is moved.
    // The selection change should not apply to text fields and text areas either.

    if (WI.isEventTargetAnEditableField(event)) {
        // Still update the currentFocusElement if inside of a CodeMirror editor or an input element.
        let newFocusElement = null;
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
            newFocusElement = event.target;
        else {
            let codeMirror = WI.enclosingCodeMirror(event.target);
            if (codeMirror) {
                let codeMirrorElement = codeMirror.getWrapperElement();
                if (codeMirrorElement && codeMirrorElement !== WI.currentFocusElement)
                    newFocusElement = codeMirrorElement;
            }
        }

        if (newFocusElement) {
            WI.previousFocusElement = WI.currentFocusElement;
            WI.currentFocusElement = newFocusElement;
        }

        // Due to the change in WI.isEventTargetAnEditableField (r196271), WI return
        // will also get run when WI.startEditing is called on an element. We do not want
        // to return early in WI case, as WI.EditingConfig handles its own editing
        // completion, so only return early if the focus change target is not from WI.startEditing.
        if (!WI.isBeingEdited(event.target))
            return;
    }

    var selection = window.getSelection();
    if (!selection.isCollapsed)
        return;

    var element = event.target;

    if (element !== WI.currentFocusElement) {
        WI.previousFocusElement = WI.currentFocusElement;
        WI.currentFocusElement = element;
    }

    if (element.isInsertionCaretInside())
        return;

    var selectionRange = element.ownerDocument.createRange();
    selectionRange.setStart(element, 0);
    selectionRange.setEnd(element, 0);

    selection.removeAllRanges();
    selection.addRange(selectionRange);
};

WI._mouseWasClicked = function(event)
{
    WI.handlePossibleLinkClick(event);
};

WI._handleDragOver = function(event)
{
    // Do nothing if another event listener handled the event already.
    if (event.defaultPrevented)
        return;

    // Allow dropping into editable areas.
    if (WI.isEventTargetAnEditableField(event))
        return;

    // Prevent the drop from being accepted.
    event.dataTransfer.dropEffect = "none";
    event.preventDefault();
};

WI._debuggerDidPause = function(event)
{
    WI.showSourcesTab({showScopeChainSidebar: WI.settings.showScopeChainOnPause.value});
    WI._updateDebuggerKeyboardShortcuts();

    InspectorFrontendHost.bringToFront();
};

WI._debuggerDidResume = function(event)
{
    WI._updateDebuggerKeyboardShortcuts();
};

WI._updateDebuggerKeyboardShortcuts = function()
{
    let paused = WI.debuggerManager.paused;

    WI.stepOverKeyboardShortcut.disabled = !paused;
    WI.stepIntoKeyboardShortcut.disabled = !paused;
    WI.stepOutKeyboardShortcut.disabled = !paused;
    WI.stepOverAlternateKeyboardShortcut.disabled = !paused;
    WI.stepIntoAlternateKeyboardShortcut.disabled = !paused;
    WI.stepOutAlternateKeyboardShortcut.disabled = !paused;

    // COMPATIBILITY (iOS 13.4): Debugger.stepNext did not exist.
    if (InspectorBackend.hasCommand("Debugger.stepNext")) {
        WI.stepNextKeyboardShortcut.disabled = !paused;
        WI.stepNextAlternateKeyboardShortcut.disabled = !paused;
    }
};

WI._frameWasAdded = function(event)
{
    if (!WI._frameIdentifierToShowSourceCodeWhenAvailable)
        return;

    var frame = event.data.frame;
    if (frame.id !== WI._frameIdentifierToShowSourceCodeWhenAvailable)
        return;

    function delayedWork()
    {
        const options = {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };
        WI.showSourceCodeForFrame(frame.id, options);
    }

    // Delay showing the frame since FrameWasAdded is called before MainFrameChanged.
    // Calling showSourceCodeForFrame before MainFrameChanged will show the frame then close it.
    setTimeout(delayedWork);
};

WI._mainFrameDidChange = function(event)
{
    WI._updateDownloadTabBarButton();

    WI.updateWindowTitle();
};

WI._mainResourceDidChange = function(event)
{
    if (!event.target.isMainFrame())
        return;

    // Run cookie restoration after we are sure all of the Tabs and NavigationSidebarPanels
    // have updated with respect to the main resource change.
    setTimeout(() => {
        WI._restoreCookieForOpenTabs(WI.StateRestorationType.Navigation);
    });

    WI._updateDownloadTabBarButton();

    WI.updateWindowTitle();
};

WI._provisionalLoadStarted = function(event)
{
    if (!event.target.isMainFrame())
        return;

    WI._saveCookieForOpenTabs();
};

WI._restoreCookieForOpenTabs = function(restorationType)
{
    for (var tabBarItem of WI.tabBar.tabBarItems) {
        var tabContentView = tabBarItem.representedObject;
        if (!(tabContentView instanceof WI.TabContentView))
            continue;
        if (!tabContentView.constructor.shouldSaveTab())
            continue;
        tabContentView.restoreStateFromCookie(restorationType);
    }

    // Only attempt to autofocus when Web Inspector is first opened.
    if (WI._didAutofocusConsolePrompt === undefined) {
        window.requestAnimationFrame(() => {
            if (WI.isContentAreaFocused() || WI.isShowingTimelineTab() || WI.isShowingAuditTab())
                return;

            WI.quickConsole.prompt.focus();
            WI._didAutofocusConsolePrompt = true;
        });
    }
};

WI._saveCookieForOpenTabs = function()
{
    for (var tabBarItem of WI.tabBar.tabBarItems) {
        var tabContentView = tabBarItem.representedObject;
        if (!(tabContentView instanceof WI.TabContentView))
            continue;
        if (!tabContentView.constructor.shouldSaveTab())
            continue;
        tabContentView.saveStateToCookie();
    }
};

WI._updateWindowInactiveState = function(event)
{
    // FIXME: We should use the :window-inactive pseudo class once https://webkit.org/b/38927 is fixed.

    if (document.activeElement?.tagName === "IFRAME") {
        // An active iframe means an extension tab is active and we can't tell when the window blurs due to cross-origin restrictions.
        // In this case we need to keep checking to know if the window loses focus since there is no event we can use.
        setTimeout(WI._updateWindowInactiveState, 250);
    }

    let inactive = !document.hasFocus();
    document.body.classList.toggle(WI.dockConfiguration === WI.DockConfiguration.Undocked ? "window-inactive" : "window-docked-inactive", inactive);
};

WI._windowResized = function(event)
{
    WI._updateLayoutMode();
    WI.tabBar.updateLayout(WI.View.LayoutReason.Resize);
    WI._updateSheetRect();
};

WI._updateLayoutMode = function()
{
    let computedMode = WI.LayoutMode.Default;
    
    if (WI.settings.enableNarrowLayoutMode.value && window.innerWidth < WI.NarrowLayoutMaximumWidth)
        computedMode = WI.LayoutMode.Narrow;
    
    if (WI.layoutMode !== computedMode) {
        WI.layoutMode = computedMode;
        document.body.classList.toggle("narrow", WI.layoutMode === WI.LayoutMode.Narrow);
        WI.detailsSidebar.updateLayout(WI.View.LayoutReason.Resize);
    }
    
    WI._tabBrowserSizeDidChange();
};

WI._updateSheetRect = function()
{
    let mainElementRect = document.getElementById("main").getBoundingClientRect();
    InspectorFrontendHost.setSheetRect(mainElementRect.x, mainElementRect.y, mainElementRect.width, mainElementRect.height);
};

WI._updateModifierKeys = function(event)
{
    let keys = {
        altKey: event.altKey,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
    };

    let changed = !Object.shallowEqual(WI.modifierKeys, keys);

    WI.modifierKeys = keys;

    document.body.classList.toggle("alt-key-pressed", WI.modifierKeys.altKey);
    document.body.classList.toggle("ctrl-key-pressed", WI.modifierKeys.ctrlKey);
    document.body.classList.toggle("meta-key-pressed", WI.modifierKeys.metaKey);
    document.body.classList.toggle("shift-key-pressed", WI.modifierKeys.shiftKey);

    if (changed)
        WI.notifications.dispatchEventToListeners(WI.Notification.GlobalModifierKeysDidChange, event);
};

WI._windowKeyDown = function(event)
{
    WI._updateModifierKeys(event);
};

WI._windowKeyUp = function(event)
{
    WI._updateModifierKeys(event);
};

WI._mouseMoved = function(event)
{
    WI._updateModifierKeys(event);
    WI.mouseCoords = {
        x: event.pageX,
        y: event.pageY
    };
};

WI._pageHidden = function(event)
{
    WI._saveCookieForOpenTabs();
};

WI._contextMenuRequested = function(event)
{
    let proposedContextMenu;

    // This is setting is only defined in engineering builds.
    if (WI.isDebugUIEnabled()) {
        proposedContextMenu = WI.ContextMenu.createFromEvent(event);
        proposedContextMenu.appendSeparator();
        proposedContextMenu.appendItem(WI.unlocalizedString("Reload Web Inspector"), () => {
            InspectorFrontendHost.reopen();
        });

        let protocolSubMenu = proposedContextMenu.appendSubMenuItem(WI.unlocalizedString("Protocol Debugging"), null, false);
        let isCapturingTraffic = InspectorBackend.activeTracer instanceof WI.CapturingProtocolTracer;

        protocolSubMenu.appendCheckboxItem(WI.unlocalizedString("Capture Trace"), () => {
            if (isCapturingTraffic)
                InspectorBackend.activeTracer = null;
            else
                InspectorBackend.activeTracer = new WI.CapturingProtocolTracer;
        }, isCapturingTraffic);

        let trace = InspectorBackend.activeTracer?.trace;
        if (trace && WI.FileUtilities.canSave(trace.saveMode)) {
            protocolSubMenu.appendSeparator();

            protocolSubMenu.appendItem(WI.unlocalizedString("Export Trace\u2026"), () => {
                const forceSaveAs = true;
                WI.FileUtilities.save(trace.saveMode, trace.saveData, forceSaveAs);
            }, !isCapturingTraffic);
        }
    } else {
        const onlyExisting = true;
        proposedContextMenu = WI.ContextMenu.createFromEvent(event, onlyExisting);
    }

    if (proposedContextMenu)
        proposedContextMenu.show();
};

WI.isDebugUIEnabled = function()
{
    return WI.showDebugUISetting && WI.showDebugUISetting.value;
};

WI._undock = function(event)
{
    InspectorFrontendHost.requestSetDockSide(WI.DockConfiguration.Undocked);
};

WI._dockBottom = function(event)
{
    InspectorFrontendHost.requestSetDockSide(WI.DockConfiguration.Bottom);
};

WI._dockRight = function(event)
{
    InspectorFrontendHost.requestSetDockSide(WI.DockConfiguration.Right);
};

WI._dockLeft = function(event)
{
    InspectorFrontendHost.requestSetDockSide(WI.DockConfiguration.Left);
};

WI._togglePreviousDockConfiguration = function(event)
{
    InspectorFrontendHost.requestSetDockSide(WI._previousDockConfiguration);
};

WI._updateDockNavigationItems = function()
{
    let docked = WI.dockedConfigurationSupportsSplitContentBrowser && WI.dockConfiguration !== WI.DockConfiguration.Undocked;

    if (WI._dockingAvailable || docked) {
        if (WI._closeTabBarButton)
            WI._closeTabBarButton.hidden = !docked;
        if (WI._dockLeftTabBarButton)
            WI._dockLeftTabBarButton.hidden = WI.dockConfiguration === WI.DockConfiguration.Left;
        if (WI._dockBottomTabBarButton)
            WI._dockBottomTabBarButton.hidden = WI.dockConfiguration === WI.DockConfiguration.Bottom;
        if (WI._dockRightTabBarButton)
            WI._dockRightTabBarButton.hidden = WI.dockConfiguration === WI.DockConfiguration.Right;
        if (WI._undockTabBarButton)
            WI._undockTabBarButton.hidden = WI.dockConfiguration === WI.DockConfiguration.Undocked;
    } else {
        if (WI._closeTabBarButton)
            WI._closeTabBarButton.hidden = true;
        if (WI._dockLeftTabBarButton)
            WI._dockLeftTabBarButton.hidden = true;
        if (WI._dockBottomTabBarButton)
            WI._dockBottomTabBarButton.hidden = true;
        if (WI._dockRightTabBarButton)
            WI._dockRightTabBarButton.hidden = true;
        if (WI._undockTabBarButton)
            WI._undockTabBarButton.hidden = true;
    }

    WI._updateTabBarDividers();

    WI.tabBar.resetCachedWidths();
};

WI._tabBrowserSizeDidChange = function()
{
    WI.tabBrowser.updateLayout(WI.View.LayoutReason.Resize);
    WI.consoleDrawer.updateLayout(WI.View.LayoutReason.Resize);
    WI.quickConsole.updateLayout(WI.View.LayoutReason.Resize);
};

WI._consoleDrawerCollapsedStateDidChange = function(event)
{
    WI._showingSplitConsoleSetting.value = WI.isShowingSplitConsole();

    WI._consoleDrawerDidResize();
};

WI._consoleDrawerDidResize = function(event)
{
    WI.tabBrowser.updateLayout(WI.View.LayoutReason.Resize);
};

WI._sidebarSizeDidChange = function(event)
{
    WI._tabBrowserSizeDidChange();
};

WI._setupViewHierarchy = function()
{
    let rootView = WI.View.rootView();
    rootView.addSubview(WI.tabBar);
    rootView.addSubview(WI.navigationSidebar);
    rootView.addSubview(WI.tabBrowser);
    rootView.addSubview(WI.consoleDrawer);
    rootView.addSubview(WI.quickConsole);
    rootView.addSubview(WI.detailsSidebar);
};

WI._tabBrowserSelectedTabContentViewDidChange = function(event)
{
    let selectedTabBarItem = WI.tabBar.selectedTabBarItem;
    if (selectedTabBarItem) {
        WI._contentElement.ariaLabel = selectedTabBarItem.displayName || "";

        if (selectedTabBarItem.representedObject.constructor.shouldSaveTab())
            WI._selectedTabIndexSetting.value = WI.tabBar.tabBarItems.indexOf(selectedTabBarItem);
    }

    if (WI.doesCurrentTabSupportSplitContentBrowser()) {
        if (WI._shouldRevealSpitConsoleIfSupported) {
            WI._shouldRevealSpitConsoleIfSupported = false;
            WI.showSplitConsole();
        }
        return;
    }

    WI._shouldRevealSpitConsoleIfSupported = WI.isShowingSplitConsole();
    WI.hideSplitConsole();
};

WI._handleDockedResizerMouseDown = function(event)
{
    WI.resizeDockedFrameMouseDown(event);
};

WI._handleUndockedTitleAreaMouseDown = function(event)
{
    WI.moveUndockedWindowMouseDown(event);
};

WI._domStorageWasInspected = function(event)
{
    WI.showStorageTab({initiatorHint: WI.TabBrowser.TabNavigationInitiator.Inspect});
    WI.showRepresentedObject(event.data.domStorage, null, {ignoreSearchTab: true});
};

WI._databaseWasInspected = function(event)
{
    WI.showStorageTab({initiatorHint: WI.TabBrowser.TabNavigationInitiator.Inspect});
    WI.showRepresentedObject(event.data.database, null, {ignoreSearchTab: true});
};

WI._domNodeWasInspected = function(event)
{
    WI.domManager.highlightDOMNodeForTwoSeconds(event.data.node.id);

    InspectorFrontendHost.bringToFront();

    // The event can override the initiator, in cases where the Inspect code path is used internally.
    let options = {
        initiatorHint: event.data.initiatorHint || WI.TabBrowser.TabNavigationInitiator.Inspect,
    };
    WI.showElementsTab(options);
    WI.showMainFrameDOMTree(event.data.node, {...options, ignoreSearchTab: true});
};

WI._inspectModeStateChanged = function(event)
{
    WI._inspectModeTabBarButton.activated = WI.domManager.inspectModeEnabled;
};

WI._toggleInspectMode = function(event)
{
    WI.domManager.inspectModeEnabled = !WI.domManager.inspectModeEnabled;
};

WI._handleDeviceSettingsTabBarButtonClicked = function(event)
{
    if (WI._deviceSettingsPopover)
        return; // Clicking the button while the popover is shown will automatically dismiss the popover. The object is cleared by `WI.didDismissPopover()`.

    WI._deviceSettingsPopover = new WI.OverrideDeviceSettingsPopover(WI);
    WI._deviceSettingsPopover.show(WI._deviceSettingsTabBarButton.element);
};

WI._handleDeviceSettingChanged = function()
{
    WI._deviceSettingsTabBarButton.activated = WI.deviceSettingsManager.hasOverridenDefaultSettings;
}

WI._downloadWebArchive = function(event)
{
    WI.archiveMainFrame();
};

WI._reloadInspectedInspector = function()
{
    const options = {};
    WI.runtimeManager.evaluateInInspectedWindow(`InspectorFrontendHost.reopen()`, options, function(){});
};

WI._reloadPage = function(event)
{
    let target = WI.assumingMainTarget();
    if (!target.hasDomain("Page"))
        return;

    event.preventDefault();

    if (InspectorFrontendHost.inspectionLevel > 1) {
        WI._reloadInspectedInspector();
        return;
    }

    target.PageAgent.reload();
};

WI._reloadPageFromOrigin = function(event)
{
    let target = WI.assumingMainTarget();
    if (!target.hasDomain("Page"))
        return;

    event.preventDefault();

    if (InspectorFrontendHost.inspectionLevel > 1) {
        WI._reloadInspectedInspector();
        return;
    }

    target.PageAgent.reload.invoke({ignoreCache: true});
};

WI._reloadTabBarButtonClicked = function(event)
{
    if (InspectorFrontendHost.inspectionLevel > 1) {
        WI._reloadInspectedInspector();
        return;
    }

    // Reload page from origin if the button is clicked while the shift key is pressed down.
    let target = WI.assumingMainTarget();
    target.PageAgent.reload.invoke({ignoreCache: WI.modifierKeys.shiftKey});
};

WI._updateReloadTabBarButton = function()
{
    if (!WI._reloadTabBarButton)
        return;

    WI._reloadTabBarButton.hidden = !InspectorBackend.hasDomain("Page");
    WI._updateTabBarDividers();
};

WI._updateDownloadTabBarButton = function()
{
    if (!WI._reloadTabBarButton)
        return;

    if (!WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile) || !InspectorBackend.hasCommand("Page.archive")) {
        WI._downloadTabBarButton.hidden = true;
        WI._updateTabBarDividers();
        return;
    }

    if (WI._downloadingPage) {
        WI._downloadTabBarButton.enabled = false;
        return;
    }

    WI._downloadTabBarButton.enabled = WI.canArchiveMainFrame();
};

WI._updateInspectModeTabBarButton = function()
{
    WI._inspectModeTabBarButton.hidden = !InspectorBackend.hasDomain("DOM");
    WI._updateTabBarDividers();
};

WI._updateTabBarDividers = function()
{
    function isHidden(navigationItem) {
        return !navigationItem || navigationItem.hidden;
    }

    let closeHidden = isHidden(WI._closeTabBarButton);
    let dockLeftHidden = isHidden(WI._dockLeftTabBarButton);
    let dockBottomHidden = isHidden(WI._dockBottomTabBarButton);
    let dockRightHidden = isHidden(WI._dockRightTabBarButton);
    let undockHidden = isHidden(WI._undockTabBarButton);

    let inspectModeHidden = isHidden(WI._inspectModeTabBarButton);
    let deviceSettingsHidden = isHidden(WI._deviceSettingsTabBarButton);
    let reloadHidden = isHidden(WI._reloadTabBarButton);
    let downloadHidden = isHidden(WI._downloadTabBarButton);

    let warningsHidden = WI._consoleWarningsTabBarButton.hidden;
    let errorsHidden = WI._consoleErrorsTabBarButton.hidden;

    // Hide the divider if everything to the left is hidden OR if everything to the right is hidden.
    WI._consoleDividerNavigationItem.hidden = (closeHidden && dockLeftHidden && dockBottomHidden && dockRightHidden && undockHidden && inspectModeHidden && deviceSettingsHidden && reloadHidden && downloadHidden) || (warningsHidden && errorsHidden);

    WI.tabBar.needsLayout();
};

WI._updateConsoleTabBarButtons = function()
{
    function pulse(element) {
        // We need to force a style invalidation in the case where we already
        // were animating this item after we've removed the pulsing CSS class.
        if (element.classList.contains("pulsing")) {
            element.classList.remove("pulsing");
            element.recalculateStyles();
        } else {
            element.addEventListener("animationend", () => {
                element.classList.remove("pulsing");
            }, {once: true});
        }

        element.classList.add("pulsing");
    }
    let warningCount = WI.consoleManager.warningCount;
    if (warningCount) {
        let warningFormat = (warningCount === 1) ? WI.UIString("Click to show %d warning in the Console") : WI.UIString("Click to show %d warnings in the Console");
        WI._consoleWarningsTabBarButton.tooltip = warningFormat.format(warningCount);
        WI._consoleWarningsTabBarButton.hidden = false;

        if (warningCount !== WI._consoleWarningsTabBarButton.__lastWarningCount)
            pulse(WI._consoleWarningsTabBarButton.element);
    } else
        WI._consoleWarningsTabBarButton.hidden = true;

    let errorCount = WI.consoleManager.errorCount;
    if (errorCount) {
        let errorFormat = (errorCount === 1) ? WI.UIString("Click to show %d error in the Console") : WI.UIString("Click to show %d errors in the Console");
        WI._consoleErrorsTabBarButton.tooltip = errorFormat.format(errorCount);
        WI._consoleErrorsTabBarButton.hidden = false;

        if (errorCount !== WI._consoleErrorsTabBarButton.__lastErrorCount)
            pulse(WI._consoleErrorsTabBarButton.element);
    } else
        WI._consoleErrorsTabBarButton.hidden = true;

    WI._updateTabBarDividers();

    WI._consoleWarningsTabBarButton.__lastWarningCount = warningCount;
    WI._consoleErrorsTabBarButton.__lastErrorCount = errorCount;
};

WI._showConsoleTab = function(event)
{
    WI.showConsoleTab();
};

WI._focusConsolePrompt = function(event)
{
    WI.quickConsole.prompt.focus();
};

WI._focusedContentBrowser = function()
{
    if (WI.currentFocusElement) {
        let contentBrowserElement = WI.currentFocusElement.closest(".content-browser");
        if (contentBrowserElement && contentBrowserElement.__view && contentBrowserElement.__view instanceof WI.ContentBrowser)
            return contentBrowserElement.__view;
    }

    if (WI.tabBrowser.element.contains(WI.currentFocusElement) || document.activeElement === document.body) {
        let tabContentView = WI.tabBrowser.selectedTabContentView;
        if (tabContentView.contentBrowser)
            return tabContentView.contentBrowser;
        return null;
    }

    if (WI.consoleDrawer.element.contains(WI.currentFocusElement)
        || (WI.isShowingSplitConsole() && WI.quickConsole.element.contains(WI.currentFocusElement)))
        return WI.consoleDrawer;

    return null;
};

WI._focusedContentView = function()
{
    if (WI.tabBrowser.element.contains(WI.currentFocusElement) || document.activeElement === document.body) {
        var tabContentView = WI.tabBrowser.selectedTabContentView;
        if (tabContentView.contentBrowser)
            return tabContentView.contentBrowser.currentContentView;
        return tabContentView;
    }

    if (WI.consoleDrawer.element.contains(WI.currentFocusElement)
        || (WI.isShowingSplitConsole() && WI.quickConsole.element.contains(WI.currentFocusElement)))
        return WI.consoleDrawer.currentContentView;

    return null;
};

WI._focusedOrVisibleContentBrowser = function()
{
    let focusedContentBrowser = WI._focusedContentBrowser();
    if (focusedContentBrowser)
        return focusedContentBrowser;

    var tabContentView = WI.tabBrowser.selectedTabContentView;
    if (tabContentView.contentBrowser)
        return tabContentView.contentBrowser;

    return null;
};

WI.focusedOrVisibleContentView = function()
{
    let focusedContentView = WI._focusedContentView();
    if (focusedContentView)
        return focusedContentView;

    var tabContentView = WI.tabBrowser.selectedTabContentView;
    if (tabContentView.contentBrowser)
        return tabContentView.contentBrowser.currentContentView;
    return tabContentView;
};

WI._beforecopy = function(event)
{
    var selection = window.getSelection();

    // If there is no selection, see if the focused element or focused ContentView can handle the copy event.
    if (selection.isCollapsed && !WI.isEventTargetAnEditableField(event)) {
        var focusedCopyHandler = WI.currentFocusElement && WI.currentFocusElement.copyHandler;
        if (focusedCopyHandler && typeof focusedCopyHandler.handleBeforeCopyEvent === "function") {
            focusedCopyHandler.handleBeforeCopyEvent(event);
            if (event.defaultPrevented)
                return;
        }

        var focusedContentView = WI._focusedContentView();
        if (focusedContentView && typeof focusedContentView.handleCopyEvent === "function") {
            event.preventDefault();
            return;
        }

        return;
    }

    if (selection.isCollapsed)
        return;

    // Say we can handle it (by preventing default) to remove word break characters.
    event.preventDefault();
};

WI._find = function(event)
{
    let tabContentView = WI.tabBrowser.selectedTabContentView;
    if (tabContentView && tabContentView.canHandleFindEvent) {
        tabContentView.handleFindEvent(event);
        return;
    }

    let contentBrowser = WI._focusedOrVisibleContentBrowser();
    if (!contentBrowser)
        return;

    contentBrowser.showFindBanner();
};

WI._save = function(event)
{
    var contentView = WI.focusedOrVisibleContentView();
    if (!contentView || !contentView.supportsSave)
        return;

    if (!WI.FileUtilities.canSave(contentView.saveMode))
        return;

    WI.FileUtilities.save(contentView.saveMode, contentView.saveData);
};

WI._saveAs = function(event)
{
    var contentView = WI.focusedOrVisibleContentView();
    if (!contentView || !contentView.supportsSave)
        return;

    if (!WI.FileUtilities.canSave(contentView.saveMode))
        return;

    WI.FileUtilities.save(contentView.saveMode, contentView.saveData, true);
};

WI._clear = function(event)
{
    let contentView = WI.focusedOrVisibleContentView();
    if (!contentView || typeof contentView.handleClearShortcut !== "function") {
        // If the current content view is unable to handle WI event, clear the console to reset
        // the dashboard counters.
        WI.consoleManager.requestClearMessages();
        return;
    }

    contentView.handleClearShortcut(event);
};

WI._populateFind = function(event)
{
    let focusedContentView = WI._focusedContentView();
    if (focusedContentView && focusedContentView.supportsCustomFindBanner) {
        focusedContentView.handlePopulateFindShortcut();
        return;
    }

    let contentBrowser = WI._focusedOrVisibleContentBrowser();
    if (contentBrowser) {
        contentBrowser.handlePopulateFindShortcut();
        return;
    }
};

WI._findNext = function(event)
{
    let focusedContentView = WI._focusedContentView();
    if (focusedContentView?.supportsCustomFindBanner) {
        focusedContentView.handleFindNextShortcut();
        return;
    }

    let contentBrowser = WI._focusedOrVisibleContentBrowser();
    if (contentBrowser) {
        contentBrowser.handleFindNextShortcut();
        return;
    }
};

WI._findPrevious = function(event)
{
    let focusedContentView = WI._focusedContentView();
    if (focusedContentView?.supportsCustomFindBanner) {
        focusedContentView.handleFindPreviousShortcut();
        return;
    }

    let contentBrowser = WI._focusedOrVisibleContentBrowser();
    if (contentBrowser) {
        contentBrowser.handleFindPreviousShortcut();
        return;
    }
};

WI._copy = function(event)
{
    var selection = window.getSelection();

    // If there is no selection, pass the copy event on to the focused element or focused ContentView.
    if (selection.isCollapsed && !WI.isEventTargetAnEditableField(event)) {
        var focusedCopyHandler = WI.currentFocusElement && WI.currentFocusElement.copyHandler;
        if (focusedCopyHandler && typeof focusedCopyHandler.handleCopyEvent === "function") {
            focusedCopyHandler.handleCopyEvent(event);
            if (event.defaultPrevented)
                return;
        }

        var focusedContentView = WI._focusedContentView();
        if (focusedContentView && typeof focusedContentView.handleCopyEvent === "function") {
            focusedContentView.handleCopyEvent(event);
            return;
        }

        let tabContentView = WI.tabBrowser.selectedTabContentView;
        if (tabContentView && typeof tabContentView.handleCopyEvent === "function") {
            tabContentView.handleCopyEvent(event);
            return;
        }

        return;
    }

    if (selection.isCollapsed)
        return;

    // Remove word break characters from the selection before putting it on the pasteboard.
    var selectionString = selection.toString().removeWordBreakCharacters();
    event.clipboardData.setData("text/plain", selectionString);
    event.preventDefault();
};

WI._paste = function(event)
{
    if (event.defaultPrevented)
        return;

    let selection = window.getSelection();

    // If there is no selection, pass the paste event on to the focused element or focused ContentView.
    if (!selection.isCollapsed || WI.isEventTargetAnEditableField(event))
        return;

    let focusedPasteHandler = WI.currentFocusElement && WI.currentFocusElement.pasteHandler;
    if (focusedPasteHandler && focusedPasteHandler.handlePasteEvent) {
        focusedPasteHandler.handlePasteEvent(event);
        if (event.defaultPrevented)
            return;
    }

    let focusedContentView = WI._focusedContentView();
    if (focusedContentView && focusedContentView.handlePasteEvent) {
        focusedContentView.handlePasteEvent(event);
        return;
    }

    let tabContentView = WI.tabBrowser.selectedTabContentView;
    if (tabContentView && tabContentView.handlePasteEvent) {
        tabContentView.handlePasteEvent(event);
        return;
    }
};

WI._increaseZoom = function(event)
{
    const epsilon = 0.0001;
    const maximumZoom = 2.4;
    let currentZoom = WI.getZoomFactor();
    if (currentZoom + epsilon >= maximumZoom) {
        InspectorFrontendHost.beep();
        return;
    }

    WI.setZoomFactor(Math.min(maximumZoom, currentZoom + 0.2));
};

WI._decreaseZoom = function(event)
{
    const epsilon = 0.0001;
    const minimumZoom = 0.6;
    let currentZoom = WI.getZoomFactor();
    if (currentZoom - epsilon <= minimumZoom) {
        InspectorFrontendHost.beep();
        return;
    }

    WI.setZoomFactor(Math.max(minimumZoom, currentZoom - 0.2));
};

WI._resetZoom = function(event)
{
    WI.setZoomFactor(1);
};

WI.getZoomFactor = function()
{
    return WI.settings.zoomFactor.value;
};

WI.setZoomFactor = function(factor)
{
    InspectorFrontendHost.setZoomFactor(factor);
    // Round-trip through the frontend host API in case the requested factor is not used.
    WI.settings.zoomFactor.value = InspectorFrontendHost.zoomFactor();
};

WI.resolvedLayoutDirection = function()
{
    let layoutDirection = WI.settings.debugLayoutDirection.value;
    if (layoutDirection === WI.LayoutDirection.System)
        layoutDirection = InspectorFrontendHost.userInterfaceLayoutDirection();
    return layoutDirection;
};

WI.resolveLayoutDirectionForElement = function(element)
{
    let layoutDirection = WI.resolvedLayoutDirection();

    // Global LTR never includes RTL containers. Return early.
    if (layoutDirection === WI.LayoutDirection.LTR)
        return layoutDirection;

    let style = getComputedStyle(element);
    return style.direction;
};

WI.setLayoutDirection = function(value)
{
    console.assert(WI.isDebugUIEnabled());

    if (!Object.values(WI.LayoutDirection).includes(value))
        WI.reportInternalError("Unknown layout direction requested: " + value);

    if (value === WI.settings.debugLayoutDirection.value)
        return;

    WI.settings.debugLayoutDirection.value = value;

    InspectorFrontendHost.reopen();
};

WI.undockedTitleAreaHeight = function()
{
    if (WI.dockConfiguration !== WI.DockConfiguration.Undocked)
        return 0;

    if (WI.Platform.name === "mac") {
        /* Keep in sync with `--undocked-title-area-height` CSS variable. */
        return 27 / WI.getZoomFactor();
    }

    return 0;
};

WI._showTabAtIndexFromShortcut = function(i)
{
    if (i <= WI.tabBar.tabCount) {
        WI.tabBar.selectTabBarItem(i - 1, {
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.KeyboardShortcut,
        });
    }
};

WI._showJavaScriptTypeInformationSettingChanged = function(event)
{
    if (WI.settings.showJavaScriptTypeInformation.value) {
        for (let target of WI.targets)
            target.RuntimeAgent.enableTypeProfiler();
    } else {
        for (let target of WI.targets)
            target.RuntimeAgent.disableTypeProfiler();
    }
};

WI._enableControlFlowProfilerSettingChanged = function(event)
{
    if (WI.settings.enableControlFlowProfiler.value) {
        for (let target of WI.targets)
            target.RuntimeAgent.enableControlFlowProfiler();
    } else {
        for (let target of WI.targets)
            target.RuntimeAgent.disableControlFlowProfiler();
    }
};

WI._resourceCachingDisabledSettingChanged = function(event)
{
    for (let target of WI.targets)
        target.NetworkAgent.setResourceCachingDisabled(WI.settings.resourceCachingDisabled.value);
};

WI._allowInspectingInspectorSettingChanged = function(event)
{
    InspectorFrontendHost.setAllowsInspectingInspector(WI.settings.experimentalAllowInspectingInspector.value);
}

WI.measureElement = function(element)
{
    WI.layoutMeasurementContainer.appendChild(element.cloneNode(true));
    let rect = WI.layoutMeasurementContainer.getBoundingClientRect();
    WI.layoutMeasurementContainer.removeChildren();
    return rect;
};

WI.elementDragStart = function(element, dividerDrag, elementDragEnd, event, cursor, eventTarget)
{
    if (WI._elementDraggingEventListener || WI._elementEndDraggingEventListener)
        WI.elementDragEnd(event);

    if (element) {
        // Install glass pane
        if (WI._elementDraggingGlassPane)
            WI._elementDraggingGlassPane.remove();

        var glassPane = document.createElement("div");
        glassPane.style.cssText = "position:absolute;top:0;bottom:0;left:0;right:0;opacity:0;z-index:1";
        glassPane.id = "glass-pane-for-drag";
        element.ownerDocument.body.appendChild(glassPane);
        WI._elementDraggingGlassPane = glassPane;
    }

    WI._elementDraggingEventListener = dividerDrag;
    WI._elementEndDraggingEventListener = elementDragEnd;

    var targetDocument = event.target.ownerDocument;

    WI._elementDraggingEventTarget = eventTarget || targetDocument;
    WI._elementDraggingEventTarget.addEventListener("mousemove", dividerDrag, true);
    WI._elementDraggingEventTarget.addEventListener("mouseup", elementDragEnd, true);

    targetDocument.body.style.cursor = cursor;

    event.preventDefault();
};

WI.elementDragEnd = function(event)
{
    WI._elementDraggingEventTarget.removeEventListener("mousemove", WI._elementDraggingEventListener, true);
    WI._elementDraggingEventTarget.removeEventListener("mouseup", WI._elementEndDraggingEventListener, true);

    event.target.ownerDocument.body.style.removeProperty("cursor");

    if (WI._elementDraggingGlassPane)
        WI._elementDraggingGlassPane.remove();

    delete WI._elementDraggingGlassPane;
    delete WI._elementDraggingEventTarget;
    delete WI._elementDraggingEventListener;
    delete WI._elementEndDraggingEventListener;

    event.preventDefault();
};

WI.createMessageTextView = function(message, isError)
{
    let messageElement = document.createElement("div");
    messageElement.className = "message-text-view";
    if (isError)
        messageElement.classList.add("error");

    let textElement = messageElement.appendChild(document.createElement("div"));
    textElement.className = "message";
    textElement.append(message);

    return messageElement;
};

WI.createNavigationItemHelp = function(formatString, navigationItem)
{
    console.assert(typeof formatString === "string");
    console.assert(navigationItem instanceof WI.ButtonNavigationItem);

    function append(a, b) {
        a.append(b);
        return a;
    }

    let containerElement = document.createElement("div");
    containerElement.className = "navigation-item-help";
    containerElement.__navigationItem = navigationItem;

    let wrapperElement = document.createElement("div");
    wrapperElement.className = "navigation-bar";
    wrapperElement.appendChild(navigationItem.element);

    String.format(formatString, [wrapperElement], String.standardFormatters, containerElement, append);
    return containerElement;
};

WI.createGoToArrowButton = function()
{
    var button = document.createElement("button");
    button.addEventListener("mousedown", (event) => { event.stopPropagation(); }, true);
    button.className = "go-to-arrow";
    button.tabIndex = -1;
    return button;
};

WI.createSourceCodeLocationLink = function(sourceCodeLocation, options = {})
{
    console.assert(sourceCodeLocation);
    if (!sourceCodeLocation)
        return null;

    var linkElement = document.createElement("a");
    linkElement.className = "go-to-link";
    WI.linkifyElement(linkElement, sourceCodeLocation, options);
    sourceCodeLocation.populateLiveDisplayLocationTooltip(linkElement);

    if (options.useGoToArrowButton)
        linkElement.appendChild(WI.createGoToArrowButton());
    else
        sourceCodeLocation.populateLiveDisplayLocationString(linkElement, "textContent", options.columnStyle, options.nameStyle, options.prefix);

    if (options.dontFloat)
        linkElement.classList.add("dont-float");

    return linkElement;
};

WI.linkifyLocation = function(url, sourceCodePosition, options = {})
{
    var sourceCode = WI.sourceCodeForURL(url);
    if (sourceCode)
        return WI.linkifySourceCode(sourceCode, sourceCodePosition, options);

    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.lineNumber = sourceCodePosition.lineNumber;
    if (options.className)
        anchor.className = options.className;
    anchor.append(WI.displayNameForURL(url) + ":" + sourceCodePosition.lineNumber);
    return anchor;
};

WI.linkifySourceCode = function(sourceCode, sourceCodePosition, options = {})
{
    let sourceCodeLocation = sourceCode.createSourceCodeLocation(sourceCodePosition.lineNumber, sourceCodePosition.columnNumber);
    let linkElement = WI.createSourceCodeLocationLink(sourceCodeLocation, {
        ...options,
        dontFloat: true,
    });

    if (options.className)
        linkElement.classList.add(options.className);

    return linkElement;
};

WI.linkifyElement = function(linkElement, sourceCodeLocation, options = {}) {
    console.assert(sourceCodeLocation);

    if (!options.initiatorHint)
        options.initiatorHint = WI.TabBrowser.TabNavigationInitiator.LinkClick;

    function showSourceCodeLocation(event)
    {
        event.stopPropagation();
        event.preventDefault();

        if (event.metaKey)
            WI.showOriginalUnformattedSourceCodeLocation(sourceCodeLocation, options);
        else
            WI.showSourceCodeLocation(sourceCodeLocation, options);
    }

    linkElement.addEventListener("click", showSourceCodeLocation);
    linkElement.addEventListener("contextmenu", (event) => {
        let contextMenu = WI.ContextMenu.createFromEvent(event);
        WI.appendContextMenuItemsForSourceCode(contextMenu, sourceCodeLocation);
    });
};

WI.sourceCodeForURL = function(url)
{
    let sourceCode = WI.networkManager.resourcesForURL(url).firstValue;
    if (!sourceCode) {
        sourceCode = WI.debuggerManager.scriptsForURL(url, WI.assumingMainTarget())[0];
        if (sourceCode)
            sourceCode = sourceCode.resource || sourceCode;
    }
    return sourceCode || null;
};

WI.linkifyURLAsNode = function(url, linkText, className)
{
    let a = document.createElement("a");
    a.href = url;
    a.className = className || "";
    a.textContent = linkText || url;
    a.style.maxWidth = "100%";
    return a;
};

WI.linkifyStringAsFragmentWithCustomLinkifier = function(string, linkifier)
{
    var container = document.createDocumentFragment();
    var linkStringRegEx = /(?:[a-zA-Z][a-zA-Z0-9+.-]{2,}:\/\/|www\.)[\w$\-_+*'=\|\/\\(){}[\]%@&#~,:;.!?]{2,}[\w$\-_+*=\|\/\\({%@&#~]/;
    var lineColumnRegEx = /:(\d+)(:(\d+))?$/;

    while (string) {
        var linkString = linkStringRegEx.exec(string);
        if (!linkString)
            break;

        linkString = linkString[0];
        var linkIndex = string.indexOf(linkString);
        var nonLink = string.substring(0, linkIndex);
        container.append(nonLink);

        if (linkString.startsWith("data:") || linkString.startsWith("javascript:") || linkString.startsWith("mailto:")) {
            container.append(linkString);
            string = string.substring(linkIndex + linkString.length, string.length);
            continue;
        }

        var title = linkString;
        var realURL = linkString.startsWith("www.") ? "http://" + linkString : linkString;
        var lineColumnMatch = lineColumnRegEx.exec(realURL);
        if (lineColumnMatch)
            realURL = realURL.substring(0, realURL.length - lineColumnMatch[0].length);

        var lineNumber;
        if (lineColumnMatch)
            lineNumber = parseInt(lineColumnMatch[1]) - 1;

        var linkNode = linkifier(title, realURL, lineNumber);
        container.appendChild(linkNode);
        string = string.substring(linkIndex + linkString.length, string.length);
    }

    if (string)
        container.append(string);

    return container;
};

WI.linkifyStringAsFragment = function(string)
{
    function linkifier(title, url, lineNumber)
    {
        var urlNode = WI.linkifyURLAsNode(url, title, undefined);
        if (lineNumber !== undefined)
            urlNode.lineNumber = lineNumber;

        return urlNode;
    }

    return WI.linkifyStringAsFragmentWithCustomLinkifier(string, linkifier);
};

WI.createResourceLink = function(resource, className)
{
    function handleClick(event)
    {
        event.stopPropagation();
        event.preventDefault();

        WI.showRepresentedObject(resource);
    }

    let linkNode = document.createElement("a");
    linkNode.classList.add("resource-link", className);
    linkNode.title = resource.url;
    linkNode.textContent = (resource.urlComponents.lastPathComponent || resource.displayURL).insertWordBreakCharacters();
    linkNode.addEventListener("click", handleClick);
    return linkNode;
};

WI._undoKeyboardShortcut = function(event)
{
    if (!WI.isEditingAnyField() && !WI.isEventTargetAnEditableField(event)) {
        WI.undo();
        event.preventDefault();
    }
};

WI._redoKeyboardShortcut = function(event)
{
    if (!WI.isEditingAnyField() && !WI.isEventTargetAnEditableField(event)) {
        WI.redo();
        event.preventDefault();
    }
};

WI.undo = function()
{
    let target = WI.assumingMainTarget();
    if (target.hasCommand("DOM.undo"))
        target.DOMAgent.undo();
};

WI.redo = function()
{
    let target = WI.assumingMainTarget();
    if (target.hasCommand("DOM.redo"))
        target.DOMAgent.redo();
};

WI.highlightRangesWithStyleClass = function(element, resultRanges, styleClass, changes)
{
    changes = changes || [];
    var highlightNodes = [];
    var lineText = element.textContent;
    var ownerDocument = element.ownerDocument;
    var textNodeSnapshot = ownerDocument.evaluate(".//text()", element, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    var snapshotLength = textNodeSnapshot.snapshotLength;
    if (snapshotLength === 0)
        return highlightNodes;

    var nodeRanges = [];
    var rangeEndOffset = 0;
    for (var i = 0; i < snapshotLength; ++i) {
        var range = {};
        range.offset = rangeEndOffset;
        range.length = textNodeSnapshot.snapshotItem(i).textContent.length;
        rangeEndOffset = range.offset + range.length;
        nodeRanges.push(range);
    }

    var startIndex = 0;
    for (var i = 0; i < resultRanges.length; ++i) {
        var startOffset = resultRanges[i].offset;
        var endOffset = startOffset + resultRanges[i].length;

        while (startIndex < snapshotLength && nodeRanges[startIndex].offset + nodeRanges[startIndex].length <= startOffset)
            startIndex++;
        var endIndex = startIndex;
        while (endIndex < snapshotLength && nodeRanges[endIndex].offset + nodeRanges[endIndex].length < endOffset)
            endIndex++;
        if (endIndex === snapshotLength)
            break;

        var highlightNode = ownerDocument.createElement("span");
        highlightNode.className = styleClass;
        highlightNode.textContent = lineText.substring(startOffset, endOffset);

        var lastTextNode = textNodeSnapshot.snapshotItem(endIndex);
        var lastText = lastTextNode.textContent;
        lastTextNode.textContent = lastText.substring(endOffset - nodeRanges[endIndex].offset);
        changes.push({node: lastTextNode, type: "changed", oldText: lastText, newText: lastTextNode.textContent});

        if (startIndex === endIndex) {
            lastTextNode.parentElement.insertBefore(highlightNode, lastTextNode);
            changes.push({node: highlightNode, type: "added", nextSibling: lastTextNode, parent: lastTextNode.parentElement});
            highlightNodes.push(highlightNode);

            var prefixNode = ownerDocument.createTextNode(lastText.substring(0, startOffset - nodeRanges[startIndex].offset));
            lastTextNode.parentElement.insertBefore(prefixNode, highlightNode);
            changes.push({node: prefixNode, type: "added", nextSibling: highlightNode, parent: lastTextNode.parentElement});
        } else {
            var firstTextNode = textNodeSnapshot.snapshotItem(startIndex);
            var firstText = firstTextNode.textContent;
            var anchorElement = firstTextNode.nextSibling;

            firstTextNode.parentElement.insertBefore(highlightNode, anchorElement);
            changes.push({node: highlightNode, type: "added", nextSibling: anchorElement, parent: firstTextNode.parentElement});
            highlightNodes.push(highlightNode);

            firstTextNode.textContent = firstText.substring(0, startOffset - nodeRanges[startIndex].offset);
            changes.push({node: firstTextNode, type: "changed", oldText: firstText, newText: firstTextNode.textContent});

            for (var j = startIndex + 1; j < endIndex; j++) {
                var textNode = textNodeSnapshot.snapshotItem(j);
                var text = textNode.textContent;
                textNode.textContent = "";
                changes.push({node: textNode, type: "changed", oldText: text, newText: textNode.textContent});
            }
        }
        startIndex = endIndex;
        nodeRanges[startIndex].offset = endOffset;
        nodeRanges[startIndex].length = lastTextNode.textContent.length;

    }
    return highlightNodes;
};

WI.revertDOMChanges = function(domChanges)
{
    for (var i = domChanges.length - 1; i >= 0; --i) {
        var entry = domChanges[i];
        switch (entry.type) {
        case "added":
            entry.node.remove();
            break;
        case "changed":
            entry.node.textContent = entry.oldText;
            break;
        }
    }
};

WI.archiveMainFrame = function()
{
    WI._downloadingPage = true;
    WI._updateDownloadTabBarButton();

    let target = WI.assumingMainTarget();
    target.PageAgent.archive((error, data) => {
        WI._downloadingPage = false;
        WI._updateDownloadTabBarButton();

        if (error) {
            WI.reportInternalError(error);
            return;
        }

        let mainFrame = WI.networkManager.mainFrame;
        let archiveName = mainFrame.mainResource.urlComponents.host || mainFrame.mainResource.displayName || "Archive";

        const forceSaveAs = true;
        WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
            suggestedName: archiveName + ".webarchive",
            content: data,
            base64Encoded: true,
        }, forceSaveAs);
    });
};

WI.canArchiveMainFrame = function()
{
    if (!WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile))
        return false;

    if (!InspectorBackend.hasCommand("Page.archive"))
        return false;

    if (!WI.networkManager.mainFrame || !WI.networkManager.mainFrame.mainResource)
        return false;

    return WI.Resource.typeFromMIMEType(WI.networkManager.mainFrame.mainResource.mimeType) === WI.Resource.Type.Document;
};

WI.addWindowKeydownListener = function(listener)
{
    if (typeof listener.handleKeydownEvent !== "function")
        return;

    WI._windowKeydownListeners.push(listener);

    WI._updateWindowKeydownListener();
};

WI.removeWindowKeydownListener = function(listener)
{
    WI._windowKeydownListeners.remove(listener);

    WI._updateWindowKeydownListener();
};

WI._updateWindowKeydownListener = function()
{
    if (WI._windowKeydownListeners.length === 1)
        window.addEventListener("keydown", WI._sharedWindowKeydownListener, true);
    else if (!WI._windowKeydownListeners.length)
        window.removeEventListener("keydown", WI._sharedWindowKeydownListener, true);
};

WI._sharedWindowKeydownListener = function(event)
{
    for (var i = WI._windowKeydownListeners.length - 1; i >= 0; --i) {
        if (WI._windowKeydownListeners[i].handleKeydownEvent(event)) {
            event.stopImmediatePropagation();
            event.preventDefault();
            break;
        }
    }
};

WI.reportInternalError = function(errorOrString, details = {})
{
    // The 'details' object includes additional information from the caller as free-form string keys and values.
    // Each key and value will be shown in the uncaught exception reporter, console error message, or in
    // a pre-filled bug report generated for this internal error.

    let error = errorOrString instanceof Error ? errorOrString : new Error(errorOrString);
    error.details = details;

    // The error will be displayed in the Uncaught Exception Reporter sheet if DebugUI is enabled.
    if (WI.isDebugUIEnabled()) {
        // This assert allows us to stop the debugger at an internal exception. It doesn't re-throw
        // exceptions because the original exception would be lost through window.onerror.
        // This workaround can be removed once <https://webkit.org/b/158192> is fixed.
        console.assert(false, "An internal exception was thrown.", error);
        handleInternalException(error);
    } else
        console.error(error);
};

// Many places assume the "main" target has resources.
// In the case where the main backend target is a MultiplexingBackendTarget
// that target has essentially nothing. In that case defer to the page
// target, since that is the real "main" target the frontend is assuming.
Object.defineProperty(WI, "mainTarget",
{
    get() { return WI.pageTarget || WI.backendTarget; }
});

// This list of targets are non-Multiplexing targets.
// So if there is a multiplexing target, and multiple sub-targets
// this is just the list of sub-targets. Almost no code expects
// to actually interact with the Multiplexing target.
Object.defineProperty(WI, "targets",
{
    get() { return WI.targetManager.targets; }
});

// Many places assume the main target because they cannot yet be
// used by reached by Worker debugging. Eventually, once all
// Worker domains have been implemented, all of these must be
// handled properly.
WI.assumingMainTarget = function()
{
    return WI.mainTarget;
};

WI.reset = async function()
{
    await WI.ObjectStore.reset();
    WI.Setting.reset();
    InspectorFrontendHost.reset();
};

WI.isEngineeringBuild = false;
WI.inspectorFrontendHostAllowsEngineeringSettings = InspectorFrontendHost.engineeringSettingsAllowed();

WI.engineeringSettingsAllowed = function() {
    return WI.isEngineeringBuild || WI.inspectorFrontendHostAllowsEngineeringSettings;
}

// OpenResourceDialog delegate

WI.dialogWasDismissedWithRepresentedObject = function(dialog, representedObject)
{
    if (!representedObject)
        return;

    WI.showRepresentedObject(representedObject, dialog.cookie, {
        ignoreSearchTab: true,
        ignoreNetworkTab: true,
    });
};

// Popover delegate

WI.didDismissPopover = function(popover)
{
    if (popover === WI._deviceSettingsPopover)
        WI._deviceSettingsPopover = null;
};

WI.DockConfiguration = {
    Right: "right",
    Left: "left",
    Bottom: "bottom",
    Undocked: "undocked",
};

WI.DockConfigurationChangedLayoutReason = Symbol("dock-configuration-changed");
