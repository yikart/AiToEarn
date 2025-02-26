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

#include "ExitKind.h"
#include "JSCJSValue.h"
#include "ProfilerCompilationKind.h"
#include "ProfilerCompiledBytecode.h"
#include "ProfilerExecutionCounter.h"
#include "ProfilerJettisonReason.h"
#include "ProfilerOSRExit.h"
#include "ProfilerOSRExitSite.h"
#include "ProfilerOriginStack.h"
#include "ProfilerProfiledBytecodes.h"
#include "ProfilerUID.h"
#include <wtf/ObjectIdentifier.h>
#include <wtf/RefCounted.h>
#include <wtf/SegmentedVector.h>

namespace JSC {

class FireDetail;

namespace Profiler {

class Bytecodes;
class Database;
class Dumper;

// Represents the act of executing some bytecodes in some engine, and does
// all of the counting for those executions.

class Compilation : public RefCounted<Compilation> {
public:
    Compilation(Bytecodes*, CompilationKind);
    ~Compilation();
    
    void addProfiledBytecodes(Database&, CodeBlock*);
    unsigned profiledBytecodesSize() const { return m_profiledBytecodes.size(); }
    const ProfiledBytecodes& profiledBytecodesAt(unsigned i) const { return m_profiledBytecodes[i]; }
    
    void noticeInlinedGetById() { m_numInlinedGetByIds++; }
    void noticeInlinedPutById() { m_numInlinedPutByIds++; }
    void noticeInlinedCall() { m_numInlinedCalls++; }
    
    Bytecodes* bytecodes() const { return m_bytecodes; }
    CompilationKind kind() const { return m_kind; }
    
    void addDescription(const CompiledBytecode&);
    void addDescription(const OriginStack&, const CString& description);
    ExecutionCounter* executionCounterFor(const OriginStack&);
    void addOSRExitSite(const Vector<CodePtr<JSInternalPtrTag>>& codeAddresses);
    OSRExit* addOSRExit(unsigned id, const OriginStack&, ExitKind, bool isWatchpoint);
    
    void setJettisonReason(JettisonReason, const FireDetail*);
    
    UID uid() const { return m_uid; }
    
    void dump(PrintStream&) const;
    Ref<JSON::Value> toJSON(Dumper&) const;
    
private:
    CompilationKind m_kind;
    Bytecodes* m_bytecodes;
    Vector<ProfiledBytecodes> m_profiledBytecodes;
    Vector<CompiledBytecode> m_descriptions;
    UncheckedKeyHashMap<OriginStack, std::unique_ptr<ExecutionCounter>> m_counters;
    Vector<OSRExitSite> m_osrExitSites;
    SegmentedVector<OSRExit> m_osrExits;
    unsigned m_numInlinedGetByIds;
    unsigned m_numInlinedPutByIds;
    unsigned m_numInlinedCalls;
    JettisonReason m_jettisonReason;
    CString m_additionalJettisonReason;
    UID m_uid;
};

} } // namespace JSC::Profiler
