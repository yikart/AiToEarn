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

// FIXME: AnimationManager lacks advanced multi-target support. (Animations per-target)

WI.AnimationManager = class AnimationManager
{
    constructor()
    {
        this._enabled = false;
        this._animationCollection = new WI.AnimationCollection;
        this._animationIdMap = new Map;

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleMainResourceDidChange, this);
    }

    // Agent

    get domains() { return ["Animation"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "Animation");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        // COMPATIBILITY (iOS 13.1): Animation.enable did not exist yet.
        if (target.hasCommand("Animation.enable"))
            target.AnimationAgent.enable();
    }

    // Public

    get animationCollection() { return this._animationCollection; }

    get supported()
    {
        // COMPATIBILITY (iOS 13.1): Animation.enable did not exist yet.
        return InspectorBackend.hasCommand("Animation.enable");
    }

    enable()
    {
        console.assert(!this._enabled);

        this._enabled = true;

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    disable()
    {
        console.assert(this._enabled);

        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 13.1): Animation.disable did not exist yet.
            if (target.hasCommand("Animation.disable"))
                target.AnimationAgent.disable();
        }

        this._animationCollection.clear();
        this._animationIdMap.clear();

        this._enabled = false;
    }

    // AnimationObserver

    animationCreated(animationPayload)
    {
        console.assert(!this._animationIdMap.has(animationPayload.animationId), `Animation already exists with id ${animationPayload.animationId}.`);

        let animation = WI.Animation.fromPayload(animationPayload);
        this._animationCollection.add(animation);
        this._animationIdMap.set(animation.animationId, animation);
    }

    nameChanged(animationId, name)
    {
        let animation = this._animationIdMap.get(animationId);
        console.assert(animation);
        if (!animation)
            return;

        animation.nameChanged(name);
    }

    effectChanged(animationId, effect)
    {
        let animation = this._animationIdMap.get(animationId);
        console.assert(animation);
        if (!animation)
            return;

        animation.effectChanged(effect);
    }

    targetChanged(animationId, effect)
    {
        let animation = this._animationIdMap.get(animationId);
        console.assert(animation);
        if (!animation)
            return;

        animation.targetChanged(effect);
    }

    animationDestroyed(animationId)
    {
        let animation = this._animationIdMap.take(animationId);
        console.assert(animation);
        if (!animation)
            return;

        this._animationCollection.remove(animation);
    }

    // Private

    _handleMainResourceDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);
        if (!event.target.isMainFrame())
            return;

        WI.Animation.resetUniqueDisplayNameNumbers();

        this._animationCollection.clear();
        this._animationIdMap.clear();
    }
};
