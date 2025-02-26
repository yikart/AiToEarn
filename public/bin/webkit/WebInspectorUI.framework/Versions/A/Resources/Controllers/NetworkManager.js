/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

// FIXME: NetworkManager lacks advanced multi-target support. (Network.loadResource invocations per-target)

WI.NetworkManager = class NetworkManager extends WI.Object
{
    constructor()
    {
        super();

        this._frameIdentifierMap = new Map;
        this._mainFrame = null;
        this._resourceRequestIdentifierMap = new Map;
        this._orphanedResources = new Map;
        this._webSocketIdentifierToURL = new Map;

        this._waitingForMainFrameResourceTreePayload = true;
        this._transitioningPageTarget = false;

        this._sourceMapURLMap = new Map;
        this._downloadingSourceMaps = new Set;
        this._failedSourceMapURLs = new Set;

        this._localResourceOverrides = [];
        this._harImportLocalResourceMap = new Set;

        this._pendingLocalResourceOverrideSaves = null;
        this._saveLocalResourceOverridesDebouncer = null;

        // FIXME: Provide dedicated UI to toggle Network Interception globally?
        this._interceptionEnabled = true;

        this._emulatedCondition = WI.NetworkManager.EmulatedCondition.None;

        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type
        WI.notifications.addEventListener(WI.Notification.ExtraDomainsActivated, this._extraDomainsActivated, this);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);

        if (NetworkManager.supportsOverridingResponses()) {
            WI.Resource.addEventListener(WI.SourceCode.Event.ContentDidChange, this._handleResourceContentChangedForLocalResourceOverride, this);
            WI.Resource.addEventListener(WI.Resource.Event.RequestDataDidChange, this._handleResourceContentChangedForLocalResourceOverride, this);
            WI.LocalResourceOverride.addEventListener(WI.LocalResourceOverride.Event.DisabledChanged, this._handleResourceOverrideDisabledChanged, this);
            WI.LocalResourceOverride.addEventListener(WI.LocalResourceOverride.Event.ResourceErrorTypeChanged, this._handleResourceOverrideResourceErrorTypeChanged, this);

            WI.Target.registerInitializationPromise((async () => {
                let serializedLocalResourceOverrides = await WI.objectStores.localResourceOverrides.getAll();

                this._restoringLocalResourceOverrides = true;
                for (let serializedLocalResourceOverride of serializedLocalResourceOverrides) {
                    let localResourceOverride = WI.LocalResourceOverride.fromJSON(serializedLocalResourceOverride);

                    let supported = false;
                    switch (localResourceOverride.type) {
                    case WI.LocalResourceOverride.InterceptType.Block:
                        supported = WI.NetworkManager.supportsBlockingRequests();
                        break;

                    case WI.LocalResourceOverride.InterceptType.Request:
                        supported = WI.NetworkManager.supportsOverridingRequests();
                        break;

                    case WI.LocalResourceOverride.InterceptType.Response:
                        supported = WI.NetworkManager.supportsOverridingResponses();
                        break;

                    case WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory:
                        supported = WI.NetworkManager.supportsOverridingResponses() && WI.LocalResource.canMapToFile();
                        break;

                    case WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork:
                        supported = WI.NetworkManager.supportsOverridingRequestsWithResponses();
                        break;
                    }
                    if (!supported)
                        continue;

                    const key = null;
                    WI.objectStores.localResourceOverrides.associateObject(localResourceOverride, key, serializedLocalResourceOverride);

                    this.addLocalResourceOverride(localResourceOverride);
                }
                this._restoringLocalResourceOverrides = false;
            })());
        }

        this._bootstrapScript = null;
        if (NetworkManager.supportsBootstrapScript()) {
            this._bootstrapScriptEnabledSetting = new WI.Setting("bootstrap-script-enabled", true);

            WI.Target.registerInitializationPromise((async () => {
                let bootstrapScriptSource = await WI.objectStores.general.get(NetworkManager.bootstrapScriptSourceObjectStoreKey);
                if (bootstrapScriptSource !== undefined)
                    this.createBootstrapScript(bootstrapScriptSource);
            })());
        }
    }

    // Static

    static supportsShowCertificate()
    {
        return InspectorFrontendHost.supportsShowCertificate
            && InspectorBackend.hasCommand("Network.getSerializedCertificate");
    }

    static supportsBlockingRequests()
    {
        // COMPATIBILITY (iOS 13.4): Network.interceptRequestWithError did not exist yet.
        return InspectorBackend.hasCommand("Network.interceptRequestWithError");
    }

    static supportsOverridingRequests()
    {
        // COMPATIBILITY (iOS 13.4): Network.interceptWithRequest did not exist yet.
        return InspectorBackend.hasCommand("Network.interceptWithRequest");
    }

    static supportsOverridingRequestsWithResponses()
    {
        // COMPATIBILITY (iOS 13.4): Network.interceptRequestWithResponse did not exist yet.
        return InspectorBackend.hasCommand("Network.interceptRequestWithResponse");
    }

    static supportsOverridingResponses()
    {
        // COMPATIBILITY (iOS 13.0): Network.interceptWithResponse did not exist yet.
        return InspectorBackend.hasCommand("Network.interceptWithResponse");
    }

    static supportsBootstrapScript()
    {
        return InspectorBackend.hasCommand("Page.setBootstrapScript");
    }

    static get bootstrapScriptURL()
    {
        return "web-inspector://bootstrap.js";
    }

    static get bootstrapScriptSourceObjectStoreKey()
    {
        return "bootstrap-script-source";
    }

    static synthesizeImportError(message)
    {
        message = WI.UIString("HAR Import Error: %s").format(message);

        if (window.InspectorTest) {
            console.error(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Error, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    // Target

    initializeTarget(target)
    {
        if (target.hasDomain("Page")) {
            target.PageAgent.enable();
            target.PageAgent.getResourceTree(this._processMainFrameResourceTreePayload.bind(this));

            // COMPATIBILITY (iOS 13.0): Page.setBootstrapScript did not exist yet.
            if (target.hasCommand("Page.setBootstrapScript") && this._bootstrapScript && this._bootstrapScriptEnabledSetting.value)
                target.PageAgent.setBootstrapScript(this._bootstrapScript.content);
        }

        if (target.hasDomain("ServiceWorker"))
            target.ServiceWorkerAgent.getInitializationInfo(this._processServiceWorkerConfiguration.bind(this));

        if (target.hasDomain("Network")) {
            target.NetworkAgent.enable();
            target.NetworkAgent.setResourceCachingDisabled(WI.settings.resourceCachingDisabled.value);

            // COMPATIBILITY (iOS 13.0): Network.setInterceptionEnabled did not exist.
            if (target.hasCommand("Network.setInterceptionEnabled")) {
                if (this._interceptionEnabled)
                    target.NetworkAgent.setInterceptionEnabled(this._interceptionEnabled);

                for (let localResourceOverride of this._localResourceOverrides) {
                    if (!localResourceOverride.disabled)
                        this._addInterception(localResourceOverride, target);
                }
            }
        }

        this._applyEmulatedCondition(target);

        if (target.type === WI.TargetType.Worker)
            this.adoptOrphanedResourcesForTarget(target);
    }

    transitionPageTarget()
    {
        this._transitioningPageTarget = true;
        this._waitingForMainFrameResourceTreePayload = true;
    }

    // Public

    get mainFrame() { return this._mainFrame; }
    get localResourceOverrides() { return this._localResourceOverrides; }
    get bootstrapScript() { return this._bootstrapScript; }

    get frames()
    {
        return Array.from(this._frameIdentifierMap.values());
    }

    get interceptionEnabled()
    {
        return this._interceptionEnabled;
    }

    set interceptionEnabled(enabled)
    {
        if (this._interceptionEnabled === enabled)
            return;

        this._interceptionEnabled = enabled;

        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 13.0): Network.setInterceptionEnabled did not exist.
            if (target.hasCommand("Network.setInterceptionEnabled"))
                target.NetworkAgent.setInterceptionEnabled(this._interceptionEnabled);
        }
    }

    get emulatedCondition()
    {
        return this._emulatedCondition;
    }

    set emulatedCondition(condition)
    {
        console.assert(Object.values(WI.NetworkManager.EmulatedCondition).includes(condition), condition);
        console.assert(WI.settings.experimentalEnableNetworkEmulatedCondition.value);
        console.assert(InspectorBackend.hasCommand("Network.setEmulatedConditions"));

        if (condition === this._emulatedCondition)
            return;

        this._emulatedCondition = condition;

        for (let target of WI.targets)
            this._applyEmulatedCondition(target);

        this.dispatchEventToListeners(WI.NetworkManager.Event.EmulatedConditionChanged);
    }

    frameForIdentifier(frameId)
    {
        return this._frameIdentifierMap.get(frameId) || null;
    }

    resourceForRequestIdentifier(requestIdentifier)
    {
        return this._resourceRequestIdentifierMap.get(requestIdentifier) || null;
    }

    downloadSourceMap(sourceMapURL, baseURL, originalSourceCode)
    {
        if (!WI.settings.sourceMapsEnabled.value)
            return;

        // The baseURL could have come from a "//# sourceURL". Attempt to get a
        // reasonable absolute URL for the base by using the main resource's URL.
        if (WI.networkManager.mainFrame)
            baseURL = absoluteURL(baseURL, WI.networkManager.mainFrame.url);

        if (sourceMapURL.startsWith("data:")) {
            this._loadAndParseSourceMap(sourceMapURL, baseURL, originalSourceCode);
            return;
        }

        sourceMapURL = absoluteURL(sourceMapURL, baseURL);
        if (!sourceMapURL)
            return;

        console.assert(originalSourceCode.url);
        if (!originalSourceCode.url)
            return;

        // FIXME: <rdar://problem/13265694> Source Maps: Better handle when multiple resources reference the same SourceMap

        if (this._sourceMapURLMap.has(sourceMapURL) || this._downloadingSourceMaps.has(sourceMapURL))
            return;

        let loadAndParseSourceMap = () => {
            this._loadAndParseSourceMap(sourceMapURL, baseURL, originalSourceCode);
        };

        if (!WI.networkManager.mainFrame) {
            // If we don't have a main frame, then we are likely in the middle of building the resource tree.
            // Delaying until the next runloop is enough in this case to then start loading the source map.
            setTimeout(loadAndParseSourceMap, 0);
            return;
        }

        loadAndParseSourceMap();
    }

    isSourceMapURL(url)
    {
        return this._sourceMapURLMap.has(url) || this._downloadingSourceMaps.has(url) || this._failedSourceMapURLs.has(url);
    }

    get bootstrapScriptEnabled()
    {
        console.assert(NetworkManager.supportsBootstrapScript());
        console.assert(this._bootstrapScript);

        return this._bootstrapScriptEnabledSetting.value;
    }

    set bootstrapScriptEnabled(enabled)
    {
        console.assert(NetworkManager.supportsBootstrapScript());
        console.assert(this._bootstrapScript);

        this._bootstrapScriptEnabledSetting.value = !!enabled;

        let source = this._bootstrapScriptEnabledSetting.value ? this._bootstrapScript.content : undefined;

        // COMPATIBILITY (iOS 13.0): Page.setBootstrapScript did not exist yet.
        for (let target of WI.targets) {
            if (target.hasCommand("Page.setBootstrapScript"))
                target.PageAgent.setBootstrapScript(source);
        }

        this.dispatchEventToListeners(NetworkManager.Event.BootstrapScriptEnabledChanged, {bootstrapScript: this._bootstrapScript});
    }

    async createBootstrapScript(source)
    {
        console.assert(NetworkManager.supportsBootstrapScript());

        if (this._bootstrapScript)
            return;

        if (!arguments.length)
            source = await WI.objectStores.general.get(NetworkManager.bootstrapScriptSourceObjectStoreKey);

        if (!source) {
            source = `
/*
 * ${WI.UIString("The Inspector Bootstrap Script is guaranteed to be the first script evaluated in any page, as well as any sub-frames.")}
 * ${WI.UIString("It is evaluated immediately after the global object is created, before any other content has loaded.")}
 * 
 * ${WI.UIString("Modifications made here will take effect on the next load of any page or sub-frame.")}
 * ${WI.UIString("The contents and enabled state will be preserved across Web Inspector sessions.")}
 * 
 * ${WI.UIString("Some examples of ways to use this script include (but are not limited to):")}
 *  - ${WI.UIString("overriding built-in functions to log call traces or add %s statements").format(WI.unlocalizedString("`debugger`"))}
 *  - ${WI.UIString("ensuring that common debugging functions are available on every page via the Console")}
 * 
 * ${WI.UIString("More information is available at <https://webkit.org/web-inspector/inspector-bootstrap-script/>.")}
 */
`.trimStart();
        }

        const target = null;
        const url = null;
        const sourceURL = NetworkManager.bootstrapScriptURL;
        this._bootstrapScript = new WI.LocalScript(target, url, sourceURL, WI.Script.SourceType.Program, source, {injected: true, editable: true});
        this._bootstrapScript.addEventListener(WI.SourceCode.Event.ContentDidChange, this._handleBootstrapScriptContentDidChange, this);
        this._handleBootstrapScriptContentDidChange();

        this.dispatchEventToListeners(NetworkManager.Event.BootstrapScriptCreated, {bootstrapScript: this._bootstrapScript});
    }

    destroyBootstrapScript()
    {
        console.assert(NetworkManager.supportsBootstrapScript());

        if (!this._bootstrapScript)
            return;

        let bootstrapScript = this._bootstrapScript;

        this._bootstrapScript = null;
        WI.objectStores.general.delete(NetworkManager.bootstrapScriptSourceObjectStoreKey);

        // COMPATIBILITY (iOS 13.0): Page.setBootstrapScript did not exist yet.
        for (let target of WI.targets) {
            if (target.hasCommand("Page.setBootstrapScript"))
                target.PageAgent.setBootstrapScript();
        }

        this.dispatchEventToListeners(NetworkManager.Event.BootstrapScriptDestroyed, {bootstrapScript});
    }

    addLocalResourceOverride(localResourceOverride)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride);

        console.assert(!this._localResourceOverrides.includes(localResourceOverride));
        this._localResourceOverrides.push(localResourceOverride);

        if (!this._restoringLocalResourceOverrides)
            WI.objectStores.localResourceOverrides.putObject(localResourceOverride);

        if (!localResourceOverride.disabled)
            this._addInterception(localResourceOverride);

        this.dispatchEventToListeners(WI.NetworkManager.Event.LocalResourceOverrideAdded, {localResourceOverride});
    }

    removeLocalResourceOverride(localResourceOverride)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride);

        if (!this._localResourceOverrides.remove(localResourceOverride)) {
            console.assert(false, "Attempted to remove a local resource override that was not known.");
            return;
        }

        if (this._pendingLocalResourceOverrideSaves)
            this._pendingLocalResourceOverrideSaves.delete(localResourceOverride);

        if (!this._restoringLocalResourceOverrides)
            WI.objectStores.localResourceOverrides.deleteObject(localResourceOverride);

        if (!localResourceOverride.disabled)
            this._removeInterception(localResourceOverride);

        this.dispatchEventToListeners(WI.NetworkManager.Event.LocalResourceOverrideRemoved, {localResourceOverride});
    }

    localResourceOverridesForURL(url)
    {
        // Order local resource overrides based on how closely they match the given URL. As an example,
        // a regular expression is likely going to match more URLs than a case-insensitive string.
        const rankFunctions = [
            (localResourceOverride) => localResourceOverride.isCaseSensitive && !localResourceOverride.isRegex,  // exact match
            (localResourceOverride) => !localResourceOverride.isCaseSensitive && !localResourceOverride.isRegex, // case-insensitive
            (localResourceOverride) => localResourceOverride.isCaseSensitive && localResourceOverride.isRegex,   // case-sensitive regex
            (localResourceOverride) => !localResourceOverride.isCaseSensitive && localResourceOverride.isRegex,  // case-insensitive regex
        ];
        return this._localResourceOverrides
            .filter((localResourceOverride) => localResourceOverride.matches(url))
            .sort((a, b) => {
                let aRank = rankFunctions.findIndex((rankFunction) => rankFunction(a));
                let bRank = rankFunctions.findIndex((rankFunction) => rankFunction(b));
                return aRank - bRank;
            });
    }

    canBeOverridden(resource)
    {
        if (!(resource instanceof WI.Resource))
            return false;

        if (resource instanceof WI.SourceMapResource)
            return false;

        if (resource.localResourceOverride)
            return false;

        const schemes = ["http:", "https:", "file:"];
        if (!schemes.some((scheme) => resource.url.startsWith(scheme)))
            return false;

        if (this.localResourceOverridesForURL(resource.url).length)
            return false;

        switch (resource.type) {
        case WI.Resource.Type.Document:
        case WI.Resource.Type.StyleSheet:
        case WI.Resource.Type.Script:
        case WI.Resource.Type.XHR:
        case WI.Resource.Type.Fetch:
        case WI.Resource.Type.Image:
        case WI.Resource.Type.Font:
        case WI.Resource.Type.EventSource:
        case WI.Resource.Type.Other:
            break;
        case WI.Resource.Type.Ping:
        case WI.Resource.Type.Beacon:
            // Responses aren't really expected for Ping/Beacon.
            return false;
        case WI.Resource.Type.WebSocket:
            // Non-HTTP traffic.
            console.assert(false, "Scheme check above should have been sufficient.");
            return false;
        }

        return true;
    }

    resourcesForURL(url)
    {
        let resources = new Set;
        if (this._mainFrame) {
            if (this._mainFrame.mainResource.url === url)
                resources.add(this._mainFrame.mainResource);

            const recursivelySearchChildFrames = true;
            resources.addAll(this._mainFrame.resourcesForURL(url, recursivelySearchChildFrames));
        }
        return resources;
    }

    adoptOrphanedResourcesForTarget(target)
    {
        let resources = this._orphanedResources.take(target.identifier);
        if (!resources)
            return;

        for (let resource of resources)
            target.adoptResource(resource);
    }

    processHAR({json, error})
    {
        if (error) {
            WI.NetworkManager.synthesizeImportError(error);
            return null;
        }

        if (typeof json !== "object" || json === null) {
            WI.NetworkManager.synthesizeImportError(WI.UIString("invalid JSON"));
            return null;
        }

        if (typeof json.log !== "object" || typeof json.log.version !== "string") {
            WI.NetworkManager.synthesizeImportError(WI.UIString("invalid HAR"));
            return null;
        }

        if (json.log.version !== "1.2") {
            WI.NetworkManager.synthesizeImportError(WI.UIString("unsupported HAR version"));
            return null;
        }

        if (!Array.isArray(json.log.entries) || !Array.isArray(json.log.pages) || !json.log.pages[0] || !json.log.pages[0].startedDateTime) {
            WI.NetworkManager.synthesizeImportError(WI.UIString("invalid HAR"));
            return null;
        }

        let mainResourceSentWalltime = WI.HARBuilder.dateFromHARDate(json.log.pages[0].startedDateTime) / 1000;
        if (isNaN(mainResourceSentWalltime)) {
            WI.NetworkManager.synthesizeImportError(WI.UIString("invalid HAR"));
            return null;
        }

        let localResources = [];

        for (let entry of json.log.entries) {
            let localResource = WI.LocalResource.fromHAREntry(entry, mainResourceSentWalltime);
            this._harImportLocalResourceMap.add(localResource);
            localResources.push(localResource);
        }

        return localResources;
    }

    // PageObserver

    frameDidNavigate(framePayload)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        var frameWasLoadedInstantly = false;

        var frame = this.frameForIdentifier(framePayload.id);
        if (!frame) {
            // If the frame wasn't known before now, then the main resource was loaded instantly (about:blank, etc.)
            // Make a new resource (which will make the frame). Mark will mark it as loaded at the end too since we
            // don't expect any more events about the load finishing for these frames.
            let resourceOptions = {
                loaderIdentifier: framePayload.loaderId,
            };
            let frameOptions = {
                name: framePayload.name,
                securityOrigin: framePayload.securityOrigin,
            };
            let frameResource = this._addNewResourceToFrameOrTarget(framePayload.url, framePayload.id, resourceOptions, frameOptions);
            frame = frameResource.parentFrame;
            frameWasLoadedInstantly = true;

            console.assert(frame);
            if (!frame)
                return;
        }

        if (framePayload.loaderId === frame.provisionalLoaderIdentifier) {
            // There was a provisional load in progress, commit it.
            frame.commitProvisionalLoad(framePayload.securityOrigin);
        } else {
            let mainResource = null;
            if (frame.mainResource.url !== framePayload.url || frame.loaderIdentifier !== framePayload.loaderId) {
                // Navigations like back/forward do not have provisional loads, so create a new main resource here.
                mainResource = new WI.Resource(framePayload.url, {
                    mimeType: framePayload.mimeType,
                    loaderIdentifier: framePayload.loaderId,
                });
            } else {
                // The main resource is already correct, so reuse it.
                mainResource = frame.mainResource;
            }

            frame.initialize(framePayload.name, framePayload.securityOrigin, framePayload.loaderId, mainResource);
        }

        var oldMainFrame = this._mainFrame;

        if (framePayload.parentId) {
            var parentFrame = this.frameForIdentifier(framePayload.parentId);
            console.assert(parentFrame);

            if (frame === this._mainFrame)
                this._mainFrame = null;

            if (frame.parentFrame !== parentFrame)
                parentFrame.addChildFrame(frame);
        } else {
            if (frame.parentFrame)
                frame.parentFrame.removeChildFrame(frame);
            this._mainFrame = frame;
        }

        if (this._mainFrame !== oldMainFrame)
            this._mainFrameDidChange(oldMainFrame);

        if (frameWasLoadedInstantly)
            frame.mainResource.markAsFinished();
    }

    frameDidDetach(frameId)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        var frame = this.frameForIdentifier(frameId);
        if (!frame)
            return;

        if (frame.parentFrame)
            frame.parentFrame.removeChildFrame(frame);

        this._frameIdentifierMap.delete(frame.id);

        var oldMainFrame = this._mainFrame;

        if (frame === this._mainFrame)
            this._mainFrame = null;

        frame.clearExecutionContexts();

        this.dispatchEventToListeners(WI.NetworkManager.Event.FrameWasRemoved, {frame});

        if (this._mainFrame !== oldMainFrame)
            this._mainFrameDidChange(oldMainFrame);
    }

    // NetworkObserver

    resourceRequestWillBeSent(requestIdentifier, frameIdentifier, loaderIdentifier, request, type, redirectResponse, timestamp, walltime, initiator, targetId)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        var elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        let resource = this._resourceRequestIdentifierMap.get(requestIdentifier);
        if (resource) {
            // This is an existing request which is being redirected, update the resource.
            console.assert(resource.parentFrame.id === frameIdentifier);
            console.assert(resource.loaderIdentifier === loaderIdentifier);
            console.assert(!targetId);
            resource.updateForRedirectResponse(request, redirectResponse, elapsedTime, walltime);
            return;
        }

        // This is a new request, make a new resource and add it to the right frame.
        resource = this._addNewResourceToFrameOrTarget(request.url, frameIdentifier, {
            type,
            loaderIdentifier,
            targetId,
            requestIdentifier,
            requestMethod: request.method,
            requestHeaders: request.headers,
            requestData: request.postData,
            requestSentTimestamp: elapsedTime,
            requestSentWalltime: walltime,
            referrerPolicy: request.referrerPolicy,
            integrity: request.integrity,
            initiatorStackTrace: this._initiatorStackTraceFromPayload(initiator),
            initiatorSourceCodeLocation: this._initiatorSourceCodeLocationFromPayload(initiator),
            initiatorNode: this._initiatorNodeFromPayload(initiator),
        });

        // Associate the resource with the requestIdentifier so it can be found in future loading events.
        this._resourceRequestIdentifierMap.set(requestIdentifier, resource);
    }

    webSocketCreated(requestId, url)
    {
        this._webSocketIdentifierToURL.set(requestId, url);
    }

    webSocketWillSendHandshakeRequest(requestId, timestamp, walltime, request)
    {
        let url = this._webSocketIdentifierToURL.get(requestId);
        console.assert(url);
        if (!url)
            return;

        // FIXME: <webkit.org/b/168475> Web Inspector: Correctly display iframe's and worker's WebSockets

        let resource = new WI.WebSocketResource(url, {
            loaderIdentifier: WI.networkManager.mainFrame.id,
            requestIdentifier: requestId,
            requestHeaders: request.headers,
            timestamp,
            walltime,
            requestSentTimestamp: WI.timelineManager.computeElapsedTime(timestamp),
        });

        let frame = this.frameForIdentifier(WI.networkManager.mainFrame.id);
        frame.addResource(resource);

        this._resourceRequestIdentifierMap.set(requestId, resource);
    }

    webSocketHandshakeResponseReceived(requestId, timestamp, response)
    {
        let resource = this._resourceRequestIdentifierMap.get(requestId);
        console.assert(resource);
        if (!resource)
            return;

        resource.readyState = WI.WebSocketResource.ReadyState.Open;

        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);

        // FIXME: <webkit.org/b/169166> Web Inspector: WebSockets: Implement timing information
        let responseTiming = response.timing || null;

        resource.updateForResponse(resource.url, resource.mimeType, resource.type, response.headers, response.status, response.statusText, elapsedTime, responseTiming);

        resource.markAsFinished(elapsedTime);
    }

    webSocketFrameReceived(requestId, timestamp, response)
    {
        this._webSocketFrameReceivedOrSent(requestId, timestamp, response);
    }

    webSocketFrameSent(requestId, timestamp, response)
    {
        this._webSocketFrameReceivedOrSent(requestId, timestamp, response);
    }

    webSocketClosed(requestId, timestamp)
    {
        let resource = this._resourceRequestIdentifierMap.get(requestId);
        console.assert(resource);
        if (!resource)
            return;

        resource.readyState = WI.WebSocketResource.ReadyState.Closed;

        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        resource.markAsFinished(elapsedTime);

        this._webSocketIdentifierToURL.delete(requestId);
        this._resourceRequestIdentifierMap.delete(requestId);
    }

    _webSocketFrameReceivedOrSent(requestId, timestamp, response)
    {
        let resource = this._resourceRequestIdentifierMap.get(requestId);
        console.assert(resource);
        if (!resource)
            return;

        // Data going from the client to the server is always masked.
        let isOutgoing = !!response.mask;

        let {payloadData, payloadLength, opcode} = response;
        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);

        resource.addFrame(payloadData, payloadLength, isOutgoing, opcode, timestamp, elapsedTime);
    }

    resourceRequestWasServedFromMemoryCache(requestIdentifier, frameIdentifier, loaderIdentifier, cachedResourcePayload, timestamp, initiator)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        console.assert(!this._resourceRequestIdentifierMap.has(requestIdentifier));

        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        let response = cachedResourcePayload.response;
        const responseSource = InspectorBackend.Enum.Network.ResponseSource.MemoryCache;

        let resource = this._addNewResourceToFrameOrTarget(cachedResourcePayload.url, frameIdentifier, {
            type: cachedResourcePayload.type,
            loaderIdentifier,
            requestIdentifier,
            requestMethod: WI.HTTPUtilities.RequestMethod.GET,
            requestSentTimestamp: elapsedTime,
            initiatorStackTrace: this._initiatorStackTraceFromPayload(initiator),
            initiatorSourceCodeLocation: this._initiatorSourceCodeLocationFromPayload(initiator),
            initiatorNode: this._initiatorNodeFromPayload(initiator),
        });
        resource.updateForResponse(cachedResourcePayload.url, response.mimeType, cachedResourcePayload.type, response.headers, response.status, response.statusText, elapsedTime, response.timing, responseSource, response.security);
        resource.increaseSize(cachedResourcePayload.bodySize, elapsedTime);
        resource.increaseTransferSize(cachedResourcePayload.bodySize);
        resource.setCachedResponseBodySize(cachedResourcePayload.bodySize);
        resource.markAsFinished(elapsedTime);

        console.assert(resource.cached, "This resource should be classified as cached since it was served from the MemoryCache", resource);

        if (cachedResourcePayload.sourceMapURL)
            this.downloadSourceMap(cachedResourcePayload.sourceMapURL, resource.url, resource);

        // No need to associate the resource with the requestIdentifier, since this is the only event
        // sent for memory cache resource loads.
    }

    resourceRequestDidReceiveResponse(requestIdentifier, frameIdentifier, loaderIdentifier, type, response, timestamp)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        var elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        let resource = this._resourceRequestIdentifierMap.get(requestIdentifier);

        // We might not have a resource if the inspector was opened during the page load (after resourceRequestWillBeSent is called).
        // We don't want to assert in this case since we do likely have the resource, via Page.getResourceTree. The Resource
        // just doesn't have a requestIdentifier for us to look it up, but we can try to look it up by its URL.
        if (!resource) {
            var frame = this.frameForIdentifier(frameIdentifier);
            if (frame)
                resource = frame.resourcesForURL(response.url).firstValue;

            // If we find the resource this way we had marked it earlier as finished via Page.getResourceTree.
            // Associate the resource with the requestIdentifier so it can be found in future loading events.
            // and roll it back to an unfinished state, we know now it is still loading.
            if (resource) {
                this._resourceRequestIdentifierMap.set(requestIdentifier, resource);
                resource.revertMarkAsFinished();
            }
        }

        // If we haven't found an existing Resource by now, then it is a resource that was loading when the inspector
        // opened and we just missed the resourceRequestWillBeSent for it. So make a new resource and add it.
        if (!resource) {
            resource = this._addNewResourceToFrameOrTarget(response.url, frameIdentifier, {
                type,
                loaderIdentifier,
                requestIdentifier,
                requestHeaders: response.requestHeaders,
                requestSentTimestamp: elapsedTime,
            });

            // Associate the resource with the requestIdentifier so it can be found in future loading events.
            this._resourceRequestIdentifierMap.set(requestIdentifier, resource);
        }

        resource.updateForResponse(response.url, response.mimeType, type, response.headers, response.status, response.statusText, elapsedTime, response.timing, response.source, response.security);
    }

    resourceRequestDidReceiveData(requestIdentifier, dataLength, encodedDataLength, timestamp)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        let resource = this._resourceRequestIdentifierMap.get(requestIdentifier);
        var elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);

        // We might not have a resource if the inspector was opened during the page load (after resourceRequestWillBeSent is called).
        // We don't want to assert in this case since we do likely have the resource, via Page.getResourceTree. The Resource
        // just doesn't have a requestIdentifier for us to look it up.
        if (!resource)
            return;

        resource.increaseSize(dataLength, elapsedTime);

        if (encodedDataLength !== -1)
            resource.increaseTransferSize(encodedDataLength);
    }

    resourceRequestDidFinishLoading(requestIdentifier, timestamp, sourceMapURL, metrics)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        // By now we should always have the Resource. Either it was fetched when the inspector first opened with
        // Page.getResourceTree, or it was a currently loading resource that we learned about in resourceRequestDidReceiveResponse.
        let resource = this._resourceRequestIdentifierMap.get(requestIdentifier);
        console.assert(resource);
        if (!resource)
            return;

        if (metrics)
            resource.updateWithMetrics(metrics);

        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        resource.markAsFinished(elapsedTime);

        if (sourceMapURL)
            this.downloadSourceMap(sourceMapURL, resource.url, resource);

        this._resourceRequestIdentifierMap.delete(requestIdentifier);
    }

    resourceRequestDidFailLoading(requestIdentifier, canceled, timestamp, errorText)
    {
        // Ignore this while waiting for the whole frame/resource tree.
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        // By now we should always have the Resource. Either it was fetched when the inspector first opened with
        // Page.getResourceTree, or it was a currently loading resource that we learned about in resourceRequestDidReceiveResponse.
        let resource = this._resourceRequestIdentifierMap.get(requestIdentifier);
        console.assert(resource);
        if (!resource)
            return;

        let elapsedTime = WI.timelineManager.computeElapsedTime(timestamp);
        resource.markAsFailed(canceled, elapsedTime, errorText);

        if (resource.parentFrame && resource === resource.parentFrame.provisionalMainResource)
            resource.parentFrame.clearProvisionalLoad();

        this._resourceRequestIdentifierMap.delete(requestIdentifier);
    }

    async requestIntercepted(target, requestId, request)
    {
        for (let localResourceOverride of this.localResourceOverridesForURL(request.url)) {
            if (localResourceOverride.disabled)
                continue;

            if (localResourceOverride.networkStage !== WI.NetworkManager.NetworkStage.Request)
                continue;

            let isPassthrough = localResourceOverride.isPassthrough;
            let originalHeaders = isPassthrough ? request.headers : {};

            let localResource = localResourceOverride.localResource;
            await localResource.requestContent();

            let revision = localResource.currentRevision;

            switch (localResourceOverride.type) {
            case WI.LocalResourceOverride.InterceptType.Block:
                target.NetworkAgent.interceptRequestWithError.invoke({
                    requestId,
                    errorType: localResourceOverride.resourceErrorType,
                });
                return;

            case WI.LocalResourceOverride.InterceptType.Request: {
                let method = localResource.requestMethod ?? (isPassthrough ? request.method : "");
                target.NetworkAgent.interceptWithRequest.invoke({
                    requestId,
                    url: localResourceOverride.generateRequestRedirectURL(request.url) ?? undefined,
                    method,
                    headers: {...originalHeaders, ...localResource.requestHeaders},
                    postData: (function() {
                        if (method && WI.HTTPUtilities.RequestMethodsWithBody.has(method)) {
                            if (localResource.requestData ?? false)
                                return btoa(localResource.requestData);
                            if (isPassthrough)
                                return request.data;
                        }
                        return undefined;
                    })(),
                });
                return;
            }

            case WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork:
                console.assert(revision.mimeType === localResource.mimeType);
                target.NetworkAgent.interceptRequestWithResponse.invoke({
                    requestId,
                    content: revision.content,
                    base64Encoded: !!revision.base64Encoded,
                    mimeType: revision.mimeType ?? "text/plain",
                    status: !isNaN(localResource.statusCode) ? localResource.statusCode : 200,
                    statusText: (function() {
                        if (localResource.statusText ?? false)
                            return localResource.statusText;

                        if (!isNaN(localResource.statusCode))
                            return WI.HTTPUtilities.statusTextForStatusCode(localResource.statusCode);

                        return WI.HTTPUtilities.statusTextForStatusCode(200);
                    })(),
                    headers: {...originalHeaders, ...localResource.responseHeaders},
                });
                return;
            }
        }

        // It's possible for a response regex override to overlap a request regex override, in
        // which case we should silently continue the request if the response regex override was
        // used instead (e.g. it was added first).
        target.NetworkAgent.interceptContinue.invoke({
            requestId,
            stage: WI.NetworkManager.NetworkStage.Request,
        });
    }

    async responseIntercepted(target, requestId, response)
    {
        for (let localResourceOverride of this.localResourceOverridesForURL(response.url)) {
            if (localResourceOverride.disabled)
                continue;

            if (localResourceOverride.networkStage !== WI.NetworkManager.NetworkStage.Response)
                continue;

            let isPassthrough = localResourceOverride.isPassthrough;
            let originalHeaders = isPassthrough ? response.headers : {};

            let localResource = localResourceOverride.localResource;
            await localResource.requestContent();

            let revision = localResource.currentRevision;

            switch (localResourceOverride.type) {
            case WI.LocalResourceOverride.InterceptType.Response:
                console.assert(revision.mimeType === localResource.mimeType);
                target.NetworkAgent.interceptWithResponse.invoke({
                    requestId,
                    content: revision.content,
                    base64Encoded: !!revision.base64Encoded,
                    mimeType: revision.mimeType ?? (isPassthrough ? response.mimeType : "text/plain"),
                    status: (function() {
                        if (!isNaN(localResource.statusCode))
                            return localResource.statusCode;

                        if (isPassthrough)
                            return response.status;

                        return 200;
                    })(),
                    statusText: (function() {
                        if (localResource.statusText ?? false)
                            return localResource.statusText;

                        if (isPassthrough)
                            return response.statusText;

                        if (!isNaN(localResource.statusCode))
                            return WI.HTTPUtilities.statusTextForStatusCode(localResource.statusCode);

                        return WI.HTTPUtilities.statusTextForStatusCode(200);
                    })(),
                    headers: {...originalHeaders, ...localResource.responseHeaders},
                });
                return;

            case WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory: {
                let subpath = localResourceOverride.generateSubpathForMappedDirectory(WI.urlWithoutUserQueryOrFragment(response.url));
                let content = await localResource.requestContentFromMappedDirectory(subpath);
                if (typeof content === "string") {
                    let mimeType = WI.mimeTypeForFileExtension(WI.fileExtensionForURL(response.url));
                    target.NetworkAgent.interceptWithResponse.invoke({
                        requestId,
                        content,
                        base64Encoded: !WI.shouldTreatMIMETypeAsText(mimeType),
                        mimeType,
                        status: (function() {
                            if (response.status < 400)
                                return response.status;
                            return 200;
                        })(),
                        statusText: (function() {
                            if (response.status < 400) {
                                if (response.statusText)
                                    return response.statusText;
                                return WI.HTTPUtilities.statusTextForStatusCode(response.status);
                            }
                            return WI.HTTPUtilities.statusTextForStatusCode(200);
                        })(),
                    });
                } else {
                    // Be lenient by allowing for a very general directory mapping to not have to
                    // contain files for every single possible request that could be intercepted.
                    target.NetworkAgent.interceptContinue.invoke({
                        requestId,
                        stage: WI.NetworkManager.NetworkStage.Response,
                    });
                }
                return;
            }
            }
        }

        // It's possible for a request regex override to overlap a response regex override, in
        // which case we should silently continue the response if the request regex override was
        // used instead (e.g. it was added first).
        target.NetworkAgent.interceptContinue.invoke({
            requestId,
            stage: WI.NetworkManager.NetworkStage.Response,
        });
    }

    // RuntimeObserver

    executionContextCreated(payload)
    {
        let frame = this.frameForIdentifier(payload.frameId);
        console.assert(frame);
        if (!frame)
            return;

        let type = WI.ExecutionContext.typeFromPayload(payload);
        let target = frame.mainResource.target;
        let executionContext = new WI.ExecutionContext(target, payload.id, type, payload.name, frame);
        frame.addExecutionContext(executionContext);
    }

    // Private

    _addNewResourceToFrameOrTarget(url, frameIdentifier, resourceOptions = {}, frameOptions = {})
    {
        console.assert(!this._waitingForMainFrameResourceTreePayload);

        let resource = null;

        if (!frameIdentifier && resourceOptions.targetId) {
            // This is a new resource for a ServiceWorker target.
            console.assert(WI.sharedApp.debuggableType === WI.DebuggableType.ServiceWorker);
            console.assert(resourceOptions.targetId === WI.mainTarget.identifier);
            resource = new WI.Resource(url, resourceOptions);
            resource.target.addResource(resource);
            return resource;
        }

        let frame = this.frameForIdentifier(frameIdentifier);
        if (frame) {
            if (resourceOptions.type === InspectorBackend.Enum.Page.ResourceType.Document && frame.provisionalMainResource && frame.provisionalMainResource.url === url && frame.provisionalLoaderIdentifier === resourceOptions.loaderIdentifier)
                resource = frame.provisionalMainResource;
            else {
                resource = new WI.Resource(url, resourceOptions);
                if (resource.target === WI.pageTarget)
                    this._addResourceToFrame(frame, resource);
                else if (resource.target)
                    resource.target.addResource(resource);
                else
                    this._addOrphanedResource(resource, resourceOptions.targetId);
            }
        } else {
            // This is a new request for a new frame, which is always the main resource.
            console.assert(WI.sharedApp.debuggableType !== WI.DebuggableType.ServiceWorker);
            console.assert(!resourceOptions.targetId);
            resource = new WI.Resource(url, resourceOptions);
            frame = new WI.Frame(frameIdentifier, frameOptions.name, frameOptions.securityOrigin, resourceOptions.loaderIdentifier, resource);
            this._frameIdentifierMap.set(frame.id, frame);

            // If we don't have a main frame, assume this is it. This can change later in
            // frameDidNavigate when the parent frame is known.
            if (!this._mainFrame) {
                this._mainFrame = frame;
                this._mainFrameDidChange(null);
            }

            this._dispatchFrameWasAddedEvent(frame);
        }

        console.assert(resource);

        return resource;
    }

    _addResourceToFrame(frame, resource)
    {
        console.assert(!this._waitingForMainFrameResourceTreePayload);
        if (this._waitingForMainFrameResourceTreePayload)
            return;

        console.assert(frame);
        console.assert(resource);

        if (resource.loaderIdentifier !== frame.loaderIdentifier && !frame.provisionalLoaderIdentifier) {
            // This is the start of a provisional load which happens before frameDidNavigate is called.
            // This resource will be the new mainResource if frameDidNavigate is called.
            frame.startProvisionalLoad(resource);
            return;
        }

        // This is just another resource, either for the main loader or the provisional loader.
        console.assert(resource.loaderIdentifier === frame.loaderIdentifier || resource.loaderIdentifier === frame.provisionalLoaderIdentifier);
        frame.addResource(resource);
    }

    _addResourceToTarget(target, resource)
    {
        console.assert(target !== WI.pageTarget);
        console.assert(resource);

        target.addResource(resource);
    }

    _initiatorStackTraceFromPayload(initiatorPayload)
    {
        if (!initiatorPayload)
            return null;

        let stackTrace = initiatorPayload.stackTrace;
        if (!stackTrace)
            return null;

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `stackTrace` was an array of `Console.CallFrame`.
        if (Array.isArray(stackTrace))
            stackTrace = {callFrames: stackTrace};

        return WI.StackTrace.fromPayload(WI.assumingMainTarget(), stackTrace);
    }

    _initiatorSourceCodeLocationFromPayload(initiatorPayload)
    {
        if (!initiatorPayload)
            return null;

        var url = null;
        var lineNumber = NaN;
        var columnNumber = 0;

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `stackTrace` was an array of `Console.CallFrame`.
        let callFramesPayload = Array.isArray(initiatorPayload.stackTrace) ? initiatorPayload.stackTrace : initiatorPayload.stackTrace?.callFrames;
        if (callFramesPayload?.length) {
            for (let callFramePayload of callFramesPayload) {
                if (!callFramePayload.url || callFramePayload.url === "[native code]")
                    continue;

                url = callFramePayload.url;

                // The lineNumber is 1-based, but we expect 0-based.
                lineNumber = callFramePayload.lineNumber - 1;

                columnNumber = callFramePayload.columnNumber;

                break;
            }
        } else if (initiatorPayload.url) {
            url = initiatorPayload.url;

            // The lineNumber is 1-based, but we expect 0-based.
            lineNumber = initiatorPayload.lineNumber - 1;
        }

        if (!url || isNaN(lineNumber) || lineNumber < 0)
            return null;

        let sourceCode = WI.networkManager.resourcesForURL(url).firstValue;
        if (!sourceCode)
            sourceCode = WI.debuggerManager.scriptsForURL(url, WI.mainTarget)[0];

        if (!sourceCode)
            return null;

        return sourceCode.createSourceCodeLocation(lineNumber, columnNumber);
    }

    _initiatorNodeFromPayload(initiatorPayload)
    {
        return WI.domManager.nodeForId(initiatorPayload.nodeId);
    }

    _processServiceWorkerConfiguration(error, initializationPayload)
    {
        console.assert(this._waitingForMainFrameResourceTreePayload);
        this._waitingForMainFrameResourceTreePayload = false;

        if (error) {
            console.error(JSON.stringify(error));
            return;
        }

        console.assert(initializationPayload.targetId.startsWith("serviceworker:"));

        WI.mainTarget.identifier = initializationPayload.targetId;
        WI.mainTarget.name = initializationPayload.url;

        // Create a main resource with this content in case the content never shows up as a WI.Script.
        const sourceURL = null;
        const sourceType = WI.Script.SourceType.Program;
        let script = new WI.LocalScript(WI.mainTarget, initializationPayload.url, sourceURL, sourceType, initializationPayload.content);
        WI.mainTarget.mainResource = script;

        InspectorBackend.runAfterPendingDispatches(() => {
            if (WI.mainTarget.mainResource === script) {
                // We've now received all the scripts, if we don't have a better main resource use this LocalScript.
                WI.debuggerManager.dataForTarget(WI.mainTarget).addScript(script);
                WI.debuggerManager.dispatchEventToListeners(WI.DebuggerManager.Event.ScriptAdded, {script});
            }
        });
    }

    _processMainFrameResourceTreePayload(error, mainFramePayload)
    {
        console.assert(this._waitingForMainFrameResourceTreePayload);
        this._waitingForMainFrameResourceTreePayload = false;

        if (error) {
            console.error(JSON.stringify(error));
            return;
        }

        console.assert(mainFramePayload);
        console.assert(mainFramePayload.frame);

        this._resourceRequestIdentifierMap = new Map;
        this._frameIdentifierMap = new Map;

        var oldMainFrame = this._mainFrame;

        this._mainFrame = this._addFrameTreeFromFrameResourceTreePayload(mainFramePayload, true);

        if (this._mainFrame !== oldMainFrame)
            this._mainFrameDidChange(oldMainFrame);

        // Emulate a main resource change within this page even though we are swapping out main frames.
        // This is because many managers listen only for main resource change events to perform work,
        // but they don't listen for main frame changes.
        if (this._transitioningPageTarget) {
            this._transitioningPageTarget = false;
            this._mainFrame._dispatchMainResourceDidChangeEvent(oldMainFrame.mainResource);
        }
    }

    _createFrame(payload)
    {
        // If payload.url is missing or empty then this page is likely the special empty page. In that case
        // we will just say it is "about:blank" so we have a URL, which is required for resources.
        let mainResource = new WI.Resource(payload.url || "about:blank", {
            mimeType: payload.mimeType,
            loaderIdentifier: payload.loaderId,
        });
        var frame = new WI.Frame(payload.id, payload.name, payload.securityOrigin, payload.loaderId, mainResource);

        this._frameIdentifierMap.set(frame.id, frame);

        mainResource.markAsFinished();

        return frame;
    }

    _createResource(payload, framePayload)
    {
        let resource = new WI.Resource(payload.url, {
            mimeType: payload.mimeType,
            type: payload.type,
            loaderIdentifier: framePayload.loaderId,
            targetId: payload.targetId,
        });

        if (payload.sourceMapURL)
            this.downloadSourceMap(payload.sourceMapURL, resource.url, resource);

        return resource;
    }

    _addFrameTreeFromFrameResourceTreePayload(payload, isMainFrame)
    {
        var frame = this._createFrame(payload.frame);
        if (isMainFrame)
            frame.markAsMainFrame();

        for (var i = 0; payload.childFrames && i < payload.childFrames.length; ++i)
            frame.addChildFrame(this._addFrameTreeFromFrameResourceTreePayload(payload.childFrames[i], false));

        for (var i = 0; payload.resources && i < payload.resources.length; ++i) {
            var resourcePayload = payload.resources[i];

            // The main resource is included as a resource. We can skip it since we already created
            // a main resource when we created the Frame. The resource payload does not include anything
            // didn't already get from the frame payload.
            if (resourcePayload.type === "Document" && resourcePayload.url === payload.frame.url)
                continue;

            var resource = this._createResource(resourcePayload, payload);
            if (resource.target === WI.pageTarget)
                frame.addResource(resource);
            else if (resource.target)
                resource.target.addResource(resource);
            else
                this._addOrphanedResource(resource, resourcePayload.targetId);

            if (resourcePayload.failed || resourcePayload.canceled)
                resource.markAsFailed(resourcePayload.canceled);
            else
                resource.markAsFinished();
        }

        this._dispatchFrameWasAddedEvent(frame);

        return frame;
    }

    _addOrphanedResource(resource, targetId)
    {
        let resources = this._orphanedResources.get(targetId);
        if (!resources) {
            resources = [];
            this._orphanedResources.set(targetId, resources);
        }

        resources.push(resource);
    }

    _commandArgumentsForInterception(localResourceOverride)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride, localResourceOverride);

        return {
            url: localResourceOverride.url,
            stage: localResourceOverride.networkStage,
            caseSensitive: localResourceOverride.isCaseSensitive,
            isRegex: localResourceOverride.isRegex,
        };
    }

    _addInterception(localResourceOverride, specificTarget)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride, localResourceOverride);
        console.assert(!localResourceOverride.disabled, localResourceOverride);

        let targets = specificTarget ? [specificTarget] : WI.targets;
        for (let target of targets) {
            // COMPATIBILITY (iOS 13.0): Network.addInterception did not exist yet.
            if (!target.hasCommand("Network.addInterception"))
                continue;

            target.NetworkAgent.addInterception.invoke(this._commandArgumentsForInterception(localResourceOverride));
        }
    }

    _removeInterception(localResourceOverride, specificTarget)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride, localResourceOverride);

        let targets = specificTarget ? [specificTarget] : WI.targets;
        for (let target of targets) {
            // COMPATIBILITY (iOS 13.0): Network.removeInterception did not exist yet.
            if (!target.hasCommand("Network.removeInterception"))
                continue;

            target.NetworkAgent.removeInterception.invoke(this._commandArgumentsForInterception(localResourceOverride));
        }
    }

    _applyEmulatedCondition(target)
    {
        if (!WI.settings.experimentalEnableNetworkEmulatedCondition.value)
            return;

        // COMPATIBILITY (macOS 13.0, iOS 16.0): Network.setEmulatedConditions did not exist.
        if (!target.hasCommand("Network.setEmulatedConditions"))
            return;

        target.NetworkAgent.setEmulatedConditions(this._emulatedCondition.bytesPerSecondLimit);
    }

    _dispatchFrameWasAddedEvent(frame)
    {
        this.dispatchEventToListeners(WI.NetworkManager.Event.FrameWasAdded, {frame});
    }

    _mainFrameDidChange(oldMainFrame)
    {
        if (oldMainFrame)
            oldMainFrame.unmarkAsMainFrame();
        if (this._mainFrame)
            this._mainFrame.markAsMainFrame();

        this.dispatchEventToListeners(WI.NetworkManager.Event.MainFrameDidChange, {oldMainFrame});
    }

    _loadAndParseSourceMap(sourceMapURL, baseURL, originalSourceCode)
    {
        this._downloadingSourceMaps.add(sourceMapURL);

        let sourceMapLoaded = (error, content, mimeType, statusCode) => {
            if (error || statusCode >= 400) {
                this._sourceMapLoadFailed(sourceMapURL);
                return;
            }

            if (content.slice(0, 3) === ")]}") {
                let firstNewlineIndex = content.indexOf("\n");
                if (firstNewlineIndex === -1) {
                    this._sourceMapParseFailed(sourceMapURL, WI.UIString("missing newline", "missing newline @ Source Map", "Error when a JS source map is missing a starting newline."));
                    return;
                }

                content = content.substring(firstNewlineIndex);
            }

            try {
                let payload = JSON.parse(content);
                let baseURL = sourceMapURL.startsWith("data:") ? originalSourceCode.url : sourceMapURL;
                let sourceMap = new WI.SourceMap(baseURL, originalSourceCode, payload);
                this._sourceMapLoadAndParseSucceeded(sourceMapURL, sourceMap);
            } catch (error) {
                this._sourceMapParseFailed(sourceMapURL, error);
            }
        };

        if (sourceMapURL.startsWith("data:")) {
            let {mimeType, base64, data} = parseDataURL(sourceMapURL);
            let content = base64 ? atob(data) : data;
            sourceMapLoaded(null, content, mimeType, 0);
            return;
        }

        let target = WI.assumingMainTarget();
        if (!target.hasCommand("Network.loadResource")) {
            this._sourceMapLoadFailed(sourceMapURL);
            return;
        }

        let frameIdentifier = null;
        if (originalSourceCode instanceof WI.Resource && originalSourceCode.parentFrame)
            frameIdentifier = originalSourceCode.parentFrame.id;

        if (!frameIdentifier)
            frameIdentifier = WI.networkManager.mainFrame ? WI.networkManager.mainFrame.id : "";

        target.NetworkAgent.loadResource(frameIdentifier, sourceMapURL, sourceMapLoaded);
    }

    _sourceMapLoadFailed(sourceMapURL)
    {
        this._downloadingSourceMaps.delete(sourceMapURL);
        this._failedSourceMapURLs.add(sourceMapURL);
    }

    _sourceMapParseFailed(sourceMapURL, error)
    {
        this._downloadingSourceMaps.delete(sourceMapURL);
        this._failedSourceMapURLs.add(sourceMapURL);

        if (window.InspectorTest)
            sourceMapURL = parseURL(sourceMapURL).lastPathComponent;

        let message = WI.UIString("Source Map \u0022%s\u0022 has %s").format(sourceMapURL, error);

        if (window.InspectorTest) {
            console.warn(message);
            return;
        }

        let consoleMessage = new WI.ConsoleMessage(WI.mainTarget, WI.ConsoleMessage.MessageSource.Other, WI.ConsoleMessage.MessageLevel.Warning, message);
        consoleMessage.shouldRevealConsole = true;

        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
    }

    _sourceMapLoadAndParseSucceeded(sourceMapURL, sourceMap)
    {
        if (!this._downloadingSourceMaps.has(sourceMapURL))
            return;

        this._downloadingSourceMaps.delete(sourceMapURL);

        this._sourceMapURLMap.set(sourceMapURL, sourceMap);

        // Associate the SourceMap with the originalSourceCode.
        sourceMap.originalSourceCode.addSourceMap(sourceMap);

        // If the originalSourceCode was not a Resource, be sure to also associate with the Resource if one exists.
        // FIXME: We should try to use the right frame instead of a global lookup by URL.
        if (!(sourceMap.originalSourceCode instanceof WI.Resource)) {
            console.assert(sourceMap.originalSourceCode instanceof WI.Script);
            let resource = sourceMap.originalSourceCode.resource;
            if (resource)
                resource.addSourceMap(sourceMap);
        }
    }

    _handleResourceContentChangedForLocalResourceOverride(event)
    {
        let localResourceOverride = event.target.localResourceOverride;
        if (!localResourceOverride)
            return;

        if (!this._saveLocalResourceOverridesDebouncer) {
            this._pendingLocalResourceOverrideSaves = new Set;
            this._saveLocalResourceOverridesDebouncer = new Debouncer(() => {
                for (let localResourceOverride of this._pendingLocalResourceOverrideSaves) {
                    console.assert(localResourceOverride instanceof WI.LocalResourceOverride);
                    WI.objectStores.localResourceOverrides.putObject(localResourceOverride);
                }
            });
        }

        this._pendingLocalResourceOverrideSaves.add(localResourceOverride);
        this._saveLocalResourceOverridesDebouncer.delayForTime(500);
    }

    _handleResourceOverrideDisabledChanged(event)
    {
        console.assert(WI.NetworkManager.supportsOverridingResponses());

        let localResourceOverride = event.target;
        WI.objectStores.localResourceOverrides.putObject(localResourceOverride);

        if (localResourceOverride.disabled)
            this._removeInterception(localResourceOverride);
        else
            this._addInterception(localResourceOverride);
    }

    _handleResourceOverrideResourceErrorTypeChanged(event)
    {
        console.assert(WI.NetworkManager.supportsBlockingRequests());

        let localResourceOverride = event.target;
        WI.objectStores.localResourceOverrides.putObject(localResourceOverride);
    }

    _handleBootstrapScriptContentDidChange(event)
    {
        let source = this._bootstrapScript.content || "";

        WI.objectStores.general.put(source, NetworkManager.bootstrapScriptSourceObjectStoreKey);

        if (!this._bootstrapScriptEnabledSetting.value)
            return;

        // COMPATIBILITY (iOS 13.0): Page.setBootstrapScript did not exist yet.
        for (let target of WI.targets) {
            if (target.hasCommand("Page.setBootstrapScript"))
                target.PageAgent.setBootstrapScript(source);
        }
    }

    _extraDomainsActivated(event)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        let target = WI.assumingMainTarget();
        if (target.hasDomain("Page") && event.data.domains.includes("Page"))
            target.PageAgent.getResourceTree(this._processMainFrameResourceTreePayload.bind(this));
    }

    _handleFrameMainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        WI.LocalResource.resetPathsThatFailedToLoadFromFileSystem();

        this._sourceMapURLMap.clear();
        this._downloadingSourceMaps.clear();
        this._failedSourceMapURLs.clear();
    }
};

