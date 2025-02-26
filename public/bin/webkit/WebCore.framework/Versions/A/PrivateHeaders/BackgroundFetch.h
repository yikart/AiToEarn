/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "BackgroundFetchFailureReason.h"
#include "BackgroundFetchOptions.h"
#include "BackgroundFetchRecordIdentifier.h"
#include "BackgroundFetchRecordLoader.h"
#include "BackgroundFetchRequest.h"
#include "BackgroundFetchResult.h"
#include "BackgroundFetchStore.h"
#include "ClientOrigin.h"
#include "ResourceResponse.h"
#include "ServiceWorkerRegistrationKey.h"
#include "ServiceWorkerTypes.h"
#include <wtf/Identified.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class BackgroundFetchRecordLoader;
class SWServer;
class SharedBuffer;

struct BackgroundFetchRequest;
struct CacheQueryOptions;

class BackgroundFetch : public RefCountedAndCanMakeWeakPtr<BackgroundFetch> {
    WTF_MAKE_TZONE_ALLOCATED(BackgroundFetch);
public:
    using NotificationCallback = Function<void(BackgroundFetch&)>;

    static Ref<BackgroundFetch> create(SWServerRegistration& sWServerRegistration, const String& identifier, Vector<BackgroundFetchRequest>&& requests, BackgroundFetchOptions&& options, Ref<BackgroundFetchStore>&& store, NotificationCallback&& notificationCallback)
    {
        return adoptRef(*new BackgroundFetch(sWServerRegistration, identifier, WTFMove(requests), WTFMove(options), WTFMove(store), WTFMove(notificationCallback)));
    }

    static Ref<BackgroundFetch> create(SWServerRegistration& swServerRegistration, String&& identifier, BackgroundFetchOptions&& options, Ref<BackgroundFetchStore>&& store, NotificationCallback&& notificationCallback, bool pausedFlag)
    {
        return adoptRef(*new BackgroundFetch(swServerRegistration, WTFMove(identifier), WTFMove(options), WTFMove(store), WTFMove(notificationCallback), pausedFlag));
    }

    ~BackgroundFetch();

    static RefPtr<BackgroundFetch> createFromStore(std::span<const uint8_t>, SWServer&, Ref<BackgroundFetchStore>&&, NotificationCallback&&);

    String identifier() const { return m_identifier; }
    WEBCORE_EXPORT BackgroundFetchInformation information() const;
    const ServiceWorkerRegistrationKey& registrationKey() const { return m_registrationKey; }
    const BackgroundFetchOptions& options() const { return m_options; }

    using RetrieveRecordResponseCallback = CompletionHandler<void(Expected<ResourceResponse, ExceptionData>&&)>;
    using RetrieveRecordResponseBodyCallback = Function<void(Expected<RefPtr<SharedBuffer>, ResourceError>&&)>;
    using CreateLoaderCallback = Function<RefPtr<BackgroundFetchRecordLoader>(BackgroundFetchRecordLoaderClient&, const BackgroundFetchRequest&, size_t responseDataSize, const ClientOrigin&)>;

    bool pausedFlagIsSet() const { return m_pausedFlag; }
    void pause();
    void resume(const CreateLoaderCallback&);

    class Record final : public BackgroundFetchRecordLoaderClient, public RefCounted<Record>, private Identified<BackgroundFetchRecordIdentifier> {
        WTF_MAKE_TZONE_ALLOCATED(Record);
    public:
        void ref() const final { RefCounted::ref(); }
        void deref() const final { RefCounted::deref(); }

        static Ref<Record> create(BackgroundFetch& fetch, BackgroundFetchRequest&& request, size_t size) { return adoptRef(*new Record(fetch, WTFMove(request), size)); }
        ~Record();

        void complete(const CreateLoaderCallback&);
        void pause();
        void abort();

        void setAsCompleted() { m_isCompleted = true; }
        bool isCompleted() const { return m_isCompleted; }

        const BackgroundFetchRequest& request() const { return m_request; }
        const ResourceResponse& response() const { return m_response; }

