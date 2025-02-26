/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2013, 2015, 2016 Apple Inc. All rights reserved.
 * Copyright (C) 2014 University of Washington.
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

InspectorBackendClass = class InspectorBackendClass
{
    constructor()
    {
        this._registeredDomains = {};
        this._activeDomains = {};

        this._customTracer = null;
        this._defaultTracer = new WI.LoggingProtocolTracer;
        this._activeTracers = [this._defaultTracer];

        // FIXME: <https://webkit.org/b/213632> Web Inspector: release unused backend domains/events/commands once the debuggable type is known
        this._supportedDomainsForTargetType = new Multimap;
        this._supportedCommandParameters = new Map;
        this._supportedEventParameters = new Map;

        WI.settings.protocolAutoLogMessages.addEventListener(WI.Setting.Event.Changed, this._startOrStopAutomaticTracing, this);
        WI.settings.protocolAutoLogTimeStats.addEventListener(WI.Setting.Event.Changed, this._startOrStopAutomaticTracing, this);
        this._startOrStopAutomaticTracing();

        this.currentDispatchState = {
            event: null,
            request: null,
            response: null,
        };
    }

    // Public

    // This should only be used for getting enum values (`InspectorBackend.Enum.Domain.Type.Item`).
    // Domain/Command/Event feature checking should use one of the `has*` functions below.
    get Enum()
    {
        // Enums should not be conditionally enabled by debuggable and/or target type.
        return this._registeredDomains;
    }

    // It's still possible to set this flag on InspectorBackend to just
    // dump protocol traffic as it happens. For more complex uses of
    // protocol data, install a subclass of WI.ProtocolTracer.
    set dumpInspectorProtocolMessages(value)
    {
        // Implicitly cause automatic logging to start if it's allowed.
        WI.settings.protocolAutoLogMessages.value = value;

        this._defaultTracer.dumpMessagesToConsole = value;
    }

    get dumpInspectorProtocolMessages()
    {
        return WI.settings.protocolAutoLogMessages.value;
    }

    set dumpInspectorTimeStats(value)
    {
        WI.settings.protocolAutoLogTimeStats.value = value;

        if (!this.dumpInspectorProtocolMessages)
            this.dumpInspectorProtocolMessages = true;

        this._defaultTracer.dumpTimingDataToConsole = value;
    }

    get dumpInspectorTimeStats()
    {
        return WI.settings.protocolAutoLogTimeStats.value;
    }

    set filterMultiplexingBackendInspectorProtocolMessages(value)
    {
        WI.settings.protocolFilterMultiplexingBackendMessages.value = value;

        this._defaultTracer.filterMultiplexingBackend = value;
    }

    get filterMultiplexingBackendInspectorProtocolMessages()
    {
        return WI.settings.protocolFilterMultiplexingBackendMessages.value;
    }

    set customTracer(tracer)
    {
        console.assert(!tracer || tracer instanceof WI.ProtocolTracer, tracer);
        console.assert(!tracer || tracer !== this._defaultTracer, tracer);

        // Bail early if no state change is to be made.
        if (!tracer && !this._customTracer)
            return;

        if (tracer === this._customTracer)
            return;

        if (tracer === this._defaultTracer)
            return;

        if (this._customTracer)
            this._customTracer.logFinished();

        this._customTracer = tracer;
        this._activeTracers = [this._defaultTracer];

        if (this._customTracer) {
            this._customTracer.logStarted();
            this._activeTracers.push(this._customTracer);
        }
    }

    get activeTracers()
    {
        return this._activeTracers;
    }

    registerDomain(domainName, targetTypes)
    {
        targetTypes = targetTypes || WI.TargetType.all;
        for (let targetType of targetTypes)
            this._supportedDomainsForTargetType.add(targetType, domainName);

        this._registeredDomains[domainName] = new InspectorBackend.Domain(domainName);
    }

    registerVersion(domainName, version)
    {
        let domain = this._registeredDomains[domainName];
        domain.VERSION = version;
    }

    registerEnum(qualifiedName, enumValues)
    {
        let [domainName, enumName] = qualifiedName.split(".");
        let domain = this._registeredDomains[domainName];
        domain._addEnum(enumName, enumValues);
    }

    registerCommand(qualifiedName, targetTypes, callSignature, replySignature)
    {
        let [domainName, commandName] = qualifiedName.split(".");
        let domain = this._registeredDomains[domainName];
        domain._addCommand(targetTypes, new InspectorBackend.Command(qualifiedName, commandName, callSignature, replySignature));
    }

    registerEvent(qualifiedName, targetTypes, signature)
    {
        let [domainName, eventName] = qualifiedName.split(".");
        let domain = this._registeredDomains[domainName];
        domain._addEvent(targetTypes, new InspectorBackend.Event(qualifiedName, eventName, signature));
    }

    registerDispatcher(domainName, dispatcher)
    {
        let domain = this._registeredDomains[domainName];
        domain._addDispatcher(dispatcher);
    }

    activateDomain(domainName, debuggableTypes)
    {
        // FIXME: <https://webkit.org/b/201150> Web Inspector: remove "extra domains" concept now that domains can be added based on the debuggable type

        // Ask `WI.sharedApp` (if it exists) as it may have a different debuggable type if extra
        // domains were activated, which is the only other time this will be called.
        let currentDebuggableType = WI.sharedApp?.debuggableType || InspectorFrontendHost.debuggableInfo.debuggableType;

        if (debuggableTypes && !debuggableTypes.includes(currentDebuggableType))
            return;

        console.assert(domainName in this._registeredDomains);
        console.assert(!(domainName in this._activeDomains));

        let domain = this._registeredDomains[domainName];
        this._activeDomains[domainName] = domain;

        let supportedTargetTypes = WI.DebuggableType.supportedTargetTypes(currentDebuggableType);

        for (let [targetType, command] of domain._supportedCommandsForTargetType) {
            if (!supportedTargetTypes.has(targetType))
                continue;

            let parameters = this._supportedCommandParameters.get(command._qualifiedName);
            if (!parameters) {
                parameters = new Set;
                this._supportedCommandParameters.set(command._qualifiedName, parameters);
            }
            parameters.addAll(command._callSignature.map((item) => item.name));
        }

        for (let [targetType, event] of domain._supportedEventsForTargetType) {
            if (!supportedTargetTypes.has(targetType))
                continue;

            let parameters = this._supportedEventParameters.get(event._qualifiedName);
            if (!parameters) {
                parameters = new Set;
                this._supportedEventParameters.set(event._qualifiedName, parameters);
            }
            parameters.addAll(event._parameterNames);
        }
    }

    dispatch(message)
    {
        InspectorBackend.backendConnection.dispatch(message);
    }

    runAfterPendingDispatches(callback)
    {
        if (!WI.mainTarget) {
            callback();
            return;
        }

        // FIXME: Should this respect pending dispatches in all connections?
        WI.mainTarget.connection.runAfterPendingDispatches(callback);
    }

    supportedDomainsForTargetType(type)
    {
        console.assert(WI.TargetType.all.includes(type), "Unknown target type", type);

        return this._supportedDomainsForTargetType.get(type) || new Set;
    }

    hasDomain(domainName)
    {
        console.assert(!domainName.includes(".") && !domainName.endsWith("Agent"));

        return domainName in this._activeDomains;
    }

    hasCommand(qualifiedName, parameterName)
    {
        console.assert(qualifiedName.includes(".") && !qualifiedName.includes("Agent."));

        let parameters = this._supportedCommandParameters.get(qualifiedName);
        if (!parameters)
            return false;

        return parameterName === undefined || parameters.has(parameterName);
    }

    hasEvent(qualifiedName, parameterName)
    {
        console.assert(qualifiedName.includes(".") && !qualifiedName.includes("Agent."));

        let parameters = this._supportedEventParameters.get(qualifiedName);
        if (!parameters)
            return false;

        return parameterName === undefined || parameters.has(parameterName);
    }

    getVersion(domainName)
    {
        console.assert(!domainName.includes(".") && !domainName.endsWith("Agent"));

        let domain = this._activeDomains[domainName];
        if (domain && "VERSION" in domain)
            return domain.VERSION;

        return -Infinity;
    }

    invokeCommand(qualifiedName, targetType, connection, commandArguments, callback)
    {
        let [domainName, commandName] = qualifiedName.split(".");

        let domain = this._activeDomains[domainName];
        return domain._invokeCommand(commandName, targetType, connection, commandArguments, callback);
    }

    // Private

    _makeAgent(domainName, target)
    {
        let domain = this._activeDomains[domainName];
        return domain._makeAgent(target);
    }

    _startOrStopAutomaticTracing()
    {
        this._defaultTracer.dumpMessagesToConsole = this.dumpInspectorProtocolMessages;
        this._defaultTracer.dumpTimingDataToConsole = this.dumpTimingDataToConsole;
        this._defaultTracer.filterMultiplexingBackend = this.filterMultiplexingBackendInspectorProtocolMessages;
    }
};

