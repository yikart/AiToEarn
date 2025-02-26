/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#if ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)

#include "AugmentableInspectorController.h"
#include "InspectorAgentBase.h"
#include "InspectorAlternateBackendDispatchers.h"
#include <wtf/Forward.h>

namespace Inspector {

template<typename TBackendDispatcher, typename TAlternateDispatcher>
class AlternateDispatchableAgent final : public InspectorAgentBase {
    WTF_MAKE_FAST_ALLOCATED;
public:
    AlternateDispatchableAgent(const String& domainName, AugmentableInspectorController& controller, std::unique_ptr<TAlternateDispatcher> alternateDispatcher)
        : InspectorAgentBase(domainName)
        , m_alternateDispatcher(WTFMove(alternateDispatcher))
        , m_backendDispatcher(TBackendDispatcher::create(controller.backendDispatcher(), nullptr))
    {
        m_backendDispatcher->setAlternateDispatcher(m_alternateDispatcher.get());
        m_alternateDispatcher->setBackendDispatcher(&controller.backendDispatcher());
    }

    virtual ~AlternateDispatchableAgent()
    {
        m_alternateDispatcher->setBackendDispatcher(nullptr);
    }

    void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*) final
    {
    }

    void willDestroyFrontendAndBackend(DisconnectReason) final
    {
    }

private:
    std::unique_ptr<TAlternateDispatcher> m_alternateDispatcher;
    RefPtr<TBackendDispatcher> m_backendDispatcher;
};

} // namespace Inspector

#endif // ENABLE(INSPECTOR_ALTERNATE_DISPATCHERS)
