/*
 * Copyright (C) 2011 Google Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
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

#include <wtf/Forward.h>
#include <wtf/ThreadSafeWeakPtr.h>

namespace WebCore {

class WebSocketChannelClient : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<WebSocketChannelClient, WTF::DestructionThread::Main> {
public:
    virtual ~WebSocketChannelClient() = default;
    virtual void didConnect() = 0;
    virtual void didReceiveMessage(String&&) = 0;
    virtual void didReceiveBinaryData(Vector<uint8_t>&&) = 0;
    virtual void didReceiveMessageError(String&&) = 0;
    virtual void didUpdateBufferedAmount(unsigned bufferedAmount) = 0;
    virtual void didStartClosingHandshake() = 0;
    enum ClosingHandshakeCompletionStatus {
        ClosingHandshakeIncomplete,
        ClosingHandshakeComplete
    };
    virtual void didClose(unsigned unhandledBufferedAmount, ClosingHandshakeCompletionStatus, unsigned short code, const String& reason) = 0;
    virtual void didUpgradeURL() = 0;

protected:
    WebSocketChannelClient() = default;
};

} // namespace WebCore
