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

WI.ElementsTabContentView = class ElementsTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        let detailsSidebarPanelConstructors = [
            WI.RulesStyleDetailsSidebarPanel,
            WI.ComputedStyleDetailsSidebarPanel,
        ];

        // COMPATIBILITY (iOS 14.5): `DOM.showGridOverlay` did not exist yet.
        if (InspectorBackend.hasCommand("DOM.showGridOverlay"))
            detailsSidebarPanelConstructors.push(WI.LayoutDetailsSidebarPanel);

        // COMPATIBILITY (iOS 14.0): `CSS.getFontDataForNode` did not exist yet.
        if (InspectorBackend.hasCommand("CSS.getFontDataForNode"))
            detailsSidebarPanelConstructors.push(WI.FontDetailsSidebarPanel);

        // COMPATIBILITY (iOS 18.0, macOS 15.0): `DOM.getMediaStats` did not exist yet.
        if (InspectorBackend.hasCommand("DOM.getMediaStats"))
            detailsSidebarPanelConstructors.push(WI.MediaDetailsSidebarPanel)

        detailsSidebarPanelConstructors.push(WI.ChangesDetailsSidebarPanel, WI.DOMNodeDetailsSidebarPanel);
        if (InspectorBackend.hasDomain("LayerTree"))
            detailsSidebarPanelConstructors.push(WI.LayerTreeDetailsSidebarPanel);

        super(ElementsTabContentView.tabInfo(), {detailsSidebarPanelConstructors, hideBackForwardButtons: true, disableBackForwardNavigation: true});
    }

    static tabInfo()
    {
        return {
            identifier: ElementsTabContentView.Type,
            image: "Images/Elements.svg",
            displayName: WI.UIString("Elements", "Elements Tab Name", "Name of Elements Tab"),
        };
    }

    static isTabAllowed()
    {
        return InspectorBackend.hasDomain("DOM");
    }

    // Public

    get type()
    {
        return WI.ElementsTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    get detailsSidebarExpandedByDefault()
    {
        return true;
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.DOMTree;
    }

    showRepresentedObject(representedObject, cookie)
    {
        this._showDOMTreeContentViewIfNeeded();

        if (!cookie || !cookie.nodeToSelect)
            return;

        let domTreeContentView = this.contentBrowser.currentContentView;
        console.assert(domTreeContentView instanceof WI.DOMTreeContentView, "Unexpected DOMTreeContentView representedObject.", domTreeContentView);

        domTreeContentView.selectAndRevealDOMNode(cookie.nodeToSelect);

        // Because nodeToSelect is ephemeral, we don't want to keep
        // it around in the back-forward history entries.
        cookie.nodeToSelect = undefined;
    }

    attached()
    {
        super.attached();

        WI.networkManager.addEventListener(WI.NetworkManager.Event.MainFrameDidChange, this._mainFrameDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        this._showDOMTreeContentViewIfNeeded();
    }

    detached()
    {
        WI.networkManager.removeEventListener(WI.NetworkManager.Event.MainFrameDidChange, this._mainFrameDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        this.element.appendChild(WI.ReferencePage.ElementsTab.DOMTree.createLinkElement());
    }

    closed()
    {
        super.closed();

        WI.networkManager.removeEventListener(WI.NetworkManager.Event.MainFrameDidChange, this._mainFrameDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
    }

    get allowMultipleDetailSidebars()
    {
        return true;
    }

    // Private

    _showDOMTreeContentViewIfNeeded()
    {
        let mainDOMTree = WI.networkManager.mainFrame?.domTree;
        if (!mainDOMTree)
            return;

        if (this.contentBrowser.currentContentView?.representedObject === mainDOMTree)
            return;

        this.contentBrowser.showContentViewForRepresentedObject(mainDOMTree);
    }

    _mainFrameDidChange(event)
    {
        this._showDOMTreeContentViewIfNeeded();
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this._showDOMTreeContentViewIfNeeded();
    }
};

WI.ElementsTabContentView.Type = "elements";
