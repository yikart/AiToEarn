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

WI.BoxShadowEditor = class BoxShadowEditor extends WI.Object
{
    constructor()
    {
        super();

        this._element = document.createElement("div");
        this._element.classList.add("box-shadow-editor");

        let tableElement = this._element.appendChild(document.createElement("table"));

        function createInputRow(identifier, label) {
            let id = `box-shadow-editor-${identifier}-input`;

            let rowElement = tableElement.appendChild(document.createElement("tr"));
            rowElement.className = identifier;

            let headerElement = rowElement.appendChild(document.createElement("th"));

            let labelElement = headerElement.appendChild(document.createElement("label"));
            labelElement.setAttribute("for", id);
            labelElement.textContent = label;

            let dataElement = rowElement.appendChild(document.createElement("td"));

            let inputElement = dataElement.appendChild(document.createElement("input"));
            inputElement.type = "text";
            inputElement.id = id;
            return {rowElement, inputElement};
        }

        function createSlider(rowElement, min, max) {
            let dataElement = rowElement.appendChild(document.createElement("td"));

            let rangeElement = dataElement.appendChild(document.createElement("input"));
            rangeElement.type = "range";
            rangeElement.min = min;
            rangeElement.max = max;
            return rangeElement;
        }

        let offsetXRow = createInputRow("offset-x", WI.UIString("Offset X", "Offset X @ Box Shadow Editor", "Input label for the x-axis of the offset of a CSS box shadow"));

        this._offsetXInput = offsetXRow.inputElement;
        this._offsetXInput.spellcheck = false;
        this._offsetXInput.addEventListener("input", this._handleOffsetXInputInput.bind(this));
        this._offsetXInput.addEventListener("keydown", this._handleOffsetXInputKeyDown.bind(this));

        let offsetSliderDataElement = offsetXRow.rowElement.appendChild(document.createElement("td"));
        offsetSliderDataElement.setAttribute("rowspan", 3);

        this._offsetSliderKnobRadius = 5; // keep in sync with `.box-shadow-editor > table > tr > td > svg circle`
        this._offsetSliderAreaSize = 100;

        const offsetSliderContainerSize = this._offsetSliderAreaSize + (this._offsetSliderKnobRadius * 2);

        this._offsetSliderSVG = offsetSliderDataElement.appendChild(createSVGElement("svg"));
        this._offsetSliderSVG.setAttribute("tabindex", 0);
        this._offsetSliderSVG.setAttribute("width", offsetSliderContainerSize);
        this._offsetSliderSVG.setAttribute("height", offsetSliderContainerSize);
        this._offsetSliderSVG.addEventListener("mousedown", this);
        this._offsetSliderSVG.addEventListener("keydown", this);

        this._offsetSliderSVGMouseDownPoint = null;

        let offsetSliderGroup = this._offsetSliderSVG.appendChild(createSVGElement("g"));
        offsetSliderGroup.setAttribute("transform", `translate(${this._offsetSliderKnobRadius}, ${this._offsetSliderKnobRadius})`);

        let offsetSliderXAxisLine = offsetSliderGroup.appendChild(createSVGElement("line"));
        offsetSliderXAxisLine.classList.add("axis");
        offsetSliderXAxisLine.setAttribute("x1", this._offsetSliderAreaSize / 2);
        offsetSliderXAxisLine.setAttribute("y1", 0);
        offsetSliderXAxisLine.setAttribute("x2", this._offsetSliderAreaSize / 2);
        offsetSliderXAxisLine.setAttribute("y2", this._offsetSliderAreaSize);

        let offsetSliderYAxisLine = offsetSliderGroup.appendChild(createSVGElement("line"));
        offsetSliderYAxisLine.classList.add("axis");
        offsetSliderYAxisLine.setAttribute("x1", 0);
        offsetSliderYAxisLine.setAttribute("y1", this._offsetSliderAreaSize / 2);
        offsetSliderYAxisLine.setAttribute("x2", this._offsetSliderAreaSize);
        offsetSliderYAxisLine.setAttribute("y2", this._offsetSliderAreaSize / 2);

        this._offsetSliderLine = offsetSliderGroup.appendChild(createSVGElement("line"));
        this._offsetSliderLine.setAttribute("x1", this._offsetSliderAreaSize / 2);
        this._offsetSliderLine.setAttribute("y1", this._offsetSliderAreaSize / 2);

        this._offsetSliderKnob = offsetSliderGroup.appendChild(createSVGElement("circle"));

        let offsetYRow = createInputRow("offset-y", WI.UIString("Offset Y", "Offset Y @ Box Shadow Editor", "Input label for the y-axis of the offset of a CSS box shadow"));

        this._offsetYInput = offsetYRow.inputElement;
        this._offsetYInput.spellcheck = false;
        this._offsetYInput.addEventListener("input", this._handleOffsetYInputInput.bind(this));
        this._offsetYInput.addEventListener("keydown", this._handleOffsetYInputKeyDown.bind(this));

        let insetRow = createInputRow("inset", WI.UIString("Inset", "Inset @ Box Shadow Editor", "Checkbox label for the inset of a CSS box shadow."));

        this._insetCheckbox = insetRow.inputElement;
        this._insetCheckbox.type = "checkbox";
        this._insetCheckbox.addEventListener("change", this._handleInsetCheckboxChange.bind(this));

        let blurRadiusRow = createInputRow("blur-radius", WI.UIString("Blur", "Blur @ Box Shadow Editor", "Input label for the blur radius of a CSS box shadow"));

        this._blurRadiusInput = blurRadiusRow.inputElement;
        this._blurRadiusInput.spellcheck = false;
        this._blurRadiusInput.addEventListener("input", this._handleBlurRadiusInputInput.bind(this));
        this._blurRadiusInput.addEventListener("keydown", this._handleBlurRadiusInputKeyDown.bind(this));
        this._blurRadiusInput.min = 0;

        this._blurRadiusSlider = createSlider(blurRadiusRow.rowElement, 0, 100);
        this._blurRadiusSlider.addEventListener("input", this._handleBlurRadiusSliderInput.bind(this));

        let spreadRadiusRow = createInputRow("spread-radius", WI.UIString("Spread", "Spread @ Box Shadow Editor", "Input label for the spread radius of a CSS box shadow"));

        this._spreadRadiusInput = spreadRadiusRow.inputElement;
        this._spreadRadiusInput.spellcheck = false;
        this._spreadRadiusInput.addEventListener("input", this._handleSpreadRadiusInputInput.bind(this));
        this._spreadRadiusInput.addEventListener("keydown", this._handleSpreadRadiusInputKeyDown.bind(this));

        this._spreadRadiusSlider = createSlider(spreadRadiusRow.rowElement, -50, 50);
        this._spreadRadiusSlider.addEventListener("input", this._handleSpreadRadiusSliderInput.bind(this));

        this._colorPicker = new WI.ColorPicker;
        this._colorPicker.addEventListener(WI.ColorPicker.Event.ColorChanged, this._handleColorChanged, this);
        this._element.appendChild(this._colorPicker.element);

        this.boxShadow = new WI.BoxShadow;

        WI.addWindowKeydownListener(this);
    }

    // Public

    get element() { return this._element; }

    get boxShadow()
    {
        return this._boxShadow;
    }

    set boxShadow(boxShadow)
    {
        console.assert(boxShadow instanceof WI.BoxShadow);

        this._boxShadow = boxShadow;

        let offsetX = this._boxShadow?.offsetX || {value: 0, unit: ""};
        let offsetY = this._boxShadow?.offsetY || {value: 0, unit: ""};
        this._offsetXInput.value = offsetX.value + offsetX.unit;
        this._offsetYInput.value = offsetY.value + offsetY.unit;

        let offsetSliderCenter = this._offsetSliderAreaSize / 2;
        let offsetSliderX = Number.constrain(offsetX.value + offsetSliderCenter, 0, this._offsetSliderAreaSize);
        let offsetSliderY = Number.constrain(offsetY.value + offsetSliderCenter, 0, this._offsetSliderAreaSize);

        this._offsetSliderLine.setAttribute("x2", offsetSliderX);
        this._offsetSliderKnob.setAttribute("cx", offsetSliderX);

        this._offsetSliderLine.setAttribute("y2", offsetSliderY);
        this._offsetSliderKnob.setAttribute("cy", offsetSliderY);

        let blurRadius = this._boxShadow?.blurRadius || {value: 0, unit: ""};
        this._blurRadiusInput.value = blurRadius.value + blurRadius.unit;
        this._blurRadiusSlider.value = blurRadius.value;

        let spreadRadius = this._boxShadow?.spreadRadius || {value: 0, unit: ""};
        this._spreadRadiusInput.value = spreadRadius.value + spreadRadius.unit;
        this._spreadRadiusSlider.value = spreadRadius.value;

        let inset = this._boxShadow?.inset || false;
        this._insetCheckbox.checked = inset;

        let color = this._boxShadow?.color || WI.Color.fromString("transparent");
        this._colorPicker.color = color;
    }

    // Protected

    handleEvent(event)
    {
        switch (event.type) {
        case "keydown":
            console.assert(event.target === this._offsetSliderSVG);
            this._handleOffsetSliderSVGKeyDown(event);
            return;

        case "mousedown":
            console.assert(event.target === this._offsetSliderSVG);
            this._handleOffsetSliderSVGMouseDown(event);
            return;

        case "mousemove":
            this._handleWindowMouseMove(event);
            return;

        case "mouseup":
            this._handleWindowMouseUp(event);
            return;
        }

        console.assert();
    }

    // Private

    _updateBoxShadow({offsetX, offsetY, blurRadius, spreadRadius, inset, color})
    {
        let change = false;

        if (!offsetX)
            offsetX = this._boxShadow.offsetX;
        else if (!Object.shallowEqual(offsetX, this._boxShadow.offsetX))
            change = true;

        if (!offsetY)
            offsetY = this._boxShadow.offsetY;
        else if (!Object.shallowEqual(offsetY, this._boxShadow.offsetY))
            change = true;

        if (!blurRadius)
            blurRadius = this._boxShadow.blurRadius;
        else if (!Object.shallowEqual(blurRadius, this._boxShadow.blurRadius))
            change = true;

        if (!spreadRadius)
            spreadRadius = this._boxShadow.spreadRadius;
        else if (!Object.shallowEqual(spreadRadius, this._boxShadow.spreadRadius))
            change = true;

        if (inset === undefined)
            inset = this._boxShadow.inset;
        else if (inset !== this._boxShadow.inset)
            change = true;

        if (!color)
            color = this._boxShadow.color;
        else if (color.toString() !== this._boxShadow.color?.toString())
            change = true;

        if (!change)
            return;

        this.boxShadow = new WI.BoxShadow(offsetX, offsetY, blurRadius, spreadRadius, inset, color);

        this.dispatchEventToListeners(WI.BoxShadowEditor.Event.BoxShadowChanged, {boxShadow: this._boxShadow});
    }

    _updateBoxShadowOffsetFromSliderMouseEvent(event, saveMouseDownPoint)
    {
        let point = WI.Point.fromEventInElement(event, this._offsetSliderSVG);
        point.x = Number.constrain(point.x - this._offsetSliderKnobRadius, 0, this._offsetSliderAreaSize);
        point.y = Number.constrain(point.y - this._offsetSliderKnobRadius, 0, this._offsetSliderAreaSize);

        if (saveMouseDownPoint)
            this._offsetSliderSVGMouseDownPoint = point;

        if (event.shiftKey && this._offsetSliderSVGMouseDownPoint) {
            if (Math.abs(this._offsetSliderSVGMouseDownPoint.x - point.x) > Math.abs(this._offsetSliderSVGMouseDownPoint.y - point.y))
                point.y = this._offsetSliderSVGMouseDownPoint.y;
            else
                point.x = this._offsetSliderSVGMouseDownPoint.x;
        }

        let offsetSliderCenter = this._offsetSliderAreaSize / 2;

        this._updateBoxShadow({
            offsetX: {
                value: point.x - offsetSliderCenter,
                unit: this._boxShadow.offsetX.unit,
            },
            offsetY: {
                value: point.y - offsetSliderCenter,
                unit: this._boxShadow.offsetY.unit,
            },
        });
    }

    _determineShiftForEvent(event)
    {
        let shift = 0;
        if (event.key === "ArrowUp")
            shift = 1;
        else if (event.key === "ArrowDown")
            shift = -1;

        if (!shift)
            return NaN;

        if (event.metaKey)
            shift *= 100;
        else if (event.shiftKey)
            shift *= 10;
        else if (event.altKey)
            shift /= 10;

        event.preventDefault();

        return shift;
    }

    _handleOffsetSliderSVGKeyDown(event) {
        let shiftX = 0;
        let shiftY = 0;

        switch (event.keyCode) {
        case WI.KeyboardShortcut.Key.Up.keyCode:
            shiftY = -1;
            break;

        case WI.KeyboardShortcut.Key.Right.keyCode:
            shiftX = 1;
            break;

        case WI.KeyboardShortcut.Key.Down.keyCode:
            shiftY = 1;
            break;

        case WI.KeyboardShortcut.Key.Left.keyCode:
            shiftX = -1;
            break;
        }

        if (!shiftX && !shiftY)
            return false;

        let multiplier = 1;

        if (event.shiftKey)
            multiplier = 10;
        else if (event.altKey)
            multiplier = 0.1;

        shiftX *= multiplier;
        shiftY *= multiplier;

        let offsetValueLimit = this._offsetSliderAreaSize / 2;

        this._updateBoxShadow({
            offsetX: {
                value: Number.constrain(this._boxShadow.offsetX.value + shiftX, -1 * offsetValueLimit, offsetValueLimit).maxDecimals(1),
                unit: this._boxShadow.offsetX.unit,
            },
            offsetY: {
                value: Number.constrain(this._boxShadow.offsetY.value + shiftY, -1 * offsetValueLimit, offsetValueLimit).maxDecimals(1),
                unit: this._boxShadow.offsetY.unit,
            },
        });

    }

    _handleOffsetSliderSVGMouseDown(event)
    {
        if (event.button !== 0)
            return;

        event.stop();

        this._offsetSliderSVG.focus();

        window.addEventListener("mousemove", this, true);
        window.addEventListener("mouseup", this, true);

        this._updateBoxShadowOffsetFromSliderMouseEvent(event, true);
    }

    _handleWindowMouseMove(event)
    {
        this._updateBoxShadowOffsetFromSliderMouseEvent(event);
    }

    _handleWindowMouseUp(event)
    {
        this._offsetSliderSVGMouseDownPoint = null;

        window.removeEventListener("mousemove", this, true);
        window.removeEventListener("mouseup", this, true);
    }

    _handleOffsetXInputInput(event)
    {
        this._updateBoxShadow({
            offsetX: WI.BoxShadow.parseNumberComponent(this._offsetXInput.value),
        });
    }

    _handleOffsetXInputKeyDown(event)
    {
        let shift = this._determineShiftForEvent(event);
        if (isNaN(shift))
            return;

        this._updateBoxShadow({
            offsetX: {
                value: (this._boxShadow.offsetX.value + shift).maxDecimals(1),
                unit: this._boxShadow.offsetX.unit,
            },
        });
    }

    _handleOffsetYInputInput(event)
    {
        this._updateBoxShadow({
            offsetY: WI.BoxShadow.parseNumberComponent(this._offsetYInput.value),
        });
    }

    _handleOffsetYInputKeyDown(event)
    {
        let shift = this._determineShiftForEvent(event);
        if (isNaN(shift))
            return;

        this._updateBoxShadow({
            offsetY: {
                value: (this._boxShadow.offsetY.value + shift).maxDecimals(1),
                unit: this._boxShadow.offsetY.unit,
            },
        });
    }

    _handleBlurRadiusInputInput(event)
    {
        this._updateBoxShadow({
            blurRadius: WI.BoxShadow.parseNumberComponent(this._blurRadiusInput.value),
        });
    }

    _handleBlurRadiusInputKeyDown(event)
    {
        let shift = this._determineShiftForEvent(event);
        if (isNaN(shift))
            return;

        this._updateBoxShadow({
            blurRadius: {
                value: (this._boxShadow.blurRadius.value + shift).maxDecimals(1),
                unit: this._boxShadow.blurRadius.unit,
            }
        });
    }

    _handleBlurRadiusSliderInput(event)
    {
        this._updateBoxShadow({
            blurRadius: {
                value: this._blurRadiusSlider.valueAsNumber,
                unit: this._boxShadow.blurRadius.unit,
            }
        });
    }

    _handleSpreadRadiusInputInput(event)
    {
        this._updateBoxShadow({
            spreadRadius: WI.BoxShadow.parseNumberComponent(this._spreadRadiusInput.value),
        });
    }

    _handleSpreadRadiusInputKeyDown(event)
    {
        let shift = this._determineShiftForEvent(event);
        if (isNaN(shift))
            return;

        this._updateBoxShadow({
            spreadRadius: {
                value: (this._boxShadow.spreadRadius.value + shift).maxDecimals(1),
                unit: this._boxShadow.spreadRadius.unit,
            }
        });
    }

    _handleSpreadRadiusSliderInput(event)
    {
        this._updateBoxShadow({
            spreadRadius: {
                value: this._spreadRadiusSlider.valueAsNumber,
                unit: this._boxShadow.spreadRadius.unit,
            }
        });
    }

    _handleInsetCheckboxChange(event)
    {
        this._updateBoxShadow({
            inset: !!this._insetCheckbox.checked,
        });
    }

    _handleColorChanged(event)
    {
        this._updateBoxShadow({
            color: this._colorPicker.color,
        });
    }
};

WI.BoxShadowEditor.Event = {
    BoxShadowChanged: "box-shadow-editor-box-shadow-changed"
};
