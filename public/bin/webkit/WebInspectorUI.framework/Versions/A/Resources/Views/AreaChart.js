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

// AreaChart creates a single filled area chart.
//
// Initialize the chart with a size. You can then include a new point
// in the area chart by providing an (x, y) point via `addPoint`. You
// can add point markers (<circle>) with an (x, y) as well.
//
// SVG:
//
// - There is a single path for line.
//
//  <div class="area-chart">
//      <svg viewBox="0 0 800 75">
//          <path d="..."/>
//      </svg>
//  </div>

WI.AreaChart = class AreaChart extends WI.View
{
    constructor()
    {
        super();

        this.element.classList.add("area-chart");

        this._chartElement = this.element.appendChild(createSVGElement("svg"));
        this._chartElement.setAttribute("preserveAspectRatio", "none");

        this._pathElement = this._chartElement.appendChild(createSVGElement("path"));
        this._circleElements = [];

        this._points = [];
        this._markers = [];
        this._size = null;
    }

    // Public

    get size()
    {
        return this._size;
    }

    set size(size)
    {
        if (this._size && this._size.equals(size))
            return;

        this._size = size;

        this._chartElement.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);

        this.needsLayout();
    }

    addPoint(x, y)
    {
        this._points.push({x, y});
    }

    clearPoints()
    {
        this._points = [];
    }

    addPointMarker(x, y)
    {
        this._markers.push({x, y});
    }

    clearPointMarkers()
    {
        this._markers = [];
    }

    clear()
    {
        this.clearPoints();
        this.clearPointMarkers();
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        if (!this._size)
            return;

        let pathComponents = [];
        pathComponents.push(`M 0 ${this._size.height}`);
        for (let point of this._points)
            pathComponents.push(`L ${point.x} ${point.y}`);

        let lastX = this._points.length ? this._points.lastValue.x : 0;
        pathComponents.push(`L ${lastX} ${this._size.height}`);
        pathComponents.push("Z");

        let pathString = pathComponents.join(" ");
        this._pathElement.setAttribute("d", pathString);

        if (this._circleElements.length) {
            for (let circle of this._circleElements)
                circle.remove();
            this._circleElements = [];
        }

        if (this._markers.length) {
            for (let {x, y} of this._markers) {
                let circle = this._chartElement.appendChild(createSVGElement("circle"));
                this._circleElements.push(circle);
                circle.setAttribute("cx", x);
                circle.setAttribute("cy", y);
            }
        }
    }
};
