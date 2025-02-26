/*
 * Copyright (C) 2011 Ericsson AB. All rights reserved.
 * Copyright (C) 2016-2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer
 *    in the documentation and/or other materials provided with the
 *    distribution.
 * 3. Neither the name of Ericsson nor the names of its contributors
 *    may be used to endorse or promote products derived from this
 *    software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(MEDIA_STREAM)

#include "MediaProducer.h"
#include <wtf/CompletionHandler.h>
#include <wtf/ObjectIdentifier.h>

namespace WebCore {

struct CaptureDeviceWithCapabilities;
class Document;
class Exception;
class Page;
class UserMediaRequest;

struct MediaDeviceHashSalts;

class UserMediaClient {
public:
    virtual void pageDestroyed() = 0;

    virtual void requestUserMediaAccess(UserMediaRequest&) = 0;
    virtual void cancelUserMediaAccessRequest(UserMediaRequest&) = 0;

    using EnumerateDevicesCallback = CompletionHandler<void(Vector<CaptureDeviceWithCapabilities>&&, MediaDeviceHashSalts&&)>;
    virtual void enumerateMediaDevices(Document&, EnumerateDevicesCallback&&) = 0;

    enum DeviceChangeObserverTokenType { };
    using DeviceChangeObserverToken = ObjectIdentifier<DeviceChangeObserverTokenType>;
    virtual DeviceChangeObserverToken addDeviceChangeObserver(Function<void()>&&) = 0;
    virtual void removeDeviceChangeObserver(DeviceChangeObserverToken) = 0;

    virtual void updateCaptureState(const Document&, bool isActive, MediaProducerMediaCaptureKind, CompletionHandler<void(std::optional<Exception>&&)>&&) = 0;
    virtual void setShouldListenToVoiceActivity(bool) = 0;

protected:
    virtual ~UserMediaClient() = default;
};

WEBCORE_EXPORT void provideUserMediaTo(Page*, UserMediaClient*);

} // namespace WebCore

#endif // ENABLE(MEDIA_STREAM)
