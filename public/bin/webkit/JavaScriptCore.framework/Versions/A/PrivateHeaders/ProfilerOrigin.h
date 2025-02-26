/*
 * Copyright (C) 2012-2019 Apple Inc. All rights reserved.
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

#include "BytecodeIndex.h"
#include "CodeBlockHash.h"
#include "JSCJSValue.h"
#include <wtf/PrintStream.h>

namespace JSC {

class CodeBlock;

namespace Profiler {

class Bytecodes;
class Database;
class Dumper;

class Origin {
public:
    Origin() = default;
    Origin(WTF::HashTableDeletedValueType)
        : m_bytecodeIndex(WTF::HashTableDeletedValue)
    { }
    
    Origin(Bytecodes* bytecodes, BytecodeIndex bytecodeIndex)
        : m_bytecodes(bytecodes)
        , m_bytecodeIndex(bytecodeIndex)
    {
        ASSERT(m_bytecodeIndex.offset() < std::numeric_limits<unsigned>::max() - 1);
    }
    
    Origin(Database&, CodeBlock*, BytecodeIndex);
    
    bool operator!() const { return !m_bytecodeIndex; }
    
    Bytecodes* bytecodes() const { return m_bytecodes; }
    BytecodeIndex bytecodeIndex() const { return m_bytecodeIndex; }

    friend bool operator==(const Origin&, const Origin&) = default;
    unsigned hash() const;
    
    bool isHashTableDeletedValue() const;
    
    void dump(PrintStream&) const;
    Ref<JSON::Value> toJSON(Dumper&) const;

private:
    Bytecodes* m_bytecodes;
    BytecodeIndex m_bytecodeIndex;
};

inline unsigned Origin::hash() const
{
    return WTF::PtrHash<Bytecodes*>::hash(m_bytecodes) + m_bytecodeIndex.hash();
}

inline bool Origin::isHashTableDeletedValue() const
{
    return m_bytecodeIndex.isHashTableDeletedValue();
}

struct OriginHash {
    static unsigned hash(const Origin& key) { return key.hash(); }
    static bool equal(const Origin& a, const Origin& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} } // namespace JSC::Profiler

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::Profiler::Origin> : JSC::Profiler::OriginHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::Profiler::Origin> : SimpleClassHashTraits<JSC::Profiler::Origin> { };

} // namespace WTF
