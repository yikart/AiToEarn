/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#include "RenderStyle.h"
#include <wtf/HashFunctions.h>
#include <wtf/HashMap.h>
#include <wtf/Hasher.h>

namespace WebCore {
namespace Layout {

struct TextBreakingPositionContext {
    WhiteSpace whitespace { WhiteSpace::Normal };
    OverflowWrap overflowWrap { OverflowWrap::Normal };
    LineBreak lineBreak { LineBreak::Normal };
    WordBreak wordBreak { WordBreak::Normal };
    NBSPMode nbspMode { NBSPMode::Normal };
    AtomString locale;

    bool isHashTableDeletedValue { false };

    TextBreakingPositionContext(const RenderStyle&);
    TextBreakingPositionContext() = default;

    friend bool operator==(const TextBreakingPositionContext&, const TextBreakingPositionContext&) = default;
};

inline TextBreakingPositionContext::TextBreakingPositionContext(const RenderStyle& style)
    : whitespace(style.whiteSpace())
    , overflowWrap(style.overflowWrap())
    , lineBreak(style.lineBreak())
    , wordBreak(style.wordBreak())
    , nbspMode(style.nbspMode())
    , locale(style.computedLocale())
{
}

void add(Hasher&, const TextBreakingPositionContext&);

struct TextBreakingPositionContextHash {
    static unsigned hash(const TextBreakingPositionContext& context) { return computeHash(context); }
    static bool equal(const TextBreakingPositionContext& a, const TextBreakingPositionContext& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace Layout
} // namespace WebCore

namespace WTF {

template<>
struct HashTraits<WebCore::Layout::TextBreakingPositionContext> : GenericHashTraits<WebCore::Layout::TextBreakingPositionContext> {
    static void constructDeletedValue(WebCore::Layout::TextBreakingPositionContext& slot) { slot.isHashTableDeletedValue = true; }
    static bool isDeletedValue(const WebCore::Layout::TextBreakingPositionContext& value) { return value.isHashTableDeletedValue; }
    static WebCore::Layout::TextBreakingPositionContext emptyValue() { return { }; }
};

template<> struct DefaultHash<WebCore::Layout::TextBreakingPositionContext> : WebCore::Layout::TextBreakingPositionContextHash { };

} // namespace WTF
