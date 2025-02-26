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

WI.Frame = class Frame extends WI.Object
{
    constructor(id, name, securityOrigin, loaderIdentifier, mainResource)
    {
        super();

        console.assert(id);

        this._id = id;

        this._name = null;
        this._securityOrigin = null;

        this._resourceCollection = new WI.ResourceCollection;
        this._provisionalResourceCollection = new WI.ResourceCollection;
        this._extraScriptCollection = new WI.ScriptCollection;

        this._childFrameCollection = new WI.FrameCollection;
        this._childFrameIdentifierMap = new Map;

        this._parentFrame = null;
        this._isMainFrame = false;

        this._domContentReadyEventTimestamp = NaN;
        this._loadEventTimestamp = NaN;

        this._executionContextList = new WI.ExecutionContextList;

        this.initialize(name, securityOrigin, loaderIdentifier, mainResource);
    }

    // Public

    get resourceCollection() { return this._resourceCollection; }
    get extraScriptCollection() { return this._extraScriptCollection; }
    get childFrameCollection() { return this._childFrameCollection; }

    initialize(name, securityOrigin, loaderIdentifier, mainResource)
    {
        console.assert(loaderIdentifier);
        console.assert(mainResource);

        var oldName = this._name;
        var oldSecurityOrigin = this._securityOrigin;
        var oldMainResource = this._mainResource;

        this._name = name || null;
        this._securityOrigin = securityOrigin || null;
        this._loaderIdentifier = loaderIdentifier || null;

        this._mainResource = mainResource;
        this._mainResource._parentFrame = this;

        if (oldMainResource && this._mainResource !== oldMainResource)
            this._disassociateWithResource(oldMainResource);

        this.removeAllResources();
        this.removeAllChildFrames();
        this.clearExecutionContexts();
        this.clearProvisionalLoad();

        if (this._mainResource !== oldMainResource)
            this._dispatchMainResourceDidChangeEvent(oldMainResource);

        if (this._securityOrigin !== oldSecurityOrigin)
            this.dispatchEventToListeners(WI.Frame.Event.SecurityOriginDidChange, {oldSecurityOrigin});

        if (this._name !== oldName)
            this.dispatchEventToListeners(WI.Frame.Event.NameDidChange, {oldName});
    }

    startProvisionalLoad(provisionalMainResource)
    {
        console.assert(provisionalMainResource);

        this._provisionalMainResource = provisionalMainResource;
        this._provisionalMainResource._parentFrame = this;

        this._provisionalLoaderIdentifier = provisionalMainResource.loaderIdentifier;

        this._provisionalResourceCollection.clear();

        this.dispatchEventToListeners(WI.Frame.Event.ProvisionalLoadStarted);
    }

    commitProvisionalLoad(securityOrigin)
    {
        console.assert(this._provisionalMainResource);
        console.assert(this._provisionalLoaderIdentifier);
        if (!this._provisionalLoaderIdentifier)
            return;

        var oldSecurityOrigin = this._securityOrigin;
        var oldMainResource = this._mainResource;

        this._securityOrigin = securityOrigin || null;
        this._loaderIdentifier = this._provisionalLoaderIdentifier;
        this._mainResource = this._provisionalMainResource;

        this._domContentReadyEventTimestamp = NaN;
        this._loadEventTimestamp = NaN;

        if (oldMainResource && this._mainResource !== oldMainResource)
            this._disassociateWithResource(oldMainResource);

        this.removeAllResources();

        this._resourceCollection = this._provisionalResourceCollection;
        this._provisionalResourceCollection = new WI.ResourceCollection;
        this._extraScriptCollection.clear();

        this.clearExecutionContexts(true);
        this.clearProvisionalLoad(true);
        this.removeAllChildFrames();

        this.dispatchEventToListeners(WI.Frame.Event.ProvisionalLoadCommitted);

        if (this._mainResource !== oldMainResource)
            this._dispatchMainResourceDidChangeEvent(oldMainResource);

        if (this._securityOrigin !== oldSecurityOrigin)
            this.dispatchEventToListeners(WI.Frame.Event.SecurityOriginDidChange, {oldSecurityOrigin});
    }

    clearProvisionalLoad(skipProvisionalLoadClearedEvent)
    {
        if (!this._provisionalLoaderIdentifier)
            return;

        this._provisionalLoaderIdentifier = null;
        this._provisionalMainResource = null;
        this._provisionalResourceCollection.clear();

        if (!skipProvisionalLoadClearedEvent)
            this.dispatchEventToListeners(WI.Frame.Event.ProvisionalLoadCleared);
    }

    get id()
    {
        return this._id;
    }

    get loaderIdentifier()
    {
        return this._loaderIdentifier;
    }

    get provisionalLoaderIdentifier()
    {
        return this._provisionalLoaderIdentifier;
    }

    get name()
    {
        return this._name;
    }

    get securityOrigin()
    {
        return this._securityOrigin;
    }

    get url()
    {
        return this._mainResource.url;
    }

    get urlComponents()
    {
        return this._mainResource.urlComponents;
    }

    get domTree()
    {
        if (!this._domTree)
            this._domTree = new WI.DOMTree(this);
        return this._domTree;
    }

    get pageExecutionContext()
    {
        return this._executionContextList.pageExecutionContext;
    }

    get executionContextList()
    {
        return this._executionContextList;
    }

    clearExecutionContexts(committingProvisionalLoad)
    {
        if (this._executionContextList.contexts.length) {
            let contexts = this._executionContextList.contexts.slice();
            this._executionContextList.clear();
            this.dispatchEventToListeners(WI.Frame.Event.ExecutionContextsCleared, {committingProvisionalLoad: !!committingProvisionalLoad, contexts});
        }
    }

    addExecutionContext(context)
    {
        this._executionContextList.add(context);

        this.dispatchEventToListeners(WI.Frame.Event.ExecutionContextAdded, {context});

        if (this._executionContextList.pageExecutionContext === context)
            this.dispatchEventToListeners(WI.Frame.Event.PageExecutionContextChanged);
    }

    get mainResource()
    {
        return this._mainResource;
    }

    get provisionalMainResource()
    {
        return this._provisionalMainResource;
    }

    get parentFrame()
    {
        return this._parentFrame;
    }

    get domContentReadyEventTimestamp()
    {
        return this._domContentReadyEventTimestamp;
    }

    get loadEventTimestamp()
    {
        return this._loadEventTimestamp;
    }

    isMainFrame()
    {
        return this._isMainFrame;
    }

    markAsMainFrame()
    {
        this._isMainFrame = true;
    }

    unmarkAsMainFrame()
    {
        this._isMainFrame = false;
    }

    markDOMContentReadyEvent(timestamp)
    {
        console.assert(isNaN(this._domContentReadyEventTimestamp));

        this._domContentReadyEventTimestamp = timestamp || NaN;
    }

    markLoadEvent(timestamp)
    {
        console.assert(isNaN(this._loadEventTimestamp));

        this._loadEventTimestamp = timestamp || NaN;
    }

    isDetached()
    {
        var frame = this;
        while (frame) {
            if (frame.isMainFrame())
                return false;
            frame = frame.parentFrame;
        }

        return true;
    }

    childFrameForIdentifier(frameId)
    {
        return this._childFrameIdentifierMap.get(frameId) || null;
    }

    addChildFrame(frame)
    {
        console.assert(frame instanceof WI.Frame);
        if (!(frame instanceof WI.Frame))
            return;

        if (frame._parentFrame === this)
            return;

        if (frame._parentFrame)
            frame._parentFrame.removeChildFrame(frame);

        this._childFrameCollection.add(frame);
        this._childFrameIdentifierMap.set(frame._id, frame);

        frame._parentFrame = this;

        this.dispatchEventToListeners(WI.Frame.Event.ChildFrameWasAdded, {childFrame: frame});
    }

    removeChildFrame(frameOrFrameId)
    {
        console.assert(frameOrFrameId);

        let childFrameId = frameOrFrameId;
        if (childFrameId instanceof WI.Frame)
            childFrameId = frameOrFrameId._id;

        // Fetch the frame by id even if we were passed a WI.Frame.
        // We do this incase the WI.Frame is a new object that isn't
        // in _childFrameCollection, but the id is a valid child frame.
        let childFrame = this.childFrameForIdentifier(childFrameId);
        console.assert(childFrame instanceof WI.Frame);
        if (!(childFrame instanceof WI.Frame))
            return;

        console.assert(childFrame.parentFrame === this);

        this._childFrameCollection.remove(childFrame);
        this._childFrameIdentifierMap.delete(childFrame._id);

        childFrame._detachFromParentFrame();

        this.dispatchEventToListeners(WI.Frame.Event.ChildFrameWasRemoved, {childFrame});
    }

    removeAllChildFrames()
    {
        this._detachFromParentFrame();

        for (let childFrame of this._childFrameCollection)
            childFrame.removeAllChildFrames();

        this._childFrameCollection.clear();
        this._childFrameIdentifierMap.clear();

        this.dispatchEventToListeners(WI.Frame.Event.AllChildFramesRemoved);
    }

    resourcesForURL(url, recursivelySearchChildFrames)
    {
        let resources = this._resourceCollection.resourcesForURL(url);

        // Check the main resources of the child frames for the requested URL.
        for (let childFrame of this._childFrameCollection) {
            if (childFrame.mainResource.url === url)
                resources.add(childFrame.mainResource);
        }

        if (recursivelySearchChildFrames) {
            for (let childFrame of this._childFrameCollection)
                resources.addAll(childFrame.resourcesForURL(url, recursivelySearchChildFrames));
        }

        return resources;
    }

    resourceCollectionForType(type)
    {
        return this._resourceCollection.resourceCollectionForType(type);
    }

    addResource(resource)
    {
        console.assert(resource instanceof WI.Resource);
        if (!(resource instanceof WI.Resource))
            return;

        if (resource.parentFrame === this)
            return;

        if (resource.parentFrame)
            resource.parentFrame.remove(resource);

        this._associateWithResource(resource);

        if (this._isProvisionalResource(resource)) {
            this._provisionalResourceCollection.add(resource);
            this.dispatchEventToListeners(WI.Frame.Event.ProvisionalResourceWasAdded, {resource});
        } else {
            this._resourceCollection.add(resource);
            this.dispatchEventToListeners(WI.Frame.Event.ResourceWasAdded, {resource});
        }
    }

    removeResource(resource)
    {
        // This does not remove provisional resources.

        this._resourceCollection.remove(resource);

        this._disassociateWithResource(resource);

        this.dispatchEventToListeners(WI.Frame.Event.ResourceWasRemoved, {resource});
    }

    removeAllResources()
    {
        // This does not remove provisional resources, use clearProvisionalLoad for that.

        if (!this._resourceCollection.size)
            return;

        for (let resource of this._resourceCollection)
            this._disassociateWithResource(resource);

        this._resourceCollection.clear();

        this.dispatchEventToListeners(WI.Frame.Event.AllResourcesRemoved);
    }

    addExtraScript(script)
    {
        this._extraScriptCollection.add(script);

        this.dispatchEventToListeners(WI.Frame.Event.ExtraScriptAdded, {script});
    }

    saveIdentityToCookie(cookie)
    {
        cookie[WI.Frame.MainResourceURLCookieKey] = this.mainResource.url.hash;
        cookie[WI.Frame.IsMainFrameCookieKey] = this._isMainFrame;
    }

    // Private

    _detachFromParentFrame()
    {
        if (this._domTree) {
            this._domTree.disconnect();
            this._domTree = null;
        }

        this._parentFrame = null;
    }

    _isProvisionalResource(resource)
    {
        return resource.loaderIdentifier && this._provisionalLoaderIdentifier && resource.loaderIdentifier === this._provisionalLoaderIdentifier;
    }

    _associateWithResource(resource)
    {
        console.assert(!resource._parentFrame);
        if (resource._parentFrame)
            return;

        resource._parentFrame = this;
    }

    _disassociateWithResource(resource)
    {
        console.assert(resource.parentFrame === this);
        if (resource.parentFrame !== this)
            return;

        resource._parentFrame = null;
    }

    _dispatchMainResourceDidChangeEvent(oldMainResource)
    {
        this.dispatchEventToListeners(WI.Frame.Event.MainResourceDidChange, {oldMainResource});
    }
};

