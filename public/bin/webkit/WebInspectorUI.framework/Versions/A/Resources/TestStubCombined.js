/* Base/WebInspector.js */

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

var WI = {}; // Namespace
var WebKitAdditions = {};

/* Base/Multimap.js */

/*
 * Copyright (C) 2018-2020 Apple Inc. All rights reserved.
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

class Multimap
{
    constructor(items = [])
    {
        this._map = new Map;

        for (let [key, value] of items)
            this.add(key, value);
    }

    // Public

    get size()
    {
        return this._map.size;
    }

    has(key, value)
    {
        let valueSet = this._map.get(key);
        if (!valueSet)
            return false;
        return value === undefined || valueSet.has(value);
    }

    get(key)
    {
        return this._map.get(key);
    }

    add(key, value)
    {
        let valueSet = this._map.get(key);
        if (!valueSet) {
            valueSet = new Set;
            this._map.set(key, valueSet);
        }
        valueSet.add(value);

        return this;
    }

    delete(key, value)
    {
        // Allow an entire key to be removed by not passing a value.
        if (arguments.length === 1)
            return this._map.delete(key);

        let valueSet = this._map.get(key);
        if (!valueSet)
            return false;

        let deleted = valueSet.delete(value);

        if (!valueSet.size)
            this._map.delete(key);

        return deleted;
    }

    take(key, value)
    {
        // Allow an entire key to be removed by not passing a value.
        if (arguments.length === 1)
            return this._map.take(key);

        let valueSet = this._map.get(key);
        if (!valueSet)
            return undefined;

        let result = valueSet.take(value);
        if (!valueSet.size)
            this._map.delete(key);
        return result;
    }

    clear()
    {
        this._map.clear();
    }

    keys()
    {
        return this._map.keys();
    }

    *values()
    {
        for (let valueSet of this._map.values()) {
            for (let value of valueSet)
                yield value;
        }
    }

    sets()
    {
        return this._map.entries();
    }

    *[Symbol.iterator]()
    {
        for (let [key, valueSet] of this._map) {
            for (let value of valueSet)
                yield [key, value];
        }
    }

    copy()
    {
        return new Multimap(this.toJSON());
    }

    toJSON()
    {
        return Array.from(this);
    }
}

/* Base/Object.js */

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

/* Base/Utilities.js */

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

var emDash = "\u2014";
var enDash = "\u2013";
var figureDash = "\u2012";
var ellipsis = "\u2026";
var zeroWidthSpace = "\u200b";
var multiplicationSign = "\u00d7";

function xor(a, b)
{
    if (a)
        return b ? false : a;
    return b || false;
}

function nullish(value)
{
    return value === null || value === undefined;
}

Object.defineProperty(Object, "shallowCopy",
{
    value(object)
    {
        // Make a new object and copy all the key/values. The values are not copied.
        var copy = {};
        var keys = Object.keys(object);
        for (var i = 0; i < keys.length; ++i)
            copy[keys[i]] = object[keys[i]];
        return copy;
    }
});

Object.defineProperty(Object, "shallowEqual",
{
    value(a, b)
    {
        // Checks if two objects have the same top-level properties.

        if (!(a instanceof Object) || !(b instanceof Object))
            return false;

        if (a === b)
            return true;

        if (Array.shallowEqual(a, b))
            return true;

        if (a.constructor !== b.constructor)
            return false;

        let aKeys = Object.keys(a);
        let bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length)
            return false;

        for (let aKey of aKeys) {
            if (!(aKey in b))
                return false;

            let aValue = a[aKey];
            let bValue = b[aKey];
            if (aValue !== bValue && !Array.shallowEqual(aValue, bValue))
                return false;
        }

        return true;
    }
});

Object.defineProperty(Object, "filter",
{
    value(object, callback)
    {
        let filtered = {};
        for (let key in object) {
            if (callback(key, object[key]))
                filtered[key] = object[key];
        }
        return filtered;
    }
});

Object.defineProperty(Object.prototype, "valueForCaseInsensitiveKey",
{
    value(key)
    {
        if (this.hasOwnProperty(key))
            return this[key];

        var lowerCaseKey = key.toLowerCase();
        for (var currentKey in this) {
            if (currentKey.toLowerCase() === lowerCaseKey)
                return this[currentKey];
        }

        return undefined;
    }
});

Object.defineProperty(Map, "fromObject",
{
    value(object)
    {
        let map = new Map;
        for (let key in object)
            map.set(key, object[key]);
        return map;
    }
});

Object.defineProperty(Map.prototype, "take",
{
    value(key)
    {
        let deletedValue = this.get(key);
        this.delete(key);
        return deletedValue;
    }
});

Object.defineProperty(Map.prototype, "getOrInitialize",
{
    value(key, initialValue)
    {
        console.assert(initialValue !== undefined, "getOrInitialize should not be used with undefined.");

        let value = this.get(key);
        if (value)
            return value;

        if (typeof initialValue === "function")
            initialValue = initialValue();

        console.assert(initialValue !== undefined, "getOrInitialize should not be used with undefined.");

        this.set(key, initialValue);
        return initialValue;
    }
});

Object.defineProperty(WeakMap.prototype, "getOrInitialize",
{
    value(key, initialValue)
    {
        console.assert(initialValue !== undefined, "getOrInitialize should not be used with undefined.");

        let value = this.get(key);
        if (value)
            return value;

        if (typeof initialValue === "function")
            initialValue = initialValue();

        console.assert(initialValue !== undefined, "getOrInitialize should not be used with undefined.");

        this.set(key, initialValue);
        return initialValue;
    }
});

Object.defineProperty(Set.prototype, "find",
{
    value(predicate)
    {
        for (let item of this) {
            if (predicate(item, this))
                return item;
        }
        return undefined;
    },
});

Object.defineProperty(Set.prototype, "filter",
{
    value(callback, thisArg)
    {
        let filtered = new Set;
        for (let item of this) {
            if (callback.call(thisArg, item, item, this))
                filtered.add(item);
        }
        return filtered;
    },
});

Object.defineProperty(Set.prototype, "some",
{
    value(predicate, thisArg)
    {
        for (let item of this) {
            if (predicate.call(thisArg, item, item, this))
                return true;
        }
        return false;
    },
});

Object.defineProperty(Set.prototype, "addAll",
{
    value(iterable)
    {
        for (let item of iterable)
            this.add(item);
    },
});

Object.defineProperty(Set.prototype, "take",
{
    value(key)
    {
        if (this.has(key)) {
            this.delete(key);
            return key;
        }

        return undefined;
    }
});

Object.defineProperty(Set.prototype, "equals",
{
    value(other)
    {
        return this.size === other.size && this.isSubsetOf(other);
    }
});

Object.defineProperty(Set.prototype, "difference",
{
    value(other)
    {
        if (other === this)
            return new Set;

        let result = new Set;
        for (let item of this) {
            if (!other.has(item))
                result.add(item);
        }

        return result;
    }
});

Object.defineProperty(Set.prototype, "firstValue",
{
    get()
    {
        return this.values().next().value;
    }
});

Object.defineProperty(Set.prototype, "lastValue",
{
    get()
    {
        return Array.from(this.values()).lastValue;
    }
});

Object.defineProperty(Set.prototype, "intersects",
{
    value(other)
    {
        if (!this.size || !other.size)
            return false;

        for (let item of this) {
            if (other.has(item))
                return true;
        }

        return false;
    }
});

Object.defineProperty(Set.prototype, "isSubsetOf",
{
    value(other)
    {
        for (let item of this) {
            if (!other.has(item))
                return false;
        }

        return true;
    }
});

Object.defineProperty(Node.prototype, "traverseNextNode",
{
    value(stayWithin)
    {
        var node = this.firstChild;
        if (node)
            return node;

        if (stayWithin && this === stayWithin)
            return null;

        node = this.nextSibling;
        if (node)
            return node;

        node = this;
        while (node && !node.nextSibling && (!stayWithin || !node.parentNode || node.parentNode !== stayWithin))
            node = node.parentNode;
        if (!node)
            return null;

        return node.nextSibling;
    }
});

Object.defineProperty(Node.prototype, "traversePreviousNode",
{
    value(stayWithin)
    {
       if (stayWithin && this === stayWithin)
            return null;
        var node = this.previousSibling;
        while (node && node.lastChild)
            node = node.lastChild;
        if (node)
            return node;
        return this.parentNode;
    }
});


Object.defineProperty(Node.prototype, "rangeOfWord",
{
    value(offset, stopCharacters, stayWithinNode, direction)
    {
        var startNode;
        var startOffset = 0;
        var endNode;
        var endOffset = 0;

        if (!stayWithinNode)
            stayWithinNode = this;

        if (!direction || direction === "backward" || direction === "both") {
            var node = this;
            while (node) {
                if (node === stayWithinNode) {
                    if (!startNode)
                        startNode = stayWithinNode;
                    break;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    let start = node === this ? (offset - 1) : (node.nodeValue.length - 1);
                    for (var i = start; i >= 0; --i) {
                        if (stopCharacters.indexOf(node.nodeValue[i]) !== -1) {
                            startNode = node;
                            startOffset = i + 1;
                            break;
                        }
                    }
                }

                if (startNode)
                    break;

                node = node.traversePreviousNode(stayWithinNode);
            }

            if (!startNode) {
                startNode = stayWithinNode;
                startOffset = 0;
            }
        } else {
            startNode = this;
            startOffset = offset;
        }

        if (!direction || direction === "forward" || direction === "both") {
            node = this;
            while (node) {
                if (node === stayWithinNode) {
                    if (!endNode)
                        endNode = stayWithinNode;
                    break;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    let start = node === this ? offset : 0;
                    for (var i = start; i < node.nodeValue.length; ++i) {
                        if (stopCharacters.indexOf(node.nodeValue[i]) !== -1) {
                            endNode = node;
                            endOffset = i;
                            break;
                        }
                    }
                }

                if (endNode)
                    break;

                node = node.traverseNextNode(stayWithinNode);
            }

            if (!endNode) {
                endNode = stayWithinNode;
                endOffset = stayWithinNode.nodeType === Node.TEXT_NODE ? stayWithinNode.nodeValue.length : stayWithinNode.childNodes.length;
            }
        } else {
            endNode = this;
            endOffset = offset;
        }

        var result = this.ownerDocument.createRange();
        result.setStart(startNode, startOffset);
        result.setEnd(endNode, endOffset);

        return result;

    }
});

Object.defineProperty(Element.prototype, "realOffsetWidth",
{
    get()
    {
        return this.getBoundingClientRect().width;
    }
});

Object.defineProperty(Element.prototype, "realOffsetHeight",
{
    get()
    {
        return this.getBoundingClientRect().height;
    }
});

