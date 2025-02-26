/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.ScreenshotsTimelineView = class ScreenshotsTimelineView extends WI.TimelineView
{
    constructor(timeline, extraArguments)
    {
        console.assert(timeline.type === WI.TimelineRecord.Type.Screenshots, timeline);
        
        super(timeline, extraArguments);

        this._screenshotsTimeline = timeline;

        this.element.classList.add("screenshots");
        
        this._selectedRecord = null;

        this._imageElementForRecord = new WeakMap;
    }

    // Public

    reset()
    {
        super.reset();

        this.selectRecord(null);

        this._imageElementForRecord = new WeakMap;
    }

    // Protected

    get showsFilterBar() { return false; }

    initialLayout()
    {
        super.initialLayout();

        this._scrollView = new WI.ContentView;

        this.addSubview(this._scrollView);
    }

    layout()
    {
        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        super.layout();

        if (this.hidden)
            return;

        this._scrollView.element.removeChildren();

        let selectedElement = null;

        for (let record of this._visibleRecords()) {
            this._scrollView.element.appendChild(this._imageElementForRecord.getOrInitialize(record, () => {
                let imageElement = document.createElement("img");

                imageElement.hidden = true;
                imageElement.addEventListener("load", (event) => {
                    imageElement.hidden = false;
                }, {once: true});
                imageElement.src = record.imageData;

                imageElement.addEventListener("click", (event) => {
                    this._selectTimelineRecord(record);
                });

                if (record === this._selectedRecord)
                    selectedElement = imageElement;

                return imageElement;
            }));
        }        

        if (selectedElement) {
            selectedElement.classList.add("selected");

            selectedElement.scrollIntoView({inline: "center"});
        }

        if (this._scrollView.element.childNodes.length) {
            let spacer = this._scrollView.element.appendChild(document.createElement("div"));
            spacer.className = "spacer";
        } else
            this._scrollView.element.appendChild(WI.createMessageTextView(WI.UIString("No screenshots", "No screenshots @ Screenshots Timeline", "Placeholder text shown when there are no images to display in the Screenshots timeline.")));
    }

    selectRecord(record)
    {
        if (record === this._selectedRecord)
            return;

        if (this._selectedRecord)
            this._imageElementForRecord.get(this._selectedRecord)?.classList.remove("selected");

        this._selectedRecord = record;

        if (this._selectedRecord) {
            let element = this._imageElementForRecord.get(this._selectedRecord);
            if (element) {
                element.classList.add("selected");

                element.scrollIntoView({inline: "center"});
            }
        }
    }

    // Private

    _selectTimelineRecord(record)
    {
        this.dispatchEventToListeners(WI.TimelineView.Event.RecordWasSelected, {record});
    }

    _visibleRecords()
    {
        let visibleEndTime = Math.min(this.endTime, this.currentTime);

        let records = this._screenshotsTimeline.records;
        let visibleRecords = [];

        for (let i = 0; i < records.length; ++i) {
            let record = records[i];
            if (!(record.startTime >= this.startTime || record.startTime <= visibleEndTime))
                continue;
                
            if (!visibleRecords.length && i)
                visibleRecords.push(records[i - 1]);
                
            visibleRecords.push(record);
        }

        return visibleRecords;
    }
};

WI.ScreenshotsTimelineView.ReferencePage = WI.ReferencePage.TimelinesTab.ScreenshotsTimeline;
