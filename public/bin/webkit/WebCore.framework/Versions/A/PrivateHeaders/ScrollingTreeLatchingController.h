/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

#if ENABLE(ASYNC_SCROLLING)

#include "ScrollTypes.h"
#include <wtf/Lock.h>
#include <wtf/Markable.h>
#include <wtf/MonotonicTime.h>
#include <wtf/OptionSet.h>

namespace WebCore {

class PlatformWheelEvent;
enum class WheelEventProcessingSteps : uint8_t;

class ScrollingTreeLatchingController {
public:
    struct ScrollingNodeAndProcessingSteps {
        ScrollingNodeID scrollingNodeID;
        OptionSet<WheelEventProcessingSteps> processingSteps;
    };

    ScrollingTreeLatchingController();

    void receivedWheelEvent(const PlatformWheelEvent&, OptionSet<WheelEventProcessingSteps>, bool allowLatching);

    std::optional<ScrollingNodeAndProcessingSteps> latchingDataForEvent(const PlatformWheelEvent&, bool allowLatching) const;
    void nodeDidHandleEvent(ScrollingNodeID, OptionSet<WheelEventProcessingSteps>, const PlatformWheelEvent&, bool allowLatching);

    std::optional<ScrollingNodeID> latchedNodeID() const;
    std::optional<ScrollingNodeAndProcessingSteps> latchedNodeAndSteps() const;

    void nodeWasRemoved(ScrollingNodeID);
    void clearLatchedNode();

private:
    bool latchedNodeIsRelevant() const;

    mutable Lock m_latchedNodeLock;
    std::optional<ScrollingNodeAndProcessingSteps> m_latchedNodeAndSteps WTF_GUARDED_BY_LOCK(m_latchedNodeLock);
    std::optional<OptionSet<WheelEventProcessingSteps>> m_processingStepsForCurrentGesture;
    MonotonicTime m_lastLatchedNodeInterationTime;
};

}

#endif // ENABLE(ASYNC_SCROLLING)
