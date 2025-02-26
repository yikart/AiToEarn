/*
 * Copyright (C) 2008, 2009, 2010, 2011 Apple Inc. All Rights Reserved.
 * Copyright 2010, The Android Open Source Project
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

#if ENABLE(GEOLOCATION)

#include "ActiveDOMObject.h"
#include "Document.h"
#include "GeolocationPosition.h"
#include "GeolocationPositionError.h"
#include "PositionCallback.h"
#include "PositionErrorCallback.h"
#include "PositionOptions.h"
#include "ScriptWrappable.h"
#include "Timer.h"
#include <wtf/CheckedRef.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>

namespace WebCore {

class GeoNotifier;
class GeolocationError;
class LocalFrame;
class Navigator;
class Page;
class ScriptExecutionContext;
class SecurityOrigin;
struct PositionOptions;

class Geolocation final : public RefCountedAndCanMakeWeakPtr<Geolocation>, public ScriptWrappable, public ActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(Geolocation, WEBCORE_EXPORT);
    friend class GeoNotifier;
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    static Ref<Geolocation> create(Navigator&);
    WEBCORE_EXPORT ~Geolocation();

    WEBCORE_EXPORT void resetAllGeolocationPermission();
    Document* document() const { return downcast<Document>(scriptExecutionContext()); }

    void getCurrentPosition(Ref<PositionCallback>&&, RefPtr<PositionErrorCallback>&&, PositionOptions&&);
    int watchPosition(Ref<PositionCallback>&&, RefPtr<PositionErrorCallback>&&, PositionOptions&&);
    void clearWatch(int watchID);

    WEBCORE_EXPORT void setIsAllowed(bool, const String& authorizationToken);
    const String& authorizationToken() const { return m_authorizationToken; }
    WEBCORE_EXPORT void resetIsAllowed();
    bool isAllowed() const { return m_allowGeolocation == Yes; }

    void positionChanged();
    void setError(GeolocationError&);
    bool shouldBlockGeolocationRequests();

    Navigator* navigator();
    WEBCORE_EXPORT LocalFrame* frame() const;

private:
    explicit Geolocation(Navigator&);

    GeolocationPosition* lastPosition();

    // ActiveDOMObject.
    void stop() override;
    void suspend(ReasonForSuspension) override;
    void resume() override;

    bool isDenied() const { return m_allowGeolocation == No; }

    Page* page() const;
    SecurityOrigin* securityOrigin() const;
    RefPtr<SecurityOrigin> protectedSecurityOrigin() const;

    typedef Vector<RefPtr<GeoNotifier>> GeoNotifierVector;
    typedef HashSet<RefPtr<GeoNotifier>> GeoNotifierSet;

    class Watchers {
    public:
        bool add(int id, RefPtr<GeoNotifier>&&);
        GeoNotifier* find(int id);
        void remove(int id);
        void remove(GeoNotifier*);
        bool contains(GeoNotifier*) const;
        void clear();
        bool isEmpty() const;
        void getNotifiersVector(GeoNotifierVector&) const;
    private:
        typedef HashMap<int, RefPtr<GeoNotifier>> IdToNotifierMap;
        typedef HashMap<RefPtr<GeoNotifier>, int> NotifierToIdMap;
        IdToNotifierMap m_idToNotifierMap;
        NotifierToIdMap m_notifierToIdMap;
    };

    bool hasListeners() const { return !m_oneShots.isEmpty() || !m_watchers.isEmpty(); }

    void sendError(GeoNotifierVector&, GeolocationPositionError&);
    void sendPosition(GeoNotifierVector&, GeolocationPosition&);

    static void extractNotifiersWithCachedPosition(GeoNotifierVector& notifiers, GeoNotifierVector* cached);
    static void copyToSet(const GeoNotifierVector&, GeoNotifierSet&);

    static void stopTimer(GeoNotifierVector&);
    void stopTimersForOneShots();
    void stopTimersForWatchers();
    void stopTimers();

    void cancelRequests(GeoNotifierVector&);
    void cancelAllRequests();

    void makeSuccessCallbacks(GeolocationPosition&);
    void handleError(GeolocationPositionError&);

    void requestPermission();
    void revokeAuthorizationTokenIfNecessary();

    bool startUpdating(GeoNotifier*);
    void stopUpdating();

    void handlePendingPermissionNotifiers();

    void startRequest(GeoNotifier*);

    void fatalErrorOccurred(GeoNotifier*);
    void requestTimedOut(GeoNotifier*);
    void requestUsesCachedPosition(GeoNotifier*);
    bool haveSuitableCachedPosition(const PositionOptions&);
    void makeCachedPositionCallbacks();

    void resumeTimerFired();

    WeakPtr<Navigator> m_navigator;
    GeoNotifierSet m_oneShots;
    Watchers m_watchers;
    GeoNotifierSet m_pendingForPermissionNotifiers;
    RefPtr<GeolocationPosition> m_lastPosition;

    enum { Unknown, InProgress, Yes, No } m_allowGeolocation { Unknown };
    String m_authorizationToken;
    bool m_isSuspended { false };
    bool m_resetOnResume { false };
    bool m_hasChangedPosition { false };
    RefPtr<GeolocationPositionError> m_errorWaitingForResume;
    Timer m_resumeTimer;
    GeoNotifierSet m_requestsAwaitingCachedPosition;
};
    
} // namespace WebCore

#endif // ENABLE(GEOLOCATION)
