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

WI.CSSDocumentationPopover = class CSSDocumentationPopover extends WI.Popover
{
    constructor(cssProperty, delegate)
    {
        console.assert(cssProperty instanceof WI.CSSProperty, cssProperty);

        super(delegate);

        this._cssProperty = cssProperty;
        this._targetElement = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    // Public

    show(targetElement)
    {
        this._targetElement = targetElement;
        let documentationDetails = this._getDocumentationDetails(this._cssProperty);
        let documentationElement = this._createDocumentationElement(documentationDetails);
        this.content = documentationElement;
        this._presentOverTargetElement();
    }


    // Private

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame.pad(2), [WI.RectEdge.MIN_X, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_Y]);
    }


    _getDocumentationDetails(property)
    {
        let propertyName = "";

        if (property.canonicalName in CSSDocumentation)
            propertyName = property.canonicalName;
        else if (property.name in CSSDocumentation)
            propertyName = property.name;

        let propertyDocumentation = CSSDocumentation[propertyName];
        console.assert(propertyDocumentation, propertyName, CSSDocumentation);

        return {
            name: propertyName,
            description: propertyDocumentation.description,
            syntax: propertyDocumentation.syntax,
            url: propertyDocumentation.url,
        };
    }

    _createDocumentationElement(details)
    {
        let documentationElement = document.createElement("div");
        documentationElement.className = "documentation-popover-content";

        let nameElement = documentationElement.appendChild(document.createElement("p"));
        nameElement.className = "name-header";
        nameElement.textContent = details.name;

        let descriptionElement = documentationElement.appendChild(document.createElement("p"));
        descriptionElement.textContent = details.description;

        if (details.syntax && WI.settings.showCSSPropertySyntaxInDocumentationPopover.value) {
            let syntaxElement = documentationElement.appendChild(document.createElement("p"));
            syntaxElement.className = "syntax";

            let syntaxTitleElement = syntaxElement.appendChild(document.createElement("span"));
            syntaxTitleElement.className = "syntax-title";
            syntaxTitleElement.textContent = details.name;

            let syntaxBodyElement = syntaxElement.appendChild(document.createElement("span"));
            syntaxBodyElement.textContent = `: ${details.syntax}`;
        }

        if (details.url) {
            let referenceLinkElement = documentationElement.appendChild(document.createElement("a"));
            referenceLinkElement.className = "reference-link";
            referenceLinkElement.textContent = WI.unlocalizedString("MDN Reference");
            referenceLinkElement.href = details.url;
        }

        return documentationElement;
    }
};
