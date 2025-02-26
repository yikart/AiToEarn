/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "CallData.h"
#include "ImplementationVisibility.h"
#include "Intrinsic.h"
#include "MacroAssemblerCodeRef.h"
#include "SlowPathFunction.h"
#include "ThunkGenerator.h"
#include "Weak.h"
#include "WeakHandleOwner.h"
#include <tuple>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/Hasher.h>
#include <wtf/PackedRefPtr.h>
#include <wtf/RecursiveLockAdapter.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {
namespace DOMJIT {
class Signature;
}

class VM;
class NativeExecutable;

// List up super common stubs so that we initialize them eagerly.
#define JSC_FOR_EACH_COMMON_THUNK(macro) \
    macro(HandleException, handleExceptionGenerator) \
    macro(HandleExceptionWithCallFrameRollback, handleExceptionWithCallFrameRollbackGenerator) \
    macro(CheckException, checkExceptionGenerator) \
    macro(NativeCall, nativeCallGenerator) \
    macro(NativeConstruct, nativeConstructGenerator) \
    macro(NativeTailCall, nativeTailCallGenerator) \
    macro(NativeTailCallWithoutSavedTags, nativeTailCallWithoutSavedTagsGenerator) \
    macro(InternalFunctionCall, internalFunctionCallGenerator) \
    macro(InternalFunctionConstruct, internalFunctionConstructGenerator) \
    macro(ThrowExceptionFromCall, throwExceptionFromCallGenerator) \
    macro(ThrowExceptionFromCallSlowPath, throwExceptionFromCallSlowPathGenerator) \
    macro(VirtualThunkForRegularCall, virtualThunkForRegularCall) \
    macro(VirtualThunkForTailCall, virtualThunkForTailCall) \
    macro(VirtualThunkForConstruct, virtualThunkForConstruct) \
    macro(PolymorphicThunk, polymorphicThunk) \
    macro(PolymorphicThunkForClosure, polymorphicThunkForClosure) \
    macro(PolymorphicTopTierThunk, polymorphicTopTierThunk) \
    macro(PolymorphicTopTierThunkForClosure, polymorphicTopTierThunkForClosure) \
    macro(ReturnFromBaseline, returnFromBaselineGenerator) \
    macro(GetByIdLoadOwnPropertyHandler, getByIdLoadOwnPropertyHandler) \
    macro(GetByIdLoadPrototypePropertyHandler, getByIdLoadPrototypePropertyHandler) \
    macro(GetByIdMissHandler, getByIdMissHandler) \
    macro(GetByIdCustomAccessorHandler, getByIdCustomAccessorHandler) \
    macro(GetByIdCustomValueHandler, getByIdCustomValueHandler) \
    macro(GetByIdGetterHandler, getByIdGetterHandler) \
    macro(GetByIdProxyObjectLoadHandler, getByIdProxyObjectLoadHandler) \
    macro(GetByIdModuleNamespaceLoadHandler, getByIdModuleNamespaceLoadHandler) \
    macro(PutByIdReplaceHandler, putByIdReplaceHandler) \
    macro(PutByIdTransitionNonAllocatingHandler, putByIdTransitionNonAllocatingHandler) \
    macro(PutByIdTransitionNewlyAllocatingHandler, putByIdTransitionNewlyAllocatingHandler) \
    macro(PutByIdTransitionReallocatingHandler, putByIdTransitionReallocatingHandler) \
    macro(PutByIdTransitionReallocatingOutOfLineHandler, putByIdTransitionReallocatingOutOfLineHandler) \
    macro(PutByIdCustomAccessorHandler, putByIdCustomAccessorHandler) \
    macro(PutByIdCustomValueHandler, putByIdCustomValueHandler) \
    macro(PutByIdStrictSetterHandler, putByIdStrictSetterHandler) \
    macro(PutByIdSloppySetterHandler, putByIdSloppySetterHandler) \
    macro(InByIdHitHandler, inByIdHitHandler) \
    macro(InByIdMissHandler, inByIdMissHandler) \
    macro(DeleteByIdDeleteHandler, deleteByIdDeleteHandler) \
    macro(DeleteByIdDeleteNonConfigurableHandler, deleteByIdDeleteNonConfigurableHandler) \
    macro(DeleteByIdDeleteMissHandler, deleteByIdDeleteMissHandler) \
    macro(InstanceOfHitHandler, instanceOfHitHandler) \
    macro(InstanceOfMissHandler, instanceOfMissHandler) \
    macro(GetByValWithStringLoadOwnPropertyHandler, getByValWithStringLoadOwnPropertyHandler) \
    macro(GetByValWithStringLoadPrototypePropertyHandler, getByValWithStringLoadPrototypePropertyHandler) \
    macro(GetByValWithStringMissHandler, getByValWithStringMissHandler) \
    macro(GetByValWithStringCustomAccessorHandler, getByValWithStringCustomAccessorHandler) \
    macro(GetByValWithStringCustomValueHandler, getByValWithStringCustomValueHandler) \
    macro(GetByValWithStringGetterHandler, getByValWithStringGetterHandler) \
    macro(GetByValWithSymbolLoadOwnPropertyHandler, getByValWithSymbolLoadOwnPropertyHandler) \
    macro(GetByValWithSymbolLoadPrototypePropertyHandler, getByValWithSymbolLoadPrototypePropertyHandler) \
    macro(GetByValWithSymbolMissHandler, getByValWithSymbolMissHandler) \
    macro(GetByValWithSymbolCustomAccessorHandler, getByValWithSymbolCustomAccessorHandler) \
    macro(GetByValWithSymbolCustomValueHandler, getByValWithSymbolCustomValueHandler) \
    macro(GetByValWithSymbolGetterHandler, getByValWithSymbolGetterHandler) \
    macro(PutByValWithStringReplaceHandler, putByValWithStringReplaceHandler) \
    macro(PutByValWithStringTransitionNonAllocatingHandler, putByValWithStringTransitionNonAllocatingHandler) \
    macro(PutByValWithStringTransitionNewlyAllocatingHandler, putByValWithStringTransitionNewlyAllocatingHandler) \
    macro(PutByValWithStringTransitionReallocatingHandler, putByValWithStringTransitionReallocatingHandler) \
    macro(PutByValWithStringTransitionReallocatingOutOfLineHandler, putByValWithStringTransitionReallocatingOutOfLineHandler) \
    macro(PutByValWithStringCustomAccessorHandler, putByValWithStringCustomAccessorHandler) \
    macro(PutByValWithStringCustomValueHandler, putByValWithStringCustomValueHandler) \
    macro(PutByValWithStringStrictSetterHandler, putByValWithStringStrictSetterHandler) \
    macro(PutByValWithStringSloppySetterHandler, putByValWithStringSloppySetterHandler) \
    macro(PutByValWithSymbolReplaceHandler, putByValWithSymbolReplaceHandler) \
    macro(PutByValWithSymbolTransitionNonAllocatingHandler, putByValWithSymbolTransitionNonAllocatingHandler) \
    macro(PutByValWithSymbolTransitionNewlyAllocatingHandler, putByValWithSymbolTransitionNewlyAllocatingHandler) \
    macro(PutByValWithSymbolTransitionReallocatingHandler, putByValWithSymbolTransitionReallocatingHandler) \
    macro(PutByValWithSymbolTransitionReallocatingOutOfLineHandler, putByValWithSymbolTransitionReallocatingOutOfLineHandler) \
    macro(PutByValWithSymbolCustomAccessorHandler, putByValWithSymbolCustomAccessorHandler) \
    macro(PutByValWithSymbolCustomValueHandler, putByValWithSymbolCustomValueHandler) \
    macro(PutByValWithSymbolStrictSetterHandler, putByValWithSymbolStrictSetterHandler) \
    macro(PutByValWithSymbolSloppySetterHandler, putByValWithSymbolSloppySetterHandler) \
    macro(InByValWithStringHitHandler, inByValWithStringHitHandler) \
    macro(InByValWithStringMissHandler, inByValWithStringMissHandler) \
    macro(InByValWithSymbolHitHandler, inByValWithSymbolHitHandler) \
    macro(InByValWithSymbolMissHandler, inByValWithSymbolMissHandler) \
    macro(DeleteByValWithStringDeleteHandler, deleteByValWithStringDeleteHandler) \
    macro(DeleteByValWithStringDeleteNonConfigurableHandler, deleteByValWithStringDeleteNonConfigurableHandler) \
    macro(DeleteByValWithStringDeleteMissHandler, deleteByValWithStringDeleteMissHandler) \
    macro(DeleteByValWithSymbolDeleteHandler, deleteByValWithSymbolDeleteHandler) \
    macro(DeleteByValWithSymbolDeleteNonConfigurableHandler, deleteByValWithSymbolDeleteNonConfigurableHandler) \
    macro(DeleteByValWithSymbolDeleteMissHandler, deleteByValWithSymbolDeleteMissHandler) \
    macro(CheckPrivateBrandHandler, checkPrivateBrandHandler) \
    macro(SetPrivateBrandHandler, setPrivateBrandHandler) \

