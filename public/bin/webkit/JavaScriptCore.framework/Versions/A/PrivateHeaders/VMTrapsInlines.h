/*
 * Copyright (C) 2021-2023 Apple Inc. All rights reserved.
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

#include "VM.h"

namespace JSC {

ALWAYS_INLINE VM& VMTraps::vm() const
{
    return *std::bit_cast<VM*>(std::bit_cast<uintptr_t>(this) - OBJECT_OFFSETOF(VM, m_traps));
}

inline void VMTraps::deferTermination(DeferAction deferAction)
{
    auto originalCount = m_deferTerminationCount++;
    ASSERT(m_deferTerminationCount < UINT_MAX);
    if (UNLIKELY(originalCount == 0 && vm().exception()))
        deferTerminationSlow(deferAction);
}

inline void VMTraps::undoDeferTermination(DeferAction deferAction)
{
    ASSERT(m_deferTerminationCount > 0);
    ASSERT(!m_suspendedTerminationException || vm().hasTerminationRequest());
    if (UNLIKELY(--m_deferTerminationCount == 0 && vm().hasTerminationRequest()))
        undoDeferTerminationSlow(deferAction);
}

ALWAYS_INLINE DeferTraps::DeferTraps(VM& vm)
    : m_traps(vm.traps())
    , m_isActive(!m_traps.hasTrapBit(VMTraps::DeferTrapHandling))
{
    if (m_isActive)
        m_traps.setTrapBit(VMTraps::DeferTrapHandling);
}

ALWAYS_INLINE DeferTraps::~DeferTraps()
{
    if (m_isActive)
        m_traps.clearTrapBit(VMTraps::DeferTrapHandling);
}

} // namespace JSC
