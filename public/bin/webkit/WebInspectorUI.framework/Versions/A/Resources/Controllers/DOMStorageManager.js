/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
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

// FIXME: DOMStorageManager lacks advanced multi-target support. (DOMStorage per-target)

WI.DOMStorageManager = class DOMStorageManager extends WI.Object
{
    constructor()
    {
        super();

        this._enabled = false;
        this._reset();
    }

    // Agent

    get domains() { return ["DOMStorage"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "DOMStorage");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        if (target.hasDomain("DOMStorage"))
            target.DOMStorageAgent.enable();
    }

    // Public

    get domStorageObjects() { return this._domStorageObjects; }

    get cookieStorageObjects()
    {
        var cookieStorageObjects = [];
        for (var host in this._cookieStorageObjects)
            cookieStorageObjects.push(this._cookieStorageObjects[host]);
        return cookieStorageObjects;
    }

    enable()
    {
        console.assert(!this._enabled);

        this._enabled = true;

        this._reset();

        for (let target of WI.targets)
            this.initializeTarget(target);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.SecurityOriginDidChange, this._securityOriginDidChange, this);
    }

    disable()
    {
        console.assert(this._enabled);

        this._enabled = false;

        for (let target of WI.targets) {
            if (target.hasDomain("DOMStorage"))
                target.DOMStorageAgent.disable();
        }

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.removeEventListener(WI.Frame.Event.SecurityOriginDidChange, this._securityOriginDidChange, this);

        this._reset();
    }

    // DOMStorageObserver

    itemsCleared(storageId)
    {
        console.assert(this._enabled);

        let domStorage = this._domStorageForIdentifier(storageId);
        if (domStorage)
            domStorage.itemsCleared(storageId);
    }

    itemRemoved(storageId, key)
    {
        console.assert(this._enabled);

        let domStorage = this._domStorageForIdentifier(storageId);
        if (domStorage)
            domStorage.itemRemoved(key);
    }

    itemAdded(storageId, key, value)
    {
        console.assert(this._enabled);

        let domStorage = this._domStorageForIdentifier(storageId);
        if (domStorage)
            domStorage.itemAdded(key, value);
    }

    itemUpdated(storageId, key, oldValue, newValue)
    {
        console.assert(this._enabled);

        let domStorage = this._domStorageForIdentifier(storageId);
        if (domStorage)
            domStorage.itemUpdated(key, oldValue, newValue);
    }

    // InspectorObserver

    inspectDOMStorage(id)
    {
        console.assert(this._enabled);

        var domStorage = this._domStorageForIdentifier(id);
        console.assert(domStorage);
        if (!domStorage)
            return;
        this.dispatchEventToListeners(WI.DOMStorageManager.Event.DOMStorageObjectWasInspected, {domStorage});
    }

    // Private

    _reset()
    {
        this._domStorageObjects = [];
        this._cookieStorageObjects = {};

        this.dispatchEventToListeners(DOMStorageManager.Event.Cleared);

        let mainFrame = WI.networkManager.mainFrame;
        if (mainFrame) {
            this._addDOMStorageIfNeeded(mainFrame);
            this._addCookieStorageIfNeeded(mainFrame);
        }
    }

    _domStorageForIdentifier(id)
    {
        for (var storageObject of this._domStorageObjects) {
            // The id is an object, so we need to compare the properties using Object.shallowEqual.
            if (Object.shallowEqual(storageObject.id, id))
                return storageObject;
        }

        return null;
    }

    _addDOMStorageIfNeeded(frame)
    {
        if (!this._enabled)
            return;

        if (!InspectorBackend.hasDomain("DOMStorage"))
            return;

        // Don't show storage if we don't have a security origin (about:blank).
        if (!frame.securityOrigin || frame.securityOrigin === "://")
            return;

        // FIXME: Consider passing the other parts of the origin along.

        let addDOMStorage = (isLocalStorage) => {
            let identifier = {securityOrigin: frame.securityOrigin, isLocalStorage};
            if (this._domStorageForIdentifier(identifier))
                return;

            let domStorage = new WI.DOMStorageObject(identifier, frame.mainResource.urlComponents.host, identifier.isLocalStorage);
            this._domStorageObjects.push(domStorage);
            this.dispatchEventToListeners(DOMStorageManager.Event.DOMStorageObjectWasAdded, {domStorage});
        };
        addDOMStorage(true);
        addDOMStorage(false);
    }

    _addCookieStorageIfNeeded(frame)
    {
        if (!this._enabled)
            return;

        if (!InspectorBackend.hasCommand("Page.getCookies"))
            return;

        // Add the host of the frame that changed the main resource to the list of hosts there could be cookies for.
        let host = parseURL(frame.url).host;
        if (!host)
            return;

        if (this._cookieStorageObjects[host])
            return;

        this._cookieStorageObjects[host] = new WI.CookieStorageObject(host);
        this.dispatchEventToListeners(WI.DOMStorageManager.Event.CookieStorageObjectWasAdded, {cookieStorage: this._cookieStorageObjects[host]});
    }

    _mainResourceDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);

        if (event.target.isMainFrame()) {
            this._reset();
            return;
        }

        this._addCookieStorageIfNeeded(event.target);
    }

    _securityOriginDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);

        this._addDOMStorageIfNeeded(event.target);
    }
};

WI.DOMStorageManager.Event = {
    CookieStorageObjectWasAdded: "dom-storage-manager-cookie-storage-object-was-added",
    DOMStorageObjectWasAdded: "dom-storage-manager-dom-storage-object-was-added",
    DOMStorageObjectWasInspected: "dom-storage-manager-dom-storage-object-was-inspected",
    Cleared: "dom-storage-manager-cleared",
};
