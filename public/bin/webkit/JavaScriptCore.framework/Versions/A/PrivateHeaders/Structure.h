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

#include "ClassInfo.h"
#include "Concurrency.h"
#include "ConcurrentJSLock.h"
#include "DeletePropertySlot.h"
#include "IndexingType.h"
#include "JSCJSValue.h"
#include "JSCast.h"
#include "JSType.h"
#include "JSTypeInfo.h"
#include "PropertyName.h"
#include "PropertyNameArray.h"
#include "PropertyOffset.h"
#include "PutPropertySlot.h"
#include "StructureRareData.h"
#include "StructureTransitionTable.h"
#include "TypeInfoBlob.h"
#include "Watchpoint.h"
#include "WriteBarrierInlines.h"
#include <wtf/Atomics.h>
#include <wtf/CompactPointerTuple.h>
#include <wtf/CompactPtr.h>
#include <wtf/CompactRefPtr.h>
#include <wtf/PrintStream.h>

namespace WTF {

class UniquedStringImpl;

} // namespace WTF

namespace JSC {

class DeferGC;
class DeferredStructureTransitionWatchpointFire;
class LLIntOffsetsExtractor;
class PropertyNameArray;
class PropertyNameArrayData;
class PropertyTable;
class StructureChain;
class StructureShape;
class JSString;
struct DumpContext;
struct HashTable;
struct HashTableValue;

namespace Integrity {
class Analyzer;
}

class DeferredStructureTransitionWatchpointFire final : public DeferredWatchpointFire {
    WTF_MAKE_NONCOPYABLE(DeferredStructureTransitionWatchpointFire);
public:
    DeferredStructureTransitionWatchpointFire(VM& vm, Structure* structure)
        : DeferredWatchpointFire()
        , m_vm(vm)
        , m_structure(structure)
    {
    }

    ~DeferredStructureTransitionWatchpointFire()
    {
        if (watchpointsToFire().state() == IsWatched)
            fireAllSlow();
    }

    const Structure* structure() const { return m_structure; }


private:
    JS_EXPORT_PRIVATE void fireAllSlow();

    VM& m_vm;
    const Structure* m_structure;
};

// The out-of-line property storage capacity to use when first allocating out-of-line
// storage. Note that all objects start out without having any out-of-line storage;
// this comes into play only on the first property store that exhausts inline storage.
static constexpr unsigned initialOutOfLineCapacity = 4;

// The factor by which to grow out-of-line storage when it is exhausted, after the
// initial allocation.
static constexpr unsigned outOfLineGrowthFactor = 2;

class PropertyTableEntry;
class CompactPropertyTableEntry {
public:
    CompactPropertyTableEntry()
        : m_data(nullptr, 0)
    {
    }

    CompactPropertyTableEntry(UniquedStringImpl* key, PropertyOffset offset, unsigned attributes)
        : m_data(key, ((offset << 8) | attributes))
    {
        ASSERT(this->attributes() == attributes);
        ASSERT(this->offset() == offset);
    }

    CompactPropertyTableEntry(const PropertyTableEntry&);

    UniquedStringImpl* key() const { return m_data.pointer(); }
    void setKey(UniquedStringImpl* key) { m_data.setPointer(key); }
    PropertyOffset offset() const { return m_data.type() >> 8; }
    void setOffset(PropertyOffset offset)
    {
        m_data.setType((m_data.type() & 0x00ffU) | (offset << 8));
        ASSERT(this->offset() == offset);
    }
    uint8_t attributes() const { return m_data.type(); }
    void setAttributes(uint8_t attributes)
    {
        m_data.setType((m_data.type() & 0xff00U) | attributes);
        ASSERT(this->attributes() == attributes);
    }

private:
    CompactPointerTuple<UniquedStringImpl*, uint16_t> m_data;
};

class PropertyTableEntry {
public:
    PropertyTableEntry() = default;

    PropertyTableEntry(UniquedStringImpl* key, PropertyOffset offset, unsigned attributes)
        : m_key(key)
        , m_offset(offset)
        , m_attributes(attributes)
    {
        ASSERT(this->attributes() == attributes);
    }

    PropertyTableEntry(const CompactPropertyTableEntry& entry)
        : m_key(entry.key())
        , m_offset(entry.offset())
        , m_attributes(entry.attributes())
    {
    }

    UniquedStringImpl* key() const { return m_key; }
    void setKey(UniquedStringImpl* key) { m_key = key; }
    PropertyOffset offset() const { return m_offset; }
    void setOffset(PropertyOffset offset) { m_offset = offset; }
    uint8_t attributes() const { return m_attributes; }
    void setAttributes(uint8_t attributes) { m_attributes = attributes; }

private:
    UniquedStringImpl* m_key { nullptr };
    PropertyOffset m_offset { 0 };
    uint8_t m_attributes { 0 };
};


inline CompactPropertyTableEntry::CompactPropertyTableEntry(const PropertyTableEntry& entry)
    : m_data(entry.key(), ((entry.offset() << 8) | entry.attributes()))
{
}

class StructureFireDetail final : public FireDetail {
public:
    StructureFireDetail(const Structure* structure)
        : m_structure(structure)
    {
    }
    
    void dump(PrintStream& out) const final;

private:
    const Structure* m_structure;
};

class Structure : public JSCell {
    static constexpr uint16_t shortInvalidOffset = std::numeric_limits<uint16_t>::max() - 1;
    static constexpr uint16_t useRareDataFlag = std::numeric_limits<uint16_t>::max();
public:
    friend class StructureTransitionTable;

