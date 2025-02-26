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

WI.CubicBezierTimingFunction = class CubicBezierTimingFunction
{
    constructor(x1, y1, x2, y2)
    {
        this._inPoint = new WI.Point(x1, y1);
        this._outPoint = new WI.Point(x2, y2);

        // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
        this._curveInfo = {
            x: {c: 3.0 * x1},
            y: {c: 3.0 * y1}
        };

        this._curveInfo.x.b = 3.0 * (x2 - x1) - this._curveInfo.x.c;
        this._curveInfo.x.a = 1.0 - this._curveInfo.x.c - this._curveInfo.x.b;

        this._curveInfo.y.b = 3.0 * (y2 - y1) - this._curveInfo.y.c;
        this._curveInfo.y.a = 1.0 - this._curveInfo.y.c - this._curveInfo.y.b;
    }

    // Static

    static fromCoordinates(coordinates)
    {
        if (!coordinates || coordinates.length < 4)
            return null;

        coordinates = coordinates.map(Number);
        if (coordinates.includes(NaN))
            return null;

        return new WI.CubicBezierTimingFunction(coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
    }

    static fromString(text)
    {
        if (!text || !text.length)
            return null;

        var trimmedText = text.toLowerCase().replace(/\s/g, "");
        if (!trimmedText.length)
            return null;

        if (Object.keys(WI.CubicBezierTimingFunction.keywordValues).includes(trimmedText))
            return WI.CubicBezierTimingFunction.fromCoordinates(WI.CubicBezierTimingFunction.keywordValues[trimmedText]);

        var matches = trimmedText.match(/^cubic-bezier\(([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\)$/);
        if (!matches)
            return null;

        matches.splice(0, 1);
        return WI.CubicBezierTimingFunction.fromCoordinates(matches);
    }

    // Public

    get inPoint()
    {
        return this._inPoint;
    }

    get outPoint()
    {
        return this._outPoint;
    }

    copy()
    {
        return new WI.CubicBezierTimingFunction(this._inPoint.x, this._inPoint.y, this._outPoint.x, this._outPoint.y);
    }

    toString()
    {
        var values = [this._inPoint.x, this._inPoint.y, this._outPoint.x, this._outPoint.y];
        for (var key in WI.CubicBezierTimingFunction.keywordValues) {
            if (Array.shallowEqual(WI.CubicBezierTimingFunction.keywordValues[key], values))
                return key;
        }

        return "cubic-bezier(" + values.join(", ") + ")";
    }

    solve(x, epsilon)
    {
        return this._sampleCurveY(this._solveCurveX(x, epsilon));
    }

    // Private

    _sampleCurveX(t)
    {
        // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
        return ((this._curveInfo.x.a * t + this._curveInfo.x.b) * t + this._curveInfo.x.c) * t;
    }

    _sampleCurveY(t)
    {
        return ((this._curveInfo.y.a * t + this._curveInfo.y.b) * t + this._curveInfo.y.c) * t;
    }

    _sampleCurveDerivativeX(t)
    {
        return (3.0 * this._curveInfo.x.a * t + 2.0 * this._curveInfo.x.b) * t + this._curveInfo.x.c;
    }

    // Given an x value, find a parametric value it came from.
    _solveCurveX(x, epsilon)
    {
        var t0, t1, t2, x2, d2, i;

        // First try a few iterations of Newton's method -- normally very fast.
        for (t2 = x, i = 0; i < 8; i++) {
            x2 = this._sampleCurveX(t2) - x;
            if (Math.abs(x2) < epsilon)
                return t2;
            d2 = this._sampleCurveDerivativeX(t2);
            if (Math.abs(d2) < 1e-6)
                break;
            t2 = t2 - x2 / d2;
        }

        // Fall back to the bisection method for reliability.
        t0 = 0.0;
        t1 = 1.0;
        t2 = x;

        if (t2 < t0)
            return t0;
        if (t2 > t1)
            return t1;

        while (t0 < t1) {
            x2 = this._sampleCurveX(t2);
            if (Math.abs(x2 - x) < epsilon)
                return t2;
            if (x > x2)
                t0 = t2;
            else
                t1 = t2;
            t2 = (t1 - t0) * 0.5 + t0;
        }

        // Failure.
        return t2;
    }
};

WI.CubicBezierTimingFunction.keywordValues = {
    "ease":         [0.25, 0.1, 0.25, 1],
    "ease-in":      [0.42, 0, 1, 1],
    "ease-out":     [0, 0, 0.58, 1],
    "ease-in-out":  [0.42, 0, 0.58, 1],
    "linear":       [0, 0, 1, 1]
};
