/*
 * Copyright (C) 2017 Sony Interactive Entertainment Inc.
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

WI.LayersTabContentView = class LayersTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(LayersTabContentView.tabInfo(), {
            detailsSidebarPanelConstructors: [WI.LayerDetailsSidebarPanel],
            hideBackForwardButtons: true,
            disableBackForwardNavigation: true,
        });

        this._layerDetailsSidebarPanel = this.detailsSidebarPanels[0];
        this._layerDetailsSidebarPanel.addEventListener(WI.LayerDetailsSidebarPanel.Event.SelectedLayerChanged, this._detailsSidebarSelectedLayerChanged, this);

        this._layers3DContentView = new WI.Layers3DContentView;
        this._layers3DContentView.addEventListener(WI.Layers3DContentView.Event.SelectedLayerChanged, this._contentViewSelectedLayerChanged, this);
    }

    // Static

    static tabInfo()
    {
        return {
            identifier: LayersTabContentView.Type,
            image: "Images/Layers.svg",
            displayName: WI.UIString("Layers", "Layers Tab Name", "Name of Layers Tab"),
        };
    }

    static isTabAllowed()
    {
        return InspectorBackend.hasDomain("LayerTree");
    }

    // Public

    get type() { return WI.LayersTabContentView.Type; }
    get supportsSplitContentBrowser() { return false; }

    selectLayerForNode(node)
    {
        this._layers3DContentView.selectLayerForNode(node);
    }

    attached()
    {
        super.attached();

        this.contentBrowser.showContentView(this._layers3DContentView);
    }

    // Private

    _detailsSidebarSelectedLayerChanged(event)
    {
        this._layers3DContentView.selectLayerById(event.data.layerId);
    }

    _contentViewSelectedLayerChanged(event)
    {
        this._layerDetailsSidebarPanel.selectNodeByLayerId(event.data.layerId);
    }
};

WI.LayersTabContentView.Type = "layers";
