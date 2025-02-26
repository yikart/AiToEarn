
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

#include "DOMCacheIdentifier.h"
#include "FetchHeaders.h"
#include "FetchOptions.h"
#include "ResourceRequest.h"
#include "ResourceResponse.h"
#include "SharedBuffer.h"
#include <wtf/CompletionHandler.h>

namespace WebCore {

class ScriptExecutionContext;

struct CacheQueryOptions;

namespace DOMCacheEngine {

enum class Error : uint8_t {
    NotImplemented,
    ReadDisk,
    WriteDisk,
    QuotaExceeded,
    Internal,
    Stopped,
    CORP
};

Exception convertToException(Error);
Exception convertToExceptionAndLog(ScriptExecutionContext*, Error);

WEBCORE_EXPORT bool queryCacheMatch(const ResourceRequest& request, const ResourceRequest& cachedRequest, const ResourceResponse&, const CacheQueryOptions&);
WEBCORE_EXPORT bool queryCacheMatch(const ResourceRequest&, const URL&, bool hasVaryStar, const HashMap<String, String>& varyHeaders, const CacheQueryOptions&);

using ResponseBody = std::variant<std::nullptr_t, Ref<FormData>, Ref<SharedBuffer>>;
WEBCORE_EXPORT ResponseBody isolatedResponseBody(const ResponseBody&);
WEBCORE_EXPORT ResponseBody copyResponseBody(const ResponseBody&);

struct Record {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    WEBCORE_EXPORT Record copy() const;

    uint64_t identifier;
    uint64_t updateResponseCounter;

    FetchHeaders::Guard requestHeadersGuard;
    ResourceRequest request;
    FetchOptions options;
    String referrer;

    FetchHeaders::Guard responseHeadersGuard;
    ResourceResponse response;
    ResponseBody responseBody;
    uint64_t responseBodySize;
};

struct CrossThreadRecord {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;
    CrossThreadRecord(const CrossThreadRecord&) = delete;
    CrossThreadRecord& operator=(const CrossThreadRecord&) = delete;
    CrossThreadRecord() = default;
    CrossThreadRecord(CrossThreadRecord&&) = default;
    CrossThreadRecord& operator=(CrossThreadRecord&&) = default;
    CrossThreadRecord(uint64_t identifier, uint64_t updateResponseCounter, FetchHeaders::Guard requestHeadersGuard, ResourceRequest&& request, FetchOptions options, String&& referrer, FetchHeaders::Guard responseHeadersGuard, ResourceResponse::CrossThreadData&& response, ResponseBody&& responseBody, uint64_t responseBodySize)
        : identifier(identifier)
        , updateResponseCounter(updateResponseCounter)
        , requestHeadersGuard(requestHeadersGuard)
        , request(WTFMove(request))
        , options(options)
        , referrer(WTFMove(referrer))
        , responseHeadersGuard(responseHeadersGuard)
        , response(WTFMove(response))
        , responseBody(WTFMove(responseBody))
        , responseBodySize(responseBodySize)
    {
    }
    WEBCORE_EXPORT CrossThreadRecord isolatedCopy() &&;

    uint64_t identifier;
    uint64_t updateResponseCounter;
    FetchHeaders::Guard requestHeadersGuard;
    ResourceRequest request;
    FetchOptions options;
    String referrer;
    FetchHeaders::Guard responseHeadersGuard;
    ResourceResponse::CrossThreadData response;
    ResponseBody responseBody;
    uint64_t responseBodySize;
};

WEBCORE_EXPORT CrossThreadRecord toCrossThreadRecord(Record&&);
WEBCORE_EXPORT Record fromCrossThreadRecord(CrossThreadRecord&&);

struct CacheInfo {
    DOMCacheIdentifier identifier;
    String name;

    CacheInfo isolatedCopy() const & { return { identifier, name.isolatedCopy() }; }
    CacheInfo isolatedCopy() && { return { identifier, WTFMove(name).isolatedCopy() }; }
};

struct CacheInfos {
    Vector<CacheInfo> infos;
    uint64_t updateCounter;

    CacheInfos isolatedCopy() const & { return { crossThreadCopy(infos), updateCounter }; }
    CacheInfos isolatedCopy() && { return { crossThreadCopy(WTFMove(infos)), updateCounter }; }
};

struct CacheIdentifierOperationResult {
    DOMCacheIdentifier identifier;
    // True in case storing cache list on the filesystem failed.
    bool hadStorageError { false };
};

using CacheIdentifierOrError = Expected<CacheIdentifierOperationResult, Error>;
using CacheIdentifierCallback = CompletionHandler<void(const CacheIdentifierOrError&)>;

using RemoveCacheIdentifierOrError = Expected<bool, Error>;
using RemoveCacheIdentifierCallback = CompletionHandler<void(const RemoveCacheIdentifierOrError&)>;

using RecordIdentifiersOrError = Expected<Vector<uint64_t>, Error>;
using RecordIdentifiersCallback = CompletionHandler<void(RecordIdentifiersOrError&&)>;


using CacheInfosOrError = Expected<CacheInfos, Error>;
using CacheInfosCallback = CompletionHandler<void(CacheInfosOrError&&)>;

using RecordsOrError = Expected<Vector<Record>, Error>;
using RecordsCallback = CompletionHandler<void(RecordsOrError&&)>;

using CrossThreadRecordsOrError = Expected<Vector<CrossThreadRecord>, Error>;
using CrossThreadRecordsCallback = CompletionHandler<void(CrossThreadRecordsOrError&&)>;

using CompletionCallback = CompletionHandler<void(std::optional<Error>&&)>;

} // namespace DOMCacheEngine

} // namespace WebCore
