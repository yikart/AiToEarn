/*
 * Copyright (C) 2018-2021 Apple Inc. All rights reserved.
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

#include "JSCast.h"
#include "ParserModes.h"
#include "VariableEnvironment.h"
#include <wtf/FileSystem.h>
#include <wtf/HashMap.h>

namespace JSC {

class BytecodeCacheError;
class CachedBytecode;
class SourceCodeKey;
class UnlinkedCodeBlock;
class UnlinkedFunctionCodeBlock;
class UnlinkedFunctionExecutable;

enum class SourceCodeType;

// This struct has to be updated when incrementally writing to the bytecode
// cache, since this will only be filled in when we parse the function
struct CachedFunctionExecutableMetadata {
    CodeFeatures m_features;
    LexicallyScopedFeatures m_lexicallyScopedFeatures;
    bool m_hasCapturedVariables;
};

struct CachedFunctionExecutableOffsets {
    static ptrdiff_t codeBlockForCallOffset();
    static ptrdiff_t codeBlockForConstructOffset();
    static ptrdiff_t metadataOffset();
};

struct CachedWriteBarrierOffsets {
    static ptrdiff_t ptrOffset();
};

struct CachedPtrOffsets {
    static ptrdiff_t offsetOffset();
};

class VariableLengthObjectBase {
    friend class CachedBytecode;

protected:
    VariableLengthObjectBase(ptrdiff_t offset)
        : m_offset(offset)
    {
    }

    ptrdiff_t m_offset;
};

class Decoder : public RefCounted<Decoder> {
    WTF_MAKE_NONCOPYABLE(Decoder);

public:
    static Ref<Decoder> create(VM&, Ref<CachedBytecode>, RefPtr<SourceProvider> = nullptr);

    ~Decoder();

    VM& vm() { return m_vm; }
    size_t size() const;

    ptrdiff_t offsetOf(const void*);
    void cacheOffset(ptrdiff_t, void*);
    std::optional<void*> cachedPtrForOffset(ptrdiff_t);
    const void* ptrForOffsetFromBase(ptrdiff_t);
    CompactTDZEnvironmentMap::Handle handleForTDZEnvironment(CompactTDZEnvironment*) const;
    void setHandleForTDZEnvironment(CompactTDZEnvironment*, const CompactTDZEnvironmentMap::Handle&);
    void addLeafExecutable(const UnlinkedFunctionExecutable*, ptrdiff_t);
    RefPtr<SourceProvider> provider() const;

    template<typename Functor>
    void addFinalizer(const Functor&);

private:
    Decoder(VM&, Ref<CachedBytecode>, RefPtr<SourceProvider>);

    VM& m_vm;
    Ref<CachedBytecode> m_cachedBytecode;
    UncheckedKeyHashMap<ptrdiff_t, void*> m_offsetToPtrMap;
    Vector<std::function<void()>> m_finalizers;
    UncheckedKeyHashMap<CompactTDZEnvironment*, CompactTDZEnvironmentMap::Handle> m_environmentToHandleMap;
    RefPtr<SourceProvider> m_provider;
};

JS_EXPORT_PRIVATE RefPtr<CachedBytecode> encodeCodeBlock(VM&, const SourceCodeKey&, const UnlinkedCodeBlock*);
JS_EXPORT_PRIVATE RefPtr<CachedBytecode> encodeCodeBlock(VM&, const SourceCodeKey&, const UnlinkedCodeBlock*, FileSystem::PlatformFileHandle fd, BytecodeCacheError&);

UnlinkedCodeBlock* decodeCodeBlockImpl(VM&, const SourceCodeKey&, Ref<CachedBytecode>);

template<typename UnlinkedCodeBlockType>
UnlinkedCodeBlockType* decodeCodeBlock(VM& vm, const SourceCodeKey& key, Ref<CachedBytecode> cachedBytecode)
{
    return jsCast<UnlinkedCodeBlockType*>(decodeCodeBlockImpl(vm, key, WTFMove(cachedBytecode)));
}

JS_EXPORT_PRIVATE RefPtr<CachedBytecode> encodeFunctionCodeBlock(VM&, const UnlinkedFunctionCodeBlock*, BytecodeCacheError&);

JS_EXPORT_PRIVATE void decodeFunctionCodeBlock(Decoder&, int32_t cachedFunctionCodeBlockOffset, WriteBarrier<UnlinkedFunctionCodeBlock>&, const JSCell*);

bool isCachedBytecodeStillValid(VM&, Ref<CachedBytecode>, const SourceCodeKey&, SourceCodeType);

} // namespace JSC
