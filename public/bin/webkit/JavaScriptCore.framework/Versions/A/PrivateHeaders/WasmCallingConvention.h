/*
 * Copyright (C) 2016-2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEBASSEMBLY)

#include "AllowMacroScratchRegisterUsage.h"
#include "CallFrame.h"
#include "LinkBuffer.h"
#include "RegisterAtOffsetList.h"
#include "RegisterSet.h"
#include "StackAlignment.h"
#include "WasmFormat.h"
#include "WasmTypeDefinition.h"
#include "WasmTypeDefinitionInlines.h"
#include "WasmValueLocation.h"

namespace JSC { namespace Wasm {

constexpr unsigned numberOfLLIntCalleeSaveRegisters = 2;
constexpr unsigned numberOfIPIntCalleeSaveRegisters = 3;
constexpr unsigned numberOfLLIntInternalRegisters = 2;
constexpr unsigned numberOfIPIntInternalRegisters = 2;

struct ArgumentLocation {
#if USE(JSVALUE32_64)
    ArgumentLocation(ValueLocation loc, Width width, Width usedWidth)
        : location(loc)
        , width(width)
        , usedWidth(usedWidth)
    {
    }
    ArgumentLocation(ValueLocation loc, Width width)
        : location(loc)
        , width(width)
        , usedWidth(width)
    {
    }
#else
    ArgumentLocation(ValueLocation loc, Width width)
        : location(loc)
        , width(width)
    {
    }
#endif // USE(JSVALUE32_64)

    ArgumentLocation() {}

    ValueLocation location;
    Width width;
#if USE(JSVALUE32_64)
    Width usedWidth;
#endif
};

enum class CallRole : uint8_t {
    Caller,
    Callee,
};

struct CallInformation {
    CallInformation(ArgumentLocation passedThisArgument, Vector<ArgumentLocation, 8>&& parameters, Vector<ArgumentLocation, 1>&& returnValues, size_t stackOffset)
        : thisArgument(passedThisArgument)
        , params(WTFMove(parameters))
        , results(WTFMove(returnValues))
        , headerAndArgumentStackSizeInBytes(stackOffset)
    { }

    RegisterAtOffsetList computeResultsOffsetList()
    {
        RegisterSet usedResultRegisters;
        for (auto loc : results) {
            if (loc.location.isGPR()) {
                usedResultRegisters.add(loc.location.jsr().payloadGPR(), IgnoreVectors);
#if USE(JSVALUE32_64)
                usedResultRegisters.add(loc.location.jsr().tagGPR(), IgnoreVectors);
#endif
            } else if (loc.location.isFPR()) {
                ASSERT(loc.width <= Width64 || argumentsOrResultsIncludeV128);
                usedResultRegisters.add(loc.location.fpr(), loc.width);
            }
        }

        RegisterAtOffsetList savedRegs(usedResultRegisters, RegisterAtOffsetList::ZeroBased);
        return savedRegs;
    }

    bool argumentsIncludeI64 : 1 { false };
    bool resultsIncludeI64 : 1 { false };
    bool argumentsOrResultsIncludeV128 : 1 { false };
    ArgumentLocation thisArgument;
    Vector<ArgumentLocation, 8> params;
    Vector<ArgumentLocation, 1> results;
    // As a callee this includes CallerFrameAndPC as a caller it does not.
    size_t headerAndArgumentStackSizeInBytes;
};

class WasmCallingConvention {
public:
    static constexpr unsigned headerSizeInBytes = CallFrame::headerSizeInRegisters * sizeof(Register);

    WasmCallingConvention(Vector<JSValueRegs>&& jsrs, Vector<FPRReg>&& fprs, Vector<GPRReg>&& scratches, RegisterSetBuilder&& calleeSaves)
        : jsrArgs(WTFMove(jsrs))
        , fprArgs(WTFMove(fprs))
        , prologueScratchGPRs(WTFMove(scratches))
        , calleeSaveRegisters(calleeSaves.buildAndValidate())
    { }

    WTF_MAKE_NONCOPYABLE(WasmCallingConvention);

private:
    template <typename RegType>
    ArgumentLocation marshallRegs(const Vector<RegType>& regArgs, size_t& count, size_t valueSize, Width width) const
    {
        if constexpr (std::is_same<RegType, JSValueRegs>::value) {
            JSValueRegs jsr = regArgs[count++];
#if USE(JSVALUE32_64)
                if (valueSize == 4)
                    return ArgumentLocation { ValueLocation { jsr }, width , Width32 };
#else
                UNUSED_PARAM(valueSize);
#endif
            return ArgumentLocation { ValueLocation { jsr }, width };
        } else
            return ArgumentLocation { ValueLocation { regArgs[count++] }, width };
    }

    template<typename RegType>
    ArgumentLocation marshallLocationImpl(CallRole role, const Vector<RegType>& regArgs, size_t& count, size_t& stackOffset, size_t valueSize) const
    {
        size_t alignedSize = WTF::roundUpToMultipleOf(valueSize, sizeof(Register));
        Width width = widthForBytes(alignedSize);

        if (count < regArgs.size())
            return marshallRegs(regArgs, count, valueSize, width);

        count++;
        ArgumentLocation result = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), width };
        stackOffset += alignedSize;
        return result;
    }

    ArgumentLocation marshallLocation(CallRole role, Type valueType, size_t& gpArgumentCount, size_t& fpArgumentCount, size_t& stackOffset) const
    {
        ASSERT(isValueType(valueType));
        unsigned valueSize = bytesForWidth(valueType.width());
        switch (valueType.kind) {
        case TypeKind::I32:
        case TypeKind::I64:
        case TypeKind::Funcref:
        case TypeKind::Exn:
        case TypeKind::Externref:
        case TypeKind::Ref:
        case TypeKind::RefNull:
            return marshallLocationImpl(role, jsrArgs, gpArgumentCount, stackOffset, valueSize);
        case TypeKind::F32:
        case TypeKind::F64:
        case TypeKind::V128:
            return marshallLocationImpl(role, fprArgs, fpArgumentCount, stackOffset, valueSize);
        default:
            break;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

public:
    uint32_t numberOfStackResults(const FunctionSignature& signature) const
    {
        const uint32_t gprCount = jsrArgs.size();
        const uint32_t fprCount = fprArgs.size();
        uint32_t gprIndex = 0;
        uint32_t fprIndex = 0;
        uint32_t stackCount = 0;
        for (uint32_t i = 0; i < signature.returnCount(); i++) {
            switch (signature.returnType(i).kind) {
            case TypeKind::I32:
            case TypeKind::I64:
            case TypeKind::Exn:
            case TypeKind::Externref:
            case TypeKind::Funcref:
            case TypeKind::RefNull:
            case TypeKind::Ref:
                if (gprIndex < gprCount)
                    ++gprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::F32:
            case TypeKind::F64:
            case TypeKind::V128:
                if (fprIndex < fprCount)
                    ++fprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::Void:
            case TypeKind::Func:
            case TypeKind::Struct:
            case TypeKind::Structref:
            case TypeKind::Array:
            case TypeKind::Arrayref:
            case TypeKind::Eqref:
            case TypeKind::Anyref:
            case TypeKind::Nullref:
            case TypeKind::Nullfuncref:
            case TypeKind::Nullexternref:
            case TypeKind::I31ref:
            case TypeKind::Sub:
            case TypeKind::Subfinal:
            case TypeKind::Rec:
                RELEASE_ASSERT_NOT_REACHED();
            }
        }
        return stackCount;
    }

    uint32_t numberOfStackArguments(const FunctionSignature& signature) const
    {
        const uint32_t gprCount = jsrArgs.size();
        const uint32_t fprCount = fprArgs.size();
        uint32_t gprIndex = 0;
        uint32_t fprIndex = 0;
        uint32_t stackCount = 0;
        for (uint32_t i = 0; i < signature.argumentCount(); i++) {
            switch (signature.argumentType(i).kind) {
            case TypeKind::I32:
            case TypeKind::I64:
            case TypeKind::Exn:
            case TypeKind::Externref:
            case TypeKind::Funcref:
            case TypeKind::RefNull:
            case TypeKind::Ref:
                if (gprIndex < gprCount)
                    ++gprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::F32:
            case TypeKind::F64:
            case TypeKind::V128:
                if (fprIndex < fprCount)
                    ++fprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::Void:
            case TypeKind::Func:
            case TypeKind::Struct:
            case TypeKind::Structref:
            case TypeKind::Array:
            case TypeKind::Arrayref:
            case TypeKind::Eqref:
            case TypeKind::Anyref:
            case TypeKind::Nullref:
            case TypeKind::Nullfuncref:
            case TypeKind::Nullexternref:
            case TypeKind::I31ref:
            case TypeKind::Sub:
            case TypeKind::Subfinal:
            case TypeKind::Rec:
                RELEASE_ASSERT_NOT_REACHED();
            }
        }
        return stackCount;
    }

    uint32_t numberOfStackValues(const FunctionSignature& signature) const
    {
        return std::max(numberOfStackArguments(signature), numberOfStackResults(signature));
    }

    CallInformation callInformationFor(const TypeDefinition& type, CallRole role = CallRole::Caller) const
    {
        const auto& signature = *type.as<FunctionSignature>();
        return callInformationFor(signature, role);
    }

    CallInformation callInformationFor(const FunctionSignature& signature, CallRole role = CallRole::Caller) const
    {
        bool argumentsIncludeI64 = false;
        bool resultsIncludeI64 = false;
        bool argumentsOrResultsIncludeV128 = false;
        size_t gpArgumentCount = 0;
        size_t fpArgumentCount = 0;
        size_t headerSize = headerSizeInBytes;
        if (role == CallRole::Caller)
            headerSize -= sizeof(CallerFrameAndPC);

        ArgumentLocation thisArgument = { role == CallRole::Caller ? ValueLocation::stackArgument(headerSize) : ValueLocation::stack(headerSize), widthForBytes(sizeof(void*)) };
        headerSize += sizeof(Register);

        size_t argStackOffset = headerSize;
        Vector<ArgumentLocation, 8> params(signature.argumentCount());
        for (size_t i = 0; i < signature.argumentCount(); ++i) {
            argumentsIncludeI64 |= signature.argumentType(i).isI64();
            argumentsOrResultsIncludeV128 |= signature.argumentType(i).isV128();
            params[i] = marshallLocation(role, signature.argumentType(i), gpArgumentCount, fpArgumentCount, argStackOffset);
        }
        uint32_t stackArgs = argStackOffset - headerSize;
        gpArgumentCount = 0;
        fpArgumentCount = 0;

        uint32_t stackResults = numberOfStackResults(signature) * sizeof(Register);
        uint32_t stackCountAligned = WTF::roundUpToMultipleOf<stackAlignmentBytes()>(std::max(stackArgs, stackResults));
        size_t resultStackOffset = headerSize + stackCountAligned - stackResults;
        Vector<ArgumentLocation, 1> results(signature.returnCount());
        for (size_t i = 0; i < signature.returnCount(); ++i) {
            resultsIncludeI64 |= signature.returnType(i).isI64();
            argumentsOrResultsIncludeV128 |= signature.returnType(i).isV128();
            results[i] = marshallLocation(role, signature.returnType(i), gpArgumentCount, fpArgumentCount, resultStackOffset);
        }

        CallInformation result(thisArgument, WTFMove(params), WTFMove(results), std::max(argStackOffset, resultStackOffset));
        result.argumentsIncludeI64 = argumentsIncludeI64;
        result.resultsIncludeI64 = resultsIncludeI64;
        result.argumentsOrResultsIncludeV128 = argumentsOrResultsIncludeV128;
        return result;
    }

    RegisterSet argumentGPRs() const { return RegisterSetBuilder::argumentGPRs(); }

    const Vector<JSValueRegs> jsrArgs;
    const Vector<FPRReg> fprArgs;
    const Vector<GPRReg> prologueScratchGPRs;
    const RegisterSet calleeSaveRegisters;
};

class JSCallingConvention {
public:
    static constexpr unsigned headerSizeInBytes = CallFrame::headerSizeInRegisters * sizeof(Register);

    JSCallingConvention(Vector<JSValueRegs>&& gprs, Vector<FPRReg>&& fprs, RegisterSetBuilder&& calleeSaves)
        : jsrArgs(WTFMove(gprs))
        , fprArgs(WTFMove(fprs))
        , calleeSaveRegisters(calleeSaves.buildAndValidate())
    { }

    WTF_MAKE_NONCOPYABLE(JSCallingConvention);
private:
    template <typename RegType>
    ArgumentLocation marshallLocationImpl(CallRole role, const Vector<RegType>& regArgs, size_t& count, size_t& stackOffset) const
    {
        if (count < regArgs.size())
            return ArgumentLocation { ValueLocation { regArgs[count++] }, Width64 };

        count++;
        ArgumentLocation result = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), Width64 };
        stackOffset += sizeof(Register);
        return result;
    }

    ArgumentLocation marshallLocation(CallRole role, Type valueType, size_t& gpArgumentCount, size_t& fpArgumentCount, size_t& stackOffset) const
    {
        ASSERT(isValueType(valueType));
        switch (valueType.kind) {
        case TypeKind::I32:
        case TypeKind::I64:
        case TypeKind::Funcref:
        case TypeKind::Exn:
        case TypeKind::Externref:
        case TypeKind::Ref:
        case TypeKind::RefNull:
            return marshallLocationImpl(role, jsrArgs, gpArgumentCount, stackOffset);
        case TypeKind::F32:
        case TypeKind::F64:
            return marshallLocationImpl(role, fprArgs, fpArgumentCount, stackOffset);
        default:
            break;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

public:
    CallInformation callInformationFor(const TypeDefinition& signature, CallRole role = CallRole::Callee) const { return callInformationFor(*signature.as<FunctionSignature>(), role); }
    CallInformation callInformationFor(const FunctionSignature& signature, CallRole role = CallRole::Callee) const
    {
        size_t gpArgumentCount = 0;
        size_t fpArgumentCount = 0;
        size_t stackOffset = headerSizeInBytes;
        if (role == CallRole::Caller)
            stackOffset -= sizeof(CallerFrameAndPC);

        ArgumentLocation thisArgument = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), widthForBytes(sizeof(void*)) };
        stackOffset += sizeof(Register);

        Vector<ArgumentLocation, 8> params;
        for (size_t i = 0; i < signature.argumentCount(); ++i)
            params.append(marshallLocation(role, signature.argumentType(i), gpArgumentCount, fpArgumentCount, stackOffset));

        Vector<ArgumentLocation, 1> results { ArgumentLocation { ValueLocation { JSRInfo::returnValueJSR }, Width64 } };
        return CallInformation(thisArgument, WTFMove(params), WTFMove(results), stackOffset);
    }

    const Vector<JSValueRegs> jsrArgs;
    const Vector<FPRReg> fprArgs;
    const RegisterSet calleeSaveRegisters;
};

const JSCallingConvention& jsCallingConvention();
const WasmCallingConvention& wasmCallingConvention();

#if CPU(ARM_THUMB2)

class CCallingConventionArmThumb2 {
public:
    static constexpr unsigned headerSizeInBytes = 0;

    CCallingConventionArmThumb2(Vector<GPRReg>&& gprs, Vector<FPRReg>&& fprs, Vector<GPRReg>&& scratches, RegisterSetBuilder&& calleeSaves)
        : gprArgs(WTFMove(gprs))
        , fprArgs(WTFMove(fprs))
        , prologueScratchGPRs(WTFMove(scratches))
        , calleeSaveRegisters(calleeSaves.buildAndValidate())
    { }

    WTF_MAKE_NONCOPYABLE(CCallingConventionArmThumb2);

private:
    ArgumentLocation marshallLocationImplGPReg(CallRole role, const Vector<GPRReg>& regArgs, size_t& count, size_t& stackOffset, size_t valueSize) const
    {
        if (count < regArgs.size())
            return ArgumentLocation { ValueLocation { JSValueRegs::payloadOnly(regArgs[count++]) }, widthForBytes(valueSize) };

        count++;
        ArgumentLocation result = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), widthForBytes(valueSize) };
        stackOffset += valueSize;
        return result;
    }
    ArgumentLocation marshallLocationImplGPRegPair(CallRole role, const Vector<GPRReg>& regArgs, size_t& count, size_t& stackOffset, size_t valueSize) const
    {
        count = WTF::roundUpToMultipleOf(2, count);
        if (count+1 < regArgs.size()) {
            auto payloadReg = regArgs[count];
            auto tagReg = regArgs[count+1];
            count += 2;
            return ArgumentLocation { ValueLocation { JSValueRegs::withTwoAvailableRegs(tagReg, payloadReg) }, widthForBytes(valueSize) };
        }

        count += 2;
        stackOffset = WTF::roundUpToMultipleOf(valueSize, stackOffset);
        ArgumentLocation result = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), widthForBytes(valueSize) };
        stackOffset += valueSize;
        return result;
    }
    ArgumentLocation marshallLocationImplFPReg(CallRole role, const Vector<FPRReg>& regArgs, size_t& count, size_t& stackOffset, size_t valueSize) const
    {
        if (count < regArgs.size())
            return ArgumentLocation { ValueLocation { regArgs[count++] }, widthForBytes(valueSize) };

        count++;
        stackOffset = WTF::roundUpToMultipleOf(valueSize, stackOffset);
        ArgumentLocation result = { role == CallRole::Caller ? ValueLocation::stackArgument(stackOffset) : ValueLocation::stack(stackOffset), widthForBytes(valueSize) };
        stackOffset += valueSize;
        return result;
    }

    ArgumentLocation marshallLocation(CallRole role, Type valueType, size_t& gpArgumentCount, size_t& fpArgumentCount, size_t& stackOffset) const
    {
        ASSERT(isValueType(valueType));
        unsigned alignedWidth = bytesForWidth(valueType.width());
        switch (valueType.kind) {
        case TypeKind::I64:
        case TypeKind::Funcref:
        case TypeKind::Exn:
        case TypeKind::Externref:
        case TypeKind::RefNull:
        case TypeKind::Ref:
            return marshallLocationImplGPRegPair(role, gprArgs, gpArgumentCount, stackOffset, alignedWidth);
        case TypeKind::I32:
            return marshallLocationImplGPReg(role, gprArgs, gpArgumentCount, stackOffset, alignedWidth);
        case TypeKind::F32:
        case TypeKind::F64:
            return marshallLocationImplFPReg(role, fprArgs, fpArgumentCount, stackOffset, alignedWidth);
        default:
            break;
        }
        RELEASE_ASSERT_NOT_REACHED();
    }

public:
    uint32_t numberOfStackResults(const FunctionSignature& signature) const
    {
        const uint32_t gprCount = gprArgs.size();
        const uint32_t fprCount = fprArgs.size();
        uint32_t gprIndex = 0;
        uint32_t fprIndex = 0;
        uint32_t stackCount = 0;
        for (uint32_t i = 0; i < signature.returnCount(); i++) {
            switch (signature.returnType(i).kind) {
            case TypeKind::I64:
            case TypeKind::Funcref:
            case TypeKind::Exn:
            case TypeKind::Externref:
            case TypeKind::RefNull:
            case TypeKind::Ref:
                if (gprIndex < gprCount)
                    gprIndex += 2;
                else
                    stackCount += 2;
                break;
            case TypeKind::I32:
                if (gprIndex < gprCount)
                    ++gprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::F32:
            case TypeKind::F64:
                if (fprIndex < fprCount)
                    ++fprIndex;
                else
                    ++stackCount;
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED();
                break;
            }
        }
        return stackCount;
    }

    uint32_t numberOfStackArguments(const FunctionSignature& signature) const
    {
        const uint32_t gprCount = gprArgs.size();
        const uint32_t fprCount = fprArgs.size();
        uint32_t gprIndex = 0;
        uint32_t fprIndex = 0;
        uint32_t stackCount = 0;
        for (uint32_t i = 0; i < signature.argumentCount(); i++) {
            switch (signature.argumentType(i).kind) {
            case TypeKind::I64:
            case TypeKind::Funcref:
            case TypeKind::Exn:
            case TypeKind::Externref:
            case TypeKind::RefNull:
            case TypeKind::Ref:
                gprIndex = WTF::roundUpToMultipleOf(2, gprIndex);
                stackCount = WTF::roundUpToMultipleOf(2, stackCount);
                if (gprIndex < gprCount)
                    gprIndex += 2;
                else
                    stackCount += 2;
                break;
            case TypeKind::I32:
                if (gprIndex < gprCount)
                    ++gprIndex;
                else
                    ++stackCount;
                break;
            case TypeKind::F32:
            case TypeKind::F64:
                if (fprIndex < fprCount)
                    ++fprIndex;
                else
                    ++stackCount;
                break;
            default:
                RELEASE_ASSERT_NOT_REACHED();
                break;
            }
        }
        return stackCount;
    }

    CallInformation callInformationFor(const TypeDefinition& type, CallRole role = CallRole::Caller) const
    {
        const auto& signature = *type.as<FunctionSignature>();
        bool argumentsIncludeI64 = false;
        bool resultsIncludeI64 = false;
        size_t gpArgumentCount = 0;
        size_t fpArgumentCount = 0;
        size_t headerSize = headerSizeInBytes;
        if (role == CallRole::Caller)
            headerSize -= sizeof(CallerFrameAndPC);

        ArgumentLocation thisArgument = { role == CallRole::Caller ? ValueLocation::stackArgument(headerSize) : ValueLocation::stack(headerSize), widthForBytes(sizeof(void*)) };
        headerSize += sizeof(Register);

        size_t argStackOffset = headerSize;
        Vector<ArgumentLocation, 8> params(signature.argumentCount());
        for (size_t i = 0; i < signature.argumentCount(); ++i) {
            argumentsIncludeI64 |= signature.argumentType(i).isI64();
            ASSERT(!signature.argumentType(i).isV128());
            params[i] = marshallLocation(role, signature.argumentType(i), gpArgumentCount, fpArgumentCount, argStackOffset);
        }
        uint32_t stackArgs = argStackOffset - headerSize;
        gpArgumentCount = 0;
        fpArgumentCount = 0;

        uint32_t stackResults = numberOfStackResults(signature) * sizeof(Register);
        uint32_t stackCountAligned = WTF::roundUpToMultipleOf<stackAlignmentBytes()>(std::max(stackArgs, stackResults));
        size_t resultStackOffset = headerSize + stackCountAligned - stackResults;
        Vector<ArgumentLocation, 1> results(signature.returnCount());
        for (size_t i = 0; i < signature.returnCount(); ++i) {
            resultsIncludeI64 |= signature.returnType(i).isI64();
            ASSERT(!signature.returnType(i).isV128());
            results[i] = marshallLocation(role, signature.returnType(i), gpArgumentCount, fpArgumentCount, resultStackOffset);
        }

        CallInformation result(thisArgument, WTFMove(params), WTFMove(results), std::max(argStackOffset, resultStackOffset));
        result.argumentsIncludeI64 = argumentsIncludeI64;
        result.resultsIncludeI64 = resultsIncludeI64;
        return result;
    }

    const Vector<GPRReg> gprArgs;
    const Vector<FPRReg> fprArgs;
    const Vector<GPRReg> prologueScratchGPRs;
    const RegisterSet calleeSaveRegisters;
};

const CCallingConventionArmThumb2& cCallingConventionArmThumb2();
#endif

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
