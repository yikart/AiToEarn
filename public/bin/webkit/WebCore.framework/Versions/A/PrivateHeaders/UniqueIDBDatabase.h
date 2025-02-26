/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

#include "IDBBackingStore.h"
#include "IDBDatabaseIdentifier.h"
#include "IDBDatabaseInfo.h"
#include "IDBDatabaseNameAndVersion.h"
#include "IDBGetResult.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "ServerOpenDBRequest.h"
#include "UniqueIDBDatabaseTransaction.h"
#include <wtf/Deque.h>
#include <wtf/Function.h>
#include <wtf/HashCountedSet.h>
#include <wtf/HashSet.h>
#include <wtf/ListHashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace IDBServer {
class UniqueIDBDatabase;
}
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::IDBServer::UniqueIDBDatabase> : std::true_type { };
}

namespace WebCore {

struct ClientOrigin;
class IDBError;
class IDBGetAllResult;
struct IDBGetRecordData;
class IDBRequestData;
class IDBTransactionInfo;

enum class IDBGetRecordDataType : bool;

namespace IndexedDB {
enum class IndexRecordType : bool;
}

namespace IDBServer {

class IDBConnectionToClient;
class UniqueIDBDatabaseConnection;
class UniqueIDBDatabaseManager;

using ErrorCallback = Function<void(const IDBError&)>;
using KeyDataCallback = Function<void(const IDBError&, const IDBKeyData&)>;
using GetResultCallback = Function<void(const IDBError&, const IDBGetResult&)>;
using GetAllResultsCallback = Function<void(const IDBError&, const IDBGetAllResult&)>;
using CountCallback = Function<void(const IDBError&, uint64_t)>;

class UniqueIDBDatabase : public CanMakeWeakPtr<UniqueIDBDatabase> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(UniqueIDBDatabase, WEBCORE_EXPORT);
public:
    WEBCORE_EXPORT UniqueIDBDatabase(UniqueIDBDatabaseManager&, const IDBDatabaseIdentifier&);
    UniqueIDBDatabase(UniqueIDBDatabase&) = delete;
    WEBCORE_EXPORT ~UniqueIDBDatabase();

    WEBCORE_EXPORT void openDatabaseConnection(IDBConnectionToClient&, const IDBOpenRequestData&);

    const IDBDatabaseInfo& info() const;
    UniqueIDBDatabaseManager* manager();
    const IDBDatabaseIdentifier& identifier() const { return m_identifier; }

