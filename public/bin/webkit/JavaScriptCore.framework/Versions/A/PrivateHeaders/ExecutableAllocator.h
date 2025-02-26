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

#include <bit>
#include "AssemblerCommon.h"
#include "ExecutableMemoryHandle.h"
#include "FastJITPermissions.h"
#include "JITCompilationEffort.h"
#include "JSCConfig.h"
#include "JSCPtrTag.h"
#include "Options.h"
#include <limits>
#include <wtf/Assertions.h>
#include <wtf/ForbidHeapAllocation.h>
#include <wtf/Gigacage.h>
#include <wtf/Lock.h>
#include <wtf/TZoneMalloc.h>

#if !ENABLE(LIBPAS_JIT_HEAP)
#include <wtf/MetaAllocator.h>
#endif

#if OS(DARWIN)
#include <libkern/OSCacheControl.h>
#include <sys/mman.h>
#endif

#if ENABLE(MPROTECT_RX_TO_RWX)
#define EXECUTABLE_POOL_WRITABLE false
#else
#define EXECUTABLE_POOL_WRITABLE true
#endif

namespace JSC {

static constexpr unsigned jitAllocationGranule = 32;

class ExecutableAllocatorBase {
    WTF_FORBID_HEAP_ALLOCATION;
    WTF_MAKE_NONCOPYABLE(ExecutableAllocatorBase);
public:
    bool isValid() const { return false; }

    static bool underMemoryPressure() { return false; }

    static double memoryPressureMultiplier(size_t) { return 1.0; }

    static void dumpProfile() { }

    RefPtr<ExecutableMemoryHandle> allocate(size_t, JITCompilationEffort) { return nullptr; }

    static void disableJIT() { };
    
    bool isValidExecutableMemory(const AbstractLocker&, void*) { return false; }

    static size_t committedByteCount() { return 0; }

    Lock& getLock() const WTF_RETURNS_LOCK(m_lock)
    {
        return m_lock;
    }

protected:
    ExecutableAllocatorBase() = default;
    ~ExecutableAllocatorBase() = default;

private:
    mutable Lock m_lock;
};

#if ENABLE(JIT)

JS_EXPORT_PRIVATE void* startOfFixedExecutableMemoryPoolImpl();
JS_EXPORT_PRIVATE void* endOfFixedExecutableMemoryPoolImpl();

template<typename T = void*>
T startOfFixedExecutableMemoryPool()
{
    return std::bit_cast<T>(startOfFixedExecutableMemoryPoolImpl());
}

template<typename T = void*>
T endOfFixedExecutableMemoryPool()
{
    return std::bit_cast<T>(endOfFixedExecutableMemoryPoolImpl());
}

ALWAYS_INLINE bool isJITPC(void* pc)
{
    return g_jscConfig.startExecutableMemory <= pc && pc < g_jscConfig.endExecutableMemory;
}

JS_EXPORT_PRIVATE void dumpJITMemory(const void*, const void*, size_t);

#if ENABLE(MPROTECT_RX_TO_RWX)
JS_EXPORT_PRIVATE void* performJITMemcpyWithMProtect(void *dst, const void *src, size_t n);
#endif

#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
// This helps with error logging in the case of a crash, as it places the crash
// PC at the point in the instruction stream which would be corrupted --
// while preserving the stack so that we can use that to figure out who might be
// responsible for generating the corrupted instructions.
static NEVER_INLINE NO_RETURN_DUE_TO_CRASH NOT_TAIL_CALLED void dieByJumpingIntoJITBufferWithInfo(int line, void* buffer, size_t offset, size_t size, auto info1, auto info2, auto info3)
{
    RELEASE_ASSERT(offset <= size);
    RELEASE_ASSERT(offset <= std::numeric_limits<uint32_t>::max());
    RELEASE_ASSERT(size <= std::numeric_limits<uint32_t>::max());
    void* targetInstr = reinterpret_cast<void*>(reinterpret_cast<uintptr_t>(buffer) + offset);

    // Since this function should only be called w/ buffer+offset pointing at
    // already-zeroed memory, re-zeroing it is somewhat superflous on ARM64E,
    // but necessary on x86-64 (where 0x00 0x00 encodes addb %al, (%rax)), and
    // even on the former ensures that execution will never continue past the
    // branch out of this function even if it is called improperly.
#if OS(DARWIN) && CPU(X86_64)
    memset(reinterpret_cast<char*>(targetInstr), 0xF4, 1);
    sys_icache_invalidate(buffer, size);
#elif OS(DARWIN) && CPU(ARM64)
    memset(reinterpret_cast<char*>(targetInstr), 0, 4);
    sys_icache_invalidate(buffer, size);
#else
#error "JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES not supported on this platform."
#endif

    uint64_t lineGpr = static_cast<uint64_t>(static_cast<int64_t>(line));
    uint64_t bufferGpr = reinterpret_cast<uintptr_t>(buffer);
    uint64_t sizeOffsetGpr = static_cast<uint64_t>(offset | size << 32);
    uint64_t info1Gpr = wtfCrashArg(info1);
    uint64_t info2Gpr = wtfCrashArg(info2);
    uint64_t info3Gpr = wtfCrashArg(info3);

    // We do this instead of using explicit register variables because clang
    // seems to struggle with placing those in the same function as an outward
    // function call
#if CPU(X86_64)
    __asm__ volatile(
        "mov %1, %%" CRASH_GPR0 "\n"
        "mov %2, %%" CRASH_GPR1 "\n"
        "mov %3, %%" CRASH_GPR2 "\n"
        "mov %4, %%" CRASH_GPR3 "\n"
        "mov %5, %%" CRASH_GPR4 "\n"
        "mov %6, %%" CRASH_GPR5 "\n"
        "jmp *%0"
            : : "r"(targetInstr), "r"(lineGpr), "r"(bufferGpr), "r"(sizeOffsetGpr), "r"(info1Gpr), "r"(info2Gpr), "r"(info3Gpr)
            : CRASH_GPR0, CRASH_GPR1, CRASH_GPR2, CRASH_GPR3, CRASH_GPR4, CRASH_GPR5);
#elif CPU(ARM64)
    __asm__ volatile(
        "mov " CRASH_GPR0 ", %1\n"
        "mov " CRASH_GPR1 ", %2\n"
        "mov " CRASH_GPR2 ", %3\n"
        "mov " CRASH_GPR3 ", %4\n"
        "mov " CRASH_GPR4 ", %5\n"
        "mov " CRASH_GPR5 ", %6\n"
        "br %0"
            : : "r"(targetInstr), "r"(lineGpr), "r"(bufferGpr), "r"(sizeOffsetGpr), "r"(info1Gpr), "r"(info2Gpr), "r"(info3Gpr)
            : CRASH_GPR0, CRASH_GPR1, CRASH_GPR2, CRASH_GPR3, CRASH_GPR4, CRASH_GPR5);
#else
#error "JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES not supported on this platform."
#endif

            __builtin_unreachable();
}

#define CRASH_BY_JUMPING_INTO_JIT_BUFFER_WITH_INFO(...) do { \
        WTF::isIntegralOrPointerType(__VA_ARGS__); \
        compilerFenceForCrash(); \
        dieByJumpingIntoJITBufferWithInfo(__LINE__, __VA_ARGS__); \
    } while (false)

