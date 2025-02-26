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
#include <wtf/PrintStream.h>

namespace JSC { namespace FTL {

struct ExitArgumentRepresentation {
    DataFormat format;
    unsigned argument;
};

class ExitArgument {
public:
    ExitArgument()
    {
        m_representation.format = DataFormatNone;
    }
    
    ExitArgument(DataFormat format, unsigned argument)
    {
        m_representation.format = format;
        m_representation.argument = argument;
    }
    
    explicit ExitArgument(ExitArgumentRepresentation representation)
    {
        m_representation = representation;
    }
    
    bool operator!() const { return m_representation.format == DataFormatNone; }
    
    DataFormat format() const
    {
        ASSERT(*this);
        return m_representation.format;
    }
    
    unsigned argument() const
    {
        ASSERT(*this);
        return m_representation.argument;
    }
    
    ExitArgument withFormat(DataFormat format)
    {
        return ExitArgument(format, argument());
    }

    ExitArgumentRepresentation representation() const { return m_representation; }
    
    void dump(PrintStream&) const;
    
private:
    ExitArgumentRepresentation m_representation;
};

} } // namespace JSC::FTL

#endif // ENABLE(FTL_JIT)
