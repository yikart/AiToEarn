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

// GaugeChart creates a semi-circle gauge chart with colored segments.
//
// Initialize the chart with a semi-circle height, stroke width, and segments.
// The class names you provide for the segments will allow you to style them
// and the limit (0 - 100) is the upper percentage value where that segment
// ends. You can update the chart with new current needle value at any time.
//
// SVG:
//
// - There is a path for each segment. Note there is a small includes a
//   buffer between segments, so they should be more than a few # apart.
// - There is a single polygon for the needle value.
//
//  <div class="gauge-chart">
//      <svg width="204" height="110" viewBox="0 0 204 110">
//          <path class="segment segment-class-name-1" d="..."/>
//          <path class="segment segment-class-name-2" d="..."/>
//          ...
//          <polygon class="needle" points="..."/>
//      </svg>
//  </div>

WI.GaugeChart = class GaugeChart extends WI.View
{
    constructor({height, strokeWidth, segments})
    {
        super();

        strokeWidth = strokeWidth || 10;

        this._needleValue = null;

        const needleOverhangSpace = 10; // Distance the needle goes past the outer circle edge.
        const needleUnderhangSpace = 8; // Space allowed beneath the graph so a horizontal needle lines up.

        this._center = height - needleUnderhangSpace;
        this._radius = height - needleUnderhangSpace - needleOverhangSpace - 1;
        this._innerRadius = Math.floor(this._radius - strokeWidth);

        let width = (this._radius + needleOverhangSpace + 1) * 2;
        this._size = new WI.Size(width, height);

        console.assert(!this._segments, "Set segments only once");
        console.assert(segments.length >= 1, "Need at least one segment");
        console.assert(this._validateSegments(segments));

        this._segments = segments;

        this.element.classList.add("gauge-chart");

        this._chartElement = this.element.appendChild(createSVGElement("svg"));
        this._chartElement.setAttribute("width", width);
        this._chartElement.setAttribute("height", height);
        this._chartElement.setAttribute("viewBox", `0 0 ${width} ${height}`);

        this._needleElement = null;
    }

    // Public

    get size() { return this._size; }
    get segments() { return this._segments; }

    get value()
    {
        return this._needleValue;
    }

    set value(value)
    {
        console.assert(value >= 0 && value <= 100, "value should be between 0 and 100.", value);

        this._needleValue = value;
    }

    clear()
    {
        this._needleValue = null;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let startAngle = Math.PI;

        const onePercentAngle = Math.PI / 100;

        for (let {className, limit} of this._segments) {
            let offset = limit === 100 ? 0 : 1;
            let endAngle = Math.PI + (((limit - offset) / 100) * Math.PI);

            let pathElement = this._chartElement.appendChild(createSVGElement("path"));
            pathElement.classList.add("segment", className);
            pathElement.setAttribute("d", this._createSegmentPathData(this._center, startAngle, endAngle, this._radius, this._innerRadius));

            startAngle = endAngle + onePercentAngle;
        }

        const needlePointExtraDraw = 0.5; // Draw a fat tip to the needle.
        const needleBaseExtraDraw = 4.5; // Draw a fat base to the needle.
        const needleUnderhangDraw = 6; // Draw the needle underhanging the base of the graph.

        let midX = this.size.width / 2;
        let midY = this._center;

        this._needleElement = this._chartElement.appendChild(createSVGElement("polygon"));
        this._needleElement.classList.add("needle");
        this._needleElement.setAttribute("points", `0,${midY + needlePointExtraDraw}, 0,${midY - needlePointExtraDraw} ${midX + needleUnderhangDraw},${midY - needleBaseExtraDraw} ${midX + needleUnderhangDraw},${midY + needleBaseExtraDraw}`);
        this._needleElement.style.transformOrigin = `${midX}px ${midY}px`;
    }

    layout()
    {
        super.layout();

        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        let empty = this._needleValue === null;
        this.element.classList.toggle("empty", empty);

        let value = empty ? 0 : this._needleValue;
        let degrees = 180 * (value / 100); // 0-100% mapped to 0-180deg.
        this._needleElement.style.transform = `rotate(${degrees}deg)`;
    }

    // Private

    _validateSegments(segments)
    {
        let lastLimit = -1;

        for (let {className, limit} of segments) {
            console.assert(limit >= 1 && limit <= 100, "limit should be between 1 and 100", limit);
            console.assert(limit >= (lastLimit + 1), "limits should always increase between segments");
            lastLimit = limit;
        }

        return true;
    }

    _createSegmentPathData(c, a1, a2, r1, r2)
    {
        const startIndicatorUnderhang = 7;
        let r3 = (r2 - startIndicatorUnderhang);
        let onePercentArc = Math.PI / 100;
        let largeArcFlag = ((a2 - a1) % (Math.PI * 2)) > Math.PI ? 1 : 0;

        let x1 = c + Math.cos(a1) * r1,
            y1 = c + Math.sin(a1) * r1,
            x2 = c + Math.cos(a2) * r1,
            y2 = c + Math.sin(a2) * r1,
            x3 = c + Math.cos(a2) * r2,
            y3 = c + Math.sin(a2) * r2,
            x4 = c + Math.cos(a1 + onePercentArc) * r2,
            y4 = c + Math.sin(a1 + onePercentArc) * r2,
            x5 = c + Math.cos(a1 + onePercentArc) * r3,
            y5 = c + Math.sin(a1 + onePercentArc) * r3,
            x6 = c + Math.cos(a1) * r3,
            y6 = c + Math.sin(a1) * r3;

        return [
            "M", x1, y1,                                // Starting position.
            "A", r1, r1, 0, largeArcFlag, 1, x2, y2,    // Draw outer arc.
            "L", x3, y3,                                // Connect outer and inner arcs.
            "A", r2, r2, 0, largeArcFlag, 0, x4, y4,    // Draw inner arc.
            "L", x5, y5,                                // Extend inner arc to center for start indicator.
            "A", r3, r3, 0, largeArcFlag, 0, x6, y6,    // Draw final inner arc for start indicator.
            "Z"                                         // Close path.
        ].join(" ");
    }
};
