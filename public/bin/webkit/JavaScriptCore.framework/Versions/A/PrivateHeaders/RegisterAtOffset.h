/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
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

#if ENABLE(ASSEMBLER)

#include "Reg.h"
#include "Width.h"
#include <cstddef>
#include <wtf/PrintStream.h>

namespace JSC {

class RegisterAtOffset {
public:
    RegisterAtOffset() = default;
    
    RegisterAtOffset(Reg reg, ptrdiff_t offset, Width width)
        : m_regIndex(reg.index())
        , m_width(width == Width128)
        , m_offsetBits((offset >> 2) & 0xFFFFFFFFFFFFFF)
    {
        ASSERT(!(offset & 0b11));
        ASSERT(width == conservativeWidthWithoutVectors(reg) || Options::useWasmSIMD());
        ASSERT(reg.index() < (1 << 6));
        ASSERT(Reg::last().index() < (1 << 6));
        ASSERT(this->reg() == reg);
        ASSERT(this->offset() == offset);
        ASSERT(this->width() == width);
    }
    
    bool operator!() const { return !reg(); }
    
    Reg reg() const { return Reg::fromIndex(m_regIndex); }
    ptrdiff_t offset() const { return m_offsetBits << 2; }
    size_t byteSize() const { return bytesForWidth(width()); }
    Width width() const { return m_width ? conservativeWidth(reg()) : conservativeWidthWithoutVectors(reg()); }
    int offsetAsIndex() const { ASSERT(!(offset() % sizeof(CPURegister))); return offset() / static_cast<int>(sizeof(CPURegister)); }

    bool operator==(const RegisterAtOffset& other) const
    {
        return reg() == other.reg() && offset() == other.offset() && width() == other.width();
    }
    
    bool operator<(const RegisterAtOffset& other) const
    {
        if (reg() != other.reg())
            return reg() < other.reg();
        return offset() < other.offset();
    }
    
    static Reg getReg(RegisterAtOffset* value) { return value->reg(); }
    
    void dump(PrintStream& out) const;

private:
    unsigned m_regIndex : 7 { Reg().index() };
    unsigned m_width : 1 { false };
    ptrdiff_t m_offsetBits : (sizeof(ptrdiff_t) * CHAR_BIT - 7 - 1) { 0 };
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER)
