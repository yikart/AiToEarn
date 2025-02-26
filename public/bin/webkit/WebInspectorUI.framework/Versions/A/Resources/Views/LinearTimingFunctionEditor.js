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

WI.LinearTimingFunctionEditor = class LinearTimingFunctionEditor extends WI.Object
{
    constructor()
    {
        super();

        this._boundUpdateLinearTimingFunction = this._updateLinearTimingFunction.bind(this);

        this._element = document.createElement("div");
        this._element.classList.add("linear-timing-function-editor");
        this._element.dir = "ltr";

        const strokeWidth = 2; // Keep in sync with `.linear-timing-function-editor > svg path`.
        const margin = 5; // Keep in sync with `.linear-timing-function-editor > .preview`.
        const indent = 11 - margin + 4 - (strokeWidth / 2); // Keep in sync with .linear-timing-function-editor > .timing`.
        const editorWidth = 200 - (margin * 2); // Keep in sync with `.linear-timing-function-editor` and `.linear-timing-function-editor > svg`.
        const editorHeight = editorWidth - (indent * 2);
        this._previewWidth = editorWidth - (indent * 2) - strokeWidth;
        this._previewHeight = editorHeight - strokeWidth;

        this._previewContainer = this._element.appendChild(document.createElement("div"))
        this._previewContainer.classList.add("preview");
        this._previewContainer.title = WI.UIString("Restart animation");
        this._previewContainer.addEventListener("mousedown", this._resetPreviewAnimation.bind(this));

        this._previewElement = this._previewContainer.appendChild(document.createElement("div"));

        this._timingElement = this._element.appendChild(document.createElement("div"))
        this._timingElement.classList.add("timing");

        let pathContainer = this._element.appendChild(createSVGElement("svg"));
        pathContainer.setAttribute("width", editorWidth);
        pathContainer.setAttribute("height", editorHeight);

        let svgGroup = pathContainer.appendChild(createSVGElement("g"));
        svgGroup.setAttribute("transform", `translate(${indent + (strokeWidth / 2)}, ${strokeWidth / 2})`);

        this._pathElement = svgGroup.appendChild(createSVGElement("path"));

        let pointsContainer = this._element.appendChild(document.createElement("div"))
        pointsContainer.classList.add("points");

        let pointsTable = pointsContainer.appendChild(document.createElement("table"));

        let pointsTableHeader = pointsTable.appendChild(document.createElement("thead"));

        let pointsTableHeaderRow = pointsTableHeader.appendChild(document.createElement("tr"));

        let pointsTableValueHeader = pointsTableHeaderRow.appendChild(document.createElement("th"));
        pointsTableValueHeader.textContent = WI.UIString("Value");

        let pointsTableProgressHeader = pointsTableHeaderRow.appendChild(document.createElement("th"));
        pointsTableProgressHeader.textContent = WI.UIString("% Progress");

        this._pointsTableBody = pointsTable.appendChild(document.createElement("tbody"));

        let pointsTableFooter = pointsTable.appendChild(document.createElement("tfoot"));

        let pointsTableActionsRow = pointsTableFooter.appendChild(document.createElement("tr"));

        let pointsTableActionCell = pointsTableActionsRow.appendChild(document.createElement("td"));
        pointsTableActionCell.colSpan = pointsTableHeaderRow.children.length;

        let addPointButton = pointsTableActionCell.appendChild(document.createElement("button"));
        addPointButton.textContent = WI.UIString("Add");
        addPointButton.addEventListener("click", this._handleAddPointButtonClick.bind(this));

        this._pointInputs = [];
    }

    // Public

    get element() { return this._element; }

    set linearTimingFunction(linearTimingFunction)
    {
        if (!linearTimingFunction)
            return;

        let isLinear = linearTimingFunction instanceof WI.LinearTimingFunction;
        console.assert(isLinear);
        if (!isLinear)
            return;

        this._linearTimingFunction = linearTimingFunction;

        this._updatePreview();
        this._updatePointsTable();
    }

    get linearTimingFunction()
    {
        return this._linearTimingFunction;
    }

    // Private

    _updateLinearTimingFunction()
    {
        let points = [];
        for (let {pointValueInput, pointProgressInput} of this._pointInputs) {
            let value = pointValueInput.valueAsNumber;
            if (isNaN(value))
                continue;

            let progress = pointProgressInput.valueAsNumber / 100;
            if (isNaN(progress))
                continue;

            points.push(new WI.LinearTimingFunction.Point(value, progress));
        }
        if (points.length < 2)
            return;
        this._linearTimingFunction = new WI.LinearTimingFunction(points);

        this._updatePreview();

        this.dispatchEventToListeners(WI.LinearTimingFunctionEditor.Event.LinearTimingFunctionChanged, {linearTimingFunction: this._linearTimingFunction});
    }

    _updatePreview()
    {
        let path = [];
        for (let point of this._linearTimingFunction.points)
            path.push("L", this._previewWidth * point.progress, this._previewHeight - (this._previewHeight * point.value));
        this._pathElement.setAttribute("d", `M 0 ${this._previewHeight} ${path.join(" ")} L ${this._previewWidth} 0`);

        this._triggerPreviewAnimation();
    }

    _triggerPreviewAnimation()
    {
        this._previewElement.style.animationTimingFunction = this._linearTimingFunction.toString();
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

    _updatePointsTable()
    {
        let rowCount = this._pointsTableBody.children.length;

        this._pointsTableBody.removeChildren();

        this._pointInputs = this._linearTimingFunction.points.map((point) => this._createPointInputs(point));

        if (rowCount !== this._pointsTableBody.children.length)
            this.dispatchEventToListeners(WI.LinearTimingFunctionEditor.Event.PointsChanged);
    }

    _createPointInputs(point)
    {
        let pointRow = this._pointsTableBody.appendChild(document.createElement("tr"));

        let pointValueCell = pointRow.appendChild(document.createElement("td"));

        let pointValueInput = pointValueCell.appendChild(document.createElement("input"));
        pointValueInput.type = "number";
        pointValueInput.step = 0.01;
        pointValueInput.value = point.value;
        pointValueInput.addEventListener("input", this._boundUpdateLinearTimingFunction);

        let pointProgressCell = pointRow.appendChild(document.createElement("td"));

        let pointProgressInput = pointProgressCell.appendChild(document.createElement("input"));
        pointProgressInput.type = "number";
        pointProgressInput.step = 1;
        pointProgressInput.value = point.progress * 100;
        pointProgressInput.addEventListener("input", this._boundUpdateLinearTimingFunction);

        return {pointValueInput, pointProgressInput};
    }

    _handleAddPointButtonClick(event)
    {
        let pointInputs = this._createPointInputs(new WI.LinearTimingFunction.Point(1, 1));
        pointInputs.pointValueInput.select();

        this._pointInputs.push(pointInputs);
        this.dispatchEventToListeners(WI.LinearTimingFunctionEditor.Event.PointsChanged);

        this._updateLinearTimingFunction();
    }
};

WI.LinearTimingFunctionEditor.Event = {
    LinearTimingFunctionChanged: "linear-timing-function-editor-linear-timing-function-changed",
    PointsChanged: "linear-timing-function-editor-points-changed",
};