Object.defineProperty(Element.prototype, "totalOffsetLeft",
{
    get()
    {
        return this.getBoundingClientRect().left;
    }
});

Object.defineProperty(Element.prototype, "totalOffsetRight",
{
    get()
    {
        return this.getBoundingClientRect().right;
    }
});

Object.defineProperty(Element.prototype, "totalOffsetTop",
{
    get()
    {
        return this.getBoundingClientRect().top;
    }
});

Object.defineProperty(Element.prototype, "totalOffsetBottom",
{
    get()
    {
        return this.getBoundingClientRect().bottom;
    }
});

Object.defineProperty(Element.prototype, "removeChildren",
{
    value()
    {
        // This has been tested to be the fastest removal method.
        if (this.firstChild)
            this.textContent = "";
    }
});

Object.defineProperty(Element.prototype, "isInsertionCaretInside",
{
    value()
    {
        var selection = window.getSelection();
        if (!selection.rangeCount || !selection.isCollapsed)
            return false;
        var selectionRange = selection.getRangeAt(0);
        return selectionRange.startContainer === this || this.contains(selectionRange.startContainer);
    }
});

Object.defineProperty(Element.prototype, "createChild",
{
    value(elementName, className)
    {
        var element = this.ownerDocument.createElement(elementName);
        if (className)
            element.className = className;
        this.appendChild(element);
        return element;
    }
});

Object.defineProperty(Element.prototype, "isScrolledToBottom",
{
    value()
    {
        // This code works only for 0-width border
        return this.scrollTop + this.clientHeight === this.scrollHeight;
    }
});

Object.defineProperty(Element.prototype, "recalculateStyles",
{
    value()
    {
        this.ownerDocument.defaultView.getComputedStyle(this);
    }
});

Object.defineProperty(Element.prototype, "getComputedCSSPropertyNumberValue", {
    value(property) {
        let result = undefined;
        result ??= this.computedStyleMap?.().get(property)?.value;
        result ??= window.getComputedStyle(this).getPropertyCSSValue(property)?.getFloatValue(CSSPrimitiveValue.CSS_PX);
        return result;
    },
});

Object.defineProperty(DocumentFragment.prototype, "createChild",
{
    value: Element.prototype.createChild
});

(function() {
    const fontSymbol = Symbol("font");

    Object.defineProperty(HTMLInputElement.prototype, "autosize",
    {
        value(extra = 0)
        {
            extra += 6; // UserAgent styles add 1px padding and 2px border.
            if (this.type === "number")
                extra += 13; // Number input inner spin button width.
            extra += 2; // Add extra pixels for the cursor.

            WI.ImageUtilities.scratchCanvasContext2D((context) => {
                this[fontSymbol] ||= window.getComputedStyle(this).font;

                context.font = this[fontSymbol];
                let textMetrics = context.measureText(this.value || this.placeholder);
                this.style.setProperty("width", (textMetrics.width + extra) + "px");
            });
        },
    });
})();

Object.defineProperty(HTMLCollection.prototype, "indexOf",
{
    value(element)
    {
        let length = this.length;
        for (let i = 0; i < length; ++i) {
            if (this[i] === element)
                return i;
        }
        return -1;
    }
});

Object.defineProperty(Event.prototype, "stop",
{
    value()
    {
        this.stopImmediatePropagation();
        this.preventDefault();
    }
});

Object.defineProperty(KeyboardEvent.prototype, "commandOrControlKey",
{
    get()
    {
        return WI.Platform.name === "mac" ? this.metaKey : this.ctrlKey;
    }
});

Object.defineProperty(MouseEvent.prototype, "commandOrControlKey",
{
    get()
    {
        return WI.Platform.name === "mac" ? this.metaKey : this.ctrlKey;
    }
});

Object.defineProperty(Array, "isTypedArray",
{
    value(array)
    {
        if (!array)
            return false;

        let constructor = array.constructor;
        return constructor === Int8Array
            || constructor === Int16Array
            || constructor === Int32Array
            || constructor === Uint8Array
            || constructor === Uint8ClampedArray
            || constructor === Uint16Array
            || constructor === Uint32Array
            || constructor === window.Float16Array
            || constructor === Float32Array
            || constructor === Float64Array;
    }
});

Object.defineProperty(Array, "shallowEqual",
{
    value(a, b)
    {
        function isArrayLike(x) {
            return Array.isArray(x) || Array.isTypedArray(x);
        }

        if (!isArrayLike(a) || !isArrayLike(b))
            return false;

        if (a === b)
            return true;

        let length = a.length;

        if (length !== b.length)
            return false;

        for (let i = 0; i < length; ++i) {
            if (a[i] === b[i])
                continue;

            if (!Object.shallowEqual(a[i], b[i]))
                return false;
        }

        return true;
    }
});

Object.defineProperty(Array, "diffArrays",
{
    value(initialArray, currentArray, onEach, comparator)
    {
        "use strict";

        function defaultComparator(initial, current) {
            return initial === current;
        }
        comparator = comparator || defaultComparator;

        // Find the shortest prefix of matching items in both arrays.
        //
        //    initialArray = ["a", "b", "b", "c"]
        //    currentArray = ["c", "b", "b", "a"]
        //    findShortestEdit() // [1, 1]
        //
        function findShortestEdit() {
            let deletionCount = initialArray.length;
            let additionCount = currentArray.length;
            let editCount = deletionCount + additionCount;
            for (let i = 0; i < initialArray.length; ++i) {
                if (i > editCount) {
                    // Break since any possible edits at this point are going to be longer than the one already found.
                    break;
                }

                for (let j = 0; j < currentArray.length; ++j) {
                    let newEditCount = i + j;
                    if (newEditCount > editCount) {
                        // Break since any possible edits at this point are going to be longer than the one already found.
                        break;
                    }

                    if (comparator(initialArray[i], currentArray[j])) {
                        // A candidate for the shortest edit found.
                        if (newEditCount < editCount) {
                            editCount = newEditCount;
                            deletionCount = i;
                            additionCount = j;
                        }
                        break;
                    }
                }
            }
            return [deletionCount, additionCount];
        }

        function commonPrefixLength(listA, listB) {
            let shorterListLength = Math.min(listA.length, listB.length);
            let i = 0;
            while (i < shorterListLength) {
                if (!comparator(listA[i], listB[i]))
                    break;
                ++i;
            }
            return i;
        }

        function fireOnEach(count, diffAction, array) {
            for (let i = 0; i < count; ++i)
                onEach(array[i], diffAction);
        }

        while (initialArray.length || currentArray.length) {
            // Remove common prefix.
            let prefixLength = commonPrefixLength(initialArray, currentArray);
            if (prefixLength) {
                fireOnEach(prefixLength, 0, currentArray);
                initialArray = initialArray.slice(prefixLength);
                currentArray = currentArray.slice(prefixLength);
            }

            if (!initialArray.length && !currentArray.length)
                break;

            let [deletionCount, additionCount] = findShortestEdit();
            fireOnEach(deletionCount, -1, initialArray);
            fireOnEach(additionCount, 1, currentArray);
            initialArray = initialArray.slice(deletionCount);
            currentArray = currentArray.slice(additionCount);
        }
    }
});

Object.defineProperty(Array.prototype, "firstValue",
{
    get()
    {
        return this[0];
    }
});

Object.defineProperty(Array.prototype, "lastValue",
{
    get()
    {
        if (!this.length)
            return undefined;
        return this[this.length - 1];
    }
});

Object.defineProperty(Array.prototype, "adjacencies",
{
    value: function*() {
        for (let i = 1; i < this.length; ++i)
            yield [this[i - 1], this[i]];
    }
});

Object.defineProperty(Array.prototype, "remove",
{
    value(value)
    {
        for (let i = 0; i < this.length; ++i) {
            if (this[i] === value) {
                this.splice(i, 1);
                return true;
            }
        }
        return false;
    }
});

Object.defineProperty(Array.prototype, "removeAll",
{
    value(value)
    {
        for (let i = this.length - 1; i >= 0; --i) {
            if (this[i] === value)
                this.splice(i, 1);
        }
    }
});

Object.defineProperty(Array.prototype, "toggleIncludes",
{
    value(value, force)
    {
        let exists = this.includes(value);

        if (force !== undefined && exists === !!force)
            return;

        if (exists)
            this.remove(value);
        else
            this.push(value);
    }
});

Object.defineProperty(Array.prototype, "insertAtIndex",
{
    value(value, index)
    {
        this.splice(index, 0, value);
    }
});

Object.defineProperty(Array.prototype, "pushAll",
{
    value(iterable)
    {
        for (let item of iterable)
            this.push(item);
    },
});

Object.defineProperty(Array.prototype, "partition",
{
    value(callback)
    {
        let positive = [];
        let negative = [];
        for (let i = 0; i < this.length; ++i) {
            let value = this[i];
            if (callback(value))
                positive.push(value);
            else
                negative.push(value);
        }
        return [positive, negative];
    }
});

Object.defineProperty(String.prototype, "isLowerCase",
{
    value()
    {
        return /^[a-z]+$/.test(this);
    }
});

Object.defineProperty(String.prototype, "isUpperCase",
{
    value()
    {
        return /^[A-Z]+$/.test(this);
    }
});

Object.defineProperty(String.prototype, "isJSON",
{
    value(predicate)
    {
        try {
            let json = JSON.parse(this);
            return !predicate || predicate(json);
        } catch { }
        return false;
    }
});

Object.defineProperty(String.prototype, "truncateStart",
{
    value(maxLength)
    {
        "use strict";

        if (this.length <= maxLength)
            return this;
        return ellipsis + this.substr(this.length - maxLength + 1);
    }
});

Object.defineProperty(String.prototype, "truncateMiddle",
{
    value(maxLength)
    {
        "use strict";

        if (this.length <= maxLength)
            return this;
        var leftHalf = maxLength >> 1;
        var rightHalf = maxLength - leftHalf - 1;
        return this.substr(0, leftHalf) + ellipsis + this.substr(this.length - rightHalf, rightHalf);
    }
});

Object.defineProperty(String.prototype, "truncateEnd",
{
    value(maxLength)
    {
        "use strict";

        if (this.length <= maxLength)
            return this;
        return this.substr(0, maxLength - 1) + ellipsis;
    }
});

Object.defineProperty(String.prototype, "truncate",
{
    value(maxLength)
    {
        "use strict";

        if (this.length <= maxLength)
            return this;

        let clipped = this.slice(0, maxLength);
        let indexOfLastWhitespace = clipped.search(/\s\S*$/);
        if (indexOfLastWhitespace > Math.floor(maxLength / 2))
            clipped = clipped.slice(0, indexOfLastWhitespace - 1);

        return clipped + ellipsis;
    }
});

