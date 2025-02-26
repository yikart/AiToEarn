/*
 * Copyright (C) 2014-2015 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.GradientSlider = class GradientSlider extends WI.Object
{
    constructor(delegate)
    {
        super();

        this.delegate = delegate;

        this._element = null;
        this._stops = [];
        this._knobs = [];

        this._selectedKnob = null;
        this._canvas = document.createElement("canvas");

        this._keyboardShortcutEsc = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Escape);
    }

    // Public

    get element()
    {
        if (!this._element) {
            this._element = document.createElement("div");
            this._element.className = "gradient-slider";
            this._element.appendChild(this._canvas);

            this._addArea = this._element.appendChild(document.createElement("div"));
            this._addArea.addEventListener("mouseover", this);
            this._addArea.addEventListener("mousemove", this);
            this._addArea.addEventListener("mouseout", this);
            this._addArea.addEventListener("click", this);
            this._addArea.className = WI.GradientSlider.AddAreaClassName;
        }
        return this._element;
    }

    get stops()
    {
        return this._stops;
    }

    set stops(stops)
    {
        this._stops = stops;

        this._updateStops();
    }

    get selectedStop()
    {
        return this._selectedKnob ? this._selectedKnob.stop : null;
    }

    // Protected

    handleEvent(event)
    {
        switch (event.type) {
        case "mouseover":
            this._handleMouseover(event);
            break;
        case "mousemove":
            this._handleMousemove(event);
            break;
        case "mouseout":
            this._handleMouseout(event);
            break;
        case "click":
            this._handleClick(event);
            break;
        }
    }

    handleKeydownEvent(event)
    {
        if (!this._keyboardShortcutEsc.matchesEvent(event) || !this._selectedKnob || !this._selectedKnob.selected)
            return false;

        this._selectedKnob.selected = false;

        return true;
    }

    knobXDidChange(knob)
    {
        knob.stop.offset = knob.x / WI.GradientSlider.Width;
        this._sortStops();
        this._updateCanvas();
    }

    knobCanDetach(knob)
    {
        return this._knobs.length > 2;
    }

    knobWillDetach(knob)
    {
        knob.element.classList.add(WI.GradientSlider.DetachingClassName);

        this._stops.remove(knob.stop);
        this._knobs.remove(knob);
        this._sortStops();
        this._updateCanvas();
    }

    knobSelectionChanged(knob)
    {
        if (this._selectedKnob && this._selectedKnob !== knob && knob.selected)
            this._selectedKnob.selected = false;

        this._selectedKnob = knob.selected ? knob : null;

        if (this.delegate && typeof this.delegate.gradientSliderStopWasSelected === "function")
            this.delegate.gradientSliderStopWasSelected(this, knob.stop);

        if (this._selectedKnob)
            WI.addWindowKeydownListener(this);
        else
            WI.removeWindowKeydownListener(this);
    }

    // Private

    _handleMouseover(event)
    {
        this._updateShadowKnob(event);
    }

    _handleMousemove(event)
    {
        this._updateShadowKnob(event);
    }

    _handleMouseout(event)
    {
        if (!this._shadowKnob)
            return;

        this._shadowKnob.element.remove();
        delete this._shadowKnob;
    }

    _handleClick(event)
    {
        this._updateShadowKnob(event);

        this._knobs.push(this._shadowKnob);

        this._shadowKnob.element.classList.remove(WI.GradientSlider.ShadowClassName);

        var stop = {offset: this._shadowKnob.x / WI.GradientSlider.Width, color: this._shadowKnob.wellColor};
        this._stops.push(stop);
        this._sortStops();
        this._updateStops();

        this._knobs[this._stops.indexOf(stop)].selected = true;

        delete this._shadowKnob;
    }

    _updateShadowKnob(event)
    {
        if (!this._shadowKnob) {
            this._shadowKnob = new WI.GradientSliderKnob(this);
            this._shadowKnob.element.classList.add(WI.GradientSlider.ShadowClassName);
            this.element.appendChild(this._shadowKnob.element);
        }

        this._shadowKnob.x = event.pageX - this.element.getBoundingClientRect().x;

        var colorData = this._canvas.getContext("2d").getImageData(this._shadowKnob.x - 1, 0, 1, 1).data;
        this._shadowKnob.wellColor = new WI.Color(WI.Color.Format.RGB, [colorData[0], colorData[1], colorData[2], colorData[3] / 255]);
    }

    _sortStops()
    {
        this._stops.sort(function(a, b) {
            return a.offset - b.offset;
        });
    }

    _updateStops()
    {
        this._updateCanvas();
        this._updateKnobs();
    }

    _updateCanvas()
    {
        var w = WI.GradientSlider.Width;
        var h = WI.GradientSlider.Height;

        this._canvas.width = w;
        this._canvas.height = h;

        var ctx = this._canvas.getContext("2d");
        var gradient = ctx.createLinearGradient(0, 0, w, 0);
        for (var stop of this._stops)
            gradient.addColorStop(stop.offset, stop.color);

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        if (this.delegate && typeof this.delegate.gradientSliderStopsDidChange === "function")
            this.delegate.gradientSliderStopsDidChange(this);
    }

    _updateKnobs()
    {
        var selectedStop = this._selectedKnob ? this._selectedKnob.stop : null;

        while (this._knobs.length > this._stops.length)
            this._knobs.pop().element.remove();

        while (this._knobs.length < this._stops.length) {
            var knob = new WI.GradientSliderKnob(this);
            this.element.appendChild(knob.element);
            this._knobs.push(knob);
        }

        for (var i = 0; i < this._stops.length; ++i) {
            var stop = this._stops[i];
            var knob = this._knobs[i];

            knob.stop = stop;
            knob.x = Math.round(stop.offset * WI.GradientSlider.Width);
            knob.selected = stop === selectedStop;
        }
    }
};

WI.GradientSlider.Width = 238;
WI.GradientSlider.Height = 19;

WI.GradientSlider.AddAreaClassName = "add-area";
WI.GradientSlider.DetachingClassName = "detaching";
WI.GradientSlider.ShadowClassName = "shadow";

WI.GradientSliderKnob = class GradientSliderKnob extends WI.Object
{
    constructor(delegate)
    {
        super();

        this._x = 0;
        this._y = 0;
        this._stop = null;

        this.delegate = delegate;

        this._element = document.createElement("div");
        this._element.className = "gradient-slider-knob";

        // Checkers pattern.
        this._element.appendChild(document.createElement("img"));

        this._well = this._element.appendChild(document.createElement("div"));

        this._element.addEventListener("mousedown", this);
    }

    // Public

    get element()
    {
        return this._element;
    }

    get stop()
    {
        return this._stop;
    }

    set stop(stop)
    {
        this.wellColor = stop.color;
        this._stop = stop;
    }

    get x()
    {
        return this._x;
    }

    set x(x) {
        this._x = x;
        this._updateTransform();
    }

    get wellColor()
    {
        return this._wellColor;
    }

    set wellColor(color)
    {
        this._wellColor = color;
        this._well.style.backgroundColor = color;
    }

    get selected()
    {
        return this._element.classList.contains(WI.GradientSliderKnob.SelectedClassName);
    }

    set selected(selected)
    {
        if (this.selected === selected)
            return;

        this._element.classList.toggle(WI.GradientSliderKnob.SelectedClassName, selected);

        if (this.delegate && typeof this.delegate.knobSelectionChanged === "function")
            this.delegate.knobSelectionChanged(this);
    }

    // Protected

    handleEvent(event)
    {
        event.preventDefault();
        event.stopPropagation();

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
        case "transitionend":
            this._handleTransitionEnd(event);
            break;
        }
    }

    // Private

    _handleMousedown(event)
    {
        this._moved = false;
        this._detaching = false;

        window.addEventListener("mousemove", this, true);
        window.addEventListener("mouseup", this, true);

        this._startX = this.x;
        this._startMouseX = event.pageX;
        this._startMouseY = event.pageY;
    }

    _handleMousemove(event)
    {
        var w = WI.GradientSlider.Width;

        this._moved = true;

        if (!this._detaching && Math.abs(event.pageY - this._startMouseY) > 50) {
            this._detaching = this.delegate && typeof this.delegate.knobCanDetach === "function" && this.delegate.knobCanDetach(this);
            if (this._detaching && this.delegate && typeof this.delegate.knobWillDetach === "function") {
                var translationFromParentToBody = window.webkitConvertPointFromNodeToPage(this.element.parentNode, new WebKitPoint(0, 0));
                this._startMouseX -= translationFromParentToBody.x;
                this._startMouseY -= translationFromParentToBody.y;
                document.body.appendChild(this.element);
                this.delegate.knobWillDetach(this);
            }
        }

        var x = this._startX + event.pageX - this._startMouseX;
        if (!this._detaching)
            x = Math.min(Math.max(0, x), w);
        this.x = x;

        if (this._detaching) {
            this._y = event.pageY - this._startMouseY;
            this._updateTransform();
        } else if (this.delegate && typeof this.delegate.knobXDidChange === "function")
            this.delegate.knobXDidChange(this);
    }

    _handleMouseup(event)
    {
        window.removeEventListener("mousemove", this, true);
        window.removeEventListener("mouseup", this, true);

        if (this._detaching) {
            this.element.addEventListener("transitionend", this);
            this.element.classList.add(WI.GradientSliderKnob.FadeOutClassName);
            this.selected = false;
        } else if (!this._moved)
            this.selected = !this.selected;
    }

    _handleTransitionEnd(event)
    {
        this.element.removeEventListener("transitionend", this);
        this.element.classList.remove(WI.GradientSliderKnob.FadeOutClassName);
        this.element.remove();
    }

    _updateTransform()
    {
        this.element.style.transform = "translate3d(" + this._x + "px, " + this._y + "px, 0)";
    }
};

WI.GradientSliderKnob.SelectedClassName = "selected";
WI.GradientSliderKnob.FadeOutClassName = "fade-out";
