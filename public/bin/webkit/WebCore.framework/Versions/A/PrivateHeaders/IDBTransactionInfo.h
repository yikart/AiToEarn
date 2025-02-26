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

#include "IDBDatabaseInfo.h"
#include "IDBResourceIdentifier.h"
#include "IDBTransactionDurability.h"
#include "IDBTransactionMode.h"
#include "IndexedDB.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>

namespace WebCore {

namespace IDBClient {
class IDBConnectionProxy;
}

namespace IDBServer {
class IDBConnectionToClient;
}

class IDBTransactionInfo {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(IDBTransactionInfo, WEBCORE_EXPORT);
public:
    static IDBTransactionInfo clientTransaction(const IDBClient::IDBConnectionProxy&, const Vector<String>& objectStores, IDBTransactionMode, std::optional<IDBTransactionDurability>);
    static IDBTransactionInfo versionChange(const IDBServer::IDBConnectionToClient&, const IDBDatabaseInfo& originalDatabaseInfo, uint64_t newVersion);

    WEBCORE_EXPORT IDBTransactionInfo(const IDBTransactionInfo&);
    IDBTransactionInfo(IDBTransactionInfo&&) = default;
    IDBTransactionInfo& operator=(IDBTransactionInfo&&) = default;

    enum IsolatedCopyTag { IsolatedCopy };
    IDBTransactionInfo(const IDBTransactionInfo&, IsolatedCopyTag);

    WEBCORE_EXPORT IDBTransactionInfo isolatedCopy() const;

    const IDBResourceIdentifier& identifier() const { return m_identifier; }

    IDBTransactionMode mode() const { return m_mode; }
    IDBTransactionDurability durability() const { return m_durability; }
    uint64_t newVersion() const { return m_newVersion; }

    const Vector<String>& objectStores() const { return m_objectStores; }

    const std::unique_ptr<IDBDatabaseInfo>& originalDatabaseInfo() const { return m_originalDatabaseInfo; }

    IDBTransactionInfo(IDBResourceIdentifier identifier, IDBTransactionMode mode, IDBTransactionDurability durability, uint64_t newVersion, Vector<String>&& objectStores, std::unique_ptr<IDBDatabaseInfo> originalDatabaseInfo)
        : m_identifier(identifier)
        , m_mode(mode)
        , m_durability(durability)
        , m_newVersion(newVersion)
        , m_objectStores(WTFMove(objectStores))
        , m_originalDatabaseInfo(WTFMove(originalDatabaseInfo)) { }

#if !LOG_DISABLED
    String loggingString() const;
#endif

private:
    IDBTransactionInfo(const IDBResourceIdentifier&);

    static void isolatedCopy(const IDBTransactionInfo& source, IDBTransactionInfo& destination);

    IDBResourceIdentifier m_identifier;

    IDBTransactionMode m_mode { IDBTransactionMode::Readonly };
    IDBTransactionDurability m_durability { IDBTransactionDurability::Default };
    uint64_t m_newVersion { 0 };
    Vector<String> m_objectStores;
    std::unique_ptr<IDBDatabaseInfo> m_originalDatabaseInfo;
};

} // namespace WebCore
