/*
 * Copyright (C) 2011-2019 Apple Inc. All rights reserved.
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

#include "CallFrame.h"
#include "VirtualRegister.h"

#include <wtf/FixedVector.h>
#include <wtf/PrintStream.h>
#include <wtf/Vector.h>

namespace JSC {

template<typename T> struct OperandValueTraits;

constexpr unsigned maxNumCheckpointTmps = 4;

// A OperandKind::Tmp is one that exists for exiting to a checkpoint but does not exist between bytecodes.
enum class OperandKind : uint32_t { Argument, Local, Tmp }; // Keep bit-width in sync with Operand::operandKindBits' definition.
static constexpr OperandKind lastOperandKind = OperandKind::Tmp;

class Operand {
public:
    static constexpr unsigned kindBits = WTF::getMSBSetConstexpr(static_cast<std::underlying_type_t<OperandKind>>(lastOperandKind)) + 1;
    static constexpr unsigned maxBits = 32 + kindBits;
    static_assert(maxBits == 34);

    Operand() = default;
    Operand(const Operand&) = default;

    Operand(VirtualRegister operand)
        : Operand(operand.isLocal() ? OperandKind::Local : OperandKind::Argument, operand.offset())
    { }

    Operand(OperandKind kind, int operand)
#if CPU(LITTLE_ENDIAN)
        : m_operand(operand)
        , m_kind(kind)
#else
        : m_kind(kind)
        , m_operand(operand)
#endif
    { 
        ASSERT(kind == OperandKind::Tmp || VirtualRegister(operand).isLocal() == (kind == OperandKind::Local));
    }
    static Operand tmp(uint32_t index) { return Operand(OperandKind::Tmp, index); }

    Operand& operator=(const Operand&) = default;

    OperandKind kind() const { return m_kind; }
    int value() const { return m_operand; }
    VirtualRegister virtualRegister() const
    {
        ASSERT(m_kind != OperandKind::Tmp);
        return VirtualRegister(m_operand);
    }
    uint64_t asBits() const
    {
        uint64_t bits = std::bit_cast<uint64_t>(*this);
        ASSERT(bits < (1ULL << maxBits));
        return bits;
    }
    static Operand fromBits(uint64_t value);

    bool isTmp() const { return kind() == OperandKind::Tmp; }
    bool isArgument() const { return kind() == OperandKind::Argument; }
    bool isLocal() const { return kind() == OperandKind::Local && virtualRegister().isLocal(); }
    bool isHeader() const { return kind() != OperandKind::Tmp && virtualRegister().isHeader(); }
    bool isConstant() const { return kind() != OperandKind::Tmp && virtualRegister().isConstant(); }

    int toArgument() const { ASSERT(isArgument()); return virtualRegister().toArgument(); }
    int toLocal() const { ASSERT(isLocal()); return virtualRegister().toLocal(); }

    inline bool isValid() const;

    inline bool operator==(const Operand&) const;

    void dump(PrintStream&) const;

private:
#if CPU(LITTLE_ENDIAN)
    int m_operand { VirtualRegister::invalidVirtualRegister };
    OperandKind m_kind { OperandKind::Argument };
#else
    OperandKind m_kind { OperandKind::Argument };
    int m_operand { VirtualRegister::invalidVirtualRegister };
#endif
};

ALWAYS_INLINE bool Operand::operator==(const Operand& other) const
{
    if (kind() != other.kind())
        return false;
    if (isTmp())
        return value() == other.value();
    return virtualRegister() == other.virtualRegister();
}

inline bool Operand::isValid() const
{
    if (isTmp())
        return value() >= 0;
    return virtualRegister().isValid();
}

inline Operand Operand::fromBits(uint64_t value)
{
    Operand result = std::bit_cast<Operand>(value);
    ASSERT(result.isValid());
    return result;
}

static_assert(sizeof(Operand) == sizeof(uint64_t), "Operand::asBits() relies on this.");

enum OperandsLikeTag { OperandsLike };

template<typename T, typename StorageArg = std::conditional_t<std::is_same_v<T, bool>, FastBitVector, Vector<T, 0, UnsafeVectorOverflow>>>
class Operands {
public:
    template<typename, typename> friend class Operands;

    using Storage = StorageArg;
    using RefType = std::conditional_t<std::is_same_v<T, bool>, FastBitReference, T&>;
    using ConstRefType = std::conditional_t<std::is_same_v<T, bool>, bool, const T&>;

    Operands() = default;

    explicit Operands(size_t numArguments, size_t numLocals, size_t numTmps)
        : m_values(numArguments + numLocals + numTmps)
        , m_numArguments(numArguments)
        , m_numLocals(numLocals)
    {
        if (!WTF::VectorTraits<T>::needsInitialization)
            m_values.fill(T());
    }

    explicit Operands(size_t numArguments, size_t numLocals, size_t numTmps, const T& initialValue)
        : m_values(numArguments + numLocals + numTmps, initialValue)
        , m_numArguments(numArguments)
        , m_numLocals(numLocals)
    {
    }
    
    template<typename U, typename V>
    explicit Operands(OperandsLikeTag, const Operands<U, V>& other, const T& initialValue = T())
        : m_values(other.size(), initialValue)
        , m_numArguments(other.numberOfArguments())
        , m_numLocals(other.numberOfLocals())
    {
    }

    template<typename U>
    explicit Operands(const Operands<T, U>& other)
        : m_values(other.m_values)
        , m_numArguments(other.m_numArguments)
        , m_numLocals(other.m_numLocals)
    {
    }

    size_t numberOfArguments() const { return m_numArguments; }
    size_t numberOfLocals() const { return m_numLocals; }
    size_t numberOfTmps() const { return m_values.size() - numberOfArguments() - numberOfLocals(); }

    size_t tmpIndex(size_t idx) const
    {
        ASSERT(idx < numberOfTmps());
        return idx + numberOfArguments() + numberOfLocals();
    }
    size_t argumentIndex(size_t idx) const
    {
        ASSERT(idx < numberOfArguments());
        return idx;
    }
    
    size_t localIndex(size_t idx) const
    {
        ASSERT(idx < numberOfLocals());
        return numberOfArguments() + idx;
    }

    RefType tmp(size_t idx) { return m_values[tmpIndex(idx)]; }
    ConstRefType tmp(size_t idx) const { return m_values[tmpIndex(idx)]; }
    
    RefType argument(size_t idx) { return m_values[argumentIndex(idx)]; }
    ConstRefType argument(size_t idx) const { return m_values[argumentIndex(idx)]; }
    
    RefType local(size_t idx) { return m_values[localIndex(idx)]; }
    ConstRefType local(size_t idx) const { return m_values[localIndex(idx)]; }
    
    template<OperandKind operandKind>
    size_t sizeFor() const
    {
        switch (operandKind) {
        case OperandKind::Tmp:
            return numberOfTmps();
        case OperandKind::Argument:
            return numberOfArguments();
        case OperandKind::Local:
            return numberOfLocals();
        }
        RELEASE_ASSERT_NOT_REACHED();
        return 0;
    }
    template<OperandKind operandKind>
    RefType atFor(size_t idx)
    {
        switch (operandKind) {
        case OperandKind::Tmp:
            return tmp(idx);
        case OperandKind::Argument:
            return argument(idx);
        case OperandKind::Local:
            return local(idx);
        }
        RELEASE_ASSERT_NOT_REACHED();
        return tmp(0);
    }
    template<OperandKind operandKind>
    ConstRefType atFor(size_t idx) const
    {
        switch (operandKind) {
        case OperandKind::Tmp:
            return tmp(idx);
        case OperandKind::Argument:
            return argument(idx);
        case OperandKind::Local:
            return local(idx);
        }
        RELEASE_ASSERT_NOT_REACHED();
        return tmp(0);
    }

    void ensureLocals(size_t size, const T& ensuredValue = T())
    {
        if (size <= numberOfLocals())
            return;

        size_t newSize = numberOfArguments() + numberOfTmps() + size;
        size_t oldNumLocals = numberOfLocals();
        size_t oldNumTmps = numberOfTmps();
        m_values.grow(newSize);
        for (size_t i = 0; i < oldNumTmps; ++i)
            m_values[newSize - 1 - i] = m_values[tmpIndex(oldNumTmps - 1 - i)];

        m_numLocals = size;
        if (ensuredValue != T() || !WTF::VectorTraits<T>::needsInitialization) {
            for (size_t i = 0; i < size - oldNumLocals; ++i)
                m_values[localIndex(oldNumLocals + i)] = ensuredValue;
        }
    }

    void ensureTmps(size_t size, const T& ensuredValue = T())
    {
        if (size <= numberOfTmps())
            return;

        size_t oldSize = m_values.size();
        size_t newSize = numberOfArguments() + numberOfLocals() + size;
        m_values.grow(newSize);

        if (ensuredValue != T() || !WTF::VectorTraits<T>::needsInitialization) {
            for (size_t i = oldSize; i < newSize; ++i)
                m_values[i] = ensuredValue;
        }
    }
    
    void setLocal(size_t idx, const T& value)
    {
        ensureLocals(idx + 1);
        local(idx) = value;
    }
    
    T getLocal(size_t idx)
    {
        return idx >= numberOfLocals() ? T() : local(idx);
    }
    
    void setArgumentFirstTime(size_t idx, const T& value)
    {
        ASSERT(m_values[idx] == T());
        argument(idx) = value;
    }
    
    void setLocalFirstTime(size_t idx, const T& value)
    {
        ASSERT(idx >= numberOfLocals() || local(idx) == T());
        setLocal(idx, value);
    }

    RefType getForOperandIndex(size_t index) { return m_values[index]; }
    ConstRefType getForOperandIndex(size_t index) const { return const_cast<Operands*>(this)->getForOperandIndex(index); }

    size_t operandIndex(VirtualRegister operand) const
    {
        if (operand.isArgument())
            return argumentIndex(operand.toArgument());
        return localIndex(operand.toLocal());
    }
    
    size_t operandIndex(Operand op) const
    {
        if (!op.isTmp())
            return operandIndex(op.virtualRegister());
        return tmpIndex(op.value());
    }
    
    RefType operand(VirtualRegister operand)
    {
        if (operand.isArgument())
            return argument(operand.toArgument());
        return local(operand.toLocal());
    }

    RefType operand(Operand op)
    {
        if (!op.isTmp())
            return operand(op.virtualRegister());
        return tmp(op.value());
    }

    ConstRefType operand(VirtualRegister operand) const { return const_cast<Operands*>(this)->operand(operand); }
    ConstRefType operand(Operand operand) const { return const_cast<Operands*>(this)->operand(operand); }
    
    bool hasOperand(VirtualRegister operand) const
    {
        if (operand.isArgument())
            return true;
        return static_cast<size_t>(operand.toLocal()) < numberOfLocals();
    }
    bool hasOperand(Operand op) const
    {
        if (op.isTmp()) {
            ASSERT(op.value() >= 0);
            return static_cast<size_t>(op.value()) < numberOfTmps();
        }
        return hasOperand(op.virtualRegister());
    }
    
    void setOperand(Operand operand, const T& value)
    {
        this->operand(operand) = value;
    }

    size_t size() const { return m_values.size(); }
    ConstRefType at(size_t index) const { return m_values[index]; }
    RefType at(size_t index) { return m_values[index]; }
    ConstRefType operator[](size_t index) const { return at(index); }
    RefType operator[](size_t index) { return at(index); }

    Operand operandForIndex(size_t index) const
    {
        if (index < numberOfArguments())
            return virtualRegisterForArgumentIncludingThis(index);
        else if (index < numberOfLocals() + numberOfArguments())
            return virtualRegisterForLocal(index - numberOfArguments());
        return Operand::tmp(index - (numberOfLocals() + numberOfArguments()));
    }

    void fill(T value)
    {
        for (size_t i = 0; i < m_values.size(); ++i)
            m_values[i] = value;
    }
    
    void clear()
    {
        fill(T());
    }
    
    bool operator==(const Operands& other) const
    {
        ASSERT(numberOfArguments() == other.numberOfArguments());
        ASSERT(numberOfLocals() == other.numberOfLocals());
        ASSERT(numberOfTmps() == other.numberOfTmps());
        
        return m_values == other.m_values;
    }

    void dumpInContext(PrintStream& out, DumpContext* context) const;
    void dump(PrintStream& out) const;
    
private:
    // The first m_numArguments of m_values are arguments, the next m_numLocals are locals, and the rest are tmps.
    Storage m_values;
    unsigned m_numArguments { 0 };
    unsigned m_numLocals { 0 };
};

template<typename T>
using FixedOperands = Operands<T, std::conditional_t<std::is_same_v<T, bool>, FastBitVector, FixedVector<T>>>;

} // namespace JSC
