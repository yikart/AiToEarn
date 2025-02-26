/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "TextRun.h"
#include <wtf/HashFunctions.h>
#include <wtf/HashTraits.h>
#include <wtf/Hasher.h>

namespace WebCore {

inline void add(Hasher& hasher, const ExpansionBehavior& expansionBehavior)
{
    add(hasher, expansionBehavior.left, expansionBehavior.right);
}

inline void add(Hasher& hasher, const TextRun& textRun)
{
    add(hasher, textRun.m_text, textRun.m_tabSize, textRun.m_xpos, textRun.m_horizontalGlyphStretch, textRun.m_expansion, textRun.m_expansionBehavior, textRun.m_allowTabs, textRun.m_direction, textRun.m_directionalOverride, textRun.m_characterScanForCodePath, textRun.m_disableSpacing);
}

inline bool TextRun::operator==(const TextRun& other) const
{
    return m_text == other.m_text
        && m_tabSize == other.m_tabSize
        && m_xpos == other.m_xpos
        && m_horizontalGlyphStretch == other.m_horizontalGlyphStretch
        && m_expansion == other.m_expansion
        && m_expansionBehavior == other.m_expansionBehavior
        && m_allowTabs == other.m_allowTabs
        && m_direction == other.m_direction
        && m_directionalOverride == other.m_directionalOverride
        && m_characterScanForCodePath == other.m_characterScanForCodePath
        && m_disableSpacing == other.m_disableSpacing
        && m_textSpacingState == other.m_textSpacingState;
}

struct TextRunHash {
    static unsigned hash(const TextRun& textRun) { return computeHash(textRun); }
    static bool equal(const TextRun& a, const TextRun& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore

namespace WTF {

template<> struct DefaultHash<WebCore::TextRun> : WebCore::TextRunHash { };

template<> struct HashTraits<WebCore::TextRun> : GenericHashTraits<WebCore::TextRun> {
    static bool isDeletedValue(const WebCore::TextRun& value) { return value.isHashTableDeletedValue(); }
    static bool isEmptyValue(const WebCore::TextRun& value) { return value.isHashTableEmptyValue(); }
    static void constructDeletedValue(WebCore::TextRun& slot) { new (NotNull, &slot) WebCore::TextRun(WTF::HashTableDeletedValue); }
    static WebCore::TextRun emptyValue() { return WebCore::TextRun(WTF::HashTableEmptyValue); }
};

} // namespace WTF
