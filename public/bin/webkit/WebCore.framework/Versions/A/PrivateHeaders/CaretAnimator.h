/*
 * Copyright (C) 2004-2022 Apple Inc. All rights reserved.
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

#include "Document.h"
#include "LayoutRect.h"
#include "RenderTheme.h"
#include "Timer.h"
#include <wtf/CheckedPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class CaretAnimator;
class Color;
class Document;
class FloatRect;
class GraphicsContext;
class Node;
class Page;
class VisibleSelection;

enum class CaretAnimatorType : uint8_t {
    Default,
    Dictation
};

enum class CaretAnimatorStopReason : uint8_t {
    Default,
    CaretRectChanged,
};

#if HAVE(REDESIGNED_TEXT_CURSOR)

struct KeyFrame {
    Seconds time;
    float value;
};

#endif

class CaretAnimationClient {
public:
    virtual ~CaretAnimationClient() = default;

    virtual void caretAnimationDidUpdate(CaretAnimator&) { }
    virtual LayoutRect localCaretRect() const = 0;

    virtual Document* document() = 0;

    virtual Node* caretNode() = 0;
};

class CaretAnimator : public CanMakeCheckedPtr<CaretAnimator> {
    WTF_MAKE_TZONE_ALLOCATED(CaretAnimator);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(CaretAnimator);
public:
    struct PresentationProperties {
        enum class BlinkState : bool { 
            Off, On
        };

        BlinkState blinkState { BlinkState::On };
        float opacity { 1.0 };
    };

    virtual ~CaretAnimator() = default;

    virtual void start() = 0;

    virtual void stop(CaretAnimatorStopReason = CaretAnimatorStopReason::Default);

    bool isActive() const { return m_isActive; }

    void serviceCaretAnimation();

    virtual String debugDescription() const = 0;

    virtual void setBlinkingSuspended(bool suspended) { m_isBlinkingSuspended = suspended; }
    bool isBlinkingSuspended() const;

#if ENABLE(ACCESSIBILITY_NON_BLINKING_CURSOR)
    void setPrefersNonBlinkingCursor(bool enabled) { m_prefersNonBlinkingCursor = enabled; }
    bool prefersNonBlinkingCursor() const { return m_prefersNonBlinkingCursor; }
#endif

    virtual void setVisible(bool) = 0;

    PresentationProperties presentationProperties() const { return m_presentationProperties; }

    virtual void paint(GraphicsContext&, const FloatRect&, const Color&, const LayoutPoint&) const;
    virtual LayoutRect caretRepaintRectForLocalRect(LayoutRect) const;

protected:
    explicit CaretAnimator(CaretAnimationClient& client)
        : m_client(client)
        , m_blinkTimer(*this, &CaretAnimator::scheduleAnimation)
    {
#if ENABLE(ACCESSIBILITY_NON_BLINKING_CURSOR)
        m_prefersNonBlinkingCursor = page() && page()->prefersNonBlinkingCursor();
#endif
    }

    virtual void updateAnimationProperties() = 0;

    void didStart(MonotonicTime currentTime, std::optional<Seconds> interval)
    {
        m_startTime = currentTime;
        m_isActive = true;
        setBlinkingSuspended(!interval);
        if (interval)
            m_blinkTimer.startOneShot(*interval);
    }

    void didEnd()
    {
        m_isActive = false;
        m_blinkTimer.stop();
    }

    Page* page() const;

    CaretAnimationClient& m_client;
    MonotonicTime m_startTime;
    Timer m_blinkTimer;
    PresentationProperties m_presentationProperties { };

private:
    void scheduleAnimation();

    bool m_isActive { false };
    bool m_isBlinkingSuspended { false };
#if ENABLE(ACCESSIBILITY_NON_BLINKING_CURSOR)
    bool m_prefersNonBlinkingCursor { false };
#endif
};

static inline CaretAnimator::PresentationProperties::BlinkState operator!(CaretAnimator::PresentationProperties::BlinkState blinkState)
{
    using BlinkState = CaretAnimator::PresentationProperties::BlinkState;
    return blinkState == BlinkState::Off ? BlinkState::On : BlinkState::Off;
}

} // namespace WebCore
