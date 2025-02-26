/*
 * Copyright (C) 2013-2016 Apple Inc. All rights reserved.
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

WI.DOMNodeDetailsSidebarPanel = class DOMNodeDetailsSidebarPanel extends WI.DOMDetailsSidebarPanel
{
    constructor()
    {
        super("dom-node-details", WI.UIString("Node"));

        this._eventListenerGroupingMethodSetting = new WI.Setting("dom-node-event-listener-grouping-method", WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod.Event);

        this.element.classList.add("dom-node");

        this._nodeRemoteObject = null;
    }

    // Public

    closed()
    {
        if (this.didInitialLayout) {
            WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeModified, this._attributesChanged, this);
            WI.domManager.removeEventListener(WI.DOMManager.Event.AttributeRemoved, this._attributesChanged, this);
            WI.domManager.removeEventListener(WI.DOMManager.Event.CharacterDataModified, this._characterDataModified, this);
            WI.domManager.removeEventListener(WI.DOMManager.Event.CustomElementStateChanged, this._customElementStateChanged, this);
        }

        super.closed();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        WI.domManager.addEventListener(WI.DOMManager.Event.AttributeModified, this._attributesChanged, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.AttributeRemoved, this._attributesChanged, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.CharacterDataModified, this._characterDataModified, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.CustomElementStateChanged, this._customElementStateChanged, this);

        this._identityNodeTypeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Type"));
        this._identityNodeNameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Name"));
        this._identityNodeValueRow = new WI.DetailsSectionSimpleRow(WI.UIString("Value"));
        this._identityNodeContentSecurityPolicyHashRow = new WI.DetailsSectionSimpleRow(WI.UIString("CSP Hash"));

        var identityGroup = new WI.DetailsSectionGroup([this._identityNodeTypeRow, this._identityNodeNameRow, this._identityNodeValueRow, this._identityNodeContentSecurityPolicyHashRow]);
        var identitySection = new WI.DetailsSection("dom-node-identity", WI.UIString("Identity"), [identityGroup]);
        this.contentView.element.appendChild(identitySection.element);

        this._attributesDataGridRow = new WI.DetailsSectionDataGridRow(null, WI.UIString("No Attributes"));

        var attributesGroup = new WI.DetailsSectionGroup([this._attributesDataGridRow]);
        var attributesSection = new WI.DetailsSection("dom-node-attributes", WI.UIString("Attributes"), [attributesGroup]);
        this.contentView.element.appendChild(attributesSection.element);

        if (InspectorBackend.hasCommand("DOM.resolveNode")) {
            this._propertiesRow = new WI.DetailsSectionRow;
            let propertiesGroup = new WI.DetailsSectionGroup([this._propertiesRow]);
            let propertiesSection = new WI.DetailsSection("dom-node-properties", WI.UIString("Properties"), [propertiesGroup]);
            this.contentView.element.appendChild(propertiesSection.element);
        }

        let eventListenersFilterElement = WI.ImageUtilities.useSVGSymbol("Images/Filter.svg", "filter", WI.UIString("Grouping Method"));
        WI.addMouseDownContextMenuHandlers(eventListenersFilterElement, this._populateEventListenersFilterContextMenu.bind(this));

        this._eventListenersSectionGroup = new WI.DetailsSectionGroup;
        let eventListenersSection = new WI.DetailsSection("dom-node-event-listeners", WI.UIString("Event Listeners"), [this._eventListenersSectionGroup], eventListenersFilterElement);
        this.contentView.element.appendChild(eventListenersSection.element);

        if (InspectorBackend.hasCommand("DOM.getDataBindingsForNode")) {
            this._dataBindingsSection = new WI.DetailsSection("dom-node-data-bindings", WI.UIString("Data Bindings"), []);
            this.contentView.element.appendChild(this._dataBindingsSection.element);
        }

        if (InspectorBackend.hasCommand("DOM.getAssociatedDataForNode")) {
            this._associatedDataGrid = new WI.DetailsSectionRow(WI.UIString("No Associated Data"));

            let associatedDataGroup = new WI.DetailsSectionGroup([this._associatedDataGrid]);

            let associatedSection = new WI.DetailsSection("dom-node-associated-data", WI.UIString("Associated Data"), [associatedDataGroup]);
            this.contentView.element.appendChild(associatedSection.element);
        }

        if (this._accessibilitySupported()) {
            this._accessibilityEmptyRow = new WI.DetailsSectionRow(WI.UIString("No Accessibility Information"));
            this._accessibilityNodeActiveDescendantRow = new WI.DetailsSectionSimpleRow(WI.UIString("Shared Focus"));
            this._accessibilityNodeBusyRow = new WI.DetailsSectionSimpleRow(WI.UIString("Busy"));
            this._accessibilityNodeCheckedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Checked"));
            this._accessibilityNodeSwitchStateRow = new WI.DetailsSectionSimpleRow(WI.UIString("State"));
            this._accessibilityNodeChildrenRow = new WI.DetailsSectionSimpleRow(WI.UIString("Children"));
            this._accessibilityNodeControlsRow = new WI.DetailsSectionSimpleRow(WI.UIString("Controls"));
            this._accessibilityNodeCurrentRow = new WI.DetailsSectionSimpleRow(WI.UIString("Current"));
            this._accessibilityNodeDisabledRow = new WI.DetailsSectionSimpleRow(WI.UIString("Disabled"));
            this._accessibilityNodeExpandedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Expanded"));
            this._accessibilityNodeFlowsRow = new WI.DetailsSectionSimpleRow(WI.UIString("Flows"));
            this._accessibilityNodeFocusedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Focused"));
            this._accessibilityNodeHeadingLevelRow = new WI.DetailsSectionSimpleRow(WI.UIString("Heading Level"));
            this._accessibilityNodehierarchyLevelRow = new WI.DetailsSectionSimpleRow(WI.UIString("Hierarchy Level"));
            this._accessibilityNodeIgnoredRow = new WI.DetailsSectionSimpleRow(WI.UIString("Ignored"));
            this._accessibilityNodeInvalidRow = new WI.DetailsSectionSimpleRow(WI.UIString("Invalid"));
            this._accessibilityNodeLiveRegionStatusRow = new WI.DetailsSectionSimpleRow(WI.UIString("Live"));
            this._accessibilityNodeMouseEventRow = new WI.DetailsSectionSimpleRow("");
            this._accessibilityNodeLabelRow = new WI.DetailsSectionSimpleRow(WI.UIString("Label"));
            this._accessibilityNodeOwnsRow = new WI.DetailsSectionSimpleRow(WI.UIString("Owns"));
            this._accessibilityNodeParentRow = new WI.DetailsSectionSimpleRow(WI.UIString("Parent"));
            this._accessibilityNodePressedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Pressed"));
            this._accessibilityNodeReadonlyRow = new WI.DetailsSectionSimpleRow(WI.UIString("Readonly"));
            this._accessibilityNodeRequiredRow = new WI.DetailsSectionSimpleRow(WI.UIString("Required"));
            this._accessibilityNodeRoleRow = new WI.DetailsSectionSimpleRow(WI.UIString("Role"));
            this._accessibilityNodeSelectedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Selected"));
            this._accessibilityNodeSelectedChildrenRow = new WI.DetailsSectionSimpleRow(WI.UIString("Selected Items"));

            this._accessibilityGroup = new WI.DetailsSectionGroup([this._accessibilityEmptyRow]);
            var accessibilitySection = new WI.DetailsSection("dom-node-accessibility", WI.UIString("Accessibility"), [this._accessibilityGroup]);

            this.contentView.element.appendChild(accessibilitySection.element);
        }
    }

    layout()
    {
        super.layout();

        if (!this.domNode || this.domNode.destroyed)
            return;

        this._refreshIdentity();
        this._refreshAttributes();
        this._refreshProperties();
        this._refreshEventListeners();
        this._refreshDataBindings();
        this._refreshAssociatedData();
        this._refreshAccessibility();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        this._attributesDataGridRow.sizeDidChange();
    }

    attached()
    {
        super.attached();

        WI.DOMNode.addEventListener(WI.DOMNode.Event.EventListenersChanged, this._eventListenersChanged, this);
    }

    detached()
    {
        WI.DOMNode.removeEventListener(WI.DOMNode.Event.EventListenersChanged, this._eventListenersChanged, this);

        super.detached();
    }

    // Private

    _accessibilitySupported()
    {
        return InspectorBackend.hasCommand("DOM.getAccessibilityPropertiesForNode");
    }

    _refreshIdentity()
    {
        const domNode = this.domNode;
        this._identityNodeTypeRow.value = this._nodeTypeDisplayName();
        this._identityNodeNameRow.value = domNode.nodeNameInCorrectCase();
        this._identityNodeValueRow.value = domNode.nodeValue();
        this._identityNodeContentSecurityPolicyHashRow.value = domNode.contentSecurityPolicyHash();
    }

    _refreshAttributes()
    {
        let domNode = this.domNode;
        if (!domNode || !domNode.hasAttributes()) {
            // Remove the DataGrid to show the placeholder text.
            this._attributesDataGridRow.dataGrid = null;
            return;
        }

        let dataGrid = this._attributesDataGridRow.dataGrid;
        if (!dataGrid) {
            const columns = {
                name: {title: WI.UIString("Name"), width: "30%"},
                value: {title: WI.UIString("Value")},
            };
            dataGrid = this._attributesDataGridRow.dataGrid = new WI.DataGrid(columns);
        }

        dataGrid.removeChildren();

        let attributes = domNode.attributes();
        attributes.sort((a, b) => a.name.extendedLocaleCompare(b.name));
        for (let attribute of attributes) {
            let dataGridNode = new WI.EditableDataGridNode(attribute);
            dataGridNode.addEventListener(WI.EditableDataGridNode.Event.ValueChanged, this._attributeNodeValueChanged, this);
            dataGrid.appendChild(dataGridNode);
        }

        dataGrid.updateLayoutIfNeeded();
    }

    _refreshProperties()
    {
        if (!this._propertiesRow)
            return;

        if (this._nodeRemoteObject) {
            this._nodeRemoteObject.release();
            this._nodeRemoteObject = null;
        }

        let target = WI.assumingMainTarget();

        const objectGroup = "dom-node-details-sidebar-properties-object-group";
        target.RuntimeAgent.releaseObjectGroup(objectGroup);

        let domNode = this.domNode;
        WI.RemoteObject.resolveNode(domNode, objectGroup).then((object) => {
            // Bail if the DOM node changed while we were waiting for the async response.
            if (this.domNode !== domNode)
                return;

            this._nodeRemoteObject = object;

            function inspectedPage_node_collectPrototypes()
            {
                // This builds an object with numeric properties. This is easier than dealing with arrays
                // with the way RemoteObject works. Start at 1 since we use parseInt later and parseInt
                // returns 0 for non-numeric strings make it ambiguous.
                var prototype = this;
                var result = [];
                var counter = 1;

                while (prototype) {
                    result[counter++] = prototype;
                    prototype = prototype.__proto__;
                }

                return result;
            }

            const args = undefined;
            const generatePreview = false;
            object.callFunction(inspectedPage_node_collectPrototypes, args, generatePreview, nodePrototypesReady.bind(this));
        }).catch((error) => {
            // Bail if the DOM node changed while we were waiting for the async response.
            if (this.domNode !== domNode)
                return;

            console.assert(false, "Cannot resolve node.", error, domNode);
        });

        function nodePrototypesReady(error, object, wasThrown)
        {
            if (error || wasThrown || !object)
                return;

            // Bail if the DOM node changed while we were waiting for the async response.
            if (this.domNode !== domNode)
                return;

            object.getPropertyDescriptors(fillSection.bind(this), {ownProperties: true});
        }

        function fillSection(prototypes)
        {
            if (!prototypes)
                return;

            // Bail if the DOM node changed while we were waiting for the async response.
            if (this.domNode !== domNode)
                return;

            let element = this._propertiesRow.element;
            element.removeChildren();

            let propertyPath = new WI.PropertyPath(this._nodeRemoteObject, "node");

            let initialSection = true;
            for (let i = 0; i < prototypes.length; ++i) {
                // The only values we care about are numeric, as assigned in collectPrototypes.
                if (!parseInt(prototypes[i].name, 10))
                    continue;

                let prototype = prototypes[i].value;
                let prototypeName = prototype.description;
                let title = prototypeName;
                if (/Prototype$/.test(title)) {
                    prototypeName = prototypeName.replace(/Prototype$/, "");
                    title = prototypeName + WI.UIString(" (Prototype)");
                } else if (title === "Object")
                    title = title + WI.UIString(" (Prototype)");

                let mode = initialSection ? WI.ObjectTreeView.Mode.Properties : WI.ObjectTreeView.Mode.PureAPI;
                let objectTree = new WI.ObjectTreeView(prototype, mode, propertyPath);
                objectTree.showOnlyProperties();
                objectTree.setPrototypeNameOverride(prototypeName);

                let detailsSection = new WI.DetailsSection(prototype.description.hash + "-prototype-properties", title, null, null, true);
                detailsSection.groups[0].rows = [new WI.ObjectPropertiesDetailSectionRow(objectTree, detailsSection)];

                element.appendChild(detailsSection.element);

                initialSection = false;
            }
        }
    }

    async _refreshEventListeners()
    {
        var domNode = this.domNode;
        if (!domNode)
            return;

        let {listeners} = await domNode.getEventListeners();

        // Bail if the DOM node changed while we were waiting for the async response.
        if (this.domNode !== domNode)
            return;

        if (!listeners.length) {
            let emptyRow = new WI.DetailsSectionRow(WI.UIString("No Event Listeners"));
            emptyRow.showEmptyMessage();
            this._eventListenersSectionGroup.rows = [emptyRow];
            return;
        }

        switch (this._eventListenerGroupingMethodSetting.value) {
        case WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod.Event:
            this._eventListenersSectionGroup.rows = WI.EventListenerSectionGroup.groupIntoSectionsByEvent(listeners);
            break;

        case WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod.Target:
            this._eventListenersSectionGroup.rows = WI.EventListenerSectionGroup.groupIntoSectionsByTarget(listeners, domNode);
            break;
        }
    }

    _refreshDataBindings()
    {
        if (!this._dataBindingsSection)
            return;

        let domNode = this.domNode;
        if (!domNode)
            return;

        let target = WI.assumingMainTarget();
        target.DOMAgent.getDataBindingsForNode(this.domNode.id).then(({dataBindings}) => {
            if (this.domNode !== domNode)
                return;

            if (!dataBindings.length) {
                let emptyRow = new WI.DetailsSectionRow(WI.UIString("No Data Bindings"));
                emptyRow.showEmptyMessage();
                this._dataBindingsSection.groups = [new WI.DetailsSectionGroup([emptyRow])];
                return;
            }

            let groups = [];
            for (let {binding, type, value} of dataBindings) {
                groups.push(new WI.DetailsSectionGroup([
                    new WI.DetailsSectionSimpleRow(WI.UIString("Binding"), binding),
                    new WI.DetailsSectionSimpleRow(WI.UIString("Type"), type),
                    new WI.DetailsSectionSimpleRow(WI.UIString("Value"), value),
                ]));
            }
            this._dataBindingsSection.groups = groups;
        });
    }

    _refreshAssociatedData()
    {
        if (!this._associatedDataGrid)
            return;

        let target = WI.assumingMainTarget();

        const objectGroup = "dom-node-details-sidebar-associated-data-object-group";
        target.RuntimeAgent.releaseObjectGroup(objectGroup);

        let domNode = this.domNode;
        if (!domNode)
            return;

        target.DOMAgent.getAssociatedDataForNode(domNode.id).then(({associatedData}) => {
            if (this.domNode !== domNode)
                return;

            if (!associatedData) {
                this._associatedDataGrid.showEmptyMessage();
                return;
            }

            let expression = associatedData;
            const options = {
                objectGroup,
                doNotPauseOnExceptionsAndMuteConsole: true,
            };
            WI.runtimeManager.evaluateInInspectedWindow(expression, options, (result, wasThrown) => {
                console.assert(!wasThrown);

                if (!result) {
                    this._associatedDataGrid.showEmptyMessage();
                    return;
                }

                this._associatedDataGrid.hideEmptyMessage();

                const propertyPath = null;
                const forceExpanding = true;
                let element = WI.FormattedValue.createObjectTreeOrFormattedValueForRemoteObject(result, propertyPath, forceExpanding);

                let objectTree = element.__objectTree;
                if (objectTree) {
                    objectTree.showOnlyJSON();
                    objectTree.expand();
                }

                this._associatedDataGrid.element.appendChild(element);
            });
        });
    }

    _refreshAccessibility()
    {
        if (!this._accessibilitySupported())
            return;

        var domNode = this.domNode;
        if (!domNode)
            return;

        var properties = {};

        function booleanValueToLocalizedStringIfTrue(property) {
            if (properties[property])
                return WI.UIString("Yes");
            return "";
        }

        function booleanValueToLocalizedStringIfPropertyDefined(property) {
            if (properties[property] !== undefined) {
                if (properties[property])
                    return WI.UIString("Yes");
                else
                    return WI.UIString("No");
            }
            return "";
        }

        function linkForNodeId(nodeId) {
            var link = null;
            if (nodeId !== undefined && typeof nodeId === "number") {
                var node = WI.domManager.nodeForId(nodeId);
                if (node)
                    link = WI.linkifyAccessibilityNodeReference(node);
            }
            return link;
        }

        function linkListForNodeIds(nodeIds) {
            if (!nodeIds)
                return null;

            const itemsToShow = 5;
            let hasLinks = false;
            let listItemCount = 0;
            let container = document.createElement("div");
            container.classList.add("list-container");
            let linkList = container.createChild("ul", "node-link-list");
            let initiallyHiddenItems = [];
            for (let nodeId of nodeIds) {
                let node = WI.domManager.nodeForId(nodeId);
                if (!node)
                    continue;
                let link = WI.linkifyAccessibilityNodeReference(node);
                hasLinks = true;
                let li = linkList.createChild("li");
                li.appendChild(link);
                if (listItemCount >= itemsToShow) {
                    li.hidden = true;
                    initiallyHiddenItems.push(li);
                }
                listItemCount++;
            }
            container.appendChild(linkList);
            if (listItemCount > itemsToShow) {
                let moreNodesButton = container.createChild("button", "expand-list-button");
                moreNodesButton.textContent = WI.UIString("%d More\u2026").format(listItemCount - itemsToShow);
                moreNodesButton.addEventListener("click", () => {
                    initiallyHiddenItems.forEach((element) => { element.hidden = false; });
                    moreNodesButton.remove();
                });
            }
            if (hasLinks)
                return container;

            return null;
        }

        function accessibilityPropertiesCallback(accessibilityProperties) {
            if (this.domNode !== domNode)
                return;

            // Make sure the current set of properties is available in the closure scope for the helper functions.
            properties = accessibilityProperties;

            if (accessibilityProperties && accessibilityProperties.exists) {

                var activeDescendantLink = linkForNodeId(accessibilityProperties.activeDescendantNodeId);
                var busy = booleanValueToLocalizedStringIfPropertyDefined("busy");

                var checked = "";
                if (accessibilityProperties.checked !== undefined) {
                    if (accessibilityProperties.checked === InspectorBackend.Enum.DOM.AccessibilityPropertiesChecked.True)
                        checked = WI.UIString("Yes");
                    else if (accessibilityProperties.checked === InspectorBackend.Enum.DOM.AccessibilityPropertiesChecked.Mixed)
                        checked = WI.UIString("Mixed");
                    else // InspectorBackend.Enum.DOM.AccessibilityPropertiesChecked.False
                        checked = WI.UIString("No");
                }

                let switchState = "";
                // COMPATIBILITY (macOS 15.0, iOS 18.0): DOM.AccessibilityProperties.switchState did not exist yet.
                if (InspectorBackend.Enum.DOM.AccessibilityPropertiesSwitchState) {
                    switch (accessibilityProperties.switchState) {
                    case InspectorBackend.Enum.DOM.AccessibilityPropertiesSwitchState.On:
                        switchState = WI.UIString("On", "On @ Switch State", "Label indicating that an input of type switch is on.");
                        break;
                    case InspectorBackend.Enum.DOM.AccessibilityPropertiesSwitchState.Off:
                        switchState = WI.UIString("Off", "Off @ Switch State", "Label indicating that an input of type switch is off.");
                        break;
                    }
                }

                // Accessibility tree children are not a 1:1 mapping with DOM tree children.
                var childNodeLinkList = linkListForNodeIds(accessibilityProperties.childNodeIds);
                var controlledNodeLinkList = linkListForNodeIds(accessibilityProperties.controlledNodeIds);

                var current = "";
                switch (accessibilityProperties.current) {
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.True:
                    current = WI.UIString("True");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.Page:
                    current = WI.UIString("Page");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.Location:
                    current = WI.UIString("Location");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.Step:
                    current = WI.UIString("Step");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.Date:
                    current = WI.UIString("Date");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesCurrent.Time:
                    current = WI.UIString("Time");
                    break;
                default:
                    current = "";
                }

                var disabled = booleanValueToLocalizedStringIfTrue("disabled");
                var expanded = booleanValueToLocalizedStringIfPropertyDefined("expanded");
                var flowedNodeLinkList = linkListForNodeIds(accessibilityProperties.flowedNodeIds);
                var focused = booleanValueToLocalizedStringIfPropertyDefined("focused");

                var ignored = "";
                if (accessibilityProperties.ignored) {
                    ignored = WI.UIString("Yes");
                    if (accessibilityProperties.hidden)
                        ignored = WI.UIString("%s (hidden)").format(ignored);
                    else if (accessibilityProperties.ignoredByDefault)
                        ignored = WI.UIString("%s (default)").format(ignored);
                }

                var invalid = "";
                if (accessibilityProperties.invalid === InspectorBackend.Enum.DOM.AccessibilityPropertiesInvalid.True)
                    invalid = WI.UIString("Yes");
                else if (accessibilityProperties.invalid === InspectorBackend.Enum.DOM.AccessibilityPropertiesInvalid.Grammar)
                    invalid = WI.UIString("Grammar");
                else if (accessibilityProperties.invalid === InspectorBackend.Enum.DOM.AccessibilityPropertiesInvalid.Spelling)
                    invalid = WI.UIString("Spelling");

                var label = accessibilityProperties.label;

                var liveRegionStatus = "";
                var liveRegionStatusNode = null;
                var liveRegionStatusToken = accessibilityProperties.liveRegionStatus;
                switch (liveRegionStatusToken) {
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesLiveRegionStatus.Assertive:
                    liveRegionStatus = WI.UIString("Assertive");
                    break;
                case InspectorBackend.Enum.DOM.AccessibilityPropertiesLiveRegionStatus.Polite:
                    liveRegionStatus = WI.UIString("Polite");
                    break;
                default:
                    liveRegionStatus = "";
                }
                if (liveRegionStatus) {
                    var liveRegionRelevant = accessibilityProperties.liveRegionRelevant;
                    // Append @aria-relevant values. E.g. "Live: Assertive (Additions, Text)".
                    if (liveRegionRelevant && liveRegionRelevant.length) {
                        // @aria-relevant="all" is exposed as ["additions","removals","text"], in order.
                        // This order is controlled in WebCore and expected in WebInspectorUI.
                        if (liveRegionRelevant.length === 3
                            && liveRegionRelevant[0] === InspectorBackend.Enum.DOM.LiveRegionRelevant.Additions
                            && liveRegionRelevant[1] === InspectorBackend.Enum.DOM.LiveRegionRelevant.Removals
                            && liveRegionRelevant[2] === InspectorBackend.Enum.DOM.LiveRegionRelevant.Text)
                            liveRegionRelevant = [WI.UIString("All Changes")];
                        else {
                            // Reassign localized strings in place: ["additions","text"] becomes ["Additions","Text"].
                            liveRegionRelevant = liveRegionRelevant.map(function(value) {
                                switch (value) {
                                case InspectorBackend.Enum.DOM.LiveRegionRelevant.Additions:
                                    return WI.UIString("Additions");
                                case InspectorBackend.Enum.DOM.LiveRegionRelevant.Removals:
                                    return WI.UIString("Removals");
                                case InspectorBackend.Enum.DOM.LiveRegionRelevant.Text:
                                    return WI.UIString("Text");
                                default: // If WebCore sends a new unhandled value, display as a String.
                                    return "\"" + value + "\"";
                                }
                            });
                        }
                        liveRegionStatus += " (" + liveRegionRelevant.join(", ") + ")";
                    }
                    // Clarify @aria-atomic if necessary.
                    if (accessibilityProperties.liveRegionAtomic) {
                        liveRegionStatusNode = document.createElement("div");
                        liveRegionStatusNode.className = "value-with-clarification";
                        liveRegionStatusNode.setAttribute("role", "text");
                        liveRegionStatusNode.append(liveRegionStatus);
                        var clarificationNode = document.createElement("div");
                        clarificationNode.className = "clarification";
                        clarificationNode.append(WI.UIString("Region announced in its entirety."));
                        liveRegionStatusNode.appendChild(clarificationNode);
                    }
                }

                var mouseEventNodeId = accessibilityProperties.mouseEventNodeId;
                var mouseEventTextValue = "";
                var mouseEventNodeLink = null;
                if (mouseEventNodeId) {
                    if (mouseEventNodeId === accessibilityProperties.nodeId)
                        mouseEventTextValue = WI.UIString("Yes");
                    else
                        mouseEventNodeLink = linkForNodeId(mouseEventNodeId);
                }

                var ownedNodeLinkList = linkListForNodeIds(accessibilityProperties.ownedNodeIds);

                // Accessibility tree parent is not a 1:1 mapping with the DOM tree parent.
                var parentNodeLink = linkForNodeId(accessibilityProperties.parentNodeId);

                var pressed = booleanValueToLocalizedStringIfPropertyDefined("pressed");
                var readonly = booleanValueToLocalizedStringIfTrue("readonly");
                var required = booleanValueToLocalizedStringIfPropertyDefined("required");

                var role = accessibilityProperties.role;
                let hasPopup = accessibilityProperties.isPopupButton;
                let roleType = null;
                let buttonType = null;
                let buttonTypePopupString = WI.UIString("popup");
                let buttonTypeToggleString = WI.UIString("toggle");
                let buttonTypePopupToggleString = WI.UIString("popup, toggle");

                if (role === "" || role === "unknown")
                    role = WI.UIString("No matching ARIA role");
                else if (role) {
                    if (role === "button") {
                        if (pressed)
                            buttonType = buttonTypeToggleString;

                        // In cases where an element is a toggle button, but it also has
                        // aria-haspopup, we concatenate the button types. If it is just
                        // a popup button, we only include "popup".
                        if (hasPopup)
                            buttonType = buttonType ? buttonTypePopupToggleString : buttonTypePopupString;
                    }

                    if (!domNode.getAttribute("role"))
                        roleType = WI.UIString("default");
                    else if (buttonType || domNode.getAttribute("role") !== role)
                        roleType = WI.UIString("computed");

                    if (buttonType && roleType)
                        role = WI.UIString("%s (%s, %s)").format(role, buttonType, roleType);
                    else if (roleType || buttonType) {
                        let extraInfo = roleType || buttonType;
                        role = WI.UIString("%s (%s)").format(role, extraInfo);
                    }
                }

                var selected = booleanValueToLocalizedStringIfTrue("selected");
                var selectedChildNodeLinkList = linkListForNodeIds(accessibilityProperties.selectedChildNodeIds);

                var headingLevel = accessibilityProperties.headingLevel;
                var hierarchyLevel = accessibilityProperties.hierarchyLevel;
                // Assign all the properties to their respective views.
                this._accessibilityNodeActiveDescendantRow.value = activeDescendantLink || "";
                this._accessibilityNodeBusyRow.value = busy;
                this._accessibilityNodeCheckedRow.value = checked;
                this._accessibilityNodeChildrenRow.value = childNodeLinkList || "";
                this._accessibilityNodeControlsRow.value = controlledNodeLinkList || "";
                this._accessibilityNodeCurrentRow.value = current;
                this._accessibilityNodeDisabledRow.value = disabled;
                this._accessibilityNodeExpandedRow.value = expanded;
                this._accessibilityNodeFlowsRow.value = flowedNodeLinkList || "";
                this._accessibilityNodeFocusedRow.value = focused;
                this._accessibilityNodeHeadingLevelRow.value = headingLevel || "";
                this._accessibilityNodehierarchyLevelRow.value = hierarchyLevel || "";
                this._accessibilityNodeIgnoredRow.value = ignored;
                this._accessibilityNodeInvalidRow.value = invalid;
                this._accessibilityNodeLabelRow.value = label;
                this._accessibilityNodeLiveRegionStatusRow.value = liveRegionStatusNode || liveRegionStatus;
                this._accessibilityNodeSwitchStateRow.value = switchState;

                // Row label changes based on whether the value is a delegate node link.
                this._accessibilityNodeMouseEventRow.label = mouseEventNodeLink ? WI.UIString("Click Listener") : WI.UIString("Clickable");
                this._accessibilityNodeMouseEventRow.value = mouseEventNodeLink || mouseEventTextValue;

                this._accessibilityNodeOwnsRow.value = ownedNodeLinkList || "";
                this._accessibilityNodeParentRow.value = parentNodeLink || "";
                this._accessibilityNodePressedRow.value = pressed;
                this._accessibilityNodeReadonlyRow.value = readonly;
                this._accessibilityNodeRequiredRow.value = required;
                this._accessibilityNodeRoleRow.value = role;
                this._accessibilityNodeSelectedRow.value = selected;

                this._accessibilityNodeSelectedChildrenRow.label = WI.UIString("Selected Items");
                this._accessibilityNodeSelectedChildrenRow.value = selectedChildNodeLinkList || "";
                if (selectedChildNodeLinkList && accessibilityProperties.selectedChildNodeIds.length === 1)
                    this._accessibilityNodeSelectedChildrenRow.label = WI.UIString("Selected Item");

                // Display order, not alphabetical as above.
                this._accessibilityGroup.rows = [
                    // Global properties for all elements.
                    this._accessibilityNodeIgnoredRow,
                    this._accessibilityNodeRoleRow,
                    this._accessibilityNodeLabelRow,
                    this._accessibilityNodeParentRow,
                    this._accessibilityNodeActiveDescendantRow,
                    this._accessibilityNodeSelectedChildrenRow,
                    this._accessibilityNodeChildrenRow,
                    this._accessibilityNodeOwnsRow,
                    this._accessibilityNodeControlsRow,
                    this._accessibilityNodeFlowsRow,
                    this._accessibilityNodeMouseEventRow,
                    this._accessibilityNodeFocusedRow,
                    this._accessibilityNodeHeadingLevelRow,
                    this._accessibilityNodehierarchyLevelRow,
                    this._accessibilityNodeBusyRow,
                    this._accessibilityNodeLiveRegionStatusRow,
                    this._accessibilityNodeCurrentRow,

                    // Properties exposed for all input-type elements.
                    this._accessibilityNodeDisabledRow,
                    this._accessibilityNodeInvalidRow,
                    this._accessibilityNodeRequiredRow,

                    // Role-specific properties.
                    this._accessibilityNodeCheckedRow,
                    this._accessibilityNodeExpandedRow,
                    this._accessibilityNodePressedRow,
                    this._accessibilityNodeReadonlyRow,
                    this._accessibilityNodeSelectedRow,
                    this._accessibilityNodeSwitchStateRow,
                ];

                this._accessibilityEmptyRow.hideEmptyMessage();

            } else {
                this._accessibilityGroup.rows = [this._accessibilityEmptyRow];
                this._accessibilityEmptyRow.showEmptyMessage();
            }
        }

        domNode.accessibilityProperties(accessibilityPropertiesCallback.bind(this));
    }

    _populateEventListenersFilterContextMenu(contextMenu)
    {
        let addGroupingMethodCheckboxItem = (label, groupingMethod) => {
            contextMenu.appendCheckboxItem(label, () => {
                this._eventListenerGroupingMethodSetting.value = groupingMethod;

                this._refreshEventListeners();
            }, this._eventListenerGroupingMethodSetting.value === groupingMethod);
        };

        addGroupingMethodCheckboxItem(WI.UIString("Group by Event", "Group by Event @ Node Event Listeners", "Group DOM event listeners by DOM event"), WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod.Event);
        addGroupingMethodCheckboxItem(WI.UIString("Group by Target", "Group by Target @ Node Event Listeners", "Group DOM event listeners by DOM node"), WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod.Target);
    }

    _eventListenersChanged(event)
    {
        if (event.target === this.domNode || event.target.isAncestor(this.domNode))
            this._refreshEventListeners();
    }

    _attributesChanged(event)
    {
        if (event.data.node !== this.domNode)
            return;
        this._refreshAttributes();
        this._refreshAccessibility();
        this._refreshDataBindings();
    }

    _attributeNodeValueChanged(event)
    {
        let change = event.data;
        let data = event.target.data;

        if (change.columnIdentifier === "name") {
            this.domNode.removeAttribute(data[change.columnIdentifier], (error) => {
                this.domNode.setAttribute(change.value, `${change.value}="${data.value}"`);
            });
        } else if (change.columnIdentifier === "value")
            this.domNode.setAttributeValue(data.name, change.value);
    }

    _characterDataModified(event)
    {
        if (event.data.node !== this.domNode)
            return;
        this._identityNodeValueRow.value = this.domNode.nodeValue();
    }

    _customElementStateChanged(event)
    {
        if (event.data.node !== this.domNode)
            return;
        this._refreshIdentity();
    }

    _nodeTypeDisplayName()
    {
        switch (this.domNode.nodeType()) {
        case Node.ELEMENT_NODE: {
            const nodeName = WI.UIString("Element");
            const state = this._customElementState();
            return state === null ? nodeName : `${nodeName} (${state})`;
        }
        case Node.TEXT_NODE:
            return WI.UIString("Text Node");
        case Node.COMMENT_NODE:
            return WI.UIString("Comment");
        case Node.DOCUMENT_NODE:
            return WI.UIString("Document");
        case Node.DOCUMENT_TYPE_NODE:
            return WI.UIString("Document Type");
        case Node.DOCUMENT_FRAGMENT_NODE:
            return WI.UIString("Document Fragment");
        case Node.CDATA_SECTION_NODE:
            return WI.UIString("Character Data");
        case Node.PROCESSING_INSTRUCTION_NODE:
            return WI.UIString("Processing Instruction");
        default:
            console.error("Unknown DOM node type: ", this.domNode.nodeType());
            return this.domNode.nodeType();
        }
    }

    _customElementState()
    {
        const state = this.domNode.customElementState();
        switch (state) {
        case WI.DOMNode.CustomElementState.Builtin:
            return null;
        case WI.DOMNode.CustomElementState.Custom:
            return WI.UIString("Custom");
        case WI.DOMNode.CustomElementState.Waiting:
            return WI.UIString("Undefined custom element");
        case WI.DOMNode.CustomElementState.Failed:
            return WI.UIString("Failed to upgrade");
        }
        console.error("Unknown DOM custom element state: ", state);
        return null;
    }
};

WI.DOMNodeDetailsSidebarPanel.EventListenerGroupingMethod = {
    Event: "event",
    Target: "target",
};
