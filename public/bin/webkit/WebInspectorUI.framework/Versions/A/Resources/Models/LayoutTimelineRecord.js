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

WI.LayoutTimelineRecord = class LayoutTimelineRecord extends WI.TimelineRecord
{
    constructor(eventType, startTime, endTime, stackTrace, sourceCodeLocation, quad)
    {
        super(WI.TimelineRecord.Type.Layout, startTime, endTime, stackTrace, sourceCodeLocation);

        console.assert(eventType);
        console.assert(!quad || quad instanceof WI.Quad);

        if (eventType in WI.LayoutTimelineRecord.EventType)
            eventType = WI.LayoutTimelineRecord.EventType[eventType];

        this._eventType = eventType;
        this._quad = quad || null;
    }

    // Static

    static displayNameForEventType(eventType)
    {
        switch (eventType) {
        case WI.LayoutTimelineRecord.EventType.InvalidateStyles:
            return WI.UIString("Styles Invalidated");
        case WI.LayoutTimelineRecord.EventType.RecalculateStyles:
            return WI.UIString("Styles Recalculated");
        case WI.LayoutTimelineRecord.EventType.InvalidateLayout:
            return WI.UIString("Layout Invalidated");
        case WI.LayoutTimelineRecord.EventType.ForcedLayout:
            return WI.UIString("Forced Layout", "Layout phase records that were imperative (forced)");
        case WI.LayoutTimelineRecord.EventType.Layout:
            return WI.repeatedUIString.timelineRecordLayout();
        case WI.LayoutTimelineRecord.EventType.Paint:
            return WI.repeatedUIString.timelineRecordPaint();
        case WI.LayoutTimelineRecord.EventType.Composite:
            return WI.repeatedUIString.timelineRecordComposite();
        }
    }

    // Import / Export

    static async fromJSON(json)
    {
        let {eventType, startTime, endTime, stackTrace, sourceCodeLocation, quad} = json;
        quad = quad ? WI.Quad.fromJSON(quad) : null;
        return new WI.LayoutTimelineRecord(eventType, startTime, endTime, stackTrace, sourceCodeLocation, quad);
    }

    toJSON()
    {
        // FIXME: stackTrace
        // FIXME: sourceCodeLocation

        return {
            type: this.type,
            eventType: this._eventType,
            startTime: this.startTime,
            endTime: this.endTime,
            quad: this._quad || undefined,
        };
    }

    // Public

    get eventType()
    {
        return this._eventType;
    }

    get width()
    {
        return this._quad ? this._quad.width : NaN;
    }

    get height()
    {
        return this._quad ? this._quad.height : NaN;
    }

    get area()
    {
        return this.width * this.height;
    }

    get quad()
    {
        return this._quad;
    }

    saveIdentityToCookie(cookie)
    {
        super.saveIdentityToCookie(cookie);

        cookie[WI.LayoutTimelineRecord.EventTypeCookieKey] = this._eventType;
    }
};

WI.LayoutTimelineRecord.EventType = {
    InvalidateStyles: "invalidate-styles",
    RecalculateStyles: "recalculate-styles",
    InvalidateLayout: "invalidate-layout",
    ForcedLayout: "forced-layout",
    Layout: "layout",
    Paint: "paint",
    Composite: "composite"
};

WI.LayoutTimelineRecord.TypeIdentifier = "layout-timeline-record";
WI.LayoutTimelineRecord.EventTypeCookieKey = "layout-timeline-record-event-type";
