/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "EventTarget.h"
#include "ExceptionOr.h"
#include "PlatformMouseEvent.h"
#include "PointerID.h"
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class Document;
class Element;
class EventTarget;
class IntPoint;
class MouseEvent;
class Page;
class PlatformTouchEvent;
class PointerEvent;
class WindowProxy;

class PointerCaptureController {
    WTF_MAKE_NONCOPYABLE(PointerCaptureController);
    WTF_MAKE_TZONE_ALLOCATED(PointerCaptureController);
public:
    explicit PointerCaptureController(Page&);

    Element* pointerCaptureElement(Document*, PointerID) const;
    ExceptionOr<void> setPointerCapture(Element*, PointerID);
    ExceptionOr<void> releasePointerCapture(Element*, PointerID);
    bool hasPointerCapture(Element*, PointerID);
    void reset();

    void pointerLockWasApplied();
    void elementWasRemoved(Element&);

    RefPtr<PointerEvent> pointerEventForMouseEvent(const MouseEvent&, PointerID, const String& pointerType);

#if ENABLE(TOUCH_EVENTS)
    void dispatchEventForTouchAtIndex(EventTarget&, const PlatformTouchEvent&, unsigned, bool isPrimary, WindowProxy&, const IntPoint&);
#endif

    WEBCORE_EXPORT void touchWithIdentifierWasRemoved(PointerID);
    bool hasCancelledPointerEventForIdentifier(PointerID) const;
    bool preventsCompatibilityMouseEventsForIdentifier(PointerID) const;
    void dispatchEvent(PointerEvent&, EventTarget*);
    WEBCORE_EXPORT void cancelPointer(PointerID, const IntPoint&, PointerEvent* existingCancelEvent = nullptr);
    void processPendingPointerCapture(PointerID);

private:
    struct CapturingData : public RefCounted<CapturingData> {
        static Ref<CapturingData> create(const String& pointerType)
        {
            return adoptRef(*new CapturingData(pointerType));
        }

        WeakPtr<Document, WeakPtrImplWithEventTargetData> activeDocument;
        RefPtr<Element> pendingTargetOverride;
        RefPtr<Element> targetOverride;
#if ENABLE(TOUCH_EVENTS)
        RefPtr<Element> previousTarget;
#endif
        bool hasAnyElement() const {
            return pendingTargetOverride || targetOverride
#if ENABLE(TOUCH_EVENTS)
                || previousTarget
#endif
                ;
        }
        String pointerType;
        enum class State : uint8_t {
            Ready,
            Finished,
            Cancelled,
        };
        State state { State::Ready };
        bool isPrimary { false };
        bool preventsCompatibilityMouseEvents { false };
        bool pointerIsPressed { false };
        MouseButton previousMouseButton { MouseButton::PointerHasNotChanged };

    private:
        CapturingData(const String& pointerType)
            : pointerType(pointerType)
        { }
    };

    Ref<CapturingData> ensureCapturingDataForPointerEvent(const PointerEvent&);
    void pointerEventWillBeDispatched(const PointerEvent&, EventTarget*);
    void pointerEventWasDispatched(const PointerEvent&);

    void updateHaveAnyCapturingElement();
    void elementWasRemovedSlow(Element&);

    void dispatchOverOrOutEvent(const AtomString&, EventTarget*, const PlatformTouchEvent&, unsigned index, bool isPrimary, WindowProxy&, IntPoint);
    void dispatchEnterOrLeaveEvent(const AtomString&, Element&, const PlatformTouchEvent&, unsigned index, bool isPrimary, WindowProxy&, IntPoint);

    WeakPtr<Page> m_page;
    // While PointerID is defined as int32_t, we use int64_t here so that we may use a value outside of the int32_t range to have safe
    // empty and removed values, allowing any int32_t to be provided through the API for lookup in this hashmap.
    using PointerIdToCapturingDataMap = UncheckedKeyHashMap<int64_t, Ref<CapturingData>, IntHash<int64_t>, WTF::SignedWithZeroKeyHashTraits<int64_t>>;
    PointerIdToCapturingDataMap m_activePointerIdsToCapturingData;
    bool m_processingPendingPointerCapture { false };
    bool m_haveAnyCapturingElement { false };
};

inline void PointerCaptureController::elementWasRemoved(Element& element)
{
    if (m_haveAnyCapturingElement)
        elementWasRemovedSlow(element);
}

} // namespace WebCore
