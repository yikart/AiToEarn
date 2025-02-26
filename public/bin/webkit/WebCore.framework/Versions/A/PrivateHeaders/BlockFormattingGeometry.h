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

#include "FormattingGeometry.h"

namespace WebCore {
namespace Layout {

class BlockFormattingContext;

// This class implements positioning and sizing for boxes participating in a block formatting context.
class BlockFormattingGeometry : public FormattingGeometry {
public:
    BlockFormattingGeometry(const BlockFormattingContext&);

    ContentHeightAndMargin inFlowContentHeightAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenVerticalValues&) const;
    ContentWidthAndMargin inFlowContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    LayoutUnit staticVerticalPosition(const ElementBox&, LayoutUnit containingBlockContentBoxTop) const;
    LayoutUnit staticHorizontalPosition(const ElementBox&, const HorizontalConstraints&) const;

    IntrinsicWidthConstraints intrinsicWidthConstraints(const ElementBox&) const;

    ContentWidthAndMargin computedContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, std::optional<LayoutUnit> availableWidthFloatAvoider) const;

private:
    ContentHeightAndMargin inFlowNonReplacedContentHeightAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenVerticalValues&) const;
    ContentWidthAndMargin inFlowNonReplacedContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;
    ContentWidthAndMargin inFlowReplacedContentWidthAndMargin(const ElementBox&, const HorizontalConstraints&, const OverriddenHorizontalValues&) const;

    const BlockFormattingContext& formattingContext() const { return downcast<BlockFormattingContext>(FormattingGeometry::formattingContext()); }
};

}
}

SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_GEOMETRY(BlockFormattingGeometry, isBlockFormattingGeometry())

