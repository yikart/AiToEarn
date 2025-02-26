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

WI.ReferencePage = class ReferencePage {
    constructor(page, {topic} = {})
    {
        console.assert(page instanceof WI.ReferencePage || typeof page === "string", page);
        console.assert(!(page instanceof WI.ReferencePage && page._page instanceof WI.ReferencePage), page);
        console.assert(!(page instanceof WI.ReferencePage && page.topic), page);
        console.assert(!topic || typeof topic === "string", topic);

        if (page instanceof WI.ReferencePage)
            page = page.page;
        this._page = page;

        this._topic = topic || "";
    }

    // Public

    get page() { return this._page; }
    get topic() { return this._topic; }

    createLinkElement()
    {
        let url = "https://webkit.org/web-inspector/" + this._page + "/";
        if (this._topic)
            url += "#" + this._topic;

        let wrapper = document.createElement("span");
        wrapper.className = "reference-page-link-container";

        let link = wrapper.appendChild(document.createElement("a"));
        link.className = "reference-page-link";
        link.href = link.title = url;
        link.textContent = "?";
        link.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();

            WI.openURL(link.href, {alwaysOpenExternally: true});
        });

        return wrapper;
    }
};

WI.ReferencePage.AuditTab = new WI.ReferencePage("audit-tab");
WI.ReferencePage.AuditTab.AuditResults = new WI.ReferencePage(WI.ReferencePage.AuditTab, {topic: "audit-results"});
WI.ReferencePage.AuditTab.CreatingAudits = new WI.ReferencePage(WI.ReferencePage.AuditTab, {topic: "creating-audits"});
WI.ReferencePage.AuditTab.EditingAudits = new WI.ReferencePage(WI.ReferencePage.AuditTab, {topic: "editing-audits"});
WI.ReferencePage.AuditTab.RunningAudits = new WI.ReferencePage(WI.ReferencePage.AuditTab, {topic: "running-audits"});

WI.ReferencePage.DOMBreakpoints = new WI.ReferencePage("dom-breakpoints");
WI.ReferencePage.DOMBreakpoints.Configuration = new WI.ReferencePage(WI.ReferencePage.DOMBreakpoints, {topic: "configuration"});

WI.ReferencePage.DeviceSettings = new WI.ReferencePage("device-settings");
WI.ReferencePage.DeviceSettings.Configuration = new WI.ReferencePage(WI.ReferencePage.DeviceSettings, {topic: "configuration"});

WI.ReferencePage.ElementsTab = new WI.ReferencePage("elements-tab");
WI.ReferencePage.ElementsTab.DOMTree = new WI.ReferencePage(WI.ReferencePage.ElementsTab, {topic: "dom-tree"});

WI.ReferencePage.EventBreakpoints = new WI.ReferencePage("event-breakpoints");
WI.ReferencePage.EventBreakpoints.Configuration = new WI.ReferencePage(WI.ReferencePage.EventBreakpoints, {topic: "configuration"});

WI.ReferencePage.JavaScriptBreakpoints = new WI.ReferencePage("javascript-breakpoints");
WI.ReferencePage.JavaScriptBreakpoints.Configuration = new WI.ReferencePage(WI.ReferencePage.JavaScriptBreakpoints, {topic: "configuration"});

WI.ReferencePage.LayersTab = new WI.ReferencePage("layers-tab");

WI.ReferencePage.LocalOverrides = new WI.ReferencePage("local-overrides");
WI.ReferencePage.LocalOverrides.ConfiguringLocalOverrides = new WI.ReferencePage(WI.ReferencePage.LocalOverrides, {topic: "configuring-local-overrides"});

WI.ReferencePage.NetworkTab = new WI.ReferencePage("network-tab");
WI.ReferencePage.NetworkTab.CookiesPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "cookies-pane"});
WI.ReferencePage.NetworkTab.HeadersPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "headers-pane"});
WI.ReferencePage.NetworkTab.PreviewPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "preview-pane"});
WI.ReferencePage.NetworkTab.SecurityPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "security-pane"});
WI.ReferencePage.NetworkTab.SizesPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "sizes-pane"});
WI.ReferencePage.NetworkTab.TimingPane = new WI.ReferencePage(WI.ReferencePage.NetworkTab, {topic: "timing-pane"});

WI.ReferencePage.SymbolicBreakpoints = new WI.ReferencePage("symbolic-breakpoints");
WI.ReferencePage.SymbolicBreakpoints.Configuration = new WI.ReferencePage(WI.ReferencePage.SymbolicBreakpoints, {topic: "configuration"});

WI.ReferencePage.TimelinesTab = new WI.ReferencePage("timelines-tab");
WI.ReferencePage.TimelinesTab.CPUTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "cpu-timeline"});
WI.ReferencePage.TimelinesTab.EventsView = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "events-view"});
WI.ReferencePage.TimelinesTab.FramesView = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "frames-view"});
WI.ReferencePage.TimelinesTab.JavaScriptAllocationsTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "javascript-allocations-timeline"});
WI.ReferencePage.TimelinesTab.JavaScriptAndEventsTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "javascript-events-timeline"});
WI.ReferencePage.TimelinesTab.LayoutAndRenderingTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "layout-rendering-timeline"});
WI.ReferencePage.TimelinesTab.MediaAndAnimationsTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "media-animations-timeline"});
WI.ReferencePage.TimelinesTab.MemoryTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "memory-timeline"});
WI.ReferencePage.TimelinesTab.NetworkRequestsTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "network-timeline"});
WI.ReferencePage.TimelinesTab.ScreenshotsTimeline = new WI.ReferencePage(WI.ReferencePage.TimelinesTab, {topic: "screenshots-timeline"});

WI.ReferencePage.URLBreakpoints = new WI.ReferencePage("url-breakpoints");
WI.ReferencePage.URLBreakpoints.Configuration = new WI.ReferencePage(WI.ReferencePage.URLBreakpoints, {topic: "configuration"});
