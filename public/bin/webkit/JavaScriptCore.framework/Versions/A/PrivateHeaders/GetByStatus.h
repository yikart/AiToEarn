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

#include "CacheableIdentifier.h"
#include "CallLinkStatus.h"
#include "CodeOrigin.h"
#include "ConcurrentJSLock.h"
#include "ExitFlag.h"
#include "GetByVariant.h"
#include "ICStatusMap.h"
#include "InlineCacheCompiler.h"
#include "ScopeOffset.h"
#include "StubInfoSummary.h"

namespace JSC {

class AccessCase;
class CodeBlock;
class JSModuleEnvironment;
class JSModuleNamespaceObject;
class ModuleNamespaceAccessCase;
class StructureStubInfo;

enum class CacheType : int8_t;

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(GetByStatus);

class GetByStatus final {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(GetByStatus);
public:
    enum State : uint8_t {
        // It's uncached so we have no information.
        NoInformation,
        // It's cached for a simple access to a known object property with
        // a possible structure chain and a possible specific value.
        Simple,
        // It's cached for a custom accessor with a possible structure chain.
        CustomAccessor,
        // It's cached for a megamorphic case.
        Megamorphic,
        // It's cached for an access to a module namespace object's binding.
        ModuleNamespace,
        // It's cached for an access to a proxy object's binding.
        ProxyObject,
        // It will likely take the slow path.
        LikelyTakesSlowPath,
        // It's known to take slow path. We also observed that the slow path was taken on StructureStubInfo.
        ObservedTakesSlowPath,
        // It will likely take the slow path and will make calls.
        MakesCalls,
        // It known to take paths that make calls. We also observed that the slow path was taken on StructureStubInfo.
        ObservedSlowPathAndMakesCalls,
    };

    GetByStatus()
        : m_state(NoInformation)
    {
    }
    
    explicit GetByStatus(State state)
        : m_state(state)
    {
        ASSERT(state == NoInformation || state == LikelyTakesSlowPath || state == ObservedTakesSlowPath || state == MakesCalls || state == ObservedSlowPathAndMakesCalls);
    }
    
    explicit GetByStatus(StubInfoSummary, StructureStubInfo*);
    
    GetByStatus(
        State state, bool wasSeenInJIT)
        : m_state(state)
        , m_wasSeenInJIT(wasSeenInJIT)
    {
    }

    static GetByStatus computeFor(CodeBlock* baselineBlock, ICStatusMap& baselineMap, ICStatusContextStack& dfgContextStack, CodeOrigin);
    static GetByStatus computeFor(const StructureSet&, UniquedStringImpl*);

    State state() const { return m_state; }
    
    bool isSet() const { return m_state != NoInformation; }
    explicit operator bool() const { return isSet(); }
    bool isSimple() const { return m_state == Simple; }
    bool isCustomAccessor() const { return m_state == CustomAccessor; }
    bool isMegamorphic() const { return m_state == Megamorphic; }
    bool isModuleNamespace() const { return m_state == ModuleNamespace; }
    bool isProxyObject() const { return m_state == ProxyObject; }

    size_t numVariants() const { return m_variants.size(); }
    const Vector<GetByVariant, 1>& variants() const { return m_variants; }
    const GetByVariant& at(size_t index) const { return m_variants[index]; }
    const GetByVariant& operator[](size_t index) const { return at(index); }

    bool takesSlowPath() const
    {
        return m_state == LikelyTakesSlowPath || m_state == ObservedTakesSlowPath || m_state == MakesCalls || m_state == ObservedSlowPathAndMakesCalls || m_state == CustomAccessor || m_state == ModuleNamespace || m_state == Megamorphic;
    }
    bool observedStructureStubInfoSlowPath() const { return m_state == ObservedTakesSlowPath || m_state == ObservedSlowPathAndMakesCalls; }
    bool makesCalls() const;
    
    GetByStatus slowVersion() const;
    
    bool wasSeenInJIT() const { return m_wasSeenInJIT; }
    
    // Attempts to reduce the set of variants to fit the given structure set. This may be approximate.
    void filter(const StructureSet&);

    JSModuleNamespaceObject* moduleNamespaceObject() const { return m_moduleNamespaceData->m_moduleNamespaceObject; }
    JSModuleEnvironment* moduleEnvironment() const { return m_moduleNamespaceData->m_moduleEnvironment; }
    ScopeOffset scopeOffset() const { return m_moduleNamespaceData->m_scopeOffset; }
    
    DECLARE_VISIT_AGGREGATE;
    template<typename Visitor> void markIfCheap(Visitor&);
    bool finalize(VM&); // Return true if this gets to live.

    bool appendVariant(const GetByVariant&);
    void shrinkToFit();

    void dump(PrintStream&) const;

    CacheableIdentifier singleIdentifier() const;

    bool viaGlobalProxy() const
    {
        if (m_variants.isEmpty())
            return false;
        return m_variants.first().viaGlobalProxy();
    }

#if ENABLE(JIT)
    CacheType preferredCacheType() const;
#endif
    
private:
    void merge(const GetByStatus&);
    
#if ENABLE(JIT)
    GetByStatus(const ModuleNamespaceAccessCase&);
    static GetByStatus computeForStubInfoWithoutExitSiteFeedback(const ConcurrentJSLocker&, CodeBlock* profiledBlock, StructureStubInfo*, CallLinkStatus::ExitSiteData, CodeOrigin);
#endif
    static GetByStatus computeFromLLInt(CodeBlock*, BytecodeIndex);
    static GetByStatus computeFor(CodeBlock*, ICStatusMap&, ExitFlag, CallLinkStatus::ExitSiteData, CodeOrigin);

    struct ModuleNamespaceData {
        JSModuleNamespaceObject* m_moduleNamespaceObject { nullptr };
        JSModuleEnvironment* m_moduleEnvironment { nullptr };
        ScopeOffset m_scopeOffset { };
        CacheableIdentifier m_identifier;
    };

    Vector<GetByVariant, 1> m_variants;
    Box<ModuleNamespaceData> m_moduleNamespaceData;
    State m_state;
    bool m_wasSeenInJIT : 1 { false };
    bool m_containsDOMGetter : 1 { false };
};

} // namespace JSC
