/*
 * Copyright (C) 2016 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.SpringTimingFunctionEditor = class SpringTimingFunctionEditor extends WI.Object
{
    constructor()
    {
        super();

        let boundResetPreviewAnimation = (event) => {
            this._resetPreviewAnimation(event);
        };

        this._element = document.createElement("div");
        this._element.classList.add("spring-timing-function-editor");

        this._previewContainer = this._element.createChild("div", "preview");
        this._previewContainer.title = WI.UIString("Restart animation");
        this._previewContainer.addEventListener("mousedown", boundResetPreviewAnimation);

        this._previewElement = this._previewContainer.createChild("div");
        this._previewElement.addEventListener("transitionend", boundResetPreviewAnimation);

        this._timingContainer = this._element.createChild("div", "timing");

        this._timingElement = this._timingContainer.createChild("div");

        this._numberInputContainer = this._element.createChild("div", "number-input-container");

        function createInputsForParameter(id, title)
        {
            let row = this._numberInputContainer.createChild("div", `number-input-row ${id}`);

            row.createChild("div", "number-input-row-title").textContent = title;

            let sliderKey = `_${id}Slider`;
            this[sliderKey] = row.createChild("input");
            this[sliderKey].type = "range";
            this[sliderKey].addEventListener("input", this._handleNumberSliderInput.bind(this));
            this[sliderKey].addEventListener("mousedown", this._handleNumberSliderMousedown.bind(this));
            this[sliderKey].addEventListener("mouseup", this._handleNumberSliderMouseup.bind(this));

            let inputKey = `_${id}Input`;
            this[inputKey] = row.createChild("input");
            this[inputKey].type = "number";
            this[inputKey].addEventListener("input", this._handleNumberInputInput.bind(this));
            this[inputKey].addEventListener("keydown", this._handleNumberInputKeydown.bind(this));
        }

        createInputsForParameter.call(this, "mass", WI.UIString("Mass"));
        this._massInput.min = this._massSlider.min = 1;

        createInputsForParameter.call(this, "stiffness", WI.UIString("Stiffness"));
        this._stiffnessInput.min = this._stiffnessSlider.min = 1;

        createInputsForParameter.call(this, "damping", WI.UIString("Damping"));
        this._dampingInput.min = this._dampingSlider.min = 0;

        createInputsForParameter.call(this, "initialVelocity", WI.UIString("Initial Velocity"));

        this._springTimingFunction = new WI.SpringTimingFunction(1, 100, 10, 0);
    }

    // Public

    get element()
    {
        return this._element;
    }

    get springTimingFunction()
    {
        return this._springTimingFunction;
    }

    set springTimingFunction(springTimingFunction)
    {
        if (!springTimingFunction)
            return;

        let isSpringTimingFunction = springTimingFunction instanceof WI.SpringTimingFunction;
        console.assert(isSpringTimingFunction);
        if (!isSpringTimingFunction)
            return;

        this._springTimingFunction = springTimingFunction;
        this._massInput.value = this._massSlider.value = this._springTimingFunction.mass;
        this._stiffnessInput.value = this._stiffnessSlider.value = this._springTimingFunction.stiffness;
        this._dampingInput.value = this._dampingSlider.value = this._springTimingFunction.damping;
        this._initialVelocityInput.value = this._initialVelocitySlider.value = this._springTimingFunction.initialVelocity;
        this._resetPreviewAnimation();
    }

    // Private

    _handleNumberInputInput(event)
    {
        this._changeSpringForInput(event.target, event.target.value);
    }

    _handleNumberInputKeydown(event)
    {
        let shift = 0;
        if (event.keyIdentifier === "Up")
            shift = 1;
         else if (event.keyIdentifier === "Down")
            shift = -1;

        if (!shift)
            return;

        if (event.shiftKey)
            shift *= 10;
        else if (event.altKey)
            shift /= 10;

        let value = parseFloat(event.target.value) || 0;
        this._changeSpringForInput(event.target, value + shift);

        event.preventDefault();
    }

    _handleNumberSliderInput(event)
    {
        this._changeSpringForInput(event.target, event.target.value);
    }

    _handleNumberSliderMousedown(event)
    {
        this._changeSpringForInput(event.target, event.target.value);
    }

    _handleNumberSliderMouseup(event)
    {
        this._changeSpringForInput(event.target, event.target.value);
    }

    _changeSpringForInput(target, value)
    {
        value = parseFloat(value) || 0;

        switch (target) {
        case this._massInput:
        case this._massSlider:
            if (this._springTimingFunction.mass === value)
                return;

            this._springTimingFunction.mass = Math.max(1, value);
            this._massInput.value = this._massSlider.value = this._springTimingFunction.mass.maxDecimals(3);
            break;
        case this._stiffnessInput:
        case this._stiffnessSlider:
            if (this._springTimingFunction.stiffness === value)
                return;

            this._springTimingFunction.stiffness = Math.max(1, value);
            this._stiffnessInput.value = this._stiffnessSlider.value = this._springTimingFunction.stiffness.maxDecimals(3);
            break;
        case this._dampingInput:
        case this._dampingSlider:
            if (this._springTimingFunction.damping === value)
                return;

            this._springTimingFunction.damping = Math.max(0, value);
            this._dampingInput.value = this._dampingSlider.value = this._springTimingFunction.damping.maxDecimals(3);
            break;
        case this._initialVelocityInput:
        case this._initialVelocitySlider:
            if (this._springTimingFunction.initialVelocity === value)
                return;

            this._springTimingFunction.initialVelocity = value;
            this._initialVelocityInput.value = this._initialVelocitySlider.value = this._springTimingFunction.initialVelocity.maxDecimals(3);
            break;
        default:
            WI.reportInternalError("Input event fired for unrecognized element");
            return;
        }

        this.dispatchEventToListeners(WI.SpringTimingFunctionEditor.Event.SpringTimingFunctionChanged, {springTimingFunction: this._springTimingFunction});

        this._resetPreviewAnimation();
    }

    _resetPreviewAnimation(event)
    {
        this._previewContainer.classList.remove("animate");
        this._previewElement.style.transitionTimingFunction = null;
        this._previewElement.style.transform = null;

        this._timingContainer.classList.remove("animate");
        this._timingElement.style.transform = null;

        // Only reset the duration text when a spring parameter is changed.
        if (!event)
            this._timingContainer.dataset.duration = "0";

        this._updatePreviewAnimation(event);
    }

    _updatePreviewAnimation(event)
    {
        this._previewContainer.classList.add("animate");
        this._previewElement.style.transitionTimingFunction = this._springTimingFunction.toString();

        this._timingContainer.classList.add("animate");

        if (WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL) {
            this._previewElement.style.transform = "translateX(-85px)";
            this._timingElement.style.transform = "translateX(-170px)";
        } else {
            this._previewElement.style.transform = "translateX(85px)";
            this._timingElement.style.transform = "translateX(170px)";
        }

        // Only calculate the duration when a spring parameter is changed.
        if (!event) {
            let duration = this._springTimingFunction.calculateDuration();

            this._timingContainer.dataset.duration = duration.toFixed(2);
            this._timingElement.style.transitionDuration = `${duration}s`;

            this._previewElement.style.transitionDuration = `${duration}s`;
        }
    }
};

WI.SpringTimingFunctionEditor.Event = {
    SpringTimingFunctionChanged: "spring-timing-function-editor-spring-timing-function-changed"
};
