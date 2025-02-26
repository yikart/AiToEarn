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

WI.DOMEventsBreakdownView = class DOMEventsBreakdownView extends WI.View
{
    constructor(domNodeOrEvents, {includeGraph} = {})
    {
        console.assert(domNodeOrEvents instanceof WI.DOMNode || Array.isArray(domNodeOrEvents));

        super();

        if (domNodeOrEvents instanceof WI.DOMNode) {
            this._domNode = domNodeOrEvents;
            this._domNode.addEventListener(WI.DOMNode.Event.DidFireEvent, this._handleDOMNodeDidFireEvent, this);
            if (this._domNode.canEnterPowerEfficientPlaybackState())
                this._domNode.addEventListener(WI.DOMNode.Event.PowerEfficientPlaybackStateChanged, this._handleDOMNodePowerEfficientPlaybackStateChanged, this);

            this._domEvents = null;
        } else {
            this._domNode = null;
            this._domEvents = domNodeOrEvents;
        }

        this._includeGraph = includeGraph || false;

        this._tableBodyElement = null;

        this.element.classList.add("dom-events-breakdown");
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let tableElement = this.element.appendChild(document.createElement("table"));

        let headElement = tableElement.appendChild(document.createElement("thead"));

        let headRowElement = headElement.appendChild(document.createElement("tr"));

        let eventHeadCell = headRowElement.appendChild(document.createElement("th"));
        eventHeadCell.textContent = WI.UIString("Event");

        if (this._includeGraph)
            headRowElement.appendChild(document.createElement("th"));

        let timeHeadCell = headRowElement.appendChild(document.createElement("th"));
        timeHeadCell.classList.add("time");
        timeHeadCell.textContent = WI.UIString("Time");

        let originatorHeadCell = headRowElement.appendChild(document.createElement("th"));
        originatorHeadCell.classList.add("originator");
        originatorHeadCell.textContent = WI.UIString("Originator");

        this._tableBodyElement = tableElement.appendChild(document.createElement("tbody"));
    }

    layout()
    {
        if (this.layoutReason !== WI.View.LayoutReason.Dirty)
            return;

        this._tableBodyElement.removeChildren();

        console.assert(this._domEvents || (this._domNode && this._domNode.domEvents));
        let domEvents = this._domEvents || this._domNode.domEvents;
        let startTimestamp = domEvents[0].timestamp;
        let endTimestamp = domEvents.lastValue.timestamp;
        let totalTime = endTimestamp - startTimestamp;
        let styleAttribute = WI.resolvedLayoutDirection() === WI.LayoutDirection.LTR ? "left" : "right";

        function percentOfTotalTime(time) {
            return time / totalTime * 100;
        }

        let fullscreenRanges = [];
        let fullscreenDOMEvents = WI.DOMNode.getFullscreenDOMEvents(domEvents);
        for (let fullscreenDOMEvent of fullscreenDOMEvents) {
            let {enabled} = fullscreenDOMEvent.data;
            if (enabled || !fullscreenRanges.length) {
                fullscreenRanges.push({
                    startTimestamp: enabled ? fullscreenDOMEvent.timestamp : startTimestamp,
                });
            }
            fullscreenRanges.lastValue.endTimestamp = (enabled && fullscreenDOMEvent === fullscreenDOMEvents.lastValue) ? endTimestamp : fullscreenDOMEvent.timestamp;
            if (fullscreenDOMEvent.originator)
                fullscreenRanges.lastValue.originator = fullscreenDOMEvent.originator;
        }

        let powerEfficientPlaybackRanges = this._domNode ? this._domNode.powerEfficientPlaybackRanges : [];

        for (let domEvent of domEvents) {
            let rowElement = this._tableBodyElement.appendChild(document.createElement("tr"));

            let nameCell = rowElement.appendChild(document.createElement("td"));
            nameCell.classList.add("name");
            nameCell.textContent = domEvent.eventName;

            if (this._includeGraph) {
                let graphCell = rowElement.appendChild(document.createElement("td"));
                graphCell.classList.add("graph");

                let fullscreenRange = fullscreenRanges.find((range) => domEvent.timestamp >= range.startTimestamp && domEvent.timestamp <= range.endTimestamp);
                if (fullscreenRange) {
                    let fullscreenArea = graphCell.appendChild(document.createElement("div"));
                    fullscreenArea.classList.add("area", "fullscreen");
                    fullscreenArea.style.setProperty(styleAttribute, percentOfTotalTime(fullscreenRange.startTimestamp - startTimestamp) + "%");
                    fullscreenArea.style.setProperty("width", percentOfTotalTime(fullscreenRange.endTimestamp - fullscreenRange.startTimestamp) + "%");

                    if (fullscreenRange.originator)
                        fullscreenArea.title = WI.UIString("Full-Screen from \u201C%s\u201D").format(fullscreenRange.originator.displayName);
                    else
                        fullscreenArea.title = WI.UIString("Full-Screen");
                }

                let powerEfficientPlaybackRange = powerEfficientPlaybackRanges.find((range) => domEvent.timestamp >= range.startTimestamp && domEvent.timestamp <= range.endTimestamp);
                if (powerEfficientPlaybackRange) {
                    let powerEfficientPlaybackArea = graphCell.appendChild(document.createElement("div"));
                    powerEfficientPlaybackArea.classList.add("area", "power-efficient-playback");
                    powerEfficientPlaybackArea.title = WI.UIString("Power Efficient Playback");
                    powerEfficientPlaybackArea.style.setProperty(styleAttribute, percentOfTotalTime(powerEfficientPlaybackRange.startTimestamp - startTimestamp) + "%");
                    powerEfficientPlaybackArea.style.setProperty("width", percentOfTotalTime(powerEfficientPlaybackRange.endTimestamp - powerEfficientPlaybackRange.startTimestamp) + "%");
                }

                let graphImage = graphCell.appendChild(document.createElement("img"));
                graphImage.style.setProperty(styleAttribute, `calc(${percentOfTotalTime(domEvent.timestamp - startTimestamp)}% - (var(--img-size) / 2))`);
                if (WI.DOMNode.isPlayEvent(domEvent.eventName))
                    graphImage.src = "Images/EventPlay.svg";
                else if (WI.DOMNode.isPauseEvent(domEvent.eventName))
                    graphImage.src = "Images/EventPause.svg";
                else if (WI.DOMNode.isStopEvent(domEvent.eventName))
                    graphImage.src = "Images/EventStop.svg";
                else
                    graphImage.src = "Images/EventProcessing.svg";
            }

            let timeCell = rowElement.appendChild(document.createElement("td"));
            timeCell.classList.add("time");

            const higherResolution = true;
            timeCell.textContent = Number.secondsToString(domEvent.timestamp, higherResolution);

            let originatorCell = rowElement.appendChild(document.createElement("td"));
            originatorCell.classList.add("originator");
            if (domEvent.originator) {
                originatorCell.appendChild(WI.linkifyNodeReference(domEvent.originator));

                rowElement.classList.add("inherited");
                this.element.classList.add("has-inherited");
            }
        }
    }

    // Private

    _handleDOMNodeDidFireEvent(event)
    {
        this.needsLayout();
    }

    _handleDOMNodePowerEfficientPlaybackStateChanged(event)
    {
        this.needsLayout();
    }
};
