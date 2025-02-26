/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.EventListenerSectionGroup = class EventListenerSectionGroup extends WI.DetailsSectionGroup
{
    constructor(eventListener, options = {})
    {
        super();

        this._eventListener = eventListener;

        var rows = [];
        if (!options.hideType)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Event"), this._eventListener.type));
        if (!options.hideTarget)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Target"), this._targetTextOrLink()));
        rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Function"), this._functionTextOrLink()));

        if (this._eventListener.useCapture)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Capturing"), WI.UIString("Yes")));
        else
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Bubbling"), WI.UIString("Yes")));

        if (this._eventListener.isAttribute)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Attribute"), WI.UIString("Yes")));

        if (this._eventListener.passive)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Passive"), WI.UIString("Yes")));

        if (this._eventListener.once)
            rows.push(new WI.DetailsSectionSimpleRow(WI.UIString("Once"), WI.UIString("Yes")));

        this._eventListenerEnabledToggleElement = document.createElement("input");
        this._eventListenerEnabledToggleElement.type = "checkbox";
        this._updateDisabledToggle();
        this._eventListenerEnabledToggleElement.addEventListener("change", (event) => {
            this.isEventListenerDisabled = !this._eventListenerEnabledToggleElement.checked;
            this.hasEventListenerBreakpoint = false;
        });

        let toggleLabel = document.createElement("span");
        toggleLabel.textContent = WI.UIString("Enabled");
        toggleLabel.addEventListener("click", (event) => {
            this._eventListenerEnabledToggleElement.click();
        });

        rows.push(new WI.DetailsSectionSimpleRow(toggleLabel, this._eventListenerEnabledToggleElement));

        if (WI.DOMManager.supportsEventListenerBreakpoints()) {
            let toggleContainer = document.createElement("span");

            this._eventListenerBreakpointToggleElement = toggleContainer.appendChild(document.createElement("input"));
            this._eventListenerBreakpointToggleElement.type = "checkbox";
            this._updateBreakpointToggle();
            this._eventListenerBreakpointToggleElement.addEventListener("change", (event) => {
                this.isEventListenerDisabled = false;
                this.hasEventListenerBreakpoint = !!this._eventListenerBreakpointToggleElement.checked;
            });

            if (WI.DOMManager.supportsEventListenerBreakpointConfiguration()) {
                let revealBreakpointGoToArrow = toggleContainer.appendChild(WI.createGoToArrowButton());
                revealBreakpointGoToArrow.title = WI.UIString("Reveal in Sources Tab");
                revealBreakpointGoToArrow.addEventListener("click", (event) => {
                    console.assert(this.hasEventListenerBreakpoint);
                    WI.showSourcesTab({
                        representedObjectToSelect: WI.domManager.breakpointForEventListenerId(this._eventListener.eventListenerId),
                    });
                });
            }

            let toggleLabel = document.createElement("span");
            toggleLabel.textContent = WI.UIString("Breakpoint");
            toggleLabel.addEventListener("click", (event) => {
                this._eventListenerBreakpointToggleElement.click();
            });

            rows.push(new WI.DetailsSectionSimpleRow(toggleLabel, toggleContainer));
        }

        this.rows = rows;
    }

    // Static

    static groupIntoSectionsByEvent(eventListeners, options = {})
    {
        let eventListenerTypes = new Map;
        for (let eventListener of eventListeners) {
            console.assert(eventListener.nodeId || eventListener.onWindow);
            if (eventListener.nodeId)
                eventListener.node = WI.domManager.nodeForId(eventListener.nodeId);

            let eventListenersForType = eventListenerTypes.get(eventListener.type);
            if (!eventListenersForType)
                eventListenerTypes.set(eventListener.type, eventListenersForType = []);
            eventListenersForType.push(eventListener);
        }

        let rows = [];

        let types = Array.from(eventListenerTypes.keys());
        types.sort();
        for (let type of types)
            rows.push(WI.EventListenerSectionGroup._createEventListenerSection(type, eventListenerTypes.get(type), {...options, hideType: true}));

        return rows;
    }

    static groupIntoSectionsByTarget(eventListeners, domNode, options = {})
    {
        const windowTargetIdentifier = Symbol("window");

        let eventListenerTargets = new Map;
        for (let eventListener of eventListeners) {
            console.assert(eventListener.nodeId || eventListener.onWindow);
            if (eventListener.nodeId)
                eventListener.node = WI.domManager.nodeForId(eventListener.nodeId);

            let target = eventListener.onWindow ? windowTargetIdentifier : eventListener.node;
            let eventListenersForTarget = eventListenerTargets.get(target);
            if (!eventListenersForTarget)
                eventListenerTargets.set(target, eventListenersForTarget = []);
            eventListenersForTarget.push(eventListener);
        }

        let rows = [];

        function generateSectionForTarget(target) {
            let eventListenersForTarget = eventListenerTargets.get(target);
            if (!eventListenersForTarget)
                return;

            eventListenersForTarget.sort((a, b) => a.type.toLowerCase().extendedLocaleCompare(b.type.toLowerCase()));

            let title = target === windowTargetIdentifier ? WI.unlocalizedString("window") : target.displayName;
            let identifier = target === windowTargetIdentifier ? WI.unlocalizedString("window") : target.unescapedSelector;

            let section = WI.EventListenerSectionGroup._createEventListenerSection(title, eventListenersForTarget, {...options, hideTarget: true, identifier});
            if (target instanceof WI.DOMNode)
                WI.bindInteractionsForNodeToElement(target, section.titleElement, {ignoreClick: true});
            rows.push(section);
        }

        let currentNode = domNode;
        do {
            generateSectionForTarget(currentNode);
        } while (currentNode = currentNode.parentNode);

        generateSectionForTarget(windowTargetIdentifier);

        return rows;
    }

    static _createEventListenerSection(title, eventListeners, options = {})
    {
        let groups = eventListeners.map((eventListener) => new WI.EventListenerSectionGroup(eventListener, options));

        let optionsElement = WI.ImageUtilities.useSVGSymbol("Images/Gear.svg", "event-listener-options", WI.UIString("Options"));
        WI.addMouseDownContextMenuHandlers(optionsElement, (contextMenu) => {
            let shouldDisable = groups.some((eventListener) => !eventListener.isEventListenerDisabled);
            contextMenu.appendItem(shouldDisable ? WI.UIString("Disable Event Listeners") : WI.UIString("Enable Event Listeners"), () => {
                for (let group of groups)
                    group.isEventListenerDisabled = shouldDisable;
            });

            if (WI.DOMManager.supportsEventListenerBreakpoints()) {
                let shouldBreakpoint = groups.some((eventListener) => !eventListener.hasEventListenerBreakpoint);
                contextMenu.appendItem(shouldBreakpoint ? WI.UIString("Add Breakpoints") : WI.UIString("Delete Breakpoints"), () => {
                    for (let group of groups)
                        group.hasEventListenerBreakpoint = shouldBreakpoint;
                });
            }
        });

        const defaultCollapsedSettingValue = true;
        let identifier = `${options.identifier ?? title}-event-listener-section`;
        let section = new WI.DetailsSection(identifier, title, groups, optionsElement, defaultCollapsedSettingValue);
        section.element.classList.add("event-listener-section");
        return section;
    }

    // Public

    get isEventListenerDisabled()
    {
        return this._eventListener.disabled;
    }

    set isEventListenerDisabled(disabled)
    {
        if (this._eventListener.disabled === disabled)
            return;

        this._eventListener.disabled = disabled;

        this._updateDisabledToggle();

        WI.domManager.setEventListenerDisabled(this._eventListener, this._eventListener.disabled);
    }

    get hasEventListenerBreakpoint()
    {
        console.assert(WI.DOMManager.supportsEventListenerBreakpoints());

        return this._eventListener.hasBreakpoint;
    }

    set hasEventListenerBreakpoint(hasBreakpoint)
    {
        console.assert(WI.DOMManager.supportsEventListenerBreakpoints());

        if (this._eventListener.hasBreakpoint === hasBreakpoint)
            return;

        this._eventListener.hasBreakpoint = hasBreakpoint;

        this._updateBreakpointToggle();

        if (this._eventListener.hasBreakpoint)
            WI.domManager.setBreakpointForEventListener(this._eventListener);
        else
            WI.domManager.removeBreakpointForEventListener(this._eventListener);
    }

    // Private

    _targetTextOrLink()
    {
        if (this._eventListener.onWindow)
            return WI.unlocalizedString("window");

        let node = this._eventListener.node;
        if (node)
            return WI.linkifyNodeReference(node);

        console.assert();
        return "";
    }

    _functionTextOrLink()
    {
        let anonymous = false;
        let functionName = this._eventListener.handlerName;

        // COMPATIBILITY (iOS 12.2): DOM.EventListener.handlerBody was replaced by DOM.EventListener.handlerName.
        if (!functionName && this._eventListener.handlerBody) {
            let match = this._eventListener.handlerBody.match(/function ([^\(]+?)\(/);
            if (match)
                functionName = match[1];
        }

        if (!functionName) {
            anonymous = true;
            functionName = WI.UIString("(anonymous function)");
        }

        if (!this._eventListener.location)
            return functionName;

        var sourceCode = WI.debuggerManager.scriptForIdentifier(this._eventListener.location.scriptId, WI.mainTarget);
        if (!sourceCode)
            return functionName;

        var sourceCodeLocation = sourceCode.createSourceCodeLocation(this._eventListener.location.lineNumber, this._eventListener.location.columnNumber || 0);

        const options = {
            dontFloat: anonymous,
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };
        let linkElement = WI.createSourceCodeLocationLink(sourceCodeLocation, options);

        if (anonymous)
            return linkElement;

        var fragment = document.createDocumentFragment();
        fragment.append(linkElement, functionName);
        return fragment;
    }

    _updateDisabledToggle()
    {
        console.assert(this._eventListenerEnabledToggleElement);
        this._eventListenerEnabledToggleElement.checked = !this._eventListener.disabled;
        this._eventListenerEnabledToggleElement.title = this._eventListener.disabled ? WI.UIString("Enable Event Listener") : WI.UIString("Disable Event Listener");
    }

    _updateBreakpointToggle()
    {
        console.assert(this._eventListenerBreakpointToggleElement);
        this._eventListenerBreakpointToggleElement.checked = this._eventListener.hasBreakpoint;
        this._eventListenerBreakpointToggleElement.title = this._eventListener.hasBreakpoint ? WI.UIString("Delete Breakpoint") : WI.UIString("Add Breakpoint");
    }
};
