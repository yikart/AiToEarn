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

#include "ConcurrentJSLock.h"
#include "Operands.h"
#include "ValueProfile.h"
#include "VirtualRegister.h"
#include <wtf/HashMap.h>
#include <wtf/Noncopyable.h>
#include <wtf/SegmentedVector.h>

namespace JSC {

class ScriptExecutable;

class LazyOperandValueProfileKey {
public:
    LazyOperandValueProfileKey()
        : m_operand(VirtualRegister()) // not a valid operand index in our current scheme
    {
    }
    
    LazyOperandValueProfileKey(WTF::HashTableDeletedValueType)
        : m_bytecodeIndex(WTF::HashTableDeletedValue)
        , m_operand(VirtualRegister()) // not a valid operand index in our current scheme
    {
    }
    
    LazyOperandValueProfileKey(BytecodeIndex bytecodeIndex, Operand operand)
        : m_bytecodeIndex(bytecodeIndex)
        , m_operand(operand)
    {
        ASSERT(m_operand.isValid());
    }
    
    bool operator!() const
    {
        return !m_operand.isValid();
    }
    
    friend bool operator==(const LazyOperandValueProfileKey&, const LazyOperandValueProfileKey&) = default;
    
    unsigned hash() const
    {
        return m_bytecodeIndex.hash() + m_operand.value() + static_cast<unsigned>(m_operand.kind());
    }
    
    BytecodeIndex bytecodeIndex() const
    {
        ASSERT(!!*this);
        return m_bytecodeIndex;
    }

    Operand operand() const
    {
        ASSERT(!!*this);
        return m_operand;
    }
    
    bool isHashTableDeletedValue() const
    {
        return !m_operand.isValid() && m_bytecodeIndex.isHashTableDeletedValue();
    }
private: 
    BytecodeIndex m_bytecodeIndex;
    Operand m_operand;
};

struct LazyOperandValueProfileKeyHash {
    static unsigned hash(const LazyOperandValueProfileKey& key) { return key.hash(); }
    static bool equal(
        const LazyOperandValueProfileKey& a,
        const LazyOperandValueProfileKey& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::LazyOperandValueProfileKey> : JSC::LazyOperandValueProfileKeyHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::LazyOperandValueProfileKey> : public GenericHashTraits<JSC::LazyOperandValueProfileKey> {
    static void constructDeletedValue(JSC::LazyOperandValueProfileKey& slot) { new (NotNull, &slot) JSC::LazyOperandValueProfileKey(HashTableDeletedValue); }
    static bool isDeletedValue(const JSC::LazyOperandValueProfileKey& value) { return value.isHashTableDeletedValue(); }
};

} // namespace WTF

namespace JSC {

struct LazyOperandValueProfile : public MinimalValueProfile {
    LazyOperandValueProfile()
        : MinimalValueProfile()
        , m_operand(VirtualRegister())
    {
    }
    
    explicit LazyOperandValueProfile(const LazyOperandValueProfileKey& key)
        : MinimalValueProfile()
        , m_key(key)
    {
    }
    
    LazyOperandValueProfileKey key() const
    {
        return m_key;
    }

    VirtualRegister m_operand;
    LazyOperandValueProfileKey m_key;
};

} // namespace JSC
