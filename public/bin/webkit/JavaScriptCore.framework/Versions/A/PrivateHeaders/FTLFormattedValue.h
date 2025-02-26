/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "DataFormat.h"
#include "FTLAbbreviatedTypes.h"

namespace JSC { namespace FTL {

// This class is mostly used for OSR; it's a way of specifying how a value is formatted
// in cases where it wouldn't have been obvious from looking at other indicators (like
// the type of the B3::Value* or the type of the DFG::Node).

class FormattedValue {
public:
    FormattedValue()
        : m_format(DataFormatNone)
        , m_value(nullptr)
    {
    }
    
    FormattedValue(DataFormat format, LValue value)
        : m_format(format)
        , m_value(value)
    {
    }
    
    bool operator!() const
    {
        ASSERT((m_format == DataFormatNone) == !m_value);
        return m_format == DataFormatNone;
    }
    
    DataFormat format() const { return m_format; }
    LValue value() const { return m_value; }

private:
    DataFormat m_format;
    LValue m_value;
};

static inline FormattedValue noValue() { return FormattedValue(); }
static inline FormattedValue int32Value(LValue value) { return FormattedValue(DataFormatInt32, value); }
static inline FormattedValue booleanValue(LValue value) { return FormattedValue(DataFormatBoolean, value); }
static inline FormattedValue jsValueValue(LValue value) { return FormattedValue(DataFormatJS, value); }
static inline FormattedValue doubleValue(LValue value) { return FormattedValue(DataFormatDouble, value); }

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