Object.defineProperty(String.prototype, "collapseWhitespace",
{
    value()
    {
        return this.replace(/[\s\xA0]+/g, " ");
    }
});

Object.defineProperty(String.prototype, "removeWhitespace",
{
    value()
    {
        return this.replace(/[\s\xA0]+/g, "");
    }
});

Object.defineProperty(String.prototype, "escapeCharacters",
{
    value(charactersToEscape)
    {
        if (!charactersToEscape)
            return this.valueOf();

        let charactersToEscapeSet = new Set(charactersToEscape);

        let foundCharacter = false;
        for (let c of this) {
            if (!charactersToEscapeSet.has(c))
                continue;
            foundCharacter = true;
            break;
        }

        if (!foundCharacter)
            return this.valueOf();

        let result = "";
        for (let c of this) {
            if (charactersToEscapeSet.has(c))
                result += "\\";
            result += c;
        }

        return result.valueOf();
    }
});

Object.defineProperty(String.prototype, "escapeForRegExp",
{
    value()
    {
        return this.escapeCharacters("^[]{}()\\.$*+?|");
    }
});

Object.defineProperty(String.prototype, "capitalize",
{
    value()
    {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
});

Object.defineProperty(String.prototype, "extendedLocaleCompare",
{
    value(other)
    {
        return this.localeCompare(other, undefined, {numeric: true});
    }
});

Object.defineProperty(String, "tokenizeFormatString",
{
    value(format)
    {
        var tokens = [];
        var substitutionIndex = 0;

        function addStringToken(str)
        {
            tokens.push({type: "string", value: str});
        }

        function addSpecifierToken(specifier, precision, substitutionIndex)
        {
            tokens.push({type: "specifier", specifier, precision, substitutionIndex});
        }

        var index = 0;
        for (var precentIndex = format.indexOf("%", index); precentIndex !== -1; precentIndex = format.indexOf("%", index)) {
            addStringToken(format.substring(index, precentIndex));
            index = precentIndex + 1;

            if (format[index] === "%") {
                addStringToken("%");
                ++index;
                continue;
            }

            if (!isNaN(format[index])) {
                // The first character is a number, it might be a substitution index.
                var number = parseInt(format.substring(index), 10);
                while (!isNaN(format[index]))
                    ++index;

                // If the number is greater than zero and ends with a "$",
                // then this is a substitution index.
                if (number > 0 && format[index] === "$") {
                    substitutionIndex = (number - 1);
                    ++index;
                }
            }

            const defaultPrecision = 6;

            let precision = defaultPrecision;
            if (format[index] === ".") {
                // This is a precision specifier. If no digit follows the ".",
                // then use the default precision of six digits (ISO C99 specification).
                ++index;

                precision = parseInt(format.substring(index), 10);
                if (isNaN(precision))
                    precision = defaultPrecision;

                while (!isNaN(format[index]))
                    ++index;
            }

            addSpecifierToken(format[index], precision, substitutionIndex);

            ++substitutionIndex;
            ++index;
        }

        addStringToken(format.substring(index));

        return tokens;
    }
});

Object.defineProperty(String.prototype, "lineCount",
{
    get()
    {
        "use strict";

        let lineCount = 1;
        let index = 0;
        while (true) {
            index = this.indexOf("\n", index);
            if (index === -1)
                return lineCount;

            index += "\n".length;
            lineCount++;
        }
    }
});

Object.defineProperty(String.prototype, "lastLine",
{
    get()
    {
        "use strict";

        let index = this.lastIndexOf("\n");
        if (index === -1)
            return this;

        return this.slice(index + "\n".length);
    }
});

Object.defineProperty(String.prototype, "hash",
{
    get()
    {
        // Matches the wtf/Hasher.h (SuperFastHash) algorithm.

        // Arbitrary start value to avoid mapping all 0's to all 0's.
        const stringHashingStartValue = 0x9e3779b9;

        var result = stringHashingStartValue;
        var pendingCharacter = null;
        for (var i = 0; i < this.length; ++i) {
            var currentCharacter = this[i].charCodeAt(0);
            if (pendingCharacter === null) {
                pendingCharacter = currentCharacter;
                continue;
            }

            result += pendingCharacter;
            result = (result << 16) ^ ((currentCharacter << 11) ^ result);
            result += result >> 11;

            pendingCharacter = null;
        }

        // Handle the last character in odd length strings.
        if (pendingCharacter !== null) {
            result += pendingCharacter;
            result ^= result << 11;
            result += result >> 17;
        }

        // Force "avalanching" of final 31 bits.
        result ^= result << 3;
        result += result >> 5;
        result ^= result << 2;
        result += result >> 15;
        result ^= result << 10;

        // Prevent 0 and negative results.
        return (0xffffffff + result + 1).toString(36);
    }
});

Object.defineProperty(String, "standardFormatters",
{
    value: {
        d: function(substitution)
        {
            return parseInt(substitution).toLocaleString();
        },

        f: function(substitution, token)
        {
            let value = parseFloat(substitution);
            if (isNaN(value))
                return NaN;

            let options = {
                minimumFractionDigits: token.precision,
                maximumFractionDigits: token.precision,
                useGrouping: false
            };
            return value.toLocaleString(undefined, options);
        },

        s: function(substitution)
        {
            return substitution;
        }
    }
});

Object.defineProperty(String, "format",
{
    value(format, substitutions, formatters, initialValue, append)
    {
        if (!format || !substitutions || !substitutions.length)
            return {formattedResult: append(initialValue, format), unusedSubstitutions: substitutions};

        function prettyFunctionName()
        {
            return "String.format(\"" + format + "\", \"" + Array.from(substitutions).join("\", \"") + "\")";
        }

        function warn(msg)
        {
            console.warn(prettyFunctionName() + ": " + msg);
        }

        function error(msg)
        {
            console.error(prettyFunctionName() + ": " + msg);
        }

        var result = initialValue;
        var tokens = String.tokenizeFormatString(format);
        var usedSubstitutionIndexes = {};
        let ignoredUnknownSpecifierCount = 0;

        for (var i = 0; i < tokens.length; ++i) {
            var token = tokens[i];

            if (token.type === "string") {
                result = append(result, token.value);
                continue;
            }

            if (token.type !== "specifier") {
                error("Unknown token type \"" + token.type + "\" found.");
                continue;
            }

            let substitutionIndex = token.substitutionIndex - ignoredUnknownSpecifierCount;
            if (substitutionIndex >= substitutions.length) {
                // If there are not enough substitutions for the current substitutionIndex
                // just output the format specifier literally and move on.
                error("not enough substitution arguments. Had " + substitutions.length + " but needed " + (substitutionIndex + 1) + ", so substitution was skipped.");
                result = append(result, "%" + (token.precision > -1 ? token.precision : "") + token.specifier);
                continue;
            }

            if (!(token.specifier in formatters)) {
                warn(`Unsupported format specifier "%${token.specifier}" will be ignored.`);
                result = append(result, "%" + token.specifier);
                ++ignoredUnknownSpecifierCount;
                continue;
            }

            usedSubstitutionIndexes[substitutionIndex] = true;
            result = append(result, formatters[token.specifier](substitutions[substitutionIndex], token));
        }

        var unusedSubstitutions = [];
        for (var i = 0; i < substitutions.length; ++i) {
            if (i in usedSubstitutionIndexes)
                continue;
            unusedSubstitutions.push(substitutions[i]);
        }

        return {formattedResult: result, unusedSubstitutions};
    }
});

Object.defineProperty(String.prototype, "format",
{
    value()
    {
        return String.format(this, arguments, String.standardFormatters, "", function(a, b) { return a + b; }).formattedResult;
    }
});

Object.defineProperty(String.prototype, "insertWordBreakCharacters",
{
    value()
    {
        // Add zero width spaces after characters that are good to break after.
        // Otherwise a string with no spaces will not break and overflow its container.
        // This is mainly used on URL strings, so the characters are tailored for URLs.
        return this.replace(/([\/;:\)\]\}&?])/g, "$1\u200b");
    }
});

Object.defineProperty(String.prototype, "removeWordBreakCharacters",
{
    value()
    {
        // Undoes what insertWordBreakCharacters did.
        return this.replace(/\u200b/g, "");
    }
});

Object.defineProperty(String.prototype, "levenshteinDistance",
{
    value(s)
    {
        var m = this.length;
        var n = s.length;
        var d = new Array(m + 1);

        for (var i = 0; i <= m; ++i) {
            d[i] = new Array(n + 1);
            d[i][0] = i;
        }

        for (var j = 0; j <= n; ++j)
            d[0][j] = j;

        for (var j = 1; j <= n; ++j) {
            for (var i = 1; i <= m; ++i) {
                if (this[i - 1] === s[j - 1])
                    d[i][j] = d[i - 1][j - 1];
                else {
                    var deletion = d[i - 1][j] + 1;
                    var insertion = d[i][j - 1] + 1;
                    var substitution = d[i - 1][j - 1] + 1;
                    d[i][j] = Math.min(deletion, insertion, substitution);
                }
            }
        }

        return d[m][n];
    }
});

Object.defineProperty(String.prototype, "toCamelCase",
{
    value()
    {
        return this.toLowerCase().replace(/[^\w]+(\w)/g, (match, group) => group.toUpperCase());
    }
});

Object.defineProperty(String.prototype, "hasMatchingEscapedQuotes",
{
    value()
    {
        return /^\"(?:[^\"\\]|\\.)*\"$/.test(this) || /^\'(?:[^\'\\]|\\.)*\'$/.test(this);
    }
});

Object.defineProperty(Math, "roundTo",
{
    value(num, step)
    {
        return Math.round(num / step) * step;
    }
});

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Matrix_math_for_the_web#Multiplying_a_matrix_and_a_point
Object.defineProperty(Math, "multiplyMatrixByVector",
{
    value(matrix, vector)
    {
        let height = matrix.length;
        let width = matrix[0].length;
        console.assert(width === vector.length);

        let result = Array(width).fill(0);
        for (let i = 0; i < width; ++i) {
            for (let rowIndex = 0; rowIndex < height; ++rowIndex)
                result[i] += vector[rowIndex] * matrix[i][rowIndex];
        }

        return result;
    }
});

Object.defineProperty(Number, "constrain",
{
    value(num, min, max)
    {
        if (isNaN(num) || max < min)
            return min;

        if (num < min)
            num = min;
        else if (num > max)
            num = max;
        return num;
    }
});

Object.defineProperty(Number, "percentageString",
{
    value(fraction, precision = 1)
    {
        return fraction.toLocaleString(undefined, {minimumFractionDigits: precision, style: "percent"});
    }
});

