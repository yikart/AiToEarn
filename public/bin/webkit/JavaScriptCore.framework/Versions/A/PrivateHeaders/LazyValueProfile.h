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

#include "LazyOperandValueProfile.h"

namespace JSC {

class ScriptExecutable;
class CodeBlock;

class LazyOperandValueProfileParser;

class CompressedLazyValueProfileHolder {
    WTF_MAKE_NONCOPYABLE(CompressedLazyValueProfileHolder);
public:
    CompressedLazyValueProfileHolder() = default;

    void computeUpdatedPredictions(const ConcurrentJSLocker&, CodeBlock*);

    LazyOperandValueProfile* addOperandValueProfile(const LazyOperandValueProfileKey&);
    JSValue* addSpeculationFailureValueProfile(BytecodeIndex);

    UncheckedKeyHashMap<BytecodeIndex, JSValue*> speculationFailureValueProfileBucketsMap();

private:
    friend class LazyOperandValueProfileParser;

    inline void initializeData();

    struct LazyValueProfileHolder {
        WTF_MAKE_STRUCT_TZONE_ALLOCATED(LazyValueProfileHolder);
        ConcurrentVector<LazyOperandValueProfile, 8> operandValueProfiles;
        ConcurrentVector<std::pair<BytecodeIndex, JSValue>, 8> speculationFailureValueProfileBuckets;
    };

    std::unique_ptr<LazyValueProfileHolder> m_data;
};

class LazyOperandValueProfileParser {
    WTF_MAKE_NONCOPYABLE(LazyOperandValueProfileParser);
public:
    LazyOperandValueProfileParser() = default;

    void initialize(CompressedLazyValueProfileHolder&);

    LazyOperandValueProfile* getIfPresent(const LazyOperandValueProfileKey& key) const;

    SpeculatedType prediction(const ConcurrentJSLocker&, const LazyOperandValueProfileKey&) const;
private:
    UncheckedKeyHashMap<LazyOperandValueProfileKey, LazyOperandValueProfile*> m_map;
};

} // namespace JSC
