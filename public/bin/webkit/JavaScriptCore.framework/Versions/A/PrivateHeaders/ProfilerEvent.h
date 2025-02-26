/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "JSCJSValue.h"
#include <wtf/PrintStream.h>
#include <wtf/WallTime.h>
#include <wtf/text/CString.h>

namespace JSC { namespace Profiler {

class Bytecodes;
class Compilation;
class Dumper;

class Event {
public:
    Event()
    {
    }
    
    Event(WallTime time, Bytecodes* bytecodes, Compilation* compilation, const char* summary, const CString& detail)
        : m_time(time)
        , m_bytecodes(bytecodes)
        , m_compilation(compilation)
        , m_summary(summary)
        , m_detail(detail)
    {
    }
    
    explicit operator bool() const
    {
        return m_bytecodes;
    }
    
    WallTime time() const { return m_time; }
    Bytecodes* bytecodes() const { return m_bytecodes; }
    Compilation* compilation() const { return m_compilation; }
    const char* summary() const { return m_summary; }
    const CString& detail() const { return m_detail; }
    
    void dump(PrintStream&) const;
    Ref<JSON::Value> toJSON(Dumper&) const;
    
private:
    WallTime m_time { };
    Bytecodes* m_bytecodes { nullptr };
    Compilation* m_compilation { nullptr };
    const char* m_summary { nullptr };
    CString m_detail;
};

} } // namespace JSC::Profiler
