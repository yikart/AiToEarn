/*
 * Copyright (C) 2018-2024 Apple Inc. All rights reserved.
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

#include "JITOperationList.h"
#include "JITOperationValidation.h"
#include <wtf/PtrTag.h>

#if ENABLE(JIT_CAGE)
extern "C" JS_EXPORT_PRIVATE void* jitCagePtr(void* pointer, uintptr_t tag);
#endif

namespace JSC {

using PtrTag = WTF::PtrTag;

#define FOR_EACH_JSC_PTRTAG(v) \
    /* Callee:Native Caller:None */ \
    v(DisassemblyPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::None) \
    /* Callee:JIT Caller:None */ \
    v(JITCompilationPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(ExecutableMemoryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(LinkBufferPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(Yarr8BitPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(Yarr16BitPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(YarrMatchOnly8BitPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    v(YarrMatchOnly16BitPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::None) \
    /* Callee:Native Caller:Native */ \
    v(BytecodePtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(CustomAccessorPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(GetValueFuncPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(GetValueFuncWithPtrPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(PutValueFuncPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(PutValueFuncWithPtrPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(HostFunctionPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(JITProbePtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(JITProbePCPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(JITProbeStackInitializationFunctionPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    v(ReturnAddressPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::Native) \
    /* Callee:JIT Caller:Native */ \
    v(NativeToJITGatePtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::Native) \
    v(YarrEntryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::Native) \
    v(LLIntToWasmEntryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::Native) \
    v(CSSSelectorPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::Native) \
    /* Callee:Native Caller:JIT */ \
    v(OperationPtrTag, PtrTagCalleeType::Native, PtrTagCallerType::JIT) \
    /* Callee:JIT Caller:JIT */ \
    v(ExceptionHandlerPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JITThunkPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JITStubRoutinePtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JSEntryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JSEntrySlowPathPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JSInternalPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(JSSwitchPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(OSREntryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(OSRExitPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(WasmEntryPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \
    v(YarrBacktrackPtrTag, PtrTagCalleeType::JIT, PtrTagCallerType::JIT) \

#define JSC_DECLARE_PTRTAG(name, type, target) WTF_DECLARE_PTRTAG(name)

#define JSC_DECLARE_PTRTAG_TRAIT(passedTag, passedCalleeType, passedCallerType) \
    template<> struct PtrTagTraits<JSC::passedTag> { \
        static constexpr PtrTag tag = JSC::passedTag; \
        static constexpr PtrTagCalleeType calleeType = passedCalleeType; \
        static constexpr PtrTagCallerType callerType = passedCallerType; \
        static constexpr bool isSpecialized = passedCallerType == PtrTagCallerType::JIT;\
    \
        template<typename PtrType> \
        ALWAYS_INLINE static PtrType tagCodePtr(PtrType ptr) \
        { \
            if constexpr (!isSpecialized) \
                return WTF::tagNativeCodePtrImpl<tag>(ptr); \
            else \
                return JSC::tagJSCCodePtrImpl<tag, calleeType, callerType>(ptr); \
        } \
    \
        template<typename PtrType> \
        ALWAYS_INLINE static PtrType untagCodePtr(PtrType ptr) \
        { \
            if constexpr (!isSpecialized) \
                return WTF::untagNativeCodePtrImpl<tag>(ptr); \
            else \
                return JSC::untagJSCCodePtrImpl<tag, calleeType, callerType>(ptr); \
        } \
    \
        template<typename PtrType> \
        ALWAYS_INLINE static bool isTagged(PtrType ptr) \
        { \
            if constexpr (!isSpecialized) \
                return WTF::isTaggedNativeCodePtrImpl<tag>(ptr); \
            else \
                return JSC::isTaggedJSCCodePtrImpl<tag, calleeType, callerType>(ptr); \
        } \
    };

FOR_EACH_JSC_PTRTAG(JSC_DECLARE_PTRTAG)

#if CPU(ARM64E)
JS_EXPORT_PRIVATE PtrTagCallerType callerType(PtrTag);
JS_EXPORT_PRIVATE PtrTagCalleeType calleeType(PtrTag);
#endif

template<PtrTag tag, PtrTagCalleeType calleeType, PtrTagCallerType callerType, typename PtrType>
ALWAYS_INLINE static PtrType tagJSCCodePtrImpl(PtrType ptr)
{
    static_assert(callerType == PtrTagCallerType::JIT);
    if constexpr (calleeType == PtrTagCalleeType::Native) {
        static_assert(tag == OperationPtrTag);
        JITOperationList::assertIsJITOperation(ptr);
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage())
            return std::bit_cast<PtrType>(JITOperationList::singleton().map(ptr));
    } else {
        if (Options::useJITCage())
            return std::bit_cast<PtrType>(jitCagePtr(std::bit_cast<void*>(ptr), tag));
#endif // ENABLE(JIT_CAGE)
    }
    return WTF::tagNativeCodePtrImpl<tag>(ptr);
}

template<PtrTag tag, PtrTagCalleeType calleeType, PtrTagCallerType callerType, typename PtrType>
ALWAYS_INLINE static PtrType untagJSCCodePtrImpl(PtrType ptr)
{
    static_assert(callerType == PtrTagCallerType::JIT);
    if constexpr (calleeType == PtrTagCalleeType::Native) {
        static_assert(tag == OperationPtrTag);
        JITOperationList::assertIsJITOperationWithValidation(ptr);
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
            // This case is currently not used. If this changes in the future, we'll have to implement
            // an inverse mapping of a validation operation back to the original operation.
            RELEASE_ASSERT_NOT_REACHED();
        }
    } else {
        if (Options::useJITCage()) {
            PtrType removed = removeCodePtrTag(ptr);
            RELEASE_ASSERT((tagJSCCodePtrImpl<tag, calleeType, callerType>(removed)) == ptr);
            return removed;
        }
#endif // ENABLE(JIT_CAGE)
    }
    return WTF::untagNativeCodePtrImpl<tag>(ptr);
}

template<PtrTag tag, PtrTagCalleeType calleeType, PtrTagCallerType callerType, typename PtrType>
ALWAYS_INLINE static bool isTaggedJSCCodePtrImpl(PtrType ptr)
{
    static_assert(callerType == PtrTagCallerType::JIT);
    if constexpr (calleeType == PtrTagCalleeType::Native) {
        static_assert(tag == OperationPtrTag);
#if ENABLE(JIT_CAGE)
        if (Options::useJITCage()) {
#if ENABLE(JIT_OPERATION_VALIDATION_ASSERT)
            return JITOperationList::singleton().inverseMap(ptr);
#else
            // Not supported. We currently don't use this, and don't have an
            // efficient way to implement this. So, just assert that it's not used.
            RELEASE_ASSERT_NOT_REACHED();
#endif
        }
    } else {
        if (Options::useJITCage())
            return ptr == tagJSCCodePtrImpl<tag, calleeType, callerType>(removeCodePtrTag(ptr));
#endif // ENABLE(JIT_CAGE)
    }
    return WTF::isTaggedNativeCodePtrImpl<tag>(ptr);
}

template<typename PtrType>
inline PtrType tagCodePtrWithStackPointerForJITCall(PtrType ptr, const void* stackPointer)
{
    ASSERT(ptr);
    UNUSED_PARAM(stackPointer);
#if ENABLE(JIT_CAGE)
    if (Options::useJITCage())
        return std::bit_cast<PtrType>(JSC_JIT_CAGE(std::bit_cast<void*>(ptr), std::bit_cast<uintptr_t>(stackPointer)));
#endif
#if CPU(ARM64E)
    return ptrauth_sign_unauthenticated(ptr, ptrauth_key_process_dependent_code, stackPointer);
#else
    return ptr;
#endif
}

template<typename PtrType>
inline PtrType untagCodePtrWithStackPointerForJITCall(PtrType ptr, const void* stackPointer)
{
    ASSERT(ptr);
    UNUSED_PARAM(stackPointer);
#if ENABLE(JIT_CAGE)
    if (Options::useJITCage()) {
        PtrType uncaged = removeCodePtrTag(ptr);
        RELEASE_ASSERT(tagCodePtrWithStackPointerForJITCall(uncaged, stackPointer) == ptr);
        return uncaged;
    }
#endif
#if CPU(ARM64E)
    return __builtin_ptrauth_auth(ptr, ptrauth_key_process_dependent_code, stackPointer);
#else
    return ptr;
#endif
}

template<PtrTag tag, typename PtrType>
inline PtrType untagAddressDiversifiedCodePtr(PtrType ptr, const void* ptrAddress)
{
    UNUSED_PARAM(ptrAddress);
#if CPU(ARM64E)
    uint64_t address = std::bit_cast<uint64_t>(ptrAddress);
    uint64_t tagBits = static_cast<uint64_t>(tag) << 48;
    uint64_t addressDiversifiedTag = tagBits ^ address;
    return __builtin_ptrauth_auth(ptr, ptrauth_key_process_dependent_code, addressDiversifiedTag);
#else
    return ptr;
#endif
}

#if CPU(ARM64E) && ENABLE(PTRTAG_DEBUGGING)
void initializePtrTagLookup();
#else
inline void initializePtrTagLookup() { }
#endif

#if CPU(ARM64E) && (ENABLE(PTRTAG_DEBUGGING) || ENABLE(DISASSEMBLER))
const char* ptrTagName(PtrTag);
#endif

} // namespace JSC
namespace WTF {

FOR_EACH_JSC_PTRTAG(JSC_DECLARE_PTRTAG_TRAIT)

} // namespace WTF
