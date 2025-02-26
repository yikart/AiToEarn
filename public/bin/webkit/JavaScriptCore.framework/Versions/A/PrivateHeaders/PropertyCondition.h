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
#include <wtf/CompactPointerTuple.h>
#include <wtf/HashMap.h>

namespace JSC {

class TrackedReferences;

class PropertyCondition {
public:
    enum Kind : uint8_t {
        Presence,
        Replacement, // This implies the property is Present but cannot be watched for replacement.
        Absence,
        AbsenceOfSetEffect,
        AbsenceOfIndexedProperties,
        Equivalence, // An adaptive watchpoint on this will be a pair of watchpoints, and when the structure transitions, we will set the replacement watchpoint on the new structure.
        HasStaticProperty, // Custom value or accessor.
        HasPrototype
    };

    using Header = CompactPointerTuple<UniquedStringImpl*, Kind>;
    
    PropertyCondition()
        : m_header(nullptr, Presence)
    {
        memset(&u, 0, sizeof(u));
    }
    
    PropertyCondition(WTF::HashTableDeletedValueType)
        : m_header(nullptr, Absence)
    {
        memset(&u, 0, sizeof(u));
    }

    static PropertyCondition presenceWithoutBarrier(UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        PropertyCondition result;
        result.m_header = Header(uid, Presence);
        result.u.presence.offset = offset;
        result.u.presence.attributes = attributes;
        return result;
    }
    
    static PropertyCondition presence(
        VM&, JSCell*, UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        return presenceWithoutBarrier(uid, offset, attributes);
    }

    static PropertyCondition replacementWithoutBarrier(UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        ASSERT(!(attributes & PropertyAttribute::ReadOnly));
        PropertyCondition result;
        result.m_header = Header(uid, Replacement);
        result.u.presence.offset = offset;
        result.u.presence.attributes = attributes;
        return result;
    }

    static PropertyCondition replacement(VM&, JSCell*, UniquedStringImpl* uid, PropertyOffset offset, unsigned attributes)
    {
        return replacementWithoutBarrier(uid, offset, attributes);
    }

    // NOTE: The prototype is the storedPrototype not the prototypeForLookup.
    static PropertyCondition absenceWithoutBarrier(UniquedStringImpl* uid, JSObject* prototype)
    {
        PropertyCondition result;
        result.m_header = Header(uid, Absence);
        result.u.prototype.prototype = prototype;
        return result;
    }
    
    static PropertyCondition absence(
        VM& vm, JSCell* owner, UniquedStringImpl* uid, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceWithoutBarrier(uid, prototype);
    }
    
    static PropertyCondition absenceOfSetEffectWithoutBarrier(
        UniquedStringImpl* uid, JSObject* prototype)
    {
        PropertyCondition result;
        result.m_header = Header(uid, AbsenceOfSetEffect);
        result.u.prototype.prototype = prototype;
        return result;
    }
    
    static PropertyCondition absenceOfSetEffect(
        VM& vm, JSCell* owner, UniquedStringImpl* uid, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceOfSetEffectWithoutBarrier(uid, prototype);
    }

    static PropertyCondition absenceOfIndexedPropertiesWithoutBarrier(JSObject* prototype)
    {
        PropertyCondition result;
        result.m_header = Header(nullptr, AbsenceOfIndexedProperties);
        result.u.prototype.prototype = prototype;
        return result;
    }

    static PropertyCondition absenceOfIndexedProperties(VM& vm, JSCell* owner, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return absenceOfIndexedPropertiesWithoutBarrier(prototype);
    }

    static PropertyCondition equivalenceWithoutBarrier(
        UniquedStringImpl* uid, JSValue value)
    {
        PropertyCondition result;
        result.m_header = Header(uid, Equivalence);
        result.u.equivalence.value = JSValue::encode(value);
        return result;
    }
        
    static PropertyCondition equivalence(
        VM& vm, JSCell* owner, UniquedStringImpl* uid, JSValue value)
    {
        if (value.isCell() && owner)
            vm.writeBarrier(owner);
        return equivalenceWithoutBarrier(uid, value);
    }

    static PropertyCondition hasStaticProperty(UniquedStringImpl* uid)
    {
        PropertyCondition result;
        result.m_header = Header(uid, HasStaticProperty);
        return result;
    }
    
