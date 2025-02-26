/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.TabNavigationDiagnosticEventRecorder = class TabNavigationDiagnosticEventRecorder extends WI.DiagnosticEventRecorder
{
    constructor(controller)
    {
        super("TabNavigation", controller);
    }

    // Protected

    setup()
    {
        WI.tabBrowser.addEventListener(WI.TabBrowser.Event.SelectedTabContentViewDidChange, this._selectedTabContentViewDidChange, this);
    }

    teardown()
    {
        WI.tabBrowser.removeEventListener(WI.TabBrowser.Event.SelectedTabContentViewDidChange, this._selectedTabContentViewDidChange, this);
    }

    // Private

    _selectedTabContentViewDidChange(event)
    {
        let outgoingTabType = event.data.outgoingTab.identifier;
        let incomingTabType = event.data.incomingTab.identifier;
        let initiator = WI.TabNavigationDiagnosticEventRecorder.tabBrowserInitiatorToEventInitiator(event.data.initiator || WI.TabBrowser.TabNavigationInitiator.Unknown);
        if (!initiator) {
            // If initiator is null, then there is a missing value in the switch. This is a programming error.
            WI.reportInternalError("Value of 'initiator' could not be parsed: " + event.data.initiator);
            return;
        }

        this.logDiagnosticEvent(this.name, {outgoingTabType, incomingTabType, initiator});
    }

    static tabBrowserInitiatorToEventInitiator(tabBrowserInitiator)
    {
        switch (tabBrowserInitiator) {
        case WI.TabBrowser.TabNavigationInitiator.TabClick:
            return "tab-click";
        case WI.TabBrowser.TabNavigationInitiator.LinkClick:
            return "link-click";
        case WI.TabBrowser.TabNavigationInitiator.ButtonClick:
            return "button-click";
        case WI.TabBrowser.TabNavigationInitiator.ContextMenu:
            return "context-menu";
        case WI.TabBrowser.TabNavigationInitiator.Dashboard:
            return "dashboard";
        case WI.TabBrowser.TabNavigationInitiator.Breakpoint:
            return "breakpoint";
        case WI.TabBrowser.TabNavigationInitiator.Inspect:
            return "inspect";
        case WI.TabBrowser.TabNavigationInitiator.KeyboardShortcut:
            return "keyboard-shortcut";
        case WI.TabBrowser.TabNavigationInitiator.FrontendAPI:
            return "frontend-api";
        case WI.TabBrowser.TabNavigationInitiator.Unknown:
            return "unknown";
        }

        console.error("Unhandled initiator type: " + tabBrowserInitiator);
        return null;
    }
};

