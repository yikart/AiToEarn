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

#include "CacheableIdentifier.h"
#include "CallLinkStatus.h"
#include "ObjectPropertyConditionSet.h"
#include "PropertyOffset.h"
#include "StructureSet.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {
namespace DOMJIT {
class GetterSetter;
}

class CallLinkStatus;
class InByStatus;
struct DumpContext;

class InByVariant {
    WTF_MAKE_TZONE_ALLOCATED(InByVariant);
public:
    InByVariant(CacheableIdentifier, const StructureSet& = StructureSet(), PropertyOffset = invalidOffset, const ObjectPropertyConditionSet& = ObjectPropertyConditionSet(), std::unique_ptr<CallLinkStatus> = nullptr);
    ~InByVariant();

    InByVariant(const InByVariant&);
    InByVariant& operator=(const InByVariant&);

    bool isSet() const { return !!m_structureSet.size(); }
    explicit operator bool() const { return isSet(); }
    const StructureSet& structureSet() const { return m_structureSet; }
    StructureSet& structureSet() { return m_structureSet; }

    // A non-empty condition set means that this is a prototype in-hit/in-miss.
    const ObjectPropertyConditionSet& conditionSet() const { return m_conditionSet; }

    PropertyOffset offset() const { return m_offset; }
    CallLinkStatus* callLinkStatus() const { return m_callLinkStatus.get(); }

    bool isHit() const { return offset() != invalidOffset; }

    bool attemptToMerge(const InByVariant& other);
    
    DECLARE_VISIT_AGGREGATE;
    template<typename Visitor> void markIfCheap(Visitor&);
    bool finalize(VM&);

    void dump(PrintStream&) const;
    void dumpInContext(PrintStream&, DumpContext*) const;

    CacheableIdentifier identifier() const { return m_identifier; }

    bool overlaps(const InByVariant& other)
    {
        if (!!m_identifier != !!other.m_identifier)
            return true;
        if (m_identifier) {
            if (m_identifier != other.m_identifier)
                return false;
        }
        return structureSet().overlaps(other.structureSet());
    }

private:
    friend class InByStatus;

    StructureSet m_structureSet;
    ObjectPropertyConditionSet m_conditionSet;
    PropertyOffset m_offset;
    CacheableIdentifier m_identifier;
    std::unique_ptr<CallLinkStatus> m_callLinkStatus;
};

} // namespace JSC
