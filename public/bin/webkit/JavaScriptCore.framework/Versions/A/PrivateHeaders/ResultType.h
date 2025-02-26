/*
 * Copyright (C) 2008 Apple Inc. All rights reserved.
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

namespace JSC {

    // FIXME: Consider whether this is actually necessary. Is LLInt and Baseline's profiling information enough?
    // https://bugs.webkit.org/show_bug.cgi?id=201659
    struct ResultType {
    private:
        friend struct OperandTypes;

        using Type = uint8_t;
        static constexpr Type TypeInt32       = 0x1 << 0;
        static constexpr Type TypeMaybeNumber = 0x1 << 1;
        static constexpr Type TypeMaybeString = 0x1 << 2;
        static constexpr Type TypeMaybeBigInt = 0x1 << 3;
        static constexpr Type TypeMaybeNull   = 0x1 << 4;
        static constexpr Type TypeMaybeBool   = 0x1 << 5;
        static constexpr Type TypeMaybeOther  = 0x1 << 6;

        static constexpr Type TypeBits = TypeMaybeNumber | TypeMaybeString | TypeMaybeBigInt | TypeMaybeNull | TypeMaybeBool | TypeMaybeOther;

    public:
        static constexpr int numBitsNeeded = 7;
        static_assert((TypeBits & ((1 << numBitsNeeded) - 1)) == TypeBits, "This is necessary for correctness.");

        constexpr explicit ResultType()
            : ResultType(unknownType())
        {
        }
        constexpr explicit ResultType(Type type)
            : m_bits(type)
        {
        }

        constexpr bool isInt32() const
        {
            return m_bits & TypeInt32;
        }

        constexpr bool definitelyIsNumber() const
        {
            return (m_bits & TypeBits) == TypeMaybeNumber;
        }
        
        constexpr bool definitelyIsString() const
        {
            return (m_bits & TypeBits) == TypeMaybeString;
        }

        constexpr bool definitelyIsBoolean() const
        {
            return (m_bits & TypeBits) == TypeMaybeBool;
        }

        constexpr bool definitelyIsBigInt() const
        {
            return (m_bits & TypeBits) == TypeMaybeBigInt;
        }

        constexpr bool definitelyIsNull() const
        {
            return (m_bits & TypeBits) == TypeMaybeNull;
        }

        constexpr bool mightBeUndefinedOrNull() const
        {
            return m_bits & (TypeMaybeNull | TypeMaybeOther);
        }

        constexpr bool mightBeNumber() const
        {
            return m_bits & TypeMaybeNumber;
        }

        constexpr bool isNotNumber() const
        {
            return !mightBeNumber();
        }
        
        constexpr bool mightBeBigInt() const
        {
            return m_bits & TypeMaybeBigInt;
        }

        constexpr bool isNotBigInt() const
        {
            return !mightBeBigInt();
        }
        
        static constexpr ResultType nullType()
        {
            return ResultType(TypeMaybeNull);
        }
        
        static constexpr ResultType booleanType()
        {
            return ResultType(TypeMaybeBool);
        }
        
        static constexpr ResultType numberType()
        {
            return ResultType(TypeMaybeNumber);
        }
        
        static constexpr ResultType numberTypeIsInt32()
        {
            return ResultType(TypeInt32 | TypeMaybeNumber);
        }
        
        static constexpr ResultType stringOrNumberType()
        {
            return ResultType(TypeMaybeNumber | TypeMaybeString);
        }
        
        static constexpr ResultType addResultType()
        {
            return ResultType(TypeMaybeNumber | TypeMaybeString | TypeMaybeBigInt);
        }
        
        static constexpr ResultType stringType()
        {
            return ResultType(TypeMaybeString);
        }
        
        static constexpr ResultType bigIntType()
        {
            return ResultType(TypeMaybeBigInt);
        }
        
        static constexpr ResultType bigIntOrInt32Type()
        {
            return ResultType(TypeMaybeBigInt | TypeInt32 | TypeMaybeNumber);
        }

        static constexpr ResultType bigIntOrNumberType()
        {
            return ResultType(TypeMaybeBigInt | TypeMaybeNumber);
        }

        static constexpr ResultType unknownType()
        {
            return ResultType(TypeBits);
        }
        
        static constexpr ResultType forAdd(ResultType op1, ResultType op2)
        {
            if (op1.definitelyIsNumber() && op2.definitelyIsNumber())
                return numberType();
            if (op1.definitelyIsString() || op2.definitelyIsString())
                return stringType();
            if (op1.definitelyIsBigInt() && op2.definitelyIsBigInt())
                return bigIntType();
            return addResultType();
        }

        static constexpr ResultType forNonAddArith(ResultType op1, ResultType op2)
        {
            if (op1.definitelyIsNumber() && op2.definitelyIsNumber())
                return numberType();
            if (op1.definitelyIsBigInt() && op2.definitelyIsBigInt())
                return bigIntType();
            return bigIntOrNumberType();
        }

        static constexpr ResultType forUnaryArith(ResultType op)
        {
            if (op.definitelyIsNumber())
                return numberType();
            if (op.definitelyIsBigInt())
                return bigIntType();
            return bigIntOrNumberType();
        }

        // Unlike in C, a logical op produces the value of the
        // last expression evaluated (and not true or false).
        static constexpr ResultType forLogicalOp(ResultType op1, ResultType op2)
        {
            if (op1.definitelyIsBoolean() && op2.definitelyIsBoolean())
                return booleanType();
            if (op1.definitelyIsNumber() && op2.definitelyIsNumber())
                return numberType();
            if (op1.definitelyIsString() && op2.definitelyIsString())
                return stringType();
            if (op1.definitelyIsBigInt() && op2.definitelyIsBigInt())
                return bigIntType();
            return unknownType();
        }

        static constexpr ResultType forCoalesce(ResultType op1, ResultType op2)
        {
            if (op1.definitelyIsNull())
                return op2;
            if (!op1.mightBeUndefinedOrNull())
                return op1;
            return unknownType();
        }

        static constexpr ResultType forBitOp()
        {
            return bigIntOrInt32Type();
        }

        constexpr Type bits() const { return m_bits; }

        void dump(PrintStream& out) const
        {
            // FIXME: more meaningful information
            // https://bugs.webkit.org/show_bug.cgi?id=190930
            out.print(bits());
        }

    private:
        Type m_bits;
    };
    
    struct OperandTypes
    {
        OperandTypes(ResultType first = ResultType::unknownType(), ResultType second = ResultType::unknownType())
        {
            m_first = first.m_bits;
            m_second = second.m_bits;
        }
        
        ResultType::Type m_first;
        ResultType::Type m_second;

        ResultType first() const
        {
            return ResultType(m_first);
        }

        ResultType second() const
        {
            return ResultType(m_second);
        }

        uint16_t bits()
        {
            static_assert(sizeof(OperandTypes) == sizeof(uint16_t));
            return std::bit_cast<uint16_t>(*this);
        }

        static OperandTypes fromBits(uint16_t bits)
        {
            return std::bit_cast<OperandTypes>(bits);
        }

        void dump(PrintStream& out) const
        {
            out.print("OperandTypes(", first(),  ", ", second(), ")");
        }
    };

} // namespace JSC
