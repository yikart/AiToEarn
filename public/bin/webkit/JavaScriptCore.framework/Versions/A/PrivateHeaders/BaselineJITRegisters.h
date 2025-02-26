/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#include "GPRInfo.h"
#include "JITOperations.h"

namespace JSC {

namespace BaselineJITRegisters {

namespace Call {
    static constexpr JSValueRegs calleeJSR { JSRInfo::jsRegT10 };
    static constexpr GPRReg calleeGPR { GPRInfo::regT0 };
    static constexpr GPRReg callLinkInfoGPR { GPRInfo::regT2 };
    static constexpr GPRReg callTargetGPR { GPRInfo::regT5 };
}

namespace CallDirectEval {
    namespace SlowPath {
        static constexpr GPRReg calleeFrameGPR { GPRInfo::regT0 };
#if USE(JSVALUE64)
        static constexpr GPRReg scopeGPR { GPRInfo::regT1 };
        static constexpr JSValueRegs thisValueJSR { GPRInfo::regT2 };
#else
        static constexpr GPRReg scopeGPR { GPRInfo::regT1 };
        static constexpr JSValueRegs thisValueJSR { JSRInfo::jsRegT32 };
#endif
    }
}

namespace CheckTraps {
    static constexpr GPRReg bytecodeOffsetGPR { GPRInfo::nonArgGPR0 };
}

namespace Enter {
    static constexpr GPRReg scratch1GPR { GPRInfo::regT4 };
    static constexpr GPRReg scratch2GPR { GPRInfo::regT5 };
    static constexpr JSValueRegs scratch3JSR { JSRInfo::jsRegT32 };
}

namespace Instanceof {
    using SlowOperation = decltype(operationInstanceOfOptimize);

    // Registers used on both Fast and Slow paths
    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs valueJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs protoJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 2>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, valueJSR, protoJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static_assert(noOverlap(stubInfoGPR, valueJSR, protoJSR, GPRInfo::handlerGPR, scratch1GPR), "Required for call to slow operation");
    static_assert(noOverlap(resultJSR, stubInfoGPR));

    namespace Custom {
        static constexpr GPRReg globalObjectGPR = stubInfoGPR;
        static constexpr JSValueRegs valueJSR = Instanceof::valueJSR;
        static constexpr GPRReg constructorGPR = scratch1GPR;
        static constexpr JSValueRegs hasInstanceJSR = protoJSR;
    }
}

namespace JFalse {
    static constexpr JSValueRegs valueJSR { JSRInfo::jsRegT32 };
    static constexpr GPRReg scratch1GPR { GPRInfo::regT5 };
    static_assert(noOverlap(valueJSR, scratch1GPR));
}

namespace JTrue {
    static constexpr JSValueRegs valueJSR { JSRInfo::jsRegT32 };
    static constexpr GPRReg scratch1GPR { GPRInfo::regT5 };
    static_assert(noOverlap(valueJSR, scratch1GPR));
}

namespace Throw {
    using SlowOperation = decltype(operationThrow);

    static constexpr GPRReg globalObjectGPR { preferredArgumentGPR<SlowOperation, 0>() };
    static constexpr JSValueRegs thrownValueJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg bytecodeOffsetGPR { GPRInfo::nonArgGPR0 };
    static_assert(noOverlap(thrownValueJSR, bytecodeOffsetGPR), "Required for call to CTI thunk");
    static_assert(noOverlap(globalObjectGPR, thrownValueJSR), "Required for call to slow operation");
}

namespace ResolveScope {
    static constexpr GPRReg metadataGPR { GPRInfo::regT2 };
    static constexpr GPRReg scopeGPR { GPRInfo::regT0 };
    static constexpr GPRReg bytecodeOffsetGPR { GPRInfo::regT3 };
    static constexpr GPRReg scratch1GPR { GPRInfo::regT5 };
    static_assert(noOverlap(metadataGPR, scopeGPR, bytecodeOffsetGPR, scratch1GPR), "Required for call to CTI thunk");
}

namespace GetFromScope {
    static constexpr GPRReg metadataGPR { GPRInfo::regT4 };
    static constexpr GPRReg scopeGPR { GPRInfo::regT2 };
    static constexpr GPRReg bytecodeOffsetGPR { GPRInfo::regT3 };
    static constexpr GPRReg scratch1GPR { GPRInfo::regT5 };
    static_assert(noOverlap(metadataGPR, scopeGPR, bytecodeOffsetGPR, scratch1GPR), "Required for call to CTI thunk");
}

namespace PutToScope {
    static constexpr GPRReg bytecodeOffsetGPR { GPRInfo::argumentGPR2 };
}

namespace GetById {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationGetByIdOptimize);

    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 1>() };

    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static constexpr GPRReg scratch3GPR { scratchRegisters[2] };
    static constexpr GPRReg scratch4GPR { scratchRegisters[3] };