    static PropertyCondition hasPrototypeWithoutBarrier(JSObject* prototype)
    {
        PropertyCondition result;
        result.m_header = Header(nullptr, HasPrototype);
        result.u.prototype.prototype = prototype;
        return result;
    }
    
    static PropertyCondition hasPrototype(VM& vm, JSCell* owner, JSObject* prototype)
    {
        if (owner)
            vm.writeBarrier(owner);
        return hasPrototypeWithoutBarrier(prototype);
    }
    
    explicit operator bool() const { return m_header.pointer() || m_header.type() != Presence; }
    
    Kind kind() const { return m_header.type(); }
    UniquedStringImpl* uid() const { return m_header.pointer(); }
    
    bool hasOffset() const { return !!*this && (kind() == Presence || kind() == Replacement); };
    PropertyOffset offset() const
    {
        ASSERT(hasOffset());
        return u.presence.offset;
    }
    bool hasAttributes() const { return !!*this && (kind() == Presence || kind() == Replacement); };
    unsigned attributes() const
    {
        ASSERT(hasAttributes());
        return u.presence.attributes;
    }
    
    bool hasPrototype() const
    {
        return !!*this
            && (m_header.type() == Absence || m_header.type() == AbsenceOfSetEffect || m_header.type() == AbsenceOfIndexedProperties || m_header.type() == HasPrototype);
    }
    JSObject* prototype() const
    {
        ASSERT(hasPrototype());
        return u.prototype.prototype;
    }
    
    bool hasRequiredValue() const { return !!*this && m_header.type() == Equivalence; }
    JSValue requiredValue() const
    {
        ASSERT(hasRequiredValue());
        return JSValue::decode(u.equivalence.value);
    }
    
    void dumpInContext(PrintStream&, DumpContext*) const;
    void dump(PrintStream&) const;
    
    unsigned hash() const
    {
        unsigned result = WTF::PtrHash<UniquedStringImpl*>::hash(m_header.pointer()) + static_cast<unsigned>(m_header.type());
        switch (m_header.type()) {
        case Presence:
        case Replacement:
            result ^= u.presence.offset;
            result ^= u.presence.attributes;
            break;
        case Absence:
        case AbsenceOfSetEffect:
        case AbsenceOfIndexedProperties:
        case HasPrototype:
            result ^= WTF::PtrHash<JSObject*>::hash(u.prototype.prototype);
            break;
        case Equivalence:
            result ^= EncodedJSValueHash::hash(u.equivalence.value);
            break;
        case HasStaticProperty:
            break;
        }
        return result;
    }
    
    bool operator==(const PropertyCondition& other) const
    {
        if (m_header.pointer() != other.m_header.pointer())
            return false;
        if (m_header.type() != other.m_header.type())
            return false;
        switch (m_header.type()) {
        case Presence:
        case Replacement:
            return u.presence.offset == other.u.presence.offset
                && u.presence.attributes == other.u.presence.attributes;
        case Absence:
        case AbsenceOfSetEffect:
        case AbsenceOfIndexedProperties:
        case HasPrototype:
            return u.prototype.prototype == other.u.prototype.prototype;
        case Equivalence:
            return u.equivalence.value == other.u.equivalence.value;
        case HasStaticProperty:
            return true;
        }
        RELEASE_ASSERT_NOT_REACHED();
        return false;
    }
    
    bool isHashTableDeletedValue() const
    {
        return !m_header.pointer() && m_header.type() == Absence;
    }
    
    // Two conditions are compatible if they are identical or if they speak of different uids. If
    // false is returned, you have to decide how to resolve the conflict - for example if there is
    // a Presence and an Equivalence then in some cases you'll want the more general of the two
    // while in other cases you'll want the more specific of the two. This will also return false
    // for contradictions, like Presence and Absence on the same uid. By convention, invalid
    // conditions aren't compatible with anything.
    bool isCompatibleWith(const PropertyCondition& other) const
    {
        if (!*this || !other)
            return false;
        return *this == other || uid() != other.uid();
    }
    
    // Checks if the object's structure claims that the property won't be intercepted.
    bool isStillValidAssumingImpurePropertyWatchpoint(Concurrency, Structure*, JSObject* base = nullptr) const;
    
    // Returns true if we need an impure property watchpoint to ensure validity even if
    // isStillValidAccordingToStructure() returned true.
    bool validityRequiresImpurePropertyWatchpoint(Structure*) const;
    
