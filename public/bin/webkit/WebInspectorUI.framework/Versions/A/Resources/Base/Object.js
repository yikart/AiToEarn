/*
 * Copyright (C) 2008, 2013 Apple Inc. All Rights Reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.Object = class WebInspectorObject
{
    constructor()
    {
        this._listeners = null;
    }

    // Static

    static addEventListener(eventType, listener, thisObject)
    {
        console.assert(typeof eventType === "string", this, eventType, listener, thisObject);
        console.assert(typeof listener === "function", this, eventType, listener, thisObject);
        console.assert(typeof thisObject === "object" || window.InspectorTest || window.ProtocolTest, this, eventType, listener, thisObject);

        thisObject ??= this;

        let data = {
            listener,
            thisObjectWeakRef: new WeakRef(thisObject),
        };

        WI.Object._listenerThisObjectFinalizationRegistry.register(thisObject, {eventTargetWeakRef: new WeakRef(this), eventType, data}, data);

        this._listeners ??= new Multimap;
        this._listeners.add(eventType, data);

        console.assert(Array.from(this._listeners.get(eventType)).filter((item) => item.listener === listener && item.thisObjectWeakRef.deref() === thisObject).length === 1, this, eventType, listener, thisObject);

        return listener;
    }

    static singleFireEventListener(eventType, listener, thisObject)
    {
        let eventTargetWeakRef = new WeakRef(this);
        return this.addEventListener(eventType, function wrappedCallback() {
            eventTargetWeakRef.deref()?.removeEventListener(eventType, wrappedCallback, this);
            listener.apply(this, arguments);
        }, thisObject);
    }

    static awaitEvent(eventType, thisObject)
    {
        return new Promise((resolve, reject) => {
            this.singleFireEventListener(eventType, resolve, thisObject);
        });
    }

    static removeEventListener(eventType, listener, thisObject)
    {
        console.assert(this._listeners, this, eventType, listener, thisObject);
        console.assert(typeof eventType === "string", this, eventType, listener, thisObject);
        console.assert(typeof listener === "function", this, eventType, listener, thisObject);
        console.assert(typeof thisObject === "object" || window.InspectorTest || window.ProtocolTest, this, eventType, listener, thisObject);

        if (!this._listeners)
            return;

        thisObject ??= this;

        let listenersForEventType = this._listeners.get(eventType);
        console.assert(listenersForEventType, this, eventType, listener, thisObject);
        if (!listenersForEventType)
            return;

        let didDelete = false;
        for (let data of listenersForEventType) {
            let unwrapped = data.thisObjectWeakRef.deref();
            if (!unwrapped || unwrapped !== thisObject || data.listener !== listener)
                continue;

            if (this._listeners.delete(eventType, data))
                didDelete = true;
            WI.Object._listenerThisObjectFinalizationRegistry.unregister(data);
        }
        console.assert(didDelete, this, eventType, listener, thisObject);
    }

    // Public

    addEventListener() { return WI.Object.addEventListener.apply(this, arguments); }
    singleFireEventListener() { return WI.Object.singleFireEventListener.apply(this, arguments); }
    awaitEvent() { return WI.Object.awaitEvent.apply(this, arguments); }
    removeEventListener() { return WI.Object.removeEventListener.apply(this, arguments); }

    dispatchEventToListeners(eventType, eventData)
    {
        let event = new WI.Event(this, eventType, eventData);

        function dispatch(object)
        {
            if (!object || event._stoppedPropagation)
                return;

            let listeners = object._listeners;
            if (!listeners || !object.hasOwnProperty("_listeners") || !listeners.size)
                return;

            let listenersForEventType = listeners.get(eventType);
            if (!listenersForEventType)
                return;

            // Copy the set of listeners so we don't have to worry about mutating while iterating.
            for (let data of Array.from(listenersForEventType)) {
                let unwrapped = data.thisObjectWeakRef.deref();
                if (!unwrapped)
                    continue;

                data.listener.call(unwrapped, event);

                if (event._stoppedPropagation)
                    break;
            }
        }

        // Dispatch to listeners of this specific object.
        dispatch(this);

        // Allow propagation again so listeners on the constructor always have a crack at the event.
        event._stoppedPropagation = false;

        // Dispatch to listeners on all constructors up the prototype chain, including the immediate constructor.
        let constructor = this.constructor;
        while (constructor) {
            dispatch(constructor);

            if (!constructor.prototype.__proto__)
                break;

            constructor = constructor.prototype.__proto__.constructor;
        }

        return event.defaultPrevented;
    }

    // Test

    static hasEventListeners(eventType)
    {
        console.assert(window.InspectorTest || window.ProtocolTest);
        return this._listeners?.has(eventType);
    }

    static activelyListeningObjectsWithPrototype(proto)
    {
        console.assert(window.InspectorTest || window.ProtocolTest);
        let results = new Set;
        if (this._listeners) {
            for (let data of this._listeners.values()) {
                let unwrapped = data.thisObjectWeakRef.deref();
                if (unwrapped instanceof proto)
                    results.add(unwrapped);
            }
        }
        return results;
    }

    hasEventListeners() { return WI.Object.hasEventListeners.apply(this, arguments); }
    activelyListeningObjectsWithPrototype() { return WI.Object.activelyListeningObjectsWithPrototype.apply(this, arguments); }
};

WI.Object._listenerThisObjectFinalizationRegistry = new FinalizationRegistry((heldValue) => {
    heldValue.eventTargetWeakRef.deref()?._listeners.delete(heldValue.eventType, heldValue.data);
});

WI.Event = class Event
{
    constructor(target, type, data)
    {
        this.target = target;
        this.type = type;
        this.data = data;
        this.defaultPrevented = false;
        this._stoppedPropagation = false;
    }

    stopPropagation()
    {
        this._stoppedPropagation = true;
    }

    preventDefault()
    {
        this.defaultPrevented = true;
    }
};

WI.notifications = new WI.Object;

WI.Notification = {
    GlobalModifierKeysDidChange: "global-modifiers-did-change",
    PageArchiveStarted: "page-archive-started",
    PageArchiveEnded: "page-archive-ended",
    ExtraDomainsActivated: "extra-domains-activated", // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type
    VisibilityStateDidChange: "visibility-state-did-change",
    TransitionPageTarget: "transition-page-target",
};
