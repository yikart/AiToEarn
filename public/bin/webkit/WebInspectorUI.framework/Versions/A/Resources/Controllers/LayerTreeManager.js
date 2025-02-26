/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

// FIXME: LayerTreeManager lacks advanced multi-target support. (Layers per-target)

WI.LayerTreeManager = class LayerTreeManager extends WI.Object
{
    constructor()
    {
        super();

        this._showPaintRects = false;
        this._compositingBordersVisible = false;
    }

    // Target

    initializeTarget(target)
    {
        if (target.hasDomain("LayerTree"))
            target.LayerTreeAgent.enable();

        if (target.hasDomain("Page")) {
            if (target.hasCommand("Page.setShowPaintRects") && this._showPaintRects)
                target.PageAgent.setShowPaintRects(this._showPaintRects);

            if (this._compositingBordersVisible) {
                // COMPATIBILITY(iOS 13.1): Page.setCompositingBordersVisible was replaced by Page.Setting.ShowDebugBorders and Page.Setting.ShowRepaintCounter.
                if (target.hasCommand("Page.overrideSetting") && InspectorBackend.Enum.Page.Setting.ShowDebugBorders && InspectorBackend.Enum.Page.Setting.ShowRepaintCounter) {
                    target.PageAgent.overrideSetting(InspectorBackend.Enum.Page.Setting.ShowDebugBorders, this._compositingBordersVisible);
                    target.PageAgent.overrideSetting(InspectorBackend.Enum.Page.Setting.ShowRepaintCounter, this._compositingBordersVisible);
                } else if (target.hasCommand("Page.setCompositingBordersVisible"))
                    target.PageAgent.setCompositingBordersVisible(this._compositingBordersVisible);
            }
        }
    }

    // Static

    static supportsShowingPaintRects()
    {
        return InspectorBackend.hasCommand("Page.setShowPaintRects");
    }

    static supportsVisibleCompositingBorders()
    {
        return InspectorBackend.hasCommand("Page.setCompositingBordersVisible")
            || (InspectorBackend.hasCommand("Page.overrideSetting") && InspectorBackend.Enum.Page.Setting.ShowDebugBorders && InspectorBackend.Enum.Page.Setting.ShowRepaintCounter);
    }

    // Public

    get supported()
    {
        return InspectorBackend.hasDomain("LayerTree");
    }

    get showPaintRects()
    {
        return this._showPaintRects;
    }

    set showPaintRects(showPaintRects)
    {
        if (this._showPaintRects === showPaintRects)
            return;

        this._showPaintRects = showPaintRects;

        for (let target of WI.targets) {
            if (target.hasCommand("Page.setShowPaintRects"))
                target.PageAgent.setShowPaintRects(this._showPaintRects);
        }

        this.dispatchEventToListeners(LayerTreeManager.Event.ShowPaintRectsChanged);
    }

    get compositingBordersVisible()
    {
        return this._compositingBordersVisible;
    }

    set compositingBordersVisible(compositingBordersVisible)
    {
        if (this._compositingBordersVisible === compositingBordersVisible)
            return;

        this._compositingBordersVisible = compositingBordersVisible;

        for (let target of WI.targets) {
            // COMPATIBILITY(iOS 13.1): Page.setCompositingBordersVisible was replaced by Page.Setting.ShowDebugBorders and Page.Setting.ShowRepaintCounter.
            if (target.hasCommand("Page.overrideSetting") && InspectorBackend.Enum.Page.Setting.ShowDebugBorders && InspectorBackend.Enum.Page.Setting.ShowRepaintCounter) {
                target.PageAgent.overrideSetting(InspectorBackend.Enum.Page.Setting.ShowDebugBorders, this._compositingBordersVisible);
                target.PageAgent.overrideSetting(InspectorBackend.Enum.Page.Setting.ShowRepaintCounter, this._compositingBordersVisible);
            } else if (target.hasCommand("Page.setCompositingBordersVisible"))
                target.PageAgent.setCompositingBordersVisible(this._compositingBordersVisible);
        }

        this.dispatchEventToListeners(LayerTreeManager.Event.CompositingBordersVisibleChanged);
    }

    updateCompositingBordersVisibleFromPageIfNeeded()
    {
        if (!WI.targetsAvailable()) {
            WI.whenTargetsAvailable().then(() => {
                this.updateCompositingBordersVisibleFromPageIfNeeded();
            });
            return;
        }

        let target = WI.assumingMainTarget();

        // COMPATIBILITY(iOS 13.1): Page.getCompositingBordersVisible was replaced by Page.Setting.ShowDebugBorders and Page.Setting.ShowRepaintCounter.
        if (!target.hasCommand("Page.getCompositingBordersVisible"))
            return;

        target.PageAgent.getCompositingBordersVisible((error, compositingBordersVisible) => {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this.compositingBordersVisible = compositingBordersVisible;
        });
    }

    layerTreeMutations(previousLayers, newLayers)
    {
        console.assert(this.supported);

        if (isEmptyObject(previousLayers))
            return {preserved: [], additions: newLayers, removals: []};

        let previousLayerIds = new Set;
        let newLayerIds = new Set;

        let preserved = [];
        let additions = [];

        for (let layer of previousLayers)
            previousLayerIds.add(layer.layerId);

        for (let layer of newLayers) {
            newLayerIds.add(layer.layerId);

            if (previousLayerIds.has(layer.layerId))
                preserved.push(layer);
            else
                additions.push(layer);
        }

        let removals = previousLayers.filter((layer) => !newLayerIds.has(layer.layerId));

        return {preserved, additions, removals};
    }

    layersForNode(node, callback)
    {
        console.assert(this.supported);

        let target = WI.assumingMainTarget();
        target.LayerTreeAgent.layersForNode(node.id, (error, layers) => {
            callback(error ? [] : layers.map(WI.Layer.fromPayload));
        });
    }

    reasonsForCompositingLayer(layer, callback)
    {
        console.assert(this.supported);

        let target = WI.assumingMainTarget();
        target.LayerTreeAgent.reasonsForCompositingLayer(layer.layerId, function(error, reasons) {
            callback(error ? 0 : reasons);
        });
    }

    // LayerTreeObserver

    layerTreeDidChange()
    {
        this.dispatchEventToListeners(WI.LayerTreeManager.Event.LayerTreeDidChange);
    }
};

WI.LayerTreeManager.Event = {
    ShowPaintRectsChanged: "show-paint-rects-changed",
    CompositingBordersVisibleChanged: "compositing-borders-visible-changed",
    LayerTreeDidChange: "layer-tree-did-change",
};
