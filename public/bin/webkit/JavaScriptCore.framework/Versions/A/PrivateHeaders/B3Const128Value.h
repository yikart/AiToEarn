/*
  * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if ENABLE(B3_JIT)

#include "B3Value.h"

namespace JSC { namespace B3 {

class JS_EXPORT_PRIVATE Const128Value final : public Value {
public:
    static inline bool accepts(Kind kind) { return kind == Const128; }

    ~Const128Value() final;

    inline v128_t value() const { return m_value; }

    Value* vectorAndConstant(Procedure&, const Value* other) const final;
    Value* vectorOrConstant(Procedure&, const Value* other) const final;
    Value* vectorXorConstant(Procedure&, const Value* other) const final;

    B3_SPECIALIZE_VALUE_FOR_NO_CHILDREN

protected:
    void dumpMeta(CommaPrinter&, PrintStream&) const final;

    inline Const128Value(Origin origin, v128_t value)
        : Value(CheckedOpcode, Const128, V128, Zero, origin)
        , m_value(value)
    {
    }

private:
    static inline Opcode opcodeFromConstructor(Origin, v128_t) { return Const128; }
    friend class Procedure;
    friend class Value;

    v128_t m_value;
};

} } // namespace JSC::B3

#endif // ENABLE(B3_JIT)
