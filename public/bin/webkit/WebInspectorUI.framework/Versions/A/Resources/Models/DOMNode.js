/*
 * Copyright (C) 2009, 2010 Google Inc. All rights reserved.
 * Copyright (C) 2009 Joseph Pecoraro
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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

WI.DOMNode = class DOMNode extends WI.Object
{
    constructor(domManager, doc, isInShadowTree, payload)
    {
        super();

        this._destroyed = false;

        this._domManager = domManager;
        this._isInShadowTree = isInShadowTree;

        this.id = payload.nodeId;
        this._domManager._idToDOMNode[this.id] = this;

        this._nodeType = payload.nodeType;
        this._nodeName = payload.nodeName;
        this._localName = payload.localName;
        this._nodeValue = payload.nodeValue;
        this._pseudoType = payload.pseudoType;
        this._shadowRootType = payload.shadowRootType;
        this._computedRole = null;
        this._contentSecurityPolicyHash = payload.contentSecurityPolicyHash;

        this._layoutFlags = [];
        this._layoutOverlayShowing = false;
        this._layoutOverlayColorSetting = null;

        if (this._nodeType === Node.DOCUMENT_NODE)
            this.ownerDocument = this;
        else
            this.ownerDocument = doc;

        this._frame = null;

        // COMPATIBILITY (iOS 12.2): DOM.Node.frameId was changed to represent the owner frame, not the content frame.
        // Since support can't be tested directly, check for Audit (iOS 13.0+).
        // FIXME: Use explicit version checking once https://webkit.org/b/148680 is fixed.
        if (InspectorBackend.hasDomain("Audit")) {
            if (payload.frameId)
                this._frame = WI.networkManager.frameForIdentifier(payload.frameId);
        }

        if (!this._frame && this.ownerDocument)
            this._frame = WI.networkManager.frameForIdentifier(this.ownerDocument.frameIdentifier);

        this._attributes = [];
        this._attributesMap = new Map;
        if (payload.attributes)
            this._setAttributesPayload(payload.attributes);

        this._childNodeCount = payload.childNodeCount;
        this._children = null;

        this._nextSibling = null;
        this._previousSibling = null;
        this.parentNode = null;

        this._enabledPseudoClasses = [];

        // FIXME: The logic around this._shadowRoots and this._children is very confusing.
        // We eventually include shadow roots at the start of _children. However we might
        // not have our actual children yet. So we try to defer initializing _children until
        // we have both shadowRoots and child nodes.
        this._shadowRoots = [];
        if (payload.shadowRoots) {
            for (var i = 0; i < payload.shadowRoots.length; ++i) {
                var root = payload.shadowRoots[i];
                var node = new WI.DOMNode(this._domManager, this.ownerDocument, true, root);
                node.parentNode = this;
                this._shadowRoots.push(node);
            }
        }

        if (payload.children)
            this._setChildrenPayload(payload.children);
        else if (this._shadowRoots.length && !this._childNodeCount)
            this._children = this._shadowRoots.slice();

        if (this._nodeType === Node.ELEMENT_NODE)
            this._customElementState = payload.customElementState || WI.DOMNode.CustomElementState.Builtin;
        else
            this._customElementState = null;

        if (payload.templateContent) {
            this._templateContent = new WI.DOMNode(this._domManager, this.ownerDocument, false, payload.templateContent);
            this._templateContent.parentNode = this;
        }

        this._pseudoElements = new Map;
        if (payload.pseudoElements) {
            for (var i = 0; i < payload.pseudoElements.length; ++i) {
                var node = new WI.DOMNode(this._domManager, this.ownerDocument, this._isInShadowTree, payload.pseudoElements[i]);
                node.parentNode = this;
                this._pseudoElements.set(node.pseudoType(), node);
            }
        }

        if (payload.contentDocument) {
            this._contentDocument = new WI.DOMNode(this._domManager, null, false, payload.contentDocument);
            this._children = [this._contentDocument];
            this._renumber();
        }

        if (this._nodeType === Node.ELEMENT_NODE) {
            // HTML and BODY from internal iframes should not overwrite top-level ones.
            if (this.ownerDocument && !this.ownerDocument.documentElement && this._nodeName === "HTML")
                this.ownerDocument.documentElement = this;
            if (this.ownerDocument && !this.ownerDocument.body && this._nodeName === "BODY")
                this.ownerDocument.body = this;
            if (payload.documentURL)
                this.documentURL = payload.documentURL;
        } else if (this._nodeType === Node.DOCUMENT_TYPE_NODE) {
            this.publicId = payload.publicId;
            this.systemId = payload.systemId;
        } else if (this._nodeType === Node.DOCUMENT_NODE) {
            this.documentURL = payload.documentURL;
            this.xmlVersion = payload.xmlVersion;
        } else if (this._nodeType === Node.ATTRIBUTE_NODE) {
            this.name = payload.name;
            this.value = payload.value;
        }

        this._domEvents = [];
        this._powerEfficientPlaybackRanges = [];

        if (this.isMediaElement())
            WI.DOMNode.addEventListener(WI.DOMNode.Event.DidFireEvent, this._handleDOMNodeDidFireEvent, this);

        // COMPATIBILITY (macOS 13.0, iOS 16.0): CSS.LayoutContextType was renamed/expanded to CSS.LayoutFlag.
        if (!InspectorBackend.Enum.CSS.LayoutFlag) {
            let layoutFlags = [WI.DOMNode.LayoutFlag.Rendered];
            if (payload.layoutContextType)
                layoutFlags.push(payload.layoutContextType);
            this.layoutFlags = layoutFlags;
        } else
            this.layoutFlags = payload.layoutFlags;
    }

    // Static

    static get defaultLayoutOverlayColor()
    {
        return new WI.Color(WI.Color.Format.HSL, WI.DOMNode._defaultLayoutOverlayConfiguration.colors[0]);
    }

    static resetDefaultLayoutOverlayConfiguration()
    {
        let configuration = WI.DOMNode._defaultLayoutOverlayConfiguration;
        configuration.nextFlexColorIndex = 0;
        configuration.nextGridColorIndex = 0;
    }

    static getFullscreenDOMEvents(domEvents)
    {
        return domEvents.reduce((accumulator, current) => {
            if (current.eventName === "webkitfullscreenchange" && current.data && (!accumulator.length || accumulator.lastValue.data.enabled !== current.data.enabled))
                accumulator.push(current);
            return accumulator;
        }, []);
    }

    static isPlayEvent(eventName)
    {
        return eventName === "play"
            || eventName === "playing";
    }

    static isPauseEvent(eventName)
    {
        return eventName === "pause"
            || eventName === "stall";
    }

    static isStopEvent(eventName)
    {
        return eventName === "emptied"
            || eventName === "ended"
            || eventName === "suspend";
    }


    // Public

    get destroyed() { return this._destroyed; }
    get frame() { return this._frame; }
    get nextSibling() { return this._nextSibling; }
    get previousSibling() { return this._previousSibling; }
    get children() { return this._children; }
    get domEvents() { return this._domEvents; }
    get powerEfficientPlaybackRanges() { return this._powerEfficientPlaybackRanges; }
    get layoutOverlayShowing() { return this._layoutOverlayShowing; }

    get attached()
    {
        if (this._destroyed)
            return false;

        for (let node = this; node; node = node.parentNode) {
            if (node.ownerDocument === node)
                return true;
        }
        return false;
    }

    get firstChild()
    {
        var children = this.children;

        if (children && children.length > 0)
            return children[0];

        return null;
    }

    get lastChild()
    {
        var children = this.children;

        if (children && children.length > 0)
            return children.lastValue;

        return null;
    }

    get childNodeCount()
    {
        var children = this.children;
        if (children)
            return children.length;

        return this._childNodeCount + this._shadowRoots.length;
    }

    set childNodeCount(count)
    {
        this._childNodeCount = count;
    }

    get layoutFlags()
    {
        return this._layoutFlags;
    }

    set layoutFlags(layoutFlags)
    {
        layoutFlags ||= [];
        console.assert(Array.isArray(layoutFlags), layoutFlags);
        console.assert(layoutFlags.every((layoutFlag) => Object.values(WI.DOMNode.LayoutFlag).includes(layoutFlag)), layoutFlags);
        console.assert(layoutFlags.filter((layoutFlag) => WI.DOMNode._LayoutContextTypes.includes(layoutFlag)).length <= 1, layoutFlags);
        console.assert(!layoutFlags.length || !Array.shallowEqual(layoutFlags, this._layoutFlags), layoutFlags);

        let oldLayoutContextType = this.layoutContextType;

        this._layoutFlags = layoutFlags;

        this.dispatchEventToListeners(WI.DOMNode.Event.LayoutFlagsChanged);

        if (!this._layoutOverlayShowing)
            return;

        // The overlay is automatically hidden on the backend when the context type changes.
        this.dispatchEventToListeners(WI.DOMNode.Event.LayoutOverlayHidden);

        switch (oldLayoutContextType) {
        case WI.DOMNode.LayoutFlag.Flex:
            WI.settings.flexOverlayShowOrderNumbers.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            break;

        case WI.DOMNode.LayoutFlag.Grid:
            WI.settings.gridOverlayShowExtendedGridLines.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowLineNames.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowLineNumbers.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowTrackSizes.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowAreaNames.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            break;
        }
    }

    get layoutContextType()
    {
        return this._layoutFlags.find((layoutFlag) => WI.DOMNode._LayoutContextTypes.includes(layoutFlag)) || null;
    }

    markDestroyed()
    {
        console.assert(!this._destroyed, this);
        this._destroyed = true;

        this.layoutFlags = [];
    }

    computedRole()
    {
        return this._computedRole;
    }

    contentSecurityPolicyHash()
    {
        return this._contentSecurityPolicyHash;
    }

    hasAttributes()
    {
        return this._attributes.length > 0;
    }

    hasChildNodes()
    {
        return this.childNodeCount > 0;
    }

    hasShadowRoots()
    {
        return !!this._shadowRoots.length;
    }

    isInShadowTree()
    {
        return this._isInShadowTree;
    }

    isInUserAgentShadowTree()
    {
        return this._isInShadowTree && this.ancestorShadowRoot().isUserAgentShadowRoot();
    }

    isCustomElement()
    {
        return this._customElementState === WI.DOMNode.CustomElementState.Custom;
    }

    customElementState()
    {
        return this._customElementState;
    }

    isShadowRoot()
    {
        return !!this._shadowRootType;
    }

    isUserAgentShadowRoot()
    {
        return this._shadowRootType === WI.DOMNode.ShadowRootType.UserAgent;
    }

    ancestorShadowRoot()
    {
        if (!this._isInShadowTree)
            return null;

        let node = this;
        while (node && !node.isShadowRoot())
            node = node.parentNode;
        return node;
    }

    ancestorShadowHost()
    {
        let shadowRoot = this.ancestorShadowRoot();
        return shadowRoot ? shadowRoot.parentNode : null;
    }

    isPseudoElement()
    {
        return this._pseudoType !== undefined;
    }

    nodeType()
    {
        return this._nodeType;
    }

    nodeName()
    {
        return this._nodeName;
    }

    nodeNameInCorrectCase()
    {
        return this.isXMLNode() ? this.nodeName() : this.nodeName().toLowerCase();
    }

    setNodeName(name, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.setNodeName(this.id, name, this._makeUndoableCallback(callback));
    }

    localName()
    {
        return this._localName;
    }

    templateContent()
    {
        return this._templateContent || null;
    }

    pseudoType()
    {
        return this._pseudoType;
    }

    hasPseudoElements()
    {
        return this._pseudoElements.size > 0;
    }

    pseudoElements()
    {
        return this._pseudoElements;
    }

    beforePseudoElement()
    {
        return this._pseudoElements.get(WI.DOMNode.PseudoElementType.Before) || null;
    }

    afterPseudoElement()
    {
        return this._pseudoElements.get(WI.DOMNode.PseudoElementType.After) || null;
    }

    shadowRoots()
    {
        return this._shadowRoots;
    }

    shadowRootType()
    {
        return this._shadowRootType;
    }

    nodeValue()
    {
        return this._nodeValue;
    }

    setNodeValue(value, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.setNodeValue(this.id, value, this._makeUndoableCallback(callback));
    }

    getAttribute(name)
    {
        let attr = this._attributesMap.get(name);
        return attr ? attr.value : undefined;
    }

    setAttribute(name, text, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.setAttributesAsText(this.id, text, name, this._makeUndoableCallback(callback));
    }

    setAttributeValue(name, value, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            if (!callback)
                return Promise.reject("ERROR: node is destroyed");

            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();

        if (!callback) {
            return target.DOMAgent.setAttributeValue(this.id, name, value).then(() => {
                this._markUndoableState();
            });
        }

        target.DOMAgent.setAttributeValue(this.id, name, value, this._makeUndoableCallback(callback));
    }

    attributes()
    {
        return this._attributes;
    }

    removeAttribute(name, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        function mycallback(error, success)
        {
            if (!error) {
                this._attributesMap.delete(name);
                for (var i = 0; i < this._attributes.length; ++i) {
                    if (this._attributes[i].name === name) {
                        this._attributes.splice(i, 1);
                        break;
                    }
                }
            }

            this._makeUndoableCallback(callback)(error);
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.removeAttribute(this.id, name, mycallback.bind(this));
    }

    toggleClass(className, flag)
    {
        if (!className || !className.length)
            return;

        if (this.isPseudoElement()) {
            this.parentNode.toggleClass(className, flag);
            return;
        }

        if (this.nodeType() !== Node.ELEMENT_NODE)
            return;

        WI.RemoteObject.resolveNode(this).then((object) => {
            function inspectedPage_node_toggleClass(className, flag) {
                this.classList.toggle(className, flag);
            }

            object.callFunction(inspectedPage_node_toggleClass, [className, flag]);
            object.release();
        });
    }

    querySelector(selector, callback)
    {
        console.assert(!this._destroyed, this);

        let target = WI.assumingMainTarget();

        if (typeof callback !== "function") {
            if (this._destroyed)
                return Promise.reject("ERROR: node is destroyed");
            return target.DOMAgent.querySelector(this.id, selector).then(({nodeId}) => nodeId);
        }

        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        target.DOMAgent.querySelector(this.id, selector, WI.DOMManager.wrapClientCallback(callback));
    }

    querySelectorAll(selector, callback)
    {
        console.assert(!this._destroyed, this);

        let target = WI.assumingMainTarget();

        if (typeof callback !== "function") {
            if (this._destroyed)
                return Promise.reject("ERROR: node is destroyed");
            return target.DOMAgent.querySelectorAll(this.id, selector).then(({nodeIds}) => nodeIds);
        }

        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        target.DOMAgent.querySelectorAll(this.id, selector, WI.DOMManager.wrapClientCallback(callback));
    }

    highlight(mode)
    {
        if (this._destroyed)
            return;

        if (this._hideDOMNodeHighlightTimeout) {
            clearTimeout(this._hideDOMNodeHighlightTimeout);
            this._hideDOMNodeHighlightTimeout = undefined;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.highlightNode.invoke({
            nodeId: this.id,
            ...WI.DOMManager.buildHighlightConfigs(mode),
        });
    }

    showLayoutOverlay({color} = {})
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed)
            return Promise.reject("ERROR: node is destroyed");

        console.assert(Object.values(WI.DOMNode._LayoutContextTypes).includes(this.layoutContextType), this);

        console.assert(!color || color instanceof WI.Color, color);
        color ||= this.layoutOverlayColor;

        let target = WI.assumingMainTarget();
        let agentCommandFunction = null;
        let agentCommandArguments = {nodeId: this.id};

        switch (this.layoutContextType) {
        case WI.DOMNode.LayoutFlag.Grid:
            agentCommandArguments.gridOverlayConfig = {
                gridColor: color.toProtocol(),
                showLineNames: WI.settings.gridOverlayShowLineNames.value,
                showLineNumbers: WI.settings.gridOverlayShowLineNumbers.value,
                showExtendedGridLines: WI.settings.gridOverlayShowExtendedGridLines.value,
                showTrackSizes: WI.settings.gridOverlayShowTrackSizes.value,
                showAreaNames: WI.settings.gridOverlayShowAreaNames.value,
            };

            // COMPATIBILITY (macOS 13.3, iOS 16.4): DOM.GridOverlayConfig did not exist yet.
            if (!target.hasCommand("DOM.showGridOverlay", "gridOverlayConfig")) {
                for (let [key, value] in Object.entries(agentCommandArguments.gridOverlayConfig))
                    agentCommandArguments[key] = value;
            }

            agentCommandFunction = target.DOMAgent.showGridOverlay;

            if (!this._layoutOverlayShowing) {
                WI.settings.gridOverlayShowExtendedGridLines.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
                WI.settings.gridOverlayShowLineNames.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
                WI.settings.gridOverlayShowLineNumbers.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
                WI.settings.gridOverlayShowTrackSizes.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
                WI.settings.gridOverlayShowAreaNames.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            }
            break;

        case WI.DOMNode.LayoutFlag.Flex:
            agentCommandArguments.flexOverlayConfig = {
                flexColor: color.toProtocol(),
                showOrderNumbers: WI.settings.flexOverlayShowOrderNumbers.value,
            };

            // COMPATIBILITY (macOS 13.3, iOS 16.4): DOM.FlexOverlayConfig did not exist yet.
            if (!target.hasCommand("DOM.showFlexOverlay", "flexOverlayConfig")) {
                for (let [key, value] in Object.entries(agentCommandArguments.flexOverlayConfig))
                    agentCommandArguments[key] = value;
            }

            agentCommandFunction = target.DOMAgent.showFlexOverlay;

            if (!this._layoutOverlayShowing)
                WI.settings.flexOverlayShowOrderNumbers.addEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            break;
        }

        this._layoutOverlayShowing = true;

        this.dispatchEventToListeners(WI.DOMNode.Event.LayoutOverlayShown);

        console.assert(agentCommandFunction);
        return agentCommandFunction.invoke(agentCommandArguments);
    }

    hideLayoutOverlay()
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed)
            return Promise.reject("ERROR: node is destroyed");

        console.assert(Object.values(WI.DOMNode._LayoutContextTypes).includes(this.layoutContextType), this);

        let target = WI.assumingMainTarget();
        let agentCommandFunction;
        let agentCommandArguments = {nodeId: this.id};

        switch (this.layoutContextType) {
        case WI.DOMNode.LayoutFlag.Grid:
            WI.settings.gridOverlayShowExtendedGridLines.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowLineNames.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowLineNumbers.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowTrackSizes.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);
            WI.settings.gridOverlayShowAreaNames.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);

            agentCommandFunction = target.DOMAgent.hideGridOverlay;
            break;

        case WI.DOMNode.LayoutFlag.Flex:
            WI.settings.flexOverlayShowOrderNumbers.removeEventListener(WI.Setting.Event.Changed, this._handleLayoutOverlaySettingChanged, this);

            agentCommandFunction = target.DOMAgent.hideFlexOverlay;
            break;
        }

        console.assert(this._layoutOverlayShowing, this);
        this._layoutOverlayShowing = false;

        this.dispatchEventToListeners(WI.DOMNode.Event.LayoutOverlayHidden);

        console.assert(agentCommandFunction);
        return agentCommandFunction.invoke(agentCommandArguments);
    }

    get layoutOverlayColor()
    {
        this._createLayoutOverlayColorSettingIfNeeded();
        return new WI.Color(WI.Color.Format.HSL, this._layoutOverlayColorSetting.value);
    }

    set layoutOverlayColor(color)
    {
        console.assert(color instanceof WI.Color, color);

        this._createLayoutOverlayColorSettingIfNeeded();
        this._layoutOverlayColorSetting.value = color.hsl;

        if (this._layoutOverlayShowing)
            this.showLayoutOverlay({color});
    }

    scrollIntoView()
    {
        WI.RemoteObject.resolveNode(this).then((object) => {
            function inspectedPage_node_scrollIntoView() {
                this.scrollIntoViewIfNeeded(true);
            }

            object.callFunction(inspectedPage_node_scrollIntoView);
            object.release();
        });
    }

    getChildNodes(callback)
    {
        if (this.children) {
            if (callback)
                callback(this.children);
            return;
        }

        if (this._destroyed) {
            callback(this.children);
            return;
        }

        function mycallback(error) {
            if (!error && callback)
                callback(this.children);
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.requestChildNodes(this.id, mycallback.bind(this));
    }

    getSubtree(depth, callback)
    {
        if (this._destroyed) {
            callback(this.children);
            return;
        }

        function mycallback(error)
        {
            if (callback)
                callback(error ? null : this.children);
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.requestChildNodes(this.id, depth, mycallback.bind(this));
    }

    getOuterHTML(callback)
    {
        console.assert(!this._destroyed, this);

        let target = WI.assumingMainTarget();

        if (typeof callback !== "function") {
            if (this._destroyed)
                return Promise.reject("ERROR: node is destroyed");
            return target.DOMAgent.getOuterHTML(this.id).then(({outerHTML}) => outerHTML);
        }

        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        target.DOMAgent.getOuterHTML(this.id, callback);
    }

    setOuterHTML(html, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.setOuterHTML(this.id, html, this._makeUndoableCallback(callback));
    }

    insertAdjacentHTML(position, html)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed)
            return;

        if (this.nodeType() !== Node.ELEMENT_NODE)
            return;

        let target = WI.assumingMainTarget();
        target.DOMAgent.insertAdjacentHTML(this.id, position, html, this._makeUndoableCallback());
    }

    removeNode(callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.removeNode(this.id, this._makeUndoableCallback(callback));
    }

    getEventListeners({includeAncestors} = {})
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed)
            return Promise.reject("ERROR: node is destroyed");

        includeAncestors ??= true;

        console.assert(WI.domManager.inspectedNode === this || !includeAncestors, this, includeAncestors);

        let target = WI.assumingMainTarget();
        return target.DOMAgent.getEventListenersForNode.invoke({
            nodeId: this.id,
            includeAncestors,
        });
    }

    accessibilityProperties(callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback({});
            return;
        }

        function accessibilityPropertiesCallback(error, accessibilityProperties)
        {
            if (!error && callback && accessibilityProperties) {
                this._computedRole = accessibilityProperties.role;

                callback({
                    activeDescendantNodeId: accessibilityProperties.activeDescendantNodeId,
                    busy: accessibilityProperties.busy,
                    checked: accessibilityProperties.checked,
                    childNodeIds: accessibilityProperties.childNodeIds,
                    controlledNodeIds: accessibilityProperties.controlledNodeIds,
                    current: accessibilityProperties.current,
                    disabled: accessibilityProperties.disabled,
                    exists: accessibilityProperties.exists,
                    expanded: accessibilityProperties.expanded,
                    flowedNodeIds: accessibilityProperties.flowedNodeIds,
                    focused: accessibilityProperties.focused,
                    ignored: accessibilityProperties.ignored,
                    ignoredByDefault: accessibilityProperties.ignoredByDefault,
                    invalid: accessibilityProperties.invalid,
                    isPopupButton: accessibilityProperties.isPopUpButton,
                    headingLevel: accessibilityProperties.headingLevel,
                    hierarchyLevel: accessibilityProperties.hierarchyLevel,
                    hidden: accessibilityProperties.hidden,
                    label: accessibilityProperties.label,
                    liveRegionAtomic: accessibilityProperties.liveRegionAtomic,
                    liveRegionRelevant: accessibilityProperties.liveRegionRelevant,
                    liveRegionStatus: accessibilityProperties.liveRegionStatus,
                    mouseEventNodeId: accessibilityProperties.mouseEventNodeId,
                    nodeId: accessibilityProperties.nodeId,
                    ownedNodeIds: accessibilityProperties.ownedNodeIds,
                    parentNodeId: accessibilityProperties.parentNodeId,
                    pressed: accessibilityProperties.pressed,
                    readonly: accessibilityProperties.readonly,
                    required: accessibilityProperties.required,
                    role: accessibilityProperties.role,
                    selected: accessibilityProperties.selected,
                    selectedChildNodeIds: accessibilityProperties.selectedChildNodeIds,
                    switchState: accessibilityProperties.switchState,
                });
            }
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.getAccessibilityPropertiesForNode(this.id, accessibilityPropertiesCallback.bind(this));
    }

    path()
    {
        var path = [];
        var node = this;
        while (node && "index" in node && node._nodeName.length) {
            path.push([node.index, node._nodeName]);
            node = node.parentNode;
        }
        path.reverse();
        return path.join(",");
    }

    get escapedIdSelector()
    {
        return this._idSelector(true);
    }

    get escapedClassSelector()
    {
        return this._classSelector(true);
    }

    get displayName()
    {
        if (this.isPseudoElement())
            return "::" + this._pseudoType;
        return this.nodeNameInCorrectCase() + this.escapedIdSelector + this.escapedClassSelector;
    }

    get unescapedSelector()
    {
        if (this.isPseudoElement())
            return "::" + this._pseudoType;

        const shouldEscape = false;
        return this.nodeNameInCorrectCase() + this._idSelector(shouldEscape) + this._classSelector(shouldEscape);
    }

    appropriateSelectorFor(justSelector)
    {
        if (this.isPseudoElement())
            return this.parentNode.appropriateSelectorFor() + "::" + this._pseudoType;

        let lowerCaseName = this.localName() || this.nodeName().toLowerCase();

        let id = this.escapedIdSelector;
        if (id.length)
            return justSelector ? id : lowerCaseName + id;

        let classes = this.escapedClassSelector;
        if (classes.length)
            return justSelector ? classes : lowerCaseName + classes;

        if (lowerCaseName === "input" && this.getAttribute("type"))
            return lowerCaseName + "[type=\"" + this.getAttribute("type") + "\"]";

        return lowerCaseName;
    }

    isAncestor(node)
    {
        if (!node)
            return false;

        var currentNode = node.parentNode;
        while (currentNode) {
            if (this === currentNode)
                return true;
            currentNode = currentNode.parentNode;
        }
        return false;
    }

    isDescendant(descendant)
    {
        return descendant !== null && descendant.isAncestor(this);
    }

    get ownerSVGElement()
    {
        if (this._nodeName === "svg")
            return this;

        if (!this.parentNode)
            return null;

        return this.parentNode.ownerSVGElement;
    }

    isSVGElement()
    {
        return !!this.ownerSVGElement;
    }

    isMediaElement()
    {
        let lowerCaseName = this.localName() || this.nodeName().toLowerCase();
        return lowerCaseName === "video" || lowerCaseName === "audio";
    }

    didFireEvent(eventName, timestamp, data)
    {
        // Called from WI.DOMManager.

        this._addDOMEvent({
            eventName,
            timestamp: WI.timelineManager.computeElapsedTime(timestamp),
            data,
        });
    }

    powerEfficientPlaybackStateChanged(timestamp, isPowerEfficient)
    {
        // Called from WI.DOMManager.

        console.assert(this.canEnterPowerEfficientPlaybackState());

        let lastValue = this._powerEfficientPlaybackRanges.lastValue;

        if (isPowerEfficient) {
            console.assert(!lastValue || lastValue.endTimestamp);
            if (!lastValue || lastValue.endTimestamp)
                this._powerEfficientPlaybackRanges.push({startTimestamp: timestamp});
        } else {
            console.assert(!lastValue || lastValue.startTimestamp);
            if (!lastValue)
                this._powerEfficientPlaybackRanges.push({endTimestamp: timestamp});
            else if (lastValue.startTimestamp)
                lastValue.endTimestamp = timestamp;
        }

        this.dispatchEventToListeners(DOMNode.Event.PowerEfficientPlaybackStateChanged, {isPowerEfficient, timestamp});
    }

    canEnterPowerEfficientPlaybackState()
    {
        return this.localName() === "video" || this.nodeName().toLowerCase() === "video";
    }

    _handleDOMNodeDidFireEvent(event)
    {
        if (event.target === this || !event.target.isAncestor(this))
            return;

        let domEvent = Object.shallowCopy(event.data.domEvent);
        domEvent.originator = event.target;

        this._addDOMEvent(domEvent);
    }

    _addDOMEvent(domEvent)
    {
        this._domEvents.push(domEvent);

        this.dispatchEventToListeners(WI.DOMNode.Event.DidFireEvent, {domEvent});
    }

    _setAttributesPayload(attrs)
    {
        this._attributes = [];
        this._attributesMap = new Map;
        for (var i = 0; i < attrs.length; i += 2)
            this._addAttribute(attrs[i], attrs[i + 1]);
    }

    _insertChild(prev, payload)
    {
        var node = new WI.DOMNode(this._domManager, this.ownerDocument, this._isInShadowTree, payload);
        if (!prev) {
            if (!this._children) {
                // First node
                this._children = this._shadowRoots.concat([node]);
            } else
                this._children.unshift(node);
        } else
            this._children.splice(this._children.indexOf(prev) + 1, 0, node);
        this._renumber();
        return node;
    }

    _removeChild(node)
    {
        // FIXME: Handle removal if this is a shadow root.
        if (node.isPseudoElement()) {
            this._pseudoElements.delete(node.pseudoType());
            node.parentNode = null;
        } else {
            this._children.splice(this._children.indexOf(node), 1);
            node.parentNode = null;
            this._renumber();
        }
    }

    _setChildrenPayload(payloads)
    {
        // We set children in the constructor.
        if (this._contentDocument)
            return;

        this._children = this._shadowRoots.slice();
        for (var i = 0; i < payloads.length; ++i) {
            var node = new WI.DOMNode(this._domManager, this.ownerDocument, this._isInShadowTree, payloads[i]);
            this._children.push(node);
        }
        this._renumber();
    }

    _renumber()
    {
        var childNodeCount = this._children.length;
        if (childNodeCount === 0)
            return;

        for (var i = 0; i < childNodeCount; ++i) {
            var child = this._children[i];
            child.index = i;
            child._nextSibling = i + 1 < childNodeCount ? this._children[i + 1] : null;
            child._previousSibling = i - 1 >= 0 ? this._children[i - 1] : null;
            child.parentNode = this;
        }
    }

    _addAttribute(name, value)
    {
        let attr = {name, value, _node: this};
        this._attributesMap.set(name, attr);
        this._attributes.push(attr);
    }

    _setAttribute(name, value)
    {
        let attr = this._attributesMap.get(name);
        if (attr)
            attr.value = value;
        else
            this._addAttribute(name, value);
    }

    _removeAttribute(name)
    {
        let attr = this._attributesMap.get(name);
        if (attr) {
            this._attributes.remove(attr);
            this._attributesMap.delete(name);
        }
    }

    moveTo(targetNode, anchorNode, callback)
    {
        console.assert(!this._destroyed, this);
        if (this._destroyed) {
            callback("ERROR: node is destroyed");
            return;
        }

        let target = WI.assumingMainTarget();
        target.DOMAgent.moveTo(this.id, targetNode.id, anchorNode ? anchorNode.id : undefined, this._makeUndoableCallback(callback));
    }

    isXMLNode()
    {
        return !!this.ownerDocument && !!this.ownerDocument.xmlVersion;
    }

    get enabledPseudoClasses()
    {
        return this._enabledPseudoClasses;
    }

    setPseudoClassEnabled(pseudoClass, enabled)
    {
        var pseudoClasses = this._enabledPseudoClasses;
        if (enabled) {
            if (pseudoClasses.includes(pseudoClass))
                return;
            pseudoClasses.push(pseudoClass);
        } else {
            if (!pseudoClasses.includes(pseudoClass))
                return;
            pseudoClasses.remove(pseudoClass);
        }

        function changed(error)
        {
            if (!error)
                this.dispatchEventToListeners(WI.DOMNode.Event.EnabledPseudoClassesChanged);
        }

        let target = WI.assumingMainTarget();
        target.CSSAgent.forcePseudoState(this.id, pseudoClasses, changed.bind(this));
    }

    _markUndoableState()
    {
        let target = WI.assumingMainTarget();
        if (target.hasCommand("DOM.markUndoableState"))
            target.DOMAgent.markUndoableState();
    }

    _makeUndoableCallback(callback)
    {
        return (...args) => {
            if (!args[0]) // error
                this._markUndoableState();

            if (callback)
                callback.apply(null, args);
        };
    }

    _idSelector(shouldEscape)
    {
        let id = this.getAttribute("id");
        if (!id)
            return "";

        id = id.trim();
        if (!id.length)
            return "";

        if (shouldEscape)
            id = CSS.escape(id);
        if (/[\s'"]/.test(id))
            return `[id="${id}"]`;

        return `#${id}`;
    }

    _classSelector(shouldEscape) {
        let classes = this.getAttribute("class");
        if (!classes)
            return "";

        classes = classes.trim();
        if (!classes.length)
            return "";

        let foundClasses = new Set;
        return classes.split(/\s+/).reduce((selector, className) => {
            if (!className.length || foundClasses.has(className))
                return selector;

            foundClasses.add(className);
            return `${selector}.${(shouldEscape ? CSS.escape(className) : className)}`;
        }, "");
    }

    _createLayoutOverlayColorSettingIfNeeded()
    {
        if (this._layoutOverlayColorSetting)
            return;

        let defaultConfiguration = WI.DOMNode._defaultLayoutOverlayConfiguration;

        let url = this.ownerDocument.documentURL || WI.networkManager.mainFrame.url;

        let nextColorIndex;
        switch (this.layoutContextType) {
        case WI.DOMNode.LayoutFlag.Grid:
            nextColorIndex = defaultConfiguration.nextGridColorIndex;
            defaultConfiguration.nextGridColorIndex = (nextColorIndex + 1) % defaultConfiguration.colors.length;
            break;

        case WI.DOMNode.LayoutFlag.Flex:
            nextColorIndex = defaultConfiguration.nextFlexColorIndex;
            defaultConfiguration.nextFlexColorIndex = (nextColorIndex + 1) % defaultConfiguration.colors.length;
            break;
        }

        this._layoutOverlayColorSetting = new WI.Setting(`overlay-color-${url.hash}-${this.path().hash}`, defaultConfiguration.colors[nextColorIndex]);
    }

    _handleLayoutOverlaySettingChanged(event)
    {
        if (this._layoutOverlayShowing)
            this.showLayoutOverlay();
    }

    // COMPATIBILITY (iOS 18.0, macOS 15.0): `DOM.getMediaStats` did not exist yet.
    async getMediaStats()
    {
        let target = WI.assumingMainTarget();
        let {mediaStats} = await target.DOMAgent.getMediaStats(this.id);
        return mediaStats;
    }
};

WI.DOMNode._defaultLayoutOverlayConfiguration = {
    colors: [
        [329, 91, 70],
        [207, 96, 69],
        [92, 90, 64],
        [291, 73, 68],
        [40, 97, 57],
    ],
    nextFlexColorIndex: 0,
    nextGridColorIndex: 0,
};

WI.DOMNode.Event = {
    EnabledPseudoClassesChanged: "dom-node-enabled-pseudo-classes-did-change",
    AttributeModified: "dom-node-attribute-modified",
    AttributeRemoved: "dom-node-attribute-removed",
    EventListenersChanged: "dom-node-event-listeners-changed",
    DidFireEvent: "dom-node-did-fire-event",
    PowerEfficientPlaybackStateChanged: "dom-node-power-efficient-playback-state-changed",
    LayoutFlagsChanged: "dom-node-layout-flags-changed",
    LayoutOverlayShown: "dom-node-layout-overlay-shown",
    LayoutOverlayHidden: "dom-node-layout-overlay-hidden",
};

WI.DOMNode.PseudoElementType = {
    Before: "before",
    After: "after",
};

WI.DOMNode.ShadowRootType = {
    UserAgent: "user-agent",
    Closed: "closed",
    Open: "open",
};

WI.DOMNode.CustomElementState = {
    Builtin: "builtin",
    Custom: "custom",
    Waiting: "waiting",
    Failed: "failed",
};

// Corresponds to `CSS.LayoutFlag`.
WI.DOMNode.LayoutFlag = {
    Rendered: "rendered",
    Event: "event",
    Scrollable: "scrollable",

    // These are mutually exclusive.
    Flex: "flex",
    Grid: "grid",
};

WI.DOMNode._LayoutContextTypes = [
    WI.DOMNode.LayoutFlag.Flex,
    WI.DOMNode.LayoutFlag.Grid,
];
