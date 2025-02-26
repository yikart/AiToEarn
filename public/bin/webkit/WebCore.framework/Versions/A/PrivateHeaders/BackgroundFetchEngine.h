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

#include "BackgroundFetch.h"
#include <span>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class BackgroundFetchStore;
class ResourceResponse;
class SWServer;

class BackgroundFetchEngine : public RefCountedAndCanMakeWeakPtr<BackgroundFetchEngine> {
    WTF_MAKE_TZONE_ALLOCATED(BackgroundFetchEngine);
public:
    static Ref<BackgroundFetchEngine> create(SWServer& swServer)
    {
        return adoptRef(*new BackgroundFetchEngine(swServer));
    }

    using ExceptionOrBackgroundFetchInformationCallback = CompletionHandler<void(Expected<std::optional<BackgroundFetchInformation>, ExceptionData>&&)>;
    void startBackgroundFetch(SWServerRegistration&, const String&, Vector<BackgroundFetchRequest>&&, BackgroundFetchOptions&&, ExceptionOrBackgroundFetchInformationCallback&&);
    void backgroundFetchInformation(SWServerRegistration&, const String&, ExceptionOrBackgroundFetchInformationCallback&&);
    using BackgroundFetchIdentifiersCallback = CompletionHandler<void(Vector<String>&&)>;
    void backgroundFetchIdentifiers(SWServerRegistration&, BackgroundFetchIdentifiersCallback&&);
    using AbortBackgroundFetchCallback = CompletionHandler<void(bool)>;
    void abortBackgroundFetch(SWServerRegistration&, const String&, AbortBackgroundFetchCallback&&);
    using MatchBackgroundFetchCallback = CompletionHandler<void(Vector<BackgroundFetchRecordInformation>&&)>;
    void matchBackgroundFetch(SWServerRegistration&, const String&, RetrieveRecordsOptions&&, MatchBackgroundFetchCallback&&);
    using RetrieveRecordResponseCallback = BackgroundFetch::RetrieveRecordResponseCallback;
    void retrieveRecordResponse(BackgroundFetchRecordIdentifier, RetrieveRecordResponseCallback&&);
    using RetrieveRecordResponseBodyCallback = BackgroundFetch::RetrieveRecordResponseBodyCallback;
    void retrieveRecordResponseBody(BackgroundFetchRecordIdentifier, RetrieveRecordResponseBodyCallback&&);

    void remove(SWServerRegistration&);

    WEBCORE_EXPORT WeakPtr<BackgroundFetch> backgroundFetch(const ServiceWorkerRegistrationKey&, const String&) const;
    WEBCORE_EXPORT void addFetchFromStore(std::span<const uint8_t>, CompletionHandler<void(const ServiceWorkerRegistrationKey&, const String&)>&&);

    WEBCORE_EXPORT void abortBackgroundFetch(const ServiceWorkerRegistrationKey&, const String&);
    WEBCORE_EXPORT void pauseBackgroundFetch(const ServiceWorkerRegistrationKey&, const String&);
    WEBCORE_EXPORT void resumeBackgroundFetch(const ServiceWorkerRegistrationKey&, const String&);
    WEBCORE_EXPORT void clickBackgroundFetch(const ServiceWorkerRegistrationKey&, const String&);

private:
    explicit BackgroundFetchEngine(SWServer&);

    void notifyBackgroundFetchUpdate(BackgroundFetch&);

    WeakPtr<SWServer> m_server;
    Ref<BackgroundFetchStore> m_store;

    using FetchesMap = HashMap<String, Ref<BackgroundFetch>>;
    HashMap<ServiceWorkerRegistrationKey, FetchesMap> m_fetches;

    HashMap<BackgroundFetchRecordIdentifier, Ref<BackgroundFetch::Record>> m_records;
};

} // namespace WebCore
