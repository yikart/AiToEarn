/*
 * Copyright (C) 2009 Google Inc. All rights reserved.
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.RemoteObject = class RemoteObject
{
    constructor(target, objectId, type, subtype, value, description, size, classPrototype, className, preview)
    {
        console.assert(type);
        console.assert(!preview || preview instanceof WI.ObjectPreview);
        console.assert(!target || target instanceof WI.Target);

        this._target = target || WI.mainTarget;
        this._type = type;
        this._subtype = subtype;

        if (objectId) {
            // Object, Function, or Symbol.
            console.assert(!subtype || typeof subtype === "string");
            console.assert(!description || typeof description === "string");
            console.assert(!value);

            this._objectId = objectId;
            this._description = description || "";
            this._hasChildren = type !== "symbol";
            this._size = size;
            this._classPrototype = classPrototype;
            this._preview = preview;

            if (subtype === "class") {
                this._functionDescription = this._description;
                this._description = "class " + className;
            }
        } else {
            // Primitive, BigInt, or null.
            console.assert(type !== "object" || value === null);
            console.assert(!preview);

            this._description = description || (value + "");
            this._hasChildren = false;
            this._value = value;

            if (type === "bigint") {
                console.assert(value === undefined);
                console.assert(description.endsWith("n"));
                if (window.BigInt)
                    this._value = BigInt(description.substring(0, description.length - 1));
                else
                    this._value = `${description} [BigInt Not Enabled in Web Inspector]`;
            }
        }
    }

    // Static

    static createFakeRemoteObject()
    {
        return new WI.RemoteObject(undefined, WI.RemoteObject.FakeRemoteObjectId, "object");
    }

    static fromPrimitiveValue(value)
    {
        return new WI.RemoteObject(undefined, undefined, typeof value, undefined, value, undefined, undefined, undefined, undefined);
    }

    static createBigIntFromDescriptionString(description)
    {
        console.assert(description.endsWith("n"));

        return new WI.RemoteObject(undefined, undefined, "bigint", undefined, undefined, description, undefined, undefined, undefined);
    }

    static fromPayload(payload, target)
    {
        console.assert(typeof payload === "object", "Remote object payload should only be an object");

        if (payload.classPrototype)
            payload.classPrototype = WI.RemoteObject.fromPayload(payload.classPrototype, target);

        if (payload.preview)
            payload.preview = WI.ObjectPreview.fromPayload(payload.preview);

        return new WI.RemoteObject(target, payload.objectId, payload.type, payload.subtype, payload.value, payload.description, payload.size, payload.classPrototype, payload.className, payload.preview);
    }

    static createCallArgument(valueOrObject)
    {
        if (valueOrObject instanceof WI.RemoteObject) {
            if (valueOrObject.objectId)
                return {objectId: valueOrObject.objectId};
            return {value: valueOrObject.value};
        }

        return {value: valueOrObject};
    }

    static resolveNode(node, objectGroup)
    {
        console.assert(node instanceof WI.DOMNode, node);

        if (node.destroyed)
            return Promise.reject("ERROR: node is destroyed");

        let target = WI.assumingMainTarget();
        return target.DOMAgent.resolveNode(node.id, objectGroup)
            .then(({object}) => WI.RemoteObject.fromPayload(object, WI.mainTarget));
    }

    static resolveWebSocket(webSocketResource, objectGroup, callback)
    {
        console.assert(typeof callback === "function");

        let target = WI.assumingMainTarget();
        target.NetworkAgent.resolveWebSocket(webSocketResource.requestIdentifier, objectGroup, (error, object) => {
            if (error || !object)
                callback(null);
            else
                callback(WI.RemoteObject.fromPayload(object, webSocketResource.target));
        });
    }

    static resolveCanvasContext(canvas, objectGroup)
    {
        let promise = null;

        // COMPATIBILITY (iOS 13): Canvas.resolveCanvasContext was renamed to Canvas.resolveContext.
        if (!canvas.target.hasCommand("Canvas.resolveContext"))
            promise = canvas.target.CanvasAgent.resolveCanvasContext(canvas.identifier, objectGroup);
        else
            promise = canvas.target.CanvasAgent.resolveContext(canvas.identifier, objectGroup);

        return promise.then(({object}) => WI.RemoteObject.fromPayload(object, canvas.target));
    }

    static resolveAnimation(animation, objectGroup, callback)
    {
        console.assert(typeof callback === "function");

        function wrapCallback(error, object) {
            if (error || !object)
                callback(null);
            else
                callback(WI.RemoteObject.fromPayload(object, WI.mainTarget));
        }

        let target = WI.assumingMainTarget();

        // COMPATIBILITY (iOS 13.1): Animation.resolveAnimation did not exist yet.
        console.assert(target.hasCommand("Animation.resolveAnimation"));

        target.AnimationAgent.resolveAnimation(animation.animationId, objectGroup, wrapCallback);
    }

    // Public

    get target()
    {
        return this._target;
    }

    get objectId()
    {
        return this._objectId;
    }

    get type()
    {
        return this._type;
    }

    get subtype()
    {
        return this._subtype;
    }

    get description()
    {
        return this._description;
    }

    get functionDescription()
    {
        console.assert(this.type === "function");

        return this._functionDescription || this._description;
    }

    get hasChildren()
    {
        return this._hasChildren;
    }

    get value()
    {
        return this._value;
    }

    get size()
    {
        return this._size || 0;
    }

    get classPrototype()
    {
        return this._classPrototype;
    }

    get preview()
    {
        return this._preview;
    }

    hasSize()
    {
        return this.isArray() || this.isCollectionType();
    }

    hasValue()
    {
        return "_value" in this;
    }

    canLoadPreview()
    {
        if (this._failedToLoadPreview)
            return false;

        if (this._type !== "object")
            return false;

        if (!this._objectId || this._isSymbol() || this._isFakeObject())
            return false;

        return true;
    }

    updatePreview(callback)
    {
        if (!this.canLoadPreview()) {
            callback(null);
            return;
        }

        if (!this._target.hasCommand("Runtime.getPreview")) {
            this._failedToLoadPreview = true;
            callback(null);
            return;
        }

        this._target.RuntimeAgent.getPreview(this._objectId, (error, payload) => {
            if (error) {
                this._failedToLoadPreview = true;
                callback(null);
                return;
            }

            this._preview = WI.ObjectPreview.fromPayload(payload);
            callback(this._preview);
        });
    }

    getPropertyDescriptors(callback, options = {})
    {
        if (!this._objectId || this._isSymbol() || this._isFakeObject()) {
            callback([]);
            return;
        }

        this._getProperties(this._getPropertyDescriptorsResolver.bind(this, callback), options);
    }

    getDisplayablePropertyDescriptors(callback, options = {})
    {
        if (!this._objectId || this._isSymbol() || this._isFakeObject()) {
            callback([]);
            return;
        }

        this._getDisplayableProperties(this._getPropertyDescriptorsResolver.bind(this, callback), options);
    }

    setPropertyValue(name, value, callback)
    {
        if (!this._objectId || this._isSymbol() || this._isFakeObject()) {
            callback("Can't set a property of non-object.");
            return;
        }

        // FIXME: It doesn't look like setPropertyValue is used yet. This will need to be tested when it is again (editable ObjectTrees).
        this._target.RuntimeAgent.evaluate.invoke({expression: appendWebInspectorSourceURL(value), doNotPauseOnExceptionsAndMuteConsole: true}, evaluatedCallback.bind(this));

        function evaluatedCallback(error, result, wasThrown)
        {
            if (error || wasThrown) {
                callback(error || result.description);
                return;
            }

            function setPropertyValue(propertyName, propertyValue)
            {
                this[propertyName] = propertyValue;
            }

            delete result.description; // Optimize on traffic.

            this._target.RuntimeAgent.callFunctionOn(this._objectId, appendWebInspectorSourceURL(setPropertyValue.toString()), [{value: name}, result], true, undefined, propertySetCallback.bind(this));

            if (result._objectId)
                this._target.RuntimeAgent.releaseObject(result._objectId);
        }

        function propertySetCallback(error, result, wasThrown)
        {
            if (error || wasThrown) {
                callback(error || result.description);
                return;
            }

            callback();
        }
    }

    isUndefined()
    {
        return this._type === "undefined";
    }

    isNode()
    {
        return this._subtype === "node";
    }

    isArray()
    {
        return this._subtype === "array";
    }

    isClass()
    {
        return this._subtype === "class";
    }

    isCollectionType()
    {
        return this._subtype === "map" || this._subtype === "set" || this._subtype === "weakmap" || this._subtype === "weakset";
    }

    isWeakCollection()
    {
        return this._subtype === "weakmap" || this._subtype === "weakset";
    }

    getCollectionEntries(callback, {fetchStart, fetchCount} = {})
    {
        console.assert(this.isCollectionType());
        console.assert(typeof fetchStart === "undefined" || (typeof fetchStart === "number" && fetchStart >= 0), fetchStart);
        console.assert(typeof fetchCount === "undefined" || (typeof fetchCount === "number" && fetchCount > 0), fetchCount);

        // WeakMaps and WeakSets are not ordered. We should never send a non-zero start.
        console.assert(!this.isWeakCollection() || typeof fetchStart === "undefined" || fetchStart === 0, fetchStart);

        let objectGroup = this.isWeakCollection() ? this._weakCollectionObjectGroup() : "";

        // COMPATIBILITY (iOS 13): `startIndex` and `numberToFetch` were renamed to `fetchStart` and `fetchCount` (but kept in the same position).
        this._target.RuntimeAgent.getCollectionEntries(this._objectId, objectGroup, fetchStart, fetchCount, (error, entries) => {
            callback(entries.map((x) => WI.CollectionEntry.fromPayload(x, this._target)));
        });
    }

    releaseWeakCollectionEntries()
    {
        console.assert(this.isWeakCollection());

        this._target.RuntimeAgent.releaseObjectGroup(this._weakCollectionObjectGroup());
    }

    pushNodeToFrontend(callback)
    {
        if (this._objectId && InspectorBackend.hasCommand("DOM.requestNode"))
            WI.domManager.pushNodeToFrontend(this._objectId, callback);
        else
            callback(0);
    }

    async fetchProperties(propertyNames, resultObject = {})
    {
        let seenPropertyNames = new Set;
        let requestedValues = [];
        for (let propertyName of propertyNames) {
            // Check this here, otherwise things like '{}' would be valid Set keys.
            if (typeof propertyName !== "string" && typeof propertyName !== "number")
                throw new Error(`Tried to get property using key is not a string or number: ${propertyName}`);

            if (seenPropertyNames.has(propertyName))
                continue;

            seenPropertyNames.add(propertyName);
            requestedValues.push(this.getProperty(propertyName));
        }

        // Return primitive values directly, otherwise return a WI.RemoteObject instance.
        function maybeUnwrapValue(remoteObject) {
            return remoteObject.hasValue() ? remoteObject.value : remoteObject;
        }

        // Request property values one by one, since returning an array of property
        // values would then be subject to arbitrary object preview size limits.
        let fetchedKeys = Array.from(seenPropertyNames);
        let fetchedValues = await Promise.all(requestedValues);
        for (let i = 0; i < fetchedKeys.length; ++i)
            resultObject[fetchedKeys[i]] = maybeUnwrapValue(fetchedValues[i]);

        return resultObject;
    }

    getProperty(propertyName, callback = null)
    {
        function inspectedPage_object_getProperty(property) {
            if (typeof property !== "string" && typeof property !== "number")
                throw new Error(`Tried to get property using key is not a string or number: ${property}`);

            return this[property];
        }

        if (callback && typeof callback === "function")
            this.callFunction(inspectedPage_object_getProperty, [propertyName], true, callback);
        else
            return this.callFunction(inspectedPage_object_getProperty, [propertyName], true);
    }

    callFunction(functionDeclaration, args, generatePreview, callback = null)
    {
        let translateResult = (result) => result ? WI.RemoteObject.fromPayload(result, this._target) : null;

        if (args)
            args = args.map(WI.RemoteObject.createCallArgument);

        if (callback && typeof callback === "function") {
            this._target.RuntimeAgent.callFunctionOn(this._objectId, appendWebInspectorSourceURL(functionDeclaration.toString()), args, true, undefined, !!generatePreview, (error, result, wasThrown) => {
                callback(error, translateResult(result), wasThrown);
            });
        } else {
            // Protocol errors and results that were thrown should cause promise rejection with the same.
            return this._target.RuntimeAgent.callFunctionOn(this._objectId, appendWebInspectorSourceURL(functionDeclaration.toString()), args, true, undefined, !!generatePreview)
                .then(({result, wasThrown}) => {
                    result = translateResult(result);
                    if (result && wasThrown)
                        return Promise.reject(result);
                    return Promise.resolve(result);
                });
        }
    }

    callFunctionJSON(functionDeclaration, args, callback = null)
    {
        if (callback && typeof callback === "function") {
            this._target.RuntimeAgent.callFunctionOn(this._objectId, appendWebInspectorSourceURL(functionDeclaration.toString()), args, true, true, (error, result, wasThrown) => {
                callback((error || wasThrown) ? null : result.value);
            });
        } else {
            return this._target.RuntimeAgent.callFunctionOn(this._objectId, appendWebInspectorSourceURL(functionDeclaration.toString()), args, true, true)
                .then(({result, wasThrown}) => {
                    return wasThrown ? null : result.value;
                });
        }
    }

    invokeGetter(getterRemoteObject, callback)
    {
        console.assert(getterRemoteObject instanceof WI.RemoteObject);

        function backendInvokeGetter(getter)
        {
            return getter ? getter.call(this) : undefined;
        }

        this.callFunction(backendInvokeGetter, [getterRemoteObject], true, callback);
    }

    getOwnPropertyDescriptor(propertyName, callback)
    {
        function backendGetOwnPropertyDescriptor(propertyName)
        {
            return this[propertyName];
        }

        function wrappedCallback(error, result, wasThrown)
        {
            if (error || wasThrown || !(result instanceof WI.RemoteObject)) {
                callback(null);
                return;
            }

            var fakeDescriptor = {name: propertyName, value: result, writable: true, configurable: true};
            var fakePropertyDescriptor = new WI.PropertyDescriptor(fakeDescriptor, null, true, false, false, false);
            callback(fakePropertyDescriptor);
        }

        // FIXME: Implement a real RuntimeAgent.getOwnPropertyDescriptor?
        this.callFunction(backendGetOwnPropertyDescriptor, [propertyName], false, wrappedCallback.bind(this));
    }

    release()
    {
        if (this._objectId && !this._isFakeObject())
            this._target.RuntimeAgent.releaseObject(this._objectId);
    }

    arrayLength()
    {
        if (this._subtype !== "array")
            return 0;

        var matches = this._description.match(/\[([0-9]+)\]/);
        if (!matches)
            return 0;

        return parseInt(matches[1], 10);
    }

    asCallArgument()
    {
        return WI.RemoteObject.createCallArgument(this);
    }

    findFunctionSourceCodeLocation()
    {
        var result = new WI.WrappedPromise;

        if (!this._isFunction() || !this._objectId) {
            result.resolve(WI.RemoteObject.SourceCodeLocationPromise.MissingObjectId);
            return result.promise;
        }

        this._target.DebuggerAgent.getFunctionDetails(this._objectId, (error, response) => {
            if (error) {
                result.resolve(WI.RemoteObject.SourceCodeLocationPromise.NoSourceFound);
                return;
            }

            var location = response.location;
            var sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, this._target);

            if (!sourceCode || (!WI.settings.engineeringShowInternalScripts.value && isWebKitInternalScript(sourceCode.sourceURL))) {
                result.resolve(WI.RemoteObject.SourceCodeLocationPromise.NoSourceFound);
                return;
            }

            var sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber || 0);
            result.resolve(sourceCodeLocation);
        });

        return result.promise;
    }

    // Private

    _isFakeObject()
    {
        return this._objectId === WI.RemoteObject.FakeRemoteObjectId;
    }

    _isSymbol()
    {
        return this._type === "symbol";
    }

    _isFunction()
    {
        return this._type === "function";
    }

    _weakCollectionObjectGroup()
    {
        return JSON.stringify(this._objectId) + "-" + this._subtype;
    }

    _getProperties(callback, {ownProperties, fetchStart, fetchCount, generatePreview} = {})
    {
        // COMPATIBILITY (iOS 13): `result` was renamed to `properties` (but kept in the same position).
        this._target.RuntimeAgent.getProperties.invoke({
            objectId: this._objectId,
            ownProperties,
            fetchStart,
            fetchCount,
            generatePreview,
        }, callback);
    }

    _getDisplayableProperties(callback, {fetchStart, fetchCount, generatePreview} = {})
    {
        console.assert(this._target.hasCommand("Runtime.getDisplayableProperties"));

        this._target.RuntimeAgent.getDisplayableProperties.invoke({
            objectId: this._objectId,
            fetchStart,
            fetchCount,
            generatePreview,
        }, callback);
    }

    _getPropertyDescriptorsResolver(callback, error, properties, internalProperties)
    {
        if (error) {
            callback(null);
            return;
        }

        let descriptors = properties.map((payload) => WI.PropertyDescriptor.fromPayload(payload, false, this._target));

        if (internalProperties) {
            for (let payload of internalProperties)
                descriptors.push(WI.PropertyDescriptor.fromPayload(payload, true, this._target));
        }

        callback(descriptors);
    }
};

WI.RemoteObject.FakeRemoteObjectId = "fake-remote-object";

WI.RemoteObject.SourceCodeLocationPromise = {
    NoSourceFound: "remote-object-source-code-location-promise-no-source-found",
    MissingObjectId: "remote-object-source-code-location-promise-missing-object-id"
};
