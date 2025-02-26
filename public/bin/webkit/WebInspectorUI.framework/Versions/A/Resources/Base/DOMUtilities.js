/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
 * Copyright (C) 2007, 2008, 2013 Apple Inc.  All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009 Joseph Pecoraro
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
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
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

WI.roleSelectorForNode = function(node)
{
    // This is proposed syntax for CSS 4 computed role selector :role(foo) and subject to change.
    // See http://lists.w3.org/Archives/Public/www-style/2013Jul/0104.html
    var title = "";
    var role = node.computedRole();
    if (role)
        title = ":role(" + role + ")";
    return title;
};

WI.linkifyAccessibilityNodeReference = function(node)
{
    if (!node)
        return null;
    // Same as linkifyNodeReference except the link text has the classnames removed...
    // ...for list brevity, and both text and title have roleSelectorForNode appended.
    var link = WI.linkifyNodeReference(node);
    var tagIdSelector = link.title;
    var classSelectorIndex = tagIdSelector.indexOf(".");
    if (classSelectorIndex > -1)
        tagIdSelector = tagIdSelector.substring(0, classSelectorIndex);
    var roleSelector = WI.roleSelectorForNode(node);
    link.textContent = tagIdSelector + roleSelector;
    link.title += roleSelector;
    return link;
};

WI.linkifyStyleable = function(styleable)
{
    console.assert(styleable instanceof WI.DOMStyleable, styleable);
    let displayName = styleable.displayName;
    let link = document.createElement("span");
    link.append(displayName);
    return WI.linkifyNodeReferenceElement(styleable.node, link, {displayName});
};

WI.linkifyNodeReference = function(node, options = {})
{
    let displayName = node.displayName;
    if (!isNaN(options.maxLength))
        displayName = displayName.truncate(options.maxLength);

    let link = document.createElement("span");
    link.append(displayName);
    return WI.linkifyNodeReferenceElement(node, link, {...options, displayName});
};

WI.linkifyNodeReferenceElement = function(node, element, options = {})
{
    element.setAttribute("role", "link");
    element.title = options.displayName || node.displayName;

    let nodeType = node.nodeType();
    if (!options.ignoreClick && (nodeType !== Node.DOCUMENT_NODE || node.parentNode) && nodeType !== Node.TEXT_NODE)
        element.classList.add("node-link");

    WI.bindInteractionsForNodeToElement(node, element, options);

    return element;
};

WI.bindInteractionsForNodeToElement = function(node, element, options = {}) {
    if (!options.ignoreClick) {
        element.addEventListener("click", (event) => {
            WI.domManager.inspectElement(node.id, {
                initiatorHint: WI.TabBrowser.TabNavigationInitiator.LinkClick,
            });
        });
    }

    element.addEventListener("mouseover", (event) => {
        node.highlight();
    });

    element.addEventListener("mouseout", (event) => {
        WI.domManager.hideDOMNodeHighlight();
    });

    element.addEventListener("contextmenu", (event) => {
        let contextMenu = WI.ContextMenu.createFromEvent(event);
        WI.appendContextMenuItemsForDOMNode(contextMenu, node, options);
    });
};

