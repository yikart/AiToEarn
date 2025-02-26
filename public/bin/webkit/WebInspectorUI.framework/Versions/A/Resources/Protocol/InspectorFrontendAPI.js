/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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

InspectorFrontendAPI = {
    _loaded: false,
    _pendingCommands: [],

    isTimelineProfilingEnabled: function()
    {
        return WI.timelineManager.isCapturing();
    },

    setTimelineProfilingEnabled: function(enabled)
    {
        if (!WI.targetsAvailable()) {
            WI.whenTargetsAvailable().then(() => {
                InspectorFrontendAPI.setTimelineProfilingEnabled(enabled);
            });
            return;
        }

        WI.showTimelineTab({
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI
        });

        if (WI.timelineManager.isCapturing() === enabled)
            return;

        if (enabled)
            WI.timelineManager.startCapturing();
        else
            WI.timelineManager.stopCapturing();
    },

    setElementSelectionEnabled: function(enabled)
    {
        if (!WI.targetsAvailable()) {
            WI.whenTargetsAvailable().then(() => {
                InspectorFrontendAPI.setElementSelectionEnabled(enabled);
            });
            return;
        }

        WI.domManager.inspectModeEnabled = enabled;
    },

    setDockingUnavailable: function(unavailable)
    {
        WI.updateDockingAvailability(!unavailable);
    },

    setDockSide: function(side)
    {
        WI.updateDockedState(side);
    },

    setIsVisible: function(visible)
    {
        WI.updateVisibilityState(visible);
    },

    updateFindString: function(findString)
    {
        WI.updateFindString(findString);
    },

    setDiagnosticLoggingAvailable: function(available)
    {
        if (WI.diagnosticController)
            WI.diagnosticController.diagnosticLoggingAvailable = available;
    },

    showConsole: function()
    {
        WI.showConsoleTab({
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI,
        });

        WI.quickConsole.prompt.focus();

        // If the page is still loading, focus the quick console again after tabindex autofocus.
        if (document.readyState !== "complete")
            document.addEventListener("readystatechange", this);
        if (document.visibilityState !== "visible")
            document.addEventListener("visibilitychange", this);
    },

    handleEvent: function(event)
    {
        console.assert(event.type === "readystatechange" || event.type === "visibilitychange");

        if (document.readyState === "complete" && document.visibilityState === "visible") {
            WI.quickConsole.prompt.focus();
            document.removeEventListener("readystatechange", this);
            document.removeEventListener("visibilitychange", this);
        }
    },

    showResources: function()
    {
        WI.showSourcesTab({
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI,
        });
    },

    // COMPATIBILITY (iOS 13): merged into InspectorFrontendAPI.setTimelineProfilingEnabled.
    showTimelines: function()
    {
        WI.showTimelineTab({
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI
        });
    },

    showMainResourceForFrame: function(frameIdentifier)
    {
        WI.showSourceCodeForFrame(frameIdentifier, {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI,
        });
    },

    contextMenuItemSelected: function(id)
    {
        WI.ContextMenu.contextMenuItemSelected(id);
    },

    contextMenuCleared: function()
    {
        WI.ContextMenu.contextMenuCleared();
    },

    dispatchMessageAsync: function(messageObject)
    {
        WI.dispatchMessageFromBackend(messageObject);
    },

    dispatchMessage: function(messageObject)
    {
        InspectorBackend.dispatch(messageObject);
    },

    dispatch: function(signature)
    {
        if (!InspectorFrontendAPI._loaded) {
            InspectorFrontendAPI._pendingCommands.push(signature);
            return null;
        }

        var methodName = signature.shift();
        console.assert(InspectorFrontendAPI[methodName], "Unexpected InspectorFrontendAPI method name: " + methodName);
        if (!InspectorFrontendAPI[methodName])
            return null;

        return InspectorFrontendAPI[methodName].apply(InspectorFrontendAPI, signature);
    },

    loadCompleted: function()
    {
        InspectorFrontendAPI._loaded = true;

        for (var i = 0; i < InspectorFrontendAPI._pendingCommands.length; ++i)
            InspectorFrontendAPI.dispatch(InspectorFrontendAPI._pendingCommands[i]);

        delete InspectorFrontendAPI._pendingCommands;
    },

    // Returns a WI.WebInspectorExtension.ErrorCode if an error occurred, otherwise nothing.
    registerExtension(extensionID, extensionBundleIdentifier, displayName)
    {
        return WI.sharedApp.extensionController.registerExtension(extensionID, extensionBundleIdentifier, displayName);
    },

    // Returns a WI.WebInspectorExtension.ErrorCode if an error occurred, otherwise nothing.
    unregisterExtension(extensionID)
    {
        return WI.sharedApp.extensionController.unregisterExtension(extensionID);
    },

    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred that prevented creating a tab.
    // Returns a Promise that is resolved if the evaluation completes and rejected if there was an internal error.
    // When the promise is fulfilled, it will be either:
    // - resolved with an object containing a 'result' key and value that is the tab identifier for the new tab.
    // - rejected with an object containing an 'error' key and value that is the exception that was thrown while evaluating script.
    createTabForExtension(extensionID, tabName, tabIconURL, sourceURL)
    {
        return WI.sharedApp.extensionController.createTabForExtension(extensionID, tabName, tabIconURL, sourceURL);
    },

    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred that prevented evaluation.
    // Returns a Promise that is resolved if the evaluation completes and rejected if there was an internal error.
    // When the promise is fulfilled, it will be either:
    // - resolved with an object containing a 'result' key and value that is the result of the script evaluation.
    // - rejected with an object containing an 'error' key and value that is the exception that was thrown while evaluating script.
    evaluateScriptForExtension(extensionID, scriptSource, {frameURL, contextSecurityOrigin, useContentScriptContext} = {})
    {
        return WI.sharedApp.extensionController.evaluateScriptForExtension(extensionID, scriptSource, {frameURL, contextSecurityOrigin, useContentScriptContext});
    },
    
    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred that prevented reloading.
    reloadForExtension(extensionID, {ignoreCache, userAgent, injectedScript} = {})
    {
        return WI.sharedApp.extensionController.reloadForExtension(extensionID, {ignoreCache, userAgent, injectedScript});
    },

    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred before attempting to switch tabs.
    // Returns a Promise that is resolved if the tab could be shown and rejected if the tab could not be shown.
    // When the promise is fulfilled, it will be either:
    // - resolved with no value.
    // - rejected with an object containing an 'error' key and value that is the exception that was thrown while showing the tab.
    showExtensionTab(extensionTabID)
    {
        return WI.sharedApp.extensionController.showExtensionTab(extensionTabID);
    },

    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred that prevented evaluation.
    // Returns a Promise that is resolved if the evaluation completes and rejected if there was an internal error.
    // When the promise is fulfilled, it will be either:
    // - resolved with an object containing a 'result' key and value that is the result of the script evaluation.
    // - rejected with an object containing an 'error' key and value that is the exception that was thrown while evaluating script.
    evaluateScriptInExtensionTab(extensionTabID, scriptSource)
    {
        return WI.sharedApp.extensionController.evaluateScriptInExtensionTab(extensionTabID, scriptSource);
    },

    // Returns a string (WI.WebInspectorExtension.ErrorCode) if an error occurred.
    navigateTabForExtension(extensionTabID, sourceURL)
    {
        return WI.sharedApp.extensionController.navigateTabForExtension(extensionTabID, sourceURL);
    },
};
