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

#include "IDBError.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBTransactionInfo.h"
#include <wtf/Deque.h>
#include <wtf/Ref.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>

namespace WebCore {

class IDBCursorInfo;
class IDBDatabaseInfo;
class IDBIndexInfo;
class IDBKeyData;
class IDBObjectStoreInfo;
class IDBRequestData;
class IDBValue;

struct IDBGetAllRecordsData;
struct IDBGetRecordData;
struct IDBIterateCursorData;
struct IDBKeyRangeData;

namespace IDBServer {

class IDBServer;
class UniqueIDBDatabase;
class UniqueIDBDatabaseConnection;

class UniqueIDBDatabaseTransaction : public RefCountedAndCanMakeWeakPtr<UniqueIDBDatabaseTransaction> {
public:
    static Ref<UniqueIDBDatabaseTransaction> create(UniqueIDBDatabaseConnection&, const IDBTransactionInfo&);

    WEBCORE_EXPORT ~UniqueIDBDatabaseTransaction();

    UniqueIDBDatabaseConnection* databaseConnection() const;
    UniqueIDBDatabase* database() const;
    const IDBTransactionInfo& info() const { return m_transactionInfo; }
    WEBCORE_EXPORT bool isVersionChange() const;
    bool isReadOnly() const;

    IDBDatabaseInfo* originalDatabaseInfo() const;

    WEBCORE_EXPORT void abort();
    WEBCORE_EXPORT void abortWithoutCallback();
    bool shouldAbortDueToUnhandledRequestError(uint64_t handledRequestResultsCount) const;
    WEBCORE_EXPORT void commit(uint64_t handledRequestResultsCount);

    WEBCORE_EXPORT void createObjectStore(const IDBRequestData&, const IDBObjectStoreInfo&);
    WEBCORE_EXPORT void deleteObjectStore(const IDBRequestData&, const String& objectStoreName);
    WEBCORE_EXPORT void renameObjectStore(const IDBRequestData&, IDBObjectStoreIdentifier, const String& newName);
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

    void didActivateInBackingStore(const IDBError&);

    const Vector<IDBObjectStoreIdentifier>& objectStoreIdentifiers();

    void setSuspensionAbortResult(const IDBError& error) { m_suspensionAbortResult = { error }; }
    const std::optional<IDBError>& suspensionAbortResult() const { return m_suspensionAbortResult; }

private:
    UniqueIDBDatabaseTransaction(UniqueIDBDatabaseConnection&, const IDBTransactionInfo&);

    WeakPtr<UniqueIDBDatabaseConnection> m_databaseConnection;
    IDBTransactionInfo m_transactionInfo;

    std::unique_ptr<IDBDatabaseInfo> m_originalDatabaseInfo;

    Vector<IDBObjectStoreIdentifier> m_objectStoreIdentifiers;

    std::optional<IDBError> m_suspensionAbortResult;
    Vector<IDBError> m_requestResults;
};

} // namespace IDBServer
} // namespace WebCore
