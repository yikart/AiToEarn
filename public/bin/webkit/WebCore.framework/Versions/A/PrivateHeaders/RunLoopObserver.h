/*
 * Copyright (C) 2011, 2014 Apple Inc. All rights reserved.
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

#include <wtf/Function.h>
#include <wtf/Noncopyable.h>
#include <wtf/OptionSet.h>
#include <wtf/RetainPtr.h>
#include <wtf/TZoneMalloc.h>

#if USE(CF)
using PlatformRunLoopObserver = struct __CFRunLoopObserver*;
using PlatformRunLoop = struct __CFRunLoop*;
#else
using PlatformRunLoopObserver = void*;
using PlatformRunLoop = void*;
#endif

namespace WebCore {

class RunLoopObserver {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(RunLoopObserver, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(RunLoopObserver);
public:
    using RunLoopObserverCallback = Function<void()>;

    enum class WellKnownOrder : uint8_t {
        GraphicsCommit,
        RenderingUpdate,
        ActivityStateChange,
        InspectorFrameBegin,
        InspectorFrameEnd,
        PostRenderingUpdate,
        DisplayRefreshMonitor,
    };

    enum class Activity : uint8_t {
        BeforeWaiting   = 1 << 0,
        Entry           = 1 << 1,
        Exit            = 1 << 2,
        AfterWaiting    = 1 << 3,
    };

    enum class Type : bool { Repeating, OneShot };
    RunLoopObserver(WellKnownOrder order, RunLoopObserverCallback&& callback, Type type = Type::Repeating)
        : m_callback(WTFMove(callback))
        , m_type(type)
#if USE(CF)
        , m_order(order)
    { }
#else
    {
        UNUSED_PARAM(order);
    }
#endif

    WEBCORE_EXPORT ~RunLoopObserver();

    static constexpr OptionSet defaultActivities = { Activity::BeforeWaiting, Activity::Exit };
    WEBCORE_EXPORT void schedule(PlatformRunLoop = nullptr, OptionSet<Activity> = defaultActivities);
    WEBCORE_EXPORT void invalidate();
    WEBCORE_EXPORT bool isScheduled() const;

    bool isRepeating() const { return m_type == Type::Repeating; }

#if USE(CF)
    static void runLoopObserverFired(PlatformRunLoopObserver, unsigned long, void*);
#endif

private:
    void runLoopObserverFired();

    RunLoopObserverCallback m_callback;
    Type m_type { Type::Repeating };
#if USE(CF)
    WellKnownOrder m_order { WellKnownOrder::GraphicsCommit };
    RetainPtr<PlatformRunLoopObserver> m_runLoopObserver;
#endif
};

} // namespace WebCore
