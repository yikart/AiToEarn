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

WI.Slider = class Slider extends WI.Object
{
    constructor()
    {
        super();

        this._element = document.createElement("div");
        this._element.className = "slider";
        this._element.tabIndex = 0;

        this._knob = this._element.appendChild(document.createElement("img"));

        this._value = 0;
        this._knobY = 0;
        this._maxY = 0;

        this._element.addEventListener("mousedown", this);
        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));
    }

    // Public

    get element()
    {
        return this._element;
    }

    get value()
    {
        return this._value;
    }

    set value(value)
    {
        value = Math.max(Math.min(value, 1), 0);

        if (value === this._value) {
            this.recalculateKnobY();
            return;
        }

        this.knobY = value;

        if (this.delegate && typeof this.delegate.sliderValueDidChange === "function")
            this.delegate.sliderValueDidChange(this, value);
    }

    set knobY(value)
    {
        this._value = value;
        this._knobY = Math.round((1 - value) * this.maxY);
        this._knob.style.setProperty("--translate-y", `${this._knobY}px`);
    }

    get maxY()
    {
        if (this._maxY <= 0 && document.body.contains(this._element))
            this._maxY = Math.max(this._element.offsetHeight - Math.ceil(WI.Slider.KnobWidth / 2), 0);

        return this._maxY;
    }

    recalculateKnobY()
    {
        this._maxY = 0;
        this.knobY = this._value;
    }

    // Protected

    handleEvent(event)
    {
        switch (event.type) {
        case "mousedown":
            this._handleMousedown(event);
            break;
        case "mousemove":
            this._handleMousemove(event);
            break;
        case "mouseup":
            this._handleMouseup(event);
            break;
        }
    }

    // Private

    _handleMousedown(event)
    {
        if (event.button !== 0 || event.ctrlKey)
            return;

        if (event.target !== this._knob)
            this.value = 1 - ((this._localPointForEvent(event).y - 3) / this.maxY);

        this._startKnobY = this._knobY;
        this._startMouseY = this._localPointForEvent(event).y;

        this._element.classList.add("dragging");

        window.addEventListener("mousemove", this, true);
        window.addEventListener("mouseup", this, true);

        this._element.focus();
    }

    _handleMousemove(event)
    {
        let dy = this._localPointForEvent(event).y - this._startMouseY;
        let y = Math.max(Math.min(this._startKnobY + dy, this.maxY), 0);

        this.value = 1 - (y / this.maxY);
    }

    _handleMouseup(event)
    {
        this._element.classList.remove("dragging");

        window.removeEventListener("mousemove", this, true);
        window.removeEventListener("mouseup", this, true);
    }

    _handleKeyDown(event)
    {
        let y = 0;
        let step = event.shiftKey ? 0.1 : 0.01;

        switch (event.keyIdentifier) {
        case "Down":
            y -= step;
            break;
        case "Up":
            y += step;
            break;
        }

        if (y) {
            event.preventDefault();
            this.value += y;
        }
    }

    _localPointForEvent(event)
    {
        // We convert all event coordinates from page coordinates to local coordinates such that the slider
        // may be transformed using CSS Transforms and interaction works as expected.
        let rect = this._element.getBoundingClientRect();
        return {
            x: event.pageX - rect.x,
            y: event.pageY - rect.y,
        };
    }
};

WI.Slider.KnobWidth = 13;
