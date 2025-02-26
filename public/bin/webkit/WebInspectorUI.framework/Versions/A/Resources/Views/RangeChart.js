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

// RangeChart creates a chart filled with ranges of equal height.
//
//     [   |------|------|   |------|                 ]
//
// Initialize the chart with a size. You can then include a new range
// in the chart by providing an (x, w, class) via `addRange`.
//
// SVG:
//
// - There is a single rect for each range.
//
//  <div class="range-chart">
//      <svg viewBox="0 0 800 75">
//          <rect width="<w>" height="100%" x="<x>" class="<class>" />
//          <rect width="<w>" height="100%" x="<x>" class="<class>" />
//          ...
//      </svg>
//  </div>

WI.RangeChart = class RangeChart extends WI.View
{
    constructor()
    {
        super();

        this.element.classList.add("range-chart");

        this._svgElement = this.element.appendChild(createSVGElement("svg"));
        this._svgElement.setAttribute("preserveAspectRatio", "none");

        this._ranges = [];
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

        this._svgElement.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    }

    addRange(x, width, className)
    {
        this._ranges.push({x, width, className});
    }

    clear()
    {
        this._ranges = [];
    }

    // Protected

    layout()
    {
        super.layout();

        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        if (!this._size)
            return;

        this._svgElement.removeChildren();

        let height = this.size.height;
        for (let {x, width, className} of this._ranges) {
            let rect = this._svgElement.appendChild(createSVGElement("rect"));
            rect.setAttribute("width", width);
            rect.setAttribute("height", height);
            rect.setAttribute("x", x);
            rect.classList.add(className);
        }
    }
};
