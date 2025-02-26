/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 * Copyright (C) 2015-2016 Apple Inc. All rights reserved.
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

#include "CachedResource.h"
#include "FrameIdentifier.h"
#include "InspectorWebAgentBase.h"
#include "LayoutRect.h"
#include "ProcessIdentifier.h"
#include <JavaScriptCore/InspectorBackendDispatchers.h>
#include <JavaScriptCore/InspectorFrontendDispatchers.h>
#include <JavaScriptCore/InspectorProtocolObjects.h>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakRef.h>
#include <wtf/text/WTFString.h>

namespace Inspector {
class InjectedScriptManager;
}

namespace WebCore {

class DOMWrapperWorld;
class DocumentLoader;
class Frame;
class HTMLInputElement;
class InspectorClient;
class InspectorOverlay;
class LocalFrame;
class Page;
class RenderObject;
class FragmentedSharedBuffer;

class InspectorPageAgent final : public InspectorAgentBase, public Inspector::PageBackendDispatcherHandler {
    WTF_MAKE_NONCOPYABLE(InspectorPageAgent);
    WTF_MAKE_TZONE_ALLOCATED(InspectorPageAgent);
public:
    InspectorPageAgent(PageAgentContext&, InspectorClient*, InspectorOverlay&);
    ~InspectorPageAgent();

    enum ResourceType {
        DocumentResource,
        StyleSheetResource,
        ImageResource,
        FontResource,
        ScriptResource,
        XHRResource,
        FetchResource,
        PingResource,
        BeaconResource,
        WebSocketResource,
#if ENABLE(APPLICATION_MANIFEST)
        ApplicationManifestResource,
#endif
        EventSourceResource,
        OtherResource,
    };

    WEBCORE_EXPORT static String serializeFrameID(FrameIdentifier frameID);
    WEBCORE_EXPORT static std::optional<FrameIdentifier> parseFrameID(String frameID);
    static bool sharedBufferContent(RefPtr<FragmentedSharedBuffer>&&, const String& textEncodingName, bool withBase64Encode, String* result);
    static Vector<CachedResource*> cachedResourcesForFrame(LocalFrame*);
    static void resourceContent(Inspector::Protocol::ErrorString&, LocalFrame*, const URL&, String* result, bool* base64Encoded);
    static String sourceMapURLForResource(CachedResource*);
    static CachedResource* cachedResource(const LocalFrame*, const URL&);
    static Inspector::Protocol::Page::ResourceType resourceTypeJSON(ResourceType);
    static ResourceType inspectorResourceType(CachedResource::Type);
    static ResourceType inspectorResourceType(const CachedResource&);
    static Inspector::Protocol::Page::ResourceType cachedResourceTypeJSON(const CachedResource&);
    static LocalFrame* findFrameWithSecurityOrigin(Page&, const String& originRawString);
    static DocumentLoader* assertDocumentLoader(Inspector::Protocol::ErrorString&, LocalFrame*);

    // InspectorAgentBase
    void didCreateFrontendAndBackend(Inspector::FrontendRouter*, Inspector::BackendDispatcher*);
    void willDestroyFrontendAndBackend(Inspector::DisconnectReason);

