/*
 * Copyright (C) 2009, 2015-2016 Apple Inc. All rights reserved.
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

#include "DeferGC.h"
#include "Weak.h"
#include "WeakGCHashTable.h"
#include <wtf/HashMap.h>

namespace JSC {

// A UncheckedKeyHashMap with Weak<JSCell> values, which automatically removes values once they're garbage collected.

template<typename KeyArg, typename ValueArg, typename HashArg = DefaultHash<KeyArg>, typename KeyTraitsArg = HashTraits<KeyArg>>
class WeakGCMap final : public WeakGCHashTable {
    WTF_MAKE_FAST_ALLOCATED;
    typedef Weak<ValueArg> ValueType;
    typedef UncheckedKeyHashMap<KeyArg, ValueType, HashArg, KeyTraitsArg> HashMapType;

public:
    typedef typename HashMapType::KeyType KeyType;
    typedef typename HashMapType::AddResult AddResult;
    typedef typename HashMapType::iterator iterator;
    typedef typename HashMapType::const_iterator const_iterator;

    explicit WeakGCMap(VM&);
    ~WeakGCMap() final;

    ValueArg* get(const KeyType& key) const
    {
        return m_map.get(key);
    }

    AddResult set(const KeyType& key, ValueType value)
    {
        return m_map.set(key, WTFMove(value));
    }

    template<typename Functor>
    ValueArg* ensureValue(const KeyType& key, Functor&& functor)
    {
        // If functor invokes GC, GC can prune WeakGCMap, and manipulate UncheckedKeyHashMap while we are touching it in ensure function.
        // The functor must not invoke GC.
        DisallowGC disallowGC;
        AddResult result = m_map.ensure(key, std::forward<Functor>(functor));
        ValueArg* value = result.iterator->value.get();
        if (!result.isNewEntry && !value) {
            value = functor();
            result.iterator->value = WTFMove(value);
        }
        return value;
    }

    bool remove(const KeyType& key)
    {
        return m_map.remove(key);
    }

    void clear()
    {
        m_map.clear();
    }

    bool isEmpty() const
    {
        const_iterator it = m_map.begin();
        const_iterator end = m_map.end();
        while (it != end) {
            if (it->value)
                return true;
        }
        return false;
    }

    inline iterator find(const KeyType& key);

    inline const_iterator find(const KeyType& key) const;

    inline bool contains(const KeyType& key) const;

    void pruneStaleEntries() final;

    template<typename Func>
    void forEach(Func);

private:
    HashMapType m_map;
    VM& m_vm;
};

} // namespace JSC