    enum class SpaceCheckResult : uint8_t {
        Unknown,
        Pass,
        Fail
    };
    void createObjectStore(UniqueIDBDatabaseTransaction&, const IDBObjectStoreInfo&, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void deleteObjectStore(UniqueIDBDatabaseTransaction&, const String& objectStoreName, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void renameObjectStore(UniqueIDBDatabaseTransaction&, IDBObjectStoreIdentifier, const String& newName, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void clearObjectStore(UniqueIDBDatabaseTransaction&, IDBObjectStoreIdentifier, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void createIndex(UniqueIDBDatabaseTransaction&, const IDBIndexInfo&, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void deleteIndex(UniqueIDBDatabaseTransaction&, IDBObjectStoreIdentifier, const String& indexName, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void renameIndex(UniqueIDBDatabaseTransaction&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void putOrAdd(const IDBRequestData&, const IDBKeyData&, const IDBValue&, IndexedDB::ObjectStoreOverwriteMode, KeyDataCallback&&);
    void putOrAddAfterSpaceCheck(const IDBRequestData&, const IDBKeyData&, const IDBValue&, IndexedDB::ObjectStoreOverwriteMode, KeyDataCallback&&, bool isKeyGenerated, const IndexIDToIndexKeyMap&, const IDBObjectStoreInfo&, SpaceCheckResult);
    void getRecord(const IDBRequestData&, const IDBGetRecordData&, GetResultCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void getAllRecords(const IDBRequestData&, const IDBGetAllRecordsData&, GetAllResultsCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void getCount(const IDBRequestData&, const IDBKeyRangeData&, CountCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void deleteRecord(const IDBRequestData&, const IDBKeyRangeData&, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void openCursor(const IDBRequestData&, const IDBCursorInfo&, GetResultCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void iterateCursor(const IDBRequestData&, const IDBIterateCursorData&, GetResultCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void commitTransaction(UniqueIDBDatabaseTransaction&, uint64_t handledRequestResultsCount, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);
    void abortTransaction(UniqueIDBDatabaseTransaction&, ErrorCallback&&, SpaceCheckResult = SpaceCheckResult::Unknown);

    void didFinishHandlingVersionChange(UniqueIDBDatabaseConnection&, const IDBResourceIdentifier& transactionIdentifier);
    void connectionClosedFromClient(UniqueIDBDatabaseConnection&);
    void didFireVersionChangeEvent(UniqueIDBDatabaseConnection&, const IDBResourceIdentifier& requestIdentifier, IndexedDB::ConnectionClosedOnBehalfOfServer);
    WEBCORE_EXPORT void openDBRequestCancelled(const IDBResourceIdentifier& requestIdentifier);

    void enqueueTransaction(Ref<UniqueIDBDatabaseTransaction>&&);

    WEBCORE_EXPORT void handleDelete(IDBConnectionToClient&, const IDBOpenRequestData&);
    WEBCORE_EXPORT void immediateClose();

    bool hasActiveTransactions() const;
    WEBCORE_EXPORT void abortActiveTransactions();
    WEBCORE_EXPORT bool tryClose();

    WEBCORE_EXPORT String filePath() const;
    WEBCORE_EXPORT std::optional<IDBDatabaseNameAndVersion> nameAndVersion() const;
    WEBCORE_EXPORT bool hasDataInMemory() const;
    WEBCORE_EXPORT void handleLowMemoryWarning();

private:
    void handleDatabaseOperations();
    void handleCurrentOperation();
    void performCurrentOpenOperation();
    void performCurrentOpenOperationAfterSpaceCheck(bool isGranted);
    void performCurrentDeleteOperation();
    RefPtr<ServerOpenDBRequest> takeNextRunnableRequest();
    void addOpenDatabaseConnection(Ref<UniqueIDBDatabaseConnection>&&);
    bool hasAnyOpenConnections() const;
    bool allConnectionsAreClosedOrClosing() const;

    void startVersionChangeTransaction();
    void maybeNotifyConnectionsOfVersionChange();
    void notifyCurrentRequestConnectionClosedOrFiredVersionChangeEvent(IDBDatabaseConnectionIdentifier);

    void handleTransactions();
    RefPtr<UniqueIDBDatabaseTransaction> takeNextRunnableTransaction(bool& hadDeferredTransactions);

    void activateTransactionInBackingStore(UniqueIDBDatabaseTransaction&);
    void transactionCompleted(RefPtr<UniqueIDBDatabaseTransaction>&&);

    void connectionClosedFromServer(UniqueIDBDatabaseConnection&);
    void deleteBackingStore();
    void didDeleteBackingStore(uint64_t deletedVersion);
    void close();

    void clearStalePendingOpenDBRequests();

    void clearTransactionsOnConnection(UniqueIDBDatabaseConnection&);

    WeakPtr<UniqueIDBDatabaseManager> m_manager;
    IDBDatabaseIdentifier m_identifier;

    ListHashSet<RefPtr<ServerOpenDBRequest>> m_pendingOpenDBRequests;
    RefPtr<ServerOpenDBRequest> m_currentOpenDBRequest;
    HashSet<IDBResourceIdentifier> m_openDBRequestsForSpaceCheck;

    ListHashSet<RefPtr<UniqueIDBDatabaseConnection>> m_openDatabaseConnections;

    RefPtr<UniqueIDBDatabaseConnection> m_versionChangeDatabaseConnection;
    RefPtr<UniqueIDBDatabaseTransaction> m_versionChangeTransaction;

    std::unique_ptr<IDBBackingStore> m_backingStore;
    std::unique_ptr<IDBDatabaseInfo> m_databaseInfo;
    std::unique_ptr<IDBDatabaseInfo> m_mostRecentDeletedDatabaseInfo;

    Deque<RefPtr<UniqueIDBDatabaseTransaction>> m_pendingTransactions;
    HashMap<IDBResourceIdentifier, RefPtr<UniqueIDBDatabaseTransaction>> m_inProgressTransactions;

    // The keys into these sets are the object store ID.
    // These sets help to decide which transactions can be started and which must be deferred.
    HashCountedSet<IDBObjectStoreIdentifier> m_objectStoreTransactionCounts;
    HashSet<IDBObjectStoreIdentifier> m_objectStoreWriteTransactions;
};

} // namespace IDBServer
} // namespace WebCore
