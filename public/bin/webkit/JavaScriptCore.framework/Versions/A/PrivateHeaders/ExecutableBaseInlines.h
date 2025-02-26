/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "ExecutableBase.h"
#include "FunctionExecutable.h"
#include "ImplementationVisibility.h"
#include "NativeExecutable.h"
#include "ScriptExecutable.h"
#include "StructureInlines.h"

namespace JSC {

inline Structure* ExecutableBase::createStructure(VM& vm, JSGlobalObject* globalObject, JSValue proto)
{
    return Structure::create(vm, globalObject, proto, TypeInfo(CellType, StructureFlags), info());
}

inline Intrinsic ExecutableBase::intrinsic() const
{
    if (isHostFunction())
        return jsCast<const NativeExecutable*>(this)->intrinsic();
    return jsCast<const ScriptExecutable*>(this)->intrinsic();
}

inline Intrinsic ExecutableBase::intrinsicFor(CodeSpecializationKind kind) const
{
    if (isCall(kind))
        return intrinsic();
    return NoIntrinsic;
}

inline ImplementationVisibility ExecutableBase::implementationVisibility() const
{
    if (isFunctionExecutable())
        return jsCast<const FunctionExecutable*>(this)->implementationVisibility();
    if (isHostFunction())
        return jsCast<const NativeExecutable*>(this)->implementationVisibility();
    return ImplementationVisibility::Public;
}

inline InlineAttribute ExecutableBase::inlineAttribute() const
{
    if (isFunctionExecutable())
        return jsCast<const FunctionExecutable*>(this)->inlineAttribute();
    return InlineAttribute::None;
}

inline bool ExecutableBase::hasJITCodeForCall() const
{
    if (isHostFunction())
        return true;
    return jsCast<const ScriptExecutable*>(this)->hasJITCodeForCall();
}

inline bool ExecutableBase::hasJITCodeForConstruct() const
{
    if (isHostFunction())
        return true;
    return jsCast<const ScriptExecutable*>(this)->hasJITCodeForConstruct();
}

} // namespace JSC
