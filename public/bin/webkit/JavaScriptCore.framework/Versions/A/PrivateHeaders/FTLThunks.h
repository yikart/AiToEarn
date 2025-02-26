/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "FTLLocation.h"
#include "FTLSlowPathCallKey.h"
#include "MacroAssemblerCodeRef.h"
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class VM;

namespace FTL {

MacroAssemblerCodeRef<JITThunkPtrTag> osrExitGenerationThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> lazySlowPathGenerationThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> slowPathCallThunkGenerator(VM&, const SlowPathCallKey&);

template<typename KeyTypeArgument>
struct ThunkMap {
    typedef KeyTypeArgument KeyType;
    typedef UncheckedKeyHashMap<KeyType, MacroAssemblerCodeRef<JITThunkPtrTag>> ToThunkMap;
    typedef UncheckedKeyHashMap<CodePtr<JITThunkPtrTag>, KeyType> FromThunkMap;
    
    ToThunkMap m_toThunk;
    FromThunkMap m_fromThunk;
};

template<typename MapType, typename GeneratorType>
MacroAssemblerCodeRef<JITThunkPtrTag> generateIfNecessary(
    VM& vm, MapType& map, const typename MapType::KeyType& key, GeneratorType generator)
{
    typename MapType::ToThunkMap::iterator iter = map.m_toThunk.find(key);
    if (iter != map.m_toThunk.end())
        return iter->value;

    MacroAssemblerCodeRef<JITThunkPtrTag> result = generator(vm, key);
    map.m_toThunk.add(key, result);
    map.m_fromThunk.add(result.code(), key);
    return result;
}

template<typename MapType>
typename MapType::KeyType keyForThunk(MapType& map, CodePtr<JITThunkPtrTag> ptr)
{
    typename MapType::FromThunkMap::iterator iter = map.m_fromThunk.find(ptr);
    RELEASE_ASSERT(iter != map.m_fromThunk.end());
    return iter->value;
}

class Thunks {
    WTF_MAKE_TZONE_ALLOCATED(Thunks);
    WTF_MAKE_NONCOPYABLE(Thunks);
public:
    Thunks() = default;
    MacroAssemblerCodeRef<JITThunkPtrTag> getSlowPathCallThunk(VM& vm, const SlowPathCallKey& key)
    {
        Locker locker { m_lock };
        return generateIfNecessary(vm, m_slowPathCallThunks, key, slowPathCallThunkGenerator);
    }

    SlowPathCallKey keyForSlowPathCallThunk(CodePtr<JITThunkPtrTag> ptr)
    {
        Locker locker { m_lock };
        return keyForThunk(m_slowPathCallThunks, ptr);
    }
    
private:
    Lock m_lock;
    ThunkMap<SlowPathCallKey> m_slowPathCallThunks;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
