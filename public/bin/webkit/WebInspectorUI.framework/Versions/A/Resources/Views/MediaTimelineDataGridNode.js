/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.MediaTimelineDataGridNode = class MediaTimelineDataGridNode extends WI.TimelineDataGridNode
{
    constructor(record, options = {})
    {
        console.assert(record instanceof WI.MediaTimelineRecord);

        super([record], options);
    }

    // Public

    get data()
    {
        if (this._cachedData)
            return this._cachedData;

        this._cachedData = super.data;
        this._cachedData.name = this.record.displayName;
        this._cachedData.element = this.record.domNode;
        this._cachedData.source = this.record.domNode; // Timeline Overview
        return this._cachedData;
    }

    createCellContent(columnIdentifier, cell)
    {
        let value = this.data[columnIdentifier];

        switch (columnIdentifier) {
        case "name":
            cell.classList.add(...this.iconClassNames());
            return this._createNameCellDocumentFragment();

        case "element":
        case "source": // Timeline Overview
            if (!value)
                return emDash;
            if (!(value instanceof WI.DOMNode)) {
                cell.classList.add(WI.DOMTreeElementPathComponent.DOMNodeIconStyleClassName);
                return value.displayName;
            }
            break;
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    // TimelineRecordBar delegate

    timelineRecordBarCustomChildren(timelineRecordBar)
    {
        let children = [];

        let record = this.record;
        let timestamps = record.timestamps;

        switch (record.eventType) {
        case WI.MediaTimelineRecord.EventType.CSSAnimation:
        case WI.MediaTimelineRecord.EventType.CSSTransition: {
            let readyStartTime = NaN;
            function addReadySegment(startTime, endTime) {
                children.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "css-animation-ready"],
                    title: WI.UIString("Ready", "Tooltip for a time range bar that represents when a CSS animation/transition exists but has not started processing"),
                });
                readyStartTime = NaN;
            }

            let delayStartTime = NaN;
            function addDelaySegment(startTime, endTime) {
                children.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "css-animation-delay"],
                    title: WI.UIString("Delay", "Tooltip for a time range bar that represents when a CSS animation/transition is delayed"),
                });
                delayStartTime = NaN;
            }

            let activeStartTime = NaN;
            function addActiveSegment(startTime, endTime) {
                children.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "css-animation-active"],
                    title: WI.UIString("Active", "Tooltip for a time range bar that represents when a CSS animation/transition is running"),
                });
                activeStartTime = NaN;
            }

            for (let item of timestamps) {
                switch (item.type) {
                case WI.MediaTimelineRecord.TimestampType.CSSAnimationReady:
                    if (isNaN(readyStartTime))
                        readyStartTime = item.timestamp;
                    break;
                case WI.MediaTimelineRecord.TimestampType.CSSAnimationDelay:
                    if (isNaN(delayStartTime))
                        delayStartTime = item.timestamp;
                    if (!isNaN(readyStartTime))
                        addReadySegment(readyStartTime, item.timestamp);
                    break;
                case WI.MediaTimelineRecord.TimestampType.CSSAnimationActive:
                    if (isNaN(activeStartTime))
                        activeStartTime = item.timestamp;
                    if (!isNaN(readyStartTime))
                        addReadySegment(readyStartTime, item.timestamp);
                    if (!isNaN(delayStartTime))
                        addDelaySegment(delayStartTime, item.timestamp);
                    break;
                case WI.MediaTimelineRecord.TimestampType.CSSAnimationCancel:
                case WI.MediaTimelineRecord.TimestampType.CSSAnimationDone:
                    if (!isNaN(readyStartTime))
                        addReadySegment(readyStartTime, item.timestamp);
                    if (!isNaN(delayStartTime))
                        addDelaySegment(delayStartTime, item.timestamp);
                    if (!isNaN(activeStartTime))
                        addActiveSegment(activeStartTime, item.timestamp);
                    break;
                }
            }

            if (!isNaN(readyStartTime))
                addReadySegment(readyStartTime, NaN);
            if (!isNaN(delayStartTime))
                addDelaySegment(delayStartTime, NaN);
            if (!isNaN(activeStartTime))
                addActiveSegment(activeStartTime, NaN);

            break;
        }

        case WI.MediaTimelineRecord.EventType.MediaElement: {
            let fullScreenSegments = [];
            let powerEfficientPlaybackSegments = [];
            let activeSegments = [];

            let fullScreenStartTime = NaN;
            let fullScreenOriginator = null;
            function addFullScreenSegment(startTime, endTime) {
                fullScreenSegments.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "media-element-full-screen"],
                    title: fullScreenOriginator ? WI.UIString("Full-Screen from \u201C%s\u201D").format(fullScreenOriginator.displayName) : WI.UIString("Full-Screen"),
                });
                fullScreenStartTime = NaN;
                fullScreenOriginator = null;
            }

            let powerEfficientPlaybackStartTime = NaN;
            function addPowerEfficientPlaybackSegment(startTime, endTime) {
                powerEfficientPlaybackSegments.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "media-element-power-efficient-playback"],
                    title: WI.UIString("Power Efficient Playback"),
                });
                powerEfficientPlaybackStartTime = NaN;
            }

            let pausedStartTime = NaN;
            function addPausedSegment(startTime, endTime) {
                activeSegments.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "media-element-paused"],
                    title: WI.UIString("Paused", "Tooltip for a time range bar that represents when the playback of a audio/video element is paused"),
                });
                pausedStartTime = NaN;
            }

            let playingStartTime = NaN;
            function addPlayingSegment(startTime, endTime) {
                activeSegments.push({
                    startTime,
                    endTime,
                    classNames: ["segment", "media-element-playing"],
                    title: WI.UIString("Playing", "Tooltip for a time range bar that represents when the playback of a audio/video element is running"),
                });
                playingStartTime = NaN;
            }

            for (let item of timestamps) {
                if (item.type === WI.MediaTimelineRecord.TimestampType.MediaElementDOMEvent) {
                    if (WI.DOMNode.isPlayEvent(item.eventName)) {
                        if (isNaN(playingStartTime))
                            playingStartTime = item.timestamp;
                        if (!isNaN(pausedStartTime))
                            addPausedSegment(pausedStartTime, item.timestamp);
                    } else if (WI.DOMNode.isPauseEvent(item.eventName)) {
                        if (isNaN(pausedStartTime))
                            pausedStartTime = item.timestamp;
                        if (!isNaN(playingStartTime))
                            addPlayingSegment(playingStartTime, item.timestamp);
                    } else if (WI.DOMNode.isStopEvent(item.eventName)) {
                        if (!isNaN(pausedStartTime))
                            addPausedSegment(pausedStartTime, item.timestamp);
                        if (!isNaN(playingStartTime))
                            addPlayingSegment(playingStartTime, item.timestamp);
                    } else if (item.eventName === "webkitfullscreenchange") {
                        if (!fullScreenOriginator && item.originator)
                            fullScreenOriginator = item.originator;

                        if (isNaN(fullScreenStartTime)) {
                            if (item.data && item.data.enabled)
                                fullScreenStartTime = item.timestamp;
                            else
                                addFullScreenSegment(this.graphDataSource ? this.graphDataSource.startTime : record.startTime, item.timestamp);
                        } else if (!item.data || !item.data.enabled)
                            addFullScreenSegment(fullScreenStartTime, item.timestamp);
                    }
                } else if (item.type === WI.MediaTimelineRecord.TimestampType.MediaElementPowerEfficientPlaybackStateChange) {
                    if (isNaN(powerEfficientPlaybackStartTime)) {
                        if (item.isPowerEfficient)
                            powerEfficientPlaybackStartTime = item.timestamp;
                        else
                            addPowerEfficientPlaybackSegment(this.graphDataSource ? this.graphDataSource.startTime : record.startTime, item.timestamp);
                    } else if (!item.isPowerEfficient)
                        addPowerEfficientPlaybackSegment(powerEfficientPlaybackStartTime, item.timestamp);
                }
            }

            if (!isNaN(fullScreenStartTime))
                addFullScreenSegment(fullScreenStartTime, NaN);
            if (!isNaN(powerEfficientPlaybackStartTime))
                addPowerEfficientPlaybackSegment(powerEfficientPlaybackStartTime, NaN);
            if (!isNaN(pausedStartTime))
                addPausedSegment(pausedStartTime, NaN);
            if (!isNaN(playingStartTime))
                addPlayingSegment(playingStartTime, NaN);

            children.pushAll(fullScreenSegments);
            children.pushAll(powerEfficientPlaybackSegments);
            children.pushAll(activeSegments);
            break;
        }
        }

        timestamps.forEach((item, i) => {
            let image = {
                startTime: item.timestamp,
                classNames: [],
            };

            switch (item.type) {
            case WI.MediaTimelineRecord.TimestampType.CSSAnimationReady:
            case WI.MediaTimelineRecord.TimestampType.CSSAnimationDelay:
            case WI.MediaTimelineRecord.TimestampType.CSSAnimationDone:
            case WI.MediaTimelineRecord.TimestampType.MediaElementPowerEfficientPlaybackStateChange:
                // These timestamps are handled by the range segments above.
                return;

            case WI.MediaTimelineRecord.TimestampType.CSSAnimationActive:
                // Don't create a marker segment for the first active timestamp, as that will be
                // handled by an active range segment above.
                if (!i || timestamps[i - 1].type !== WI.MediaTimelineRecord.TimestampType.CSSAnimationActive)
                    return;

                image.image = "Images/EventIteration.svg";
                image.title = WI.UIString("Iteration", "Tooltip for a timestamp marker that represents when a CSS animation/transition iterates");
                break;

            case WI.MediaTimelineRecord.TimestampType.CSSAnimationCancel:
                image.image = "Images/EventCancel.svg";
                image.title = WI.UIString("Canceled", "Tooltip for a timestamp marker that represents when a CSS animation/transition is canceled");
                break;

            case WI.MediaTimelineRecord.TimestampType.MediaElementDOMEvent:
                // Don't create a marker segment full-screen timestamps, as that will be handled by a
                // range segment above.
                if (item.eventName === "webkitfullscreenchange")
                    return;

                image.title = WI.UIString("DOM Event \u201C%s\u201D").format(item.eventName);
                if (WI.DOMNode.isPlayEvent(item.eventName))
                    image.image = "Images/EventPlay.svg";
                else if (WI.DOMNode.isPauseEvent(item.eventName))
                    image.image = "Images/EventPause.svg";
                else if (WI.DOMNode.isStopEvent(item.eventName))
                    image.image = "Images/EventStop.svg";
                else
                    image.image = "Images/EventProcessing.svg";
                break;
            }

            children.push(image);
        });

        return children;
    }

    // Protected

    filterableDataForColumn(columnIdentifier)
    {
        switch (columnIdentifier) {
        case "name":
            return [this.record.displayName, this.record.subtitle];

        case "element":
        case "source": // Timeline Overview
            if (this.record.domNode)
                return this.record.domNode.displayName;
            break;
        }

        return super.filterableDataForColumn(columnIdentifier);
    }

    // Private

    _createNameCellDocumentFragment()
    {
        let fragment = document.createDocumentFragment();
        fragment.append(this.record.displayName);

        if (this.record.subtitle) {
            let subtitleElement = fragment.appendChild(document.createElement("span"));
            subtitleElement.className = "subtitle";
            subtitleElement.textContent = this.record.subtitle;
        }

        return fragment;
    }
};
