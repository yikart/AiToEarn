/*
 * Copyright (C) 2006-2017 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Nokia Corporation and/or its subsidiary(-ies)
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

#include "Base64Utilities.h"
#include "ContextDestructionObserverInlines.h"
#include "DOMWindow.h"
#include "ExceptionOr.h"
#include "LocalFrame.h"
#include "PushManager.h"
#include "PushSubscriptionOwner.h"
#include "ReducedResolutionSeconds.h"
#include "ScrollToOptions.h"
#include "Supplementable.h"
#include "WindowOrWorkerGlobalScope.h"
#include "WindowPostMessageOptions.h"
#include <JavaScriptCore/HandleTypes.h>
#include <JavaScriptCore/Strong.h>
#include <wtf/FixedVector.h>
#include <wtf/Function.h>
#include <wtf/HashSet.h>
#include <wtf/MonotonicTime.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class LocalDOMWindowObserver;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::LocalDOMWindowObserver> : std::true_type { };
}

namespace JSC {
class CallFrame;
class JSObject;
class JSValue;
}

namespace WebCore {

enum class IncludeTargetOrigin : bool { No, Yes };

class LocalDOMWindowObserver : public CanMakeWeakPtr<LocalDOMWindowObserver> {
public:
    virtual ~LocalDOMWindowObserver() { }

    virtual void suspendForBackForwardCache() { }
    virtual void resumeFromBackForwardCache() { }
    virtual void willDestroyGlobalObjectInCachedFrame() { }
    virtual void willDestroyGlobalObjectInFrame() { }
    virtual void willDetachGlobalObjectFromFrame() { }
};

class LocalDOMWindow final
    : public DOMWindow
    , public ContextDestructionObserver
    , public Base64Utilities
    , public WindowOrWorkerGlobalScope
    , public Supplementable<LocalDOMWindow>
#if ENABLE(DECLARATIVE_WEB_PUSH)
    , public PushSubscriptionOwner
#endif
    {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(LocalDOMWindow);
public:

    static Ref<LocalDOMWindow> create(Document& document) { return adoptRef(*new LocalDOMWindow(document)); }
    WEBCORE_EXPORT virtual ~LocalDOMWindow();

    // In some rare cases, we'll reuse a LocalDOMWindow for a new Document. For example,
    // when a script calls window.open("..."), the browser gives JavaScript a window
    // synchronously but kicks off the load in the window asynchronously. Web sites
    // expect that modifications that they make to the window object synchronously
    // won't be blown away when the network load commits. To make that happen, we
    // "securely transition" the existing LocalDOMWindow to the Document that results from
    // the network load. See also SecurityContext::isSecureTransitionTo.
    void didSecureTransitionTo(Document&);

    WEBCORE_EXPORT void registerObserver(LocalDOMWindowObserver&);
    WEBCORE_EXPORT void unregisterObserver(LocalDOMWindowObserver&);

    void resetUnlessSuspendedForDocumentSuspension();
    void suspendForBackForwardCache();
    void resumeFromBackForwardCache();

    WEBCORE_EXPORT LocalFrame* frame() const final;
    RefPtr<LocalFrame> protectedFrame() const;

    RefPtr<WebCore::MediaQueryList> matchMedia(const String&);

    WEBCORE_EXPORT unsigned pendingUnloadEventListeners() const;

    WEBCORE_EXPORT static bool dispatchAllPendingBeforeUnloadEvents();
    WEBCORE_EXPORT static void dispatchAllPendingUnloadEvents();

    static FloatRect adjustWindowRect(Page&, const FloatRect& pendingChanges);

    bool allowPopUp(); // Call on first window, not target window.
    static bool allowPopUp(LocalFrame& firstFrame);
    static bool canShowModalDialog(const LocalFrame&);
    WEBCORE_EXPORT void setCanShowModalDialogOverride(bool);

    Screen& screen();
    WEBCORE_EXPORT History& history();
    Crypto& crypto() const;
    BarProp& locationbar();
    BarProp& menubar();
    BarProp& personalbar();
    BarProp& scrollbars();
    BarProp& statusbar();
    BarProp& toolbar();
    WEBCORE_EXPORT Navigator& navigator();
    Ref<Navigator> protectedNavigator();
    Navigator* optionalNavigator() const { return m_navigator.get(); }

    WEBCORE_EXPORT static void overrideTransientActivationDurationForTesting(std::optional<Seconds>&&);
    void setLastActivationTimestamp(MonotonicTime lastActivationTimestamp) { m_lastActivationTimestamp = lastActivationTimestamp; }
    void consumeLastActivationIfNecessary();
    MonotonicTime lastActivationTimestamp() const { return m_lastActivationTimestamp; }
    void notifyActivated(MonotonicTime);
    WEBCORE_EXPORT bool hasTransientActivation() const;
    bool hasStickyActivation() const;
    WEBCORE_EXPORT bool consumeTransientActivation();
    WEBCORE_EXPORT bool hasHistoryActionActivation() const;
    WEBCORE_EXPORT bool consumeHistoryActionUserActivation();

    DOMSelection* getSelection();

    HTMLFrameOwnerElement* frameElement() const;
    RefPtr<HTMLFrameOwnerElement> protectedFrameElement() const;

    WEBCORE_EXPORT void focus(bool allowFocus = false);
    void focus(LocalDOMWindow& incumbentWindow);
    void blur();
    void print();
    void stop();
    bool isStopping() const { return m_isStopping; }

    WEBCORE_EXPORT ExceptionOr<RefPtr<WindowProxy>> open(LocalDOMWindow& activeWindow, LocalDOMWindow& firstWindow, const String& urlString, const AtomString& frameName, const String& windowFeaturesString);

    void showModalDialog(const String& urlString, const String& dialogFeaturesString, LocalDOMWindow& activeWindow, LocalDOMWindow& firstWindow, const Function<void(LocalDOMWindow&)>& prepareDialogFunction);

    void prewarmLocalStorageIfNecessary();

    void alert(const String& message);
    bool confirmForBindings(const String& message);
    String prompt(const String& message, const String& defaultValue);

    bool find(const String&, bool caseSensitive, bool backwards, bool wrap, bool wholeWord, bool searchInFrames, bool showDialog) const;

    bool offscreenBuffering() const;

    int outerHeight() const;
    int outerWidth() const;
    int innerHeight() const;
    int innerWidth() const;
    int screenX() const;
    int screenY() const;
    int screenLeft() const { return screenX(); }
    int screenTop() const { return screenY(); }
    int scrollX() const;
    int scrollY() const;

    unsigned length() const;

    AtomString name() const;
    void setName(const AtomString&);

    String status() const;
    void setStatus(const String&);

    void disownOpener();

    String origin() const;
    SecurityOrigin* securityOrigin() const;

    // DOM Level 2 AbstractView Interface

    WEBCORE_EXPORT Document* document() const;
    WEBCORE_EXPORT RefPtr<Document> protectedDocument() const;

    // CSSOM View Module

    StyleMedia& styleMedia();

    // DOM Level 2 Style Interface

    WEBCORE_EXPORT Ref<CSSStyleDeclaration> getComputedStyle(Element&, const String& pseudoElt) const;

    // WebKit extensions

    WEBCORE_EXPORT RefPtr<CSSRuleList> getMatchedCSSRules(Element*, const String& pseudoElt, bool authorOnly = true) const;
    double devicePixelRatio() const;

    RefPtr<WebKitPoint> webkitConvertPointFromPageToNode(Node*, const WebKitPoint*) const;
    RefPtr<WebKitPoint> webkitConvertPointFromNodeToPage(Node*, const WebKitPoint*) const;

    void printErrorMessage(const String&) const;

    String crossDomainAccessErrorMessage(const LocalDOMWindow& activeWindow, IncludeTargetOrigin);

    ExceptionOr<void> postMessage(JSC::JSGlobalObject&, LocalDOMWindow& incumbentWindow, JSC::JSValue message, WindowPostMessageOptions&&);
    WEBCORE_EXPORT void postMessageFromRemoteFrame(JSC::JSGlobalObject&, RefPtr<WindowProxy>&& source, const String& sourceOrigin, std::optional<WebCore::SecurityOriginData>&& targetOrigin, const WebCore::MessageWithMessagePorts&);

    void languagesChanged();

    void scrollBy(const ScrollToOptions&) const;
    void scrollBy(double x, double y) const;
    void scrollTo(const ScrollToOptions&, ScrollClamping = ScrollClamping::Clamped, ScrollSnapPointSelectionMethod = ScrollSnapPointSelectionMethod::Closest, std::optional<FloatSize> originalScrollDelta = std::nullopt) const;
    void scrollTo(double x, double y, ScrollClamping = ScrollClamping::Clamped) const;

    void moveBy(int x, int y) const;
    void moveTo(int x, int y) const;

    void resizeBy(int x, int y) const;
    void resizeTo(int width, int height) const;

    VisualViewport& visualViewport();

    // Timers
    ExceptionOr<int> setTimeout(std::unique_ptr<ScheduledAction>, int timeout, FixedVector<JSC::Strong<JSC::Unknown>>&& arguments);
    void clearTimeout(int timeoutId);
    ExceptionOr<int> setInterval(std::unique_ptr<ScheduledAction>, int timeout, FixedVector<JSC::Strong<JSC::Unknown>>&& arguments);
    void clearInterval(int timeoutId);

    int requestAnimationFrame(Ref<RequestAnimationFrameCallback>&&);
    int webkitRequestAnimationFrame(Ref<RequestAnimationFrameCallback>&&);
    void cancelAnimationFrame(int id);

    int requestIdleCallback(Ref<IdleRequestCallback>&&, const IdleRequestOptions&);
    void cancelIdleCallback(int id);

    // ImageBitmap
    void createImageBitmap(ImageBitmap::Source&&, ImageBitmapOptions&&, ImageBitmap::Promise&&);
    void createImageBitmap(ImageBitmap::Source&&, int sx, int sy, int sw, int sh, ImageBitmapOptions&&, ImageBitmap::Promise&&);

    // Secure Contexts
    bool isSecureContext() const;

    bool crossOriginIsolated() const;

    // Events
    // EventTarget API
    WEBCORE_EXPORT bool addEventListener(const AtomString& eventType, Ref<EventListener>&&, const AddEventListenerOptions&) final;
    WEBCORE_EXPORT bool removeEventListener(const AtomString& eventType, EventListener&, const EventListenerOptions&) final;
    void removeAllEventListeners() final;

    using EventTarget::dispatchEvent;
    void dispatchEvent(Event&, EventTarget*);

    void dispatchLoadEvent();

    void captureEvents();
    void releaseEvents();

    void finishedLoading();

    // HTML 5 key/value storage
    ExceptionOr<Storage*> sessionStorage();
    ExceptionOr<Storage*> localStorage();
    Storage* optionalSessionStorage() const { return m_sessionStorage.get(); }
    Storage* optionalLocalStorage() const { return m_localStorage.get(); }

    CustomElementRegistry* customElementRegistry() { return m_customElementRegistry.get(); }
    CustomElementRegistry& ensureCustomElementRegistry();

    ExceptionOr<Ref<NodeList>> collectMatchingElementsInFlatTree(Node&, const String& selectors);
    ExceptionOr<RefPtr<Element>> matchingElementInFlatTree(Node&, const String& selectors);

#if ENABLE(ORIENTATION_EVENTS)
    // This is the interface orientation in degrees. Some examples are:
    //  0 is straight up; -90 is when the device is rotated 90 clockwise;
    //  90 is when rotated counter clockwise.
    IntDegrees orientation() const;
#endif

    Performance& performance() const;
    Ref<Performance> protectedPerformance() const;

    WEBCORE_EXPORT ReducedResolutionSeconds nowTimestamp() const;
    void freezeNowTimestamp();
    void unfreezeNowTimestamp();
    ReducedResolutionSeconds frozenNowTimestamp() const;

#if PLATFORM(IOS_FAMILY)
    void incrementScrollEventListenersCount();
    void decrementScrollEventListenersCount();
    unsigned scrollEventListenerCount() const { return m_scrollEventListenerCount; }
#endif

#if ENABLE(DEVICE_ORIENTATION)
    void startListeningForDeviceOrientationIfNecessary();
    void stopListeningForDeviceOrientationIfNecessary();
    void startListeningForDeviceMotionIfNecessary();
    void stopListeningForDeviceMotionIfNecessary();

    bool isAllowedToUseDeviceOrientation(String& message) const;
    bool isAllowedToUseDeviceMotion(String& message) const;

    DeviceOrientationController* deviceOrientationController() const;
    DeviceMotionController* deviceMotionController() const;
#endif

    void resetAllGeolocationPermission();

#if ENABLE(IOS_TOUCH_EVENTS) || ENABLE(IOS_GESTURE_EVENTS)
    bool hasTouchOrGestureEventListeners() const { return m_touchAndGestureEventListenerCount > 0; }
#endif

#if ENABLE(USER_MESSAGE_HANDLERS)
    bool shouldHaveWebKitNamespaceForWorld(DOMWrapperWorld&);
    WebKitNamespace* webkitNamespace();
#endif

    // Navigation API
    Navigation& navigation();
    Ref<Navigation> protectedNavigation();

    // FIXME: When this LocalDOMWindow is no longer the active LocalDOMWindow (i.e.,
    // when its document is no longer the document that is displayed in its
    // frame), we would like to zero out m_frame to avoid being confused
    // by the document that is currently active in m_frame.
    bool isCurrentlyDisplayedInFrame() const;

    void willDetachDocumentFromFrame();
    void willDestroyCachedFrame();

    void enableSuddenTermination();
    void disableSuddenTermination();

    void willDestroyDocumentInFrame();
    void frameDestroyed();

    bool wasWrappedWithoutInitializedSecurityOrigin() const { return m_wasWrappedWithoutInitializedSecurityOrigin; }
    void setAsWrappedWithoutInitializedSecurityOrigin() { m_wasWrappedWithoutInitializedSecurityOrigin = true; }

    void setMayReuseForNavigation(bool mayReuseForNavigation) { m_mayReuseForNavigation = mayReuseForNavigation; }
    bool mayReuseForNavigation() const { return m_mayReuseForNavigation; }

    Page* page() const;
    RefPtr<Page> protectedPage() const;

    WEBCORE_EXPORT static void forEachWindowInterestedInStorageEvents(const Function<void(LocalDOMWindow&)>&);

    CookieStore& cookieStore();

#if ENABLE(DECLARATIVE_WEB_PUSH)
    PushManager& pushManager();

    void ref() const final { DOMWindow::ref(); }
    void deref() const final { DOMWindow::deref(); }
#endif

private:
    explicit LocalDOMWindow(Document&);

    ScriptExecutionContext* scriptExecutionContext() const final { return ContextDestructionObserver::scriptExecutionContext(); }

    void closePage() final;
    void eventListenersDidChange() final;
    void setLocation(LocalDOMWindow& activeWindow, const URL& completedURL, NavigationHistoryBehavior, SetLocationLocking) final;

    bool allowedToChangeWindowGeometry() const;

    static ExceptionOr<RefPtr<Frame>> createWindow(const String& urlString, const AtomString& frameName, const WindowFeatures&, LocalDOMWindow& activeWindow, LocalFrame& firstFrame, LocalFrame& openerFrame, const Function<void(LocalDOMWindow&)>& prepareDialogFunction = nullptr);
    bool isInsecureScriptAccess(LocalDOMWindow& activeWindow, const String& urlString);

#if ENABLE(DEVICE_ORIENTATION)
    bool isAllowedToUseDeviceMotionOrOrientation(String& message) const;
    bool hasPermissionToReceiveDeviceMotionOrOrientationEvents(String& message) const;
    void failedToRegisterDeviceMotionEventListener();
#endif

    bool isSameSecurityOriginAsMainFrame() const;

#if ENABLE(GAMEPAD)
    void incrementGamepadEventListenerCount();
    void decrementGamepadEventListenerCount();
#endif

    void processPostMessage(JSC::JSGlobalObject&, const String& origin, const MessageWithMessagePorts&, RefPtr<WindowProxy>&&, RefPtr<SecurityOrigin>&&);

#if ENABLE(DECLARATIVE_WEB_PUSH)
    bool isActive() const final { return true; }

    void subscribeToPushService(const Vector<uint8_t>& applicationServerKey, DOMPromiseDeferred<IDLInterface<PushSubscription>>&&) final;
    void unsubscribeFromPushService(std::optional<PushSubscriptionIdentifier>, DOMPromiseDeferred<IDLBoolean>&&) final;
    void getPushSubscription(DOMPromiseDeferred<IDLNullable<IDLInterface<PushSubscription>>>&&) final;
    void getPushPermissionState(DOMPromiseDeferred<IDLEnumeration<PushPermissionState>>&&) final;
#endif // ENABLE(DECLARATIVE_WEB_PUSH)

    bool m_shouldPrintWhenFinishedLoading { false };
    bool m_suspendedForDocumentSuspension { false };
    bool m_isSuspendingObservers { false };
    std::optional<bool> m_canShowModalDialogOverride;

    WeakHashSet<LocalDOMWindowObserver> m_observers;

    mutable RefPtr<Crypto> m_crypto;
    mutable RefPtr<History> m_history;
    mutable RefPtr<BarProp> m_locationbar;
    mutable RefPtr<StyleMedia> m_media;
    mutable RefPtr<BarProp> m_menubar;
    mutable RefPtr<Navigator> m_navigator;
    mutable RefPtr<BarProp> m_personalbar;
    mutable RefPtr<Screen> m_screen;
    mutable RefPtr<BarProp> m_scrollbars;
    mutable RefPtr<DOMSelection> m_selection;
    mutable RefPtr<BarProp> m_statusbar;
    mutable RefPtr<BarProp> m_toolbar;
    mutable RefPtr<VisualViewport> m_visualViewport;
    mutable RefPtr<Navigation> m_navigation;

    String m_status;

#if PLATFORM(IOS_FAMILY)
    unsigned m_scrollEventListenerCount { 0 };
#endif

#if ENABLE(IOS_TOUCH_EVENTS) || ENABLE(IOS_GESTURE_EVENTS)
    unsigned m_touchAndGestureEventListenerCount { 0 };
#endif

#if ENABLE(GAMEPAD)
    uint64_t m_gamepadEventListenerCount { 0 };
#endif

    mutable RefPtr<Storage> m_sessionStorage;
    mutable RefPtr<Storage> m_localStorage;

    RefPtr<CustomElementRegistry> m_customElementRegistry;

    mutable RefPtr<Performance> m_performance;

    std::optional<ReducedResolutionSeconds> m_frozenNowTimestamp;

    // For the purpose of tracking user activation, each Window W has a last activation timestamp. This is a number indicating the last time W got
    // an activation notification. It corresponds to a DOMHighResTimeStamp value except for two cases: positive infinity indicates that W has never
    // been activated, while negative infinity indicates that a user activation-gated API has consumed the last user activation of W. The initial
    // value is positive infinity.
    MonotonicTime m_lastActivationTimestamp { MonotonicTime::infinity() };
    MonotonicTime m_lastHistoryActionActivationTimestamp { MonotonicTime::infinity() };

    bool m_wasWrappedWithoutInitializedSecurityOrigin { false };
    bool m_mayReuseForNavigation { true };
    bool m_isStopping { false };
#if ENABLE(USER_MESSAGE_HANDLERS)
    mutable RefPtr<WebKitNamespace> m_webkitNamespace;
#endif

    RefPtr<CookieStore> m_cookieStore;

#if ENABLE(DECLARATIVE_WEB_PUSH)
    PushManager m_pushManager;
#endif
};

inline String LocalDOMWindow::status() const
{
    return m_status;
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::LocalDOMWindow)
    static bool isType(const WebCore::DOMWindow& window) { return window.isLocalDOMWindow(); }
    static bool isType(const WebCore::EventTarget& target) { return target.eventTargetInterface() == WebCore::EventTargetInterfaceType::DOMWindow; }
SPECIALIZE_TYPE_TRAITS_END()
