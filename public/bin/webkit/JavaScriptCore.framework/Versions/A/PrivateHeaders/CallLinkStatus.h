/*
 * Copyright (C) 2012-2023 Apple Inc. All rights reserved.
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

#include "CallLinkInfo.h"
#include "CallVariant.h"
#include "CodeOrigin.h"
#include "ConcurrentJSLock.h"
#include "ExitFlag.h"
#include "ICStatusMap.h"
#include "JSCJSValue.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

class CodeBlock;
class InternalFunction;
class JSFunction;
class Structure;
class CallLinkInfo;

class CallLinkStatus final {
    WTF_MAKE_TZONE_ALLOCATED(CallLinkStatus);
public:
    CallLinkStatus()
    {
    }
    
    static CallLinkStatus takesSlowPath()
    {
        CallLinkStatus result;
        result.m_couldTakeSlowPath = true;
        return result;
    }
    
    explicit CallLinkStatus(JSValue);
    
    CallLinkStatus(CallVariant variant)
        : m_variants(1, variant)
    {
    }
    
    struct ExitSiteData {
        ExitFlag takesSlowPath;
        ExitFlag badFunction;
    };
    static ExitSiteData computeExitSiteData(CodeBlock*, BytecodeIndex);
    
    static CallLinkStatus computeFor(CodeBlock*, BytecodeIndex, const ICStatusMap&, ExitSiteData);
    static CallLinkStatus computeFor(CodeBlock*, BytecodeIndex, const ICStatusMap&);

#if ENABLE(JIT)
    // Computes the status assuming that we never took slow path and never previously
    // exited.
    static CallLinkStatus computeFor(const ConcurrentJSLocker&, CodeBlock*, CallLinkInfo&);
    
    // Computes the status accounting for exits.
    static CallLinkStatus computeFor(
        const ConcurrentJSLocker&, CodeBlock*, CallLinkInfo&, ExitSiteData, ExitingInlineKind = ExitFromAnyInlineKind);
#endif
    
    static CallLinkStatus computeFor(
        CodeBlock*, CodeOrigin, const ICStatusMap&, const ICStatusContextStack&);
    
    void setProvenConstantCallee(CallVariant);
    
    bool isSet() const { return !m_variants.isEmpty() || m_couldTakeSlowPath; }
    
    explicit operator bool() const { return isSet(); }
    
    bool couldTakeSlowPath() const { return m_couldTakeSlowPath; }
    
    void setCouldTakeSlowPath(bool value) { m_couldTakeSlowPath = value; }
    
    CallVariantList variants() const { return m_variants; }
    unsigned size() const { return m_variants.size(); }
    CallVariant at(unsigned i) const { return m_variants[i]; }
    CallVariant operator[](unsigned i) const { return at(i); }
    bool isProved() const { return m_isProved; }
    bool isBasedOnStub() const { return m_isBasedOnStub; }
    bool canOptimize() const { return !m_variants.isEmpty(); }

    bool isClosureCall() const; // Returns true if any callee is a closure call.
    
    unsigned maxArgumentCountIncludingThisForVarargs() const { return m_maxArgumentCountIncludingThisForVarargs; }
    
    bool finalize(VM&);
    
    void merge(const CallLinkStatus&);
    
    void filter(JSValue);
    
    void dump(PrintStream&) const;
    
private:
    void makeClosureCall();
    
#if ENABLE(JIT)
    static CallLinkStatus computeFromCallLinkInfo(
        const ConcurrentJSLocker&, CallLinkInfo&);
#endif
    
    void accountForExits(ExitSiteData, ExitingInlineKind);
    
    CallVariantList m_variants;
    bool m_couldTakeSlowPath { false };
    bool m_isProved { false };
    bool m_isBasedOnStub { false };
    uint8_t m_maxArgumentCountIncludingThisForVarargs { 0 }; // More than UINT8_MAX will be recorded as UINT8_MAX.
};

} // namespace JSC
