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

WI.Animation = class Animation extends WI.Object
{
    constructor(animationId, {name, cssAnimationName, cssTransitionProperty, effect, stackTrace} = {})
    {
        super();

        console.assert(animationId);
        console.assert((!cssAnimationName && !cssTransitionProperty) || !!cssAnimationName !== !!cssTransitionProperty);
        console.assert(!stackTrace || stackTrace instanceof WI.StackTrace, stackTrace);

        this._animationId = animationId;

        this._name = name || null;
        this._cssAnimationName = cssAnimationName || null;
        this._cssTransitionProperty = cssTransitionProperty || null;
        this._updateEffect(effect);
        this._stackTrace = stackTrace || null;

        this._effectTarget = undefined;
        this._requestEffectTargetCallbacks = null;
    }

    // Static

    static fromPayload(payload)
    {
        // COMPATIBILITY (macOS 13.0, iOS 16.0): `backtrace` was renamed to `stackTrace`.
        if (payload.backtrace)
            payload.stackTrace = {callFrames: payload.backtrace};

        return new WI.Animation(payload.animationId, {
            name: payload.name,
            cssAnimationName: payload.cssAnimationName,
            cssTransitionProperty: payload.cssTransitionProperty,
            effect: payload.effect,
            stackTrace: WI.StackTrace.fromPayload(WI.assumingMainTarget(), payload.stackTrace),
        });
    }

    static displayNameForAnimationType(animationType, plural)
    {
        switch (animationType) {
        case WI.Animation.Type.WebAnimation:
            return plural ? WI.UIString("Web Animations") : WI.UIString("Web Animation");
        case WI.Animation.Type.CSSAnimation:
            return plural ? WI.UIString("CSS Animations") : WI.UIString("CSS Animation");
        case WI.Animation.Type.CSSTransition:
            return plural ? WI.UIString("CSS Transitions") : WI.UIString("CSS Transition");
        }

        console.assert(false, "Unknown animation type", animationType);
        return null;
    }

    static displayNameForPlaybackDirection(playbackDirection)
    {
        switch (playbackDirection) {
        case WI.Animation.PlaybackDirection.Normal:
            return WI.UIString("Normal", "Web Animation Playback Direction Normal", "Indicates that the playback direction of this web animation is normal (e.g. forwards)");
        case WI.Animation.PlaybackDirection.Reverse:
            return WI.UIString("Reverse", "Web Animation Playback Direction Reverse", "Indicates that the playback direction of this web animation is reversed (e.g. backwards)");
        case WI.Animation.PlaybackDirection.Alternate:
            return WI.UIString("Alternate", "Web Animation Playback Direction Alternate", "Indicates that the playback direction of this web animation alternates between normal and reversed on each iteration");
        case WI.Animation.PlaybackDirection.AlternateReverse:
            return WI.UIString("Alternate Reverse", "Web Animation Playback Direction Alternate Reverse", "Indicates that the playback direction of this web animation alternates between reversed and normal on each iteration");
        }

        console.assert(false, "Unknown playback direction", playbackDirection);
        return null;
    }

    static displayNameForFillMode(fillMode)
    {
        switch (fillMode) {
        case WI.Animation.FillMode.None:
            return WI.UIString("None", "Web Animation Fill Mode None", "Indicates that this web animation does not apply any styles before it begins and after it ends");
        case WI.Animation.FillMode.Forwards:
            return WI.UIString("Forwards", "Web Animation Fill Mode Forwards", "Indicates that this web animation also applies styles after it ends");
        case WI.Animation.FillMode.Backwards:
            return WI.UIString("Backwards", "Web Animation Fill Mode Backwards", "Indicates that this web animation also applies styles before it begins");
        case WI.Animation.FillMode.Both:
            return WI.UIString("Both", "Web Animation Fill Mode Both", "Indicates that this web animation also applies styles before it begins and after it ends");
        case WI.Animation.FillMode.Auto:
            return WI.UIString("Auto", "Web Animation Fill Mode Auto", "Indicates that this web animation either does not apply any styles before it begins and after it ends or that it applies to both, depending on it's configuration");
        }

        console.assert(false, "Unknown fill mode", fillMode);
        return null;
    }

    static resetUniqueDisplayNameNumbers()
    {
        WI.Animation._nextUniqueDisplayNameNumber = 1;
    }

    // Public

    get animationId() { return this._animationId; }
    get name() { return this._name; }
    get cssAnimationName() { return this._cssAnimationName; }
    get cssTransitionProperty() { return this._cssTransitionProperty; }
    get stackTrace() { return this._stackTrace; }

    get animationType()
    {
        if (this._cssAnimationName)
            return WI.Animation.Type.CSSAnimation;
        if (this._cssTransitionProperty)
            return WI.Animation.Type.CSSTransition;
        return WI.Animation.Type.WebAnimation;
    }

    get startDelay()
    {
        return "startDelay" in this._effect ? this._effect.startDelay : NaN;
    }

    get endDelay()
    {
        return "endDelay" in this._effect ? this._effect.endDelay : NaN;
    }

    get iterationCount()
    {
        return "iterationCount" in this._effect ? this._effect.iterationCount : NaN;
    }

    get iterationStart()
    {
        return "iterationStart" in this._effect ? this._effect.iterationStart : NaN;
    }

    get iterationDuration()
    {
        return "iterationDuration" in this._effect ? this._effect.iterationDuration : NaN;
    }

    get timingFunction()
    {
        return "timingFunction" in this._effect ? this._effect.timingFunction : null;
    }

    get playbackDirection()
    {
        return "playbackDirection" in this._effect ? this._effect.playbackDirection : null;
    }

    get fillMode()
    {
        return "fillMode" in this._effect ? this._effect.fillMode : null;
    }

    get keyframes()
    {
        return "keyframes" in this._effect ? this._effect.keyframes : [];
    }

    get displayName()
    {
        if (this._name)
            return this._name;

        if (this._cssAnimationName)
            return this._cssAnimationName;

        if (this._cssTransitionProperty)
            return this._cssTransitionProperty;

        if (!this._uniqueDisplayNameNumber)
            this._uniqueDisplayNameNumber = WI.Animation._nextUniqueDisplayNameNumber++;
        return WI.UIString("Animation %d").format(this._uniqueDisplayNameNumber);
    }

    requestEffectTarget(callback)
    {
        if (this._effectTarget !== undefined) {
            callback(this._effectTarget);
            return;
        }

        if (this._requestEffectTargetCallbacks) {
            this._requestEffectTargetCallbacks.push(callback);
            return;
        }

        this._requestEffectTargetCallbacks = [callback];

        WI.domManager.ensureDocument();

        let target = WI.assumingMainTarget();
        target.AnimationAgent.requestEffectTarget(this._animationId, (error, effectTarget) => {
            // COMPATIBILITY (macOS 12.3, iOS 15.4): nodeId was renamed to effectTarget and changed from DOM.NodeId to DOM.Styleable.
            if (!isNaN(effectTarget))
                effectTarget = {nodeId: effectTarget};

            this._effectTarget = !error ? WI.DOMStyleable.fromPayload(effectTarget) : null;

            for (let requestEffectTargetCallback of this._requestEffectTargetCallbacks)
                requestEffectTargetCallback(this._effectTarget);

            this._requestEffectTargetCallbacks = null;
        });
    }

    // AnimationManager

    nameChanged(name)
    {
        this._name = name || null;

        this.dispatchEventToListeners(WI.Animation.Event.NameChanged);
    }

    effectChanged(effect)
    {
        this._updateEffect(effect);
    }

    targetChanged()
    {
        this._effectTarget = undefined;

        this.dispatchEventToListeners(WI.Animation.Event.TargetChanged);
    }

    // Private

    _updateEffect(effect)
    {
        this._effect = effect || {};

        if ("iterationCount" in this._effect) {
            if (this._effect.iterationCount === -1)
                this._effect.iterationCount = Infinity;
            else if (this._effect.iterationCount === null) {
                // COMPATIBILITY (iOS 14): an iteration count of `Infinity` was not properly handled.
                this._effect.iterationCount = Infinity;
            }
        }

        if ("timingFunction" in this._effect) {
            let timingFunction = this._effect.timingFunction;
            this._effect.timingFunction = WI.CubicBezierTimingFunction.fromString(timingFunction) || WI.LinearTimingFunction.fromString(timingFunction) || WI.StepsTimingFunction.fromString(timingFunction) || WI.SpringTimingFunction.fromString(timingFunction);
            console.assert(this._effect.timingFunction, timingFunction);
        }

        if ("keyframes" in this._effect) {
            for (let keyframe of this._effect.keyframes) {
                if (keyframe.easing) {
                    let easing = keyframe.easing;
                    keyframe.easing = WI.CubicBezierTimingFunction.fromString(easing) || WI.LinearTimingFunction.fromString(easing) || WI.StepsTimingFunction.fromString(easing) || WI.SpringTimingFunction.fromString(easing);
                    console.assert(keyframe.easing, easing);
                }

                if (keyframe.style)
                    keyframe.style = keyframe.style.replaceAll(/;\s+/g, ";\n");
            }
        }

        this.dispatchEventToListeners(WI.Animation.Event.EffectChanged);
    }
};

WI.Animation._nextUniqueDisplayNameNumber = 1;

WI.Animation.Type = {
    WebAnimation: "web-animation",
    CSSAnimation: "css-animation",
    CSSTransition: "css-transition",
};

WI.Animation.PlaybackDirection = {
    Normal: "normal",
    Reverse: "reverse",
    Alternate: "alternate",
    AlternateReverse: "alternate-reverse",
};

WI.Animation.FillMode = {
    None: "none",
    Forwards: "forwards",
    Backwards: "backwards",
    Both: "both",
    Auto: "auto",
};

WI.Animation.Event = {
    NameChanged: "animation-name-changed",
    EffectChanged: "animation-effect-changed",
    TargetChanged: "animation-target-changed",
};
