/*
 * Copyright (C) 2013-2016 Apple Inc. All rights reserved.
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

WI.DebuggerManager = class DebuggerManager extends WI.Object
{
    constructor()
    {
        super();

        WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._breakpointDisabledStateDidChange, this);
        WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.ConditionDidChange, this._breakpointEditablePropertyDidChange, this);
        WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.IgnoreCountDidChange, this._breakpointEditablePropertyDidChange, this);
        WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this._breakpointEditablePropertyDidChange, this);
        WI.JavaScriptBreakpoint.addEventListener(WI.Breakpoint.Event.ActionsDidChange, this._handleBreakpointActionsDidChange, this);
        WI.JavaScriptBreakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.DisplayLocationDidChange, this._breakpointDisplayLocationDidChange, this);

        WI.SymbolicBreakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._handleSymbolicBreakpointDisabledStateChanged, this);
        WI.SymbolicBreakpoint.addEventListener(WI.Breakpoint.Event.ConditionDidChange, this._handleSymbolicBreakpointEditablePropertyChanged, this);
        WI.SymbolicBreakpoint.addEventListener(WI.Breakpoint.Event.IgnoreCountDidChange, this._handleSymbolicBreakpointEditablePropertyChanged, this);
        WI.SymbolicBreakpoint.addEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this._handleSymbolicBreakpointEditablePropertyChanged, this);
        WI.SymbolicBreakpoint.addEventListener(WI.Breakpoint.Event.ActionsDidChange, this._handleSymbolicBreakpointActionsChanged, this);

        WI.timelineManager.addEventListener(WI.TimelineManager.Event.CapturingStateChanged, this._handleTimelineCapturingStateChanged, this);

        WI.auditManager.addEventListener(WI.AuditManager.Event.TestScheduled, this._handleAuditManagerTestScheduled, this);
        WI.auditManager.addEventListener(WI.AuditManager.Event.TestCompleted, this._handleAuditManagerTestCompleted, this);

        WI.targetManager.addEventListener(WI.TargetManager.Event.TargetRemoved, this._targetRemoved, this);

        WI.settings.blackboxBreakpointEvaluations.addEventListener(WI.Setting.Event.Changed, this._handleBlackboxBreakpointEvaluationsChange, this);

        if (WI.engineeringSettingsAllowed()) {
            WI.settings.engineeringShowInternalScripts.addEventListener(WI.Setting.Event.Changed, this._handleEngineeringShowInternalScriptsSettingChanged, this);
            WI.settings.engineeringPauseForInternalScripts.addEventListener(WI.Setting.Event.Changed, this._handleEngineeringPauseForInternalScriptsSettingChanged, this);
        }

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        WI.SourceCode.addEventListener(WI.SourceCode.Event.SourceMapAdded, this._handleSourceCodeSourceMapAdded, this);

        this._breakpointsEnabledSetting = new WI.Setting("breakpoints-enabled", true);
        this._asyncStackTraceDepthSetting = new WI.Setting("async-stack-trace-depth", 200);

        this._debuggerStatementsBreakpointSetting = new WI.Setting("debugger-statements-breakpoint", {});
        this._debuggerStatementsBreakpoint = null;

        this._allExceptionsBreakpointSetting = new WI.Setting("all-exceptions-breakpoint", {disabled: true});
        this._allExceptionsBreakpoint = null;

        this._uncaughtExceptionsBreakpointSetting = new WI.Setting("uncaught-exceptions-breakpoint", {disabled: true});
        this._uncaughtExceptionsBreakpoint = null;

        this._assertionFailuresBreakpointSetting = new WI.Setting("assertion-failures-breakpoint", null);
        if (WI.Setting.isFirstLaunch)
            this._assertionFailuresBreakpointSetting.value = {disabled: true};
        this._assertionFailuresBreakpoint = null;

        this._allMicrotasksBreakpointSetting = new WI.Setting("all-microtasks-breakpoint", null);
        this._allMicrotasksBreakpoint = null;

        this._breakpoints = [];
        this._breakpointContentIdentifierMap = new Multimap;
        this._breakpointScriptIdentifierMap = new Multimap;
        this._breakpointIdMap = new Map;
        this._sourceCodeContentIdentifierMap = new Map;

        this._symbolicBreakpoints = [];

        this._nextBreakpointActionIdentifier = 1;

        this._blackboxedURLsSetting = new WI.Setting("debugger-blackboxed-urls", []);
        this._blackboxedPatternsSetting = new WI.Setting("debugger-blackboxed-patterns", []);
        this._blackboxedPatternDataMap = new Map;
        this._blackboxedCallFrameGroupsToAutoExpand = [];

        this._activeCallFrame = null;

        this._internalWebKitScripts = [];
        this._targetDebuggerDataMap = new Map;

        // Used to detect deleted probe actions.
        this._knownProbeIdentifiersForBreakpoint = new Map;

        // Main lookup tables for probes and probe sets.
        this._probesByIdentifier = new Map;
        this._probeSetsByBreakpoint = new Map;

        // Restore the correct breakpoints enabled setting if Web Inspector had
        // previously been left in a state where breakpoints were temporarily disabled.
        this._temporarilyDisabledBreakpointsRestoreSetting = new WI.Setting("temporarily-disabled-breakpoints-restore", null);
        if (this._temporarilyDisabledBreakpointsRestoreSetting.value !== null) {
            this._breakpointsEnabledSetting.value = this._temporarilyDisabledBreakpointsRestoreSetting.value;
            this._temporarilyDisabledBreakpointsRestoreSetting.value = null;
        }
        this._temporarilyDisableBreakpointsRequestCount = 0;

        this._ignoreBreakpointDisplayLocationDidChangeEvent = false;

        WI.Target.registerInitializationPromise((async () => {
            let existingSerializedBreakpoints = WI.Setting.migrateValue("breakpoints");
            if (existingSerializedBreakpoints) {
                for (let existingSerializedBreakpoint of existingSerializedBreakpoints)
                    await WI.objectStores.breakpoints.putObject(WI.JavaScriptBreakpoint.fromJSON(existingSerializedBreakpoint));
            }

            let serializedBreakpoints = await WI.objectStores.breakpoints.getAll();

            this._restoringBreakpoints = true;
            for (let serializedBreakpoint of serializedBreakpoints) {
                let breakpoint = WI.JavaScriptBreakpoint.fromJSON(serializedBreakpoint);

                const key = null;
                WI.objectStores.breakpoints.associateObject(breakpoint, key, serializedBreakpoint);

                let sourceCode = this._sourceCodeContentIdentifierMap.get(breakpoint.contentIdentifier);
                if (sourceCode)
                    this._associateBreakpointsWithSourceCode([breakpoint], sourceCode);

                this.addBreakpoint(breakpoint);
            }
            this._restoringBreakpoints = false;
            this._sourceCodeContentIdentifierMap = undefined;
        })());

        if (WI.SymbolicBreakpoint.supported()) {
            WI.Target.registerInitializationPromise((async () => {
                let serializedSymbolicBreakpoints = await WI.objectStores.symbolicBreakpoints.getAll();

                this._restoringBreakpoints = true;
                for (let serializedSymbolicBreakpoint of serializedSymbolicBreakpoints) {
                    let symbolicBreakpoint = WI.SymbolicBreakpoint.fromJSON(serializedSymbolicBreakpoint);

                    const key = null;
                    WI.objectStores.symbolicBreakpoints.associateObject(symbolicBreakpoint, key, serializedSymbolicBreakpoint);

                    this.addSymbolicBreakpoint(symbolicBreakpoint);
                }
                this._restoringBreakpoints = false;
            })());
        }

        WI.Target.registerInitializationPromise((async () => {
            // Wait one microtask so that `WI.debuggerManager` can be initialized.
            await new Promise((resolve, reject) => queueMicrotask(resolve));

            let loadSpecialBreakpoint = (setting, enabledSettingsKey, shownSettingsKey) => {
                let serializedBreakpoint = setting.value;

                if (!serializedBreakpoint && (!shownSettingsKey || WI.Setting.migrateValue(shownSettingsKey))) {
                    serializedBreakpoint = setting.value = {};
                    setting.save();
                }

                if (WI.Setting.migrateValue(enabledSettingsKey)) {
                    if (!serializedBreakpoint)
                        serializedBreakpoint = setting.value = {};
                    serializedBreakpoint.disabled = false;
                    setting.save();
                }

                if (!serializedBreakpoint)
                    return null;

                return this._createSpecialBreakpoint(serializedBreakpoint);
            };

            this._restoringBreakpoints = true;

            if (WI.JavaScriptBreakpoint.supportsDebuggerStatements()) {
                this._debuggerStatementsBreakpoint = loadSpecialBreakpoint(this._debuggerStatementsBreakpointSetting, "break-on-debugger-statements");
                if (this._debuggerStatementsBreakpoint)
                    this.addBreakpoint(this._debuggerStatementsBreakpoint);
            }

            this._allExceptionsBreakpoint = loadSpecialBreakpoint(this._allExceptionsBreakpointSetting, "break-on-all-exceptions");
            if (this._allExceptionsBreakpoint)
                this.addBreakpoint(this._allExceptionsBreakpoint);

            this._uncaughtExceptionsBreakpoint = loadSpecialBreakpoint(this._uncaughtExceptionsBreakpointSetting, "break-on-uncaught-exceptions");
            if (this._uncaughtExceptionsBreakpoint)
                this.addBreakpoint(this._uncaughtExceptionsBreakpoint);

            this._assertionFailuresBreakpoint = loadSpecialBreakpoint(this._assertionFailuresBreakpointSetting, "break-on-assertion-failures", "show-assertion-failures-breakpoint");
            if (this._assertionFailuresBreakpoint)
                this.addBreakpoint(this._assertionFailuresBreakpoint);

            if (WI.JavaScriptBreakpoint.supportsMicrotasks()) {
                this._allMicrotasksBreakpoint = loadSpecialBreakpoint(this._allMicrotasksBreakpointSetting, "break-on-all-microtasks", "show-all-microtasks-breakpoint");
                if (this._allMicrotasksBreakpoint)
                    this.addBreakpoint(this._allMicrotasksBreakpoint);
            }

            this._restoringBreakpoints = false;
        })());
    }

    // Target

    initializeTarget(target)
    {
        let targetData = this.dataForTarget(target);

        // Initialize global state.
        target.DebuggerAgent.enable();
        target.DebuggerAgent.setBreakpointsActive(this._breakpointsEnabledSetting.value);

        if (WI.SymbolicBreakpoint.supported(target)) {
            for (let breakpoint of this._symbolicBreakpoints) {
                if (!breakpoint.disabled)
                    this._setSymbolicBreakpoint(breakpoint, target);
            }
        }

        if (this._debuggerStatementsBreakpoint)
            this._updateSpecialBreakpoint(this._debuggerStatementsBreakpoint, target);

        this._setPauseOnExceptions(target);

        if (this._assertionFailuresBreakpoint)
            this._updateSpecialBreakpoint(this._assertionFailuresBreakpoint, target);

        if (this._allMicrotasksBreakpoint)
            this._updateSpecialBreakpoint(this._allMicrotasksBreakpoint, target);

        target.DebuggerAgent.setAsyncStackTraceDepth(this._asyncStackTraceDepthSetting.value);

        // COMPATIBILITY (iOS 13): Debugger.setShouldBlackboxURL did not exist yet.
        if (target.hasCommand("Debugger.setShouldBlackboxURL")) {
            const shouldBlackbox = true;

            {
                const caseSensitive = true;
                for (let url of this._blackboxedURLsSetting.value)
                    target.DebuggerAgent.setShouldBlackboxURL(url, shouldBlackbox, caseSensitive);
            }

            {
                const isRegex = true;
                for (let data of this._blackboxedPatternsSetting.value) {
                    this._blackboxedPatternDataMap.set(new RegExp(data.url, !data.caseSensitive ? "i" : ""), data);
                    target.DebuggerAgent.setShouldBlackboxURL(data.url, shouldBlackbox, data.caseSensitive, isRegex);
                }
            }

            for (let sourceMap of WI.SourceMap.instances) {
                if (sourceMap.originalSourceCode.supportsScriptBlackboxing)
                    this._updateBlackbox([target], sourceMap.originalSourceCode);
            }
        }

        this._setBlackboxBreakpointEvaluations(target);

        if (WI.engineeringSettingsAllowed()) {
            // COMPATIBILITY (iOS 12): DebuggerAgent.setPauseForInternalScripts did not exist yet.
            if (target.hasCommand("Debugger.setPauseForInternalScripts"))
                target.DebuggerAgent.setPauseForInternalScripts(WI.settings.engineeringPauseForInternalScripts.value);
        }

        if (this.paused)
            targetData.pauseIfNeeded();

        // Initialize breakpoints.
        this._restoringBreakpoints = true;
        for (let breakpoint of this._breakpoints) {
            if (breakpoint.disabled)
                continue;
            if (!breakpoint.contentIdentifier)
                continue;
            this._setBreakpoint(breakpoint, target);
        }
        this._restoringBreakpoints = false;
    }

    // Static

    static supportsBlackboxingScripts()
    {
        // COMPATIBILITY (iOS 13): Debugger.setShouldBlackboxURL did not exist yet.
        return InspectorBackend.hasCommand("Debugger.setShouldBlackboxURL");
    }

    static supportsBlackboxingBreakpointEvaluations()
    {
        // COMPATIBILITY (macOS 12.3, iOS 15.4): Debugger.setBlackboxBreakpointEvaluations did not exist yet.
        return InspectorBackend.hasCommand("Debugger.setBlackboxBreakpointEvaluations");
    }

    static pauseReasonFromPayload(payload)
    {
        switch (payload) {
        case InspectorBackend.Enum.Debugger.PausedReason.AnimationFrame:
            return WI.DebuggerManager.PauseReason.AnimationFrame;
        case InspectorBackend.Enum.Debugger.PausedReason.Assert:
            return WI.DebuggerManager.PauseReason.Assertion;
        case InspectorBackend.Enum.Debugger.PausedReason.BlackboxedScript:
            return WI.DebuggerManager.PauseReason.BlackboxedScript;
        case InspectorBackend.Enum.Debugger.PausedReason.Breakpoint:
            return WI.DebuggerManager.PauseReason.Breakpoint;
        case InspectorBackend.Enum.Debugger.PausedReason.CSPViolation:
            return WI.DebuggerManager.PauseReason.CSPViolation;
        case InspectorBackend.Enum.Debugger.PausedReason.DOM:
            return WI.DebuggerManager.PauseReason.DOM;
        case InspectorBackend.Enum.Debugger.PausedReason.DebuggerStatement:
            return WI.DebuggerManager.PauseReason.DebuggerStatement;
        case InspectorBackend.Enum.Debugger.PausedReason.EventListener:
            return WI.DebuggerManager.PauseReason.EventListener;
        case InspectorBackend.Enum.Debugger.PausedReason.Exception:
            return WI.DebuggerManager.PauseReason.Exception;
        case InspectorBackend.Enum.Debugger.PausedReason.FunctionCall:
            return WI.DebuggerManager.PauseReason.FunctionCall;
        case InspectorBackend.Enum.Debugger.PausedReason.Interval:
            return WI.DebuggerManager.PauseReason.Interval;
        case InspectorBackend.Enum.Debugger.PausedReason.Listener:
            return WI.DebuggerManager.PauseReason.Listener;
        case InspectorBackend.Enum.Debugger.PausedReason.Microtask:
            return WI.DebuggerManager.PauseReason.Microtask;
        case InspectorBackend.Enum.Debugger.PausedReason.PauseOnNextStatement:
            return WI.DebuggerManager.PauseReason.PauseOnNextStatement;
        case InspectorBackend.Enum.Debugger.PausedReason.Timeout:
            return WI.DebuggerManager.PauseReason.Timeout;
        case InspectorBackend.Enum.Debugger.PausedReason.Timer:
            return WI.DebuggerManager.PauseReason.Timer;
        case InspectorBackend.Enum.Debugger.PausedReason.URL:
        case InspectorBackend.Enum.Debugger.PausedReason.Fetch: // COMPATIBILITY (macOS 13.0, iOS 16.0): Debugger.paused.reason.Fetch was replaced by Debugger.paused.reason.URL
        case InspectorBackend.Enum.Debugger.PausedReason.XHR: // COMPATIBILITY (macOS 13.0, iOS 16.0): Debugger.paused.reason.XHR was replaced by Debugger.paused.reason.URL
            return WI.DebuggerManager.PauseReason.URL;
        default:
            return WI.DebuggerManager.PauseReason.Other;
        }
    }

    // Public

    get paused()
    {
        for (let [target, targetData] of this._targetDebuggerDataMap) {
            if (targetData.paused)
                return true;
        }

        return false;
    }

    get activeCallFrame()
    {
        return this._activeCallFrame;
    }

    set activeCallFrame(callFrame)
    {
        if (callFrame === this._activeCallFrame)
            return;

        this._activeCallFrame = callFrame || null;

        this.dispatchEventToListeners(WI.DebuggerManager.Event.ActiveCallFrameDidChange);
    }

    dataForTarget(target)
    {
        let targetData = this._targetDebuggerDataMap.get(target);
        if (targetData)
            return targetData;

        targetData = new WI.DebuggerData(target);
        this._targetDebuggerDataMap.set(target, targetData);
        return targetData;
    }

    get debuggerStatementsBreakpoint() { return this._debuggerStatementsBreakpoint; }
    get allExceptionsBreakpoint() { return this._allExceptionsBreakpoint; }
    get uncaughtExceptionsBreakpoint() { return this._uncaughtExceptionsBreakpoint; }
    get assertionFailuresBreakpoint() { return this._assertionFailuresBreakpoint; }
    get allMicrotasksBreakpoint() { return this._allMicrotasksBreakpoint; }
    get breakpoints() { return this._breakpoints; }

    createAssertionFailuresBreakpoint(options = {})
    {
        console.assert(!this._assertionFailuresBreakpoint);

        this._assertionFailuresBreakpoint = this._createSpecialBreakpoint(options);
        this.addBreakpoint(this._assertionFailuresBreakpoint);
    }

    createAllMicrotasksBreakpoint(options = {})
    {
        console.assert(!this._allMicrotasksBreakpoint);

        this._allMicrotasksBreakpoint = this._createSpecialBreakpoint(options);
        this.addBreakpoint(this._allMicrotasksBreakpoint);
    }

    breakpointForIdentifier(id)
    {
        return this._breakpointIdMap.get(id) || null;
    }

    breakpointsForSourceCode(sourceCode)
    {
        console.assert(sourceCode instanceof WI.Resource || sourceCode instanceof WI.Script);

        if (sourceCode instanceof WI.SourceMapResource)
            return Array.from(this.breakpointsForSourceCode(sourceCode.sourceMap.originalSourceCode)).filter((breakpoint) => breakpoint.sourceCodeLocation.displaySourceCode === sourceCode);

        this._sourceCodeContentIdentifierMap?.set(sourceCode.contentIdentifier, sourceCode);

        let contentIdentifierBreakpoints = this._breakpointContentIdentifierMap.get(sourceCode.contentIdentifier);
        if (contentIdentifierBreakpoints) {
            this._associateBreakpointsWithSourceCode(contentIdentifierBreakpoints, sourceCode);
            return contentIdentifierBreakpoints;
        }

        if (sourceCode instanceof WI.Script) {
            let scriptIdentifierBreakpoints = this._breakpointScriptIdentifierMap.get(sourceCode.id);
            if (scriptIdentifierBreakpoints) {
                this._associateBreakpointsWithSourceCode(scriptIdentifierBreakpoints, sourceCode);
                return scriptIdentifierBreakpoints;
            }
        }

        return [];
    }

    breakpointsForSourceCodeLocation(sourceCodeLocation)
    {
        console.assert(sourceCodeLocation instanceof WI.SourceCodeLocation, sourceCodeLocation);

        return this.breakpointsForSourceCode(sourceCodeLocation.sourceCode)
            .filter((breakpoint) => breakpoint.hasResolvedLocation(sourceCodeLocation));
    }

    breakpointForSourceCodeLocation(sourceCodeLocation)
    {
        console.assert(sourceCodeLocation instanceof WI.SourceCodeLocation);

        for (let breakpoint of this.breakpointsForSourceCode(sourceCodeLocation.sourceCode)) {
            if (breakpoint.sourceCodeLocation.isEqual(sourceCodeLocation))
                return breakpoint;
        }

        return null;
    }

    symbolicBreakpointsForSymbol(symbol)
    {
        console.assert(WI.SymbolicBreakpoint.supported());

        // Order symbolic breakpoints based on how closely they match the given symbol. As an example,
        // a regular expression is likely going to match more symbols than a case-insensitive string.
        const rankFunctions = [
            (breakpoint) => breakpoint.caseSensitive && !breakpoint.isRegex,  // exact match
            (breakpoint) => !breakpoint.caseSensitive && !breakpoint.isRegex, // case-insensitive
            (breakpoint) => breakpoint.caseSensitive && breakpoint.isRegex,   // case-sensitive regex
            (breakpoint) => !breakpoint.caseSensitive && breakpoint.isRegex,  // case-insensitive regex
        ];
        return this._symbolicBreakpoints
            .filter((breakpoint) => breakpoint.matches(symbol))
            .sort((a, b) => {
                let aRank = rankFunctions.findIndex((rankFunction) => rankFunction(a));
                let bRank = rankFunctions.findIndex((rankFunction) => rankFunction(b));
                return aRank - bRank;
            });
    }

    get breakpointsEnabled()
    {
        return this._breakpointsEnabledSetting.value;
    }

    set breakpointsEnabled(enabled)
    {
        if (this._breakpointsEnabledSetting.value === enabled)
            return;

        console.assert(!(enabled && this.breakpointsDisabledTemporarily), "Should not enable breakpoints when we are temporarily disabling breakpoints.");
        if (enabled && this.breakpointsDisabledTemporarily)
            return;

        this._breakpointsEnabledSetting.value = enabled;

        for (let target of WI.targets) {
            target.DebuggerAgent.setBreakpointsActive(enabled);
            this._setPauseOnExceptions(target);
        }

        this.dispatchEventToListeners(WI.DebuggerManager.Event.BreakpointsEnabledDidChange);
    }

    get breakpointsDisabledTemporarily()
    {
        return this._temporarilyDisabledBreakpointsRestoreSetting.value !== null;
    }

    scriptForIdentifier(id, target)
    {
        console.assert(target instanceof WI.Target);
        return this.dataForTarget(target).scriptForIdentifier(id);
    }

    scriptsForURL(url, target)
    {
        // FIXME: This may not be safe. A Resource's URL may differ from a Script's URL.
        console.assert(target instanceof WI.Target);
        return this.dataForTarget(target).scriptsForURL(url);
    }

    get searchableScripts()
    {
        return this.knownNonResourceScripts.filter((script) => !!script.contentIdentifier);
    }

    get knownNonResourceScripts()
    {
        let knownScripts = [];

        for (let targetData of this._targetDebuggerDataMap.values()) {
            for (let script of targetData.scripts) {
                if (script.resource)
                    continue;
                if (!WI.settings.debugShowConsoleEvaluations.value && isWebInspectorConsoleEvaluationScript(script.sourceURL))
                    continue;
                if (!WI.settings.engineeringShowInternalScripts.value && isWebKitInternalScript(script.sourceURL))
                    continue;
                knownScripts.push(script);
            }
        }

        return knownScripts;
    }

    blackboxDataForSourceCode(sourceCode)
    {
        if (sourceCode instanceof WI.SourceMapResource && sourceCode.ignored)
            return {type: DebuggerManager.BlackboxType.URL};

        for (let regex of this._blackboxedPatternDataMap.keys()) {
            if (regex.test(sourceCode.contentIdentifier))
                return {type: DebuggerManager.BlackboxType.Pattern, regex};
        }

        if (this._blackboxedURLsSetting.value.includes(sourceCode.contentIdentifier))
            return {type: DebuggerManager.BlackboxType.URL};

        return null;
    }

    get blackboxPatterns()
    {
        return Array.from(this._blackboxedPatternDataMap.keys());
    }

    setShouldBlackboxScript(sourceCode, shouldBlackbox)
    {
        console.assert(sourceCode instanceof WI.SourceCode, sourceCode);
        console.assert(sourceCode.supportsScriptBlackboxing, sourceCode);
        console.assert(sourceCode.contentIdentifier, sourceCode);
        console.assert(!isWebKitInjectedScript(sourceCode.contentIdentifier, sourceCode));
        console.assert(shouldBlackbox !== (this.blackboxDataForSourceCode(sourceCode)?.type === DebuggerManager.BlackboxType.URL), sourceCode);

        this._blackboxedURLsSetting.value.toggleIncludes(sourceCode.contentIdentifier, shouldBlackbox);
        this._blackboxedURLsSetting.save();

        if (!shouldBlackbox && sourceCode instanceof WI.SourceMapResource)
            sourceCode.ignored = false;

        this._updateBlackbox(WI.targets, sourceCode);

        this.dispatchEventToListeners(DebuggerManager.Event.BlackboxChanged);
    }

    setShouldBlackboxPattern(regex, shouldBlackbox)
    {
        console.assert(DebuggerManager.supportsBlackboxingScripts());
        console.assert(regex instanceof RegExp);

        if (shouldBlackbox) {
            console.assert(!this._blackboxedPatternDataMap.has(regex));

            let data = {
                url: regex.source,
                caseSensitive: !regex.ignoreCase,
            };
            this._blackboxedPatternDataMap.set(regex, data);
            this._blackboxedPatternsSetting.value.push(data);
        } else {
            console.assert(this._blackboxedPatternDataMap.has(regex));
            this._blackboxedPatternsSetting.value.remove(this._blackboxedPatternDataMap.take(regex));
        }

        this._blackboxedPatternsSetting.save();

        const isRegex = true;
        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 13): Debugger.setShouldBlackboxURL did not exist yet.
            if (target.hasCommand("Debugger.setShouldBlackboxURL"))
                target.DebuggerAgent.setShouldBlackboxURL(regex.source, !!shouldBlackbox, !regex.ignoreCase, isRegex);
        }

        for (let sourceMap of WI.SourceMap.instances) {
            if (sourceMap.originalSourceCode.supportsScriptBlackboxing)
                this._updateBlackbox(WI.targets, sourceMap.originalSourceCode);
        }

        this.dispatchEventToListeners(DebuggerManager.Event.BlackboxChanged);
    }

    rememberBlackboxedCallFrameGroupToAutoExpand(blackboxedCallFrameGroup)
    {
        console.assert(!this.shouldAutoExpandBlackboxedCallFrameGroup(blackboxedCallFrameGroup), blackboxedCallFrameGroup);

        this._blackboxedCallFrameGroupsToAutoExpand.push(blackboxedCallFrameGroup);
    }

    shouldAutoExpandBlackboxedCallFrameGroup(blackboxedCallFrameGroup)
    {
        console.assert(Array.isArray(blackboxedCallFrameGroup) && blackboxedCallFrameGroup.length && blackboxedCallFrameGroup.every((callFrame) => callFrame instanceof WI.CallFrame && callFrame.blackboxed), blackboxedCallFrameGroup);

        return this._blackboxedCallFrameGroupsToAutoExpand.some((blackboxedCallFrameGroupToAutoExpand) => {
            if (blackboxedCallFrameGroupToAutoExpand.length !== blackboxedCallFrameGroup.length)
                return false;

            return blackboxedCallFrameGroupToAutoExpand.every((item, i) => item.isEqual(blackboxedCallFrameGroup[i]));
        });
    }

    get asyncStackTraceDepth()
    {
        return this._asyncStackTraceDepthSetting.value;
    }

    set asyncStackTraceDepth(x)
    {
        if (this._asyncStackTraceDepthSetting.value === x)
            return;

        this._asyncStackTraceDepthSetting.value = x;

        for (let target of WI.targets)
            target.DebuggerAgent.setAsyncStackTraceDepth(this._asyncStackTraceDepthSetting.value);
    }

    get probeSets()
    {
        return [...this._probeSetsByBreakpoint.values()];
    }

    probeForIdentifier(identifier)
    {
        return this._probesByIdentifier.get(identifier);
    }

    pause()
    {
        if (this.paused)
            return Promise.resolve();

        this.dispatchEventToListeners(WI.DebuggerManager.Event.WaitingToPause);

        let promises = [this.awaitEvent(WI.DebuggerManager.Event.Paused, this)];
        for (let targetData of this._targetDebuggerDataMap.values())
            promises.push(targetData.pauseIfNeeded());
        return Promise.all(promises);
    }

    resume()
    {
        if (!this.paused)
            return Promise.resolve();

        let promises = [this.awaitEvent(WI.DebuggerManager.Event.Resumed, this)];
        for (let targetData of this._targetDebuggerDataMap.values())
            promises.push(targetData.resumeIfNeeded());
        return Promise.all(promises);
    }

    stepNext()
    {
        if (!this.paused)
            return Promise.reject(new Error("Cannot step next because debugger is not paused."));

        return Promise.all([
            this.awaitEvent(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this),
            this._activeCallFrame.target.DebuggerAgent.stepNext(),
        ]);
    }

    stepOver()
    {
        if (!this.paused)
            return Promise.reject(new Error("Cannot step over because debugger is not paused."));

        return Promise.all([
            this.awaitEvent(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this),
            this._activeCallFrame.target.DebuggerAgent.stepOver(),
        ]);
    }

    stepInto()
    {
        if (!this.paused)
            return Promise.reject(new Error("Cannot step into because debugger is not paused."));

        return Promise.all([
            this.awaitEvent(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this),
            this._activeCallFrame.target.DebuggerAgent.stepInto(),
        ]);
    }

    stepOut()
    {
        if (!this.paused)
            return Promise.reject(new Error("Cannot step out because debugger is not paused."));

        return Promise.all([
            this.awaitEvent(WI.DebuggerManager.Event.ActiveCallFrameDidChange, this),
            this._activeCallFrame.target.DebuggerAgent.stepOut(),
        ]);
    }

    continueUntilNextRunLoop(target)
    {
        return this.dataForTarget(target).continueUntilNextRunLoop();
    }

    continueToLocation(script, lineNumber, columnNumber)
    {
        return script.target.DebuggerAgent.continueToLocation({scriptId: script.id, lineNumber, columnNumber});
    }

    addBreakpoint(breakpoint)
    {
        console.assert(breakpoint instanceof WI.JavaScriptBreakpoint, breakpoint);
        if (!breakpoint)
            return;

        if (breakpoint.special)
            this._updateSpecialBreakpoint(breakpoint);
        else {
            if (breakpoint.contentIdentifier)
                this._breakpointContentIdentifierMap.add(breakpoint.contentIdentifier, breakpoint);

            if (breakpoint.scriptIdentifier)
                this._breakpointScriptIdentifierMap.add(breakpoint.scriptIdentifier, breakpoint);

            this._breakpoints.push(breakpoint);

            if (!breakpoint.disabled)
                this._setBreakpoint(breakpoint);

            if (!this._restoringBreakpoints)
                WI.objectStores.breakpoints.putObject(breakpoint);
        }

        this.addProbesForBreakpoint(breakpoint);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.BreakpointAdded, {breakpoint});
    }

    removeBreakpoint(breakpoint)
    {
        console.assert(breakpoint instanceof WI.JavaScriptBreakpoint, breakpoint);
        if (!breakpoint)
            return;

        console.assert(breakpoint.removable, breakpoint);
        if (!breakpoint.removable)
            return;

        let special = breakpoint.special;

        if (!special) {
            this._breakpoints.remove(breakpoint);

            if (breakpoint.identifier)
                this._removeBreakpoint(breakpoint);

            if (breakpoint.contentIdentifier)
                this._breakpointContentIdentifierMap.delete(breakpoint.contentIdentifier, breakpoint);

            if (breakpoint.scriptIdentifier)
                this._breakpointScriptIdentifierMap.delete(breakpoint.scriptIdentifier, breakpoint);
        }

        // Disable the breakpoint first, so removing actions doesn't re-add the breakpoint.
        breakpoint.disabled = true;
        breakpoint.clearActions();

        if (special) {
            switch (breakpoint) {
            case this._assertionFailuresBreakpoint:
                this._assertionFailuresBreakpointSetting.reset();
                this._assertionFailuresBreakpoint = null;
                break;

            case this._allMicrotasksBreakpoint:
                this._allMicrotasksBreakpointSetting.reset();
                this._allMicrotasksBreakpoint = null;
                break;
            }
        } else if (!this._restoringBreakpoints)
            WI.objectStores.breakpoints.deleteObject(breakpoint);

        this.removeProbesForBreakpoint(breakpoint);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.BreakpointRemoved, {breakpoint});
    }

    addSymbolicBreakpoint(breakpoint)
    {
        console.assert(WI.SymbolicBreakpoint.supported());
        console.assert(breakpoint instanceof WI.SymbolicBreakpoint, breakpoint);
        console.assert(!breakpoint.special, breakpoint);

        if (this._symbolicBreakpoints.some((existingBreakpoint) => existingBreakpoint.equals(breakpoint)))
            return false;

        this._symbolicBreakpoints.push(breakpoint);

        if (!breakpoint.disabled) {
            for (let target of WI.targets)
                this._setSymbolicBreakpoint(breakpoint, target);
        }

        if (!this._restoringBreakpoints)
            WI.objectStores.symbolicBreakpoints.putObject(breakpoint);

        this.addProbesForBreakpoint(breakpoint);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.SymbolicBreakpointAdded, {breakpoint});

        return true;
    }

    removeSymbolicBreakpoint(breakpoint)
    {
        console.assert(WI.SymbolicBreakpoint.supported());
        console.assert(breakpoint instanceof WI.SymbolicBreakpoint, breakpoint);
        console.assert(breakpoint.removable, breakpoint);
        console.assert(!breakpoint.special, breakpoint);

        // Disable the breakpoint first, so removing actions doesn't re-add the breakpoint.
        breakpoint.disabled = true;
        breakpoint.clearActions();

        this._symbolicBreakpoints.remove(breakpoint);

        if (!this._restoringBreakpoints)
            WI.objectStores.symbolicBreakpoints.deleteObject(breakpoint);

        this.removeProbesForBreakpoint(breakpoint);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.SymbolicBreakpointRemoved, {breakpoint});
    }

    nextBreakpointActionIdentifier()
    {
        return this._nextBreakpointActionIdentifier++;
    }

    addProbesForBreakpoint(breakpoint)
    {
        if (this._knownProbeIdentifiersForBreakpoint.has(breakpoint))
            return;

        this._knownProbeIdentifiersForBreakpoint.set(breakpoint, new Set);

        this.updateProbesForBreakpoint(breakpoint);
    }

    removeProbesForBreakpoint(breakpoint)
    {
        console.assert(this._knownProbeIdentifiersForBreakpoint.has(breakpoint));

        this.updateProbesForBreakpoint(breakpoint);
        this._knownProbeIdentifiersForBreakpoint.delete(breakpoint);
    }

    updateProbesForBreakpoint(breakpoint)
    {
        let knownProbeIdentifiers = this._knownProbeIdentifiersForBreakpoint.get(breakpoint);
        if (!knownProbeIdentifiers) {
            // Sometimes actions change before the added breakpoint is fully dispatched.
            this.addProbesForBreakpoint(breakpoint);
            return;
        }

        let seenProbeIdentifiers = new Set;

        for (let probeAction of breakpoint.probeActions) {
            let probeIdentifier = probeAction.id;
            console.assert(probeIdentifier, "Probe added without breakpoint action identifier: ", breakpoint);

            seenProbeIdentifiers.add(probeIdentifier);
            if (!knownProbeIdentifiers.has(probeIdentifier)) {
                // New probe; find or create relevant probe set.
                knownProbeIdentifiers.add(probeIdentifier);
                let probeSet = this._probeSetForBreakpoint(breakpoint);
                let newProbe = new WI.Probe(probeIdentifier, breakpoint, probeAction.data);
                this._probesByIdentifier.set(probeIdentifier, newProbe);
                probeSet.addProbe(newProbe);
                break;
            }

            let probe = this._probesByIdentifier.get(probeIdentifier);
            console.assert(probe, "Probe known but couldn't be found by identifier: ", probeIdentifier);
            // Update probe expression; if it differed, change events will fire.
            probe.expression = probeAction.data;
        }

        // Look for missing probes based on what we saw last.
        for (let probeIdentifier of knownProbeIdentifiers) {
            if (seenProbeIdentifiers.has(probeIdentifier))
                break;

            // The probe has gone missing, remove it.
            let probeSet = this._probeSetForBreakpoint(breakpoint);
            let probe = this._probesByIdentifier.get(probeIdentifier);
            this._probesByIdentifier.delete(probeIdentifier);
            knownProbeIdentifiers.delete(probeIdentifier);
            probeSet.removeProbe(probe);

            // Remove the probe set if it has become empty.
            if (!probeSet.probes.length) {
                this._probeSetsByBreakpoint.delete(probeSet.breakpoint);
                probeSet.willRemove();
                this.dispatchEventToListeners(WI.DebuggerManager.Event.ProbeSetRemoved, {probeSet});
            }
        }
    }

    // DebuggerObserver

    breakpointResolved(target, breakpointIdentifier, location)
    {
        let breakpoint = this._breakpointIdMap.get(breakpointIdentifier);
        console.assert(breakpoint);
        if (!breakpoint)
            return;

        console.assert(breakpoint.identifier === breakpointIdentifier);

        let sourceCodeLocation = this._sourceCodeLocationFromPayload(target, location);

        if (!breakpoint.sourceCodeLocation.sourceCode)
            breakpoint.sourceCodeLocation.sourceCode = sourceCodeLocation.sourceCode;

        breakpoint.addResolvedLocation(sourceCodeLocation);
    }

    globalObjectCleared(target)
    {
        let wasPaused = this.paused;

        WI.Script.resetUniqueDisplayNameNumbers(target);

        this._internalWebKitScripts = [];
        this._targetDebuggerDataMap.clear();

        this._ignoreBreakpointDisplayLocationDidChangeEvent = true;

        // Mark all the breakpoints as unresolved. They will be reported as resolved when
        // breakpointResolved is called as the page loads.
        for (let breakpoint of this._breakpoints) {
            breakpoint.clearResolvedLocations();

            if (breakpoint.sourceCodeLocation.sourceCode)
                breakpoint.sourceCodeLocation.sourceCode = null;
        }

        this._ignoreBreakpointDisplayLocationDidChangeEvent = false;

        this.dispatchEventToListeners(WI.DebuggerManager.Event.ScriptsCleared);

        if (wasPaused)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.Resumed);
    }

    debuggerDidPause(target, callFramesPayload, reason, data, asyncStackTracePayload)
    {
        if (this._delayedResumeTimeout) {
            clearTimeout(this._delayedResumeTimeout);
            this._delayedResumeTimeout = undefined;
        }

        let wasPaused = this.paused;
        let targetData = this._targetDebuggerDataMap.get(target);

        let callFrames = [];
        let pauseReason = DebuggerManager.pauseReasonFromPayload(reason);
        let pauseData = data || null;

        for (var i = 0; i < callFramesPayload.length; ++i) {
            var callFramePayload = callFramesPayload[i];
            var sourceCodeLocation = this._sourceCodeLocationFromPayload(target, callFramePayload.location);
            // FIXME: There may be useful call frames without a source code location (native callframes), should we include them?
            if (!sourceCodeLocation)
                continue;
            if (!sourceCodeLocation.sourceCode)
                continue;

            // Exclude the case where the call frame is in the inspector code.
            if (!WI.settings.engineeringShowInternalScripts.value && isWebKitInternalScript(sourceCodeLocation.sourceCode.sourceURL))
                continue;

            let scopeChain = this._scopeChainFromPayload(target, callFramePayload.scopeChain);
            let callFrame = WI.CallFrame.fromDebuggerPayload(target, callFramePayload, scopeChain, sourceCodeLocation);
            callFrames.push(callFrame);
        }

        let activeCallFrame = callFrames[0];

        if (!activeCallFrame) {
            // FIXME: This may not be safe for multiple threads/targets.
            // This indicates we were pausing in internal scripts only (Injected Scripts).
            // Just resume and skip past this pause. We should be fixing the backend to
            // not send such pauses.
            if (wasPaused)
                target.DebuggerAgent.continueUntilNextRunLoop();
            else
                target.DebuggerAgent.resume();
            this._didResumeInternal(target);
            return;
        }

        let stackTrace = new WI.StackTrace(callFrames, {
            parentStackTrace: WI.StackTrace.fromPayload(target, asyncStackTracePayload),
        });
        targetData.updateForPause(stackTrace, pauseReason, pauseData);

        // Pause other targets because at least one target has paused.
        // FIXME: Should this be done on the backend?
        for (let [otherTarget, otherTargetData] of this._targetDebuggerDataMap)
            otherTargetData.pauseIfNeeded();

        let activeCallFrameDidChange = this._activeCallFrame && this._activeCallFrame.target === target;
        if (activeCallFrameDidChange)
            this._activeCallFrame = activeCallFrame;
        else if (!wasPaused) {
            this._activeCallFrame = activeCallFrame;
            activeCallFrameDidChange = true;
        }

        if (!wasPaused)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.Paused);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.CallFramesDidChange, {target});

        if (activeCallFrameDidChange)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.ActiveCallFrameDidChange);
    }

    debuggerDidResume(target)
    {
        this._didResumeInternal(target);
    }

    playBreakpointActionSound(breakpointActionIdentifier)
    {
        InspectorFrontendHost.beep();
    }

    scriptDidParse(target, scriptIdentifier, url, startLine, startColumn, endLine, endColumn, isModule, isContentScript, sourceURL, sourceMapURL)
    {
        // Don't add the script again if it is already known.
        let targetData = this.dataForTarget(target);
        let existingScript = targetData.scriptForIdentifier(scriptIdentifier);
        if (existingScript) {
            console.assert(existingScript.url === (url || null));
            console.assert(existingScript.range.startLine === startLine);
            console.assert(existingScript.range.startColumn === startColumn);
            console.assert(existingScript.range.endLine === endLine);
            console.assert(existingScript.range.endColumn === endColumn);
            return;
        }

        if (!WI.settings.engineeringShowInternalScripts.value && isWebKitInternalScript(sourceURL))
            return;

        let range = new WI.TextRange(startLine, startColumn, endLine, endColumn);
        let sourceType = isModule ? WI.Script.SourceType.Module : WI.Script.SourceType.Program;
        let script = new WI.Script(target, scriptIdentifier, range, url, sourceType, isContentScript, sourceURL, sourceMapURL);

        targetData.addScript(script);

        // FIXME: <https://webkit.org/b/164427> Web Inspector: WorkerTarget's mainResource should be a Resource not a Script
        // We make the main resource of a WorkerTarget the Script instead of the Resource
        // because the frontend may not be informed of the Resource. We should guarantee
        // the frontend is informed of the Resource.
        if (WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker) {
            // A ServiceWorker starts with a LocalScript for the main resource but we can replace it during initialization.
            if (target.mainResource instanceof WI.LocalScript) {
                if (script.couldBeMainResource(target))
                    target.mainResource = script;
            }
        } else if (!target.mainResource && target !== WI.mainTarget) {
            // A Worker starts without a main resource and we insert one.
            if (script.couldBeMainResource(target)) {
                target.mainResource = script;
                if (script.resource)
                    target.resourceCollection.remove(script.resource);
            }
        }

        if (isWebKitInternalScript(script.sourceURL)) {
            this._internalWebKitScripts.push(script);
            if (!WI.settings.engineeringShowInternalScripts.value)
                return;
        }

        if (!WI.settings.debugShowConsoleEvaluations.value && isWebInspectorConsoleEvaluationScript(script.sourceURL))
            return;

        this.dispatchEventToListeners(WI.DebuggerManager.Event.ScriptAdded, {script});

        if ((target !== WI.mainTarget || WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker) && !script.isMainResource() && !script.resource)
            target.addScript(script);
    }

    scriptDidFail(target, url, scriptSource)
    {
        const sourceURL = null;
        const sourceType = WI.Script.SourceType.Program;
        let script = new WI.LocalScript(target, url, sourceURL, sourceType, scriptSource);

        // If there is already a resource we don't need to have the script anymore,
        // we only need a script to use for parser error location links.
        if (script.resource)
            return;

        let targetData = this.dataForTarget(target);
        targetData.addScript(script);
        target.addScript(script);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.ScriptAdded, {script});
    }

    didSampleProbe(target, sample)
    {
        console.assert(this._probesByIdentifier.has(sample.probeId), "Unknown probe identifier specified for sample: ", sample);
        let probe = this._probesByIdentifier.get(sample.probeId);
        let elapsedTime = WI.timelineManager.computeElapsedTime(sample.timestamp);
        let object = WI.RemoteObject.fromPayload(sample.payload, target);
        probe.addSample(new WI.ProbeSample(sample.sampleId, sample.batchId, elapsedTime, object));
    }

    // Private

    _sourceCodeLocationFromPayload(target, payload)
    {
        let targetData = this.dataForTarget(target);
        let script = targetData.scriptForIdentifier(payload.scriptId);
        if (!script)
            return null;

        return script.createSourceCodeLocation(payload.lineNumber, payload.columnNumber);
    }

    _scopeChainFromPayload(target, payload)
    {
        let scopeChain = [];
        for (let i = 0; i < payload.length; ++i)
            scopeChain.push(this._scopeChainNodeFromPayload(target, payload[i]));
        return scopeChain;
    }

    _scopeChainNodeFromPayload(target, payload)
    {
        var type = null;
        switch (payload.type) {
        case InspectorBackend.Enum.Debugger.ScopeType.Global:
            type = WI.ScopeChainNode.Type.Global;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.With:
            type = WI.ScopeChainNode.Type.With;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.Closure:
            type = WI.ScopeChainNode.Type.Closure;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.Catch:
            type = WI.ScopeChainNode.Type.Catch;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.FunctionName:
            type = WI.ScopeChainNode.Type.FunctionName;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.NestedLexical:
            type = WI.ScopeChainNode.Type.Block;
            break;
        case InspectorBackend.Enum.Debugger.ScopeType.GlobalLexicalEnvironment:
            type = WI.ScopeChainNode.Type.GlobalLexicalEnvironment;
            break;
        default:
            console.error("Unknown type: " + payload.type);
            break;
        }

        let object = WI.RemoteObject.fromPayload(payload.object, target);
        return new WI.ScopeChainNode(type, [object], payload.name, payload.location, payload.empty);
    }

    _setBreakpoint(breakpoint, specificTarget)
    {
        console.assert(!breakpoint.disabled);

        if (breakpoint.disabled)
            return;

        if (!this._restoringBreakpoints && !this.breakpointsDisabledTemporarily) {
            // Enable breakpoints since a breakpoint is being set. This eliminates
            // a multi-step process for the user that can be confusing.
            this.breakpointsEnabled = true;
        }

        function didSetBreakpoint(target, error, breakpointIdentifier, locations) {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this._breakpointIdMap.set(breakpointIdentifier, breakpoint);

            breakpoint.identifier = breakpointIdentifier;

            // Debugger.setBreakpoint returns a single location.
            if (!(locations instanceof Array))
                locations = [locations];

            for (let location of locations)
                this.breakpointResolved(target, breakpointIdentifier, location);
        }

        // The breakpoint will be resolved again by calling DebuggerAgent, so mark it as unresolved.
        // If something goes wrong it will stay unresolved and show up as such in the user interface.
        // When setting for a new target, don't change the resolved target.
        if (!specificTarget)
            breakpoint.clearResolvedLocations();

        if (breakpoint.contentIdentifier) {
            let targets = specificTarget ? [specificTarget] : WI.targets;
            for (let target of targets) {
                target.DebuggerAgent.setBreakpointByUrl.invoke({
                    lineNumber: breakpoint.sourceCodeLocation.lineNumber,
                    url: breakpoint.contentIdentifier,
                    urlRegex: undefined,
                    columnNumber: breakpoint.sourceCodeLocation.columnNumber,
                    options: breakpoint.optionsToProtocol(),
                }, didSetBreakpoint.bind(this, target));
            }
        } else if (breakpoint.scriptIdentifier) {
            let target = breakpoint.target;
            target.DebuggerAgent.setBreakpoint.invoke({
                location: {scriptId: breakpoint.scriptIdentifier, lineNumber: breakpoint.sourceCodeLocation.lineNumber, columnNumber: breakpoint.sourceCodeLocation.columnNumber},
                options: breakpoint.optionsToProtocol(),
            }, didSetBreakpoint.bind(this, target));
        } else
            WI.reportInternalError("Unknown source for breakpoint.");
    }

    _removeBreakpoint(breakpoint, callback)
    {
        if (!breakpoint.identifier)
            return;

        function didRemoveBreakpoint(target, error)
        {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this._breakpointIdMap.delete(breakpoint.identifier);

            breakpoint.identifier = null;

            // Don't reset resolved here since we want to keep disabled breakpoints looking like they
            // are resolved in the user interface. They will get marked as unresolved in reset.

            if (callback)
                callback(target);
        }

        if (breakpoint.contentIdentifier) {
            for (let target of WI.targets)
                target.DebuggerAgent.removeBreakpoint(breakpoint.identifier, didRemoveBreakpoint.bind(this, target));
        } else if (breakpoint.scriptIdentifier) {
            let target = breakpoint.target;
            target.DebuggerAgent.removeBreakpoint(breakpoint.identifier, didRemoveBreakpoint.bind(this, target));
        }
    }

    _setSymbolicBreakpoint(breakpoint, target)
    {
        console.assert(breakpoint instanceof WI.SymbolicBreakpoint, breakpoint);
        console.assert(!breakpoint.disabled, breakpoint);
        console.assert(WI.SymbolicBreakpoint.supported(target), target);

        if (!this._restoringBreakpoints && !this.breakpointsDisabledTemporarily)
            this.breakpointsEnabled = true;

        target.DebuggerAgent.addSymbolicBreakpoint.invoke({
            symbol: breakpoint.symbol,
            caseSensitive: breakpoint.caseSensitive,
            isRegex: breakpoint.isRegex,
            options: breakpoint.optionsToProtocol(),
        });
    }

    _removeSymbolicBreakpoint(breakpoint, target)
    {
        console.assert(breakpoint instanceof WI.SymbolicBreakpoint, breakpoint);
        console.assert(WI.SymbolicBreakpoint.supported(target), target);

        target.DebuggerAgent.removeSymbolicBreakpoint.invoke({
            symbol: breakpoint.symbol,
            caseSensitive: breakpoint.caseSensitive,
            isRegex: breakpoint.isRegex,
        });
    }

    _setPauseOnExceptions(target)
    {
        let commandArguments = {
            state: "none",
        };

        if (this._breakpointsEnabledSetting.value) {
            if (this._allExceptionsBreakpoint && !this._allExceptionsBreakpoint.disabled) {
                commandArguments.state = "all";
                commandArguments.options = this._allExceptionsBreakpoint.optionsToProtocol();
            } else if (this._uncaughtExceptionsBreakpoint && !this._uncaughtExceptionsBreakpoint.disabled) {
                commandArguments.state = "uncaught";
                commandArguments.options = this._uncaughtExceptionsBreakpoint.optionsToProtocol();
            }

            // Mark the uncaught breakpoint as unresolved if "all" as it includes "uncaught".
            // That way it is clear in the user interface that the breakpoint is ignored.
            if (this._uncaughtExceptionsBreakpoint)
                this._uncaughtExceptionsBreakpoint.resolved = commandArguments.state !== "all";
        }

        target.DebuggerAgent.setPauseOnExceptions.invoke(commandArguments);
    }

    _createSpecialBreakpoint(serializedBreakpoint = {})
    {
        let location = WI.SourceCodeLocation.specialBreakpointLocation;
        serializedBreakpoint.lineNumber = location.lineNumber;
        serializedBreakpoint.columnNumber = location.columnNumber;

        serializedBreakpoint.resolved = true;

        return WI.JavaScriptBreakpoint.fromJSON(serializedBreakpoint);
    }

    _updateSpecialBreakpoint(breakpoint, specificTarget)
    {
        console.assert(breakpoint.special, breakpoint);

        if (!breakpoint.disabled && !this._restoringBreakpoints && !this.breakpointsDisabledTemporarily)
            this.breakpointsEnabled = true;

        let targets = specificTarget ? [specificTarget] : WI.targets;

        let setting = null;
        let command = null;
        switch (breakpoint) {
        case this._debuggerStatementsBreakpoint:
            setting = this._debuggerStatementsBreakpointSetting;
            command = "setPauseOnDebuggerStatements";
            break;

        case this._allExceptionsBreakpoint:
            setting = this._allExceptionsBreakpointSetting;
            break;

        case this._uncaughtExceptionsBreakpoint:
            setting = this._uncaughtExceptionsBreakpointSetting;
            break;

        case this._assertionFailuresBreakpoint:
            setting = this._assertionFailuresBreakpointSetting;
            command = "setPauseOnAssertions";
            break;

        case this._allMicrotasksBreakpoint:
            setting = this._allMicrotasksBreakpointSetting;
            command = "setPauseOnMicrotasks";
            break;
        }
        console.assert(setting);

        if (!specificTarget)
            setting.value = breakpoint.toJSON();

        if (command) {
            let commandArguments = {
                enabled: !breakpoint.disabled,
            };
            if (!breakpoint.disabled)
                commandArguments.options = breakpoint.optionsToProtocol();

            for (let target of targets)
                target.DebuggerAgent[command].invoke(commandArguments);
        } else {
            console.assert(breakpoint === this._allExceptionsBreakpoint || breakpoint === this._uncaughtExceptionsBreakpoint, breakpoint);
            for (let target of targets)
                this._setPauseOnExceptions(target);
        }
    }

    _updateBlackbox(targets, sourceCode)
    {
        if (sourceCode instanceof WI.SourceMapResource)
            sourceCode = sourceCode.sourceMap.originalSourceCode;

        let commandArguments = {
            url: sourceCode.contentIdentifier,
            caseSensitive: true,
        };

        let sourceRanges = sourceCode.sourceMaps.flatMap((sourceMap) => sourceMap.calculateBlackboxSourceRangesForProtocol());
        console.assert(sourceCode instanceof WI.Script || !sourceRanges.length, sourceCode);
        if (sourceRanges.length) {
            commandArguments.shouldBlackbox = true;
            commandArguments.sourceRanges = sourceRanges;
        } else
            commandArguments.shouldBlackbox = !!this.blackboxDataForSourceCode(sourceCode);

        for (let target of targets) {
            // COMPATIBILITY (iOS 13): Debugger.setShouldBlackboxURL did not exist yet.
            if (target.hasCommand("Debugger.setShouldBlackboxURL"))
                target.DebuggerAgent.setShouldBlackboxURL.invoke(commandArguments);
        }
    }

    _setBlackboxBreakpointEvaluations(target)
    {
        // COMPATIBILITY (macOS 12.3, iOS 15.4): Debugger.setBlackboxBreakpointEvaluations did not exist yet.
        if (target.hasCommand("Debugger.setBlackboxBreakpointEvaluations"))
            target.DebuggerAgent.setBlackboxBreakpointEvaluations(WI.settings.blackboxBreakpointEvaluations.value);
    }

    _breakpointDisplayLocationDidChange(event)
    {
        if (this._ignoreBreakpointDisplayLocationDidChangeEvent)
            return;

        let breakpoint = event.target;
        if (!breakpoint.identifier || breakpoint.disabled)
            return;

        // Remove the breakpoint with its old id.
        this._removeBreakpoint(breakpoint, (target) => {
            // Add the breakpoint at its new lineNumber and get a new id.
            this._restoringBreakpoints = true;
            this._setBreakpoint(breakpoint, target);
            this._restoringBreakpoints = false;

            this.dispatchEventToListeners(WI.DebuggerManager.Event.BreakpointMoved, {breakpoint});
        });
    }

    _breakpointDisabledStateDidChange(event)
    {
        let breakpoint = event.target;

        if (breakpoint.special) {
            this._updateSpecialBreakpoint(breakpoint);
            return;
        }

        if (!this._restoringBreakpoints)
            WI.objectStores.breakpoints.putObject(breakpoint);

        if (breakpoint.disabled)
            this._removeBreakpoint(breakpoint);
        else
            this._setBreakpoint(breakpoint);
    }

    _breakpointEditablePropertyDidChange(event)
    {
        let breakpoint = event.target;

        if (breakpoint.special) {
            this._restoringBreakpoints = true;
            this._updateSpecialBreakpoint(breakpoint);
            this._restoringBreakpoints = false;
            return;
        }

        if (!this._restoringBreakpoints)
            WI.objectStores.breakpoints.putObject(breakpoint);

        if (breakpoint.disabled)
            return;

        console.assert(breakpoint.editable);
        if (!breakpoint.editable)
            return;

        // Remove the breakpoint with its old id.
        this._removeBreakpoint(breakpoint, (target) => {
            // Add the breakpoint with its new properties and get a new id.
            this._restoringBreakpoints = true;
            this._setBreakpoint(breakpoint, target);
            this._restoringBreakpoints = false;
        });
    }

    _handleBreakpointActionsDidChange(event)
    {
        this._breakpointEditablePropertyDidChange(event);

        this.updateProbesForBreakpoint(event.target);
    }

    _handleSymbolicBreakpointDisabledStateChanged(event)
    {
        let breakpoint = event.target;

        for (let target of WI.targets) {
            if (breakpoint.disabled)
                this._removeSymbolicBreakpoint(breakpoint, target);
            else
                this._setSymbolicBreakpoint(breakpoint, target);
        }

        if (!this._restoringBreakpoints)
            WI.objectStores.symbolicBreakpoints.putObject(breakpoint);
    }

    _handleSymbolicBreakpointEditablePropertyChanged(event)
    {
        let breakpoint = event.target;

        if (!this._restoringBreakpoints)
            WI.objectStores.symbolicBreakpoints.putObject(breakpoint);

        if (breakpoint.disabled)
            return;

        this._restoringBreakpoints = true;
        for (let target of WI.targets) {
            // Clear the old breakpoint from the backend before setting the new one.
            this._removeSymbolicBreakpoint(breakpoint, target);
            this._setSymbolicBreakpoint(breakpoint, target);
        }
        this._restoringBreakpoints = false;
    }

    _handleSymbolicBreakpointActionsChanged(event)
    {
        let breakpoint = event.target;

        this._handleSymbolicBreakpointEditablePropertyChanged(event);

        this.updateProbesForBreakpoint(breakpoint);
    }

    _startDisablingBreakpointsTemporarily()
    {
        if (++this._temporarilyDisableBreakpointsRequestCount > 1)
            return;

        console.assert(!this.breakpointsDisabledTemporarily, "Already temporarily disabling breakpoints.");
        if (this.breakpointsDisabledTemporarily)
            return;


        this._temporarilyDisabledBreakpointsRestoreSetting.value = this._breakpointsEnabledSetting.value;

        this.breakpointsEnabled = false;
    }

    _stopDisablingBreakpointsTemporarily()
    {
        this._temporarilyDisableBreakpointsRequestCount = Math.max(0, this._temporarilyDisableBreakpointsRequestCount - 1);
        if (this._temporarilyDisableBreakpointsRequestCount > 0)
            return;

        console.assert(this.breakpointsDisabledTemporarily, "Was not temporarily disabling breakpoints.");
        if (!this.breakpointsDisabledTemporarily)
            return;

        let restoreState = this._temporarilyDisabledBreakpointsRestoreSetting.value;
        this._temporarilyDisabledBreakpointsRestoreSetting.value = null;

        this.breakpointsEnabled = restoreState;
    }

    _handleTimelineCapturingStateChanged(event)
    {
        switch (WI.timelineManager.capturingState) {
        case WI.TimelineManager.CapturingState.Starting:
            this._startDisablingBreakpointsTemporarily();
            if (this.paused)
                this.resume();
            break;

        case WI.TimelineManager.CapturingState.Inactive:
            this._stopDisablingBreakpointsTemporarily();
            break;
        }
    }

    _handleAuditManagerTestScheduled(event)
    {
        this._startDisablingBreakpointsTemporarily();

        if (this.paused)
            this.resume();
    }

    _handleAuditManagerTestCompleted(event)
    {
        this._stopDisablingBreakpointsTemporarily();
    }

    _targetRemoved(event)
    {
        let wasPaused = this.paused;

        this._targetDebuggerDataMap.delete(event.data.target);

        if (!this.paused && wasPaused)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.Resumed);
    }

    _handleBlackboxBreakpointEvaluationsChange(event)
    {
        for (let target of WI.targets)
            this._setBlackboxBreakpointEvaluations(target);
    }

    _handleEngineeringShowInternalScriptsSettingChanged(event)
    {
        let eventType = WI.settings.engineeringShowInternalScripts.value ? WI.DebuggerManager.Event.ScriptAdded : WI.DebuggerManager.Event.ScriptRemoved;
        for (let script of this._internalWebKitScripts)
            this.dispatchEventToListeners(eventType, {script});
    }

    _handleEngineeringPauseForInternalScriptsSettingChanged(event)
    {
        for (let target of WI.targets) {
            if (target.hasCommand("Debugger.setPauseForInternalScripts"))
                target.DebuggerAgent.setPauseForInternalScripts(WI.settings.engineeringPauseForInternalScripts.value);
        }
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this._didResumeInternal(WI.mainTarget);
    }

    _handleSourceCodeSourceMapAdded(event)
    {
        if (event.target.supportsScriptBlackboxing)
            this._updateBlackbox(WI.targets, event.target);
    }

    _didResumeInternal(target)
    {
        if (!this.paused)
            return;

        if (this._delayedResumeTimeout) {
            clearTimeout(this._delayedResumeTimeout);
            this._delayedResumeTimeout = undefined;
        }

        let activeCallFrameDidChange = false;
        if (this._activeCallFrame && this._activeCallFrame.target === target) {
            this._activeCallFrame = null;
            activeCallFrameDidChange = true;
        }

        this._blackboxedCallFrameGroupsToAutoExpand = [];

        this.dataForTarget(target).updateForResume();

        if (!this.paused)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.Resumed);

        this.dispatchEventToListeners(WI.DebuggerManager.Event.CallFramesDidChange, {target});

        if (activeCallFrameDidChange)
            this.dispatchEventToListeners(WI.DebuggerManager.Event.ActiveCallFrameDidChange);
    }

    _associateBreakpointsWithSourceCode(breakpoints, sourceCode)
    {
        this._ignoreBreakpointDisplayLocationDidChangeEvent = true;

        for (let breakpoint of breakpoints)
            breakpoint.sourceCodeLocation.sourceCode = sourceCode;

        this._ignoreBreakpointDisplayLocationDidChangeEvent = false;
    }

    _probeSetForBreakpoint(breakpoint)
    {
        let probeSet = this._probeSetsByBreakpoint.get(breakpoint);
        if (!probeSet) {
            probeSet = new WI.ProbeSet(breakpoint);
            this._probeSetsByBreakpoint.set(breakpoint, probeSet);
            this.dispatchEventToListeners(WI.DebuggerManager.Event.ProbeSetAdded, {probeSet});
        }
        return probeSet;
    }
};

WI.DebuggerManager.Event = {
    BreakpointAdded: "debugger-manager-breakpoint-added",
    BreakpointRemoved: "debugger-manager-breakpoint-removed",
    BreakpointMoved: "debugger-manager-breakpoint-moved",
    SymbolicBreakpointAdded: "debugger-manager-symbolic-breakpoint-added",
    SymbolicBreakpointRemoved: "debugger-manager-symbolic-breakpoint-removed",
    WaitingToPause: "debugger-manager-waiting-to-pause",
    Paused: "debugger-manager-paused",
    Resumed: "debugger-manager-resumed",
    CallFramesDidChange: "debugger-manager-call-frames-did-change",
    ActiveCallFrameDidChange: "debugger-manager-active-call-frame-did-change",
    ScriptAdded: "debugger-manager-script-added",
    ScriptRemoved: "debugger-manager-script-removed",
    ScriptsCleared: "debugger-manager-scripts-cleared",
    BreakpointsEnabledDidChange: "debugger-manager-breakpoints-enabled-did-change",
    ProbeSetAdded: "debugger-manager-probe-set-added",
    ProbeSetRemoved: "debugger-manager-probe-set-removed",
    BlackboxChanged: "blackboxed-urls-changed",
};

WI.DebuggerManager.PauseReason = {
    AnimationFrame: "animation-frame",
    Assertion: "assertion",
    BlackboxedScript: "blackboxed-script",
    Breakpoint: "breakpoint",
    CSPViolation: "CSP-violation",
    DebuggerStatement: "debugger-statement",
    DOM: "DOM",
    Exception: "exception",
    FunctionCall: "function-call",
    Interval: "interval",
    Listener: "listener",
    Microtask: "microtask",
    PauseOnNextStatement: "pause-on-next-statement",
    Timeout: "timeout",
    URL: "url",
    Other: "other",

    // COMPATIBILITY (iOS 13): DOMDebugger.EventBreakpointType.Timer was replaced by DOMDebugger.EventBreakpointType.Interval and DOMDebugger.EventBreakpointType.Timeout.
    Timer: "timer",

    // COMPATIBILITY (iOS 13): DOMDebugger.EventBreakpointType.EventListener was replaced by DOMDebugger.EventBreakpointType.Listener.
    EventListener: "event-listener",
};

WI.DebuggerManager.BlackboxType = {
    Pattern: "pattern",
    URL: "url",
};