Object.defineProperty(Number, "secondsToMillisecondsString",
{
    value(seconds, higherResolution)
    {
        let ms = seconds * 1000;

        if (higherResolution)
            return WI.UIString("%.2fms").format(ms);
        return WI.UIString("%.1fms").format(ms);
    }
});

Object.defineProperty(Number, "secondsToString",
{
    value(seconds, higherResolution)
    {
        const epsilon = 0.0001;

        let ms = seconds * 1000;
        if (ms < epsilon)
            return WI.UIString("%.0fms").format(0);

        if (Math.abs(ms) < (10 + epsilon)) {
            if (higherResolution)
                return WI.UIString("%.3fms").format(ms);
            return WI.UIString("%.2fms").format(ms);
        }

        if (Math.abs(ms) < (100 + epsilon)) {
            if (higherResolution)
                return WI.UIString("%.2fms").format(ms);
            return WI.UIString("%.1fms").format(ms);
        }

        if (Math.abs(ms) < (1000 + epsilon)) {
            if (higherResolution)
                return WI.UIString("%.1fms").format(ms);
            return WI.UIString("%.0fms").format(ms);
        }

        // Do not go over seconds when in high resolution mode.
        if (higherResolution || Math.abs(seconds) < 60)
            return WI.UIString("%.2fs").format(seconds);

        let minutes = seconds / 60;
        if (Math.abs(minutes) < 60)
            return WI.UIString("%.1fmin").format(minutes);

        let hours = minutes / 60;
        if (Math.abs(hours) < 24)
            return WI.UIString("%.1fhrs").format(hours);

        let days = hours / 24;
        return WI.UIString("%.1f days").format(days);
    }
});

Object.defineProperty(Number, "bytesToString",
{
    value(bytes, higherResolution, bytesThreshold)
    {
        higherResolution ??= true;
        bytesThreshold ??= 1000;

        if (Math.abs(bytes) < bytesThreshold)
            return WI.UIString("%.0f B").format(bytes);

        let kilobytes = bytes / 1000;
        if (Math.abs(kilobytes) < 1000) {
            if (higherResolution || Math.abs(kilobytes) < 10)
                return WI.UIString("%.2f KB").format(kilobytes);
            return WI.UIString("%.1f KB").format(kilobytes);
        }

        let megabytes = kilobytes / 1000;
        if (Math.abs(megabytes) < 1000) {
            if (higherResolution || Math.abs(megabytes) < 10)
                return WI.UIString("%.2f MB").format(megabytes);
            return WI.UIString("%.1f MB").format(megabytes);
        }

        let gigabytes = megabytes / 1000;
        if (higherResolution || Math.abs(gigabytes) < 10)
            return WI.UIString("%.2f GB").format(gigabytes);
        return WI.UIString("%.1f GB").format(gigabytes);
    }
});

Object.defineProperty(Number, "abbreviate",
{
    value(num)
    {
        if (num < 1000)
            return num.toLocaleString();

        if (num < 1_000_000)
            return WI.UIString("%.1fK").format(Math.round(num / 100) / 10);

        if (num < 1_000_000_000)
            return WI.UIString("%.1fM").format(Math.round(num / 100_000) / 10);

        return WI.UIString("%.1fB").format(Math.round(num / 100_000_000) / 10);
    }
});

Object.defineProperty(Number, "zeroPad",
{
    value(num, length)
    {
        let string = num.toLocaleString();
        return string.padStart(length, "0");
    },
});

Object.defineProperty(Number, "countDigits",
{
    value(num)
    {
        if (num === 0)
            return 1;

        num = Math.abs(num);
        return Math.floor(Math.log(num) * Math.LOG10E) + 1;
    }
});

Object.defineProperty(Number.prototype, "maxDecimals",
{
    value(decimals)
    {
        let power = 10 ** decimals;
        return Math.round(this * power) / power;
    }
});

Object.defineProperty(Uint32Array, "isLittleEndian",
{
    value()
    {
        if ("_isLittleEndian" in this)
            return this._isLittleEndian;

        var buffer = new ArrayBuffer(4);
        var longData = new Uint32Array(buffer);
        var data = new Uint8Array(buffer);

        longData[0] = 0x0a0b0c0d;

        this._isLittleEndian = data[0] === 0x0d && data[1] === 0x0c && data[2] === 0x0b && data[3] === 0x0a;

        return this._isLittleEndian;
    }
});

function isEmptyObject(object)
{
    for (var property in object)
        return false;
    return true;
}

function isEnterKey(event)
{
    // Check if this is an IME event.
    return event.keyCode !== 229 && event.keyIdentifier === "Enter";
}

function resolveDotsInPath(path)
{
    if (!path)
        return path;

    if (path.indexOf("./") === -1)
        return path;

    console.assert(path.charAt(0) === "/");

    var result = [];

    var components = path.split("/");
    for (var i = 0; i < components.length; ++i) {
        var component = components[i];

        // Skip over "./".
        if (component === ".")
            continue;

        // Rewind one component for "../".
        if (component === "..") {
            if (result.length === 1)
                continue;
            result.pop();
            continue;
        }

        result.push(component);
    }

    return result.join("/");
}

function parseMIMEType(fullMimeType)
{
    if (!fullMimeType)
        return {type: fullMimeType, boundary: null, encoding: null};

    var typeParts = fullMimeType.split(/\s*;\s*/);
    console.assert(typeParts.length >= 1);

    var type = typeParts[0];
    var boundary = null;
    var encoding = null;

    for (var i = 1; i < typeParts.length; ++i) {
        var subparts = typeParts[i].split(/\s*=\s*/);
        if (subparts.length !== 2)
            continue;

        if (subparts[0].toLowerCase() === "boundary")
            boundary = subparts[1];
        else if (subparts[0].toLowerCase() === "charset")
            encoding = subparts[1].replace("^\"|\"$", ""); // Trim quotes.
    }

    return {type, boundary: boundary || null, encoding: encoding || null};
}

function simpleGlobStringToRegExp(globString, regExpFlags)
{
    // Only supports "*" globs.

    if (!globString)
        return null;

    // Escape everything from String.prototype.escapeForRegExp except "*".
    var regexString = globString.escapeCharacters("^[]{}()\\.$+?|");

    // Unescape all doubly escaped backslashes in front of escaped asterisks.
    // So "\\*" will become "\*" again, undoing escapeCharacters escaping of "\".
    // This makes "\*" match a literal "*" instead of using the "*" for globbing.
    regexString = regexString.replace(/\\\\\*/g, "\\*");

    // The following regex doesn't match an asterisk that has a backslash in front.
    // It also catches consecutive asterisks so they collapse down when replaced.
    var unescapedAsteriskRegex = /(^|[^\\])\*+/g;
    if (unescapedAsteriskRegex.test(globString)) {
        // Replace all unescaped asterisks with ".*".
        regexString = regexString.replace(unescapedAsteriskRegex, "$1.*");

        // Match edge boundaries when there is an asterisk to better meet the expectations
        // of the user. When someone types "*.js" they don't expect "foo.json" to match. They
        // would only expect that if they type "*.js*". We use \b (instead of ^ and $) to allow
        // matches inside paths or URLs, so "ba*.js" will match "foo/bar.js" but not "boo/bbar.js".
        // When there isn't an asterisk the regexString is just a substring search.
        regexString = "\\b" + regexString + "\\b";
    }

    return new RegExp(regexString, regExpFlags);
}

Object.defineProperty(Array.prototype, "min",
{
    value(comparator)
    {
        return this[this.minIndex(comparator)];
    },
});

Object.defineProperty(Array.prototype, "minIndex",
{
    value(comparator)
    {
        function defaultComparator(a, b)
        {
            return a - b;
        }
        comparator = comparator || defaultComparator;

        let minIndex = -1;
        for (let i = 0; i < this.length; ++i) {
            if (minIndex === -1 || comparator(this[minIndex], this[i]) > 0)
                minIndex = i;
        }
        return minIndex;
    },
});

Object.defineProperty(Array.prototype, "lowerBound",
{
    // Return index of the leftmost element that is equal or greater
    // than the specimen object. If there's no such element (i.e. all
    // elements are smaller than the specimen) returns array.length.
    // The function works for sorted array.
    value(object, comparator)
    {
        function defaultComparator(a, b)
        {
            return a - b;
        }
        comparator = comparator || defaultComparator;
        var l = 0;
        var r = this.length;
        while (l < r) {
            var m = (l + r) >> 1;
            if (comparator(object, this[m]) > 0)
                l = m + 1;
            else
                r = m;
        }
        return r;
    }
});

Object.defineProperty(Array.prototype, "upperBound",
{
    // Return index of the leftmost element that is greater
    // than the specimen object. If there's no such element (i.e. all
    // elements are smaller than the specimen) returns array.length.
    // The function works for sorted array.
    value(object, comparator)
    {
        function defaultComparator(a, b)
        {
            return a - b;
        }
        comparator = comparator || defaultComparator;
        var l = 0;
        var r = this.length;
        while (l < r) {
            var m = (l + r) >> 1;
            if (comparator(object, this[m]) >= 0)
                l = m + 1;
            else
                r = m;
        }
        return r;
    }
});

Object.defineProperty(Array.prototype, "binaryIndexOf",
{
    value(value, comparator)
    {
        function defaultComparator(a, b)
        {
            return a - b;
        }
        comparator = comparator || defaultComparator;

        var index = this.lowerBound(value, comparator);
        return index < this.length && comparator(value, this[index]) === 0 ? index : -1;
    }
});

Object.defineProperty(Promise, "chain",
{
    async value(callbacks, initialValue)
    {
        let results = [];
        for (let i = 0; i < callbacks.length; ++i)
            results.push(await callbacks[i](results.lastValue || initialValue || null, i));
        return results;
    }
});

Object.defineProperty(Promise, "delay",
{
    value(delay)
    {
        return new Promise((resolve) => setTimeout(resolve, delay || 0));
    }
});

function appendWebInspectorSourceURL(string)
{
    if (string.includes("//# sourceURL"))
        return string;
    return "\n//# sourceURL=__WebInspectorInternal__\n" + string;
}

function appendWebInspectorConsoleEvaluationSourceURL(string)
{
    if (string.includes("//# sourceURL"))
        return string;
    return "\n//# sourceURL=__WebInspectorConsoleEvaluation__\n" + string;
}

function isWebInspectorBootstrapScript(url)
{
    return url === WI.NetworkManager.bootstrapScriptURL;
}

function isWebInspectorInternalScript(url)
{
    return url === "__WebInspectorInternal__";
}

function isWebInspectorConsoleEvaluationScript(url)
{
    return url === "__WebInspectorConsoleEvaluation__";
}

