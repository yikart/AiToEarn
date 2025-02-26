/*
 * Copyright (C) 2022-2023 Apple Inc. All rights reserved.
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

#include "Options.h"

#include <optional>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/StdMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class AssemblyCommentRegistry {
    WTF_MAKE_TZONE_ALLOCATED(AssemblyCommentRegistry);
    WTF_MAKE_NONCOPYABLE(AssemblyCommentRegistry);
public:
    static AssemblyCommentRegistry& singleton();
    static void initialize();

    Lock& getLock() WTF_RETURNS_LOCK(m_lock) { return m_lock; }

    using CommentMap = UncheckedKeyHashMap<uintptr_t, String>;

    void registerCodeRange(void* start, void* end, CommentMap&& map)
    {
        if (LIKELY(!Options::needDisassemblySupport()) || !map.size())
            return;
        Locker locker { m_lock };

        auto newStart = std::bit_cast<uintptr_t>(start);
        auto newEnd = std::bit_cast<uintptr_t>(end);
        RELEASE_ASSERT(newStart < newEnd);

#if ASSERT_ENABLED
        for (auto it : m_comments) {
            auto thisStart = orderedKeyInverse(it.first);
            auto& [thisEnd, _] = it.second;
            ASSERT(newEnd <= thisStart
                || thisEnd <= newStart);
            ASSERT(thisStart < thisEnd);
        }
#else
        (void) newStart;
#endif

        m_comments.emplace(orderedKey(start), std::pair { newEnd, WTFMove(map) });
    }

    void unregisterCodeRange(void* start, void* end)
    {
        if (LIKELY(!Options::needDisassemblySupport()))
            return;
        Locker locker { m_lock };

        auto it = m_comments.find(orderedKey(start));
        if (it == m_comments.end())
            return;

        auto& [foundEnd, _] = it->second; 
        RELEASE_ASSERT(foundEnd == std::bit_cast<uintptr_t>(end));
        m_comments.erase(it);
    }

    inline std::optional<String> comment(void* in)
    {
        if (LIKELY(!Options::needDisassemblySupport()))
            return { };
        Locker locker { m_lock };
        auto it = m_comments.lower_bound(orderedKey(in));

        if (it == m_comments.end())
            return { };
        
        auto& [end, map] = it->second;
        if (std::bit_cast<uintptr_t>(in) > std::bit_cast<uintptr_t>(end))
            return { };

        auto it2 = map.find(std::bit_cast<uintptr_t>(in));

        if (it2 == map.end())
            return { };

        return { it2->value.isolatedCopy() };
    }

    AssemblyCommentRegistry() = default;

private:

    // Flip ordering for lower_bound comparator to work.
    inline uintptr_t orderedKey(void* in) { return std::numeric_limits<uintptr_t>::max() - std::bit_cast<uintptr_t>(in); }
    inline uintptr_t orderedKeyInverse(uintptr_t in) { return std::numeric_limits<uintptr_t>::max() - in; }

    Lock m_lock;
    StdMap<uintptr_t, std::pair<uintptr_t, CommentMap>> m_comments WTF_GUARDED_BY_LOCK(m_lock);
};

} // namespace JSC
