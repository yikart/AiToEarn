/*
 * Copyright (C) 2016 Igalia S.L.
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "FloatPoint.h"
#include "ScrollTypes.h"
#include <wtf/MonotonicTime.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FloatPoint;
class ScrollAnimation;
struct ScrollExtents;

class ScrollAnimationClient {
public:
    virtual ~ScrollAnimationClient() = default;

    virtual void scrollAnimationDidUpdate(ScrollAnimation&, const FloatPoint& /* currentOffset */) { }
    virtual void scrollAnimationWillStart(ScrollAnimation&) { }
    virtual void scrollAnimationDidEnd(ScrollAnimation&) { }
    virtual ScrollExtents scrollExtentsForAnimation(ScrollAnimation&) = 0;
    virtual FloatSize overscrollAmount(ScrollAnimation&) = 0;
    virtual FloatPoint scrollOffset(ScrollAnimation&) = 0;
};

class ScrollAnimation {
    WTF_MAKE_TZONE_ALLOCATED(ScrollAnimation);
public:
    enum class Type {
        Smooth,
        Kinetic,
        Momentum,
        RubberBand,
        Keyboard,
    };

    ScrollAnimation(Type animationType, ScrollAnimationClient& client)
        : m_client(client)
        , m_animationType(animationType)
    { }
    virtual ~ScrollAnimation() = default;
    
    Type type() const { return m_animationType; }

    virtual ScrollClamping clamping() const { return ScrollClamping::Clamped; }

    virtual bool retargetActiveAnimation(const FloatPoint& newDestinationOffset) = 0;
    virtual void stop()
    {
        if (!m_isActive)
            return;
        didEnd();
    }
    virtual bool isActive() const { return m_isActive; }
    virtual void updateScrollExtents() { };
    
    FloatPoint currentOffset() const { return m_currentOffset; }
    virtual std::optional<FloatPoint> destinationOffset() const { return std::nullopt; }

    virtual void serviceAnimation(MonotonicTime) = 0;

    virtual String debugDescription() const = 0;

protected:
    void didStart(MonotonicTime currentTime)
    {
        m_startTime = currentTime;
        m_isActive = true;
        m_client.scrollAnimationWillStart(*this);
    }
    
    void didEnd()
    {
        m_isActive = false;
        m_client.scrollAnimationDidEnd(*this);
    }
    
    Seconds timeSinceStart(MonotonicTime currentTime) const
    {
        return currentTime - m_startTime;
    }

    ScrollAnimationClient& m_client;
    const Type m_animationType;
    bool m_isActive { false };
    MonotonicTime m_startTime;
    FloatPoint m_currentOffset;
};

WTF::TextStream& operator<<(WTF::TextStream&, ScrollAnimation::Type);
WTF::TextStream& operator<<(WTF::TextStream&, const ScrollAnimation&);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_SCROLL_ANIMATION(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
    static bool isType(const WebCore::ScrollAnimation& scrollAnimation) { return scrollAnimation.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
