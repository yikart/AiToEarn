/*
 * Copyright (C) 2012-2022 Apple Inc. All rights reserved.
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

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "AllocatorForMode.h"
#include "AllocatorInlines.h"
#include "CompleteSubspaceInlines.h"
#include "CPU.h"
#include "CallFrameInlines.h"
#include "DeferGCInlines.h"
#include "FreeListInlines.h"
#include "Handle.h"
#include "HeapInlines.h"
#include "IsoSubspaceInlines.h"
#include "JSBigInt.h"
#include "JSCast.h"
#include "JSDestructibleObject.h"
#include "JSFunction.h"
#include "JSObject.h"
#include "JSString.h"
#include "LocalAllocatorInlines.h"
#include "MarkedBlock.h"
#include "SlotVisitorInlines.h"
#include "Structure.h"
#include "Symbol.h"
#include <wtf/CompilationThread.h>

namespace JSC {

inline JSCell::JSCell(CreatingEarlyCellTag)
    : m_cellState(CellState::DefinitelyWhite)
{
    ASSERT(!isCompilationThread());
}

inline JSCell::JSCell(VM&, Structure* structure)
    : JSCell(CreatingWellDefinedBuiltinCell, structure->id(), structure->typeInfoBlob())
{
    ASSERT(!isCompilationThread());
    ASSERT(m_cellState == CellState::DefinitelyWhite);

    // Note that in the constructor initializer list above, we are only using values
    // inside structure but not necessarily the structure pointer itself. All these
    // values are contained inside Structure::m_blob. Note also that this constructor
    // is an inline function. Hence, the compiler may choose to pre-compute the address
    // of structure->m_blob and discard the structure pointer itself. There's a chance
    // that the GC may run while allocating this cell. In the event that the structure
    // is newly instantiated just before calling this constructor, there may not be any
    // other references to it. As a result, the structure may get collected before this
    // cell is even constructed. To avoid this possibility, we need to ensure that the
    // structure pointer is still alive at this point.
    ensureStillAliveHere(structure);
    static_assert(JSCell::atomSize >= MarkedBlock::atomSize);
}

// This constructor should not be used directly. Exceptions are for quite few well-defined builtin objects, e.g. JSString, empty JSFinalObject etc.
// Structure must be kept alive somehow (e.g. by JSGlobalObject, or ensureStillAliveHere).
ALWAYS_INLINE JSCell::JSCell(CreatingWellDefinedBuiltinCellTag, StructureID structureID, int32_t blob)
    : m_structureID(structureID)
#if CPU(LITTLE_ENDIAN)
    , m_indexingTypeAndMisc(static_cast<uint8_t>(blob >> 0))
    , m_type(std::bit_cast<JSType>(static_cast<uint8_t>(blob >> 8)))
    , m_flags(std::bit_cast<TypeInfo::InlineTypeFlags>(static_cast<uint8_t>(blob >> 16)))
    , m_cellState(std::bit_cast<CellState>(static_cast<uint8_t>(blob >> 24)))
#else
    , m_indexingTypeAndMisc(static_cast<uint8_t>(blob >> 24))
    , m_type(std::bit_cast<JSType>(static_cast<uint8_t>(blob >> 16)))
    , m_flags(std::bit_cast<TypeInfo::InlineTypeFlags>(static_cast<uint8_t>(blob >> 8)))
    , m_cellState(std::bit_cast<CellState>(static_cast<uint8_t>(blob >> 0)))
#endif
{
}

inline void JSCell::finishCreation(VM& vm)
{
    // This object is ready to be escaped so the concurrent GC may see it at any time. We have
    // to make sure that none of our stores sink below here.
    vm.mutatorFence();
#if ENABLE(GC_VALIDATION)
    ASSERT(vm.isInitializingObject());
    vm.setInitializingObjectClass(0);
#else
    UNUSED_PARAM(vm);
#endif
    ASSERT(m_structureID);
}

inline void JSCell::finishCreation(VM& vm, Structure* structure, CreatingEarlyCellTag)
{
#if ENABLE(GC_VALIDATION)
    ASSERT(vm.isInitializingObject());
    vm.setInitializingObjectClass(0);
    if (structure) {
#endif
        m_structureID = structure->id();
        m_indexingTypeAndMisc = structure->indexingModeIncludingHistory();
        m_type = structure->typeInfo().type();
        m_flags = structure->typeInfo().inlineTypeFlags();
#if ENABLE(GC_VALIDATION)
    }
#else
    UNUSED_PARAM(vm);
#endif
    // Very first set of allocations won't have a real structure.
    ASSERT(m_structureID || !vm.structureStructure);
}

inline JSType JSCell::type() const
{
    return m_type;
}

inline IndexingType JSCell::indexingTypeAndMisc() const
{
    return m_indexingTypeAndMisc;
}

inline IndexingType JSCell::indexingType() const
{
    return indexingTypeAndMisc() & AllWritableArrayTypes;
}

inline IndexingType JSCell::indexingMode() const
{
    return indexingTypeAndMisc() & AllArrayTypes;
}

ALWAYS_INLINE Structure* JSCell::structure() const
{
    return m_structureID.decode();
}

template<typename Visitor>
void JSCell::visitChildrenImpl(JSCell* cell, Visitor& visitor)
{
    visitor.appendUnbarriered(cell->structure());
}

DEFINE_VISIT_CHILDREN_WITH_MODIFIER(inline, JSCell);

template<typename Visitor>
ALWAYS_INLINE void JSCell::visitOutputConstraintsImpl(JSCell*, Visitor&)
{
}

DEFINE_VISIT_OUTPUT_CONSTRAINTS_WITH_MODIFIER(inline, JSCell);

ALWAYS_INLINE VM& CallFrame::deprecatedVM() const
{
    JSCell* callee = this->callee().asCell();
    ASSERT(callee);
    return callee->vm();
}

template<typename Type>
inline Allocator allocatorForConcurrently(VM& vm, size_t allocationSize, AllocatorForMode mode)
{
    if (auto* subspace = subspaceForConcurrently<Type>(vm))
        return subspace->allocatorFor(allocationSize, mode);
    return { };
}

template<typename T, AllocationFailureMode failureMode>
ALWAYS_INLINE void* tryAllocateCellHelper(VM& vm, size_t size, GCDeferralContext* deferralContext)
{
    ASSERT(deferralContext || vm.heap.isDeferred() || !DisallowGC::isInEffectOnCurrentThread());
    ASSERT(size >= sizeof(T));
    JSCell* result = static_cast<JSCell*>(subspaceFor<T>(vm)->allocate(vm, WTF::roundUpToMultipleOf<T::atomSize>(size), deferralContext, failureMode));
    if constexpr (failureMode == AllocationFailureMode::ReturnNull) {
        if (!result)
            return nullptr;
    }
#if ENABLE(GC_VALIDATION)
    ASSERT(!vm.isInitializingObject());
    vm.setInitializingObjectClass(T::info());
#endif
    result->clearStructure();
    return result;
}

template<typename T>
void* allocateCell(VM& vm, size_t size)
{
    return tryAllocateCellHelper<T, AllocationFailureMode::Assert>(vm, size, nullptr);
}

template<typename T>
void* tryAllocateCell(VM& vm, size_t size)
{
    return tryAllocateCellHelper<T, AllocationFailureMode::ReturnNull>(vm, size, nullptr);
}

template<typename T>
void* allocateCell(VM& vm, GCDeferralContext* deferralContext, size_t size)
{
    return tryAllocateCellHelper<T, AllocationFailureMode::Assert>(vm, size, deferralContext);
}

template<typename T>
void* tryAllocateCell(VM& vm, GCDeferralContext* deferralContext, size_t size)
{
    return tryAllocateCellHelper<T, AllocationFailureMode::ReturnNull>(vm, size, deferralContext);
}

inline bool JSCell::isObject() const
{
    return TypeInfo::isObject(m_type);
}

inline bool JSCell::isString() const
{
    return m_type == StringType;
}

inline bool JSCell::isHeapBigInt() const
{
    return m_type == HeapBigIntType;
}

inline bool JSCell::isSymbol() const
{
    return m_type == SymbolType;
}

inline bool JSCell::isGetterSetter() const
{
    return m_type == GetterSetterType;
}

inline bool JSCell::isCustomGetterSetter() const
{
    return m_type == CustomGetterSetterType;
}

inline bool JSCell::isProxy() const
{
    return m_type == GlobalProxyType || m_type == ProxyObjectType;
}

// FIXME: Consider making getCallData concurrency-safe once NPAPI support is removed.
// https://bugs.webkit.org/show_bug.cgi?id=215801
template<Concurrency concurrency>
ALWAYS_INLINE TriState JSCell::isCallableWithConcurrency()
{
    if (!isObject())
        return TriState::False;
    // JSFunction and InternalFunction assert during construction that derived classes don't override getCallData,
    // which guarantees that CallData::Type::None is never returned.
    if (type() == JSFunctionType || type() == InternalFunctionType)
        return TriState::True;
    if (inlineTypeFlags() & OverridesGetCallData) {
        if constexpr (concurrency == Concurrency::MainThread)
            return (methodTable()->getCallData(this).type != CallData::Type::None) ? TriState::True : TriState::False;
        return TriState::Indeterminate;
    }
    return TriState::False;
}

template<Concurrency concurrency>
inline TriState JSCell::isConstructorWithConcurrency()
{
    if (!isObject())
        return TriState::False;
    if constexpr (concurrency == Concurrency::MainThread)
        return (methodTable()->getConstructData(this).type != CallData::Type::None) ? TriState::True : TriState::False;
    // We know that both getConstructData of both types are concurrency aware. Plus, derived classes of JSFunction and InternalFunction
    // never override getConstructData (this is ensured by ASSERT in JSFunction and InternalFunction).
    if (type() == JSFunctionType || type() == InternalFunctionType)
        return (methodTable()->getConstructData(this).type != CallData::Type::None) ? TriState::True : TriState::False;
    return TriState::Indeterminate;
}

ALWAYS_INLINE bool JSCell::isCallable()
{
    auto result = isCallableWithConcurrency<Concurrency::MainThread>();
    ASSERT(result != TriState::Indeterminate);
    return result == TriState::True;
}

ALWAYS_INLINE bool JSCell::isConstructor()
{
    auto result = isConstructorWithConcurrency<Concurrency::MainThread>();
    ASSERT(result != TriState::Indeterminate);
    return result == TriState::True;
}

inline bool JSCell::isAPIValueWrapper() const
{
    return m_type == APIValueWrapperType;
}

ALWAYS_INLINE void JSCell::setStructure(VM& vm, Structure* structure)
{
    ASSERT(structure->classInfoForCells() == this->structure()->classInfoForCells());
    ASSERT(!this->structure()
        || this->structure()->transitionWatchpointSetHasBeenInvalidated()
        || structure->id().decode() == structure);
    m_structureID = structure->id();
    m_flags = TypeInfo::mergeInlineTypeFlags(structure->typeInfo().inlineTypeFlags(), m_flags);
    m_type = structure->typeInfo().type();
    IndexingType newIndexingType = structure->indexingModeIncludingHistory();
    if (m_indexingTypeAndMisc != newIndexingType) {
        ASSERT(!(newIndexingType & ~AllArrayTypesAndHistory));
        for (;;) {
            IndexingType oldValue = m_indexingTypeAndMisc;
            IndexingType newValue = (oldValue & ~AllArrayTypesAndHistory) | structure->indexingModeIncludingHistory();
            if (WTF::atomicCompareExchangeWeakRelaxed(&m_indexingTypeAndMisc, oldValue, newValue))
                break;
        }
    }
    vm.writeBarrier(this, structure);
}

inline const MethodTable* JSCell::methodTable() const
{
    Structure* structure = this->structure();
#if ASSERT_ENABLED
    if (Structure* rootStructure = structure->structure())
        ASSERT(rootStructure == rootStructure->structure());
#endif
    return &structure->classInfoForCells()->methodTable;
}

inline bool JSCell::inherits(const ClassInfo* info) const
{
    return classInfo()->isSubClassOf(info);
}

template<typename Target>
inline bool JSCell::inherits() const
{
    return JSCastingHelpers::inherits<Target>(this);
}

ALWAYS_INLINE JSValue JSCell::fastGetOwnProperty(VM& vm, Structure& structure, PropertyName name)
{
    ASSERT(canUseFastGetOwnProperty(structure));
    PropertyOffset offset = structure.get(vm, name);
    if (offset != invalidOffset)
        return asObject(this)->locationForOffset(offset)->get();
    return JSValue();
}

inline bool JSCell::canUseFastGetOwnProperty(const Structure& structure)
{
    return !structure.hasAnyKindOfGetterSetterProperties()
        && !structure.typeInfo().overridesGetOwnPropertySlot();
}

ALWAYS_INLINE const ClassInfo* JSCell::classInfo() const
{
    // What we really want to assert here is that we're not currently destructing this object (which makes its classInfo
    // invalid). If mutatorState() == MutatorState::Running, then we're not currently sweeping, and therefore cannot be
    // destructing the object. The GC thread or JIT threads, unlike the mutator thread, are able to access classInfo
    // independent of whether the mutator thread is sweeping or not. Hence, we also check for !currentThreadIsHoldingAPILock()
    // to allow the GC thread or JIT threads to pass this assertion.
    ASSERT(vm().heap.mutatorState() != MutatorState::Sweeping || !vm().currentThreadIsHoldingAPILock());
    return structure()->classInfoForCells();
}

inline bool JSCell::toBoolean(JSGlobalObject* globalObject) const
{
    if (isString())
        return static_cast<const JSString*>(this)->toBoolean();
    if (isHeapBigInt())
        return static_cast<const JSBigInt*>(this)->toBoolean();
    return !structure()->masqueradesAsUndefined(globalObject);
}

inline TriState JSCell::pureToBoolean() const
{
    if (isString())
        return static_cast<const JSString*>(this)->toBoolean() ? TriState::True : TriState::False;
    if (isHeapBigInt())
        return static_cast<const JSBigInt*>(this)->toBoolean() ? TriState::True : TriState::False;
    if (isSymbol())
        return TriState::True;
    return TriState::Indeterminate;
}

inline void JSCellLock::lock()
{
    Atomic<IndexingType>* lock = std::bit_cast<Atomic<IndexingType>*>(&m_indexingTypeAndMisc);
    if (UNLIKELY(!IndexingTypeLockAlgorithm::lockFast(*lock)))
        lockSlow();
}

inline bool JSCellLock::tryLock()
{
    Atomic<IndexingType>* lock = std::bit_cast<Atomic<IndexingType>*>(&m_indexingTypeAndMisc);
    return IndexingTypeLockAlgorithm::tryLock(*lock);
}

inline void JSCellLock::unlock()
{
    Atomic<IndexingType>* lock = std::bit_cast<Atomic<IndexingType>*>(&m_indexingTypeAndMisc);
    if (UNLIKELY(!IndexingTypeLockAlgorithm::unlockFast(*lock)))
        unlockSlow();
}

inline bool JSCellLock::isLocked() const
{
    Atomic<IndexingType>* lock = std::bit_cast<Atomic<IndexingType>*>(&m_indexingTypeAndMisc);
    return IndexingTypeLockAlgorithm::isLocked(*lock);
}

inline bool JSCell::perCellBit() const
{
    return TypeInfo::perCellBit(inlineTypeFlags());
}

inline void JSCell::setPerCellBit(bool value)
{
    if (value == perCellBit())
        return;

    if (value)
        m_flags |= static_cast<TypeInfo::InlineTypeFlags>(TypeInfoPerCellBit);
    else
        m_flags &= ~static_cast<TypeInfo::InlineTypeFlags>(TypeInfoPerCellBit);
}

inline JSObject* JSCell::toObject(JSGlobalObject* globalObject) const
{
    if (isObject())
        return jsCast<JSObject*>(const_cast<JSCell*>(this));
    return toObjectSlow(globalObject);
}

ALWAYS_INLINE JSString* JSCell::toStringInline(JSGlobalObject* globalObject) const
{
    Structure* structure = this->structure();
    if (structure->hasRareData()) {
        auto* rareData = structure->rareData();
        if (rareData->cachedSpecialProperty(CachedSpecialPropertyKey::ToPrimitive).isUndefinedOrNull()) {
            if (rareData->cachedSpecialProperty(CachedSpecialPropertyKey::ToString) == globalObject->objectProtoToStringFunction()) {
                if (auto result = rareData->cachedSpecialProperty(CachedSpecialPropertyKey::ToStringTag))
                    return asString(result);
            }
        }
    }
    if (isObject())
        return asObject(this)->toString(globalObject);
    if (isString())
        return asString(this);
    return toStringSlowCase(globalObject);
}

ALWAYS_INLINE bool JSCell::putInline(JSGlobalObject* globalObject, PropertyName propertyName, JSValue value, PutPropertySlot& slot)
{
    Structure* structure = this->structure();
    if (LIKELY(!structure->typeInfo().overridesPut()))
        return JSObject::putInlineForJSObject(asObject(this), globalObject, propertyName, value, slot);
    return structure->methodTable()->put(this, globalObject, propertyName, value, slot);
}

inline bool isWebAssemblyInstance(const JSCell* cell)
{
    return cell->type() == WebAssemblyInstanceType;
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
