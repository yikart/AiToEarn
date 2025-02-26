/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.ResourceTimingContentView = class ResourceTimingContentView extends WI.ContentView
{
    constructor(resource)
    {
        super(null);

        console.assert(resource instanceof WI.Resource);

        this._resource = resource;
        this._resource.addEventListener(WI.Resource.Event.MetricsDidChange, this._resourceMetricsDidChange, this);
        this._resource.addEventListener(WI.Resource.Event.TimestampsDidChange, this._resourceTimestampsDidChange, this);

        this.element.classList.add("resource-details", "resource-timing");

        this._needsTimingRefresh = false;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._refreshTimingSection();

        this._needsTimingRefresh = false;
    }

    layout()
    {
        super.layout();

        if (this._needsTimingRefresh) {
            this._refreshTimingSection();
            this._needsTimingRefresh = false;
        }
    }

    closed()
    {
        this._resource.removeEventListener(WI.Resource.Event.MetricsDidChange, this._resourceMetricsDidChange, this);
        this._resource.removeEventListener(WI.Resource.Event.TimestampsDidChange, this._resourceTimestampsDidChange, this);

        super.closed();
    }

    // Private

    _refreshTimingSection()
    {
        this.element.removeChildren();

        if (!this._resource.hasResponse()) {
            let spinner = new WI.IndeterminateProgressSpinner;
            this.element.appendChild(spinner.element);
            return;
        }

        if (!this._resource.timingData.startTime || !this._resource.timingData.responseEnd) {
            const isError = false;
            this.element.appendChild(WI.createMessageTextView(WI.UIString("Resource does not have timing data"), isError));
            return;
        }

        let contentElement = this.element.appendChild(document.createElement("div"));
        contentElement.className = "content";

        let timingSection = contentElement.appendChild(document.createElement("section"));
        timingSection.className = "timing";

        let breakdownView = new WI.ResourceTimingBreakdownView(this._resource);
        timingSection.appendChild(breakdownView.element);
        breakdownView.updateLayout();
    }

    _resourceMetricsDidChange(event)
    {
        this._needsTimingRefresh = true;
        this.needsLayout();
    }

    _resourceTimestampsDidChange(event)
    {
        this._needsTimingRefresh = true;
        this.needsLayout();
    }
};

WI.ResourceTimingContentView.ReferencePage = WI.ReferencePage.NetworkTab.TimingPane;
