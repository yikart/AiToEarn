/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2014 Saam Barati. <saambarati1@gmail.com>
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

#include "BasicBlockLocation.h"
#include "SourceID.h"
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

class VM;

struct BasicBlockKey {
    BasicBlockKey()
        : m_startOffset(-3)
        , m_endOffset(-3)
    { }

    BasicBlockKey(int startOffset, int endOffset)
        : m_startOffset(startOffset)
        , m_endOffset(endOffset)
    { }

    BasicBlockKey(WTF::HashTableDeletedValueType)
        : m_startOffset(-2)
        , m_endOffset(-2)
    { }

    bool isHashTableDeletedValue() const { return m_startOffset == -2 && m_endOffset == -2; }
    friend bool operator==(const BasicBlockKey&, const BasicBlockKey&) = default;
    unsigned hash() const { return m_startOffset + m_endOffset + 1; }

    int m_startOffset;
    int m_endOffset;
};

struct BasicBlockKeyHash {
    static unsigned hash(const BasicBlockKey& key) { return key.hash(); }
    static bool equal(const BasicBlockKey& a, const BasicBlockKey& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::BasicBlockKey> : JSC::BasicBlockKeyHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::BasicBlockKey> : SimpleClassHashTraits<JSC::BasicBlockKey> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF

namespace JSC {

struct BasicBlockRange {
    int m_startOffset;
    int m_endOffset;
    bool m_hasExecuted;
    size_t m_executionCount;
};

class ControlFlowProfiler {
    WTF_MAKE_TZONE_ALLOCATED(ControlFlowProfiler);
public:
    ControlFlowProfiler();
    ~ControlFlowProfiler();
    BasicBlockLocation* getBasicBlockLocation(SourceID, int startOffset, int endOffset);
    JS_EXPORT_PRIVATE void dumpData() const;
    Vector<BasicBlockRange> getBasicBlocksForSourceID(SourceID, VM&) const;
    BasicBlockLocation* dummyBasicBlock() { return &m_dummyBasicBlock; }
    JS_EXPORT_PRIVATE bool hasBasicBlockAtTextOffsetBeenExecuted(int, SourceID, VM&); // This function exists for testing.
    JS_EXPORT_PRIVATE size_t basicBlockExecutionCountAtTextOffset(int, SourceID, VM&); // This function exists for testing.

private:
    typedef UncheckedKeyHashMap<BasicBlockKey, BasicBlockLocation*> BlockLocationCache;
    typedef UncheckedKeyHashMap<SourceID, BlockLocationCache> SourceIDBuckets;

    SourceIDBuckets m_sourceIDBuckets;
    BasicBlockLocation m_dummyBasicBlock;
};

} // namespace JSC
