/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "ExecutionCounter.h"
#include "MemoryMode.h"
#include "Options.h"
#include <wtf/FixedVector.h>
#include <wtf/HashMap.h>

namespace JSC { namespace Wasm {

using IPIntPC = uint32_t;

class IPIntTierUpCounter : public BaselineExecutionCounter {
    WTF_MAKE_NONCOPYABLE(IPIntTierUpCounter);

public:
    enum class CompilationStatus : uint8_t {
        NotCompiled = 0,
        Compiling,
        Compiled,
    };

    struct OSREntryData {
        uint32_t loopIndex;
        uint32_t numberOfStackValues;
        uint32_t tryDepth;
    };

    IPIntTierUpCounter(UncheckedKeyHashMap<IPIntPC, OSREntryData>&& osrEntryData)
        : m_osrEntryData(WTFMove(osrEntryData))
    {
        optimizeAfterWarmUp();
        m_compilationStatus.fill(CompilationStatus::NotCompiled);
        m_loopCompilationStatus.fill(CompilationStatus::NotCompiled);
    }

    void optimizeAfterWarmUp()
    {
        setNewThreshold(Options::thresholdForBBQOptimizeAfterWarmUp());
        ASSERT(Options::useWasmIPInt() || checkIfOptimizationThresholdReached());
    }

    bool checkIfOptimizationThresholdReached()
    {
        return checkIfThresholdCrossedAndSet(nullptr);
    }

    void optimizeSoon()
    {
        setNewThreshold(Options::thresholdForBBQOptimizeSoon());
    }

    const OSREntryData& osrEntryDataForLoop(IPIntPC offset) const
    {
        auto entry = m_osrEntryData.find(offset);
        RELEASE_ASSERT(entry != m_osrEntryData.end());
        return entry->value;
    }

    ALWAYS_INLINE CompilationStatus compilationStatus(MemoryMode mode) WTF_REQUIRES_LOCK(m_lock) { return m_compilationStatus[static_cast<MemoryModeType>(mode)]; }
    ALWAYS_INLINE void setCompilationStatus(MemoryMode mode, CompilationStatus status) WTF_REQUIRES_LOCK(m_lock) { m_compilationStatus[static_cast<MemoryModeType>(mode)] = status; }

    ALWAYS_INLINE CompilationStatus loopCompilationStatus(MemoryMode mode) WTF_REQUIRES_LOCK(m_lock) { return m_loopCompilationStatus[static_cast<MemoryModeType>(mode)]; }
    ALWAYS_INLINE void setLoopCompilationStatus(MemoryMode mode, CompilationStatus status) WTF_REQUIRES_LOCK(m_lock) { m_loopCompilationStatus[static_cast<MemoryModeType>(mode)] = status; }

    void resetAndOptimizeSoon(MemoryMode mode)
    {
        {
            Locker locker { m_lock };
            m_compilationStatus[static_cast<MemoryModeType>(mode)] = CompilationStatus::NotCompiled;
            m_loopCompilationStatus[static_cast<MemoryModeType>(mode)] = CompilationStatus::NotCompiled;
        }
        optimizeSoon();
    }

    Lock m_lock;
private:
    std::array<CompilationStatus, numberOfMemoryModes> m_compilationStatus WTF_GUARDED_BY_LOCK(m_lock);
    std::array<CompilationStatus, numberOfMemoryModes> m_loopCompilationStatus WTF_GUARDED_BY_LOCK(m_lock);
    const UncheckedKeyHashMap<IPIntPC, OSREntryData> m_osrEntryData;
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
