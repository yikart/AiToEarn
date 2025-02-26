/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.LayerDetailsSidebarPanel = class LayerDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("layer", WI.UIString("All Layers"));

        this.element.classList.add("layer");

        this._layers = [];
        this._layerIdToSelect = null;

        this._dataGrid = null;
        this._hoveredDataGridNode = null;
        this._dataGridNodesByLayerId = new Map;

        this._bottomBar = null;
        this._bottomBarWidth = NaN;
        this._layersCountLabel = null;
        this._layersMemoryLabel = null;
    }

    // Public

    get minimumWidth()
    {
        let minimumWidth = super.minimumWidth;

        if (isNaN(this._bottomBarWidth) && this._layersCountLabel && this._layersMemoryLabel)
            this._bottomBarWidth = this._layersCountLabel.realOffsetWidth + this._layersMemoryLabel.realOffsetWidth;
        if (!isNaN(this._bottomBarWidth))
            minimumWidth = Math.max(minimumWidth, this._bottomBarWidth);

        return minimumWidth;
    }

    inspect(objects)
    {
        if (!(objects instanceof Array))
            objects = [objects];

        let layers = objects.filter((object) => object instanceof WI.Layer);
        this._updateLayers(layers);

        return !!layers.length;
    }

    selectNodeByLayerId(layerId)
    {
        this._layerIdToSelect = null;

        let node = this._dataGridNodesByLayerId.get(layerId);
        if (node === this._dataGrid.selectedNode)
            return;

        const suppressEvent = true;
        if (node)
            node.revealAndSelect(suppressEvent);
        else if (this._dataGrid.selectedNode)
            this._dataGrid.selectedNode.deselect(suppressEvent);
        else
            this._layerIdToSelect = layerId;
    }

    // Private

    _buildDataGrid()
    {
        const columns = {
            name: {
                title: WI.UIString("Node"),
                sortable: false,
            },
            paintCount: {
                title: WI.UIString("Paints"),
                sortable: true,
                aligned: "right",
                width: "70px",
            },
            memory: {
                title: WI.UIString("Memory"),
                sortable: true,
                aligned: "right",
                width: "70px",
            }
        };

        this._dataGrid = new WI.DataGrid(columns);
        this._dataGrid.addEventListener(WI.DataGrid.Event.SortChanged, this._sortDataGrid, this);
        this._dataGrid.addEventListener(WI.DataGrid.Event.SelectedNodeChanged, this._dataGridSelectedNodeChanged, this);

        this._dataGrid.sortColumnIdentifier = "memory";
        this._dataGrid.sortOrder = WI.DataGrid.SortOrder.Descending;
        this._dataGrid.createSettings("layer-details-sidebar-panel");

        this._dataGrid.element.addEventListener("mousemove", this._dataGridMouseMove.bind(this));
        this._dataGrid.element.addEventListener("mouseleave", this._dataGridMouseLeave.bind(this));

        // FIXME: We can't use virtualized rows until DataGrid is able to scroll them programmatically.
        //        See TreeElement#reveal -> TreeOutline#updateVirtualizedElements for an analogy.
        this._dataGrid.inline = true;
        this._dataGrid.element.classList.remove("inline");

        this.contentView.addSubview(this._dataGrid);
    }

    _buildBottomBar()
    {
        this._bottomBar = this.element.appendChild(document.createElement("div"));
        this._bottomBar.className = "bottom-bar";

        this._layersCountLabel = this._bottomBar.appendChild(document.createElement("div"));
        this._layersCountLabel.className = "layers-count-label";

        this._layersMemoryLabel = this._bottomBar.appendChild(document.createElement("div"));
        this._layersMemoryLabel.className = "layers-memory-label";

        this._bottomBarWidth = NaN;
    }

    _sortDataGrid()
    {
        let sortColumnIdentifier = this._dataGrid.sortColumnIdentifier;

        function comparator(a, b) {
            let itemA = a.layer[sortColumnIdentifier] || 0;
            let itemB = b.layer[sortColumnIdentifier] || 0;
            return itemA - itemB;
        }

        this._dataGrid.sortNodes(comparator);
    }

    _dataGridSelectedNodeChanged()
    {
        let layerId = this._dataGrid.selectedNode ? this._dataGrid.selectedNode.layer.layerId : null;
        this.dispatchEventToListeners(WI.LayerDetailsSidebarPanel.Event.SelectedLayerChanged, {layerId});
    }

    _dataGridMouseMove(event)
    {
        let dataGridNode = this._dataGrid.dataGridNodeFromNode(event.target);
        if (dataGridNode === this._hoveredDataGridNode)
            return;

        if (!dataGridNode) {
            this._hideDOMNodeHighlight();
            return;
        }

        this._hoveredDataGridNode = dataGridNode;

        let layer = dataGridNode.layer;

        if (layer.isGeneratedContent || layer.isReflection || layer.isAnonymous) {
            const usePageCoordinates = true;
            WI.domManager.highlightRect(layer.bounds, usePageCoordinates);
        } else {
            let domNode = WI.domManager.nodeForId(layer.nodeId);
            if (domNode)
                domNode.highlight();
            else
                WI.domManager.hideDOMNodeHighlight();
        }
    }

    _dataGridMouseLeave(event)
    {
        this._hideDOMNodeHighlight();
    }

    _hideDOMNodeHighlight()
    {
        WI.domManager.hideDOMNodeHighlight();
        this._hoveredDataGridNode = null;
    }

    _updateLayers(newLayers)
    {
        this._updateDataGrid(newLayers);
        this._updateBottomBar(newLayers);

        this._layers = newLayers;
    }

    _updateDataGrid(newLayers)
    {
        if (!this._dataGrid)
            this._buildDataGrid();

        let {removals, additions, preserved} = WI.layerTreeManager.layerTreeMutations(this._layers, newLayers);

        removals.forEach((layer) => {
            let node = this._dataGridNodesByLayerId.get(layer.layerId);
            this._dataGrid.removeChild(node);
            this._dataGridNodesByLayerId.delete(layer.layerId);
        });

        additions.forEach((layer) => {
            let node = new WI.LayerTreeDataGridNode(layer);
            this._dataGridNodesByLayerId.set(layer.layerId, node);
            this._dataGrid.appendChild(node);
        });

        preserved.forEach((layer) => {
            let node = this._dataGridNodesByLayerId.get(layer.layerId);
            node.layer = layer;
        });

        this._sortDataGrid();

        if (this._layerIdToSelect)
            this.selectNodeByLayerId(this._layerIdToSelect);
    }

    _updateBottomBar(newLayers)
    {
        if (!this._bottomBar)
            this._buildBottomBar();

        this._layersCountLabel.textContent = WI.UIString("Layer Count: %d").format(newLayers.length);

        let totalMemory = newLayers.reduce((total, layer) => total + (layer.memory || 0), 0);
        this._layersMemoryLabel.textContent = WI.UIString("Memory: %s").format(Number.bytesToString(totalMemory));

        this._bottomBarWidth = NaN;
    }
};

WI.LayerDetailsSidebarPanel.Event = {
    SelectedLayerChanged: "selected-layer-changed"
};
