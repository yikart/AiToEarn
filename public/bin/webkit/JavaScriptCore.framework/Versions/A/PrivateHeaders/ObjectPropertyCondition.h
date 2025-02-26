/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "JSObject.h"
#include "PropertyCondition.h"
#include <wtf/HashMap.h>

namespace JSC {

class TrackedReferences;

class ObjectPropertyCondition {
public:
    ObjectPropertyCondition()
        : m_object(nullptr)
    {
    }
    
    ObjectPropertyCondition(WTF::HashTableDeletedValueType token)
        : m_object(nullptr)
        , m_condition(token)
    {
    }
    
    ObjectPropertyCondition(JSObject* object, const PropertyCondition& condition)
        : m_object(object)
        , m_condition(condition)
    {
    }
    
    static ObjectPropertyCondition presenceWithoutBarrier(
        JSObject* object, UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::presenceWithoutBarrier(uid, offset, attributes); 
        return result;
    }
    
    static ObjectPropertyCondition presence(
        VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid, PropertyOffset offset,
        unsigned attributes)
    {
        if (owner)
            vm.writeBarrier(owner);
        return presenceWithoutBarrier(object, uid, offset, attributes);
    }

    static ObjectPropertyCondition replacementWithoutBarrier(JSObject* object, UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::replacementWithoutBarrier(uid, offset, attributes);
        return result;
    }

    static ObjectPropertyCondition replacement(VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid, PropertyOffset offset,
        unsigned attributes)
    {
        if (owner)
            vm.writeBarrier(owner);
        return replacementWithoutBarrier(object, uid, offset, attributes);
    }

    // NOTE: The prototype is the storedPrototype, not the prototypeForLookup.
    static ObjectPropertyCondition absenceWithoutBarrier(
        JSObject* object, UniquedStringImpl* uid, JSObject* prototype)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::absenceWithoutBarrier(uid, prototype);
        return result;
    }
    
    static ObjectPropertyCondition absence(
        VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceWithoutBarrier(object, uid, prototype);
    }
    
