/*
 * Copyright (C) 2011 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
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

#include "DocumentMarker.h"
#include <wtf/Markable.h>
#include <wtf/Vector.h>
#include <wtf/WallTime.h>

namespace WebCore {
class RenderedDocumentMarker;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::RenderedDocumentMarker> : std::true_type { };
}

namespace WebCore {

class RenderedDocumentMarker : public DocumentMarker {
public:
    explicit RenderedDocumentMarker(DocumentMarker&& marker)
        : DocumentMarker(WTFMove(marker))
    {
    }

    bool contains(const FloatPoint& point) const
    {
        ASSERT(m_isValid);
        for (const auto& rect : m_rects) {
            if (rect.contains(point))
                return true;
        }
        return false;
    }

    void setUnclippedAbsoluteRects(Vector<FloatRect>&& rects)
    {
        m_isValid = true;
        m_rects = WTFMove(rects);
    }

    const Vector<FloatRect, 1>& unclippedAbsoluteRects() const
    {
        ASSERT(m_isValid);
        return m_rects;
    }

    void invalidate()
    {
        m_isValid = false;
        m_rects.clear();
    }

    bool isValid() const { return m_isValid; }

    float opacity() const { return m_opacity; }
    void setOpacity(float opacity) { m_opacity = opacity; }

    bool isBeingDismissed() const { return m_isBeingDismissed; }

    void setBeingDismissed(bool beingDismissed)
    {
        if (m_isBeingDismissed == beingDismissed)
            return;

        m_isBeingDismissed = beingDismissed;
        if (m_isBeingDismissed)
            m_animationStartTime = WallTime::now();
        else
            m_animationStartTime.reset();
    }

    Markable<WallTime> animationStartTime() const { return m_animationStartTime; }

private:
    Vector<FloatRect, 1> m_rects;
    bool m_isValid { false };
    bool m_isBeingDismissed { false };

    float m_opacity { 1.0 };
    Markable<WallTime> m_animationStartTime;
};

} // namespace WebCore
