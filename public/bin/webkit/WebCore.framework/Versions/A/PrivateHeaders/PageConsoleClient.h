/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include <JavaScriptCore/ConsoleClient.h>
#include <JavaScriptCore/ScriptCallStack.h>
#include <wtf/CheckedRef.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

namespace Inspector {
class ConsoleMessage;
}

namespace JSC {
class CallFrame;
}

using JSC::MessageType;

namespace WebCore {

class Document;
class Page;

class WEBCORE_EXPORT PageConsoleClient final : public JSC::ConsoleClient, public CanMakeCheckedPtr<PageConsoleClient> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(PageConsoleClient, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(PageConsoleClient);
public:
    explicit PageConsoleClient(Page&);
    virtual ~PageConsoleClient();

    static bool shouldPrintExceptions();
    static void setShouldPrintExceptions(bool);

    static void mute();
    static void unmute();

    void addMessage(std::unique_ptr<Inspector::ConsoleMessage>&&);

    // The following addMessage function are deprecated.
    // Callers should try to create the ConsoleMessage themselves.
    void addMessage(MessageSource, MessageLevel, const String& message, const String& sourceURL, unsigned lineNumber, unsigned columnNumber, RefPtr<Inspector::ScriptCallStack>&& = nullptr, JSC::JSGlobalObject* = nullptr, unsigned long requestIdentifier = 0);
    void addMessage(MessageSource, MessageLevel, const String& message, Ref<Inspector::ScriptCallStack>&&);
    void addMessage(MessageSource, MessageLevel, const String& message, unsigned long requestIdentifier = 0, Document* = nullptr);

    static void logMessageToSystemConsole(const Inspector::ConsoleMessage&);

private:
    void messageWithTypeAndLevel(MessageType, MessageLevel, JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) override;
    void count(JSC::JSGlobalObject*, const String& label) override;
    void countReset(JSC::JSGlobalObject*, const String& label) override;
    void profile(JSC::JSGlobalObject*, const String& title) override;
    void profileEnd(JSC::JSGlobalObject*, const String& title) override;
    void takeHeapSnapshot(JSC::JSGlobalObject*, const String& title) override;
    void time(JSC::JSGlobalObject*, const String& label) override;
    void timeLog(JSC::JSGlobalObject*, const String& label, Ref<Inspector::ScriptArguments>&&) override;
    void timeEnd(JSC::JSGlobalObject*, const String& label) override;
    void timeStamp(JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) override;
    void record(JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) override;
    void recordEnd(JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) override;
    void screenshot(JSC::JSGlobalObject*, Ref<Inspector::ScriptArguments>&&) override;
    void bindingCalled(JSC::JSGlobalObject*, const String& name, const String& arg) override;

    Ref<Page> protectedPage() const;

    WeakRef<Page> m_page;
};

} // namespace WebCore
