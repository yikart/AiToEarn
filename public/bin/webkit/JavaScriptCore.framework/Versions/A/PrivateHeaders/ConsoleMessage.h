/*
 * Copyright (C) 2007-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Matt Lilek <webkit@mattlilek.com>
 * Copyright (C) 2009, 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ConsoleTypes.h"
#include "Strong.h"
#include <wtf/Forward.h>
#include <wtf/Logger.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/WTFString.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
}

using JSC::MessageType;

namespace Inspector {

class ConsoleFrontendDispatcher;
class InjectedScriptManager;
class ScriptArguments;
class ScriptCallStack;

class ConsoleMessage {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ConsoleMessage, JS_EXPORT_PRIVATE);
    WTF_MAKE_NONCOPYABLE(ConsoleMessage);
public:
    JS_EXPORT_PRIVATE ConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    JS_EXPORT_PRIVATE ConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, const String& url, unsigned line, unsigned column, JSC::JSGlobalObject* = nullptr, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    JS_EXPORT_PRIVATE ConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, Ref<ScriptCallStack>&&, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    ConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, Ref<ScriptArguments>&&, Ref<ScriptCallStack>&&, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    JS_EXPORT_PRIVATE ConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, Ref<ScriptArguments>&&, JSC::JSGlobalObject* = nullptr, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    JS_EXPORT_PRIVATE ConsoleMessage(MessageSource, MessageType, MessageLevel, Vector<JSONLogValue>&&, JSC::JSGlobalObject*, unsigned long requestIdentifier = 0, WallTime timestamp = { });
    JS_EXPORT_PRIVATE ~ConsoleMessage();

    void addToFrontend(ConsoleFrontendDispatcher&, InjectedScriptManager&, bool generatePreview);
    void updateRepeatCountInConsole(ConsoleFrontendDispatcher&);

    MessageSource source() const { return m_source; }
    MessageType type() const { return m_type; }
    MessageLevel level() const { return m_level; }
    const String& message() const { return m_message; }
    const String& url() const { return m_url; }
    unsigned line() const { return m_line; }
    unsigned column() const { return m_column; }
    WallTime timestamp() const { return m_timestamp; }

    JS_EXPORT_PRIVATE JSC::JSGlobalObject* globalObject() const;

    void incrementCount() { ++m_repeatCount; }

    const RefPtr<ScriptArguments>& arguments() const { return m_arguments; }
    unsigned argumentCount() const;

    bool isEqual(ConsoleMessage* msg) const;

    JS_EXPORT_PRIVATE void clear();

    JS_EXPORT_PRIVATE String toString() const;

private:
    void autogenerateMetadata(JSC::JSGlobalObject* = nullptr);

    MessageSource m_source;
    MessageType m_type;
    MessageLevel m_level;
    String m_message;
    RefPtr<ScriptArguments> m_arguments;
    RefPtr<ScriptCallStack> m_callStack;
    Vector<JSONLogValue> m_jsonLogValues;
    String m_url;
    JSC::Strong<JSC::JSGlobalObject> m_globalObject;
    unsigned m_line { 0 };
    unsigned m_column { 0 };
    unsigned m_repeatCount { 1 };
    String m_requestId;
    WallTime m_timestamp;
};

} // namespace Inspector
