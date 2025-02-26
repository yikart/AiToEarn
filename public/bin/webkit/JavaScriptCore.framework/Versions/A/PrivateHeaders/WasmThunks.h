/*
 * Copyright (C) 2017-2023 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY) && ENABLE(JIT)

#include "MacroAssemblerCodeRef.h"
#include "WasmJS.h"
#include <wtf/TZoneMalloc.h>

namespace JSC { namespace Wasm {

typedef MacroAssemblerCodeRef<JITThunkPtrTag> (*ThunkGenerator)(const AbstractLocker&);

MacroAssemblerCodeRef<JITThunkPtrTag> throwExceptionFromWasmThunkGenerator(const AbstractLocker&);
MacroAssemblerCodeRef<JITThunkPtrTag> throwStackOverflowFromWasmThunkGenerator(const AbstractLocker&);
MacroAssemblerCodeRef<JITThunkPtrTag> catchInWasmThunkGenerator(const AbstractLocker&);
MacroAssemblerCodeRef<JITThunkPtrTag> crashDueToBBQStackOverflowGenerator(const AbstractLocker&);
MacroAssemblerCodeRef<JITThunkPtrTag> crashDueToOMGStackOverflowGenerator(const AbstractLocker&);
#if ENABLE(WEBASSEMBLY_OMGJIT)
MacroAssemblerCodeRef<JITThunkPtrTag> triggerOMGEntryTierUpThunkGeneratorImpl(const AbstractLocker&, bool isSIMDContext);
MacroAssemblerCodeRef<JITThunkPtrTag> triggerOMGEntryTierUpThunkGeneratorSIMD(const AbstractLocker&);
MacroAssemblerCodeRef<JITThunkPtrTag> triggerOMGEntryTierUpThunkGeneratorNoSIMD(const AbstractLocker&);
constexpr ThunkGenerator triggerOMGEntryTierUpThunkGenerator(bool isSIMDContext)
{
    if (isSIMDContext)
        return triggerOMGEntryTierUpThunkGeneratorSIMD;
    return triggerOMGEntryTierUpThunkGeneratorNoSIMD;
}
#endif

class Thunks {
    WTF_MAKE_TZONE_ALLOCATED(Thunks);
    WTF_MAKE_NONCOPYABLE(Thunks);
public:
    static void initialize();
    static Thunks& singleton();

    MacroAssemblerCodeRef<JITThunkPtrTag> stub(ThunkGenerator);
    MacroAssemblerCodeRef<JITThunkPtrTag> stub(const AbstractLocker&, ThunkGenerator);
    MacroAssemblerCodeRef<JITThunkPtrTag> existingStub(ThunkGenerator);

private:
    Thunks() = default;

    UncheckedKeyHashMap<ThunkGenerator, MacroAssemblerCodeRef<JITThunkPtrTag>> m_stubs;
    Lock m_lock;
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY) && ENABLE(JIT)
