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

#include "JITCompilation.h"
#include "NativeCallee.h"
#include "RegisterAtOffsetList.h"
#include "StackAlignment.h"
#include "WasmCompilationMode.h"
#include "WasmFormat.h"
#include "WasmFunctionCodeBlockGenerator.h"
#include "WasmFunctionIPIntMetadataGenerator.h"
#include "WasmHandlerInfo.h"
#include "WasmIPIntGenerator.h"
#include "WasmIPIntTierUpCounter.h"
#include "WasmIndexOrName.h"
#include "WasmLLIntTierUpCounter.h"
#include "WasmTierUpCount.h"
#include <wtf/EmbeddedFixedVector.h>
#include <wtf/FixedVector.h>
#include <wtf/RefCountedFixedVector.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace JSC {

class LLIntOffsetsExtractor;

namespace Wasm {

class CalleeGroup;

class Callee : public NativeCallee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(Callee);
    friend class JSC::LLIntOffsetsExtractor;
public:
    IndexOrName indexOrName() const { return m_indexOrName; }
    FunctionSpaceIndex index() const { return m_index; }
    CompilationMode compilationMode() const { return m_compilationMode; }

    CodePtr<WasmEntryPtrTag> entrypoint() const;
    RegisterAtOffsetList* calleeSaveRegisters();
    // Used by Wasm's fault signal handler to determine if the fault came from Wasm.
    std::tuple<void*, void*> range() const;

    const HandlerInfo* handlerForIndex(JSWebAssemblyInstance&, unsigned, const Tag*);

    bool hasExceptionHandlers() const { return !m_exceptionHandlers.isEmpty(); }

    void dump(PrintStream&) const;

    static void destroy(Callee*);

    void reportToVMsForDestruction();

protected:
    JS_EXPORT_PRIVATE Callee(Wasm::CompilationMode);
    JS_EXPORT_PRIVATE Callee(Wasm::CompilationMode, FunctionSpaceIndex, std::pair<const Name*, RefPtr<NameSection>>&&);

    template<typename Func>
    void runWithDowncast(const Func&);
    template<typename Func>
    void runWithDowncast(const Func&) const;

private:
    const CompilationMode m_compilationMode;
    const FunctionSpaceIndex m_index;
    const IndexOrName m_indexOrName;

protected:
    FixedVector<HandlerInfo> m_exceptionHandlers;
};

class JITCallee : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(JITCallee);
public:
    friend class Callee;
    FixedVector<UnlinkedWasmToWasmCall>& wasmToWasmCallsites() { return m_wasmToWasmCallsites; }

#if ENABLE(JIT)
    void setEntrypoint(Wasm::Entrypoint&&);
#endif

protected:
    JS_EXPORT_PRIVATE JITCallee(Wasm::CompilationMode);
    JS_EXPORT_PRIVATE JITCallee(Wasm::CompilationMode, FunctionSpaceIndex, std::pair<const Name*, RefPtr<NameSection>>&&);

#if ENABLE(JIT)
    std::tuple<void*, void*> rangeImpl() const
    {
        void* start = m_entrypoint.compilation->codeRef().executableMemory()->start().untaggedPtr();
        void* end = m_entrypoint.compilation->codeRef().executableMemory()->end().untaggedPtr();
        return { start, end };
    }

    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return m_entrypoint.compilation->code().retagged<WasmEntryPtrTag>(); }

    RegisterAtOffsetList* calleeSaveRegistersImpl() { return &m_entrypoint.calleeSaveRegisters; }
#else
    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; }
    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return { }; }
    RegisterAtOffsetList* calleeSaveRegistersImpl() { return nullptr; }
#endif

    FixedVector<UnlinkedWasmToWasmCall> m_wasmToWasmCallsites;
#if ENABLE(JIT)
    Wasm::Entrypoint m_entrypoint;
#endif
};

class JSEntrypointCallee final : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(JSEntrypointCallee);
public:
    friend class Callee;
    friend class JSC::LLIntOffsetsExtractor;

    static inline Ref<JSEntrypointCallee> create(TypeIndex typeIndex, bool usesSIMD)
    {
        return adoptRef(*new JSEntrypointCallee(typeIndex, usesSIMD));
    }

    CodePtr<WasmEntryPtrTag> entrypointImpl() const;
    static JS_EXPORT_PRIVATE RegisterAtOffsetList* calleeSaveRegistersImpl();
    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; }
