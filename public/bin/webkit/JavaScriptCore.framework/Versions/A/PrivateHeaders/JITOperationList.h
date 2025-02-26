/*
 * Copyright (C) 2020-2024 Apple Inc. All rights reserved.
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

#include "Options.h"
#include <wtf/HashMap.h>
#include <wtf/NeverDestroyed.h>
#include <wtf/PtrTag.h>

namespace JSC {

#if ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY)

// This indirection is provided so that we can manually force on assertions for
// testing even on release builds.
#if ENABLE(JIT_OPERATION_VALIDATION) && ASSERT_ENABLED
#define ENABLE_JIT_OPERATION_VALIDATION_ASSERT 1
#endif

struct JITOperationAnnotation;

class JITOperationList {
public:
    static JITOperationList& singleton();
    static void initialize();

#if ENABLE(JIT_OPERATION_VALIDATION)
    template<typename PtrType>
    void* map(PtrType pointer) const
    {
        return m_validatedOperations.get(removeCodePtrTag(std::bit_cast<void*>(pointer)));
    }

#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
    template<typename PtrType>
    void* inverseMap(PtrType pointer) const
    {
        return m_validatedOperationsInverseMap.get(std::bit_cast<void*>(pointer));
    }
#endif

    JS_EXPORT_PRIVATE static void populatePointersInEmbedder(const JITOperationAnnotation* beginOperations, const JITOperationAnnotation* endOperations);
#endif // ENABLE(JIT_OPERATION_VALIDATION)

    static void populatePointersInJavaScriptCore();
    static void populatePointersInJavaScriptCoreForLLInt();

#if ENABLE(JIT_OPERATION_DISASSEMBLY)
    JS_EXPORT_PRIVATE static void populateDisassemblyLabelsInEmbedder(const JITOperationAnnotation* beginOperations, const JITOperationAnnotation* endOperations);
#endif

    template<typename T> static void assertIsJITOperation(T function)
    {
        UNUSED_PARAM(function);
#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
        RELEASE_ASSERT(!Options::useJIT() || JITOperationList::singleton().map(function));
#endif
    }

    template<typename T> static void assertIsJITOperationWithValidation(T function)
    {
        UNUSED_PARAM(function);
#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
        RELEASE_ASSERT(!Options::useJIT() || JITOperationList::singleton().inverseMap(function));
#endif
    }

private:
#if ENABLE(JIT_OPERATION_DISASSEMBLY)
    static void populateDisassemblyLabelsInJavaScriptCore();
    static void populateDisassemblyLabelsInJavaScriptCoreForLLInt();
    static void addDisassemblyLabels(const JITOperationAnnotation* begin, const JITOperationAnnotation* end);
#endif

#if ENABLE(JIT_OPERATION_VALIDATION)
    ALWAYS_INLINE void addPointers(const JITOperationAnnotation* begin, const JITOperationAnnotation* end);

#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
    void addInverseMap(void* validationEntry, void* pointer);
#endif

    UncheckedKeyHashMap<void*, void*> m_validatedOperations;
#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
    UncheckedKeyHashMap<void*, void*> m_validatedOperationsInverseMap;
#endif
#endif // ENABLE(JIT_OPERATION_VALIDATION)
};

#if ENABLE(JIT_OPERATION_VALIDATION)

JS_EXPORT_PRIVATE extern LazyNeverDestroyed<JITOperationList> jitOperationList;

inline JITOperationList& JITOperationList::singleton()
{
    return jitOperationList.get();
}

#else // not ENABLE(JIT_OPERATION_VALIDATION)

ALWAYS_INLINE void JITOperationList::populatePointersInJavaScriptCore()
{
    if (UNLIKELY(Options::needDisassemblySupport()))
        populateDisassemblyLabelsInJavaScriptCore();
}

ALWAYS_INLINE void JITOperationList::populatePointersInJavaScriptCoreForLLInt()
{
    if (UNLIKELY(Options::needDisassemblySupport()))
        populateDisassemblyLabelsInJavaScriptCoreForLLInt();
}

#endif // ENABLE(JIT_OPERATION_VALIDATION)

#else // not ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY)

class JITOperationList {
public:
    static void initialize() { }

    static void populatePointersInJavaScriptCore() { }
    static void populatePointersInJavaScriptCoreForLLInt() { }

    template<typename T> static void assertIsJITOperation(T) { }
    template<typename T> static void assertIsJITOperationWithValidation(T) { }
};

#endif // ENABLE(JIT_OPERATION_VALIDATION) || ENABLE(JIT_OPERATION_DISASSEMBLY)

} // namespace JSC
