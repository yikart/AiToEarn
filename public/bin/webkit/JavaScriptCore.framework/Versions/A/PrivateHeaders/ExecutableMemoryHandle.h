/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
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

#include "JSExportMacros.h"

#if ENABLE(LIBPAS_JIT_HEAP) && ENABLE(JIT)
#include <wtf/CodePtr.h>
#include <wtf/ThreadSafeRefCounted.h>
#else
#include <wtf/MetaAllocatorHandle.h>
#endif

#if !USE(SYSTEM_MALLOC)
#include <bmalloc/BPlatform.h>
#if BENABLE(LIBPAS) && (OS(DARWIN) || OS(LINUX))
#define ENABLE_LIBPAS_JIT_HEAP 1
#endif
#endif

namespace JSC {

#if ENABLE(LIBPAS_JIT_HEAP) && ENABLE(JIT)
DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(ExecutableMemoryHandle);
class ExecutableMemoryHandle : public ThreadSafeRefCounted<ExecutableMemoryHandle> {
    WTF_MAKE_FAST_COMPACT_ALLOCATED_WITH_HEAP_IDENTIFIER(ExecutableMemoryHandle);

public:
    using MemoryPtr = CodePtr<WTF::HandleMemoryPtrTag>;

    // Don't call this directly - for proper accounting it's necessary to call
    // ExecutableAllocator::allocate().
    JS_EXPORT_PRIVATE static RefPtr<ExecutableMemoryHandle> createImpl(size_t sizeInBytes);

    JS_EXPORT_PRIVATE ~ExecutableMemoryHandle();

    MemoryPtr start() const
    {
        return m_start;
    }

    MemoryPtr end() const
    {
        return MemoryPtr::fromUntaggedPtr(reinterpret_cast<void*>(endAsInteger()));
    }

    uintptr_t startAsInteger() const
    {
        return m_start.untaggedPtr<uintptr_t>();
    }

    uintptr_t endAsInteger() const
    {
        return startAsInteger() + sizeInBytes();
    }

    size_t sizeInBytes() const { return m_sizeInBytes; }

    bool containsIntegerAddress(uintptr_t address) const
    {
        uintptr_t startAddress = startAsInteger();
        uintptr_t endAddress = startAddress + sizeInBytes();
        return address >= startAddress && address < endAddress;
    }

    bool contains(void* address) const
    {
        return containsIntegerAddress(reinterpret_cast<uintptr_t>(address));
    }

    JS_EXPORT_PRIVATE void shrink(size_t newSizeInBytes);

    void* key() const
    {
        return m_start.untaggedPtr();
    }

    void dump(PrintStream& out) const
    {
        out.print(RawPointer(key()));
    }

private:
    ExecutableMemoryHandle(MemoryPtr start, size_t sizeInBytes)
        : m_sizeInBytes(sizeInBytes)
        , m_start(start)
    {
        ASSERT(sizeInBytes == m_sizeInBytes); // executable memory region does not exceed 4GB.
    }

    unsigned m_sizeInBytes;
    MemoryPtr m_start;
};
#else // not (ENABLE(LIBPAS_JIT_HEAP) && ENABLE(JIT))
typedef WTF::MetaAllocatorHandle ExecutableMemoryHandle;
#endif // ENABLE(LIBPAS_JIT_HEAP) && ENABLE(JIT)

} // namespace JSC

