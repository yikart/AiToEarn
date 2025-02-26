/*
 * Copyright (C) 2013-2024 Apple Inc. All rights reserved.
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

#include "DebuggerPrimitives.h"
#include <wtf/Noncopyable.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class Debugger;
class JSGlobalObject;

class Breakpoint : public RefCounted<Breakpoint> {
    WTF_MAKE_NONCOPYABLE(Breakpoint);
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(Breakpoint, JS_EXPORT_PRIVATE);
public:
    struct Action {
        enum class Type : uint8_t {
            Log,
            Evaluate,
            Sound,
            Probe,
        };

        Action(Type);

        Type type;
        String data;
        BreakpointActionID id { noBreakpointActionID };
        bool emulateUserGesture { false };
    };

    using ActionsVector = Vector<Action>;

    JS_EXPORT_PRIVATE static Ref<Breakpoint> create(BreakpointID, const String& condition = nullString(), ActionsVector&& = { }, bool autoContinue = false, size_t ignoreCount = 0);

    BreakpointID id() const { return m_id; }

    SourceID sourceID() const { return m_sourceID; }
    unsigned lineNumber() const { return m_lineNumber; }
    unsigned columnNumber() const { return m_columnNumber; }

    const String& condition() const { return m_condition; }
    const ActionsVector& actions() const { return m_actions; }
    bool isAutoContinue() const { return m_autoContinue; }

    void resetHitCount() { m_hitCount = 0; }

    // Associates this breakpoint with a position in a specific source code.
    bool link(SourceID, unsigned lineNumber, unsigned columnNumber);
    bool isLinked() const { return m_sourceID != noSourceID; }

    // Adjust the previously associated position to the next pause opportunity.
    bool resolve(unsigned lineNumber, unsigned columnNumber);
    bool isResolved() const { return m_resolved; }

    bool shouldPause(Debugger&, JSGlobalObject*);

private:
    Breakpoint(BreakpointID, String condition = nullString(), ActionsVector&& = { }, bool autoContinue = false, size_t ignoreCount = 0);

    BreakpointID m_id { noBreakpointID };

    SourceID m_sourceID { noSourceID };

    // FIXME: <https://webkit.org/b/162771> Web Inspector: Adopt TextPosition in Inspector to avoid oneBasedInt/zeroBasedInt ambiguity
    unsigned m_lineNumber { 0 };
    unsigned m_columnNumber { 0 };

    bool m_resolved { false };

    String m_condition;
    ActionsVector m_actions;
    bool m_autoContinue { false };
    size_t m_ignoreCount { 0 };
    size_t m_hitCount { 0 };
};

using BreakpointsVector = Vector<Ref<JSC::Breakpoint>>;

} // namespace JSC
