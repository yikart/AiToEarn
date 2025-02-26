/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.Point = class Point
{
    constructor(x, y)
    {
        this.x = x || 0;
        this.y = y || 0;
    }

    // Static

    static fromEvent(event)
    {
        return new WI.Point(event.pageX, event.pageY);
    }

    static fromEventInElement(event, element)
    {
        let rect = element.getBoundingClientRect();
        return new WI.Point(event.pageX - rect.x, event.pageY - rect.y);
    }

    // Public

    toString()
    {
        return "WI.Point[" + this.x + "," + this.y + "]";
    }

    copy()
    {
        return new WI.Point(this.x, this.y);
    }

    equals(anotherPoint)
    {
        return this.x === anotherPoint.x && this.y === anotherPoint.y;
    }

    distance(anotherPoint)
    {
        let dx = anotherPoint.x - this.x;
        let dy = anotherPoint.y - this.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
};

WI.Size = class Size
{
    constructor(width, height)
    {
        this.width = width || 0;
        this.height = height || 0;
    }

    // Static

    static fromJSON(json)
    {
        return new WI.Size(json.width, json.height);
    }

    // Public

    toString()
    {
        return "WI.Size[" + this.width + "," + this.height + "]";
    }

    copy()
    {
        return new WI.Size(this.width, this.height);
    }

    equals(anotherSize)
    {
        return this.width === anotherSize.width && this.height === anotherSize.height;
    }
};

WI.Size.ZERO_SIZE = new WI.Size(0, 0);


WI.Rect = class Rect
{
    constructor(x, y, width, height)
    {
        this.origin = new WI.Point(x || 0, y || 0);
        this.size = new WI.Size(width || 0, height || 0);
    }

    // Static

    static rectFromClientRect(clientRect)
    {
        return new WI.Rect(clientRect.left, clientRect.top, clientRect.width, clientRect.height);
    }

    static unionOfRects(rects)
    {
        var union = rects[0];
        for (var i = 1; i < rects.length; ++i)
            union = union.unionWithRect(rects[i]);
        return union;
    }

    // Public

    toString()
    {
        return "WI.Rect[" + [this.origin.x, this.origin.y, this.size.width, this.size.height].join(", ") + "]";
    }

    copy()
    {
        return new WI.Rect(this.origin.x, this.origin.y, this.size.width, this.size.height);
    }

    equals(anotherRect)
    {
        return this.origin.equals(anotherRect.origin) && this.size.equals(anotherRect.size);
    }

    inset(insets)
    {
        return new WI.Rect(
            this.origin.x + insets.left,
            this.origin.y + insets.top,
            this.size.width - insets.left - insets.right,
            this.size.height - insets.top - insets.bottom
        );
    }

    pad(padding)
    {
        return new WI.Rect(
            this.origin.x - padding,
            this.origin.y - padding,
            this.size.width + padding * 2,
            this.size.height + padding * 2
        );
    }

    minX()
    {
        return this.origin.x;
    }

    minY()
    {
        return this.origin.y;
    }

    midX()
    {
        return this.origin.x + (this.size.width / 2);
    }

    midY()
    {
        return this.origin.y + (this.size.height / 2);
    }

    maxX()
    {
        return this.origin.x + this.size.width;
    }

    maxY()
    {
        return this.origin.y + this.size.height;
    }

    intersectionWithRect(rect)
    {
        var x1 = Math.max(this.minX(), rect.minX());
        var x2 = Math.min(this.maxX(), rect.maxX());
        if (x1 > x2)
            return WI.Rect.ZERO_RECT;
        var intersection = new WI.Rect;
        intersection.origin.x = x1;
        intersection.size.width = x2 - x1;
        var y1 = Math.max(this.minY(), rect.minY());
        var y2 = Math.min(this.maxY(), rect.maxY());
        if (y1 > y2)
            return WI.Rect.ZERO_RECT;
        intersection.origin.y = y1;
        intersection.size.height = y2 - y1;
        return intersection;
    }

    unionWithRect(rect)
    {
        var x = Math.min(this.minX(), rect.minX());
        var y = Math.min(this.minY(), rect.minY());
        var width = Math.max(this.maxX(), rect.maxX()) - x;
        var height = Math.max(this.maxY(), rect.maxY()) - y;
        return new WI.Rect(x, y, width, height);
    }

    round()
    {
        return new WI.Rect(
            Math.floor(this.origin.x),
            Math.floor(this.origin.y),
            Math.ceil(this.size.width),
            Math.ceil(this.size.height)
        );
    }
};

WI.Rect.ZERO_RECT = new WI.Rect(0, 0, 0, 0);


WI.EdgeInsets = class EdgeInsets
{
    constructor(top, right, bottom, left)
    {
        console.assert(arguments.length === 1 || arguments.length === 4);

        if (arguments.length === 1) {
            this.top = top;
            this.right = top;
            this.bottom = top;
            this.left = top;
        } else if (arguments.length === 4) {
            this.top = top;
            this.right = right;
            this.bottom = bottom;
            this.left = left;
        }
    }

    // Public

    equals(anotherInset)
    {
        return this.top === anotherInset.top && this.right === anotherInset.right
            && this.bottom === anotherInset.bottom && this.left === anotherInset.left;
    }

    copy()
    {
        return new WI.EdgeInsets(this.top, this.right, this.bottom, this.left);
    }
};

WI.RectEdge = {
    MIN_X: 0,
    MIN_Y: 1,
    MAX_X: 2,
    MAX_Y: 3
};

WI.Quad = class Quad
{
    constructor(quad)
    {
        this.points = [
            new WI.Point(quad[0], quad[1]), // top left
            new WI.Point(quad[2], quad[3]), // top right
            new WI.Point(quad[4], quad[5]), // bottom right
            new WI.Point(quad[6], quad[7])  // bottom left
        ];

        this.width = Math.round(Math.sqrt(Math.pow(quad[0] - quad[2], 2) + Math.pow(quad[1] - quad[3], 2)));
        this.height = Math.round(Math.sqrt(Math.pow(quad[0] - quad[6], 2) + Math.pow(quad[1] - quad[7], 2)));
    }

    // Import / Export

    static fromJSON(json)
    {
        return new WI.Quad(json);
    }

    toJSON()
    {
        return this.toProtocol();
    }

    // Public

    toProtocol()
    {
        return [
            this.points[0].x, this.points[0].y,
            this.points[1].x, this.points[1].y,
            this.points[2].x, this.points[2].y,
            this.points[3].x, this.points[3].y
        ];
    }
};

WI.Polygon = class Polygon
{
    constructor(points)
    {
        this.points = points;
    }

    // Public

    bounds()
    {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE;
        for (var point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        return new WI.Rect(minX, minY, maxX - minX, maxY - minY);
    }
};
