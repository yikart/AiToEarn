/*
 * Copyright (C) 1998, 1999 Torben Weis <weis@kde.org>
 *                     1999-2001 Lars Knoll <knoll@kde.org>
 *                     1999-2001 Antti Koivisto <koivisto@kde.org>
 *                     2000-2001 Simon Hausmann <hausmann@kde.org>
 *                     2000-2001 Dirk Mueller <mueller@kde.org>
 *                     2000 Stefan Schimanski <1Stein@gmx.de>
 * Copyright (C) 2004-2018 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Nokia Corporation and/or its subsidiary(-ies)
 * Copyright (C) 2008 Eric Seidel <eric@webkit.org>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "AdjustViewSizeOrNot.h"
#include "DOMPasteAccess.h"
#include "Document.h"
#include "Frame.h"
#include "IntDegrees.h"
#include "ScrollTypes.h"
#include "UserScriptTypes.h"
#include <wtf/CheckedRef.h>
#include <wtf/HashSet.h>
#include <wtf/UniqueRef.h>
#include <wtf/WeakRef.h>

#if PLATFORM(IOS_FAMILY)
#include "Timer.h"
#include "ViewportArguments.h"
#include "VisibleSelection.h"
#endif

#if PLATFORM(WIN)
#include "FrameWin.h"
#endif

#if PLATFORM(COCOA)
OBJC_CLASS NSArray;
#endif

#if PLATFORM(WIN)
typedef struct HBITMAP__* HBITMAP;
#endif

typedef const struct OpaqueJSContext* JSContextRef;
typedef const struct OpaqueJSValue* JSValueRef;

namespace JSC { namespace Yarr {
class RegularExpression;
} }

namespace WTF {
class TextStream;
}

namespace WebCore {

class Color;
class LocalDOMWindow;
class DataDetectionResultsStorage;
class Document;
class Editor;
class Element;
class EventHandler;
class FloatSize;
class FrameDestructionObserver;
class FrameLoader;
class FrameSelection;
class HTMLFrameOwnerElement;
class HTMLTableCellElement;
class HitTestResult;
class ImageBuffer;
class IntPoint;
class IntRect;
class IntSize;
class LocalFrameLoaderClient;
class LocalFrameView;
class Node;
class Page;
class RenderLayer;
class RenderView;
class RenderWidget;
class ResourceMonitor;
class ScriptController;
class SecurityOrigin;
class VisiblePosition;
class Widget;

enum class SandboxFlag : uint16_t;
enum class WindowProxyProperty : uint8_t;

using SandboxFlags = OptionSet<SandboxFlag>;

struct SimpleRange;

#if PLATFORM(IOS_FAMILY)
enum {
    OverflowScrollNone = 0,
    OverflowScrollLeft = 1 << 0,
    OverflowScrollRight = 1 << 1,
    OverflowScrollUp = 1 << 2,
    OverflowScrollDown = 1 << 3
};

enum OverflowScrollAction { DoNotPerformOverflowScroll, PerformOverflowScroll };
#endif
using NodeQualifier = Function<Node* (const HitTestResult&, Node* terminationNode, IntRect* nodeBounds)>;

class LocalFrame final : public Frame {
public:
    using ClientCreator = CompletionHandler<UniqueRef<LocalFrameLoaderClient>(LocalFrame&, FrameLoader&)>;
    WEBCORE_EXPORT static Ref<LocalFrame> createMainFrame(Page&, ClientCreator&&, FrameIdentifier, SandboxFlags, Frame* opener);
    WEBCORE_EXPORT static Ref<LocalFrame> createSubframe(Page&, ClientCreator&&, FrameIdentifier, SandboxFlags, HTMLFrameOwnerElement&);
    WEBCORE_EXPORT static Ref<LocalFrame> createProvisionalSubframe(Page&, ClientCreator&&, FrameIdentifier, SandboxFlags, ScrollbarMode, Frame& parent);

    WEBCORE_EXPORT void init();
#if PLATFORM(IOS_FAMILY)
    // Creates <html><body style="..."></body></html> doing minimal amount of work.
    WEBCORE_EXPORT void initWithSimpleHTMLDocument(const AtomString& style, const URL&);
#endif
    WEBCORE_EXPORT void setView(RefPtr<LocalFrameView>&&);
    WEBCORE_EXPORT void createView(const IntSize&, const std::optional<Color>& backgroundColor, const IntSize& fixedLayoutSize, bool useFixedLayout = false, ScrollbarMode = ScrollbarMode::Auto, bool horizontalLock = false, ScrollbarMode = ScrollbarMode::Auto, bool verticalLock = false);

    WEBCORE_EXPORT ~LocalFrame();

    WEBCORE_EXPORT LocalDOMWindow* window() const;
    WEBCORE_EXPORT RefPtr<LocalDOMWindow> protectedWindow() const;

    void addDestructionObserver(FrameDestructionObserver&);
    void removeDestructionObserver(FrameDestructionObserver&);

    WEBCORE_EXPORT void willDetachPage();

    Document* document() const;
    RefPtr<Document> protectedDocument() const;
    LocalFrameView* view() const;
    inline RefPtr<LocalFrameView> protectedView() const; // Defined in LocalFrameView.h.

    Editor& editor() { return document()->editor(); }
    const Editor& editor() const { return document()->editor(); }
    WEBCORE_EXPORT Ref<Editor> protectedEditor();
    Ref<const Editor> protectedEditor() const;

    EventHandler& eventHandler() { return m_eventHandler; }
    const EventHandler& eventHandler() const { return m_eventHandler; }
    WEBCORE_EXPORT CheckedRef<EventHandler> checkedEventHandler();
    WEBCORE_EXPORT CheckedRef<const EventHandler> checkedEventHandler() const;

    const FrameLoader& loader() const { return m_loader.get(); }
    FrameLoader& loader() { return m_loader.get(); }
    WEBCORE_EXPORT Ref<const FrameLoader> protectedLoader() const;
    WEBCORE_EXPORT Ref<FrameLoader> protectedLoader();

    FrameSelection& selection() { return document()->selection(); }
    const FrameSelection& selection() const { return document()->selection(); }
    CheckedRef<FrameSelection> checkedSelection() const;
    ScriptController& script() { return m_script; }
    const ScriptController& script() const { return m_script; }
    CheckedRef<ScriptController> checkedScript();
    CheckedRef<const ScriptController> checkedScript() const;
    void resetScript();

    bool isRootFrame() const final { return m_rootFrame.ptr() == this; }
    const LocalFrame& rootFrame() const { return m_rootFrame.get(); }
    LocalFrame& rootFrame() { return m_rootFrame.get(); }

    WEBCORE_EXPORT RenderView* contentRenderer() const; // Root of the render tree for the document contained in this frame.

    bool documentIsBeingReplaced() const { return m_documentIsBeingReplaced; }

    bool requestDOMPasteAccess(DOMPasteAccessCategory = DOMPasteAccessCategory::General);

    String debugDescription() const;

    WEBCORE_EXPORT static LocalFrame* fromJSContext(JSContextRef);
    WEBCORE_EXPORT static LocalFrame* contentFrameFromWindowOrFrameElement(JSContextRef, JSValueRef);

// ======== All public functions below this point are candidates to move out of Frame into another class. ========

    WEBCORE_EXPORT void injectUserScripts(UserScriptInjectionTime);
    WEBCORE_EXPORT void injectUserScriptImmediately(DOMWrapperWorld&, const UserScript&);

    void injectUserScriptsAwaitingNotification();
    void addUserScriptAwaitingNotification(DOMWrapperWorld&, const UserScript&);

    WEBCORE_EXPORT String trackedRepaintRectsAsText() const;

    WEBCORE_EXPORT static LocalFrame* frameForWidget(const Widget&);

    WEBCORE_EXPORT void setPrinting(bool printing, const FloatSize& pageSize, const FloatSize& originalPageSize, float maximumShrinkRatio, AdjustViewSizeOrNot);
    bool shouldUsePrintingLayout() const;
    WEBCORE_EXPORT FloatSize resizePageRectsKeepingRatio(const FloatSize& originalSize, const FloatSize& expectedSize);

    void setDocument(RefPtr<Document>&&);

    // These recursively set zoom on all LocalFrame descendants,
    // use WebPageProxy instead to zoom the entire frame tree.
    WEBCORE_EXPORT void setPageZoomFactor(float);
    WEBCORE_EXPORT void setTextZoomFactor(float);
    WEBCORE_EXPORT void setPageAndTextZoomFactors(float pageZoomFactor, float textZoomFactor);

    float pageZoomFactor() const { return m_pageZoomFactor; }
    float textZoomFactor() const { return m_textZoomFactor; }

    // Scale factor of this frame with respect to the container.
    WEBCORE_EXPORT float frameScaleFactor() const;

    void deviceOrPageScaleFactorChanged();
    
#if ENABLE(DATA_DETECTION)
    DataDetectionResultsStorage* dataDetectionResultsIfExists() const { return m_dataDetectionResults.get(); }
    WEBCORE_EXPORT DataDetectionResultsStorage& dataDetectionResults();
#endif

    WEBCORE_EXPORT Node* deepestNodeAtLocation(const FloatPoint& viewportLocation);
    WEBCORE_EXPORT Node* nodeRespondingToClickEvents(const FloatPoint& viewportLocation, FloatPoint& adjustedViewportLocation, SecurityOrigin* = nullptr);
    WEBCORE_EXPORT Node* nodeRespondingToDoubleClickEvent(const FloatPoint& viewportLocation, FloatPoint& adjustedViewportLocation);
    WEBCORE_EXPORT Node* nodeRespondingToInteraction(const FloatPoint& viewportLocation, FloatPoint& adjustedViewportLocation);
    WEBCORE_EXPORT Node* nodeRespondingToScrollWheelEvents(const FloatPoint& viewportLocation);
    WEBCORE_EXPORT Node* approximateNodeAtViewportLocationLegacy(const FloatPoint& viewportLocation, FloatPoint& adjustedViewportLocation);

#if PLATFORM(IOS_FAMILY)
    const ViewportArguments& viewportArguments() const;
    WEBCORE_EXPORT void setViewportArguments(const ViewportArguments&);

    WEBCORE_EXPORT NSArray *wordsInCurrentParagraph() const;
    WEBCORE_EXPORT CGRect renderRectForPoint(CGPoint, bool* isReplaced, float* fontSize) const;

    WEBCORE_EXPORT void setSelectionChangeCallbacksDisabled(bool = true);
    bool selectionChangeCallbacksDisabled() const;

    enum ViewportOffsetChangeType { IncrementalScrollOffset, CompletedScrollOffset };
    WEBCORE_EXPORT void viewportOffsetChanged(ViewportOffsetChangeType);
    bool containsTiledBackingLayers() const;

    WEBCORE_EXPORT void overflowScrollPositionChangedForNode(const IntPoint&, Node*, bool isUserScroll);

    WEBCORE_EXPORT void resetAllGeolocationPermission();
#endif

#if ENABLE(ORIENTATION_EVENTS)
    // Orientation is the interface orientation in degrees. Some examples are:
    //  0 is straight up; -90 is when the device is rotated 90 clockwise;
    //  90 is when rotated counter clockwise.
    WEBCORE_EXPORT void orientationChanged();
    IntDegrees orientation() const;
#endif

    void clearTimers();
    static void clearTimers(LocalFrameView*, Document*);

    WEBCORE_EXPORT String displayStringModifiedByEncoding(const String&) const;

    WEBCORE_EXPORT VisiblePosition visiblePositionForPoint(const IntPoint& framePoint) const;
    Document* documentAtPoint(const IntPoint& windowPoint);
    WEBCORE_EXPORT std::optional<SimpleRange> rangeForPoint(const IntPoint& framePoint);

    WEBCORE_EXPORT String searchForLabelsAboveCell(const JSC::Yarr::RegularExpression&, HTMLTableCellElement*, size_t* resultDistanceFromStartOfCell);
    WEBCORE_EXPORT String searchForLabelsBeforeElement(const Vector<String>& labels, Element*, size_t* resultDistance, bool* resultIsInCellAbove);
    WEBCORE_EXPORT String matchLabelsAgainstElement(const Vector<String>& labels, Element*);

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT int preferredHeight() const;
    WEBCORE_EXPORT void updateLayout() const;
    WEBCORE_EXPORT NSRect caretRect();
    WEBCORE_EXPORT NSRect rectForScrollToVisible();

    // This function is used by Legacy WebKit.
    WEBCORE_EXPORT void setTimersPaused(bool);

    WEBCORE_EXPORT void dispatchPageHideEventBeforePause();
    WEBCORE_EXPORT void dispatchPageShowEventBeforeResume();
    WEBCORE_EXPORT void setRangedSelectionBaseToCurrentSelection();
    WEBCORE_EXPORT void setRangedSelectionBaseToCurrentSelectionStart();
    WEBCORE_EXPORT void setRangedSelectionBaseToCurrentSelectionEnd();
    WEBCORE_EXPORT void clearRangedSelectionInitialExtent();
    WEBCORE_EXPORT void setRangedSelectionInitialExtentToCurrentSelectionStart();
    WEBCORE_EXPORT void setRangedSelectionInitialExtentToCurrentSelectionEnd();
    WEBCORE_EXPORT VisibleSelection rangedSelectionBase() const;
    WEBCORE_EXPORT VisibleSelection rangedSelectionInitialExtent() const;
    WEBCORE_EXPORT void recursiveSetUpdateAppearanceEnabled(bool);
    WEBCORE_EXPORT NSArray *interpretationsForCurrentRoot() const;
#endif
    void suspendActiveDOMObjectsAndAnimations();
    void resumeActiveDOMObjectsAndAnimations();
    bool activeDOMObjectsAndAnimationsSuspended() const { return m_activeDOMObjectsAndAnimationsSuspendedCount > 0; }

    enum class InvalidateContentEventRegionsReason { Layout, EventHandlerChange };
    void invalidateContentEventRegionsIfNeeded(InvalidateContentEventRegionsReason);

    WEBCORE_EXPORT FloatSize screenSize() const;
    void setOverrideScreenSize(FloatSize&&);
    bool hasScreenSizeOverride() const { return !m_overrideScreenSize.isEmpty(); }

    void selfOnlyRef();
    void selfOnlyDeref();

    void documentURLOrOriginDidChange();

#if ENABLE(WINDOW_PROXY_PROPERTY_ACCESS_NOTIFICATION)
    void didAccessWindowProxyPropertyViaOpener(WindowProxyProperty);
#endif

    WEBCORE_EXPORT RefPtr<DocumentLoader> loaderForWebsitePolicies() const;
    void storageAccessExceptionReceivedForDomain(const RegistrableDomain&);
    bool requestSkipUserActivationCheckForStorageAccess(const RegistrableDomain&);

    String customUserAgent() const final;
    String customUserAgentAsSiteSpecificQuirks() const final;
    String customNavigatorPlatform() const final;
    OptionSet<AdvancedPrivacyProtections> advancedPrivacyProtections() const final;

    WEBCORE_EXPORT SandboxFlags effectiveSandboxFlags() const;
    SandboxFlags sandboxFlagsFromSandboxAttributeNotCSP() { return m_sandboxFlags; }
    WEBCORE_EXPORT void updateSandboxFlags(SandboxFlags, NotifyUIProcess) final;

    ScrollbarMode scrollingMode() const { return m_scrollingMode; }
    WEBCORE_EXPORT void updateScrollingMode() final;
    WEBCORE_EXPORT void setScrollingMode(ScrollbarMode);

#if ENABLE(CONTENT_EXTENSIONS)
    void networkUsageDidExceedThreshold();
#endif

protected:
    void frameWasDisconnectedFromOwner() const final;

private:
    friend class NavigationDisabler;

    LocalFrame(Page&, ClientCreator&&, FrameIdentifier, SandboxFlags, std::optional<ScrollbarMode>, HTMLFrameOwnerElement*, Frame* parent, Frame* opener);

    void dropChildren();

    void frameDetached() final;
    bool preventsParentFromBeingComplete() const final;
    void changeLocation(FrameLoadRequest&&) final;
    void didFinishLoadInAnotherProcess() final;

    FrameView* virtualView() const final;
    void disconnectView() final;
    DOMWindow* virtualWindow() const final;
    void reinitializeDocumentSecurityContext() final;
    FrameLoaderClient& loaderClient() final;
    void documentURLForConsoleLog(CompletionHandler<void(const URL&)>&&) final;

#if ENABLE(CONTENT_EXTENSIONS)
    void showResourceMonitoringError(String&& htmlContent);
#endif

    WeakHashSet<FrameDestructionObserver> m_destructionObservers;

    Vector<std::pair<Ref<DOMWrapperWorld>, UniqueRef<UserScript>>> m_userScriptsAwaitingNotification;

    const UniqueRef<FrameLoader> m_loader;

    RefPtr<LocalFrameView> m_view;
    RefPtr<Document> m_doc;

    UniqueRef<ScriptController> m_script;

#if ENABLE(DATA_DETECTION)
    std::unique_ptr<DataDetectionResultsStorage> m_dataDetectionResults;
#endif
    void betterApproximateNode(const IntPoint& testPoint, const NodeQualifier&, Node*& best, Node* failedNode, IntPoint& bestPoint, IntRect& bestRect, const IntRect& testRect);
    bool hitTestResultAtViewportLocation(const FloatPoint& viewportLocation, HitTestResult&, IntPoint& center);

    enum class ShouldApproximate : bool { No, Yes };
    enum class ShouldFindRootEditableElement : bool { No, Yes };
    Node* qualifyingNodeAtViewportLocation(const FloatPoint& viewportLocation, FloatPoint& adjustedViewportLocation, const NodeQualifier&, ShouldApproximate, ShouldFindRootEditableElement = ShouldFindRootEditableElement::Yes);

#if PLATFORM(IOS_FAMILY)
    void setTimersPausedInternal(bool);

    ViewportArguments m_viewportArguments;
    bool m_selectionChangeCallbacksDisabled { false };
    VisibleSelection m_rangedSelectionBase;
    VisibleSelection m_rangedSelectionInitialExtent;
#endif

    float m_pageZoomFactor;
    float m_textZoomFactor;
    ScrollbarMode m_scrollingMode { ScrollbarMode::Auto };

    int m_activeDOMObjectsAndAnimationsSuspendedCount { 0 };
    bool m_documentIsBeingReplaced { false };
    unsigned m_navigationDisableCount { 0 };
    unsigned m_selfOnlyRefCount { 0 };

#if ENABLE(WINDOW_PROXY_PROPERTY_ACCESS_NOTIFICATION)
    OptionSet<WindowProxyProperty> m_accessedWindowProxyPropertiesViaOpener;
#endif

    FloatSize m_overrideScreenSize;

    const WeakRef<LocalFrame> m_rootFrame;
    SandboxFlags m_sandboxFlags;
    UniqueRef<EventHandler> m_eventHandler;
    HashSet<RegistrableDomain> m_storageAccessExceptionDomains;
};

inline LocalFrameView* LocalFrame::view() const
{
    return m_view.get();
}

inline Document* LocalFrame::document() const
{
    return m_doc.get();
}

inline RefPtr<Document> LocalFrame::protectedDocument() const
{
    return document();
}

inline LocalFrameView* Document::view() const
{
    return m_frame ? m_frame->view() : nullptr;
}

WTF::TextStream& operator<<(WTF::TextStream&, const LocalFrame&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::LocalFrame)
static bool isType(const WebCore::Frame& frame) { return frame.frameType() == WebCore::Frame::FrameType::Local; }
SPECIALIZE_TYPE_TRAITS_END()