#if ASSERT_ENABLED
    static constexpr ptrdiff_t offsetOfIdent() { return OBJECT_OFFSETOF(JSEntrypointCallee, m_ident); }
#endif
    static constexpr ptrdiff_t offsetOfWasmCallee() { return OBJECT_OFFSETOF(JSEntrypointCallee, m_wasmCallee); }
    static constexpr ptrdiff_t offsetOfWasmFunctionPrologue() { return OBJECT_OFFSETOF(JSEntrypointCallee, m_wasmFunctionPrologue); }
    static constexpr ptrdiff_t offsetOfFrameSize() { return OBJECT_OFFSETOF(JSEntrypointCallee, m_frameSize); }

    // Space for callee-saves; Not included in frameSize
    static constexpr unsigned SpillStackSpaceAligned = WTF::roundUpToMultipleOf<stackAlignmentBytes()>(3 * sizeof(UCPURegister));
    // Extra space used to return argument register values from cpp before they get filled. Included in frameSize
    static constexpr unsigned RegisterStackSpaceAligned = WTF::roundUpToMultipleOf<stackAlignmentBytes()>(
        FPRInfo::numberOfArgumentRegisters * bytesForWidth(Width::Width64) + GPRInfo::numberOfArgumentRegisters * sizeof(UCPURegister));

#if ASSERT_ENABLED
    unsigned ident() const { return m_ident; }
#endif
    unsigned frameSize() const { return m_frameSize; }
    EncodedJSValue wasmCallee() const { return m_wasmCallee; }
    TypeIndex typeIndex() const { return m_typeIndex; }

    void setWasmCallee(EncodedJSValue wasmCallee)
    {
        m_wasmCallee = wasmCallee;
    }

    void setReplacementTarget(CodePtr<WasmEntryPtrTag> replacement)
    {
        m_wasmFunctionPrologue = replacement;
    }

private:
    JSEntrypointCallee(TypeIndex, bool);

#if ASSERT_ENABLED
    const unsigned m_ident { 0xBF };
#endif
    unsigned m_frameSize { };
    // This must be initialized after the callee is created unfortunately.
    EncodedJSValue m_wasmCallee;
    const TypeIndex m_typeIndex;
    // In the JIT case, we want to always call the llint prologue from a jit function.
    // In the no-jit case, we dont' care.
    CodePtr<WasmEntryPtrTag> m_wasmFunctionPrologue;
};

class WasmToJSCallee final : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(WasmToJSCallee);
public:
    friend class Callee;
    friend class JSC::LLIntOffsetsExtractor;

    WasmToJSCallee(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name) : Callee(Wasm::CompilationMode::WasmToJSMode, index, WTFMove(name)) { };
    static WasmToJSCallee& singleton();

private:
    WasmToJSCallee();
    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; }
    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return { }; }
    RegisterAtOffsetList* calleeSaveRegistersImpl() { return nullptr; }
};

#if ENABLE(JIT)

class JSToWasmICCallee final : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(JSToWasmICCallee);
public:
    static Ref<JSToWasmICCallee> create(RegisterAtOffsetList&& calleeSaves)
    {
        return adoptRef(*new JSToWasmICCallee(WTFMove(calleeSaves)));
    }

    RegisterAtOffsetList* calleeSaveRegistersImpl() { return &m_calleeSaves; }
    CodePtr<JSEntryPtrTag> jsEntrypoint() { return m_jsToWasmICEntrypoint.code(); }

    void setEntrypoint(MacroAssemblerCodeRef<JSEntryPtrTag>&&);

private:
    friend class Callee;
    JSToWasmICCallee(RegisterAtOffsetList&& calleeSaves)
        : Callee(Wasm::CompilationMode::JSToWasmICMode)
        , m_calleeSaves(WTFMove(calleeSaves))
    {
    }

    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; }
    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return { }; }

    MacroAssemblerCodeRef<JSEntryPtrTag> m_jsToWasmICEntrypoint;
    RegisterAtOffsetList m_calleeSaves;
};

