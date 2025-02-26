/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.GestureController = class GestureController
{
    constructor(target, delegate, {container, supportsScale, supportsTranslate})
    {
        console.assert(target instanceof Node, target);
        console.assert(!container || container instanceof Node, container);
        console.assert(!supportsScale || typeof delegate.gestureControllerDidScale === "function", delegate.gestureControllerDidScale);
        console.assert(!supportsTranslate || typeof delegate.gestureControllerDidTranslate === "function", delegate.gestureControllerDidTranslate);
        console.assert(supportsScale || supportsTranslate, "expects at least one gesture");

        this._target = target;
        this._delegate = delegate;

        this._scale = 1;
        this._translate = {x: 0, y: 0};

        this._mouseWheelDelta = 0;

        container ||= target;

        this._supportsScale = supportsScale || false;
        if (this._supportsScale) {
            container.addEventListener("wheel", this._handleWheel.bind(this));
            container.addEventListener("gesturestart", this._handleGestureStart.bind(this));
            container.addEventListener("gesturechange", this._handleGestureChange.bind(this));
            container.addEventListener("gestureend", this._handleGestureEnd.bind(this));
        }

        this._supportsTranslate = supportsTranslate || false;
        if (this._supportsTranslate) {
            console.assert(!container.draggable, "cannot have both a translate gesture and dragging");
            container.addEventListener("mousedown", this._handleMouseDown.bind(this));
        }
    }

    // Public

    get scale()
    {
        return this._scale;
    }

    set scale(scale)
    {
        console.assert(this._supportsScale);

        scale = Number.constrain(scale, 0.01, 100);
        if (scale === this._scale)
            return;

        this._scale = scale;

        this._delegate.gestureControllerDidScale(this);
    }

    get translate()
    {
        return this._translate;
    }

    set translate(translate)
    {
        console.assert(this._supportsTranslate);

        if (translate.x === this._translate.x && translate.y === this._translate.y)
            return;

        this._translate = translate;

        this._delegate.gestureControllerDidTranslate(this);
    }

    reset()
    {
        this.scale = 1;
        this.translate = {x: 0, y: 0};

        this._mouseWheelDelta = 0;
    }

    // Private

    _startScaleInteraction(event)
    {
        this._scaleInteractionStartScale = this._scale;
        if (this._supportsTranslate)
            this._scaleInteractionStartTranslate = this._translate;

        if (event.target === this._target) {
            let elementBounds = this._target.getBoundingClientRect();
            this._scaleInteractionStartPosition = {
                x: (event.pageX - elementBounds.left - (elementBounds.width / 2)) / this._scaleInteractionStartScale,
                y: (event.pageY - elementBounds.top - (elementBounds.height / 2)) / this._scaleInteractionStartScale,
            };
        } else
            this._scaleInteractionStartPosition = {x: 0, y: 0};
    }

    _updateScaleInteraction(scale)
    {
        this.scale = this._scaleInteractionStartScale * scale;

        if (this._supportsTranslate) {
            this.translate = {
                x: this._scaleInteractionStartTranslate.x - (this._scaleInteractionStartPosition.x * (this._scale - this._scaleInteractionStartScale)),
                y: this._scaleInteractionStartTranslate.y - (this._scaleInteractionStartPosition.y * (this._scale - this._scaleInteractionStartScale)),
            };
        }
    }

    _endScaleInteraction() {
        this._scaleInteractionStartScale = NaN;
        if (this._supportsTranslate)
            this._scaleInteractionStartTranslate = null;

        this._scaleInteractionStartPosition = null;
    }

    _handleWheel(event)
    {
        // Ignore wheel events while handing gestures.
        if (this._handlingGesture)
            return;

        // Require twice the vertical delta to overcome horizontal scrolling.
        // This prevents most cases of inadvertent zooming for slightly diagonal scrolls.
        if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) * 0.5)
            return;

        let deviceDirection = event.webkitDirectionInvertedFromDevice ? -1 : 1;
        let delta = (event.deltaZ || event.deltaY || event.deltaX) * deviceDirection / 1000;

        // Reset accumulated wheel delta when direction changes.
        if (delta < 0 && this._mouseWheelDelta >= 0 || delta >= 0 && this._mouseWheelDelta < 0)
            this._mouseWheelDelta = 0;

        this._mouseWheelDelta += delta;

        this._startScaleInteraction(event);
        this._updateScaleInteraction(1 - this._mouseWheelDelta);
        this._endScaleInteraction();

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureStart(event)
    {
        console.assert(!this._handlingGesture);
        this._handlingGesture = true;

        this._startScaleInteraction(event);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureChange(event)
    {
        console.assert(this._handlingGesture);

        this._updateScaleInteraction(event.scale);

        event.preventDefault();
        event.stopPropagation();
    }

    _handleGestureEnd(event)
    {
        console.assert(this._handlingGesture);

        this._handlingGesture = false;

        this._endScaleInteraction();
    }

    _handleMouseDown(event)
    {
        if (event.target.draggable)
            return;

        if (event.button !== 0)
            return;

        this._translateInteractionStartTranslate = this._translate;

        this._translateInteractionStartPosition = {
            x: event.pageX,
            y: event.pageY,
        };

        console.assert(!this._boundHandleMouseMove);
        this._boundHandleMouseMove = this._handleMouseMove.bind(this);
        window.addEventListener("mousemove", this._boundHandleMouseMove, {capture: true});

        console.assert(!this._boundHandleMouseUp);
        this._boundHandleMouseUp = this._handleMouseUp.bind(this);
        window.addEventListener("mouseup", this._boundHandleMouseUp, {capture: true});
    }

    _handleMouseMove(event)
    {
        this.translate = {
            x: this._translateInteractionStartTranslate.x + (event.pageX - this._translateInteractionStartPosition.x),
            y: this._translateInteractionStartTranslate.y + (event.pageY - this._translateInteractionStartPosition.y),
        };
    }

    _handleMouseUp(event)
    {
        window.removeEventListener("mousemove", this._boundHandleMouseMove, {capture: true});
        this._boundHandleMouseMove = null;

        window.removeEventListener("mouseup", this._boundHandleMouseUp, {capture: true});
        this._boundHandleMouseUp = null;

        this._translateInteractionStartTranslate = null;
        this._translateInteractionStartPosition = null;
    }
};
