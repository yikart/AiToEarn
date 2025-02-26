/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2011 Google Inc. All rights reserved.
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

#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace Inspector {

class BackendDispatcher;
class FrontendRouter;
class InspectorAgentBase;

enum class DisconnectReason;

class AgentRegistry {
public:
    JS_EXPORT_PRIVATE AgentRegistry();
    JS_EXPORT_PRIVATE ~AgentRegistry();

    JS_EXPORT_PRIVATE void append(std::unique_ptr<InspectorAgentBase>);

    JS_EXPORT_PRIVATE void didCreateFrontendAndBackend(FrontendRouter*, BackendDispatcher*);
    JS_EXPORT_PRIVATE void willDestroyFrontendAndBackend(DisconnectReason);
    JS_EXPORT_PRIVATE void discardValues();

private:
    // These are declared here to avoid MSVC from trying to create default iplementations which would
    // involve generating a copy constructor and copy assignment operator for the Vector of std::unique_ptrs.
    AgentRegistry(const AgentRegistry&) = delete;
    AgentRegistry& operator=(const AgentRegistry&) = delete;

    Vector<std::unique_ptr<InspectorAgentBase>> m_agents;
};

} // namespace Inspector
