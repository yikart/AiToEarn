/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.ScriptClusterTimelineView = class ScriptClusterTimelineView extends WI.ClusterContentView
{
    constructor(timeline, extraArguments)
    {
        super(timeline);

        console.assert(timeline.type === WI.TimelineRecord.Type.Script);

        this._currentContentViewSetting = new WI.Setting("script-cluster-timeline-view-current-view", WI.ScriptClusterTimelineView.EventsIdentifier);

        function createPathComponent(displayName, className, identifier)
        {
            const showSelectorArrows = true;
            let pathComponent = new WI.HierarchicalPathComponent(displayName, className, identifier, false, showSelectorArrows);
            pathComponent.addEventListener(WI.HierarchicalPathComponent.Event.SiblingWasSelected, this._pathComponentSelected, this);
            pathComponent.comparisonData = timeline;
            return pathComponent;
        }

        this._eventsPathComponent = createPathComponent.call(this, WI.UIString("Events"), "events-icon", WI.ScriptClusterTimelineView.EventsIdentifier);
        this._profilePathComponent = createPathComponent.call(this, WI.UIString("Call Trees"), "call-trees-icon", WI.ScriptClusterTimelineView.ProfileIdentifier);

        this._eventsPathComponent.nextSibling = this._profilePathComponent;
        this._profilePathComponent.previousSibling = this._eventsPathComponent;

        // FIXME: We should be able to create these lazily.
        this._eventsContentView = new WI.ScriptDetailsTimelineView(this.representedObject, extraArguments);
        this._profileContentView = new WI.ScriptProfileTimelineView(this.representedObject, extraArguments);

        this._showContentViewForIdentifier(this._currentContentViewSetting.value);

        this.contentViewContainer.addEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this._scriptClusterViewCurrentContentViewDidChange, this);
    }

    // TimelineView

    // FIXME: Determine a better way to bridge TimelineView methods to the sub-timeline views.
    get showsLiveRecordingData() { return this._contentViewContainer.currentContentView.showsLiveRecordingData; }
    get showsFilterBar() { return this._contentViewContainer.currentContentView.showsFilterBar; }
    get zeroTime() { return this._contentViewContainer.currentContentView.zeroTime; }
    set zeroTime(x) { this._contentViewContainer.currentContentView.zeroTime = x; }
    get startTime() { return this._contentViewContainer.currentContentView.startTime; }
    set startTime(x) { this._contentViewContainer.currentContentView.startTime = x; }
    get endTime() { return this._contentViewContainer.currentContentView.endTime; }
    set endTime(x) { this._contentViewContainer.currentContentView.endTime = x; }
    get currentTime() { return this._contentViewContainer.currentContentView.currentTime; }
    set currentTime(x) { this._contentViewContainer.currentContentView.currentTime = x; }
    selectRecord(record) { this._contentViewContainer.currentContentView.selectRecord(record); }
    updateFilter(filters) { return this._contentViewContainer.currentContentView.updateFilter(filters); }
    filterDidChange() { return this._contentViewContainer.currentContentView.filterDidChange(); }
    matchDataGridNodeAgainstCustomFilters(node) { return this._contentViewContainer.currentContentView.matchDataGridNodeAgainstCustomFilters(node); }

    reset()
    {
        this._eventsContentView.reset();
        this._profileContentView.reset();
    }

    // Public

    get eventsContentView()
    {
        return this._eventsContentView;
    }

    get profileContentView()
    {
        return this._profileContentView;
    }

    get selectionPathComponents()
    {
        let currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView)
            return [];

        let components = [this._pathComponentForContentView(currentContentView)];

        let subComponents = currentContentView.selectionPathComponents;
        if (subComponents)
            components.pushAll(subComponents);

        return components;
    }

    saveToCookie(cookie)
    {
        cookie[WI.ScriptClusterTimelineView.ContentViewIdentifierCookieKey] = this._currentContentViewSetting.value;
    }

    restoreFromCookie(cookie)
    {
        this._showContentViewForIdentifier(cookie[WI.ScriptClusterTimelineView.ContentViewIdentifierCookieKey]);
    }

    showEvents()
    {
        return this._showContentViewForIdentifier(WI.ScriptClusterTimelineView.EventsIdentifier);
    }

    showProfile()
    {
        return this._showContentViewForIdentifier(WI.ScriptClusterTimelineView.ProfileIdentifier);
    }

    // Private

    _pathComponentForContentView(contentView)
    {
        console.assert(contentView);
        if (!contentView)
            return null;
        if (contentView === this._eventsContentView)
            return this._eventsPathComponent;
        if (contentView === this._profileContentView)
            return this._profilePathComponent;
        console.error("Unknown contentView.");
        return null;
    }

    _identifierForContentView(contentView)
    {
        console.assert(contentView);
        if (!contentView)
            return null;
        if (contentView === this._eventsContentView)
            return WI.ScriptClusterTimelineView.EventsIdentifier;
        if (contentView === this._profileContentView)
            return WI.ScriptClusterTimelineView.ProfileIdentifier;
        console.error("Unknown contentView.");
        return null;
    }

    _showContentViewForIdentifier(identifier)
    {
        let contentViewToShow = null;

        switch (identifier) {
        case WI.ScriptClusterTimelineView.EventsIdentifier:
            contentViewToShow = this.eventsContentView;
            break;
        case WI.ScriptClusterTimelineView.ProfileIdentifier:
            contentViewToShow = this.profileContentView;
            break;
        }

        if (!contentViewToShow)
            contentViewToShow = this.eventsContentView;

        console.assert(contentViewToShow);

        this._currentContentViewSetting.value = this._identifierForContentView(contentViewToShow);

        return this.contentViewContainer.showContentView(contentViewToShow);
    }

    _pathComponentSelected(event)
    {
        this._showContentViewForIdentifier(event.data.pathComponent.representedObject);
    }

    _scriptClusterViewCurrentContentViewDidChange(event)
    {
        let currentContentView = this._contentViewContainer.currentContentView;
        if (!currentContentView)
            return;

        let previousContentView = currentContentView === this._eventsContentView ? this._profileContentView : this._eventsContentView;

        currentContentView.zeroTime = previousContentView.zeroTime;
        currentContentView.startTime = previousContentView.startTime;
        currentContentView.endTime = previousContentView.endTime;
        currentContentView.currentTime = previousContentView.currentTime;
    }
};

WI.ScriptClusterTimelineView.ContentViewIdentifierCookieKey = "script-cluster-timeline-view-identifier";

WI.ScriptClusterTimelineView.EventsIdentifier = "events";
WI.ScriptClusterTimelineView.ProfileIdentifier = "profile";
