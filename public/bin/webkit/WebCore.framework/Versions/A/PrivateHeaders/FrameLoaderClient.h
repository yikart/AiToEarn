/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "FrameLoaderTypes.h"
#include "NavigationIdentifier.h"
#include "SandboxFlags.h"

namespace WebCore {

class FormState;
class Frame;
class HitTestResult;
class NavigationAction;
class ResourceRequest;
class ResourceResponse;

enum class PolicyDecisionMode;
enum class SandboxFlag : uint16_t;

enum class IsPerformingHTTPFallback : bool { No, Yes };

using FramePolicyFunction = CompletionHandler<void(PolicyAction)>;
using SandboxFlags = OptionSet<SandboxFlag>;

class FrameLoaderClient {
public:
    virtual void dispatchDecidePolicyForNavigationAction(const NavigationAction&, const ResourceRequest&, const ResourceResponse& redirectResponse, FormState*, const String& clientRedirectSourceForHistory, std::optional<NavigationIdentifier>, std::optional<HitTestResult>&&, bool hasOpener, IsPerformingHTTPFallback, SandboxFlags, PolicyDecisionMode, FramePolicyFunction&&) = 0;
    virtual void updateSandboxFlags(SandboxFlags) = 0;
    virtual void updateOpener(const Frame&) = 0;
    virtual ~FrameLoaderClient() = default;
};

}
