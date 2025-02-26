/*
 * Copyright (C) 2014-2020 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "DFGOperations.h"
#include "FTLExitTimeObjectMaterialization.h"

namespace JSC {

struct UnlinkedStringJumpTable;

namespace FTL {

class LazySlowPath;

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationMaterializeObjectInOSR, JSCell*, (JSGlobalObject*, ExitTimeObjectMaterialization*, EncodedJSValue*));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationPopulateObjectInOSR, void, (JSGlobalObject*, ExitTimeObjectMaterialization*, EncodedJSValue*, EncodedJSValue*));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationCompileFTLLazySlowPath, void*, (CallFrame*, unsigned));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationSwitchStringAndGetIndex, unsigned, (JSGlobalObject*, const UnlinkedStringJumpTable*, JSString*));
JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationTypeOfObjectAsTypeofType, int32_t, (JSGlobalObject*, JSCell*));

JSC_DECLARE_NOEXCEPT_JIT_OPERATION(operationReportBoundsCheckEliminationErrorAndCrash, void, (intptr_t codeBlockAsIntPtr, int32_t, int32_t, int32_t, int32_t, int32_t));

} } // namespace JSC::DFG

#endif // ENABLE(FTL_JIT)
