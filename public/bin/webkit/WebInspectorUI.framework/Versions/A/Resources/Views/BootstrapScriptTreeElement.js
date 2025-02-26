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

WI.BootstrapScriptTreeElement = class BootstrapScriptTreeElement extends WI.ScriptTreeElement
{
    constructor(bootstrapScript)
    {
        console.assert(bootstrapScript === WI.networkManager.bootstrapScript);

        super(bootstrapScript);

        this.addClassName("bootstrap");
    }

    // Protected

    onattach()
    {
        super.onattach();

        WI.NetworkManager.addEventListener(WI.NetworkManager.Event.BootstrapScriptEnabledChanged, this._handleNetworkManagerBootstrapScriptEnabledChanged, this);

        this.status = document.createElement("input");
        this.status.type = "checkbox";
        this.status.checked = WI.networkManager.bootstrapScriptEnabled;
        this.status.addEventListener("change", (event) => {
            WI.networkManager.bootstrapScriptEnabled = event.target.checked;
        });
    }

    ondetach()
    {
        WI.NetworkManager.removeEventListener(WI.NetworkManager.Event.BootstrapScriptEnabledChanged, this._handleNetworkManagerBootstrapScriptEnabledChanged, this);

        super.ondetach();
    }

    ondelete()
    {
        WI.networkManager.destroyBootstrapScript();

        return true;
    }

    onspace()
    {
        WI.networkManager.bootstrapScriptEnabled = !WI.networkManager.bootstrapScriptEnabled;

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
        let toggleEnabledString = WI.networkManager.bootstrapScriptEnabled ? WI.UIString("Disable Inspector Bootstrap Script") : WI.UIString("Enable Inspector Bootstrap Script");
        contextMenu.appendItem(toggleEnabledString, () => {
            WI.networkManager.bootstrapScriptEnabled = !WI.networkManager.bootstrapScriptEnabled;
        });

        contextMenu.appendItem(WI.UIString("Delete Inspector Bootstrap Script"), () => {
            WI.networkManager.destroyBootstrapScript();
        });

        super.populateContextMenu(contextMenu, event);
    }

    updateStatus()
    {
        // Do nothing. Do not allow ScriptTreeElement / SourceCodeTreeElement to modify our status element.
    }

    // Private

    _handleNetworkManagerBootstrapScriptEnabledChanged(event)
    {
        this.status.checked = WI.networkManager.bootstrapScriptEnabled;
    }
};
