/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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

#include "ArrayStorageInlines.h"
#include "Butterfly.h"
#include "JSObject.h"
#include "Structure.h"
#include "VM.h"

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

template<typename T>
const typename ContiguousData<T>::Data ContiguousData<T>::at(const JSCell* owner, size_t index) const
{
    ASSERT(index < m_length);
    return Data(m_data[index], owner->indexingMode());
}

template<typename T>
typename ContiguousData<T>::Data ContiguousData<T>::at(const JSCell* owner, size_t index)
{
    ASSERT(index < m_length);
    return Data(m_data[index], owner->indexingMode());
}

ALWAYS_INLINE unsigned Butterfly::availableContiguousVectorLength(size_t propertyCapacity, unsigned vectorLength)
{
    size_t cellSize = totalSize(0, propertyCapacity, true, sizeof(EncodedJSValue) * vectorLength);
    cellSize = MarkedSpace::optimalSizeFor(cellSize);
    vectorLength = (cellSize - totalSize(0, propertyCapacity, true, 0)) / sizeof(EncodedJSValue);
    return vectorLength;
}

ALWAYS_INLINE unsigned Butterfly::availableContiguousVectorLength(Structure* structure, unsigned vectorLength)
{
    return availableContiguousVectorLength(structure ? structure->outOfLineCapacity() : 0, vectorLength);
}

ALWAYS_INLINE unsigned Butterfly::optimalContiguousVectorLength(size_t propertyCapacity, unsigned vectorLength)
{
    if (!vectorLength)
        vectorLength = BASE_CONTIGUOUS_VECTOR_LEN_EMPTY;
    else
        vectorLength = std::max(BASE_CONTIGUOUS_VECTOR_LEN, vectorLength);
    return availableContiguousVectorLength(propertyCapacity, vectorLength);
}

ALWAYS_INLINE unsigned Butterfly::optimalContiguousVectorLength(Structure* structure, unsigned vectorLength)
{
    return optimalContiguousVectorLength(structure ? structure->outOfLineCapacity() : 0, vectorLength);
}

inline Butterfly* Butterfly::tryCreateUninitialized(VM& vm, JSObject*, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, size_t indexingPayloadSizeInBytes, GCDeferralContext* deferralContext)
{
    size_t size = totalSize(preCapacity, propertyCapacity, hasIndexingHeader, indexingPayloadSizeInBytes);
    void* base = vm.auxiliarySpace().allocate(vm, size, deferralContext, AllocationFailureMode::ReturnNull);
    if (UNLIKELY(!base))
        return nullptr;

    Butterfly* result = fromBase(base, preCapacity, propertyCapacity);

    return result;
}

inline Butterfly* Butterfly::createUninitialized(VM& vm, JSObject*, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, size_t indexingPayloadSizeInBytes)
{
    size_t size = totalSize(preCapacity, propertyCapacity, hasIndexingHeader, indexingPayloadSizeInBytes);
    void* base = vm.auxiliarySpace().allocate(vm, size, nullptr, AllocationFailureMode::Assert);
    Butterfly* result = fromBase(base, preCapacity, propertyCapacity);

    return result;
}

inline Butterfly* Butterfly::tryCreate(VM& vm, JSObject*, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, const IndexingHeader& indexingHeader, size_t indexingPayloadSizeInBytes)
{
    size_t size = totalSize(preCapacity, propertyCapacity, hasIndexingHeader, indexingPayloadSizeInBytes);
    void* base = vm.auxiliarySpace().allocate(vm, size, nullptr, AllocationFailureMode::ReturnNull);
    if (!base)
        return nullptr;
    Butterfly* result = fromBase(base, preCapacity, propertyCapacity);
    if (hasIndexingHeader)
        *result->indexingHeader() = indexingHeader;
    // Use memcpy since this butterfly is not tied to any object yet.
    memset(result->propertyStorage() - propertyCapacity, 0, propertyCapacity * sizeof(EncodedJSValue));
    return result;
}

inline Butterfly* Butterfly::create(VM& vm, JSObject* intendedOwner, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, const IndexingHeader& indexingHeader, size_t indexingPayloadSizeInBytes)
{
    Butterfly* result = tryCreate(vm, intendedOwner, preCapacity, propertyCapacity, hasIndexingHeader, indexingHeader, indexingPayloadSizeInBytes);

    RELEASE_ASSERT(result);
    return result;
}

inline Butterfly* Butterfly::create(VM& vm, JSObject* intendedOwner, Structure* structure)
{
    return create(
        vm, intendedOwner, 0, structure->outOfLineCapacity(),
        structure->hasIndexingHeader(intendedOwner), IndexingHeader(), 0);
}

inline void* Butterfly::base(Structure* structure)
{
    return base(indexingHeader()->preCapacity(structure), structure->outOfLineCapacity());
}