// We only check whether the run also exists in the source buffer
// once we know we're going to crash and thus can afford the
// overhead.
#define RELEASE_ASSERT_ZERO_CHECK(zeroCount, dstBuff, srcBuff, buffSize, nextIndex) do { \
        if (UNLIKELY(zeroCount > maxZeroByteRunLength)) { \
            size_t firstZeroIndex = nextIndex - zeroCount; \
            auto dstBuffZeroes = reinterpret_cast<const char*>(dstBuff) + firstZeroIndex; \
            auto srcBuffZeroes = reinterpret_cast<const char*>(srcBuff) + firstZeroIndex; \
            bool sourceBufferBytesAlsoZero = !(std::memcmp(dstBuffZeroes, srcBuffZeroes, runLength)); \
            CRASH_BY_JUMPING_INTO_JIT_BUFFER_WITH_INFO(dstBuff, firstZeroIndex, buffSize, nextIndex, srcBuff, sourceBufferBytesAlsoZero); \
        } \
    } while (false)
#endif // ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

static ALWAYS_INLINE void* performJITMemcpy(void *dst, const void *src, size_t n)
{
#if CPU(ARM64)
    static constexpr size_t instructionSize = sizeof(unsigned);
    RELEASE_ASSERT(roundUpToMultipleOf<instructionSize>(dst) == dst);
    RELEASE_ASSERT(roundUpToMultipleOf<instructionSize>(src) == src);
#endif
    if (isJITPC(dst)) {
        RELEASE_ASSERT(!Gigacage::contains(src));
        RELEASE_ASSERT(static_cast<uint8_t*>(dst) + n <= endOfFixedExecutableMemoryPool());

#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
        auto checkForZeroes = [dst, src, n] () {
            if (UNLIKELY(Options::zeroExecutableMemoryOnFree()))
                return;
            // On x86-64, the maximum immediate size is 8B, no opcodes/prefixes have 0x00
            // On other architectures this could be smaller
            constexpr size_t maxZeroByteRunLength = 16;
            // This algorithm works because the number of 0-bytes which can fit into
            // one qword (8) is smaller than the limit on which we assert.
            constexpr size_t stride = sizeof(uint64_t);
            static_assert(stride <= maxZeroByteRunLength);

            const char* dstBuff = reinterpret_cast<const char*>(dst);
            size_t runLength = 0;
            size_t i = 0;
            if (n > stride) {
                for (; (reinterpret_cast<uintptr_t>(dstBuff) + i) % stride; i++) {
                    if (!(dstBuff[i]))
                        runLength++;
                    else
                        runLength = 0;
                }
                for (; i + stride <= n; i += stride) {
                    uint64_t chunk = *reinterpret_cast<const uint64_t*>(dstBuff + i);
                    if (!chunk) {
                        runLength += sizeof(chunk);
                        RELEASE_ASSERT_ZERO_CHECK(runLength, dst, src, n, i + stride);
                    } else {
                        runLength += (std::countr_zero(chunk) / 8);
                        RELEASE_ASSERT_ZERO_CHECK(runLength, dst, src, n, i + (std::countr_zero(chunk) / 8));
                        runLength = std::countl_zero(chunk) / 8;
                    }
                }
                for (; i < n; i++) {
                    if (!(dstBuff[i])) {
                        runLength++;
                        RELEASE_ASSERT_ZERO_CHECK(runLength, dst, src, n, i + 1);
                    }
                }
            }
        };
#endif

        if (UNLIKELY(Options::dumpJITMemoryPath()))
            dumpJITMemory(dst, src, n);

#if ENABLE(MPROTECT_RX_TO_RWX)
        auto ret = performJITMemcpyWithMProtect(dst, src, n);
#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
        checkForZeroes();
#endif
        return ret;
#endif

        if (g_jscConfig.useFastJITPermissions) {
            threadSelfRestrict<MemoryRestriction::kRwxToRw>();
            memcpyAtomicIfPossible(dst, src, n);
            threadSelfRestrict<MemoryRestriction::kRwxToRx>();
#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
            checkForZeroes();
#endif
            return dst;
        }

#if ENABLE(SEPARATED_WX_HEAP)
        if (g_jscConfig.jitWriteSeparateHeaps) {
            // Use execute-only write thunk for writes inside the JIT region. This is a variant of
            // memcpy that takes an offset into the JIT region as its destination (first) parameter.
            off_t offset = (off_t)((uintptr_t)dst - startOfFixedExecutableMemoryPool<uintptr_t>());
            retagCodePtr<JITThunkPtrTag, CFunctionPtrTag>(g_jscConfig.jitWriteSeparateHeaps)(offset, src, n);
            RELEASE_ASSERT(!Gigacage::contains(src));
#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
            checkForZeroes();
#endif
            return dst;
        }
#endif

        auto ret = memcpyAtomicIfPossible(dst, src, n);
#if ENABLE(JIT_SCAN_ASSEMBLER_BUFFER_FOR_ZEROES)
        checkForZeroes();
#endif
        return ret;
    }

    return memcpyAtomicIfPossible(dst, src, n);
}

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

