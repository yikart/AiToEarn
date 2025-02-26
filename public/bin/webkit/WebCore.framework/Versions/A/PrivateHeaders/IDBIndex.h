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

#include "IDBCursor.h"
#include "IDBIndexInfo.h"
#include "IDBRequest.h"
#include <wtf/TZoneMalloc.h>
#include <wtf/UniqueRef.h>

namespace JSC {
class CallFrame;
}

namespace WebCore {

class IDBKeyRange;
class WebCoreOpaqueRoot;

struct IDBKeyRangeData;

class IDBIndex final : public ActiveDOMObject {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(IDBIndex);
public:
    static UniqueRef<IDBIndex> create(ScriptExecutionContext&, const IDBIndexInfo&, IDBObjectStore&);

    virtual ~IDBIndex();

    const String& name() const;
    ExceptionOr<void> setName(const String&);
    IDBObjectStore& objectStore();
    const IDBKeyPath& keyPath() const;
    bool unique() const;
    bool multiEntry() const;

    void rollbackInfoForVersionChangeAbort();

    ExceptionOr<Ref<IDBRequest>> openCursor(RefPtr<IDBKeyRange>&&, IDBCursorDirection);
    ExceptionOr<Ref<IDBRequest>> openCursor(JSC::JSGlobalObject&, JSC::JSValue key, IDBCursorDirection);
    ExceptionOr<Ref<IDBRequest>> openKeyCursor(RefPtr<IDBKeyRange>&&, IDBCursorDirection);
    ExceptionOr<Ref<IDBRequest>> openKeyCursor(JSC::JSGlobalObject&, JSC::JSValue key, IDBCursorDirection);

    ExceptionOr<Ref<IDBRequest>> count(IDBKeyRange*);
    ExceptionOr<Ref<IDBRequest>> count(JSC::JSGlobalObject&, JSC::JSValue key);

    ExceptionOr<Ref<IDBRequest>> get(IDBKeyRange*);
    ExceptionOr<Ref<IDBRequest>> get(JSC::JSGlobalObject&, JSC::JSValue key);
    ExceptionOr<Ref<IDBRequest>> getKey(IDBKeyRange*);
    ExceptionOr<Ref<IDBRequest>> getKey(JSC::JSGlobalObject&, JSC::JSValue key);

    ExceptionOr<Ref<IDBRequest>> getAll(RefPtr<IDBKeyRange>&&, std::optional<uint32_t> count);
    ExceptionOr<Ref<IDBRequest>> getAll(JSC::JSGlobalObject&, JSC::JSValue key, std::optional<uint32_t> count);
    ExceptionOr<Ref<IDBRequest>> getAllKeys(RefPtr<IDBKeyRange>&&, std::optional<uint32_t> count);
    ExceptionOr<Ref<IDBRequest>> getAllKeys(JSC::JSGlobalObject&, JSC::JSValue key, std::optional<uint32_t> count);

    const IDBIndexInfo& info() const { return m_info; }

    void markAsDeleted();
    bool isDeleted() const { return m_deleted; }

    // ActiveDOMObject.
    void ref() const final;
    void deref() const final;

    WebCoreOpaqueRoot opaqueRoot();

private:
    IDBIndex(ScriptExecutionContext&, const IDBIndexInfo&, IDBObjectStore&);

    ExceptionOr<Ref<IDBRequest>> doCount(const IDBKeyRangeData&);
    ExceptionOr<Ref<IDBRequest>> doGet(ExceptionOr<IDBKeyRangeData>);
    ExceptionOr<Ref<IDBRequest>> doGetKey(ExceptionOr<IDBKeyRangeData>);
    ExceptionOr<Ref<IDBRequest>> doOpenCursor(IDBCursorDirection, Function<ExceptionOr<RefPtr<IDBKeyRange>>()> &&);
    ExceptionOr<Ref<IDBRequest>> doOpenKeyCursor(IDBCursorDirection, Function<ExceptionOr<RefPtr<IDBKeyRange>>()> &&);
    ExceptionOr<Ref<IDBRequest>> doGetAll(std::optional<uint32_t> count, Function<ExceptionOr<RefPtr<IDBKeyRange>>()> &&);
    ExceptionOr<Ref<IDBRequest>> doGetAllKeys(std::optional<uint32_t> count, Function<ExceptionOr<RefPtr<IDBKeyRange>>()> &&);

    // ActiveDOMObject.
    bool virtualHasPendingActivity() const final;

    IDBIndexInfo m_info;
    IDBIndexInfo m_originalInfo;

    bool m_deleted { false };

    // IDBIndex objects are always owned by their referencing IDBObjectStore.
    // Indexes will never outlive ObjectStores so its okay to keep a raw C++ reference here.
    CheckedRef<IDBObjectStore> m_objectStore;
};

WebCoreOpaqueRoot root(IDBIndex*);

} // namespace WebCore
