/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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

#include "JSCast.h"
#include "ScopeOffset.h"
#include "VM.h"
#include <wtf/Assertions.h>
#include <wtf/CagedUniquePtr.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace JSC {

class WatchpointSet;

// This class's only job is to hold onto the list of ScopeOffsets for each argument that a
// function has. Most of the time, the BytecodeGenerator will create one of these and it will
// never be modified subsequently. There is a rare case where a ScopedArguments object is created
// and aliases one of these and then decides to modify it; in that case we do copy-on-write. This
// makes sense because such modifications are so uncommon. You'd have to do something crazy like
// "delete arguments[i]" or some variant of defineOwnProperty.
class ScopedArgumentsTable final : public JSCell {
    friend class CachedScopedArgumentsTable;

public:
    using Base = JSCell;
    static constexpr unsigned StructureFlags = Base::StructureFlags | StructureIsImmortal;
    static constexpr bool needsDestruction = true;

    template<typename CellType, SubspaceAccess mode>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return vm.scopedArgumentsTableSpace<mode>();
    }
    
private:
    ScopedArgumentsTable(VM&);
    ~ScopedArgumentsTable();

public:
    static ScopedArgumentsTable* create(VM&);
    static ScopedArgumentsTable* tryCreate(VM&, uint32_t length);

    static void destroy(JSCell*);

    uint32_t length() const { return m_length; }
    ScopedArgumentsTable* trySetLength(VM&, uint32_t newLength);
    
    ScopeOffset get(uint32_t i) const { return at(i); }
    WatchpointSet* getWatchpointSet(uint32_t i) const { return m_watchpointSets.at(i); }
    
    void lock()
    {
        m_locked = true;
    }
    
    ScopedArgumentsTable* trySet(VM&, uint32_t index, ScopeOffset);
    void trySetWatchpointSet(uint32_t index, WatchpointSet* watchpoints);
    void clearWatchpointSet(uint32_t index) { m_watchpointSets[index] = nullptr; }

    DECLARE_INFO;
    
    static Structure* createStructure(VM&, JSGlobalObject*, JSValue prototype);

    static constexpr ptrdiff_t offsetOfLength() { return OBJECT_OFFSETOF(ScopedArgumentsTable, m_length); }
    static constexpr ptrdiff_t offsetOfArguments() { return OBJECT_OFFSETOF(ScopedArgumentsTable, m_arguments); }

    typedef CagedUniquePtr<Gigacage::Primitive, ScopeOffset> ArgumentsPtr;

private:
    ScopedArgumentsTable* tryClone(VM&);

    ScopeOffset& at(uint32_t i) const
    {
        ASSERT_WITH_SECURITY_IMPLICATION(i < m_length);
        return m_arguments.get()[i];
    }
    
    uint32_t m_length;
    bool m_locked; // Being locked means that there are multiple references to this object and none of them expect to see the others' modifications. This means that modifications need to make a copy first.
    ArgumentsPtr m_arguments;
    Vector<WatchpointSet*> m_watchpointSets;
};

} // namespace JSC

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
