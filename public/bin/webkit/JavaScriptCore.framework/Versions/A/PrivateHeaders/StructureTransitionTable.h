/*
 * Copyright (C) 2008-2022 Apple Inc. All rights reserved.
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

#include "IndexingType.h"
#include "WeakGCMap.h"
#include <wtf/HashFunctions.h>
#include <wtf/text/UniquedStringImpl.h>

namespace JSC {

class JSCell;
class Structure;

// In fact, it should be 7 bits. See PropertySlot and Structure definitions.
using TransitionPropertyAttributes = uint8_t;

// This must be 5 bits (less than 32).
enum class TransitionKind : uint8_t {
    Unknown = 0,
    PropertyAddition = 1,
    PropertyDeletion = 2,
    PropertyAttributeChange = 3,

    // Support for transitions not related to properties.
    // If any of these are used, the string portion of the key should be 0.
    AllocateUndecided = 4,
    AllocateInt32 = 5,
    AllocateDouble = 6,
    AllocateContiguous = 7,
    AllocateArrayStorage = 8,
    AllocateSlowPutArrayStorage = 9,
    SwitchToSlowPutArrayStorage = 10,
    AddIndexedAccessors = 11,
    PreventExtensions = 12,
    Seal = 13,
    Freeze = 14,
    BecomePrototype = 15,
    ChangePrototype = 16,

    // Support for transitions related with private brand
    SetBrand = 17,
};

static constexpr auto FirstNonPropertyTransitionKind = TransitionKind::AllocateUndecided;

inline bool changesIndexingType(TransitionKind transition)
{
    switch (transition) {
    case TransitionKind::AllocateUndecided:
    case TransitionKind::AllocateInt32:
    case TransitionKind::AllocateDouble:
    case TransitionKind::AllocateContiguous:
    case TransitionKind::AllocateArrayStorage:
    case TransitionKind::AllocateSlowPutArrayStorage:
    case TransitionKind::SwitchToSlowPutArrayStorage:
    case TransitionKind::AddIndexedAccessors:
        return true;
    default:
        return false;
    }
}

inline IndexingType newIndexingType(IndexingType oldType, TransitionKind transition)
{
    switch (transition) {
    case TransitionKind::AllocateUndecided:
        ASSERT(!hasIndexedProperties(oldType));
        return oldType | UndecidedShape;
    case TransitionKind::AllocateInt32:
        ASSERT(!hasIndexedProperties(oldType) || hasUndecided(oldType) || oldType == CopyOnWriteArrayWithInt32);
        return (oldType & ~IndexingShapeAndWritabilityMask) | Int32Shape;
    case TransitionKind::AllocateDouble:
        ASSERT(Options::allowDoubleShape());
        ASSERT(!hasIndexedProperties(oldType) || hasUndecided(oldType) || hasInt32(oldType) || oldType == CopyOnWriteArrayWithDouble);
        return (oldType & ~IndexingShapeAndWritabilityMask) | DoubleShape;
    case TransitionKind::AllocateContiguous:
        ASSERT(!hasIndexedProperties(oldType) || hasUndecided(oldType) || hasInt32(oldType) || hasDouble(oldType) || oldType == CopyOnWriteArrayWithContiguous);
        return (oldType & ~IndexingShapeAndWritabilityMask) | ContiguousShape;
    case TransitionKind::AllocateArrayStorage:
        ASSERT(!hasIndexedProperties(oldType) || hasUndecided(oldType) || hasInt32(oldType) || hasDouble(oldType) || hasContiguous(oldType));
        return (oldType & ~IndexingShapeAndWritabilityMask) | ArrayStorageShape;
    case TransitionKind::AllocateSlowPutArrayStorage:
        ASSERT(!hasIndexedProperties(oldType) || hasUndecided(oldType) || hasInt32(oldType) || hasDouble(oldType) || hasContiguous(oldType));
        return (oldType & ~IndexingShapeAndWritabilityMask) | SlowPutArrayStorageShape;
    case TransitionKind::SwitchToSlowPutArrayStorage:
        ASSERT(hasArrayStorage(oldType));
        return (oldType & ~IndexingShapeAndWritabilityMask) | SlowPutArrayStorageShape;
    case TransitionKind::AddIndexedAccessors:
        return oldType | MayHaveIndexedAccessors;
    default:
        return oldType;
    }
}

inline bool preventsExtensions(TransitionKind transition)
{
    switch (transition) {
    case TransitionKind::PreventExtensions:
    case TransitionKind::Seal:
    case TransitionKind::Freeze:
        return true;
    default:
        return false;
    }
}

inline bool setsDontDeleteOnAllProperties(TransitionKind transition)
{
    switch (transition) {
    case TransitionKind::Seal:
    case TransitionKind::Freeze:
        return true;
    default:
        return false;
    }
}

inline bool setsReadOnlyOnNonAccessorProperties(TransitionKind transition)
{
    switch (transition) {
    case TransitionKind::Freeze:
        return true;
    default:
        return false;
    }
}

class StructureTransitionTable {
    static constexpr intptr_t UsingSingleSlotFlag = 1;

    class PointerKey {
    public:
        PointerKey(UniquedStringImpl* uid) : m_pointer(std::bit_cast<uintptr_t>(uid)) { }
        PointerKey(JSObject* object) : m_pointer(std::bit_cast<uintptr_t>(object)) { }
        constexpr PointerKey(std::nullptr_t) { }

        uintptr_t raw() const { return m_pointer; }
        void* pointer() const { return std::bit_cast<void*>(m_pointer); }

        static PointerKey fromRaw(uintptr_t key)
        {
            return PointerKey(key);
        }

        friend bool operator==(const PointerKey&, const PointerKey&) = default;

    private:
        constexpr PointerKey(uintptr_t key) : m_pointer(key) { }

        uintptr_t m_pointer { 0 };
    };
    static_assert(sizeof(PointerKey) == sizeof(void*));

#if CPU(ADDRESS64)
    struct Hash {
        // Logically, Key is a tuple of (1) PointerKey (at least it needs to be 8-byte aligned), (2) unsigned attributes, and (3) transitionKind.
        struct Key {
            friend struct Hash;
            static_assert(WTF_OS_CONSTANT_EFFECTIVE_ADDRESS_WIDTH <= 48);
            static constexpr unsigned attributesShift = 48;
            static constexpr unsigned transitionKindShift = 56;
            static constexpr uintptr_t stringMask = (1ULL << attributesShift) - 1;
            static constexpr uintptr_t hashTableDeletedValue = 0x2;
            static_assert(sizeof(TransitionPropertyAttributes) * 8 <= 8);
            static_assert(sizeof(TransitionKind) * 8 <= 8);
            static_assert(hashTableDeletedValue < 8);

            // Highest 8 bits are for TransitionKind; next 8 belong to TransitionPropertyAttributes.
            // Remaining bits are for PointerKey.
            Key(PointerKey impl, unsigned attributes, TransitionKind transitionKind)
                : m_encodedData(impl.raw() | (static_cast<uintptr_t>(attributes) << attributesShift) | (static_cast<uintptr_t>(transitionKind) << transitionKindShift))
            {
                ASSERT(impl == this->impl());
                ASSERT(roundUpToMultipleOf<8>(impl.raw()) == impl.raw());
                ASSERT(attributes <= UINT8_MAX);
                ASSERT(attributes == this->attributes());
                ASSERT(transitionKind != TransitionKind::Unknown);
                ASSERT(transitionKind == this->transitionKind());
            }

            Key() = default;

            Key(WTF::HashTableDeletedValueType)
                : m_encodedData(hashTableDeletedValue)
            { }

            bool isHashTableDeletedValue() const { return m_encodedData == hashTableDeletedValue; }

            PointerKey impl() const { return PointerKey::fromRaw(m_encodedData & stringMask); }
            TransitionPropertyAttributes attributes() const { return (m_encodedData >> attributesShift) & UINT8_MAX; }
            TransitionKind transitionKind() const { return static_cast<TransitionKind>(m_encodedData >> transitionKindShift); }

            friend bool operator==(const Key&, const Key&) = default;

        private:
            uintptr_t m_encodedData { 0 };
        };
        using KeyTraits = SimpleClassHashTraits<Key>;

        static unsigned hash(const Key& p)
        {
            return IntHash<uintptr_t>::hash(p.m_encodedData);
        }

        static bool equal(const Key& a, const Key& b)
        {
            return a == b;
        }

        static Key createFromStructure(Structure*);
        static Key createKey(PointerKey impl, unsigned attributes, TransitionKind transitionKind)
        {
            return Key { impl, attributes, transitionKind };
        }

        static constexpr bool safeToCompareToEmptyOrDeleted = true;
    };
#else
    struct Hash {
        using Key = std::tuple<void*, unsigned, TransitionKind>;
        using KeyTraits = HashTraits<Key>;
        
        static unsigned hash(const Key& p)
        {
            return PtrHash<void*>::hash(std::get<0>(p)) + std::get<1>(p) + static_cast<unsigned>(std::get<2>(p));
        }

        static bool equal(const Key& a, const Key& b)
        {
            return a == b;
        }

        static Key createFromStructure(Structure*);
        static Key createKey(PointerKey impl, unsigned attributes, TransitionKind transitionKind)
        {
            return Key { impl.pointer(), attributes, transitionKind };
        }

        static constexpr bool safeToCompareToEmptyOrDeleted = true;
    };
#endif

    typedef WeakGCMap<Hash::Key, Structure, Hash, Hash::KeyTraits> TransitionMap;

public:
    StructureTransitionTable() = default;

    ~StructureTransitionTable()
    {
        if (!isUsingSingleSlot()) {
            delete map();
            return;
        }
    }

    void add(VM&, JSCell* owner, Structure*);
    bool contains(PointerKey, unsigned attributes, TransitionKind) const;
    Structure* get(PointerKey, unsigned attributes, TransitionKind) const;

    Structure* trySingleTransition() const;

    void finalizeUnconditionally(VM&, CollectionScope);

private:
    friend class SingleSlotTransitionWeakOwner;

    bool isUsingSingleSlot() const
    {
        return m_data & UsingSingleSlotFlag;
    }

    TransitionMap* map() const
    {
        ASSERT(!isUsingSingleSlot());
        return std::bit_cast<TransitionMap*>(m_data);
    }

    void setMap(TransitionMap* map)
    {
        ASSERT(isUsingSingleSlot());
        // This implicitly clears the flag that indicates we're using a single transition
        m_data = std::bit_cast<intptr_t>(map);
        ASSERT(!isUsingSingleSlot());
    }

    void setSingleTransition(VM&, JSCell* owner, Structure*);

    intptr_t m_data { UsingSingleSlotFlag };
};

} // namespace JSC
