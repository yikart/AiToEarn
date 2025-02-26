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

#ifdef __cplusplus

#include <wtf/Seconds.h>
#include <wtf/text/ASCIILiteral.h>

namespace WebKit::WebPushD {

// If an origin processes more than this many silent pushes, then it will be unsubscribed from push.
constexpr unsigned maxSilentPushCount = 3;

// getPendingPushMessage starts a timer with this time interval after returning a push message to the client. If the timer expires, then we increment the subscription's silent push count.
static constexpr Seconds silentPushTimeoutForProduction { 30_s };
static constexpr Seconds silentPushTimeoutForTesting { 1_s };

constexpr auto protocolVersionKey = "protocol version"_s;
constexpr uint64_t protocolVersionValue = 5;
constexpr auto protocolEncodedMessageKey = "encoded message"_s;

// FIXME: ConnectionToMachService traits requires we have a message type, so keep this placeholder here
// until we can remove that requirement.
enum class MessageType : uint8_t {
    EchoTwice
};

static constexpr unsigned long pushActionSetting = 0x8054000;

#ifdef __OBJC__
inline NSString *pushActionVersionKey()
{
    return @"WebPushActionVersion";
}

inline NSNumber *currentPushActionVersion()
{
    return @1;
}

inline NSString *pushActionPartitionKey()
{
    return @"WebPushActionPartition";
}

inline NSString *pushActionTypeKey()
{
    return @"WebPushActionType";
}
#endif // __OBJC__

} // namespace WebKit::WebPushD

#endif // __cplusplus
