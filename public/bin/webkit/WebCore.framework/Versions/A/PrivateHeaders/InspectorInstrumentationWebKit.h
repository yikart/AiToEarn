/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "InspectorInstrumentationPublic.h"
#include "ResourceLoader.h"
#include <wtf/CompletionHandler.h>
#include <wtf/Function.h>

namespace WebCore {

class LocalFrame;
class Page;
class ResourceLoader;
class ResourceRequest;
class ResourceResponse;
class FragmentedSharedBuffer;

class WEBCORE_EXPORT InspectorInstrumentationWebKit {
public:
    static bool shouldInterceptRequest(const ResourceLoader&);
    static bool shouldInterceptResponse(const LocalFrame*, const ResourceResponse&);
    static void interceptRequest(ResourceLoader&, Function<void(const ResourceRequest&)>&&);
    static void interceptResponse(const LocalFrame*, const ResourceResponse&, ResourceLoaderIdentifier, CompletionHandler<void(const ResourceResponse&, RefPtr<FragmentedSharedBuffer>)>&&);
    static void setStoppingLoadingDueToProcessSwap(Page*, bool);

private:
    static bool shouldInterceptRequestInternal(const ResourceLoader&);
    static bool shouldInterceptResponseInternal(const LocalFrame&, const ResourceResponse&);
    static void interceptRequestInternal(ResourceLoader&, Function<void(const ResourceRequest&)>&&);
    static void interceptResponseInternal(const LocalFrame&, const ResourceResponse&, ResourceLoaderIdentifier, CompletionHandler<void(const ResourceResponse&, RefPtr<FragmentedSharedBuffer>)>&&);
    static void setStoppingLoadingDueToProcessSwapInternal(Page*, bool);
};

inline bool InspectorInstrumentationWebKit::shouldInterceptRequest(const ResourceLoader& loader)
{
    FAST_RETURN_IF_NO_FRONTENDS(false);
    return shouldInterceptRequestInternal(loader);
}

inline bool InspectorInstrumentationWebKit::shouldInterceptResponse(const LocalFrame* frame, const ResourceResponse& response)
{
    FAST_RETURN_IF_NO_FRONTENDS(false);
    if (!frame)
        return false;

    return shouldInterceptResponseInternal(*frame, response);
}

inline void InspectorInstrumentationWebKit::interceptRequest(ResourceLoader& loader, Function<void(const ResourceRequest&)>&& handler)
{
    ASSERT(InspectorInstrumentationWebKit::shouldInterceptRequest(loader));
    interceptRequestInternal(loader, WTFMove(handler));
}

inline void InspectorInstrumentationWebKit::interceptResponse(const LocalFrame* frame, const ResourceResponse& response, ResourceLoaderIdentifier identifier, CompletionHandler<void(const ResourceResponse&, RefPtr<FragmentedSharedBuffer>)>&& handler)
{
    ASSERT(InspectorInstrumentationWebKit::shouldInterceptResponse(frame, response));
    interceptResponseInternal(*frame, response, identifier, WTFMove(handler));
}

inline void InspectorInstrumentationWebKit::setStoppingLoadingDueToProcessSwap(Page* page, bool value)
{
    FAST_RETURN_IF_NO_FRONTENDS(void());
    setStoppingLoadingDueToProcessSwapInternal(page, value);
}

}
