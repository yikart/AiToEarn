/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "ArrayStorage.h"
#include "StructureInlines.h"

namespace JSC {

inline unsigned ArrayStorage::availableVectorLength(unsigned indexBias, Structure* structure, unsigned vectorLength)
{
    return availableVectorLength(indexBias, structure->outOfLineCapacity(), vectorLength);
}

inline unsigned ArrayStorage::availableVectorLength(size_t propertyCapacity, unsigned vectorLength)
{
    return availableVectorLength(m_indexBias, propertyCapacity, vectorLength);
}

inline unsigned ArrayStorage::availableVectorLength(Structure* structure, unsigned vectorLength)
{
    return availableVectorLength(structure->outOfLineCapacity(), vectorLength);
}

inline unsigned ArrayStorage::optimalVectorLength(unsigned indexBias, size_t propertyCapacity, unsigned vectorLength)
{
    vectorLength = std::max(BASE_ARRAY_STORAGE_VECTOR_LEN, vectorLength);
    return availableVectorLength(indexBias, propertyCapacity, vectorLength);
}

inline unsigned ArrayStorage::optimalVectorLength(unsigned indexBias, Structure* structure, unsigned vectorLength)
{
    return optimalVectorLength(indexBias, structure->outOfLineCapacity(), vectorLength);
}

inline unsigned ArrayStorage::optimalVectorLength(size_t propertyCapacity, unsigned vectorLength)
{
    return optimalVectorLength(m_indexBias, propertyCapacity, vectorLength);
}

inline unsigned ArrayStorage::optimalVectorLength(Structure* structure, unsigned vectorLength)
{
    return optimalVectorLength(structure->outOfLineCapacity(), vectorLength);
}

inline size_t ArrayStorage::totalSize(Structure* structure) const
{
    return totalSize(structure->outOfLineCapacity());
}

} // namespace JSC
