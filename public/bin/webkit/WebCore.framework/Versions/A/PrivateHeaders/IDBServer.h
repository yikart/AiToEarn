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

#include "IDBConnectionToClient.h"
#include "IDBDatabaseIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "UniqueIDBDatabase.h"
#include "UniqueIDBDatabaseConnection.h"
#include "UniqueIDBDatabaseManager.h"
#include <pal/HysteresisActivity.h>
#include <pal/SessionID.h>
#include <wtf/CrossThreadTaskHandler.h>
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IDBCursorInfo;
class IDBRequestData;
class IDBValue;

struct IDBGetRecordData;

namespace IDBServer {

class IDBServer : public UniqueIDBDatabaseManager {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(IDBServer, WEBCORE_EXPORT);
public:
    using SpaceRequester = Function<bool(const ClientOrigin&, uint64_t spaceRequested)>;
    WEBCORE_EXPORT IDBServer(const String& databaseDirectoryPath, SpaceRequester&&, Lock&);
    WEBCORE_EXPORT ~IDBServer();

    WEBCORE_EXPORT void registerConnection(IDBConnectionToClient&);
    WEBCORE_EXPORT void unregisterConnection(IDBConnectionToClient&);

    // Operations requested by the client.
    WEBCORE_EXPORT void openDatabase(const IDBOpenRequestData&);
    WEBCORE_EXPORT void deleteDatabase(const IDBOpenRequestData&);
    WEBCORE_EXPORT void abortTransaction(const IDBResourceIdentifier&);
    WEBCORE_EXPORT void commitTransaction(const IDBResourceIdentifier&, uint64_t handledRequestResultsCount);
    WEBCORE_EXPORT void didFinishHandlingVersionChangeTransaction(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier&);
    WEBCORE_EXPORT void createObjectStore(const IDBRequestData&, const IDBObjectStoreInfo&);
    WEBCORE_EXPORT void renameObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier, const String& newName);
    WEBCORE_EXPORT void deleteObjectStore(const IDBRequestData&, const String& objectStoreName);
    WEBCORE_EXPORT void clearObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier);
    WEBCORE_EXPORT void createIndex(const IDBRequestData&, const IDBIndexInfo&);
    WEBCORE_EXPORT void deleteIndex(const IDBRequestData&, IDBObjectStoreIdentifier, const String& indexName);
    WEBCORE_EXPORT void renameIndex(const IDBRequestData&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName);
    WEBCORE_EXPORT void putOrAdd(const IDBRequestData&, const IDBKeyData&, const IDBValue&, IndexedDB::ObjectStoreOverwriteMode);
    WEBCORE_EXPORT void getRecord(const IDBRequestData&, const IDBGetRecordData&);
    WEBCORE_EXPORT void getAllRecords(const IDBRequestData&, const IDBGetAllRecordsData&);
    WEBCORE_EXPORT void getCount(const IDBRequestData&, const IDBKeyRangeData&);
    WEBCORE_EXPORT void deleteRecord(const IDBRequestData&, const IDBKeyRangeData&);
    WEBCORE_EXPORT void openCursor(const IDBRequestData&, const IDBCursorInfo&);
    WEBCORE_EXPORT void iterateCursor(const IDBRequestData&, const IDBIterateCursorData&);

    WEBCORE_EXPORT void establishTransaction(IDBDatabaseConnectionIdentifier, const IDBTransactionInfo&);
    WEBCORE_EXPORT void databaseConnectionPendingClose(IDBDatabaseConnectionIdentifier);
    WEBCORE_EXPORT void databaseConnectionClosed(IDBDatabaseConnectionIdentifier);
    WEBCORE_EXPORT void abortOpenAndUpgradeNeeded(IDBDatabaseConnectionIdentifier, const std::optional<IDBResourceIdentifier>& transactionIdentifier);
    WEBCORE_EXPORT void didFireVersionChangeEvent(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier& requestIdentifier, IndexedDB::ConnectionClosedOnBehalfOfServer);
    WEBCORE_EXPORT void openDBRequestCancelled(const IDBOpenRequestData&);

    WEBCORE_EXPORT void getAllDatabaseNamesAndVersions(IDBConnectionIdentifier, const IDBResourceIdentifier&, const ClientOrigin&);

    // UniqueIDBDatabaseManager
    void registerConnection(UniqueIDBDatabaseConnection&) final;
    void unregisterConnection(UniqueIDBDatabaseConnection&) final;
    void registerTransaction(UniqueIDBDatabaseTransaction&) final;
    void unregisterTransaction(UniqueIDBDatabaseTransaction&) final;
    std::unique_ptr<IDBBackingStore> createBackingStore(const IDBDatabaseIdentifier&) final;
    void requestSpace(const ClientOrigin&, uint64_t size, CompletionHandler<void(bool)>&&) final;

    WEBCORE_EXPORT HashSet<SecurityOriginData> getOrigins() const;
    WEBCORE_EXPORT void closeAndDeleteDatabasesModifiedSince(WallTime);
    WEBCORE_EXPORT void closeAndDeleteDatabasesForOrigins(const Vector<SecurityOriginData>&);
    void closeDatabasesForOrigins(const Vector<SecurityOriginData>&, Function<bool(const SecurityOriginData&, const ClientOrigin&)>&&);
    WEBCORE_EXPORT void renameOrigin(const WebCore::SecurityOriginData&, const WebCore::SecurityOriginData&);

    WEBCORE_EXPORT static uint64_t diskUsage(const String& rootDirectory, const ClientOrigin&);

private:
    UniqueIDBDatabase& getOrCreateUniqueIDBDatabase(const IDBDatabaseIdentifier&);
    UniqueIDBDatabaseTransaction* idbTransaction(const IDBRequestData&) const;

    void upgradeFilesIfNecessary();
    String upgradedDatabaseDirectory(const WebCore::IDBDatabaseIdentifier&);
    void removeDatabasesModifiedSinceForVersion(WallTime, const String&);
    void removeDatabasesWithOriginsForVersion(const Vector<SecurityOriginData>&, const String&);

    HashMap<IDBConnectionIdentifier, RefPtr<IDBConnectionToClient>> m_connectionMap;
    HashMap<IDBDatabaseIdentifier, std::unique_ptr<UniqueIDBDatabase>> m_uniqueIDBDatabaseMap;

    HashMap<IDBDatabaseConnectionIdentifier, UniqueIDBDatabaseConnection*> m_databaseConnections;
    HashMap<IDBResourceIdentifier, UniqueIDBDatabaseTransaction*> m_transactions;

    HashMap<uint64_t, Function<void ()>> m_deleteDatabaseCompletionHandlers;

    String m_databaseDirectoryPath;

    SpaceRequester m_spaceRequester;

    Lock& m_lock;
};

} // namespace IDBServer
} // namespace WebCore
