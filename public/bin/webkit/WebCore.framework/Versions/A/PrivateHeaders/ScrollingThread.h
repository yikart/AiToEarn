/*
 * Copyright (C) 2012, 2015 Apple Inc. All rights reserved.
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

#if ENABLE(SCROLLING_THREAD) || ENABLE(THREADED_ANIMATION_RESOLUTION)

#include <functional>
#include <wtf/Condition.h>
#include <wtf/Forward.h>
#include <wtf/Function.h>
#include <wtf/Lock.h>
#include <wtf/Noncopyable.h>
#include <wtf/RunLoop.h>
#include <wtf/Threading.h>
#include <wtf/Vector.h>

namespace WebCore {

class ScrollingThread {
    WTF_MAKE_NONCOPYABLE(ScrollingThread);

public:
    WEBCORE_EXPORT static bool isCurrentThread();
    WEBCORE_EXPORT static void dispatch(Function<void ()>&&);

    // Will dispatch the given function on the main thread once all pending functions
    // on the scrolling thread have finished executing. Used for synchronization purposes.
    WEBCORE_EXPORT static void dispatchBarrier(Function<void ()>&&);

private:
    friend LazyNeverDestroyed<ScrollingThread>;

    static ScrollingThread& singleton();

    ScrollingThread();

    RunLoop& runLoop() { return m_runLoop; }

    Ref<RunLoop> m_runLoop;
};

} // namespace WebCore

#endif // ENABLE(SCROLLING_THREAD) || ENABLE(THREADED_ANIMATION_RESOLUTION)
