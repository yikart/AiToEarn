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

// StackedColumnChart creates a chart with filled columns each stratified with sections.
//
// Initialize the chart with a size.
// To populate with data, first initialize the sections. The class names you
// provide for the segments will allow you to style them. You can then include
// a new set of (x, totalHeight, w, [h1, h2, h3]) points in the chart via `addColumnSet`.
// The order of `h` values must be in the same order as the sections.
// The `y` value to be used for each column is `totalHeight - h`.
//
// SVG:
//
// - There is a single rect for each bar and each section.
// - Each bar extends all the way down to the bottom, they are layered such
//   that the rects for early sections overlap the sections for later sections.
//
//  <div class="stacked-column-chart">
//      <svg viewBox="0 0 800 75">
//          <rect class="section-class-name-3" width="<w>" height="<h3>" x="<x>" y="<y>" />
//          <rect class="section-class-name-2" width="<w>" height="<h2>" x="<x>" y="<y>" />
//          <rect class="section-class-name-1" width="<w>" height="<h1>" x="<x>" y="<y>" />
//          ...
//      </svg>
//  </div>

WI.StackedColumnChart = class StackedColumnChart extends WI.View
{
    constructor(size)
    {
        super();

        this.element.classList.add("stacked-column-chart");

        this._svgElement = this.element.appendChild(createSVGElement("svg"));
        this._svgElement.setAttribute("preserveAspectRatio", "none");

        this._sections = null;
        this._columns = [];
        this.size = size;
    }

    // Public

    get size()
    {
        return this._size;
    }

    set size(size)
    {
        this._size = size;

        this._svgElement.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    }

    initializeSections(sectionClassNames)
    {
        console.assert(this._sections === null, "Should not initialize multiple times");

        this._sections = sectionClassNames;
    }

    addColumnSet(x, totalHeight, width, heights, additionalClass)
    {
        console.assert(heights.length === this._sections.length, "Wrong number of sections in columns set", heights.length, this._sections.length);

        this._columns.push({x, totalHeight, width, heights, additionalClass});
    }

    clear()
    {
        this._columns = [];
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        this._svgElement.removeChildren();

        for (let {x, totalHeight, width, heights, additionalClass} of this._columns) {
            for (let i = heights.length - 1; i >= 0; --i) {
                let height = heights[i];
                // Next rect will be identical, skip this one.
                if (height === heights[i - 1])
                    continue;
                let y = totalHeight - height;
                let rect = this._svgElement.appendChild(createSVGElement("rect"));
                rect.classList.add(this._sections[i]);
                if (additionalClass)
                    rect.classList.add(additionalClass);
                rect.setAttribute("width", width);
                rect.setAttribute("height", height);
                rect.setAttribute("x", x);
                rect.setAttribute("y", y);
            }
        }
    }
};
