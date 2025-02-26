/*
 * Copyright (C) 2012-2023 Apple Inc. All Rights Reserved.
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

#include "CachedTypes.h"
#include "ExecutableInfo.h"
#include "JSCInlines.h"
#include "Parser.h"
#include "ParserModes.h"
#include "SourceCodeKey.h"
#include "Strong.h"
#include "StrongInlines.h"
#include "UnlinkedCodeBlock.h"
#include "UnlinkedEvalCodeBlock.h"
#include "UnlinkedFunctionCodeBlock.h"
#include "UnlinkedModuleProgramCodeBlock.h"
#include "UnlinkedProgramCodeBlock.h"
#include <wtf/ApproximateTime.h>
#include <wtf/MainThread.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class EvalExecutable;
class IndirectEvalExecutable;
class Identifier;
class DirectEvalExecutable;
class ModuleProgramExecutable;
class ParserError;
class ProgramExecutable;
class SourceCode;
class VM;

using TDZEnvironment = HashSet<RefPtr<UniquedStringImpl>, IdentifierRepHash>;

namespace CodeCacheInternal {
static constexpr bool verbose = false;
} // namespace CodeCacheInternal

struct SourceCodeValue {
    SourceCodeValue()
    {
    }

    SourceCodeValue(VM& vm, JSCell* cell, int64_t age)
        : cell(vm, cell)
        , age(age)
    {
    }

    Strong<JSCell> cell;
    int64_t age;
};

class CodeCacheMap {
public:
    typedef UncheckedKeyHashMap<SourceCodeKey, SourceCodeValue, SourceCodeKey::Hash, SourceCodeKey::HashTraits> MapType;
    typedef MapType::iterator iterator;
    typedef MapType::AddResult AddResult;

    CodeCacheMap()
        : m_size(0)
        , m_sizeAtLastPrune(0)
        , m_timeAtLastPrune(ApproximateTime::now())
        , m_minCapacity(0)
        , m_capacity(0)
        , m_age(0)
    {
    }

    iterator begin() { return m_map.begin(); }
    iterator end() { return m_map.end(); }

    template<typename UnlinkedCodeBlockType>
    UnlinkedCodeBlockType* findCacheAndUpdateAge(VM& vm, const SourceCodeKey& key)
    {
        prune();

        iterator findResult = m_map.find(key);
        if (findResult == m_map.end())
            return fetchFromDisk<UnlinkedCodeBlockType>(vm, key);

        int64_t age = m_age - findResult->value.age;
        if (age > m_capacity) {
            // A requested object is older than the cache's capacity. We can
            // infer that requested objects are subject to high eviction probability,
            // so we grow the cache to improve our hit rate.
            m_capacity += recencyBias * oldObjectSamplingMultiplier * key.length();
        } else if (age < m_capacity / 2) {
            // A requested object is much younger than the cache's capacity. We can
            // infer that requested objects are subject to low eviction probability,
            // so we shrink the cache to save memory.
            m_capacity -= recencyBias * key.length();
            if (m_capacity < m_minCapacity)
                m_capacity = m_minCapacity;
        }

        findResult->value.age = m_age;
        m_age += key.length();

        return jsCast<UnlinkedCodeBlockType*>(findResult->value.cell.get());
    }

    AddResult addCache(const SourceCodeKey& key, const SourceCodeValue& value)
    {
        prune();

        AddResult addResult = m_map.add(key, value);
        ASSERT(addResult.isNewEntry);

        m_size += key.length();
        m_age += key.length();
        return addResult;
    }

    void remove(iterator it)
    {
        m_size -= it->key.length();
        m_map.remove(it);
    }

    void clear()
    {
        m_size = 0;
        m_age = 0;
        m_map.clear();
    }

    int64_t age() { return m_age; }

private:
    template<typename UnlinkedCodeBlockType>
    UnlinkedCodeBlockType* fetchFromDiskImpl(VM& vm, const SourceCodeKey& key)
    {
        RefPtr<CachedBytecode> cachedBytecode = key.source().provider().cachedBytecode();
        if (!cachedBytecode || !cachedBytecode->size())
            return nullptr;
        return decodeCodeBlock<UnlinkedCodeBlockType>(vm, key, *cachedBytecode);
    }

    template<typename UnlinkedCodeBlockType>
    UnlinkedCodeBlockType* fetchFromDisk(VM& vm, const SourceCodeKey& key)
    {
        if constexpr (std::is_base_of_v<UnlinkedCodeBlock, UnlinkedCodeBlockType> && !std::is_same_v<UnlinkedCodeBlockType, UnlinkedEvalCodeBlock>) {
            UnlinkedCodeBlockType* codeBlock = fetchFromDiskImpl<UnlinkedCodeBlockType>(vm, key);
            if (UNLIKELY(Options::forceDiskCache())) {
                if (isMainThread())
                    RELEASE_ASSERT(codeBlock);
            }
            return codeBlock;
        } else {
            UNUSED_PARAM(vm);
            UNUSED_PARAM(key);
            return nullptr;
        }
    }

    // This constant factor biases cache capacity toward allowing a minimum
    // working set to enter the cache before it starts evicting.
    static constexpr Seconds workingSetTime = 10_s;
    static constexpr int64_t workingSetMaxBytes = 16000000;
    static constexpr size_t workingSetMaxEntries = 2000;

    // This constant factor biases cache capacity toward recent activity. We
    // want to adapt to changing workloads.
    static constexpr int64_t recencyBias = 4;

    // This constant factor treats a sampled event for one old object as if it
    // happened for many old objects. Most old objects are evicted before we can
    // sample them, so we need to extrapolate from the ones we do sample.
    static constexpr int64_t oldObjectSamplingMultiplier = 32;

    size_t numberOfEntries() const { return static_cast<size_t>(m_map.size()); }
    bool canPruneQuickly() const { return numberOfEntries() < workingSetMaxEntries; }

    void pruneSlowCase();
    void prune()
    {
        if (m_size <= m_capacity && canPruneQuickly())
            return;

        if (ApproximateTime::now() - m_timeAtLastPrune < workingSetTime
            && m_size - m_sizeAtLastPrune < workingSetMaxBytes
            && canPruneQuickly())
                return;

        pruneSlowCase();
    }

    MapType m_map;
    int64_t m_size;
    int64_t m_sizeAtLastPrune;
    ApproximateTime m_timeAtLastPrune;
    int64_t m_minCapacity;
    int64_t m_capacity;
    int64_t m_age;
};

// Caches top-level code such as <script>, window.eval(), new Function, and JSEvaluateScript().
class CodeCache {
    WTF_MAKE_TZONE_ALLOCATED(CodeCache);
public:
    UnlinkedProgramCodeBlock* getUnlinkedProgramCodeBlock(VM&, ProgramExecutable*, const SourceCode&, OptionSet<CodeGenerationMode>, ParserError&);
    UnlinkedEvalCodeBlock* getUnlinkedEvalCodeBlock(VM&, IndirectEvalExecutable*, const SourceCode&, OptionSet<CodeGenerationMode>, ParserError&, EvalContextType);
    UnlinkedModuleProgramCodeBlock* getUnlinkedModuleProgramCodeBlock(VM&, ModuleProgramExecutable*, const SourceCode&, OptionSet<CodeGenerationMode>, ParserError&);
    UnlinkedFunctionExecutable* getUnlinkedGlobalFunctionExecutable(VM&, const Identifier&, const SourceCode&, LexicallyScopedFeatures, OptionSet<CodeGenerationMode>, std::optional<int> functionConstructorParametersEndPosition, ParserError&);

    void updateCache(const UnlinkedFunctionExecutable*, const SourceCode&, CodeSpecializationKind, const UnlinkedFunctionCodeBlock*);

    void clear() { m_sourceCode.clear(); }
    JS_EXPORT_PRIVATE void write();

private:
    template <class UnlinkedCodeBlockType, class ExecutableType> 
    UnlinkedCodeBlockType* getUnlinkedGlobalCodeBlock(VM&, ExecutableType*, const SourceCode&, JSParserScriptMode, OptionSet<CodeGenerationMode>, ParserError&, EvalContextType);

    CodeCacheMap m_sourceCode;
};

template <typename T> struct CacheTypes { };

template <> struct CacheTypes<UnlinkedProgramCodeBlock> {
    typedef JSC::ProgramNode RootNode;
    static constexpr SourceCodeType codeType = SourceCodeType::ProgramType;
    static constexpr SourceParseMode parseMode = SourceParseMode::ProgramMode;
};

template <> struct CacheTypes<UnlinkedEvalCodeBlock> {
    typedef JSC::EvalNode RootNode;
    static constexpr SourceCodeType codeType = SourceCodeType::EvalType;
    static constexpr SourceParseMode parseMode = SourceParseMode::ProgramMode;
};

template <> struct CacheTypes<UnlinkedModuleProgramCodeBlock> {
    typedef JSC::ModuleProgramNode RootNode;
    static constexpr SourceCodeType codeType = SourceCodeType::ModuleType;
    static constexpr SourceParseMode parseMode = SourceParseMode::ModuleEvaluateMode;
};

UnlinkedEvalCodeBlock* generateUnlinkedCodeBlockForDirectEval(VM&, DirectEvalExecutable*, const SourceCode&, JSParserScriptMode, OptionSet<CodeGenerationMode>, ParserError&, EvalContextType, const TDZEnvironment* variablesUnderTDZ, const PrivateNameEnvironment*);
UnlinkedProgramCodeBlock* recursivelyGenerateUnlinkedCodeBlockForProgram(VM&, const SourceCode&, LexicallyScopedFeatures, JSParserScriptMode, OptionSet<CodeGenerationMode>, ParserError&, EvalContextType);
UnlinkedModuleProgramCodeBlock* recursivelyGenerateUnlinkedCodeBlockForModuleProgram(VM&, const SourceCode&, LexicallyScopedFeatures, JSParserScriptMode, OptionSet<CodeGenerationMode>, ParserError&, EvalContextType);

void writeCodeBlock(const SourceCodeKey&, const SourceCodeValue&);
RefPtr<CachedBytecode> serializeBytecode(VM&, UnlinkedCodeBlock*, const SourceCode&, SourceCodeType, LexicallyScopedFeatures, JSParserScriptMode, FileSystem::PlatformFileHandle fd, BytecodeCacheError&, OptionSet<CodeGenerationMode>);
SourceCodeKey sourceCodeKeyForSerializedProgram(VM&, const SourceCode&);
SourceCodeKey sourceCodeKeyForSerializedModule(VM&, const SourceCode&);

} // namespace JSC