#if ENABLE(YARR_JIT_BACKREFERENCES_FOR_16BIT_EXPRS)
#define JSC_FOR_EACH_YARR_JIT_BACKREFERENCES_THUNK(macro) \
    macro(AreCanonicallyEquivalent, Yarr::areCanonicallyEquivalentThunkGenerator)
#else
#define JSC_FOR_EACH_YARR_JIT_BACKREFERENCES_THUNK(macro)
#endif

enum class CommonJITThunkID : uint8_t {
#define JSC_DEFINE_COMMON_JIT_THUNK_ID(name, func) name,
JSC_FOR_EACH_COMMON_THUNK(JSC_DEFINE_COMMON_JIT_THUNK_ID)
JSC_FOR_EACH_YARR_JIT_BACKREFERENCES_THUNK(JSC_DEFINE_COMMON_JIT_THUNK_ID)
#undef JSC_DEFINE_COMMON_JIT_THUNK_ID
};

#define JSC_COUNT_COMMON_JIT_THUNK_ID(name, func) + 1
static constexpr unsigned numberOfCommonThunkIDs = 0 JSC_FOR_EACH_COMMON_THUNK(JSC_COUNT_COMMON_JIT_THUNK_ID) JSC_FOR_EACH_YARR_JIT_BACKREFERENCES_THUNK(JSC_COUNT_COMMON_JIT_THUNK_ID);
#undef JSC_COUNT_COMMON_JIT_THUNK_ID

