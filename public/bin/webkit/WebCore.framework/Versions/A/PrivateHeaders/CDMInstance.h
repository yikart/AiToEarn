/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

#if ENABLE(ENCRYPTED_MEDIA)

#include "CDMKeyStatus.h"
#include "CDMMessageType.h"
#include "CDMSessionType.h"
#include <utility>
#include <wtf/AbstractRefCountedAndCanMakeWeakPtr.h>
#include <wtf/CompletionHandler.h>
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/TypeCasts.h>

#if !RELEASE_LOG_DISABLED
namespace WTF {
class Logger;
}
#endif

namespace WebCore {

class CDMInstanceSession;
struct CDMKeySystemConfiguration;
class SharedBuffer;

class CDMInstanceClient : public AbstractRefCountedAndCanMakeWeakPtr<CDMInstanceClient> {
public:
    virtual ~CDMInstanceClient() = default;

    virtual void unrequestedInitializationDataReceived(const String&, Ref<SharedBuffer>&&) = 0;

#if !RELEASE_LOG_DISABLED
    virtual const Logger& logger() const = 0;
    virtual uint64_t logIdentifier() const = 0;
#endif
};

// JavaScript's handle to a CDMInstance, must be used from the
// main-thread only!
class CDMInstance : public RefCounted<CDMInstance> {
public:
    virtual ~CDMInstance() = default;

    virtual void setClient(WeakPtr<CDMInstanceClient>&&) { }
    virtual void clearClient() { }

#if !RELEASE_LOG_DISABLED
    virtual void setLogIdentifier(uint64_t) { }
#endif

    enum class ImplementationType {
        Mock,
        ClearKey,
        FairPlayStreaming,
        Remote,
#if ENABLE(THUNDER)
        Thunder,
#endif
    };
    virtual ImplementationType implementationType() const = 0;

    enum SuccessValue : bool {
        Failed,
        Succeeded,
    };
    using SuccessCallback = CompletionHandler<void(SuccessValue)>;

    enum class AllowDistinctiveIdentifiers : bool {
        No,
        Yes,
    };

    enum class AllowPersistentState : bool {
        No,
        Yes,
    };

    virtual void initializeWithConfiguration(const CDMKeySystemConfiguration&, AllowDistinctiveIdentifiers, AllowPersistentState, SuccessCallback&&) = 0;
    virtual void setServerCertificate(Ref<SharedBuffer>&&, SuccessCallback&&) = 0;
    virtual void setStorageDirectory(const String&) = 0;
    virtual const String& keySystem() const = 0;
    virtual RefPtr<CDMInstanceSession> createSession() = 0;

    enum class HDCPStatus : uint8_t {
        Unknown,
        Valid,
        OutputRestricted,
        OutputDownscaled,
    };
    virtual SuccessValue setHDCPStatus(HDCPStatus) { return Failed; }
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CDM_INSTANCE(ToValueTypeName, ImplementationTypeName) \
SPECIALIZE_TYPE_TRAITS_BEGIN(ToValueTypeName) \
static bool isType(const WebCore::CDMInstance& instance) { return instance.implementationType() == ImplementationTypeName; } \
SPECIALIZE_TYPE_TRAITS_END()

#endif