class ExecutableAllocator : private ExecutableAllocatorBase {
    WTF_MAKE_TZONE_ALLOCATED(ExecutableAllocator);
public:
    using Base = ExecutableAllocatorBase;

    JS_EXPORT_PRIVATE static ExecutableAllocator& singleton();
    static void initialize();
    static void initializeUnderlyingAllocator();

    bool isValid() const;

    static bool underMemoryPressure();
    
    static double memoryPressureMultiplier(size_t addedMemoryUsage);
    
#if ENABLE(META_ALLOCATOR_PROFILE)
    static void dumpProfile();
#else
    static void dumpProfile() { }
#endif
    
    JS_EXPORT_PRIVATE static void disableJIT();

    RefPtr<ExecutableMemoryHandle> allocate(size_t sizeInBytes, JITCompilationEffort);

    bool isValidExecutableMemory(const AbstractLocker&, void* address);

    static size_t committedByteCount();

    Lock& getLock() const;

#if ENABLE(MPROTECT_RX_TO_RWX)
    void startWriting(const void* start, size_t sizeInBytes);
    void finishWriting(const void* start, size_t sizeInBytes);
#endif

#if ENABLE(JUMP_ISLANDS)
    JS_EXPORT_PRIVATE void* getJumpIslandToUsingJITMemcpy(void* from, void* newDestination);
    JS_EXPORT_PRIVATE void* getJumpIslandToUsingMemcpy(void* from, void* newDestination);
    JS_EXPORT_PRIVATE void* getJumpIslandToConcurrently(void* from, void* newDestination);
#endif

private:
    ExecutableAllocator() = default;
    ~ExecutableAllocator() = default;
};

#else

class ExecutableAllocator : public ExecutableAllocatorBase {
    WTF_MAKE_TZONE_ALLOCATED(ExecutableAllocator);
public:
    static ExecutableAllocator& singleton();
    static void initialize();
    static void initializeUnderlyingAllocator() { }

private:
    ExecutableAllocator() = default;
    ~ExecutableAllocator() = default;
};

static inline void* performJITMemcpy(void *dst, const void *src, size_t n)
{
    return memcpy(dst, src, n);
}

inline bool isJITPC(void*) { return false; }
#endif // ENABLE(JIT)

} // namespace JSC
