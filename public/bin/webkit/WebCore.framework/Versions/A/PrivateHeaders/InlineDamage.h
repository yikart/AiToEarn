/*
 * Copyright (C) 2021-2024 Apple Inc. All rights reserved.
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

#include "InlineDisplayContent.h"
#include "InlineLineTypes.h"
#include <wtf/OptionSet.h>

namespace WebCore {
namespace Layout {

class Box;
class InlineInvalidation;

class InlineDamage {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(InlineDamage);
public:
    InlineDamage() = default;
    ~InlineDamage();

    enum class Reason : uint8_t {
        Append                 = 1 << 0,
        Insert                 = 1 << 1,
        Remove                 = 1 << 2,
        ContentChange          = 1 << 3,
        StyleChange            = 1 << 4,
        Pagination             = 1 << 5
    };
    OptionSet<Reason> reasons() const { return m_damageReasons; }

    // FIXME: Add support for damage range with multiple, different damage types.
    struct LayoutPosition {
        size_t lineIndex { 0 };
        InlineItemPosition inlineItemPosition { };
        LayoutUnit partialContentTop;
    };
    std::optional<LayoutPosition> layoutStartPosition() const { return m_layoutStartPosition; }

    using TrailingDisplayBoxList = Vector<InlineDisplay::Box>;
    std::optional<InlineDisplay::Box> trailingContentForLine(size_t lineIndex) const;

    void addDetachedBox(UniqueRef<Box>&& layoutBox) { m_detachedLayoutBoxes.append(WTFMove(layoutBox)); }

    bool isInlineItemListDirty() const { return m_isInlineItemListDirty; }
    void setInlineItemListClean() { m_isInlineItemListDirty = false; }

#ifndef NDEBUG
    bool hasDetachedContent() const { return !m_detachedLayoutBoxes.isEmpty(); }
#endif

private:
    friend class InlineInvalidation;

    void setDamageReason(Reason reason) { m_damageReasons.add(reason); }
    void setLayoutStartPosition(LayoutPosition position) { m_layoutStartPosition = position; }
    void resetLayoutPosition();
    void setTrailingDisplayBoxes(TrailingDisplayBoxList&& trailingDisplayBoxes) { m_trailingDisplayBoxes = WTFMove(trailingDisplayBoxes); }
    void setInlineItemListDirty() { m_isInlineItemListDirty = true; }

    OptionSet<Reason> m_damageReasons;
    bool m_isInlineItemListDirty { false };
    std::optional<LayoutPosition> m_layoutStartPosition;
    TrailingDisplayBoxList m_trailingDisplayBoxes;
    Vector<UniqueRef<Box>> m_detachedLayoutBoxes;
};

inline std::optional<InlineDisplay::Box> InlineDamage::trailingContentForLine(size_t lineIndex) const
{
    if (m_trailingDisplayBoxes.isEmpty()) {
        // Couldn't compute trailing positions for damaged lines.
        return { };
    }
    if (!layoutStartPosition() || layoutStartPosition()->lineIndex > lineIndex) {
        ASSERT_NOT_REACHED();
        return { };
    }
    auto relativeLineIndex = lineIndex - layoutStartPosition()->lineIndex;
    if (relativeLineIndex >= m_trailingDisplayBoxes.size()) {
        // At the time of the damage, we didn't have this line yet -e.g content insert at a new line.
        return { };
    }
    return { m_trailingDisplayBoxes[relativeLineIndex] };
}

inline InlineDamage::~InlineDamage()
{
    m_trailingDisplayBoxes.clear();
    m_detachedLayoutBoxes.clear();
}

inline void InlineDamage::resetLayoutPosition()
{
    m_layoutStartPosition = { };
    m_trailingDisplayBoxes.clear();
    // Never reset m_detachedLayoutBoxes. We need to keep those layout boxes around until after layout.
}

}
}
