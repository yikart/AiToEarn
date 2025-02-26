/*
 * Copyright (C) 2009 Apple Inc. All rights reserved.
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

#if ENABLE(GEOLOCATION)

#include "ActivityStateChangeObserver.h"
#include "Geolocation.h"
#include "Page.h"
#include "RegistrableDomain.h"
#include <wtf/HashSet.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class GeolocationClient;
class GeolocationError;
class GeolocationPositionData;

class GeolocationController : public Supplement<Page>, private ActivityStateChangeObserver {
    WTF_MAKE_TZONE_ALLOCATED(GeolocationController);
    WTF_MAKE_NONCOPYABLE(GeolocationController);
public:
    GeolocationController(Page&, GeolocationClient&);
    ~GeolocationController();

    void addObserver(Geolocation&, bool enableHighAccuracy);
    void removeObserver(Geolocation&);

    void requestPermission(Geolocation&);
    void cancelPermissionRequest(Geolocation&);

    WEBCORE_EXPORT void positionChanged(const std::optional<GeolocationPositionData>&);
    WEBCORE_EXPORT void errorOccurred(GeolocationError&);

    std::optional<GeolocationPositionData> lastPosition();

    GeolocationClient& client();

    WEBCORE_EXPORT static ASCIILiteral supplementName();
    static GeolocationController* from(Page* page) { return static_cast<GeolocationController*>(Supplement<Page>::from(page, supplementName())); }

    void revokeAuthorizationToken(const String&);

    void didNavigatePage();

private:
    WeakRef<Page> m_page;
    CheckedPtr<GeolocationClient> m_client; // Only becomes null in the class destructor

    void activityStateDidChange(OptionSet<ActivityState> oldActivityState, OptionSet<ActivityState> newActivityState) override;

    std::optional<GeolocationPositionData> m_lastPosition;

    bool needsHighAccuracy() const { return !m_highAccuracyObservers.isEmpty(); }

    void startUpdatingIfNecessary();
    void stopUpdatingIfNecessary();

    typedef HashSet<Ref<Geolocation>> ObserversSet;
    // All observers; both those requesting high accuracy and those not.
    ObserversSet m_observers;
    ObserversSet m_highAccuracyObservers;

    // While the page is not visible, we pend permission requests.
    HashSet<Ref<Geolocation>> m_pendingPermissionRequest;

    RegistrableDomain m_registrableDomain;
    bool m_isUpdating { false };
};

} // namespace WebCore

#endif // ENABLE(GEOLOCATION)
