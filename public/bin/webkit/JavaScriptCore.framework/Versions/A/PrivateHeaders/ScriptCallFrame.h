/*
 * Copyright (C) 2014-2024 Apple Inc. All rights reserved.
 * Copyright (c) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DebuggerPrimitives.h"
#include "InspectorProtocolObjects.h"
#include "LineColumn.h"
#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

namespace Inspector {

class ScriptCallFrame  {
public:
    using LineColumn = JSC::LineColumn;

    ScriptCallFrame(const String& functionName, const String& scriptName, JSC::SourceID, LineColumn);
    ScriptCallFrame(const String& functionName, const String& scriptName, const String& preRedirectURL, JSC::SourceID, LineColumn);
    JS_EXPORT_PRIVATE ~ScriptCallFrame();

    const String& functionName() const { return m_functionName; }
    const String& sourceURL() const { return m_scriptName; }
    const String& preRedirectURL() const { return m_preRedirectURL; }
    unsigned lineNumber() const { return m_lineColumn.line; }
    unsigned columnNumber() const { return m_lineColumn.column; }
    JSC::SourceID sourceID() const { return m_sourceID; }

    JS_EXPORT_PRIVATE bool isEqual(const ScriptCallFrame&) const;
    bool isNative() const;

    bool operator==(const ScriptCallFrame& other) const { return isEqual(other); }

    Ref<Protocol::Console::CallFrame> buildInspectorObject() const;

private:
    String m_functionName;
    String m_scriptName;
    String m_preRedirectURL;
    JSC::SourceID m_sourceID;
    LineColumn m_lineColumn;
};

} // namespace Inspector
