/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "ExtendableEvent.h"
#include "Notification.h"
#include "NotificationData.h"
#include "PushEventInit.h"

namespace WebCore {

class PushMessageData;

class PushEvent final : public ExtendableEvent {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(PushEvent);
public:
    static Ref<PushEvent> create(const AtomString&, PushEventInit&&, IsTrusted = IsTrusted::No);
    static Ref<PushEvent> create(const AtomString&, ExtendableEventInit&&, std::optional<Vector<uint8_t>>&&, IsTrusted);
    ~PushEvent();

    PushMessageData* data() { return m_data.get(); }

#if ENABLE(DECLARATIVE_WEB_PUSH) && ENABLE(NOTIFICATIONS)
    static Ref<PushEvent> create(const AtomString&, ExtendableEventInit&&, Ref<Notification>, std::optional<uint64_t> appBadge, IsTrusted);

    Notification* notification();
    std::optional<uint64_t> appBadge();

    Notification* proposedNotification() const { return m_proposedNotification.get(); }
    std::optional<uint64_t> proposedAppBadge() const { return m_proposedAppBadge; }

    void setUpdatedNotification(Notification* notification) { m_updatedNotification = notification; }
    std::optional<NotificationData> updatedNotificationData() const;

    void setUpdatedAppBadge(std::optional<uint64_t>&& updatedAppBadge) { m_updatedAppBadge = WTFMove(updatedAppBadge); }
    const std::optional<std::optional<uint64_t>>& updatedAppBadge() const { return m_updatedAppBadge; }
#endif // ENABLE(DECLARATIVE_WEB_PUSH) && ENABLE(NOTIFICATIONS)

private:
    PushEvent(const AtomString&, ExtendableEventInit&&, std::optional<Vector<uint8_t>>&&, IsTrusted);

    RefPtr<PushMessageData> m_data;

#if ENABLE(DECLARATIVE_WEB_PUSH) && ENABLE(NOTIFICATIONS)
    PushEvent(const AtomString&, ExtendableEventInit&&, std::optional<Vector<uint8_t>>&&, RefPtr<Notification>, std::optional<uint64_t> appBadge, IsTrusted);

    RefPtr<Notification> m_proposedNotification;
    std::optional<uint64_t> m_proposedAppBadge;

    RefPtr<Notification> m_updatedNotification;
    std::optional<std::optional<uint64_t>> m_updatedAppBadge;
#endif // ENABLE(DECLARATIVE_WEB_PUSH) && ENABLE(NOTIFICATIONS)
};

} // namespace WebCore