function isWebKitInjectedScript(url)
{
    return url && url.startsWith("__InjectedScript_") && url.endsWith(".js");
}

function isWebKitInternalScript(url)
{
    if (isWebInspectorConsoleEvaluationScript(url))
        return false;

    if (isWebKitInjectedScript(url))
        return true;

    return url && url.startsWith("__Web") && url.endsWith("__");
}

function isFunctionStringNativeCode(str)
{
    return str.endsWith("{\n    [native code]\n}");
}

function whitespaceRatio(content, start, end)
{
    let whitespaceScore = 0;
    let size = end - start;

    for (let i = start; i < end; i++) {
        let char = content[i];
        if (char === " ")
            whitespaceScore++;
        else if (char === "\t")
            whitespaceScore += 4;
        else if (char === "\n")
            whitespaceScore += 8;
    }

    let ratio = whitespaceScore / size;
    return ratio;
}

function isTextLikelyMinified(content)
{
    const autoFormatMaxCharactersToCheck = 2500;
    const autoFormatWhitespaceRatio = 0.2;

    if (content.length <= autoFormatMaxCharactersToCheck) {
        let ratio = whitespaceRatio(content, 0, content.length);
        return ratio < autoFormatWhitespaceRatio;
    }

    let startRatio = whitespaceRatio(content, 0, autoFormatMaxCharactersToCheck);
    if (startRatio < autoFormatWhitespaceRatio)
        return true;

    let endRatio = whitespaceRatio(content, content.length - autoFormatMaxCharactersToCheck, content.length);
    if (endRatio < autoFormatWhitespaceRatio)
        return true;

    return false;
}

function doubleQuotedString(str)
{
    return JSON.stringify(str);
}

function insertionIndexForObjectInListSortedByFunction(object, list, comparator, insertionIndexAfter)
{
    if (insertionIndexAfter) {
        return list.upperBound(object, comparator);
    } else {
        return list.lowerBound(object, comparator);
    }
}

function insertObjectIntoSortedArray(object, array, comparator)
{
    array.splice(insertionIndexForObjectInListSortedByFunction(object, array, comparator), 0, object);
}

async function retryUntil(predicate, {delay, retries} = {})
{
    retries ??= 100;
    delay ??= 100;

    for (let i = 0; i < retries; ++i) {
        let result = predicate();
        if (result)
            return result;

        await Promise.delay(delay);
    }

    console.assert(false, "retryUntil exceeded the maximum number of retries.", predicate, retries);
    return null;
}

WI.setReentrantCheck = function(object, key)
{
    key = "__checkReentrant_" + key;
    object[key] = (object[key] || 0) + 1;
    return object[key] === 1;
};

WI.clearReentrantCheck = function(object, key)
{
    key = "__checkReentrant_" + key;
    object[key] = (object[key] || 0) - 1;
    return object[key] === 0;
};

/* Models/CallingContextTree.js */

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

WI.CallingContextTree = class CallingContextTree
{
    constructor(type)
    {
        this._type = type || WI.CallingContextTree.Type.TopDown;

        this.reset();
    }

    // Public

    get type() { return this._type; }
    get totalNumberOfSamples() { return this._totalNumberOfSamples; }

    reset()
    {
        this._root = new WI.CallingContextTreeNode(-1, -1, -1, "<root>", null);
        this._totalNumberOfSamples = 0;
    }

    totalDurationInTimeRange(startTime, endTime)
    {
        return this._root.filteredTimestampsAndDuration(startTime, endTime).duration;
    }

    updateTreeWithStackTrace({timestamp, stackFrames}, duration)
    {
        this._totalNumberOfSamples++;

        let node = this._root;
        node.addTimestampAndExpressionLocation(timestamp, duration, null);

        switch (this._type) {
        case WI.CallingContextTree.Type.TopDown:
            for (let i = stackFrames.length; i--; ) {
                let stackFrame = stackFrames[i];
                node = node.findOrMakeChild(stackFrame);
                node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, i === 0);
            }
            break;
        case WI.CallingContextTree.Type.BottomUp:
            for (let i = 0; i < stackFrames.length; ++i) {
                let stackFrame = stackFrames[i];
                node = node.findOrMakeChild(stackFrame);
                node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, i === 0);
            }
            break;
        case WI.CallingContextTree.Type.TopFunctionsTopDown:
            for (let i = stackFrames.length; i--; ) {
                node = this._root;
                for (let j = i + 1; j--; ) {
                    let stackFrame = stackFrames[j];
                    node = node.findOrMakeChild(stackFrame);
                    node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, j === 0);
                }
            }
            break;
        case WI.CallingContextTree.Type.TopFunctionsBottomUp:
            for (let i = 0; i < stackFrames.length; i++) {
                node = this._root;
                for (let j = i; j < stackFrames.length; j++) {
                    let stackFrame = stackFrames[j];
                    node = node.findOrMakeChild(stackFrame);
                    node.addTimestampAndExpressionLocation(timestamp, duration, stackFrame.expressionLocation || null, j === 0);
                }
            }
            break;
        default:
            console.assert(false, "This should not be reached.");
            break;
        }
    }

    toCPUProfilePayload(startTime, endTime)
    {
        let cpuProfile = {};
        let roots = [];
        let numSamplesInTimeRange = this._root.filteredTimestampsAndDuration(startTime, endTime).timestamps.length;

        this._root.forEachChild((child) => {
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                roots.push(child.toCPUProfileNode(numSamplesInTimeRange, startTime, endTime));
        });

        cpuProfile.rootNodes = roots;
        return cpuProfile;
    }

    forEachChild(callback)
    {
        this._root.forEachChild(callback);
    }

    forEachNode(callback)
    {
        this._root.forEachNode(callback);
    }

    // Testing.

    static __test_makeTreeFromProtocolMessageObject(messageObject)
    {
        let tree = new WI.CallingContextTree;
        let stackTraces = messageObject.params.samples.stackTraces;
        for (let i = 0; i < stackTraces.length; i++)
            tree.updateTreeWithStackTrace(stackTraces[i]);
        return tree;
    }

    __test_matchesStackTrace(stackTrace)
    {
        // StackTrace should have top frame first in the array and bottom frame last.
        // We don't look for a match that traces down the tree from the root; instead,
        // we match by looking at all the leafs, and matching while walking up the tree
        // towards the root. If we successfully make the walk, we've got a match that
        // suffices for a particular test. A successful match doesn't mean we actually
        // walk all the way up to the root; it just means we didn't fail while walking
        // in the direction of the root.
        let leaves = this.__test_buildLeafLinkedLists();

        outer:
        for (let node of leaves) {
            for (let stackNode of stackTrace) {
                for (let propertyName of Object.getOwnPropertyNames(stackNode)) {
                    if (stackNode[propertyName] !== node[propertyName])
                        continue outer;
                }
                node = node.parent;
            }
            return true;
        }
        return false;
    }

    __test_buildLeafLinkedLists()
    {
        let result = [];
        let parent = null;
        this._root.__test_buildLeafLinkedLists(parent, result);
        return result;
    }
};

WI.CallingContextTree.Type = {
    TopDown: Symbol("TopDown"),
    BottomUp: Symbol("BottomUp"),
    TopFunctionsTopDown: Symbol("TopFunctionsTopDown"),
    TopFunctionsBottomUp: Symbol("TopFunctionsBottomUp"),
};

/* Models/CallingContextTreeNode.js */

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

WI.CallingContextTreeNode = class CallingContextTreeNode
{
    constructor(sourceID, line, column, name, url, hash)
    {
        this._children = {};
        this._sourceID = sourceID;
        this._line = line;
        this._column = column;
        this._name = name;
        this._url = url;
        this._uid = WI.CallingContextTreeNode.__uid++;

        this._timestamps = [];
        this._durations = [];
        this._leafTimestamps = [];
        this._leafDurations = [];
        this._expressionLocations = {}; // Keys are "line:column" strings. Values are arrays of timestamps in sorted order.

        this._hash = hash || WI.CallingContextTreeNode._hash(this);
    }

    // Static and Private

    static _hash(stackFrame)
    {
        return stackFrame.name + ":" + stackFrame.sourceID + ":" + stackFrame.line + ":" + stackFrame.column;
    }

    // Public

    get sourceID() { return this._sourceID; }
    get line() { return this._line; }
    get column() { return this._column; }
    get name() { return this._name; }
    get uid() { return this._uid; }
    get url() { return this._url; }
    get hash() { return this._hash; }

    hasChildrenInTimeRange(startTime, endTime)
    {
        for (let propertyName of Object.getOwnPropertyNames(this._children)) {
            let child = this._children[propertyName];
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                return true;
        }
        return false;
    }

    hasStackTraceInTimeRange(startTime, endTime)
    {
        console.assert(startTime <= endTime);
        if (startTime > endTime)
            return false;

        let timestamps = this._timestamps;
        let length = timestamps.length;
        if (!length)
            return false;

        let index = timestamps.lowerBound(startTime);
        if (index === length)
            return false;
        console.assert(startTime <= timestamps[index]);

        let hasTimestampInRange = timestamps[index] <= endTime;
        return hasTimestampInRange;
    }

    filteredTimestampsAndDuration(startTime, endTime)
    {
        let lowerIndex = this._timestamps.lowerBound(startTime);
        let upperIndex = this._timestamps.upperBound(endTime);

        let totalDuration = 0;
        for (let i = lowerIndex; i < upperIndex; ++i)
            totalDuration += this._durations[i];

        return {
            timestamps: this._timestamps.slice(lowerIndex, upperIndex),
            duration: totalDuration,
        };
    }

    filteredLeafTimestampsAndDuration(startTime, endTime)
    {
        let lowerIndex = this._leafTimestamps.lowerBound(startTime);
        let upperIndex = this._leafTimestamps.upperBound(endTime);

        let totalDuration = 0;
        for (let i = lowerIndex; i < upperIndex; ++i)
            totalDuration += this._leafDurations[i];

        return {
            leafTimestamps: this._leafTimestamps.slice(lowerIndex, upperIndex),
            leafDuration: totalDuration,
        };
    }

    hasChildren()
    {
        return !isEmptyObject(this._children);
    }

    findOrMakeChild(stackFrame)
    {
        let hash = WI.CallingContextTreeNode._hash(stackFrame);
        let node = this._children[hash];
        if (node)
            return node;
        node = new WI.CallingContextTreeNode(stackFrame.sourceID, stackFrame.line, stackFrame.column, stackFrame.name, stackFrame.url, hash);
        this._children[hash] = node;
        return node;
    }

    addTimestampAndExpressionLocation(timestamp, duration, expressionLocation, leaf)
    {
        console.assert(!this._timestamps.length || this._timestamps.lastValue <= timestamp, "Expected timestamps to be added in sorted, increasing, order.");
        this._timestamps.push(timestamp);
        this._durations.push(duration);

        if (leaf) {
            this._leafTimestamps.push(timestamp);
            this._leafDurations.push(duration);
        }

        if (!expressionLocation)
            return;

        let {line, column} = expressionLocation;
        let hashCons = line + ":" + column;
        let timestamps = this._expressionLocations[hashCons];
        if (!timestamps) {
            timestamps = [];
            this._expressionLocations[hashCons] = timestamps;
        }
        console.assert(!timestamps.length || timestamps.lastValue <= timestamp, "Expected timestamps to be added in sorted, increasing, order.");
        timestamps.push(timestamp);
    }

    forEachChild(callback)
    {
        for (let propertyName of Object.getOwnPropertyNames(this._children))
            callback(this._children[propertyName]);
    }

    forEachNode(callback)
    {
        callback(this);
        this.forEachChild(function(child) {
            child.forEachNode(callback);
        });
    }

    equals(other)
    {
        return this._hash === other.hash;
    }

    toCPUProfileNode(numSamples, startTime, endTime)
    {
        let children = [];
        this.forEachChild((child) => {
            if (child.hasStackTraceInTimeRange(startTime, endTime))
                children.push(child.toCPUProfileNode(numSamples, startTime, endTime));
        });
        let cpuProfileNode = {
            id: this._uid,
            functionName: this._name,
            url: this._url,
            lineNumber: this._line,
            columnNumber: this._column,
            children: children
        };

        let timestamps = [];
        let frameStartTime = Number.MAX_VALUE;
        let frameEndTime = Number.MIN_VALUE;
        for (let i = 0; i < this._timestamps.length; i++) {
            let timestamp = this._timestamps[i];
            if (startTime <= timestamp && timestamp <= endTime) {
                timestamps.push(timestamp);
                frameStartTime = Math.min(frameStartTime, timestamp);
                frameEndTime = Math.max(frameEndTime, timestamp);
            }
        }

        cpuProfileNode.callInfo = {
            callCount: timestamps.length, // Totally not callCount, but oh well, this makes life easier because of field names.
            startTime: frameStartTime,
            endTime: frameEndTime,
            totalTime: (timestamps.length / numSamples) * (endTime - startTime)
        };

        return cpuProfileNode;
    }

    // Testing.

    __test_buildLeafLinkedLists(parent, result)
    {
        let linkedListNode = {
            name: this._name,
            url: this._url,
            parent: parent
        };
        if (this.hasChildren()) {
            this.forEachChild((child) => {
                child.__test_buildLeafLinkedLists(linkedListNode, result);
            });
        } else {
            // We're a leaf.
            result.push(linkedListNode);
        }
    }
};

