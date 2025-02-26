/*
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

#include "FloatSize.h"
#include "ScrollTypes.h"
#include <wtf/Deque.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class PlatformWheelEvent;

class WheelEventDeltaFilter {
public:
    WheelEventDeltaFilter();
    virtual ~WheelEventDeltaFilter();

    WEBCORE_EXPORT static std::unique_ptr<WheelEventDeltaFilter> create();

    WEBCORE_EXPORT virtual void updateFromEvent(const PlatformWheelEvent&) = 0;

    WEBCORE_EXPORT PlatformWheelEvent eventCopyWithFilteredDeltas(const PlatformWheelEvent&) const;
    WEBCORE_EXPORT PlatformWheelEvent eventCopyWithVelocity(const PlatformWheelEvent&) const;

    WEBCORE_EXPORT FloatSize filteredVelocity() const;
    WEBCORE_EXPORT FloatSize filteredDelta() const;

    WEBCORE_EXPORT static bool shouldApplyFilteringForEvent(const PlatformWheelEvent&);
    WEBCORE_EXPORT static bool shouldIncludeVelocityForEvent(const PlatformWheelEvent&);

protected:
    FloatSize m_currentFilteredDelta;
    FloatSize m_currentFilteredVelocity;
};

class BasicWheelEventDeltaFilter final : public WheelEventDeltaFilter {
    WTF_MAKE_TZONE_ALLOCATED(BasicWheelEventDeltaFilter);
public:
    BasicWheelEventDeltaFilter();
    void updateFromEvent(const PlatformWheelEvent&) final;

private:
    std::optional<ScrollEventAxis> dominantAxis() const;

    void reset();
    void updateWithDelta(FloatSize);

    Deque<FloatSize> m_recentWheelEventDeltas;
};

} // namespace WebCore
