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

#include "ExceptionOr.h"
#include "IDBCursorDirection.h"
#include "IDBCursorInfo.h"
#include "IDBKeyPath.h"
#include "IDBRequest.h"
#include "IDBValue.h"
#include "JSValueInWrappedObject.h"
#include <JavaScriptCore/Strong.h>
#include <variant>
#include <wtf/WeakPtr.h>

namespace WebCore {

class IDBGetResult;
class IDBIndex;
class IDBObjectStore;
class IDBTransaction;

class IDBCursor : public ScriptWrappable, public RefCounted<IDBCursor> {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(IDBCursor);
public:
    static Ref<IDBCursor> create(IDBObjectStore&, const IDBCursorInfo&);
    static Ref<IDBCursor> create(IDBIndex&, const IDBCursorInfo&);
    
    virtual ~IDBCursor();

    using Source = std::variant<RefPtr<IDBObjectStore>, RefPtr<IDBIndex>>;

    const Source& source() const;
    IDBCursorDirection direction() const;

    IDBKey* key() { return m_key.get(); };
    IDBKey* primaryKey() { return m_primaryKey.get(); };
    IDBValue value() { return m_value; };
    const std::optional<IDBKeyPath>& primaryKeyPath() { return m_keyPath; };
    JSValueInWrappedObject& keyWrapper() { return m_keyWrapper; }
    JSValueInWrappedObject& primaryKeyWrapper() { return m_primaryKeyWrapper; }
    JSValueInWrappedObject& valueWrapper() { return m_valueWrapper; }

    ExceptionOr<Ref<IDBRequest>> update(JSC::JSGlobalObject&, JSC::JSValue);
    ExceptionOr<void> advance(unsigned);
    ExceptionOr<void> continueFunction(JSC::JSGlobalObject&, JSC::JSValue key);
    ExceptionOr<void> continuePrimaryKey(JSC::JSGlobalObject&, JSC::JSValue key, JSC::JSValue primaryKey);
    ExceptionOr<Ref<IDBRequest>> deleteFunction();

    ExceptionOr<void> continueFunction(const IDBKeyData&);

    const IDBCursorInfo& info() const { return m_info; }

    void setRequest(IDBRequest& request) { m_request = request; }
    void clearRequest() { m_request.clear(); }
    void clearWrappers();
    IDBRequest* request() { return m_request.get(); }

    bool setGetResult(IDBRequest&, const IDBGetResult&, uint64_t operationID);

    virtual bool isKeyCursorWithValue() const { return false; }

    std::optional<IDBGetResult> iterateWithPrefetchedRecords(unsigned count, uint64_t lastWriteOperationID);
    void clearPrefetchedRecords();

protected:
    IDBCursor(IDBObjectStore&, const IDBCursorInfo&);
    IDBCursor(IDBIndex&, const IDBCursorInfo&);

private:
    bool sourcesDeleted() const;
    IDBObjectStore& effectiveObjectStore() const;
    IDBTransaction& transaction() const;

    void uncheckedIterateCursor(const IDBKeyData&, unsigned count);
    void uncheckedIterateCursor(const IDBKeyData&, const IDBKeyData&);

    IDBCursorInfo m_info;
    Source m_source;
    WeakPtr<IDBRequest, WeakPtrImplWithEventTargetData> m_request;

    bool m_gotValue { false };

    RefPtr<IDBKey> m_key;
    RefPtr<IDBKey> m_primaryKey;
    IDBKeyData m_keyData;
    IDBKeyData m_primaryKeyData;
    IDBValue m_value;
    std::optional<IDBKeyPath> m_keyPath;

    JSValueInWrappedObject m_keyWrapper;
    JSValueInWrappedObject m_primaryKeyWrapper;
    JSValueInWrappedObject m_valueWrapper;

    Deque<IDBCursorRecord> m_prefetchedRecords;
    uint64_t m_prefetchOperationID { 0 };
};


inline const IDBCursor::Source& IDBCursor::source() const
{
    return m_source;
}

inline IDBCursorDirection IDBCursor::direction() const
{
    return m_info.cursorDirection();
}

} // namespace WebCore
