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

WI.SourcesTabContentView = class SourcesTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(SourcesTabContentView.tabInfo(), {
            navigationSidebarPanelConstructor: WI.SourcesNavigationSidebarPanel,
            detailsSidebarPanelConstructors: [
                WI.ResourceDetailsSidebarPanel,
                WI.ScopeChainDetailsSidebarPanel,
                WI.ProbeDetailsSidebarPanel,
            ],
        });

        this._showScopeChainDetailsSidebarPanel = false;

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Paused, this._handleDebuggerPaused, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.Resumed, this._handleDebuggerResumed, this);
    }

    static tabInfo()
    {
        return {
            identifier: SourcesTabContentView.Type,
            image: WI.debuggerManager.paused ? "Images/SourcesPaused.svg" : "Images/Sources.svg",
            title: WI.debuggerManager.paused ? WI.UIString("JavaScript execution is paused") : "",
            displayName: WI.UIString("Sources", "Sources Tab Name", "Name of Sources Tab"),
        };
    }

    // Public

    get type()
    {
        return WI.SourcesTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.Frame
            || representedObject instanceof WI.FrameCollection
            || representedObject instanceof WI.Resource
            || representedObject instanceof WI.ResourceCollection
            || representedObject instanceof WI.Script
            || representedObject instanceof WI.ScriptCollection
            || representedObject instanceof WI.CSSStyleSheet
            || representedObject instanceof WI.CSSStyleSheetCollection
            || representedObject instanceof WI.LocalResourceOverride
            || super.canShowRepresentedObject(representedObject);
    }

    showDetailsSidebarPanels()
    {
        super.showDetailsSidebarPanels();

        if (!this._showScopeChainDetailsSidebarPanel)
            return;

        let scopeChainDetailsSidebarPanel = this.detailsSidebarPanels.find((item) => item instanceof WI.ScopeChainDetailsSidebarPanel);
        if (!scopeChainDetailsSidebarPanel)
            return;

        WI.detailsSidebar.selectedSidebarPanel = scopeChainDetailsSidebarPanel;
        WI.detailsSidebar.collapsed = false;

        this._showScopeChainDetailsSidebarPanel = false;
    }

    showScopeChainDetailsSidebarPanel()
    {
        this._showScopeChainDetailsSidebarPanel = true;
    }

    revealAndSelectRepresentedObject(representedObject)
    {
        let treeElement = this.navigationSidebarPanel.treeElementForRepresentedObject(representedObject);
        if (treeElement) {
            const omitFocus = false;
            const selectedByUser = true;
            treeElement.revealAndSelect(omitFocus, selectedByUser);
        }
    }

    handleCopyEvent(event)
    {
        if (this.navigationSidebarPanel.element.contains(WI.currentFocusElement))
            this.navigationSidebarPanel.handleCopyEvent(event);
    }

    // Private

    _handleDebuggerPaused(event)
    {
        this.tabBarItem.image = "Images/SourcesPaused.svg";
        this.tabBarItem.title = WI.UIString("JavaScript execution is paused");
    }

    _handleDebuggerResumed(event)
    {
        this.tabBarItem.image = "Images/Sources.svg";
        this.tabBarItem.title = "";
    }
};

WI.SourcesTabContentView.Type = "sources";
