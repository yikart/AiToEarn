/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#include "DFGPromotedHeapLocation.h"
#include "FTLExitValue.h"

namespace JSC {

class TrackedReferences;

namespace FTL {

class ExitPropertyValue {
public:
    ExitPropertyValue()
    {
    }
    
    ExitPropertyValue(DFG::PromotedLocationDescriptor location, const ExitValue& value)
        : m_location(location)
        , m_value(value)
    {
        ASSERT(!!location == !!value);
    }
    
    bool operator!() const { return !m_location; }
    
    DFG::PromotedLocationDescriptor location() const { return m_location; }
    const ExitValue& value() const { return m_value; }
    
    ExitPropertyValue withLocalsOffset(int offset) const;
    
    void dump(PrintStream& out) const;
    
    void validateReferences(const TrackedReferences&) const;

private:
    DFG::PromotedLocationDescriptor m_location;
    ExitValue m_value;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
