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

#include "IDBBackingStore.h"
#include "IDBDatabaseIdentifier.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBResourceIdentifier.h"
#include "IndexKey.h"
#include "MemoryBackingStoreTransaction.h"
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {
namespace IDBServer {

class MemoryObjectStore;

class MemoryIDBBackingStore final : public IDBBackingStore {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(MemoryIDBBackingStore, WEBCORE_EXPORT);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(MemoryIDBBackingStore);
public:
    WEBCORE_EXPORT explicit MemoryIDBBackingStore(const IDBDatabaseIdentifier&);
    WEBCORE_EXPORT ~MemoryIDBBackingStore();

    IDBError getOrEstablishDatabaseInfo(IDBDatabaseInfo&) final;
    uint64_t databaseVersion() final;
    void setDatabaseInfo(const IDBDatabaseInfo&);
    bool hasObjectStore(IDBObjectStoreIdentifier objectStoreIdentifier) { return !!infoForObjectStore(objectStoreIdentifier); }

    void renameObjectStoreForVersionChangeAbort(MemoryObjectStore&, const String& oldName);
    void removeObjectStoreForVersionChangeAbort(MemoryObjectStore&);
    void restoreObjectStoreForVersionChangeAbort(Ref<MemoryObjectStore>&&);
    void handleLowMemoryWarning() final { };

private:
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

    bool supportsSimultaneousReadWriteTransactions() final { return true; }
    bool isEphemeral() final { return true; }
    String fullDatabasePath() const final { return nullString(); }

    bool hasTransaction(const IDBResourceIdentifier& identifier) const final { return m_transactions.contains(identifier); }

    RefPtr<MemoryObjectStore> takeObjectStoreByIdentifier(IDBObjectStoreIdentifier);

    void close() final;

    void registerObjectStore(Ref<MemoryObjectStore>&&);
    void unregisterObjectStore(MemoryObjectStore&);

    IDBDatabaseIdentifier m_identifier;
    std::unique_ptr<IDBDatabaseInfo> m_databaseInfo;

    HashMap<IDBResourceIdentifier, std::unique_ptr<MemoryBackingStoreTransaction>> m_transactions;

    HashMap<IDBObjectStoreIdentifier, RefPtr<MemoryObjectStore>> m_objectStoresByIdentifier;
    HashMap<String, RefPtr<MemoryObjectStore>> m_objectStoresByName;
};

} // namespace IDBServer
} // namespace WebCore
