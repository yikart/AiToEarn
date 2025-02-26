/*
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
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
    
#if ENABLE(EXCEPTION_SCOPE_VERIFICATION)
    
// If a function can clear JS exceptions, it should declare a CatchScope at the
// top of the function (as early as possible) using the DECLARE_CATCH_SCOPE macro.
// Declaring a CatchScope in a function means that the function intends to clear
// pending exceptions before returning to its caller.

class CatchScope : public ExceptionScope {
public:
    JS_EXPORT_PRIVATE CatchScope(VM&, ExceptionEventLocation);
    CatchScope(const CatchScope&) = delete;
    CatchScope(CatchScope&&) = default;

    JS_EXPORT_PRIVATE ~CatchScope();

    void clearException();
    bool clearExceptionExceptTermination();
};

#define DECLARE_CATCH_SCOPE(vm__) \
    JSC::CatchScope((vm__), JSC::ExceptionEventLocation(EXCEPTION_SCOPE_POSITION_FOR_ASAN(vm__), __FUNCTION__, __FILE__, __LINE__))

#else // not ENABLE(EXCEPTION_SCOPE_VERIFICATION)

class CatchScope : public ExceptionScope {
public:
    ALWAYS_INLINE CatchScope(VM& vm)
        : ExceptionScope(vm)
    { }
    CatchScope(const CatchScope&) = delete;
    CatchScope(CatchScope&&) = default;

    ALWAYS_INLINE void clearException();
    ALWAYS_INLINE bool clearExceptionExceptTermination();
};

#define DECLARE_CATCH_SCOPE(vm__) \
    JSC::CatchScope((vm__))

#endif // ENABLE(EXCEPTION_SCOPE_VERIFICATION)

ALWAYS_INLINE void CatchScope::clearException()
{
    m_vm.clearException();
}

ALWAYS_INLINE bool CatchScope::clearExceptionExceptTermination()
{
    if (UNLIKELY(m_vm.hasPendingTerminationException())) {
#if ENABLE(EXCEPTION_SCOPE_VERIFICATION)
        m_vm.exception();
#endif
        return false;
    }
    m_vm.clearException();
    return true;
}

#define CLEAR_AND_RETURN_IF_EXCEPTION(scope__, value__) do { \
        if (UNLIKELY((scope__).exception())) { \
            (scope__).clearException(); \
            return value__; \
        } \
    } while (false)

} // namespace JSC
