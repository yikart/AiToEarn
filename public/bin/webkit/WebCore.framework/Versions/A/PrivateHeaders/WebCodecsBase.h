/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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

#if ENABLE(WEB_CODECS)

#include "ActiveDOMObject.h"
#include "EventTarget.h"
#include "WebCodecsCodecState.h"
#include <wtf/Deque.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeWeakPtr.h>

namespace WebCore {

class WebCodecsControlMessage;

// WebCodecsBase implements the "Control Message Queue"
// as per https://w3c.github.io/webcodecs/#control-message-queue-slot
// And handle "Codec Saturation"
// as per https://w3c.github.io/webcodecs/#saturated
class WebCodecsBase
    : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<WebCodecsBase>
    , public ActiveDOMObject
    , public EventTarget {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(WebCodecsBase);
public:
    virtual ~WebCodecsBase();

    WebCodecsCodecState state() const { return m_state; }

    // ActiveDOMObject.
    void ref() const final { ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr::ref(); }
    void deref() const final { ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr::deref(); }
    bool virtualHasPendingActivity() const final;

protected:
    WebCodecsBase(ScriptExecutionContext&);
    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }

    void setState(WebCodecsCodecState state) { m_state = state; }

    size_t codecQueueSize() const { return m_codecControlMessagesPending; }
    void queueControlMessageAndProcess(WebCodecsControlMessage&&);
    void queueCodecControlMessageAndProcess(WebCodecsControlMessage&&);
    void processControlMessageQueue();
    void clearControlMessageQueue();
    void clearControlMessageQueueAndMaybeScheduleDequeueEvent();
    void blockControlMessageQueue();
    void unblockControlMessageQueue();

    virtual size_t maximumCodecOperationsEnqueued() const { return 1; }
    void incrementCodecOperationCount() { m_codecOperationsPending++; };
    void decrementCodecOperationCountAndMaybeProcessControlMessageQueue();

private:
    // EventTarget
    void refEventTarget() final { ref(); }
    void derefEventTarget() final { deref(); }

    // Equivalent to spec's "Increment [[encodeQueueSize]]." or "Increment [[decodeQueueSize]]"
    void incrementCodecQueueSize();
    // Equivalent to spec's "Decrement [[encodeQueueSize]] or "Decrement [[decodeQueueSize]]" and run the Schedule Dequeue Event algorithm"
    void decrementCodecQueueSizeAndScheduleDequeueEvent();
    bool isCodecSaturated() const { return m_codecOperationsPending >= maximumCodecOperationsEnqueued(); }
    void scheduleDequeueEvent();

    bool m_isMessageQueueBlocked { false };
    size_t m_codecControlMessagesPending { 0 };
    size_t m_codecOperationsPending { 0 };
    bool m_dequeueEventScheduled { false };
    Deque<WebCodecsControlMessage> m_controlMessageQueue;
    WebCodecsCodecState m_state { WebCodecsCodecState::Unconfigured };
};

} // namespace WebCore

#endif // ENABLE(WEB_CODECS)
