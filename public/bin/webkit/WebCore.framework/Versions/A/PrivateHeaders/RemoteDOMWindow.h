/*
 * Copyright (C) 2018-2019 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "DOMWindow.h"
#include "RemoteFrame.h"
#include "WindowPostMessageOptions.h"
#include <JavaScriptCore/Strong.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/TypeCasts.h>

namespace JSC {
class CallFrame;
class JSGlobalObject;
class JSObject;
class JSValue;
}

namespace WebCore {

class LocalDOMWindow;
class Document;
class Location;

class RemoteDOMWindow final : public DOMWindow {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(RemoteDOMWindow, WEBCORE_EXPORT);
public:
    static Ref<RemoteDOMWindow> create(RemoteFrame& frame, GlobalWindowIdentifier&& identifier)
    {
        return adoptRef(*new RemoteDOMWindow(frame, WTFMove(identifier)));
    }

    ~RemoteDOMWindow() final;

    RemoteFrame* frame() const final { return m_frame.get(); }
    ScriptExecutionContext* scriptExecutionContext() const final { return nullptr; }

    // DOM API exposed cross-origin.
    WindowProxy* self() const;
    void focus(LocalDOMWindow& incumbentWindow);
    void blur();
    unsigned length() const;
    void frameDetached();
    ExceptionOr<void> postMessage(JSC::JSGlobalObject&, LocalDOMWindow& incumbentWindow, JSC::JSValue message, WindowPostMessageOptions&&);

private:
    WEBCORE_EXPORT RemoteDOMWindow(RemoteFrame&, GlobalWindowIdentifier&&);

    void closePage() final;
    void setLocation(LocalDOMWindow& activeWindow, const URL& completedURL, NavigationHistoryBehavior, SetLocationLocking) final;

    WeakPtr<RemoteFrame> m_frame;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::RemoteDOMWindow)
    static bool isType(const WebCore::DOMWindow& window) { return window.isRemoteDOMWindow(); }
SPECIALIZE_TYPE_TRAITS_END()
