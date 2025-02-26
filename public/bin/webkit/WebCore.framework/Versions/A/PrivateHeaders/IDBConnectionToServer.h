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

#include "IDBConnectionProxy.h"
#include "IDBConnectionToServerDelegate.h"
#include "IDBDatabaseConnectionIdentifier.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBResourceIdentifier.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Function.h>
#include <wtf/Ref.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

namespace WebCore {

class IDBCursorInfo;
class IDBDatabase;
class IDBError;
class IDBObjectStoreInfo;
class IDBOpenRequestData;
class IDBResultData;
class IDBValue;
class SecurityOrigin;

struct ClientOrigin;
struct IDBDatabaseNameAndVersion;
struct IDBGetAllRecordsData;
struct IDBGetRecordData;
struct IDBIterateCursorData;

namespace IDBClient {

class IDBConnectionToServer final : public ThreadSafeRefCounted<IDBConnectionToServer>, public CanMakeThreadSafeCheckedPtr<IDBConnectionToServer> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(IDBConnectionToServer, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(IDBConnectionToServer);
public:
    WEBCORE_EXPORT static Ref<IDBConnectionToServer> create(IDBConnectionToServerDelegate&);
    WEBCORE_EXPORT ~IDBConnectionToServer();

    WEBCORE_EXPORT IDBConnectionIdentifier identifier() const;

    IDBConnectionProxy& proxy();

    void deleteDatabase(const IDBOpenRequestData&);
    WEBCORE_EXPORT void didDeleteDatabase(const IDBResultData&);

    void openDatabase(const IDBOpenRequestData&);
    WEBCORE_EXPORT void didOpenDatabase(const IDBResultData&);

    void createObjectStore(const IDBRequestData&, const IDBObjectStoreInfo&);
    WEBCORE_EXPORT void didCreateObjectStore(const IDBResultData&);

    void deleteObjectStore(const IDBRequestData&, const String& objectStoreName);
    WEBCORE_EXPORT void didDeleteObjectStore(const IDBResultData&);

    void renameObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier, const String& newName);
    WEBCORE_EXPORT void didRenameObjectStore(const IDBResultData&);

    void clearObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier);
    WEBCORE_EXPORT void didClearObjectStore(const IDBResultData&);

    void createIndex(const IDBRequestData&, const IDBIndexInfo&);
    WEBCORE_EXPORT void didCreateIndex(const IDBResultData&);

    void deleteIndex(const IDBRequestData&, IDBObjectStoreIdentifier, const String& indexName);
    WEBCORE_EXPORT void didDeleteIndex(const IDBResultData&);

    void renameIndex(const IDBRequestData&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName);
    WEBCORE_EXPORT void didRenameIndex(const IDBResultData&);

    void putOrAdd(const IDBRequestData&, const IDBKeyData&, const IDBValue&, const IndexedDB::ObjectStoreOverwriteMode);
    WEBCORE_EXPORT void didPutOrAdd(const IDBResultData&);

    void getRecord(const IDBRequestData&, const IDBGetRecordData&);
    WEBCORE_EXPORT void didGetRecord(const IDBResultData&);

    void getAllRecords(const IDBRequestData&, const IDBGetAllRecordsData&);
    WEBCORE_EXPORT void didGetAllRecords(const IDBResultData&);

    void getCount(const IDBRequestData&, const IDBKeyRangeData&);
    WEBCORE_EXPORT void didGetCount(const IDBResultData&);

    void deleteRecord(const IDBRequestData&, const IDBKeyRangeData&);
    WEBCORE_EXPORT void didDeleteRecord(const IDBResultData&);

    void openCursor(const IDBRequestData&, const IDBCursorInfo&);
    WEBCORE_EXPORT void didOpenCursor(const IDBResultData&);

    void iterateCursor(const IDBRequestData&, const IDBIterateCursorData&);
    WEBCORE_EXPORT void didIterateCursor(const IDBResultData&);

    void commitTransaction(const IDBResourceIdentifier& transactionIdentifier, uint64_t handledRequestResultsCount);
    WEBCORE_EXPORT void didCommitTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);

    void didFinishHandlingVersionChangeTransaction(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier&);

    void abortTransaction(const IDBResourceIdentifier& transactionIdentifier);
    WEBCORE_EXPORT void didAbortTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);

    WEBCORE_EXPORT void fireVersionChangeEvent(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier& requestIdentifier, uint64_t requestedVersion);
    void didFireVersionChangeEvent(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier& requestIdentifier, IndexedDB::ConnectionClosedOnBehalfOfServer);

    WEBCORE_EXPORT void didStartTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);

    WEBCORE_EXPORT void didCloseFromServer(IDBDatabaseConnectionIdentifier, const IDBError&);

    WEBCORE_EXPORT void connectionToServerLost(const IDBError&);

    WEBCORE_EXPORT void notifyOpenDBRequestBlocked(const IDBResourceIdentifier& requestIdentifier, uint64_t oldVersion, uint64_t newVersion);
    void openDBRequestCancelled(const IDBOpenRequestData&);

    void establishTransaction(IDBDatabaseConnectionIdentifier, const IDBTransactionInfo&);

    void databaseConnectionPendingClose(IDBDatabaseConnectionIdentifier);
    void databaseConnectionClosed(IDBDatabaseConnectionIdentifier);

    // To be used when an IDBOpenDBRequest gets a new database connection, optionally with a
    // versionchange transaction, but the page is already torn down.
    void abortOpenAndUpgradeNeeded(IDBDatabaseConnectionIdentifier, const std::optional<IDBResourceIdentifier>& transactionIdentifier);

    void getAllDatabaseNamesAndVersions(const IDBResourceIdentifier&, const ClientOrigin&);
    WEBCORE_EXPORT void didGetAllDatabaseNamesAndVersions(const IDBResourceIdentifier&, Vector<IDBDatabaseNameAndVersion>&&);

private:
    IDBConnectionToServer(IDBConnectionToServerDelegate&);

    typedef void (IDBConnectionToServer::*ResultFunction)(const IDBResultData&);
    void callResultFunctionWithErrorLater(ResultFunction, const IDBResourceIdentifier& requestIdentifier);

    WeakPtr<IDBConnectionToServerDelegate> m_delegate;
    bool m_serverConnectionIsValid { true };

    std::unique_ptr<IDBConnectionProxy> m_proxy;
};

} // namespace IDBClient
} // namespace WebCore
