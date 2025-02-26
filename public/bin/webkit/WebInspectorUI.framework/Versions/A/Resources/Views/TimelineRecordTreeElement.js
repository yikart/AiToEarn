/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

WI.TimelineRecordTreeElement = class TimelineRecordTreeElement extends WI.GeneralTreeElement
{
    constructor(timelineRecord, subtitleNameStyle, includeDetailsInMainTitle, sourceCodeLocation, representedObject)
    {
        console.assert(timelineRecord);

        sourceCodeLocation = sourceCodeLocation || timelineRecord.sourceCodeLocation || null;

        let alternateSubtitle = null;
        if (includeDetailsInMainTitle && timelineRecord.type === WI.TimelineRecord.Type.Script && timelineRecord.eventType === WI.ScriptTimelineRecord.EventType.TimerInstalled) {
            let timeoutString = Number.secondsToString(timelineRecord.details.timeout / 1000);
            alternateSubtitle = document.createElement("span");
            alternateSubtitle.classList.add("alternate-subtitle");
            if (timelineRecord.details.repeating)
                alternateSubtitle.textContent = WI.UIString("%s interval").format(timeoutString);
            else
                alternateSubtitle.textContent = WI.UIString("%s delay").format(timeoutString);
        }

        let subtitle = null;
        if (sourceCodeLocation) {
            subtitle = document.createElement("span");

            if (subtitleNameStyle !== WI.SourceCodeLocation.NameStyle.None)
                sourceCodeLocation.populateLiveDisplayLocationString(subtitle, "textContent", null, subtitleNameStyle);
            else
                sourceCodeLocation.populateLiveDisplayLocationString(subtitle, "textContent", null, WI.SourceCodeLocation.NameStyle.None, WI.UIString("line "));
        }

        let iconStyleClass = WI.TimelineTabContentView.iconClassNameForRecord(timelineRecord);
        let title = WI.TimelineTabContentView.displayNameForRecord(timelineRecord);

        super([iconStyleClass], title, subtitle, representedObject || timelineRecord);

        this._record = timelineRecord;
        this._sourceCodeLocation = sourceCodeLocation;

        if (this._sourceCodeLocation)
            this.tooltipHandledSeparately = true;

        if (alternateSubtitle)
            this.titlesElement.appendChild(alternateSubtitle);
    }

    // Public

    get record()
    {
        return this._record;
    }

    get filterableData()
    {
        var url = this._sourceCodeLocation ? this._sourceCodeLocation.sourceCode.url : "";
        return {text: [this.mainTitle, url || "", this._record.details || ""]};
    }

    get sourceCodeLocation()
    {
        return this._sourceCodeLocation;
    }

    // Protected

    onattach()
    {
        super.onattach();

        console.assert(this.element);

        if (!this.tooltipHandledSeparately)
            return;

        var tooltipPrefix = this.mainTitle + "\n";
        this._sourceCodeLocation.populateLiveDisplayLocationTooltip(this.element, tooltipPrefix);
    }
};

WI.TimelineRecordTreeElement.StyleRecordIconStyleClass = "style-record";
WI.TimelineRecordTreeElement.LayoutRecordIconStyleClass = "layout-record";
WI.TimelineRecordTreeElement.PaintRecordIconStyleClass = "paint-record";
WI.TimelineRecordTreeElement.CompositeRecordIconStyleClass = "composite-record";
WI.TimelineRecordTreeElement.RenderingFrameRecordIconStyleClass = "rendering-frame-record";
WI.TimelineRecordTreeElement.APIRecordIconStyleClass = "api-record";
WI.TimelineRecordTreeElement.EvaluatedRecordIconStyleClass = "evaluated-record";
WI.TimelineRecordTreeElement.EventRecordIconStyleClass = "event-record";
WI.TimelineRecordTreeElement.TimerRecordIconStyleClass = "timer-record";
WI.TimelineRecordTreeElement.ProbeRecordIconStyleClass = "probe-record";
WI.TimelineRecordTreeElement.ConsoleProfileIconStyleClass = "console-profile-record";
WI.TimelineRecordTreeElement.GarbageCollectionIconStyleClass = "garbage-collection-profile-record";
