/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.HeapAllocationsTimelineDataGridNode = class HeapAllocationsTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(record, options = {})
    {
        console.assert(record instanceof WI.HeapAllocationsTimelineRecord);

        super([record], options);

        this._heapAllocationsView = options.heapAllocationsView;

        this.heapSnapshot.addEventListener(WI.HeapSnapshotProxy.Event.CollectedNodes, this._handleHeapSnapshotCollectedNodes, this);
        this.heapSnapshot.addEventListener(WI.HeapSnapshotProxy.Event.Invalidated, this._handleHeapSnapshotInvalidated, this);
    }

    // Public

    get heapSnapshot()
    {
        return this.record.heapSnapshot;
    }

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        this._cachedData = super.data;
        this._cachedData.name = this.displayName();
        this._cachedData.timestamp = this.record.timestamp - (this.graphDataSource ? this.graphDataSource.zeroTime : 0);
        this._cachedData.size = this.heapSnapshot.totalSize;
        this._cachedData.liveSize = this.heapSnapshot.liveSize;
        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        const higherResolution = true;

        let value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());

            var fragment = document.createDocumentFragment();
            var titleElement = fragment.appendChild(document.createElement("span"));
            titleElement.textContent = value;

            if (this._heapAllocationsView && !this.heapSnapshot.invalid) {
                var goToButton = fragment.appendChild(WI.createGoToArrowButton());
                goToButton.addEventListener("click", (event) => {
                    this._heapAllocationsView.showHeapSnapshotTimelineRecord(this.record);
                });
            }

            return fragment;

        case "timestamp": {
            return isNaN(value) ? emDash : Number.secondsToString(value, higherResolution);
        }

        case "size":
        case "liveSize":
            return Number.bytesToString(value, higherResolution);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    markAsBaseline()
    {
        this.element.classList.add("baseline");
    }

    clearBaseline()
    {
        this.element.classList.remove("baseline");
    }

    // Protected

    createCells()
    {
        super.createCells();

        if (this.heapSnapshot.invalid)
            this.element.classList.add("invalid");
    }

    // Private

    _handleHeapSnapshotCollectedNodes()
    {
        this.needsRefresh();
    }

    _handleHeapSnapshotInvalidated()
    {
        this.needsRefresh();
    }
};