    // Checks if the condition is still valid right now for the given object and structure.
    // May conservatively return false, if the object and structure alone don't guarantee the
    // condition. This happens for an Absence condition on an object that may have impure
    // properties. If the object is not supplied, then a "true" return indicates that checking if
    // an object has the given structure guarantees the condition still holds. If an object is
    // supplied, then you may need to use some other watchpoints on the object to guarantee the
    // condition in addition to the structure check.
    bool isStillValid(Concurrency, Structure*, JSObject* base = nullptr) const;
    
    // In some cases, the condition is not watchable, but could be made watchable by enabling the
    // appropriate watchpoint. For example, replacement watchpoints are enabled only when some
    // access is cached on the property in some structure. This is mainly to save space for
    // dictionary properties or properties that never get very hot. But, it's always safe to
    // enable watching, provided that this is called from the main thread.
    enum WatchabilityEffort {
        // This is the default. It means that we don't change the state of any Structure or
        // object, and implies that if the property happens not to be watchable then we don't make
        // it watchable. This is mandatory if calling from a JIT thread. This is also somewhat
        // preferable when first deciding whether to watch a condition for the first time (i.e.
        // not from a watchpoint fire that causes us to see if we should adapt), since a
        // watchpoint not being initialized for watching implies that maybe we don't know enough
        // yet to make it profitable to watch -- as in, the thing being watched may not have
        // stabilized yet. We prefer to only assume that a condition will hold if it has been
        // known to hold for a while already.
        MakeNoChanges,
        
        // Do what it takes to ensure that the property can be watched, if doing so has no
        // user-observable effect. For now this just means that we will ensure that a property
        // replacement watchpoint is enabled if it hadn't been enabled already. Do not use this
        // from JIT threads, since the act of enabling watchpoints is not thread-safe.
        EnsureWatchability
    };
    
    // This means that it's still valid and we could enforce validity by setting a transition
    // watchpoint on the structure and possibly an impure property watchpoint.
    bool isWatchableAssumingImpurePropertyWatchpoint(Structure*, JSObject*, WatchabilityEffort) const;
    bool isWatchableAssumingImpurePropertyWatchpoint(Structure*, JSObject*, WatchabilityEffort, Concurrency) const;
    
    // This means that it's still valid and we could enforce validity by setting a transition
    // watchpoint on the structure.
    bool isWatchable(Structure*, JSObject*, WatchabilityEffort) const;
    bool isWatchable(Structure*, JSObject*, WatchabilityEffort, Concurrency) const;
    
    bool watchingRequiresStructureTransitionWatchpoint() const
    {
        // Currently, this is required for all of our conditions.
        return !!*this;
    }
    bool watchingRequiresReplacementWatchpoint() const
    {
        return !!*this && m_header.type() == Equivalence;
    }

    template<typename Functor>
    void forEachDependentCell(const Functor& functor) const
    {
        if (hasPrototype() && prototype())
            functor(prototype());

        if (hasRequiredValue() && requiredValue() && requiredValue().isCell())
            functor(requiredValue().asCell());
    }
    
    void validateReferences(const TrackedReferences&) const;

    static bool isValidValueForAttributes(JSValue, unsigned attributes);

    bool isValidValueForPresence(JSValue) const;

    PropertyCondition attemptToMakeEquivalenceWithoutBarrier(JSObject* base) const;
    PropertyCondition attemptToMakeReplacementWithoutBarrier(JSObject* base) const;

private:
    bool isWatchableWhenValid(Structure*, WatchabilityEffort, Concurrency) const;

    Header m_header;
    union {
        struct {
            PropertyOffset offset;
            unsigned attributes;
        } presence;
        struct {
            JSObject* prototype;
        } prototype;
        struct {
            EncodedJSValue value;
        } equivalence;
    } u;
};

struct PropertyConditionHash {
    static unsigned hash(const PropertyCondition& key) { return key.hash(); }
    static bool equal(
        const PropertyCondition& a, const PropertyCondition& b)
    {
        return a == b;
    }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::PropertyCondition::Kind);

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::PropertyCondition> : JSC::PropertyConditionHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::PropertyCondition> : SimpleClassHashTraits<JSC::PropertyCondition> { };

} // namespace WTF
