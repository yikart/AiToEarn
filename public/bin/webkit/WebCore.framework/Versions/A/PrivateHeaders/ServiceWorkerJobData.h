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

#include "ScriptExecutionContextIdentifier.h"
#include "SecurityOriginData.h"
#include "ServiceWorkerJobDataIdentifier.h"
#include "ServiceWorkerJobType.h"
#include "ServiceWorkerRegistrationKey.h"
#include "ServiceWorkerRegistrationOptions.h"
#include "ServiceWorkerTypes.h"
#include <wtf/URL.h>

namespace WebCore {

struct ServiceWorkerJobData {
    using Identifier = ServiceWorkerJobDataIdentifier;
    ServiceWorkerJobData(SWServerConnectionIdentifier, const ServiceWorkerOrClientIdentifier& sourceContext);
    ServiceWorkerJobData(Identifier, const ServiceWorkerOrClientIdentifier& sourceContext);
    WEBCORE_EXPORT ServiceWorkerJobData(WebCore::ServiceWorkerJobDataIdentifier&&, URL&& scriptURL, URL&& clientCreationURL, WebCore::SecurityOriginData&& topOrigin, URL&& scopeURL, WebCore::ServiceWorkerOrClientIdentifier&& sourceContext, WebCore::WorkerType, WebCore::ServiceWorkerJobType, String&& domainForCachePartition, bool isFromServiceWorkerPage, std::optional<WebCore::ServiceWorkerRegistrationOptions>&&);

    SWServerConnectionIdentifier connectionIdentifier() const { return m_identifier.connectionIdentifier; }

    bool isEquivalent(const ServiceWorkerJobData&) const;
    std::optional<ScriptExecutionContextIdentifier> serviceWorkerPageIdentifier() const;

    URL scriptURL;
    URL clientCreationURL;
    SecurityOriginData topOrigin;
    URL scopeURL;
    ServiceWorkerOrClientIdentifier sourceContext;
    WorkerType workerType;
    ServiceWorkerJobType type;
    String domainForCachePartition;
    bool isFromServiceWorkerPage { false };

    std::optional<ServiceWorkerRegistrationOptions> registrationOptions;

    Identifier identifier() const { return m_identifier; }
    WEBCORE_EXPORT ServiceWorkerRegistrationKey registrationKey() const;
    ServiceWorkerJobData isolatedCopy() const;

private:
    Identifier m_identifier;
};

} // namespace WebCore
