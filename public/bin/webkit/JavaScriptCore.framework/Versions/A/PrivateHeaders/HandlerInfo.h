/*
 * Copyright (C) 2012-2018 Apple Inc. All rights reserved.
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

#include "CodeLocation.h"
#include <wtf/Forward.h>

namespace JSC {

enum class HandlerType : uint8_t {
    Catch = 0,
    Finally = 1,
    SynthesizedCatch = 2,
    SynthesizedFinally = 3
};

enum class RequiredHandler {
    CatchHandler,
    AnyHandler
};

struct HandlerInfoBase {
    HandlerType type() const { return static_cast<HandlerType>(typeBits); }
    void setType(HandlerType type) { typeBits = static_cast<uint32_t>(type); }

    const char* typeName() const
    {
        switch (type()) {
        case HandlerType::Catch:
            return "catch";
        case HandlerType::Finally:
            return "finally";
        case HandlerType::SynthesizedCatch:
            return "synthesized catch";
        case HandlerType::SynthesizedFinally:
            return "synthesized finally";
        default:
            ASSERT_NOT_REACHED();
        }
        return nullptr;
    }

    bool isCatchHandler() const { return type() == HandlerType::Catch; }

    template<typename Handler, typename Container>
    static Handler* handlerForIndex(Container& exeptionHandlers, unsigned index, RequiredHandler requiredHandler)
    {
        for (auto& handler : exeptionHandlers) {
            if ((requiredHandler == RequiredHandler::CatchHandler) && !handler.isCatchHandler())
                continue;

            // Handlers are ordered innermost first, so the first handler we encounter
            // that contains the source address is the correct handler to use.
            // This index used is either the BytecodeOffset or a CallSiteIndex.
            if (handler.start <= index && handler.end > index)
                return &handler;
        }

        return nullptr;
    }

    uint32_t start;
    uint32_t end;
    uint32_t target;
    uint32_t typeBits : 2; // HandlerType
};

struct UnlinkedHandlerInfo : public HandlerInfoBase {
    UnlinkedHandlerInfo()
    {
    }

    UnlinkedHandlerInfo(uint32_t start, uint32_t end, uint32_t target, HandlerType handlerType)
    {
        this->start = start;
        this->end = end;
        this->target = target;
        setType(handlerType);
        ASSERT(type() == handlerType);
    }
};

struct HandlerInfo : public HandlerInfoBase {
    void initialize(const UnlinkedHandlerInfo& unlinkedInfo)
    {
        start = unlinkedInfo.start;
        end = unlinkedInfo.end;
        target = unlinkedInfo.target;
        typeBits = unlinkedInfo.typeBits;
    }

#if ENABLE(JIT)
    void initialize(const UnlinkedHandlerInfo& unlinkedInfo, CodeLocationLabel<ExceptionHandlerPtrTag> label)
    {
        initialize(unlinkedInfo);
        nativeCode = label;
    }

    CodeLocationLabel<ExceptionHandlerPtrTag> nativeCode;
#endif
};

} // namespace JSC
