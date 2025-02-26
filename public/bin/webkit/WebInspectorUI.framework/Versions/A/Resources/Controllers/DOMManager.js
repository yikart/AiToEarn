/*
 * Copyright (C) 2009, 2010 Google Inc. All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

// FIXME: DOMManager lacks advanced multi-target support. (DOMNodes per-target)

WI.DOMManager = class DOMManager extends WI.Object
{
    constructor()
    {
        super();

        this._idToDOMNode = {};
        this._document = null;
        this._documentPromise = null;
        this._attributeLoadNodeIds = {};
        this._restoreSelectedNodeIsAllowed = true;
        this._loadNodeAttributesTimeout = 0;
        this._inspectedNode = null;

        this._breakpointsForEventListeners = new Map;

        this._hasRequestedDocument = false;
        this._pendingDocumentRequestCallbacks = null;

        WI.EventBreakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this._handleEventBreakpointDisabledStateChanged, this);
        WI.EventBreakpoint.addEventListener(WI.Breakpoint.Event.ConditionDidChange, this._handleEventBreakpointEditablePropertyChanged, this);
        WI.EventBreakpoint.addEventListener(WI.Breakpoint.Event.IgnoreCountDidChange, this._handleEventBreakpointEditablePropertyChanged, this);
        WI.EventBreakpoint.addEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this._handleEventBreakpointEditablePropertyChanged, this);
        WI.EventBreakpoint.addEventListener(WI.Breakpoint.Event.ActionsDidChange, this._handleEventBreakpointActionsChanged, this);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
    }

    // Target

    initializeTarget(target)
    {
        // FIXME: This should be improved when adding better DOM multi-target support since it is really per-target.
        // This currently uses a setTimeout since it doesn't need to happen immediately, and DOMManager uses the
        // global DOMAgent to request the document, so we want to make sure we've transitioned the global agents
        // to this target if necessary.
        if (target.hasDomain("DOM")) {
            setTimeout(() => {
                this.ensureDocument();
            });

            if (WI.engineeringSettingsAllowed()) {
                if (DOMManager.supportsEditingUserAgentShadowTrees({target}))
                    target.DOMAgent.setAllowEditingUserAgentShadowTrees(WI.settings.engineeringAllowEditingUserAgentShadowTrees.value);
            }
        }
    }

    transitionPageTarget()
    {
        this._documentUpdated();
    }

    // Static

    static buildHighlightConfigs(mode)
    {
        mode = mode || "all";

        let commandArguments = {
            highlightConfig: {showInfo: mode === "all"},
        };

        if (mode === "all" || mode === "content")
            commandArguments.highlightConfig.contentColor = {r: 111, g: 168, b: 220, a: 0.66};

        if (mode === "all" || mode === "padding")
            commandArguments.highlightConfig.paddingColor = {r: 147, g: 196, b: 125, a: 0.66};

        if (mode === "all" || mode === "border")
            commandArguments.highlightConfig.borderColor = {r: 255, g: 229, b: 153, a: 0.66};

        if (mode === "all" || mode === "margin")
            commandArguments.highlightConfig.marginColor = {r: 246, g: 178, b: 107, a: 0.66};

        if (WI.settings.showGridOverlayDuringElementSelection.value) {
            commandArguments.gridOverlayConfig = {
                gridColor: WI.DOMNode.defaultLayoutOverlayColor.toProtocol(),
                showLineNames: WI.settings.gridOverlayShowLineNames.value,
                showLineNumbers: WI.settings.gridOverlayShowLineNumbers.value,
                showExtendedGridLines: WI.settings.gridOverlayShowExtendedGridLines.value,
                showTrackSizes: WI.settings.gridOverlayShowTrackSizes.value,
                showAreaNames: WI.settings.gridOverlayShowAreaNames.value,
            };
        }

        if (WI.settings.showFlexOverlayDuringElementSelection.value) {
            commandArguments.flexOverlayConfig = {
                flexColor: WI.DOMNode.defaultLayoutOverlayColor.toProtocol(),
                showOrderNumbers: WI.settings.flexOverlayShowOrderNumbers.value,
            };
        }

        if (WI.settings.showRulersDuringElementSelection.value)
            commandArguments.showRulers = true;

        return commandArguments;
    }

    static wrapClientCallback(callback)
    {
        if (!callback)
            return null;

        return function(error, result) {
            if (error)
                console.error("Error during DOMAgent operation: " + error);
            callback(error ? null : result);
        };
    }

    static supportsEventListenerBreakpoints()
    {
        return InspectorBackend.hasCommand("DOM.setBreakpointForEventListener")
            && InspectorBackend.hasCommand("DOM.removeBreakpointForEventListener");
    }

    static supportsEventListenerBreakpointConfiguration()
    {
        // COMPATIBILITY (iOS 14): DOM.setBreakpointForEventListener did not have an "options" parameter yet.
        return InspectorBackend.hasCommand("DOM.setBreakpointForEventListener", "options");
    }

    static supportsEditingUserAgentShadowTrees({frontendOnly, target} = {})
    {
        target = target || InspectorBackend;
        return WI.settings.engineeringAllowEditingUserAgentShadowTrees.value
            && (frontendOnly || target.hasCommand("DOM.setAllowEditingUserAgentShadowTrees"));

    }

    // Public

    get inspectedNode() { return this._inspectedNode; }

    get eventListenerBreakpoints()
    {
        return Array.from(this._breakpointsForEventListeners.values());
    }

    *attachedNodes({filter} = {})
    {
        if (!this._document)
            return;

        filter ??= (node) => true;

        // Traverse the node tree in the same order items would appear if the entire tree were expanded in order to
        // provide a predictable order for the results.
        let currentBranch = [this._document];
        while (currentBranch.length) {
            let currentNode = currentBranch.at(-1);

            if (filter(currentNode))
                yield currentNode;

            // The `::before` pseudo element is the first child of any node.
            let beforePseudoElement = currentNode.beforePseudoElement();
            if (beforePseudoElement && filter(beforePseudoElement))
                yield beforePseudoElement;

            let firstChild = currentNode.children?.[0];
            if (firstChild) {
                currentBranch.push(firstChild);
                continue;
            }

            while (currentBranch.length) {
                let parent = currentBranch.pop();

                // The `::after` pseudo element is the last child of any node.
                let parentAfterPseudoElement = parent.afterPseudoElement();
                if (parentAfterPseudoElement && filter(parentAfterPseudoElement))
                    yield parentAfterPseudoElement;

                if (parent.nextSibling) {
                    currentBranch.push(parent.nextSibling);
                    break;
                }
            }
        }
    }

    requestDocument(callback)
    {
        if (typeof callback !== "function")
            return this._requestDocumentWithPromise();

        this._requestDocumentWithCallback(callback);
    }

    ensureDocument()
    {
        this.requestDocument(function(){});
    }

    pushNodeToFrontend(objectId, callback)
    {
        let target = WI.assumingMainTarget();
        this._dispatchWhenDocumentAvailable((callbackWrapper) => {
            target.DOMAgent.requestNode(objectId, callbackWrapper);
        }, callback);
    }

    pushNodeByPathToFrontend(path, callback)
    {
        let target = WI.assumingMainTarget();
        this._dispatchWhenDocumentAvailable((callbackWrapper) => {
            target.DOMAgent.pushNodeByPathToFrontend(path, callbackWrapper);
        }, callback);
    }

    // DOMObserver

    willDestroyDOMNode(nodeId)
    {
        let node = this._idToDOMNode[nodeId];
        node.markDestroyed();
        delete this._idToDOMNode[nodeId];

        this.dispatchEventToListeners(WI.DOMManager.Event.NodeRemoved, {node});
    }

    didAddEventListener(nodeId)
    {
        let node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node.dispatchEventToListeners(WI.DOMNode.Event.EventListenersChanged);
    }

    willRemoveEventListener(nodeId)
    {
        let node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node.dispatchEventToListeners(WI.DOMNode.Event.EventListenersChanged);
    }

    didFireEvent(nodeId, eventName, timestamp, data)
    {
        let node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node.didFireEvent(eventName, timestamp, data);
    }

    powerEfficientPlaybackStateChanged(nodeId, timestamp, isPowerEfficient)
    {
        let node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node.powerEfficientPlaybackStateChanged(timestamp, isPowerEfficient);
    }

    // CSSObserver

    nodeLayoutFlagsChanged(nodeId, layoutFlags)
    {
        let domNode = this._idToDOMNode[nodeId];
        console.assert(domNode instanceof WI.DOMNode, domNode, nodeId);
        if (!domNode)
            return;

        domNode.layoutFlags = layoutFlags;
    }

    // Private

    _dispatchWhenDocumentAvailable(func, callback)
    {
        var callbackWrapper = DOMManager.wrapClientCallback(callback);

        function onDocumentAvailable()
        {
            if (this._document)
                func(callbackWrapper);
            else {
                if (callbackWrapper)
                    callbackWrapper("No document");
            }
        }
        this.requestDocument(onDocumentAvailable.bind(this));
    }

    _requestDocumentWithPromise()
    {
        if (this._documentPromise)
            return this._documentPromise.promise;

        this._documentPromise = new WI.WrappedPromise;
        if (this._document)
            this._documentPromise.resolve(this._document);
        else {
            this._requestDocumentWithCallback((doc) => {
                this._documentPromise.resolve(doc);
            });
        }

        return this._documentPromise.promise;
    }

    _requestDocumentWithCallback(callback)
    {
        if (this._document) {
            callback(this._document);
            return;
        }

        if (this._pendingDocumentRequestCallbacks)
            this._pendingDocumentRequestCallbacks.push(callback);
        else
            this._pendingDocumentRequestCallbacks = [callback];

        if (this._hasRequestedDocument)
            return;

        if (!WI.pageTarget)
            return;

        if (!WI.pageTarget.hasDomain("DOM"))
            return;

        this._hasRequestedDocument = true;

        WI.pageTarget.DOMAgent.getDocument((error, root) => {
            if (!error)
                this._setDocument(root);

            for (let callback of this._pendingDocumentRequestCallbacks)
                callback(this._document);

            this._pendingDocumentRequestCallbacks = null;
        });
    }

    _attributeModified(nodeId, name, value)
    {
        var node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node._setAttribute(name, value);
        this.dispatchEventToListeners(WI.DOMManager.Event.AttributeModified, {node, name});
        node.dispatchEventToListeners(WI.DOMNode.Event.AttributeModified, {name});
    }

    _attributeRemoved(nodeId, name)
    {
        var node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node._removeAttribute(name);
        this.dispatchEventToListeners(WI.DOMManager.Event.AttributeRemoved, {node, name});
        node.dispatchEventToListeners(WI.DOMNode.Event.AttributeRemoved, {name});
    }

    _inlineStyleInvalidated(nodeIds)
    {
        for (var nodeId of nodeIds)
            this._attributeLoadNodeIds[nodeId] = true;
        if (this._loadNodeAttributesTimeout)
            return;
        this._loadNodeAttributesTimeout = setTimeout(this._loadNodeAttributes.bind(this), 0);
    }

    _loadNodeAttributes()
    {
        function callback(nodeId, error, attributes)
        {
            if (error) {
                console.error("Error during DOMAgent operation: " + error);
                return;
            }
            var node = this._idToDOMNode[nodeId];
            if (node) {
                node._setAttributesPayload(attributes);
                this.dispatchEventToListeners(WI.DOMManager.Event.AttributeModified, {node, name: "style"});
                node.dispatchEventToListeners(WI.DOMNode.Event.AttributeModified, {name: "style"});
            }
        }

        this._loadNodeAttributesTimeout = 0;

        let target = WI.assumingMainTarget();

        for (var nodeId in this._attributeLoadNodeIds) {
            if (!(nodeId in this._idToDOMNode))
                continue;
            var nodeIdAsNumber = parseInt(nodeId);
            target.DOMAgent.getAttributes(nodeIdAsNumber, callback.bind(this, nodeIdAsNumber));
        }
        this._attributeLoadNodeIds = {};
    }

    _characterDataModified(nodeId, newValue)
    {
        var node = this._idToDOMNode[nodeId];
        node._nodeValue = newValue;
        this.dispatchEventToListeners(WI.DOMManager.Event.CharacterDataModified, {node});
    }

    nodeForId(nodeId)
    {
        return this._idToDOMNode[nodeId] || null;
    }

    _documentUpdated()
    {
        this._setDocument(null);
    }

    _setDocument(payload)
    {
        for (let node of Object.values(this._idToDOMNode))
            node.markDestroyed();

        this._idToDOMNode = {};

        for (let breakpoint of this._breakpointsForEventListeners.values())
            WI.domDebuggerManager.dispatchEventToListeners(WI.DOMDebuggerManager.Event.EventBreakpointRemoved, {breakpoint});
        this._breakpointsForEventListeners.clear();

        let newDocument = null;
        if (payload && "nodeId" in payload)
            newDocument = new WI.DOMNode(this, null, false, payload);

        if (this._document === newDocument)
            return;

        this._document = newDocument;

        // Force the promise to be recreated so that it resolves to the new document.
        this._documentPromise = null;

        if (!this._document)
            this._hasRequestedDocument = false;

        this.dispatchEventToListeners(WI.DOMManager.Event.DocumentUpdated, {document: this._document});
    }

    _setDetachedRoot(payload)
    {
        new WI.DOMNode(this, null, false, payload);
    }

    _setChildNodes(parentId, payloads)
    {
        if (!parentId && payloads.length) {
            this._setDetachedRoot(payloads[0]);
            return;
        }

        var parent = this._idToDOMNode[parentId];

        if (parent.children) {
            for (let node of parent.children)
                this.dispatchEventToListeners(WI.DOMManager.Event.NodeRemoved, {node, parent});
        }

        parent._setChildrenPayload(payloads);

        for (let node of parent.children)
            this.dispatchEventToListeners(WI.DOMManager.Event.NodeInserted, {node, parent});
    }

    _childNodeCountUpdated(nodeId, newValue)
    {
        var node = this._idToDOMNode[nodeId];
        node.childNodeCount = newValue;
        this.dispatchEventToListeners(WI.DOMManager.Event.ChildNodeCountUpdated, node);
    }

    _childNodeInserted(parentId, prevId, payload)
    {
        var parent = this._idToDOMNode[parentId];
        var prev = this._idToDOMNode[prevId];
        var node = parent._insertChild(prev, payload);
        this._idToDOMNode[node.id] = node;
        this.dispatchEventToListeners(WI.DOMManager.Event.NodeInserted, {node, parent});
    }

    _childNodeRemoved(parentId, nodeId)
    {
        var parent = this._idToDOMNode[parentId];
        var node = this._idToDOMNode[nodeId];
        parent._removeChild(node);
        this._unbind(node);
        this.dispatchEventToListeners(WI.DOMManager.Event.NodeRemoved, {node, parent});
    }

    _customElementStateChanged(elementId, newState)
    {
        const node = this._idToDOMNode[elementId];
        node._customElementState = newState;
        this.dispatchEventToListeners(WI.DOMManager.Event.CustomElementStateChanged, {node});
    }

    _pseudoElementAdded(parentId, pseudoElement)
    {
        var parent = this._idToDOMNode[parentId];
        if (!parent)
            return;

        var node = new WI.DOMNode(this, parent.ownerDocument, false, pseudoElement);
        node.parentNode = parent;
        this._idToDOMNode[node.id] = node;
        console.assert(!parent.pseudoElements().get(node.pseudoType()));
        parent.pseudoElements().set(node.pseudoType(), node);
        this.dispatchEventToListeners(WI.DOMManager.Event.NodeInserted, {node, parent});
    }

    _pseudoElementRemoved(parentId, pseudoElementId)
    {
        var pseudoElement = this._idToDOMNode[pseudoElementId];
        if (!pseudoElement)
            return;

        var parent = pseudoElement.parentNode;
        console.assert(parent);
        console.assert(parent.id === parentId);
        if (!parent)
            return;

        parent._removeChild(pseudoElement);
        this._unbind(pseudoElement);
        this.dispatchEventToListeners(WI.DOMManager.Event.NodeRemoved, {node: pseudoElement, parent});
    }

    _unbind(node)
    {
        node.markDestroyed();

        delete this._idToDOMNode[node.id];

        for (let i = 0; node.children && i < node.children.length; ++i)
            this._unbind(node.children[i]);

        let templateContent = node.templateContent();
        if (templateContent)
            this._unbind(templateContent);

        for (let pseudoElement of node.pseudoElements().values())
            this._unbind(pseudoElement);

        // FIXME: Handle shadow roots.
    }

    get restoreSelectedNodeIsAllowed()
    {
        return this._restoreSelectedNodeIsAllowed;
    }

    inspectElement(nodeId, options = {})
    {
        var node = this._idToDOMNode[nodeId];
        if (!node || !node.ownerDocument)
            return;

        // This code path is hit by "Reveal in DOM Tree" and clicking element links/console widgets.
        // Unless overridden by callers, assume that this is navigation is initiated by a Inspect mode.
        let initiatorHint = options.initiatorHint || WI.TabBrowser.TabNavigationInitiator.Inspect;
        this.dispatchEventToListeners(WI.DOMManager.Event.DOMNodeWasInspected, {node, initiatorHint});

        this._inspectModeEnabled = false;
        this.dispatchEventToListeners(WI.DOMManager.Event.InspectModeStateChanged);
    }

    inspectNodeObject(remoteObject)
    {
        this._restoreSelectedNodeIsAllowed = false;

        function nodeAvailable(nodeId)
        {
            remoteObject.release();

            console.assert(nodeId);
            if (!nodeId)
                return;

            this.inspectElement(nodeId);

            // Re-resolve the node in the console's object group when adding to the console.
            let domNode = this.nodeForId(nodeId);
            WI.RemoteObject.resolveNode(domNode, WI.RuntimeManager.ConsoleObjectGroup).then((remoteObject) => {
                WI.consoleLogViewController.appendImmediateExecutionWithResult(WI.UIString("Selected Element"), remoteObject, {addSpecialUserLogClass: true});
            });
        }

        remoteObject.pushNodeToFrontend(nodeAvailable.bind(this));
    }

    highlightDOMNodeList(nodes, mode)
    {
        if (this._hideDOMNodeHighlightTimeout) {
            clearTimeout(this._hideDOMNodeHighlightTimeout);
            this._hideDOMNodeHighlightTimeout = undefined;
        }

        let nodeIds = [];
        for (let node of nodes) {
            console.assert(node instanceof WI.DOMNode, node);
            console.assert(!node.destroyed, node);
            if (node.destroyed)
                continue;
            nodeIds.push(node.id);
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.highlightNodeList.invoke({
            nodeIds,
            ...WI.DOMManager.buildHighlightConfigs(mode),
        });
    }

    highlightSelector(selectorString, frameId, mode)
    {
        if (this._hideDOMNodeHighlightTimeout) {
            clearTimeout(this._hideDOMNodeHighlightTimeout);
            this._hideDOMNodeHighlightTimeout = undefined;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.highlightSelector.invoke({
            selectorString,
            frameId,
            ...WI.DOMManager.buildHighlightConfigs(mode),
        });
    }

    highlightRect(rect, usePageCoordinates)
    {
        let target = WI.assumingMainTarget();
        target.DOMAgent.highlightRect.invoke({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            color: {r: 111, g: 168, b: 220, a: 0.66},
            outlineColor: {r: 255, g: 229, b: 153, a: 0.66},
            usePageCoordinates
        });
    }

    hideDOMNodeHighlight()
    {
        for (let target of WI.targets) {
            if (target.hasCommand("DOM.hideHighlight"))
                target.DOMAgent.hideHighlight();
        }
    }

    highlightDOMNodeForTwoSeconds(nodeId)
    {
        let node = this._idToDOMNode[nodeId];
        if (!node)
            return;

        node.highlight();

        this._hideDOMNodeHighlightTimeout = setTimeout(this.hideDOMNodeHighlight.bind(this), 2000);
    }

    get inspectModeEnabled()
    {
        return this._inspectModeEnabled;
    }

    set inspectModeEnabled(enabled)
    {
        if (enabled === this._inspectModeEnabled)
            return;

        let target = WI.assumingMainTarget();
        target.DOMAgent.setInspectModeEnabled.invoke({
            enabled,
            ...WI.DOMManager.buildHighlightConfigs(),
        }, (error) => {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this._inspectModeEnabled = enabled;
            this.dispatchEventToListeners(WI.DOMManager.Event.InspectModeStateChanged);
        });
    }

    setInspectedNode(node)
    {
        console.assert(node instanceof WI.DOMNode);
        if (node === this._inspectedNode)
            return;

        console.assert(!node.destroyed, node);
        if (node.destroyed)
            return;

        let callback = (error) => {
            console.assert(!error, error);
            if (error)
                return;

            let lastInspectedNode = this._inspectedNode;
            this._inspectedNode = node;

            this.dispatchEventToListeners(WI.DOMManager.Event.InspectedNodeChanged, {lastInspectedNode});
        };

        let target = WI.assumingMainTarget();
        target.DOMAgent.setInspectedNode(node.id, callback);
    }

    getSupportedEventNames(callback)
    {
        let target = WI.assumingMainTarget();
        if (!target.hasCommand("DOM.getSupportedEventNames"))
            return Promise.resolve(new Set);

        if (!this._getSupportedEventNamesPromise) {
            this._getSupportedEventNamesPromise = target.DOMAgent.getSupportedEventNames()
            .then(({eventNames}) => new Set(eventNames));
        }

        return this._getSupportedEventNamesPromise;
    }

    setEventListenerDisabled(eventListener, disabled)
    {
        let target = WI.assumingMainTarget();
        target.DOMAgent.setEventListenerDisabled(eventListener.eventListenerId, disabled);
    }

    setBreakpointForEventListener(eventListener)
    {
        let breakpoint = this._breakpointsForEventListeners.get(eventListener.eventListenerId);
        if (breakpoint) {
            console.assert(breakpoint.disabled);
            breakpoint.disabled = false;
            return;
        }

        breakpoint = new WI.EventBreakpoint(WI.EventBreakpoint.Type.Listener, {eventName: eventListener.type, eventListener});
        console.assert(!breakpoint.disabled);

        this._breakpointsForEventListeners.set(eventListener.eventListenerId, breakpoint);

        for (let target of WI.targets) {
            if (target.hasDomain("DOM"))
                this._setEventBreakpoint(breakpoint, target);
        }

        WI.debuggerManager.addProbesForBreakpoint(breakpoint);

        WI.domDebuggerManager.dispatchEventToListeners(WI.DOMDebuggerManager.Event.EventBreakpointAdded, {breakpoint});
    }

    removeBreakpointForEventListener(eventListener)
    {
        let breakpoint = this._breakpointsForEventListeners.take(eventListener.eventListenerId);
        if (!breakpoint)
            return;

        // Disable the breakpoint first, so removing actions doesn't re-add the breakpoint.
        breakpoint.disabled = true;
        breakpoint.clearActions();

        WI.debuggerManager.removeProbesForBreakpoint(breakpoint);

        WI.domDebuggerManager.dispatchEventToListeners(WI.DOMDebuggerManager.Event.EventBreakpointRemoved, {breakpoint});
    }

    removeEventListenerBreakpointsForNode(domNode)
    {
        for (let breakpoint of Array.from(this._breakpointsForEventListeners.values())) {
            let eventListener = breakpoint.eventListener;
            if (eventListener.nodeId === domNode.id)
                this.removeBreakpointForEventListener(eventListener);
        }
    }

    breakpointForEventListenerId(eventListenerId)
    {
        return this._breakpointsForEventListeners.get(eventListenerId) || null;
    }

    // Private

    _setEventBreakpoint(breakpoint, target)
    {
        console.assert(!breakpoint.disabled, breakpoint);

        let eventListener = breakpoint.eventListener;
        console.assert(eventListener);

            if (!WI.debuggerManager.breakpointsDisabledTemporarily)
                WI.debuggerManager.breakpointsEnabled = true;

        target.DOMAgent.setBreakpointForEventListener.invoke({
            eventListenerId: eventListener.eventListenerId,
            options: breakpoint.optionsToProtocol(),
        });
    }

    _removeEventBreakpoint(breakpoint, target)
    {
        let eventListener = breakpoint.eventListener;
        console.assert(eventListener);

        target.DOMAgent.removeBreakpointForEventListener(eventListener.eventListenerId);
    }

    _handleEventBreakpointDisabledStateChanged(event)
    {
        let breakpoint = event.target;

        // Non-specific event listener breakpoints are handled by `DOMDebuggerManager`.
        if (!breakpoint.eventListener)
            return;

        for (let target of WI.targets) {
            if (!target.hasDomain("DOM"))
                continue;

            if (breakpoint.disabled)
                this._removeEventBreakpoint(breakpoint, target);
            else
                this._setEventBreakpoint(breakpoint, target);
        }
    }

    _handleEventBreakpointEditablePropertyChanged(event)
    {
        let breakpoint = event.target;

        // Non-specific event listener breakpoints are handled by `DOMDebuggerManager`.
        if (!breakpoint.eventListener)
            return;

        if (breakpoint.disabled)
            return;

        for (let target of WI.targets) {
            // Clear the old breakpoint from the backend before setting the new one.
            this._removeEventBreakpoint(breakpoint, target);
            this._setEventBreakpoint(breakpoint, target);
        }
    }

    _handleEventBreakpointActionsChanged(event)
    {
        let breakpoint = event.target;

        // Non-specific event listener breakpoints are handled by `DOMDebuggerManager`.
        if (!breakpoint.eventListener)
            return;

        this._handleEventBreakpointEditablePropertyChanged(event);

        WI.debuggerManager.updateProbesForBreakpoint(breakpoint);
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this._restoreSelectedNodeIsAllowed = true;

        this.ensureDocument();

        WI.DOMNode.resetDefaultLayoutOverlayConfiguration();
    }
};

WI.DOMManager.Event = {
    AttributeModified: "dom-manager-attribute-modified",
    AttributeRemoved: "dom-manager-attribute-removed",
    CharacterDataModified: "dom-manager-character-data-modified",
    NodeInserted: "dom-manager-node-inserted",
    NodeRemoved: "dom-manager-node-removed",
    CustomElementStateChanged: "dom-manager-custom-element-state-changed",
    DocumentUpdated: "dom-manager-document-updated",
    ChildNodeCountUpdated: "dom-manager-child-node-count-updated",
    DOMNodeWasInspected: "dom-manager-dom-node-was-inspected",
    InspectModeStateChanged: "dom-manager-inspect-mode-state-changed",
    InspectedNodeChanged: "dom-manager-inspected-node-changed",
};
