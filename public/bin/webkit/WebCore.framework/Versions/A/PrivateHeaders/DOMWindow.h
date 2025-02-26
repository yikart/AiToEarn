/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

#include "EventTarget.h"
#include "GlobalWindowIdentifier.h"
#include "ImageBitmap.h"
#include "ScrollTypes.h"
#include <wtf/CheckedRef.h>
#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class BarProp;
class CSSRuleList;
class CSSStyleDeclaration;
class CookieStore;
class Crypto;
class CustomElementRegistry;
class DOMSelection;
class DOMWrapperWorld;
class Document;
class Element;
class EventListener;
class FloatRect;
class Frame;
class HTMLFrameOwnerElement;
class History;
class IdleRequestCallback;
class JSDOMGlobalObject;
class LocalDOMWindow;
class LocalDOMWindowProperty;
class Location;
class MediaQueryList;
class Navigation;
class Navigator;
class Node;
class NodeList;
class Page;
class PageConsoleClient;
class Performance;
class PushManager;
class RequestAnimationFrameCallback;
class RequestIdleCallback;
class ScheduledAction;
class Screen;
class SecurityOrigin;
class Storage;
class StyleMedia;
class VisualViewport;
class WebCoreOpaqueRoot;
class WebKitNamespace;
class WebKitPoint;
class WindowProxy;

#if ENABLE(DEVICE_ORIENTATION)
class DeviceMotionController;
class DeviceOrientationController;
#endif

struct IdleRequestOptions;
struct ImageBitmapOptions;
struct MessageWithMessagePorts;
struct ScrollToOptions;
struct StructuredSerializeOptions;
struct WindowFeatures;
struct WindowPostMessageOptions;

enum class SetLocationLocking : bool { LockHistoryBasedOnGestureState, LockHistoryAndBackForwardList };
enum class NavigationHistoryBehavior : uint8_t;

using IntDegrees = int32_t;

