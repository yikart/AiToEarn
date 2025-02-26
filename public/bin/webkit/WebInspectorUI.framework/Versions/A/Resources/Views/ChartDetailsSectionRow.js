/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.ChartDetailsSectionRow = class ChartDetailsSectionRow extends WI.DetailsSectionRow
{
    constructor(delegate, chartSize, innerRadiusRatio)
    {
        super(WI.UIString("No Chart Available"));

        innerRadiusRatio = innerRadiusRatio || 0;
        console.assert(chartSize > 0, chartSize);
        console.assert(innerRadiusRatio >= 0 && innerRadiusRatio < 1, innerRadiusRatio);

        this.element.classList.add("chart");

        this._titleElement = document.createElement("div");
        this._titleElement.className = "title";
        this.element.appendChild(this._titleElement);

        let chartContentElement = document.createElement("div");
        chartContentElement.className = "chart-content";
        this.element.appendChild(chartContentElement);

        this._chartElement = createSVGElement("svg");
        chartContentElement.appendChild(this._chartElement);

        this._legendElement = document.createElement("div");
        this._legendElement.className = "legend";
        chartContentElement.appendChild(this._legendElement);

        this._delegate = delegate;
        this._items = new Map;
        this._title = "";
        this._chartSize = chartSize;
        this._radius = (this._chartSize / 2) - 1; // Subtract one to accomodate chart stroke width.
        this._innerRadius = innerRadiusRatio ? Math.floor(this._radius * innerRadiusRatio) : 0;
        this._total = 0;

        this._svgFiltersElement = document.createElement("svg");
        this._svgFiltersElement.classList.add("defs-only");
        this.element.append(this._svgFiltersElement);

        this._checkboxStyleElement = document.createElement("style");
        this._checkboxStyleElement.id = "checkbox-styles";
        document.getElementsByTagName("head")[0].append(this._checkboxStyleElement);

        function createEmptyChartPathData(c, r1, r2)
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

        this._emptyChartPath = createSVGElement("path");
        this._emptyChartPath.setAttribute("d", createEmptyChartPathData(this._chartSize / 2, this._radius, this._innerRadius));
        this._emptyChartPath.classList.add("empty-chart");
        this._chartElement.appendChild(this._emptyChartPath);
    }

    // Public

    get chartSize()
    {
        return this._chartSize;
    }

    set title(title)
    {
        if (this._title === title)
            return;

        this._title = title;
        this._titleElement.textContent = title;
    }

    get total()
    {
        return this._total;
    }

    addItem(id, label, value, color, checkbox, checked)
    {
        console.assert(!this._items.has(id), "Already added item with id: " + id);
        if (this._items.has(id))
            return;

        console.assert(value >= 0, "Value cannot be negative.");
        if (value < 0)
            return;

        this._items.set(id, {label, value, color, checkbox, checked});
        this._total += value;

        this._needsLayout();
    }

    setItemValue(id, value)
    {
        let item = this._items.get(id);
        console.assert(item, "Cannot set value for invalid item id: " + id);
        if (!item)
            return;

        console.assert(value >= 0, "Value cannot be negative.");
        if (value < 0)
            return;

        if (item.value === value)
            return;

        this._total += value - item.value;
        item.value = value;

        this._needsLayout();
    }

    clearItems()
    {
        for (let item of this._items.values()) {
            let path = item[WI.ChartDetailsSectionRow.ChartSegmentPathSymbol];
            if (path)
                path.remove();
        }

        this._total = 0;
        this._items.clear();

        this._needsLayout();
    }

    // Private

    _addCheckboxColorFilter(id, r, g, b)
    {
        for (let i = 0; i < this._svgFiltersElement.childNodes.length; ++i) {
            if (this._svgFiltersElement.childNodes[i].id === id)
                return;
        }

        r /= 255;
        b /= 255;
        g /= 255;

        // Create an svg:filter element that approximates "background-blend-mode: color", for grayscale input.
        let filterElement = createSVGElement("filter");
        filterElement.id = id;
        filterElement.setAttribute("color-interpolation-filters", "sRGB");

        let values = [1 - r, 0, 0, 0, r,
                      1 - g, 0, 0, 0, g,
                      1 - b, 0, 0, 0, b,
                      0,     0, 0, 1, 0];

        let colorMatrixPrimitive = createSVGElement("feColorMatrix");
        colorMatrixPrimitive.setAttribute("type", "matrix");
        colorMatrixPrimitive.setAttribute("values", values.join(" "));

        function createGammaPrimitive(tagName, value)
        {
            let gammaPrimitive = createSVGElement(tagName);
            gammaPrimitive.setAttribute("type", "gamma");
            gammaPrimitive.setAttribute("exponent", value);
            return gammaPrimitive;
        }

        let componentTransferPrimitive = createSVGElement("feComponentTransfer");
        componentTransferPrimitive.append(createGammaPrimitive("feFuncR", 1.4), createGammaPrimitive("feFuncG", 1.4), createGammaPrimitive("feFuncB", 1.4));
        filterElement.append(colorMatrixPrimitive, componentTransferPrimitive);

        this._svgFiltersElement.append(filterElement);

        let styleSheet = this._checkboxStyleElement.sheet;
        styleSheet.insertRule(".details-section > .content > .group > .row.chart > .chart-content > .legend > .legend-item > label > input[type=checkbox]." + id + " { filter: grayscale(1) url(#" + id + ") }", 0);
    }

    _updateLegend()
    {
        if (!this._items.size) {
            this._legendElement.removeChildren();
            return;
        }

        function formatItemValue(item)
        {
            if (this._delegate && typeof this._delegate.formatChartValue === "function")
                return this._delegate.formatChartValue(item.value);
            return item.value;
        }

        for (let [id, item] of this._items) {
            if (item[WI.ChartDetailsSectionRow.LegendItemValueElementSymbol]) {
                let valueElement = item[WI.ChartDetailsSectionRow.LegendItemValueElementSymbol];
                valueElement.textContent = formatItemValue.call(this, item);
                continue;
            }

            let labelElement = document.createElement("label");
            let keyElement;
            if (item.checkbox) {
                let className = id.toLowerCase();
                let rgb = item.color.substring(4, item.color.length - 1).replace(/ /g, "").split(",");
                if (rgb[0] === rgb[1] && rgb[1] === rgb[2])
                    rgb[0] = rgb[1] = rgb[2] = Math.min(160, rgb[0]);

                keyElement = document.createElement("input");
                keyElement.type = "checkbox";
                keyElement.classList.add(className);
                keyElement.checked = item.checked;
                keyElement[WI.ChartDetailsSectionRow.DataItemIdSymbol] = id;

                keyElement.addEventListener("change", this._legendItemCheckboxValueChanged.bind(this));

                this._addCheckboxColorFilter(className, rgb[0], rgb[1], rgb[2]);
            } else {
                keyElement = document.createElement("div");
                keyElement.classList.add("color-key");
                keyElement.style.backgroundColor = item.color;
            }

            labelElement.append(keyElement, item.label);

            let valueElement = document.createElement("div");
            valueElement.classList.add("value");
            valueElement.textContent = formatItemValue.call(this, item);

            item[WI.ChartDetailsSectionRow.LegendItemValueElementSymbol] = valueElement;

            let legendItemElement = document.createElement("div");
            legendItemElement.classList.add("legend-item");
            legendItemElement.append(labelElement, valueElement);

            this._legendElement.append(legendItemElement);
        }
    }

    _legendItemCheckboxValueChanged(event)
    {
        let checkbox = event.target;
        let id = checkbox[WI.ChartDetailsSectionRow.DataItemIdSymbol];
        this.dispatchEventToListeners(WI.ChartDetailsSectionRow.Event.LegendItemChecked, {id, checked: checkbox.checked});
    }

    _needsLayout()
    {
        if (this._scheduledLayoutUpdateIdentifier)
            return;

        this._scheduledLayoutUpdateIdentifier = requestAnimationFrame(this._updateLayout.bind(this));
    }

    _updateLayout()
    {
        if (this._scheduledLayoutUpdateIdentifier) {
            cancelAnimationFrame(this._scheduledLayoutUpdateIdentifier);
            this._scheduledLayoutUpdateIdentifier = undefined;
        }

        this._updateLegend();

        this._chartElement.setAttribute("width", this._chartSize);
        this._chartElement.setAttribute("height", this._chartSize);
        this._chartElement.setAttribute("viewbox", "0 0 " + this._chartSize + " " + this._chartSize);

        function createSegmentPathData(c, a1, a2, r1, r2)
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

        // Balance item values so that all non-zero chart segments are visible.
        const minimumDisplayValue = this._total * 0.015;

        let items = [];
        for (let item of this._items.values()) {
            item.displayValue = item.value ? Math.max(minimumDisplayValue, item.value) : 0;
            if (item.displayValue)
                items.push(item);
        }

        if (items.length > 1) {
            items.sort(function(a, b) { return a.value - b.value; });

            let largeItemCount = items.length;
            let totalAdjustedValue = 0;
            for (let item of items) {
                if (item.value < minimumDisplayValue) {
                    totalAdjustedValue += minimumDisplayValue - item.value;
                    largeItemCount--;
                    continue;
                }

                if (!totalAdjustedValue || !largeItemCount)
                    break;

                const donatedValue = totalAdjustedValue / largeItemCount;
                if (item.displayValue - donatedValue >= minimumDisplayValue) {
                    item.displayValue -= donatedValue;
                    totalAdjustedValue -= donatedValue;
                }

                largeItemCount--;
            }
        }

        const center = this._chartSize / 2;
        let startAngle = -Math.PI / 2;
        let endAngle = 0;
        for (let [id, item] of this._items) {
            let path = item[WI.ChartDetailsSectionRow.ChartSegmentPathSymbol];
            if (!path) {
                path = createSVGElement("path");
                path.classList.add("chart-segment");
                path.setAttribute("fill", item.color);
                this._chartElement.appendChild(path);

                item[WI.ChartDetailsSectionRow.ChartSegmentPathSymbol] = path;
            }

            if (!item.value) {
                path.classList.add("hidden");
                continue;
            }

            const angle = (item.displayValue / this._total) * Math.PI * 2;
            endAngle = startAngle + angle;

            path.setAttribute("d", createSegmentPathData(center, startAngle, endAngle, this._radius, this._innerRadius));
            path.classList.remove("hidden");

            startAngle = endAngle;
        }
    }
};

WI.ChartDetailsSectionRow.DataItemIdSymbol = Symbol("chart-details-section-row-data-item-id");
WI.ChartDetailsSectionRow.ChartSegmentPathSymbol = Symbol("chart-details-section-row-chart-segment-path");
WI.ChartDetailsSectionRow.LegendItemValueElementSymbol = Symbol("chart-details-section-row-legend-item-value-element");

WI.ChartDetailsSectionRow.Event = {
    LegendItemChecked: "chart-details-section-row-legend-item-checked"
};
