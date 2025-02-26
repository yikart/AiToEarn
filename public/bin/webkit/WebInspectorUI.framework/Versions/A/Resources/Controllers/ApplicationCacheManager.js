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

// FIXME: ApplicationCacheManager lacks advanced multi-target support. (ApplciationCache objects per-target)

WI.ApplicationCacheManager = class ApplicationCacheManager extends WI.Object
{
    constructor()
    {
        super();

        this._enabled = false;
        this._reset();
    }

    // Agent

    get domains() { return ["ApplicationCache"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "ApplicationCache");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        if (target.hasDomain("ApplicationCache")) {
            target.ApplicationCacheAgent.enable();
            target.ApplicationCacheAgent.getFramesWithManifests(this._framesWithManifestsLoaded.bind(this));
        }
    }

    // Public

    get online() { return this._online; }

    get applicationCacheObjects()
    {
        var applicationCacheObjects = [];
        for (var id in this._applicationCacheObjects)
            applicationCacheObjects.push(this._applicationCacheObjects[id]);
        return applicationCacheObjects;
    }

    enable()
    {
        console.assert(!this._enabled);

        this._enabled = true;

        this._reset();

        for (let target of WI.targets)
            this.initializeTarget(target);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.ChildFrameWasRemoved, this._childFrameWasRemoved, this);
    }

    disable()
    {
        console.assert(this._enabled);

        this._enabled = false;

        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 13): ApplicationCache.disable did not exist yet.
            if (target.hasCommand("ApplicationCache.disable"))
                target.ApplicationCacheAgent.disable();
        }

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.ChildFrameWasRemoved, this._childFrameWasRemoved, this);

        this._reset();
    }

    requestApplicationCache(frame, callback)
    {
        console.assert(this._enabled);

        function callbackWrapper(error, applicationCache)
        {
            if (error) {
                callback(null);
                return;
            }

            callback(applicationCache);
        }

        let target = WI.assumingMainTarget();
        target.ApplicationCacheAgent.getApplicationCacheForFrame(frame.id, callbackWrapper);
    }

    // ApplicationCacheObserver

    networkStateUpdated(isNowOnline)
    {
        console.assert(this._enabled);

        this._online = isNowOnline;

        this.dispatchEventToListeners(WI.ApplicationCacheManager.Event.NetworkStateUpdated, {online: this._online});
    }

    applicationCacheStatusUpdated(frameId, manifestURL, status)
    {
        console.assert(this._enabled);

        let frame = WI.networkManager.frameForIdentifier(frameId);
        if (!frame)
            return;

        this._frameManifestUpdated(frame, manifestURL, status);
    }

    // Private

    _reset()
    {
        this._online = true;
        this._applicationCacheObjects = {};

        this.dispatchEventToListeners(WI.ApplicationCacheManager.Event.Cleared);
    }

    _mainResourceDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);

        if (event.target.isMainFrame()) {
            this._reset();
            return;
        }

        let target = WI.assumingMainTarget();
        if (target.hasDomain("ApplicationCache"))
            target.ApplicationCacheAgent.getManifestForFrame(event.target.id, this._manifestForFrameLoaded.bind(this, event.target.id));
    }

    _childFrameWasRemoved(event)
    {
        this._frameManifestRemoved(event.data.childFrame);
    }

    _manifestForFrameLoaded(frameId, error, manifestURL)
    {
        if (!this._enabled)
            return;

        var frame = WI.networkManager.frameForIdentifier(frameId);
        if (!frame)
            return;

        // A frame can go away between `ApplicationCache.getManifestForFrame` being called and the
        // response being received.
        if (error) {
            WI.reportInternalError(error);
            return;
        }

        if (!manifestURL)
            this._frameManifestRemoved(frame);
    }

    _framesWithManifestsLoaded(error, framesWithManifests)
    {
        if (error) {
            WI.reportInternalError(error);
            return;
        }

        if (!this._enabled)
            return;

        for (var i = 0; i < framesWithManifests.length; ++i) {
            var frame = WI.networkManager.frameForIdentifier(framesWithManifests[i].frameId);
            if (!frame)
                continue;

            this._frameManifestUpdated(frame, framesWithManifests[i].manifestURL, framesWithManifests[i].status);
        }
    }

    _frameManifestUpdated(frame, manifestURL, status)
    {
        if (status === WI.ApplicationCacheManager.Status.Uncached) {
            this._frameManifestRemoved(frame);
            return;
        }

        if (!manifestURL)
            return;

        var manifestFrame = this._applicationCacheObjects[frame.id];
        if (manifestFrame && manifestURL !== manifestFrame.manifest.manifestURL)
            this._frameManifestRemoved(frame);

        var oldStatus = manifestFrame ? manifestFrame.status : -1;
        var statusChanged = manifestFrame && status !== oldStatus;
        if (manifestFrame)
            manifestFrame.status = status;

        if (!this._applicationCacheObjects[frame.id]) {
            var cacheManifest = new WI.ApplicationCacheManifest(manifestURL);
            this._applicationCacheObjects[frame.id] = new WI.ApplicationCacheFrame(frame, cacheManifest, status);

            this.dispatchEventToListeners(WI.ApplicationCacheManager.Event.FrameManifestAdded, {frameManifest: this._applicationCacheObjects[frame.id]});
        }

        if (statusChanged)
            this.dispatchEventToListeners(WI.ApplicationCacheManager.Event.FrameManifestStatusChanged, {frameManifest: this._applicationCacheObjects[frame.id]});
    }

    _frameManifestRemoved(frame)
    {
        if (!this._applicationCacheObjects[frame.id])
            return;

        delete this._applicationCacheObjects[frame.id];

        this.dispatchEventToListeners(WI.ApplicationCacheManager.Event.FrameManifestRemoved, {frame});
    }
};

WI.ApplicationCacheManager.Event = {
    Cleared: "application-cache-manager-cleared",
    FrameManifestAdded: "application-cache-manager-frame-manifest-added",
    FrameManifestRemoved: "application-cache-manager-frame-manifest-removed",
    FrameManifestStatusChanged: "application-cache-manager-frame-manifest-status-changed",
    NetworkStateUpdated: "application-cache-manager-network-state-updated"
};

WI.ApplicationCacheManager.Status = {
    Uncached: 0,
    Idle: 1,
    Checking: 2,
    Downloading: 3,
    UpdateReady: 4,
    Obsolete: 5
};
