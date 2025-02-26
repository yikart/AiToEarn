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

WI.ColorSquare = class ColorSquare
{
    constructor(delegate, dimension)
    {
        this._delegate = delegate;

        this._hue = 0;
        this._x = 0;
        this._y = 0;
        this._gamut = null;
        this._crosshairPosition = null;

        this._element = document.createElement("div");
        this._element.className = "color-square";
        this._element.tabIndex = 0;

        let saturationGradientElement = this._element.appendChild(document.createElement("div"));
        saturationGradientElement.className = "saturation-gradient fill";

        let lightnessGradientElement = this._element.appendChild(document.createElement("div"));
        lightnessGradientElement.className = "lightness-gradient fill";

        this._srgbLabelElement = null;
        this._svgElement = null;
        this._polylineElement = null;

        this._element.addEventListener("mousedown", this);
        this._element.addEventListener("keydown", this._handleKeyDown.bind(this));

        this._crosshairElement = this._element.appendChild(document.createElement("div"));
        this._crosshairElement.className = "crosshair";

        this.dimension = dimension;
    }

    // Public

    get element() { return this._element; }

    set dimension(dimension)
    {
        console.assert(!isNaN(dimension));
        if (dimension === this._dimension)
            return;

        this._dimension = dimension;
        this._element.style.width = this.element.style.height = `${this._dimension}px`;
        this._updateBaseColor();
    }

    get hue()
    {
        return this._hue;
    }

    set hue(hue)
    {
        this._hue = hue;
        this._updateBaseColor();
    }

    get tintedColor()
    {
        if (this._crosshairPosition) {
            if (this._gamut === WI.Color.Gamut.DisplayP3) {
                let rgb = WI.Color.hsv2rgb(this._hue, this._saturation, this._brightness);
                rgb = rgb.map(((x) => Math.roundTo(x, 0.001)));
                return new WI.Color(WI.Color.Format.ColorFunction, rgb, this._gamut);
            }

            let hsl = WI.Color.hsv2hsl(this._hue, this._saturation, this._brightness);
            return new WI.Color(WI.Color.Format.HSL, hsl);
        }

        return new WI.Color(WI.Color.Format.HSLA, [0, 0, 0, 0]);
    }

    set tintedColor(tintedColor)
    {
        console.assert(tintedColor instanceof WI.Color);

        this._gamut = tintedColor.gamut;

        let [hue, saturation, value] = WI.Color.rgb2hsv(...tintedColor.normalizedRGB);
        let x = saturation / 100 * this._dimension;
        let y = (1 - (value / 100)) * this._dimension;

        if (this._gamut === WI.Color.Gamut.DisplayP3)
            this._drawSRGBOutline();

        this._setCrosshairPosition(new WI.Point(x, y));
        this._updateBaseColor();
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

    get _saturation()
    {
        let saturation = this._x / this._dimension;
        return Number.constrain(saturation, 0, 1) * 100;
    }

    get _brightness()
    {
        let brightness = 1 - (this._y / this._dimension);
        return Number.constrain(brightness, 0, 1) * 100;
    }

    _handleMousedown(event)
    {
        if (event.button !== 0 || event.ctrlKey)
            return;

        window.addEventListener("mousemove", this, true);
        window.addEventListener("mouseup", this, true);
        this._updateColorForMouseEvent(event);

        // Prevent text selection.
        event.stop();
        this._element.focus();
    }

    _handleMousemove(event)
    {
        this._updateColorForMouseEvent(event);
    }

    _handleMouseup(event)
    {
        window.removeEventListener("mousemove", this, true);
        window.removeEventListener("mouseup", this, true);
    }

    _handleKeyDown(event)
    {
        let dx = 0;
        let dy = 0;
        let step = event.shiftKey ? 10 : 1;

        switch (event.keyIdentifier) {
        case "Right":
            dx += step;
            break;
        case "Left":
            dx -= step;
            break;
        case "Down":
            dy += step;
            break;
        case "Up":
            dy -= step;
            break;
        }

        if (dx || dy) {
            event.preventDefault();
            this._setCrosshairPosition(new WI.Point(this._x + dx, this._y + dy));

            if (this._delegate && this._delegate.colorSquareColorDidChange)
                this._delegate.colorSquareColorDidChange(this);
        }
    }

    _updateColorForMouseEvent(event)
    {
        let rect = this._element.getBoundingClientRect();
        this._setCrosshairPosition({
            x: event.pageX - rect.x,
            y: event.pageY - rect.y,
        });

        if (this._delegate && this._delegate.colorSquareColorDidChange)
            this._delegate.colorSquareColorDidChange(this);
    }

    _setCrosshairPosition(point)
    {
        this._crosshairPosition = point;
        this._x = Number.constrain(Math.round(point.x), 0, this._dimension);
        this._y = Number.constrain(Math.round(point.y), 0, this._dimension);
        this._crosshairElement.style.setProperty("transform", `translate(${this._x}px, ${this._y}px)`);

        this._updateCrosshairBackground();
    }

    _updateBaseColor()
    {
        if (this._gamut === WI.Color.Gamut.DisplayP3) {
            let [r, g, b] = WI.Color.hsl2rgb(this._hue, 100, 50);
            this._element.style.backgroundColor = `color(display-p3 ${r / 255} ${g / 255} ${b / 255})`;
        } else
            this._element.style.backgroundColor = `hsl(${this._hue}, 100%, 50%)`;

        this._updateCrosshairBackground();

        if (this._gamut === WI.Color.Gamut.DisplayP3)
            this._drawSRGBOutline();
    }

    _updateCrosshairBackground()
    {
        this._crosshairElement.style.backgroundColor = this.tintedColor.toString();
    }

    _drawSRGBOutline()
    {
        if (!this._svgElement) {
            this._srgbLabelElement = this._element.appendChild(document.createElement("span"));
            this._srgbLabelElement.className = "srgb-label";
            this._srgbLabelElement.textContent = WI.unlocalizedString("sRGB");
            this._srgbLabelElement.title = WI.UIString("Edge of sRGB color space", "Label for a guide within the color picker");

            const svgNamespace = "http://www.w3.org/2000/svg";
            this._svgElement = this._element.appendChild(document.createElementNS(svgNamespace, "svg"));
            this._svgElement.classList.add("svg-root");

            this._polylineElement = this._svgElement.appendChild(document.createElementNS(svgNamespace, "polyline"));
            this._polylineElement.classList.add("srgb-edge");
        }

        let points = [];
        let step = 1 / window.devicePixelRatio;
        let x = 0;
        for (let y = 0; y < this._dimension; y += step) {
            let value = 100 - ((y / this._dimension) * 100);

            // Optimization: instead of starting from x = 0, we can benefit from the fact that the next point
            // always has x >= of the current x. This minimizes processing time over 100 times.
            for (; x < this._dimension; x += step) {
                let saturation = x / this._dimension * 100;
                let rgb = WI.Color.hsv2rgb(this._hue, saturation, value);
                let srgb = WI.Color.displayP3toSRGB(rgb[0], rgb[1], rgb[2]);
                if (srgb.some((value) => value < 0 || value > 1)) {
                    // The point is outside of sRGB.
                    points.push({x, y});
                    break;
                }
            }
        }

        if (points.lastValue.y < this._dimension * 0.95) {
            // For `color(display-p3 0 0 1)`, the line is almost horizontal.
            // Position the label directly under the line.
            points.push({x: this._dimension, y: points.lastValue.y});
            this._srgbLabelElement.style.removeProperty("bottom");
            this._srgbLabelElement.style.top = `${points.lastValue.y}px`;
        } else {
            this._srgbLabelElement.style.removeProperty("top");
            this._srgbLabelElement.style.bottom = "0px";
        }

        this._srgbLabelElement.style.right = `${this._dimension - points.lastValue.x}px`;

        this._polylineElement.points.clear();
        for (let {x, y} of points) {
            let svgPoint = this._svgElement.createSVGPoint();
            svgPoint.x = x;
            svgPoint.y = y;
            this._polylineElement.points.appendItem(svgPoint);
        }
    }
};
