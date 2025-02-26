/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.loaded = function()
{
    // Register observers for events from the InspectorBackend.
    // The initialization order should match the same in Main.js.
    InspectorBackend.registerAnimationDispatcher(WI.AnimationObserver);
    InspectorBackend.registerApplicationCacheDispatcher(WI.ApplicationCacheObserver);
    InspectorBackend.registerBrowserDispatcher(WI.BrowserObserver);
    InspectorBackend.registerCPUProfilerDispatcher(WI.CPUProfilerObserver);
    InspectorBackend.registerCSSDispatcher(WI.CSSObserver);
    InspectorBackend.registerCanvasDispatcher(WI.CanvasObserver);
    InspectorBackend.registerConsoleDispatcher(WI.ConsoleObserver);
    InspectorBackend.registerDOMDispatcher(WI.DOMObserver);
    InspectorBackend.registerDOMStorageDispatcher(WI.DOMStorageObserver);
    InspectorBackend.registerDatabaseDispatcher(WI.DatabaseObserver);
    InspectorBackend.registerDebuggerDispatcher(WI.DebuggerObserver);
    InspectorBackend.registerHeapDispatcher(WI.HeapObserver);
    InspectorBackend.registerInspectorDispatcher(WI.InspectorObserver);
    InspectorBackend.registerLayerTreeDispatcher(WI.LayerTreeObserver);
    InspectorBackend.registerMemoryDispatcher(WI.MemoryObserver);
    InspectorBackend.registerNetworkDispatcher(WI.NetworkObserver);
    InspectorBackend.registerPageDispatcher(WI.PageObserver);
    InspectorBackend.registerRuntimeDispatcher(WI.RuntimeObserver);
    InspectorBackend.registerScriptProfilerDispatcher(WI.ScriptProfilerObserver);
    InspectorBackend.registerTargetDispatcher(WI.TargetObserver);
    InspectorBackend.registerTimelineDispatcher(WI.TimelineObserver);
    InspectorBackend.registerWorkerDispatcher(WI.WorkerObserver);

    // Instantiate controllers used by tests.
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
    ];

    // Register for events.
    document.addEventListener("DOMContentLoaded", WI.contentLoaded);
    WI.browserManager.enable();

    // Targets.
    WI.backendTarget = null;
    WI._backendTargetAvailablePromise = new WI.WrappedPromise;

    WI.pageTarget = null;
    WI._pageTargetAvailablePromise = new WI.WrappedPromise;

    if (InspectorBackend.hasDomain("Target"))
        WI.targetManager.createMultiplexingBackendTarget();
    else
        WI.targetManager.createDirectBackendTarget();
};

WI.contentLoaded = function()
{
    // Things that would normally get called by the UI, that we still want to do in tests.
    WI.animationManager.enable();
    WI.applicationCacheManager.enable();
    WI.canvasManager.enable();
    WI.databaseManager.enable();
    WI.domStorageManager.enable();
    WI.heapManager.enable();
    WI.indexedDBManager.enable();
    WI.memoryManager.enable();
    WI.timelineManager.enable();

    // Signal that the frontend is now ready to receive messages.
    WI._backendTargetAvailablePromise.promise.then(() => {
        InspectorFrontendAPI.loadCompleted();
    });

    // Tell the InspectorFrontendHost we loaded, which causes the window to display
    // and pending InspectorFrontendAPI commands to be sent.
    InspectorFrontendHost.loaded();
};

WI.performOneTimeFrontendInitializationsUsingTarget = function(target)
{
    if (!WI.__didPerformConsoleInitialization && target.hasDomain("Console")) {
        WI.__didPerformConsoleInitialization = true;
        WI.consoleManager.initializeLogChannels(target);
    }

    // FIXME: This slows down test debug logging considerably.
    if (!WI.__didPerformCSSInitialization && target.hasDomain("CSS")) {
        WI.__didPerformCSSInitialization = true;
        WI.cssManager.initializeCSSPropertyNameCompletions(target);
    }
};

WI.initializeTarget = function(target)
{
};

WI.targetsAvailable = function()
{
    return WI._pageTargetAvailablePromise.settled;
};

WI.whenTargetsAvailable = function()
{
    return WI._pageTargetAvailablePromise.promise;
};

Object.defineProperty(WI, "mainTarget",
{
    get() { return WI.pageTarget || WI.backendTarget; }
});

Object.defineProperty(WI, "targets",
{
    get() { return WI.targetManager.targets; }
});

WI.assumingMainTarget = () => WI.mainTarget;

WI.isDebugUIEnabled = () => false;

WI.isEngineeringBuild = false;

WI.engineeringSettingsAllowed = () => WI.isEngineeringBuild;

WI.unlocalizedString = (string) => string;
WI.UIString = (string, key, comment) => string;

WI.indentString = () => "    ";

WI.LayoutDirection = {
    System: "system",
    LTR: "ltr",
    RTL: "rtl",
};

WI.resolvedLayoutDirection = () => { return InspectorFrontendHost.userInterfaceLayoutDirection(); };

// Add stubs that are called by the frontend API.
WI.updateDockedState = () => {};
WI.updateDockingAvailability = () => {};
WI.updateVisibilityState = () => {};
WI.updateFindString = () => {};

// FIXME: <https://webkit.org/b/201149> Web Inspector: replace all uses of `window.*Agent` with a target-specific call
(function() {
    function makeAgentGetter(domainName) {
        Object.defineProperty(window, domainName + "Agent",
        {
            get() { return WI.mainTarget._agents[domainName]; },
        });
    }
    makeAgentGetter("Animation");
    makeAgentGetter("Audit");
    makeAgentGetter("ApplicationCache");
    makeAgentGetter("CPUProfiler");
    makeAgentGetter("CSS");
    makeAgentGetter("Canvas");
    makeAgentGetter("Console");
    makeAgentGetter("DOM");
    makeAgentGetter("DOMDebugger");
    makeAgentGetter("DOMStorage");
    makeAgentGetter("Database");
    makeAgentGetter("Debugger");
    makeAgentGetter("Heap");
    makeAgentGetter("IndexedDB");
    makeAgentGetter("Inspector");
    makeAgentGetter("LayerTree");
    makeAgentGetter("Memory");
    makeAgentGetter("Network");
    makeAgentGetter("Page");
    makeAgentGetter("Recording");
    makeAgentGetter("Runtime");
    makeAgentGetter("ScriptProfiler");
    makeAgentGetter("ServiceWorker");
    makeAgentGetter("Target");
    makeAgentGetter("Timeline");
    makeAgentGetter("Worker");
})();

window.InspectorTest = new FrontendTestHarness();

InspectorTest.redirectConsoleToTestOutput();

WI.reportInternalError = (e) => { console.error(e); };

window.reportUnhandledRejection = InspectorTest.reportUnhandledRejection.bind(InspectorTest);
window.onerror = InspectorTest.reportUncaughtExceptionFromEvent.bind(InspectorTest);
