/*
 * Copyright (C) 2008-2022 Apple Inc. All rights reserved.
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

#include "NativeFunction.h"
#include <wtf/Forward.h>
#include <wtf/NakedPtr.h>

namespace JSC {

class ArgList;
class Exception;
class FunctionExecutable;
class JSScope;

struct CallData {
    enum class Type : uint8_t { None, Native, JS };
    Type type { Type::None };

    CallData() { } // Needed for the anonymous union below.
    union {
        struct {
            TaggedNativeFunction function;
            bool isBoundFunction;
            bool isWasm;
        } native;
        struct {
            FunctionExecutable* functionExecutable;
            JSScope* scope;
        } js;
    };
};

enum class ProfilingReason : uint8_t {
    API,
    Microtask,
    Other
};

// Convenience wrapper so you don't need to deal with CallData unless you are going to use it.
JS_EXPORT_PRIVATE JSValue call(JSGlobalObject*, JSValue functionObject, const ArgList&, ASCIILiteral errorMessage);
JS_EXPORT_PRIVATE JSValue call(JSGlobalObject*, JSValue functionObject, JSValue thisValue, const ArgList&, ASCIILiteral errorMessage);

JS_EXPORT_PRIVATE JSValue call(JSGlobalObject*, JSValue functionObject, const CallData&, JSValue thisValue, const ArgList&);
JS_EXPORT_PRIVATE JSValue call(JSGlobalObject*, JSValue functionObject, const CallData&, JSValue thisValue, const ArgList&, NakedPtr<Exception>& returnedException);

JS_EXPORT_PRIVATE JSValue profiledCall(JSGlobalObject*, ProfilingReason, JSValue functionObject, const CallData&, JSValue thisValue, const ArgList&);
JS_EXPORT_PRIVATE JSValue profiledCall(JSGlobalObject*, ProfilingReason, JSValue functionObject, const CallData&, JSValue thisValue, const ArgList&, NakedPtr<Exception>& returnedException);

} // namespace JSC
