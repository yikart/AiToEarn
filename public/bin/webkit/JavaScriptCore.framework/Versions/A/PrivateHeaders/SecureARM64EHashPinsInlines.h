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

#include "SecureARM64EHashPins.h"

#if CPU(ARM64E) && ENABLE(JIT)

namespace JSC {

ALWAYS_INLINE uint64_t SecureARM64EHashPins::keyForCurrentThread()
{
    uint64_t result;
    asm (
        "mrs %x[result], TPIDRRO_EL0"
        : [result] "=r" (result)
        :
        :
    );
#if !HAVE(SIMPLIFIED_FAST_TLS_BASE)
    result = result & ~0x7ull;
#endif
    return result;
}

template <typename Function>
ALWAYS_INLINE void SecureARM64EHashPins::forEachPage(Function function)
{
    Page* page = firstPage();
    do {
        RELEASE_ASSERT(isJITPC(page));
        if (function(*page) == IterationStatus::Done)
            return;
        page = page->next;
    } while (page);
}

template <typename Function>
ALWAYS_INLINE void SecureARM64EHashPins::forEachEntry(Function function)
{
    size_t baseIndex = 0;
    forEachPage([&] (Page& page) {
        IterationStatus iterationStatus = IterationStatus::Continue;
        page.forEachSetBit([&] (size_t bitIndex) {
            Entry& entry = page.fastEntryUnchecked(bitIndex);
            ASSERT(isJITPC(&entry));
            size_t index = baseIndex + bitIndex;
            iterationStatus = function(page, entry, index);
            return iterationStatus;
        });
        baseIndex += numEntriesPerPage;
        return iterationStatus;
    });
}

ALWAYS_INLINE auto SecureARM64EHashPins::findFirstEntry() -> FindResult
{
    uint64_t key = keyForCurrentThread();
    // We can call this concurrently to the bit vector being modified
    // since we either call this when we're locked, or we call it when
    // we know the entry already exists. When the entry already exists,
    // we know that the bit can't get flipped spuriously during concurrent
    // modification, so we're guaranteed to find the value. We might see
    // an entry as it's being written to, but that's also fine, since it
    // won't have our same key. It'll either be zero, or a different key.

    FindResult result;
    forEachEntry([&] (Page& page, Entry& entry, size_t index) {
        if (entry.key == key) {
            result.entry = &entry;
            result.page = &page;
            result.index = index;
            return IterationStatus::Done;
        }
        return IterationStatus::Continue;
    });

    return result;
}

ALWAYS_INLINE uint64_t SecureARM64EHashPins::pinForCurrentThread()
{
    if (LIKELY(g_jscConfig.useFastJITPermissions))
        return findFirstEntry().entry->pin;
    return 1;
}

} // namespace JSC

#endif // CPU(ARM64E) && ENABLE(JIT)
