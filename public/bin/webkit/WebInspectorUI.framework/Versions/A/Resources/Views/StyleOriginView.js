/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.StyleOriginView = class StyleOriginView
{
    constructor()
    {
        this.element = document.createElement("span");
        this.element.className = "origin";
    }

    // Public

    update(style)
    {
        this.element.removeChildren();
        this.element.removeAttribute("title");

        switch (style.type) {
        case WI.CSSStyleDeclaration.Type.Rule:
            console.assert(style.ownerRule);

            if (style.ownerRule.sourceCodeLocation) {
                let options = {
                    dontFloat: true,
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                };

                if (style.ownerStyleSheet?.isInspectorStyleSheet()) {
                    options.nameStyle = WI.SourceCodeLocation.NameStyle.None;
                    options.prefix = WI.UIString("Inspector Style Sheet") + ":";
                }

                let sourceCodeLink = WI.createSourceCodeLocationLink(style.ownerRule.sourceCodeLocation, options);
                this.element.appendChild(sourceCodeLink);
            } else {
                let originString = "";

                switch (style.ownerRule.type) {
                case WI.CSSStyleSheet.Type.Author:
                    originString = WI.UIString("Author Style Sheet");
                    break;

                case WI.CSSStyleSheet.Type.User:
                    originString = WI.UIString("User Style Sheet");
                    break;

                case WI.CSSStyleSheet.Type.UserAgent:
                    originString = WI.UIString("User Agent Style Sheet");
                    break;

                case WI.CSSStyleSheet.Type.Inspector:
                    originString = WI.UIString("Web Inspector");
                    break;
                }

                console.assert(originString);
                if (originString)
                    this.element.append(originString);

                if (!style.editable) {
                    let styleTitle = "";
                    if (style.ownerRule && style.ownerRule.type === WI.CSSStyleSheet.Type.UserAgent)
                        styleTitle = WI.UIString("User Agent Style Sheet");
                    else
                        styleTitle = WI.UIString("Style rule");

                    this.element.title = WI.UIString("%s cannot be modified").format(styleTitle);
                }
            }
            break;

        case WI.CSSStyleDeclaration.Type.Attribute:
            this.element.append(WI.UIString("HTML Attributes"));
            break;
        }
    }
};
