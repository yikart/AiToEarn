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

#if CPU(ARM64E) && ENABLE(JIT)

#include <wtf/BitSet.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class SecureARM64EHashPins {
public:
    JS_EXPORT_PRIVATE void initializeAtStartup();
    JS_EXPORT_PRIVATE void allocatePinForCurrentThread();
    JS_EXPORT_PRIVATE void deallocatePinForCurrentThread();
    uint64_t pinForCurrentThread();

    static constexpr size_t numEntriesPerPage = 64;

    struct Entry {
        uint64_t pin;
        uint64_t key;
    };

    struct alignas(alignof(Entry)) Page {
        Page();

        static size_t allocationSize() { return sizeof(Page) + numEntriesPerPage * sizeof(Entry); }

        static constexpr size_t mask = numEntriesPerPage - 1;
        static_assert(hasOneBitSet(numEntriesPerPage));
        static_assert(!!mask);
        static_assert(!(mask & numEntriesPerPage));

        ALWAYS_INLINE Entry& entry(size_t index)
        { 
            return entries()[index & mask];
        }

        ALWAYS_INLINE Entry& fastEntryUnchecked(size_t index)
        {
            ASSERT((index & mask) == index);
            return entries()[index];
        }
        
        ALWAYS_INLINE void setIsInUse(size_t index)
        {
            isInUseMap.set(index & mask);
        }

        ALWAYS_INLINE void clearIsInUse(size_t index)
        {
            isInUseMap.set(index & mask, false);
        }

        ALWAYS_INLINE bool isInUse(size_t index)
        {
            return isInUseMap.get(index & mask);
        }

        ALWAYS_INLINE size_t findClearBit()
        {
            return isInUseMap.findBit(0, false);
        }

        template <typename Function>
        ALWAYS_INLINE void forEachSetBit(Function function)
        {
            isInUseMap.forEachSetBit(function);
        }

        Page* next { nullptr };
    private:
        Entry* entries() { return std::bit_cast<Entry*>(this + 1); }
        WTF::BitSet<numEntriesPerPage> isInUseMap;
    };

    static_assert(sizeof(Page) % alignof(Entry) == 0);

    struct alignas(alignof(Page)) Metadata {
        Atomic<uint64_t> nextPin { 1 };
        Atomic<uint32_t> assertNotReentrant { 0 };
    };

    static_assert(sizeof(Metadata) % alignof(Page) == 0);

private:
    static uint64_t keyForCurrentThread();
    bool allocatePinForCurrentThreadImpl(const AbstractLocker&);

    struct FindResult {
        Entry* entry { nullptr };
        size_t index { std::numeric_limits<size_t>::max() };
        Page* page { nullptr };
    };
    FindResult findFirstEntry();

    Metadata* metadata();
    inline Page* firstPage() { return std::bit_cast<Page*>(m_memory); }

    template <typename Function>
    void forEachPage(Function);

    template <typename Function>
    void forEachEntry(Function);

    void* m_memory { nullptr };
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

#endif // CPU(ARM64E) && ENABLE(JIT)
