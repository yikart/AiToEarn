/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

function(strategy, ancestorElement, query, firstResultOnly, timeoutDuration, callback) {
    "use strict";

    var utils = { };

    utils.enclosingNodeOrSelfMatchingPredicate = function(targetNode, predicate) {
        for (let node = targetNode; node && node !== targetNode.getRootNode(); node = node.parentNode)
            if (predicate(node))
                return node;

        return null;
    }

    utils.nodeIsElement = function(node) {
        return !!node && node.nodeType === Node.ELEMENT_NODE;
    }

    utils.parentElementForElement = function(element) {
        if (!element)
            return null;

        return utils.enclosingNodeOrSelfMatchingPredicate(element.parentNode, utils.nodeIsElement);
    }

    utils.cascadedStylePropertyForElement = function(element, property) {
        if (!element || !property)
            return null;

        let computedStyle = window.getComputedStyle(element);
        let computedStyleProperty = computedStyle.getPropertyValue(property);
        if (computedStyleProperty && computedStyleProperty !== "inherit")
            return computedStyleProperty;

        // Ideally getPropertyValue would return the 'used' or 'actual' value, but
        // it doesn't for legacy reasons. So we need to do our own poor man's cascade.
        // Fall back to the first non-'inherit' value found in an ancestor.
        // In any case, getPropertyValue will not return 'initial'.

        // FIXME: will this incorrectly inherit non-inheritable CSS properties?
        // I think all important non-inheritable properties (width, height, etc.)
        // for our purposes here are specially resolved, so this may not be an issue.
        // Specification is here: https://drafts.csswg.org/cssom/#resolved-values
        let parentElement = utils.parentElementForElement(element);
        return utils.cascadedStylePropertyForElement(parentElement, property);
    }

    utils.isShown = function(element) {
        function enclosingElementOrSelfMatchingPredicate(targetElement, predicate) {
            for (let element = targetElement; element && element !== targetElement.getRootNode(); element = utils.parentElementForElement(element))
                if (predicate(element))
                    return element;

            return null;
        }

        function elementSubtreeHasNonZeroDimensions(element) {
            let boundingBox = element.getBoundingClientRect();
            if (boundingBox.width > 0 && boundingBox.height > 0)
                return true;

            // Paths can have a zero width or height. Treat them as shown if the stroke width is positive.
            if (element.tagName.toUpperCase() === "PATH" && boundingBox.width + boundingBox.height > 0) {
                let strokeWidth = utils.cascadedStylePropertyForElement(element, "stroke-width");
                return !!strokeWidth && (parseInt(strokeWidth, 10) > 0);
            }

            let cascadedOverflow = utils.cascadedStylePropertyForElement(element, "overflow");
            if (cascadedOverflow === "hidden")
                return false;

            // If the container's overflow is not hidden and it has zero size, consider the
            // container to have non-zero dimensions if a child node has non-zero dimensions.
            return Array.from(element.childNodes).some((childNode) => {
                if (childNode.nodeType === Node.TEXT_NODE)
                    return true;

                if (utils.nodeIsElement(childNode))
                    return elementSubtreeHasNonZeroDimensions(childNode);

                return false;
            });
        }

        function elementOverflowsContainer(element) {
            let cascadedOverflow = utils.cascadedStylePropertyForElement(element, "overflow");
            if (cascadedOverflow !== "hidden")
                return false;

            // FIXME: this needs to take into account the scroll position of the element,
            // the display modes of it and its ancestors, and the container it overflows.
            // See Selenium's bot.dom.getOverflowState atom for an exhaustive list of edge cases.
            return true;
        }

        function isElementSubtreeHiddenByOverflow(element) {
            if (!element)
                return false;

            if (!elementOverflowsContainer(element))
                return false;

            if (!element.childNodes.length)
                return false;

            // This element's subtree is hidden by overflow if all child subtrees are as well.
            return Array.from(element.childNodes).every((childNode) => {
                // Returns true if the child node is overflowed or otherwise hidden.
                // Base case: not an element, has zero size, scrolled out, or doesn't overflow container.
                if (!utils.nodeIsElement(childNode))
                    return true;

                if (!elementSubtreeHasNonZeroDimensions(childNode))
                    return true;

                // Recurse.
                return isElementSubtreeHiddenByOverflow(childNode);
            });
        }

        // This is a partial reimplementation of Selenium's "element is displayed" algorithm.
        // When the W3C specification's algorithm stabilizes, we should implement that.

        if (!(element instanceof Element))
            throw new Error("Cannot check the displayedness of a non-Element argument.");

        // Special cases for specific tag names.
        switch (element.tagName.toUpperCase()) {
        case "BODY":
            return true;

        case "SCRIPT":
        case "NOSCRIPT":
            return false;

        case "OPTGROUP":
        case "OPTION":
            // Option/optgroup are considered shown if the containing <select> is shown.
            let enclosingSelectElement = utils.enclosingNodeOrSelfMatchingPredicate(element, (e) => e.tagName.toUpperCase() === "SELECT");
            return utils.isShown(enclosingSelectElement);

        case "INPUT":
            // <input type="hidden"> is considered not shown.
            if (element.type === "hidden")
                return false;
            break;

        case "MAP":
            // FIXME: Selenium has special handling for <map> elements. We don't do anything now.

        default:
            break;
        }

        if (utils.cascadedStylePropertyForElement(element, "visibility") !== "visible")
            return false;

        let hasAncestorWithZeroOpacity = !!enclosingElementOrSelfMatchingPredicate(element, (e) => {
            return Number(utils.cascadedStylePropertyForElement(e, "opacity")) === 0;
        });
        let hasAncestorWithDisplayNone = !!enclosingElementOrSelfMatchingPredicate(element, (e) => {
            return utils.cascadedStylePropertyForElement(e, "display") === "none";
        });
        if (hasAncestorWithZeroOpacity || hasAncestorWithDisplayNone)
            return false;

        if (!elementSubtreeHasNonZeroDimensions(element))
            return false;

        if (isElementSubtreeHiddenByOverflow(element))
            return false;

        return true;
    }

    utils.getText = function(element) {
        var lines = [];

        function appendLinesFromTextNode(textNode, whitespace, textTransform) {
            // Remove zero-width characters.
            let text = textNode.nodeValue.replace(/[\u200b\u200e\u200f]/g, '');

            // Canonicalize the new lines.
            text = text.replace(/(\r\n|\r|\n)/g, '\n');

            let collapseAll = true;
            switch (whitespace) {
            case "normal":
            case "nowrap":
                // Collapse new lines.
                text = text.replace(/\n/g, ' ');
                break;
            case "pre":
            case "pre-wrap":
                // Convert all breaking spaces to be non-breaking.
                text = text.replace(/[ \f\t\v\u2028\u2029]/g, '\xa0');
                collapseAll = false;
                break;
            }

            if (collapseAll) {
                // Collapse all breaking spaces.
                text = text.replace(/[\ \f\t\v\u2028\u2029]+/g, ' ');
            }

            switch (textTransform) {
            case "capitalize":
                text = text.replace(/(^|[^\d\p{L}\p{S}])([\p{Ll}|\p{S}])/gu, function() {
                    return arguments[1] + arguments[2].toUpperCase();
                });
                break;
            case "uppercase":
                text = text.toUpperCase();
                break;
            case "lowercase":
                text = text.toLowerCase();
                break;
            }

            let currentLine = lines.pop() || '';
            if (currentLine.endsWith(' ') && text.startsWith(' '))
                text = text.substr(1);
            lines.push(currentLine + text);
        }

        function appendLinesFromNode(node, shown, whitespace, textTransform) {
            switch (node.nodeType) {
            case Node.TEXT_NODE:
                if (shown)
                    appendLinesFromTextNode(node, whitespace, textTransform);
                break;
            case Node.ELEMENT_NODE:
                if (node.tagName.toUpperCase() == "SLOT") {
                    let parentNode = node;
                    while (parentNode.parentNode)
                        parentNode = parentNode.parentNode;
                    if (parentNode instanceof ShadowRoot) {
                        Array.from(node.assignedNodes()).forEach((childNode) => {
                            appendLinesFromNode(childNode, shown, whitespace, textTransform);
                        });
                        return;
                    }
                }
                appendLinesFromElement(node);
                break;
            }
        }

        function appendLines(element) {
            function currentLine() {
                return lines[lines.length - 1] || '';
            }

            let isTableCell = false, display = null, isBlock = false;
            if (element.tagName.toUpperCase() === "BR")
                lines.push('');
            else {
                isTableCell = element.tagName.toUpperCase() === "TD";
                display = utils.cascadedStylePropertyForElement(element, "display");
                isBlock = !isTableCell
                    && !(display === "inline"
                         || display === "inline-block"
                         || display === "inline-table"
                         || display === "none"
                         || display === "table-cell"
                         || display === "table-column"
                         || display === "table-column-group");
                let previousElementSibling = element.previousElementSibling;
                let previousDisplay = previousElementSibling ? utils.cascadedStylePropertyForElement(previousElementSibling, "display") : '';
                let elementFloat = utils.cascadedStylePropertyForElement(element, "float") || utils.cascadedStylePropertyForElement(element, "cssFloat");
                let runIntoThis = previousDisplay == "run-in" && elementFloat == "none";
                if (isBlock && !runIntoThis && /^[\s\xa0]*$/.test(currentLine()))
                    lines.push('');
            }

            let shown = utils.isShown(element);
            let whitespace = null, textTransform = null;
            if (shown) {
                whitespace = utils.cascadedStylePropertyForElement(element, "white-space");
                textTransform = utils.cascadedStylePropertyForElement(element, "text-transform");
            }

            Array.from(element.childNodes).forEach((childNode) => {
                if (!childNode.assignedSlot)
                    appendLinesFromNode(childNode, shown, whitespace, textTransform);
            });

            let line = currentLine();
            if ((isTableCell || display == "table-cell") && line && line.endsWith(' '))
                lines[lines.length - 1] += ' ';

            if (isBlock && display != "run-in" && /^[\s\xa0]*$/.test(line))
                lines.push('');
        }

        function appendLinesFromElement(element) {
            if (element.shadowRoot) {
                Array.from(element.shadowRoot.childNodes).forEach((childNode) => {
                    appendLinesFromNode(childNode, true, null, null);
                });
            }

            appendLines(element);
        }

        appendLinesFromElement(element);

        lines = lines.map((str) => str.replace(/^[^\S\xa0]+|[^\S\xa0]+$/g, ''));
        let trimmed = lines.join('\n').replace(/^[^\S\xa0]+|[^\S\xa0]+$/g, '');

        // Replace non-breakable spaces with regular ones.
        return trimmed.replace(/\xa0/g, ' ');
    }

    ancestorElement = ancestorElement || document;

    switch (strategy) {
    case "id":
        strategy = "css selector";
        query = "[id=\"" + escape(query) + "\"]";
        break;
    case "name":
        strategy = "css selector";
        query = "[name=\"" + escape(query) + "\"]";
        break;
    }

    switch (strategy) {
    case "css selector":
    case "link text":
    case "partial link text":
    case "tag name":
    case "class name":
    case "xpath":
        break;
    default:
        // §12.2 Find Element and §12.3 Find Elements, step 4: If location strategy is not present as a keyword
        // in the table of location strategies, return error with error code invalid argument.
        // https://www.w3.org/TR/webdriver/#find-element
        throw { name: "InvalidParameter", message: ("Unsupported locator strategy: " + strategy + ".") };
    }

    function escape(string) {
        return string.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
    }

    function tryToFindNode() {
        try {
            switch (strategy) {
            case "css selector":
                if (firstResultOnly)
                    return ancestorElement.querySelector(query) || null;
                return Array.from(ancestorElement.querySelectorAll(query));

            case "link text":
                let linkTextResult = [];
                for (let link of ancestorElement.querySelectorAll("a")) {
                    if (utils.getText(link).trim() == query) {
                        linkTextResult.push(link);
                        if (firstResultOnly)
                            break;
                    }
                }
                if (firstResultOnly)
                    return linkTextResult[0] || null;
                return linkTextResult;

            case "partial link text":
                let partialLinkResult = [];
                for (let link of ancestorElement.querySelectorAll("a")) {
                    if (utils.getText(link).includes(query)) {
                        partialLinkResult.push(link);
                        if (firstResultOnly)
                            break;
                    }
                }
                if (firstResultOnly)
                    return partialLinkResult[0] || null;
                return partialLinkResult;

            case "tag name":
                let tagNameResult = ancestorElement.getElementsByTagName(query);
                if (firstResultOnly)
                    return tagNameResult[0] || null;
                return Array.from(tagNameResult);

            case "class name":
                let classNameResult = ancestorElement.getElementsByClassName(query);
                if (firstResultOnly)
                    return classNameResult[0] || null;
                return Array.from(classNameResult);

            case "xpath":
                if (firstResultOnly) {
                    let xpathResult = document.evaluate(query, ancestorElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                    if (!xpathResult)
                        return null;
                    return xpathResult.singleNodeValue;
                }

                let xpathResult = document.evaluate(query, ancestorElement, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                if (!xpathResult || !xpathResult.snapshotLength)
                    return [];

                let arrayResult = [];
                for (let i = 0; i < xpathResult.snapshotLength; ++i)
                    arrayResult.push(xpathResult.snapshotItem(i));
                return arrayResult;
            }
        } catch (error) {
            // §12. Element Retrieval. Step 6: If a DOMException, SyntaxError, or other error occurs during
            // the execution of the element location strategy, return error invalid selector.
            // https://www.w3.org/TR/webdriver/#dfn-find
            throw { name: "InvalidSelector", message: error.message };
        }
    }

    const pollInterval = 50;
    let pollUntil = performance.now() + timeoutDuration;

    function pollForNode() {
        let result = tryToFindNode();

        // Report any valid results.
        if (typeof result === "string" || result instanceof Node || (result instanceof Array && result.length)) {
            callback(result);
            return;
        }

        // Schedule another attempt if we have time remaining.
        let durationRemaining = pollUntil - performance.now();
        if (durationRemaining < pollInterval) {
            callback(firstResultOnly ? null : []);
            return;
        }

        setTimeout(pollForNode, pollInterval);
    }

    pollForNode();
}
