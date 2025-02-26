/*
 * Copyright (C) 2015-2022 Apple Inc. All rights reserved.
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

#include "CallEdge.h"
#include "CallLinkInfoBase.h"
#include "CallVariant.h"
#include "GCAwareJITStubRoutine.h"
#include <wtf/ButterflyArray.h>
#include <wtf/Noncopyable.h>
#include <wtf/UniqueArray.h>
#include <wtf/Vector.h>

namespace JSC {

class CallLinkInfo;

class PolymorphicCallNode final : public CallLinkInfoBase {
    WTF_MAKE_NONCOPYABLE(PolymorphicCallNode);
public:
    PolymorphicCallNode()
        : CallLinkInfoBase(CallSiteType::PolymorphicCallNode)
    {
    }

    void initialize(uint8_t index, uint8_t totalSize)
    {
        m_index = index;
        m_totalSize = totalSize;
        m_cleared = false;
    }

    void unlinkOrUpgradeImpl(VM&, CodeBlock*, CodeBlock*);

    void clear();

    PolymorphicCallStubRoutine* owner();

private:
    uint8_t m_index { 0 };
    uint8_t m_totalSize { 0 };
    bool m_cleared { true };
};

class PolymorphicCallCase {
public:
    PolymorphicCallCase() = default;
    
    PolymorphicCallCase(CallVariant variant, CodeBlock* codeBlock)
        : m_variant(variant)
        , m_codeBlock(codeBlock)
    {
    }
    
    CallVariant variant() const { return m_variant; }
    CodeBlock* codeBlock() const { return m_codeBlock; }
    
    void dump(PrintStream&) const;
    
private:
    CallVariant m_variant;
    CodeBlock* const m_codeBlock { nullptr };
};

class PolymorphicCallStubRoutine final : public GCAwareJITStubRoutine, public ButterflyArray<PolymorphicCallStubRoutine, PolymorphicCallNode, CallSlot> {
public:
    using Base = GCAwareJITStubRoutine;
    friend class JITStubRoutine;

    CallVariantList variants() const;
    bool hasEdges() const;
    CallEdgeList edges() const;

    void clearCallNodesFor(CallLinkInfo*);

    template<typename Functor>
    void forEachDependentCell(const Functor& functor) const
    {
        for (unsigned i = 0, size = std::size(trailingSpan()) - 1; i < size; ++i)
            functor(trailingSpan()[i].m_calleeOrExecutable);
    }

    static Ref<PolymorphicCallStubRoutine> create(const MacroAssemblerCodeRef<JITStubRoutinePtrTag>& code, VM& vm, JSCell* owner, CallFrame* callerFrame, CallLinkInfo& callLinkInfo, const Vector<CallSlot, 16>& callSlots, bool notUsingCounting, bool isClosureCall)
    {
        return adoptRef(*createImpl(callSlots.size(), callSlots.size() + /* sentinel */ 1, code, vm, owner, callerFrame, callLinkInfo, callSlots, notUsingCounting, isClosureCall));
    }

    PolymorphicCallStubRoutine(unsigned headerSize, unsigned trailingSize, const MacroAssemblerCodeRef<JITStubRoutinePtrTag>&, VM&, JSCell* owner, CallFrame* callerFrame, CallLinkInfo&, const Vector<CallSlot, 16>&, bool notUsingCounting, bool isClosureCall);

    using ButterflyArray<PolymorphicCallStubRoutine, PolymorphicCallNode, CallSlot>::operator delete;

    CallLinkInfo* callLinkInfo() const { return m_callLinkInfo; }

    static void destroy(PolymorphicCallStubRoutine*);

    bool upgradeIfPossible(VM&, CodeBlock*, CodeBlock*, uint8_t);

    bool isClosureCall() const { return m_isClosureCall; }

private:
    void markRequiredObjectsImpl(AbstractSlotVisitor&);
    void markRequiredObjectsImpl(SlotVisitor&);

    bool visitWeakImpl(VM&);

    CallLinkInfo* m_callLinkInfo { nullptr };
    bool m_notUsingCounting : 1 { false };
    bool m_isClosureCall : 1 { false };
};

} // namespace JSC
