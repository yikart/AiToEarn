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

WI.TimelineDataGridNode = class TimelineDataGridNode extends WI.DataGridNode
{
    constructor(records, {hasChildren, includesGraph, graphDataSource} = {})
    {
        super({}, {hasChildren, copyable: false});

        this._records = records;
        this._includesGraph = includesGraph || false;
        this._graphDataSource = graphDataSource || null;
        this._cachedData = null;

        if (this._graphDataSource) {
            this._graphContainerElement = document.createElement("div");
            this._timelineRecordBars = [];
        }
    }

    // Public

    get records() { return this._records; }

    get record()
    {
        return this.records && this.records.length ? this.records[0] : null;
    }

    get graphDataSource()
    {
        return this._graphDataSource;
    }

    get data()
    {
        if (!this._graphDataSource)
            return {};

        return {
            graph: this.record ? this.record.startTime : 0,
        };
    }

    collapse()
    {
        super.collapse();

        if (!this._graphDataSource || !this.revealed)
            return;

        // Refresh to show child bars in our graph now that we collapsed.
        this.refreshGraph();
    }

    expand()
    {
        super.expand();

        if (!this._graphDataSource || !this.revealed)
            return;

        // Refresh to remove child bars from our graph now that we expanded.
        this.refreshGraph();

        // Refresh child graphs since they haven't been updating while we were collapsed.
        var childNode = this.children[0];
        while (childNode) {
            if (childNode instanceof WI.TimelineDataGridNode)
                childNode.refreshGraph();
            childNode = childNode.traverseNextNode(true, this);
        }
    }

    createCellContent(columnIdentifier, cell)
    {
        if (columnIdentifier === "graph" && this._graphDataSource) {
            this.needsGraphRefresh();
            return this._graphContainerElement;
        }

        var value = this.data[columnIdentifier];
        if (!value)
            return emDash;

        const options = {
            useGoToArrowButton: true,
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };

        if (value instanceof WI.SourceCodeLocation) {
            if (value.sourceCode instanceof WI.Resource) {
                cell.classList.add(WI.ResourceTreeElement.ResourceIconStyleClassName, ...WI.Resource.classNamesForResource(value.sourceCode));
            } else if (value.sourceCode instanceof WI.Script) {
                if (value.sourceCode.url) {
                    cell.classList.add(WI.ResourceTreeElement.ResourceIconStyleClassName);
                    cell.classList.add(WI.Resource.Type.Script);
                } else
                    cell.classList.add(WI.ScriptTreeElement.AnonymousScriptIconStyleClassName);
            } else
                console.error("Unknown SourceCode subclass.");

            // Give the whole cell a tooltip and keep it up to date.
            value.populateLiveDisplayLocationTooltip(cell);

            var fragment = document.createDocumentFragment();
            fragment.appendChild(WI.createSourceCodeLocationLink(value, options));

            var titleElement = document.createElement("span");
            value.populateLiveDisplayLocationString(titleElement, "textContent");
            fragment.appendChild(titleElement);

            return fragment;
        }

        if (value instanceof WI.CallFrame) {
            var callFrame = value;

            var isAnonymousFunction = false;
            var functionName = callFrame.functionName;
            if (!functionName) {
                functionName = WI.UIString("(anonymous function)");
                isAnonymousFunction = true;
            }

            cell.classList.add(WI.CallFrameView.FunctionIconStyleClassName);

            var fragment = document.createDocumentFragment();

            let iconElement = document.createElement("div");
            iconElement.classList.add("icon");

            let sourceCode = callFrame.sourceCodeLocation?.sourceCode;
            if (sourceCode) {
                // Give the whole cell a tooltip and keep it up to date.
                callFrame.sourceCodeLocation.populateLiveDisplayLocationTooltip(cell);

                fragment.appendChild(WI.createSourceCodeLocationLink(callFrame.sourceCodeLocation, options));

                if (isAnonymousFunction) {
                    // For anonymous functions we show the resource or script icon and name.
                    if (sourceCode instanceof WI.Resource) {
                        cell.classList.add(WI.ResourceTreeElement.ResourceIconStyleClassName, ...WI.Resource.classNamesForResource(sourceCode));
                        if (sourceCode.responseSource === WI.Resource.ResponseSource.InspectorOverride)
                            iconElement.title = WI.UIString("This resource was loaded from a local override");
                    } else if (sourceCode instanceof WI.Script) {
                        if (sourceCode.url) {
                            cell.classList.add(WI.ResourceTreeElement.ResourceIconStyleClassName);
                            cell.classList.add(WI.Resource.Type.Script);
                        } else
                            cell.classList.add(WI.ScriptTreeElement.AnonymousScriptIconStyleClassName);
                    } else
                        console.error("Unknown SourceCode subclass.");

                    var titleElement = document.createElement("span");
                    callFrame.sourceCodeLocation.populateLiveDisplayLocationString(titleElement, "textContent");

                    fragment.appendChild(titleElement);
                } else {
                    // Show the function name and icon.
                    cell.classList.add(WI.CallFrameView.FunctionIconStyleClassName);

                    fragment.append(functionName);

                    var subtitleElement = document.createElement("span");
                    subtitleElement.classList.add("subtitle");
                    callFrame.sourceCodeLocation.populateLiveDisplayLocationString(subtitleElement, "textContent");

                    fragment.appendChild(subtitleElement);
                }

                return fragment;
            }

            fragment.append(iconElement, functionName);

            return fragment;
        }

        if (value instanceof WI.DOMNode) {
            cell.classList.add(WI.DOMTreeElementPathComponent.iconClassNameForNode(value));
            return WI.linkifyNodeReference(value);
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    generateIconTitle(columnIdentifier)
    {
        let value = this.data[columnIdentifier];

        if (value instanceof WI.SourceCodeLocation && value.sourceCode instanceof WI.Resource && value.sourceCode.responseSource === WI.Resource.ResponseSource.InspectorOverride)
            return WI.UIString("This resource was loaded from a local override");

        return super.generateIconTitle(columnIdentifier);
    }

    refresh()
    {
        this._cachedData = null;

        if (this._graphDataSource && this._includesGraph)
            this.needsGraphRefresh();

        super.refresh();
    }

    refreshGraph()
    {
        if (!this._graphDataSource)
            return;

        if (this._scheduledGraphRefreshIdentifier) {
            cancelAnimationFrame(this._scheduledGraphRefreshIdentifier);
            this._scheduledGraphRefreshIdentifier = undefined;
        }

        // We are not visible, but an ancestor will draw our graph.
        // They need notified by using our needsGraphRefresh.
        console.assert(this.revealed);
        if (!this.revealed)
            return;

        let secondsPerPixel = this._graphDataSource.secondsPerPixel;
        if (isNaN(secondsPerPixel))
            return;

        console.assert(secondsPerPixel > 0);

        var recordBarIndex = 0;

        function createBar(records, renderMode)
        {
            var timelineRecordBar = this._timelineRecordBars[recordBarIndex];
            if (!timelineRecordBar)
                timelineRecordBar = this._timelineRecordBars[recordBarIndex] = new WI.TimelineRecordBar(this, records, renderMode);
            else {
                timelineRecordBar.renderMode = renderMode;
                timelineRecordBar.records = records;
            }
            timelineRecordBar.refresh(this._graphDataSource);
            if (!timelineRecordBar.element.parentNode) {
                this._graphContainerElement.appendChild(timelineRecordBar.element);
                this.didAddRecordBar(timelineRecordBar);
            }
            ++recordBarIndex;
        }

        function collectRecordsByType(records, recordsByTypeMap)
        {
            for (var record of records) {
                var typedRecords = recordsByTypeMap.get(record.type);
                if (!typedRecords) {
                    typedRecords = [];
                    recordsByTypeMap.set(record.type, typedRecords);
                }

                typedRecords.push(record);
            }
        }

        var boundCreateBar = createBar.bind(this);

        if (this.expanded) {
            // When expanded just use the records for this node.
            WI.TimelineRecordBar.createCombinedBars(this.records, secondsPerPixel, this._graphDataSource, boundCreateBar);
        } else {
            // When collapsed use the records for this node and its descendants.
            // To share bars better, group records by type.

            var recordTypeMap = new Map;
            collectRecordsByType(this.records, recordTypeMap);

            var childNode = this.children[0];
            while (childNode) {
                if (childNode instanceof WI.TimelineDataGridNode)
                    collectRecordsByType(childNode.records, recordTypeMap);
                childNode = childNode.traverseNextNode(false, this);
            }

            for (var records of recordTypeMap.values())
                WI.TimelineRecordBar.createCombinedBars(records, secondsPerPixel, this._graphDataSource, boundCreateBar);
        }

        // Remove the remaining unused TimelineRecordBars.
        for (; recordBarIndex < this._timelineRecordBars.length; ++recordBarIndex) {
            this._timelineRecordBars[recordBarIndex].element.remove();
            this.didRemoveRecordBar(this._timelineRecordBars[recordBarIndex]);
            this._timelineRecordBars[recordBarIndex].records = null;
        }
    }

    needsGraphRefresh()
    {
        if (!this.revealed) {
            // We are not visible, but an ancestor will be drawing our graph.
            // Notify the next visible ancestor that their graph needs to refresh.
            var ancestor = this;
            while (ancestor && !ancestor.root) {
                if (ancestor.revealed && ancestor instanceof WI.TimelineDataGridNode) {
                    ancestor.needsGraphRefresh();
                    return;
                }

                ancestor = ancestor.parent;
            }

            return;
        }

        if (!this._graphDataSource || this._scheduledGraphRefreshIdentifier)
            return;

        this._scheduledGraphRefreshIdentifier = requestAnimationFrame(this.refreshGraph.bind(this));
    }

    displayName()
    {
        // Can be overridden by subclasses.
        const includeDetailsInMainTitle = true;
        return WI.TimelineTabContentView.displayNameForRecord(this.record, includeDetailsInMainTitle);
    }

    iconClassNames()
    {
        // Can be overridden by subclasses.
        return [WI.TimelineTabContentView.iconClassNameForRecord(this.record)];
    }

    // Protected

    createGoToArrowButton(cellElement, callback)
    {
        function buttonClicked(event)
        {
            if (this.hidden || !this.revealed)
                return;

            event.stopPropagation();

            callback(this, cellElement.__columnIdentifier);
        }

        let button = WI.createGoToArrowButton();
        button.addEventListener("click", buttonClicked.bind(this));

        let contentElement = cellElement.firstChild;
        contentElement.appendChild(button);
    }

    isRecordVisible(record)
    {
        if (!this._graphDataSource)
            return false;

        if (isNaN(record.startTime))
            return false;

        // If this bar is completely before the bounds of the graph, not visible.
        if (record.endTime < this.graphDataSource.startTime)
            return false;

        // If this record is completely after the current time or end time, not visible.
        if (record.startTime > this.graphDataSource.currentTime || record.startTime > this.graphDataSource.endTime)
            return false;

        return true;
    }

    filterableDataForColumn(columnIdentifier)
    {
        let value = this.data[columnIdentifier];
        if (value instanceof WI.SourceCodeLocation)
            return value.displayLocationString();

        if (value instanceof WI.CallFrame)
            return [value.functionName, value.sourceCodeLocation.displayLocationString()];

        return super.filterableDataForColumn(columnIdentifier);
    }

    didAddRecordBar(recordBar)
    {
        // Implemented by subclasses.
    }

    didRemoveRecordBar(recordBar)
    {
        // Implemented by subclasses.
    }

    didResizeColumn(columnIdentifier)
    {
        if (columnIdentifier !== "graph")
            return;

        this.needsGraphRefresh();
    }
};
