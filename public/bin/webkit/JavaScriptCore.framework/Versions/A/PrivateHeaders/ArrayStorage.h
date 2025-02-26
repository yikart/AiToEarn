/*
 * Copyright (C) 2012-2019 Apple Inc. All rights reserved.
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

#include "ArrayConventions.h"
#include "Butterfly.h"
#include "IndexingHeader.h"
#include "MarkedSpace.h"
#include "SparseArrayValueMap.h"
#include "Structure.h"
#include "WriteBarrier.h"
#include <wtf/Noncopyable.h>

namespace JSC {

// This struct holds the actual data values of an array. A JSArray object points to its contained ArrayStorage
// struct by pointing to m_vector. To access the contained ArrayStorage struct, use the getStorage() and 
// setStorage() methods. It is important to note that there may be space before the ArrayStorage that 
// is used to quick unshift / shift operation. The actual allocated pointer is available by using:
//     getStorage() - m_indexBias * sizeof(JSValue)
// All slots in ArrayStorage (slots from 0 to vectorLength) are expected to be initialized to a JSValue or,
// for hole slots, JSValue().
struct ArrayStorage {
    WTF_MAKE_NONCOPYABLE(ArrayStorage);
private:
    ArrayStorage() { } // Not directly instantiable. Can only be created as part of a Butterfly.
public:
    
    static ArrayStorage* from(Butterfly* butterfly) { return reinterpret_cast_ptr<ArrayStorage*>(butterfly); }
    static ArrayStorage* from(IndexingHeader* indexingHeader) { return indexingHeader->arrayStorage(); }
    
    Butterfly* butterfly() { return reinterpret_cast<Butterfly*>(this); }
    IndexingHeader* indexingHeader() { return IndexingHeader::from(this); }
    const IndexingHeader* indexingHeader() const { return IndexingHeader::from(this); }
    
    // We steal two fields from the indexing header: vectorLength and length.
    unsigned length() const { return indexingHeader()->publicLength(); }
    void setLength(unsigned length) { indexingHeader()->setPublicLength(length); }
    unsigned vectorLength() const { return indexingHeader()->vectorLength(); }
    void setVectorLength(unsigned length) { indexingHeader()->setVectorLength(length); }
    
    ALWAYS_INLINE void copyHeaderFromDuringGC(const ArrayStorage& other)
    {
        m_sparseMap.copyFrom(other.m_sparseMap);
        m_indexBias = other.m_indexBias;
        m_numValuesInVector = other.m_numValuesInVector;
    }
    
    bool hasHoles() const
    {
        return m_numValuesInVector != length();
    }   

    bool inSparseMode()
    {
        return m_sparseMap && m_sparseMap->sparseMode();
    }

    ContiguousJSValues vector() { return ContiguousJSValues(m_vector, vectorLength()); }

    static constexpr ptrdiff_t lengthOffset() { return Butterfly::offsetOfPublicLength(); }
    static constexpr ptrdiff_t vectorLengthOffset() { return Butterfly::offsetOfVectorLength(); }
    static constexpr ptrdiff_t numValuesInVectorOffset() { return OBJECT_OFFSETOF(ArrayStorage, m_numValuesInVector); }
    static constexpr ptrdiff_t vectorOffset() { return OBJECT_OFFSETOF(ArrayStorage, m_vector); }
    static constexpr ptrdiff_t indexBiasOffset() { return OBJECT_OFFSETOF(ArrayStorage, m_indexBias); }
    static constexpr ptrdiff_t sparseMapOffset() { return OBJECT_OFFSETOF(ArrayStorage, m_sparseMap); }

    static size_t sizeFor(unsigned vectorLength)
    {
        return ArrayStorage::vectorOffset() + vectorLength * sizeof(WriteBarrier<Unknown>);
    }

    static size_t totalSizeFor(unsigned indexBias, size_t propertyCapacity, unsigned vectorLength)
    {
        return Butterfly::totalSize(indexBias, propertyCapacity, true, sizeFor(vectorLength));
    }

    size_t totalSize(size_t propertyCapacity) const
    {
        return totalSizeFor(m_indexBias, propertyCapacity, vectorLength());
    }

    inline size_t totalSize(Structure*) const;

    static unsigned availableVectorLength(unsigned indexBias, size_t propertyCapacity, unsigned vectorLength)
    {
        size_t cellSize = MarkedSpace::optimalSizeFor(totalSizeFor(indexBias, propertyCapacity, vectorLength));

        vectorLength = (cellSize - totalSizeFor(indexBias, propertyCapacity, 0)) / sizeof(WriteBarrier<Unknown>);

        return vectorLength;
    }

    inline static unsigned availableVectorLength(unsigned indexBias, Structure*, unsigned vectorLength);

    inline unsigned availableVectorLength(size_t propertyCapacity, unsigned vectorLength);

    inline unsigned availableVectorLength(Structure*, unsigned vectorLength);

    inline static unsigned optimalVectorLength(unsigned indexBias, size_t propertyCapacity, unsigned vectorLength);

    inline static unsigned optimalVectorLength(unsigned indexBias, Structure*, unsigned vectorLength);

    inline unsigned optimalVectorLength(size_t propertyCapacity, unsigned vectorLength);

    inline unsigned optimalVectorLength(Structure*, unsigned vectorLength);

    WriteBarrier<SparseArrayValueMap> m_sparseMap;
    unsigned m_indexBias;
    unsigned m_numValuesInVector;
#if USE(JSVALUE32_64)
    uintptr_t m_padding;
#endif
    WriteBarrier<Unknown> m_vector[1];
};

} // namespace JSC
