/*
 * Copyright (C) 2015-2018 Apple Inc. All rights reserved.
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

#include "ObjectPropertyCondition.h"
#include <wtf/FastMalloc.h>
#include <wtf/Hasher.h>
#include <wtf/RefCountedFixedVector.h>
#include <wtf/Vector.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

// An object property condition set is used to represent the set of additional conditions
// that need to be met for some heap access to be valid. The set can have the following
// interesting states:
//
// Empty: There are no special conditions that need to be met.
// Invalid: The heap access is never valid.
// Non-empty: The heap access is valid if all the ObjectPropertyConditions in the set are valid.

class ObjectPropertyConditionSet {
public:
    using Conditions = ThreadSafeRefCountedFixedVector<ObjectPropertyCondition>;

    ObjectPropertyConditionSet() = default;
    
    static ObjectPropertyConditionSet invalid()
    {
        ObjectPropertyConditionSet result;
        result.m_data = Conditions::create(0);
        ASSERT(!result.isValid());
        return result;
    }

    template<typename Vector>
    static ObjectPropertyConditionSet create(Vector&& vector)
    {
        if (vector.isEmpty())
            return ObjectPropertyConditionSet();
        
        ObjectPropertyConditionSet result;
        result.m_data = Conditions::createFromVector(std::forward<Vector>(vector));
        ASSERT(result.isValid());
        return result;
    }
    
    bool isValid() const
    {
        return !m_data || !m_data->isEmpty();
    }

    size_t size() const { return m_data ? m_data->size() : 0; }
    bool isEmpty() const
    {
        return !m_data;
    }

    using const_iterator = Conditions::const_iterator;

    const_iterator begin() const
    {
        if (!m_data)
            return nullptr;
        return m_data->cbegin();
    }
    const_iterator end() const
    {
        if (!m_data)
            return nullptr;
        return m_data->cend();
    }

    unsigned hash() const
    {
        Hasher hasher;
        for (auto& condition : *this)
            add(hasher, condition.hash());
        return hasher.hash();
    }

    friend bool operator==(const ObjectPropertyConditionSet& lhs, const ObjectPropertyConditionSet& rhs)
    {
        if (lhs.size() != rhs.size())
            return false;
        auto liter = lhs.begin();
        auto riter = rhs.begin();
        for (; liter != lhs.end(); ++liter, ++riter) {
            if (!(*liter == *riter))
                return false;
        }
        return true;
    }

    ObjectPropertyCondition forObject(JSObject*) const;
    ObjectPropertyCondition forConditionKind(PropertyCondition::Kind) const;

    unsigned numberOfConditionsWithKind(PropertyCondition::Kind) const;

    bool hasOneSlotBaseCondition() const;
    
    // If this is a condition set for a prototype hit, then this is guaranteed to return the
    // condition on the prototype itself. This allows you to get the object, offset, and
    // attributes for the prototype. This will RELEASE_ASSERT that there is exactly one Presence
    // in the set, and it will return that presence.
    ObjectPropertyCondition slotBaseCondition() const;
    
    // Attempt to create a new condition set by merging this one with the other one. This will
    // fail if any of the conditions are incompatible with each other. When if fails, it returns
    // invalid().
    ObjectPropertyConditionSet mergedWith(const ObjectPropertyConditionSet& other) const;
    
    bool isStillValid() const;
    bool structuresEnsureValidity() const;
    
    bool needImpurePropertyWatchpoint() const;

    template<typename Functor>
    void forEachDependentCell(const Functor& functor) const
    {
        for (const ObjectPropertyCondition& condition : *this)
            condition.forEachDependentCell(functor);
    }

    bool areStillLive(VM&) const;
    
    void dumpInContext(PrintStream&, DumpContext*) const;
    void dump(PrintStream&) const;

    // Internally, this represents Invalid using a pointer to a Data that has an empty vector.
    
    // FIXME: This could be made more compact by having it internally use a vector that just has
    // the non-uid portion of ObjectPropertyCondition, and then requiring that the callers of all
    // of the APIs supply the uid.

private:
    RefPtr<Conditions> m_data;
};

ObjectPropertyCondition generateConditionForSelfEquivalence(
    VM&, JSCell* owner, JSObject* object, UniquedStringImpl* uid);

ObjectPropertyConditionSet generateConditionsForPropertyMiss(
    VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure, UniquedStringImpl* uid);
ObjectPropertyConditionSet generateConditionsForPropertySetterMiss(
    VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure, UniquedStringImpl* uid);
ObjectPropertyConditionSet generateConditionsForIndexedMiss(VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure);
ObjectPropertyConditionSet generateConditionsForPrototypePropertyHit(
    VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure, JSObject* prototype,
    UniquedStringImpl* uid);
ObjectPropertyConditionSet generateConditionsForPrototypePropertyHitCustom(
    VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure, JSObject* prototype,
    UniquedStringImpl* uid, unsigned attributes);

ObjectPropertyConditionSet generateConditionsForInstanceOf(
    VM&, JSCell* owner, JSGlobalObject*, Structure* headStructure, JSObject* prototype, bool shouldHit);

ObjectPropertyConditionSet generateConditionsForPrototypeEquivalenceConcurrently(
    VM&, JSGlobalObject*, Structure* headStructure, JSObject* prototype,
    UniquedStringImpl* uid);
ObjectPropertyConditionSet generateConditionsForPropertyMissConcurrently(
    VM&, JSGlobalObject*, Structure* headStructure, UniquedStringImpl* uid);
ObjectPropertyConditionSet generateConditionsForPropertySetterMissConcurrently(
    VM&, JSGlobalObject*, Structure* headStructure, UniquedStringImpl* uid);

struct PrototypeChainCachingStatus {
    bool usesPolyProto;
    bool flattenedDictionary;
};

std::optional<PrototypeChainCachingStatus> prepareChainForCaching(JSGlobalObject*, JSCell* base, UniquedStringImpl*, const PropertySlot&);
std::optional<PrototypeChainCachingStatus> prepareChainForCaching(JSGlobalObject*, JSCell* base, UniquedStringImpl*, JSObject* target);
std::optional<PrototypeChainCachingStatus> prepareChainForCaching(JSGlobalObject*, Structure* base, UniquedStringImpl*, JSObject* target);

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
