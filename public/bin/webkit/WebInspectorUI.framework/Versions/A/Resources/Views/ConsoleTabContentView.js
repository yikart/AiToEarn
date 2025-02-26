/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.ConsoleTabContentView = class ConsoleTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(ConsoleTabContentView.tabInfo(), {
            hideBackForwardButtons: true,
            disableBackForwardNavigation: true,
            flexibleNavigationItem: new WI.NavigationItem,
        });

        this._wasShowingSplitConsole = false;
    }

    static tabInfo()
    {
        return {
            identifier: ConsoleTabContentView.Type,
            image: "Images/Console.svg",
            displayName: WI.UIString("Console", "Console Tab Name", "Name of Console Tab"),
        };
    }

    // Public

    get type()
    {
        return WI.ConsoleTabContentView.Type;
    }

    attached()
    {
        super.attached();

        this._wasShowingSplitConsole = WI.isShowingSplitConsole();
        if (this._wasShowingSplitConsole)
            WI.hideSplitConsole();

        this.contentBrowser.showContentView(WI.consoleContentView);
        WI.consoleContentView.dispatchEventToListeners(WI.ContentView.Event.NavigationItemsDidChange);

        WI.consoleContentView.prompt.focus();

        console.assert(this.contentBrowser.currentContentView === WI.consoleContentView);
    }

    detached()
    {
        super.detached();

        if (this._wasShowingSplitConsole)
            WI.showSplitConsole();
    }

    showRepresentedObject(representedObject, cookie)
    {
        // Do nothing. The shown function will handle things. Calling
        // ContentBrowserTabContentView.shown will cause a new LogContentView
        // to be created instead of reusing WI.consoleContentView.
        console.assert(representedObject instanceof WI.LogObject);
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.LogObject;
    }

    get supportsSplitContentBrowser()
    {
        return false;
    }
};

WI.ConsoleTabContentView.Type = "console";
