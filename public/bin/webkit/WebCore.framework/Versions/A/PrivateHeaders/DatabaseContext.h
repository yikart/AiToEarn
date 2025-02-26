/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 * Copyright (C) 2011 Google, Inc. All Rights Reserved.
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
 *
 */

#pragma once

#include "ActiveDOMObject.h"
#include "Document.h"
#include <wtf/RefPtr.h>
#include <wtf/ThreadSafeRefCounted.h>

#if PLATFORM(IOS_FAMILY)
#include <wtf/Threading.h>
#endif

namespace WebCore {

class Database;
class DatabaseDetails;
class DatabaseTaskSynchronizer;
class DatabaseThread;
class SecurityOrigin;
class SecurityOriginData;

class DatabaseContext final : public ThreadSafeRefCounted<DatabaseContext>, private ActiveDOMObject {
public:
    // ActiveDOMObject.
    void ref() const final { ThreadSafeRefCounted::ref(); }
    void deref() const final { ThreadSafeRefCounted::deref(); }

    virtual ~DatabaseContext();

    DatabaseThread* existingDatabaseThread() const { return m_databaseThread.get(); }
    DatabaseThread* databaseThread();

    void setHasOpenDatabases() { m_hasOpenDatabases = true; }
    bool hasOpenDatabases() const { return m_hasOpenDatabases; }

    // When the database cleanup is done, the sychronizer will be signalled.
    bool stopDatabases(DatabaseTaskSynchronizer*);

    bool allowDatabaseAccess() const;
    void databaseExceededQuota(const String& name, DatabaseDetails);

    Document* document() const { return downcast<Document>(ActiveDOMObject::scriptExecutionContext()); }
    const SecurityOriginData& securityOrigin() const;

    bool isContextThread() const;

private:
    explicit DatabaseContext(Document&);

    void stopDatabases() { stopDatabases(nullptr); }

    void contextDestroyed() override;

    // ActiveDOMObject.
    void stop() override;

    RefPtr<DatabaseThread> m_databaseThread;
    bool m_hasOpenDatabases { false }; // This never changes back to false, even after the database thread is closed.
    bool m_hasRequestedTermination { false };

    friend class DatabaseManager;
};

} // namespace WebCore
