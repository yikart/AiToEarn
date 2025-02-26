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

#include <wtf/DeferrableRefCounted.h>
#include <wtf/Forward.h>

namespace JSC {

class JSCell;

// A C-heap-allocated object that may have additional reference counts
// due to incoming references from the heap, which are tracked in
// reverse: the object knows its incoming references. Such objects also
// have the invariant that they don't have references back into the GC
// heap.

template<typename T>
class GCIncomingRefCounted : public DeferrableRefCounted<T> {
public:
    GCIncomingRefCounted()
        : m_encodedPointer(0)
    {
    }
    
    ~GCIncomingRefCounted()
    {
        if (hasVectorOfCells())
            delete vectorOfCells();
    }
    
    size_t numberOfIncomingReferences() const
    {
        if (!hasAnyIncoming())
            return 0;
        if (hasSingleton())
            return 1;
        return vectorOfCells()->size();
    }
    
    JSCell* incomingReferenceAt(size_t index) const
    {
        ASSERT(hasAnyIncoming());
        if (hasSingleton()) {
            ASSERT(!index);
            return singleton();
        }
        return vectorOfCells()->at(index);
    }
    
    // It's generally not a good idea to call this directly, since if this
    // returns true, you're supposed to add this object to the GC's list.
    // Call GCIncomingRefCountedSet::addReference() instead.
    bool addIncomingReference(JSCell*);
    
    // A filter function returns true if we wish to keep the incoming
    // reference, and false if we don't. This may delete the object,
    // and if it does so, this returns true. In general, you don't want
    // to use this with a filter function that can return false unless
    // you're also walking the GC's list.
    template<typename FilterFunctionType>
    bool filterIncomingReferences(FilterFunctionType&&);
    
private:
    static uintptr_t singletonFlag() { return 1; }
    
    bool hasVectorOfCells() const { return !(m_encodedPointer & singletonFlag()); }
    bool hasAnyIncoming() const { return !!m_encodedPointer; }
    bool hasSingleton() const { return hasAnyIncoming() && !hasVectorOfCells(); }
    
    JSCell* singleton() const
    {
        ASSERT(hasSingleton());
        return std::bit_cast<JSCell*>(m_encodedPointer & ~singletonFlag());
    }
    
    Vector<JSCell*>* vectorOfCells() const
    {
        ASSERT(hasVectorOfCells());
        return std::bit_cast<Vector<JSCell*>*>(m_encodedPointer);
    }
    
    // Singleton flag is set: this is a JSCell*.
    // Singleton flag not set: this is a pointer to a vector of cells.
    uintptr_t m_encodedPointer;
};

} // namespace JSC
