/*
 * Copyright (C) 2013, 2015 Apple Inc. All Rights Reserved.
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

#if ENABLE(REMOTE_INSPECTOR)

#include "InspectorFrontendChannel.h"
#include "RemoteControllableTarget.h"
#include <wtf/Lock.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/ThreadSafeWeakPtr.h>

#if PLATFORM(COCOA)
#include <wtf/Function.h>
#include <wtf/RetainPtr.h>

OBJC_CLASS NSString;
#endif

namespace Inspector {

class RemoteControllableTarget;

#if PLATFORM(COCOA)
typedef Vector<Function<void ()>> RemoteTargetQueue;
#endif

class RemoteConnectionToTarget final : public ThreadSafeRefCounted<RemoteConnectionToTarget>, public FrontendChannel {
public:
#if PLATFORM(COCOA)
    RemoteConnectionToTarget(RemoteControllableTarget*, NSString* connectionIdentifier, NSString* destination);
#else
    RemoteConnectionToTarget(RemoteControllableTarget&);
#endif
    ~RemoteConnectionToTarget() final;

    // Main API.
    bool setup(bool isAutomaticInspection = false, bool automaticallyPause = false);
#if PLATFORM(COCOA)
    void sendMessageToTarget(NSString *);
#else
    void sendMessageToTarget(String&&);
#endif
    void close();
    void targetClosed();

    std::optional<TargetID> targetIdentifier() const WTF_REQUIRES_LOCK(m_targetMutex);
#if PLATFORM(COCOA)
    NSString *connectionIdentifier() const;
    NSString *destination() const;

    Lock& queueMutex() { return m_queueMutex; }
    const RemoteTargetQueue& queue() const { return m_queue; }
    RemoteTargetQueue takeQueue();
#endif

    // FrontendChannel overrides.
    ConnectionType connectionType() const final { return ConnectionType::Remote; }
    void sendMessageToFrontend(const String&) final;

private:
#if PLATFORM(COCOA)
    void dispatchAsyncOnTarget(Function<void ()>&&);

    void setupRunLoop();
    void teardownRunLoop();
    void queueTaskOnPrivateRunLoop(Function<void ()>&&);
#endif

    // This connection from the RemoteInspector singleton to the InspectionTarget
    // can be used on multiple threads. So any access to the target
    // itself must take this mutex to ensure m_target is valid.
    mutable Lock m_targetMutex;

#if PLATFORM(COCOA)
    // If a target has a specific run loop it wants to evaluate on
    // we setup our run loop sources on that specific run loop.
    RetainPtr<CFRunLoopRef> m_runLoop;
    RetainPtr<CFRunLoopSourceRef> m_runLoopSource;
    RemoteTargetQueue m_queue;
    Lock m_queueMutex;
#endif

    ThreadSafeWeakPtr<RemoteControllableTarget> m_target WTF_GUARDED_BY_LOCK(m_targetMutex);
    bool m_connected { false };

#if PLATFORM(COCOA)
    RetainPtr<NSString> m_connectionIdentifier;
    RetainPtr<NSString> m_destination;
#endif
};

} // namespace Inspector

#endif // ENABLE(REMOTE_INSPECTOR)
