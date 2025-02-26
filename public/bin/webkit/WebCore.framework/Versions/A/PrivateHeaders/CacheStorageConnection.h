
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

#include "DOMCacheEngine.h"
#include "RetrieveRecordsOptions.h"
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/NativePromise.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

struct ClientOrigin;
class FetchResponse;

class CacheStorageConnection : public ThreadSafeRefCounted<CacheStorageConnection> {
public:
    virtual ~CacheStorageConnection() = default;

    using OpenPromise = NativePromise<DOMCacheEngine::CacheIdentifierOperationResult, DOMCacheEngine::Error>;
    virtual Ref<OpenPromise> open(const ClientOrigin&, const String& cacheName) = 0;
    using RemovePromise = NativePromise<bool, DOMCacheEngine::Error>;
    virtual Ref<RemovePromise> remove(DOMCacheIdentifier) = 0;
    using RetrieveCachesPromise = NativePromise<DOMCacheEngine::CacheInfos, DOMCacheEngine::Error>;
    virtual Ref<RetrieveCachesPromise> retrieveCaches(const ClientOrigin&, uint64_t updateCounter) = 0;

    using RetrieveRecordsPromise = NativePromise<Vector<DOMCacheEngine::CrossThreadRecord>, DOMCacheEngine::Error>;
    virtual Ref<RetrieveRecordsPromise> retrieveRecords(DOMCacheIdentifier, RetrieveRecordsOptions&&) = 0;
    using BatchPromise = NativePromise<Vector<uint64_t>, DOMCacheEngine::Error>;
    virtual Ref<BatchPromise> batchDeleteOperation(DOMCacheIdentifier, const ResourceRequest&, CacheQueryOptions&&) = 0;
    virtual Ref<BatchPromise> batchPutOperation(DOMCacheIdentifier, Vector<DOMCacheEngine::CrossThreadRecord>&&) = 0;

    virtual void reference(DOMCacheIdentifier /* cacheIdentifier */) = 0;
    virtual void dereference(DOMCacheIdentifier /* cacheIdentifier */) = 0;
    virtual void lockStorage(const ClientOrigin&) = 0;
    virtual void unlockStorage(const ClientOrigin&) = 0;

    uint64_t computeRecordBodySize(const FetchResponse&, const DOMCacheEngine::ResponseBody&);

    // Used only for testing purposes.
    using CompletionPromise = NativePromise<void, DOMCacheEngine::Error>;
    virtual Ref<CompletionPromise> clearMemoryRepresentation(const ClientOrigin&) { return CompletionPromise::createAndReject(DOMCacheEngine::Error::NotImplemented); }
    using EngineRepresentationPromise = NativePromise<String, DOMCacheEngine::Error>;
    virtual Ref<EngineRepresentationPromise> engineRepresentation() { return EngineRepresentationPromise::createAndReject(DOMCacheEngine::Error::NotImplemented); }
    virtual void updateQuotaBasedOnSpaceUsage(const ClientOrigin&) { }

private:
    uint64_t computeRealBodySize(const DOMCacheEngine::ResponseBody&);

protected:
    HashMap<uint64_t, uint64_t> m_opaqueResponseToSizeWithPaddingMap;
};

} // namespace WebCore
