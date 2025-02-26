/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ResourceTimelineDataGridNode = class ResourceTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(record, options = {})
    {
        console.assert(record instanceof WI.ResourceTimelineRecord);

        super([record], options);

        this._shouldShowPopover = options.shouldShowPopover;

        this.resource.addEventListener(WI.Resource.Event.LoadingDidFinish, this._needsRefresh, this);
        this.resource.addEventListener(WI.Resource.Event.LoadingDidFail, this._needsRefresh, this);
        this.resource.addEventListener(WI.Resource.Event.URLDidChange, this._needsRefresh, this);

        if (options.includesGraph)
            this.record.addEventListener(WI.TimelineRecord.Event.Updated, this._timelineRecordUpdated, this);
        else {
            this.resource.addEventListener(WI.Resource.Event.TypeDidChange, this._needsRefresh, this);
            this.resource.addEventListener(WI.Resource.Event.SizeDidChange, this._needsRefresh, this);
            this.resource.addEventListener(WI.Resource.Event.TransferSizeDidChange, this._needsRefresh, this);
        }
    }

    // Public

    get resource()
    {
        return this.record.resource;
    }

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        this._cachedData = super.data;
        this._cachedData.domain = WI.displayNameForHost(this.resource.urlComponents.host);
        this._cachedData.scheme = this.resource.urlComponents.scheme ? this.resource.urlComponents.scheme.toUpperCase() : "";
        this._cachedData.method = this.resource.requestMethod;
        this._cachedData.type = this.resource.type;
        this._cachedData.statusCode = this.resource.statusCode;
        this._cachedData.cached = this.resource.cached;
        this._cachedData.size = this.resource.size;
        this._cachedData.transferSize = !isNaN(this.resource.networkTotalTransferSize) ? this.resource.networkTotalTransferSize : this.resource.estimatedTotalTransferSize;
        this._cachedData.requestSent = this.resource.requestSentTimestamp - (this.graphDataSource ? this.graphDataSource.zeroTime : 0);
        this._cachedData.duration = this.resource.receiveDuration;
        this._cachedData.latency = this.resource.latency;
        this._cachedData.protocol = this.resource.protocol;
        this._cachedData.priority = this.resource.priority;
        this._cachedData.remoteAddress = this.resource.displayRemoteAddress;
        this._cachedData.connectionIdentifier = this.resource.connectionIdentifier;
        this._cachedData.initiator = this.resource.initiatorSourceCodeLocation;
        this._cachedData.source = this.resource.initiatorSourceCodeLocation; // Timeline Overview
        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        if (this.resource.hadLoadingError())
            cell.classList.add("error");

        let value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());
            cell.title = this.resource.displayURL;
            this._updateStatus(cell);
            return this._createNameCellDocumentFragment();

        case "type":
            var text = WI.Resource.displayNameForType(value);
            cell.title = text;
            return text;

        case "statusCode":
            cell.title = this.resource.statusText || "";
            return value || emDash;

        case "cached":
            var fragment = this._cachedCellContent();
            cell.title = fragment.textContent;
            return fragment;

        case "size":
        case "transferSize":
            var text = emDash;
            if (!isNaN(value)) {
                text = Number.bytesToString(value, true);
                cell.title = text;
            }
            return text;

        case "requestSent":
        case "latency":
        case "duration":
            var text = emDash;
            if (!isNaN(value)) {
                text = Number.secondsToString(value, true);
                cell.title = text;
            }
            return text;

        case "domain":
        case "method":
        case "scheme":
        case "protocol":
        case "remoteAddress":
        case "connectionIdentifier":
            if (value)
                cell.title = value;
            return value || emDash;

        case "priority":
            var title = WI.Resource.displayNameForPriority(value);
            if (title)
                cell.title = title;
            return title || emDash;

        case "source": // Timeline Overview
            return super.createCellContent("initiator", cell);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    generateIconTitle(columnIdentifier)
    {
        if (columnIdentifier === "name") {
            if (this.resource.responseSource === WI.Resource.ResponseSource.InspectorOverride)
                return WI.UIString("This resource was loaded from a local override");
        }

        return super.generateIconTitle(columnIdentifier);
    }

    refresh()
    {
        if (this._scheduledRefreshIdentifier) {
            cancelAnimationFrame(this._scheduledRefreshIdentifier);
            this._scheduledRefreshIdentifier = undefined;
        }

        this._cachedData = null;

        super.refresh();
    }

    iconClassNames()
    {
        return [WI.ResourceTreeElement.ResourceIconStyleClassName, ...WI.Resource.classNamesForResource(this.resource)];
    }

    appendContextMenuItems(contextMenu)
    {
        WI.appendContextMenuItemsForSourceCode(contextMenu, this.resource);
    }

    // Protected

    didAddRecordBar(recordBar)
    {
        if (!this._shouldShowPopover)
            return;

        if (!recordBar.records.length || recordBar.records[0].type !== WI.TimelineRecord.Type.Network)
            return;

        console.assert(!this._mouseEnterRecordBarListener);
        this._mouseEnterRecordBarListener = this._mouseoverRecordBar.bind(this);
        recordBar.element.addEventListener("mouseenter", this._mouseEnterRecordBarListener);
    }

    didRemoveRecordBar(recordBar)
    {
        if (!this._shouldShowPopover)
            return;

        if (!recordBar.records.length || recordBar.records[0].type !== WI.TimelineRecord.Type.Network)
            return;

        recordBar.element.removeEventListener("mouseenter", this._mouseEnterRecordBarListener);
        this._mouseEnterRecordBarListener = null;
    }

    filterableDataForColumn(columnIdentifier)
    {
        if (columnIdentifier === "name")
            return this.resource.url;
        return super.filterableDataForColumn(columnIdentifier);
    }

    // Private

    _createNameCellDocumentFragment()
    {
        let fragment = document.createDocumentFragment();
        let mainTitle = this.displayName();
        fragment.append(mainTitle);

        // Show the host as the subtitle if it is different from the main resource or if this is the main frame's main resource.
        let frame = this.resource.parentFrame;
        let isMainResource = this.resource.isMainResource();
        let parentResourceHost;
        if (frame && isMainResource) {
            // When the resource is a main resource, get the host from the current frame's parent frame instead of the current frame.
            parentResourceHost = frame.parentFrame ? frame.parentFrame.mainResource.urlComponents.host : null;
        } else if (frame) {
            // When the resource is a normal sub-resource, get the host from the current frame's main resource.
            parentResourceHost = frame.mainResource.urlComponents.host;
        }

        if (parentResourceHost !== this.resource.urlComponents.host || frame.isMainFrame() && isMainResource) {
            let subtitle = WI.displayNameForHost(this.resource.urlComponents.host);
            if (mainTitle !== subtitle) {
                let subtitleElement = document.createElement("span");
                subtitleElement.classList.add("subtitle");
                subtitleElement.textContent = subtitle;
                fragment.append(subtitleElement);
            }
        }

        return fragment;
    }

    _cachedCellContent()
    {
        if (!this.resource.hasResponse())
            return emDash;

        let responseSource = this.resource.responseSource;
        if (responseSource === WI.Resource.ResponseSource.MemoryCache || responseSource === WI.Resource.ResponseSource.DiskCache) {
            console.assert(this.resource.cached, "This resource has a cache responseSource it should also be marked as cached", this.resource);
            let span = document.createElement("span");
            let cacheType = document.createElement("span");
            cacheType.classList = "cache-type";
            cacheType.textContent = responseSource === WI.Resource.ResponseSource.MemoryCache ? WI.UIString("(Memory)") : WI.UIString("(Disk)");
            span.append(WI.UIString("Yes"), " ", cacheType);
            return span;
        }

        let fragment = document.createDocumentFragment();
        fragment.append(this.resource.cached ? WI.UIString("Yes") : WI.UIString("No"));
        return fragment;
    }

    _needsRefresh()
    {
        if (this.dataGrid instanceof WI.TimelineDataGrid) {
            this.dataGrid.dataGridNodeNeedsRefresh(this);
            return;
        }

        if (this._scheduledRefreshIdentifier)
            return;

        this._scheduledRefreshIdentifier = requestAnimationFrame(this.refresh.bind(this));
    }

    _timelineRecordUpdated(event)
    {
        if (this.isRecordVisible(this.record))
            this.needsGraphRefresh();
    }

    _dataGridNodeGoToArrowClicked()
    {
        const options = {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.LinkClick,
        };
        WI.showSourceCode(this.resource, options);
    }

    _updateStatus(cell)
    {
        if (this.resource.failed)
            cell.classList.add("error");
        else {
            cell.classList.remove("error");

            if (this.resource.finished)
                this.createGoToArrowButton(cell, this._dataGridNodeGoToArrowClicked.bind(this));
        }

        if (this.resource.isLoading()) {
            if (!this._spinner)
                this._spinner = new WI.IndeterminateProgressSpinner;
            let contentElement = cell.firstChild;
            contentElement.appendChild(this._spinner.element);
        } else {
            if (this._spinner)
                this._spinner.element.remove();
        }
    }

    _mouseoverRecordBar(event)
    {
        let recordBar = WI.TimelineRecordBar.fromElement(event.target);
        console.assert(recordBar);
        if (!recordBar)
            return;

        let calculateTargetFrame = () => {
            let columnRect = WI.Rect.rectFromClientRect(this.elementWithColumnIdentifier("graph").getBoundingClientRect());
            let barRect = WI.Rect.rectFromClientRect(event.target.getBoundingClientRect());
            return columnRect.intersectionWithRect(barRect);
        };

        let targetFrame = calculateTargetFrame();
        if (!targetFrame.size.width && !targetFrame.size.height)
            return;

        console.assert(recordBar.records.length);
        let resource = recordBar.records[0].resource;
        if (!resource.timingData)
            return;

        if (!resource.timingData.responseEnd)
            return;

        if (this.dataGrid._dismissPopoverTimeout) {
            clearTimeout(this.dataGrid._dismissPopoverTimeout);
            this.dataGrid._dismissPopoverTimeout = undefined;
        }

        let popoverContentElement = document.createElement("div");
        popoverContentElement.classList.add("resource-timing-popover-content");

        if (resource.failed || resource.urlComponents.scheme === "data" || (resource.cached && resource.statusCode !== 304)) {
            let descriptionElement = document.createElement("span");
            descriptionElement.classList.add("description");
            if (resource.failed)
                descriptionElement.textContent = WI.UIString("Resource failed to load.");
            else if (resource.urlComponents.scheme === "data")
                descriptionElement.textContent = WI.UIString("Resource was loaded with the \u201Cdata\u201D scheme.");
            else
                descriptionElement.textContent = WI.UIString("Resource was served from the cache.");
            popoverContentElement.appendChild(descriptionElement);
        } else {
            let columns = {
                description: {
                    width: "80px"
                },
                graph: {
                    width: `${WI.ResourceTimelineDataGridNode.PopoverGraphColumnWidthPixels}px`
                },
                duration: {
                    width: "70px",
                    aligned: "right"
                }
            };

            let popoverDataGrid = new WI.DataGrid(columns);
            popoverDataGrid.inline = true;
            popoverDataGrid.headerVisible = false;
            popoverContentElement.appendChild(popoverDataGrid.element);

            let graphDataSource = {
                get secondsPerPixel() { return resource.totalDuration / WI.ResourceTimelineDataGridNode.PopoverGraphColumnWidthPixels; },
                get zeroTime() { return resource.firstTimestamp; },
                get startTime() { return this.zeroTime; },
                get currentTime() { return resource.lastTimestamp + this._extraTimePadding; },
                get endTime() { return this.currentTime; },
                get _extraTimePadding() { return this.secondsPerPixel * WI.TimelineRecordBar.MinimumWidthPixels; },
            };

            if (resource.timingData.redirectEnd - resource.timingData.redirectStart) {
                // FIXME: <https://webkit.org/b/190214> Web Inspector: expose full load metrics for redirect requests
                popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Redirects"), resource.timingData.redirectStart, resource.timingData.redirectEnd, graphDataSource));
            }

            let secondTimestamp = resource.timingData.domainLookupStart || resource.timingData.connectStart || resource.timingData.requestStart;
            if (secondTimestamp - resource.timingData.fetchStart)
                popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Stalled"), resource.timingData.fetchStart, secondTimestamp, graphDataSource));
            if (resource.timingData.domainLookupStart)
                popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("DNS"), resource.timingData.domainLookupStart, resource.timingData.domainLookupEnd, graphDataSource));
            if (resource.timingData.connectStart)
                popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Connection"), resource.timingData.connectStart, resource.timingData.connectEnd, graphDataSource));
            if (resource.timingData.secureConnectionStart)
                popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Secure"), resource.timingData.secureConnectionStart, resource.timingData.connectEnd, graphDataSource));
            popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Request"), resource.timingData.requestStart, resource.timingData.responseStart, graphDataSource));
            popoverDataGrid.appendChild(new WI.ResourceTimingPopoverDataGridNode(WI.UIString("Response"), resource.timingData.responseStart, resource.timingData.responseEnd, graphDataSource));

            const higherResolution = true;
            let totalData = {
                description: WI.UIString("Total time"),
                duration: Number.secondsToMillisecondsString(resource.timingData.responseEnd - resource.timingData.startTime, higherResolution)
            };
            popoverDataGrid.appendChild(new WI.DataGridNode(totalData));

            popoverDataGrid.updateLayout();
        }

        if (!this.dataGrid._popover)
            this.dataGrid._popover = new WI.Popover;

        let preferredEdges = [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MIN_X];
        this.dataGrid._popover.windowResizeHandler = () => {
            let bounds = calculateTargetFrame();
            this.dataGrid._popover.present(bounds.pad(2), preferredEdges);
        };

        recordBar.element.addEventListener("mouseleave", () => {
            if (!this.dataGrid)
                return;

            this.dataGrid._dismissPopoverTimeout = setTimeout(() => {
                if (this.dataGrid)
                    this.dataGrid._popover.dismiss();
            }, WI.ResourceTimelineDataGridNode.DelayedPopoverDismissalTimeout);
        }, {once: true});

        this.dataGrid._popover.presentNewContentWithFrame(popoverContentElement, targetFrame.pad(2), preferredEdges);
    }
};

WI.ResourceTimelineDataGridNode.PopoverGraphColumnWidthPixels = 110;
WI.ResourceTimelineDataGridNode.DelayedPopoverDismissalTimeout = 500;
