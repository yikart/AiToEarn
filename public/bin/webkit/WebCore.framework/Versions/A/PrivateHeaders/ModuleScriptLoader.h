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

#include "JSDOMPromiseDeferred.h"
#include "ModuleFetchParameters.h"
#include <JavaScriptCore/ScriptFetcher.h>
#include <wtf/RefCounted.h>

namespace WebCore {

class ModuleScriptLoaderClient;

class ModuleScriptLoader : public RefCounted<ModuleScriptLoader> {
public:
    virtual ~ModuleScriptLoader() = default;

    void clearClient()
    {
        ASSERT(m_client);
        m_client = nullptr;
    }

    JSC::ScriptFetcher& scriptFetcher() { return m_scriptFetcher.get(); }
    JSC::ScriptFetchParameters* parameters() { return m_parameters.get(); }

protected:
    ModuleScriptLoader(ModuleScriptLoaderClient& client, DeferredPromise& promise, JSC::ScriptFetcher& scriptFetcher, RefPtr<JSC::ScriptFetchParameters>&& parameters)
        : m_client(&client)
        , m_promise(&promise)
        , m_scriptFetcher(scriptFetcher)
        , m_parameters(WTFMove(parameters))
    {
    }

    ModuleScriptLoaderClient* m_client;
    RefPtr<DeferredPromise> m_promise;
    Ref<JSC::ScriptFetcher> m_scriptFetcher;
    RefPtr<JSC::ScriptFetchParameters> m_parameters;
};

} // namespace WebCore
