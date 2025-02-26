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

#include "IDBConnectionToClientDelegate.h"
#include <wtf/HashSet.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class IDBError;
class IDBResourceIdentifier;
class IDBResultData;

struct IDBDatabaseNameAndVersion;

namespace IDBServer {

class UniqueIDBDatabaseConnection;

class IDBConnectionToClient : public RefCounted<IDBConnectionToClient> {
public:
    WEBCORE_EXPORT static Ref<IDBConnectionToClient> create(IDBConnectionToClientDelegate&);

    IDBConnectionIdentifier identifier() const;

    void didDeleteDatabase(const IDBResultData&);
    void didOpenDatabase(const IDBResultData&);
    void didAbortTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);
    void didCommitTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);
    void didCreateObjectStore(const IDBResultData&);
    void didDeleteObjectStore(const IDBResultData&);
    void didRenameObjectStore(const IDBResultData&);
    void didClearObjectStore(const IDBResultData&);
    void didCreateIndex(const IDBResultData&);
    void didDeleteIndex(const IDBResultData&);
    void didRenameIndex(const IDBResultData&);
    void didPutOrAdd(const IDBResultData&);
    void didGetRecord(const IDBResultData&);
    void didGetAllRecords(const IDBResultData&);
    void didGetCount(const IDBResultData&);
    void didDeleteRecord(const IDBResultData&);
    void didOpenCursor(const IDBResultData&);
    void didIterateCursor(const IDBResultData&);

    void fireVersionChangeEvent(UniqueIDBDatabaseConnection&, const IDBResourceIdentifier& requestIdentifier, uint64_t requestedVersion);
    void didStartTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&);
    void didCloseFromServer(UniqueIDBDatabaseConnection&, const IDBError&);

    void notifyOpenDBRequestBlocked(const IDBResourceIdentifier& requestIdentifier, uint64_t oldVersion, uint64_t newVersion);

    WEBCORE_EXPORT void didGetAllDatabaseNamesAndVersions(const IDBResourceIdentifier&, Vector<IDBDatabaseNameAndVersion>&&);

    void registerDatabaseConnection(UniqueIDBDatabaseConnection&);
    void unregisterDatabaseConnection(UniqueIDBDatabaseConnection&);
    WEBCORE_EXPORT void connectionToClientClosed();
    bool isClosed() { return m_isClosed; }
    void clearDelegate() { m_delegate = nullptr; }

private:
    IDBConnectionToClient(IDBConnectionToClientDelegate&);
    
    CheckedPtr<IDBConnectionToClientDelegate> m_delegate;
    HashSet<UniqueIDBDatabaseConnection*> m_databaseConnections;
    bool m_isClosed { false };
};

} // namespace IDBServer
} // namespace WebCore
