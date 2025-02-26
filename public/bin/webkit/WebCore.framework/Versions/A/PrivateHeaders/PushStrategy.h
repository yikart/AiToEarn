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
#if ENABLE(DECLARATIVE_WEB_PUSH)

#include "ExceptionOr.h"
#include "PushPermissionState.h"
#include "PushSubscriptionData.h"
#include "PushSubscriptionIdentifier.h"

namespace WebCore {

class WEBCORE_EXPORT PushStrategy {
public:
    virtual ~PushStrategy() = default;

    using SubscribeToPushServiceCallback = CompletionHandler<void(ExceptionOr<PushSubscriptionData>&&)>;
    virtual void windowSubscribeToPushService(const URL& scope, const Vector<uint8_t>& applicationServerKey, SubscribeToPushServiceCallback&&) = 0;

    using UnsubscribeFromPushServiceCallback = CompletionHandler<void(ExceptionOr<bool>&&)>;
    virtual void windowUnsubscribeFromPushService(const URL& scope, std::optional<PushSubscriptionIdentifier>, UnsubscribeFromPushServiceCallback&&) = 0;

    using GetPushSubscriptionCallback = CompletionHandler<void(ExceptionOr<std::optional<PushSubscriptionData>>&&)>;
    virtual void windowGetPushSubscription(const URL& scope, GetPushSubscriptionCallback&&) = 0;

    using GetPushPermissionStateCallback = CompletionHandler<void(ExceptionOr<PushPermissionState>&&)>;
    virtual void windowGetPushPermissionState(const URL& scope, GetPushPermissionStateCallback&&) = 0;
};

} // namespace WebCore
#endif // ENABLE(DECLARATIVE_WEB_PUSH)
