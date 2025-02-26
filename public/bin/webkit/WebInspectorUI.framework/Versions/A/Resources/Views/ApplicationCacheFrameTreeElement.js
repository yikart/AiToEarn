/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ApplicationCacheFrameTreeElement = class ApplicationCacheFrameTreeElement extends WI.GeneralTreeElement
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.ApplicationCacheFrame);

        const title = null;
        const subtitle = null;
        super("application-cache-frame", title, subtitle, representedObject);

        this.updateTitles();
    }

    updateTitles()
    {
        var url = this.representedObject.frame.url;
        var parsedURL = parseURL(url);

        this.mainTitle = WI.displayNameForURL(url, parsedURL);

        // Show the host as the subtitle only if it doesn't match the subtitle of the manifest tree element,
        // and it doesn't match the mainTitle.
        var subtitle = WI.displayNameForHost(parsedURL.host);

        var manifestTreeElement = null;
        var currentAncestor = this.parent;
        while (currentAncestor && !currentAncestor.root) {
            if (currentAncestor instanceof WI.ApplicationCacheManifestTreeElement) {
                manifestTreeElement = currentAncestor;
                break;
            }

            currentAncestor = currentAncestor.parent;
        }

        var subtitleIsDuplicate = subtitle === this._mainTitle || (manifestTreeElement && manifestTreeElement.subtitle === subtitle);
        this.subtitle = subtitleIsDuplicate ? null : subtitle;
    }
};
