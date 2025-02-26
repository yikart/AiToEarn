/*
 * Copyright (C) 2017-2021 Apple Inc. All rights reserved.
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

#include "DeferGC.h"
#include "DisallowVMEntry.h"
#include "VM.h"

namespace JSC {

class VM;
class JSObject;

#if ASSERT_ENABLED

class ObjectInitializationScope {
public:
    JS_EXPORT_PRIVATE ObjectInitializationScope(VM&);
    JS_EXPORT_PRIVATE ~ObjectInitializationScope();

    VM& vm() const { return m_vm; }
    void notifyAllocated(JSObject*);
    void notifyInitialized(JSObject*);

private:
    void verifyPropertiesAreInitialized(JSObject*);

    VM& m_vm;
    std::optional<DisallowGC> m_disallowGC;
    std::optional<DisallowVMEntry> m_disallowVMEntry;
    JSObject* m_object { nullptr };
};

#else // not ASSERT_ENABLED

class ObjectInitializationScope {
public:
    ALWAYS_INLINE ObjectInitializationScope(VM& vm)
        : m_vm(vm)
    { }
    ALWAYS_INLINE ~ObjectInitializationScope()
    {
        m_vm.mutatorFence();
    }

    ALWAYS_INLINE VM& vm() const { return m_vm; }
    ALWAYS_INLINE void notifyAllocated(JSObject*) { }
    ALWAYS_INLINE void notifyInitialized(JSObject*) { }

private:
    VM& m_vm;
};

#endif // ASSERT_ENABLED

} // namespace JSC
