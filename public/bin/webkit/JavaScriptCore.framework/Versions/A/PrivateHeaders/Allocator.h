/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "AllocationFailureMode.h"
#include <climits>

namespace JSC {

class GCDeferralContext;
class Heap;
class LocalAllocator;

// This abstracts how we refer to LocalAllocator so that we could eventually support thread-local
// caches.

class Allocator {
public:
    Allocator() { }
    
    explicit Allocator(LocalAllocator* localAllocator)
        : m_localAllocator(localAllocator)
    {
    }
    
    void* allocate(Heap&, size_t cellSize, GCDeferralContext*, AllocationFailureMode) const;
    
    unsigned cellSize() const;
    
    LocalAllocator* localAllocator() const { return m_localAllocator; }
    
    friend bool operator==(const Allocator&, const Allocator&) = default;
    explicit operator bool() const { return *this != Allocator(); }
    
private:
    LocalAllocator* m_localAllocator { nullptr };
};

} // namespace JSC

