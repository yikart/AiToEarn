/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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
#include <wtf/OptionSet.h>

namespace WebCore {
namespace Layout {

struct HorizontalConstraints {
    LayoutUnit logicalRight() const { return logicalLeft + logicalWidth; }

    LayoutUnit logicalLeft;
    LayoutUnit logicalWidth;
};

struct VerticalConstraints {
    LayoutUnit logicalTop;
    LayoutUnit logicalHeight;
};

struct ConstraintsForInFlowContent {
    ConstraintsForInFlowContent(HorizontalConstraints, LayoutUnit logicalTop);

    HorizontalConstraints horizontal() const { return m_horizontal; }
    LayoutUnit logicalTop() const { return m_logicalTop; }

    enum BaseTypeFlag : uint8_t {
        GenericContent = 1 << 0,
        InlineContent  = 1 << 1,
        TableContent   = 1 << 2,
        FlexContent    = 1 << 3
    };
    bool isConstraintsForInlineContent() const { return baseTypeFlags().contains(InlineContent); }
    bool isConstraintsForTableContent() const { return baseTypeFlags().contains(TableContent); }
    bool isConstraintsForFlexContent() const { return baseTypeFlags().contains(FlexContent); }

protected:
    ConstraintsForInFlowContent(HorizontalConstraints, LayoutUnit logicalTop, OptionSet<BaseTypeFlag>);

private:
    OptionSet<BaseTypeFlag> baseTypeFlags() const { return OptionSet<BaseTypeFlag>::fromRaw(m_baseTypeFlags); }

    unsigned m_baseTypeFlags : 3; // OptionSet<BaseTypeFlag>
    HorizontalConstraints m_horizontal;
    LayoutUnit m_logicalTop;
};

struct ConstraintsForOutOfFlowContent {
    HorizontalConstraints horizontal;
    VerticalConstraints vertical;
    // Borders and padding are resolved against the containing block's content box as if the box was an in-flow box.
    LayoutUnit borderAndPaddingConstraints;
};

inline ConstraintsForInFlowContent::ConstraintsForInFlowContent(HorizontalConstraints horizontal, LayoutUnit logicalTop, OptionSet<BaseTypeFlag> baseTypeFlags)
    : m_baseTypeFlags(baseTypeFlags.toRaw())
    , m_horizontal(horizontal)
    , m_logicalTop(logicalTop)
{
}

inline ConstraintsForInFlowContent::ConstraintsForInFlowContent(HorizontalConstraints horizontal, LayoutUnit logicalTop)
    : ConstraintsForInFlowContent(horizontal, logicalTop, GenericContent)
{
}

enum class IntrinsicWidthMode {
    Minimum,
    Maximum
};

struct IntrinsicWidthConstraints {
    void expand(LayoutUnit horizontalValue);
    IntrinsicWidthConstraints& operator+=(const IntrinsicWidthConstraints&);
    IntrinsicWidthConstraints& operator+=(LayoutUnit);
    IntrinsicWidthConstraints& operator-=(const IntrinsicWidthConstraints&);
    IntrinsicWidthConstraints& operator-=(LayoutUnit);

    LayoutUnit minimum;
    LayoutUnit maximum;
};

inline void IntrinsicWidthConstraints::expand(LayoutUnit horizontalValue)
{
    minimum += horizontalValue;
    maximum += horizontalValue;
}

inline IntrinsicWidthConstraints& IntrinsicWidthConstraints::operator+=(const IntrinsicWidthConstraints& other)
{
    minimum += other.minimum;
    maximum += other.maximum;
    return *this;
}

inline IntrinsicWidthConstraints& IntrinsicWidthConstraints::operator+=(LayoutUnit value)
{
    expand(value);
    return *this;
}

inline IntrinsicWidthConstraints& IntrinsicWidthConstraints::operator-=(const IntrinsicWidthConstraints& other)
{
    minimum -= other.minimum;
    maximum -= other.maximum;
    return *this;
}

inline IntrinsicWidthConstraints& IntrinsicWidthConstraints::operator-=(LayoutUnit value)
{
    expand(-value);
    return *this;
}

}
}

#define SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_CONSTRAINTS(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Layout::ToValueTypeName) \
    static bool isType(const WebCore::Layout::ConstraintsForInFlowContent& constraints) { return constraints.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

