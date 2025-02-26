/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
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

WI.InspectorObserver = class InspectorObserver extends InspectorBackend.Dispatcher
{
    // Events defined by the "Inspector" domain.

    evaluateForTestInFrontend(script)
    {
        if (!InspectorFrontendHost.isUnderTest())
            return;

        InspectorBackend.runAfterPendingDispatches(function() {
            window.eval(script);
        });
    }

    inspect(payload, hints)
    {
        let remoteObject = WI.RemoteObject.fromPayload(payload, WI.mainTarget);
        if (remoteObject.subtype === "node") {
            WI.domManager.inspectNodeObject(remoteObject);
            return;
        }

        if (remoteObject.type === "function") {
            remoteObject.findFunctionSourceCodeLocation().then((sourceCodeLocation) => {
                if (sourceCodeLocation instanceof WI.SourceCodeLocation) {
                    WI.showSourceCodeLocation(sourceCodeLocation, {
                        ignoreNetworkTab: true,
                        ignoreSearchTab: true,
                    });
                }
            });
            remoteObject.release();
            return;
        }

        if (hints.databaseId)
            WI.databaseManager.inspectDatabase(hints.databaseId);
        else if (hints.domStorageId)
            WI.domStorageManager.inspectDOMStorage(hints.domStorageId);

        remoteObject.release();
    }

    activateExtraDomains(domains)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        WI.sharedApp.activateExtraDomains(domains);
    }
};
