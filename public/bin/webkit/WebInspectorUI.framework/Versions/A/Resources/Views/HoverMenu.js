/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.HoverMenu = class HoverMenu extends WI.Object
{
    constructor(delegate)
    {
        super();

        this.delegate = delegate;

        this._element = document.createElement("div");
        this._element.className = "hover-menu";
        this._element.addEventListener("transitionend", this, true);

        this._outlineElement = this._element.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));

        this._button = this._element.appendChild(document.createElement("img"));
        this._button.addEventListener("click", this);
    }

    // Public

    get element()
    {
        return this._element;
    }

    present(rects)
    {
        this._outlineElement.textContent = "";

        document.body.appendChild(this._element);
        this._drawOutline(rects);
        this._element.classList.add(WI.HoverMenu.VisibleClassName);

        window.addEventListener("scroll", this, true);
    }

    dismiss(discrete)
    {
        if (this._element.parentNode !== document.body)
            return;

        if (discrete)
            this._element.remove();

        this._element.classList.remove(WI.HoverMenu.VisibleClassName);

        window.removeEventListener("scroll", this, true);
    }

    // Protected

    handleEvent(event)
    {
        switch (event.type) {
        case "scroll":
            if (!this._element.contains(event.target))
                this.dismiss(true);
            break;
        case "click":
            this._handleClickEvent(event);
            break;
        case "transitionend":
            if (!this._element.classList.contains(WI.HoverMenu.VisibleClassName))
                this._element.remove();
            break;
        }
    }

    // Private

    _handleClickEvent(event)
    {
        if (this.delegate && typeof this.delegate.hoverMenuButtonWasPressed === "function")
            this.delegate.hoverMenuButtonWasPressed(this);
    }

    _drawOutline(rects)
    {
        var buttonWidth = this._button.width;
        var buttonHeight = this._button.height;

        // Add room for the button on the last line.
        var lastRect = rects.pop();
        lastRect.size.width += buttonWidth;
        rects.push(lastRect);

        if (rects.length === 1)
            this._drawSingleLine(rects[0]);
        else if (rects.length === 2 && rects[0].minX() >= rects[1].maxX())
            this._drawTwoNonOverlappingLines(rects);
        else
            this._drawOverlappingLines(rects);

        var bounds = WI.Rect.unionOfRects(rects).pad(3); // padding + 1/2 stroke-width

        var style = this._element.style;
        style.left = bounds.minX() + "px";
        style.top = bounds.minY() + "px";
        style.width = bounds.size.width + "px";
        style.height = bounds.size.height + "px";

        this._outlineElement.style.width = bounds.size.width + "px";
        this._outlineElement.style.height = bounds.size.height + "px";

        this._button.style.left = (lastRect.maxX() - bounds.minX() - buttonWidth) + "px";
        this._button.style.top = (lastRect.maxY() - bounds.minY() - buttonHeight) + "px";
    }

    _addRect(rect)
    {
        var r = 4;

        var svgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        svgRect.setAttribute("x", 1);
        svgRect.setAttribute("y", 1);
        svgRect.setAttribute("width", rect.size.width);
        svgRect.setAttribute("height", rect.size.height);
        svgRect.setAttribute("rx", r);
        svgRect.setAttribute("ry", r);
        return this._outlineElement.appendChild(svgRect);
    }

    _addPath(commands, tx, ty)
    {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", commands.join(" "));
        path.setAttribute("transform", "translate(" + (tx + 1) + "," + (ty + 1) + ")");
        return this._outlineElement.appendChild(path);
    }

    _drawSingleLine(rect)
    {
        this._addRect(rect.pad(2));
    }

    _drawTwoNonOverlappingLines(rects)
    {
        var r = 4;

        var firstRect = rects[0].pad(2);
        var secondRect = rects[1].pad(2);

        var tx = -secondRect.minX();
        var ty = -firstRect.minY();

        var rect = firstRect;
        this._addPath([
            "M", rect.maxX(), rect.minY(),
            "H", rect.minX() + r,
            "q", -r, 0, -r, r,
            "V", rect.maxY() - r,
            "q", 0, r, r, r,
            "H", rect.maxX()
        ], tx, ty);

        rect = secondRect;
        this._addPath([
            "M", rect.minX(), rect.minY(),
            "H", rect.maxX() - r,
            "q", r, 0, r, r,
            "V", rect.maxY() - r,
            "q", 0, r, -r, r,
            "H", rect.minX()
        ], tx, ty);
    }

    _drawOverlappingLines(rects)
    {
        var PADDING = 2;
        var r = 4;

        var minX = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        for (var rect of rects) {
            var minX = Math.min(rect.minX(), minX);
            var maxX = Math.max(rect.maxX(), maxX);
        }

        minX -= PADDING;
        maxX += PADDING;

        var minY = rects[0].minY() - PADDING;
        var maxY = rects.lastValue.maxY() + PADDING;
        var firstLineMinX = rects[0].minX() - PADDING;
        var lastLineMaxX = rects.lastValue.maxX() + PADDING;

        if (firstLineMinX === minX && lastLineMaxX === maxX)
            return this._addRect(new WI.Rect(minX, minY, maxX - minX, maxY - minY));

        var lastLineMinY = rects.lastValue.minY() + PADDING;
        if (rects[0].minX() === minX + PADDING) {
            return this._addPath([
                "M", minX + r, minY,
                "H", maxX - r,
                "q", r, 0, r, r,
                "V", lastLineMinY - r,
                "q", 0, r, -r, r,
                "H", lastLineMaxX + r,
                "q", -r, 0, -r, r,
                "V", maxY - r,
                "q", 0, r, -r, r,
                "H", minX + r,
                "q", -r, 0, -r, -r,
                "V", minY + r,
                "q", 0, -r, r, -r
            ], -minX, -minY);
        }

        var firstLineMaxY = rects[0].maxY() - PADDING;
        if (rects.lastValue.maxX() === maxX - PADDING) {
            return this._addPath([
                "M", firstLineMinX + r, minY,
                "H", maxX - r,
                "q", r, 0, r, r,
                "V", maxY - r,
                "q", 0, r, -r, r,
                "H", minX + r,
                "q", -r, 0, -r, -r,
                "V", firstLineMaxY + r,
                "q", 0, -r, r, -r,
                "H", firstLineMinX - r,
                "q", r, 0, r, -r,
                "V", minY + r,
                "q", 0, -r, r, -r
            ], -minX, -minY);
        }

        return this._addPath([
            "M", firstLineMinX + r, minY,
            "H", maxX - r,
            "q", r, 0, r, r,
            "V", lastLineMinY - r,
            "q", 0, r, -r, r,
            "H", lastLineMaxX + r,
            "q", -r, 0, -r, r,
            "V", maxY - r,
            "q", 0, r, -r, r,
            "H", minX + r,
            "q", -r, 0, -r, -r,
            "V", firstLineMaxY + r,
            "q", 0, -r, r, -r,
            "H", firstLineMinX - r,
            "q", r, 0, r, -r,
            "V", minY + r,
            "q", 0, -r, r, -r
        ], -minX, -minY);
    }
};

WI.HoverMenu.VisibleClassName = "visible";
