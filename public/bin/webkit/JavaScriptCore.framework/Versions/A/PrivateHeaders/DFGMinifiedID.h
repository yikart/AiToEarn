/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

#include "DFGCommon.h"
#include <wtf/HashMap.h>
#include <wtf/Packed.h>
#include <wtf/PrintStream.h>

namespace JSC { namespace DFG {

class Graph;
class MinifiedNode;
class ValueSource;
struct Node;

class MinifiedID {
public:
    MinifiedID() = default;
    MinifiedID(WTF::HashTableDeletedValueType) : m_index(otherInvalidIndex()) { }
    explicit MinifiedID(Node* node);
    
    bool operator!() const { return m_index.get() == invalidIndex(); }
    
    bool operator==(const MinifiedID& other) const { return m_index.get() == other.m_index.get(); }
    bool operator<(const MinifiedID& other) const { return m_index.get() < other.m_index.get(); }
    bool operator>(const MinifiedID& other) const { return m_index.get() > other.m_index.get(); }
    bool operator<=(const MinifiedID& other) const { return m_index.get() <= other.m_index.get(); }
    bool operator>=(const MinifiedID& other) const { return m_index.get() >= other.m_index.get(); }
    
    unsigned hash() const { return WTF::IntHash<unsigned>::hash(m_index.get()); }
    
    void dump(PrintStream& out) const { out.print(m_index.get()); }
    
    bool isHashTableDeletedValue() const { return m_index.get() == otherInvalidIndex(); }
    
    static MinifiedID fromBits(unsigned value)
    {
        MinifiedID result;
        result.m_index = value;
        return result;
    }
    
    unsigned bits() const { return m_index.get(); }

private:
    friend class MinifiedNode;
    
    static constexpr unsigned invalidIndex() { return static_cast<unsigned>(-1); }
    static constexpr unsigned otherInvalidIndex() { return static_cast<unsigned>(-2); }
    
    Packed<unsigned> m_index { invalidIndex() };
};

struct MinifiedIDHash {
    static unsigned hash(const MinifiedID& key) { return key.hash(); }
    static bool equal(const MinifiedID& a, const MinifiedID& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} } // namespace JSC::DFG

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::DFG::MinifiedID> : JSC::DFG::MinifiedIDHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::DFG::MinifiedID> : SimpleClassHashTraits<JSC::DFG::MinifiedID> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF
