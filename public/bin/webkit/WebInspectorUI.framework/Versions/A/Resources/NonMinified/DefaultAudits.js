/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.DefaultAudits = {};

WI.DefaultAudits.levelPass = function() {
    return {level: "pass"};
};

WI.DefaultAudits.levelWarn = function() {
    return {level: "warn"};
};

WI.DefaultAudits.levelFail = function() {
    return {level: "fail"};
};

WI.DefaultAudits.levelError = function() {
    return {level: "error"};
};

WI.DefaultAudits.levelUnsupported = function() {
    return {level: "unsupported"};
};

WI.DefaultAudits.dataDOMNodes = function() {
    return {level: "pass", domNodes: [document.body]};
};

WI.DefaultAudits.dataDOMAttributes = function() {
    return {level: "pass", domNodes: Array.from(document.querySelectorAll("[id]")), domAttributes: ["id"]};
};

WI.DefaultAudits.dataErrors = function() {
    throw Error("this error was thrown from inside the audit test code.");
};

WI.DefaultAudits.dataCustom = function() {
    return {level: "pass", a: 1, b: [2], c: {key: 3}};
};

WI.DefaultAudits.getElementsByComputedRole = function() {
    return {level: "pass", domNodes: WebInspectorAudit.Accessibility.getElementsByComputedRole("link"), domAttributes: ["role"]};
};

WI.DefaultAudits.getActiveDescendant = function() {
    let result = {level: "pass"};
    let activeDescendant = WebInspectorAudit.Accessibility.getActiveDescendant(document.body);
    if (activeDescendant)
        result.domNodes = [activeDescendant];
    return result;
};

WI.DefaultAudits.getChildNodes = function() {
    let childNodes = WebInspectorAudit.Accessibility.getChildNodes(document.body);
    return {level: "pass", domNodes: childNodes || []};
};

WI.DefaultAudits.getComputedProperties = function() {
    let domAttributes = ["alt", "aria-atomic", "aria-busy", "aria-checked", "aria-current", "aria-disabled", "aria-expanded", "aria-haspopup", "aria-hidden", "aria-invalid", "aria-label", "aria-labelledby", "aria-level", "aria-live", "aria-pressed", "aria-readonly", "aria-relevant", "aria-required", "aria-selected", "role", "title"].filter((attribute) => document.body.hasAttribute(attribute));
    let computedProperties = WebInspectorAudit.Accessibility.getComputedProperties(document.body);
    return {level: "pass", domNodes: [document.body], domAttributes, ...(computedProperties || {})};
};

WI.DefaultAudits.getControlledNodes = function() {
    let controlledNodes = WebInspectorAudit.Accessibility.getControlledNodes(document.body);
    return {level: "pass", domNodes: controlledNodes || []};
};

WI.DefaultAudits.getFlowedNodes = function() {
    let flowedNodes = WebInspectorAudit.Accessibility.getFlowedNodes(document.body);
    return {level: "pass", domNodes: flowedNodes || []};
};

WI.DefaultAudits.getMouseEventNode = function() {
    let result = {level: "pass"};
    let mouseEventNode = WebInspectorAudit.Accessibility.getMouseEventNode(document.body);
    if (mouseEventNode)
        result.domNodes = [mouseEventNode];
    return result;
};

WI.DefaultAudits.getOwnedNodes = function() {
    let ownedNodes = WebInspectorAudit.Accessibility.getOwnedNodes(document.body);
    return {level: "pass", domNodes: ownedNodes || []};
};

WI.DefaultAudits.getParentNode = function() {
    let result = {level: "pass"};
    let parentNode = WebInspectorAudit.Accessibility.getParentNode(document.body);
    if (parentNode)
        result.domNodes = [parentNode];
    return result;
};

WI.DefaultAudits.getSelectedChildNodes = function() {
    let selectedChildNodes = WebInspectorAudit.Accessibility.getSelectedChildNodes(document.body);
    return {level: "pass", domNodes: selectedChildNodes || []};
};

WI.DefaultAudits.hasEventListeners = function() {
    let domAttributes = Array.from(document.body.attributes).filter((attribute) => attribute.name.startsWith("on"));
    return {level: "pass", domNodes: [document.body], domAttributes, hasEventListeners: WebInspectorAudit.DOM.hasEventListeners(document.body)};
};

WI.DefaultAudits.hasEventListenersClick = function() {
    let domAttributes = ["onclick"].filter((attribute) => document.body.hasAttribute(attribute));
    return {level: "pass", domNodes: [document.body], domAttributes, hasClickEventListener: WebInspectorAudit.DOM.hasEventListeners(document.body, "click")};
};

WI.DefaultAudits.getResources = function() {
    return {level: "pass", resources: WebInspectorAudit.Resources.getResources()};
};

WI.DefaultAudits.getResourceContent = function() {
    let resources = WebInspectorAudit.Resources.getResources();
    let mainResource = resources.find((resource) => resource.url === window.location.href);
    return {level: "pass", mainResource, resourceContent: WebInspectorAudit.Resources.getResourceContent(mainResource.id)};
};

WI.DefaultAudits.unsupported = function() {
    throw Error("this test should not be supported.");
};

