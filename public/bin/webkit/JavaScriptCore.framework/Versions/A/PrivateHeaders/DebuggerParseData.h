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

#include "ParserTokens.h"
#include <wtf/Function.h>
#include <wtf/Vector.h>

namespace JSC {

class SourceProvider;
class VM;

// The order of the constants here matters as it is used for
// sorting pause positions that have same offset.
enum class DebuggerPausePositionType { Invalid, Enter, Pause, Leave };
struct DebuggerPausePosition {
    DebuggerPausePositionType type { DebuggerPausePositionType::Invalid };
    JSTextPosition position;
};

class DebuggerPausePositions {
public:
    DebuggerPausePositions() { }
    ~DebuggerPausePositions() { }

    void appendPause(const JSTextPosition& position)
    {
        m_positions.append({ DebuggerPausePositionType::Pause, position });
    }

    void appendEntry(const JSTextPosition& position)
    {
        m_positions.append({ DebuggerPausePositionType::Enter, position });
    }

    void appendLeave(const JSTextPosition& position)
    {
        m_positions.append({ DebuggerPausePositionType::Leave, position });
    }

    void forEachBreakpointLocation(int startLine, int startColumn, int endLine, int endColumn, Function<void(const JSTextPosition&)>&&);

    std::optional<JSTextPosition> breakpointLocationForLineColumn(int line, int column);

    void sort();

private:
    using Positions = Vector<DebuggerPausePosition>;

    Positions::iterator firstPositionAfter(int line, int column);
    std::optional<JSTextPosition> breakpointLocationForLineColumn(int line, int column, Positions::iterator);

    Positions m_positions;
};


struct DebuggerParseData {
    DebuggerParseData() { }
    ~DebuggerParseData() { }

    DebuggerPausePositions pausePositions;
};

bool gatherDebuggerParseDataForSource(VM&, SourceProvider*, DebuggerParseData&);

} // namespace JSC
