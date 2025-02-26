/*
 * Copyright (C) 2006-2021 Apple Inc. All rights reserved.
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

#include "SQLValue.h"
#include "SQLiteDatabase.h"
#include <span>
#include <wtf/CheckedRef.h>
#include <wtf/TZoneMalloc.h>

struct sqlite3_stmt;

namespace WebCore {

class SQLiteStatement : public CanMakeThreadSafeCheckedPtr<SQLiteStatement> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(SQLiteStatement, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(SQLiteStatement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(SQLiteStatement);
public:
    WEBCORE_EXPORT ~SQLiteStatement();
    WEBCORE_EXPORT SQLiteStatement(SQLiteStatement&&);

    // Binds multiple parameters. Returns true if all were successfully bound.
    template<typename T, typename... Args>
    bool bind(T, Args&&...);

    WEBCORE_EXPORT int bindBlob(int index, std::span<const uint8_t>);
    WEBCORE_EXPORT int bindBlob(int index, const String&);
    WEBCORE_EXPORT int bindText(int index, StringView);
    WEBCORE_EXPORT int bindInt(int index, int);
    WEBCORE_EXPORT int bindInt64(int index, int64_t);
    WEBCORE_EXPORT int bindDouble(int index, double);
    WEBCORE_EXPORT int bindNull(int index);
    WEBCORE_EXPORT int bindValue(int index, const SQLValue&);
    WEBCORE_EXPORT unsigned bindParameterCount() const;

    WEBCORE_EXPORT int step();
    WEBCORE_EXPORT int reset();
    
    // steps and finalizes the query.
    // returns true if all 3 steps succeed with step() returning SQLITE_DONE
    // returns false otherwise  
    WEBCORE_EXPORT bool executeCommand();

    // Returns -1 on last-step failing.  Otherwise, returns number of rows
    // returned in the last step()
    int columnCount();

    bool isReadOnly();
    
    WEBCORE_EXPORT bool isColumnDeclaredAsBlob(int col);
    String columnName(int col);
    SQLValue columnValue(int col);
    WEBCORE_EXPORT String columnText(int col);
    WEBCORE_EXPORT double columnDouble(int col);
    WEBCORE_EXPORT int columnInt(int col);
    WEBCORE_EXPORT int64_t columnInt64(int col);
    WEBCORE_EXPORT String columnBlobAsString(int col);
    WEBCORE_EXPORT Vector<uint8_t> columnBlob(int col);

    // The returned Span stays valid until the next step() / reset() or destruction of the statement.
    std::span<const uint8_t> columnBlobAsSpan(int col);

    SQLiteDatabase& database() { return m_database.get(); }
    
private:
    friend class SQLiteDatabase;
    SQLiteStatement(SQLiteDatabase&, sqlite3_stmt*);

    // Returns true if the prepared statement has been stepped at least once using step() but has neither run to completion (returned SQLITE_DONE from step()) nor been reset().
    bool hasStartedStepping();

    template<typename T, typename... Args> bool bindImpl(int i, T first, Args&&... args);
    template<typename T> bool bindImpl(int, T);

    CheckedRef<SQLiteDatabase> m_database;
    sqlite3_stmt* m_statement;
};

template<typename T, typename... Args>
inline bool SQLiteStatement::bind(T first, Args&&... args)
{
    return bindImpl(1, first, std::forward<Args>(args)...);
}

template<typename T, typename... Args>
inline bool SQLiteStatement::bindImpl(int i, T first, Args&&... args)
{
    return bindImpl(i, first) && bindImpl(i+1, std::forward<Args>(args)...);
}

template<typename T>
inline bool SQLiteStatement::bindImpl(int i, T value)
{
    if constexpr (std::is_convertible_v<T, std::span<const uint8_t>>)
        return bindBlob(i, value) == SQLITE_OK;
    else if constexpr (std::is_convertible_v<T, StringView>)
        return bindText(i, value) == SQLITE_OK;
    else if constexpr (std::is_same_v<T, std::nullptr_t>)
        return bindNull(i) == SQLITE_OK;
    else if constexpr (std::is_floating_point_v<T>)
        return bindDouble(i, value) == SQLITE_OK;
    else if constexpr (std::is_same_v<T, SQLValue>)
        return bindValue(i, value) == SQLITE_OK;
    else
        return bindInt64(i, value) == SQLITE_OK;
}

} // namespace WebCore
