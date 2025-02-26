/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(CONTENT_CHANGE_OBSERVER)

#include "CSSPropertyNames.h"
#include "Document.h"
#include "Element.h"
#include "PlatformEvent.h"
#include "RenderStyleConstants.h"
#include "Timer.h"
#include "WKContentObservation.h"
#include "WebAnimationTypes.h"
#include <wtf/CheckedRef.h>
#include <wtf/HashSet.h>
#include <wtf/Seconds.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class ContentChangeObserver;
}

namespace WebCore {

class Animation;
class DOMTimer;

class ContentChangeObserver : public CanMakeWeakPtr<ContentChangeObserver> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ContentChangeObserver, WEBCORE_EXPORT);
public:
    explicit ContentChangeObserver(Document&);

    WEBCORE_EXPORT void startContentObservationForDuration(Seconds duration);
    WEBCORE_EXPORT void stopContentObservation();
    WKContentChange observedContentChange() const { return m_observedContentState; }
    WEBCORE_EXPORT static bool isConsideredVisible(const Node&);
    static bool isVisuallyHidden(const Node&);

    void didInstallDOMTimer(const DOMTimer&, Seconds timeout, bool singleShot);
    void didRemoveDOMTimer(const DOMTimer&);

    void ref() const { m_document->ref(); }
    void deref() const { m_document->deref(); }

    void didAddTransition(const Element&, const Animation&);
    void didFinishTransition(const Element&, CSSPropertyID);
    void didRemoveTransition(const Element&, CSSPropertyID);

    WEBCORE_EXPORT static void didRecognizeLongPress(LocalFrame& mainFrame);
    WEBCORE_EXPORT static void didPreventDefaultForEvent(LocalFrame& mainFrame);
    WEBCORE_EXPORT static void didCancelPotentialTap(LocalFrame& mainFrame);

    void setClickTarget(Node& target) { m_clickTarget = target; }

    void didSuspendActiveDOMObjects();
    void willDetachPage();

    void rendererWillBeDestroyed(const Element&);
    void willNotProceedWithClick();

    void didAddMouseMoveRelatedEventListener(const AtomString& eventType, const Node&);
    void willNotProceedWithFixedObservationTimeWindow();

    void setHiddenTouchTarget(Element& targetElement) { m_hiddenTouchTargetElement = targetElement; }
    void resetHiddenTouchTarget() { m_hiddenTouchTargetElement = { }; }
    Element* hiddenTouchTarget() const { return m_hiddenTouchTargetElement.get(); }

    class StyleChangeScope {
    public:
        StyleChangeScope(Document&, const Element&);
        ~StyleChangeScope();

    private:
        ContentChangeObserver& m_contentChangeObserver;
        const Element& m_element;
        std::optional<bool> m_wasHidden;
        bool m_hadRenderer { false };
    };

    class TouchEventScope {
    public:
        WEBCORE_EXPORT TouchEventScope(Document&, PlatformEvent::Type);
        WEBCORE_EXPORT ~TouchEventScope();
    private:
        ContentChangeObserver& m_contentChangeObserver;
    };

    class MouseMovedScope {
    public:
        WEBCORE_EXPORT MouseMovedScope(Document&);
        WEBCORE_EXPORT ~MouseMovedScope();
    private:
        ContentChangeObserver& m_contentChangeObserver;
    };

    class StyleRecalcScope {
    public:
        StyleRecalcScope(Document&);
        ~StyleRecalcScope();
    private:
        ContentChangeObserver& m_contentChangeObserver;
    };

    class DOMTimerScope {
    public:
        DOMTimerScope(Document*, const DOMTimer&);
        ~DOMTimerScope();
    private:
        ContentChangeObserver* m_contentChangeObserver { nullptr };
        const DOMTimer& m_domTimer;
    };

