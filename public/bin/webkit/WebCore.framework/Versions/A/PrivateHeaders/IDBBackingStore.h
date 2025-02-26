/*
 * Copyright (C) 2015-2024 Apple Inc. All rights reserved.
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

#include "IDBDatabaseInfo.h"
#include "IDBError.h"
#include "IDBIndexIdentifier.h"
#include "IDBObjectStoreIdentifier.h"
#include "IndexKey.h"
#include <wtf/CheckedPtr.h>
#include <wtf/MainThread.h>
#include <wtf/TZoneMallocInlines.h>

namespace WebCore {

class IDBCursorInfo;
class IDBGetAllResult;
class IDBGetResult;
class IDBIndexInfo;
class IDBKeyData;
class IDBObjectStoreInfo;
class IDBResourceIdentifier;
class IDBTransactionInfo;
class IDBValue;
class ThreadSafeDataBuffer;

enum class IDBGetRecordDataType : bool;

struct IDBGetAllRecordsData;
struct IDBIterateCursorData;
struct IDBKeyRangeData;

namespace IndexedDB {
enum class IndexRecordType : bool;
}

namespace IDBServer {

class IDBBackingStore : public CanMakeThreadSafeCheckedPtr<IDBBackingStore> {
    WTF_MAKE_TZONE_ALLOCATED(IDBBackingStore);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(IDBBackingStore);
public:
    virtual ~IDBBackingStore() { RELEASE_ASSERT(!isMainThread()); }

    virtual IDBError getOrEstablishDatabaseInfo(IDBDatabaseInfo&) = 0;
    virtual uint64_t databaseVersion() = 0;

    virtual IDBError beginTransaction(const IDBTransactionInfo&) = 0;
    virtual IDBError abortTransaction(const IDBResourceIdentifier& transactionIdentifier) = 0;
    virtual IDBError commitTransaction(const IDBResourceIdentifier& transactionIdentifier) = 0;

    virtual IDBError createObjectStore(const IDBResourceIdentifier& transactionIdentifier, const IDBObjectStoreInfo&) = 0;
    virtual IDBError deleteObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier) = 0;
    virtual IDBError renameObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const String& newName) = 0;
    virtual IDBError clearObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier) = 0;
    virtual IDBError createIndex(const IDBResourceIdentifier& transactionIdentifier, const IDBIndexInfo&) = 0;
    virtual IDBError deleteIndex(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier) = 0;
    virtual IDBError renameIndex(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier, const String& newName) = 0;
    virtual IDBError keyExistsInObjectStore(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyData&, bool& keyExists) = 0;
    virtual IDBError deleteRange(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyRangeData&) = 0;
    virtual IDBError addRecord(const IDBResourceIdentifier& transactionIdentifier, const IDBObjectStoreInfo&, const IDBKeyData&, const IndexIDToIndexKeyMap&, const IDBValue&) = 0;
    virtual IDBError getRecord(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, const IDBKeyRangeData&, IDBGetRecordDataType, IDBGetResult& outValue) = 0;
    virtual IDBError getAllRecords(const IDBResourceIdentifier& transactionIdentifier, const IDBGetAllRecordsData&, IDBGetAllResult& outValue) = 0;
    virtual IDBError getIndexRecord(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, IDBIndexIdentifier, IndexedDB::IndexRecordType, const IDBKeyRangeData&, IDBGetResult& outValue) = 0;
    virtual IDBError getCount(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, std::optional<IDBIndexIdentifier>, const IDBKeyRangeData&, uint64_t& outCount) = 0;
    virtual IDBError generateKeyNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, uint64_t& keyNumber) = 0;
    virtual IDBError revertGeneratedKeyNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, uint64_t keyNumber) = 0;
    virtual IDBError maybeUpdateKeyGeneratorNumber(const IDBResourceIdentifier& transactionIdentifier, IDBObjectStoreIdentifier, double newKeyNumber) = 0;
    virtual IDBError openCursor(const IDBResourceIdentifier& transactionIdentifier, const IDBCursorInfo&, IDBGetResult& outResult) = 0;
    virtual IDBError iterateCursor(const IDBResourceIdentifier& transactionIdentifier, const IDBResourceIdentifier& cursorIdentifier, const IDBIterateCursorData&, IDBGetResult& outResult) = 0;

    virtual IDBObjectStoreInfo* infoForObjectStore(IDBObjectStoreIdentifier) = 0;
    virtual void deleteBackingStore() = 0;

    virtual bool supportsSimultaneousReadWriteTransactions() = 0;
    virtual bool isEphemeral() = 0;
    virtual String fullDatabasePath() const = 0;

    virtual void close() = 0;

    virtual bool hasTransaction(const IDBResourceIdentifier&) const = 0;
    virtual void handleLowMemoryWarning() = 0;

protected:
    IDBBackingStore() { RELEASE_ASSERT(!isMainThread()); }
};

} // namespace IDBServer
} // namespace WebCore