        uint64_t responseDataSize() const { return m_responseDataSize; }
        void clearResponseDataSize() { m_responseDataSize = 0; }
        bool isMatching(const ResourceRequest&, const CacheQueryOptions&) const;
        BackgroundFetchRecordInformation information() const;

        void retrieveResponse(BackgroundFetchStore&, RetrieveRecordResponseCallback&&);
        void retrieveRecordResponseBody(BackgroundFetchStore&, RetrieveRecordResponseBodyCallback&&);

    private:
        Record(BackgroundFetch&, BackgroundFetchRequest&&, size_t);

        void didSendData(uint64_t) final;
        void didReceiveResponse(ResourceResponse&&) final;
        void didReceiveResponseBodyChunk(const SharedBuffer&) final;
        void didFinish(const ResourceError&) final;

        WeakPtr<BackgroundFetch> m_fetch;
        String m_fetchIdentifier;
        ServiceWorkerRegistrationKey m_registrationKey;
        BackgroundFetchRequest m_request;
        size_t m_index { 0 };
        ResourceResponse m_response;
        RefPtr<BackgroundFetchRecordLoader> m_loader;
        uint64_t m_responseDataSize { 0 };
        bool m_isCompleted { false };
        bool m_isAborted { false };
        Vector<RetrieveRecordResponseCallback> m_responseCallbacks;
        Vector<RetrieveRecordResponseBodyCallback> m_responseBodyCallbacks;
    };

    using MatchBackgroundFetchCallback = CompletionHandler<void(Vector<Ref<Record>>&&)>;
    void match(const RetrieveRecordsOptions&, MatchBackgroundFetchCallback&&);

    bool abort();

    void perform(const CreateLoaderCallback&);

    bool isActive() const { return m_isActive; }
    const ClientOrigin& origin() const { return m_origin; }
    uint64_t downloadTotal() const { return  m_options.downloadTotal; }
    uint64_t uploadTotal() const { return m_uploadTotal; }

    void doStore(CompletionHandler<void(BackgroundFetchStore::StoreResult)>&&, std::optional<size_t> responseBodyIndexToClear = { });
    void unsetRecordsAvailableFlag();

private:
    BackgroundFetch(SWServerRegistration&, const String&, Vector<BackgroundFetchRequest>&&, BackgroundFetchOptions&&, Ref<BackgroundFetchStore>&&, NotificationCallback&&);
    BackgroundFetch(SWServerRegistration&, String&&, BackgroundFetchOptions&&, Ref<BackgroundFetchStore>&&, NotificationCallback&&, bool pausedFlag);

    void didSendData(uint64_t);
    void storeResponse(size_t, bool shouldClearResponseBody, ResourceResponse&&);
    void storeResponseBodyChunk(size_t, const SharedBuffer&);
    void didFinishRecord(const ResourceError&);

    void recordIsCompleted();
    void handleStoreResult(BackgroundFetchStore::StoreResult);
    void updateBackgroundFetchStatus(BackgroundFetchResult, BackgroundFetchFailureReason);

    void setRecords(Vector<Ref<Record>>&&);

    String m_identifier;
    Vector<Ref<Record>> m_records;
    BackgroundFetchOptions m_options;
    ServiceWorkerRegistrationKey m_registrationKey;
    ServiceWorkerRegistrationIdentifier m_registrationIdentifier;

    BackgroundFetchResult m_result { BackgroundFetchResult::EmptyString };
    BackgroundFetchFailureReason m_failureReason { BackgroundFetchFailureReason::EmptyString };

    bool m_recordsAvailableFlag { true };
    bool m_abortFlag { false };
    bool m_pausedFlag { false };
    bool m_isActive { true };

    uint64_t m_uploadTotal { 0 };
    uint64_t m_currentDownloadSize { 0 };
    uint64_t m_currentUploadSize { 0 };

    Ref<BackgroundFetchStore> m_store;
    NotificationCallback m_notificationCallback;
    ClientOrigin m_origin;
};

} // namespace WebCore
