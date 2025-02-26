/*
 * Copyright (C) 2021, Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1.  Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
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

#include "ClientOrigin.h"
#include "ProcessIdentifier.h"
#include "ScriptExecutionContextIdentifier.h"
#include "WebLockIdentifier.h"
#include "WebLockMode.h"
#include <pal/SessionID.h>
#include <wtf/Deque.h>
#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class Exception;
struct WebLockManagerSnapshot;

class WebLockRegistry : public RefCounted<WebLockRegistry> {
public:
    static WebLockRegistry& shared();
    WEBCORE_EXPORT static void setSharedRegistry(Ref<WebLockRegistry>&&);

    virtual ~WebLockRegistry() { }

    virtual void requestLock(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name, WebLockMode, bool steal, bool ifAvailable, Function<void(bool)>&& grantedHandler, Function<void()>&& lockStolenHandler) = 0;
    virtual void releaseLock(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name) = 0;
    virtual void abortLockRequest(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name, CompletionHandler<void(bool)>&&) = 0;
    virtual void snapshot(PAL::SessionID, const ClientOrigin&, CompletionHandler<void(WebLockManagerSnapshot&&)>&&) = 0;
    virtual void clientIsGoingAway(PAL::SessionID, const ClientOrigin&, ScriptExecutionContextIdentifier) = 0;

protected:
    WebLockRegistry() = default;
};

class LocalWebLockRegistry final : public WebLockRegistry, public CanMakeWeakPtr<LocalWebLockRegistry> {
public:
    static Ref<LocalWebLockRegistry> create() { return adoptRef(*new LocalWebLockRegistry); }
    ~LocalWebLockRegistry();

    WEBCORE_EXPORT void requestLock(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name, WebLockMode, bool steal, bool ifAvailable, Function<void(bool)>&& grantedHandler, Function<void()>&& lockStolenHandler) final;
    WEBCORE_EXPORT void releaseLock(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name) final;
    WEBCORE_EXPORT void abortLockRequest(PAL::SessionID, const ClientOrigin&, WebLockIdentifier, ScriptExecutionContextIdentifier, const String& name, CompletionHandler<void(bool)>&&) final;
    WEBCORE_EXPORT void snapshot(PAL::SessionID, const ClientOrigin&, CompletionHandler<void(WebLockManagerSnapshot&&)>&&) final;
    WEBCORE_EXPORT void clientIsGoingAway(PAL::SessionID, const ClientOrigin&, ScriptExecutionContextIdentifier) final;
    WEBCORE_EXPORT void clientsAreGoingAway(ProcessIdentifier);

private:
    WEBCORE_EXPORT LocalWebLockRegistry();

    class PerOriginRegistry;
    Ref<PerOriginRegistry> ensureRegistryForOrigin(PAL::SessionID, const ClientOrigin&);
    RefPtr<PerOriginRegistry> existingRegistryForOrigin(PAL::SessionID, const ClientOrigin&) const;

    HashMap<std::pair<PAL::SessionID, ClientOrigin>, WeakPtr<PerOriginRegistry>> m_perOriginRegistries;
};

} // namespace WebCore
