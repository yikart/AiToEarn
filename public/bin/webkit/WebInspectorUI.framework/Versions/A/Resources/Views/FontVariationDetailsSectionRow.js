/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

WI.FontVariationDetailsSectionRow = class FontVariationDetailsSectionRow extends WI.DetailsSectionRow
{
    constructor(fontVariationAxis, abortSignal)
    {
        super();

        this.element.classList.add("font-variation");

        let {name, tag, value, defaultValue, minimumValue, maximumValue} = fontVariationAxis;

        this._tag = tag;
        this._minimumValue = minimumValue;
        this._maximumValue = maximumValue;
        this._step = this._getAxisResolution();

        this._labelElement = this.element.appendChild(document.createElement("div"));
        this._labelElement.className = "label";

        this._tagElement = this.element.appendChild(document.createElement("div"));
        this._tagElement.className = "tag";
        this._tagElement.textContent = this._tag;
        this._tagElement.tooltip = WI.UIString("Variation axis tag", "Tag tooltip @ Font Details Sidebar", "Tooltip for a variation axis tag that explains what the 4-character label represents.");

        this._variationRangeElement = this.element.appendChild(document.createElement("div"));
        this._variationRangeElement.className = "variation-range";

        this._valueSliderElement = this._variationRangeElement.appendChild(document.createElement("input"));
        this._valueSliderElement.type = "range";
        this._valueSliderElement.name = tag;
        this._valueSliderElement.min = minimumValue;
        this._valueSliderElement.max = maximumValue;
        this._valueSliderElement.step = this._step;

        this._variationMinValueElement = this._variationRangeElement.appendChild(document.createElement("div"));
        this._variationMinValueElement.className = "variation-minvalue";
        this._variationMinValueElement.textContent = this._formatAxisValueAsString(minimumValue);
        this._variationMinValueElement.tooltip = WI.UIString("Minimum value of variation axis", "Min axis value @ Font Details Sidebar");

        this._variationMaxValueElement = this._variationRangeElement.appendChild(document.createElement("div"));
        this._variationMaxValueElement.className = "variation-maxvalue";
        this._variationMaxValueElement.textContent = this._formatAxisValueAsString(maximumValue);
        this._variationMinValueElement.tooltip = WI.UIString("Maximum value of variation axis", "Max axis value @ Font Details Sidebar");

        this._valueTextFieldElement = this.element.appendChild(document.createElement("input"));
        this._valueTextFieldElement.type = "text";
        this._valueTextFieldElement.name = tag;
        this._valueTextFieldElement.className = "value";

        this._valueTextFieldElement.addEventListener("keydown", this._handleValueTextFieldKeydown.bind(this), {signal: abortSignal});
        this._valueTextFieldElement.addEventListener("input", this._handleValueTextFieldInput.bind(this), {signal: abortSignal});
        this._valueTextFieldElement.addEventListener("blur", this._handleValueTextFieldBlur.bind(this), {signal: abortSignal});
        this._valueSliderElement.addEventListener("input", this._handleValueSliderInput.bind(this), {signal: abortSignal});

        this.label = name;
        this.value = value ?? defaultValue;

        this._defaultValue = defaultValue;
        this._hasValidValue = true;
        this._skipUpdatingInputValue = false;
    }

    // Public

    get tag()
    {
        return this._tag;
    }

    set tag(value)
    {
        this._tag = value;
        this._tagElement.textContent = value;
    }

    get label()
    {
        return this._label;
    }

    set label(label)
    {
        this._label = label || "";

        if (this._label instanceof Node) {
            this._labelElement.removeChildren();
            this._labelElement.appendChild(this._label);
        } else
            this._labelElement.textContent = this._label;
    }

    get value()
    {
        return this._value;
    }

    set value(value)
    {
        this._value = value ?? this._defaultValue;

        this._valueSliderElement.value = this._value;

        // Allow an invalid value in the text field while the user is editing.
        if (!this._hasValidValue && window.document.activeElement === this._valueTextFieldElement)
            return;

        this._valueTextFieldElement.value = this._formatAxisValueAsString(this._value);
        this._hasValidValue = this._minimumValue <= this._value && this._value <= this._maximumValue;
        this._showValidity();
    }

    // Private

    _formatAxisValueAsString(value)
    {
        const options = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            useGrouping: false,
        }
        return value.toLocaleString(undefined, options);
    }

    _getAxisResolution()
    {
        // The `ital` variation axis acts as an on/off toggle (0 = off, 1 = on).
        if (this._tag === "ital" && this._minimumValue === 0 && this._maximumValue === 1)
            return 1;

        let delta = this._maximumValue - this._minimumValue;
        if (delta <= 1)
            return 0.01;

        if (delta <= 10)
            return 0.1;

        return 1;
    }

    _showValidity()
    {
        if (!this._hasValidValue)
            this.warningMessage = WI.UIString("Axis value outside of supported range: %s – %s", "A warning that is shown in the Font Details Sidebar when the value for a variation axis is outside of the supported range of values").format(this._formatAxisValueAsString(this._minimumValue), this._formatAxisValueAsString(this._maximumValue));
        else
            this.warningMessage = null;
    }

    _handleValueTextFieldBlur(event)
    {
        this.value = this._value;
    }

    _handleValueTextFieldInput(event)
    {
        let valueAsString = event.target.value;
        let valueAsNumber = parseFloat(event.target.value);

        if (!/^\-?\d+(\.\d+)?$/.test(valueAsString)) {
            this._hasValidValue = false;

            // Don't warn when preparing to type a new value or starting to type a negative number.
            if (valueAsString !== "" || valueAsString !== "-")
                this._showValidity();

            this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: this._defaultValue});
            return;
        }

        if (valueAsNumber < this._minimumValue || valueAsNumber > this._maximumValue) {
            this._hasValidValue = false;

            this._showValidity();
            this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: Number.constrain(valueAsNumber, this._minimumValue, this._maximumValue)});
            return;
        }

        this._hasValidValue = true;
        this.value = valueAsNumber;

        this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: valueAsNumber});
    }

    _handleValueTextFieldKeydown(event)
    {
        // The value field is a text input but is treated as a number input.
        if (event.key.length === 1 && !/[0-9\.\-]/.test(event.key)) {
            event.preventDefault();
            return;
        }

        let valueAsNumber = parseFloat(event.target.value);
        let step = this._step;

        if (isNaN(valueAsNumber))
            return;

        if (event.shiftKey && event.altKey)
            step = this._step;
        else if (event.shiftKey)
            step = this._step * 10;
        else if (event.altKey)
            step = this._step / 10;

        if (event.key === "ArrowUp") {
            this.value = Number.constrain(valueAsNumber + step, this._minimumValue, this._maximumValue);
            this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: this.value});
            event.preventDefault();
        }

        if (event.key === "ArrowDown") {
            this.value = Number.constrain(valueAsNumber - step, this._minimumValue, this._maximumValue);
            this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: this.value});
            event.preventDefault();
        }
    }

    _handleValueSliderInput(event)
    {
        this.value = event.target.valueAsNumber;
        this.dispatchEventToListeners(WI.FontVariationDetailsSectionRow.Event.VariationValueChanged, {tag: this._tag, value: this._value});
    }
};

WI.FontVariationDetailsSectionRow.Event = {
    VariationValueChanged: "font-variation-value-changed",
};
