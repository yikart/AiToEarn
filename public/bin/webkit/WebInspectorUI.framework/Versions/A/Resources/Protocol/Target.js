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

WI.Target = class Target extends WI.Object
{
    constructor(parentTarget, identifier, name, type, connection, {isPaused, isProvisional} = {})
    {
        console.assert(parentTarget === null || parentTarget instanceof WI.Target);
        console.assert(!isPaused || parentTarget.hasCommand("Target.setPauseOnStart"));
        super();

        this._parentTarget = parentTarget;
        this._identifier = identifier;
        this._name = name;
        this._type = type;
        this._connection = connection;
        this._isPaused = !!isPaused;
        this._isProvisional = !!isProvisional;
        this._executionContext = null;
        this._mainResource = null;
        this._resourceCollection = new WI.ResourceCollection;
        this._extraScriptCollection = new WI.ScriptCollection;

        this._supportedCommandParameters = new Map;
        this._supportedEventParameters = new Map;

        // Restrict the agents to the list of supported agents for this target type.
        // This makes it so `target.FooAgent` only exists if the "Foo" domain is
        // supported by the target.
        this._agents = {};
        for (let domainName of InspectorBackend.supportedDomainsForTargetType(this._type))
            this._agents[domainName] = InspectorBackend._makeAgent(domainName, this);

        this._connection.target = this;

        // Agents we always expect in every target.
        console.assert(this.hasDomain("Target") || this.hasDomain("Runtime"));
        console.assert(this.hasDomain("Target") || this.hasDomain("Debugger"));
        console.assert(this.hasDomain("Target") || this.hasDomain("Console"));
    }

    // Target

    initialize()
    {
        // Intentionally initialize InspectorAgent first if it is available.
        // This may not be strictly necessary anymore, but is historical.
        if (this.hasDomain("Inspector"))
            this.InspectorAgent.enable();

        // Initialize agents.
        for (let manager of WI.managers) {
            if (manager.initializeTarget)
                manager.initializeTarget(this);
        }

        // Non-manager specific initialization.
        WI.initializeTarget(this);

        // Intentionally defer ConsoleAgent initialization to the end. We do this so that any
        // previous initialization messages will have their responses arrive before a stream
        // of console message added events come in after enabling Console.
        // See WI.ConsoleManager.prototype.initializeTarget.
        this.ConsoleAgent.enable();

        setTimeout(() => {
            // Use this opportunity to run any one time frontend initialization
            // now that we have a target with potentially new capabilities.
            WI.performOneTimeFrontendInitializationsUsingTarget(this);
        });

        console.assert(Target._initializationPromises.length || Target._completedInitializationPromiseCount);
        Promise.all(Target._initializationPromises).then(() => {
            // Tell the backend we are initialized after all our initialization messages have been sent.
            // This allows an automatically paused backend to resume execution, but we want to ensure
            // our breakpoints were already sent to that backend.
            if (this.hasDomain("Inspector"))
                this.InspectorAgent.initialized();
        });

        this._resumeIfPaused();
    }

    _resumeIfPaused()
    {
        if (this._isPaused) {
            console.assert(this._parentTarget.hasCommand("Target.resume"));
            this._parentTarget.TargetAgent.resume(this._identifier, (error) => {
                if (error) {
                    // Ignore errors if the target was destroyed after the command was sent.
                    if (!this.isDestroyed)
                        WI.reportInternalError(error);
                    return;
                }

                this._isPaused = false;
            });
        }
    }

    activateExtraDomain(domainName)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        this._agents[domainName] = InspectorBackend._makeAgent(domainName, this);
    }

    // Agents

    get AnimationAgent() { return this._agents.Animation; }
    get ApplicationCacheAgent() { return this._agents.ApplicationCache; }
    get AuditAgent() { return this._agents.Audit; }
    get BrowserAgent() { return this._agents.Browser; }
    get CPUProfilerAgent() { return this._agents.CPUProfiler; }
    get CSSAgent() { return this._agents.CSS; }
    get CanvasAgent() { return this._agents.Canvas; }
    get ConsoleAgent() { return this._agents.Console; }
    get DOMAgent() { return this._agents.DOM; }
    get DOMDebuggerAgent() { return this._agents.DOMDebugger; }
    get DOMStorageAgent() { return this._agents.DOMStorage; }
    get DatabaseAgent() { return this._agents.Database; }
    get DebuggerAgent() { return this._agents.Debugger; }
    get HeapAgent() { return this._agents.Heap; }
    get IndexedDBAgent() { return this._agents.IndexedDB; }
    get InspectorAgent() { return this._agents.Inspector; }
    get LayerTreeAgent() { return this._agents.LayerTree; }
    get MemoryAgent() { return this._agents.Memory; }
    get NetworkAgent() { return this._agents.Network; }
    get PageAgent() { return this._agents.Page; }
    get RecordingAgent() { return this._agents.Recording; }
    get RuntimeAgent() { return this._agents.Runtime; }
    get ScriptProfilerAgent() { return this._agents.ScriptProfiler; }
    get ServiceWorkerAgent() { return this._agents.ServiceWorker; }
    get TargetAgent() { return this._agents.Target; }
    get TimelineAgent() { return this._agents.Timeline; }
    get WorkerAgent() { return this._agents.Worker; }

    // Static

    static registerInitializationPromise(promise)
    {
        // This can be called for work that has to be done before `Inspector.initialized` is called.
        // Should only be called before the first target is created.
        console.assert(!Target._completedInitializationPromiseCount);

        Target._initializationPromises.push(promise);

        promise.then(() => {
            ++Target._completedInitializationPromiseCount;
            Target._initializationPromises.remove(promise);
        });
    }

    // Public

    get parentTarget() { return this._parentTarget; }

    get rootTarget()
    {
        if (this._type === WI.TargetType.Page)
            return this;
        if (this._parentTarget)
            return this._parentTarget.rootTarget;
        return this;
    }

    get identifier() { return this._identifier; }
    set identifier(identifier) { this._identifier = identifier; }

    get name() { return this._name; }
    set name(name) { this._name = name; }

    get type() { return this._type; }
    get connection() { return this._connection; }
    get executionContext() { return this._executionContext; }

    get resourceCollection() { return this._resourceCollection; }
    get extraScriptCollection() { return this._extraScriptCollection; }

    get isProvisional() { return this._isProvisional; }
    get isPaused() { return this._isPaused; }
    get isDestroyed() { return this._isDestroyed; }

    get displayName() { return this._name; }

    get mainResource()
    {
        return this._mainResource;
    }

    set mainResource(resource)
    {
        console.assert(!this._mainResource);

        this._mainResource = resource;

        this.dispatchEventToListeners(WI.Target.Event.MainResourceAdded, {resource});
    }

    addResource(resource)
    {
        this._resourceCollection.add(resource);

        this.dispatchEventToListeners(WI.Target.Event.ResourceAdded, {resource});
    }

    adoptResource(resource)
    {
        resource._target = this;

        this.addResource(resource);
    }

    addScript(script)
    {
        this._extraScriptCollection.add(script);

        this.dispatchEventToListeners(WI.Target.Event.ScriptAdded, {script});
    }

    didCommitProvisionalTarget()
    {
        console.assert(this._isProvisional);
        this._isProvisional = false;
    }

    destroy()
    {
        this._isDestroyed = true;
    }

    hasDomain(domainName)
    {
        console.assert(!domainName.includes(".") && !domainName.endsWith("Agent"));
        return domainName in this._agents;
    }

    hasCommand(qualifiedName, parameterName)
    {
        console.assert(qualifiedName.includes(".") && !qualifiedName.includes("Agent."));

        let command = this._supportedCommandParameters.get(qualifiedName);
        if (!command)
            return false;

        return parameterName === undefined || command._hasParameter(parameterName);
    }

    hasEvent(qualifiedName, parameterName)
    {
        console.assert(qualifiedName.includes(".") && !qualifiedName.includes("Agent."));

        let event = this._supportedEventParameters.get(qualifiedName);
        if (!event)
            return false;

        return parameterName === undefined || event._hasParameter(parameterName);
    }
};

WI.Target.Event = {
    MainResourceAdded: "target-main-resource-added",
    ResourceAdded: "target-resource-added",
    ScriptAdded: "target-script-added",
};

WI.Target._initializationPromises = [];
WI.Target._completedInitializationPromiseCount = 0;