InspectorBackend = new InspectorBackendClass;

InspectorBackend.Domain = class InspectorBackendDomain
{
    constructor(domainName)
    {
        this._domainName = domainName;

        // Enums are stored directly on the Domain instance using their unqualified
        // type name as the property. Thus, callers can write: Domain.EnumType.

        this._dispatcher = null;

        // FIXME: <https://webkit.org/b/213632> Web Inspector: release unused backend domains/events/commands once the debuggable type is known
        this._supportedCommandsForTargetType = new Multimap;
        this._supportedEventsForTargetType = new Multimap;
    }

    // Private

    _addEnum(enumName, enumValues)
    {
        console.assert(!(enumName in this));
        this[enumName] = enumValues;
    }

    _addCommand(targetTypes, command)
    {
        targetTypes = targetTypes || WI.TargetType.all;
        for (let type of targetTypes)
            this._supportedCommandsForTargetType.add(type, command);
    }

    _addEvent(targetTypes, event)
    {
        targetTypes = targetTypes || WI.TargetType.all;
        for (let type of targetTypes)
            this._supportedEventsForTargetType.add(type, event);
    }

    _addDispatcher(dispatcher)
    {
        console.assert(!this._dispatcher);
        this._dispatcher = dispatcher;
    }

    _makeAgent(target)
    {
        let commands = this._supportedCommandsForTargetType.get(target.type) || new Set;
        let events = this._supportedEventsForTargetType.get(target.type) || new Set;
        return new InspectorBackend.Agent(target, commands, events, this._dispatcher);
    }

    _invokeCommand(commandName, targetType, connection, commandArguments, callback)
    {
        let commands = this._supportedCommandsForTargetType.get(targetType);
        for (let command of commands) {
            if (command._commandName === commandName)
                return command._makeCallable(connection).invoke(commandArguments, callback);
        }

        console.assert();
    }
};

