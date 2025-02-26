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

#include "IDBDatabaseIdentifier.h"
#include "IDBRequest.h"

namespace WebCore {

class IDBResultData;

class IDBOpenDBRequest final : public IDBRequest {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(IDBOpenDBRequest);
public:
    static Ref<IDBOpenDBRequest> createDeleteRequest(ScriptExecutionContext&, IDBClient::IDBConnectionProxy&, const IDBDatabaseIdentifier&);
    static Ref<IDBOpenDBRequest> createOpenRequest(ScriptExecutionContext&, IDBClient::IDBConnectionProxy&, const IDBDatabaseIdentifier&, uint64_t version);

    virtual ~IDBOpenDBRequest();
    
    const IDBDatabaseIdentifier& databaseIdentifier() const { return m_databaseIdentifier; }
    uint64_t version() const { return m_version; }

    void requestCompleted(const IDBResultData&);
    void requestBlocked(uint64_t oldVersion, uint64_t newVersion);

    void versionChangeTransactionDidFinish();
    void fireSuccessAfterVersionChangeCommit();
    void fireErrorAfterVersionChangeCompletion();

    void setIsContextSuspended(bool);
    bool isContextSuspended() const { return m_isContextSuspended; }

private:
    IDBOpenDBRequest(ScriptExecutionContext&, IDBClient::IDBConnectionProxy&, const IDBDatabaseIdentifier&, uint64_t version, IndexedDB::RequestType);

    void dispatchEvent(Event&) final;

    void cancelForStop() final;

    void onError(const IDBResultData&);
    void onSuccess(const IDBResultData&);
    void onUpgradeNeeded(const IDBResultData&);
    void onDeleteDatabaseSuccess(const IDBResultData&);

    bool isOpenDBRequest() const final { return true; }

    IDBDatabaseIdentifier m_databaseIdentifier;
    uint64_t m_version { 0 };

    bool m_isContextSuspended { false };
    bool m_isBlocked { false };
};

} // namespace WebCore