function createSVGElement(tagName)
{
    return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

WI.cssPath = function(node, options = {})
{
    console.assert(node instanceof WI.DOMNode, "Expected a DOMNode.");
    if (node.nodeType() !== Node.ELEMENT_NODE)
        return "";

    let suffix = "";
    if (node.isPseudoElement()) {
        suffix = "::" + node.pseudoType();
        node = node.parentNode;
    }

    let components = [];
    while (node) {
        let component = WI.cssPathComponent(node, options);
        if (!component)
            break;
        components.push(component);
        if (component.done)
            break;
        node = node.parentNode;
    }

    components.reverse();
    return components.map((x) => x.value).join(" > ") + suffix;
};

WI.cssPathComponent = function(node, options = {})
{
    console.assert(node instanceof WI.DOMNode, "Expected a DOMNode.");
    console.assert(!node.isPseudoElement());
    if (node.nodeType() !== Node.ELEMENT_NODE)
        return null;

    let nodeName = node.nodeNameInCorrectCase();

    // Root node does not have siblings.
    if (!node.parentNode || node.parentNode.nodeType() === Node.DOCUMENT_NODE)
        return {value: nodeName, done: true};

    if (options.full) {
        function getUniqueAttributes(domNode) {
            let uniqueAttributes = new Map;
            for (let attribute of domNode.attributes()) {
                let values = [attribute.value];
                if (attribute.name === "id" || attribute.name === "class")
                    values = attribute.value.split(/\s+/);
                uniqueAttributes.set(attribute.name, new Set(values));
            }
            return uniqueAttributes;
        }

        let nodeIndex = 0;
        let needsNthChild = false;
        let uniqueAttributes = getUniqueAttributes(node);
        node.parentNode.children.forEach((child, i) => {
            if (child.nodeType() !== Node.ELEMENT_NODE)
                return;

            if (child === node) {
                nodeIndex = i;
                return;
            }

            if (needsNthChild || child.nodeNameInCorrectCase() !== nodeName)
                return;

            let childUniqueAttributes = getUniqueAttributes(child);
            let subsetCount = 0;
            for (let [name, values] of uniqueAttributes) {
                let childValues = childUniqueAttributes.get(name);
                if (childValues && values.size <= childValues.size && values.isSubsetOf(childValues))
                    ++subsetCount;
            }

            if (subsetCount === uniqueAttributes.size)
                needsNthChild = true;
        });

        function selectorForAttribute(values, prefix = "", shouldCSSEscape = false) {
            if (!values || !values.size)
                return "";
            values = Array.from(values);
            values = values.filter((value) => value && value.length);
            if (!values.length)
                return "";
            values = values.map((value) => shouldCSSEscape ? CSS.escape(value) : value.escapeCharacters("\""));
            return prefix + values.join(prefix);
        }

        let selector = nodeName;
        selector += selectorForAttribute(uniqueAttributes.get("id"), "#", true);
        selector += selectorForAttribute(uniqueAttributes.get("class"), ".", true);
        for (let [attribute, values] of uniqueAttributes) {
            if (attribute !== "id" && attribute !== "class")
                selector += `[${attribute}="${selectorForAttribute(values)}"]`;
        }

        if (needsNthChild)
            selector += `:nth-child(${nodeIndex + 1})`;

        return {value: selector, done: false};
    }

    let lowerNodeName = node.nodeName().toLowerCase();

    // html, head, and body are unique nodes.
    if (lowerNodeName === "body" || lowerNodeName === "head" || lowerNodeName === "html")
        return {value: nodeName, done: true};

    // #id is unique.
    let id = node.getAttribute("id");
    if (id)
        return {value: node.escapedIdSelector, done: true};

    // Find uniqueness among siblings.
    //   - look for a unique className
    //   - look for a unique tagName
    //   - fallback to nth-child()

    function classNames(node) {
        let classAttribute = node.getAttribute("class");
        return classAttribute ? classAttribute.trim().split(/\s+/) : [];
    }

    let nthChildIndex = -1;
    let hasUniqueTagName = true;
    let uniqueClasses = new Set(classNames(node));

    let siblings = node.parentNode.children;
    let elementIndex = 0;
    for (let sibling of siblings) {
        if (sibling.nodeType() !== Node.ELEMENT_NODE)
            continue;

        elementIndex++;
        if (sibling === node) {
            nthChildIndex = elementIndex;
            continue;
        }

        if (sibling.nodeNameInCorrectCase() === nodeName)
            hasUniqueTagName = false;

        if (uniqueClasses.size) {
            let siblingClassNames = classNames(sibling);
            for (let className of siblingClassNames)
                uniqueClasses.delete(className);
        }
    }

    let selector = nodeName;
    if (lowerNodeName === "input" && node.getAttribute("type") && !uniqueClasses.size)
        selector += `[type="${node.getAttribute("type")}"]`;
    if (!hasUniqueTagName) {
        if (uniqueClasses.size)
            selector += node.escapedClassSelector;
        else
            selector += `:nth-child(${nthChildIndex})`;
    }

    return {value: selector, done: false};
};

WI.xpath = function(node)
{
    console.assert(node instanceof WI.DOMNode, "Expected a DOMNode.");

    if (node.nodeType() === Node.DOCUMENT_NODE)
        return "/";

    let components = [];
    while (node) {
        let component = WI.xpathComponent(node);
        if (!component)
            break;
        components.push(component);
        if (component.done)
            break;
        node = node.parentNode;
    }

    components.reverse();

    let prefix = components.length && components[0].done ? "" : "/";
    return prefix + components.map((x) => x.value).join("/");
};

WI.xpathComponent = function(node)
{
    console.assert(node instanceof WI.DOMNode, "Expected a DOMNode.");

    let index = WI.xpathIndex(node);
    if (index === -1)
        return null;

    let value;

    switch (node.nodeType()) {
    case Node.DOCUMENT_NODE:
        return {value: "", done: true};
    case Node.ELEMENT_NODE:
        var id = node.getAttribute("id");
        if (id)
            return {value: `//*[@id="${id}"]`, done: true};
        value = node.localName();
        break;
    case Node.ATTRIBUTE_NODE:
        value = `@${node.nodeName()}`;
        break;
    case Node.TEXT_NODE:
    case Node.CDATA_SECTION_NODE:
        value = "text()";
        break;
    case Node.COMMENT_NODE:
        value = "comment()";
        break;
    case Node.PROCESSING_INSTRUCTION_NODE:
        value = "processing-instruction()";
        break;
    default:
        value = "";
        break;
    }

    if (index > 0)
        value += `[${index}]`;

    return {value, done: false};
};

WI.xpathIndex = function(node)
{
    // Root node.
    if (!node.parentNode)
        return 0;

    // No siblings.
    let siblings = node.parentNode.children;
    if (siblings.length <= 1)
        return 0;

    // Find uniqueness among siblings.
    //   - look for a unique localName
    //   - fallback to index

    function isSimilarNode(a, b) {
        if (a === b)
            return true;

        let aType = a.nodeType();
        let bType = b.nodeType();

        if (aType === Node.ELEMENT_NODE && bType === Node.ELEMENT_NODE)
            return a.localName() === b.localName();

        // XPath CDATA and text() are the same.
        if (aType === Node.CDATA_SECTION_NODE)
            return aType === Node.TEXT_NODE;
        if (bType === Node.CDATA_SECTION_NODE)
            return bType === Node.TEXT_NODE;

        return aType === bType;
    }

    let unique = true;
    let xPathIndex = -1;

    let xPathIndexCounter = 1; // XPath indices start at 1.
    for (let sibling of siblings) {
        if (!isSimilarNode(node, sibling))
            continue;

        if (node === sibling) {
            xPathIndex = xPathIndexCounter;
            if (!unique)
                return xPathIndex;
        } else {
            unique = false;
            if (xPathIndex !== -1)
                return xPathIndex;
        }

        xPathIndexCounter++;
    }

    if (unique)
        return 0;

    console.assert(xPathIndex > 0, "Should have found the node.");
    return xPathIndex;
};