    typedef JSCell Base;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;
    static constexpr uint8_t numberOfLowerTierPreciseCells = 0;

#if ENABLE(STRUCTURE_ID_WITH_SHIFT)
    static constexpr size_t atomSize = 32;
#endif
    static_assert(JSCell::atomSize >= MarkedBlock::atomSize);

    static constexpr int s_maxTransitionLength = 64;
    static constexpr int s_maxTransitionLengthForNonEvalPutById = 512;
    static constexpr int s_maxTransitionLengthForRemove = 4096; // Picked from benchmarking measurement.

    using SeenProperties = TinyBloomFilter<CompactPtr<UniquedStringImpl>::StorageType>;

    enum PolyProtoTag { PolyProto };
    inline static Structure* create(VM&, JSGlobalObject*, JSValue prototype, const TypeInfo&, const ClassInfo*, IndexingType = NonArray, unsigned inlineCapacity = 0);
    static Structure* create(PolyProtoTag, VM&, JSGlobalObject*, JSObject* prototype, const TypeInfo&, const ClassInfo*, IndexingType = NonArray, unsigned inlineCapacity = 0);

    ~Structure();
    
    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.structureSpace();
    }

    JS_EXPORT_PRIVATE static bool isValidPrototype(JSValue);

protected:
    void finishCreation(VM& vm, const Structure* previous, DeferredStructureTransitionWatchpointFire* deferred)
    {
        this->finishCreation(vm);
        if (previous->hasRareData()) {
            const StructureRareData* previousRareData = previous->rareData();
            if (previousRareData->hasSharedPolyProtoWatchpoint()) {
                ensureRareData(vm);
                rareData()->setSharedPolyProtoWatchpoint(previousRareData->copySharedPolyProtoWatchpoint());
            }
        }
        previous->fireStructureTransitionWatchpoint(deferred);
    }

private:
    void finishCreation(VM& vm)
    {
        Base::finishCreation(vm);
        ASSERT(m_prototype.get().isEmpty() || isValidPrototype(m_prototype.get()));
    }

    void finishCreation(VM& vm, CreatingEarlyCellTag)
    {
        Base::finishCreation(vm, this, CreatingEarlyCell);
        ASSERT(m_prototype);
        ASSERT(m_prototype.isNull());
        ASSERT(!vm.structureStructure);
    }

    void validateFlags();

public:
    StructureID id() const { return StructureID::encode(this); }

    int32_t typeInfoBlob() const { return m_blob.blob(); }

    bool isProxy() const
    {
        JSType type = m_blob.type();
        return type == GlobalProxyType || type == ProxyObjectType;
    }

    static void dumpStatistics();

    inline bool shouldDoCacheableDictionaryTransitionForAdd(PutPropertySlot::Context context)
    {
        int maxTransitionLength;
        if (context == PutPropertySlot::PutById)
            maxTransitionLength = s_maxTransitionLengthForNonEvalPutById;
        else
            maxTransitionLength = s_maxTransitionLength;
        return transitionCountEstimate() > maxTransitionLength;
    }

    inline bool shouldDoCacheableDictionaryTransitionForRemoveAndAttributeChange()
    {
        return transitionCountEstimate() > s_maxTransitionLengthForRemove || transitionCountHasOverflowed();
    }

    ALWAYS_INLINE bool transitionCountHasOverflowed() const
    {
        int transitionCount = 0;
        for (auto* structure = this; structure; structure = structure->previousID()) {
            if (++transitionCount > s_maxTransitionLength)
                return true;
        }

        return false;
    }

