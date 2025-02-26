/*
 * Copyright (C) 2015, 2016 Apple Inc. All rights reserved.
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

#include "CachedResourceClient.h"
#include "CachedResourceHandle.h"
#include "CachedScriptFetcher.h"
#include "ModuleScriptLoader.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/URL.h>

namespace JSC {
class ScriptFetchParameters;
}
namespace WebCore {

class ModuleScriptLoaderClient;
class CachedScript;
class DeferredPromise;
class Document;
class JSDOMGlobalObject;

class CachedModuleScriptLoader final : public ModuleScriptLoader, private CachedResourceClient {
public:
    static Ref<CachedModuleScriptLoader> create(ModuleScriptLoaderClient&, DeferredPromise&, CachedScriptFetcher&, RefPtr<JSC::ScriptFetchParameters>&&);

    virtual ~CachedModuleScriptLoader();

    bool load(Document&, URL&& sourceURL);

    CachedScript* cachedScript() { return m_cachedScript.get(); }
    CachedScriptFetcher& scriptFetcher() { return static_cast<CachedScriptFetcher&>(ModuleScriptLoader::scriptFetcher()); }

private:
    CachedModuleScriptLoader(ModuleScriptLoaderClient&, DeferredPromise&, CachedScriptFetcher&, RefPtr<JSC::ScriptFetchParameters>&&);

    void notifyFinished(CachedResource&, const NetworkLoadMetrics&, LoadWillContinueInAnotherProcess) final;

    CachedResourceHandle<CachedScript> m_cachedScript;
    URL m_sourceURL;
};

} // namespace WebCore
