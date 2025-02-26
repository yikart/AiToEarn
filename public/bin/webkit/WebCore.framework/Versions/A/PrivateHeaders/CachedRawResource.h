/*
    Copyright (C) 1998 Lars Knoll (knoll@mpi-hd.mpg.de)
    Copyright (C) 2001 Dirk Mueller <mueller@kde.org>
    Copyright (C) 2006 Samuel Weinig (sam.weinig@gmail.com)
    Copyright (C) 2004, 2005, 2006, 2007 Apple Inc. All rights reserved.

    This library is free software; you can redistribute it and/or
    modify it under the terms of the GNU Library General Public
    License as published by the Free Software Foundation; either
    version 2 of the License, or (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
    Library General Public License for more details.

    You should have received a copy of the GNU Library General Public License
    along with this library; see the file COPYING.LIB.  If not, write to
    the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
    Boston, MA 02110-1301, USA.
*/

#pragma once

#include "CachedResource.h"

namespace WebCore {

class CachedResourceClient;
class ResourceTiming;
class SharedBuffer;
class SharedBufferDataView;

class CachedRawResource final : public CachedResource {
public:
    CachedRawResource(CachedResourceRequest&&, Type, PAL::SessionID, const CookieJar*);

    void setDefersLoading(bool);

    void setDataBufferingPolicy(DataBufferingPolicy);

    // FIXME: This is exposed for the InspectorInstrumentation for preflights in DocumentThreadableLoader. It's also really lame.
    std::optional<ResourceLoaderIdentifier> resourceLoaderIdentifier() const { return m_resourceLoaderIdentifier; }

    void clear();

    bool canReuse(const ResourceRequest&) const;

    bool wasRedirected() const { return !m_redirectChain.isEmpty(); };

    void finishedTimingForWorkerLoad(ResourceTiming&&);

private:
    void didAddClient(CachedResourceClient&) final;
    void updateBuffer(const FragmentedSharedBuffer&) final;
    void updateData(const SharedBuffer&) final;
    void finishLoading(const FragmentedSharedBuffer*, const NetworkLoadMetrics&) final;

    bool shouldIgnoreHTTPStatusCodeErrors() const override { return true; }
    void allClientsRemoved() override;

    void redirectReceived(ResourceRequest&&, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&&) override;
    void responseReceived(const ResourceResponse&) override;
    bool shouldCacheResponse(const ResourceResponse&) override;
    void didSendData(unsigned long long bytesSent, unsigned long long totalBytesToBeSent) override;

    void switchClientsToRevalidatedResource() override;
    bool mayTryReplaceEncodedData() const override { return m_allowEncodedDataReplacement; }

    std::optional<SharedBufferDataView> calculateIncrementalDataChunk(const FragmentedSharedBuffer&) const;
    void notifyClientsDataWasReceived(const SharedBuffer&);
    
#if USE(QUICK_LOOK)
    void previewResponseReceived(const ResourceResponse&) final;
#endif

    Markable<ResourceLoaderIdentifier> m_resourceLoaderIdentifier;

    struct RedirectPair {
    public:
        explicit RedirectPair(const ResourceRequest& request, const ResourceResponse& redirectResponse)
            : m_request(request)
            , m_redirectResponse(redirectResponse)
        {
        }

        const ResourceRequest m_request;
        const ResourceResponse m_redirectResponse;
    };

    Vector<RedirectPair, 0, CrashOnOverflow, 0> m_redirectChain;

    struct DelayedFinishLoading {
        RefPtr<const FragmentedSharedBuffer> buffer;
    };
    std::optional<DelayedFinishLoading> m_delayedFinishLoading;

    bool m_allowEncodedDataReplacement { true };
    bool m_inIncrementalDataNotify { false };
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::CachedRawResource)
    static bool isType(const WebCore::CachedResource& resource) { return resource.isMainOrMediaOrIconOrRawResource(); }
SPECIALIZE_TYPE_TRAITS_END()
