/*
 * Copyright (C) 2015-2021 Apple Inc. All rights reserved.
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

#include "EventTarget.h"
#include "IDBActiveDOMObject.h"
#include "IDBError.h"
#include "IDBGetAllRecordsData.h"
#include "IDBGetRecordData.h"
#include "IDBIndexIdentifier.h"
#include "IDBKeyRangeData.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBOpenDBRequest.h"
#include "IDBTransactionInfo.h"
#include "IDBTransactionMode.h"
#include "IndexedDB.h"
#include "Timer.h"
#include <wtf/Deque.h>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>

namespace WebCore {

class DOMException;
class DOMStringList;
class IDBCursor;
class IDBCursorInfo;
class IDBDatabase;
class IDBIndex;
class IDBIndexInfo;
class IDBKey;
class IDBKeyData;
class IDBObjectStore;
class IDBObjectStoreInfo;
class IDBResultData;
class SerializedScriptValue;

struct IDBIterateCursorData;
struct IDBKeyRangeData;

namespace IDBClient {
class IDBConnectionProxy;
class TransactionOperation;
}

class IDBTransaction final : public ThreadSafeRefCounted<IDBTransaction>, public EventTarget, public IDBActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(IDBTransaction, WEBCORE_EXPORT);
public:
    static Ref<IDBTransaction> create(IDBDatabase&, const IDBTransactionInfo&);
    static Ref<IDBTransaction> create(IDBDatabase&, const IDBTransactionInfo&, IDBOpenDBRequest&);

    static uint64_t generateOperationID();

    WEBCORE_EXPORT ~IDBTransaction() final;

    // IDBTransaction IDL
    Ref<DOMStringList> objectStoreNames() const;
    IDBTransactionMode mode() const { return m_info.mode(); }
    IDBTransactionDurability durability() const { return m_info.durability(); }
    IDBDatabase* db();
    DOMException* error() const;
    ExceptionOr<Ref<IDBObjectStore>> objectStore(const String& name);
    ExceptionOr<void> abort();
    ExceptionOr<void> commit();

    enum EventTargetInterfaceType eventTargetInterface() const final { return EventTargetInterfaceType::IDBTransaction; }
    ScriptExecutionContext* scriptExecutionContext() const final { return ActiveDOMObject::scriptExecutionContext(); }
    void refEventTarget() final { ThreadSafeRefCounted::ref(); }
    void derefEventTarget() final { ThreadSafeRefCounted::deref(); }
    using EventTarget::dispatchEvent;
    void dispatchEvent(Event&) final;

    const IDBTransactionInfo& info() const { return m_info; }
    IDBDatabase& database() { return m_database.get(); }
    const IDBDatabase& database() const { return m_database.get(); }
    IDBDatabaseInfo* originalDatabaseInfo() const { return m_info.originalDatabaseInfo().get(); }

    void didStart(const IDBError&);
    void didAbort(const IDBError&);
    void didCommit(const IDBError&);

    bool isVersionChange() const { return mode() == IDBTransactionMode::Versionchange; }
    bool isReadOnly() const { return mode() == IDBTransactionMode::Readonly; }
    bool isActive() const;

    Ref<IDBObjectStore> createObjectStore(const IDBObjectStoreInfo&);
    void renameObjectStore(IDBObjectStore&, const String& newName);
    std::unique_ptr<IDBIndex> createIndex(IDBObjectStore&, const IDBIndexInfo&);
    void renameIndex(IDBIndex&, const String& newName);

    Ref<IDBRequest> requestPutOrAdd(IDBObjectStore&, RefPtr<IDBKey>&&, SerializedScriptValue&, IndexedDB::ObjectStoreOverwriteMode);
    Ref<IDBRequest> requestGetRecord(IDBObjectStore&, const IDBGetRecordData&);
    Ref<IDBRequest> requestGetAllObjectStoreRecords(IDBObjectStore&, const IDBKeyRangeData&, IndexedDB::GetAllType, std::optional<uint32_t> count);
    Ref<IDBRequest> requestGetAllIndexRecords(IDBIndex&, const IDBKeyRangeData&, IndexedDB::GetAllType, std::optional<uint32_t> count);
    Ref<IDBRequest> requestDeleteRecord(IDBObjectStore&, const IDBKeyRangeData&);
    Ref<IDBRequest> requestClearObjectStore(IDBObjectStore&);
    Ref<IDBRequest> requestCount(IDBObjectStore&, const IDBKeyRangeData&);
    Ref<IDBRequest> requestCount(IDBIndex&, const IDBKeyRangeData&);
    Ref<IDBRequest> requestGetValue(IDBIndex&, const IDBKeyRangeData&);
    Ref<IDBRequest> requestGetKey(IDBIndex&, const IDBKeyRangeData&);
    Ref<IDBRequest> requestOpenCursor(IDBObjectStore&, const IDBCursorInfo&);
    Ref<IDBRequest> requestOpenCursor(IDBIndex&, const IDBCursorInfo&);
    void iterateCursor(IDBCursor&, const IDBIterateCursorData&);

    void deleteObjectStore(const String& objectStoreName);
    void deleteIndex(IDBObjectStoreIdentifier, const String& indexName);

    void addRequest(IDBRequest&);
    void removeRequest(IDBRequest&);

    void abortDueToFailedRequest(DOMException&);

    void activate();
    void deactivate();

    void operationCompletedOnServer(const IDBResultData&, IDBClient::TransactionOperation&);
    void operationCompletedOnClient(IDBClient::TransactionOperation&);

    void finishedDispatchEventForRequest(IDBRequest&);

    bool isFinishedOrFinishing() const;
    bool isFinished() const { return m_state == IndexedDB::TransactionState::Finished; }
    bool didDispatchAbortOrCommit() const { return m_didDispatchAbortOrCommit; }

    IDBClient::IDBConnectionProxy& connectionProxy();

    void connectionClosedFromServer(const IDBError&);

    template<typename Visitor> void visitReferencedObjectStores(Visitor&) const;

    WEBCORE_EXPORT static std::atomic<unsigned> numberOfIDBTransactions;

    // ActiveDOMObject.
    void stop() final;
    void ref() const final { ThreadSafeRefCounted::ref(); }
    void deref() const final { ThreadSafeRefCounted::deref(); }

private:
    IDBTransaction(IDBDatabase&, const IDBTransactionInfo&, IDBOpenDBRequest*);

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;

    void commitInternal();
    void abortInternal();
    void notifyDidAbort(const IDBError&);
    void finishAbortOrCommit();
    void abortInProgressOperations(const IDBError&);

    enum class IsWriteOperation : bool { No, Yes };
    void scheduleOperation(Ref<IDBClient::TransactionOperation>&&, IsWriteOperation = IsWriteOperation::No);
    void handleOperationsCompletedOnServer();
    void handlePendingOperations();
    void autoCommit();

    void fireOnComplete();
    void fireOnAbort();
    void enqueueEvent(Ref<Event>&&);

    Ref<IDBRequest> requestIndexRecord(IDBIndex&, IndexedDB::IndexRecordType, const IDBKeyRangeData&);

    void commitOnServer(IDBClient::TransactionOperation&, uint64_t handledRequestResultsCount);
    void abortOnServerAndCancelRequests(IDBClient::TransactionOperation&);

    void createObjectStoreOnServer(IDBClient::TransactionOperation&, const IDBObjectStoreInfo&);
    void didCreateObjectStoreOnServer(const IDBResultData&);

    void renameObjectStoreOnServer(IDBClient::TransactionOperation&, IDBObjectStoreIdentifier, const String& newName);
    void didRenameObjectStoreOnServer(const IDBResultData&);

    void createIndexOnServer(IDBClient::TransactionOperation&, const IDBIndexInfo&);
    void didCreateIndexOnServer(const IDBResultData&);

    void renameIndexOnServer(IDBClient::TransactionOperation&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName);
    void didRenameIndexOnServer(const IDBResultData&);

    void clearObjectStoreOnServer(IDBClient::TransactionOperation&, IDBObjectStoreIdentifier);
    void didClearObjectStoreOnServer(IDBRequest&, const IDBResultData&);

    void putOrAddOnServer(IDBClient::TransactionOperation&, RefPtr<IDBKey>, RefPtr<SerializedScriptValue>, const IndexedDB::ObjectStoreOverwriteMode&);
    void didPutOrAddOnServer(IDBRequest&, const IDBResultData&);

    void getRecordOnServer(IDBClient::TransactionOperation&, const IDBGetRecordData&);
    void didGetRecordOnServer(IDBRequest&, const IDBResultData&);

    void getAllRecordsOnServer(IDBClient::TransactionOperation&, const IDBGetAllRecordsData&);
    void didGetAllRecordsOnServer(IDBRequest&, const IDBResultData&);

    void getCountOnServer(IDBClient::TransactionOperation&, const IDBKeyRangeData&);
    void didGetCountOnServer(IDBRequest&, const IDBResultData&);

    void deleteRecordOnServer(IDBClient::TransactionOperation&, const IDBKeyRangeData&);
    void didDeleteRecordOnServer(IDBRequest&, const IDBResultData&);

    void deleteObjectStoreOnServer(IDBClient::TransactionOperation&, const String& objectStoreName);
    void didDeleteObjectStoreOnServer(const IDBResultData&);

    void deleteIndexOnServer(IDBClient::TransactionOperation&, IDBObjectStoreIdentifier, const String& indexName);
    void didDeleteIndexOnServer(const IDBResultData&);

    Ref<IDBRequest> doRequestOpenCursor(Ref<IDBCursor>&&);
    void openCursorOnServer(IDBClient::TransactionOperation&, const IDBCursorInfo&);
    void didOpenCursorOnServer(IDBRequest&, const IDBResultData&);

    void iterateCursorOnServer(IDBClient::TransactionOperation&, const IDBIterateCursorData&);
    void didIterateCursorOnServer(IDBRequest&, const IDBResultData&);

    void transitionedToFinishing(IndexedDB::TransactionState);

    void establishOnServer();

    void completeNoncursorRequest(IDBRequest&, const IDBResultData&);
    void completeCursorRequest(IDBRequest&, const IDBResultData&);

    void trySchedulePendingOperationTimer();
    void addCursorRequest(IDBRequest&);

    Ref<IDBDatabase> m_database;
    IDBTransactionInfo m_info;

    IndexedDB::TransactionState m_state { IndexedDB::TransactionState::Inactive };
    bool m_startedOnServer { false };

    IDBError m_idbError;
    RefPtr<DOMException> m_domError;

    RefPtr<IDBOpenDBRequest> m_openDBRequest;
    WeakHashSet<IDBRequest, WeakPtrImplWithEventTargetData> m_cursorRequests;

    Deque<RefPtr<IDBClient::TransactionOperation>> m_pendingTransactionOperationQueue;
    Deque<IDBClient::TransactionOperation*> m_transactionOperationsInProgressQueue;
    Deque<RefPtr<IDBClient::TransactionOperation>> m_abortQueue;
    HashMap<RefPtr<IDBClient::TransactionOperation>, IDBResultData> m_transactionOperationResultMap;
    HashMap<IDBResourceIdentifier, RefPtr<IDBClient::TransactionOperation>> m_transactionOperationMap;

    mutable Lock m_referencedObjectStoreLock;
    HashMap<String, std::unique_ptr<IDBObjectStore>> m_referencedObjectStores WTF_GUARDED_BY_LOCK(m_referencedObjectStoreLock);
    HashMap<IDBObjectStoreIdentifier, std::unique_ptr<IDBObjectStore>> m_deletedObjectStores;

    HashSet<RefPtr<IDBRequest>> m_openRequests;
    RefPtr<IDBRequest> m_currentlyCompletingRequest;

    bool m_isStopped { false };
    bool m_didDispatchAbortOrCommit { false };

    uint64_t m_lastWriteOperationID { 0 };
    std::optional<IDBResourceIdentifier> m_lastTransactionOperationBeforeCommit;
    std::optional<IDBError> m_commitResult;
    uint64_t m_handledRequestResultsCount { 0 };
};

class TransactionActivator {
    WTF_MAKE_NONCOPYABLE(TransactionActivator);
public:
    TransactionActivator(IDBTransaction* transaction)
        : m_transaction(transaction)
    {
        if (transaction)
            transaction->activate();
    }

    ~TransactionActivator()
    {
        if (RefPtr transaction = m_transaction)
            transaction->deactivate();
    }

private:
    RefPtr<IDBTransaction> m_transaction;
};

} // namespace WebCore
