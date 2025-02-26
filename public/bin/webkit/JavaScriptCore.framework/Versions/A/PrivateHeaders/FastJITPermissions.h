/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#include <stdint.h>
#include <wtf/Platform.h>

enum class MemoryRestriction {
    kRwxToRw,
    kRwxToRx,
    kRwToRw,
    kRwToRo,
};

#if USE(APPLE_INTERNAL_SDK)
#include <WebKitAdditions/JSGlobalObjectAdditions.h>
#endif

#if defined(OS_THREAD_SELF_RESTRICT) != defined(OS_THREAD_SELF_RESTRICT_SUPPORTED)
#error Must override both or neither of OS_THREAD_SELF_RESTRICT and OS_THREAD_SELF_RESTRICT_SUPPORTED
#endif

#if defined(OS_THREAD_SELF_RESTRICT) && defined(OS_THREAD_SELF_RESTRICT_SUPPORTED)
template <MemoryRestriction restriction>
static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    return OS_THREAD_SELF_RESTRICT_SUPPORTED(restriction);
}

template <MemoryRestriction restriction>
static ALWAYS_INLINE void threadSelfRestrict()
{
    OS_THREAD_SELF_RESTRICT(restriction);
}

#else // Not defined(OS_THREAD_SELF_RESTRICT) && defined(OS_THREAD_SELF_RESTRICT_SUPPORTED)
#if OS(DARWIN) && CPU(ARM64)

#include "JSCConfig.h"

#include <wtf/Platform.h>

#if USE(INLINE_JIT_PERMISSIONS_API)
#include <BrowserEngineCore/BEMemory.h>

template <MemoryRestriction restriction>
static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    if constexpr ((restriction == MemoryRestriction::kRwxToRw)
        || (restriction == MemoryRestriction::kRwxToRx)) {
        return (&be_memory_inline_jit_restrict_with_witness_supported != nullptr
            && !!be_memory_inline_jit_restrict_with_witness_supported());
    }
    return false;
}

template <MemoryRestriction restriction>
static ALWAYS_INLINE void threadSelfRestrict()
{
    ASSERT(g_jscConfig.useFastJITPermissions);
    if constexpr (restriction == MemoryRestriction::kRwxToRw)
        be_memory_inline_jit_restrict_rwx_to_rw_with_witness();
    else if constexpr (restriction == MemoryRestriction::kRwxToRx)
        be_memory_inline_jit_restrict_rwx_to_rx_with_witness();
    else
        RELEASE_ASSERT_NOT_REACHED();
}

#elif USE(PTHREAD_JIT_PERMISSIONS_API)
#include <pthread.h>

template <MemoryRestriction restriction>
static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    if constexpr ((restriction == MemoryRestriction::kRwxToRw)
        || (restriction == MemoryRestriction::kRwxToRx)) {
        return !!pthread_jit_write_protect_supported_np();
    }
    return false;
}

template <MemoryRestriction restriction>
static ALWAYS_INLINE void threadSelfRestrict()
{
    ASSERT(g_jscConfig.useFastJITPermissions);
    if constexpr (restriction == MemoryRestriction::kRwxToRw)
        pthread_jit_write_protect_np(false);
    else if constexpr (restriction == MemoryRestriction::kRwxToRx)
        pthread_jit_write_protect_np(true);
    else
        RELEASE_ASSERT_NOT_REACHED();
}

#elif USE(APPLE_INTERNAL_SDK)
#include <os/thread_self_restrict.h>

template <MemoryRestriction restriction>
SUPPRESS_ASAN static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    if constexpr ((restriction == MemoryRestriction::kRwxToRw)
        || (restriction == MemoryRestriction::kRwxToRx)) {
        return !!os_thread_self_restrict_rwx_is_supported();
    }
    return false;
}

template <MemoryRestriction restriction>
static ALWAYS_INLINE void threadSelfRestrict()
{
    ASSERT(g_jscConfig.useFastJITPermissions);
    if constexpr (restriction == MemoryRestriction::kRwxToRw)
        os_thread_self_restrict_rwx_to_rw();
    else if constexpr (restriction == MemoryRestriction::kRwxToRx)
        os_thread_self_restrict_rwx_to_rx();
    else
        RELEASE_ASSERT_NOT_REACHED();
}

#else
template <MemoryRestriction>
static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    return false;
}

template <MemoryRestriction>
static ALWAYS_INLINE void threadSelfRestrict()
{
    bool tautologyToIgnoreWarning = true;
    if (tautologyToIgnoreWarning)
        RELEASE_ASSERT_NOT_REACHED();
}

#endif
#else // Not OS(DARWIN) && CPU(ARM64)
#if defined(OS_THREAD_SELF_RESTRICT) || defined(OS_THREAD_SELF_RESTRICT_SUPPORTED)
#error OS_THREAD_SELF_RESTRICT and OS_THREAD_SELF_RESTRICT_SUPPORTED are only used on ARM64+Darwin-only systems
#endif

template <MemoryRestriction>
static ALWAYS_INLINE bool threadSelfRestrictSupported()
{
    return false;
}

template <MemoryRestriction>
NO_RETURN_DUE_TO_CRASH ALWAYS_INLINE void threadSelfRestrict()
{
    CRASH();
}

#endif // OS(DARWIN) && CPU(ARM64)
#endif // defined(OS_THREAD_SELF_RESTRICT) && defined(OS_THREAD_SELF_RESTRICT_SUPPORTED)
