/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.AppController = class AppController extends WI.AppControllerBase
{
    constructor()
    {
        super();

        this._debuggableType = WI.DebuggableType.fromString(InspectorFrontendHost.debuggableInfo.debuggableType);
        console.assert(this._debuggableType);
        if (!this._debuggableType)
            this._debuggableType = WI.DebuggableType.JavaScript;
    }

    // Properties.

    get debuggableType() { return this._debuggableType; }

    // API.

    activateExtraDomains(domains)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(this._debuggableType === WI.DebuggableType.JavaScript);
        console.assert(WI.targets.length === 1);

        let target = WI.mainTarget;
        console.assert(target instanceof WI.DirectBackendTarget);
        console.assert(target.type === WI.TargetType.JavaScript);

        if (this._debuggableType === WI.DebuggableType.ITML || target.type === WI.TargetType.ITML)
            throw new Error("Extra domains have already been activated, cannot activate again.");

        this._debuggableType = WI.DebuggableType.ITML;
        target._type = WI.TargetType.ITML;

        for (let domain of domains) {
            InspectorBackend.activateDomain(domain);

            target.activateExtraDomain(domain);

            let manager = WI.managers.find((manager) => manager.domains && manager.domains.includes(domain));
            if (manager)
                manager.activateExtraDomain(domain);
            else if (target.hasCommand(domain + ".enable"))
                target._agents[domain].enable();
        }

        // FIXME: all code within WI.activateExtraDomains should be distributed elsewhere.
        WI.activateExtraDomains(domains);
    }
};
