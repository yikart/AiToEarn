/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "InlineContentBreaker.h"
#include "InlineDisplayContent.h"
#include "InlineLevelBox.h"
#include <wtf/Range.h>

namespace WebCore {
namespace Layout {

class InlineFormattingContext;
class Line;
class LineBox;
class Rect;

class RubyFormattingContext {
public:
    // Line building
    static InlineLayoutUnit annotationBoxLogicalWidth(const Box& rubyBaseLayoutBox, InlineFormattingContext&);
    static InlineLayoutUnit baseEndAdditionalLogicalWidth(const Box& rubyBaseLayoutBox, const Line::RunList&, const InlineContentBreaker::ContinuousContent::RunList&, InlineFormattingContext&);
    static UncheckedKeyHashMap<const Box*, InlineLayoutUnit> applyRubyAlign(Line&, InlineFormattingContext&);
    static InlineLayoutUnit applyRubyAlignOnAnnotationBox(Line&, InlineLayoutUnit spaceToDistribute, InlineFormattingContext&);

    // Line box building
    static void applyAnnotationContributionToLayoutBounds(LineBox&, const InlineFormattingContext&);

    // Display content building
    static InlineLayoutUnit baseEndAdditionalLogicalWidth(const Box& rubyBaseLayoutBox, const InlineDisplay::Box& baseDisplayBox, InlineLayoutUnit baseContentWidth, InlineFormattingContext&);
    static InlineLayoutPoint placeAnnotationBox(const Box& rubyBaseLayoutBox, const Rect& rubyBaseMarginBoxLogicalRect, InlineFormattingContext&);
    static InlineLayoutSize sizeAnnotationBox(const Box& rubyBaseLayoutBox, const Rect& rubyBaseMarginBoxLogicalRect, InlineFormattingContext&);

    static void applyRubyOverhang(InlineFormattingContext& parentFormattingContext, InlineLayoutUnit lineLogicalHeight, InlineDisplay::Boxes&, const Vector<WTF::Range<size_t>>& interlinearRubyColumnRangeList);

    enum class RubyBasesMayNeedResizing : bool { No, Yes };
    static void applyAlignmentOffsetList(InlineDisplay::Boxes&, const UncheckedKeyHashMap<const Box*, InlineLayoutUnit>& alignmentOffsetList, RubyBasesMayNeedResizing, InlineFormattingContext&);
    static void applyAnnotationAlignmentOffset(InlineDisplay::Boxes&, InlineLayoutUnit alignmentOffset, InlineFormattingContext&);

    // Miscellaneous helpers
    static bool hasInterlinearAnnotation(const Box& rubyBaseLayoutBox);
    static bool hasInterCharacterAnnotation(const Box& rubyBaseLayoutBox);

private:
    using MaximumLayoutBoundsStretchMap = UncheckedKeyHashMap<const InlineLevelBox*, InlineLevelBox::AscentAndDescent>;
    static void adjustLayoutBoundsAndStretchAncestorRubyBase(LineBox&, InlineLevelBox& rubyBaseInlineBox, MaximumLayoutBoundsStretchMap&, const InlineFormattingContext&);

    static size_t applyRubyAlignOnBaseContent(size_t rubyBaseStart, Line&, UncheckedKeyHashMap<const Box*, InlineLayoutUnit>& alignmentOffsetList, InlineFormattingContext&);
    static InlineLayoutUnit overhangForAnnotationBefore(const Box& rubyBaseLayoutBox, size_t rubyBaseStart, const InlineDisplay::Boxes&, InlineLayoutUnit lineLogicalHeight, InlineFormattingContext&);
    static InlineLayoutUnit overhangForAnnotationAfter(const Box& rubyBaseLayoutBox, WTF::Range<size_t> rubyBaseRange, const InlineDisplay::Boxes&, InlineLayoutUnit lineLogicalHeight, InlineFormattingContext&);
};

} // namespace Layout
} // namespace WebCore
