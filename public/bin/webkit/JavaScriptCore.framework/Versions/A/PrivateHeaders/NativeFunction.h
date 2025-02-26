/*
 * Copyright (C) 2018-2022 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include "JSCPtrTag.h"
#include <wtf/FunctionPtr.h>
#include <wtf/Hasher.h>

namespace JSC {

class CallFrame;

using NativeFunction = FunctionPtr<CFunctionPtrTag, EncodedJSValue(JSGlobalObject*, CallFrame*), FunctionAttributes::JSCHostCall>;

struct NativeFunctionHash {
    static unsigned hash(NativeFunction key) { return computeHash(key); }
    static bool equal(NativeFunction a, NativeFunction b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

using TaggedNativeFunction = FunctionPtr<HostFunctionPtrTag, EncodedJSValue(JSGlobalObject*, CallFrame*), FunctionAttributes::JSCHostCall>;

struct TaggedNativeFunctionHash {
    static unsigned hash(TaggedNativeFunction key) { return computeHash(key); }
    static bool equal(TaggedNativeFunction a, TaggedNativeFunction b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

static_assert(sizeof(NativeFunction) == sizeof(void*));
static_assert(sizeof(TaggedNativeFunction) == sizeof(void*));

static inline TaggedNativeFunction toTagged(NativeFunction function)
{
    return function.retagged<HostFunctionPtrTag>();
}

} // namespace JSC

namespace WTF {

inline void add(Hasher& hasher, JSC::NativeFunction key)
{
    add(hasher, key.taggedPtr());
}

template<typename> struct DefaultHash;
template<> struct DefaultHash<JSC::NativeFunction> : JSC::NativeFunctionHash { };

inline void add(Hasher& hasher, JSC::TaggedNativeFunction key)
{
    add(hasher, key.taggedPtr());
}

template<typename> struct DefaultHash;
template<> struct DefaultHash<JSC::TaggedNativeFunction> : JSC::TaggedNativeFunctionHash { };

} // namespace WTF
