/*
 * Copyright (C) 2021-2024 Apple Inc. All rights reserved.
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

#include "WeakGCHashTable.h"
#include "WeakInlines.h"
#include <wtf/HashSet.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

// A HashSet with Weak<JSCell> values, which automatically removes values once they're garbage collected.

template<typename T>
struct WeakGCSetHashTraits : HashTraits<Weak<T>> {
    static constexpr bool hasIsReleasedWeakValueFunction = true;
    static bool isReleasedWeakValue(const Weak<T>& value)
    {
        return !value.isHashTableDeletedValue() && !value.isHashTableEmptyValue() && !value;
    }
};

template<typename T>
struct WeakGCSetHash {
    // We only prune stale entries on Full GCs so we have to handle non-Live entries in the table.
    static unsigned hash(const Weak<T>& p) { return PtrHash<T*>::hash(p.get()); }
    static bool equal(const Weak<T>& a, const Weak<T>& b)
    {
        if (!a || !b)
            return false;
        return a.get() == b.get();
    }
    static constexpr bool safeToCompareToEmptyOrDeleted = false;
};

// FIXME: This doesn't currently accept WeakHandleOwners by default... it's probably not hard to add but it's not exactly clear how to handle multiple different handle owners for the same value.
template<typename ValueArg, typename HashArg = WeakGCSetHash<ValueArg>, typename TraitsArg = WeakGCSetHashTraits<ValueArg>>
class WeakGCSet final : public WeakGCHashTable {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(WeakGCSet, JS_EXPORT_PRIVATE);
    using ValueType = Weak<ValueArg>;
    using HashSetType = HashSet<ValueType, HashArg, TraitsArg>;

public:
    using AddResult = typename HashSetType::AddResult;
    using iterator = typename HashSetType::iterator;
    using const_iterator = typename HashSetType::const_iterator;

    inline explicit WeakGCSet(VM&);
    inline ~WeakGCSet() final;

    void clear()
    {
        m_set.clear();
    }

    AddResult add(ValueArg* key)
    {
        // Constructing a Weak shouldn't trigger a GC but add this ASSERT for good measure.
        DisallowGC disallowGC;
        return m_set.add(key);
    }

    template<typename HashTranslator, typename T>
    ValueArg* ensureValue(T&& key, const Invocable<ValueType()> auto& functor)
    {
        // If functor invokes GC, GC can prune WeakGCSet, and manipulate HashSet while we are touching it in the ensure function.
        // The functor must not invoke GC.
        DisallowGC disallowGC;
        
        auto result = m_set.template ensure<HashTranslator>(std::forward<T>(key), functor);
        return result.iterator->get();
    }

    // It's not safe to call into the VM or allocate an object while an iterator is open.
    inline iterator begin() { return m_set.begin(); }
    inline const_iterator begin() const { return m_set.begin(); }

    inline iterator end() { return m_set.end(); }
    inline const_iterator end() const { return m_set.end(); }

    // FIXME: Add support for find/contains/remove from a ValueArg* via a HashTranslator.

private:
    void pruneStaleEntries() final;

    HashSetType m_set;
    VM& m_vm;
};

} // namespace JSC
