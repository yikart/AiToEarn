/*
 * Copyright (C) 2006 Apple Inc.  All rights reserved.
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

#ifndef SQLiteTransaction_h
#define SQLiteTransaction_h

#include <wtf/CheckedRef.h>
#include <wtf/Noncopyable.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class SQLiteDatabase;

class SQLiteTransaction {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SQLiteTransaction, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(SQLiteTransaction);
public:
    WEBCORE_EXPORT SQLiteTransaction(SQLiteDatabase& db, bool readOnly = false);
    WEBCORE_EXPORT ~SQLiteTransaction();
    
    WEBCORE_EXPORT void begin();
    WEBCORE_EXPORT void commit();
    WEBCORE_EXPORT void rollback();
    void stop();
    
    bool inProgress() const { return m_inProgress; }
    WEBCORE_EXPORT bool wasRolledBackBySqlite() const;

    SQLiteDatabase& database() const { return m_db.get(); }

private:
    CheckedRef<SQLiteDatabase> m_db;
    bool m_inProgress;
    bool m_readOnly;
};

} // namespace WebCore

#endif // SQLiteTransation_H
