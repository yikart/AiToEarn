/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#include "InspectorAgentBase.h"
#include "InspectorBackendDispatchers.h"
#include "InspectorFrontendChannel.h"
#include "InspectorFrontendDispatchers.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMalloc.h>

namespace Inspector {

class InspectorTarget;

class JS_EXPORT_PRIVATE InspectorTargetAgent final : public InspectorAgentBase, public TargetBackendDispatcherHandler, public CanMakeCheckedPtr<InspectorTargetAgent> {
    WTF_MAKE_NONCOPYABLE(InspectorTargetAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorTargetAgent);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(InspectorTargetAgent);
public:
    InspectorTargetAgent(FrontendRouter&, BackendDispatcher&);
    ~InspectorTargetAgent() final;

    // InspectorAgentBase
    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final;
    void willDestroyFrontendAndBackend(DisconnectReason) final;

    // TargetBackendDispatcherHandler
    Protocol::ErrorStringOr<void> setPauseOnStart(bool) final;
    Protocol::ErrorStringOr<void> resume(const String& targetId) final;
    Protocol::ErrorStringOr<void> sendMessageToTarget(const String& targetId, const String& message) final;
    Protocol::ErrorStringOr<void> activate(const String& targetId) override;
    Protocol::ErrorStringOr<void> close(const String& targetId, std::optional<bool>&& runBeforeUnload) override;

    // Target lifecycle.
    void targetCrashed(InspectorTarget&);
    void targetCreated(InspectorTarget&);
    void targetDestroyed(InspectorTarget&);
    void didCommitProvisionalTarget(const String& oldTargetID, const String& committedTargetID);

    // Target messages.
    void sendMessageFromTargetToFrontend(const String& targetId, const String& message);

    bool shouldPauseOnStart() const { return m_shouldPauseOnStart; }
    bool isConnected() { return m_isConnected; }

private:
    // FrontendChannel
    FrontendChannel::ConnectionType connectionType() const;
    void connectToTargets();
    void disconnectFromTargets();

    Inspector::FrontendRouter& m_router;
    std::unique_ptr<TargetFrontendDispatcher> m_frontendDispatcher;
    Ref<TargetBackendDispatcher> m_backendDispatcher;
    UncheckedKeyHashMap<String, InspectorTarget*> m_targets;
    bool m_isConnected { false };
    bool m_shouldPauseOnStart { false };
};

} // namespace Inspector
