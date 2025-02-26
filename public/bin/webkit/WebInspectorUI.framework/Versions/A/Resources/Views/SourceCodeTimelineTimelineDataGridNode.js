/*
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

WI.SourceCodeTimelineTimelineDataGridNode = class SourceCodeTimelineTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(sourceCodeTimeline, options = {})
    {
        const records = [];
        super(records, {includesGraph: true, ...options});

        this._sourceCodeTimeline = sourceCodeTimeline;
        this._sourceCodeTimeline.addEventListener(WI.Timeline.Event.RecordAdded, this._timelineRecordAdded, this);
    }

    // Public

    get records()
    {
        return this._sourceCodeTimeline.records;
    }

    get sourceCodeTimeline()
    {
        return this._sourceCodeTimeline;
    }

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        this._cachedData = super.data;
        this._cachedData.graph = this._sourceCodeTimeline.startTime;
        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        if (columnIdentifier === "name" && this.records.length) {
            cell.classList.add(...this.iconClassNames());
            return this._createNameCellContent(cell);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    // Protected

    filterableDataForColumn(columnIdentifier)
    {
        if (columnIdentifier === "name")
            return this.displayName();

        return super.filterableDataForColumn(columnIdentifier);
    }

    // Private

    _createNameCellContent(cellElement)
    {
        if (!this.records.length)
            return null;

        let fragment = document.createDocumentFragment();
        let mainTitle = this.displayName();
        fragment.append(mainTitle);

        let sourceCodeLocation = this._sourceCodeTimeline.sourceCodeLocation;
        if (sourceCodeLocation) {
            let subtitleElement = document.createElement("span");
            subtitleElement.classList.add("subtitle");
            sourceCodeLocation.populateLiveDisplayLocationString(subtitleElement, "textContent", null, WI.SourceCodeLocation.NameStyle.None, WI.UIString("line "));

            const options = {
                useGoToArrowButton: true,
                ignoreNetworkTab: true,
                ignoreSearchTab: true,
            };
            let goToArrowButtonLink = WI.createSourceCodeLocationLink(sourceCodeLocation, options);
            fragment.append(goToArrowButtonLink, subtitleElement);

            // Give the whole cell a tooltip and keep it up to date.
            sourceCodeLocation.populateLiveDisplayLocationTooltip(cellElement, mainTitle + "\n");
        } else
            cellElement.title = mainTitle;

        return fragment;
    }

    _timelineRecordAdded(event)
    {
        if (this.isRecordVisible(event.data.record))
            this.needsGraphRefresh();
    }
};
