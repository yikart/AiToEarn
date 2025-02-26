/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#if HAVE(CORE_LOCATION)
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

OBJC_CLASS WebCLLocationManager;

namespace WebCore {

class GeolocationPositionData;
class RegistrableDomain;

class WEBCORE_EXPORT CoreLocationGeolocationProvider {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(CoreLocationGeolocationProvider, WEBCORE_EXPORT);
public:
    class Client {
    public:
        virtual ~Client() { }

        virtual void geolocationAuthorizationGranted(const String& /*websiteIdentifier*/) { }
        virtual void geolocationAuthorizationDenied(const String& /*websiteIdentifier*/) { }
        virtual void positionChanged(const String& websiteIdentifier, GeolocationPositionData&&) = 0;
        virtual void errorOccurred(const String& websiteIdentifier, const String& errorMessage) = 0;
        virtual void resetGeolocation(const String& websiteIdentifier) = 0;
    };

    enum class Mode : bool { AuthorizationOnly, AuthorizationAndLocationUpdates };
    CoreLocationGeolocationProvider(const RegistrableDomain&, Client&, Mode = Mode::AuthorizationAndLocationUpdates);
    ~CoreLocationGeolocationProvider();

    void setEnableHighAccuracy(bool);

    static void requestAuthorization(const RegistrableDomain&, CompletionHandler<void(bool)>&&);

private:
    RetainPtr<WebCLLocationManager> m_locationManager;
};

#endif // HAVE(CORE_LOCATION)

} // namespace WebCore
