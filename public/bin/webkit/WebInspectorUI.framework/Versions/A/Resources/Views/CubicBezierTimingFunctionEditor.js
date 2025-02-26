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

WI.CubicBezierTimingFunctionEditor = class CubicBezierTimingFunctionEditor extends WI.Object
{
    constructor()
    {
        super();

        this._element = document.createElement("div");
        this._element.classList.add("cubic-bezier-timing-function-editor");
        this._element.dir = "ltr";

        var editorWidth = 184;
        var editorHeight = 200;
        this._padding = 25;
        this._controlHandleRadius = 7;
        this._previewWidth = editorWidth - (this._controlHandleRadius * 2);
        this._previewHeight = editorHeight - (this._controlHandleRadius * 2) - (this._padding * 2);

        this._previewContainer = this._element.createChild("div", "preview");
        this._previewContainer.title = WI.UIString("Restart animation");
        this._previewContainer.addEventListener("mousedown", this._resetPreviewAnimation.bind(this));

        this._previewElement = this._previewContainer.createChild("div");

        this._timingElement = this._element.createChild("div", "timing");

        this._curveContainer = this._element.appendChild(createSVGElement("svg"));
        this._curveContainer.setAttribute("width", editorWidth);
        this._curveContainer.setAttribute("height", editorHeight);
        this._curveContainer.classList.add("curve");

        let svgGroup = this._curveContainer.appendChild(createSVGElement("g"));
        svgGroup.setAttribute("transform", "translate(0, " + this._padding + ")");

        let linearCurveElement = svgGroup.appendChild(createSVGElement("line"));
        linearCurveElement.classList.add("linear");
        linearCurveElement.setAttribute("x1", this._controlHandleRadius);
        linearCurveElement.setAttribute("y1", this._previewHeight + this._controlHandleRadius);
        linearCurveElement.setAttribute("x2", this._previewWidth + this._controlHandleRadius);
        linearCurveElement.setAttribute("y2", this._controlHandleRadius);

        this._cubicBezierCurveElement = svgGroup.appendChild(createSVGElement("path"));
        this._cubicBezierCurveElement.classList.add("cubic-bezier");

        function createControl(x1, y1)
        {
            x1 += this._controlHandleRadius;
            y1 += this._controlHandleRadius;

            let line = svgGroup.appendChild(createSVGElement("line"));
            line.classList.add("control-line");
            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x1);
            line.setAttribute("y2", y1);

            let handle = svgGroup.appendChild(createSVGElement("circle"));
            handle.classList.add("control-handle");

            return {point: null, line, handle};
        }

        this._inControl = createControl.call(this, 0, this._previewHeight);
        this._outControl = createControl.call(this, this._previewWidth, 0);

        this._numberInputContainer = this._element.createChild("div", "number-input-container");

        function createCoordinateInput(id, {min, max} = {})
        {
            let key = "_" + id + "Input";
            this[key] = this._numberInputContainer.createChild("input");
            this[key].type = "number";
            this[key].step = 0.01;

            if (!isNaN(min))
                this[key].min = min;

            if (!isNaN(max))
                this[key].max = max;

            this[key].addEventListener("input", this._handleNumberInputInput.bind(this));
            this[key].addEventListener("keydown", this._handleNumberInputKeydown.bind(this));
        }

        createCoordinateInput.call(this, "inX", {min: 0, max: 1});
        createCoordinateInput.call(this, "inY");
        createCoordinateInput.call(this, "outX", {min: 0, max: 1});
        createCoordinateInput.call(this, "outY");

        this._selectedControl = null;
        this._mouseDownPosition = null;
        this._curveContainer.addEventListener("mousedown", this);

        WI.addWindowKeydownListener(this);
    }

    // Public

    get element()
    {
        return this._element;
    }

    set cubicBezierTimingFunction(cubicBezierTimingFunction)
    {
        if (!cubicBezierTimingFunction)
            return;

        var isCubicBezier = cubicBezierTimingFunction instanceof WI.CubicBezierTimingFunction;
        console.assert(isCubicBezier);
        if (!isCubicBezier)
            return;

        this._cubicBezierTimingFunction = cubicBezierTimingFunction;
        this._updatePreview();
    }

    get cubicBezierTimingFunction()
    {
        return this._cubicBezierTimingFunction;
    }

    removeListeners()
    {
        WI.removeWindowKeydownListener(this);
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

    handleKeydownEvent(event)
    {
        if (!this._selectedControl || !this._element.parentNode)
            return false;

        let horizontal = 0;
        let vertical = 0;
        switch (event.keyCode) {
        case WI.KeyboardShortcut.Key.Up.keyCode:
            vertical = -1;
            break;
        case WI.KeyboardShortcut.Key.Right.keyCode:
            horizontal = 1;
            break;
        case WI.KeyboardShortcut.Key.Down.keyCode:
            vertical = 1;
            break;
        case WI.KeyboardShortcut.Key.Left.keyCode:
            horizontal = -1;
            break;
        default:
            return false;
        }

        if (event.shiftKey) {
            horizontal *= 10;
            vertical *= 10;
        }

        vertical *= this._previewWidth / 100;
        horizontal *= this._previewHeight / 100;

        this._selectedControl.point.x = Number.constrain(this._selectedControl.point.x + horizontal, 0, this._previewWidth);
        this._selectedControl.point.y += vertical;
        this._updateControl(this._selectedControl);
        this._updateCubicBezierTimingFunction();

        return true;
    }

    // Private

    _handleMousedown(event)
    {
        if (event.button !== 0)
            return;

        event.stop();
        window.addEventListener("mousemove", this, true);
        window.addEventListener("mouseup", this, true);

        this._previewContainer.classList.remove("animate");
        this._timingElement.classList.remove("animate");

        this._updateControlPointsForMouseEvent(event, true);
    }

    _handleMousemove(event)
    {
        this._updateControlPointsForMouseEvent(event);
    }

    _handleMouseup(event)
    {
        this._selectedControl.handle.classList.remove("selected");
        this._mouseDownPosition = null;
        this._triggerPreviewAnimation();

        window.removeEventListener("mousemove", this, true);
        window.removeEventListener("mouseup", this, true);
    }

    _updateControlPointsForMouseEvent(event, calculateSelectedControlPoint)
    {
        var point = WI.Point.fromEventInElement(event, this._curveContainer);
        point.x = Number.constrain(point.x - this._controlHandleRadius, 0, this._previewWidth);
        point.y -= this._controlHandleRadius + this._padding;

        if (calculateSelectedControlPoint) {
            this._mouseDownPosition = point;

            if (this._inControl.point.distance(point) < this._outControl.point.distance(point))
                this._selectedControl = this._inControl;
            else
                this._selectedControl = this._outControl;
        }

        if (event.shiftKey && this._mouseDownPosition) {
            if (Math.abs(this._mouseDownPosition.x - point.x) > Math.abs(this._mouseDownPosition.y - point.y))
                point.y = this._mouseDownPosition.y;
            else
                point.x = this._mouseDownPosition.x;
        }

        this._selectedControl.point = point;
        this._selectedControl.handle.classList.add("selected");
        this._updateCubicBezierTimingFunction();
    }

    _updateCubicBezierTimingFunction()
    {
        function round(num)
        {
            return Math.round(num * 100) / 100;
        }

        var inValueX = round(this._inControl.point.x / this._previewWidth);
        var inValueY = round(1 - (this._inControl.point.y / this._previewHeight));

        var outValueX = round(this._outControl.point.x / this._previewWidth);
        var outValueY = round(1 - (this._outControl.point.y / this._previewHeight));

        this._cubicBezierTimingFunction = new WI.CubicBezierTimingFunction(inValueX, inValueY, outValueX, outValueY);
        this._updateCoordinateInputs();

        this.dispatchEventToListeners(WI.CubicBezierTimingFunctionEditor.Event.CubicBezierTimingFunctionChanged, {cubicBezierTimingFunction: this._cubicBezierTimingFunction});
    }

    _updateCoordinateInputs()
    {
        var r = this._controlHandleRadius;
        var inControlX = this._inControl.point.x + r;
        var inControlY = this._inControl.point.y + r;
        var outControlX = this._outControl.point.x + r;
        var outControlY = this._outControl.point.y + r;
        var path = `M ${r} ${this._previewHeight + r} C ${inControlX} ${inControlY} ${outControlX} ${outControlY} ${this._previewWidth + r} ${r}`;
        this._cubicBezierCurveElement.setAttribute("d", path);
        this._updateControl(this._inControl);
        this._updateControl(this._outControl);

        this._inXInput.value = this._cubicBezierTimingFunction.inPoint.x;
        this._inYInput.value = this._cubicBezierTimingFunction.inPoint.y;
        this._outXInput.value = this._cubicBezierTimingFunction.outPoint.x;
        this._outYInput.value = this._cubicBezierTimingFunction.outPoint.y;
    }

    _updateControl(control)
    {
        control.handle.setAttribute("cx", control.point.x + this._controlHandleRadius);
        control.handle.setAttribute("cy", control.point.y + this._controlHandleRadius);

        control.line.setAttribute("x2", control.point.x + this._controlHandleRadius);
        control.line.setAttribute("y2", control.point.y + this._controlHandleRadius);
    }

    _updatePreview()
    {
        this._inControl.point = new WI.Point(this._cubicBezierTimingFunction.inPoint.x * this._previewWidth, (1 - this._cubicBezierTimingFunction.inPoint.y) * this._previewHeight);
        this._outControl.point = new WI.Point(this._cubicBezierTimingFunction.outPoint.x * this._previewWidth, (1 - this._cubicBezierTimingFunction.outPoint.y) * this._previewHeight);

        this._updateCoordinateInputs();
        this._triggerPreviewAnimation();
    }

    _triggerPreviewAnimation()
    {
        this._previewElement.style.animationTimingFunction = this._cubicBezierTimingFunction.toString();
        this._previewContainer.classList.add("animate");
        this._timingElement.classList.add("animate");
    }

    _resetPreviewAnimation()
    {
        var parent = this._previewElement.parentNode;
        parent.removeChild(this._previewElement);
        parent.appendChild(this._previewElement);

        this._element.removeChild(this._timingElement);
        this._element.appendChild(this._timingElement);
    }

    _handleNumberInputInput(event)
    {
        this._changeCoordinateForInput(event.target, event.target.value);
    }

    _handleNumberInputKeydown(event)
    {
        let shift = 0;
        if (event.keyIdentifier === "Up")
            shift = 0.01;
         else if (event.keyIdentifier === "Down")
            shift = -0.01;

        if (!shift)
            return;

        if (event.shiftKey)
            shift *= 10;

        event.preventDefault();
        this._changeCoordinateForInput(event.target, parseFloat(event.target.value) + shift);
    }

    _changeCoordinateForInput(target, value)
    {
        value = Math.round(value * 100) / 100;

        switch (target) {
        case this._inXInput:
            this._cubicBezierTimingFunction.inPoint.x = Number.constrain(value, 0, 1);
            break;
        case this._inYInput:
            this._cubicBezierTimingFunction.inPoint.y = value;
            break;
        case this._outXInput:
            this._cubicBezierTimingFunction.outPoint.x = Number.constrain(value, 0, 1);
            break;
        case this._outYInput:
            this._cubicBezierTimingFunction.outPoint.y = value;
            break;
        default:
            return;
        }

        this._updatePreview();

        this.dispatchEventToListeners(WI.CubicBezierTimingFunctionEditor.Event.CubicBezierTimingFunctionChanged, {cubicBezierTimingFunction: this._cubicBezierTimingFunction});
    }
};

WI.CubicBezierTimingFunctionEditor.Event = {
    CubicBezierTimingFunctionChanged: "cubic-bezier-timing-function-editor-cubic-bezier-timing-function-changed"
};
