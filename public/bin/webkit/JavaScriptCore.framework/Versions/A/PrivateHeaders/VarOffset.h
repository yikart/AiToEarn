/*
 * Copyright (C) 2015-2019 Apple Inc. All rights reserved.
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

#include "DirectArgumentsOffset.h"
#include "ScopeOffset.h"
#include "VirtualRegister.h"
#include <wtf/HashMap.h>

namespace JSC {

enum class VarKind : uint8_t {
    Invalid,
    Scope,
    Stack,
    DirectArgument
};

class VarOffset {
public:
    VarOffset()
        : m_kind(VarKind::Invalid)
        , m_offset(UINT_MAX)
    {
    }
    
    VarOffset(WTF::HashTableDeletedValueType)
        : m_kind(VarKind::Invalid)
        , m_offset(0)
    {
    }
    
    explicit VarOffset(VirtualRegister stackOffset)
    {
        if (!stackOffset.isValid()) {
            m_kind = VarKind::Invalid;
            m_offset = UINT_MAX;
        } else {
            m_kind = VarKind::Stack;
            m_offset = stackOffset.offset();
        }
    }
    
    explicit VarOffset(ScopeOffset scopeOffset)
    {
        if (!scopeOffset) {
            m_kind = VarKind::Invalid;
            m_offset = UINT_MAX;
        } else {
            m_kind = VarKind::Scope;
            m_offset = scopeOffset.offset();
        }
    }
    
    explicit VarOffset(DirectArgumentsOffset capturedArgumentsOffset)
    {
        if (!capturedArgumentsOffset) {
            m_kind = VarKind::Invalid;
            m_offset = UINT_MAX;
        } else {
            m_kind = VarKind::DirectArgument;
            m_offset = capturedArgumentsOffset.offset();
        }
    }
    
    static VarOffset assemble(VarKind kind, unsigned offset)
    {
        VarOffset result;
        result.m_kind = kind;
        result.m_offset = offset;
        result.checkSanity();
        return result;
    }
    
    bool isValid() const
    {
        return m_kind != VarKind::Invalid;
    }
    
    bool operator!() const
    {
        return !isValid();
    }
    
    VarKind kind() const { return m_kind; }
    
    bool isStack() const
    {
        return m_kind == VarKind::Stack;
    }
    
    bool isScope() const
    {
        return m_kind == VarKind::Scope;
    }
    
    bool isDirectArgument() const
    {
        return m_kind == VarKind::DirectArgument;
    }
    
    VirtualRegister stackOffsetUnchecked() const
    {
        if (!isStack())
            return VirtualRegister();
        return VirtualRegister(m_offset);
    }
    
    ScopeOffset scopeOffsetUnchecked() const
    {
        if (!isScope())
            return ScopeOffset();
        return ScopeOffset(m_offset);
    }
    
    DirectArgumentsOffset capturedArgumentsOffsetUnchecked() const
    {
        if (!isDirectArgument())
            return DirectArgumentsOffset();
        return DirectArgumentsOffset(m_offset);
    }
    
    VirtualRegister stackOffset() const
    {
        ASSERT(isStack());
        return VirtualRegister(m_offset);
    }
    
    ScopeOffset scopeOffset() const
    {
        ASSERT(isScope());
        return ScopeOffset(m_offset);
    }
    
    DirectArgumentsOffset capturedArgumentsOffset() const
    {
        ASSERT(isDirectArgument());
        return DirectArgumentsOffset(m_offset);
    }
    
    unsigned rawOffset() const
    {
        ASSERT(isValid());
        return m_offset;
    }
    
    void checkSanity() const
    {
        if (!ASSERT_ENABLED)
            return;
        
        switch (m_kind) {
        case VarKind::Invalid:
            ASSERT(m_offset == UINT_MAX);
            return;
        case VarKind::Scope:
            ASSERT(scopeOffset());
            return;
        case VarKind::Stack:
            ASSERT(stackOffset().isValid());
            return;
        case VarKind::DirectArgument:
            ASSERT(capturedArgumentsOffset());
            return;
        }
        
        ASSERT_NOT_REACHED();
    }
    
    friend bool operator==(const VarOffset&, const VarOffset&) = default;
    
    unsigned hash() const
    {
        return WTF::IntHash<unsigned>::hash((static_cast<unsigned>(m_kind) << 20) + m_offset);
    }
    
    bool isHashTableDeletedValue() const
    {
        return m_kind == VarKind::Invalid && !m_offset;
    }
    
    void dump(PrintStream&) const;
    
private:
    VarKind m_kind;
    unsigned m_offset;
};

struct VarOffsetHash {
    static unsigned hash(const VarOffset& key) { return key.hash(); }
    static bool equal(const VarOffset& a, const VarOffset& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

} // namespace JSC

namespace WTF {

void printInternal(PrintStream&, JSC::VarKind);

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::VarOffset> : JSC::VarOffsetHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::VarOffset> : SimpleClassHashTraits<JSC::VarOffset> {
    static constexpr bool emptyValueIsZero = false;
};

} // namespace WTF
