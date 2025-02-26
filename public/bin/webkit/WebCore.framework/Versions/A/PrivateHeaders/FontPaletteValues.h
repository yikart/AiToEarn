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

#include "Color.h"
#include "Gradient.h"
#include <variant>
#include <wtf/HashFunctions.h>
#include <wtf/Vector.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

struct FontPaletteIndex {
    enum class Type : uint8_t;

    FontPaletteIndex() = default;

    FontPaletteIndex(Type type)
        : type(type)
    {
        ASSERT(type == Type::Light || type == Type::Dark);
    }

    FontPaletteIndex(unsigned integer)
        : type(Type::Integer)
        , integer(integer)
    {
    }

    operator bool() const
    {
        return type != Type::Integer || integer;
    }

    bool operator==(const FontPaletteIndex& other) const
    {
        if (type != other.type)
            return false;
        if (type == Type::Integer)
            return integer == other.integer;
        return true;
    }

    enum class Type : uint8_t {
        Light,
        Dark,
        Integer
    };
    Type type { Type::Integer };

    unsigned integer { 0 };
};

inline void add(Hasher& hasher, const FontPaletteIndex& paletteIndex)
{
    add(hasher, paletteIndex.type);
    if (paletteIndex.type == FontPaletteIndex::Type::Integer)
        add(hasher, paletteIndex.integer);
}

class FontPaletteValues {
public:
    using OverriddenColor = std::pair<unsigned, Color>;

    FontPaletteValues() = default;

    FontPaletteValues(std::optional<FontPaletteIndex> basePalette, Vector<OverriddenColor>&& overrideColors)
        : m_basePalette(basePalette)
        , m_overrideColors(WTFMove(overrideColors))
    {
    }

    std::optional<FontPaletteIndex> basePalette() const
    {
        return m_basePalette;
    }

    const Vector<OverriddenColor>& overrideColors() const
    {
        return m_overrideColors;
    }

    operator bool() const
    {
        return m_basePalette || !m_overrideColors.isEmpty();
    }

    bool operator==(const FontPaletteValues& other) const
    {
        return m_basePalette == other.m_basePalette && m_overrideColors == other.m_overrideColors;
    }

private:
    std::optional<FontPaletteIndex> m_basePalette;
    Vector<OverriddenColor> m_overrideColors;
};

inline void add(Hasher& hasher, const FontPaletteValues& fontPaletteValues)
{
    add(hasher, fontPaletteValues.basePalette());
    add(hasher, fontPaletteValues.overrideColors());
}

} // namespace WebCore

namespace WTF {

template<> struct DefaultHash<WebCore::FontPaletteValues> {
    static unsigned hash(const WebCore::FontPaletteValues& key) { return computeHash(key); }
    static bool equal(const WebCore::FontPaletteValues& a, const WebCore::FontPaletteValues& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

}
