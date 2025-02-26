/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

#include "ServiceWorkerTypes.h"
#include "ServiceWorkerUpdateViaCache.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ServiceWorkerRegistrationKey;
class SQLiteDatabase;
class SQLiteStatement;
class SQLiteStatementAutoResetScope;
class SWScriptStorage;
struct ServiceWorkerContextData;

class SWRegistrationDatabase {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SWRegistrationDatabase, WEBCORE_EXPORT);
public:
    static constexpr uint64_t schemaVersion = 8;

    WEBCORE_EXPORT SWRegistrationDatabase(const String& path);
    WEBCORE_EXPORT ~SWRegistrationDatabase();
    
    WEBCORE_EXPORT std::optional<Vector<ServiceWorkerContextData>> importRegistrations();
    WEBCORE_EXPORT std::optional<Vector<ServiceWorkerScripts>> updateRegistrations(const Vector<ServiceWorkerContextData>&, const Vector<ServiceWorkerRegistrationKey>&);
    WEBCORE_EXPORT void clearAllRegistrations();
    
private:
    void close();
    SWScriptStorage& scriptStorage();
    enum class StatementType : uint8_t {
        GetAllRecords,
        InsertRecord,
        DeleteRecord,
        Invalid
    };
    ASCIILiteral statementString(StatementType) const;
    SQLiteStatementAutoResetScope cachedStatement(StatementType);
    enum class ShouldCreateIfNotExists : bool { No, Yes };
    bool prepareDatabase(ShouldCreateIfNotExists);
    bool ensureValidRecordsTable();

    String m_directory;
    std::unique_ptr<SQLiteDatabase> m_database;
    Vector<std::unique_ptr<SQLiteStatement>> m_cachedStatements;
    std::unique_ptr<SWScriptStorage> m_scriptStorage;
    
}; // namespace WebCore

struct ImportedScriptAttributes {
    URL responseURL;
    String mimeType;
};

}
