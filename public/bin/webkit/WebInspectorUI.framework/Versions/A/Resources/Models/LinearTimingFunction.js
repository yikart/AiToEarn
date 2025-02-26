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

WI.LinearTimingFunction = class LinearTimingFunction
{
    constructor(points)
    {
        console.assert(Array.isArray(points) && points.length >= 2 && points.every((point) => point instanceof WI.LinearTimingFunction.Point), points);

        this._points = points;
    }

    // Static

    static fromString(text)
    {
        if (!text || !text.length)
            return null;

        let trimmedText = text.toLowerCase().trim();
        if (!trimmedText.length)
            return null;

        if (trimmedText in WI.LinearTimingFunction.keywordValues)
            return new WI.LinearTimingFunction(WI.LinearTimingFunction.keywordValues[trimmedText].map((point) => new WI.LinearTimingFunction.Point(...point)));

        let args = trimmedText.match(/^linear\(\s*([^\)]+)\s*\)$/)?.[1]?.split(/\s*,\s*/) ?? [];
        if (args.length < 2)
            return null;

        let stops = [];
        let largestInput = -Infinity;
        let lastStopIsExtraPoint = false;
        for (let arg of args) {
            let [_, output, input, extraPoint] = arg.match(/([\d\.-]+)\s*(?:([\d\.-]+)%)?\s*(?:([\d\.-]+)%)?/) ?? [];

            output = parseFloat(output);
            if (isNaN(output))
                return null;

            let stop = {output};
            stops.push(stop);
            lastStopIsExtraPoint = false;

            if (input !== undefined) {
                input = parseFloat(input) / 100;
                if (isNaN(input))
                    return null;

                largestInput = Math.max(input, largestInput);
                stop.input = largestInput;

                if (extraPoint !== undefined) {
                    extraPoint = parseFloat(extraPoint) / 100;
                    if (isNaN(extraPoint))
                        return null;

                    largestInput = Math.max(extraPoint, largestInput);
                    stops.push({output, input: largestInput});
                    lastStopIsExtraPoint = true;
                }
            } else if (stops.length === 1) {
                largestInput = 0;
                stop.input = largestInput;
            }
        }

        if (!lastStopIsExtraPoint && !("input" in stops.lastValue))
            stops.lastValue.input = Math.max(1, largestInput);

        let points = [];
        let missingInputRunStart = -1;
        for (let i = 0; i <= stops.length; ++i) {
            if (i < stops.length && !("input" in stops[i])) {
                if (missingInputRunStart === -1)
                    missingInputRunStart = i;
                continue;
            }

            if (missingInputRunStart !== -1) {
                let inputLow = missingInputRunStart > 0 ? stops[missingInputRunStart - 1].input : 0;
                let inputHigh = i < stops.length ? stops[i].input : Math.max(1, largestInput);
                let inputAverage = (inputLow + inputHigh) / (i - missingInputRunStart + 1);
                for (let j = missingInputRunStart; j < i; ++j)
                    points.push(new WI.LinearTimingFunction.Point(stops[j].output, inputAverage * (j - missingInputRunStart + 1)));

                missingInputRunStart = -1;
            }

            if (i < stops.length && "input" in stops[i])
                points.push(new WI.LinearTimingFunction.Point(stops[i].output, stops[i].input));
        }
        console.assert(points.length === stops.length, points, stops);
        console.assert(missingInputRunStart === -1, missingInputRunStart);
        return new WI.LinearTimingFunction(points);
    }

    // Public

    get points() { return this._points; }

    copy()
    {
        return new WI.LinearTimingFunction(this._points.map((point) => point.copy()));
    }

    equals(other)
    {
        if (this._points.length !== other._points.length)
            return false;

        for (let i = 0; i < this._points.length; ++i) {
            if (!this._points[i].equals(other._points[i]))
                return false;
        }

        return true;
    }

    toString()
    {
        for (let key in WI.LinearTimingFunction.keywordValues) {
            if (this.equals(WI.LinearTimingFunction.fromString(key)))
                return key;
        }

        return `linear(${this._points.map((point) => `${point.value} ${point.progress * 100}%`).join(", ")})`;
    }
};

WI.LinearTimingFunction.Point = class LinearTimingFunctionPoint
{
    constructor(value, progress)
    {
        console.assert(!isNaN(value), value);
        console.assert(!isNaN(progress), progress);

        this._value = value;
        this._progress = progress;
    }

    // Public

    get value() { return this._value; }
    get progress() { return this._progress; }

    copy()
    {
        return new WI.LinearTimingFunction.Point(this._value, this._progress);
    }

    equals(other)
    {
        return this._value === other._value && this._progress === other._progress;
    }
};

WI.LinearTimingFunction.keywordValues = {
    "linear": [[0, 0], [1, 1]],
};
