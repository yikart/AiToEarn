/*
 * Copyright (C) 2015 University of Washington.
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.isEngineeringBuild = true;

// Disable Pause in Internal Scripts if Show Internal Scripts is dibbled.
WI.settings.engineeringShowInternalScripts.addEventListener(WI.Setting.Event.Changed, function(event) {
    if (!WI.settings.engineeringShowInternalScripts.value)
        WI.settings.engineeringPauseForInternalScripts.value = false;
}, WI.settings.engineeringPauseForInternalScripts);

// Enable Show Internal Scripts if Pause in Internal Scripts is enabled.
WI.settings.engineeringPauseForInternalScripts.addEventListener(WI.Setting.Event.Changed, function(event) {
    if (WI.settings.engineeringPauseForInternalScripts.value)
        WI.settings.engineeringShowInternalScripts.value = true;
}, WI.settings.engineeringShowInternalScripts);

WI.showDebugUISetting = new WI.Setting("show-debug-ui", false);

// This function is invoked after the inspector has loaded and has a backend target.
WI.runBootstrapOperations = function() {
    // Toggle Debug UI setting.
    new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Option | WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, "D", () => {
        WI.showDebugUISetting.value = !WI.showDebugUISetting.value;
    });

    // Reload the Web Inspector.
    new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Option | WI.KeyboardShortcut.Modifier.Shift | WI.KeyboardShortcut.Modifier.CommandOrControl, "R", () => {
        InspectorFrontendHost.reopen();
    });

    // Toggle Inspector Messages Filtering.
    let ignoreChangesToState = false;
    const DumpMessagesState = {Off: "off", Filtering: "filtering", Everything: "everything"};
    const dumpMessagesToolTip = WI.unlocalizedString("Enable dump inspector messages to console.\nShift-click to dump all inspector messages with no filtering.");
    const dumpMessagesActivatedToolTip = WI.unlocalizedString("Disable dump inspector messages to console");
    let dumpMessagesTabBarNavigationItem = new WI.ActivateButtonNavigationItem("dump-messages", dumpMessagesToolTip, dumpMessagesActivatedToolTip, "Images/Console.svg");

    function dumpMessagesCurrentState() {
        if (!InspectorBackend.dumpInspectorProtocolMessages)
            return DumpMessagesState.Off;
        if (InspectorBackend.filterMultiplexingBackendInspectorProtocolMessages)
            return DumpMessagesState.Filtering;
        return DumpMessagesState.Everything;
    }

    function applyDumpMessagesState(state) {
        ignoreChangesToState = true;
        switch (state) {
        case DumpMessagesState.Off:
            InspectorBackend.dumpInspectorProtocolMessages = false;
            InspectorBackend.filterMultiplexingBackendInspectorProtocolMessages = false;
            dumpMessagesTabBarNavigationItem.activated = false;
            dumpMessagesTabBarNavigationItem.element.style.removeProperty("color");
            break;
        case DumpMessagesState.Filtering:
            InspectorBackend.dumpInspectorProtocolMessages = true;
            InspectorBackend.filterMultiplexingBackendInspectorProtocolMessages = true;
            dumpMessagesTabBarNavigationItem.activated = true;
            dumpMessagesTabBarNavigationItem.element.style.removeProperty("color");
            break;
        case DumpMessagesState.Everything:
            InspectorBackend.dumpInspectorProtocolMessages = true;
            InspectorBackend.filterMultiplexingBackendInspectorProtocolMessages = false;
            dumpMessagesTabBarNavigationItem.activated = true;
            dumpMessagesTabBarNavigationItem.element.style.color = "rgb(164, 41, 154)";
            break;
        }
        ignoreChangesToState = false;
    }

    dumpMessagesTabBarNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
        let nextState;
        switch (dumpMessagesCurrentState()) {
        case DumpMessagesState.Off:
            nextState = WI.modifierKeys.shiftKey ? DumpMessagesState.Everything : DumpMessagesState.Filtering;
            break;
        case DumpMessagesState.Filtering:
            nextState = WI.modifierKeys.shiftKey ? DumpMessagesState.Everything : DumpMessagesState.Off;
            break;
        case DumpMessagesState.Everything:
            nextState = DumpMessagesState.Off;
            break;
        }
        applyDumpMessagesState(nextState);
    }, dumpMessagesTabBarNavigationItem);
    WI.settings.protocolAutoLogMessages.addEventListener(WI.Setting.Event.Changed, function(event) {
        if (ignoreChangesToState)
            return;
        applyDumpMessagesState(dumpMessagesCurrentState());
    }, dumpMessagesTabBarNavigationItem);
    applyDumpMessagesState(dumpMessagesCurrentState());

    // Next Level Inspector.
    let inspectionLevel = InspectorFrontendHost.inspectionLevel;
    const inspectInspectorToolTip = WI.unlocalizedString("Open Web Inspector [%d]").format(inspectionLevel + 1);
    let inspectInspectorTabBarNavigationItem = new WI.ButtonNavigationItem("inspect-inspector", inspectInspectorToolTip);
    inspectInspectorTabBarNavigationItem.element.textContent = inspectionLevel + 1;
    inspectInspectorTabBarNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
        InspectorFrontendHost.inspectInspector();
    }, inspectInspectorTabBarNavigationItem);

    let groupNavigationItem = new WI.GroupNavigationItem([
        dumpMessagesTabBarNavigationItem,
        inspectInspectorTabBarNavigationItem,
    ]);
    WI.tabBar.addNavigationItemAfter(groupNavigationItem);

    function setFocusDebugOutline() {
        document.body.classList.toggle("focus-debug", WI.settings.debugOutlineFocusedElement.value);
    }
    WI.settings.debugOutlineFocusedElement.addEventListener(WI.Setting.Event.Changed, setFocusDebugOutline, WI.settings.debugOutlineFocusedElement);
    setFocusDebugOutline();

    function updateDebugUI() {
        groupNavigationItem.hidden = !WI.showDebugUISetting.value;
        WI.tabBar.needsLayout();
    }

    function updateMockWebExtensionTab() {
        let mockData = {
            extensionID: "1234567890ABCDEF",
            extensionBundleIdentifier: "org.webkit.WebInspector.MockExtension",
            displayName: WI.unlocalizedString("Mock Extension"),
            tabName: WI.unlocalizedString("Mock"),
            tabIconURL: "Images/Info.svg",
            sourceURL: "Debug/MockWebExtensionTab.html",
        };

        // Simulates the steps taken by WebInspectorUIExtensionController to create an extension tab in WebInspectorUI.
        if (!WI.settings.debugShowMockWebExtensionTab.value) {
            if (WI.sharedApp.extensionController.registeredExtensionIDs.has(mockData.extensionID))
                InspectorFrontendAPI.unregisterExtension(mockData.extensionID);

            return;
        }

        let error = InspectorFrontendAPI.registerExtension(mockData.extensionID, mockData.extensionBundleIdentifier, mockData.displayName);
        if (error) {
            WI.reportInternalError("Problem creating mock web extension: " + error);
            return;
        }

        let result = InspectorFrontendAPI.createTabForExtension(mockData.extensionID, mockData.tabName, mockData.tabIconURL, mockData.sourceURL);
        if (!result?.extensionTabID) {
            WI.reportInternalError("Problem creating mock web extension tab: " + result);
            return;
        }
    }
    WI.settings.debugShowMockWebExtensionTab.addEventListener(WI.Setting.Event.Changed, updateMockWebExtensionTab, WI.settings.debugShowMockWebExtensionTab);
    updateMockWebExtensionTab();

    WI.showDebugUISetting.addEventListener(WI.Setting.Event.Changed, function(event) {
        updateDebugUI();
    }, groupNavigationItem);

    updateDebugUI();
};
