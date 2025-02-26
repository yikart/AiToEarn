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

#if ENABLE(FTL_JIT)

#include "FTLExitArgument.h"
#include "FTLRecoveryOpcode.h"
#include "JSCJSValue.h"
#include "VirtualRegister.h"
#include <wtf/PrintStream.h>

namespace JSC {

class TrackedReferences;

namespace FTL {

// This is like ValueRecovery, but respects the way that the FTL does OSR
// exit: the live non-constant non-flushed values are passed as arguments
// to a noreturn tail call. ExitValue is hence mostly responsible for
// telling us the mapping between operands in bytecode and the arguments to
// the call.

enum ExitValueKind : uint8_t {
    InvalidExitValue,
    ExitValueDead,
    ExitValueArgument,
    ExitValueConstant,
    ExitValueInJSStack,
    ExitValueInJSStackAsInt32,
    ExitValueInJSStackAsInt52,
    ExitValueInJSStackAsDouble,
    ExitValueMaterializeNewObject
};

class ExitTimeObjectMaterialization;

class ExitValue {
public:
    ExitValue()
        : m_kind(InvalidExitValue)
    {
    }
    
    bool operator!() const { return m_kind == InvalidExitValue; }
    
    static ExitValue dead()
    {
        ExitValue result;
        result.m_kind = ExitValueDead;
        return result;
    }
    
    static ExitValue inJSStack(VirtualRegister reg)
    {
        ExitValue result;
        result.m_kind = ExitValueInJSStack;
        UnionType u;
        u.virtualRegister = reg.offset();
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue inJSStackAsInt32(VirtualRegister reg)
    {
        ExitValue result;
        result.m_kind = ExitValueInJSStackAsInt32;
        UnionType u;
        u.virtualRegister = reg.offset();
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue inJSStackAsInt52(VirtualRegister reg)
    {
        ExitValue result;
        result.m_kind = ExitValueInJSStackAsInt52;
        UnionType u;
        u.virtualRegister = reg.offset();
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue inJSStackAsDouble(VirtualRegister reg)
    {
        ExitValue result;
        result.m_kind = ExitValueInJSStackAsDouble;
        UnionType u;
        u.virtualRegister = reg.offset();
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue constant(JSValue value)
    {
        ExitValue result;
        result.m_kind = ExitValueConstant;
        UnionType u;
        u.constant = JSValue::encode(value);
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue exitArgument(const ExitArgument& argument)
    {
        ExitValue result;
        result.m_kind = ExitValueArgument;
        UnionType u;
        u.argument = argument.representation();
        result.m_value = WTFMove(u);
        return result;
    }
    
    static ExitValue materializeNewObject(ExitTimeObjectMaterialization*);
    
    ExitValueKind kind() const { return m_kind; }
    
    bool isDead() const { return kind() == ExitValueDead; }
    bool isInJSStackSomehow() const
    {
        switch (kind()) {
        case ExitValueInJSStack:
        case ExitValueInJSStackAsInt32:
        case ExitValueInJSStackAsInt52:
        case ExitValueInJSStackAsDouble:
            return true;
        default:
            return false;
        }
    }
    bool isConstant() const { return kind() == ExitValueConstant; }
    bool isArgument() const { return kind() == ExitValueArgument; }
    bool isObjectMaterialization() const { return kind() == ExitValueMaterializeNewObject; }
    bool hasIndexInStackmapLocations() const { return isArgument(); }
    
    ExitArgument exitArgument() const
    {
        ASSERT(isArgument());
        return ExitArgument(m_value.get().argument);
    }
    
    void adjustStackmapLocationsIndexByOffset(unsigned offset)
    {
        ASSERT(hasIndexInStackmapLocations());
        ASSERT(isArgument());
        UnionType u = m_value.get();
        u.argument.argument += offset;
        m_value = WTFMove(u);
    }
    
    JSValue constant() const
    {
        ASSERT(isConstant());
        return JSValue::decode(m_value.get().constant);
    }
    
    VirtualRegister virtualRegister() const
    {
        ASSERT(isInJSStackSomehow());
        return VirtualRegister(m_value.get().virtualRegister);
    }
    
    ExitTimeObjectMaterialization* objectMaterialization() const
    {
        ASSERT(isObjectMaterialization());
        return m_value.get().newObjectMaterializationData;
    }

    ExitValue withVirtualRegister(VirtualRegister virtualRegister) const
    {
        ASSERT(isInJSStackSomehow());
        ExitValue result;
        result.m_kind = m_kind;
        UnionType u;
        u.virtualRegister = virtualRegister.offset();
        result.m_value = WTFMove(u);
        return result;
    }
    
    ExitValue withLocalsOffset(int offset) const;
    
    // If it's in the JSStack somehow, this will tell you what format it's in, in a manner
    // that is compatible with exitArgument().format(). If it's a constant or it's dead, it
    // will claim to be a JSValue. If it's an argument then it will tell you the argument's
    // format.
    DataFormat dataFormat() const;

    void dump(PrintStream&) const;
    void dumpInContext(PrintStream&, DumpContext*) const;
    
    void validateReferences(const TrackedReferences&) const;
    
private:
    ExitValueKind m_kind;
    union UnionType {
        ExitArgumentRepresentation argument;
        EncodedJSValue constant;
        int virtualRegister;
        ExitTimeObjectMaterialization* newObjectMaterializationData;
    };
    Packed<UnionType> m_value;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
