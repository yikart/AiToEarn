/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

#if ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)

#include "AsyncScrollingCoordinator.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ThreadedScrollingCoordinator : public AsyncScrollingCoordinator {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(ThreadedScrollingCoordinator, WEBCORE_EXPORT);
protected:
    explicit ThreadedScrollingCoordinator(Page*);
    virtual ~ThreadedScrollingCoordinator();

    void commitTreeStateIfNeeded() override;
    WEBCORE_EXPORT void hasNodeWithAnimatedScrollChanged(bool) override;
    WEBCORE_EXPORT void pageDestroyed() override;

private:
    WEBCORE_EXPORT void scheduleTreeStateCommit() final;
    WEBCORE_EXPORT void didScheduleRenderingUpdate() final;
    WEBCORE_EXPORT void willStartRenderingUpdate() final;
    WEBCORE_EXPORT void didCompleteRenderingUpdate() final;

    // Handle the wheel event on the scrolling thread. Returns whether the event was handled or not.
    WEBCORE_EXPORT WheelEventHandlingResult handleWheelEventForScrolling(const PlatformWheelEvent&, ScrollingNodeID, std::optional<WheelScrollGestureState>) final;
    WEBCORE_EXPORT void wheelEventWasProcessedByMainThread(const PlatformWheelEvent&, std::optional<WheelScrollGestureState>) final;

    WEBCORE_EXPORT void startMonitoringWheelEvents(bool clearLatchingState) final;
};

} // namespace WebCore

#endif // ENABLE(ASYNC_SCROLLING) && ENABLE(SCROLLING_THREAD)
