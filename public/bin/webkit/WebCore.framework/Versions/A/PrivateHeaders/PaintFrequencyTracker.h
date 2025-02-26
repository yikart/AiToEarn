/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

// This class is used to detect when we are painting frequently so that - even in a painting model
// without display lists - we can build and cache portions of display lists and reuse them only when
// animating. Once we transition fully to display lists, we can probably just pull from the previous
// paint's display list if it is still around and get rid of this code.
class PaintFrequencyTracker {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(PaintFrequencyTracker);

public:
    PaintFrequencyTracker() = default;

    void track(MonotonicTime timestamp)
    {
        static unsigned paintFrequencyPaintCountThreshold = 20;
        static Seconds paintFrequencySecondsIdleThreshold = 5_s;

        if (!timestamp)
            timestamp = MonotonicTime::now();

        // Start by assuming the paint frequency is low
        m_paintFrequency = PaintFrequency::Low;

        if (timestamp - m_lastPaintTime > paintFrequencySecondsIdleThreshold) {
            // It has been 5 seconds since last time we draw this renderer. Reset the state
            // of this object as if, we've just started tracking the paint frequency.
            m_totalPaints = 0;
        } else if (m_totalPaints >= paintFrequencyPaintCountThreshold) {
            // Change the paint frequency to be high if this renderer has been painted at least 20 times.
            m_paintFrequency = PaintFrequency::High;
        }

        m_lastPaintTime = timestamp;
        ++m_totalPaints;
    }

    bool paintingFrequently() const { return m_paintFrequency == PaintFrequency::High; }

private:
    MonotonicTime m_lastPaintTime;
    unsigned m_totalPaints { 0 };

    enum class PaintFrequency : bool { Low, High };
    PaintFrequency m_paintFrequency { PaintFrequency::Low };
};

} // namespace WebCore
