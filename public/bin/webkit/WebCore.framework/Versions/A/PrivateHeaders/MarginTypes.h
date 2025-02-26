/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#pragma once

#include "LayoutUnit.h"
#include <optional>

namespace WebCore {
namespace Layout {

struct ComputedVerticalMargin {
    std::optional<LayoutUnit> before;
    std::optional<LayoutUnit> after;
};

struct UsedVerticalMargin {
    struct NonCollapsedValues {
        LayoutUnit before;
        LayoutUnit after;
    };
    NonCollapsedValues nonCollapsedValues;

    struct CollapsedValues {
        std::optional<LayoutUnit> before;
        std::optional<LayoutUnit> after;
        bool isCollapsedThrough { false };
    };
    CollapsedValues collapsedValues;

    // FIXME: This structure might need to change to indicate that the cached value is not necessarily the same as the box's computed margin value.
    // This only matters in case of collapse through margins when they collapse into another sibling box.
    // <div style="margin: 1px"></div><div style="margin: 10px"></div> <- the second div's before/after marings collapse through and the same time they collapse into
    // the first div. When the parent computes its before margin, it should see the second div's collapsed through margin as the value to collapse width (adjoining margin value).
    // So while the first div's before margin is not 10px, the cached value is 10px so that when we compute the parent's margin we just need to check the first
    // inflow child's cached margin values.
    struct PositiveAndNegativePair {
        struct Values {
            bool isNonZero() const { return positive.value_or(0) || negative.value_or(0); }

            std::optional<LayoutUnit> positive;
            std::optional<LayoutUnit> negative;
            bool isQuirk { false };
        };
        Values before;
        Values after;
    };
    PositiveAndNegativePair positiveAndNegativeValues;
};

static inline LayoutUnit marginBefore(const UsedVerticalMargin& usedVerticalMargin)
{
    return usedVerticalMargin.collapsedValues.before.value_or(usedVerticalMargin.nonCollapsedValues.before);
}

static inline LayoutUnit marginAfter(const UsedVerticalMargin& usedVerticalMargin)
{
    if (usedVerticalMargin.collapsedValues.isCollapsedThrough)
        return 0_lu;
    return usedVerticalMargin.collapsedValues.after.value_or(usedVerticalMargin.nonCollapsedValues.after);
}

struct ComputedHorizontalMargin {
    std::optional<LayoutUnit> start;
    std::optional<LayoutUnit> end;
};

struct UsedHorizontalMargin {
    LayoutUnit start;
    LayoutUnit end;
};

struct PrecomputedMarginBefore {
    LayoutUnit usedValue() const { return collapsedValue.value_or(nonCollapsedValue); }
    LayoutUnit nonCollapsedValue;
    std::optional<LayoutUnit> collapsedValue;
    UsedVerticalMargin::PositiveAndNegativePair::Values positiveAndNegativeMarginBefore;
};

}
}
