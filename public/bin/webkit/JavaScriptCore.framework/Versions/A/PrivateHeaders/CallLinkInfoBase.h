/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "ArityCheckMode.h"
#include "CallMode.h"
#include "JSCPtrTag.h"
#include <wtf/CodePtr.h>
#include <wtf/SentinelLinkedList.h>

namespace JSC {

class CodeBlock;
class JSCell;
class VM;

class CallSlot {
public:
    JSCell* m_calleeOrExecutable { nullptr };
    uint32_t m_count { 0 };
    uint8_t m_index { 0 };
    ArityCheckMode m_arityCheckMode { MustCheckArity };
    CodePtr<JSEntryPtrTag> m_target;
    CodeBlock* m_codeBlock { nullptr }; // This is weakly held. And cleared whenever m_target is changed.

    static constexpr ptrdiff_t offsetOfCalleeOrExecutable() { return OBJECT_OFFSETOF(CallSlot, m_calleeOrExecutable); }
    static constexpr ptrdiff_t offsetOfCount() { return OBJECT_OFFSETOF(CallSlot, m_count); }
    static constexpr ptrdiff_t offsetOfTarget() { return OBJECT_OFFSETOF(CallSlot, m_target); }
    static constexpr ptrdiff_t offsetOfCodeBlock() { return OBJECT_OFFSETOF(CallSlot, m_codeBlock); }
};
static_assert(sizeof(CallSlot) <= 32, "This should be small enough to keep iteration of vector in polymorphic call fast");

class CallLinkInfoBase : public BasicRawSentinelNode<CallLinkInfoBase> {
public:
    enum class CallSiteType : uint8_t {
        CallLinkInfo,
        PolymorphicCallNode,
#if ENABLE(JIT)
        DirectCall,
#endif
        CachedCall,
    };

    enum CallType : uint8_t {
        None,
        Call,
        CallVarargs,
        Construct,
        ConstructVarargs,
        TailCall,
        TailCallVarargs,
        DirectCall,
        DirectConstruct,
        DirectTailCall
    };

    enum class UseDataIC : bool { No, Yes };

    static CallMode callModeFor(CallType callType)
    {
        switch (callType) {
        case Call:
        case CallVarargs:
        case DirectCall:
            return CallMode::Regular;
        case TailCall:
        case TailCallVarargs:
        case DirectTailCall:
            return CallMode::Tail;
        case Construct:
        case ConstructVarargs:
        case DirectConstruct:
            return CallMode::Construct;
        case None:
            RELEASE_ASSERT_NOT_REACHED();
        }

        RELEASE_ASSERT_NOT_REACHED();
    }

    explicit CallLinkInfoBase(CallSiteType callSiteType)
        : m_callSiteType(callSiteType)
    {
    }

    ~CallLinkInfoBase()
    {
        if (isOnList())
            remove();
    }

    CallSiteType callSiteType() const { return m_callSiteType; }

    void unlinkOrUpgrade(VM&, CodeBlock*, CodeBlock*);

private:
    CallSiteType m_callSiteType;
};

} // namespace JSC
