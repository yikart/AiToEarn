/*
 * Copyright (C) 2013 Apple Inc. All Rights Reserved.
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

#import <dispatch/dispatch.h>
#import <wtf/Lock.h>
#import <wtf/OSObjectPtr.h>
#import <wtf/ThreadSafeRefCounted.h>
#import <wtf/spi/darwin/XPCSPI.h>

OBJC_CLASS NSDictionary;
OBJC_CLASS NSString;

namespace Inspector {

class RemoteInspectorXPCConnection : public ThreadSafeRefCounted<RemoteInspectorXPCConnection> {
public:
    class Client {
    public:
        virtual ~Client() { }
        virtual void xpcConnectionReceivedMessage(RemoteInspectorXPCConnection*, NSString *messageName, NSDictionary *userInfo) = 0;
        virtual void xpcConnectionFailed(RemoteInspectorXPCConnection*) = 0;
        virtual void xpcConnectionUnhandledMessage(RemoteInspectorXPCConnection*, xpc_object_t) = 0;
    };

    RemoteInspectorXPCConnection(xpc_connection_t, dispatch_queue_t, Client*);
    virtual ~RemoteInspectorXPCConnection();

    void close();
    void closeFromMessage();
    void sendMessage(NSString *messageName, NSDictionary *userInfo);

private:
    NSDictionary *deserializeMessage(xpc_object_t);
    void handleEvent(xpc_object_t);
    void closeOnQueue();

    // We handle XPC events on the queue, but a client may call close() on any queue.
    // We make sure that m_client is thread safe and immediately cleared in close().
    Lock m_mutex;

    OSObjectPtr<xpc_connection_t> m_connection;
    OSObjectPtr<dispatch_queue_t> m_queue;
    Client* m_client;
    bool m_closed { false };
#if PLATFORM(MAC)
    bool m_validated { false };
#endif
};

} // namespace Inspector

#endif // ENABLE(REMOTE_INSPECTOR)
