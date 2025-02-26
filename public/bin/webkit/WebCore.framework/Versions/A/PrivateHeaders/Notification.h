/*
 * Copyright (C) 2009 Google Inc. All rights reserved.
 * Copyright (C) 2009, 2011, 2012, 2016, 2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
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

#if ENABLE(NOTIFICATIONS)

#include "ActiveDOMObject.h"
#include "ContextDestructionObserverInlines.h"
#include "EventTarget.h"
#include "NotificationDirection.h"
#include "NotificationPayload.h"
#include "NotificationPermission.h"
#include "NotificationResources.h"
#include "ScriptExecutionContextIdentifier.h"
#include "SerializedScriptValue.h"
#include <wtf/CompletionHandler.h>
#include <wtf/URL.h>
#include <wtf/UUID.h>
#include "WritingMode.h"

namespace WebCore {

class DeferredPromise;
class Document;
class NotificationClient;
class NotificationPermissionCallback;
class NotificationResourcesLoader;

struct NotificationData;

class Notification final : public RefCounted<Notification>, public ActiveDOMObject, public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(Notification, WEBCORE_EXPORT);
public:
    void ref() const final { RefCounted::ref(); }
    void deref() const final { RefCounted::deref(); }

    using Permission = NotificationPermission;
    using Direction = NotificationDirection;

    struct Options {
        Direction dir;
        String lang;
        String body;
        String tag;
        String icon;
        JSC::JSValue data;
        RefPtr<SerializedScriptValue> serializedData;
        RefPtr<JSON::Value> jsonData;
        std::optional<bool> silent;
#if ENABLE(DECLARATIVE_WEB_PUSH)
        String navigate;
#endif
    };
    // For JS constructor only.
    static ExceptionOr<Ref<Notification>> create(ScriptExecutionContext&, String&& title, Options&&);

    static ExceptionOr<Ref<Notification>> createForServiceWorker(ScriptExecutionContext&, String&& title, Options&&, const URL&);
    static Ref<Notification> create(ScriptExecutionContext&, NotificationData&&);
    static Ref<Notification> create(ScriptExecutionContext&, const URL& registrationURL, const NotificationPayload&);

    WEBCORE_EXPORT virtual ~Notification();

    void show(CompletionHandler<void()>&& = [] { });
    void close();

#if ENABLE(DECLARATIVE_WEB_PUSH)
    const URL& navigate() const { return m_navigate; }
#endif
    const String& title() const { return m_title; }
    Direction dir() const { return m_direction; }
    const String& body() const { return m_body; }
    const String& lang() const { return m_lang; }
    const String& tag() const { return m_tag; }
    const URL& icon() const { return m_icon; }
    JSC::JSValue dataForBindings(JSC::JSGlobalObject&);
    std::optional<bool> silent() const { return m_silent; }

    TextDirection direction() const { return m_direction == Direction::Rtl ? TextDirection::RTL : TextDirection::LTR; }

    WEBCORE_EXPORT void dispatchClickEvent();
    WEBCORE_EXPORT void dispatchCloseEvent();
    WEBCORE_EXPORT void dispatchErrorEvent();
    WEBCORE_EXPORT void dispatchShowEvent();

    WEBCORE_EXPORT void finalize();

    static Permission permission(ScriptExecutionContext&);
    static void requestPermission(Document&, RefPtr<NotificationPermissionCallback>&&, Ref<DeferredPromise>&&);

    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }

    WEBCORE_EXPORT NotificationData data() const;
    RefPtr<NotificationResources> resources() const { return m_resources; }

    void markAsShown();
    void showSoon();

    WTF::UUID identifier() const { return m_identifier; }

    bool isPersistent() const { return !m_serviceWorkerRegistrationURL.isNull(); }

    WEBCORE_EXPORT static void ensureOnNotificationThread(ScriptExecutionContextIdentifier, WTF::UUID notificationIdentifier, Function<void(Notification*)>&&);
    WEBCORE_EXPORT static void ensureOnNotificationThread(const NotificationData&, Function<void(Notification*)>&&);

private:
    Notification(ScriptExecutionContext&, WTF::UUID, const String& title, Options&&, Ref<SerializedScriptValue>&&);

    NotificationClient* clientFromContext();
    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::Notification; }

    void stopResourcesLoader();

    // ActiveDOMObject
    void suspend(ReasonForSuspension);
    void stop() final;
    bool virtualHasPendingActivity() const final;

    // EventTarget
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }
    void eventListenersDidChange() final;

    WTF::UUID m_identifier;

#if ENABLE(DECLARATIVE_WEB_PUSH)
    URL m_navigate;
#endif
    String m_title;
    Direction m_direction;
    String m_lang;
    String m_body;
    String m_tag;
    URL m_icon;
    Ref<SerializedScriptValue> m_dataForBindings;
    std::optional<bool> m_silent;

    enum State { Idle, Showing, Closed };
    State m_state { Idle };
    bool m_hasRelevantEventListener { false };

    enum class NotificationSource : uint8_t {
        DedicatedWorker,
        Document,
        ServiceWorker,
    };
    NotificationSource m_notificationSource;
    URL m_serviceWorkerRegistrationURL;
    std::unique_ptr<NotificationResourcesLoader> m_resourcesLoader;
    RefPtr<NotificationResources> m_resources;
};

} // namespace WebCore

#endif // ENABLE(NOTIFICATIONS)