    JS_EXPORT_PRIVATE static Structure* addPropertyTransition(VM&, Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    JS_EXPORT_PRIVATE static Structure* addNewPropertyTransition(VM&, Structure*, PropertyName, unsigned attributes, PropertyOffset&, PutPropertySlot::Context = PutPropertySlot::UnknownContext, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* addPropertyTransitionToExistingStructureConcurrently(Structure*, UniquedStringImpl* uid, unsigned attributes, PropertyOffset&);
    static Structure* addPropertyTransitionToExistingStructure(Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    static Structure* removeNewPropertyTransition(VM&, Structure*, PropertyName, PropertyOffset&, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* removePropertyTransition(VM&, Structure*, PropertyName, PropertyOffset&, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* removePropertyTransitionFromExistingStructure(Structure*, PropertyName, PropertyOffset&);
    static Structure* removePropertyTransitionFromExistingStructureConcurrently(Structure*, PropertyName, PropertyOffset&);
    static Structure* changePrototypeTransition(VM&, Structure*, JSValue prototype, DeferredStructureTransitionWatchpointFire&);
    static Structure* changeGlobalProxyTargetTransition(VM&, Structure*, JSGlobalObject*, DeferredStructureTransitionWatchpointFire&);
    JS_EXPORT_PRIVATE static Structure* attributeChangeTransition(VM&, Structure*, PropertyName, unsigned attributes, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* attributeChangeTransitionToExistingStructureConcurrently(Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    JS_EXPORT_PRIVATE static Structure* attributeChangeTransitionToExistingStructure(Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    JS_EXPORT_PRIVATE static Structure* toCacheableDictionaryTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* toUncacheableDictionaryTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);
    JS_EXPORT_PRIVATE static Structure* sealTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);
    JS_EXPORT_PRIVATE static Structure* freezeTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* preventExtensionsTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);
    static Structure* nonPropertyTransition(VM&, Structure*, TransitionKind, DeferredStructureTransitionWatchpointFire*);
    static Structure* setBrandTransitionFromExistingStructureConcurrently(Structure*, UniquedStringImpl*);
    static Structure* setBrandTransition(VM&, Structure*, Symbol* brand, DeferredStructureTransitionWatchpointFire* = nullptr);
    JS_EXPORT_PRIVATE static Structure* becomePrototypeTransition(VM&, Structure*, DeferredStructureTransitionWatchpointFire* = nullptr);

    JS_EXPORT_PRIVATE bool isSealed(VM&);
    JS_EXPORT_PRIVATE bool isFrozen(VM&);
    bool isStructureExtensible() const { return !didPreventExtensions(); }

    JS_EXPORT_PRIVATE Structure* flattenDictionaryStructure(VM&, JSObject*);

    static constexpr bool needsDestruction = true;
    static void destroy(JSCell*);

    // Versions that take a func will call it after making the change but while still holding
    // the lock. The callback is not called if there is no change being made, like if you call
    // removePropertyWithoutTransition() and the property is not found.
    template<typename Func>
    PropertyOffset addPropertyWithoutTransition(VM&, PropertyName, unsigned attributes, const Func&);
    template<typename Func>
    PropertyOffset removePropertyWithoutTransition(VM&, PropertyName, const Func&);
    template<typename Func>
    PropertyOffset attributeChangeWithoutTransition(VM&, PropertyName, unsigned attributes, const Func&);
    template<typename Func>
    auto addOrReplacePropertyWithoutTransition(VM&, PropertyName, unsigned attributes, const Func&) -> decltype(auto);
    void setPrototypeWithoutTransition(VM&, JSValue prototype);
        
    bool isDictionary() const { return dictionaryKind() != NoneDictionaryKind; }
    bool isUncacheableDictionary() const { return dictionaryKind() == UncachedDictionaryKind; }
  
    bool prototypeQueriesAreCacheable()
    {
        return !typeInfo().prohibitsPropertyCaching();
    }
    
    bool propertyAccessesAreCacheable()
    {
        return dictionaryKind() != UncachedDictionaryKind
            && prototypeQueriesAreCacheable()
            && !(typeInfo().getOwnPropertySlotIsImpure() && !typeInfo().newImpurePropertyFiresWatchpoints());
    }

    bool propertyAccessesAreCacheableForAbsence()
    {
        return !typeInfo().getOwnPropertySlotIsImpureForPropertyAbsence();
    }

    bool needImpurePropertyWatchpoint()
    {
        return propertyAccessesAreCacheable()
            && typeInfo().getOwnPropertySlotIsImpure()
            && typeInfo().newImpurePropertyFiresWatchpoints();
    }

    bool isImmutablePrototypeExoticObject()
    {
        return typeInfo().isImmutablePrototypeExoticObject();
    }

    // We use SlowPath in GetByStatus for structures that may get new impure properties later to prevent
    // DFG from inlining property accesses since structures don't transition when a new impure property appears.
    bool takesSlowPathInDFGForImpureProperty()
    {
        return typeInfo().getOwnPropertySlotIsImpure();
    }

    bool hasNonReifiedStaticProperties() const
    {
        return typeInfo().hasStaticPropertyTable() && !staticPropertiesReified();
    }

    bool isNonExtensibleOrHasNonConfigurableProperties() const
    {
        return didPreventExtensions() || hasNonConfigurableProperties();
    }

    bool hasAnyOfBitFieldFlags(unsigned flags) const
    {
        return m_bitField & flags;
    }

    // Type accessors.
    TypeInfo typeInfo() const { return m_blob.typeInfo(m_outOfLineTypeFlags); }
    bool isObject() const { return typeInfo().isObject(); }
    const ClassInfo* classInfoForCells() const { return m_classInfo.get(); }
    CellState typeInfoDefaultCellState() const { return m_blob.defaultCellState(); }
protected:
    // You probably want typeInfo().type()
    JSType type() { return JSCell::type(); }
    // You probably want classInfoForCell()
    const ClassInfo* classInfo() const = delete;
public:

    IndexingType indexingType() const { return m_blob.indexingModeIncludingHistory() & AllWritableArrayTypes; }
    IndexingType indexingMode() const  { return m_blob.indexingModeIncludingHistory() & AllArrayTypes; }
    Dependency fencedIndexingMode(IndexingType& indexingType)
    {
        Dependency dependency = m_blob.fencedIndexingModeIncludingHistory(indexingType);
        indexingType &= AllArrayTypes;
        return dependency;
    }
    IndexingType indexingModeIncludingHistory() const { return m_blob.indexingModeIncludingHistory(); }
        
    inline bool mayInterceptIndexedAccesses() const;
    
    inline bool holesMustForwardToPrototype(JSObject*) const;
        
    JSGlobalObject* globalObject() const { return m_globalObject.get(); }

    // NOTE: This method should only be called during the creation of structures, since the global
    // object of a structure is presumed to be immutable in a bunch of places.
    void setGlobalObject(VM&, JSGlobalObject*);

    ALWAYS_INLINE bool hasMonoProto() const
    {
        return !m_prototype.get().isEmpty();
    }
    ALWAYS_INLINE bool hasPolyProto() const
    {
        return !hasMonoProto();
    }
    ALWAYS_INLINE JSValue storedPrototype() const
    {
        ASSERT(hasMonoProto());
        return m_prototype.get();
    }
    JSValue storedPrototype(const JSObject*) const;
    JSObject* storedPrototypeObject(const JSObject*) const;
    Structure* storedPrototypeStructure(const JSObject*) const;

    JSObject* storedPrototypeObject() const;
    Structure* storedPrototypeStructure() const;
    JSValue prototypeForLookup(JSGlobalObject*) const;
    JSValue prototypeForLookup(JSGlobalObject*, JSCell* base) const;
    StructureChain* prototypeChain(VM&, JSGlobalObject*, JSObject* base) const;
    DECLARE_VISIT_CHILDREN;
    
    // A Structure is cheap to mark during GC if doing so would only add a small and bounded amount
    // to our heap footprint. For example, if the structure refers to a global object that is not
    // yet marked, then as far as we know, the decision to mark this Structure would lead to a large
    // increase in footprint because no other object refers to that global object. This method
    // returns true if all user-controlled (and hence unbounded in size) objects referenced from the
    // Structure are already marked.
    template<typename Visitor> bool isCheapDuringGC(Visitor&);
    
    // Returns true if this structure is now marked.
    template<typename Visitor> bool markIfCheap(Visitor&);
    
    bool hasRareData() const
    {
        return isRareData(m_previousOrRareData.get());
    }

    StructureRareData* rareData()
    {
        ASSERT(hasRareData());
        return static_cast<StructureRareData*>(m_previousOrRareData.get());
    }

    StructureRareData* tryRareData()
    {
        JSCell* value = m_previousOrRareData.get();
        WTF::dependentLoadLoadFence();
        if (isRareData(value))
            return static_cast<StructureRareData*>(value);
        return nullptr;
    }

    const StructureRareData* rareData() const
    {
        ASSERT(hasRareData());
        return static_cast<const StructureRareData*>(m_previousOrRareData.get());
    }

    const StructureRareData* rareDataConcurrently() const
    {
        JSCell* cell = m_previousOrRareData.get();
        if (isRareData(cell))
            return static_cast<StructureRareData*>(cell);
        return nullptr;
    }

    StructureRareData* ensureRareData(VM& vm)
    {
        if (!hasRareData())
            allocateRareData(vm);
        return rareData();
    }
    
    Structure* previousID() const
    {
        ASSERT(structure()->classInfoForCells() == info());
        // This is so written because it's used concurrently. We only load from m_previousOrRareData
        // once, and this load is guaranteed atomic.
        JSCell* cell = m_previousOrRareData.get();
        if (isRareData(cell))
            return static_cast<StructureRareData*>(cell)->previousID();
        return static_cast<Structure*>(cell);
    }
    bool transitivelyTransitionedFrom(Structure* structureToFind);

    PropertyOffset maxOffset() const
    {
        uint16_t maxOffset = m_maxOffset;
        if (maxOffset == shortInvalidOffset)
            return invalidOffset;
        if (maxOffset == useRareDataFlag)
            return rareData()->m_maxOffset;
        return maxOffset;
    }

    void setMaxOffset(VM& vm, PropertyOffset offset)
    {
        if (offset == invalidOffset)
            m_maxOffset = shortInvalidOffset;
        else if (offset < useRareDataFlag && offset < shortInvalidOffset)
            m_maxOffset = offset;
        else if (m_maxOffset == useRareDataFlag)
            rareData()->m_maxOffset = offset;
        else {
            ensureRareData(vm)->m_maxOffset = offset;
            WTF::storeStoreFence();
            m_maxOffset = useRareDataFlag;
        }
    }

    PropertyOffset transitionOffset() const
    {
        uint16_t transitionOffset = m_transitionOffset;
        if (transitionOffset == shortInvalidOffset)
            return invalidOffset;
        if (transitionOffset == useRareDataFlag)
            return rareData()->m_transitionOffset;
        return transitionOffset;
    }

    void setTransitionOffset(VM& vm, PropertyOffset offset)
    {
        if (offset == invalidOffset)
            m_transitionOffset = shortInvalidOffset;
        else if (offset < useRareDataFlag && offset < shortInvalidOffset)
            m_transitionOffset = offset;
        else if (m_transitionOffset == useRareDataFlag)
            rareData()->m_transitionOffset = offset;
        else {
            ensureRareData(vm)->m_transitionOffset = offset;
            WTF::storeStoreFence();
            m_transitionOffset = useRareDataFlag;
        }
    }

    static unsigned outOfLineCapacity(PropertyOffset maxOffset)
    {
        unsigned outOfLineSize = Structure::outOfLineSize(maxOffset);

        // This algorithm completely determines the out-of-line property storage growth algorithm.
        // The JSObject code will only trigger a resize if the value returned by this algorithm
        // changed between the new and old structure. So, it's important to keep this simple because
        // it's on a fast path.
        
        if (!outOfLineSize)
            return 0;

        if (outOfLineSize <= initialOutOfLineCapacity)
            return initialOutOfLineCapacity;

        ASSERT(outOfLineSize > initialOutOfLineCapacity);
        static_assert(outOfLineGrowthFactor == 2);
        return WTF::roundUpToPowerOfTwo(outOfLineSize);
    }
    
    static unsigned outOfLineSize(PropertyOffset maxOffset)
    {
        return numberOfOutOfLineSlotsForMaxOffset(maxOffset);
    }

    unsigned outOfLineCapacity() const
    {
        return outOfLineCapacity(maxOffset());
    }
    unsigned outOfLineSize() const
    {
        return outOfLineSize(maxOffset());
    }
    bool hasInlineStorage() const
    {
        return !!m_inlineCapacity;
    }
    unsigned inlineCapacity() const
    {
        return m_inlineCapacity;
    }
    unsigned inlineSize() const
    {
        return std::min<unsigned>(maxOffset() + 1, m_inlineCapacity);
    }
    unsigned totalStorageCapacity() const
    {
        ASSERT(structure()->classInfoForCells() == info());
        return outOfLineCapacity() + inlineCapacity();
    }

    bool isValidOffset(PropertyOffset offset) const
    {
        return JSC::isValidOffset(offset)
            && offset <= maxOffset()
            && (offset < m_inlineCapacity || offset >= firstOutOfLineOffset);
    }

    bool hijacksIndexingHeader() const
    {
        return isTypedView(m_blob.type());
    }
    
    bool couldHaveIndexingHeader() const
    {
        return hasIndexedProperties(indexingType())
            || hijacksIndexingHeader();
    }
    
    bool hasIndexingHeader(const JSCell*) const;    
    bool masqueradesAsUndefined(JSGlobalObject* lexicalGlobalObject);

    PropertyOffset get(VM&, PropertyName);
    PropertyOffset get(VM&, PropertyName, unsigned& attributes);

    bool canPerformFastPropertyEnumerationCommon() const;
    bool canPerformFastPropertyEnumeration() const;

    // This is a somewhat internalish method. It will call your functor while possibly holding the
    // Structure's lock. There is no guarantee whether the lock is held or not in any particular
    // call. So, you have to assume the worst. Also, the functor returns true if it wishes for you
    // to continue or false if it's done.
    template<typename Functor>
    void forEachPropertyConcurrently(const Functor&);

    template<typename Functor>
    void forEachProperty(VM&, const Functor&);

    IGNORE_RETURN_TYPE_WARNINGS_BEGIN
    ALWAYS_INLINE PropertyOffset get(VM& vm, Concurrency concurrency, UniquedStringImpl* uid, unsigned& attributes)
    {
        switch (concurrency) {
        case Concurrency::MainThread:
            ASSERT(!isCompilationThread() && !Thread::mayBeGCThread());
            return get(vm, uid, attributes);
        case Concurrency::ConcurrentThread:
            return getConcurrently(uid, attributes);
        }
    }
    IGNORE_RETURN_TYPE_WARNINGS_END

    IGNORE_RETURN_TYPE_WARNINGS_BEGIN
    ALWAYS_INLINE PropertyOffset get(VM& vm, Concurrency concurrency, UniquedStringImpl* uid)
    {
        switch (concurrency) {
        case Concurrency::MainThread:
            ASSERT(!isCompilationThread() && !Thread::mayBeGCThread());
            return get(vm, uid);
        case Concurrency::ConcurrentThread:
            return getConcurrently(uid);
        }
    }
    IGNORE_RETURN_TYPE_WARNINGS_END
    
    PropertyOffset getConcurrently(UniquedStringImpl* uid);
    PropertyOffset getConcurrently(UniquedStringImpl* uid, unsigned& attributes);
    
    Vector<PropertyTableEntry> getPropertiesConcurrently();
    
    void setHasAnyKindOfGetterSetterPropertiesWithProtoCheck(bool is__proto__)
    {
        setHasAnyKindOfGetterSetterProperties(true);
        if (!is__proto__)
            setHasReadOnlyOrGetterSetterPropertiesExcludingProto(true);
    }
    
    void setContainsReadOnlyProperties() { setHasReadOnlyOrGetterSetterPropertiesExcludingProto(true); }
    
    void setCachedPropertyNameEnumerator(VM&, JSPropertyNameEnumerator*, StructureChain*);
    JSPropertyNameEnumerator* cachedPropertyNameEnumerator() const;
    uintptr_t cachedPropertyNameEnumeratorAndFlag() const;
    bool canCachePropertyNameEnumerator(VM&) const;
    bool canAccessPropertiesQuicklyForEnumeration() const;

    JSImmutableButterfly* cachedPropertyNames(CachedPropertyNamesKind) const;
    JSImmutableButterfly* cachedPropertyNamesIgnoringSentinel(CachedPropertyNamesKind) const;
    void setCachedPropertyNames(VM&, CachedPropertyNamesKind, JSImmutableButterfly*);
    bool canCacheOwnPropertyNames() const;

    void getPropertyNamesFromStructure(VM&, PropertyNameArray&, DontEnumPropertiesMode);

    JSValue cachedSpecialProperty(CachedSpecialPropertyKey key)
    {
        if (!hasRareData())
            return JSValue();
        return rareData()->cachedSpecialProperty(key);
    }
    void cacheSpecialProperty(JSGlobalObject*, VM&, JSValue, CachedSpecialPropertyKey, const PropertySlot&);

    static constexpr ptrdiff_t prototypeOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_prototype);
    }

    static constexpr ptrdiff_t globalObjectOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_globalObject);
    }

    static constexpr ptrdiff_t classInfoOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_classInfo);
    }

    static constexpr ptrdiff_t outOfLineTypeFlagsOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_outOfLineTypeFlags);
    }

    static constexpr ptrdiff_t indexingModeIncludingHistoryOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_blob) + TypeInfoBlob::indexingModeIncludingHistoryOffset();
    }
    
    static constexpr ptrdiff_t propertyTableUnsafeOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_propertyTableUnsafe);
    }

    static constexpr ptrdiff_t inlineCapacityOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_inlineCapacity);
    }

    static constexpr ptrdiff_t previousOrRareDataOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_previousOrRareData);
    }

    static constexpr ptrdiff_t bitFieldOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_bitField);
    }

    static constexpr ptrdiff_t propertyHashOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_propertyHash);
    }

    static constexpr ptrdiff_t seenPropertiesOffset()
    {
        return OBJECT_OFFSETOF(Structure, m_seenProperties) + SeenProperties::offsetOfBits();
    }

    static Structure* createStructure(VM&);
        
    bool transitionWatchpointSetHasBeenInvalidated() const
    {
        return m_transitionWatchpointSet.hasBeenInvalidated();
    }
        
    bool transitionWatchpointSetIsStillValid() const
    {
        return m_transitionWatchpointSet.isStillValid();
    }
    
    bool dfgShouldWatchIfPossible() const
    {
        // FIXME: We would like to not watch things that are unprofitable to watch, like
        // dictionaries. Unfortunately, we can't do such things: a dictionary could get flattened,
        // in which case it will start to appear watchable and so the DFG will think that it is
        // watching it. We should come up with a comprehensive story for not watching things that
        // aren't profitable to watch.
        // https://bugs.webkit.org/show_bug.cgi?id=133625
        
        // - We don't watch Structures that either decided not to be watched, or whose predecessors
        //   decided not to be watched. This happens when a transition is fired while being watched.
        if (transitionWatchpointIsLikelyToBeFired())
            return false;

        // - Don't watch Structures that had been dictionaries.
        if (hasBeenDictionary())
            return false;
        
        return true;
    }
    
    bool dfgShouldWatch() const
    {
        return dfgShouldWatchIfPossible() && transitionWatchpointSetIsStillValid();
    }

    bool propertyNameEnumeratorShouldWatch() const
    {
        return dfgShouldWatch() && !hasPolyProto();
    }
        
    void addTransitionWatchpoint(Watchpoint* watchpoint) const
    {
        ASSERT(transitionWatchpointSetIsStillValid());
        m_transitionWatchpointSet.add(watchpoint);
    }
    
    void didTransitionFromThisStructureWithoutFiringWatchpoint() const;
    void fireStructureTransitionWatchpoint(DeferredStructureTransitionWatchpointFire*) const;

    InlineWatchpointSet& transitionWatchpointSet() const
    {
        return m_transitionWatchpointSet;
    }
    
    WatchpointSet* ensurePropertyReplacementWatchpointSet(VM&, PropertyOffset);
    void startWatchingPropertyForReplacements(VM& vm, PropertyOffset offset)
    {
        ensurePropertyReplacementWatchpointSet(vm, offset);
    }
    void startWatchingPropertyForReplacements(VM&, PropertyName);
    WatchpointSet* propertyReplacementWatchpointSet(PropertyOffset);
    WatchpointSet* firePropertyReplacementWatchpointSet(VM&, PropertyOffset, const char* reason);

    void didReplaceProperty(PropertyOffset);
    void didCachePropertyReplacement(VM&, PropertyOffset);
    
    void startWatchingInternalPropertiesIfNecessary(VM& vm)
    {
        if (LIKELY(didWatchInternalProperties()))
            return;
        startWatchingInternalProperties(vm);
    }
    
    Ref<StructureShape> toStructureShape(JSValue, bool& sawPolyProtoStructure);
    
    void dump(PrintStream&) const;
    void dumpInContext(PrintStream&, DumpContext*) const;
    void dumpBrief(PrintStream&, const CString&) const;
    
    static void dumpContextHeader(PrintStream&);
    
    ConcurrentJSLock& lock() { return m_lock; }

    unsigned propertyHash() const { return m_propertyHash; }
    SeenProperties seenProperties() const { return m_seenProperties; }

    static bool shouldConvertToPolyProto(const Structure* a, const Structure* b);

    UniquedStringImpl* transitionPropertyName() const { return m_transitionPropertyName.get(); }

    struct PropertyHashEntry {
        const HashTable* table;
        const HashTableValue* value;
    };
    std::optional<PropertyHashEntry> findPropertyHashEntry(PropertyName) const;
    
    DECLARE_EXPORT_INFO;