    static_assert(noOverlap(baseJSR, stubInfoGPR), "Required for DataIC");
    static_assert(noOverlap(resultJSR, stubInfoGPR));
    static_assert(noOverlap(baseJSR, stubInfoGPR, scratch1GPR, scratch2GPR, scratch3GPR, scratch4GPR), "Required for HandlerIC");
}

namespace GetByIdWithThis {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationGetByIdWithThisOptimize);

    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs thisJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 2>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, thisJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static_assert(noOverlap(baseJSR, thisJSR, stubInfoGPR, scratch1GPR, scratch2GPR), "Required for call to slow operation");
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}

namespace GetByVal {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationGetByValOptimize);

    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs propertyJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 2>() };
    static constexpr GPRReg profileGPR { preferredArgumentGPR<SlowOperation, 3>() };

    static_assert(noOverlap(baseJSR, propertyJSR, stubInfoGPR, profileGPR), "Required for DataIC");
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, propertyJSR, stubInfoGPR, profileGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
#if USE(JSVALUE64)
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static constexpr GPRReg scratch3GPR { scratchRegisters[2] };
    static_assert(noOverlap(baseJSR, propertyJSR, stubInfoGPR, profileGPR, scratch1GPR, scratch2GPR, scratch3GPR), "Required for DataIC");
#endif
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}

#if USE(JSVALUE64)
namespace EnumeratorGetByVal {
    // We rely on using the same registers when linking a CodeBlock and initializing registers
    // for a GetByVal StubInfo.
    using GetByVal::resultJSR;
    using GetByVal::baseJSR;
    using GetByVal::propertyJSR;
    using GetByVal::stubInfoGPR;
    using GetByVal::profileGPR;
    using GetByVal::scratch1GPR;
    using GetByVal::scratch2GPR;
    using GetByVal::scratch3GPR;
    static_assert(noOverlap(baseJSR, propertyJSR, stubInfoGPR, profileGPR, scratch1GPR, scratch2GPR, scratch3GPR));
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}
#endif

#if USE(JSVALUE64)
namespace GetByValWithThis {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationGetByValWithThisOptimize);

    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs propertyJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr JSValueRegs thisJSR { preferredArgumentJSR<SlowOperation, 2>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 3>() };
    static constexpr GPRReg profileGPR { preferredArgumentGPR<SlowOperation, 4>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, propertyJSR, thisJSR, stubInfoGPR, profileGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static_assert(noOverlap(baseJSR, propertyJSR, thisJSR, stubInfoGPR, profileGPR, GPRInfo::handlerGPR, scratch1GPR), "Required for call to slow operation");
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}
#endif

namespace PutById {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationPutByIdStrictOptimize);

    static constexpr JSValueRegs valueJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 2>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, valueJSR, baseJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static_assert(noOverlap(baseJSR, valueJSR, stubInfoGPR, scratch1GPR), "Required for DataIC");
    static_assert(noOverlap(baseJSR, valueJSR, stubInfoGPR, GPRInfo::handlerGPR, scratch1GPR), "Required for call to slow operation");

#if USE(JSVALUE64)
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static constexpr GPRReg scratch3GPR { scratchRegisters[2] };
    static constexpr GPRReg scratch4GPR { scratchRegisters[3] };
    static_assert(noOverlap(baseJSR, valueJSR, stubInfoGPR, GPRInfo::handlerGPR, scratch1GPR, scratch2GPR, scratch3GPR, scratch4GPR), "Required for HandlerIC");