#endif

#if ENABLE(WEBASSEMBLY_BBQJIT) || ENABLE(WEBASSEMBLY_OMGJIT)

struct WasmCodeOrigin {
    unsigned firstInlineCSI;
    unsigned lastInlineCSI;
    unsigned functionIndex;
    unsigned moduleIndex;
};

class OptimizingJITCallee : public JITCallee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(OptimizingJITCallee);
public:
    const StackMap& stackmap(CallSiteIndex) const;

    void addCodeOrigin(unsigned firstInlineCSI, unsigned lastInlineCSI, const Wasm::ModuleInformation&, uint32_t functionIndex);
    IndexOrName getOrigin(unsigned csi, unsigned depth, bool& isInlined) const;

protected:
    OptimizingJITCallee(Wasm::CompilationMode mode, FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name)
        : JITCallee(mode, index, WTFMove(name))
    {
    }

    void setEntrypoint(Wasm::Entrypoint&& entrypoint, Vector<UnlinkedWasmToWasmCall>&& unlinkedCalls, StackMaps&& stackmaps, Vector<UnlinkedHandlerInfo>&& unlinkedExceptionHandlers, Vector<CodeLocationLabel<ExceptionHandlerPtrTag>>&& exceptionHandlerLocations)
    {
        m_wasmToWasmCallsites = WTFMove(unlinkedCalls);
        m_stackmaps = WTFMove(stackmaps);
        RELEASE_ASSERT(unlinkedExceptionHandlers.size() == exceptionHandlerLocations.size());
        linkExceptionHandlers(WTFMove(unlinkedExceptionHandlers), WTFMove(exceptionHandlerLocations));
        JITCallee::setEntrypoint(WTFMove(entrypoint));
    }

private:
    void linkExceptionHandlers(Vector<UnlinkedHandlerInfo>, Vector<CodeLocationLabel<ExceptionHandlerPtrTag>>);

    StackMaps m_stackmaps;
    Vector<WasmCodeOrigin, 0> codeOrigins;
    Vector<Ref<NameSection>, 0> nameSections;
};

constexpr int32_t stackCheckUnset = 0;
constexpr int32_t stackCheckNotNeeded = -1;

class OMGOSREntryCallee final : public OptimizingJITCallee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(OMGOSREntryCallee);
public:
    static Ref<OMGOSREntryCallee> create(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name, uint32_t loopIndex)
    {
        return adoptRef(*new OMGOSREntryCallee(index, WTFMove(name), loopIndex));
    }

    unsigned osrEntryScratchBufferSize() const { return m_osrEntryScratchBufferSize; }
    uint32_t loopIndex() const { return m_loopIndex; }


    void setEntrypoint(Wasm::Entrypoint&& entrypoint, unsigned osrEntryScratchBufferSize, Vector<UnlinkedWasmToWasmCall>&& unlinkedCalls, StackMaps&& stackmaps, Vector<UnlinkedHandlerInfo>&& exceptionHandlers, Vector<CodeLocationLabel<ExceptionHandlerPtrTag>>&& exceptionHandlerLocations)
    {
        m_osrEntryScratchBufferSize = osrEntryScratchBufferSize;
        OptimizingJITCallee::setEntrypoint(WTFMove(entrypoint), WTFMove(unlinkedCalls), WTFMove(stackmaps), WTFMove(exceptionHandlers), WTFMove(exceptionHandlerLocations));
    }

    void setStackCheckSize(int32_t stackCheckSize)
    {
        ASSERT(m_stackCheckSize == stackCheckUnset);
        ASSERT(stackCheckSize > 0 || stackCheckSize == stackCheckNotNeeded);
        m_stackCheckSize = stackCheckSize;
    }

    int32_t stackCheckSize() const
    {
        ASSERT(m_stackCheckSize > 0 || m_stackCheckSize == stackCheckNotNeeded);
        return m_stackCheckSize;
    }

