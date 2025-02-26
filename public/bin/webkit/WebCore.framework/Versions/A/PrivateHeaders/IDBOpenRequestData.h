/*
 * Copyright (C) 2024 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "IDBDatabaseIdentifier.h"
#include "IDBResourceIdentifier.h"
#include "IndexedDB.h"
#include <wtf/ArgumentCoder.h>

namespace WebCore {

class IDBOpenDBRequest;

class IDBOpenRequestData {
public:
    IDBOpenRequestData(const IDBClient::IDBConnectionProxy&, const IDBOpenDBRequest&);
    IDBOpenRequestData(const IDBOpenRequestData&) = default;
    IDBOpenRequestData(IDBOpenRequestData&&) = default;
    IDBOpenRequestData& operator=(IDBOpenRequestData&&) = default;
    WEBCORE_EXPORT IDBOpenRequestData isolatedCopy() const;

    IDBConnectionIdentifier serverConnectionIdentifier() const { return m_serverConnectionIdentifier; }
    IDBResourceIdentifier requestIdentifier() const { return m_requestIdentifier; }
    IDBDatabaseIdentifier databaseIdentifier() const { return m_databaseIdentifier; }
    uint64_t requestedVersion() const { return m_requestedVersion; }
    bool isOpenRequest() const { return m_requestType == IndexedDB::RequestType::Open; }
    bool isDeleteRequest() const { return m_requestType == IndexedDB::RequestType::Delete; }

private:
    friend struct IPC::ArgumentCoder<IDBOpenRequestData, void>;
    WEBCORE_EXPORT IDBOpenRequestData(IDBConnectionIdentifier, IDBResourceIdentifier, IDBDatabaseIdentifier&&, uint64_t requestedVersion, IndexedDB::RequestType);

    IDBConnectionIdentifier m_serverConnectionIdentifier;
    IDBResourceIdentifier m_requestIdentifier;
    IDBDatabaseIdentifier m_databaseIdentifier;
    uint64_t m_requestedVersion { 0 };
    IndexedDB::RequestType m_requestType { IndexedDB::RequestType::Open };
};

} // namespace WebCore