WI.Frame.Event = {
    NameDidChange: "frame-name-did-change",
    SecurityOriginDidChange: "frame-security-origin-did-change",
    MainResourceDidChange: "frame-main-resource-did-change",
    ProvisionalLoadStarted: "frame-provisional-load-started",
    ProvisionalLoadCommitted: "frame-provisional-load-committed",
    ProvisionalLoadCleared: "frame-provisional-load-cleared",
    ProvisionalResourceWasAdded: "frame-provisional-resource-was-added",
    ResourceWasAdded: "frame-resource-was-added",
    ResourceWasRemoved: "frame-resource-was-removed",
    AllResourcesRemoved: "frame-all-resources-removed",
    ExtraScriptAdded: "frame-extra-script-added",
    ChildFrameWasAdded: "frame-child-frame-was-added",
    ChildFrameWasRemoved: "frame-child-frame-was-removed",
    AllChildFramesRemoved: "frame-all-child-frames-removed",
    PageExecutionContextChanged: "frame-page-execution-context-changed",
    ExecutionContextAdded: "frame-execution-context-added",
    ExecutionContextsCleared: "frame-execution-contexts-cleared"
};

WI.Frame.TypeIdentifier = "Frame";
WI.Frame.MainResourceURLCookieKey = "frame-main-resource-url";
WI.Frame.IsMainFrameCookieKey = "frame-is-main-frame";
