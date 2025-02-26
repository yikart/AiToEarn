/*
 * Copyright (C) 2011-2019 Apple Inc.  All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#pragma once

#include "CompositeOperation.h"
#include "IntPoint.h"
#include "IterationCompositeOperation.h"
#include "LayoutPoint.h"

namespace WebCore {

struct BlendingContext {
    double progress { 0 };
    bool isDiscrete { false };
    CompositeOperation compositeOperation { CompositeOperation::Replace };
    IterationCompositeOperation iterationCompositeOperation { IterationCompositeOperation::Replace };
    double currentIteration { 0 };

    BlendingContext(double progress = 0, bool isDiscrete = false, CompositeOperation compositeOperation = CompositeOperation::Replace, IterationCompositeOperation iterationCompositeOperation = IterationCompositeOperation::Replace, double currentIteration = 0)
        : progress(progress)
        , isDiscrete(isDiscrete)
        , compositeOperation(compositeOperation)
        , iterationCompositeOperation(iterationCompositeOperation)
        , currentIteration(currentIteration)
    {
    }

    bool isReplace() const
    {
        return compositeOperation == CompositeOperation::Replace && iterationCompositeOperation == IterationCompositeOperation::Replace;
    }

    void normalizeProgress()
    {
        // https://drafts.csswg.org/web-animations-1/#discrete
        // The property's values cannot be meaningfully combined, thus it is not additive and
        // interpolation swaps from Va to Vb at 50% (p=0.5).
        if (isDiscrete) {
            progress = progress < 0.5 ? 0 : 1;
            compositeOperation = CompositeOperation::Replace;
        }
    }
};

inline int blend(int from, int to, const BlendingContext& context)
{  
    if (context.iterationCompositeOperation == IterationCompositeOperation::Accumulate && context.currentIteration) {
        auto iterationIncrement = static_cast<int>(context.currentIteration * static_cast<double>(to));
        from += iterationIncrement;
        to += iterationIncrement;
    }

    if (context.compositeOperation == CompositeOperation::Replace)
        return static_cast<int>(roundTowardsPositiveInfinity(from + (static_cast<double>(to) - from) * context.progress));
    return static_cast<int>(roundTowardsPositiveInfinity(static_cast<double>(from) + static_cast<double>(from) + static_cast<double>(to - from) * context.progress));
}

inline unsigned blend(unsigned from, unsigned to, const BlendingContext& context)
{
    if (context.iterationCompositeOperation == IterationCompositeOperation::Accumulate && context.currentIteration) {
        auto iterationIncrement = static_cast<unsigned>(context.currentIteration * static_cast<double>(to));
        from += iterationIncrement;
        to += iterationIncrement;
    }

    if (context.compositeOperation == CompositeOperation::Replace)
        return static_cast<unsigned>(lround(from + (static_cast<double>(to) - from) * context.progress));
    return static_cast<unsigned>(lround(from + from + (static_cast<double>(to) - from) * context.progress));
}

inline double blend(double from, double to, const BlendingContext& context)
{  
    if (context.iterationCompositeOperation == IterationCompositeOperation::Accumulate && context.currentIteration) {
        auto iterationIncrement = context.currentIteration * to;
        from += iterationIncrement;
        to += iterationIncrement;
    }

    if (context.compositeOperation == CompositeOperation::Replace)
        return from + (to - from) * context.progress;
    return from + from + (to - from) * context.progress;
}

inline float blend(float from, float to, const BlendingContext& context)
{  
    if (context.iterationCompositeOperation == IterationCompositeOperation::Accumulate && context.currentIteration) {
        auto iterationIncrement = static_cast<float>(context.currentIteration * to);
        from += iterationIncrement;
        to += iterationIncrement;
    }

    if (context.compositeOperation == CompositeOperation::Replace)
        return static_cast<float>(from + (to - from) * context.progress);
    return static_cast<float>(from + from + (to - from) * context.progress);
}

inline LayoutUnit blend(LayoutUnit from, LayoutUnit to, const BlendingContext& context)
{
    return LayoutUnit(blend(from.toFloat(), to.toFloat(), context));
}

inline IntPoint blend(const IntPoint& from, const IntPoint& to, const BlendingContext& context)
{
    return IntPoint(blend(from.x(), to.x(), context),
        blend(from.y(), to.y(), context));
}

inline LayoutPoint blend(const LayoutPoint& from, const LayoutPoint& to, const BlendingContext& context)
{
    return LayoutPoint(blend(from.x(), to.x(), context),
        blend(from.y(), to.y(), context));
}

} // namespace WebCore