    static ObjectPropertyCondition absenceOfSetEffectWithoutBarrier(
        JSObject* object, UniquedStringImpl* uid, JSObject* prototype)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::absenceOfSetEffectWithoutBarrier(uid, prototype);
        return result;
    }
    
    static ObjectPropertyCondition absenceOfSetEffect(
        VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceOfSetEffectWithoutBarrier(object, uid, prototype);
    }

    static ObjectPropertyCondition absenceOfIndexedPropertiesWithoutBarrier(JSObject* object, JSObject* prototype)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::absenceOfIndexedPropertiesWithoutBarrier(prototype);
        return result;
    }

    static ObjectPropertyCondition absenceOfIndexedProperties(VM& vm, JSCell* owner, JSObject* object, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceOfIndexedPropertiesWithoutBarrier(object, prototype);
    }

    static ObjectPropertyCondition equivalenceWithoutBarrier(
        JSObject* object, UniquedStringImpl* uid, JSValue value)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::equivalenceWithoutBarrier(uid, value);
        return result;
    }
    
    static ObjectPropertyCondition equivalence(
        VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid, JSValue value)
    {
        if (owner)
            vm.writeBarrier(owner);
        return equivalenceWithoutBarrier(object, uid, value);
    }

    static ObjectPropertyCondition hasStaticProperty(
        VM& vm, JSCell* owner, JSObject* object, UniquedStringImpl* uid)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::hasStaticProperty(uid);
        if (owner)
            vm.writeBarrier(owner);
        return result;
    }
    
    static ObjectPropertyCondition hasPrototypeWithoutBarrier(JSObject* object, JSObject* prototype)
    {
        ObjectPropertyCondition result;
        result.m_object = object;
        result.m_condition = PropertyCondition::hasPrototypeWithoutBarrier(prototype);
        return result;
    }
    
    static ObjectPropertyCondition hasPrototype(
        VM& vm, JSCell* owner, JSObject* object, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return hasPrototypeWithoutBarrier(object, prototype);
    }

    explicit operator bool() const { return !!m_condition; }
    
    JSObject* object() const { return m_object; }
    PropertyCondition condition() const { return m_condition; }
    
    PropertyCondition::Kind kind() const { return condition().kind(); }
    UniquedStringImpl* uid() const { return condition().uid(); }
    bool hasOffset() const { return condition().hasOffset(); }
    PropertyOffset offset() const { return condition().offset(); }
    unsigned hasAttributes() const { return condition().hasAttributes(); }
    unsigned attributes() const { return condition().attributes(); }
    bool hasPrototype() const { return condition().hasPrototype(); }
    JSObject* prototype() const { return condition().prototype(); }
    bool hasRequiredValue() const { return condition().hasRequiredValue(); }
    JSValue requiredValue() const { return condition().requiredValue(); }
    
    void dumpInContext(PrintStream&, DumpContext*) const;
    void dump(PrintStream&) const;
    
    unsigned hash() const
    {
        return WTF::PtrHash<JSObject*>::hash(m_object) ^ m_condition.hash();
    }
    
    friend bool operator==(const ObjectPropertyCondition&, const ObjectPropertyCondition&) = default;
    
    bool isHashTableDeletedValue() const
    {
        return !m_object && m_condition.isHashTableDeletedValue();
    }
    
    // Two conditions are compatible if they are identical or if they speak of different uids or
    // different objects. If false is returned, you have to decide how to resolve the conflict -
    // for example if there is a Presence and an Equivalence then in some cases you'll want the
    // more general of the two while in other cases you'll want the more specific of the two. This
    // will also return false for contradictions, like Presence and Absence on the same
    // object/uid. By convention, invalid conditions aren't compatible with anything.
    bool isCompatibleWith(const ObjectPropertyCondition& other) const
    {
        if (!*this || !other)
            return false;
        return *this == other || uid() != other.uid() || object() != other.object();
    }
    
    // These validity-checking methods can optionally take a Struture* instead of loading the
    // Structure* from the object. If you're in the concurrent JIT, then you must use the forms
    // that take an explicit Structure* because you want the compiler to optimize for the same
    // structure that you validated (i.e. avoid a TOCTOU race).
    
    // Checks if the object's structure claims that the property won't be intercepted. Validity
    // does not require watchpoints on the object.
    bool structureEnsuresValidityAssumingImpurePropertyWatchpoint(Concurrency) const;
    
    // Returns true if we need an impure property watchpoint to ensure validity even if
    // isStillValidAccordingToStructure() returned true.
    bool validityRequiresImpurePropertyWatchpoint(Structure*) const;
    bool validityRequiresImpurePropertyWatchpoint() const;

    // Checks if the condition still holds setting aside the need for an impure property watchpoint.
    // Validity might still require watchpoints on the object.
    bool isStillValidAssumingImpurePropertyWatchpoint(Concurrency, Structure*) const;
    bool isStillValidAssumingImpurePropertyWatchpoint(Concurrency) const;

    // Checks if the condition still holds. May conservatively return false, if the object and
    // structure alone don't guarantee the condition. Note that this may return true if the
    // condition still requires some watchpoints on the object in addition to checking the
    // structure. If you want to check if the condition holds by using the structure alone,
    // use structureEnsuresValidity().
    bool isStillValid(Concurrency, Structure*) const;
    bool isStillValid(Concurrency) const;
    
    // Shorthand for condition().isStillValid(structure).
    bool structureEnsuresValidity(Concurrency, Structure*) const;
    bool structureEnsuresValidity(Concurrency) const;
    
    // This means that it's still valid and we could enforce validity by setting a transition
    // watchpoint on the structure and possibly an impure property watchpoint.
    bool isWatchableAssumingImpurePropertyWatchpoint(Structure*, PropertyCondition::WatchabilityEffort, Concurrency) const;
    bool isWatchableAssumingImpurePropertyWatchpoint(PropertyCondition::WatchabilityEffort, Concurrency) const;
    bool isWatchableAssumingImpurePropertyWatchpoint(Structure*, PropertyCondition::WatchabilityEffort) const;
    bool isWatchableAssumingImpurePropertyWatchpoint(PropertyCondition::WatchabilityEffort) const;

    // This means that it's still valid and we could enforce validity by setting a transition
    // watchpoint on the structure, and a value change watchpoint if we're Equivalence.
    bool isWatchable(Structure*, PropertyCondition::WatchabilityEffort) const;
    bool isWatchable(PropertyCondition::WatchabilityEffort) const;
    bool isWatchable(PropertyCondition::WatchabilityEffort, Concurrency) const;
    
    bool watchingRequiresStructureTransitionWatchpoint() const
    {
        return condition().watchingRequiresStructureTransitionWatchpoint();
    }
    bool watchingRequiresReplacementWatchpoint() const
    {
        return condition().watchingRequiresReplacementWatchpoint();
    }

    template<typename Functor>
    void forEachDependentCell(const Functor& functor) const
    {
        functor(m_object);
        m_condition.forEachDependentCell(functor);
    }
    
    // This means that the objects involved in this are still live.
    bool isStillLive(VM&) const;
    
    void validateReferences(const TrackedReferences&) const;

    bool isValidValueForPresence(JSValue value) const
    {
        return condition().isValidValueForPresence(value);
    }

    ObjectPropertyCondition attemptToMakeEquivalenceWithoutBarrier() const;
    ObjectPropertyCondition attemptToMakeReplacementWithoutBarrier() const;

private:
    JSObject* m_object;
    PropertyCondition m_condition;
};

struct ObjectPropertyConditionHash {
    static unsigned hash(const ObjectPropertyCondition& key) { return key.hash(); }
    static bool equal(
        const ObjectPropertyCondition& a, const ObjectPropertyCondition& b)
    {
        return a == b;
    }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::ObjectPropertyCondition> : JSC::ObjectPropertyConditionHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::ObjectPropertyCondition> : SimpleClassHashTraits<JSC::ObjectPropertyCondition> { };

} // namespace WTF
