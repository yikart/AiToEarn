/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

// FIXME: HeapManager lacks advanced multi-target support. (Instruments/Profilers per-target)

WI.HeapManager = class HeapManager extends WI.Object
{
    constructor()
    {
        super();

        this._enabled = false;
    }

    // Agent

    get domains() { return ["Heap"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "Heap");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        if (target.hasDomain("Heap"))
            target.HeapAgent.enable();
    }

    // Public

    enable()
    {
        if (this._enabled)
            return;

        this._enabled = true;

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    disable()
    {
        if (!this._enabled)
            return;

        for (let target of WI.targets) {
            if (target.hasDomain("Heap"))
                target.HeapAgent.disable();
        }

        this._enabled = false;
    }

    snapshot(callback)
    {
        console.assert(this._enabled);

        let target = WI.assumingMainTarget();
        target.HeapAgent.snapshot((error, timestamp, snapshotStringData) => {
            if (error)
                console.error(error);
            callback(error, timestamp, snapshotStringData);
        });
    }

    getPreview(node, callback)
    {
        console.assert(this._enabled);
        console.assert(node instanceof WI.HeapSnapshotNodeProxy);

        let target = WI.assumingMainTarget();
        target.HeapAgent.getPreview(node.id, (error, string, functionDetails, preview) => {
            if (error)
                console.error(error);
            callback(error, string, functionDetails, preview);
        });
    }

    getRemoteObject(node, objectGroup, callback)
    {
        console.assert(this._enabled);
        console.assert(node instanceof WI.HeapSnapshotNodeProxy);

        let target = WI.assumingMainTarget();
        target.HeapAgent.getRemoteObject(node.id, objectGroup, (error, result) => {
            if (error)
                console.error(error);
            callback(error, result);
        });
    }

    // HeapObserver

    garbageCollected(target, payload)
    {
        if (!this._enabled)
            return;

        // FIXME: <https://webkit.org/b/167323> Web Inspector: Enable Memory profiling in Workers
        if (target !== WI.mainTarget)
            return;

        let collection = WI.GarbageCollection.fromPayload(payload);
        this.dispatchEventToListeners(WI.HeapManager.Event.GarbageCollected, {collection});
    }
};

WI.HeapManager.Event = {
    GarbageCollected: "heap-manager-garbage-collected"
};
