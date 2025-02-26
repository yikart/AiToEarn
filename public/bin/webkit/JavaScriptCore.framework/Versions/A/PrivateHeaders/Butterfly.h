/*
 * Copyright (C) 2012-2018 Apple Inc. All rights reserved.
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

#include "IndexingHeader.h"
#include "IndexingType.h"
#include "PropertyStorage.h"
#include <wtf/Gigacage.h>
#include <wtf/Noncopyable.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class VM;
class CopyVisitor;
class GCDeferralContext;
struct ArrayStorage;

template <typename T>
struct ContiguousData {
    ContiguousData() = default;
    ContiguousData(T* data, size_t length)
        : m_data(data)
#if ASSERT_ENABLED
        , m_length(length)
#endif
    {
        UNUSED_PARAM(length);
    }

    struct Data {
        Data(T& location, IndexingType indexingMode)
            : m_data(location)
#if ASSERT_ENABLED
            , m_isWritable(!isCopyOnWrite(indexingMode))
#endif
        {
            UNUSED_PARAM(indexingMode);
        }

        explicit operator bool() const { return !!m_data.get(); }

        const T& operator=(const T& value)
        {
            ASSERT(m_isWritable);
            m_data = value;
            return value;
        }

        operator const T&() const { return m_data; }

        // WriteBarrier forwarded methods.

        void set(VM& vm, const JSCell* owner, const JSValue& value)
        {
            ASSERT(m_isWritable);
            m_data.set(vm, owner, value);
        }

        void setWithoutWriteBarrier(const JSValue& value)
        {
            ASSERT(m_isWritable);
            m_data.setWithoutWriteBarrier(value);
        }

        void setStartingValue(JSValue value)
        {
            m_data.setStartingValue(value);
        }

        void clear()
        {
            ASSERT(m_isWritable);
            m_data.clear();
        }

        JSValue get() const
        {
            return m_data.get();
        }


        T& m_data;
#if ASSERT_ENABLED
        bool m_isWritable;
#endif
    };

    const Data at(const JSCell* owner, size_t index) const;
    Data at(const JSCell* owner, size_t index);

    T& atUnsafe(size_t index) { ASSERT(index < m_length); return m_data[index]; }

    T* data() const { return m_data; }
#if ASSERT_ENABLED
    size_t length() const { return m_length; }
#endif

private:
    T* m_data { nullptr };
#if ASSERT_ENABLED
    size_t m_length { 0 };
#endif
};

using ContiguousDoubles = ContiguousData<double>;
using ContiguousJSValues = ContiguousData<WriteBarrier<Unknown>>;
using ConstContiguousDoubles = ContiguousData<const double>;
using ConstContiguousJSValues = ContiguousData<const WriteBarrier<Unknown>>;

class Butterfly {
    WTF_MAKE_NONCOPYABLE(Butterfly);
private:
    Butterfly() { } // Not instantiable.
public:
    
    static size_t totalSize(size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, size_t indexingPayloadSizeInBytes)
    {
        ASSERT(indexingPayloadSizeInBytes ? hasIndexingHeader : true);
        ASSERT(sizeof(EncodedJSValue) == sizeof(IndexingHeader));
        return (preCapacity + propertyCapacity) * sizeof(EncodedJSValue) + (hasIndexingHeader ? sizeof(IndexingHeader) : 0) + indexingPayloadSizeInBytes;
    }

    static Butterfly* fromBase(void* base, size_t preCapacity, size_t propertyCapacity)
    {
        return reinterpret_cast<Butterfly*>(static_cast<EncodedJSValue*>(base) + preCapacity + propertyCapacity + 1);
    }
    
    ALWAYS_INLINE static unsigned availableContiguousVectorLength(size_t propertyCapacity, unsigned vectorLength);
    static unsigned availableContiguousVectorLength(Structure*, unsigned vectorLength);
    
    ALWAYS_INLINE static unsigned optimalContiguousVectorLength(size_t propertyCapacity, unsigned vectorLength);
    static unsigned optimalContiguousVectorLength(Structure*, unsigned vectorLength);
    
    // This method is here not just because it's handy, but to remind you that
    // the whole point of butterflies is to do evil pointer arithmetic.
    static Butterfly* fromPointer(char* ptr)
    {
        return reinterpret_cast<Butterfly*>(ptr);
    }
    
    char* pointer() { return reinterpret_cast<char*>(this); }
    
    static constexpr ptrdiff_t offsetOfIndexingHeader() { return IndexingHeader::offsetOfIndexingHeader(); }
    static constexpr ptrdiff_t offsetOfArrayBuffer() { return offsetOfIndexingHeader() + IndexingHeader::offsetOfArrayBuffer(); }
    static constexpr ptrdiff_t offsetOfPublicLength() { return offsetOfIndexingHeader() + IndexingHeader::offsetOfPublicLength(); }
    static constexpr ptrdiff_t offsetOfVectorLength() { return offsetOfIndexingHeader() + IndexingHeader::offsetOfVectorLength(); }

    static Butterfly* tryCreateUninitialized(VM&, JSObject* intendedOwner, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, size_t indexingPayloadSizeInBytes, GCDeferralContext* = nullptr);
    static Butterfly* createUninitialized(VM&, JSObject* intendedOwner, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, size_t indexingPayloadSizeInBytes);

    static Butterfly* tryCreate(VM& vm, JSObject*, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, const IndexingHeader& indexingHeader, size_t indexingPayloadSizeInBytes);
    static Butterfly* create(VM&, JSObject* intendedOwner, size_t preCapacity, size_t propertyCapacity, bool hasIndexingHeader, const IndexingHeader&, size_t indexingPayloadSizeInBytes);
    static Butterfly* create(VM&, JSObject* intendedOwner, Structure*);
    
    IndexingHeader* indexingHeader() { return IndexingHeader::from(this); }
    const IndexingHeader* indexingHeader() const { return IndexingHeader::from(this); }
    PropertyStorage propertyStorage() { return indexingHeader()->propertyStorage(); }
    ConstPropertyStorage propertyStorage() const { return indexingHeader()->propertyStorage(); }
    
    uint32_t publicLength() const { return indexingHeader()->publicLength(); }
    uint32_t vectorLength() const { return indexingHeader()->vectorLength(); }
    void setPublicLength(uint32_t value) { indexingHeader()->setPublicLength(value); }
    void setVectorLength(uint32_t value) { indexingHeader()->setVectorLength(value); }

    template<typename T>
    T* indexingPayload() { return reinterpret_cast_ptr<T*>(this); }
    ArrayStorage* arrayStorage() { return indexingPayload<ArrayStorage>(); }
    ContiguousJSValues contiguousInt32() { return ContiguousJSValues(indexingPayload<WriteBarrier<Unknown>>(), vectorLength()); }
    ContiguousDoubles contiguousDouble() { return ContiguousDoubles(indexingPayload<double>(), vectorLength()); }
    ContiguousJSValues contiguous() { return ContiguousJSValues(indexingPayload<WriteBarrier<Unknown>>(), vectorLength()); }

    template<typename T>
    const T* indexingPayload() const { return reinterpret_cast_ptr<const T*>(this); }
    const ArrayStorage* arrayStorage() const { return indexingPayload<ArrayStorage>(); }
    ConstContiguousJSValues contiguousInt32() const { return ConstContiguousJSValues(indexingPayload<WriteBarrier<Unknown>>(), vectorLength()); }
    ConstContiguousDoubles contiguousDouble() const { return ConstContiguousDoubles(indexingPayload<double>(), vectorLength()); }
    ConstContiguousJSValues contiguous() const { return ConstContiguousJSValues(indexingPayload<WriteBarrier<Unknown>>(), vectorLength()); }
    
    static Butterfly* fromContiguous(WriteBarrier<Unknown>* contiguous)
    {
        return reinterpret_cast<Butterfly*>(contiguous);
    }
    static Butterfly* fromContiguous(double* contiguous)
    {
        return reinterpret_cast<Butterfly*>(contiguous);
    }
    
    static constexpr ptrdiff_t offsetOfPropertyStorage() { return -static_cast<ptrdiff_t>(sizeof(IndexingHeader)); }
    constexpr static int indexOfPropertyStorage()
    {
        ASSERT(sizeof(IndexingHeader) == sizeof(EncodedJSValue));
        return -1;
    }

    void* base(size_t preCapacity, size_t propertyCapacity) { return propertyStorage() - propertyCapacity - preCapacity; }
    void* base(Structure*);

    static Butterfly* createOrGrowArrayRight(
        Butterfly*, VM&, JSObject* intendedOwner, Structure* oldStructure,
        size_t propertyCapacity, bool hadIndexingHeader,
        size_t oldIndexingPayloadSizeInBytes, size_t newIndexingPayloadSizeInBytes); 

    // The butterfly reallocation methods perform the reallocation itself but do not change any
    // of the meta-data to reflect that the reallocation occurred. Note that this set of
    // methods is not exhaustive and is not intended to encapsulate all possible allocation
    // modes of butterflies - there are code paths that allocate butterflies by calling
    // directly into Heap::tryAllocateStorage.
    static Butterfly* createOrGrowPropertyStorage(Butterfly*, VM&, JSObject* intendedOwner, Structure*, size_t oldPropertyCapacity, size_t newPropertyCapacity);
    Butterfly* growArrayRight(VM&, JSObject* intendedOwner, Structure* oldStructure, size_t propertyCapacity, bool hadIndexingHeader, size_t oldIndexingPayloadSizeInBytes, size_t newIndexingPayloadSizeInBytes); // Assumes that preCapacity is zero, and asserts as much.
    Butterfly* growArrayRight(VM&, JSObject* intendedOwner, Structure*, size_t newIndexingPayloadSizeInBytes);

    Butterfly* reallocArrayRightIfPossible(VM&, GCDeferralContext&, JSObject* intendedOwner, Structure* oldStructure, size_t propertyCapacity, bool hadIndexingHeader, size_t oldIndexingPayloadSizeInBytes, size_t newIndexingPayloadSizeInBytes); // Assumes that preCapacity is zero, and asserts as much.

    Butterfly* resizeArray(VM&, JSObject* intendedOwner, size_t propertyCapacity, bool oldHasIndexingHeader, size_t oldIndexingPayloadSizeInBytes, size_t newPreCapacity, bool newHasIndexingHeader, size_t newIndexingPayloadSizeInBytes);
    Butterfly* resizeArray(VM&, JSObject* intendedOwner, Structure*, size_t newPreCapacity, size_t newIndexingPayloadSizeInBytes); // Assumes that you're not changing whether or not the object has an indexing header.
    Butterfly* unshift(Structure*, size_t numberOfSlots);
    Butterfly* shift(Structure*, size_t numberOfSlots);
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
