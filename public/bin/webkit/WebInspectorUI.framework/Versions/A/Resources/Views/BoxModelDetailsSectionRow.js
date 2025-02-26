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

WI.BoxModelDetailsSectionRow = class BoxModelDetailsSectionRow extends WI.DetailsSectionRow
{
    constructor()
    {
        super(WI.UIString("No Box Model Information"));

        this.element.classList.add("box-model");

        this._nodeStyles = null;

        this._outermostBox = null;
        this._outermostBoxWidth = NaN;
    }

    // Public

    get nodeStyles()
    {
        return this._nodeStyles;
    }

    set nodeStyles(nodeStyles)
    {
        if (this._nodeStyles && this._nodeStyles.computedStyle)
            this._nodeStyles.computedStyle.removeEventListener(WI.CSSStyleDeclaration.Event.PropertiesChanged, this._refresh, this);

        this._nodeStyles = nodeStyles;
        if (this._nodeStyles && this._nodeStyles.computedStyle)
            this._nodeStyles.computedStyle.addEventListener(WI.CSSStyleDeclaration.Event.PropertiesChanged, this._refresh, this);

        this.element.classList.remove("hovered");
        this._refresh();
    }

    get minimumWidth()
    {
        if (isNaN(this._outermostBoxWidth) && this._outermostBox) {
            const margin = 6; // Keep this in sync with `.details-section .row.box-model .box`.
            this._outermostBoxWidth = this._outermostBox.realOffsetWidth + margin;
        }
        return this._outermostBoxWidth || 0;
    }

    // Private

    _refresh()
    {
        if (this._ignoreNextRefresh) {
            this._ignoreNextRefresh = false;
            return;
        }

        this._updateMetrics();
    }

    _getPropertyValue(style, propertyName)
    {
        let property = style.propertyForName(propertyName);
        if (!property)
            return null;
        return property.value;
    }

    _getPropertyValueAsPx(style, propertyName)
    {
        let value = this._getPropertyValue(style, propertyName);
        if (!value)
            return 0;
        return Number(value.replace(/px$/, "") || 0);
    }

    _getBox(computedStyle, componentName)
    {
        let prefix = this._getComponentPrefix(componentName);
        let suffix = this._getComponentSuffix(componentName);
        let left = this._getPropertyValueAsPx(computedStyle, prefix + "-left" + suffix);
        let top = this._getPropertyValueAsPx(computedStyle, prefix + "-top" + suffix);
        let right = this._getPropertyValueAsPx(computedStyle, prefix + "-right" + suffix);
        let bottom = this._getPropertyValueAsPx(computedStyle, prefix + "-bottom" + suffix);
        return {left, top, right, bottom};
    }

    _getComponentPrefix(componentName)
    {
        return componentName === "border-radius" ? "border" : componentName;
    }

    _getComponentSuffix(componentName)
    {
        switch (componentName) {
        case "border":
            return "-width";

        case "border-radius":
            return "-radius";
        }
        return "";
    }

    _highlightDOMNode(showHighlight, mode, event)
    {
        event.stopPropagation();

        let node = showHighlight ? this.nodeStyles.node : null;
        if (node) {
            if (this._highlightMode === mode)
                return;
            this._highlightMode = mode;
            node.highlight(this._highlightMode);
        } else {
            this._highlightMode = null;
            WI.domManager.hideDOMNodeHighlight();
        }

        for (var i = 0; this._boxElements && i < this._boxElements.length; ++i) {
            var element = this._boxElements[i];
            if (node && (mode === "all" || element._name === mode))
                element.classList.add("active");
            else
                element.classList.remove("active");
        }

        this.element.classList.toggle("hovered", showHighlight);
    }

    _updateMetrics()
    {
        var metricsElement = document.createElement("div");
        var style = this._nodeStyles.computedStyle;

        function createValueElement(type, value, name, propertyName)
        {
            // Check if the value is a float and whether it should be rounded.
            let floatValue = parseFloat(value);
            let shouldRoundValue = !isNaN(floatValue) && (floatValue % 1 !== 0);

            if (isNaN(floatValue))
                value = figureDash;

            let element = document.createElement(type);
            element.textContent = shouldRoundValue ? ("~" + Math.round(floatValue * 100) / 100) : value;
            if (shouldRoundValue)
                element.title = value;
            element.addEventListener("dblclick", this._startEditing.bind(this, element, name, propertyName, style), false);
            return element;
        }

        function createBoxPartElement(name, side)
        {
            let prefix = this._getComponentPrefix(name);
            let suffix = this._getComponentSuffix(name);
            let propertyName = (prefix !== "position" ? prefix + "-" : "") + side + suffix;
            let value = this._getPropertyValue(style, propertyName);
            if (value) {
                if (prefix === "position" && value === "auto")
                    value = "";
                else if (prefix !== "position" && value === "0px")
                    value = "";
                else
                    value = value.replace(/px$/, "");
            } else
                value = "";

            let element = createValueElement.call(this, "div", value, name, propertyName);
            element.className = side;
            return element;
        }

        function createContentAreaElement(name)
        {
            console.assert(name === "width" || name === "height");

            let size = this._getPropertyValueAsPx(style, name);
            if (this._getPropertyValue(style, "box-sizing") === "border-box") {
                let borderBox = this._getBox(style, "border");
                let paddingBox = this._getBox(style, "padding");

                let [side, oppositeSide] = name === "width" ? ["left", "right"] : ["top", "bottom"];
                size = size - borderBox[side] - borderBox[oppositeSide] - paddingBox[side] - paddingBox[oppositeSide];
            }

            return createValueElement.call(this, "span", size, name, name);
        }

        // Display types for which margin is ignored.
        var noMarginDisplayType = {
            "table-cell": true,
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Display types for which padding is ignored.
        var noPaddingDisplayType = {
            "table-column": true,
            "table-column-group": true,
            "table-footer-group": true,
            "table-header-group": true,
            "table-row": true,
            "table-row-group": true
        };

        // Position types for which top, left, bottom and right are ignored.
        var noPositionType = {
            "static": true
        };

        this._boxElements = [];

        if (style.enabledProperties.length === 0) {
            this.showEmptyMessage();
            return;
        }

        let displayProperty = this._getPropertyValue(style, "display");
        let positionProperty = this._getPropertyValue(style, "position");
        if (!displayProperty || !positionProperty) {
            this.showEmptyMessage();
            return;
        }

        this._outermostBox = null;
        this._outermostBoxWidth = NaN;

        for (let name of ["content", "padding", "border", "margin", "position"]) {

            if (name === "margin" && noMarginDisplayType[displayProperty.value])
                continue;
            if (name === "padding" && noPaddingDisplayType[displayProperty.value])
                continue;
            if (name === "position" && noPositionType[positionProperty.value])
                continue;

            let boxElement = document.createElement("div");
            boxElement.classList.add("box", name);
            boxElement._name = name;
            boxElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, true, name === "position" ? "all" : name), false);
            this._boxElements.push(boxElement);

            if (name === "content") {
                let widthElement = createContentAreaElement.call(this, "width");
                let heightElement = createContentAreaElement.call(this, "height");
                if (!widthElement || !heightElement) {
                    this.showEmptyMessage();
                    return;
                }

                boxElement.append(widthElement, " \u00D7 ", heightElement);
            } else {
                let borderTopLeftRadiusElement = null;
                let borderTopRightRadiusElement = null;
                let borderBottomRightRadiusElement = null;
                let borderBottomLeftRadiusElement = null;
                if (name === "border") {
                    for (let corner of ["top-left", "top-right", "bottom-right", "bottom-left"]) {
                        let cornerValue = this._getPropertyValue(style, "border-" + corner + "-radius");
                        if (cornerValue && cornerValue !== "0px")
                            boxElement.classList.add("has-" + corner + "-radius");
                    }

                    borderTopLeftRadiusElement = createBoxPartElement.call(this, "border-radius", "top-left");
                    borderTopRightRadiusElement = createBoxPartElement.call(this, "border-radius", "top-right");
                    borderBottomRightRadiusElement = createBoxPartElement.call(this, "border-radius", "bottom-right");
                    borderBottomLeftRadiusElement = createBoxPartElement.call(this, "border-radius", "bottom-left");
                }

                let topElement = createBoxPartElement.call(this, name, "top");
                let leftElement = createBoxPartElement.call(this, name, "left");
                let rightElement = createBoxPartElement.call(this, name, "right");
                let bottomElement = createBoxPartElement.call(this, name, "bottom");
                if (!topElement || !leftElement || !rightElement || !bottomElement) {
                    this.showEmptyMessage();
                    return;
                }

                let labelElement = document.createElement("div");
                labelElement.className = "label";
                labelElement.textContent = name;
                boxElement.appendChild(labelElement);

                if (borderTopLeftRadiusElement)
                    boxElement.appendChild(borderTopLeftRadiusElement);

                boxElement.appendChild(topElement);

                if (borderTopRightRadiusElement)
                    boxElement.appendChild(borderTopRightRadiusElement);

                boxElement.appendChild(document.createElement("br"));
                boxElement.appendChild(leftElement);

                if (this._outermostBox)
                    boxElement.appendChild(this._outermostBox);

                boxElement.appendChild(rightElement);
                boxElement.appendChild(document.createElement("br"));

                if (borderBottomLeftRadiusElement)
                    boxElement.appendChild(borderBottomLeftRadiusElement);

                boxElement.appendChild(bottomElement);

                if (borderBottomRightRadiusElement)
                    boxElement.appendChild(borderBottomRightRadiusElement);
            }

            this._outermostBox = boxElement;
        }

        metricsElement.appendChild(this._outermostBox);
        metricsElement.addEventListener("mouseover", this._highlightDOMNode.bind(this, false, ""), false);

        this.hideEmptyMessage();
        this.element.appendChild(metricsElement);
    }

    _startEditing(targetElement, box, styleProperty, computedStyle)
    {
        if (WI.isBeingEdited(targetElement))
            return;

        // If the target element has a title use it as the editing value
        // since the current text is likely truncated/rounded.
        if (targetElement.title)
            targetElement.textContent = targetElement.title;

        var context = {box, styleProperty};
        var boundKeyDown = this._handleKeyDown.bind(this, context, styleProperty);
        context.keyDownHandler = boundKeyDown;
        targetElement.addEventListener("keydown", boundKeyDown, false);

        this._isEditingMetrics = true;

        var config = new WI.EditingConfig(this._editingCommitted.bind(this), this._editingCancelled.bind(this), context);
        WI.startEditing(targetElement, config);

        window.getSelection().setBaseAndExtent(targetElement, 0, targetElement, 1);
    }

    _alteredFloatNumber(number, event)
    {
        var arrowKeyPressed = event.keyIdentifier === "Up" || event.keyIdentifier === "Down";

        // Jump by 10 when shift is down or jump by 0.1 when Alt/Option is down.
        // Also jump by 10 for page up and down, or by 100 if shift is held with a page key.
        var changeAmount = 1;
        if (event.shiftKey && !arrowKeyPressed)
            changeAmount = 100;
        else if (event.shiftKey || !arrowKeyPressed)
            changeAmount = 10;
        else if (event.altKey)
            changeAmount = 0.1;

        if (event.keyIdentifier === "Down" || event.keyIdentifier === "PageDown")
            changeAmount *= -1;

        // Make the new number and constrain it to a precision of 6, this matches numbers the engine returns.
        // Use the Number constructor to forget the fixed precision, so 1.100000 will print as 1.1.
        var result = Number((number + changeAmount).toFixed(6));
        if (!String(result).match(WI.EditingSupport.NumberRegex))
            return null;

        return result;
    }

    _handleKeyDown(context, styleProperty, event)
    {
        if (!/^(?:Page)?(?:Up|Down)$/.test(event.keyIdentifier))
            return;

        var element = event.currentTarget;

        var selection = window.getSelection();
        if (!selection.rangeCount)
            return;

        var selectionRange = selection.getRangeAt(0);
        console.assert(selectionRange, "We should have a range if we are handling a key down event");
        if (!element.contains(selectionRange.commonAncestorContainer))
            return;

        var originalValue = element.textContent;
        var wordRange = selectionRange.startContainer.rangeOfWord(selectionRange.startOffset, WI.EditingSupport.StyleValueDelimiters, element);
        var wordString = wordRange.toString();

        var matches = WI.EditingSupport.NumberRegex.exec(wordString);
        var replacementString;
        if (matches && matches.length) {
            var prefix = matches[1];
            var suffix = matches[3];
            var number = this._alteredFloatNumber(parseFloat(matches[2]), event);
            if (number === null) {
                // Need to check for null explicitly.
                return;
            }

            if (styleProperty !== "margin" && number < 0)
                number = 0;

            replacementString = prefix + number + suffix;
        }

        if (!replacementString)
            return;

        var replacementTextNode = document.createTextNode(replacementString);

        wordRange.deleteContents();
        wordRange.insertNode(replacementTextNode);

        var finalSelectionRange = document.createRange();
        finalSelectionRange.setStart(replacementTextNode, 0);
        finalSelectionRange.setEnd(replacementTextNode, replacementString.length);

        selection.removeAllRanges();
        selection.addRange(finalSelectionRange);

        event.handled = true;
        event.preventDefault();

        this._ignoreNextRefresh = true;

        this._applyUserInput(element, replacementString, originalValue, context, false);
    }

    _editingEnded(element, context)
    {
        element.removeEventListener("keydown", context.keyDownHandler, false);
        this._isEditingMetrics = false;
    }

    _editingCancelled(element, context)
    {
        this._editingEnded(element, context);
        this._refresh();
    }

    _applyUserInput(element, userInput, previousContent, context, commitEditor)
    {
        if (commitEditor && userInput === previousContent) {
            // Nothing changed, so cancel.
            this._editingCancelled(element, context);
            return;
        }

        if (context.box !== "position" && (!userInput || userInput === figureDash))
            userInput = "0px";
        else if (context.box === "position" && (!userInput || userInput === figureDash))
            userInput = "auto";

        userInput = userInput.toLowerCase();
        // Append a "px" unit if the user input was just a number.
        if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(userInput))
            userInput += "px";

        var styleProperty = context.styleProperty;
        var computedStyle = this._nodeStyles.computedStyle;

        if (this._getPropertyValue(computedStyle, "box-sizing") === "border-box" && (styleProperty === "width" || styleProperty === "height")) {
            if (!userInput.match(/px$/)) {
                console.error("For elements with box-sizing: border-box, only absolute content area dimensions can be applied");
                return;
            }

            var borderBox = this._getBox(computedStyle, "border");
            var paddingBox = this._getBox(computedStyle, "padding");
            var userValuePx = Number(userInput.replace(/px$/, ""));
            if (isNaN(userValuePx))
                return;
            if (styleProperty === "width")
                userValuePx += borderBox.left + borderBox.right + paddingBox.left + paddingBox.right;
            else
                userValuePx += borderBox.top + borderBox.bottom + paddingBox.top + paddingBox.bottom;

            userInput = userValuePx + "px";
        }

        let setBorderStyleProperty = null;
        if (context.box === "border") {
            let borderStyleProperty = styleProperty.replace("-width", "-style");
            if (this._getPropertyValue(computedStyle, borderStyleProperty) === "none")
                setBorderStyleProperty = borderStyleProperty;
        }

        WI.RemoteObject.resolveNode(this._nodeStyles.node).then((object) => {
            function inspectedPage_node_toggleInlineStyleProperty(styleProperty, userInput, setBorderStyleProperty) {
                if (setBorderStyleProperty)
                    this.style.setProperty(setBorderStyleProperty, "solid", "important");
                this.style.setProperty(styleProperty, userInput, "important");
            }

            let didToggle = () => {
                this._nodeStyles.refresh();
            };

            object.callFunction(inspectedPage_node_toggleInlineStyleProperty, [styleProperty, userInput, setBorderStyleProperty], false, didToggle);
            object.release();
        });
    }

    _editingCommitted(element, userInput, previousContent, context)
    {
        this._editingEnded(element, context);
        this._applyUserInput(element, userInput, previousContent, context, true);
    }
};
