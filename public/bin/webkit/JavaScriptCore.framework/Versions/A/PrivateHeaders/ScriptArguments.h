/*
 * Copyright (C) 2014-2018 Apple Inc. All rights reserved.
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

#include "Strong.h"
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>
#include <wtf/text/MakeString.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
}

namespace Inspector {

class ScriptArguments : public RefCounted<ScriptArguments> {
public:
    JS_EXPORT_PRIVATE static Ref<ScriptArguments> create(JSC::JSGlobalObject*, Vector<JSC::Strong<JSC::Unknown>>&& arguments);
    JS_EXPORT_PRIVATE ~ScriptArguments();

    JS_EXPORT_PRIVATE JSC::JSValue argumentAt(size_t) const;
    size_t argumentCount() const { return m_arguments.size(); }

    JS_EXPORT_PRIVATE JSC::JSGlobalObject* globalObject() const;

    JS_EXPORT_PRIVATE bool getFirstArgumentAsString(String& result) const;
    JS_EXPORT_PRIVATE Vector<String> getArgumentsAsStrings() const;
    bool isEqual(const ScriptArguments&) const;

    static String truncateStringForConsoleMessage(const String& message)
    {
        constexpr size_t maxMessageLength = 10000;
        if (message.length() <= maxMessageLength)
            return message;
        return makeString(StringView(message).left(maxMessageLength), "..."_s);
    }

private:
    ScriptArguments(JSC::JSGlobalObject*, Vector<JSC::Strong<JSC::Unknown>>&& arguments);
    std::optional<String> getArgumentAtIndexAsString(size_t) const;

    JSC::Strong<JSC::JSGlobalObject> m_globalObject;
    Vector<JSC::Strong<JSC::Unknown>> m_arguments;
};

} // namespace Inspector
