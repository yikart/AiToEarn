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

function(element) {
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

    return utils.isShown(element);
}
