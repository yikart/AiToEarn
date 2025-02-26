/*
 * Copyright (C) 2016-2019 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/HashTable.h>
#include <wtf/PrintStream.h>

namespace JSC {

class JSCell;

class VisitRaceKey {
public:
    VisitRaceKey() { }
    
    VisitRaceKey(JSCell* cell, const char* raceName)
        : m_cell(cell)
        , m_raceName(raceName)
    {
    }
    
    VisitRaceKey(WTF::HashTableDeletedValueType)
        : m_raceName(m_deletedValueRaceName)
    {
    }
    
    friend bool operator==(const VisitRaceKey&, const VisitRaceKey&) = default;
    
    explicit operator bool() const
    {
        return *this != VisitRaceKey();
    }
    
    void dump(PrintStream& out) const;
    
    JSCell* cell() const { return m_cell; }
    const char* raceName() const { return m_raceName; }
    
    bool isHashTableDeletedValue() const
    {
        return *this == VisitRaceKey(WTF::HashTableDeletedValue);
    }
    
    unsigned hash() const
    {
        return WTF::PtrHash<JSCell*>::hash(m_cell) ^ WTF::PtrHash<const char*>::hash(m_raceName);
    }

private:
    static const char* const m_deletedValueRaceName;
    
    JSCell* m_cell { nullptr };
    const char* m_raceName { nullptr };
};

struct VisitRaceKeyHash {
    static unsigned hash(const VisitRaceKey& key) { return key.hash(); }
    static bool equal(const VisitRaceKey& a, const VisitRaceKey& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::VisitRaceKey> : JSC::VisitRaceKeyHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::VisitRaceKey> : SimpleClassHashTraits<JSC::VisitRaceKey> { };

} // namespace WTF

