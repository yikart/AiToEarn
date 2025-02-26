/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.GraphicsOverviewContentView = class GraphicsOverviewContentView extends WI.ContentView
{
    constructor()
    {
        super();

        this.element.classList.add("graphics-overview");

        this._importButtonNavigationItem = new WI.ButtonNavigationItem("import-recording", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        this._importButtonNavigationItem.tooltip = WI.UIString("Import");
        this._importButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._importButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleImportButtonNavigationItemClicked, this);

        this._refreshButtonNavigationItem = new WI.ButtonNavigationItem("refresh", WI.UIString("Refresh"), "Images/ReloadFull.svg", 13, 13);
        this._refreshButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleRefreshButtonClicked, this);

        this._showGridButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-grid", WI.repeatedUIString.showTransparencyGridTooltip(), WI.UIString("Hide transparency grid"), "Images/NavigationItemCheckers.svg", 13, 13);
        this._showGridButtonNavigationItem.activated = !!WI.settings.showImageGrid.value;
        this._showGridButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleShowGridButtonClicked, this);

        this._canvasOverviewContentView = new WI.CanvasOverviewContentView(WI.canvasManager.canvasCollection);

        this._overviewViews = [];
    }

    // Public

    get supplementalRepresentedObjects()
    {
        return this._overviewViews.flatMap((subview) => subview.supplementalRepresentedObjects);
    }

    get navigationItems()
    {
        let navigationItems = [];
        if (!WI.animationManager.supported) {
            navigationItems.pushAll(this._canvasOverviewContentView.navigationItems);
            navigationItems.push(new WI.DividerNavigationItem);
        }
        navigationItems.push(this._importButtonNavigationItem, new WI.DividerNavigationItem, this._refreshButtonNavigationItem, this._showGridButtonNavigationItem);
        return navigationItems;
    }

    // Protected

    attached()
    {
        super.attached();

        WI.settings.showImageGrid.addEventListener(WI.Setting.Event.Changed, this._handleShowImageGridSettingChanged, this);
        this._handleShowImageGridSettingChanged();
    }

    detached()
    {
        WI.domManager.hideDOMNodeHighlight();

        WI.settings.showImageGrid.removeEventListener(WI.Setting.Event.Changed, this._handleShowImageGridSettingChanged, this);

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        if (WI.animationManager.supported) {
            let createSection = (identifier, title, overviewView) => {
                console.assert(overviewView instanceof WI.ContentView);

                let sectionElement = this.element.appendChild(document.createElement("section"));
                sectionElement.className = identifier;

                let headerElement = sectionElement.appendChild(document.createElement("div"));
                headerElement.className = "header";

                let titleElement = headerElement.appendChild(document.createElement("h1"));
                titleElement.textContent = title;

                let navigationItems = overviewView.navigationItems;
                if (navigationItems.length) {
                    let navigationBar = new WI.NavigationBar(document.createElement("nav"), {navigationItems});
                    headerElement.appendChild(navigationBar.element);
                    this.addSubview(navigationBar);
                }

                let contentElement = sectionElement.appendChild(document.createElement("div"));
                contentElement.className = "content";

                contentElement.appendChild(overviewView.element);
                this.addSubview(overviewView);

                overviewView.addEventListener(WI.CollectionContentView.Event.SelectedItemChanged, this._handleOverviewViewSelectedItemChanged, this);
                overviewView.addEventListener(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange, this._handleOverviewViewSupplementalRepresentedObjectsDidChange, this);
                this._overviewViews.push(overviewView);
            };

            createSection("canvas", WI.UIString("Canvases"), this._canvasOverviewContentView);

            let animationCollection = WI.animationManager.animationCollection;
            createSection("web-animation", WI.UIString("Web Animations"), new WI.AnimationCollectionContentView(animationCollection.animationCollectionForType(WI.Animation.Type.WebAnimation)));
            createSection("css-animation", WI.UIString("CSS Animations"), new WI.AnimationCollectionContentView(animationCollection.animationCollectionForType(WI.Animation.Type.CSSAnimation)));
            createSection("css-transition", WI.UIString("CSS Transitions"), new WI.AnimationCollectionContentView(animationCollection.animationCollectionForType(WI.Animation.Type.CSSTransition)));

            this.element.addEventListener("click", this._handleClick.bind(this));
        } else
            this.addSubview(this._canvasOverviewContentView);
    }

    // Private

    _handleRefreshButtonClicked()
    {
        for (let overviewView of this._overviewViews)
            overviewView.handleRefreshButtonClicked();
    }

    _handleShowGridButtonClicked(event)
    {
        WI.settings.showImageGrid.value = !this._showGridButtonNavigationItem.activated;
    }

    _handleShowImageGridSettingChanged()
    {
        this._showGridButtonNavigationItem.activated = !!WI.settings.showImageGrid.value;
    }

    _handleImportButtonNavigationItemClicked(event)
    {
        WI.FileUtilities.importJSON((result) => WI.canvasManager.processJSON(result), {multiple: true});
    }

    _handleOverviewViewSelectedItemChanged(event)
    {
        if (!event.target.selectedItem)
            return;

        for (let overviewView of this._overviewViews) {
            if (overviewView !== event.target && overviewView.selectionEnabled)
                overviewView.selectedItem = null;
        }
    }

    _handleOverviewViewSupplementalRepresentedObjectsDidChange(evnet)
    {
        this.dispatchEventToListeners(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange);
    }

    _handleClick(event)
    {
        if (event.target !== this.element)
            return;

        for (let overviewView of this._overviewViews) {
            if (overviewView.selectionEnabled)
                overviewView.selectedItem = null;
        }
    }
};
