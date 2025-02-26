/*
 * Copyright (C) 2008-2018 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CallData.h"

namespace JSC {

class JSObject;

// Convenience wrapper so you don't need to deal with CallData unless you are going to use it.
JS_EXPORT_PRIVATE JSObject* construct(JSGlobalObject*, JSValue functionObject, const ArgList&, ASCIILiteral errorMessage);
JS_EXPORT_PRIVATE JSObject* construct(JSGlobalObject*, JSValue functionObject, JSValue newTarget, const ArgList&, ASCIILiteral errorMessage);

JS_EXPORT_PRIVATE JSObject* construct(JSGlobalObject*, JSValue constructor, const CallData&, const ArgList&, JSValue newTarget);

ALWAYS_INLINE JSObject* construct(JSGlobalObject* globalObject, JSValue constructorObject, const CallData& callData, const ArgList& args)
{
    return construct(globalObject, constructorObject, callData, args, constructorObject);
}

JS_EXPORT_PRIVATE JSObject* profiledConstruct(JSGlobalObject*, ProfilingReason, JSValue constructor, const CallData&, const ArgList&, JSValue newTarget);

ALWAYS_INLINE JSObject* profiledConstruct(JSGlobalObject* globalObject, ProfilingReason reason, JSValue constructorObject, const CallData& callData, const ArgList& args)
{
    return profiledConstruct(globalObject, reason, constructorObject, callData, args, constructorObject);
}

} // namespace JSC
