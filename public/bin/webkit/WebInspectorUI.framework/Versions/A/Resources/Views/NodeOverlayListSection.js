/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.NodeOverlayListSection = class NodeOverlayListSection extends WI.View
{
    constructor(id, label)
    {
        super();

        this._label = label;

        this.element.classList.add("node-overlay-list-section", id);

        this._nodeSet = new Set;
        this._checkboxElementByNodeMap = new WeakMap;
    }

    // Public

    set nodeSet(value)
    {
        this._nodeSet = value;
        this.needsLayout();
    }

    // Protected

    attached()
    {
        super.attached();

        WI.DOMNode.addEventListener(WI.DOMNode.Event.LayoutOverlayShown, this._handleOverlayStateChanged, this);
        WI.DOMNode.addEventListener(WI.DOMNode.Event.LayoutOverlayHidden, this._handleOverlayStateChanged, this);
    }

    detached()
    {
        WI.DOMNode.removeEventListener(WI.DOMNode.Event.LayoutOverlayShown, this._handleOverlayStateChanged, this);
        WI.DOMNode.removeEventListener(WI.DOMNode.Event.LayoutOverlayHidden, this._handleOverlayStateChanged, this);

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        let listHeading = this.element.appendChild(document.createElement("h2"));
        listHeading.textContent = this._label;

        let optionsElement = listHeading.appendChild(WI.ImageUtilities.useSVGSymbol("Images/Gear.svg", "options", WI.UIString("Options")));
        WI.addMouseDownContextMenuHandlers(optionsElement, (contextMenu) => {
            let shouldDisable = this._nodeSet.some((domNode) => domNode.layoutOverlayShowing);
            contextMenu.appendItem(shouldDisable ? WI.UIString("Disable All") : WI.UIString("Enable All"), () => {
                for (let node of this._nodeSet) {
                    if (shouldDisable)
                        node.hideLayoutOverlay();
                    else
                        node.showLayoutOverlay();
                }
            });
        });

        this._listElement = this.element.appendChild(document.createElement("ul"));
        this._listElement.classList.add("node-overlay-list");
    }


    layout()
    {
        super.layout();

        this._listElement.removeChildren();

        for (let domNode of this._nodeSet) {
            let itemElement = this._listElement.appendChild(document.createElement("li"));
            let itemContainerElement = itemElement.appendChild(document.createElement("span"));
            itemContainerElement.classList.add("node-overlay-list-item-container");

            let labelElement = itemContainerElement.appendChild(document.createElement("label"));
            let nodeDisplayName = labelElement.appendChild(WI.linkifyNodeReference(domNode, {ignoreClick: true}));
            nodeDisplayName.classList.add("node-display-name");

            let checkboxElement = labelElement.appendChild(document.createElement("input"));
            labelElement.insertBefore(checkboxElement, nodeDisplayName);
            checkboxElement.type = "checkbox";
            checkboxElement.checked = domNode.layoutOverlayShowing;

            this._checkboxElementByNodeMap.set(domNode, checkboxElement);

            checkboxElement.addEventListener("change", (event) => {
                if (checkboxElement.checked)
                    domNode.showLayoutOverlay({color: swatch?.value});
                else
                    domNode.hideLayoutOverlay();
            });

            let swatch = new WI.InlineSwatch(WI.InlineSwatch.Type.Color, domNode.layoutOverlayColor, {preventChangingColorFormats: true});
            itemContainerElement.append(swatch.element);

            swatch.addEventListener(WI.InlineSwatch.Event.ValueChanged, (event) => {
                domNode.layoutOverlayColor = event.target.value;
            }, swatch);

            let buttonElement = itemContainerElement.appendChild(WI.createGoToArrowButton());
            buttonElement.title = WI.repeatedUIString.revealInDOMTree();
            WI.bindInteractionsForNodeToElement(domNode, buttonElement);
        }
    }

    // Private

    _handleOverlayStateChanged(event)
    {
        let checkboxElement = this._checkboxElementByNodeMap.get(event.target);
        if (!checkboxElement)
            return;

        checkboxElement.checked = event.target.layoutOverlayShowing;
    }
};
