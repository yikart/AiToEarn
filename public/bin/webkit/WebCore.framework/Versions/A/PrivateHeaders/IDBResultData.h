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
#include "IDBDatabaseInfo.h"
#include "IDBError.h"
#include "IDBGetAllResult.h"
#include "IDBGetResult.h"
#include "IDBKeyData.h"
#include "IDBResourceIdentifier.h"
#include "IDBTransactionInfo.h"
#include "ThreadSafeDataBuffer.h"
#include <wtf/ArgumentCoder.h>

namespace WebCore {

class ThreadSafeDataBuffer;

enum class IDBResultType : uint8_t {
    Error,
    OpenDatabaseSuccess,
    OpenDatabaseUpgradeNeeded,
    DeleteDatabaseSuccess,
    CreateObjectStoreSuccess,
    DeleteObjectStoreSuccess,
    ClearObjectStoreSuccess,
    PutOrAddSuccess,
    GetRecordSuccess,
    GetAllRecordsSuccess,
    GetCountSuccess,
    DeleteRecordSuccess,
    CreateIndexSuccess,
    DeleteIndexSuccess,
    OpenCursorSuccess,
    IterateCursorSuccess,
    RenameObjectStoreSuccess,
    RenameIndexSuccess,
};

namespace IDBServer {
class UniqueIDBDatabaseConnection;
class UniqueIDBDatabaseTransaction;
}

class IDBResultData {
public:
    static IDBResultData error(const IDBResourceIdentifier&, const IDBError&);
    static IDBResultData openDatabaseSuccess(const IDBResourceIdentifier&, IDBServer::UniqueIDBDatabaseConnection&);
    static IDBResultData openDatabaseUpgradeNeeded(const IDBResourceIdentifier&, IDBServer::UniqueIDBDatabaseTransaction&, IDBServer::UniqueIDBDatabaseConnection&);
    static IDBResultData deleteDatabaseSuccess(const IDBResourceIdentifier&, const IDBDatabaseInfo&);
    static IDBResultData createObjectStoreSuccess(const IDBResourceIdentifier&);
    static IDBResultData deleteObjectStoreSuccess(const IDBResourceIdentifier&);
    static IDBResultData renameObjectStoreSuccess(const IDBResourceIdentifier&);
    static IDBResultData clearObjectStoreSuccess(const IDBResourceIdentifier&);
    static IDBResultData createIndexSuccess(const IDBResourceIdentifier&);
    static IDBResultData deleteIndexSuccess(const IDBResourceIdentifier&);
    static IDBResultData renameIndexSuccess(const IDBResourceIdentifier&);
    static IDBResultData putOrAddSuccess(const IDBResourceIdentifier&, const IDBKeyData&);
    static IDBResultData getRecordSuccess(const IDBResourceIdentifier&, const IDBGetResult&);
    static IDBResultData getAllRecordsSuccess(const IDBResourceIdentifier&, const IDBGetAllResult&);
    static IDBResultData getCountSuccess(const IDBResourceIdentifier&, uint64_t count);
    static IDBResultData deleteRecordSuccess(const IDBResourceIdentifier&);
    static IDBResultData openCursorSuccess(const IDBResourceIdentifier&, const IDBGetResult&);
    static IDBResultData iterateCursorSuccess(const IDBResourceIdentifier&, const IDBGetResult&);

    WEBCORE_EXPORT IDBResultData(const IDBResultData&);
    IDBResultData(IDBResultData&&) = default;
    IDBResultData& operator=(IDBResultData&&) = default;

    enum IsolatedCopyTag { IsolatedCopy };
    IDBResultData(const IDBResultData&, IsolatedCopyTag);
    WEBCORE_EXPORT IDBResultData isolatedCopy() const;

    IDBResultType type() const { return m_type; }
    IDBResourceIdentifier requestIdentifier() const { return m_requestIdentifier; }

    const IDBError& error() const { return m_error; }
    IDBDatabaseConnectionIdentifier databaseConnectionIdentifier() const { return *m_databaseConnectionIdentifier; }

    const IDBDatabaseInfo& databaseInfo() const;
    const IDBTransactionInfo& transactionInfo() const;

    const IDBKeyData* resultKey() const { return m_resultKey.get(); }
    uint64_t resultInteger() const { return m_resultInteger; }

    WEBCORE_EXPORT const IDBGetResult& getResult() const;
    WEBCORE_EXPORT IDBGetResult& getResultRef();
    WEBCORE_EXPORT const IDBGetAllResult& getAllResult() const;

    WEBCORE_EXPORT IDBResultData();

private:
    friend struct IPC::ArgumentCoder<IDBResultData, void>;

    IDBResultData(const IDBResourceIdentifier&);
    IDBResultData(IDBResultType, const IDBResourceIdentifier&);

    static void isolatedCopy(const IDBResultData& source, IDBResultData& destination);

    IDBResultType m_type { IDBResultType::Error };
    IDBResourceIdentifier m_requestIdentifier;

    IDBError m_error;
    std::optional<IDBDatabaseConnectionIdentifier> m_databaseConnectionIdentifier;
    std::unique_ptr<IDBDatabaseInfo> m_databaseInfo;
    std::unique_ptr<IDBTransactionInfo> m_transactionInfo;
    std::unique_ptr<IDBKeyData> m_resultKey;
    std::unique_ptr<IDBGetResult> m_getResult;
    std::unique_ptr<IDBGetAllResult> m_getAllResult;
    uint64_t m_resultInteger { 0 };
};

} // namespace WebCore