private:
    void touchEventDidStart(PlatformEvent::Type);
    void touchEventDidFinish();

    void mouseMovedDidStart();
    void mouseMovedDidFinish();

    void didRecognizeLongPress();

    void elementDidBecomeVisible(const Element&);
    void elementDidBecomeHidden(const Element&);

    void setShouldObserveDOMTimerSchedulingAndTransitions(bool);
    bool isObservingDOMTimerScheduling() const { return m_isObservingDOMTimerScheduling; }
    bool isObservingTransitions() const { return m_isObservingTransitions; }
    void domTimerExecuteDidStart(const DOMTimer&);
    void domTimerExecuteDidFinish(const DOMTimer&);
    void registerDOMTimer(const DOMTimer&);
    void unregisterDOMTimer(const DOMTimer&);
    void clearObservedDOMTimers();
    void clearObservedTransitions() { m_elementsWithTransition.clear(); }
    bool containsObservedDOMTimer(const DOMTimer&) const;

    void styleRecalcDidStart();
    void styleRecalcDidFinish();
    void setShouldObserveNextStyleRecalc(bool);
    bool isWaitingForStyleRecalc() const { return m_isWaitingForStyleRecalc; }

    bool isObservingContentChanges() const;

    void stopObservingPendingActivities();
    void reset();

    void setHasNoChangeState() { m_observedContentState = WKContentNoChange; }
    void setHasIndeterminateState() { m_observedContentState = WKContentIndeterminateChange; }
    void setHasVisibleChangeState() { m_observedContentState = WKContentVisibilityChange; } 

    bool hasVisibleChangeState() const { return observedContentChange() == WKContentVisibilityChange; }
    bool hasObservedDOMTimer() const;
    bool hasObservedTransition() const { return !m_elementsWithTransition.isEmptyIgnoringNullReferences(); }

    void setIsBetweenTouchEndAndMouseMoved(bool isBetween) { m_isBetweenTouchEndAndMouseMoved = isBetween; }
    bool isBetweenTouchEndAndMouseMoved() const { return m_isBetweenTouchEndAndMouseMoved; }

    void setTouchEventIsBeingDispatched(bool dispatching) { m_touchEventIsBeingDispatched = dispatching; }
    bool isTouchEventBeingDispatched() const { return m_touchEventIsBeingDispatched; }

    void setMouseMovedEventIsBeingDispatched(bool dispatching) { m_mouseMovedEventIsBeingDispatched = dispatching; }
    bool isMouseMovedEventBeingDispatched() const { return m_mouseMovedEventIsBeingDispatched; }

    bool hasPendingActivity() const { return hasObservedDOMTimer() || hasObservedTransition() || m_isWaitingForStyleRecalc || isObservationTimeWindowActive(); }
    bool isObservationTimeWindowActive() const { return m_contentObservationTimer.isActive(); }

    void completeDurationBasedContentObservation();

    bool visibleRendererWasDestroyed(const Element& element) const { return m_elementsWithDestroyedVisibleRenderer.contains(element); }
    bool shouldObserveVisibilityChangeForElement(const Element&);

    enum class ElementHadRenderer : bool { No, Yes };
    bool isConsideredActionableContent(const Element&, ElementHadRenderer) const;
    
    bool isContentChangeObserverEnabled();

    enum class Event : uint8_t {
        StartedTouchStartEventDispatching,
        EndedTouchStartEventDispatching,
        WillNotProceedWithClick,
        StartedMouseMovedEventDispatching,
        EndedMouseMovedEventDispatching,
        InstalledDOMTimer,
        RemovedDOMTimer,
        StartedDOMTimerExecution,
        EndedDOMTimerExecution,
        StartedStyleRecalc,
        EndedStyleRecalc,
        AddedTransition,
        EndedTransitionButFinalStyleIsNotDefiniteYet,
        CompletedTransition,
        CanceledTransition,
        StartedFixedObservationTimeWindow,
        EndedFixedObservationTimeWindow,
        WillNotProceedWithFixedObservationTimeWindow,
        ElementDidBecomeVisible,
        DidAddMouseoutListenerAboveClickTarget,
    };
    void adjustObservedState(Event);

    CheckedRef<Document> m_document;
    Timer m_contentObservationTimer;
    WeakHashSet<const DOMTimer> m_DOMTimerList;
    WeakHashSet<const Element, WeakPtrImplWithEventTargetData> m_elementsWithTransition;
    WeakHashSet<const Element, WeakPtrImplWithEventTargetData> m_elementsWithDestroyedVisibleRenderer;
    WKContentChange m_observedContentState { WKContentNoChange };
    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_hiddenTouchTargetElement;
    WeakPtr<Node, WeakPtrImplWithEventTargetData> m_clickTarget;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_visibilityCandidateList;
    bool m_touchEventIsBeingDispatched { false };
    bool m_isWaitingForStyleRecalc { false };
    bool m_isInObservedStyleRecalc { false };
    bool m_isObservingDOMTimerScheduling { false };
    bool m_observedDomTimerIsBeingExecuted { false };
    bool m_mouseMovedEventIsBeingDispatched { false };
    bool m_isBetweenTouchEndAndMouseMoved { false };
    bool m_isObservingTransitions { false };
};

inline bool ContentChangeObserver::isObservingContentChanges() const
{
    return isTouchEventBeingDispatched()
        || isBetweenTouchEndAndMouseMoved()
        || isMouseMovedEventBeingDispatched()
        || m_observedDomTimerIsBeingExecuted
        || m_isInObservedStyleRecalc
        || isObservationTimeWindowActive();
}

inline void ContentChangeObserver::setShouldObserveDOMTimerSchedulingAndTransitions(bool observe)
{
    m_isObservingDOMTimerScheduling = observe;
    m_isObservingTransitions = observe;
}

}
#endif // ENABLE(CONTENT_CHANGE_OBSERVER)
