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

#include "IDBDatabaseConnectionIdentifier.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBResourceIdentifier.h"
#include <wtf/WeakPtr.h>
#include <wtf/text/WTFString.h>

namespace WebCore {
namespace IDBClient {
class IDBConnectionToServerDelegate;
}
}

namespace WTF {
template<typename T> struct IsDeprecatedWeakRefSmartPointerException;
template<> struct IsDeprecatedWeakRefSmartPointerException<WebCore::IDBClient::IDBConnectionToServerDelegate> : std::true_type { };
}

namespace WebCore {

class IDBCursorInfo;
class IDBIndexInfo;
class IDBKeyData;
class IDBObjectStoreInfo;
class IDBOpenRequestData;
class IDBRequestData;
class IDBTransactionInfo;
class IDBValue;

struct ClientOrigin;
struct IDBGetAllRecordsData;
struct IDBGetRecordData;
struct IDBIterateCursorData;
class SecurityOriginData;

namespace IndexedDB {
enum class ObjectStoreOverwriteMode : uint8_t;
enum class ConnectionClosedOnBehalfOfServer : bool;
}

struct IDBKeyRangeData;

namespace IDBClient {

class IDBConnectionToServerDelegate : public CanMakeWeakPtr<IDBConnectionToServerDelegate> {
public:
    virtual ~IDBConnectionToServerDelegate() = default;

    virtual std::optional<IDBConnectionIdentifier> identifier() const = 0;
    virtual void deleteDatabase(const IDBOpenRequestData&) = 0;
    virtual void openDatabase(const IDBOpenRequestData&) = 0;
    virtual void abortTransaction(const IDBResourceIdentifier&) = 0;
    virtual void commitTransaction(const IDBResourceIdentifier&, uint64_t handledRequestResultsCount) = 0;
    virtual void didFinishHandlingVersionChangeTransaction(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier&) = 0;
    virtual void createObjectStore(const IDBRequestData&, const IDBObjectStoreInfo&) = 0;
    virtual void deleteObjectStore(const IDBRequestData&, const String& objectStoreName) = 0;
    virtual void renameObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier, const String& newName) = 0;
    virtual void clearObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier) = 0;
    virtual void createIndex(const IDBRequestData&, const IDBIndexInfo&) = 0;
    virtual void deleteIndex(const IDBRequestData&, IDBObjectStoreIdentifier, const String& indexName) = 0;
    virtual void renameIndex(const IDBRequestData&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName) = 0;
    virtual void putOrAdd(const IDBRequestData&, const IDBKeyData&, const IDBValue&, const IndexedDB::ObjectStoreOverwriteMode) = 0;
    virtual void getRecord(const IDBRequestData&, const IDBGetRecordData&) = 0;
    virtual void getAllRecords(const IDBRequestData&, const IDBGetAllRecordsData&) = 0;
    virtual void getCount(const IDBRequestData&, const IDBKeyRangeData&) = 0;
    virtual void deleteRecord(const IDBRequestData&, const IDBKeyRangeData&) = 0;
    virtual void openCursor(const IDBRequestData&, const IDBCursorInfo&) = 0;
    virtual void iterateCursor(const IDBRequestData&, const IDBIterateCursorData&) = 0;

    virtual void establishTransaction(IDBDatabaseConnectionIdentifier, const IDBTransactionInfo&) = 0;
    virtual void databaseConnectionPendingClose(IDBDatabaseConnectionIdentifier) = 0;
    virtual void databaseConnectionClosed(IDBDatabaseConnectionIdentifier) = 0;
    virtual void abortOpenAndUpgradeNeeded(IDBDatabaseConnectionIdentifier, const std::optional<IDBResourceIdentifier>& transactionIdentifier) = 0;
    virtual void didFireVersionChangeEvent(IDBDatabaseConnectionIdentifier, const IDBResourceIdentifier& requestIdentifier, const IndexedDB::ConnectionClosedOnBehalfOfServer) = 0;
    virtual void openDBRequestCancelled(const IDBOpenRequestData&) = 0;

    virtual void getAllDatabaseNamesAndVersions(const IDBResourceIdentifier&, const ClientOrigin&) = 0;
};

} // namespace IDBClient
} // namespace WebCore
