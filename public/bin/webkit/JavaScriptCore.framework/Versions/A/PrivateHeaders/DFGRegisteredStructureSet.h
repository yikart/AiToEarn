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

#if ENABLE(DFG_JIT)

#include "ArrayProfile.h"
#include "DFGRegisteredStructure.h"
#include "StructureSet.h"
#include <wtf/TinyPtrSet.h>

namespace JSC {

class TrackedReferences;

namespace DFG {

struct AbstractValue;
class StructureAbstractValue;

class RegisteredStructureSet : public TinyPtrSet<RegisteredStructure> {
public:

    RegisteredStructureSet()
    { }
    
    RegisteredStructureSet(RegisteredStructure structure)
        : TinyPtrSet(structure)
    {
    }
    
    RegisteredStructure onlyStructure() const
    {
        return onlyEntry();
    }

    StructureSet toStructureSet() const
    {
        StructureSet result;
        forEach([&] (RegisteredStructure structure) { result.add(structure.get()); });
        return result;
    }

    void filter(const DFG::StructureAbstractValue&);
    void filter(SpeculatedType);
    void filterArrayModes(ArrayModes);
    void filter(const DFG::AbstractValue&);
    
    SpeculatedType speculationFromStructures() const;
    ArrayModes arrayModesFromStructures() const;

    void validateReferences(const TrackedReferences&) const;
};

} } // namespace JSC::DFG

#endif // ENABLE(DFG_JIT)
