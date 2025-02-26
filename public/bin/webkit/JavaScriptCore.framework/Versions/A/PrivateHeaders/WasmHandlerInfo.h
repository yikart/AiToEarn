/*
 * Copyright (C) 2021-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "CodeLocation.h"
#include <wtf/Forward.h>
#include <wtf/text/ASCIILiteral.h>

namespace JSC {
class JSWebAssemblyInstance;

namespace Wasm {

class Tag;

enum class HandlerType {
    Catch = 0,
    CatchAll = 1,
    Delegate = 2,
    TryTableCatch = 3,
    TryTableCatchRef = 4,
    TryTableCatchAll = 5,
    TryTableCatchAllRef = 6,
};

struct HandlerInfoBase {
    HandlerType m_type;
    uint32_t m_start;
    uint32_t m_end;
    uint32_t m_target;
    uint32_t m_targetMetadata { 0 };
    uint32_t m_tryDepth;
    uint32_t m_exceptionIndexOrDelegateTarget;
};

struct UnlinkedHandlerInfo : public HandlerInfoBase {
    UnlinkedHandlerInfo()
    {
    }

    UnlinkedHandlerInfo(HandlerType handlerType, uint32_t start, uint32_t end, uint32_t target, uint32_t tryDepth, uint32_t exceptionIndexOrDelegateTarget)
    {
        m_type = handlerType;
        m_start = start;
        m_end = end;
        m_target = target;
        m_tryDepth = tryDepth;
        m_exceptionIndexOrDelegateTarget = exceptionIndexOrDelegateTarget;
    }

    UnlinkedHandlerInfo(HandlerType handlerType, uint32_t start, uint32_t end, uint32_t target, uint32_t targetMetadata, uint32_t tryDepth, uint32_t exceptionIndexOrDelegateTarget)
    {
        m_type = handlerType;
        m_start = start;
        m_end = end;
        m_target = target;
        m_targetMetadata = targetMetadata;
        m_tryDepth = tryDepth;
        m_exceptionIndexOrDelegateTarget = exceptionIndexOrDelegateTarget;
    }

    ASCIILiteral typeName() const
    {
        switch (m_type) {
        case HandlerType::Catch:
            return "catch"_s;
        case HandlerType::CatchAll:
            return "catchall"_s;
        case HandlerType::Delegate:
            return "delegate"_s;
        case HandlerType::TryTableCatch:
            return "try_table catch"_s;
        case HandlerType::TryTableCatchRef:
            return "try_table catch_ref"_s;
        case HandlerType::TryTableCatchAll:
            return "try_table catch_all"_s;
        case HandlerType::TryTableCatchAllRef:
            return "try_table catch_all_ref"_s;
        default:
            ASSERT_NOT_REACHED();
            break;
        }
        return { };
    }
};

struct HandlerInfo : public HandlerInfoBase {
    static const HandlerInfo* handlerForIndex(JSWebAssemblyInstance&, const FixedVector<HandlerInfo>& exeptionHandlers, unsigned index, const Wasm::Tag* exceptionTag);

    void initialize(const UnlinkedHandlerInfo&, CodePtr<ExceptionHandlerPtrTag>);

    unsigned tag() const
    {
        ASSERT(m_type == HandlerType::Catch);
        return m_tag;
    }

    unsigned delegateTarget() const
    {
        ASSERT(m_type == HandlerType::Delegate);
        return m_delegateTarget;
    }

    CodePtr<ExceptionHandlerPtrTag> m_nativeCode;

private:
    union {
        unsigned m_tag;
        unsigned m_delegateTarget;
    };
};

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
