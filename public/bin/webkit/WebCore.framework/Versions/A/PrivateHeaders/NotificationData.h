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

#include "ScriptExecutionContextIdentifier.h"
#include <optional>
#include <pal/SessionID.h>
#include <wtf/MonotonicTime.h>
#include <wtf/URL.h>
#include <wtf/UUID.h>
#include <wtf/text/WTFString.h>

OBJC_CLASS NSDictionary;

namespace WebCore {

enum class NotificationDirection : uint8_t;

struct NotificationData {
    WEBCORE_EXPORT NotificationData isolatedCopy() const &;
    WEBCORE_EXPORT NotificationData isolatedCopy() &&;

#if PLATFORM(COCOA)
    WEBCORE_EXPORT static std::optional<NotificationData> fromDictionary(NSDictionary *dictionaryRepresentation);
    WEBCORE_EXPORT NSDictionary *dictionaryRepresentation() const;
#endif

    bool isPersistent() const { return !serviceWorkerRegistrationURL.isNull(); }

    URL navigateURL;
    String title;
    String body;
    String iconURL;
    String tag;
    String language;
    WebCore::NotificationDirection direction;
    String originString;
    URL serviceWorkerRegistrationURL;
    WTF::UUID notificationID { WTF::UUID::createVersion4() };
    std::optional<ScriptExecutionContextIdentifier> contextIdentifier;
    PAL::SessionID sourceSession { PAL::SessionID::defaultSessionID() };
    MonotonicTime creationTime;
    Vector<uint8_t> data;
    std::optional<bool> silent;
};

} // namespace WebCore
