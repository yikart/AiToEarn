/*
 * Copyright (C) 2010-2021 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(JIT)

#include "CallMode.h"
#include "CodeSpecializationKind.h"
#include "JSCPtrTag.h"

namespace JSC {

class CallLinkInfo;
enum class CallMode;
template<PtrTag> class MacroAssemblerCodeRef;
class VM;

MacroAssemblerCodeRef<JITThunkPtrTag> handleExceptionGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> handleExceptionWithCallFrameRollbackGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> popThunkStackPreservesAndHandleExceptionGenerator(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> throwExceptionFromCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> throwExceptionFromCallSlowPathGenerator(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> checkExceptionGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> returnFromBaselineGenerator(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> polymorphicThunk(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> polymorphicThunkForClosure(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> polymorphicTopTierThunk(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> polymorphicTopTierThunkForClosure(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> virtualThunkForRegularCall(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> virtualThunkForTailCall(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> virtualThunkForConstruct(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> nativeCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> nativeCallWithDebuggerHookGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> nativeConstructGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> nativeConstructWithDebuggerHookGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> nativeTailCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> nativeTailCallWithoutSavedTagsGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> internalFunctionCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> internalFunctionConstructGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> arityFixupGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> unreachableGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> stringGetByValGenerator(VM&);

MacroAssemblerCodeRef<JITThunkPtrTag> charCodeAtThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> charAtThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> stringPrototypeCodePointAtThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> clz32ThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> fromCharCodeThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> globalIsNaNThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> numberIsNaNThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> absThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> ceilThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> expThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> floorThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> logThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> roundThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> sqrtThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> imulThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> randomThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> truncThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> numberConstructorCallThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> stringConstructorCallThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> boundFunctionCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> remoteFunctionCallGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> toIntegerOrInfinityThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> toLengthThunkGenerator(VM&);
#if CPU(ARM64)
MacroAssemblerCodeRef<JITThunkPtrTag> maxThunkGenerator(VM&);
MacroAssemblerCodeRef<JITThunkPtrTag> minThunkGenerator(VM&);
#endif

#if USE(JSVALUE64)
MacroAssemblerCodeRef<JITThunkPtrTag> objectIsThunkGenerator(VM&);
#endif

} // namespace JSC
#endif // ENABLE(JIT)
