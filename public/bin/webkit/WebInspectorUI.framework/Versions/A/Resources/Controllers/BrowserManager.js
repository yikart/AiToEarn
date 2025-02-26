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

WI.BrowserManager = class BrowserManager
{
    constructor()
    {
        this._enabled = false;
        this._extensionNameIdentifierMap = new Map;
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        // COMPATIBILITY (iOS 13.4): Browser did not exist yet.
        if (target.hasDomain("Browser"))
            target.BrowserAgent.enable();
    }

    // Public

    enable()
    {
        console.assert(!this._enabled);

        this._enabled = true;

        for (let target of WI.targetManager.allTargets)
            this.initializeTarget(target);
    }

    disable()
    {
        console.assert(this._enabled);

        for (let target of WI.targetManager.allTargets) {
            // COMPATIBILITY (iOS 13.4): Browser did not exist yet.
            if (target.hasDomain("Browser"))
                target.BrowserAgent.disable();
        }

        this._extensionNameIdentifierMap.clear();

        this._enabled = false;
    }

    isExtensionScheme(scheme)
    {
        return scheme && scheme.endsWith("-extension");
    }

    extensionNameForId(extensionId)
    {
        return this._extensionNameIdentifierMap.get(extensionId) || null;
    }

    extensionNameForURL(url)
    {
        console.assert(this.isExtensionScheme(parseURL(url).scheme));

        let match = url.match(/^[a-z\-]*extension:\/\/([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})\//);
        if (!match)
            return null;

        return this.extensionNameForId(match[1]);
    }

    extensionNameForExecutionContext(context)
    {
        console.assert(context instanceof WI.ExecutionContext);
        console.assert(context.type === WI.ExecutionContext.Type.User);

        let match = context.name.match(/^[A-Za-z]*ExtensionWorld-([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})$/);
        if (!match)
            return null;

        return this.extensionNameForId(match[1]);
    }

    // BrowserObserver

    extensionsEnabled(extensions)
    {
        for (let {extensionId, name} of extensions) {
            console.assert(!this._extensionNameIdentifierMap.has(extensionId), `Extension already exists with id '${extensionId}'.`);

            this._extensionNameIdentifierMap.set(extensionId, name);
        }
    }

    extensionsDisabled(extensionIds)
    {
        for (let extensionId of extensionIds) {
            let name = this._extensionNameIdentifierMap.take(extensionId);
            console.assert(name, `Missing extension with id '${extensionId}'.`);
        }
    }
};
