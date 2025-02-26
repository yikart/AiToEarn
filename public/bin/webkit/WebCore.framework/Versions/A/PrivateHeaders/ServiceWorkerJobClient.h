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

#include "FetchOptions.h"
#include "ServiceWorkerTypes.h"

namespace WebCore {

class ContentSecurityPolicyResponseHeaders;
class Exception;
class ResourceError;
class ScriptBuffer;
class ScriptExecutionContext;
class ServiceWorkerJob;
struct CrossOriginEmbedderPolicy;
struct ServiceWorkerRegistrationData;
struct WorkerFetchResult;

class ServiceWorkerJobClient {
public:
    virtual ~ServiceWorkerJobClient() = default;

    virtual ScriptExecutionContext* context() = 0;
    virtual ServiceWorkerOrClientIdentifier contextIdentifier() = 0;

    virtual void jobFailedWithException(ServiceWorkerJob&, const Exception&) = 0;
    virtual void jobResolvedWithRegistration(ServiceWorkerJob&, ServiceWorkerRegistrationData&&, ShouldNotifyWhenResolved) = 0;
    virtual void jobResolvedWithUnregistrationResult(ServiceWorkerJob&, bool unregistrationResult) = 0;
    virtual void startScriptFetchForJob(ServiceWorkerJob&, FetchOptions::Cache) = 0;
    virtual void jobFinishedLoadingScript(ServiceWorkerJob&, WorkerFetchResult&&) = 0;
    virtual void jobFailedLoadingScript(ServiceWorkerJob&, const ResourceError&, Exception&&) = 0;
};

} // namespace WebCore
