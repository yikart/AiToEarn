/*
 * Copyright (C) 2013-2018 Apple Inc. All rights reserved.
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

#if ENABLE(JIT)

#include "AssemblyHelpers.h"
#include "CCallHelpers.h"
#include "CacheableIdentifier.h"
#include "CodeOrigin.h"
#include "JITOperationValidation.h"
#include "JITOperations.h"
#include "JSCJSValue.h"
#include "RegisterSet.h"

namespace JSC {
namespace DFG {
class JITCompiler;
struct UnlinkedStructureStubInfo;
}

class CallSiteIndex;
class CodeBlock;
class JIT;
class StructureStubInfo;
struct UnlinkedStructureStubInfo;
struct BaselineUnlinkedStructureStubInfo;

enum class AccessType : int8_t;
enum class CacheType : int8_t;
enum class JITType : uint8_t;

using CompileTimeStructureStubInfo = std::variant<StructureStubInfo*, BaselineUnlinkedStructureStubInfo*, DFG::UnlinkedStructureStubInfo*>;

class JITInlineCacheGenerator {
protected:
    JITInlineCacheGenerator() = default;
    JITInlineCacheGenerator(CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, AccessType);
    
public:
    StructureStubInfo* stubInfo() const { return m_stubInfo; }

    void reportSlowPathCall(CCallHelpers::Label slowPathBegin, CCallHelpers::Call call)
    {
        m_slowPathBegin = slowPathBegin;
        m_slowPathCall = call;
    }

    CCallHelpers::Label slowPathBegin() const { return m_slowPathBegin; }

    void reportBaselineDataICSlowPathBegin(CCallHelpers::Label slowPathBegin)
    {
        m_slowPathBegin = slowPathBegin;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer,
        CodeLocationLabel<JITStubRoutinePtrTag> start);

    JSC::UnlinkedStructureStubInfo* m_unlinkedStubInfo { nullptr };

    template<typename StubInfo>
    static void setUpStubInfoImpl(StubInfo& stubInfo, CodeBlock* codeBlock, AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters)
    {
        stubInfo.accessType = accessType;
        stubInfo.preconfiguredCacheType = cacheType;
        if constexpr (std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.bytecodeIndex = codeOrigin.bytecodeIndex();
            UNUSED_PARAM(callSiteIndex);
            UNUSED_PARAM(usedRegisters);
            UNUSED_PARAM(codeBlock);
        } else {
            stubInfo.codeOrigin = codeOrigin;
            stubInfo.callSiteIndex = callSiteIndex;
            stubInfo.usedRegisters = usedRegisters.buildScalarRegisterSet();
        }
        if constexpr (std::is_same_v<std::decay_t<StubInfo>, StructureStubInfo>) {
            if (codeOrigin.inlineCallFrame())
                stubInfo.m_globalObject = baselineCodeBlockForInlineCallFrame(codeOrigin.inlineCallFrame())->globalObject();
            else
                stubInfo.m_globalObject = codeBlock->globalObject();
        }
    }

    AccessType accessType() const { return m_accessType; }

protected:
    void generateDataICFastPath(CCallHelpers&, GPRReg stubInfoGPR);

    StructureStubInfo* m_stubInfo { nullptr };
    AccessType m_accessType;

public:
    CCallHelpers::Label m_start;
    CCallHelpers::Label m_done;
    CCallHelpers::Label m_slowPathBegin;
    CCallHelpers::Call m_slowPathCall;
};

class JITByIdGenerator : public JITInlineCacheGenerator {
protected:
    JITByIdGenerator() = default;

    JITByIdGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, AccessType,
        JSValueRegs base, JSValueRegs value);

public:
    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.isSet());
        return m_slowPathJump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    template<typename StubInfo>
    static void setUpStubInfoImpl(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs baseRegs, JSValueRegs valueRegs, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        stubInfo.m_identifier = propertyName;
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_valueGPR = valueRegs.payloadGPR();
            stubInfo.m_extraGPR = InvalidGPRReg;
            stubInfo.m_stubInfoGPR = stubInfoGPR;
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = valueRegs.tagGPR();
            stubInfo.m_extraTagGPR = InvalidGPRReg;
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(valueRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    
protected:
    
    void generateFastCommon(CCallHelpers&, size_t size);
    
    JSValueRegs m_base;
    JSValueRegs m_value;

public:
    CCallHelpers::Jump m_slowPathJump;
};

class JITGetByIdGenerator final : public JITByIdGenerator {
public:
    JITGetByIdGenerator() = default;

    JITGetByIdGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier,
        JSValueRegs base, JSValueRegs value, GPRReg stubInfoGPR, AccessType, CacheType);
    
    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs baseRegs, JSValueRegs valueRegs, GPRReg stubInfoGPR)
    {
        JITByIdGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters, propertyName, baseRegs, valueRegs, stubInfoGPR);
    }

private:
    bool m_isLengthAccess;
    CacheType m_cacheType;
};

class JITGetByIdWithThisGenerator final : public JITByIdGenerator {
public:
    JITGetByIdWithThisGenerator() = default;

    JITGetByIdWithThisGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier,
        JSValueRegs value, JSValueRegs base, JSValueRegs thisRegs, GPRReg stubInfoGPR);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs valueRegs, JSValueRegs baseRegs, JSValueRegs thisRegs, GPRReg stubInfoGPR)
    {
        JITByIdGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters, propertyName, baseRegs, valueRegs, stubInfoGPR);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_extraGPR = thisRegs.payloadGPR();
#if USE(JSVALUE32_64)
            stubInfo.m_extraTagGPR = thisRegs.tagGPR();
#endif
        } else
            UNUSED_PARAM(thisRegs);
    }
};

class JITPutByIdGenerator final : public JITByIdGenerator {
public:
    JITPutByIdGenerator() = default;

    JITPutByIdGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier,
        JSValueRegs base, JSValueRegs value, GPRReg stubInfoGPR, GPRReg scratch, AccessType);
    
    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs baseRegs, JSValueRegs valueRegs, GPRReg stubInfoGPR, GPRReg scratchGPR)
    {
        JITByIdGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters, propertyName, baseRegs, valueRegs, stubInfoGPR);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>)
            stubInfo.usedRegisters.remove(scratchGPR);
        else
            UNUSED_PARAM(scratchGPR);
    }
};

class JITPutByValGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITPutByValGenerator() = default;

    JITPutByValGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs property, JSValueRegs result, GPRReg arrayProfileGPR, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs propertyRegs, JSValueRegs valueRegs, GPRReg arrayProfileGPR, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = propertyRegs.payloadGPR();
            stubInfo.m_valueGPR = valueRegs.payloadGPR();
            stubInfo.m_stubInfoGPR = stubInfoGPR;
            if constexpr (!std::is_same_v<std::decay_t<StubInfo>, DFG::UnlinkedStructureStubInfo>)
                stubInfo.m_arrayProfileGPR = arrayProfileGPR;
            else
                UNUSED_PARAM(arrayProfileGPR);
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = valueRegs.tagGPR();
            stubInfo.m_extraTagGPR = propertyRegs.tagGPR();
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(propertyRegs);
            UNUSED_PARAM(valueRegs);
            UNUSED_PARAM(stubInfoGPR);
            UNUSED_PARAM(arrayProfileGPR);
        }
    }

    JSValueRegs m_base;
    JSValueRegs m_value;

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITDelByValGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITDelByValGenerator() = default;

    JITDelByValGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs property, JSValueRegs result, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs propertyRegs, JSValueRegs resultRegs, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = propertyRegs.payloadGPR();
            stubInfo.m_valueGPR = resultRegs.payloadGPR();
            stubInfo.m_stubInfoGPR = stubInfoGPR;
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = resultRegs.tagGPR();
            stubInfo.m_extraTagGPR = propertyRegs.tagGPR();
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(propertyRegs);
            UNUSED_PARAM(resultRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITDelByIdGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITDelByIdGenerator() = default;

    JITDelByIdGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters, CacheableIdentifier,
        JSValueRegs base, JSValueRegs result, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs baseRegs, JSValueRegs resultRegs, GPRReg stubInfoGPR)
    {
        JITByIdGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters, propertyName, baseRegs, resultRegs, stubInfoGPR);
    }

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITInByValGenerator : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITInByValGenerator() = default;

    JITInByValGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs property, JSValueRegs result, GPRReg arrayProfileGPR, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs propertyRegs, JSValueRegs resultRegs, GPRReg arrayProfileGPR, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = propertyRegs.payloadGPR();
            stubInfo.m_valueGPR = resultRegs.payloadGPR();
            stubInfo.m_stubInfoGPR = stubInfoGPR;
            if constexpr (!std::is_same_v<std::decay_t<StubInfo>, DFG::UnlinkedStructureStubInfo>)
                stubInfo.m_arrayProfileGPR = arrayProfileGPR;
            else
                UNUSED_PARAM(arrayProfileGPR);
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = resultRegs.tagGPR();
            stubInfo.m_extraTagGPR = propertyRegs.tagGPR();
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(propertyRegs);
            UNUSED_PARAM(resultRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITInByIdGenerator final : public JITByIdGenerator {
public:
    JITInByIdGenerator() = default;

    JITInByIdGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier,
        JSValueRegs base, JSValueRegs value, GPRReg stubInfoGPR);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters, CacheableIdentifier propertyName,
        JSValueRegs baseRegs, JSValueRegs valueRegs, GPRReg stubInfoGPR)
    {
        JITByIdGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters, propertyName, baseRegs, valueRegs, stubInfoGPR);
    }
};

class JITInstanceOfGenerator final : public JITInlineCacheGenerator {
public:
    using Base = JITInlineCacheGenerator;
    JITInstanceOfGenerator() = default;
    
    JITInstanceOfGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, const RegisterSetBuilder& usedRegisters, GPRReg result,
        GPRReg value, GPRReg prototype, GPRReg stubInfoGPR,
        bool prototypeIsKnownObject = false);
    
    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        GPRReg resultGPR, GPRReg valueGPR, GPRReg prototypeGPR, GPRReg stubInfoGPR, bool prototypeIsKnownObject)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        stubInfo.prototypeIsKnownObject = prototypeIsKnownObject;
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = valueGPR;
            stubInfo.m_valueGPR = resultGPR;
            stubInfo.m_extraGPR = prototypeGPR;
            stubInfo.m_stubInfoGPR = stubInfoGPR;
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = InvalidGPRReg;
            stubInfo.m_valueTagGPR = InvalidGPRReg;
            stubInfo.m_extraTagGPR = InvalidGPRReg;
#endif
        } else {
            UNUSED_PARAM(valueGPR);
            UNUSED_PARAM(resultGPR);
            UNUSED_PARAM(prototypeGPR);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITGetByValGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITGetByValGenerator() = default;

    JITGetByValGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs property, JSValueRegs result, GPRReg arrayProfileGPR, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);
    
    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    void generateEmptyPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs propertyRegs, JSValueRegs resultRegs, GPRReg arrayProfileGPR, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = propertyRegs.payloadGPR();
            stubInfo.m_valueGPR = resultRegs.payloadGPR();
            stubInfo.m_stubInfoGPR = stubInfoGPR;
            if constexpr (!std::is_same_v<std::decay_t<StubInfo>, DFG::UnlinkedStructureStubInfo>)
                stubInfo.m_arrayProfileGPR = arrayProfileGPR;
            else
                UNUSED_PARAM(arrayProfileGPR);
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = resultRegs.tagGPR();
            stubInfo.m_extraTagGPR = propertyRegs.tagGPR();
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(propertyRegs);
            UNUSED_PARAM(resultRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    JSValueRegs m_base;
    JSValueRegs m_result;

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITGetByValWithThisGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITGetByValWithThisGenerator() = default;

    JITGetByValWithThisGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs property, JSValueRegs thisRegs, JSValueRegs result, GPRReg arrayProfileGPR, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);

    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    void generateEmptyPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs propertyRegs, JSValueRegs thisRegs, JSValueRegs resultRegs, GPRReg arrayProfileGPR, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = thisRegs.payloadGPR();
            stubInfo.m_valueGPR = resultRegs.payloadGPR();
            stubInfo.m_extra2GPR = propertyRegs.payloadGPR();
            stubInfo.m_stubInfoGPR = stubInfoGPR;
            if constexpr (!std::is_same_v<std::decay_t<StubInfo>, DFG::UnlinkedStructureStubInfo>)
                stubInfo.m_arrayProfileGPR = arrayProfileGPR;
            else
                UNUSED_PARAM(arrayProfileGPR);
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_valueTagGPR = resultRegs.tagGPR();
            stubInfo.m_extraTagGPR = thisRegs.tagGPR();
            stubInfo.m_extra2TagGPR = propertyRegs.tagGPR();
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(propertyRegs);
            UNUSED_PARAM(thisRegs);
            UNUSED_PARAM(resultRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    JSValueRegs m_base;
    JSValueRegs m_result;

    CCallHelpers::PatchableJump m_slowPathJump;
};

class JITPrivateBrandAccessGenerator final : public JITInlineCacheGenerator {
    using Base = JITInlineCacheGenerator;
public:
    JITPrivateBrandAccessGenerator() = default;

    JITPrivateBrandAccessGenerator(
        CodeBlock*, CompileTimeStructureStubInfo, JITType, CodeOrigin, CallSiteIndex, AccessType, const RegisterSetBuilder& usedRegisters,
        JSValueRegs base, JSValueRegs brand, GPRReg stubInfoGPR);

    CCallHelpers::Jump slowPathJump() const
    {
        ASSERT(m_slowPathJump.m_jump.isSet());
        return m_slowPathJump.m_jump;
    }

    void finalize(
        LinkBuffer& fastPathLinkBuffer, LinkBuffer& slowPathLinkBuffer);
    
    void generateFastPath(CCallHelpers&);
    void generateDataICFastPath(CCallHelpers&);

    template<typename StubInfo>
    static void setUpStubInfo(StubInfo& stubInfo, CodeBlock* codeBlock,
        AccessType accessType, CacheType cacheType, CodeOrigin codeOrigin, CallSiteIndex callSiteIndex, const RegisterSetBuilder& usedRegisters,
        JSValueRegs baseRegs, JSValueRegs brandRegs, GPRReg stubInfoGPR)
    {
        JITInlineCacheGenerator::setUpStubInfoImpl(stubInfo, codeBlock, accessType, cacheType, codeOrigin, callSiteIndex, usedRegisters);
        if constexpr (!std::is_same_v<std::decay_t<StubInfo>, BaselineUnlinkedStructureStubInfo>) {
            stubInfo.m_baseGPR = baseRegs.payloadGPR();
            stubInfo.m_extraGPR = brandRegs.payloadGPR();
            stubInfo.m_valueGPR = InvalidGPRReg;
            stubInfo.m_stubInfoGPR = stubInfoGPR;
#if USE(JSVALUE32_64)
            stubInfo.m_baseTagGPR = baseRegs.tagGPR();
            stubInfo.m_extraTagGPR = brandRegs.tagGPR();
            stubInfo.m_valueTagGPR = InvalidGPRReg;
#endif
        } else {
            UNUSED_PARAM(baseRegs);
            UNUSED_PARAM(brandRegs);
            UNUSED_PARAM(stubInfoGPR);
        }
    }

    CCallHelpers::PatchableJump m_slowPathJump;
};

template<typename VectorType>
void finalizeInlineCaches(VectorType& vector, LinkBuffer& fastPath, LinkBuffer& slowPath)
{
    for (auto& entry : vector)
        entry.finalize(fastPath, slowPath);
}

template<typename VectorType>
void finalizeInlineCaches(VectorType& vector, LinkBuffer& linkBuffer)
{
    finalizeInlineCaches(vector, linkBuffer, linkBuffer);
}

} // namespace JSC

#endif // ENABLE(JIT)
