/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.BoxShadow = class BoxShadow
{
    constructor(offsetX, offsetY, blurRadius, spreadRadius, inset, color)
    {
        console.assert(!offsetX || (typeof offsetX === "object" && !isNaN(offsetX.value) && offsetX.unit), offsetX);
        console.assert(!offsetY || (typeof offsetY === "object" && !isNaN(offsetY.value) && offsetY.unit), offsetY);
        console.assert(!blurRadius || (typeof blurRadius === "object" && blurRadius.value >= 0 && blurRadius.unit), blurRadius);
        console.assert(!spreadRadius || (typeof spreadRadius === "object" && !isNaN(spreadRadius.value) && spreadRadius.unit), spreadRadius);
        console.assert(!inset || typeof inset === "boolean", inset);
        console.assert(!color || color instanceof WI.Color, color);

        this._offsetX = offsetX || null;
        this._offsetY = offsetY || null;
        this._blurRadius = blurRadius || null;
        this._spreadRadius = spreadRadius || null;
        this._inset = !!inset;
        this._color = color || null;
    }

    // Static

    static fromString(cssString)
    {
        if (cssString === "none")
            return new WI.BoxShadow;

        let offsetX = null;
        let offsetY = null;
        let blurRadius = null;
        let spreadRadius = null;
        let inset = false;
        let color = null;

        let startIndex = 0;
        let openParentheses = 0;
        let numberComponentCount = 0;
        for (let i = 0; i <= cssString.length; ++i) {
            if (cssString[i] === "(") {
                ++openParentheses;
                continue;
            }

            if (cssString[i] === ")") {
                --openParentheses;
                continue;
            }

            if ((cssString[i] !== " " || openParentheses) && i !== cssString.length)
                continue;

            let component = cssString.substring(startIndex, i + 1).trim();

            startIndex = i + 1;

            if (!component.length)
                continue;

            if (component === "inset") {
                if (inset)
                    return null;
                inset = true;
                continue;
            }

            let possibleColor = WI.Color.fromString(component);
            if (possibleColor) {
                if (color)
                    return null;
                color = possibleColor;
                continue;
            }

            let numberComponent = WI.BoxShadow.parseNumberComponent(component);
            if (!numberComponent)
                return null;

            switch (++numberComponentCount) {
            case 1:
                offsetX = numberComponent;
                break;

            case 2:
                offsetY = numberComponent;
                break;

            case 3:
                blurRadius = numberComponent;
                if (blurRadius.value < 0)
                    return null;
                break;

            case 4:
                spreadRadius = numberComponent;
                break;

            default:
                return null;
            }
        }

        if (!offsetX || !offsetY)
            return null;

        return new WI.BoxShadow(offsetX, offsetY, blurRadius, spreadRadius, inset, color);
    }

    static parseNumberComponent(string)
    {
        let value = parseFloat(string);
        if (isNaN(value))
            return null;

        let unit = string.replace(value, "");
        if (!unit) {
            if (value)
                return null;
            unit = "px";
        } else if (!WI.CSSCompletions.lengthUnits.has(unit))
            return null;

        return {unit, value};
    }

    // Public

    get offsetX() { return this._offsetX; }
    get offsetY() { return this._offsetY; }
    get blurRadius() { return this._blurRadius; }
    get spreadRadius() { return this._spreadRadius; }
    get inset() { return this._inset; }
    get color() { return this._color; }

    copy()
    {
        return new WI.BoxShadow(this._offsetX, this._offsetY, this._blurRadius, this._spreadRadius, this._inset, this._color);
    }

    toString()
    {
        if (!this._offsetX || !this._offsetY)
            return "none";

        function stringifyNumberComponent({value, unit}) {
            return value + (value ? unit : "");
        }

        let values = [
            stringifyNumberComponent(this._offsetX),
            stringifyNumberComponent(this._offsetY),
        ];

        if (this._blurRadius)
            values.push(stringifyNumberComponent(this._blurRadius));

        if (this._spreadRadius)
            values.push(stringifyNumberComponent(this._spreadRadius));

        if (this._color)
            values.push(this._color.toString());

        if (this._inset)
            values.push("inset");

        return values.join(" ");
    }
};