private:
    JS_EXPORT_PRIVATE void didReplacePropertySlow(PropertyOffset);

    typedef enum { 
        NoneDictionaryKind = 0,
        CachedDictionaryKind = 1,
        UncachedDictionaryKind = 2
    } DictionaryKind;

public:
#define DEFINE_BITFIELD(type, lowerName, upperName, width, offset) \
    static constexpr uint32_t s_##lowerName##Shift = offset;\
    static constexpr uint32_t s_##lowerName##Mask = ((1 << (width - 1)) | ((1 << (width - 1)) - 1));\
    static constexpr uint32_t s_##lowerName##Bits = s_##lowerName##Mask << s_##lowerName##Shift;\
    static constexpr uint32_t s_bitWidthOf##upperName = width;\
    type lowerName() const { return static_cast<type>((m_bitField >> offset) & s_##lowerName##Mask); }\
    void set##upperName(type newValue) \
    {\
        m_bitField &= ~(s_##lowerName##Mask << offset);\
        m_bitField |= (static_cast<uint32_t>(newValue) & s_##lowerName##Mask) << offset;\
    }

    DEFINE_BITFIELD(DictionaryKind, dictionaryKind, DictionaryKind, 2, 0);
    DEFINE_BITFIELD(bool, isPinnedPropertyTable, IsPinnedPropertyTable, 1, 2);
    DEFINE_BITFIELD(bool, hasAnyKindOfGetterSetterProperties, HasAnyKindOfGetterSetterProperties, 1, 3);
    DEFINE_BITFIELD(bool, hasReadOnlyOrGetterSetterPropertiesExcludingProto, HasReadOnlyOrGetterSetterPropertiesExcludingProto, 1, 4);
    DEFINE_BITFIELD(bool, isQuickPropertyAccessAllowedForEnumeration, IsQuickPropertyAccessAllowedForEnumeration, 1, 5);
    DEFINE_BITFIELD(bool, hasNonEnumerableProperties, HasNonEnumerableProperties, 1, 6);
    DEFINE_BITFIELD(TransitionKind, transitionKind, TransitionKind, 5, 13);
    DEFINE_BITFIELD(bool, isWatchingReplacement, IsWatchingReplacement, 1, 18); // This flag can be fliped on the main thread at any timing.
    DEFINE_BITFIELD(bool, mayBePrototype, MayBePrototype, 1, 19);
    DEFINE_BITFIELD(bool, didPreventExtensions, DidPreventExtensions, 1, 20);
    DEFINE_BITFIELD(bool, didTransition, DidTransition, 1, 21);
    DEFINE_BITFIELD(bool, staticPropertiesReified, StaticPropertiesReified, 1, 22);
    DEFINE_BITFIELD(bool, hasBeenFlattenedBefore, HasBeenFlattenedBefore, 1, 23);
    DEFINE_BITFIELD(bool, isBrandedStructure, IsBrandedStructure, 1, 24);
    DEFINE_BITFIELD(bool, didWatchInternalProperties, DidWatchInternalProperties, 1, 25);
    DEFINE_BITFIELD(bool, transitionWatchpointIsLikelyToBeFired, TransitionWatchpointIsLikelyToBeFired, 1, 26);
    DEFINE_BITFIELD(bool, hasBeenDictionary, HasBeenDictionary, 1, 27);
    DEFINE_BITFIELD(bool, protectPropertyTableWhileTransitioning, ProtectPropertyTableWhileTransitioning, 1, 28);
    DEFINE_BITFIELD(bool, hasUnderscoreProtoPropertyExcludingOriginalProto, HasUnderscoreProtoPropertyExcludingOriginalProto, 1, 29);
    DEFINE_BITFIELD(bool, hasNonConfigurableProperties, HasNonConfigurableProperties, 1, 30);
    DEFINE_BITFIELD(bool, hasNonConfigurableReadOnlyOrGetterSetterProperties, HasNonConfigurableReadOnlyOrGetterSetterProperties, 1, 31);

    static_assert(s_bitWidthOfTransitionKind <= sizeof(TransitionKind) * 8);

    static bool bitFieldFlagsCantBeChangedWithoutTransition(unsigned flags)
    {
        return flags == (flags & (
            s_didPreventExtensionsBits
            | s_isQuickPropertyAccessAllowedForEnumerationBits
            | s_hasNonEnumerablePropertiesBits
            | s_hasAnyKindOfGetterSetterPropertiesBits
            | s_hasReadOnlyOrGetterSetterPropertiesExcludingProtoBits
            | s_hasUnderscoreProtoPropertyExcludingOriginalProtoBits
            | s_hasNonConfigurablePropertiesBits
            | s_hasNonConfigurableReadOnlyOrGetterSetterPropertiesBits
        ));
    }

    TransitionPropertyAttributes transitionPropertyAttributes() const { return m_transitionPropertyAttributes; }
    void setTransitionPropertyAttributes(TransitionPropertyAttributes transitionPropertyAttributes) { m_transitionPropertyAttributes = transitionPropertyAttributes; }

    int transitionCountEstimate() const
    {
        // Since the number of transitions is often the same as the last offset (except if there are deletes)
        // we keep the size of Structure down by not storing both.
        return numberOfSlotsForMaxOffset(maxOffset(), m_inlineCapacity);
    }

    void finalizeUnconditionally(VM&, CollectionScope);

protected:
    Structure(VM&, Structure*);

private:
    friend class LLIntOffsetsExtractor;

    JS_EXPORT_PRIVATE Structure(VM&, JSGlobalObject*, JSValue prototype, const TypeInfo&, const ClassInfo*, IndexingType, unsigned inlineCapacity);
    Structure(VM&, CreatingEarlyCellTag);

    static Structure* create(VM&, Structure*, DeferredStructureTransitionWatchpointFire*);

    static Structure* addPropertyTransitionToExistingStructureImpl(Structure*, UniquedStringImpl* uid, unsigned attributes, PropertyOffset&);
    ALWAYS_INLINE static Structure* attributeChangeTransitionToExistingStructureImpl(Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    static Structure* removePropertyTransitionFromExistingStructureImpl(Structure*, PropertyName, unsigned attributes, PropertyOffset&);
    static Structure* setBrandTransitionFromExistingStructureImpl(Structure*, UniquedStringImpl*);

    JS_EXPORT_PRIVATE static Structure* nonPropertyTransitionSlow(VM&, Structure*, TransitionKind, DeferredStructureTransitionWatchpointFire*);

    // This function does the both didTransitionFromThisStructureWithoutFiringWatchpoint and fireStructureTransitionWatchpoint.
    void didTransitionFromThisStructure(DeferredStructureTransitionWatchpointFire*) const;

    // This will return the structure that has a usable property table, that property table,
    // and the list of structures that we visited before we got to it. If it returns a
    // non-null structure, it will also lock the structure that it returns; it is your job
    // to unlock it.
    bool findStructuresAndMapForMaterialization(Vector<Structure*, 8>& structures, Structure*& structure, PropertyTable*&) WTF_ACQUIRES_LOCK_IF(true, structure->m_lock);
    
    static Structure* toDictionaryTransition(VM&, Structure*, DictionaryKind, DeferredStructureTransitionWatchpointFire* = nullptr);

    enum class ShouldPin : bool { No, Yes };
    template<ShouldPin, typename Func>
    PropertyOffset add(VM&, PropertyName, unsigned attributes, const Func&);
    PropertyOffset add(VM&, PropertyName, unsigned attributes);
    template<ShouldPin, typename Func>
    PropertyOffset remove(VM&, PropertyName, const Func&);
    PropertyOffset remove(VM&, PropertyName);
    template<ShouldPin, typename Func>
    PropertyOffset attributeChange(VM&, PropertyName, unsigned attributes, const Func&);
    PropertyOffset attributeChange(VM&, PropertyName, unsigned attributes);

#if ASSERT_ENABLED
    void checkConsistency();
#else
    ALWAYS_INLINE void checkConsistency() { }
#endif

    // This may grab the lock, or not. Do not call when holding the Structure's lock.
    PropertyTable* ensurePropertyTableIfNotEmpty(VM& vm)
    {
        if (PropertyTable* result = m_propertyTableUnsafe.get())
            return result;
        if (!previousID())
            return nullptr;
        return materializePropertyTable(vm);
    }
    
    // This may grab the lock, or not. Do not call when holding the Structure's lock.
    PropertyTable* ensurePropertyTable(VM& vm)
    {
        if (PropertyTable* result = m_propertyTableUnsafe.get())
            return result;
        return materializePropertyTable(vm);
    }
    
    PropertyTable* propertyTableOrNull() const
    {
        return m_propertyTableUnsafe.get();
    }
    
    // This will grab the lock. Do not call when holding the Structure's lock.
    JS_EXPORT_PRIVATE PropertyTable* materializePropertyTable(VM&, bool setPropertyTable = true);
    
    void setPropertyTable(VM& vm, PropertyTable* table);
    
    PropertyTable* takePropertyTableOrCloneIfPinned(VM&);
    PropertyTable* copyPropertyTableForPinning(VM&);

    void setPreviousID(VM&, Structure*);

    void clearPreviousID()
    {
        if (hasRareData())
            rareData()->clearPreviousID();
        else
            m_previousOrRareData.clear();
    }

    bool isValid(JSGlobalObject*, StructureChain* cachedPrototypeChain, JSObject* base) const;

    // You have to hold the structure lock to do these.
    // Keep them inlined function since they are used in the critical path of Dictionary JSObject modification.
    void pin(const AbstractLocker&, VM&, PropertyTable*);
    void pinForCaching(const AbstractLocker&, VM&, PropertyTable*);
    
    static bool isRareData(JSCell* cell)
    {
        return cell && cell->type() != StructureType;
    }

    template<typename DetailsFunc>
    void checkOffsetConsistency(PropertyTable*, const DetailsFunc&) const;
    void checkOffsetConsistency() const;

    JS_EXPORT_PRIVATE void allocateRareData(VM&);
    
    void startWatchingInternalProperties(VM&);

    void clearCachedPrototypeChain();

    bool holesMustForwardToPrototypeSlow(JSObject*) const;

    // These need to be properly aligned at the beginning of the 'Structure'
    // part of the object.
    TypeInfoBlob m_blob;
    TypeInfo::OutOfLineTypeFlags m_outOfLineTypeFlags;

    uint8_t m_inlineCapacity;

    ConcurrentJSLock m_lock;

    uint32_t m_bitField;
    TransitionPropertyAttributes m_transitionPropertyAttributes { 0 };

    uint16_t m_transitionOffset;
    uint16_t m_maxOffset;

    uint32_t m_propertyHash;
    SeenProperties m_seenProperties;


    WriteBarrier<JSGlobalObject> m_globalObject;
    WriteBarrier<Unknown> m_prototype;
    mutable WriteBarrier<StructureChain> m_cachedPrototypeChain;

    WriteBarrier<JSCell> m_previousOrRareData;

    CompactRefPtr<UniquedStringImpl> m_transitionPropertyName;

    CompactPtr<const ClassInfo> m_classInfo;

    StructureTransitionTable m_transitionTable;

    // Should be accessed through ensurePropertyTable(). During GC, it may be set to 0 by another thread.
    // During a Heap Snapshot GC we avoid clearing the table so it is safe to use.
    WriteBarrier<PropertyTable> m_propertyTableUnsafe;

    mutable InlineWatchpointSet m_transitionWatchpointSet;

    static_assert(firstOutOfLineOffset < 256);

    friend class VMInspector;
    friend class JSDollarVMHelper;
    friend class Integrity::Analyzer;
};

void dumpTransitionKind(PrintStream&, TransitionKind);
MAKE_PRINT_ADAPTOR(TransitionKindDump, TransitionKind, dumpTransitionKind);

} // namespace JSC
