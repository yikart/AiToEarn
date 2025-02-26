/*
 * Copyright (C) 2016-2021 Apple Inc. All rights reserved.
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
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBResourceIdentifier.h"
#include "SQLiteIDBTransaction.h"
#include "SQLiteStatementAutoResetScope.h"
#include <JavaScriptCore/Strong.h>
#include <pal/SessionID.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IndexKey;
class SQLiteDatabase;
class SQLiteStatement;

namespace IDBServer {

enum class IsSchemaUpgraded : bool { No, Yes };

class SQLiteIDBCursor;

class SQLiteIDBBackingStore final : public IDBBackingStore {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SQLiteIDBBackingStore, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(SQLiteIDBBackingStore);
public:
    WEBCORE_EXPORT SQLiteIDBBackingStore(const IDBDatabaseIdentifier&, const String& databaseDirectory);
    WEBCORE_EXPORT ~SQLiteIDBBackingStore() final;

    IDBError getOrEstablishDatabaseInfo(IDBDatabaseInfo&) final;
    uint64_t databaseVersion() final;

    IDBError beginTransaction(const IDBTransactionInfo&) final;
    IDBError abortTransaction(const IDBResourceIdentifier& transactionIdentifier) final;
    IDBError commitTransaction(const IDBResourceIdentifier& transactionIdentifier) final;
    IDBError createObjectStore(const IDBResourceIdentifier& transactionIdentifier, const IDBObjectStoreInfo&) final;
    IDBError deleteObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier) final;
    IDBError renameObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const String& newName) final;
    IDBError clearObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier) final;
    IDBError createIndex(const IDBResourceIdentifier& transactionIdentifier, const IDBIndexInfo&) final;
    IDBError deleteIndex(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier) final;
    IDBError renameIndex(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName) final;
    IDBError keyExistsInObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyData&, bool& keyExists) final;
    IDBError deleteRange(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyRangeData&) final;
    IDBError addRecord(const IDBResourceIdentifier& transactionIdentifier, const IDBObjectStoreInfo&, const IDBKeyData&, const IndexIDToIndexKeyMap&, const IDBValue&) final;
    IDBError getRecord(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyRangeData&, IDBGetRecordDataType, IDBGetResult& outValue) final;
    IDBError getAllRecords(const IDBResourceIdentifier& transactionIdentifier, const IDBGetAllRecordsData&, IDBGetAllResult& outValue) final;
    IDBError getIndexRecord(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier, IndexedDB::IndexRecordType, const IDBKeyRangeData&, IDBGetResult& outValue) final;
    IDBError getCount(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, std::optional<IDBIndexIdentifier>, const IDBKeyRangeData&, uint64_t& outCount) final;
    IDBError generateKeyNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, uint64_t& keyNumber) final;
    IDBError revertGeneratedKeyNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, uint64_t keyNumber) final;
    IDBError maybeUpdateKeyGeneratorNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, double newKeyNumber) final;
    IDBError openCursor(const IDBResourceIdentifier& transactionIdentifier, const IDBCursorInfo&, IDBGetResult& outResult) final;
    IDBError iterateCursor(const IDBResourceIdentifier& transactionIdentifier, const IDBResourceIdentifier& cursorIdentifier, const IDBIterateCursorData&, IDBGetResult& outResult) final;

    IDBObjectStoreInfo* infoForObjectStore(IDBObjectStoreIdentifier) final;
    void deleteBackingStore() final;

    bool supportsSimultaneousReadWriteTransactions() final { return false; }
    bool isEphemeral() final { return false; }
    String fullDatabasePath() const final;

    bool hasTransaction(const IDBResourceIdentifier&) const final;

    void unregisterCursor(SQLiteIDBCursor&);

    IDBError getBlobRecordsForObjectStoreRecord(int64_t objectStoreRecord, Vector<String>& blobURLs, Vector<String>& blobFilePaths);

    WEBCORE_EXPORT static uint64_t databasesSizeForDirectory(const String& directory);
    String databaseDirectory() const { return m_databaseDirectory; };
    WEBCORE_EXPORT static String fullDatabasePathForDirectory(const String&);
    WEBCORE_EXPORT static String encodeDatabaseName(const String& databaseName);
    WEBCORE_EXPORT static String decodeDatabaseName(const String& encodedDatabaseName);

    WEBCORE_EXPORT static std::optional<IDBDatabaseNameAndVersion> databaseNameAndVersionFromFile(const String&);
    void handleLowMemoryWarning() final;

private:
    IDBError ensureValidRecordsTable();
    IDBError ensureValidIndexRecordsTable();
    IDBError ensureValidIndexRecordsIndex();
    IDBError ensureValidIndexRecordsRecordIndex();
    IDBError ensureValidBlobTables();
    std::optional<IsSchemaUpgraded> ensureValidObjectStoreInfoTable();
    std::unique_ptr<IDBDatabaseInfo> createAndPopulateInitialDatabaseInfo();
    std::unique_ptr<IDBDatabaseInfo> extractExistingDatabaseInfo();

    IDBError deleteRecord(SQLiteIDBTransaction&, IDBObjectStoreIdentifier, const IDBKeyData&);
    IDBError uncheckedGetKeyGeneratorValue(IDBObjectStoreIdentifier, uint64_t& outValue);
    IDBError uncheckedSetKeyGeneratorValue(IDBObjectStoreIdentifier, uint64_t value);

    IDBError updateAllIndexesForAddRecord(const IDBObjectStoreInfo&, const IDBKeyData&, const IndexIDToIndexKeyMap&, int64_t recordID);
    IDBError updateOneIndexForAddRecord(IDBObjectStoreInfo&, const IDBIndexInfo&, const IDBKeyData&, const ThreadSafeDataBuffer& value, int64_t recordID);
    IDBError uncheckedPutIndexKey(const IDBIndexInfo&, const IDBKeyData& keyValue, const IndexKey&, int64_t recordID);
    IDBError uncheckedPutIndexRecord(IDBObjectStoreIdentifier, IDBIndexIdentifier, const IDBKeyData& keyValue, const IDBKeyData& indexKey, int64_t recordID);
    IDBError uncheckedHasIndexRecord(const IDBIndexInfo&, const IDBKeyData&, bool& hasRecord);
    IDBError uncheckedGetIndexRecordForOneKey(IDBIndexIdentifier, IDBObjectStoreIdentifier, IndexedDB::IndexRecordType, const IDBKeyData&, IDBGetResult&);

    IDBError deleteUnusedBlobFileRecords(SQLiteIDBTransaction&);

    IDBError getAllObjectStoreRecords(const IDBResourceIdentifier& transactionIdentifier, const IDBGetAllRecordsData&, IDBGetAllResult& outValue);
    IDBError getAllIndexRecords(const IDBResourceIdentifier& transactionIdentifier, const IDBGetAllRecordsData&, IDBGetAllResult& outValue);

    void closeSQLiteDB();
    void close() final;

    bool migrateIndexInfoTableForIDUpdate(const HashMap<std::pair<IDBObjectStoreIdentifier, IDBIndexIdentifier>, IDBIndexIdentifier>& indexIDMap);
    bool migrateIndexRecordsTableForIDUpdate(const HashMap<std::pair<IDBObjectStoreIdentifier, IDBIndexIdentifier>, IDBIndexIdentifier>& indexIDMap);

    bool removeExistingIndex(IDBIndexIdentifier);
    bool addExistingIndex(IDBObjectStoreInfo&, const IDBIndexInfo&);
    bool handleDuplicateIndexIDs(const HashMap<IDBIndexIdentifier, Vector<IDBIndexInfo>>&, IDBDatabaseInfo&);

    enum class SQL : size_t {
        CreateObjectStoreInfo,
        CreateObjectStoreKeyGenerator,
        DeleteObjectStoreInfo,
        DeleteObjectStoreKeyGenerator,
        DeleteObjectStoreRecords,
        DeleteObjectStoreIndexInfo,
        DeleteObjectStoreIndexRecords,
        DeleteObjectStoreBlobRecords,
        RenameObjectStore,
        ClearObjectStoreRecords,
        ClearObjectStoreIndexRecords,
        CreateIndexInfo,
        CreateTempIndexInfo,
        DeleteIndexInfo,
        RemoveIndexInfo,
        HasIndexRecord,
        PutIndexRecord,
        PutTempIndexRecord,
        GetIndexRecordForOneKey,
        DeleteIndexRecords,
        RenameIndex,
        KeyExistsInObjectStore,
        GetUnusedBlobFilenames,
        DeleteUnusedBlobs,
        GetObjectStoreRecord,
        DeleteBlobRecord,
        DeleteObjectStoreRecord,
        DeleteObjectStoreIndexRecord,
        AddObjectStoreRecord,
        AddBlobRecord,
        BlobFilenameForBlobURL,
        AddBlobFilename,
        GetBlobURL,
        GetKeyGeneratorValue,
        SetKeyGeneratorValue,
        GetObjectStoreRecords,
        GetAllKeyRecordsLowerOpenUpperOpen,
        GetAllKeyRecordsLowerOpenUpperClosed,
        GetAllKeyRecordsLowerClosedUpperOpen,
        GetAllKeyRecordsLowerClosedUpperClosed,
        GetValueRecordsLowerOpenUpperOpen,
        GetValueRecordsLowerOpenUpperClosed,
        GetValueRecordsLowerClosedUpperOpen,
        GetValueRecordsLowerClosedUpperClosed,
        GetKeyRecordsLowerOpenUpperOpen,
        GetKeyRecordsLowerOpenUpperClosed,
        GetKeyRecordsLowerClosedUpperOpen,
        GetKeyRecordsLowerClosedUpperClosed,
        CountRecordsLowerOpenUpperOpen,
        CountRecordsLowerOpenUpperClosed,
        CountRecordsLowerClosedUpperOpen,
        CountRecordsLowerClosedUpperClosed,
        CountIndexRecordsLowerOpenUpperOpen,
        CountIndexRecordsLowerOpenUpperClosed,
        CountIndexRecordsLowerClosedUpperOpen,
        CountIndexRecordsLowerClosedUpperClosed,
        Invalid,
    };

    SQLiteStatementAutoResetScope cachedStatement(SQL, ASCIILiteral);
    SQLiteStatementAutoResetScope cachedStatementForGetAllObjectStoreRecords(const IDBGetAllRecordsData&);

    std::array<std::unique_ptr<SQLiteStatement>, static_cast<size_t>(SQL::Invalid)> m_cachedStatements;

    IDBDatabaseIdentifier m_identifier;
    std::unique_ptr<IDBDatabaseInfo> m_databaseInfo;
    std::unique_ptr<IDBDatabaseInfo> m_originalDatabaseInfoBeforeVersionChange;

    std::unique_ptr<SQLiteDatabase> m_sqliteDB;

    HashMap<IDBResourceIdentifier, std::unique_ptr<SQLiteIDBTransaction>> m_transactions;
    HashMap<IDBResourceIdentifier, SQLiteIDBCursor*> m_cursors;

    String m_databaseDirectory;
};

} // namespace IDBServer
} // namespace WebCore
