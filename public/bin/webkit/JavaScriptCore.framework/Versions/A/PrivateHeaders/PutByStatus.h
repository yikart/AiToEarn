/*
 * Copyright (C) 2012-2021 Apple Inc. All rights reserved.
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

#include "CallLinkStatus.h"
#include "ExitFlag.h"
#include "ICStatusMap.h"
#include "PrivateFieldPutKind.h"
#include "PutByVariant.h"
#include "StubInfoSummary.h"

namespace JSC {

class CodeBlock;
class VM;
class JSGlobalObject;
class Structure;
class StructureChain;
class StructureStubInfo;

typedef UncheckedKeyHashMap<CodeOrigin, StructureStubInfo*, CodeOriginApproximateHash> StubInfoMap;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(PutByStatus);

class PutByStatus final {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(PutByStatus);
public:
    enum State {
        // It's uncached so we have no information.
        NoInformation,
        // It's cached as a simple store of some kind.
        Simple,
        // It's cached for a custom accessor with a possible structure chain.
        CustomAccessor,
        // It's cached for a proxy object.
        ProxyObject,
        // It's cached for a megamorphic case.
        Megamorphic,
        // It will likely take the slow path.
        LikelyTakesSlowPath,
        // It's known to take slow path. We also observed that the slow path was taken on StructureStubInfo.
        ObservedTakesSlowPath,
        // It will likely take the slow path and will make calls.
        MakesCalls,
        // It known to take paths that make calls. We also observed that the slow path was taken on StructureStubInfo.
        ObservedSlowPathAndMakesCalls,
    };
    
    PutByStatus()
        : m_state(NoInformation)
    {
    }
    
    explicit PutByStatus(State state)
        : m_state(state)
    {
#if ASSERT_ENABLED
        switch (m_state) {
        case NoInformation:
        case LikelyTakesSlowPath:
        case ObservedTakesSlowPath:
        case MakesCalls:
        case ObservedSlowPathAndMakesCalls:
        case Megamorphic:
        case ProxyObject:
            break;
        default:
            RELEASE_ASSERT_NOT_REACHED();
            break;
        }
#endif
    }
    
    explicit PutByStatus(StubInfoSummary, StructureStubInfo&);
    
    PutByStatus(const PutByVariant& variant)
        : m_state(Simple)
    {
        m_variants.append(variant);
    }
    
    static PutByStatus computeFor(CodeBlock*, ICStatusMap&, BytecodeIndex, ExitFlag, CallLinkStatus::ExitSiteData);
    static PutByStatus computeFor(JSGlobalObject*, const StructureSet&, CacheableIdentifier, bool isDirect, PrivateFieldPutKind);
    
    static PutByStatus computeFor(CodeBlock* baselineBlock, ICStatusMap& baselineMap, ICStatusContextStack&, CodeOrigin);

#if ENABLE(JIT)
    static PutByStatus computeForStubInfo(const ConcurrentJSLocker&, CodeBlock* baselineBlock, StructureStubInfo*, CodeOrigin);
#endif
    
    State state() const { return m_state; }
    
    bool isSet() const { return m_state != NoInformation; }
    bool operator!() const { return m_state == NoInformation; }
    bool isSimple() const { return m_state == Simple; }
    bool isCustomAccessor() const { return m_state == CustomAccessor; }
    bool isMegamorphic() const { return m_state == Megamorphic; }
    bool isProxyObject() const { return m_state == ProxyObject; }
    bool takesSlowPath() const
    {
        switch (m_state) {
        case CustomAccessor:
        case Megamorphic:
        case LikelyTakesSlowPath:
        case ObservedTakesSlowPath:
            return true;
        default:
            return false;
        }
    }
    bool makesCalls() const;
    PutByStatus slowVersion() const;
    bool observedStructureStubInfoSlowPath() const { return m_state == ObservedTakesSlowPath || m_state == ObservedSlowPathAndMakesCalls; }
    
    size_t numVariants() const { return m_variants.size(); }
    const Vector<PutByVariant, 1>& variants() const { return m_variants; }
    const PutByVariant& at(size_t index) const { return m_variants[index]; }
    const PutByVariant& operator[](size_t index) const { return at(index); }
    CacheableIdentifier singleIdentifier() const;

    bool viaGlobalProxy() const
    {
        if (m_variants.isEmpty())
            return false;
        return m_variants.first().viaGlobalProxy();
    }

    DECLARE_VISIT_AGGREGATE;
    template<typename Visitor> void markIfCheap(Visitor&);
    bool finalize(VM&);
    
    void merge(const PutByStatus&);
    
    void filter(const StructureSet&);
    
    void dump(PrintStream&) const;
    
private:
#if ENABLE(JIT)
    static PutByStatus computeForStubInfo(const ConcurrentJSLocker&, CodeBlock*, StructureStubInfo*, CallLinkStatus::ExitSiteData, CodeOrigin);
#endif
    static PutByStatus computeFromLLInt(CodeBlock*, BytecodeIndex);
    
    bool appendVariant(const PutByVariant&);
    void shrinkToFit();
    
    State m_state;
    Vector<PutByVariant, 1> m_variants;
};

} // namespace JSC
