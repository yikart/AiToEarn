/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#if ENABLE(WEB_RTC)

#include "RTCDataChannelHandler.h"
#include "RTCDataChannelIdentifier.h"
#include "RTCDataChannelState.h"
#include <wtf/Function.h>
#include <wtf/Lock.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class RTCDataChannelRemoteHandler;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::RTCDataChannelRemoteHandler> : std::true_type { };
}

namespace WebCore {

class RTCDataChannelHandlerClient;
class RTCDataChannelRemoteHandlerConnection;
class RTCError;
class FragmentedSharedBuffer;

class RTCDataChannelRemoteHandler final : public RTCDataChannelHandler, public CanMakeWeakPtr<RTCDataChannelRemoteHandler> {
    WTF_MAKE_TZONE_ALLOCATED(RTCDataChannelRemoteHandler);
public:
    static std::unique_ptr<RTCDataChannelRemoteHandler> create(RTCDataChannelIdentifier, RefPtr<RTCDataChannelRemoteHandlerConnection>&&);
    RTCDataChannelRemoteHandler(RTCDataChannelIdentifier, Ref<RTCDataChannelRemoteHandlerConnection>&&);
    ~RTCDataChannelRemoteHandler();

    WEBCORE_EXPORT void didChangeReadyState(RTCDataChannelState);
    WEBCORE_EXPORT void didReceiveStringData(String&&);
    WEBCORE_EXPORT void didReceiveRawData(std::span<const uint8_t>);
    WEBCORE_EXPORT void didDetectError(Ref<RTCError>&&);
    WEBCORE_EXPORT void bufferedAmountIsDecreasing(size_t);

    WEBCORE_EXPORT void readyToSend();

    void setLocalIdentifier(RTCDataChannelIdentifier localIdentifier) { m_localIdentifier = localIdentifier; }

private:
    // RTCDataChannelHandler
    void setClient(RTCDataChannelHandlerClient&, std::optional<ScriptExecutionContextIdentifier>) final;
    bool sendStringData(const CString&) final;
    bool sendRawData(std::span<const uint8_t>) final;
    void close() final;

    RTCDataChannelIdentifier m_remoteIdentifier;
    Markable<RTCDataChannelIdentifier> m_localIdentifier;

    RTCDataChannelHandlerClient* m_client { nullptr };
    Ref<RTCDataChannelRemoteHandlerConnection> m_connection;

    struct Message {
        bool isRaw { false };
        Ref<FragmentedSharedBuffer> buffer;
    };
    Vector<Message> m_pendingMessages;
    bool m_isPendingClose { false };
    bool m_isReadyToSend { false };

};

} // namespace WebCore

#endif // ENABLE(WEB_RTC)
