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

#if ENABLE(ROUTING_ARBITRATION) && HAVE(AVAUDIO_ROUTING_ARBITER)

#include "AudioSession.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace WebCore {
class SharedRoutingArbitratorToken;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::SharedRoutingArbitratorToken> : std::true_type { };
}

namespace WTF {
class Logger;
}

namespace WebCore {

class WEBCORE_EXPORT SharedRoutingArbitratorToken : public CanMakeWeakPtr<SharedRoutingArbitratorToken> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SharedRoutingArbitratorToken, WEBCORE_EXPORT);
public:
    static UniqueRef<SharedRoutingArbitratorToken> create();
    uint64_t logIdentifier() const;
private:
    friend UniqueRef<SharedRoutingArbitratorToken> WTF::makeUniqueRefWithoutFastMallocCheck<SharedRoutingArbitratorToken>();
    SharedRoutingArbitratorToken() = default;
    mutable uint64_t m_logIdentifier { 0 };
};

class WEBCORE_EXPORT SharedRoutingArbitrator {
public:
    static SharedRoutingArbitrator& sharedInstance();

    using RoutingArbitrationError = AudioSessionRoutingArbitrationClient::RoutingArbitrationError;
    using DefaultRouteChanged = AudioSessionRoutingArbitrationClient::DefaultRouteChanged;
    using ArbitrationCallback = AudioSessionRoutingArbitrationClient::ArbitrationCallback;

    bool isInRoutingArbitrationForToken(const SharedRoutingArbitratorToken&);
    void beginRoutingArbitrationForToken(const SharedRoutingArbitratorToken&, AudioSession::CategoryType, ArbitrationCallback&&);
    void endRoutingArbitrationForToken(const SharedRoutingArbitratorToken&);

    void setLogger(const Logger&);

private:
    const Logger& logger();
    ASCIILiteral logClassName() const { return "SharedRoutingArbitrator"_s; }
    WTFLogChannel& logChannel() const;

    std::optional<AudioSession::CategoryType> m_currentCategory { AudioSession::CategoryType::None };
    WeakHashSet<SharedRoutingArbitratorToken> m_tokens;
    Vector<ArbitrationCallback> m_enqueuedCallbacks;
    RefPtr<const Logger> m_logger;
    bool m_setupArbitrationOngoing { false };
};

}

#endif