class JITThunks final : private WeakHandleOwner {
    WTF_MAKE_TZONE_ALLOCATED(JITThunks);
public:
    JITThunks();
    ~JITThunks() final;

    CodePtr<JITThunkPtrTag> ctiNativeCall(VM&);
    CodePtr<JITThunkPtrTag> ctiNativeCallWithDebuggerHook(VM&);
    CodePtr<JITThunkPtrTag> ctiNativeConstruct(VM&);
    CodePtr<JITThunkPtrTag> ctiNativeConstructWithDebuggerHook(VM&);
    CodePtr<JITThunkPtrTag> ctiNativeTailCall(VM&);
    CodePtr<JITThunkPtrTag> ctiNativeTailCallWithoutSavedTags(VM&);
    CodePtr<JITThunkPtrTag> ctiInternalFunctionCall(VM&);
    CodePtr<JITThunkPtrTag> ctiInternalFunctionConstruct(VM&);

    MacroAssemblerCodeRef<JITThunkPtrTag> ctiStub(CommonJITThunkID);
    MacroAssemblerCodeRef<JITThunkPtrTag> ctiStub(VM&, ThunkGenerator);
    MacroAssemblerCodeRef<JITThunkPtrTag> ctiSlowPathFunctionStub(VM&, SlowPathFunction);

    NativeExecutable* hostFunctionStub(VM&, TaggedNativeFunction, TaggedNativeFunction constructor, ImplementationVisibility, const String& name);
    NativeExecutable* hostFunctionStub(VM&, TaggedNativeFunction, TaggedNativeFunction constructor, ThunkGenerator, ImplementationVisibility, Intrinsic, const DOMJIT::Signature*, const String& name);
    NativeExecutable* hostFunctionStub(VM&, TaggedNativeFunction, ThunkGenerator, ImplementationVisibility, Intrinsic, const String& name);

    void initialize(VM&);

private:
    template <typename GenerateThunk>
    MacroAssemblerCodeRef<JITThunkPtrTag> ctiStubImpl(ThunkGenerator key, GenerateThunk);

    void finalize(Handle<Unknown>, void* context) final;
    
    struct Entry {
        PackedRefPtr<ExecutableMemoryHandle> handle;
        bool needsCrossModifyingCodeFence;
    };
    using CTIStubMap = UncheckedKeyHashMap<ThunkGenerator, Entry>;

    using HostFunctionKey = std::tuple<TaggedNativeFunction, TaggedNativeFunction, ImplementationVisibility, String>;

    struct WeakNativeExecutableHash {
        static inline unsigned hash(const Weak<NativeExecutable>&);
        static inline unsigned hash(const NativeExecutable*);
        static unsigned hash(const HostFunctionKey& key)
        {
            return hash(std::get<0>(key), std::get<1>(key), std::get<2>(key), std::get<3>(key));
        }

        static inline bool equal(const Weak<NativeExecutable>&, const Weak<NativeExecutable>&);
        static inline bool equal(const Weak<NativeExecutable>&, const HostFunctionKey&);
        static inline bool equal(const Weak<NativeExecutable>&, const NativeExecutable*);
        static inline bool equal(const NativeExecutable&, const NativeExecutable&);
        static constexpr bool safeToCompareToEmptyOrDeleted = false;

    private:
        static unsigned hash(TaggedNativeFunction function, TaggedNativeFunction constructor, ImplementationVisibility implementationVisibility, const String& name)
        {
            Hasher hasher;
            WTF::add(hasher, function);
            WTF::add(hasher, constructor);
            WTF::add(hasher, implementationVisibility);
            if (!name.isNull())
                WTF::add(hasher, name);
            return hasher.hash();
        }
    };
    struct HostKeySearcher;
    struct NativeExecutableTranslator;

    using WeakNativeExecutableSet = HashSet<Weak<NativeExecutable>, WeakNativeExecutableHash>;

    MacroAssemblerCodeRef<JITThunkPtrTag> m_commonThunks[numberOfCommonThunkIDs] { };
    CTIStubMap m_ctiStubMap;
    WeakNativeExecutableSet m_nativeExecutableSet;
    WTF::RecursiveLock m_lock;
};

} // namespace JSC

#endif // ENABLE(JIT)
