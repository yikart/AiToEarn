/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "ExceptionScope.h"

namespace JSC {

class CallFrame;
class JSObject;

#if ENABLE(EXCEPTION_SCOPE_VERIFICATION)

// If a function can throw a JS exception, it should declare a ThrowScope at the
// top of the function (as early as possible) using the DECLARE_THROW_SCOPE macro.
// Declaring a ThrowScope in a function means that the function may throw an
// exception that its caller will have to handle.

class ThrowScope : public ExceptionScope {
public:
    JS_EXPORT_PRIVATE ThrowScope(VM&, ExceptionEventLocation);
    JS_EXPORT_PRIVATE ~ThrowScope();

    ThrowScope(const ThrowScope&) = delete;
    ThrowScope(ThrowScope&&) = default;

    JS_EXPORT_PRIVATE Exception* throwException(JSGlobalObject*, Exception*);
    JS_EXPORT_PRIVATE Exception* throwException(JSGlobalObject*, JSValue);

    void release() { m_isReleased = true; }

    void clearException() { m_vm.clearException(); }

private:
    void simulateThrow();

    bool m_isReleased { false };
};

#define DECLARE_THROW_SCOPE(vm__) \
    JSC::ThrowScope((vm__), JSC::ExceptionEventLocation(EXCEPTION_SCOPE_POSITION_FOR_ASAN(vm__), __FUNCTION__, __FILE__, __LINE__))

#else // not ENABLE(EXCEPTION_SCOPE_VERIFICATION)

class ThrowScope : public ExceptionScope {
public:
    ALWAYS_INLINE ThrowScope(VM& vm)
        : ExceptionScope(vm)
    { }
    ThrowScope(const ThrowScope&) = delete;
    ThrowScope(ThrowScope&&) = default;

    ALWAYS_INLINE Exception* throwException(JSGlobalObject* globalObject, Exception* exception) { return m_vm.throwException(globalObject, exception); }
    ALWAYS_INLINE Exception* throwException(JSGlobalObject* globalObject, JSValue value) { return m_vm.throwException(globalObject, value); }

    ALWAYS_INLINE void release() { }

    ALWAYS_INLINE void clearException() { m_vm.clearException(); }
};

#define DECLARE_THROW_SCOPE(vm__) \
    JSC::ThrowScope((vm__))

#endif // ENABLE(EXCEPTION_SCOPE_VERIFICATION)

ALWAYS_INLINE Exception* throwException(JSGlobalObject* globalObject, ThrowScope& scope, Exception* exception)
{
    return scope.throwException(globalObject, exception);
}

ALWAYS_INLINE Exception* throwException(JSGlobalObject* globalObject, ThrowScope& scope, JSValue value)
{
    return scope.throwException(globalObject, value);
}

ALWAYS_INLINE EncodedJSValue throwVMException(JSGlobalObject* globalObject, ThrowScope& scope, Exception* exception)
{
    throwException(globalObject, scope, exception);
    return encodedJSValue();
}

ALWAYS_INLINE EncodedJSValue throwVMException(JSGlobalObject* globalObject, ThrowScope& scope, JSValue value)
{
    throwException(globalObject, scope, value);
    return encodedJSValue();
}

} // namespace JSC
