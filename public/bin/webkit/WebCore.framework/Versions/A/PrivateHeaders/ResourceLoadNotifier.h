/*
 * Copyright (C) 2006, 2007, 2008, 2009 Apple Inc. All rights reserved.
 * Copyright (C) 2008, 2009 Torch Mobile Inc. All rights reserved. (http://www.torchmobile.com/)
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "ResourceLoaderIdentifier.h"
#include <optional>
#include <wtf/Noncopyable.h>
#include <wtf/WeakRef.h>

namespace WebCore {

class AuthenticationChallenge;
class CachedResource;
class DocumentLoader;
class LocalFrame;
class NetworkLoadMetrics;
class ResourceError;
class ResourceLoader;
class ResourceRequest;
class ResourceResponse;
class SharedBuffer;

enum class IsMainResourceLoad : bool;

class ResourceLoadNotifier {
    WTF_MAKE_NONCOPYABLE(ResourceLoadNotifier);
public:
    explicit ResourceLoadNotifier(LocalFrame&);

    void didReceiveAuthenticationChallenge(ResourceLoader*, const AuthenticationChallenge&);
    void didReceiveAuthenticationChallenge(ResourceLoaderIdentifier, DocumentLoader*, const AuthenticationChallenge&);

    void willSendRequest(ResourceLoader*, ResourceRequest&, const ResourceResponse& redirectResponse);
    void didReceiveResponse(ResourceLoader*, const ResourceResponse&);
    void didReceiveData(ResourceLoader*, const SharedBuffer&, int encodedDataLength);
    void didFinishLoad(ResourceLoader*, const NetworkLoadMetrics&);
    void didFailToLoad(ResourceLoader*, const ResourceError&);

    void assignIdentifierToInitialRequest(ResourceLoaderIdentifier, IsMainResourceLoad, DocumentLoader*, const ResourceRequest&);
    void dispatchWillSendRequest(DocumentLoader*, ResourceLoaderIdentifier, ResourceRequest&, const ResourceResponse& redirectResponse, const CachedResource*, ResourceLoader* = nullptr);
    void dispatchDidReceiveResponse(DocumentLoader*, ResourceLoaderIdentifier, const ResourceResponse&, ResourceLoader* = nullptr);
    void dispatchDidReceiveData(DocumentLoader*, ResourceLoaderIdentifier, const SharedBuffer*, int expectedDataLength, int encodedDataLength);
    void dispatchDidFinishLoading(DocumentLoader*, IsMainResourceLoad, ResourceLoaderIdentifier, const NetworkLoadMetrics&, ResourceLoader*);
    void dispatchDidFailLoading(DocumentLoader*, IsMainResourceLoad, ResourceLoaderIdentifier, const ResourceError&);

    void sendRemainingDelegateMessages(DocumentLoader*, IsMainResourceLoad, ResourceLoaderIdentifier, const ResourceRequest&, const ResourceResponse&, const SharedBuffer*, int expectedDataLength, int encodedDataLength, const ResourceError&);

    bool isInitialRequestIdentifier(ResourceLoaderIdentifier identifier)
    {
        return m_initialRequestIdentifier == identifier;
    }

private:
    Ref<LocalFrame> protectedFrame() const;

    WeakRef<LocalFrame> m_frame;
    std::optional<ResourceLoaderIdentifier> m_initialRequestIdentifier;
};

} // namespace WebCore
