/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

// CircleChart creates a donut/pie chart of colored sections.
//
// Initialize the chart with a size and inner radius to get a blank chart.
// To populate with data, first initialize the segments. The class names you
// provide for the segments will allow you to style them. You can then update
// the chart with new values (in the same order as the segments) at any time.
//
// SVG:
//
// - There is a single background path for the background.
// - There is a path for each segment.
// - If you want to put something inside the middle of the chart you can use `centerElement`.
//
//  <div class="circle-chart">
//      <svg width="120" height="120" viewBox="0 0 120 120">
//          <path class="background" d="..."/>
//          <path class="segment segment-class-name-1" d="..."/>
//          <path class="segment segment-class-name-2" d="..."/>
//          ...
//      </svg>
//      <div class="center"></div>
//  </div>

WI.CircleChart = class CircleChart extends WI.View
{
    constructor({size, innerRadiusRatio})
    {
        super();

        this._data = [];
        this._size = size;
        this._radius = (size / 2) - 1;
        this._innerRadius = innerRadiusRatio ? Math.floor(this._radius * innerRadiusRatio) : 0;

        this.element.classList.add("circle-chart");

        this._chartElement = this.element.appendChild(createSVGElement("svg"));
        this._chartElement.setAttribute("width", size);
        this._chartElement.setAttribute("height", size);
        this._chartElement.setAttribute("viewBox", `0 0 ${size} ${size}`);

        this._pathElements = [];
        this._values = [];
        this._total = 0;

        let backgroundPath = this._chartElement.appendChild(createSVGElement("path"));
        backgroundPath.setAttribute("d", this._createCompleteCirclePathData(this._size / 2, this._radius, this._innerRadius));
        backgroundPath.classList.add("background");
    }

    // Public

    get size() { return this._size; }

    get centerElement()
    {
        if (!this._centerElement) {
            this._centerElement = this.element.appendChild(document.createElement("div"));
            this._centerElement.classList.add("center");
            this._centerElement.style.width = this._centerElement.style.height = this._radius + "px";
            this._centerElement.style.top = this._centerElement.style.left = (this._radius - this._innerRadius) + "px";
        }

        return this._centerElement;
    }

    get segments()
    {
        return this._segments;
    }

    set segments(segmentClassNames)
    {
        for (let pathElement of this._pathElements)
            pathElement.remove();

        this._pathElements = [];

        for (let className of segmentClassNames) {
            let pathElement = this._chartElement.appendChild(createSVGElement("path"));
            pathElement.classList.add("segment", className);
            this._pathElements.push(pathElement);
        }
    }

    get values()
    {
        return this._values;
    }

    set values(values)
    {
        console.assert(!values.length || values.length === this._pathElements.length, "Should have the same number of values as segments");

        this._values = values;
        this._total = 0;

        for (let value of values)
            this._total += value;
    }

    clear()
    {
        this.values = new Array(this._values.length).fill(0);
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        if (!this._values.length)
            return;

        const center = this._size / 2;
        let startAngle = -Math.PI / 2;
        let endAngle = 0;

        for (let i = 0; i < this._values.length; ++i) {
            let value = this._values[i];
            let pathElement = this._pathElements[i];

            if (value === 0)
                pathElement.removeAttribute("d");
            else if (value === this._total)
                pathElement.setAttribute("d", this._createCompleteCirclePathData(center, this._radius, this._innerRadius));
            else {
                let angle = (value / this._total) * Math.PI * 2;
                endAngle = startAngle + angle;

                pathElement.setAttribute("d", this._createSegmentPathData(center, startAngle, endAngle, this._radius, this._innerRadius));
                startAngle = endAngle;
            }
        }
    }

    // Private

    _createCompleteCirclePathData(c, r1, r2)
    {
        const a1 = 0;
        const a2 = Math.PI * 1.9999;
        let x1 = c + Math.cos(a1) * r1,
            y1 = c + Math.sin(a1) * r1,
            x2 = c + Math.cos(a2) * r1,
            y2 = c + Math.sin(a2) * r1,
            x3 = c + Math.cos(a2) * r2,
            y3 = c + Math.sin(a2) * r2,
            x4 = c + Math.cos(a1) * r2,
            y4 = c + Math.sin(a1) * r2;
        return [
            "M", x1, y1,                    // Starting position.
            "A", r1, r1, 0, 1, 1, x2, y2,   // Draw outer arc.
            "Z",                            // Close path.
            "M", x3, y3,                    // Starting position.
            "A", r2, r2, 0, 1, 0, x4, y4,   // Draw inner arc.
            "Z"                             // Close path.
        ].join(" ");
    }

    _createSegmentPathData(c, a1, a2, r1, r2)
    {
        const largeArcFlag = ((a2 - a1) % (Math.PI * 2)) > Math.PI ? 1 : 0;
        let x1 = c + Math.cos(a1) * r1,
            y1 = c + Math.sin(a1) * r1,
            x2 = c + Math.cos(a2) * r1,
            y2 = c + Math.sin(a2) * r1,
            x3 = c + Math.cos(a2) * r2,
            y3 = c + Math.sin(a2) * r2,
            x4 = c + Math.cos(a1) * r2,
            y4 = c + Math.sin(a1) * r2;
        return [
            "M", x1, y1,                                // Starting position.
            "A", r1, r1, 0, largeArcFlag, 1, x2, y2,    // Draw outer arc.
            "L", x3, y3,                                // Connect outer and inner arcs.
            "A", r2, r2, 0, largeArcFlag, 0, x4, y4,    // Draw inner arc.
            "Z"                                         // Close path.
        ].join(" ");
    }
};
