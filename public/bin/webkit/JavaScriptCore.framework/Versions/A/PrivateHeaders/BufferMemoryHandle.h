/*
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

#include "MemoryMode.h"
#include "Options.h"
#include "PageCount.h"

#include <wtf/CagedPtr.h>
#include <wtf/Expected.h>
#include <wtf/Function.h>
#include <wtf/RAMSize.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/StdSet.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WTF {
class PrintStream;
}

namespace JSC {

class LLIntOffsetsExtractor;

enum class GrowFailReason : uint8_t {
    InvalidDelta,
    InvalidGrowSize,
    WouldExceedMaximum,
    OutOfMemory,
    GrowSharedUnavailable,
};

struct BufferMemoryResult {
    enum Kind {
        Success,
        SuccessAndNotifyMemoryPressure,
        SyncTryToReclaimMemory
    };

    BufferMemoryResult() { }

    BufferMemoryResult(void* basePtr, Kind kind)
        : basePtr(basePtr)
        , kind(kind)
    {
    }

    void dump(PrintStream&) const;

    void* basePtr;
    Kind kind;
};

class BufferMemoryManager {
    WTF_MAKE_TZONE_ALLOCATED(BufferMemoryManager);
    WTF_MAKE_NONCOPYABLE(BufferMemoryManager);
public:
    friend class LazyNeverDestroyed<BufferMemoryManager>;

    BufferMemoryResult tryAllocateFastMemory();
    void freeFastMemory(void* basePtr);

    BufferMemoryResult tryAllocateGrowableBoundsCheckingMemory(size_t mappedCapacity);

    void freeGrowableBoundsCheckingMemory(void* basePtr, size_t mappedCapacity);

    bool isInGrowableOrFastMemory(void* address);

    // We allow people to "commit" more wasm memory than there is on the system since most of the time
    // people don't actually write to most of that memory. There is some chance that this gets us
    // jettisoned but that's possible anyway.
    inline size_t memoryLimit() const
    {
        if (productOverflows<size_t>(ramSize(),  3))
            return std::numeric_limits<size_t>::max();
        return ramSize() * 3;
    }

    // FIXME: Ideally, bmalloc would have this kind of mechanism. Then, we would just forward to that
    // mechanism here.
    BufferMemoryResult::Kind tryAllocatePhysicalBytes(size_t bytes);

    void freePhysicalBytes(size_t bytes);

    void dump(PrintStream& out) const;

    static BufferMemoryManager& singleton();

private:
    BufferMemoryManager() = default;

    Lock m_lock;
    unsigned m_maxFastMemoryCount { Options::maxNumWasmFastMemories() };
    Vector<void*> m_fastMemories;
    StdSet<std::pair<uintptr_t, size_t>> m_growableBoundsCheckingMemories;
    size_t m_physicalBytes { 0 };
};

class BufferMemoryHandle final : public ThreadSafeRefCounted<BufferMemoryHandle> {
    WTF_MAKE_NONCOPYABLE(BufferMemoryHandle);
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(BufferMemoryHandle, JS_EXPORT_PRIVATE);
    friend LLIntOffsetsExtractor;
public:
    BufferMemoryHandle(void*, size_t size, size_t mappedCapacity, PageCount initial, PageCount maximum, MemorySharingMode, MemoryMode);
    JS_EXPORT_PRIVATE ~BufferMemoryHandle();

    void* memory() const;
    size_t size(std::memory_order order = std::memory_order_seq_cst) const
    {
        if (m_sharingMode == MemorySharingMode::Default)
            return m_size.load(std::memory_order_relaxed);
        return m_size.load(order);
    }

    std::span<uint8_t> mutableSpan(std::memory_order order = std::memory_order_seq_cst) { return { static_cast<uint8_t*>(memory()), size(order) }; }

    size_t mappedCapacity() const { return m_mappedCapacity; }
    PageCount initial() const { return m_initial; }
    PageCount maximum() const { return m_maximum; }
    MemorySharingMode sharingMode() const { return m_sharingMode; }
    MemoryMode mode() const { return m_mode; }
    static constexpr ptrdiff_t offsetOfSize() { return OBJECT_OFFSETOF(BufferMemoryHandle, m_size); }
    Lock& lock() { return m_lock; }

    void updateSize(size_t size, std::memory_order order = std::memory_order_seq_cst)
    {
        m_size.store(size, order);
    }

    static size_t fastMappedRedzoneBytes();
    static size_t fastMappedBytes();

    static void* nullBasePointer();

private:
    using CagedMemory = CagedPtr<Gigacage::Primitive, void>;

    Lock m_lock;
    MemorySharingMode m_sharingMode { MemorySharingMode::Default };
    MemoryMode m_mode { MemoryMode::BoundsChecking };
    CagedMemory m_memory;
    std::atomic<size_t> m_size { 0 };
    size_t m_mappedCapacity { 0 };
    PageCount m_initial;
    PageCount m_maximum;
};

} // namespace JSC
