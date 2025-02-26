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

WI.SpringTimingFunction = class SpringTimingFunction
{
    constructor(mass, stiffness, damping, initialVelocity)
    {
        this.mass = Math.max(1, mass);
        this.stiffness = Math.max(1, stiffness);
        this.damping = Math.max(0, damping);
        this.initialVelocity = initialVelocity;
    }

    // Static

    static fromValues(values)
    {
        if (!values || values.length < 4)
            return null;

        values = values.map(Number);
        if (values.includes(NaN))
            return null;

        return new WI.SpringTimingFunction(...values);
    }

    static fromString(text)
    {
        if (!text || !text.length)
            return null;

        let trimmedText = text.toLowerCase().trim();
        if (!trimmedText.length)
            return null;

        let matches = trimmedText.match(/^spring\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([-\d.]+)\)$/);
        if (!matches)
            return null;

        return WI.SpringTimingFunction.fromValues(matches.slice(1));
    }

    // Public

    copy()
    {
        return new WI.SpringTimingFunction(this.mass, this.stiffness, this.damping, this.initialVelocity);
    }

    toString()
    {
        return `spring(${this.mass} ${this.stiffness} ${this.damping} ${this.initialVelocity})`;
    }

    solve(t)
    {
        let w0 = Math.sqrt(this.stiffness / this.mass);
        let zeta = this.damping / (2 * Math.sqrt(this.stiffness * this.mass));

        let wd = 0;
        let A = 1;
        let B = -this.initialVelocity + w0;
        if (zeta < 1) {
            // Under-damped.
            wd = w0 * Math.sqrt(1 - zeta * zeta);
            A = 1;
            B = (zeta * w0 + -this.initialVelocity) / wd;
        }

        if (zeta < 1) // Under-damped
            t = Math.exp(-t * zeta * w0) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
        else // Critically damped (ignoring over-damped case).
            t = (A + B * t) * Math.exp(-t * w0);

        return 1 - t; // Map range from [1..0] to [0..1].
    }

    calculateDuration(epsilon)
    {
        epsilon = epsilon || 0.0001;
        let t = 0;
        let current = 0;
        let minimum = Number.POSITIVE_INFINITY;
        while (current >= epsilon || minimum >= epsilon) {
            current = Math.abs(1 - this.solve(t)); // Undo the range mapping
            if (minimum < epsilon && current >= epsilon)
                minimum = Number.POSITIVE_INFINITY; // Spring reversed direction
            else if (current < minimum)
                minimum = current;
            t += 0.1;
        }
        return t;
    }
};
