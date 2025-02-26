/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include <wtf/PrintStream.h>
#include <wtf/text/CString.h>

namespace JSC { namespace Profiler {

class Database;

#define JSC_PROFILER_OBJECT_KEYS(macro) \
    macro(bytecode) \
    macro(bytecodeIndex) \
    macro(bytecodes) \
    macro(bytecodesID) \
    macro(counters) \
    macro(opcode) \
    macro(description) \
    macro(descriptions) \
    macro(hash) \
    macro(inferredName) \
    macro(sourceCode) \
    macro(instructionCount) \
    macro(compilationKind) \
    macro(compilationUID) \
    macro(compilations) \
    macro(profiledBytecodes) \
    macro(origin) \
    macro(osrExitSites) \
    macro(osrExits) \
    macro(executionCount) \
    macro(exitKind) \
    macro(numInlinedCalls) \
    macro(numInlinedGetByIds) \
    macro(numInlinedPutByIds) \
    macro(additionalJettisonReason) \
    macro(jettisonReason) \
    macro(uid) \
    macro(events) \
    macro(summary) \
    macro(isWatchpoint) \
    macro(detail) \
    macro(time) \
    macro(id) \
    macro(header) \
    macro(count) \


class Dumper {
public:
    class Keys {
    public:
#define JSC_DEFINE_PROFILER_OBJECT_KEY(key) String m_##key { #key ""_s };
        JSC_PROFILER_OBJECT_KEYS(JSC_DEFINE_PROFILER_OBJECT_KEY)
#undef JSC_DEFINE_PROFILER_OBJECT_KEY
    };

    Dumper(const Database& database)
        : m_database(database)
    {
    }

    const Database& database() const { return m_database; }
    const Keys& keys() const { return m_keys; }

private:
    const Database& m_database;
    Keys m_keys;
};

} } // namespace JSC::Profiler
