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

WI.TimelineRuler = class TimelineRuler extends WI.View
{
    constructor()
    {
        super();

        this.element.classList.add("timeline-ruler");

        this._headerElement = document.createElement("div");
        this._headerElement.classList.add("header");
        this.element.appendChild(this._headerElement);

        this._markersElement = document.createElement("div");
        this._markersElement.classList.add("markers");
        this.element.appendChild(this._markersElement);

        this._zeroTime = 0;
        this._startTime = 0;
        this._endTime = 0;
        this._duration = NaN;
        this._secondsPerPixel = 0;
        this._selectionStartTime = 0;
        this._selectionEndTime = Number.MAX_VALUE;
        this._endTimePinned = false;
        this._snapInterval = 0;
        this._allowsClippedLabels = false;
        this._allowsTimeRangeSelection = false;
        this._minimumSelectionDuration = 0.01;
        this._formatLabelCallback = null;
        this._timeRangeSelectionChanged = false;
        this._enabled = true;

        this._scannerMarker = null;
        this._markerElementMap = new Map;
        this._cachedClientWidth = 0;
    }

    // Public

    get enabled()
    {
        return this._enabled;
    }

    set enabled(x)
    {
        if (this._enabled === x)
            return;

        this._enabled = x;
        this.element.classList.toggle(WI.TreeElementStatusButton.DisabledStyleClassName, !this._enabled);
    }

    get allowsClippedLabels()
    {
        return this._allowsClippedLabels;
    }

    set allowsClippedLabels(x)
    {
        x = !!x;

        if (this._allowsClippedLabels === x)
            return;

        this._allowsClippedLabels = x;

        this.needsLayout();
    }

    set formatLabelCallback(x)
    {
        console.assert(typeof x === "function" || !x, x);

        x = x || null;

        if (this._formatLabelCallback === x)
            return;

        this._formatLabelCallback = x;

        this.needsLayout();
    }

    get allowsTimeRangeSelection()
    {
        return this._allowsTimeRangeSelection;
    }

    set allowsTimeRangeSelection(x)
    {
        x = !!x;

        if (this._allowsTimeRangeSelection === x)
            return;

        this._allowsTimeRangeSelection = x;

        if (x) {
            this._clickEventListener = this._handleClick.bind(this);
            this._doubleClickEventListener = this._handleDoubleClick.bind(this);
            this._mouseDownEventListener = this._handleMouseDown.bind(this);
            this.element.addEventListener("click", this._clickEventListener);
            this.element.addEventListener("dblclick", this._doubleClickEventListener);
            this.element.addEventListener("mousedown", this._mouseDownEventListener);

            this._leftShadedAreaElement = document.createElement("div");
            this._leftShadedAreaElement.classList.add("shaded-area");
            this._leftShadedAreaElement.classList.add("left");

            this._rightShadedAreaElement = document.createElement("div");
            this._rightShadedAreaElement.classList.add("shaded-area");
            this._rightShadedAreaElement.classList.add("right");

            this._leftSelectionHandleElement = document.createElement("div");
            this._leftSelectionHandleElement.classList.add("selection-handle");
            this._leftSelectionHandleElement.classList.add("left");
            this._leftSelectionHandleElement.addEventListener("mousedown", this._handleSelectionHandleMouseDown.bind(this));

            this._rightSelectionHandleElement = document.createElement("div");
            this._rightSelectionHandleElement.classList.add("selection-handle");
            this._rightSelectionHandleElement.classList.add("right");
            this._rightSelectionHandleElement.addEventListener("mousedown", this._handleSelectionHandleMouseDown.bind(this));

            this._selectionDragElement = document.createElement("div");
            this._selectionDragElement.classList.add("selection-drag");

            this._needsSelectionLayout();
        } else {
            this.element.removeEventListener("click", this._clickEventListener);
            this.element.removeEventListener("dblclick", this._doubleClickEventListener);
            this.element.removeEventListener("mousedown", this._mouseDownEventListener);
            this._clickEventListener = null;
            this._doubleClickEventListener = null;
            this._mouseDownEventListener = null;

            this._leftShadedAreaElement.remove();
            this._rightShadedAreaElement.remove();
            this._leftSelectionHandleElement.remove();
            this._rightSelectionHandleElement.remove();
            this._selectionDragElement.remove();

            delete this._leftShadedAreaElement;
            delete this._rightShadedAreaElement;
            delete this._leftSelectionHandleElement;
            delete this._rightSelectionHandleElement;
            delete this._selectionDragElement;
        }
    }

    get minimumSelectionDuration()
    {
        return this._minimumSelectionDuration;
    }

    set minimumSelectionDuration(x)
    {
        this._minimumSelectionDuration = x;
    }

    get zeroTime()
    {
        return this._zeroTime;
    }

    set zeroTime(x)
    {
        x = x || 0;

        if (this._zeroTime === x)
            return;

        if (this.entireRangeSelected)
            this.selectionStartTime = x;

        this._zeroTime = x;

        this.needsLayout();
    }

    get startTime()
    {
        return this._startTime;
    }

    set startTime(x)
    {
        x = x || 0;

        if (this._startTime === x)
            return;

        this._startTime = x;

        if (!isNaN(this._duration))
            this._endTime = this._startTime + this._duration;

        this._currentDividers = null;

        this.needsLayout();
    }

    get duration()
    {
        if (!isNaN(this._duration))
            return this._duration;
        return this.endTime - this.startTime;
    }

    get endTime()
    {
        if (!this._endTimePinned && this.layoutPending)
            this._recalculate();
        return this._endTime;
    }

    set endTime(x)
    {
        x = x || 0;

        if (this._endTime === x)
            return;

        this._endTime = x;
        this._endTimePinned = true;

        this.needsLayout();
    }

    get secondsPerPixel()
    {
        if (this.layoutPending)
            this._recalculate();
        return this._secondsPerPixel;
    }

    set secondsPerPixel(x)
    {
        x = x || 0;

        if (this._secondsPerPixel === x)
            return;

        this._secondsPerPixel = x;
        this._endTimePinned = false;
        this._currentDividers = null;
        this._currentSliceTime = 0;

        this.needsLayout();
    }

    get snapInterval()
    {
        return this._snapInterval;
    }

    set snapInterval(x)
    {
        if (this._snapInterval === x)
            return;

        this._snapInterval = x;
    }

    get selectionStartTime()
    {
        return this._selectionStartTime;
    }

    set selectionStartTime(x)
    {
        x = this._snapValue(x) || 0;

        if (this._selectionStartTime === x)
            return;

        this._selectionStartTime = x;
        this._timeRangeSelectionChanged = true;

        this._needsSelectionLayout();
    }

    get selectionEndTime()
    {
        return this._selectionEndTime;
    }

    set selectionEndTime(x)
    {
        x = this._snapValue(x) || 0;

        if (this._selectionEndTime === x)
            return;

        this._selectionEndTime = x;
        this._timeRangeSelectionChanged = true;

        this._needsSelectionLayout();
    }

    get entireRangeSelected()
    {
        return this._selectionStartTime === this._zeroTime && this._selectionEndTime === Number.MAX_VALUE;
    }

    selectEntireRange()
    {
        this.selectionStartTime = this._zeroTime;
        this.selectionEndTime = Number.MAX_VALUE;
    }

    addMarker(marker)
    {
        console.assert(marker instanceof WI.TimelineMarker);

        if (this._markerElementMap.has(marker))
            return;

        marker.addEventListener(WI.TimelineMarker.Event.TimeChanged, this._timelineMarkerTimeChanged, this);

        let markerTime = marker.time - this._startTime;
        let markerElement = document.createElement("div");
        markerElement.classList.add(marker.type, "marker");

        switch (marker.type) {
        case WI.TimelineMarker.Type.LoadEvent:
            markerElement.title = WI.UIString("Load \u2014 %s").format(Number.secondsToString(markerTime));
            break;
        case WI.TimelineMarker.Type.DOMContentEvent:
            markerElement.title = WI.UIString("DOM Content Loaded \u2014 %s").format(Number.secondsToString(markerTime));
            break;
        case WI.TimelineMarker.Type.TimeStamp:
            if (marker.details)
                markerElement.title = WI.UIString("%s \u2014 %s").format(marker.details, Number.secondsToString(markerTime));
            else
                markerElement.title = WI.UIString("Timestamp \u2014 %s").format(Number.secondsToString(markerTime));
            break;
        }

        this._markerElementMap.set(marker, markerElement);

        this._needsMarkerLayout();
    }

    clearMarkers()
    {
        for (let [marker, markerElement] of this._markerElementMap) {
            marker.removeEventListener(WI.TimelineMarker.Event.TimeChanged, this._timelineMarkerTimeChanged, this);
            markerElement.remove();
        }

        this._markerElementMap.clear();

        this._scannerMarker = null;
    }

    elementForMarker(marker)
    {
        return this._markerElementMap.get(marker) || null;
    }

    showScanner(time)
    {
        if (!this._scannerMarker) {
            this._scannerMarker = new WI.TimelineMarker(time, WI.TimelineMarker.Type.Scanner);
            this.addMarker(this._scannerMarker);
        }

        this._scannerMarker.time = time;
    }

    hideScanner()
    {
        if (this._scannerMarker)
            this._scannerMarker.time = -1;
    }

    updateLayoutIfNeeded(layoutReason)
    {
        // If a layout is pending we can let the base class handle it and return, since that will update
        // markers and the selection at the same time.
        if (this.layoutPending) {
            super.updateLayoutIfNeeded(layoutReason);
            return;
        }

        let visibleWidth = this._recalculate();
        if (visibleWidth <= 0)
            return;

        if (this._scheduledMarkerLayoutUpdateIdentifier)
            this._updateMarkers(visibleWidth, this.duration);

        if (this._scheduledSelectionLayoutUpdateIdentifier)
            this._updateSelection(visibleWidth, this.duration);
    }

    needsLayout(layoutReason)
    {
        if (this.layoutPending)
            return;

        if (this._scheduledMarkerLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledMarkerLayoutUpdateIdentifier);
            this._scheduledMarkerLayoutUpdateIdentifier = undefined;
        }

        if (this._scheduledSelectionLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledSelectionLayoutUpdateIdentifier);
            this._scheduledSelectionLayoutUpdateIdentifier = undefined;
        }

        super.needsLayout(layoutReason);
    }

    // Protected

    layout()
    {
        let visibleWidth = this._recalculate();
        if (visibleWidth <= 0)
            return;

        let duration = this.duration;
        let pixelsPerSecond = visibleWidth / duration;

        // Calculate a divider count based on the maximum allowed divider density.
        let dividerCount = Math.round(visibleWidth / WI.TimelineRuler.MinimumDividerSpacing);
        let sliceTime;
        if (this._endTimePinned || !this._currentSliceTime) {
            // Calculate the slice time based on the rough divider count and the time span.
            sliceTime = duration / dividerCount;

            // Snap the slice time to a nearest number (e.g. 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, etc.)
            sliceTime = Math.pow(10, Math.ceil(Math.log(sliceTime) / Math.LN10));
            if (sliceTime * pixelsPerSecond >= 5 * WI.TimelineRuler.MinimumDividerSpacing)
                sliceTime = sliceTime / 5;
            if (sliceTime * pixelsPerSecond >= 2 * WI.TimelineRuler.MinimumDividerSpacing)
                sliceTime = sliceTime / 2;

            this._currentSliceTime = sliceTime;
        } else {
            // Reuse the last slice time since the time duration does not scale to fit when the end time isn't pinned.
            sliceTime = this._currentSliceTime;
        }

        // Calculate the divider count now based on the final slice time.
        dividerCount = Math.floor(visibleWidth * this.secondsPerPixel / sliceTime);

        let firstDividerTime = (Math.ceil((this._startTime - this._zeroTime) / sliceTime) * sliceTime) + this._zeroTime;
        let lastDividerTime = firstDividerTime + sliceTime * dividerCount;

        // Make an extra divider in case the last one is partially visible.
        if (!this._endTimePinned)
            ++dividerCount;

        let dividerData = {
            count: dividerCount,
            firstTime: firstDividerTime,
            lastTime: lastDividerTime,
        };

        if (Object.shallowEqual(dividerData, this._currentDividers)) {
            this._updateMarkers(visibleWidth, duration);
            this._updateSelection(visibleWidth, duration);
            return;
        }

        this._currentDividers = dividerData;

        let markerDividers = this._markersElement.querySelectorAll("." + WI.TimelineRuler.DividerElementStyleClassName);
        let dividerElement = this._headerElement.firstChild;

        for (var i = 0; i <= dividerCount; ++i) {
            if (!dividerElement) {
                dividerElement = document.createElement("div");
                dividerElement.className = WI.TimelineRuler.DividerElementStyleClassName;
                this._headerElement.appendChild(dividerElement);

                let labelElement = document.createElement("div");
                labelElement.className = WI.TimelineRuler.DividerLabelElementStyleClassName;
                dividerElement.appendChild(labelElement);
            }

            let markerDividerElement = markerDividers[i];
            if (!markerDividerElement) {
                markerDividerElement = document.createElement("div");
                markerDividerElement.className = WI.TimelineRuler.DividerElementStyleClassName;
                this._markersElement.appendChild(markerDividerElement);
            }

            let dividerTime = firstDividerTime + (sliceTime * i);
            let newPosition = (dividerTime - this._startTime) / duration;

            if (!this._allowsClippedLabels) {
                // Don't allow dividers under 0% where they will be completely hidden.
                if (newPosition < 0)
                    continue;

                // When over 100% it is time to stop making/updating dividers.
                if (newPosition > 1)
                    break;

                // Don't allow the left-most divider spacing to be so tight it clips.
                if ((newPosition * visibleWidth) < WI.TimelineRuler.MinimumLeftDividerSpacing)
                    continue;
            }

            let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
            this._updatePositionOfElement(dividerElement, newPosition, visibleWidth, property);
            this._updatePositionOfElement(markerDividerElement, newPosition, visibleWidth, property);

            console.assert(dividerElement.firstChild.classList.contains(WI.TimelineRuler.DividerLabelElementStyleClassName));

            dividerElement.firstChild.textContent = isNaN(dividerTime) ? "" : this._formatDividerLabelText(dividerTime - this._zeroTime);
            dividerElement = dividerElement.nextSibling;
        }

        // Remove extra dividers.
        while (dividerElement) {
            let nextDividerElement = dividerElement.nextSibling;
            dividerElement.remove();
            dividerElement = nextDividerElement;
        }

        for (; i < markerDividers.length; ++i)
            markerDividers[i].remove();

        this._updateMarkers(visibleWidth, duration);
        this._updateSelection(visibleWidth, duration);
    }

    sizeDidChange()
    {
        this._cachedClientWidth = this.element.clientWidth;
    }

    // Private

    _needsMarkerLayout()
    {
        // If layout is scheduled, abort since markers will be updated when layout happens.
        if (this.layoutPending)
            return;

        if (this._scheduledMarkerLayoutUpdateIdentifier)
            return;

        this._scheduledMarkerLayoutUpdateIdentifier = requestAnimationFrame(() => {
            this._scheduledMarkerLayoutUpdateIdentifier = undefined;

            let visibleWidth = this._cachedClientWidth;
            if (visibleWidth <= 0)
                return;

            this._updateMarkers(visibleWidth, this.duration);
        });
    }

    _needsSelectionLayout()
    {
        if (!this._allowsTimeRangeSelection)
            return;

        // If layout is scheduled, abort since the selection will be updated when layout happens.
        if (this.layoutPending)
            return;

        if (this._scheduledSelectionLayoutUpdateIdentifier)
            return;

        this._scheduledSelectionLayoutUpdateIdentifier = requestAnimationFrame(() => {
            this._scheduledSelectionLayoutUpdateIdentifier = undefined;

            let visibleWidth = this._cachedClientWidth;
            if (visibleWidth <= 0)
                return;

            this._updateSelection(visibleWidth, this.duration);
        });
    }

    _recalculate()
    {
        let visibleWidth = this._cachedClientWidth;
        if (visibleWidth <= 0)
            return 0;

        let duration;
        if (this._endTimePinned)
            duration = this._endTime - this._startTime;
        else
            duration = visibleWidth * this._secondsPerPixel;

        this._secondsPerPixel = duration / visibleWidth;

        if (!this._endTimePinned)
            this._endTime = this._startTime + (visibleWidth * this._secondsPerPixel);

        return visibleWidth;
    }

    _updatePositionOfElement(element, newPosition, visibleWidth, property)
    {
        newPosition *= this._endTimePinned ? 100 : visibleWidth;

        let newPositionAprox = Math.round(newPosition * 100);
        let currentPositionAprox = Math.round(parseFloat(element.style[property]) * 100);
        if (currentPositionAprox !== newPositionAprox)
            element.style[property] = (newPositionAprox / 100) + (this._endTimePinned ? "%" : "px");
    }

    _updateMarkers(visibleWidth, duration)
    {
        if (this._scheduledMarkerLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledMarkerLayoutUpdateIdentifier);
            this._scheduledMarkerLayoutUpdateIdentifier = undefined;
        }

        for (let [marker, markerElement] of this._markerElementMap) {
            if (marker.time < 0) {
                markerElement.remove();
                continue;
            }

            let newPosition = (marker.time - this._startTime) / duration;
            let property = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
            this._updatePositionOfElement(markerElement, newPosition, visibleWidth, property);

            if (!markerElement.parentNode)
                this._markersElement.appendChild(markerElement);
        }
    }

    _updateSelection(visibleWidth, duration)
    {
        if (this._scheduledSelectionLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledSelectionLayoutUpdateIdentifier);
            this._scheduledSelectionLayoutUpdateIdentifier = undefined;
        }

        this.element.classList.toggle("allows-time-range-selection", this._allowsTimeRangeSelection);

        if (!this._allowsTimeRangeSelection)
            return;

        this.element.classList.toggle("selection-hidden", this.entireRangeSelected);

        if (this.entireRangeSelected) {
            this._dispatchTimeRangeSelectionChangedEvent();
            return;
        }

        let startTimeClamped = this._selectionStartTime < this._startTime || this._selectionStartTime > this._endTime;
        let endTimeClamped = this._selectionEndTime < this._startTime || this._selectionEndTime > this._endTime;

        this.element.classList.toggle("both-handles-clamped", startTimeClamped && endTimeClamped);

        let formattedStartTimeText = this._formatDividerLabelText(this._selectionStartTime - this._zeroTime);
        let formattedEndTimeText = this._formatDividerLabelText(this._selectionEndTime - this._zeroTime);

        let startProperty = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "right" : "left";
        let newStartPosition = Number.constrain((this._selectionStartTime - this._startTime) / duration, 0, 1);
        this._updatePositionOfElement(this._leftShadedAreaElement, newStartPosition, visibleWidth, "width");
        this._updatePositionOfElement(this._leftSelectionHandleElement, newStartPosition, visibleWidth, startProperty);
        this._updatePositionOfElement(this._selectionDragElement, newStartPosition, visibleWidth, startProperty);

        this._leftSelectionHandleElement.classList.toggle("clamped", startTimeClamped);
        this._leftSelectionHandleElement.classList.toggle("hidden", startTimeClamped && endTimeClamped && this._selectionStartTime < this._startTime);
        this._leftSelectionHandleElement.title = formattedStartTimeText;

        let endProperty = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL ? "left" : "right";
        let newEndPosition = 1 - Number.constrain((this._selectionEndTime - this._startTime) / duration, 0, 1);
        this._updatePositionOfElement(this._rightShadedAreaElement, newEndPosition, visibleWidth, "width");
        this._updatePositionOfElement(this._rightSelectionHandleElement, newEndPosition, visibleWidth, endProperty);
        this._updatePositionOfElement(this._selectionDragElement, newEndPosition, visibleWidth, endProperty);

        this._rightSelectionHandleElement.classList.toggle("clamped", endTimeClamped);
        this._rightSelectionHandleElement.classList.toggle("hidden", startTimeClamped && endTimeClamped && this._selectionEndTime > this._endTime);
        this._rightSelectionHandleElement.title = formattedEndTimeText;

        if (!this._selectionDragElement.parentNode) {
            this.element.appendChild(this._selectionDragElement);
            this.element.appendChild(this._leftShadedAreaElement);
            this.element.appendChild(this._leftSelectionHandleElement);
            this.element.appendChild(this._rightShadedAreaElement);
            this.element.appendChild(this._rightSelectionHandleElement);
        }

        this._dispatchTimeRangeSelectionChangedEvent();
    }

    _formatDividerLabelText(value)
    {
        if (this._formatLabelCallback)
            return this._formatLabelCallback(value);

        return Number.secondsToString(value, true);
    }

    _snapValue(value)
    {
        if (!value || !this.snapInterval)
            return value;

        return Math.round(value / this.snapInterval) * this.snapInterval;
    }

    _dispatchTimeRangeSelectionChangedEvent()
    {
        if (!this._timeRangeSelectionChanged)
            return;

        this._timeRangeSelectionChanged = false;

        this.dispatchEventToListeners(WI.TimelineRuler.Event.TimeRangeSelectionChanged);
    }

    _timelineMarkerTimeChanged()
    {
        this._needsMarkerLayout();
    }

    _shouldIgnoreMicroMovement(event)
    {
        if (this._mousePassedMicroMovementTest)
            return false;

        let pixels = Math.abs(event.pageX - this._mouseStartX);
        if (pixels <= 4)
            return true;

        this._mousePassedMicroMovementTest = true;
        return false;
    }

    _handleClick(event)
    {
        if (!this._enabled)
            return;

        if (this._mouseMoved)
            return;

        for (let newTarget of document.elementsFromPoint(event.pageX, event.pageY)) {
            if (!newTarget || typeof newTarget.click !== "function")
                continue;
            if (this.element.contains(newTarget))
                continue;

            // Clone the event to dispatch it on the new element.
            let newEvent = new event.constructor(event.type, event);
            newTarget.dispatchEvent(newEvent);
            if (newEvent.__timelineRecordClickEventHandled)
                event.stop();
            return;
        }
    }

    _handleDoubleClick(event)
    {
        if (this.entireRangeSelected)
            return;

        this.selectEntireRange();
    }

    _handleMouseDown(event)
    {
        // Only handle left mouse clicks.
        if (event.button !== 0 || event.ctrlKey)
            return;

        this._selectionIsMove = event.target === this._selectionDragElement;
        this._rulerBoundingClientRect = this.element.getBoundingClientRect();

        if (this._selectionIsMove) {
            this._lastMousePosition = event.pageX;
            var selectionDragElementRect = this._selectionDragElement.getBoundingClientRect();
            this._moveSelectionMaximumLeftOffset = this._rulerBoundingClientRect.left + (event.pageX - selectionDragElementRect.left);
            this._moveSelectionMaximumRightOffset = this._rulerBoundingClientRect.right - (selectionDragElementRect.right - event.pageX);
        } else {
            if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
                this._mouseDownPosition = this._rulerBoundingClientRect.right - event.pageX;
            else
                this._mouseDownPosition = event.pageX - this._rulerBoundingClientRect.left;
        }

        this._mouseMoved = false;

        this._mousePassedMicroMovementTest = false;
        this._mouseStartX = event.pageX;

        this._mouseMoveEventListener = this._handleMouseMove.bind(this);
        this._mouseUpEventListener = this._handleMouseUp.bind(this);

        // Register these listeners on the document so we can track the mouse if it leaves the ruler.
        document.addEventListener("mousemove", this._mouseMoveEventListener);
        document.addEventListener("mouseup", this._mouseUpEventListener);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleMouseMove(event)
    {
        console.assert(event.button === 0);

        if (this._shouldIgnoreMicroMovement(event))
            return;

        this._mouseMoved = true;

        let isRTL = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL;

        let currentMousePosition;
        if (this._selectionIsMove) {
            currentMousePosition = Math.max(this._moveSelectionMaximumLeftOffset, Math.min(this._moveSelectionMaximumRightOffset, event.pageX));

            let positionDelta = 0;
            if (isRTL)
                positionDelta = this._lastMousePosition - currentMousePosition;
            else
                positionDelta = currentMousePosition - this._lastMousePosition;

            let offsetTime = positionDelta * this.secondsPerPixel;
            let selectionDuration = this.selectionEndTime - this.selectionStartTime;
            let oldSelectionStartTime = this.selectionStartTime;

            this.selectionStartTime = Math.max(this.startTime, Math.min(this.selectionStartTime + offsetTime, this.endTime - selectionDuration));
            this.selectionEndTime = this.selectionStartTime + selectionDuration;

            if (this.snapInterval) {
                // When snapping we need to check the mouse position delta relative to the last snap, rather than the
                // last mouse move. If a snap occurs we adjust for the amount the cursor drifted, so that the mouse
                // position relative to the selection remains constant.
                let snapOffset = this.selectionStartTime - oldSelectionStartTime;
                if (!snapOffset)
                    return;

                let positionDrift = (offsetTime - snapOffset * this.snapInterval) / this.secondsPerPixel;
                currentMousePosition -= positionDrift;
            }

            this._lastMousePosition = currentMousePosition;
        } else {
            if (isRTL)
                currentMousePosition = this._rulerBoundingClientRect.right - event.pageX;
            else
                currentMousePosition = event.pageX - this._rulerBoundingClientRect.left;

            this.selectionStartTime = Math.max(this.startTime, this.startTime + (Math.min(currentMousePosition, this._mouseDownPosition) * this.secondsPerPixel));
            this.selectionEndTime = Math.min(this.startTime + (Math.max(currentMousePosition, this._mouseDownPosition) * this.secondsPerPixel), this.endTime);

            // Turn on col-resize cursor style once dragging begins, rather than on the initial mouse down.
            this.element.classList.add(WI.TimelineRuler.ResizingSelectionStyleClassName);
        }

        this._updateSelection(this._cachedClientWidth, this.duration);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleMouseUp(event)
    {
        console.assert(event.button === 0);

        if (!this._selectionIsMove) {
            this.element.classList.remove(WI.TimelineRuler.ResizingSelectionStyleClassName);

            if (this.selectionEndTime - this.selectionStartTime < this.minimumSelectionDuration) {
                // The section is smaller than allowed, grow in the direction of the drag to meet the minumum.
                let currentMousePosition = 0;
                if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
                    currentMousePosition = this._rulerBoundingClientRect.right - event.pageX;
                else
                    currentMousePosition = event.pageX - this._rulerBoundingClientRect.left;

                if (currentMousePosition > this._mouseDownPosition) {
                    this.selectionEndTime = Math.min(this.selectionStartTime + this.minimumSelectionDuration, this.endTime);
                    this.selectionStartTime = this.selectionEndTime - this.minimumSelectionDuration;
                } else {
                    this.selectionStartTime = Math.max(this.startTime, this.selectionEndTime - this.minimumSelectionDuration);
                    this.selectionEndTime = this.selectionStartTime + this.minimumSelectionDuration;
                }
            }
        }

        this._dispatchTimeRangeSelectionChangedEvent();

        document.removeEventListener("mousemove", this._mouseMoveEventListener);
        document.removeEventListener("mouseup", this._mouseUpEventListener);

        delete this._mouseMoveEventListener;
        delete this._mouseUpEventListener;
        delete this._mouseDownPosition;
        delete this._lastMousePosition;
        delete this._selectionIsMove;
        delete this._rulerBoundingClientRect;
        delete this._moveSelectionMaximumLeftOffset;
        delete this._moveSelectionMaximumRightOffset;

        event.preventDefault();
        event.stopPropagation();
    }

    _handleSelectionHandleMouseDown(event)
    {
        // Only handle left mouse clicks.
        if (event.button !== 0 || event.ctrlKey)
            return;

        this._dragHandleIsStartTime = event.target === this._leftSelectionHandleElement;

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            this._mouseDownPosition = this.element.totalOffsetRight - event.pageX;
        else
            this._mouseDownPosition = event.pageX - this.element.totalOffsetLeft;

        this._selectionHandleMouseMoveEventListener = this._handleSelectionHandleMouseMove.bind(this);
        this._selectionHandleMouseUpEventListener = this._handleSelectionHandleMouseUp.bind(this);

        // Register these listeners on the document so we can track the mouse if it leaves the ruler.
        document.addEventListener("mousemove", this._selectionHandleMouseMoveEventListener);
        document.addEventListener("mouseup", this._selectionHandleMouseUpEventListener);

        this.element.classList.add(WI.TimelineRuler.ResizingSelectionStyleClassName);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleSelectionHandleMouseMove(event)
    {
        console.assert(event.button === 0);

        let currentMousePosition = 0;
        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL)
            currentMousePosition = this.element.totalOffsetRight - event.pageX;
        else
            currentMousePosition = event.pageX - this.element.totalOffsetLeft;

        let currentTime = this.startTime + (currentMousePosition * this.secondsPerPixel);
        if (this.snapInterval)
            currentTime = this._snapValue(currentTime);

        if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            // Resize the selection on both sides when the Option keys is held down.
            if (this._dragHandleIsStartTime) {
                let timeDifference = currentTime - this.selectionStartTime;
                this.selectionStartTime = Math.max(this.startTime, Math.min(currentTime, this.selectionEndTime - this.minimumSelectionDuration));
                this.selectionEndTime = Math.min(Math.max(this.selectionStartTime + this.minimumSelectionDuration, this.selectionEndTime - timeDifference), this.endTime);
            } else {
                let timeDifference = currentTime - this.selectionEndTime;
                this.selectionEndTime = Math.min(Math.max(this.selectionStartTime + this.minimumSelectionDuration, currentTime), this.endTime);
                this.selectionStartTime = Math.max(this.startTime, Math.min(this.selectionStartTime - timeDifference, this.selectionEndTime - this.minimumSelectionDuration));
            }
        } else {
            // Resize the selection on side being dragged.
            if (this._dragHandleIsStartTime)
                this.selectionStartTime = Math.max(this.startTime, Math.min(currentTime, this.selectionEndTime - this.minimumSelectionDuration));
            else
                this.selectionEndTime = Math.min(Math.max(this.selectionStartTime + this.minimumSelectionDuration, currentTime), this.endTime);
        }

        this._updateSelection(this._cachedClientWidth, this.duration);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleSelectionHandleMouseUp(event)
    {
        console.assert(event.button === 0);

        this.element.classList.remove(WI.TimelineRuler.ResizingSelectionStyleClassName);

        document.removeEventListener("mousemove", this._selectionHandleMouseMoveEventListener);
        document.removeEventListener("mouseup", this._selectionHandleMouseUpEventListener);

        delete this._selectionHandleMouseMoveEventListener;
        delete this._selectionHandleMouseUpEventListener;
        delete this._dragHandleIsStartTime;
        delete this._mouseDownPosition;

        event.preventDefault();
        event.stopPropagation();
    }
};

WI.TimelineRuler.MinimumLeftDividerSpacing = 48;
WI.TimelineRuler.MinimumDividerSpacing = 64;

WI.TimelineRuler.ResizingSelectionStyleClassName = "resizing-selection";
WI.TimelineRuler.DividerElementStyleClassName = "divider";
WI.TimelineRuler.DividerLabelElementStyleClassName = "label";

WI.TimelineRuler.Event = {
    TimeRangeSelectionChanged: "time-ruler-time-range-selection-changed"
};
