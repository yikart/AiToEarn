/*
 * Copyright (C) 2015-2016 Apple Inc. All rights reserved.
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

#include "RegisterAtOffset.h"
#include "RegisterSet.h"
#include <wtf/FixedVector.h>

namespace JSC {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(RegisterAtOffsetList);
class RegisterAtOffsetList {
    WTF_MAKE_STRUCT_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(RegisterAtOffsetList);
public:
    enum OffsetBaseType { FramePointerBased, ZeroBased };

    RegisterAtOffsetList();
    explicit RegisterAtOffsetList(RegisterSet, OffsetBaseType = FramePointerBased);

    void dump(PrintStream&) const;

    size_t registerCount() const { return m_registers.size(); }
    size_t sizeOfAreaInBytes() const { return m_sizeOfAreaInBytes; }

    const RegisterAtOffset& at(size_t index) const
    {
        return m_registers.at(index);
    }

    void adjustOffsets(ptrdiff_t addend)
    {
        // This preserves m_sizeOfAreaInBytes
        for (RegisterAtOffset &item : m_registers)
            item = RegisterAtOffset { item.reg(), item.offset() + addend, item.width() };
    }

    RegisterAtOffset* find(Reg) const;
    unsigned indexOf(Reg) const; // Returns UINT_MAX if not found.

    FixedVector<RegisterAtOffset>::const_iterator begin() const { return m_registers.begin(); }
    FixedVector<RegisterAtOffset>::const_iterator end() const { return m_registers.end(); }


    static const RegisterAtOffsetList& llintBaselineCalleeSaveRegisters(); // Registers and Offsets saved and used by the LLInt.
    static const RegisterAtOffsetList& dfgCalleeSaveRegisters(); // Registers and Offsets saved and used by DFG.

private:
    FixedVector<RegisterAtOffset> m_registers;
    size_t m_sizeOfAreaInBytes { 0 };
};

} // namespace JSC

#endif // ENABLE(ASSEMBLER)
