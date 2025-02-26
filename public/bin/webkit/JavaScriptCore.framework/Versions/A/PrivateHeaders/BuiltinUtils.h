/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
 * Copyright (C) 2015 Canon Inc. All rights reserved.
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

#include "ConstructAbility.h"
#include "ConstructorKind.h"
#include "ImplementationVisibility.h"
#include "InlineAttribute.h"

namespace JSC {

#define INITIALIZE_BUILTIN_NAMES(name) , m_##name(JSC::Identifier::fromString(vm, #name ""_s)), m_##name##PrivateName(JSC::Identifier::fromUid(JSC::PrivateName(JSC::PrivateName::PrivateSymbol, #name ""_s)))
#define DECLARE_BUILTIN_NAMES(name) const JSC::Identifier m_##name; const JSC::Identifier m_##name##PrivateName;
#define DECLARE_BUILTIN_IDENTIFIER_ACCESSOR(name) \
    const JSC::Identifier& name##PublicName() const { return m_##name; } \
    const JSC::Identifier& name##PrivateName() const { return m_##name##PrivateName; }

class Identifier;
class SourceCode;
class UnlinkedFunctionExecutable;
class VM;

JS_EXPORT_PRIVATE UnlinkedFunctionExecutable* createBuiltinExecutable(VM&, const SourceCode&, const Identifier&, ImplementationVisibility, ConstructorKind, ConstructAbility, InlineAttribute);
    
} // namespace JSC
