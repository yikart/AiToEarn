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

WI.ExpandableView = class ExpandableView
{
    constructor(key, titleElement, childElement)
    {
        this._element = document.createElement("div");

        if (childElement) {
            this._disclosureButton = this._element.createChild("button", "disclosure-button");
            this._disclosureButton.addEventListener("click", this._onDisclosureButtonClick.bind(this));
            this._disclosureButton.addEventListener("keydown", this._handleDisclosureButtonKeyDown.bind(this));
        }

        this._element.append(titleElement);
        this._expandedSetting = new WI.Setting("expanded-" + key, false);

        if (childElement)
            this._element.append(childElement);

        this._update();
    }

    // Public

    get element()
    {
        return this._element;
    }

    // Private

    _onDisclosureButtonClick(event)
    {
        this._expandedSetting.value = !this._expandedSetting.value;
        this._update();
    }

    _handleDisclosureButtonKeyDown(event)
    {
        if (event.code !== "ArrowRight" && event.code !== "ArrowLeft")
            return;

        event.preventDefault();

        let collapsed = event.code === "ArrowLeft";
        if (WI.resolveLayoutDirectionForElement(this._disclosureButton) === WI.LayoutDirection.RTL)
            collapsed = !collapsed;

        this._expandedSetting.value = !collapsed;
        this._update();
    }

    _update()
    {
        let isExpanded = this._expandedSetting.value;
        this._element.classList.toggle("expanded", isExpanded);
        this._disclosureButton?.setAttribute("aria-expanded", isExpanded);
    }
};
