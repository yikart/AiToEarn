/*
 * Copyright (C) 2013 University of Washington. All rights reserved.
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.ProbeSetDataGrid = class ProbeSetDataGrid extends WI.DataGrid
{
    constructor(probeSet)
    {
        console.assert(probeSet instanceof WI.ProbeSet, "Invalid ProbeSet argument: ", probeSet);

        var columns = {};
        for (var probe of probeSet.probes) {
            var title = probe.expression || WI.UIString("(uninitialized)");
            columns[WI.ProbeSetDataGrid.columnIdentifierForProbe(probe)] = {title};
        }

        super(columns);

        this.probeSet = probeSet;

        this.inline = true;

        this._frameNodes = new Map;
        this._lastUpdatedFrame = null;
        this._nodesSinceLastNavigation = [];

        probeSet.addEventListener(WI.ProbeSet.Event.ProbeAdded, this._setupProbe, this);
        probeSet.addEventListener(WI.ProbeSet.Event.ProbeRemoved, this._teardownProbe, this);
        probeSet.addEventListener(WI.ProbeSet.Event.SamplesCleared, this._setupData, this);

        WI.Probe.addEventListener(WI.Probe.Event.ExpressionChanged, this._probeExpressionChanged, this);

        this._setupData();
    }

    // Static

    static columnIdentifierForProbe(probe)
    {
        return "probe" + probe.id;
    }

    // Public

    closed()
    {
        for (var probe of this.probeSet)
            this._teardownProbe(probe);

        this.probeSet.removeEventListener(WI.ProbeSet.Event.ProbeAdded, this._setupProbe, this);
        this.probeSet.removeEventListener(WI.ProbeSet.Event.ProbeRemoved, this._teardownProbe, this);
        this.probeSet.removeEventListener(WI.ProbeSet.Event.SamplesCleared, this._setupData, this);

        WI.Probe.removeEventListener(WI.Probe.Event.ExpressionChanged, this._probeExpressionChanged, this);
    }

    // Private

    _setupProbe(event)
    {
        var probe = event.data;
        this.insertColumn(WI.ProbeSetDataGrid.columnIdentifierForProbe(probe), {title: probe.expression});

        for (var frame of this._data.frames)
            this._updateNodeForFrame(frame);
    }

    _teardownProbe(event)
    {
        var probe = event.data;
        this.removeColumn(WI.ProbeSetDataGrid.columnIdentifierForProbe(probe));

        for (var frame of this._data.frames)
            this._updateNodeForFrame(frame);
    }

    _setupData()
    {
        this._data = this.probeSet.dataTable;
        for (var frame of this._data.frames)
            this._updateNodeForFrame(frame);

        this._data.addEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataFrameInserted, this);
        this._data.addEventListener(WI.ProbeSetDataTable.Event.SeparatorInserted, this._dataSeparatorInserted, this);
        this._data.addEventListener(WI.ProbeSetDataTable.Event.WillRemove, this._teardownData, this);
    }

    _teardownData()
    {
        this._data.removeEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataFrameInserted, this);
        this._data.removeEventListener(WI.ProbeSetDataTable.Event.SeparatorInserted, this._dataSeparatorInserted, this);
        this._data.removeEventListener(WI.ProbeSetDataTable.Event.WillRemove, this._teardownData, this);

        this.removeChildren();
        this._frameNodes = new Map;
        this._lastUpdatedFrame = null;
    }

    _updateNodeForFrame(frame)
    {
        console.assert(frame instanceof WI.ProbeSetDataFrame, "Invalid ProbeSetDataFrame argument: ", frame);
        var node = null;
        if (this._frameNodes.has(frame)) {
            node = this._frameNodes.get(frame);
            node.frame = frame;
            node.refresh();
        } else {
            node = new WI.ProbeSetDataGridNode(this);
            node.frame = frame;
            this._frameNodes.set(frame, node);
            node.createCells();

            var sortFunction = function(a, b) {
                return WI.ProbeSetDataFrame.compare(a.frame, b.frame);
            };
            var insertionIndex = insertionIndexForObjectInListSortedByFunction(node, this.children, sortFunction);
            if (insertionIndex === this.children.length)
                this.appendChild(node);
            else if (this.children[insertionIndex].frame.key === frame.key) {
                this.removeChild(this.children[insertionIndex]);
                this.insertChild(node, insertionIndex);
            } else
                this.insertChild(node, insertionIndex);
        }
        console.assert(node);

        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        this.updateLayoutIfNeeded();

        node.element.classList.add("data-updated");
        window.setTimeout(function() {
            node.element.classList.remove("data-updated");
        }, WI.ProbeSetDataGrid.DataUpdatedAnimationDuration);

        this._nodesSinceLastNavigation.push(node);
    }

    _updateNodeForSeparator(frame)
    {
        console.assert(this._frameNodes.has(frame), "Tried to add separator for unknown data frame: ", frame);
        this._frameNodes.get(frame).updateCellsForSeparator(frame, this.probeSet);

        for (var node of this._nodesSinceLastNavigation)
            node.element.classList.add("past-value");

        this._nodesSinceLastNavigation = [];
    }

    _dataFrameInserted(event)
    {
        var frame = event.data;
        this._lastUpdatedFrame = frame;
        this._updateNodeForFrame(frame);
    }

    _dataSeparatorInserted(event)
    {
        var frame = event.data;
        this._updateNodeForSeparator(frame);
    }

    _probeExpressionChanged(event)
    {
        var probe = event.target;
        if (probe.breakpoint !== this.probeSet.breakpoint)
            return;

        let columnIdentifier = WI.ProbeSetDataGrid.columnIdentifierForProbe(probe);
        if (!this.columns.has(columnIdentifier))
            return;

        var oldColumn = this.columns.get(columnIdentifier);
        this.removeColumn(columnIdentifier);
        var ordinal = oldColumn["ordinal"];
        var newColumn = {title: event.data.newValue};
        this.insertColumn(columnIdentifier, newColumn, ordinal);

        for (var frame of this._data.frames)
            this._updateNodeForFrame(frame);
    }
};

WI.ProbeSetDataGrid.DataUpdatedAnimationDuration = 300; // milliseconds
