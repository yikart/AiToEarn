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

#include "ArrayProfile.h"
#include "BytecodeStructs.h"
#include "Instruction.h"
#include "InterpreterInlines.h"
#include "Opcode.h"

namespace JSC {

enum OpcodeShape {
    AnyOpcodeShape,
    OpCallShape,
};

template<OpcodeShape shape, typename = std::enable_if_t<shape != AnyOpcodeShape>>
inline bool isOpcodeShape(OpcodeID opcodeID)
{
    if (shape == OpCallShape) {
        return opcodeID == op_call
            || opcodeID == op_tail_call
            || opcodeID == op_call_direct_eval
            || opcodeID == op_call_varargs
            || opcodeID == op_call_ignore_result
            || opcodeID == op_tail_call_varargs
            || opcodeID == op_tail_call_forward_arguments
            || opcodeID == op_iterator_open
            || opcodeID == op_iterator_next;
    }

    RELEASE_ASSERT_NOT_REACHED();
}

template<OpcodeShape shape, typename = std::enable_if_t<shape != AnyOpcodeShape>>
inline bool isOpcodeShape(const JSInstruction* instruction)
{
    return isOpcodeShape<shape>(instruction->opcodeID());
}

template<typename T, typename... Args>
void getOpcodeType(OpcodeID opcodeID, Args&&... args)
{

#define CASE(__Op) \
    case __Op::opcodeID: \
        T::template withOpcodeType<__Op>(std::forward<Args>(args)...); \
        break; \

    switch (opcodeID) {
        FOR_EACH_BYTECODE_STRUCT(CASE)
    default:
        ASSERT_NOT_REACHED();
    }

#undef CASE
}

} // namespace JSC
