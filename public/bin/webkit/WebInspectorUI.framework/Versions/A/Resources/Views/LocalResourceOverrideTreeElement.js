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

WI.LocalResourceOverrideTreeElement = class LocalResourceOverrideTreeElement extends WI.ResourceTreeElement
{
    constructor(localResourceOverride, options)
    {
        console.assert(localResourceOverride instanceof WI.LocalResourceOverride, localResourceOverride);

        super(localResourceOverride.localResource, localResourceOverride, options);

        this._localResourceOverride = localResourceOverride;

        this._popover = null;
    }

    // Protected

    get mainTitleText()
    {
        return this.representedObject.displayName;
    }

    onattach()
    {
        super.onattach();

        this._localResourceOverride.addEventListener(WI.LocalResourceOverride.Event.DisabledChanged, this._handleLocalResourceOverrideDisabledChanged, this);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);

        this._updateStatusCheckbox();
    }

    ondetach()
    {
        this._localResourceOverride.removeEventListener(WI.LocalResourceOverride.Event.DisabledChanged, this._handleLocalResourceOverrideDisabledChanged, this);

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._handleFrameMainResourceDidChange, this);

        super.ondetach();
    }

    ondelete()
    {
        WI.networkManager.removeLocalResourceOverride(this._localResourceOverride);

        return true;
    }

    onspace()
    {
        this._localResourceOverride.disabled = !this._localResourceOverride.disabled;

        return true;
    }

    canSelectOnMouseDown(event)
    {
        if (this.status.contains(event.target))
            return false;

        return super.canSelectOnMouseDown(event);
    }

    populateContextMenu(contextMenu, event)
    {
        contextMenu.__localOverrideItemsAdded = true;

        contextMenu.appendItem(WI.UIString("Edit Local Override\u2026"), (event) => {
            let popover = new WI.LocalResourceOverridePopover(this);
            popover.show(this._localResourceOverride, this.status, [WI.RectEdge.MAX_X, WI.RectEdge.MIN_X]);
        });

        let toggleEnabledString = this._localResourceOverride.disabled ? WI.UIString("Enable Local Override") : WI.UIString("Disable Local Override");
        contextMenu.appendItem(toggleEnabledString, () => {
            this._localResourceOverride.disabled = !this._localResourceOverride.disabled;
        });

        contextMenu.appendItem(WI.UIString("Delete Local Override"), () => {
            WI.networkManager.removeLocalResourceOverride(this._localResourceOverride);
        });

        super.populateContextMenu(contextMenu, event);
    }

    updateStatus()
    {
        // Don't call `super` as we don't want `WI.ResourceTreeElement` / `WI.SourceCodeTreeElement` / etc. to modify our status element.

        if (this.resource?.hadLoadingError())
            this.addClassName(WI.ResourceTreeElement.FailedStyleClassName);
        else
            this.removeClassName(WI.ResourceTreeElement.FailedStyleClassName);
    }

    // Popover delegate

    willDismissPopover(popover)
    {
        let serializedData = popover.serializedData;
        if (!serializedData)
            return;

        // Do not conflict with an existing override unless we are modifying ourselves.
        if (WI.networkManager.localResourceOverrides.some((existingOverride) => existingOverride !== this._localResourceOverride && existingOverride.equals(this._localResourceOverride))) {
            InspectorFrontendHost.beep();
            return;
        }

        let wasSelected = this.selected;

        if (serializedData.type === WI.LocalResourceOverride.InterceptType.Response || serializedData.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork) {
            let revision = this._localResourceOverride.localResource.currentRevision;
            serializedData.responseContent = revision.content;
            serializedData.responseBase64Encoded = revision.base64Encoded;
        }

        let newLocalResourceOverride = WI.LocalResourceOverride.create(serializedData.url, serializedData.type, serializedData);
        WI.networkManager.removeLocalResourceOverride(this._localResourceOverride);
        WI.networkManager.addLocalResourceOverride(newLocalResourceOverride);

        if (wasSelected)
            WI.showLocalResourceOverride(newLocalResourceOverride, {overriddenResource: this._localResourceOverride});
    }

    // Private

    _updateStatusCheckbox()
    {
        this.status = document.createElement("input");
        this.status.type = "checkbox";
        this.status.checked = !this._localResourceOverride.disabled;
        this.status.addEventListener("change", (event) => {
            this._localResourceOverride.disabled = !event.target.checked;
        });
    }

    _handleLocalResourceOverrideDisabledChanged(event)
    {
        this.status.checked = !this._localResourceOverride.disabled;
    }

    _handleFrameMainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this._updateTitles();
    }
};
