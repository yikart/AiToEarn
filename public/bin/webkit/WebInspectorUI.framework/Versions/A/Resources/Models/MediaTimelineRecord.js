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

WI.MediaTimelineRecord = class MediaTimelineRecord extends WI.TimelineRecord
{
    constructor(eventType, domNodeOrInfo, {trackingAnimationId, animationName, transitionProperty} = {})
    {
        console.assert(Object.values(MediaTimelineRecord.EventType).includes(eventType));
        console.assert(domNodeOrInfo instanceof WI.DOMNode || (!isEmptyObject(domNodeOrInfo) && domNodeOrInfo.displayName && domNodeOrInfo.cssPath));

        super(WI.TimelineRecord.Type.Media);

        this._eventType = eventType;
        this._domNode = domNodeOrInfo;
        this._domNodeDisplayName = domNodeOrInfo?.displayName;
        this._domNodeCSSPath = domNodeOrInfo instanceof WI.DOMNode ? WI.cssPath(domNodeOrInfo, {full: true}) : domNodeOrInfo?.cssPath;

        // Web Animation
        console.assert(trackingAnimationId === undefined || typeof trackingAnimationId === "string");
        this._trackingAnimationId = trackingAnimationId || null;

        // CSS Web Animation
        console.assert(animationName === undefined || typeof animationName === "string");
        console.assert(transitionProperty === undefined || typeof transitionProperty === "string");
        this._animationName = animationName || null;
        this._transitionProperty = transitionProperty || null;

        this._timestamps = [];
        this._activeStartTime = NaN;
    }

    // Import / Export

    static async fromJSON(json)
    {
        let {eventType, domNodeDisplayName, domNodeCSSPath, animationName, transitionProperty, timestamps} = json;

        let documentNode = null;
        if (InspectorBackend.hasDomain("DOM"))
            documentNode = await new Promise((resolve) => WI.domManager.requestDocument(resolve));

        let domNode = null;
        if (documentNode && domNodeCSSPath) {
            try {
                let nodeId = await documentNode.querySelector(domNodeCSSPath);
                if (nodeId)
                    domNode = WI.domManager.nodeForId(nodeId);
            } catch { }
        }
        if (!domNode) {
            domNode = {
                displayName: domNodeDisplayName,
                cssPath: domNodeCSSPath,
            };
        }

        let record = new MediaTimelineRecord(eventType, domNode, {animationName, transitionProperty});

        if (Array.isArray(timestamps) && timestamps.length) {
            record._timestamps = [];
            for (let item of timestamps) {
                if (item.type === MediaTimelineRecord.TimestampType.MediaElementDOMEvent) {
                    if (documentNode && item.originatorCSSPath) {
                        try {
                            let nodeId = await documentNode.querySelector(item.originatorCSSPath);
                            if (nodeId)
                                item.originator = WI.domManager.nodeForId(nodeId);
                        } catch { }
                        if (!item.originator) {
                            item.originator = {
                                displayName: item.originatorDisplayName,
                                cssPath: item.originatorCSSPath,
                            };
                        }
                    }
                }
                record._timestamps.push(item);
            }
        }

        return record;
    }

    toJSON()
    {
        let json = {
            eventType: this._eventType,
            domNodeDisplayName: this._domNodeDisplayName,
            domNodeCSSPath: this._domNodeCSSPath,
        };

        if (this._animationName)
            json.animationName = this._animationName;

        if (this._transitionProperty)
            json.transitionProperty = this._transitionProperty;

        if (this._timestamps.length) {
            json.timestamps = this._timestamps.map((item) => {
                if (item.type === MediaTimelineRecord.TimestampType.MediaElementDOMEvent && item.originator instanceof WI.DOMNode)
                    delete item.originator;
                return item;
            });
        }

        return json;
    }

    // Public

    get eventType() { return this._eventType; }
    get domNode() { return this._domNode; }
    get trackingAnimationId() { return this._trackingAnimationId; }
    get timestamps() { return this._timestamps; }
    get activeStartTime() { return this._activeStartTime; }

    get updatesDynamically()
    {
        return true;
    }

    get usesActiveStartTime()
    {
        return true;
    }

    get displayName()
    {
        switch (this._eventType) {
        case MediaTimelineRecord.EventType.CSSAnimation:
            return this._animationName;

        case MediaTimelineRecord.EventType.CSSTransition:
            return this._transitionProperty;

        case MediaTimelineRecord.EventType.MediaElement:
            return WI.UIString("Media Element");
        }

        console.error("Unknown media record event type: ", this._eventType, this);
        return WI.UIString("Media Event");
    }

    get subtitle()
    {
        switch (this._eventType) {
        case MediaTimelineRecord.EventType.CSSAnimation:
            return WI.UIString("CSS Animation");

        case MediaTimelineRecord.EventType.CSSTransition:
            return WI.UIString("CSS Transition");
        }

        return "";
    }

    saveIdentityToCookie(cookie)
    {
        super.saveIdentityToCookie(cookie);

        cookie["media-timeline-record-event-type"] = this._eventType;
        cookie["media-timeline-record-dom-node"] = this._domNode instanceof WI.DOMNode ? this._domNode.path() : this._domNode;
        if (this._animationName)
            cookie["media-timeline-record-animation-name"] = this._animationName;
        if (this._transitionProperty)
            cookie["media-timeline-record-transition-property"] = this._transitionProperty;
    }

    // TimelineManager

    updateAnimationState(timestamp, animationState)
    {
        console.assert(this._eventType === MediaTimelineRecord.EventType.CSSAnimation || this._eventType === MediaTimelineRecord.EventType.CSSTransition);
        console.assert(!this._timestamps.length || timestamp > this._timestamps.lastValue.timestamp);

        let type;
        switch (animationState) {
        case InspectorBackend.Enum.Animation.AnimationState.Ready:
            type = MediaTimelineRecord.TimestampType.CSSAnimationReady;
            break;
        case InspectorBackend.Enum.Animation.AnimationState.Delayed:
            type = MediaTimelineRecord.TimestampType.CSSAnimationDelay;
            break;
        case InspectorBackend.Enum.Animation.AnimationState.Active:
            type = MediaTimelineRecord.TimestampType.CSSAnimationActive;
            break;
        case InspectorBackend.Enum.Animation.AnimationState.Canceled:
            type = MediaTimelineRecord.TimestampType.CSSAnimationCancel;
            break;
        case InspectorBackend.Enum.Animation.AnimationState.Done:
            type = MediaTimelineRecord.TimestampType.CSSAnimationDone;
            break;
        }
        console.assert(type);

        this._timestamps.push({type, timestamp});

        this._updateTimes();
    }

    addDOMEvent(timestamp, domEvent)
    {
        console.assert(this._eventType === MediaTimelineRecord.EventType.MediaElement);
        console.assert(!this._timestamps.length || timestamp > this._timestamps.lastValue.timestamp);

        let data = {
            type: MediaTimelineRecord.TimestampType.MediaElementDOMEvent,
            timestamp,
            eventName: domEvent.eventName,
        };
        if (domEvent.originator instanceof WI.DOMNode) {
            data.originator = domEvent.originator;
            data.originatorDisplayName = data.originator.displayName;
            data.originatorCSSPath = WI.cssPath(data.originator, {full: true});
        }
        if (!isEmptyObject(domEvent.data))
            data.data = domEvent.data;
        this._timestamps.push(data);

        this._updateTimes();
    }

    powerEfficientPlaybackStateChanged(timestamp, isPowerEfficient)
    {
        console.assert(this._eventType === MediaTimelineRecord.EventType.MediaElement);
        console.assert(!this._timestamps.length || timestamp > this._timestamps.lastValue.timestamp);

        this._timestamps.push({
            type: MediaTimelineRecord.TimestampType.MediaElementPowerEfficientPlaybackStateChange,
            timestamp,
            isPowerEfficient,
        });

        this._updateTimes();
    }

    // Private

    _updateTimes()
    {
        let oldStartTime = this.startTime;
        let oldEndTime = this.endTime;

        let firstItem = this._timestamps[0];
        let lastItem = this._timestamps.lastValue;

        if (isNaN(this._startTime))
            this._startTime = firstItem.timestamp;

        if (isNaN(this._activeStartTime)) {
            if (this._eventType === MediaTimelineRecord.EventType.MediaElement)
                this._activeStartTime = firstItem.timestamp;
            else if (firstItem.type === MediaTimelineRecord.TimestampType.CSSAnimationActive)
                this._activeStartTime = firstItem.timestamp;
        }

        switch (lastItem.type) {
        case MediaTimelineRecord.TimestampType.CSSAnimationCancel:
        case MediaTimelineRecord.TimestampType.CSSAnimationDone:
            this._endTime = lastItem.timestamp;
            break;

        case MediaTimelineRecord.TimestampType.MediaElementDOMEvent:
            if (WI.DOMNode.isPlayEvent(lastItem.eventName))
                this._endTime = NaN;
            else if (!isNaN(this._endTime) || WI.DOMNode.isPauseEvent(lastItem.eventName) || WI.DOMNode.isStopEvent(lastItem.eventName))
                this._endTime = lastItem.timestamp;
            break;
        }

        if (this.startTime !== oldStartTime || this.endTime !== oldEndTime)
            this.dispatchEventToListeners(WI.TimelineRecord.Event.Updated);
    }
};

WI.MediaTimelineRecord.EventType = {
    CSSAnimation: "css-animation",
    CSSTransition: "css-transition",
    MediaElement: "media-element",
};

WI.MediaTimelineRecord.TimestampType = {
    CSSAnimationReady: "css-animation-ready",
    CSSAnimationDelay: "css-animation-delay",
    CSSAnimationActive: "css-animation-active",
    CSSAnimationCancel: "css-animation-cancel",
    CSSAnimationDone: "css-animation-done",
    // CSS transitions share the same timestamp types.

    MediaElementDOMEvent: "media-element-dom-event",
    MediaElementPowerEfficientPlaybackStateChange: "media-element-power-efficient-playback-state-change",
};
