/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "BackgroundFetchRecordLoader.h"
#include "ProcessIdentifier.h"
#include "ScriptExecutionContextIdentifier.h"
#include <wtf/CompletionHandler.h>
#include <wtf/HashSet.h>
#include <wtf/WeakPtr.h>

namespace WebCore {
class SWServerDelegate;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::SWServerDelegate> : std::true_type { };
}

namespace WebCore {

class BackgroundFetchEngine;
class BackgroundFetchRecordLoader;
class BackgroundFetchStore;
class RegistrableDomain;
class ResourceRequest;
class SWRegistrationStore;
class SWServer;
class Site;

struct BackgroundFetchRequest;
struct ServiceWorkerJobData;
struct WorkerFetchResult;

class SWServerDelegate : public CanMakeWeakPtr<SWServerDelegate> {
public:
    virtual ~SWServerDelegate() = default;

    virtual void softUpdate(ServiceWorkerJobData&&, bool shouldRefreshCache, ResourceRequest&&, CompletionHandler<void(WorkerFetchResult&&)>&&) = 0;
    virtual void createContextConnection(const Site&, std::optional<ProcessIdentifier>, std::optional<ScriptExecutionContextIdentifier>, CompletionHandler<void()>&&) = 0;
    virtual void appBoundDomains(CompletionHandler<void(HashSet<RegistrableDomain>&&)>&&) = 0;
    virtual void addAllowedFirstPartyForCookies(ProcessIdentifier, std::optional<ProcessIdentifier>, RegistrableDomain&&) = 0;

    virtual void requestBackgroundFetchPermission(const ClientOrigin&, CompletionHandler<void(bool)>&&) = 0;
    virtual RefPtr<BackgroundFetchRecordLoader> createBackgroundFetchRecordLoader(BackgroundFetchRecordLoaderClient&, const BackgroundFetchRequest&, size_t responseDataSize, const WebCore::ClientOrigin&) = 0;
    virtual Ref<BackgroundFetchStore> createBackgroundFetchStore() = 0;
    virtual RefPtr<SWRegistrationStore> createRegistrationStore(SWServer&) = 0;
};

} // namespace WebCore