WI.DefaultAudits.testMenuRoleForRequiredChildren = function() {
    const relationships = {
        menu: ["menuitem", "menuitemcheckbox", "menuitemradio"],
        menubar: ["menuitem", "menuitemcheckbox", "menuitemradio"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testGridRoleForRequiredChildren = function() {
    const relationships = {
        grid: ["row", "rowgroup"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testForAriaLabelledBySpelling = function() {
    let domNodes = Array.from(document.querySelectorAll("[aria-labeledby]"));
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-labeledby"]};
};

WI.DefaultAudits.testForMultipleBanners = function() {
    let domNodes = [];
    let banners = WebInspectorAudit.Accessibility.getElementsByComputedRole("banner");
    if (banners.length > 1)
        domNodes = banners;
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testForLinkLabels = function() {
    let links = WebInspectorAudit.Accessibility.getElementsByComputedRole("link");
    let domNodes = links.filter((link) => {
        let properties = WebInspectorAudit.Accessibility.getComputedProperties(link);
        return !properties.label && !properties.hidden;
    });
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-label", "aria-labelledby", "title"]};
};

WI.DefaultAudits.testRowGroupRoleForRequiredChildren = function() {
    const relationships = {
        rowgroup: ["row"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testTableRoleForRequiredChildren = function() {
    const relationships = {
        table: ["row", "rowgroup"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testForMultipleLiveRegions = function() {
    const liveRegionRoles = ["alert", "log", "status", "marquee", "timer"];
    let domNodes = [];
    let liveRegions = liveRegionRoles.reduce((a, b) => {
        return a.concat(WebInspectorAudit.Accessibility.getElementsByComputedRole(b));
    }, []);
    liveRegions = liveRegions.concat(Array.from(document.querySelectorAll(`[aria-live="polite"], [aria-live="assertive"]`)));
    if (liveRegions.length > 1)
        domNodes = liveRegions;
    return {level: domNodes.length ? "warn" : "pass", domNodes, domAttributes: ["aria-live"]};
};

WI.DefaultAudits.testListBoxRoleForRequiredChildren = function() {
    const relationships = {
        listbox: ["option"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testImageLabels = function() {
    let images = WebInspectorAudit.Accessibility.getElementsByComputedRole("img");
    let domNodes = images.filter((image) => !WebInspectorAudit.Accessibility.getComputedProperties(image).label);
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-label", "aria-labelledby", "title", "alt"]};
};

WI.DefaultAudits.testForAriaHiddenFalse = function() {
    let domNodes = Array.from(document.querySelectorAll(`[aria-hidden="false"]`));
    return {level: domNodes.length ? "warn" : "pass", domNodes, domAttributes: ["aria-hidden"]};
};

WI.DefaultAudits.testTreeRoleForRequiredChildren = function() {
    const relationships = {
        tree: ["treeitem", "group"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testRadioGroupRoleForRequiredChildren = function() {
    const relationships = {
        radiogroup: ["radio"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testFeedRoleForRequiredChildren = function() {
    const relationships = {
        feed: ["article"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testTabListRoleForRequiredChildren = function() {
    const relationships = {
        tablist: ["tab"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testButtonLabels = function() {
    let buttons = WebInspectorAudit.Accessibility.getElementsByComputedRole("button");
    let domNodes = buttons.filter((button) => !WebInspectorAudit.Accessibility.getComputedProperties(button).label);
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-label", "aria-labelledby", "title"]};
};

WI.DefaultAudits.testRowRoleForRequiredChildren = function() {
    const relationships = {
        row: ["cell", "gridcell", "columnheader", "rowheader"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testListRoleForRequiredChildren = function() {
    const relationships = {
        list: ["listitem", "group"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "warn" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testComboBoxRoleForRequiredChildren = function() {
    const relationships = {
        combobox: ["textbox", "listbox", "tree", "grid", "dialog"],
    };
    let domNodes = [];
    let visitedParents = new Set;
    function hasChildWithRole(node, expectedRoles) {
        let childNode = node;
        if (!childNode)
            return false;

        if (childNode.parentNode)
            visitedParents.add(childNode.parentNode);

        while (childNode) {
            let properties = WebInspectorAudit.Accessibility.getComputedProperties(childNode);
            if (childNode.nodeType === Node.ELEMENT_NODE && properties) {
                if (expectedRoles.includes(properties.role))
                    return true;

                if (childNode.hasChildNodes() && hasChildWithRole(childNode.firstChild, expectedRoles))
                    return true;
            }
            childNode = childNode.nextSibling;
        }
        return false;
    }
    for (let role in relationships) {
        for (let parentNode of WebInspectorAudit.Accessibility.getElementsByComputedRole(role)) {
            if (visitedParents.has(parentNode))
                continue;

            if (!hasChildWithRole(parentNode.firstChild, relationships[role]))
                domNodes.push(parentNode);
        }
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};

WI.DefaultAudits.testForMultipleMainContentSections = function() {
    let domNodes = [];
    let mainContentElements = WebInspectorAudit.Accessibility.getElementsByComputedRole("main");
    if (mainContentElements.length > 1) {
        domNodes = mainContentElements;
    }
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["role"]};
};
WI.DefaultAudits.testDialogsForLabels = function() {
    let dialogs = WebInspectorAudit.Accessibility.getElementsByComputedRole("dialog");
    let domNodes = dialogs.filter((dialog) => !WebInspectorAudit.Accessibility.getComputedProperties(dialog).label);
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-label", "aria-labelledby", "title"]};
};

WI.DefaultAudits.testForInvalidAriaHiddenValue = function() {
    let domNodes = Array.from(document.querySelectorAll(`[aria-hidden]:not([aria-hidden="true"], [aria-hidden="false"])`));
    return {level: domNodes.length ? "fail" : "pass", domNodes, domAttributes: ["aria-hidden"]};
};

WI.DefaultAudits.newAuditPlaceholder = function() {
    let result = {
        level: "pass",
    };
    return result;
};
