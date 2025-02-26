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

#include "FormattingState.h"
#include "PlacedFloats.h"
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace Layout {

// BlockFormattingState holds the state for a particular block formatting context tree.
class BlockFormattingState : public FormattingState {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(BlockFormattingState);
public:
    BlockFormattingState(LayoutState&, const ElementBox& blockFormattingContextRoot);
    ~BlockFormattingState();

    const PlacedFloats& placedFloats() const { return m_placedFloats; }
    PlacedFloats& placedFloats() { return m_placedFloats; }

    // Since we layout the out-of-flow boxes at the end of the formatting context layout, it's okay to store them in the formatting state -as opposed to the containing block level.
    using OutOfFlowBoxList = Vector<CheckedRef<const Box>>;
    void addOutOfFlowBox(const Box& outOfFlowBox) { m_outOfFlowBoxes.append(outOfFlowBox); }
    void setOutOfFlowBoxes(OutOfFlowBoxList&& outOfFlowBoxes) { m_outOfFlowBoxes = WTFMove(outOfFlowBoxes); }
    const OutOfFlowBoxList& outOfFlowBoxes() const { return m_outOfFlowBoxes; }

    void setUsedVerticalMargin(const Box& layoutBox, const UsedVerticalMargin& usedVerticalMargin) { m_usedVerticalMargins.set(layoutBox, usedVerticalMargin); }
    UsedVerticalMargin usedVerticalMargin(const Box& layoutBox) const { return m_usedVerticalMargins.get(layoutBox); }
    bool hasUsedVerticalMargin(const Box& layoutBox) const { return m_usedVerticalMargins.contains(layoutBox); }

    void setHasClearance(const Box& layoutBox) { m_clearanceSet.add(layoutBox); }
    void clearHasClearance(const Box& layoutBox) { m_clearanceSet.remove(layoutBox); }
    bool hasClearance(const Box& layoutBox) const { return m_clearanceSet.contains(layoutBox); }

    void shrinkToFit();

private:
    PlacedFloats m_placedFloats;
    OutOfFlowBoxList m_outOfFlowBoxes;
    UncheckedKeyHashMap<CheckedRef<const Box>, UsedVerticalMargin> m_usedVerticalMargins;
    HashSet<CheckedRef<const Box>> m_clearanceSet;
};

}
}

SPECIALIZE_TYPE_TRAITS_LAYOUT_FORMATTING_STATE(BlockFormattingState, isBlockFormattingState())