// Keep this in sync with `Network.NetworkStage`.
WI.NetworkManager.NetworkStage = {
    Request: "request",
    Response: "response",
};

WI.NetworkManager.EmulatedCondition = {
    // Keep this first.
    None: {
        id: "none",
        bytesPerSecondLimit: 0,
        get displayName() { return WI.UIString("No throttling", "Label indicating that network throttling is inactive."); }
    },

    Mobile3G: {
        id: "mobile-3g",
        bytesPerSecondLimit: 780 * 1000 / 8, // 780kbps
        get displayName() { return WI.UIString("3G", "Label indicating that network activity is being simulated with 3G connectivity."); }
    },

    DSL: {
        id: "dsl",
        bytesPerSecondLimit: 2 * 1000 * 1000 / 8, // 2mbps
        get displayName() { return WI.UIString("DSL", "Label indicating that network activity is being simulated with DSL connectivity."); }
    },

    Edge: {
        id: "edge",
        bytesPerSecondLimit: 240 * 1000 / 8, // 240kbps
        get displayName() { return WI.UIString("Edge", "Label indicating that network activity is being simulated with Edge connectivity."); }
    },

    LTE: {
        id: "lte",
        bytesPerSecondLimit: 50 * 1000 * 1000 / 8, // 50mbps
        get displayName() { return WI.UIString("LTE", "Label indicating that network activity is being simulated with LTE connectivity"); }
    },

    WiFi: {
        id: "wifi",
        bytesPerSecondLimit: 40 * 1000 * 1000 / 8, // 40mbps
        get displayName() { return WI.UIString("Wi-Fi", "Label indicating that network activity is being simulated with Wi-Fi connectivity"); }
    },

    WiFi802_11ac: {
        id: "wifi-802_11ac",
        bytesPerSecondLimit: 250 * 1000 * 1000 / 8, // 250mbps
        get displayName() { return WI.UIString("Wi-Fi 802.11ac", "Label indicating that network activity is being simulated with Wi-Fi 802.11ac connectivity"); }
    },
};

WI.NetworkManager.Event = {
    FrameWasAdded: "network-manager-frame-was-added",
    FrameWasRemoved: "network-manager-frame-was-removed",
    MainFrameDidChange: "network-manager-main-frame-did-change",
    BootstrapScriptCreated: "network-manager-bootstrap-script-created",
    BootstrapScriptEnabledChanged: "network-manager-bootstrap-script-enabled-changed",
    BootstrapScriptDestroyed: "network-manager-bootstrap-script-destroyed",
    LocalResourceOverrideAdded: "network-manager-local-resource-override-added",
    LocalResourceOverrideRemoved: "network-manager-local-resource-override-removed",
    EmulatedConditionChanged: "network-manager-emulated-condition-changed",
};
