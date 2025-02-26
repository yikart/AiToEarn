/*
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "IsoSubspace.h"
#include <wtf/Function.h>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>

namespace JSC {

class Heap;
class VM;

// This is an appropriate way to stash IsoSubspaces for rarely-used classes or classes that are mostly
// sure to be main-thread-only. But if a class typically gets instantiated from multiple threads at
// once, then this is not great, because concurrent allocations will probably contend on this thing's
// lock.
//
// Usage: A IsoSubspacePerVM instance is instantiated using NeverDestroyed i.e. each IsoSubspacePerVM
// instance is immortal for the life of the process. There is one IsoSubspace type per IsoSubspacePerVM.
// IsoSubspacePerVM itself is a factory for those IsoSubspaces per VM and per Heap. IsoSubspacePerVM
// also serves as the manager of the IsoSubspaces. Client VMs are responsible for calling
// releaseClientIsoSubspace() to release the IsoSubspace when the VM shuts down. Similarly, if the
// Heap is not an immortal singleton heap (when global GC is enabled), the per Heap IsoSubspace also
// needs to be released when the Heap is destructed.
class IsoSubspacePerVM final {
public:
    struct SubspaceParameters {
        SubspaceParameters() { }
        
        SubspaceParameters(CString name, const HeapCellType& heapCellType, size_t size)
            : name(WTFMove(name))
            , heapCellType(&heapCellType)
            , size(size)
        {
        }
        
        CString name;
        const HeapCellType* heapCellType { nullptr };
        size_t size { 0 };
    };
    
    JS_EXPORT_PRIVATE IsoSubspacePerVM(Function<SubspaceParameters(Heap&)>);
    JS_EXPORT_PRIVATE ~IsoSubspacePerVM();
    
    JS_EXPORT_PRIVATE GCClient::IsoSubspace& clientIsoSubspaceforVM(VM&);

    // FIXME: GlobalGC: this is only needed until we have a immortal singleton heap with GlobalGC.
    void releaseIsoSubspace(Heap&);

    void releaseClientIsoSubspace(VM&);

private:
    IsoSubspace& isoSubspaceforHeap(Locker<Lock>&, Heap&);

    Lock m_lock;

    UncheckedKeyHashMap<Heap*, IsoSubspace*> m_subspacePerHeap;
    UncheckedKeyHashMap<VM*, GCClient::IsoSubspace*> m_clientSubspacePerVM WTF_GUARDED_BY_LOCK(m_lock);
    Function<SubspaceParameters(Heap&)> m_subspaceParameters;
};

#define ISO_SUBSPACE_PARAMETERS(heapCellType, type) ::JSC::IsoSubspacePerVM::SubspaceParameters("IsoSpace " #type, (heapCellType), sizeof(type))

} // namespace JSC

