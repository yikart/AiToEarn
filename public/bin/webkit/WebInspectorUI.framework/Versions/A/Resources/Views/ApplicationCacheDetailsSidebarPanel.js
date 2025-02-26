/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ApplicationCacheDetailsSidebarPanel = class ApplicationCacheDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("application-cache-details", WI.UIString("Storage"));

        this.element.classList.add("application-cache");

        this._applicationCacheFrame = null;
    }

    // Public

    inspect(objects)
    {
        // Convert to a single item array if needed.
        if (!(objects instanceof Array))
            objects = [objects];

        var applicationCacheFrameToInspect = null;

        // Iterate over the objects to find a WI.ApplicationCacheFrame to inspect.
        for (var i = 0; i < objects.length; ++i) {
            if (objects[i] instanceof WI.ApplicationCacheFrame) {
                applicationCacheFrameToInspect = objects[i];
                break;
            }
        }

        this.applicationCacheFrame = applicationCacheFrameToInspect;

        return !!this.applicationCacheFrame;
    }

    get applicationCacheFrame()
    {
        return this._applicationCacheFrame;
    }

    set applicationCacheFrame(applicationCacheFrame)
    {
        if (this._applicationCacheFrame === applicationCacheFrame)
            return;

        this._applicationCacheFrame = applicationCacheFrame;

        this.needsLayout();
    }

    closed()
    {
        if (this.didInitialLayout) {
            WI.applicationCacheManager.removeEventListener(WI.ApplicationCacheManager.Event.NetworkStateUpdated, this._networkStateUpdated, this);
            WI.applicationCacheManager.removeEventListener(WI.ApplicationCacheManager.Event.FrameManifestStatusChanged, this._frameManifestStatusChanged, this);
        }

        super.closed();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._locationManifestURLRow = new WI.DetailsSectionSimpleRow(WI.UIString("Manifest URL"));
        this._locationFrameURLRow = new WI.DetailsSectionSimpleRow(WI.UIString("Frame URL"));

        let locationGroup = new WI.DetailsSectionGroup([this._locationManifestURLRow, this._locationFrameURLRow]);
        let locationSection = new WI.DetailsSection("application-cache-location", WI.UIString("Location"), [locationGroup]);

        this._onlineRow = new WI.DetailsSectionSimpleRow(WI.UIString("Online"));
        this._statusRow = new WI.DetailsSectionSimpleRow(WI.UIString("Status"));

        let statusGroup = new WI.DetailsSectionGroup([this._onlineRow, this._statusRow]);
        let statusSection = new WI.DetailsSection("application-cache-status", WI.UIString("Status"), [statusGroup]);

        this.contentView.element.appendChild(locationSection.element);
        this.contentView.element.appendChild(statusSection.element);

        WI.applicationCacheManager.addEventListener(WI.ApplicationCacheManager.Event.NetworkStateUpdated, this._networkStateUpdated, this);
        WI.applicationCacheManager.addEventListener(WI.ApplicationCacheManager.Event.FrameManifestStatusChanged, this._frameManifestStatusChanged, this);
    }

    layout()
    {
        super.layout();

        if (!this.applicationCacheFrame)
            return;

        this._locationFrameURLRow.value = this.applicationCacheFrame.frame.url;
        this._locationManifestURLRow.value = this.applicationCacheFrame.manifest.manifestURL;

        this._refreshOnlineRow();
        this._refreshStatusRow();
    }

    // Private

    _networkStateUpdated(event)
    {
        if (!this.applicationCacheFrame)
            return;

        this._refreshOnlineRow();
    }

    _frameManifestStatusChanged(event)
    {
        if (!this.applicationCacheFrame)
            return;

        console.assert(event.data.frameManifest instanceof WI.ApplicationCacheFrame);
        if (event.data.frameManifest !== this.applicationCacheFrame)
            return;

        this._refreshStatusRow();
    }

    _refreshOnlineRow()
    {
        this._onlineRow.value = WI.applicationCacheManager.online ? WI.UIString("Yes") : WI.UIString("No");
    }

    _refreshStatusRow()
    {
        this._statusRow.value = WI.ApplicationCacheDetailsSidebarPanel.Status[this.applicationCacheFrame.status];
    }
};

// This needs to be kept in sync with ApplicationCacheManager.js.
WI.ApplicationCacheDetailsSidebarPanel.Status = {
    0: "Uncached",
    1: "Idle",
    2: "Checking",
    3: "Downloading",
    4: "UpdateReady",
    5: "Obsolete"
};
