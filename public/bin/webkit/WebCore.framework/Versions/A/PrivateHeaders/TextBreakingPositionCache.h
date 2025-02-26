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

#include "Document.h"
#include "SecurityOriginData.h"
#include "TextBreakingPositionContext.h"
#include "Timer.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {
namespace Layout {

class TextBreakingPositionCache {
    WTF_MAKE_TZONE_ALLOCATED(TextBreakingPositionCache);
public:
    static constexpr size_t minimumRequiredTextLengthForContentBreakCache = 5;
    static constexpr size_t minimumRequiredContentBreaks = 3;

    static TextBreakingPositionCache& singleton();

    TextBreakingPositionCache();

    using Key = std::tuple<String, TextBreakingPositionContext, SecurityOriginData>;
    using List = Vector<size_t, 8>;
    void set(const Key&, List&& breakingPositionList);
    const List* get(const Key&) const;

    void clear();

private:
    void evict();

private:
    using TextBreakingPositionMap = UncheckedKeyHashMap<Key, List>;
    TextBreakingPositionMap m_breakingPositionMap;
    size_t m_cachedContentSize { 0 };
    Timer m_delayedEvictionTimer;
};

} // namespace Layout
} // namespace WebCore
