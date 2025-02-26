/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "Allocator.h"

namespace JSC {

class JITAllocator {
public:
    enum Kind {
        Constant,
        Variable
    };
    
    JITAllocator() { }
    
    static JITAllocator constant(Allocator allocator)
    {
        JITAllocator result;
        result.m_kind = Constant;
        result.m_allocator = allocator;
        return result;
    }
    
    static JITAllocator variable()
    {
        JITAllocator result;
        result.m_kind = Variable;
        return result;
    }
    
    friend bool operator==(const JITAllocator&, const JITAllocator&) = default;
    
    explicit operator bool() const
    {
        return *this != JITAllocator();
    }
    
    Kind kind() const { return m_kind; }
    bool isConstant() const { return m_kind == Constant; }
    bool isVariable() const { return m_kind == Variable; }
    
    Allocator allocator() const
    {
        RELEASE_ASSERT(isConstant());
        return m_allocator;
    }
    
private:
    Kind m_kind { Constant };
    Allocator m_allocator;
};

} // namespace JSC

