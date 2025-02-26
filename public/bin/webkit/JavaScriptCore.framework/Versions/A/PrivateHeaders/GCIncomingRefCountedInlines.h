/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "GCIncomingRefCounted.h"
#include "Heap.h"

namespace JSC {

template<typename T>
bool GCIncomingRefCounted<T>::addIncomingReference(JSCell* cell)
{
    if (!hasAnyIncoming()) {
        m_encodedPointer = std::bit_cast<uintptr_t>(cell) | singletonFlag();
        this->setIsDeferred(true);
        ASSERT(hasSingleton());
        return true;
    }
    
    ASSERT(Heap::heap(incomingReferenceAt(0)) == Heap::heap(cell));
    
    if (hasSingleton()) {
        Vector<JSCell*>* vector = new Vector<JSCell*>();
        vector->append(singleton());
        vector->append(cell);
        m_encodedPointer = std::bit_cast<uintptr_t>(vector);
        ASSERT(hasVectorOfCells());
        return false;
    }
    
    vectorOfCells()->append(cell);
    return false;
}

template<typename T>
template<typename FilterFunctionType>
bool GCIncomingRefCounted<T>::filterIncomingReferences(FilterFunctionType&& filterFunction)
{
    constexpr bool verbose = false;
    
    if (verbose)
        dataLog("Filtering incoming references.\n");
    
    if (!hasAnyIncoming()) {
        ASSERT(!this->isDeferred());
        ASSERT(this->refCount());
        if (verbose)
            dataLog("    Has no incoming.\n");
        return false;
    }
    
    ASSERT(this->isDeferred());
    
    if (hasSingleton()) {
        if (filterFunction(singleton())) {
            if (verbose)
                dataLog("   Singleton passed.\n");
            return false;
        }
        
        if (verbose)
            dataLog("   Removing singleton.\n");
        m_encodedPointer = 0;
        ASSERT(!hasAnyIncoming());
        this->setIsDeferred(false);
        return true;
    }
    
    if (verbose)
        dataLog("   Has ", vectorOfCells()->size(), " entries.\n");
    for (size_t i = 0; i < vectorOfCells()->size(); ++i) {
        if (filterFunction(vectorOfCells()->at(i)))
            continue;
        vectorOfCells()->at(i--) = vectorOfCells()->last();
        vectorOfCells()->removeLast();
    }
    
    if (vectorOfCells()->size() >= 2) {
        if (verbose)
            dataLog("   Still has ", vectorOfCells()->size(), " entries.\n");
        return false;
    }
    
    if (vectorOfCells()->isEmpty()) {
        if (verbose)
            dataLog("   Removing.\n");
        delete vectorOfCells();
        m_encodedPointer = 0;
        ASSERT(!hasAnyIncoming());
        this->setIsDeferred(false);
        return true;
    }
    
    if (verbose)
        dataLog("   Shrinking to singleton.\n");
    JSCell* singleton = vectorOfCells()->at(0);
    delete vectorOfCells();
    m_encodedPointer = std::bit_cast<uintptr_t>(singleton) | singletonFlag();
    ASSERT(hasSingleton());
    return false;
}

} // namespace JSC
