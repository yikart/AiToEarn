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

#include "BlockFormattingContext.h"
#include "BlockFormattingQuirks.h"
#include "TableWrapperBlockFormattingQuirks.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace Layout {

// This class implements the special block formatting context layout logic for the table wrapper.
// https://www.w3.org/TR/CSS22/tables.html#model
class TableWrapperBlockFormattingContext final : public BlockFormattingContext {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(TableWrapperBlockFormattingContext);
public:
    TableWrapperBlockFormattingContext(const ElementBox& formattingContextRoot, BlockFormattingState&);

    void layoutInFlowContent(const ConstraintsForInFlowContent&) final;

    void setHorizontalConstraintsIgnoringFloats(const HorizontalConstraints& horizontalConstraints) { m_horizontalConstraintsIgnoringFloats = horizontalConstraints; }

    const TableWrapperQuirks& formattingQuirks() const { return m_tableWrapperFormattingQuirks; }

private:
    void layoutTableBox(const ElementBox& tableBox, const ConstraintsForInFlowContent&);

    void computeBorderAndPaddingForTableBox(const ElementBox&, const HorizontalConstraints&);
    void computeWidthAndMarginForTableBox(const ElementBox&, const HorizontalConstraints&);
    void computeHeightAndMarginForTableBox(const ElementBox&, const ConstraintsForInFlowContent&);

    HorizontalConstraints m_horizontalConstraintsIgnoringFloats;
    const TableWrapperQuirks m_tableWrapperFormattingQuirks;
};

}
}

SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_CONTEXT(TableWrapperBlockFormattingContext, isTableWrapperBlockFormattingContext())

