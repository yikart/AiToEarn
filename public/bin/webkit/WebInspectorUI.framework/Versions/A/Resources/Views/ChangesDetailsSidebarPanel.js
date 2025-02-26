/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.ChangesDetailsSidebarPanel = class ChangesDetailsSidebarPanel extends WI.DOMDetailsSidebarPanel
{
    constructor()
    {
        super("changes-details", WI.UIString("Changes"));

        this.element.classList.add("changes-panel");
        this.element.dir = "ltr";
    }

    // Public

    supportsDOMNode(nodeToInspect)
    {
        return nodeToInspect.nodeType() === Node.ELEMENT_NODE;
    }

    attached()
    {
        super.attached();

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.CSSManager.addEventListener(WI.CSSManager.Event.ModifiedStylesChanged, this.needsLayout, this);
    }

    detached()
    {
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.CSSManager.removeEventListener(WI.CSSManager.Event.ModifiedStylesChanged, this.needsLayout, this);

        super.detached();
    }

    // Protected

    layout()
    {
        super.layout();

        this.element.removeChildren();

        let modifiedStyles = WI.cssManager.modifiedStyles;

        if (WI.settings.cssChangesPerNode.value) {
            if (this.domNode) {
                let stylesForNode = WI.cssManager.stylesForNode(this.domNode);
                modifiedStyles = modifiedStyles.filter((style) => {
                    if (style.node === this.domNode)
                        return true;

                    if (style.ownerRule)
                        return stylesForNode.matchedRules.some((matchedRule) => style.ownerRule.isEqualTo(matchedRule));

                    return false;
                });
            } else
                modifiedStyles = [];
        }

        this.element.classList.toggle("empty", !modifiedStyles.length);
        if (!modifiedStyles.length) {
            this.element.textContent = WI.UIString("No CSS Changes");
            return;
        }

        let declarationsForStyleSheet = new Map();
        for (let style of modifiedStyles) {
            let styleDeclarations = declarationsForStyleSheet.get(style.ownerStyleSheet);
            if (!styleDeclarations) {
                styleDeclarations = [];
                declarationsForStyleSheet.set(style.ownerStyleSheet, styleDeclarations);
            }
            styleDeclarations.push(style);
        }

        for (let [styleSheet, styles] of declarationsForStyleSheet) {
            let resourceSection = this.element.appendChild(document.createElement("section"));
            resourceSection.classList.add("resource-section");

            let resourceHeader = resourceSection.appendChild(document.createElement("div"));
            resourceHeader.classList.add("header");
            resourceHeader.append(styleSheet.isInlineStyleAttributeStyleSheet() ? styles[0].selectorText : this._createLocationLink(styleSheet));

            for (let style of styles)
                resourceSection.append(this._createRuleElement(style));
        }
    }

    // Private

    _createRuleElement(style)
    {
        let ruleElement = document.createElement("div");
        ruleElement.classList.add("css-rule");

        let selectorLineElement = ruleElement.appendChild(document.createElement("div"));
        selectorLineElement.className = "selector-line";

        let selectorElement = selectorLineElement.appendChild(document.createElement("span"));
        selectorElement.className = "selector";

        if (style.type === WI.CSSStyleDeclaration.Type.Inline) {
            selectorElement.textContent = WI.UIString("Style Attribute");
            selectorElement.classList.add("style-attribute");
        } else
            selectorElement.textContent = style.ownerRule.selectorText;

        selectorLineElement.append(" {\n");

        function onEach(cssProperty, action) {
            let className = "";
            if (action === 1)
                className = "added";
            else if (action === -1)
                className = "removed";
            else
                className = "unchanged";

            let propertyLineElement = ruleElement.appendChild(document.createElement("div"));
            propertyLineElement.classList.add("css-property-line", className);

            const delegate = null;
            let stylePropertyView = new WI.SpreadsheetStyleProperty(delegate, cssProperty, {readOnly: true, hideDocumentation: true});
            propertyLineElement.append(WI.indentString(), stylePropertyView.element, "\n");
        }

        function comparator(a, b) {
            return a.equals(b);
        }

        Array.diffArrays(style.initialState.visibleProperties, style.visibleProperties, onEach, comparator);

        let closeBraceElement = document.createElement("span");
        closeBraceElement.className = "close-brace";
        closeBraceElement.textContent = "}";

        ruleElement.append(closeBraceElement, "\n");
        return ruleElement;
    }

    _createLocationLink(styleSheet)
    {
        const options = {
            nameStyle: WI.SourceCodeLocation.NameStyle.Short,
            columnStyle: WI.SourceCodeLocation.ColumnStyle.Hidden,
            dontFloat: true,
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };

        const lineNumber = 0;
        const columnNumber = 0;
        let sourceCodeLocation = styleSheet.createSourceCodeLocation(lineNumber, columnNumber);
        return WI.createSourceCodeLocationLink(sourceCodeLocation, options);
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this.needsLayout();
    }
};
