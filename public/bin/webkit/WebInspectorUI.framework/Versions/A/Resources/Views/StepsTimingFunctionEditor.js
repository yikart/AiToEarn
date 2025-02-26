/*
 * Copyright (C) 2023 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.StepsTimingFunctionEditor = class StepsTimingFunctionEditor extends WI.Object
{
    constructor()
    {
        super();

        this._element = document.createElement("div");
        this._element.classList.add("steps-timing-function-editor");
        this._element.dir = "ltr";

        const width = 190;
        this._element.style.setProperty("--steps-timing-function-editor-width", width + "px");

        const inlineMargin = 5;
        this._element.style.setProperty("--steps-timing-function-editor-inline-margin", inlineMargin + "px");

        const timingSize = 4;
        this._element.style.setProperty("--steps-timing-function-editor-timing-size", timingSize + "px");

        const timingInlineMargin = 11;
        this._element.style.setProperty("--steps-timing-function-editor-timing-inline-margin", timingInlineMargin + "px");

        const strokeWidth = 2;
        this._element.style.setProperty("--steps-timing-function-editor-stroke-width", strokeWidth + "px");

        const indent = timingInlineMargin + timingSize - inlineMargin - (strokeWidth / 2);
        const height = width - (indent * 2);
        this._previewWidth = width - (indent * 2) - strokeWidth;
        this._previewHeight = height - strokeWidth;

        this._previewContainer = this._element.appendChild(document.createElement("div"))
        this._previewContainer.classList.add("preview");
        this._previewContainer.title = WI.UIString("Restart animation");
        this._previewContainer.addEventListener("mousedown", this._resetPreviewAnimation.bind(this));

        this._previewElement = this._previewContainer.appendChild(document.createElement("div"));

        this._timingElement = this._element.appendChild(document.createElement("div"))
        this._timingElement.classList.add("timing");

        let pathContainer = this._element.appendChild(createSVGElement("svg"));
        pathContainer.setAttribute("width", width);
        pathContainer.setAttribute("height", height);

        let svgGroup = pathContainer.appendChild(createSVGElement("g"));
        svgGroup.setAttribute("transform", `translate(${indent + (strokeWidth / 2)}, ${strokeWidth / 2})`);

        this._pathElement = svgGroup.appendChild(createSVGElement("path"));

        let parameterEditorsContainer = this._element.appendChild(document.createElement("div"))
        parameterEditorsContainer.classList.add("parameter-editors");

        this._typeSelectElement = parameterEditorsContainer.appendChild(document.createElement("select"));
        this._typeSelectElement.addEventListener("change", this._handleTypeSelectElementChanged.bind(this));

        let createTypeSelectOption = (type, label) => {
            let optionElement = this._typeSelectElement.appendChild(document.createElement("option"));
            optionElement.value = type;
            optionElement.label = label;
        };
        createTypeSelectOption(WI.StepsTimingFunction.Type.JumpStart, WI.unlocalizedString("jump-start"));
        createTypeSelectOption(WI.StepsTimingFunction.Type.JumpEnd, WI.unlocalizedString("jump-end"));
        createTypeSelectOption(WI.StepsTimingFunction.Type.JumpNone, WI.unlocalizedString("jump-none"));
        createTypeSelectOption(WI.StepsTimingFunction.Type.JumpBoth, WI.unlocalizedString("jump-both"));
        createTypeSelectOption(WI.StepsTimingFunction.Type.Start, WI.unlocalizedString("start"));
        createTypeSelectOption(WI.StepsTimingFunction.Type.End, WI.unlocalizedString("end"));

        this._countInputElement = parameterEditorsContainer.appendChild(document.createElement("input"));
        this._countInputElement.type = "number";
        this._countInputElement.min = 1;
        this._countInputElement.addEventListener("input", this._handleCountInputElementInput.bind(this));
    }

    // Public

    get element() { return this._element; }

    set stepsTimingFunction(stepsTimingFunction)
    {
        if (!stepsTimingFunction)
            return;

        let isSteps = stepsTimingFunction instanceof WI.StepsTimingFunction;
        console.assert(isSteps);
        if (!isSteps)
            return;

        this._stepsTimingFunction = stepsTimingFunction;

        this._typeSelectElement.value = this._stepsTimingFunction.type;
        this._countInputElement.value = this._stepsTimingFunction.count;

        this._updatePreview();
    }

    get stepsTimingFunction()
    {
        return this._stepsTimingFunction;
    }

    // Private

    _updateStepsTimingFunction()
    {
        let count = this._countInputElement.valueAsNumber;
        if (count <= 0 || isNaN(count))
            return;

        let type = this._typeSelectElement.value;
        console.assert(Object.values(WI.StepsTimingFunction.Type).includes(type), type);

        this._stepsTimingFunction = new WI.StepsTimingFunction(type, count);

        this._updatePreview();

        this.dispatchEventToListeners(WI.StepsTimingFunctionEditor.Event.StepsTimingFunctionChanged, {stepsTimingFunction: this._stepsTimingFunction});
    }

    _updatePreview()
    {
        let goUpFirst = false;
        let stepStartAdjust = 0;
        let stepCountAdjust = 0;

        switch (this._stepsTimingFunction.type) {
        case WI.StepsTimingFunction.Type.JumpStart:
        case WI.StepsTimingFunction.Type.Start:
            goUpFirst = true;
            break;

        case WI.StepsTimingFunction.Type.JumpNone:
            --stepCountAdjust;
            break;

        case WI.StepsTimingFunction.Type.JumpBoth:
            ++stepStartAdjust;
            ++stepCountAdjust;
            break;
        }

        let stepCount = this._stepsTimingFunction.count + stepCountAdjust;
        let stepX = this._previewWidth / this._stepsTimingFunction.count; // Always use the defined number of steps to divide the duration.
        let stepY = this._previewHeight / stepCount;

        let path = [];
        for (let i = stepStartAdjust; i <= stepCount; ++i) {
            let x = stepX * (i - stepStartAdjust);
            let y = this._previewHeight - (stepY * i);

            if (goUpFirst) {
                if (i)
                    path.push("H", x);

                if (i < stepCount)
                    path.push("V", y - stepY);
            } else {
                path.push("V", y);

                if (i < stepCount || stepCountAdjust < 0)
                    path.push("H", x + stepX);
            }
        }
        this._pathElement.setAttribute("d", `M 0 ${this._previewHeight} ${path.join(" ")} L ${this._previewWidth} 0`);

        this._triggerPreviewAnimation();
    }

    _triggerPreviewAnimation()
    {
        this._previewElement.style.animationTimingFunction = this._stepsTimingFunction.toString();
        this._previewContainer.classList.add("animate");
        this._timingElement.classList.add("animate");
    }

    _resetPreviewAnimation()
    {
        let parent = this._previewElement.parentNode;
        parent.removeChild(this._previewElement);
        parent.appendChild(this._previewElement);

        this._element.removeChild(this._timingElement);
        this._element.appendChild(this._timingElement);
    }

    _handleTypeSelectElementChanged(event)
    {
        this._updateStepsTimingFunction();
    }

    _handleCountInputElementInput(event)
    {
        this._updateStepsTimingFunction();
    }
};

WI.StepsTimingFunctionEditor.Event = {
    StepsTimingFunctionChanged: "steps-timing-function-editor-steps-timing-function-changed"
};
