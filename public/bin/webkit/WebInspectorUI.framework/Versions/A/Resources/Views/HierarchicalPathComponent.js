/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.HierarchicalPathComponent = class HierarchicalPathComponent extends WI.Object
{
    constructor(displayName, styleClassNames, representedObject, textOnly, showSelectorArrows)
    {
        super();

        console.assert(displayName);
        console.assert(styleClassNames);

        this._representedObject = representedObject || null;

        this._element = document.createElement("div");
        this._element.className = "hierarchical-path-component";

        if (!Array.isArray(styleClassNames))
            styleClassNames = [styleClassNames];

        this._element.classList.add(...styleClassNames);

        if (!textOnly) {
            this._iconElement = document.createElement("img");
            this._iconElement.className = "icon";
            this._element.appendChild(this._iconElement);
        } else
            this._element.classList.add("text-only");

        this._titleElement = document.createElement("div");
        this._titleElement.className = "title";
        this._titleElement.setAttribute("dir", "auto");
        this._element.appendChild(this._titleElement);

        this._titleContentElement = document.createElement("div");
        this._titleContentElement.className = "content";
        this._titleElement.appendChild(this._titleContentElement);

        this._separatorElement = document.createElement("div");
        this._separatorElement.className = "separator";
        this._element.appendChild(this._separatorElement);

        this._selectElement = document.createElement("select");
        this._selectElement.setAttribute("dir", "auto");
        this._selectElement.addEventListener("mouseover", this._selectElementMouseOver.bind(this));
        this._selectElement.addEventListener("mouseout", this._selectElementMouseOut.bind(this));
        this._selectElement.addEventListener("mousedown", this._selectElementMouseDown.bind(this));
        this._selectElement.addEventListener("mouseup", this._selectElementMouseUp.bind(this));
        this._selectElement.addEventListener("change", this._selectElementSelectionChanged.bind(this));
        this._element.appendChild(this._selectElement);

        this._previousSibling = null;
        this._nextSibling = null;

        this._truncatedDisplayNameLength = 0;

        this._collapsed = false;
        this._hidden = false;
        this._selectorArrows = false;

        this.displayName = displayName;
        this.tooltip = displayName;
        this.selectorArrows = showSelectorArrows;
    }

    // Public

    get selectedPathComponent()
    {
        let selectedOption = this._selectElement[this._selectElement.selectedIndex];
        if (!selectedOption && this._selectElement.options.length === 1)
            selectedOption = this._selectElement.options[0];
        return selectedOption && selectedOption._pathComponent || null;
    }

    get element() { return this._element; }
    get representedObject() { return this._representedObject; }

    get displayName()
    {
        return this._displayName;
    }

    set displayName(newDisplayName)
    {
        console.assert(newDisplayName);
        if (newDisplayName === this._displayName)
            return;

        this._displayName = newDisplayName;

        this._updateElementTitleAndText();
    }

    get truncatedDisplayNameLength()
    {
        return this._truncatedDisplayNameLength;
    }

    set truncatedDisplayNameLength(truncatedDisplayNameLength)
    {
        truncatedDisplayNameLength = truncatedDisplayNameLength || 0;

        if (truncatedDisplayNameLength === this._truncatedDisplayNameLength)
            return;

        this._truncatedDisplayNameLength = truncatedDisplayNameLength;

        this._updateElementTitleAndText();
    }

    get minimumWidth()
    {
        if (this._collapsed)
            return WI.HierarchicalPathComponent.MinimumWidthCollapsed;
        if (this._selectorArrows)
            return WI.HierarchicalPathComponent.MinimumWidth + WI.HierarchicalPathComponent.SelectorArrowsWidth;
        return WI.HierarchicalPathComponent.MinimumWidth;
    }

    get forcedWidth()
    {
        let maxWidth = this._element.style.getProperty("width");
        if (typeof maxWidth === "string")
            return parseInt(maxWidth);
        return null;
    }

    set forcedWidth(width)
    {
        if (typeof width === "number") {
            let minimumWidthForOneCharacterTruncatedTitle = WI.HierarchicalPathComponent.MinimumWidthForOneCharacterTruncatedTitle;
            if (this.selectorArrows)
                minimumWidthForOneCharacterTruncatedTitle += WI.HierarchicalPathComponent.SelectorArrowsWidth;

            // If the width is less than the minimum width required to show a single character and ellipsis, then
            // just collapse down to the bare minimum to show only the icon.
            if (width < minimumWidthForOneCharacterTruncatedTitle)
                width = 0;

            // Ensure the width does not go less than 1px. If the width is 0 the layout gets funky. There is a min-width
            // in the CSS too, so as long the width is less than min-width we get the desired effect of only showing the icon.
            this._element.style.setProperty("width", Math.max(1, width) + "px");
        } else
            this._element.style.removeProperty("width");
    }

    get hidden()
    {
        return this._hidden;
    }

    set hidden(flag)
    {
        if (this._hidden === flag)
            return;

        this._hidden = flag;
        this._element.classList.toggle("hidden", this._hidden);
    }

    get collapsed()
    {
        return this._collapsed;
    }

    set collapsed(flag)
    {
        if (this._collapsed === flag)
            return;

        this._collapsed = flag;
        this._element.classList.toggle("collapsed", this._collapsed);
    }

    get selectorArrows()
    {
        return this._selectorArrows;
    }

    set selectorArrows(flag)
    {
        if (this._selectorArrows === flag)
            return;

        this._selectorArrows = flag;

        if (this._selectorArrows) {
            this._selectorArrowsElement = WI.ImageUtilities.useSVGSymbol("Images/UpDownArrows.svg", "selector-arrows");
            this._element.insertBefore(this._selectorArrowsElement, this._separatorElement);
        } else if (this._selectorArrowsElement) {
            this._selectorArrowsElement.remove();
            this._selectorArrowsElement = null;
        }

        this._element.classList.toggle("show-selector-arrows", !!this._selectorArrows);
    }

    get tooltip()
    {
        return this._tooltip;
    }

    set tooltip(x)
    {
        if (x === this._tooltip)
            return;


        this._tooltip = x;
        this._updateElementTitleAndText();
    }

    get hideTooltip ()
    {
        return this._hideTooltip;
    }

    set hideTooltip(hide)
    {
        this._hideTooltip = hide;
        this._updateElementTitleAndText();
    }

    get previousSibling() { return this._previousSibling; }
    set previousSibling(newSlibling) { this._previousSibling = newSlibling || null; }
    get nextSibling() { return this._nextSibling; }
    set nextSibling(newSlibling) { this._nextSibling = newSlibling || null; }

    // Private

    _updateElementTitleAndText()
    {
        let truncatedDisplayName = this._displayName;
        if (this._truncatedDisplayNameLength && truncatedDisplayName.length > this._truncatedDisplayNameLength)
            truncatedDisplayName = truncatedDisplayName.substring(0, this._truncatedDisplayNameLength) + ellipsis;

        this._titleContentElement.textContent = truncatedDisplayName;

        if (this.hideTooltip)
            this._element.title = "";
        else
            this._element.title = this._tooltip;
    }

    _updateSelectElement()
    {
        this._selectElement.removeChildren();

        function createOption(component)
        {
            let optionElement = document.createElement("option");
            let maxPopupMenuLength = 130; // <rdar://problem/13445374> <select> with very long option has clipped text and popup menu is still very wide
            optionElement.textContent = component.displayName.length <= maxPopupMenuLength ? component.displayName : component.displayName.substring(0, maxPopupMenuLength) + ellipsis;
            optionElement._pathComponent = component;
            return optionElement;
        }

        let previousSiblingCount = 0;
        let sibling = this.previousSibling;
        while (sibling) {
            this._selectElement.insertBefore(createOption(sibling), this._selectElement.firstChild);
            sibling = sibling.previousSibling;
            ++previousSiblingCount;
        }

        this._selectElement.appendChild(createOption(this));

        sibling = this.nextSibling;
        while (sibling) {
            this._selectElement.appendChild(createOption(sibling));
            sibling = sibling.nextSibling;
        }

        this._selectElement.selectedIndex = previousSiblingCount;
    }

    _selectElementMouseOver(event)
    {
        if (typeof this.mouseOver === "function")
            this.mouseOver();
    }

    _selectElementMouseOut(event)
    {
        if (typeof this.mouseOut === "function")
            this.mouseOut();
    }

    _selectElementMouseDown(event)
    {
        this._updateSelectElement();

        if (this._selectElement.options.length === 1) {
            event.preventDefault();

            this._selectElementSelectionChanged();
        }
    }

    _selectElementMouseUp(event)
    {
        this.dispatchEventToListeners(WI.HierarchicalPathComponent.Event.Clicked, {pathComponent: this.selectedPathComponent});
    }

    _selectElementSelectionChanged(event)
    {
        this.dispatchEventToListeners(WI.HierarchicalPathComponent.Event.SiblingWasSelected, {pathComponent: this.selectedPathComponent});
    }
};

WI.HierarchicalPathComponent.MinimumWidth = 32;
WI.HierarchicalPathComponent.MinimumWidthCollapsed = 24;
WI.HierarchicalPathComponent.MinimumWidthForOneCharacterTruncatedTitle = 54;
WI.HierarchicalPathComponent.SelectorArrowsWidth = 12;

WI.HierarchicalPathComponent.Event = {
    SiblingWasSelected: "hierarchical-path-component-sibling-was-selected",
    Clicked: "hierarchical-path-component-clicked"
};