#endif
}

namespace PutByVal {
    using SlowOperation = decltype(operationPutByValStrictOptimize);
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs propertyJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr JSValueRegs valueJSR { preferredArgumentJSR<SlowOperation, 2>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 3>() };
    static constexpr GPRReg profileGPR { preferredArgumentGPR<SlowOperation, 4>() };
#if USE(JSVALUE64)
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, propertyJSR, valueJSR, stubInfoGPR, profileGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static_assert(noOverlap(baseJSR, propertyJSR, valueJSR, stubInfoGPR, profileGPR, scratch1GPR, GPRInfo::handlerGPR), "Required for call to slow operation");
    static_assert(noOverlap(baseJSR, propertyJSR, valueJSR, stubInfoGPR, profileGPR, scratch1GPR, scratch2GPR), "Required for HandlerIC");
#else
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, propertyJSR, valueJSR, stubInfoGPR, profileGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
#endif
}

#if USE(JSVALUE64)
namespace EnumeratorPutByVal {
    // We rely on using the same registers when linking a CodeBlock and initializing registers
    // for a PutByVal StubInfo.
    using PutByVal::baseJSR;
    using PutByVal::propertyJSR;
    using PutByVal::valueJSR;
    using PutByVal::profileGPR;
    using PutByVal::stubInfoGPR;
    using PutByVal::scratch1GPR;
    using PutByVal::scratch2GPR;
}
#endif

namespace InById {
    using GetById::resultJSR;
    using GetById::baseJSR;
    using GetById::stubInfoGPR;
    using GetById::scratch1GPR;
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}

namespace InByVal {
    using GetByVal::resultJSR;
    using GetByVal::baseJSR;
    using GetByVal::propertyJSR;
    using GetByVal::stubInfoGPR;
    using GetByVal::profileGPR;
    using GetByVal::scratch1GPR;
    static_assert(noOverlap(resultJSR, stubInfoGPR));
}

namespace DelById {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationDeleteByIdStrictOptimize);

    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 1>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static constexpr GPRReg scratch3GPR { scratchRegisters[2] };

    static_assert(noOverlap(baseJSR, stubInfoGPR, scratch1GPR, scratch2GPR, scratch3GPR, GPRInfo::handlerGPR), "Required for call to slow operation");
    static_assert(noOverlap(resultJSR.payloadGPR(), stubInfoGPR));
}

namespace DelByVal {
    // Registers used on both Fast and Slow paths
    using SlowOperation = decltype(operationDeleteByValStrictOptimize);
    static constexpr JSValueRegs resultJSR { JSRInfo::returnValueJSR };
    static constexpr JSValueRegs baseJSR { preferredArgumentJSR<SlowOperation, 0>() };
    static constexpr JSValueRegs propertyJSR { preferredArgumentJSR<SlowOperation, 1>() };
    static constexpr GPRReg stubInfoGPR { preferredArgumentGPR<SlowOperation, 2>() };
    static constexpr auto scratchRegisters = allocatedScratchRegisters<GPRInfo, baseJSR, propertyJSR, stubInfoGPR, GPRInfo::handlerGPR>;
    static constexpr GPRReg scratch1GPR { scratchRegisters[0] };
    static constexpr GPRReg scratch2GPR { scratchRegisters[1] };
    static constexpr GPRReg scratch3GPR { scratchRegisters[2] };
    static_assert(noOverlap(baseJSR, propertyJSR, stubInfoGPR, scratch1GPR, scratch2GPR, scratch3GPR, GPRInfo::handlerGPR), "Required for call to slow operation");
    static_assert(noOverlap(resultJSR.payloadGPR(), stubInfoGPR));
}

namespace PrivateBrand {
    using GetByVal::baseJSR;
    using GetByVal::propertyJSR;
    using GetByVal::stubInfoGPR;
    using GetByVal::scratch1GPR;
    static_assert(noOverlap(baseJSR, propertyJSR, stubInfoGPR), "Required for DataIC");
}

} // namespace BaselineJITRegisters

} // namespace JSC

#endif // ENABLE(JIT)