    // PageBackendDispatcherHandler
    Inspector::Protocol::ErrorStringOr<void> enable();
    Inspector::Protocol::ErrorStringOr<void> disable();
    Inspector::Protocol::ErrorStringOr<void> reload(std::optional<bool>&& ignoreCache, std::optional<bool>&& revalidateAllResources);
    Inspector::Protocol::ErrorStringOr<void> goBack();
    Inspector::Protocol::ErrorStringOr<void> goForward();
    Inspector::Protocol::ErrorStringOr<void> navigate(const String& url);
    Inspector::Protocol::ErrorStringOr<void> overrideUserAgent(const String&);
    Inspector::Protocol::ErrorStringOr<void> overridePlatform(const String&);
    Inspector::Protocol::ErrorStringOr<void> overrideSetting(Inspector::Protocol::Page::Setting, std::optional<bool>&& value);
    Inspector::Protocol::ErrorStringOr<void> overrideUserPreference(Inspector::Protocol::Page::UserPreferenceName, std::optional<Inspector::Protocol::Page::UserPreferenceValue>&&);
    Inspector::Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Inspector::Protocol::Page::Cookie>>> getCookies();
    Inspector::Protocol::ErrorStringOr<void> setCookie(Ref<JSON::Object>&&, std::optional<bool>&& shouldPartition);
    Inspector::Protocol::ErrorStringOr<void> deleteCookie(const String& cookieName, const String& url);
    Inspector::Protocol::ErrorStringOr<Ref<Inspector::Protocol::Page::FrameResourceTree>> getResourceTree();
    Inspector::Protocol::ErrorStringOr<std::tuple<String, bool /* base64Encoded */>> getResourceContent(const Inspector::Protocol::Network::FrameId&, const String& url);
    Inspector::Protocol::ErrorStringOr<void> setBootstrapScript(const String& source);
    Inspector::Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Inspector::Protocol::GenericTypes::SearchMatch>>> searchInResource(const Inspector::Protocol::Network::FrameId&, const String& url, const String& query, std::optional<bool>&& caseSensitive, std::optional<bool>&& isRegex, const Inspector::Protocol::Network::RequestId&);
    Inspector::Protocol::ErrorStringOr<Ref<JSON::ArrayOf<Inspector::Protocol::Page::SearchResult>>> searchInResources(const String&, std::optional<bool>&& caseSensitive, std::optional<bool>&& isRegex);
#if !PLATFORM(IOS_FAMILY)
    Inspector::Protocol::ErrorStringOr<void> setShowRulers(bool);
#endif
    Inspector::Protocol::ErrorStringOr<void> setShowPaintRects(bool);
    Inspector::Protocol::ErrorStringOr<void> setEmulatedMedia(const String&);
    Inspector::Protocol::ErrorStringOr<void> setForcedColors(std::optional<Inspector::Protocol::Page::ForcedColors>&&);
    Inspector::Protocol::ErrorStringOr<void> setTimeZone(const String&);
    Inspector::Protocol::ErrorStringOr<void> setTouchEmulationEnabled(bool);
    Inspector::Protocol::ErrorStringOr<String> snapshotNode(Inspector::Protocol::DOM::NodeId);
    Inspector::Protocol::ErrorStringOr<String> snapshotRect(int x, int y, int width, int height, Inspector::Protocol::Page::CoordinateSystem, std::optional<bool>&& omitDeviceScaleFactor);
#if ENABLE(WEB_ARCHIVE) && USE(CF)
    Inspector::Protocol::ErrorStringOr<String> archive();
#endif
    Inspector::Protocol::ErrorStringOr<void> setScreenSizeOverride(std::optional<int>&& width, std::optional<int>&& height);

    Inspector::Protocol::ErrorStringOr<void> insertText(const String& text);
    Inspector::Protocol::ErrorStringOr<Ref<Inspector::Protocol::Page::AXNode>> accessibilitySnapshot(const String& objectId);
    Inspector::Protocol::ErrorStringOr<void> setInterceptFileChooserDialog(bool enabled);
    Inspector::Protocol::ErrorStringOr<void> setDefaultBackgroundColorOverride(RefPtr<JSON::Object>&&);
    Inspector::Protocol::ErrorStringOr<void> createUserWorld(const String&);
    Inspector::Protocol::ErrorStringOr<void> setBypassCSP(bool);
    Inspector::Protocol::ErrorStringOr<void> crash();
    Inspector::Protocol::ErrorStringOr<void> updateScrollingState();

