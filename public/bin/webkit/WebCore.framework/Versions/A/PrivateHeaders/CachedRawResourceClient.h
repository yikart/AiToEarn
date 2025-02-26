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

#include "CachedResourceClient.h"
#include <wtf/CompletionHandler.h>

namespace WebCore {
class CachedRawResourceClient;
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::CachedRawResourceClient> : std::true_type { };
}

namespace WebCore {

class CachedResource;
class ResourceRequest;
class ResourceResponse;
class ResourceTiming;
class SharedBuffer;

class CachedRawResourceClient : public CachedResourceClient {
public:
    static CachedResourceClientType expectedType() { return RawResourceType; }
    CachedResourceClientType resourceClientType() const override { return expectedType(); }

    virtual void dataSent(CachedResource&, unsigned long long /* bytesSent */, unsigned long long /* totalBytesToBeSent */) { }
    virtual void responseReceived(CachedResource&, const ResourceResponse&, CompletionHandler<void()>&& completionHandler)
    {
        if (completionHandler)
            completionHandler();
    }

    virtual bool shouldCacheResponse(CachedResource&, const ResourceResponse&) { return true; }
    virtual void dataReceived(CachedResource&, const SharedBuffer&) { }
    virtual void redirectReceived(CachedResource&, ResourceRequest&& request, const ResourceResponse&, CompletionHandler<void(ResourceRequest&&)>&& completionHandler) { completionHandler(WTFMove(request)); }
    virtual void finishedTimingForWorkerLoad(CachedResource&, const ResourceTiming&) { }

#if USE(QUICK_LOOK)
    virtual void previewResponseReceived(CachedResource&, const ResourceResponse&) { };
#endif
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CACHED_RESOURCE_CLIENT(CachedRawResourceClient, RawResourceType);
