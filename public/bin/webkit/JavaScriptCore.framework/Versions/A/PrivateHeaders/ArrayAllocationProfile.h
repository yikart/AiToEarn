/*
 * Copyright (C) 2012, 2013 Apple Inc. All rights reserved.
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
#include "JSArray.h"

namespace JSC {

class ArrayAllocationProfile {
public:
    ArrayAllocationProfile()
    {
        initializeIndexingMode(ArrayWithUndecided);
    }

    ArrayAllocationProfile(IndexingType recommendedIndexingMode)
    {
        initializeIndexingMode(recommendedIndexingMode);
    }

    IndexingType selectIndexingTypeConcurrently()
    {
        return current().indexingType();
    }

    IndexingType selectIndexingType()
    {
        ASSERT(!isCompilationThread());
        JSArray* lastArray = m_storage.pointer();
        if (lastArray && UNLIKELY(lastArray->indexingType() != current().indexingType()))
            updateProfile();
        return current().indexingType();
    }

    // vector length hint becomes [0, BASE_CONTIGUOUS_VECTOR_LEN_MAX].
    unsigned vectorLengthHintConcurrently()
    {
        return current().vectorLength();
    }

    unsigned vectorLengthHint()
    {
        ASSERT(!isCompilationThread());
        JSArray* lastArray = m_storage.pointer();
        unsigned largestSeenVectorLength = current().vectorLength();
        if (lastArray && (largestSeenVectorLength != BASE_CONTIGUOUS_VECTOR_LEN_MAX) && UNLIKELY(lastArray->getVectorLength() > largestSeenVectorLength))
            updateProfile();
        return current().vectorLength();
    }
    
    JSArray* updateLastAllocation(JSArray* lastArray)
    {
        ASSERT(!isCompilationThread());
        m_storage.setPointer(lastArray);
        return lastArray;
    }

    JS_EXPORT_PRIVATE void updateProfile();

    static IndexingType selectIndexingTypeFor(ArrayAllocationProfile* profile)
    {
        if (!profile)
            return ArrayWithUndecided;
        return profile->selectIndexingType();
    }
    
    static JSArray* updateLastAllocationFor(ArrayAllocationProfile* profile, JSArray* lastArray)
    {
        ASSERT(!isCompilationThread());
        if (profile)
            profile->updateLastAllocation(lastArray);
        return lastArray;
    }

    void initializeIndexingMode(IndexingType recommendedIndexingMode)
    {
        m_storage.setType(current().withIndexingType(recommendedIndexingMode));
    }

private:
    struct IndexingTypeAndVectorLength {
        static_assert(sizeof(IndexingType) <= sizeof(uint8_t));
        static_assert(BASE_CONTIGUOUS_VECTOR_LEN_MAX <= UINT8_MAX);

        // The format is: (IndexingType << 8) | VectorLength
        static constexpr uint16_t vectorLengthMask = static_cast<uint8_t>(-1);
        static constexpr uint16_t indexingTypeShift = 8;

    public:
        IndexingTypeAndVectorLength()
            : m_bits(0)
        {
        }

        IndexingTypeAndVectorLength(uint16_t bits)
            : m_bits(bits)
        {
        }

        IndexingTypeAndVectorLength(IndexingType indexingType, unsigned vectorLength)
            : m_bits((indexingType << indexingTypeShift) | vectorLength)
        {
            ASSERT(vectorLength <= BASE_CONTIGUOUS_VECTOR_LEN_MAX);
        }

        operator uint16_t() const { return m_bits; }

        IndexingType indexingType() const { return m_bits >> indexingTypeShift; }
        unsigned vectorLength() const { return m_bits & vectorLengthMask; }

        IndexingTypeAndVectorLength withIndexingType(IndexingType indexingType) WARN_UNUSED_RETURN
        {
            return IndexingTypeAndVectorLength(indexingType, vectorLength());
        }

    private:
        uint16_t m_bits;
    };
    
    IndexingTypeAndVectorLength current() const { return m_storage.type(); }

    using Storage = CompactPointerTuple<JSArray*, uint16_t>;
    Storage m_storage;
};

} // namespace JSC
