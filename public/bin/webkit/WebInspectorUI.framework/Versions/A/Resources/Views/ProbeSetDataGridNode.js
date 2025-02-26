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

WI.ProbeSetDataGridNode = class ProbeSetDataGridNode extends WI.DataGridNode
{
    constructor(dataGrid)
    {
        console.assert(dataGrid instanceof WI.ProbeSetDataGrid, "Invalid ProbeSetDataGrid argument:", dataGrid);

        super();
        this.dataGrid = dataGrid; // This is set to null in DataGridNode's constructor.
        this._data = {};

        this._element = document.createElement("tr");
        this._element.dataGridNode = this;
        this._element.classList.add("revealed");
    }

    // Public

    get element()
    {
        return this._element;
    }

    get data()
    {
        return this._data;
    }

    set frame(value)
    {
        console.assert(value instanceof WI.ProbeSetDataFrame, "Invalid ProbeSetDataFrame argument: ", value);
        this._frame = value;


        var data = {};
        for (var probe of this.dataGrid.probeSet.probes) {
            let columnIdentifier = WI.ProbeSetDataGrid.columnIdentifierForProbe(probe);
            var sample = this.frame[probe.id];
            if (!sample || !sample.object)
                data[columnIdentifier] = WI.ProbeSetDataFrame.MissingValue;
            else
                data[columnIdentifier] = sample.object;
        }
        this._data = data;
    }

    get frame()
    {
        return this._frame;
    }

    createCellContent(columnIdentifier, cell)
    {
        var sample = this.data[columnIdentifier];
        if (sample === WI.ProbeSetDataFrame.MissingValue) {
            cell.classList.add("unknown-value");
            return sample;
        }

        if (sample instanceof WI.RemoteObject)
            return WI.FormattedValue.createObjectTreeOrFormattedValueForRemoteObject(sample, null);

        return sample;
    }

    updateCellsFromFrame(frame, probeSet)
    {
    }

    updateCellsForSeparator(frame, probeSet)
    {
        this._element.classList.add("separator");
    }
};
