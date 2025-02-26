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

#include "IDBResourceIdentifier.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class IDBError;
class IDBResultData;

struct IDBDatabaseNameAndVersion;

namespace IDBServer {

class UniqueIDBDatabaseConnection;

class IDBConnectionToClientDelegate : public CanMakeThreadSafeCheckedPtr<IDBConnectionToClientDelegate> {
    WTF_MAKE_FAST_ALLOCATED;
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(IDBConnectionToClientDelegate);
public:
    virtual ~IDBConnectionToClientDelegate() = default;
    
    virtual std::optional<IDBConnectionIdentifier> identifier() const = 0;

    virtual void didDeleteDatabase(const IDBResultData&) = 0;
    virtual void didOpenDatabase(const IDBResultData&) = 0;
    virtual void didAbortTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&) = 0;
    virtual void didCommitTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&) = 0;
    virtual void didCreateObjectStore(const IDBResultData&) = 0;
    virtual void didDeleteObjectStore(const IDBResultData&) = 0;
    virtual void didRenameObjectStore(const IDBResultData&) = 0;
    virtual void didClearObjectStore(const IDBResultData&) = 0;
    virtual void didCreateIndex(const IDBResultData&) = 0;
    virtual void didDeleteIndex(const IDBResultData&) = 0;
    virtual void didRenameIndex(const IDBResultData&) = 0;
    virtual void didPutOrAdd(const IDBResultData&) = 0;
    virtual void didGetRecord(const IDBResultData&) = 0;
    virtual void didGetAllRecords(const IDBResultData&) = 0;
    virtual void didGetCount(const IDBResultData&) = 0;
    virtual void didDeleteRecord(const IDBResultData&) = 0;
    virtual void didOpenCursor(const IDBResultData&) = 0;
    virtual void didIterateCursor(const IDBResultData&) = 0;

    virtual void fireVersionChangeEvent(UniqueIDBDatabaseConnection&, const IDBResourceIdentifier& requestIdentifier, uint64_t requestedVersion) = 0;
    virtual void didStartTransaction(const IDBResourceIdentifier& transactionIdentifier, const IDBError&) = 0;
    virtual void didCloseFromServer(UniqueIDBDatabaseConnection&, const IDBError&) = 0;
    virtual void notifyOpenDBRequestBlocked(const IDBResourceIdentifier& requestIdentifier, uint64_t oldVersion, uint64_t newVersion) = 0;

    virtual void didGetAllDatabaseNamesAndVersions(const IDBResourceIdentifier&, Vector<IDBDatabaseNameAndVersion>&&) = 0;
};

} // namespace IDBServer
} // namespace WebCore
