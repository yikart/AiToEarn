/*
 * Copyright (C) 2017-2019 Apple Inc. All rights reserved.
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

#include <wtf/HashTraits.h>

namespace JSC {

class FunctionExecutable;
class JSObject;

struct ClassInfo;

class PrototypeKey {
public:
    PrototypeKey() { }
    
    PrototypeKey(JSObject* prototype, FunctionExecutable* executable, unsigned inlineCapacity, const ClassInfo* classInfo)
        : m_prototype(prototype)
        , m_executable(executable)
        , m_inlineCapacity(inlineCapacity)
        , m_classInfo(classInfo)
    {
    }
    
    PrototypeKey(WTF::HashTableDeletedValueType)
        : m_inlineCapacity(1)
    {
    }
    
    JSObject* prototype() const { return m_prototype; }
    FunctionExecutable* executable() const { return m_executable; }
    unsigned inlineCapacity() const { return m_inlineCapacity; }
    const ClassInfo* classInfo() const { return m_classInfo; }
    
    friend bool operator==(const PrototypeKey&, const PrototypeKey&) = default;
    
    explicit operator bool() const { return *this != PrototypeKey(); }
    bool isHashTableDeletedValue() const { return *this == PrototypeKey(WTF::HashTableDeletedValue); }
    
    unsigned hash() const
    {
        return WTF::IntHash<uintptr_t>::hash(std::bit_cast<uintptr_t>(m_prototype) ^ std::bit_cast<uintptr_t>(m_executable) ^ std::bit_cast<uintptr_t>(m_classInfo)) + m_inlineCapacity;
    }
    
private:
    // WARNING: We require all of these default values to be zero. Otherwise, you'll need to add
    // "static constexpr bool emptyValueIsZero = false;" to the HashTraits at the bottom of this file.
    JSObject* m_prototype { nullptr }; 
    FunctionExecutable* m_executable { nullptr }; 
    unsigned m_inlineCapacity { 0 };
    const ClassInfo* m_classInfo { nullptr };
};

struct PrototypeKeyHash {
    static unsigned hash(const PrototypeKey& key) { return key.hash(); }
    static bool equal(const PrototypeKey& a, const PrototypeKey& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename> struct DefaultHash;
template<> struct DefaultHash<JSC::PrototypeKey> : JSC::PrototypeKeyHash { };

template<typename> struct HashTraits;
template<> struct HashTraits<JSC::PrototypeKey> : SimpleClassHashTraits<JSC::PrototypeKey> { };

} // namespace WTF