class DOMWindow : public RefCounted<DOMWindow>, public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(DOMWindow);
public:
    virtual ~DOMWindow();

    const GlobalWindowIdentifier& identifier() const { return m_identifier; }
    virtual Frame* frame() const = 0;
    RefPtr<Frame> protectedFrame() const;

    enum class DOMWindowType : bool { Local, Remote };
    bool isLocalDOMWindow() const { return m_type == DOMWindowType::Local; }
    bool isRemoteDOMWindow() const { return m_type == DOMWindowType::Remote; }

    using RefCounted::ref;
    using RefCounted::deref;

    WEBCORE_EXPORT Location& location();
    virtual void setLocation(LocalDOMWindow& activeWindow, const URL& completedURL, NavigationHistoryBehavior, SetLocationLocking = SetLocationLocking::LockHistoryBasedOnGestureState) = 0;

    bool closed() const;
    WEBCORE_EXPORT void close();
    void close(Document&);
    virtual void closePage() = 0;

    PageConsoleClient* console() const;
    CheckedPtr<PageConsoleClient> checkedConsole() const;

    WindowProxy* opener() const;
    Document* documentIfLocal();

    WindowProxy* top() const;
    WindowProxy* parent() const;
    unsigned length() const;
    void focus(LocalDOMWindow& incumbentWindow);
    void blur();

    ExceptionOr<AtomString> name() const;
    ExceptionOr<void> setName(const AtomString&);
    ExceptionOr<String> status() const;
    ExceptionOr<void> setStatus(const String&);
    ExceptionOr<Document*> document() const;
    ExceptionOr<History&> history();
    ExceptionOr<CustomElementRegistry&> ensureCustomElementRegistry();
    ExceptionOr<BarProp&> locationbar();
    ExceptionOr<BarProp&> menubar();
    ExceptionOr<BarProp&> personalbar();
    ExceptionOr<BarProp&> scrollbars();
    ExceptionOr<BarProp&> statusbar();
    ExceptionOr<BarProp&> toolbar();
    ExceptionOr<Navigation&> navigation();
    ExceptionOr<int> outerHeight() const;
    ExceptionOr<int> outerWidth() const;
    ExceptionOr<int> innerHeight() const;
    ExceptionOr<int> innerWidth() const;
    ExceptionOr<int> screenX() const;
    ExceptionOr<int> screenY() const;
    ExceptionOr<int> screenLeft() const;
    ExceptionOr<int> screenTop() const;
    ExceptionOr<int> scrollX() const;
    ExceptionOr<int> scrollY() const;
    ExceptionOr<HTMLFrameOwnerElement*> frameElement() const;
    ExceptionOr<Navigator&> navigator();
    ExceptionOr<bool> offscreenBuffering() const;
    ExceptionOr<CookieStore&> cookieStore();
    ExceptionOr<Screen&> screen();
    ExceptionOr<double> devicePixelRatio() const;
    ExceptionOr<StyleMedia&> styleMedia();
    ExceptionOr<VisualViewport&> visualViewport();
    ExceptionOr<Storage*> localStorage();
    ExceptionOr<Storage*> sessionStorage();
    ExceptionOr<String> origin() const;
    ExceptionOr<bool> isSecureContext() const;
    ExceptionOr<bool> crossOriginIsolated() const;
    ExceptionOr<void> print();
    ExceptionOr<void> stop();
    ExceptionOr<Performance&> performance() const;
    ExceptionOr<void> postMessage(JSC::JSGlobalObject&, LocalDOMWindow& incumbentWindow, JSC::JSValue message, WindowPostMessageOptions&&);
    ExceptionOr<void> postMessage(JSC::JSGlobalObject&, LocalDOMWindow& incumbentWindow, JSC::JSValue message, String&& targetOrigin, Vector<JSC::Strong<JSC::JSObject>>&& transfer);
    ExceptionOr<Ref<CSSStyleDeclaration>> getComputedStyle(Element&, const String& pseudoElt) const;
    ExceptionOr<RefPtr<WebCore::MediaQueryList>> matchMedia(const String&);
    ExceptionOr<Crypto&> crypto() const;
    ExceptionOr<RefPtr<WindowProxy>> open(LocalDOMWindow& activeWindow, LocalDOMWindow& firstWindow, const String& urlString, const AtomString& frameName, const String& windowFeaturesString);
    ExceptionOr<void> alert(const String& message = emptyString());
    ExceptionOr<bool> confirmForBindings(const String& message);
    ExceptionOr<String> prompt(const String& message, const String& defaultValue);
    ExceptionOr<void> captureEvents();
    ExceptionOr<void> releaseEvents();
    ExceptionOr<bool> find(const String&, bool caseSensitive, bool backwards, bool wrap, bool wholeWord, bool searchInFrames, bool showDialog) const;
    ExceptionOr<int> requestAnimationFrame(Ref<RequestAnimationFrameCallback>&&);
    ExceptionOr<int> webkitRequestAnimationFrame(Ref<RequestAnimationFrameCallback>&&);
    ExceptionOr<void> cancelAnimationFrame(int id);
    ExceptionOr<int> requestIdleCallback(Ref<IdleRequestCallback>&&, const IdleRequestOptions&);
    ExceptionOr<void> cancelIdleCallback(int id);
    ExceptionOr<void> createImageBitmap(ImageBitmap::Source&&, ImageBitmapOptions&&, ImageBitmap::Promise&&);
    ExceptionOr<void> createImageBitmap(ImageBitmap::Source&&, int sx, int sy, int sw, int sh, ImageBitmapOptions&&, ImageBitmap::Promise&&);
    ExceptionOr<RefPtr<CSSRuleList>> getMatchedCSSRules(Element*, const String& pseudoElt, bool authorOnly = true) const;
    ExceptionOr<RefPtr<WebKitPoint>> webkitConvertPointFromPageToNode(Node*, const WebKitPoint*) const;
    ExceptionOr<RefPtr<WebKitPoint>> webkitConvertPointFromNodeToPage(Node*, const WebKitPoint*) const;
    ExceptionOr<Ref<NodeList>> collectMatchingElementsInFlatTree(Node&, const String& selectors);
    ExceptionOr<RefPtr<Element>> matchingElementInFlatTree(Node&, const String& selectors);
    ExceptionOr<void> scrollBy(const ScrollToOptions&) const;
    ExceptionOr<void> scrollBy(double x, double y) const;
    ExceptionOr<void> scrollTo(const ScrollToOptions&, ScrollClamping = ScrollClamping::Clamped, ScrollSnapPointSelectionMethod = ScrollSnapPointSelectionMethod::Closest, std::optional<FloatSize> originalScrollDelta = std::nullopt) const;
    ExceptionOr<void> scrollTo(double x, double y, ScrollClamping = ScrollClamping::Clamped) const;
    ExceptionOr<void> moveBy(int x, int y) const;
    ExceptionOr<void> moveTo(int x, int y) const;
    ExceptionOr<void> resizeBy(int x, int y) const;
    ExceptionOr<void> resizeTo(int width, int height) const;
    ExceptionOr<DOMSelection*> getSelection();
    ExceptionOr<int> setTimeout(std::unique_ptr<ScheduledAction>, int timeout, FixedVector<JSC::Strong<JSC::Unknown>>&& arguments);
    ExceptionOr<void> clearTimeout(int timeoutId);
    ExceptionOr<int> setInterval(std::unique_ptr<ScheduledAction>, int timeout, FixedVector<JSC::Strong<JSC::Unknown>>&& arguments);
    ExceptionOr<void> clearInterval(int timeoutId);
#if ENABLE(ORIENTATION_EVENTS)
    ExceptionOr<IntDegrees> orientation() const;
#endif

    ExceptionOr<void> reportError(JSDOMGlobalObject&, JSC::JSValue);
    ExceptionOr<JSC::JSValue> structuredClone(JSDOMGlobalObject& lexicalGlobalObject, JSDOMGlobalObject& relevantGlobalObject, JSC::JSValue, StructuredSerializeOptions&&);
    ExceptionOr<String> btoa(const String&);
    ExceptionOr<String> atob(const String&);

#if ENABLE(DECLARATIVE_WEB_PUSH)
    ExceptionOr<PushManager&> pushManager();
#endif

protected:
    explicit DOMWindow(GlobalWindowIdentifier&&, DOMWindowType);

    ExceptionOr<RefPtr<SecurityOrigin>> createTargetOriginForPostMessage(const String&, Document&);

    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::DOMWindow; }
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

private:
    GlobalWindowIdentifier m_identifier;
    RefPtr<Location> m_location;
    const DOMWindowType m_type;
};

WebCoreOpaqueRoot root(DOMWindow*);

} // namespace WebCore
