/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#include "CacheableIdentifier.h"
#include "StructureID.h"
#include "VM.h"
#include <wtf/FixedVector.h>
#include <wtf/Vector.h>

namespace JSC {

class JSCell;
class JSGlobalObject;
class JSObject;
class PropertySlot;
class Structure;

class PolyProtoAccessChain final : public ThreadSafeRefCounted<PolyProtoAccessChain> {
public:
    // Returns nullptr when invalid.
    static RefPtr<PolyProtoAccessChain> tryCreate(JSGlobalObject*, JSCell* base, CacheableIdentifier, const PropertySlot&);
    static RefPtr<PolyProtoAccessChain> tryCreate(JSGlobalObject*, JSCell* base, CacheableIdentifier, JSObject* target);

    const FixedVector<StructureID>& chain() const { return m_chain; }

    void dump(Structure* baseStructure, PrintStream& out) const;

    bool operator==(const PolyProtoAccessChain&) const;

    bool needImpurePropertyWatchpoint(VM&) const;

    template <typename Func>
    void forEach(VM&, Structure* baseStructure, const Func& func) const
    {
        bool atEnd = !m_chain.size();
        func(baseStructure, atEnd);
        for (unsigned i = 0; i < m_chain.size(); ++i) {
            atEnd = i + 1 == m_chain.size();
            func(m_chain[i].decode(), atEnd);
        }
    }

    Structure* slotBaseStructure(VM&, Structure* baseStructure) const
    {
        if (m_chain.size())
            return m_chain.last().decode();
        return baseStructure;
    }

private:
    explicit PolyProtoAccessChain(Vector<StructureID>&& chain)
        : m_chain(WTFMove(chain))
    {
    }

    // This does not include the base. We rely on AccessCase providing it for us. That said, this data
    // structure is tied to the base that it was created with.
    FixedVector<StructureID> m_chain;
};

}
