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

#include "ExceptionOr.h"
#include "NotificationOptionsPayload.h"
#include <wtf/CrossThreadCopier.h>
#include <wtf/URL.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS NSDictionary;

namespace WebCore {

struct NotificationData;

struct NotificationPayload {
    URL defaultActionURL;
    String title;
    std::optional<unsigned long long> appBadge;
    std::optional<NotificationOptionsPayload> options;
    bool isMutable { false };

    NotificationPayload isolatedCopy() &&
    {
        return NotificationPayload {
            WTFMove(defaultActionURL).isolatedCopy(),
            WTFMove(title).isolatedCopy(),
            appBadge,
            crossThreadCopy(WTFMove(options)),
            isMutable
        };
    }

#if ENABLE(DECLARATIVE_WEB_PUSH)
    WEBCORE_EXPORT static bool hasDeclarativeMessageHeader(const String& message);
    WEBCORE_EXPORT static ExceptionOr<NotificationPayload> parseJSON(const String&);
    NotificationPayload static fromNotificationData(const NotificationData&);

    WEBCORE_EXPORT NotificationData toNotificationData() const;

#if PLATFORM(COCOA)
    WEBCORE_EXPORT static std::optional<NotificationPayload> fromDictionary(NSDictionary *);
    WEBCORE_EXPORT NSDictionary *dictionaryRepresentation() const;
#endif
#endif // ENABLE(DECLARATIVE_WEB_PUSH)
};

} // namespace WebCore

