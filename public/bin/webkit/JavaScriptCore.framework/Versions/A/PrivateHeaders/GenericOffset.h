/*
 * Copyright (C) 2015-2023 Apple Inc. All rights reserved.
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

#include <limits.h>
#include <wtf/Assertions.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

// A mixin for creating the various kinds of variable offsets that our engine supports.
template<typename T>
class GenericOffset {
    WTF_MAKE_TZONE_ALLOCATED(GenericOffset);
public:
    static constexpr unsigned invalidOffset = UINT_MAX;
    
    GenericOffset()
        : m_offset(invalidOffset)
    {
    }
    
    explicit GenericOffset(unsigned offset)
        : m_offset(offset)
    {
    }
    
    bool operator!() const { return m_offset == invalidOffset; }
    
    unsigned offsetUnchecked() const
    {
        return m_offset;
    }
    
    unsigned offset() const
    {
        ASSERT(m_offset != invalidOffset);
        return m_offset;
    }
    
    friend bool operator==(const GenericOffset&, const GenericOffset&) = default;
    bool operator<(const GenericOffset& other) const
    {
        return m_offset < other.m_offset;
    }
    bool operator>(const GenericOffset& other) const
    {
        return m_offset > other.m_offset;
    }
    bool operator<=(const GenericOffset& other) const
    {
        return m_offset <= other.m_offset;
    }
    bool operator>=(const GenericOffset& other) const
    {
        return m_offset >= other.m_offset;
    }
    
    T operator+(int value) const
    {
        return T(offset() + value);
    }
    T operator-(int value) const
    {
        return T(offset() - value);
    }
    T& operator+=(int value)
    {
        return *static_cast<T*>(this) = *this + value;
    }
    T& operator-=(int value)
    {
        return *static_cast<T*>(this) = *this - value;
    }
    
private:
    unsigned m_offset;
};

} // namespace JSC
