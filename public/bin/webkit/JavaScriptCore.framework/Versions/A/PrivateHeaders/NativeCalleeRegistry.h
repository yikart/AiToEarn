/*
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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

#include "PCToCodeOriginMap.h"
#include <wtf/Box.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class NativeCallee;

class NativeCalleeRegistry {
    WTF_MAKE_TZONE_ALLOCATED(NativeCalleeRegistry);
    WTF_MAKE_NONCOPYABLE(NativeCalleeRegistry);
public:
    static void initialize();
    static NativeCalleeRegistry& singleton();

    Lock& getLock() WTF_RETURNS_LOCK(m_lock) { return m_lock; }

    void registerCallee(NativeCallee* callee)
    {
        Locker locker { m_lock };
        auto addResult = m_calleeSet.add(callee);
        ASSERT_UNUSED(addResult, addResult.isNewEntry);
    }

    void unregisterCallee(NativeCallee* callee)
    {
        Locker locker { m_lock };
        m_calleeSet.remove(callee);
#if ENABLE(JIT)
        m_pcToCodeOriginMaps.remove(callee);
#endif
    }

    const HashSet<NativeCallee*>& allCallees() WTF_REQUIRES_LOCK(m_lock)
    {
        return m_calleeSet;
    }

    bool isValidCallee(NativeCallee* callee)  WTF_REQUIRES_LOCK(m_lock)
    {
        if (!HashSet<NativeCallee*>::isValidValue(callee))
            return false;
        return m_calleeSet.contains(callee);
    }

#if ENABLE(JIT)
    void addPCToCodeOriginMap(NativeCallee* callee, Box<PCToCodeOriginMap> originMap)
    {
        Locker locker { m_lock };
        ASSERT(isValidCallee(callee));
        auto addResult = m_pcToCodeOriginMaps.add(callee, WTFMove(originMap));
        RELEASE_ASSERT(addResult.isNewEntry);
    }

    Box<PCToCodeOriginMap> codeOriginMap(NativeCallee* callee)  WTF_REQUIRES_LOCK(m_lock)
    {
        ASSERT(isValidCallee(callee));
        auto iter = m_pcToCodeOriginMaps.find(callee);
        if (iter != m_pcToCodeOriginMaps.end())
            return iter->value;
        return nullptr;
    }
#endif

    NativeCalleeRegistry() = default;

private:
    Lock m_lock;
    HashSet<NativeCallee*> m_calleeSet WTF_GUARDED_BY_LOCK(m_lock);
#if ENABLE(JIT)
    UncheckedKeyHashMap<NativeCallee*, Box<PCToCodeOriginMap>> m_pcToCodeOriginMaps WTF_GUARDED_BY_LOCK(m_lock);
#endif
};

} // namespace JSC
