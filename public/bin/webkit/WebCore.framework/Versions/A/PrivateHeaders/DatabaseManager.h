/*
 * Copyright (C) 2012 Apple Inc. All rights reserved.
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

#include "DatabaseDetails.h"
#include "ExceptionOr.h"
#include <wtf/Assertions.h>
#include <wtf/HashSet.h>
#include <wtf/Lock.h>

namespace WebCore {

class Database;
class DatabaseCallback;
class DatabaseContext;
class DatabaseManagerClient;
class DatabaseTaskSynchronizer;
class Document;
class Exception;
class SecurityOrigin;
class SecurityOriginData;

class DatabaseManager {
    WTF_MAKE_NONCOPYABLE(DatabaseManager);
    friend class WTF::NeverDestroyed<DatabaseManager>;
public:
    WEBCORE_EXPORT static DatabaseManager& singleton();

    WEBCORE_EXPORT void initialize(const String& databasePath);
    WEBCORE_EXPORT void setClient(DatabaseManagerClient*);

    bool isAvailable();
    WEBCORE_EXPORT void setIsAvailable(bool);

    // This gets a DatabaseContext for the specified Document.
    // If one doesn't already exist, it will create a new one.
    Ref<DatabaseContext> databaseContext(Document&);

    ExceptionOr<Ref<Database>> openDatabase(Document&, const String& name, const String& expectedVersion, const String& displayName, unsigned estimatedSize, RefPtr<DatabaseCallback>&&);

    WEBCORE_EXPORT bool hasOpenDatabases(Document&);
    void stopDatabases(Document&, DatabaseTaskSynchronizer*);

    WEBCORE_EXPORT String fullPathForDatabase(SecurityOrigin&, const String& name, bool createIfDoesNotExist = true);

    WEBCORE_EXPORT DatabaseDetails detailsForNameAndOrigin(const String&, SecurityOrigin&);

private:
    DatabaseManager() = default;
    ~DatabaseManager() = delete;

    void platformInitialize(const String& databasePath);

    enum OpenAttempt { FirstTryToOpenDatabase, RetryOpenDatabase };
    ExceptionOr<Ref<Database>> openDatabaseBackend(Document&, const String& name, const String& expectedVersion, const String& displayName, unsigned estimatedSize, bool setVersionInNewDatabase);
    ExceptionOr<Ref<Database>> tryToOpenDatabaseBackend(Document&, const String& name, const String& expectedVersion, const String& displayName, unsigned estimatedSize, bool setVersionInNewDatabase, OpenAttempt);

    class ProposedDatabase;
    void addProposedDatabase(ProposedDatabase&);
    void removeProposedDatabase(ProposedDatabase&);

    static void logErrorMessage(Document&, const String& message);

    DatabaseManagerClient* m_client { nullptr };
    bool m_databaseIsAvailable { true };

    Lock m_proposedDatabasesLock;
    HashSet<ProposedDatabase*> m_proposedDatabases WTF_GUARDED_BY_LOCK(m_proposedDatabasesLock);
};

} // namespace WebCore
