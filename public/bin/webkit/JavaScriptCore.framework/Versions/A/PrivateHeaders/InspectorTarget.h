/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "InspectorFrontendChannel.h"
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace Inspector {
class InspectorTarget;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<Inspector::InspectorTarget> : std::true_type { };
}

namespace Inspector {

// FIXME: Add DedicatedWorker Inspector Targets
// FIXME: Add ServiceWorker Inspector Targets
enum class InspectorTargetType : uint8_t {
    Page,
    DedicatedWorker,
    ServiceWorker,
};

class InspectorTarget : public CanMakeWeakPtr<InspectorTarget> {
public:
    virtual ~InspectorTarget() = default;

    // State.
    virtual String identifier() const = 0;
    virtual InspectorTargetType type() const = 0;

    virtual bool isProvisional() const { return false; }
    bool isPaused() const { return m_isPaused; }
    void pause();
    JS_EXPORT_PRIVATE void resume();
    JS_EXPORT_PRIVATE void setResumeCallback(WTF::Function<void()>&&);

    // Connection management.
    virtual void connect(FrontendChannel::ConnectionType) = 0;
    virtual void disconnect() = 0;
    virtual void sendMessageToTargetBackend(const String&) = 0;
    virtual void activate(String& error) { error = "Target cannot be activated"_s; }
    virtual void close(String& error, bool /* runBeforeUnload */) { error = "Target cannot be closed"_s; }

private:
    virtual void willResume() { }

    WTF::Function<void()> m_resumeCallback;
    bool m_isPaused { false };
};

} // namespace Inspector