inline Butterfly* Butterfly::createOrGrowPropertyStorage(
    Butterfly* oldButterfly, VM& vm, JSObject* intendedOwner, Structure* structure, size_t oldPropertyCapacity, size_t newPropertyCapacity)
{
    RELEASE_ASSERT(newPropertyCapacity > oldPropertyCapacity);
    if (!oldButterfly)
        return create(vm, intendedOwner, 0, newPropertyCapacity, false, IndexingHeader(), 0);

    size_t preCapacity = oldButterfly->indexingHeader()->preCapacity(structure);
    size_t indexingPayloadSizeInBytes = oldButterfly->indexingHeader()->indexingPayloadSizeInBytes(structure);
    bool hasIndexingHeader = structure->hasIndexingHeader(intendedOwner);
    Butterfly* result = createUninitialized(vm, intendedOwner, preCapacity, newPropertyCapacity, hasIndexingHeader, indexingPayloadSizeInBytes);
    // Use memcpy since this butterfly is not tied to any object yet.
    memcpy(
        result->propertyStorage() - oldPropertyCapacity,
        oldButterfly->propertyStorage() - oldPropertyCapacity,
        totalSize(0, oldPropertyCapacity, hasIndexingHeader, indexingPayloadSizeInBytes));
    memset(result->propertyStorage() - newPropertyCapacity, 0, (newPropertyCapacity - oldPropertyCapacity) * sizeof(EncodedJSValue));
    return result;
}

inline Butterfly* Butterfly::createOrGrowArrayRight(
    Butterfly* oldButterfly, VM& vm, JSObject* intendedOwner, Structure* oldStructure,
    size_t propertyCapacity, bool hadIndexingHeader, size_t oldIndexingPayloadSizeInBytes,
    size_t newIndexingPayloadSizeInBytes)
{
    if (!oldButterfly) {
        return create(
            vm, intendedOwner, 0, propertyCapacity, true, IndexingHeader(),
            newIndexingPayloadSizeInBytes);
    }
    return oldButterfly->growArrayRight(
        vm, intendedOwner, oldStructure, propertyCapacity, hadIndexingHeader,
        oldIndexingPayloadSizeInBytes, newIndexingPayloadSizeInBytes);
}

inline Butterfly* Butterfly::growArrayRight(
    VM& vm, JSObject* intendedOwner, Structure* oldStructure, size_t propertyCapacity,
    bool hadIndexingHeader, size_t oldIndexingPayloadSizeInBytes,
    size_t newIndexingPayloadSizeInBytes)
{
    ASSERT_UNUSED(oldStructure, !indexingHeader()->preCapacity(oldStructure));
    ASSERT_UNUSED(intendedOwner, hadIndexingHeader == oldStructure->hasIndexingHeader(intendedOwner));
    void* theBase = base(0, propertyCapacity);
    size_t oldSize = totalSize(0, propertyCapacity, hadIndexingHeader, oldIndexingPayloadSizeInBytes);
    size_t newSize = totalSize(0, propertyCapacity, true, newIndexingPayloadSizeInBytes);
    void* newBase = vm.auxiliarySpace().allocate(vm, newSize, nullptr, AllocationFailureMode::ReturnNull);
    if (!newBase)
        return nullptr;
    // Use memcpy since this butterfly is not tied to any object yet.
    memcpy(static_cast<JSValue*>(newBase), static_cast<JSValue*>(theBase), oldSize);
    return fromBase(newBase, 0, propertyCapacity);
}

inline Butterfly* Butterfly::growArrayRight(
    VM& vm, JSObject* intendedOwner, Structure* oldStructure,
    size_t newIndexingPayloadSizeInBytes)
{
    return growArrayRight(
        vm, intendedOwner, oldStructure, oldStructure->outOfLineCapacity(),
        oldStructure->hasIndexingHeader(intendedOwner), 
        indexingHeader()->indexingPayloadSizeInBytes(oldStructure),
        newIndexingPayloadSizeInBytes);
}

