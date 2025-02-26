/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#include "ExecutableInfo.h"
#include "JSCBuiltins.h"
#include "ParserModes.h"
#include "SourceCode.h"
#include "Weak.h"
#include "WeakHandleOwner.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

class UnlinkedFunctionExecutable;
class Identifier;
class VM;

#define BUILTIN_NAME_ONLY(name, functionName, overriddenName, length) name,
enum class BuiltinCodeIndex {
    JSC_FOREACH_BUILTIN_CODE(BUILTIN_NAME_ONLY)
    NumberOfBuiltinCodes
};
#undef BUILTIN_NAME_ONLY

class BuiltinExecutables {
    WTF_MAKE_TZONE_ALLOCATED(BuiltinExecutables);
public:
    explicit BuiltinExecutables(VM&);

#define EXPOSE_BUILTIN_EXECUTABLES(name, functionName, overriddenName, length) \
UnlinkedFunctionExecutable* name##Executable(); \
SourceCode name##Source();
    
    JSC_FOREACH_BUILTIN_CODE(EXPOSE_BUILTIN_EXECUTABLES)
#undef EXPOSE_BUILTIN_EXECUTABLES

    static SourceCode defaultConstructorSourceCode(ConstructorKind);
    UnlinkedFunctionExecutable* createDefaultConstructor(ConstructorKind, const Identifier& name, NeedsClassFieldInitializer, PrivateBrandRequirement);

    static UnlinkedFunctionExecutable* createExecutable(VM&, const SourceCode&, const Identifier&, ImplementationVisibility, ConstructorKind, ConstructAbility, InlineAttribute, NeedsClassFieldInitializer, PrivateBrandRequirement = PrivateBrandRequirement::None);

    DECLARE_VISIT_AGGREGATE;

    void clear();

private:
    VM& m_vm;

    UnlinkedFunctionExecutable* createBuiltinExecutable(const SourceCode&, const Identifier&, ImplementationVisibility, ConstructorKind, ConstructAbility, InlineAttribute);

    Ref<StringSourceProvider> m_combinedSourceProvider;
    UnlinkedFunctionExecutable* m_unlinkedExecutables[static_cast<unsigned>(BuiltinCodeIndex::NumberOfBuiltinCodes)] { };
};

}
