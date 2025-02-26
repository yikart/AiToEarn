/*
 * Copyright (C) 2013-2023 Apple Inc. All rights reserved.
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

#if ENABLE(FTL_JIT)

#include "DFGCommonData.h"
#include "FTLLazySlowPath.h"
#include "FTLOSRExit.h"
#include "JITCode.h"
#include "JITOpaqueByproducts.h"

namespace JSC {

class TrackedReferences;

namespace FTL {

class JITCode : public JSC::JITCode {
public:
    JITCode();
    ~JITCode() override;

    CodePtr<JSEntryPtrTag> addressForCall(ArityCheckMode) override;
    void* executableAddressAtOffset(size_t offset) override;
    void* dataAddressAtOffset(size_t offset) override;
    unsigned offsetOf(void* pointerIntoCode) override;
    size_t size() override;
    bool contains(void*) override;

    void initializeB3Code(CodeRef<JSEntryPtrTag>);
    void initializeB3Byproducts(std::unique_ptr<OpaqueByproducts>);
    void initializeAddressForCall(CodePtr<JSEntryPtrTag>);
    void initializeAddressForArityCheck(CodePtr<JSEntryPtrTag>);
    
    void validateReferences(const TrackedReferences&) override;

    RegisterSetBuilder liveRegistersToPreserveAtExceptionHandlingCallSite(CodeBlock*, CallSiteIndex) override;

    std::optional<CodeOrigin> findPC(CodeBlock*, void* pc) override;

    CodeRef<JSEntryPtrTag> b3Code() const { return m_b3Code; }
    
    JITCode* ftl() override;
    DFG::CommonData* dfgCommon() override;
    const DFG::CommonData* dfgCommon() const override;
    static constexpr ptrdiff_t commonDataOffset() { return OBJECT_OFFSETOF(JITCode, common); }
    void shrinkToFit() override;

    bool isUnlinked() const { return common.isUnlinked(); }

    PCToCodeOriginMap* pcToCodeOriginMap() override { return common.m_pcToCodeOriginMap.get(); }

    const RegisterAtOffsetList* calleeSaveRegisters() const { return &m_calleeSaveRegisters; }
    
    DFG::CommonData common;
    Vector<OSRExit> m_osrExit;
    RegisterAtOffsetList m_calleeSaveRegisters;
    SegmentedVector<OSRExitDescriptor, 8> osrExitDescriptors;
    Vector<std::unique_ptr<LazySlowPath>> lazySlowPaths;
    
private:
    CodeRef<JSEntryPtrTag> m_b3Code;
    std::unique_ptr<OpaqueByproducts> m_b3Byproducts;
    CodePtr<JSEntryPtrTag> m_addressForArityCheck;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
