/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.BannerView = class BannerView extends WI.View
{
    constructor(message, {actionButtonMessage, showDismissButton} = {})
    {
        super();

        this.element.classList.add("banner-view");
        this.element.appendChild(document.createTextNode(message));

        if (actionButtonMessage) {
            let actionButtonElement = this.element.appendChild(document.createElement("button"));
            actionButtonElement.textContent = actionButtonMessage;
            actionButtonElement.addEventListener("click", this._handleActionButtonClicked.bind(this));
        }

        if (showDismissButton) {
            let dismissButtonElement = this.element.appendChild(WI.ImageUtilities.useSVGSymbol("Images/Close.svg", "dismiss", WI.UIString("Dismiss", "Dismiss @ Banner View", "Tooltip for the dismiss button in banner views.")));
            dismissButtonElement.addEventListener("click", this._handleDismissButtonClicked.bind(this));
        }
    }

    // Private

    _handleActionButtonClicked(event)
    {
        this.dispatchEventToListeners(WI.BannerView.Event.ActionButtonClicked);
    }

    _handleDismissButtonClicked(event)
    {
        this.dispatchEventToListeners(WI.BannerView.Event.DismissButtonClicked);
    }
};

WI.BannerView.Event = {
    ActionButtonClicked: "banner-view-action-button-clicked",
    DismissButtonClicked: "banner-view-dismiss-button-clicked",
};
