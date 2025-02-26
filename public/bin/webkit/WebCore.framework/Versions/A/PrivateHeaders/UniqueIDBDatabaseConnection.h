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

#include "IDBDatabaseConnectionIdentifier.h"
#include "UniqueIDBDatabase.h"
#include <wtf/HashMap.h>
#include <wtf/Identified.h>
#include <wtf/Ref.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>

namespace WebCore {

class IDBError;
class IDBResultData;
class UniqueIDBDatabaseManager;

namespace IDBServer {

class IDBConnectionToClient;
class ServerOpenDBRequest;
class UniqueIDBDatabase;
class UniqueIDBDatabaseTransaction;

class UniqueIDBDatabaseConnection : public RefCountedAndCanMakeWeakPtr<UniqueIDBDatabaseConnection>, public Identified<IDBDatabaseConnectionIdentifier> {
public:
    static Ref<UniqueIDBDatabaseConnection> create(UniqueIDBDatabase&, ServerOpenDBRequest&);

    WEBCORE_EXPORT ~UniqueIDBDatabaseConnection();

    const IDBResourceIdentifier& openRequestIdentifier() { return m_openRequestIdentifier; }
    UniqueIDBDatabase* database() { return m_database.get(); }
    UniqueIDBDatabaseManager* manager();
    IDBConnectionToClient& connectionToClient() { return m_connectionToClient; }

    WEBCORE_EXPORT void connectionPendingCloseFromClient();
    WEBCORE_EXPORT void connectionClosedFromClient();

    bool closePending() const { return m_closePending; }

    bool hasNonFinishedTransactions() const;

    void fireVersionChangeEvent(const IDBResourceIdentifier& requestIdentifier, uint64_t requestedVersion);
    UniqueIDBDatabaseTransaction& createVersionChangeTransaction(uint64_t newVersion);

    WEBCORE_EXPORT void establishTransaction(const IDBTransactionInfo&);
    void didAbortTransaction(UniqueIDBDatabaseTransaction&, const IDBError&);
    void didCommitTransaction(UniqueIDBDatabaseTransaction&, const IDBError&);
    void didCreateObjectStore(const IDBResultData&);
    void didDeleteObjectStore(const IDBResultData&);
    void didRenameObjectStore(const IDBResultData&);
    void didClearObjectStore(const IDBResultData&);
    void didCreateIndex(const IDBResultData&);
    void didDeleteIndex(const IDBResultData&);
    void didRenameIndex(const IDBResultData&);
    WEBCORE_EXPORT void didFireVersionChangeEvent(const IDBResourceIdentifier& requestIdentifier, IndexedDB::ConnectionClosedOnBehalfOfServer);
    WEBCORE_EXPORT void didFinishHandlingVersionChange(const IDBResourceIdentifier& transactionIdentifier);

    void abortTransactionWithoutCallback(UniqueIDBDatabaseTransaction&);

    bool connectionIsClosing() const;

    void deleteTransaction(UniqueIDBDatabaseTransaction&);

private:
    UniqueIDBDatabaseConnection(UniqueIDBDatabase&, ServerOpenDBRequest&);

    WeakPtr<UniqueIDBDatabase> m_database;
    WeakPtr<UniqueIDBDatabaseManager> m_manager;
    Ref<IDBConnectionToClient> m_connectionToClient;
    IDBResourceIdentifier m_openRequestIdentifier;

    bool m_closePending { false };

    HashMap<IDBResourceIdentifier, RefPtr<UniqueIDBDatabaseTransaction>> m_transactionMap;
};

} // namespace IDBServer
} // namespace WebCore