private:
    OMGOSREntryCallee(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name, uint32_t loopIndex)
        : OptimizingJITCallee(CompilationMode::OMGForOSREntryMode, index, WTFMove(name))
        , m_loopIndex(loopIndex)
    {
    }

    unsigned m_osrEntryScratchBufferSize { 0 };
    uint32_t m_loopIndex;
    int32_t m_stackCheckSize { stackCheckUnset };
};

#endif // ENABLE(WEBASSEMBLY_BBQJIT) || ENABLE(WEBASSEMBLY_OMGJIT)

#if ENABLE(WEBASSEMBLY_OMGJIT)

class OMGCallee final : public OptimizingJITCallee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(OMGCallee);
public:
    static Ref<OMGCallee> create(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name)
    {
        return adoptRef(*new OMGCallee(index, WTFMove(name)));
    }

    using OptimizingJITCallee::setEntrypoint;

private:
    OMGCallee(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name)
        : OptimizingJITCallee(Wasm::CompilationMode::OMGMode, index, WTFMove(name))
    {
    }
};

#endif // ENABLE(WEBASSEMBLY_OMGJIT)

#if ENABLE(WEBASSEMBLY_BBQJIT)

class BBQCallee final : public OptimizingJITCallee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(BBQCallee);
public:
    static constexpr unsigned extraOSRValuesForLoopIndex = 1;

    static Ref<BBQCallee> create(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name, SavedFPWidth savedFPWidth)
    {
        return adoptRef(*new BBQCallee(index, WTFMove(name), savedFPWidth));
    }
    ~BBQCallee();

    OMGOSREntryCallee* osrEntryCallee() { return m_osrEntryCallee.get(); }
    void setOSREntryCallee(Ref<OMGOSREntryCallee>&& osrEntryCallee, MemoryMode)
    {
        ASSERT(!m_osrEntryCallee);
        m_osrEntryCallee = WTFMove(osrEntryCallee);
    }

    bool didStartCompilingOSREntryCallee() const { return m_didStartCompilingOSREntryCallee; }
    void setDidStartCompilingOSREntryCallee(bool value) { m_didStartCompilingOSREntryCallee = value; }

    TierUpCount& tierUpCounter() { return m_tierUpCounter; }

    std::optional<CodeLocationLabel<WasmEntryPtrTag>> sharedLoopEntrypoint() { return m_sharedLoopEntrypoint; }
    const Vector<CodeLocationLabel<WasmEntryPtrTag>>& loopEntrypoints() { return m_loopEntrypoints; }

    unsigned osrEntryScratchBufferSize() const { return m_osrEntryScratchBufferSize; }
    SavedFPWidth savedFPWidth() const { return m_savedFPWidth; }

    void setEntrypoint(Wasm::Entrypoint&& entrypoint, Vector<UnlinkedWasmToWasmCall>&& unlinkedCalls, StackMaps&& stackmaps, Vector<UnlinkedHandlerInfo>&& exceptionHandlers, Vector<CodeLocationLabel<ExceptionHandlerPtrTag>>&& exceptionHandlerLocations, Vector<CodeLocationLabel<WasmEntryPtrTag>>&& loopEntrypoints, std::optional<CodeLocationLabel<WasmEntryPtrTag>> sharedLoopEntrypoint, unsigned osrEntryScratchBufferSize)
    {
        m_sharedLoopEntrypoint = sharedLoopEntrypoint;
        m_loopEntrypoints = WTFMove(loopEntrypoints);
        m_osrEntryScratchBufferSize = osrEntryScratchBufferSize;
        OptimizingJITCallee::setEntrypoint(WTFMove(entrypoint), WTFMove(unlinkedCalls), WTFMove(stackmaps), WTFMove(exceptionHandlers), WTFMove(exceptionHandlerLocations));
        m_switchJumpTables.shrinkToFit();
    }

    EmbeddedFixedVector<CodeLocationLabel<JSSwitchPtrTag>>* addJumpTable(unsigned size)
    {
        m_switchJumpTables.append(EmbeddedFixedVector<CodeLocationLabel<JSSwitchPtrTag>>::create(size));
        return m_switchJumpTables.last().ptr();
    }

    void setStackCheckSize(unsigned stackCheckSize)
    {
        ASSERT(m_stackCheckSize == stackCheckUnset);
        ASSERT(stackCheckSize > 0 || int32_t(stackCheckSize) == stackCheckNotNeeded);
        m_stackCheckSize = stackCheckSize;
    }
    int32_t stackCheckSize() const
    {
        ASSERT(m_stackCheckSize > 0 || int32_t(m_stackCheckSize) == stackCheckNotNeeded);
        return m_stackCheckSize;
    }