WI.CallingContextTreeNode.__uid = 0;

/* Models/WrappedPromise.js */

/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

WI.WrappedPromise = class WrappedPromise
{
    constructor(work)
    {
        this._settled = false;
        this._promise = new Promise((resolve, reject) => {
            this._resolveCallback = resolve;
            this._rejectCallback = reject;

            // Allow work to resolve or reject the promise by shimming our
            // internal callbacks. This ensures that this._settled gets set properly.
            if (work && typeof work === "function")
                return work(this.resolve.bind(this), this.reject.bind(this));
        });
    }

    // Public

    get settled()
    {
        return this._settled;
    }

    get promise()
    {
        return this._promise;
    }

    resolve(value)
    {
        if (this._settled)
            throw new Error("Promise is already settled, cannot call resolve().");

        this._settled = true;
        this._resolveCallback(value);
    }

    reject(value)
    {
        if (this._settled)
            throw new Error("Promise is already settled, cannot call reject().");

        this._settled = true;
        this._rejectCallback(value);
    }
};

/* Test/TestSuite.js */

/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

TestSuite = class TestSuite
{
    constructor(harness, name) {
        if (!(harness instanceof TestHarness))
            throw new Error("Must pass the test's harness as the first argument.");

        if (typeof name !== "string" || !name.trim().length)
            throw new Error("Tried to create TestSuite without string suite name.");

        this.name = name;
        this._harness = harness;

        this.testcases = [];
        this.runCount = 0;
        this.failCount = 0;
    }

    // Use this if the test file only has one suite, and no handling
    // of the value returned by runTestCases() is needed.
    runTestCasesAndFinish()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    runTestCases()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    get passCount()
    {
        return this.runCount - (this.failCount - this.skipCount);
    }

    get skipCount()
    {
        if (this.failCount)
            return this.testcases.length - this.runCount;
        else
            return 0;
    }

    addTestCase(testcase)
    {
        if (!testcase || !(testcase instanceof Object))
            throw new Error("Tried to add non-object test case.");

        if (typeof testcase.name !== "string" || !testcase.name.trim().length)
            throw new Error("Tried to add test case without a name.");

        if (typeof testcase.test !== "function")
            throw new Error("Tried to add test case without `test` function.");

        if (testcase.setup && typeof testcase.setup !== "function")
            throw new Error("Tried to add test case with invalid `setup` parameter (must be a function).");

        if (testcase.teardown && typeof testcase.teardown !== "function")
            throw new Error("Tried to add test case with invalid `teardown` parameter (must be a function).");

        this.testcases.push(testcase);
    }

    // Protected

    logThrownObject(e)
    {
        let message = e;
        let stack = "(unknown)";
        if (e instanceof Error) {
            message = e.message;
            if (e.stack)
                stack = e.stack;
        }

        if (typeof message !== "string")
            message = JSON.stringify(message);

        let sanitizedStack = this._harness.sanitizeStack(stack);

        let result = `!! EXCEPTION: ${message}`;
        if (stack)
            result += `\nStack Trace: ${sanitizedStack}`;

        this._harness.log(result);
    }
};

AsyncTestSuite = class AsyncTestSuite extends TestSuite
{
    runTestCasesAndFinish()
    {
        let finish = () => { this._harness.completeTest(); };

        this.runTestCases()
            .then(finish)
            .catch(finish);
    }

    runTestCases()
    {
        if (!this.testcases.length)
            throw new Error("Tried to call runTestCases() for suite with no test cases");
        if (this._startedRunning)
            throw new Error("Tried to call runTestCases() more than once.");

        this._startedRunning = true;

        this._harness.log("");
        this._harness.log(`== Running test suite: ${this.name}`);

        // Avoid adding newlines if nothing was logged.
        let priorLogCount = this._harness.logCount;

        return Promise.resolve().then(() => Promise.chain(this.testcases.map((testcase, i) => () => new Promise(async (resolve, reject) => {
            if (i > 0 && priorLogCount < this._harness.logCount)
                this._harness.log("");
            priorLogCount = this._harness.logCount;

            let hasTimeout = testcase.timeout !== -1;
            let timeoutId = undefined;
            if (hasTimeout) {
                let delay = testcase.timeout || 10000;
                timeoutId = setTimeout(() => {
                    if (!timeoutId)
                        return;

                    timeoutId = undefined;

                    this.failCount++;
                    this._harness.log(`!! TIMEOUT: took longer than ${delay}ms`);

                    resolve();
                }, delay);
            }

            try {
                if (testcase.setup) {
                    this._harness.log("-- Running test setup.");
                    priorLogCount++;

                    if (testcase.setup[Symbol.toStringTag] === "AsyncFunction")
                        await testcase.setup();
                    else
                        await new Promise(testcase.setup);
                }

                this.runCount++;

                this._harness.log(`-- Running test case: ${testcase.name}`);
                priorLogCount++;

                if (testcase.test[Symbol.toStringTag] === "AsyncFunction")
                    await testcase.test();
                else
                    await new Promise(testcase.test);

                if (testcase.teardown) {
                    this._harness.log("-- Running test teardown.");
                    priorLogCount++;

                    if (testcase.teardown[Symbol.toStringTag] === "AsyncFunction")
                        await testcase.teardown();
                    else
                        await new Promise(testcase.teardown);
                }
            } catch (e) {
                this.failCount++;
                this.logThrownObject(e);
            }

            if (!hasTimeout || timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = undefined;

                resolve();
            }
        })))
        // Clear result value.
        .then(() => {}));
    }
};

SyncTestSuite = class SyncTestSuite extends TestSuite
{
    addTestCase(testcase)
    {
        if ([testcase.setup, testcase.teardown, testcase.test].some((fn) => fn && fn[Symbol.toStringTag] === "AsyncFunction"))
            throw new Error("Tried to pass a test case with an async `setup`, `test`, or `teardown` function, but this is a synchronous test suite.");

        super.addTestCase(testcase);
    }

    runTestCasesAndFinish()
    {
        this.runTestCases();
        this._harness.completeTest();
    }

    runTestCases()
    {
        if (!this.testcases.length)
            throw new Error("Tried to call runTestCases() for suite with no test cases");
        if (this._startedRunning)
            throw new Error("Tried to call runTestCases() more than once.");

        this._startedRunning = true;

        this._harness.log("");
        this._harness.log(`== Running test suite: ${this.name}`);

        let priorLogCount = this._harness.logCount;
        for (let i = 0; i < this.testcases.length; i++) {
            let testcase = this.testcases[i];

            if (i > 0 && priorLogCount < this._harness.logCount)
                this._harness.log("");
            priorLogCount = this._harness.logCount;

            try {
                // Run the setup action, if one was provided.
                if (testcase.setup) {
                    this._harness.log("-- Running test setup.");
                    priorLogCount++;

                    let setupResult = testcase.setup();
                    if (setupResult === false) {
                        this._harness.log("!! SETUP FAILED");
                        this.failCount++;
                        continue;
                    }
                }

                this.runCount++;

                this._harness.log(`-- Running test case: ${testcase.name}`);
                priorLogCount++;

                let testResult = testcase.test();
                if (testResult === false) {
                    this.failCount++;
                    continue;
                }

                // Run the teardown action, if one was provided.
                if (testcase.teardown) {
                    this._harness.log("-- Running test teardown.");
                    priorLogCount++;

                    let teardownResult = testcase.teardown();
                    if (teardownResult === false) {
                        this._harness.log("!! TEARDOWN FAILED");
                        this.failCount++;
                        continue;
                    }
                }
            } catch (e) {
                this.failCount++;
                this.logThrownObject(e);
            }
        }

        return true;
    }
};

/* Test/TestHarness.js */

