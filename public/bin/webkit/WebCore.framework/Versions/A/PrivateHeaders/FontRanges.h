/*
 * Copyright (C) 2008-2023 Apple Inc. All rights reserved.
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

#include "Font.h"
#include <wtf/Vector.h>

namespace WebCore {

class FontAccessor;

enum class ExternalResourceDownloadPolicy : bool {
    Forbid,
    Allow
};

enum class IsGenericFontFamily : bool {
    No,
    Yes
};

class FontRanges {
public:
    struct Range {
        Range(char32_t from, char32_t to, Ref<FontAccessor>&& fontAccessor)
            : m_from(from)
            , m_to(to)
            , m_fontAccessor(WTFMove(fontAccessor))
        {
        }

        Range(const Range&) = default;
        Range(Range&&) = default;
        Range& operator=(const Range&) = delete;
        Range& operator=(Range&&) = default;

        char32_t from() const { return m_from; }
        char32_t to() const { return m_to; }
        WEBCORE_EXPORT const Font* font(ExternalResourceDownloadPolicy) const;
        const FontAccessor& fontAccessor() const { return m_fontAccessor; }

    private:
        char32_t m_from;
        char32_t m_to;
        Ref<FontAccessor> m_fontAccessor;
    };

    FontRanges() = default;
    explicit FontRanges(RefPtr<Font>&&);
    ~FontRanges();

    FontRanges(const FontRanges&) = default;
    FontRanges(FontRanges&& other, IsGenericFontFamily);
    FontRanges& operator=(FontRanges&&) = default;

    bool isNull() const { return m_ranges.isEmpty(); }

    void appendRange(Range&& range) { m_ranges.append(WTFMove(range)); }
    unsigned size() const { return m_ranges.size(); }
    const Range& rangeAt(unsigned i) const { return m_ranges[i]; }

    void shrinkToFit() { m_ranges.shrinkToFit(); }

    WEBCORE_EXPORT GlyphData glyphDataForCharacter(char32_t, ExternalResourceDownloadPolicy) const;
    WEBCORE_EXPORT const Font* fontForCharacter(char32_t) const;
    WEBCORE_EXPORT const Font& fontForFirstRange() const;
    bool isLoading() const;
    bool isGenericFontFamily() const { return m_isGenericFontFamily == IsGenericFontFamily::Yes; }

private:
    Vector<Range, 1> m_ranges;
    IsGenericFontFamily m_isGenericFontFamily { IsGenericFontFamily::No };
};

}