private:
    BBQCallee(FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name, SavedFPWidth savedFPWidth)
        : OptimizingJITCallee(Wasm::CompilationMode::BBQMode, index, WTFMove(name))
        , m_savedFPWidth(savedFPWidth)
    {
    }

    RefPtr<OMGOSREntryCallee> m_osrEntryCallee;
    TierUpCount m_tierUpCounter;
    std::optional<CodeLocationLabel<WasmEntryPtrTag>> m_sharedLoopEntrypoint;
    Vector<CodeLocationLabel<WasmEntryPtrTag>> m_loopEntrypoints;
    unsigned m_osrEntryScratchBufferSize { 0 };
    unsigned m_stackCheckSize { 0 };
    bool m_didStartCompilingOSREntryCallee { false };
    SavedFPWidth m_savedFPWidth { SavedFPWidth::DontSaveVectors };
    Vector<UniqueRef<EmbeddedFixedVector<CodeLocationLabel<JSSwitchPtrTag>>>> m_switchJumpTables;
};
#endif


class IPIntCallee final : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(IPIntCallee);
    friend class JSC::LLIntOffsetsExtractor;
    friend class Callee;
public:
    static Ref<IPIntCallee> create(FunctionIPIntMetadataGenerator& generator, FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name)
    {
        return adoptRef(*new IPIntCallee(generator, index, WTFMove(name)));
    }

    FunctionCodeIndex functionIndex() const { return m_functionIndex; }
    void setEntrypoint(CodePtr<WasmEntryPtrTag>);
    const uint8_t* bytecode() const { return m_bytecode; }
    const uint8_t* metadata() const { return m_metadata; }

    unsigned numLocals() const { return m_numLocals; }
    unsigned localSizeToAlloc() const { return m_localSizeToAlloc; }
    unsigned rethrowSlots() const { return m_numRethrowSlotsToAlloc; }

    const TypeDefinition& signature(unsigned index) const
    {
        return *m_signatures[index];
    }

    IPIntTierUpCounter& tierUpCounter() { return m_tierUpCounter; }

    using OutOfLineJumpTargets = UncheckedKeyHashMap<WasmInstructionStream::Offset, int>;

private:
    IPIntCallee(FunctionIPIntMetadataGenerator&, FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&&);

    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return m_entrypoint; }
    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; };
    JS_EXPORT_PRIVATE RegisterAtOffsetList* calleeSaveRegistersImpl();

    FunctionCodeIndex m_functionIndex;
    CodePtr<WasmEntryPtrTag> m_entrypoint;
    FixedVector<const TypeDefinition*> m_signatures;

    const uint8_t* m_bytecode;
    const uint8_t* m_bytecodeEnd;
    Vector<uint8_t> m_metadataVector;
    const uint8_t* m_metadata;
    Vector<uint8_t> m_argumINTBytecode;
    const uint8_t* m_argumINTBytecodePointer;
    Vector<uint8_t> m_uINTBytecode;
    const uint8_t* m_uINTBytecodePointer;

    unsigned m_highestReturnStackOffset;

    unsigned m_localSizeToAlloc;
    unsigned m_numRethrowSlotsToAlloc;
    unsigned m_numLocals;
    unsigned m_numArgumentsOnStack;
    unsigned m_maxFrameSizeInV128;

    IPIntTierUpCounter m_tierUpCounter;
};

class LLIntCallee final : public Callee {
    WTF_MAKE_COMPACT_TZONE_ALLOCATED(LLIntCallee);
    friend JSC::LLIntOffsetsExtractor;
    friend class Callee;
public:
    static Ref<LLIntCallee> create(FunctionCodeBlockGenerator& generator, FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&& name)
    {
        return adoptRef(*new LLIntCallee(generator, index, WTFMove(name)));
    }

    void setEntrypoint(CodePtr<WasmEntryPtrTag>);

