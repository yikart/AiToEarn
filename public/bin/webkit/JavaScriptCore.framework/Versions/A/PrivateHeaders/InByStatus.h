/*
 * Copyright (C) 2018 Yusuke Suzuki <utatane.tea@gmail.com>.
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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
#include "CodeOrigin.h"
#include "ConcurrentJSLock.h"
#include "ICStatusMap.h"
#include "InByVariant.h"
#include "StubInfoSummary.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

class AccessCase;
class CodeBlock;
class StructureStubInfo;

class InByStatus final {
    WTF_MAKE_TZONE_ALLOCATED(InByStatus);
public:
    enum State {
        // It's uncached so we have no information.
        NoInformation,
        // It's cached for a simple access to a known object property with
        // a possible structure chain and a possible specific value.
        Simple,
        // It's cached for a proxy object case.
        ProxyObject,
        // It's cached for a megamorphic case.
        Megamorphic,
        // It's known to often take slow path.
        TakesSlowPath,
    };

    InByStatus() = default;

    InByStatus(State state)
        : m_state(state)
    {
        ASSERT(state != Simple);
    }

    explicit InByStatus(StubInfoSummary summary)
    {
        switch (summary) {
        case StubInfoSummary::NoInformation:
            m_state = NoInformation;
            return;
        case StubInfoSummary::Simple:
        case StubInfoSummary::Megamorphic:
        case StubInfoSummary::MakesCalls:
            RELEASE_ASSERT_NOT_REACHED();
            return;
        case StubInfoSummary::TakesSlowPath:
        case StubInfoSummary::TakesSlowPathAndMakesCalls:
            m_state = TakesSlowPath;
            return;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

    static InByStatus computeFor(CodeBlock*, ICStatusMap&, BytecodeIndex, ExitFlag, CallLinkStatus::ExitSiteData callExitSiteData, CodeOrigin);
    static InByStatus computeFor(CodeBlock* baselineBlock, ICStatusMap& baselineMap, ICStatusContextStack&, CodeOrigin);

    State state() const { return m_state; }

    bool isSet() const { return m_state != NoInformation; }
    explicit operator bool() const { return isSet(); }
    bool isSimple() const { return m_state == Simple; }
    bool isMegamorphic() const { return m_state == Megamorphic; }
    bool isProxyObject() const { return m_state == ProxyObject; }

    size_t numVariants() const { return m_variants.size(); }
    const Vector<InByVariant, 1>& variants() const { return m_variants; }
    const InByVariant& at(size_t index) const { return m_variants[index]; }
    const InByVariant& operator[](size_t index) const { return at(index); }

    bool takesSlowPath() const { return m_state == Megamorphic || m_state == TakesSlowPath; }
    
    void merge(const InByStatus&);

    // Attempts to reduce the set of variants to fit the given structure set. This may be approximate.
    void filter(const StructureSet&);
    
    DECLARE_VISIT_AGGREGATE;
    template<typename Visitor> void markIfCheap(Visitor&);
    bool finalize(VM&);

    void dump(PrintStream&) const;

    CacheableIdentifier singleIdentifier() const;

private:
#if ENABLE(DFG_JIT)
    static InByStatus computeForStubInfoWithoutExitSiteFeedback(const ConcurrentJSLocker&, CodeBlock*, StructureStubInfo*, CallLinkStatus::ExitSiteData, CodeOrigin);
#endif
    bool appendVariant(const InByVariant&);
    void shrinkToFit();

    State m_state { NoInformation };
    Vector<InByVariant, 1> m_variants;
};

} // namespace JSC