/*
 * Copyright (C) 2015-2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

TestHarness = class TestHarness extends WI.Object
{
    constructor()
    {
        super();

        this._logCount = 0;
        this._failureObjects = new Map;
        this._failureObjectIdentifier = 1;

        // Options that are set per-test for debugging purposes.
        this.forceDebugLogging = false;

        // Options that are set per-test to ensure deterministic output.
        this.suppressStackTraces = false;
    }

    completeTest()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    addResult()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    debugLog()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    // If 'callback' is a function, it will be with the arguments
    // callback(error, result, wasThrown). Otherwise, a promise is
    // returned that resolves with 'result' or rejects with 'error'.

    // The options object accepts the following keys and values:
    // 'remoteObjectOnly': if true, do not unwrap the result payload to a
    // primitive value even if possible. Useful if testing WI.RemoteObject directly.
    evaluateInPage(string, callback, options={})
    {
        throw new Error("Must be implemented by subclasses.");
    }

    debug()
    {
        throw new Error("Must be implemented by subclasses.");
    }

    createAsyncSuite(name)
    {
        return new AsyncTestSuite(this, name);
    }

    createSyncSuite(name)
    {
        return new SyncTestSuite(this, name);
    }

    get logCount()
    {
        return this._logCount;
    }

    log(message)
    {
        ++this._logCount;

        if (this.forceDebugLogging)
            this.debugLog(message);
        else
            this.addResult(message);
    }

    newline()
    {
        this.log("");
    }

    json(object, filter)
    {
        this.log(JSON.stringify(object, filter || null, 2));
    }

    assert(condition, message)
    {
        if (condition)
            return;

        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("ASSERT: " + stringifiedMessage);
    }

    expectThat(actual, message)
    {
        this._expect(TestHarness.ExpectationType.True, !!actual, message, actual);
    }

    expectTrue(actual, message)
    {
        this._expect(TestHarness.ExpectationType.True, !!actual, message, actual);
    }

    expectFalse(actual, message)
    {
        this._expect(TestHarness.ExpectationType.False, !actual, message, actual);
    }

    expectEmpty(actual, message)
    {
        if (Array.isArray(actual) || typeof actual === "string") {
            this._expect(TestHarness.ExpectationType.Empty, !actual.length, message, actual);
            return;
        }

        if (actual instanceof Set || actual instanceof Map) {
            this._expect(TestHarness.ExpectationType.Empty, !actual.size, message, actual);
            return;
        }

        if (typeof actual === "object") {
            this._expect(TestHarness.ExpectationType.Empty, isEmptyObject(actual), message, actual);
            return;
        }

        this.fail("expectEmpty should not be called with a non-object:\n    Actual: " + this._expectationValueAsString(actual));
    }

    expectNotEmpty(actual, message)
    {
        if (Array.isArray(actual) || typeof actual === "string") {
            this._expect(TestHarness.ExpectationType.NotEmpty, !!actual.length, message, actual);
            return;
        }

        if (actual instanceof Set || actual instanceof Map) {
            this._expect(TestHarness.ExpectationType.NotEmpty, !!actual.size, message, actual);
            return;
        }

        if (typeof actual === "object") {
            this._expect(TestHarness.ExpectationType.NotEmpty, !isEmptyObject(actual), message, actual);
            return;
        }

        this.fail("expectNotEmpty should not be called with a non-object:\n    Actual: " + this._expectationValueAsString(actual));
    }

    expectNull(actual, message)
    {
        this._expect(TestHarness.ExpectationType.Null, actual === null, message, actual, null);
    }

    expectNotNull(actual, message)
    {
        this._expect(TestHarness.ExpectationType.NotNull, actual !== null, message, actual);
    }

    expectEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.Equal, expected === actual, message, actual, expected);
    }

    expectNotEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.NotEqual, expected !== actual, message, actual, expected);
    }

    expectShallowEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.ShallowEqual, Object.shallowEqual(actual, expected), message, actual, expected);
    }

    expectNotShallowEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.NotShallowEqual, !Object.shallowEqual(actual, expected), message, actual, expected);
    }

    expectEqualWithAccuracy(actual, expected, accuracy, message)
    {
        console.assert(typeof expected === "number");
        console.assert(typeof actual === "number");

        this._expect(TestHarness.ExpectationType.EqualWithAccuracy, Math.abs(expected - actual) <= accuracy, message, actual, expected, accuracy);
    }

    expectLessThan(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.LessThan, actual < expected, message, actual, expected);
    }

    expectLessThanOrEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.LessThanOrEqual, actual <= expected, message, actual, expected);
    }

    expectGreaterThan(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.GreaterThan, actual > expected, message, actual, expected);
    }

    expectGreaterThanOrEqual(actual, expected, message)
    {
        this._expect(TestHarness.ExpectationType.GreaterThanOrEqual, actual >= expected, message, actual, expected);
    }

    pass(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("PASS: " + stringifiedMessage);
    }

    fail(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);
        this.log("FAIL: " + stringifiedMessage);
    }

    passOrFail(condition, message)
    {
        if (condition)
            this.pass(message);
        else
            this.fail(message);
    }

    // Use this to expect an exception. To further examine the exception,
    // chain onto the result with .then() and add your own test assertions.
    // The returned promise is rejected if an exception was not thrown.
    expectException(work)
    {
        if (typeof work !== "function")
            throw new Error("Invalid argument to catchException: work must be a function.");

        let expectAndDumpError = (e, resolvedValue) => {
            this.expectNotNull(e, "Should produce an exception.");
            if (!e) {
                this.expectEqual(resolvedValue, undefined, "Exception-producing work should not return a value");
                return;
            }

            if (e instanceof Error || !(e instanceof Object))
                this.log(e.toString());
            else {
                try {
                    this.json(e);
                } catch {
                    this.log(e.constructor.name);
                }
            }
        }

        let error = null;
        let result = null;
        try {
            result = work();
        } catch (caughtError) {
            error = caughtError;
        } finally {
            // If 'work' returns a promise, it will settle (resolve or reject) by itself.
            // Invert the promise's settled state to match the expectation of the caller.
            if (result instanceof Promise) {
                return result.then((resolvedValue) => {
                    expectAndDumpError(null, resolvedValue);
                    return Promise.reject(resolvedValue);
                }, (e) => { // Don't chain the .catch as it will log the value we just rejected.
                    expectAndDumpError(e);
                    return Promise.resolve(e);
                });
            }

            // If a promise is not produced, turn the exception into a resolved promise, and a
            // resolved value into a rejected value (since an exception was expected).
            expectAndDumpError(error);
            return error ? Promise.resolve(error) : Promise.reject(result);
        }
    }

    // Protected

    static messageAsString(message)
    {
        if (message instanceof Element)
            return message.textContent;

        return typeof message !== "string" ? JSON.stringify(message) : message;
    }

    static sanitizeURL(url)
    {
        if (!url)
            return "(unknown)";

        let lastPathSeparator = Math.max(url.lastIndexOf("/"), url.lastIndexOf("\\"));
        let location = lastPathSeparator > 0 ? url.substr(lastPathSeparator + 1) : url;
        if (!location.length)
            location = "(unknown)";

        // Clean up the location so it is bracketed or in parenthesis.
        if (url.indexOf("[native code]") !== -1)
            location = "[native code]";

        return location;
    }

    static sanitizeStackFrame(frame, i)
    {
        // Most frames are of the form "functionName@file:///foo/bar/File.js:345".
        // But, some frames do not have a functionName. Get rid of the file path.
        let nameAndURLSeparator = frame.indexOf("@");
        let frameName = nameAndURLSeparator > 0 ? frame.substr(0, nameAndURLSeparator) : "(anonymous)";

        let lastPathSeparator = Math.max(frame.lastIndexOf("/"), frame.lastIndexOf("\\"));
        let frameLocation = lastPathSeparator > 0 ? frame.substr(lastPathSeparator + 1) : frame;
        if (!frameLocation.length)
            frameLocation = "unknown";

        // Clean up the location so it is bracketed or in parenthesis.
        if (frame.indexOf("[native code]") !== -1)
            frameLocation = "[native code]";
        else
            frameLocation = "(" + frameLocation + ")";

        return `#${i}: ${frameName} ${frameLocation}`;
    }

    sanitizeStack(stack)
    {
        if (this.suppressStackTraces)
            return "(suppressed)";

        if (!stack || typeof stack !== "string")
            return "(unknown)";

        return stack.split("\n").map(TestHarness.sanitizeStackFrame).join("\n");
    }

    // Private

    _expect(type, condition, message, ...values)
    {
        console.assert(values.length > 0, "Should have an 'actual' value.");

        if (!message || !condition) {
            values = values.map(this._expectationValueAsString.bind(this));
            message = message || this._expectationMessageFormat(type).format(...values);
        }

        if (condition) {
            this.pass(message);
            return;
        }

        message += "\n    Expected: " + this._expectedValueFormat(type).format(...values.slice(1));
        message += "\n    Actual: " + values[0];

        this.fail(message);
    }

    _expectationValueAsString(value)
    {
        let instanceIdentifier = (object) => {
            let id = this._failureObjects.get(object);
            if (!id) {
                id = this._failureObjectIdentifier++;
                this._failureObjects.set(object, id);
            }
            return "#" + id;
        };

        const maximumValueStringLength = 200;
        const defaultValueString = String(new Object); // [object Object]

        // Special case for numbers, since JSON.stringify converts Infinity and NaN to null.
        if (typeof value === "number")
            return value;

        try {
            let valueString = JSON.stringify(value);
            if (valueString.length <= maximumValueStringLength)
                return valueString;
        } catch { }

        try {
            let valueString = String(value);
            if (valueString === defaultValueString && value.constructor && value.constructor.name !== "Object")
                return value.constructor.name + " instance " + instanceIdentifier(value);
            return valueString;
        } catch {
            return defaultValueString;
        }
    }

    _expectationMessageFormat(type)
    {
        switch (type) {
        case TestHarness.ExpectationType.True:
            return "expectThat(%s)";
        case TestHarness.ExpectationType.False:
            return "expectFalse(%s)";
        case TestHarness.ExpectationType.Empty:
            return "expectEmpty(%s)";
        case TestHarness.ExpectationType.NotEmpty:
            return "expectNotEmpty(%s)";
        case TestHarness.ExpectationType.Null:
            return "expectNull(%s)";
        case TestHarness.ExpectationType.NotNull:
            return "expectNotNull(%s)";
        case TestHarness.ExpectationType.Equal:
            return "expectEqual(%s, %s)";
        case TestHarness.ExpectationType.NotEqual:
            return "expectNotEqual(%s, %s)";
        case TestHarness.ExpectationType.ShallowEqual:
            return "expectShallowEqual(%s, %s)";
        case TestHarness.ExpectationType.NotShallowEqual:
            return "expectNotShallowEqual(%s, %s)";
        case TestHarness.ExpectationType.EqualWithAccuracy:
            return "expectEqualWithAccuracy(%s, %s, %s)";
        case TestHarness.ExpectationType.LessThan:
            return "expectLessThan(%s, %s)";
        case TestHarness.ExpectationType.LessThanOrEqual:
            return "expectLessThanOrEqual(%s, %s)";
        case TestHarness.ExpectationType.GreaterThan:
            return "expectGreaterThan(%s, %s)";
        case TestHarness.ExpectationType.GreaterThanOrEqual:
            return "expectGreaterThanOrEqual(%s, %s)";
        default:
            console.error("Unknown TestHarness.ExpectationType type: " + type);
            return null;
        }
    }

    _expectedValueFormat(type)
    {
        switch (type) {
        case TestHarness.ExpectationType.True:
            return "truthy";
        case TestHarness.ExpectationType.False:
            return "falsey";
        case TestHarness.ExpectationType.Empty:
            return "empty";
        case TestHarness.ExpectationType.NotEmpty:
            return "not empty";
        case TestHarness.ExpectationType.NotNull:
            return "not null";
        case TestHarness.ExpectationType.NotEqual:
        case TestHarness.ExpectationType.NotShallowEqual:
            return "not %s";
        case TestHarness.ExpectationType.EqualWithAccuracy:
            return "%s +/- %s";
        case TestHarness.ExpectationType.LessThan:
            return "less than %s";
        case TestHarness.ExpectationType.LessThanOrEqual:
            return "less than or equal to %s";
        case TestHarness.ExpectationType.GreaterThan:
            return "greater than %s";
        case TestHarness.ExpectationType.GreaterThanOrEqual:
            return "greater than or equal to %s";
        default:
            return "%s";
        }
    }
};

TestHarness.ExpectationType = {
    True: Symbol("expect-true"),
    False: Symbol("expect-false"),
    Empty: Symbol("expect-empty"),
    NotEmpty: Symbol("expect-not-empty"),
    Null: Symbol("expect-null"),
    NotNull: Symbol("expect-not-null"),
    Equal: Symbol("expect-equal"),
    NotEqual: Symbol("expect-not-equal"),
    ShallowEqual: Symbol("expect-shallow-equal"),
    NotShallowEqual: Symbol("expect-not-shallow-equal"),
    EqualWithAccuracy: Symbol("expect-equal-with-accuracy"),
    LessThan: Symbol("expect-less-than"),
    LessThanOrEqual: Symbol("expect-less-than-or-equal"),
    GreaterThan: Symbol("expect-greater-than"),
    GreaterThanOrEqual: Symbol("expect-greater-than-or-equal"),
};

/* Test/ProtocolTestHarness.js */