    FunctionCodeIndex functionIndex() const { return m_functionIndex; }
    unsigned numVars() const { return m_numVars; }
    unsigned numCalleeLocals() const { return m_numCalleeLocals; }
    uint32_t numArguments() const { return m_numArguments; }
    const FixedVector<Type>& constantTypes() const { return m_constantTypes; }
    const FixedVector<uint64_t>& constants() const { return m_constants; }
    const WasmInstructionStream& instructions() const { return *m_instructions; }

    ALWAYS_INLINE uint64_t getConstant(VirtualRegister reg) const { return m_constants[reg.toConstantIndex()]; }
    ALWAYS_INLINE Type getConstantType(VirtualRegister reg) const
    {
        ASSERT(Options::dumpGeneratedWasmBytecodes());
        return m_constantTypes[reg.toConstantIndex()];
    }

    WasmInstructionStream::Offset numberOfJumpTargets() { return m_jumpTargets.size(); }
    WasmInstructionStream::Offset lastJumpTarget() { return m_jumpTargets.last(); }

    const WasmInstruction* outOfLineJumpTarget(const WasmInstruction*);
    WasmInstructionStream::Offset outOfLineJumpOffset(WasmInstructionStream::Offset);
    WasmInstructionStream::Offset outOfLineJumpOffset(const WasmInstructionStream::Ref& instruction)
    {
        return outOfLineJumpOffset(instruction.offset());
    }

    inline WasmInstructionStream::Offset bytecodeOffset(const WasmInstruction* returnAddress)
    {
        const auto* instructionsBegin = m_instructions->at(0).ptr();
        const auto* instructionsEnd = reinterpret_cast<const WasmInstruction*>(reinterpret_cast<uintptr_t>(instructionsBegin) + m_instructions->size());
        RELEASE_ASSERT(returnAddress >= instructionsBegin && returnAddress < instructionsEnd);
        return returnAddress - instructionsBegin;
    }

    LLIntTierUpCounter& tierUpCounter() { return m_tierUpCounter; }

    const TypeDefinition& signature(unsigned index) const
    {
        return *m_signatures[index];
    }

    const JumpTable& jumpTable(unsigned tableIndex) const;
    unsigned numberOfJumpTables() const;

    using OutOfLineJumpTargets = UncheckedKeyHashMap<WasmInstructionStream::Offset, int>;

private:
    LLIntCallee(FunctionCodeBlockGenerator&, FunctionSpaceIndex index, std::pair<const Name*, RefPtr<NameSection>>&&);

    CodePtr<WasmEntryPtrTag> entrypointImpl() const { return m_entrypoint; }
    std::tuple<void*, void*> rangeImpl() const { return { nullptr, nullptr }; };
    JS_EXPORT_PRIVATE RegisterAtOffsetList* calleeSaveRegistersImpl();

    FunctionCodeIndex m_functionIndex;

    // Used for the number of WebAssembly locals, as in https://webassembly.github.io/spec/core/syntax/modules.html#syntax-local
    unsigned m_numVars { 0 };
    // Number of VirtualRegister. The naming is unfortunate, but has to match UnlinkedCodeBlock
    unsigned m_numCalleeLocals { 0 };
    uint32_t m_numArguments { 0 };
    FixedVector<Type> m_constantTypes;
    FixedVector<uint64_t> m_constants;
    std::unique_ptr<WasmInstructionStream> m_instructions;
    const void* m_instructionsRawPointer { nullptr };
    FixedVector<WasmInstructionStream::Offset> m_jumpTargets;
    FixedVector<const TypeDefinition*> m_signatures;
    OutOfLineJumpTargets m_outOfLineJumpTargets;
    LLIntTierUpCounter m_tierUpCounter;
    FixedVector<JumpTable> m_jumpTables;
    CodePtr<WasmEntryPtrTag> m_entrypoint;
};

using LLIntCallees = ThreadSafeRefCountedFixedVector<Ref<LLIntCallee>>;
using IPIntCallees = ThreadSafeRefCountedFixedVector<Ref<IPIntCallee>>;

} } // namespace JSC::Wasm

#endif // ENABLE(WEBASSEMBLY)