InspectorBackend.Agent = class InspectorBackendAgent
{
    constructor(target, commands, events, dispatcher)
    {
        // Commands are stored directly on the Agent instance using their unqualified
        // method name as the property. Thus, callers can write: DomainAgent.commandName().
        for (let command of commands) {
            this[command._commandName] = command._makeCallable(target.connection);
            target._supportedCommandParameters.set(command._qualifiedName, command);
        }

        this._events = {};
        for (let event of events) {
            this._events[event._eventName] = event;
            target._supportedEventParameters.set(event._qualifiedName, event);
        }

        this._dispatcher = dispatcher ? new dispatcher(target) : null;
    }
};

InspectorBackend.Dispatcher = class InspectorBackendDispatcher
{
    constructor(target)
    {
        console.assert(target instanceof WI.Target);

        this._target = target;
    }
};

InspectorBackend.Command = class InspectorBackendCommand
{
    constructor(qualifiedName, commandName, callSignature, replySignature)
    {
        this._qualifiedName = qualifiedName;
        this._commandName = commandName;
        this._callSignature = callSignature || [];
        this._replySignature = replySignature || [];
    }

    // Private

    _hasParameter(parameterName)
    {
        return this._callSignature.some((item) => item.name === parameterName);
    }

    _makeCallable(connection)
    {
        let instance = new InspectorBackend.Callable(this, connection);

        function callable() {
            console.assert(this instanceof InspectorBackend.Agent);
            return instance._invokeWithArguments.call(instance, Array.from(arguments));
        }
        callable._instance = instance;
        Object.setPrototypeOf(callable, InspectorBackend.Callable.prototype);
        return callable;
    }
};

