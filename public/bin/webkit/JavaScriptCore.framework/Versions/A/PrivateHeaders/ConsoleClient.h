/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "ConsoleTypes.h"
#include <wtf/Forward.h>
#include <wtf/WeakPtr.h>

namespace JSC {
class ConsoleClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<JSC::ConsoleClient> : std::true_type { };
}

namespace Inspector {
class ScriptArguments;
}

namespace JSC {

class CallFrame;
class JSGlobalObject;

class ConsoleClient : public CanMakeWeakPtr<ConsoleClient> {
public:
    virtual ~ConsoleClient() { }

    JS_EXPORT_PRIVATE static void printConsoleMessage(MessageSource, MessageType, MessageLevel, const String& message, const String& url, unsigned lineNumber, unsigned columnNumber);
    JS_EXPORT_PRIVATE static void printConsoleMessageWithArguments(MessageSource, MessageType, MessageLevel, JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);

    void logWithLevel(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&, MessageLevel);
    void clear(JSGlobalObject*);
    void dir(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void dirXML(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void table(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void trace(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void assertion(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void group(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void groupCollapsed(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);
    void groupEnd(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&);

    virtual void messageWithTypeAndLevel(MessageType, MessageLevel, JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void count(JSGlobalObject*, const String& label) = 0;
    virtual void countReset(JSGlobalObject*, const String& label) = 0;
    virtual void profile(JSGlobalObject*, const String& title) = 0;
    virtual void profileEnd(JSGlobalObject*, const String& title) = 0;
    virtual void takeHeapSnapshot(JSGlobalObject*, const String& title) = 0;
    virtual void time(JSGlobalObject*, const String& label) = 0;
    virtual void timeLog(JSGlobalObject*, const String& label, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void timeEnd(JSGlobalObject*, const String& label) = 0;
    virtual void timeStamp(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void record(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void recordEnd(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void screenshot(JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) = 0;
    virtual void bindingCalled(JSGlobalObject*, const String& name, const String& arg) = 0;

private:
    enum ArgumentRequirement { ArgumentRequired, ArgumentNotRequired };
    void internalMessageWithTypeAndLevel(MessageType, MessageLevel, JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&, ArgumentRequirement);
};

} // namespace JSC