inline Butterfly* Butterfly::reallocArrayRightIfPossible(
    VM& vm, GCDeferralContext& deferralContext, JSObject* intendedOwner, Structure* oldStructure, size_t propertyCapacity,
    bool hadIndexingHeader, size_t oldIndexingPayloadSizeInBytes,
    size_t newIndexingPayloadSizeInBytes)
{
    ASSERT_UNUSED(oldStructure, !indexingHeader()->preCapacity(oldStructure));
    ASSERT_UNUSED(intendedOwner, hadIndexingHeader == oldStructure->hasIndexingHeader(intendedOwner));

    void* theBase = base(0, propertyCapacity);
    size_t oldSize = totalSize(0, propertyCapacity, hadIndexingHeader, oldIndexingPayloadSizeInBytes);
    size_t newSize = totalSize(0, propertyCapacity, true, newIndexingPayloadSizeInBytes);
    ASSERT(newSize >= oldSize);

    // We can eagerly destroy butterfly backed by PreciseAllocation if (1) concurrent collector is not active and (2) the butterfly does not contain any property storage.
    // This is because during deallocation concurrent collector can access butterfly and DFG concurrent compilers accesses properties.
    // Objects with no properties are common in arrays, and we are focusing on very large array crafted by repeating Array#push, so... that's fine!
    bool canRealloc = !propertyCapacity && !vm.heap.mutatorShouldBeFenced() && std::bit_cast<HeapCell*>(theBase)->isPreciseAllocation();
    if (canRealloc) {
        void* newBase = vm.auxiliarySpace().reallocatePreciseAllocationNonVirtual(vm, std::bit_cast<HeapCell*>(theBase), newSize, &deferralContext, AllocationFailureMode::ReturnNull);
        if (!newBase)
            return nullptr;
        return fromBase(newBase, 0, propertyCapacity);
    }

    void* newBase = vm.auxiliarySpace().allocate(vm, newSize, &deferralContext, AllocationFailureMode::ReturnNull);
    if (!newBase)
        return nullptr;
    // Use memcpy since this butterfly is not tied to any object yet.
    memcpy(static_cast<JSValue*>(newBase), static_cast<JSValue*>(theBase), oldSize);
    return fromBase(newBase, 0, propertyCapacity);
}

inline Butterfly* Butterfly::resizeArray(
    VM& vm, JSObject* intendedOwner, size_t propertyCapacity, bool oldHasIndexingHeader,
    size_t oldIndexingPayloadSizeInBytes, size_t newPreCapacity, bool newHasIndexingHeader,
    size_t newIndexingPayloadSizeInBytes)
{
    Butterfly* result = createUninitialized(vm, intendedOwner, newPreCapacity, propertyCapacity, newHasIndexingHeader, newIndexingPayloadSizeInBytes);
    // FIXME: This could be made much more efficient if we used the property size,
    // not the capacity.
    void* to = result->propertyStorage() - propertyCapacity;
    void* from = propertyStorage() - propertyCapacity;
    size_t size = std::min(
        totalSize(0, propertyCapacity, oldHasIndexingHeader, oldIndexingPayloadSizeInBytes),
        totalSize(0, propertyCapacity, newHasIndexingHeader, newIndexingPayloadSizeInBytes));
    // Use memcpy since this butterfly is not tied to any object yet.
    memcpy(static_cast<JSValue*>(to), static_cast<JSValue*>(from), size);
    return result;
}

inline Butterfly* Butterfly::resizeArray(
    VM& vm, JSObject* intendedOwner, Structure* structure, size_t newPreCapacity,
    size_t newIndexingPayloadSizeInBytes)
{
    bool hasIndexingHeader = structure->hasIndexingHeader(intendedOwner);
    return resizeArray(
        vm, intendedOwner, structure->outOfLineCapacity(), hasIndexingHeader,
        indexingHeader()->indexingPayloadSizeInBytes(structure), newPreCapacity,
        hasIndexingHeader, newIndexingPayloadSizeInBytes);
}

inline Butterfly* Butterfly::unshift(Structure* structure, size_t numberOfSlots)
{
    ASSERT(hasAnyArrayStorage(structure->indexingType()));
    ASSERT(numberOfSlots <= indexingHeader()->preCapacity(structure));
    unsigned propertyCapacity = structure->outOfLineCapacity();
    // FIXME: It would probably be wise to rewrite this as a loop since (1) we know in which
    // direction we're moving memory so we don't need the extra check of memmove and (2) we're
    // moving a small amount of memory in the common case so the throughput of memmove won't
    // amortize the overhead of calling it. And no, we cannot rely on the C++ compiler to
    // inline memmove (particularly since the size argument is likely to be variable), nor can
    // we rely on the compiler to recognize the ordering of the pointer arguments (since
    // propertyCapacity is variable and could cause wrap-around as far as the compiler knows).
    gcSafeMemmove(
        propertyStorage() - numberOfSlots - propertyCapacity,
        propertyStorage() - propertyCapacity,
        sizeof(EncodedJSValue) * propertyCapacity + sizeof(IndexingHeader) + ArrayStorage::sizeFor(0));
    return IndexingHeader::fromEndOf(propertyStorage() - numberOfSlots)->butterfly();
}

inline Butterfly* Butterfly::shift(Structure* structure, size_t numberOfSlots)
{
    ASSERT(hasAnyArrayStorage(structure->indexingType()));
    unsigned propertyCapacity = structure->outOfLineCapacity();
    // FIXME: See comment in unshift(), above.
    gcSafeMemmove(
        propertyStorage() - propertyCapacity + numberOfSlots,
        propertyStorage() - propertyCapacity,
        sizeof(EncodedJSValue) * propertyCapacity + sizeof(IndexingHeader) + ArrayStorage::sizeFor(0));
    return IndexingHeader::fromEndOf(propertyStorage() + numberOfSlots)->butterfly();
}

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