InspectorBackend.Event = class InspectorBackendEvent
{
    constructor(qualifiedName, eventName, parameterNames)
    {
        this._qualifiedName = qualifiedName;
        this._eventName = eventName;
        this._parameterNames = parameterNames || [];
    }

    // Private

    _hasParameter(parameterName)
    {
        return this._parameterNames.includes(parameterName);
    }
};

// InspectorBackend.Callable can't use ES6 classes because of its trampoline nature.
// But we can use strict mode to get stricter handling of the code inside its functions.
InspectorBackend.Callable = function(command, connection)
{
    "use strict";

    this._command = command;
    this._connection = connection;

    this._instance = this;
};

// As part of the workaround to make commands callable, these functions use `this._instance`.
// `this` could refer to the callable trampoline, or the InspectorBackend.Callable instance.
InspectorBackend.Callable.prototype = {
    __proto__: Function.prototype,

    // Public

    invoke(commandArguments, callback)
    {
        "use strict";

        let command = this._instance._command;
        let connection = this._instance._connection;

        function deliverFailure(message) {
            console.error(`Protocol Error: ${message}`);
            if (callback)
                setTimeout(callback.bind(null, message), 0);
            else
                return Promise.reject(new Error(message));
        }

        if (typeof commandArguments !== "object")
            return deliverFailure(`invoke expects an object for command arguments but its type is '${typeof commandArguments}'.`);

        let parameters = {};
        for (let {name, type, optional} of command._callSignature) {
            if (!(name in commandArguments) && !optional)
                return deliverFailure(`Missing argument '${name}' for command '${command._qualifiedName}'.`);

            let value = commandArguments[name];
            if (optional && value === undefined)
                continue;

            if (typeof value !== type)
                return deliverFailure(`Invalid type of argument '${name}' for command '${command._qualifiedName}' call. It must be '${type}' but it is '${typeof value}'.`);

            parameters[name] = value;
        }

        if (typeof callback === "function")
            connection._sendCommandToBackendWithCallback(command, parameters, callback);
        else
            return connection._sendCommandToBackendExpectingPromise(command, parameters);
    },

    // Private

    _invokeWithArguments(commandArguments)
    {
        "use strict";

        let command = this._instance._command;
        let connection = this._instance._connection;
        let callback = typeof commandArguments.lastValue === "function" ? commandArguments.pop() : null;

        function deliverFailure(message) {
            console.error(`Protocol Error: ${message}`);
            if (callback)
                setTimeout(callback.bind(null, message), 0);
            else
                return Promise.reject(new Error(message));
        }

        let parameters = {};
        for (let {name, type, optional} of command._callSignature) {
            if (!commandArguments.length && !optional)
                return deliverFailure(`Invalid number of arguments for command '${command._qualifiedName}'.`);

            let value = commandArguments.shift();
            if (optional && value === undefined)
                continue;

            if (typeof value !== type)
                return deliverFailure(`Invalid type of argument '${name}' for command '${command._qualifiedName}' call. It must be '${type}' but it is '${typeof value}'.`);

            parameters[name] = value;
        }

        if (!callback && commandArguments.length === 1 && commandArguments[0] !== undefined)
            return deliverFailure(`Protocol Error: Optional callback argument for command '${command._qualifiedName}' call must be a function but its type is '${typeof commandArguments[0]}'.`);

        if (callback)
            connection._sendCommandToBackendWithCallback(command, parameters, callback);
        else
            return connection._sendCommandToBackendExpectingPromise(command, parameters);
    }
};
