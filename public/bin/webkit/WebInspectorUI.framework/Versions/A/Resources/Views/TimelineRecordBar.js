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

WI.TimelineRecordBar = class TimelineRecordBar extends WI.Object
{
    constructor(delegate, records, renderMode)
    {
        super();

        this._delegate = delegate || null;

        this._element = document.createElement("div");
        this._element.classList.add("timeline-record-bar");
        this._element[WI.TimelineRecordBar.ElementReferenceSymbol] = this;
        this._element.addEventListener("click", this._handleClick.bind(this));

        this.renderMode = renderMode;
        this.records = records;

        this._cachedBarDuration = null;
    }

    static createCombinedBars(records, secondsPerPixel, graphDataSource, createBarCallback)
    {
        if (!records.length)
            return;

        var startTime = graphDataSource.startTime;
        var currentTime = graphDataSource.currentTime;
        var endTime = graphDataSource.endTime;

        var visibleRecords = [];
        var usesActiveStartTime = false;
        var lastRecordType = null;

        // FIXME: Do a binary search for records that fall inside start and current time.

        for (var i = 0; i < records.length; ++i) {
            var record = records[i];
            if (isNaN(record.startTime))
                continue;

            // If this bar is completely before the bounds of the graph, skip this record.
            if (record.endTime < startTime)
                continue;

            // If this record is completely after the current time or end time, break out now.
            // Records are sorted, so all records after this will be beyond the current or end time too.
            if (record.startTime > currentTime || record.startTime > endTime)
                break;

            if (record.usesActiveStartTime)
                usesActiveStartTime = true;

            // If one record uses active time the rest are assumed to use it.
            console.assert(record.usesActiveStartTime === usesActiveStartTime);

            // Only a single record type is supported right now.
            console.assert(!lastRecordType || record.type === lastRecordType);

            visibleRecords.push(record);

            lastRecordType = record.type;
        }

        if (!visibleRecords.length)
            return;

        if (visibleRecords.length === 1) {
            createBarCallback(visibleRecords, WI.TimelineRecordBar.RenderMode.Normal);
            return;
        }

        function compareByActiveStartTime(a, b)
        {
            return a.activeStartTime - b.activeStartTime;
        }

        var minimumDuration = secondsPerPixel * WI.TimelineRecordBar.MinimumWidthPixels;
        var minimumMargin = secondsPerPixel * WI.TimelineRecordBar.MinimumMarginPixels;

        if (usesActiveStartTime) {
            var inactiveStartTime = NaN;
            var inactiveEndTime = NaN;
            var inactiveRecords = [];

            for (var i = 0; i < visibleRecords.length; ++i) {
                var record = visibleRecords[i];

                // Check if the previous record is far enough away to create the inactive bar.
                if (!isNaN(inactiveStartTime) && inactiveStartTime + Math.max(inactiveEndTime - inactiveStartTime, minimumDuration) + minimumMargin <= record.startTime) {
                    createBarCallback(inactiveRecords, WI.TimelineRecordBar.RenderMode.InactiveOnly);
                    inactiveRecords = [];
                    inactiveStartTime = NaN;
                    inactiveEndTime = NaN;
                }

                // If this is a new bar, peg the start time.
                if (isNaN(inactiveStartTime))
                    inactiveStartTime = record.startTime;

                // Update the end time to be the maximum we encounter. inactiveEndTime might be NaN, so "|| 0" to prevent Math.max from returning NaN.
                inactiveEndTime = Math.max(inactiveEndTime || 0, record.activeStartTime);

                inactiveRecords.push(record);
            }

            // Create the inactive bar for the last record if needed.
            if (!isNaN(inactiveStartTime))
                createBarCallback(inactiveRecords, WI.TimelineRecordBar.RenderMode.InactiveOnly);

            visibleRecords.sort(compareByActiveStartTime);
        }

        var activeStartTime = NaN;
        var activeEndTime = NaN;
        var activeRecords = [];

        var startTimeProperty = usesActiveStartTime ? "activeStartTime" : "startTime";

        for (var i = 0; i < visibleRecords.length; ++i) {
            var record = visibleRecords[i];
            var startTime = record[startTimeProperty];

            // Check if the previous record is far enough away to create the active bar. We also create it now if the current record has no active state time.
            if (!isNaN(activeStartTime) && (activeStartTime + Math.max(activeEndTime - activeStartTime, minimumDuration) + minimumMargin <= startTime
                || (isNaN(startTime) && !isNaN(activeEndTime)))) {
                createBarCallback(activeRecords, WI.TimelineRecordBar.RenderMode.ActiveOnly);
                activeRecords = [];
                activeStartTime = NaN;
                activeEndTime = NaN;
            }

            if (isNaN(startTime))
                continue;

            // If this is a new bar, peg the start time.
            if (isNaN(activeStartTime))
                activeStartTime = startTime;

            // Update the end time to be the maximum we encounter. activeEndTime might be NaN, so "|| 0" to prevent Math.max from returning NaN.
            if (!isNaN(record.endTime))
                activeEndTime = Math.max(activeEndTime || 0, record.endTime);

            activeRecords.push(record);
        }

        // Create the active bar for the last record if needed.
        if (!isNaN(activeStartTime))
            createBarCallback(activeRecords, WI.TimelineRecordBar.RenderMode.ActiveOnly);
    }

    static fromElement(element)
    {
        return element[WI.TimelineRecordBar.ElementReferenceSymbol] || null;
    }

    // Public

    get element()
    {
        return this._element;
    }

    get selected()
    {
        return this._element.classList.contains("selected");
    }

    set selected(selected)
    {
        this._element.classList.toggle("selected", !!selected);
    }

    get renderMode()
    {
        return this._renderMode;
    }

    set renderMode(renderMode)
    {
        this._renderMode = renderMode || WI.TimelineRecordBar.RenderMode.Normal;
    }

    get records()
    {
        return this._records;
    }

    set records(records)
    {
        let oldRecordType;
        let oldRecordEventType;
        let oldRecordUsesActiveStartTime = false;
        if (this._records && this._records.length) {
            let oldRecord = this._records[0];
            oldRecordType = oldRecord.type;
            oldRecordEventType = oldRecord.eventType;
            oldRecordUsesActiveStartTime = oldRecord.usesActiveStartTime;
        }

        records = records || [];

        this._records = records;

        // Assume all records in the group are the same type.
        if (this._records.length) {
            let newRecord = this._records[0];
            if (newRecord.type !== oldRecordType) {
                this._element.classList.remove(oldRecordType);
                this._element.classList.add(newRecord.type);
            }
            // Although all records may not have the same event type, the first record is
            // sufficient to determine the correct style for the record bar.
            if (newRecord.eventType !== oldRecordEventType) {
                this._element.classList.remove(oldRecordEventType);
                this._element.classList.add(newRecord.eventType);
            }
            if (newRecord.usesActiveStartTime !== oldRecordUsesActiveStartTime) {
                if (!this._delegate || !this._delegate.timelineRecordBarCustomChildren)
                    this._element.classList.toggle("has-inactive-segment", newRecord.usesActiveStartTime);
            }
        } else
            this._element.classList.remove(oldRecordType, oldRecordEventType, "has-inactive-segment");
    }

    refresh(graphDataSource)
    {
        if (isNaN(graphDataSource.secondsPerPixel))
            return false;

        console.assert(graphDataSource.zeroTime);
        console.assert(graphDataSource.startTime);
        console.assert(graphDataSource.currentTime);
        console.assert(graphDataSource.endTime);
        console.assert(graphDataSource.secondsPerPixel);

        if (!this._records || !this._records.length)
            return false;

        var firstRecord = this._records[0];
        var barStartTime = firstRecord.startTime;

        // If this bar has no time info, return early.
        if (isNaN(barStartTime))
            return false;

        var graphStartTime = graphDataSource.startTime;
        var graphEndTime = graphDataSource.endTime;
        var graphCurrentTime = graphDataSource.currentTime;

        var barEndTime = this._records.reduce(function(previousValue, currentValue) { return Math.max(previousValue, currentValue.endTime); }, 0);

        // If this bar is completely after the current time, return early.
        if (barStartTime > graphCurrentTime)
            return false;

        // If this bar is completely before or after the bounds of the graph, return early.
        if (barEndTime < graphStartTime || barStartTime > graphEndTime)
            return false;

        var barUnfinished = isNaN(barEndTime) || barEndTime >= graphCurrentTime;
        if (barUnfinished)
            barEndTime = graphCurrentTime;

        this._cachedBarDuration = barEndTime - barStartTime;

        var graphDuration = graphEndTime - graphStartTime;

        let newBarPosition = (barStartTime - graphStartTime) / graphDuration;
        let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        this._updateElementPosition(this._element, newBarPosition, property);

        var newBarWidth = ((barEndTime - graphStartTime) / graphDuration) - newBarPosition;
        this._updateElementPosition(this._element, newBarWidth, "width");

        if (this._delegate && this._delegate.timelineRecordBarCustomChildren) {
            this._element.removeChildren();

            this._element.classList.add("has-custom-children");
            this._element.classList.toggle("unfinished", barUnfinished);

            let children = this._delegate.timelineRecordBarCustomChildren(this);
            for (let child of children) {
                let childElement;
                if (child.image) {
                    childElement = this._element.appendChild(document.createElement("img"));
                    childElement.src = child.image;
                } else
                    childElement = this._element.appendChild(document.createElement("div"));

                childElement.classList.add(...child.classNames);
                childElement.title = child.title;
                this._updateElementPosition(childElement, (child.startTime - barStartTime) / this._cachedBarDuration, property);

                if (typeof child.endTime === "number") {
                    let childEndTime = !isNaN(child.endTime) ? child.endTime : barEndTime;
                    this._updateElementPosition(childElement, (childEndTime - child.startTime) / this._cachedBarDuration, "width");
                }
            }

            return true;
        }

        this._element.classList.remove("has-custom-children");

        if (!this._activeBarElement && this._renderMode !== WI.TimelineRecordBar.RenderMode.InactiveOnly) {
            this._activeBarElement = document.createElement("div");
            this._activeBarElement.classList.add("segment");
        }

        if (!firstRecord.usesActiveStartTime) {
            this._element.classList.toggle("unfinished", barUnfinished);

            if (this._inactiveBarElement)
                this._inactiveBarElement.remove();

            if (this._renderMode === WI.TimelineRecordBar.RenderMode.InactiveOnly) {
                if (this._activeBarElement)
                    this._activeBarElement.remove();

                return false;
            }

            // If this TimelineRecordBar is reused and had an inactive bar previously, clean it up.
            this._activeBarElement.style.removeProperty(WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left");
            this._activeBarElement.style.removeProperty("width");

            if (!this._activeBarElement.parentNode)
                this._element.appendChild(this._activeBarElement);

            return true;
        }

        // Find the earliest active start time for active only rendering, and the latest for the other modes.
        // This matches the values that TimelineRecordBar.createCombinedBars uses when combining.
        if (this._renderMode === WI.TimelineRecordBar.RenderMode.ActiveOnly)
            var barActiveStartTime = this._records.reduce(function(previousValue, currentValue) { return Math.min(previousValue, currentValue.activeStartTime); }, Infinity);
        else
            var barActiveStartTime = this._records.reduce(function(previousValue, currentValue) { return Math.max(previousValue, currentValue.activeStartTime); }, 0);

        var inactiveUnfinished = isNaN(barActiveStartTime) || barActiveStartTime >= graphCurrentTime;
        this._element.classList.toggle("unfinished", inactiveUnfinished);

        if (inactiveUnfinished)
            barActiveStartTime = graphCurrentTime;
        else if (this._renderMode === WI.TimelineRecordBar.RenderMode.Normal) {
            // Hide the inactive segment when its duration is less than the minimum displayable size.
            let minimumSegmentDuration = graphDataSource.secondsPerPixel * WI.TimelineRecordBar.MinimumWidthPixels;
            if (barActiveStartTime - barStartTime < minimumSegmentDuration) {
                barActiveStartTime = barStartTime;
                if (this._inactiveBarElement)
                    this._inactiveBarElement.remove();
            }
        }

        let showInactiveSegment = barActiveStartTime > barStartTime;
        this._element.classList.toggle("has-inactive-segment", showInactiveSegment);

        let middlePercentage = (barActiveStartTime - barStartTime) / this._cachedBarDuration;
        if (showInactiveSegment && this._renderMode !== WI.TimelineRecordBar.RenderMode.ActiveOnly) {
            if (!this._inactiveBarElement) {
                this._inactiveBarElement = document.createElement("div");
                this._inactiveBarElement.classList.add("segment");
                this._inactiveBarElement.classList.add("inactive");
            }

            let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "left" : "right";
            this._updateElementPosition(this._inactiveBarElement, 1 - middlePercentage, property);
            this._updateElementPosition(this._inactiveBarElement, middlePercentage, "width");

            if (!this._inactiveBarElement.parentNode)
                this._element.insertBefore(this._inactiveBarElement, this._element.firstChild);
        }

        if (!inactiveUnfinished && this._renderMode !== WI.TimelineRecordBar.RenderMode.InactiveOnly) {
            let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
            this._updateElementPosition(this._activeBarElement, middlePercentage, property);
            this._updateElementPosition(this._activeBarElement, 1 - middlePercentage, "width");

            if (!this._activeBarElement.parentNode)
                this._element.appendChild(this._activeBarElement);
        } else if (this._activeBarElement)
            this._activeBarElement.remove();

        return true;
    }

    // Private

    _updateElementPosition(element, newPosition, property)
    {
        newPosition *= 100;

        let newPositionAprox = Math.round(newPosition * 100);
        let currentPositionAprox = Math.round(parseFloat(element.style[property]) * 100);
        if (currentPositionAprox !== newPositionAprox)
            element.style[property] = (newPositionAprox / 100) + "%";
    }

    _handleClick(event)
    {
        // Ensure that the container "click" listener added by `WI.TimelineOverview` isn't called.
        event.__timelineRecordClickEventHandled = true;

        if (!this._delegate?.timelineRecordBarClicked)
            return;

        if (!this._cachedBarDuration)
            return;

        if (this._records.length === 1) {
            this._delegate.timelineRecordBarClicked(this._records[0]);
            return;
        }

        let relativeMouseX = Number.constrain(event.offsetX / this._element.offsetWidth, 0, 1);
        let targetRecordTime = this._records[0].startTime + (this._cachedBarDuration * relativeMouseX);
        let closestRecord = null;
        let closestRecordTimeDelta = Infinity;
        for (let record of this._records) {
            if (record.children.length)
                continue;

            if (targetRecordTime >= record.startTime && targetRecordTime <= record.endTime) {
                closestRecord = record;
                break;
            }

            let timeBetweenRecordAndTargetTime = Math.min(Math.abs(record.startTime - targetRecordTime), Math.abs(record.endTime - targetRecordTime));
            if (timeBetweenRecordAndTargetTime > closestRecordTimeDelta)
                break;

            closestRecord = record;
            closestRecordTimeDelta = timeBetweenRecordAndTargetTime;
        }

        console.assert(closestRecord);
        this._delegate.timelineRecordBarClicked(closestRecord);
    }
};

WI.TimelineRecordBar.ElementReferenceSymbol = Symbol("timeline-record-bar");

WI.TimelineRecordBar.MinimumWidthPixels = 4;
WI.TimelineRecordBar.MinimumMarginPixels = 1;

WI.TimelineRecordBar.RenderMode = {
    Normal: "timeline-record-bar-normal-render-mode",
    InactiveOnly: "timeline-record-bar-inactive-only-render-mode",
    ActiveOnly: "timeline-record-bar-active-only-render-mode"
};
