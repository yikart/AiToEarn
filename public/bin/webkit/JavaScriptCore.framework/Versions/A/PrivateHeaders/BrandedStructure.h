/*
 * Copyright (C) 2021-2022 Apple Inc. All rights reserved.
 * Copyright (C) 2021 Igalia S.A. All rights reserved.
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

#include "Structure.h"
#include "Symbol.h"
#include "Watchpoint.h"
#include "WriteBarrierInlines.h"

namespace WTF {

class UniquedStringImpl;

} // namespace WTF

namespace JSC {

class BrandedStructure final : public Structure {
    typedef Structure Base;

public:

    template<typename CellType, SubspaceAccess>
    static GCClient::IsoSubspace* subspaceFor(VM& vm)
    {
        return &vm.brandedStructureSpace();
    }

    ALWAYS_INLINE bool checkBrand(Symbol* brand)
    {
        UniquedStringImpl* brandUid = &brand->uid();
        for (BrandedStructure* currentStructure = this; currentStructure; currentStructure = jsCast<BrandedStructure*>(currentStructure->m_parentBrand.get())) {
            if (brandUid == currentStructure->m_brand)
                return true;
        }
        return false;
    }

    template<typename Visitor>
    static void visitAdditionalChildren(JSCell* cell, Visitor& visitor)
    {
        BrandedStructure* thisObject = jsCast<BrandedStructure*>(cell);
        visitor.append(thisObject->m_parentBrand);
    }

private:
    BrandedStructure(VM&, Structure*, UniquedStringImpl* brand);
    BrandedStructure(VM&, BrandedStructure*);

    static Structure* create(VM&, Structure*, UniquedStringImpl* brand, DeferredStructureTransitionWatchpointFire* = nullptr);

    void destruct()
    {
        m_brand = nullptr;
    }

    CompactRefPtr<UniquedStringImpl> m_brand;
    WriteBarrierStructureID m_parentBrand;

    friend class Structure;
};

} // namespace JSC
