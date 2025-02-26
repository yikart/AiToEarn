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

WI.NetworkDOMNodeDetailView = class NetworkDOMNodeDetailView extends WI.NetworkDetailView
{
    constructor(domNode, delegate)
    {
        console.assert(domNode instanceof WI.DOMNode);

        super(domNode, delegate);

        this.element.classList.add("dom-node");

        this._domEventsContentView = null;
    }

    // Protected

    initialLayout()
    {
        this.createDetailNavigationItem("dom-events", WI.UIString("DOM Events"));

        super.initialLayout();
    }

    // Private

    showContentViewForIdentifier(identifier)
    {
        super.showContentViewForIdentifier(identifier);

        switch (identifier) {
        case "dom-events":
            if (!this._domEventsContentView) {
                this._domEventsContentView = new WI.DOMNodeEventsContentView(this.representedObject);
            }
            this._contentBrowser.showContentView(this._domEventsContentView, this._contentViewCookie);
            break;
        }
    }
};