/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

ProtocolTestHarness = class ProtocolTestHarness extends TestHarness
{
    // TestHarness Overrides

    completeTest()
    {
        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog("completeTest()");

        this.evaluateInPage("TestPage.closeTest();");
    }

    addResult(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        // Unfortunately, every string argument must be escaped because tests are not consistent
        // with respect to escaping with single or double quotes. Some exceptions use single quotes.
        this.evaluateInPage(`TestPage.log(unescape("${escape(stringifiedMessage)}"));`);
    }

    debugLog(message)
    {
        let stringifiedMessage = TestHarness.messageAsString(message);

        if (this.dumpActivityToSystemConsole)
            InspectorFrontendHost.unbufferedLog(stringifiedMessage);

        this.evaluateInPage(`TestPage.debugLog(unescape("${escape(stringifiedMessage)}"));`);
    }

    evaluateInPage(expression, callback)
    {
        let args = {
            method: "Runtime.evaluate",
            params: {expression}
        };

        if (typeof callback === "function")
            InspectorProtocol.sendCommand(args, callback);
        else
            return InspectorProtocol.awaitCommand(args);
    }

    debug()
    {
        this.dumpActivityToSystemConsole = true;
        this.dumpInspectorProtocolMessages = true;
    }
};

/* Test/TestUtilities.js */

/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

//
// This can be used to get a promise for any function that takes a callback.
//
// For example:
//
//    object.getValues(arg1, arg2, (callbackArg1, callbackArg2) => {
//        ...
//    });
//
// Can be promisified like so:
//
//    promisify((cb) => { object.getValues(arg1, arg2, cb); }).then([callbackArg1, callbackArg2]) {
//        ...
//    });
//
// Or more naturally with await:
//
//    let [callbackArg1, callbackArg2] = await promisify((cb) => { object.getValues(arg1, arg2, cb); });
//

function promisify(func) {
    return new Promise((resolve, reject) => {
        try {
            func((...args) => { resolve(args); });
        } catch (e) {
            reject(e);
        }
    });
}

function sanitizeURL(url) {
    return url.replace(/^.*?LayoutTests\//, "");
}

/* Test/InspectorProtocol.js */

/*
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

InspectorProtocol = {};
InspectorProtocol._dispatchTable = [];
InspectorProtocol._placeholderRequestIds = [];
InspectorProtocol._requestId = -1;
InspectorProtocol.eventHandler = {};

InspectorProtocol.sendCommand = function(methodOrObject, params, handler)
{
    // Allow new-style arguments object, as in awaitCommand.
    let method = methodOrObject;
    if (typeof methodOrObject === "object")
        ({method, params, handler} = methodOrObject);
    else if (!params)
        params = {};

    this._dispatchTable[++this._requestId] = handler;
    let messageObject = {method, params, id: this._requestId};
    this._sendMessage(messageObject);

    return this._requestId;
};

InspectorProtocol.awaitCommand = function(args)
{
    let {method, params} = args;
    let messageObject = {method, params, id: ++this._requestId};

    return this.awaitMessage(messageObject);
};

InspectorProtocol.awaitMessage = function(messageObject)
{
    // Send a raw message to the backend. Mostly used to test the backend's error handling.
    return new Promise((resolve, reject) => {
        let requestId = messageObject.id;

        // If the caller did not provide an id, then make one up so that the response
        // can be used to settle a promise.
        if (typeof requestId !== "number") {
            requestId = ++this._requestId;
            this._placeholderRequestIds.push(requestId);
        }

        this._dispatchTable[requestId] = {resolve, reject};
        this._sendMessage(messageObject);
    });
};

InspectorProtocol.awaitEvent = function(args)
{
    let event = args.event;
    if (typeof event !== "string")
        throw new Error("Event must be a string.");

    return new Promise((resolve, reject) => {
        InspectorProtocol.eventHandler[event] = function(message) {
            InspectorProtocol.eventHandler[event] = undefined;
            resolve(message);
        };
    });
};

InspectorProtocol._sendMessage = function(messageObject)
{
    let messageString = typeof messageObject !== "string" ? JSON.stringify(messageObject) : messageObject;

    if (ProtocolTest.dumpInspectorProtocolMessages)
        InspectorFrontendHost.unbufferedLog(`frontend: ${messageString}`);

    InspectorFrontendHost.sendMessageToBackend(messageString);
};

InspectorProtocol.addEventListener = function(eventTypeOrObject, listener)
{
    let event = eventTypeOrObject;
    if (typeof eventTypeOrObject === "object")
        ({event, listener} = eventTypeOrObject);

    if (typeof event !== "string")
        throw new Error("Event name must be a string.");

    if (typeof listener !== "function")
        throw new Error("Event listener must be callable.");

    // Convert to an array of listeners.
    let listeners = InspectorProtocol.eventHandler[event];
    if (!listeners)
        listeners = InspectorProtocol.eventHandler[event] = [];
    else if (typeof listeners === "function")
        listeners = InspectorProtocol.eventHandler[event] = [listeners];

    // Prevent registering multiple times.
    if (listeners.includes(listener))
        throw new Error("Cannot register the same listener more than once.");

    listeners.push(listener);
    return listener;
};

InspectorProtocol.removeEventListener = function(eventTypeOrObject, listener)
{
    let event = eventTypeOrObject;
    if (typeof eventTypeOrObject === "object")
        ({event, listener} = eventTypeOrObject);

    if (typeof event !== "string")
        throw new Error("Event name must be a string.");

    if (typeof listener !== "function")
        throw new Error("Event listener must be callable.");

    // Convert to an array of listeners.
    let listeners = InspectorProtocol.eventHandler[event];
    if (!listeners)
        return;

    listeners.removeAll(listener);
};

InspectorProtocol.checkForError = function(responseObject)
{
    if (responseObject.error) {
        ProtocolTest.log("PROTOCOL ERROR: " + JSON.stringify(responseObject.error));
        ProtocolTest.completeTest();
        throw "PROTOCOL ERROR";
    }
};

InspectorProtocol.dispatchMessageFromBackend = function(messageObject)
{
    // This matches the debug dumping in InspectorBackend, which is bypassed
    // by InspectorProtocol. Return messages should be dumped by InspectorBackend.
    if (ProtocolTest.dumpInspectorProtocolMessages)
        InspectorFrontendHost.unbufferedLog("backend: " + JSON.stringify(messageObject));

    // If the message has an id, then it is a reply to a command.
    let messageId = messageObject.id;

    // If the id is 'null', then it may be an error response.
    if (messageId === null)
        messageId = InspectorProtocol._placeholderRequestIds.shift();

    // If we could figure out a requestId, then dispatch the message.
    if (typeof messageId === "number") {
        let handler = InspectorProtocol._dispatchTable[messageId];
        if (!handler)
            return;

        if (typeof handler === "function")
            handler(messageObject);
        else if (typeof handler === "object") {
            let {resolve, reject} = handler;
            if ("error" in messageObject)
                reject(messageObject.error);
            else
                resolve(messageObject.result);
        }
    } else {
        // Otherwise, it is an event.
        let eventName = messageObject["method"];
        let handler = InspectorProtocol.eventHandler[eventName];
        if (!handler)
            return;

        if (typeof handler === "function")
            handler(messageObject);
        else if (handler instanceof Array) {
            handler.map((listener) => { listener.call(null, messageObject); });
        } else if (typeof handler === "object") {
            let {resolve, reject} = handler;
            if ("error" in messageObject)
                reject(messageObject.error);
            else
                resolve(messageObject.result);
        }
    }
};

/* Test/TestStub.js */

/*
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

InspectorFrontendAPI = {};
InspectorFrontendAPI.dispatch = function () { };
InspectorFrontendAPI.dispatchMessageAsync = InspectorProtocol.dispatchMessageFromBackend;

window.ProtocolTest = new ProtocolTestHarness();

document.addEventListener("DOMContentLoaded", (event) => {
    InspectorFrontendHost.loaded();
});

window.addEventListener("message", (event) => {
    try {
        eval(event.data);
    } catch (e) {
        alert(e.stack);
        ProtocolTest.completeTest();
        throw e;
    }
});