    // InspectorInstrumentation
    void domContentEventFired(LocalFrame&);
    void loadEventFired(LocalFrame&);
    void frameNavigated(LocalFrame&);
    void frameDetached(LocalFrame&);
    void frameStartedLoading(LocalFrame&);
    void frameStoppedLoading(LocalFrame&);
    void frameScheduledNavigation(Frame&, Seconds delay, bool targetIsCurrentFrame);
    void frameClearedScheduledNavigation(Frame&);
    void accessibilitySettingsDidChange();
    void defaultUserPreferencesDidChange();
    void didNavigateWithinPage(LocalFrame&);
#if ENABLE(DARK_MODE_CSS)
    void defaultAppearanceDidChange();
#endif
    void applyUserAgentOverride(String&);
    void applyPlatformOverride(String&);
    void applyEmulatedMedia(AtomString&);
    void didClearWindowObjectInWorld(LocalFrame&, DOMWrapperWorld&);
    void didPaint(RenderObject&, const LayoutRect&);
    void didLayout();
    void didScroll();
    void didRecalculateStyle();
    void runOpenPanel(HTMLInputElement* element, bool* intercept);
    void frameAttached(LocalFrame&);
    bool shouldBypassCSP();
    void willCheckNavigationPolicy(LocalFrame&);
    void didCheckNavigationPolicy(LocalFrame&, bool cancel);
    bool doingAccessibilitySnapshot() const { return m_doingAccessibilitySnapshot; };

    Frame* frameForId(const Inspector::Protocol::Network::FrameId&);
    WEBCORE_EXPORT String frameId(Frame*);
    String loaderId(DocumentLoader*);
    LocalFrame* assertFrame(Inspector::Protocol::ErrorString&, const Inspector::Protocol::Network::FrameId&);
    void setIgnoreDidClearWindowObject(bool ignore) { m_ignoreDidClearWindowObject = ignore; }
    bool ignoreDidClearWindowObject() const { return m_ignoreDidClearWindowObject; }

private:
    double timestamp();
    void ensureUserWorldsExistInAllFrames(const Vector<DOMWrapperWorld*>&);

    Ref<InspectorOverlay> protectedOverlay() const;

    static bool mainResourceContent(LocalFrame*, bool withBase64Encode, String* result);
    static bool dataContent(std::span<const uint8_t> data, const String& textEncodingName, bool withBase64Encode, String* result);

    void overridePrefersReducedMotion(std::optional<Inspector::Protocol::Page::UserPreferenceValue>&&);
    void overridePrefersContrast(std::optional<Inspector::Protocol::Page::UserPreferenceValue>&&);
    void overridePrefersColorScheme(std::optional<Inspector::Protocol::Page::UserPreferenceValue>&&);

    Ref<Inspector::Protocol::Page::Frame> buildObjectForFrame(LocalFrame*);
    Ref<Inspector::Protocol::Page::FrameResourceTree> buildObjectForFrameTree(LocalFrame*);

    std::unique_ptr<Inspector::PageFrontendDispatcher> m_frontendDispatcher;
    RefPtr<Inspector::PageBackendDispatcher> m_backendDispatcher;

    Page& m_inspectedPage;
    Inspector::InjectedScriptManager& m_injectedScriptManager;
    InspectorClient* m_client { nullptr };
    WeakRef<InspectorOverlay> m_overlay;

    MemoryCompactRobinHoodHashMap<String, WeakPtr<Frame>> m_identifierToFrame;
    HashMap<DocumentLoader*, String> m_loaderToIdentifier;
    String m_userAgentOverride;
    String m_platformOverride;
    AtomString m_emulatedMedia;
    String m_bootstrapScript;
    bool m_isFirstLayoutAfterOnLoad { false };
    bool m_showPaintRects { false };
    bool m_interceptFileChooserDialog { false };
    bool m_bypassCSP { false };
    bool m_doingAccessibilitySnapshot { false };
    bool m_ignoreDidClearWindowObject { false };
};

} // namespace WebCore
