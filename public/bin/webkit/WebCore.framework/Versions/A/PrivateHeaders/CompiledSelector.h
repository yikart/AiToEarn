/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#if ENABLE(CSS_SELECTOR_JIT)

#include "CSSSelector.h"
#include <JavaScriptCore/JSCPtrTag.h>
#include <JavaScriptCore/MacroAssemblerCodeRef.h>

#define CSS_SELECTOR_JIT_PROFILING 0

namespace WebCore {

enum class SelectorCompilationStatus : uint8_t {
    NotCompiled,
    CannotCompile,
    SimpleSelectorChecker,
    SelectorCheckerWithCheckingContext
};

struct CompiledSelector {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    SelectorCompilationStatus status { SelectorCompilationStatus::NotCompiled };
    JSC::MacroAssemblerCodeRef<JSC::CSSSelectorPtrTag> codeRef;

#if defined(CSS_SELECTOR_JIT_PROFILING) && CSS_SELECTOR_JIT_PROFILING
    unsigned useCount { 0 };
    const CSSSelector* selector { nullptr };
    void wasUsed() { ++useCount; }

    ~CompiledSelector()
    {
        if (codeRef.code().taggedPtr())
            dataLogF("CompiledSelector %d \"%s\"\n", useCount, selector->selectorText().utf8().data());
    }
#else
    void wasUsed() { }
#endif
};

}

#endif
