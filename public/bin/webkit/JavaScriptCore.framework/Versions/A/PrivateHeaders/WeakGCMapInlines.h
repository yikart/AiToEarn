/*
 * Copyright (C) 2015-2016 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "HeapInlines.h"
#include "WeakGCMap.h"
#include "WeakInlines.h"
#include <wtf/IterationStatus.h>

namespace JSC {

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
inline WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::WeakGCMap(VM& vm)
    : m_vm(vm)
{
    vm.heap.registerWeakGCHashTable(this);
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
inline WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::~WeakGCMap()
{
    m_vm.heap.unregisterWeakGCHashTable(this);
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
inline typename WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::iterator WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::find(const KeyType& key)
{
    iterator it = m_map.find(key);
    iterator end = m_map.end();
    if (it != end && !it->value) // Found a zombie value.
        return end;
    return it;
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
inline typename WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::const_iterator WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::find(const KeyType& key) const
{
    return const_cast<WeakGCMap*>(this)->find(key);
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
inline bool WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::contains(const KeyType& key) const
{
    return find(key) != m_map.end();
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
NEVER_INLINE void WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::pruneStaleEntries()
{
    m_map.removeIf([](const typename HashMapType::KeyValuePairType& entry) {
        return !entry.value;
    });
}

template<typename KeyArg, typename ValueArg, typename HashArg, typename KeyTraitsArg>
template<typename Func>
inline void WeakGCMap<KeyArg, ValueArg, HashArg, KeyTraitsArg>::forEach(Func func)
{
    ASSERT(m_vm.heap.isDeferred());
    for (auto& entry : m_map) {
        if (entry.value) {
            if (func(entry.value.get()) == IterationStatus::Done)
                return;
        }
    }
}

} // namespace JSC
