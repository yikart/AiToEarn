/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

#include "PrototypeKey.h"
#include "WeakGCMap.h"
#include <wtf/Lock.h>

namespace JSC {

class FunctionExecutable;
class JSGlobalObject;
class JSObject;
class Structure;
class TypeInfo;
class VM;

typedef uint8_t IndexingType;

// Tracks the canonical structure an object should be allocated with when inheriting from a given prototype.
class StructureCache {
public:
    explicit StructureCache(VM& vm)
        : m_structures(vm)
    {
    }

    JS_EXPORT_PRIVATE void clear();

    JS_EXPORT_PRIVATE Structure* emptyObjectStructureForPrototype(JSGlobalObject*, JSObject*, unsigned inlineCapacity, bool makePolyProtoStructure = false, FunctionExecutable* = nullptr);
    JS_EXPORT_PRIVATE Structure* emptyStructureForPrototypeFromBaseStructure(JSGlobalObject*, JSObject*, Structure*);
    JS_EXPORT_PRIVATE Structure* emptyObjectStructureConcurrently(JSObject* prototype, unsigned inlineCapacity);

    template<typename Func>
    void forEach(Func func)
    {
        Locker locker { m_lock };
        m_structures.forEach(func);
    }

private:
    Structure* createEmptyStructure(JSGlobalObject*, JSObject* prototype, const TypeInfo&, const ClassInfo*, IndexingType, unsigned inlineCapacity, bool makePolyProtoStructure, FunctionExecutable*);

    WeakGCMap<PrototypeKey, Structure> m_structures;
    Lock m_lock;
};

} // namespace JSC
