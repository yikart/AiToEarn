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

#pragma once

#include "FlexFormattingConstraints.h"
#include "FlexFormattingUtils.h"
#include "FlexLayout.h"
#include "FlexRect.h"
#include "LayoutIntegrationUtils.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace Layout {

// This class implements the layout logic for flex formatting contexts.
// https://www.w3.org/TR/css-flexbox-1/
class FlexFormattingContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(FlexFormattingContext);
public:
    FlexFormattingContext(const ElementBox& flexBox, LayoutState&);

    void layout(const ConstraintsForFlexContent&);
    IntrinsicWidthConstraints computedIntrinsicWidthConstraints();

    const ElementBox& root() const { return m_flexBox; }
    const FlexFormattingUtils& formattingUtils() const { return m_flexFormattingUtils; }

    const BoxGeometry& geometryForFlexItem(const Box&) const;
    BoxGeometry& geometryForFlexItem(const Box&);

    const IntegrationUtils& integrationUtils() const { return m_integrationUtils; }

private:
    FlexLayout::LogicalFlexItems convertFlexItemsToLogicalSpace(const ConstraintsForFlexContent&);
    void setFlexItemsGeometry(const FlexLayout::LogicalFlexItems&, const FlexLayout::LogicalFlexItemRects&, const ConstraintsForFlexContent&);
    void positionOutOfFlowChildren();

    std::optional<LayoutUnit> computedAutoMarginValueForFlexItems(const ConstraintsForFlexContent&);

private:
    const ElementBox& m_flexBox;
    LayoutState& m_globalLayoutState;
    const FlexFormattingUtils m_flexFormattingUtils;
    const IntegrationUtils m_integrationUtils;
};

}
}

