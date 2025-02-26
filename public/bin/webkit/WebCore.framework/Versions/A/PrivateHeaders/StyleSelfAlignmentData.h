/*
 * Copyright (C) 2015 Igalia S.L. All rights reserved.
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

#include "RenderStyleConstants.h"
#include <wtf/EnumTraits.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class StyleSelfAlignmentData {
public:
    constexpr StyleSelfAlignmentData() = default;

    // Style data for Self-Aligment and Default-Alignment properties: align-{self, items}, justify-{self, items}.
    // [ <self-position> && <overflow-position>? ] | [ legacy && [ left | right | center ] ]
    constexpr StyleSelfAlignmentData(ItemPosition position, OverflowAlignment overflow = OverflowAlignment::Default, ItemPositionType positionType = ItemPositionType::NonLegacy)
        : m_position(enumToUnderlyingType(position))
        , m_positionType(enumToUnderlyingType(positionType))
        , m_overflow(enumToUnderlyingType(overflow))
    {
    }

    void setPosition(ItemPosition position) { m_position = enumToUnderlyingType(position); }
    void setPositionType(ItemPositionType positionType) { m_positionType = enumToUnderlyingType(positionType); }
    void setOverflow(OverflowAlignment overflow) { m_overflow = enumToUnderlyingType(overflow); }

    ItemPosition position() const { return static_cast<ItemPosition>(m_position); }
    ItemPositionType positionType() const { return static_cast<ItemPositionType>(m_positionType); }
    OverflowAlignment overflow() const { return static_cast<OverflowAlignment>(m_overflow); }

    friend bool operator==(const StyleSelfAlignmentData&, const StyleSelfAlignmentData&) = default;

private:
    uint8_t m_position : 4 { 0 }; // ItemPosition
    uint8_t m_positionType: 1 { 0 }; // ItemPositionType: Whether or not alignment uses the 'legacy' keyword.
    uint8_t m_overflow : 2 { 0 }; // OverflowAlignment
};

WTF::TextStream& operator<<(WTF::TextStream&, const StyleSelfAlignmentData&);

} // namespace WebCore
