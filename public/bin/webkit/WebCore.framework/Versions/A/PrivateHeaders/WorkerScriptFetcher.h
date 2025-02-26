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

#include "FetchOptions.h"
#include "LoadableScript.h"
#include "LoadableScriptError.h"
#include "ModuleFetchParameters.h"
#include <JavaScriptCore/ScriptFetcher.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class CachedScript;
class Document;

class WorkerScriptFetcher final : public JSC::ScriptFetcher {
public:
    static Ref<WorkerScriptFetcher> create(Ref<ModuleFetchParameters>&& parameters, FetchOptions::Credentials credentials, FetchOptions::Destination destination, ReferrerPolicy referrerPolicy)
    {
        return adoptRef(*new WorkerScriptFetcher(WTFMove(parameters), credentials, destination, referrerPolicy));
    }

    FetchOptions::Credentials credentials() const { return m_credentials; }
    FetchOptions::Destination destination() const { return m_destination; }
    ReferrerPolicy referrerPolicy() const { return m_referrerPolicy; }

    void notifyLoadCompleted(UniquedStringImpl& moduleKey)
    {
        m_moduleKey = &moduleKey;
        m_isLoaded = true;
    }

    void notifyLoadFailed(LoadableScript::Error&& error)
    {
        m_error = WTFMove(error);
        m_isLoaded = true;
    }

    void notifyLoadWasCanceled()
    {
        m_wasCanceled = true;
        m_isLoaded = true;
    }

    bool isLoaded() const { return m_isLoaded; }
    std::optional<LoadableScript::Error> error() const { return m_error; }
    bool wasCanceled() const { return m_wasCanceled; }
    UniquedStringImpl* moduleKey() const { return m_moduleKey.get(); }
    ModuleFetchParameters& parameters() { return m_parameters.get(); }

    void setReferrerPolicy(ReferrerPolicy referrerPolicy)
    {
        m_referrerPolicy = referrerPolicy;
    }

protected:
    WorkerScriptFetcher(Ref<ModuleFetchParameters>&& parameters, FetchOptions::Credentials credentials, FetchOptions::Destination destination, ReferrerPolicy referrerPolicy)
        : m_credentials(credentials)
        , m_destination(destination)
        , m_referrerPolicy(referrerPolicy)
        , m_parameters(WTFMove(parameters))
    {
    }

private:
    FetchOptions::Credentials m_credentials;
    FetchOptions::Destination m_destination;
    ReferrerPolicy m_referrerPolicy { ReferrerPolicy::EmptyString };
    RefPtr<UniquedStringImpl> m_moduleKey;
    Ref<ModuleFetchParameters> m_parameters;
    std::optional<LoadableScript::Error> m_error;
    bool m_wasCanceled { false };
    bool m_isLoaded { false };
};

} // namespace WebCore
