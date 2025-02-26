/*
 * Copyright (C) 2014-2022 Apple Inc. All rights reserved.
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

#include "JSCast.h"
#include "Operations.h"
#include "PropertyNameArray.h"
#include "StructureChain.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class JSPropertyNameEnumerator final : public JSCell {
public:
    using Base = JSCell;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;

    enum Flag : uint8_t {
        InitMode = 0,
        IndexedMode = 1 << 0,
        OwnStructureMode = 1 << 1,
        GenericMode = 1 << 2,
        // Profiling Only
        HasSeenOwnStructureModeStructureMismatch = 1 << 3,
    };

    static constexpr uint8_t enumerationModeMask = (GenericMode << 1) - 1;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.propertyNameEnumeratorSpace();
    }

    static JSPropertyNameEnumerator* create(VM&, Structure*, uint32_t, uint32_t, PropertyNameArray&&);

    inline static Structure* createStructure(VM&, JSGlobalObject*, JSValue);

    DECLARE_EXPORT_INFO;

    JSString* propertyNameAtIndex(uint32_t index)
    {
        if (index >= sizeOfPropertyNames())
            return nullptr;
        return m_propertyNames.get()[index].get();
    }

    Structure* cachedStructure(VM& vm) const
    {
        UNUSED_PARAM(vm);
        return m_cachedStructureID.get();
    }
    StructureID cachedStructureID() const { return m_cachedStructureID.value(); }
    uint32_t indexedLength() const { return m_indexedLength; }
    uint32_t endStructurePropertyIndex() const { return m_endStructurePropertyIndex; }
    uint32_t endGenericPropertyIndex() const { return m_endGenericPropertyIndex; }
    uint32_t cachedInlineCapacity() const { return m_cachedInlineCapacity; }
    uint32_t sizeOfPropertyNames() const { return endGenericPropertyIndex(); }
    uint32_t flags() const { return m_flags; }
    static constexpr ptrdiff_t cachedStructureIDOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_cachedStructureID); }
    static constexpr ptrdiff_t indexedLengthOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_indexedLength); }
    static constexpr ptrdiff_t endStructurePropertyIndexOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_endStructurePropertyIndex); }
    static constexpr ptrdiff_t endGenericPropertyIndexOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_endGenericPropertyIndex); }
    static constexpr ptrdiff_t cachedInlineCapacityOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_cachedInlineCapacity); }
    static constexpr ptrdiff_t flagsOffset() { return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_flags); }
    static constexpr ptrdiff_t cachedPropertyNamesVectorOffset()
    {
        return OBJECT_OFFSETOF(JSPropertyNameEnumerator, m_propertyNames);
    }

    JSString* computeNext(JSGlobalObject*, JSObject* base, uint32_t& currentIndex, Flag&, bool shouldAllocateIndexedNameString = true);

    DECLARE_VISIT_CHILDREN;

private:
    friend class LLIntOffsetsExtractor;

    JSPropertyNameEnumerator(VM&, Structure*, uint32_t, uint32_t, WriteBarrier<JSString>*, unsigned);
    void finishCreation(VM&, RefPtr<PropertyNameArrayData>&&);

    // JSPropertyNameEnumerator is immutable data structure, which allows VM to cache the empty one.
    // After instantiating JSPropertyNameEnumerator, we must not change any fields.
    AuxiliaryBarrier<WriteBarrier<JSString>*> m_propertyNames;
    WriteBarrierStructureID m_cachedStructureID;
    uint32_t m_indexedLength;
    uint32_t m_endStructurePropertyIndex;
    uint32_t m_endGenericPropertyIndex;
    uint32_t m_cachedInlineCapacity;
    uint32_t m_flags { 0 };
};

void getEnumerablePropertyNames(JSGlobalObject*, JSObject*, PropertyNameArray&, uint32_t& indexedLength, uint32_t& structurePropertyCount);

inline JSPropertyNameEnumerator* propertyNameEnumerator(JSGlobalObject* globalObject, JSObject* base)
{
    VM& vm = getVM(globalObject);
    auto scope = DECLARE_THROW_SCOPE(vm);

    uint32_t indexedLength = base->getEnumerableLength();

    Structure* structure = base->structure();
    if (!indexedLength) {
        uintptr_t enumeratorAndFlag = structure->cachedPropertyNameEnumeratorAndFlag();
        if (enumeratorAndFlag) {
            if (!(enumeratorAndFlag & StructureRareData::cachedPropertyNameEnumeratorIsValidatedViaTraversingFlag))
                return std::bit_cast<JSPropertyNameEnumerator*>(enumeratorAndFlag);
            structure->prototypeChain(vm, globalObject, base); // Refresh cached structure chain.
            if (auto* enumerator = structure->cachedPropertyNameEnumerator())
                return enumerator;
        }
    }

    uint32_t numberStructureProperties = 0;
    PropertyNameArray propertyNames(vm, PropertyNameMode::Strings, PrivateSymbolMode::Exclude);
    getEnumerablePropertyNames(globalObject, base, propertyNames, indexedLength, numberStructureProperties);
    RETURN_IF_EXCEPTION(scope, nullptr);

    ASSERT(propertyNames.size() < UINT32_MAX);

    bool sawPolyProto;
    bool successfullyNormalizedChain = normalizePrototypeChain(globalObject, base, sawPolyProto) != InvalidPrototypeChain;

    Structure* structureAfterGettingPropertyNames = base->structure();
    if (!structureAfterGettingPropertyNames->canAccessPropertiesQuicklyForEnumeration()) {
        indexedLength = 0;
        numberStructureProperties = 0;
    }

    JSPropertyNameEnumerator* enumerator = nullptr;
    if (!indexedLength && !propertyNames.size())
        enumerator = vm.emptyPropertyNameEnumerator();
    else
        enumerator = JSPropertyNameEnumerator::create(vm, structureAfterGettingPropertyNames, indexedLength, numberStructureProperties, WTFMove(propertyNames));
    if (!indexedLength && successfullyNormalizedChain && structureAfterGettingPropertyNames == structure) {
        StructureChain* chain = structure->prototypeChain(vm, globalObject, base);
        if (structure->canCachePropertyNameEnumerator(vm))
            structure->setCachedPropertyNameEnumerator(vm, enumerator, chain);
    }
    return enumerator;
}

using EnumeratorMetadata = std::underlying_type_t<JSPropertyNameEnumerator::Flag>;

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
