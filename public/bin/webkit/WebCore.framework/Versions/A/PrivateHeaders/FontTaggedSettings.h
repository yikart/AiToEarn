/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2016-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <array>
#include <wtf/ArgumentCoder.h>
#include <wtf/HashCountedSet.h>
#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WTF {
class TextStream;
}

namespace WebCore {

using FontTag = std::array<char, 4>;

inline FontTag fontFeatureTag(const char characters[4]) { return {{ characters[0], characters[1], characters[2], characters[3] }}; }

inline void add(Hasher& hasher, std::array<char, 4> array)
{
    uint32_t integer = (static_cast<uint8_t>(array[0]) << 24) | (static_cast<uint8_t>(array[1]) << 16) | (static_cast<uint8_t>(array[2]) << 8) | static_cast<uint8_t>(array[3]);
    add(hasher, integer);
}

struct FourCharacterTagHash {
    static unsigned hash(FontTag characters) { return computeHash(characters); }
    static bool equal(FontTag a, FontTag b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = true;
};

struct FourCharacterTagHashTraits : HashTraits<FontTag> {
    static const bool emptyValueIsZero = true;
    static void constructDeletedValue(FontTag& slot) { new (NotNull, std::addressof(slot)) FontTag({{ ff, ff, ff, ff }}); }
    static bool isDeletedValue(FontTag value) { return value == FontTag({{ ff, ff, ff, ff }}); }

private:
    static constexpr char ff = static_cast<char>(0xFF);
};

template <typename T>
class FontTaggedSetting {
private:
    friend struct IPC::ArgumentCoder<FontTaggedSetting, void>;
public:
    FontTaggedSetting() = delete;
    FontTaggedSetting(FontTag, T value);

    friend bool operator==(const FontTaggedSetting&, const FontTaggedSetting&) = default;
    bool operator<(const FontTaggedSetting<T>& other) const;

    FontTag tag() const { return m_tag; }
    T value() const { return m_value; }
    bool enabled() const { return value(); }

private:
    FontTag m_tag;
    T m_value;
};

template <typename T>
FontTaggedSetting<T>::FontTaggedSetting(FontTag tag, T value)
    : m_tag(tag)
    , m_value(value)
{
}

template<typename T> void add(Hasher& hasher, const FontTaggedSetting<T>& setting)
{
    add(hasher, setting.tag(), setting.value());
}

template <typename T>
class FontTaggedSettings {
private:
    friend struct IPC::ArgumentCoder<FontTaggedSettings, void>;
public:
    using Setting = FontTaggedSetting<T>;

    void insert(FontTaggedSetting<T>&&);
    friend bool operator==(const FontTaggedSettings&, const FontTaggedSettings&) = default;

    bool isEmpty() const { return !size(); }
    size_t size() const { return m_list.size(); }
    const FontTaggedSetting<T>& operator[](int index) const { return m_list[index]; }
    const FontTaggedSetting<T>& at(size_t index) const { return m_list.at(index); }

    typename Vector<FontTaggedSetting<T>>::const_iterator begin() const { return m_list.begin(); }
    typename Vector<FontTaggedSetting<T>>::const_iterator end() const { return m_list.end(); }

    unsigned hash() const;

private:
    Vector<FontTaggedSetting<T>> m_list;
};

template <typename T>
void FontTaggedSettings<T>::insert(FontTaggedSetting<T>&& feature)
{
    // This vector will almost always have 0 or 1 items in it. Don't bother with the overhead of a binary search or a hash set.
    // We keep the vector sorted alphabetically and replace any pre-existing value for a given tag.
    size_t i;
    for (i = 0; i < m_list.size(); ++i) {
        if (m_list[i].tag() < feature.tag())
            continue;
        if (m_list[i].tag() == feature.tag())
            m_list.remove(i);
        break;
    }
    m_list.insert(i, WTFMove(feature));
}

using FontFeature = FontTaggedSetting<int>;
using FontFeatureSettings = FontTaggedSettings<int>;
using FontVariationSettings = FontTaggedSettings<float>;

TextStream& operator<<(TextStream&, const FontTaggedSettings<int>&);
TextStream& operator<<(TextStream&, const FontTaggedSettings<float>&);

}

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
