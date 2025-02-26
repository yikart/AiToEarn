/*
 * Copyright (C) 2013, 2016 Apple Inc. All rights reserved.
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
#include "IDBResourceIdentifier.h"
#include "IDBTransactionInfo.h"
#include "IndexedDB.h"
#include <wtf/CheckedPtr.h>
#include <wtf/HashMap.h>
#include <wtf/Noncopyable.h>
#include <wtf/RobinHoodHashSet.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IDBCursorInfo;
class SQLiteDatabase;
class SQLiteTransaction;
struct IDBKeyRangeData;

namespace IDBServer {

class SQLiteIDBBackingStore;
class SQLiteIDBCursor;

class SQLiteIDBTransaction : public CanMakeThreadSafeCheckedPtr<SQLiteIDBTransaction> {
    WTF_MAKE_TZONE_ALLOCATED(SQLiteIDBTransaction);
    WTF_MAKE_NONCOPYABLE(SQLiteIDBTransaction);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(SQLiteIDBTransaction);
public:
    SQLiteIDBTransaction(SQLiteIDBBackingStore&, const IDBTransactionInfo&);
    ~SQLiteIDBTransaction();

    const IDBResourceIdentifier& transactionIdentifier() const { return m_info.identifier(); }

    IDBError begin(SQLiteDatabase&);
    IDBError commit();
    IDBError abort();

    std::unique_ptr<SQLiteIDBCursor> maybeOpenBackingStoreCursor(IDBObjectStoreIdentifier, std::optional<IDBIndexIdentifier>, const IDBKeyRangeData&);
    SQLiteIDBCursor* maybeOpenCursor(const IDBCursorInfo&);

    void closeCursor(SQLiteIDBCursor&);
    void notifyCursorsOfChanges(IDBObjectStoreIdentifier);

    IDBTransactionMode mode() const { return m_info.mode(); }
    IDBTransactionDurability durability() const { return m_info.durability(); }
    bool inProgress() const;
    bool inProgressOrReadOnly() const;

    SQLiteDatabase* sqliteDatabase() const;
    SQLiteTransaction* sqliteTransaction() const { return m_sqliteTransaction.get(); }
    SQLiteIDBBackingStore& backingStore() { return m_backingStore.get(); }

    void addBlobFile(const String& temporaryPath, const String& storedFilename);
    void addRemovedBlobFile(const String& removedFilename);

private:
    void clearCursors();
    void reset();

    void moveBlobFilesIfNecessary();
    void deleteBlobFilesIfNecessary();
    bool isReadOnly() const { return mode() == IDBTransactionMode::Readonly; }

    IDBTransactionInfo m_info;

    CheckedRef<SQLiteIDBBackingStore> m_backingStore;
    CheckedPtr<SQLiteDatabase> m_sqliteDatabase;
    std::unique_ptr<SQLiteTransaction> m_sqliteTransaction;
    HashMap<IDBResourceIdentifier, std::unique_ptr<SQLiteIDBCursor>> m_cursors;
    HashSet<SQLiteIDBCursor*> m_backingStoreCursors;
    Vector<std::pair<String, String>> m_blobTemporaryAndStoredFilenames;
    MemoryCompactRobinHoodHashSet<String> m_blobRemovedFilenames;
};

} // namespace IDBServer
} // namespace WebCore
