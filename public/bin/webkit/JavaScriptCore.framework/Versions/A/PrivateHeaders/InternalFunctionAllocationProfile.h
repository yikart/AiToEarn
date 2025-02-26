/*
 * Copyright (C) 2016-2021 Apple Inc. All rights reserved.
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

#include "JSGlobalObject.h"
#include "SlotVisitor.h"
#include "WriteBarrier.h"

namespace JSC {

class InternalFunctionAllocationProfile {
public:
    static constexpr ptrdiff_t offsetOfStructureID() { return OBJECT_OFFSETOF(InternalFunctionAllocationProfile, m_structureID); }

    Structure* structure() { return m_structureID.get(); }
    Structure* createAllocationStructureFromBase(VM&, JSGlobalObject*, JSCell* owner, JSObject* prototype, Structure* base, InlineWatchpointSet&);

    void clear() { m_structureID.clear(); }
    template<typename Visitor> void visitAggregate(Visitor& visitor) { visitor.append(m_structureID); }

private:
    WriteBarrierStructureID m_structureID;
};

inline Structure* InternalFunctionAllocationProfile::createAllocationStructureFromBase(VM& vm, JSGlobalObject* baseGlobalObject, JSCell* owner, JSObject* prototype, Structure* baseStructure, InlineWatchpointSet& watchpointSet)
{
    ASSERT(!m_structureID || m_structureID.get()->classInfoForCells() != baseStructure->classInfoForCells() || m_structureID->globalObject() != baseStructure->globalObject());
    ASSERT(baseStructure->hasMonoProto());

    Structure* structure;
    // FIXME: Implement polymorphic prototypes for subclasses of builtin types:
    // https://bugs.webkit.org/show_bug.cgi?id=177318
    if (prototype == baseStructure->storedPrototype())
        structure = baseStructure;
    else
        structure = baseGlobalObject->structureCache().emptyStructureForPrototypeFromBaseStructure(baseGlobalObject, prototype, baseStructure);

    // Ensure that if another thread sees the structure, it will see it properly created.
    WTF::storeStoreFence();

    // It's possible to get here because some JSFunction got passed to two different InternalFunctions. e.g.
    // function Foo() { }
    // Reflect.construct(Promise, [], Foo);
    // Reflect.construct(Int8Array, [], Foo);
    if (UNLIKELY(m_structureID && m_structureID.value() != structure->id()))
        watchpointSet.fireAll(vm, "InternalFunctionAllocationProfile rotated to a new structure");

    m_structureID.set(vm, owner, structure);
    return structure;
}

} // namespace JSC
