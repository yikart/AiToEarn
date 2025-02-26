/*
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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

#include "IDBCursorRecord.h"
#include "IDBKey.h"
#include "IDBKeyData.h"
#include "IDBKeyPath.h"
#include "IDBValue.h"
#include "SharedBuffer.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IDBGetResult {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED_EXPORT(IDBGetResult, WEBCORE_EXPORT);
public:
    IDBGetResult()
        : m_isDefined(false)
    {
    }

    IDBGetResult(const IDBKeyData& keyData)
        : m_keyData(keyData)
    {
    }

    IDBGetResult(const IDBKeyData& keyData, const IDBKeyData& primaryKeyData)
        : m_keyData(keyData)
        , m_primaryKeyData(primaryKeyData)
    {
    }

    IDBGetResult(const IDBKeyData& keyData, const ThreadSafeDataBuffer& buffer, const std::optional<IDBKeyPath>& keyPath)
        : m_value(buffer)
        , m_keyData(keyData)
        , m_keyPath(keyPath)
    {
    }

    IDBGetResult(const IDBKeyData& keyData, IDBValue&& value, const std::optional<IDBKeyPath>& keyPath)
        : m_value(WTFMove(value))
        , m_keyData(keyData)
        , m_keyPath(keyPath)
    {
    }

    IDBGetResult(const IDBKeyData& keyData, const IDBKeyData& primaryKeyData, IDBValue&& value, const std::optional<IDBKeyPath>& keyPath, Vector<IDBCursorRecord>&& prefetechedRecords = { }, bool isDefined = true)
        : m_value(WTFMove(value))
        , m_keyData(keyData)
        , m_primaryKeyData(primaryKeyData)
        , m_keyPath(keyPath)
        , m_prefetchedRecords(WTFMove(prefetechedRecords))
        , m_isDefined(isDefined)
    {
    }

    enum IsolatedCopyTag { IsolatedCopy };
    IDBGetResult(const IDBGetResult&, IsolatedCopyTag);

    IDBGetResult isolatedCopy() const;

    void setValue(IDBValue&&);

    const IDBValue& value() const { return m_value; }
    const IDBKeyData& keyData() const { return m_keyData; }
    const IDBKeyData& primaryKeyData() const { return m_primaryKeyData; }
    const std::optional<IDBKeyPath>& keyPath() const { return m_keyPath; }
    const Vector<IDBCursorRecord>& prefetchedRecords() const { return m_prefetchedRecords; }
    bool isDefined() const { return m_isDefined; }

private:
    static void isolatedCopy(const IDBGetResult& source, IDBGetResult& destination);

    IDBValue m_value;
    IDBKeyData m_keyData;
    IDBKeyData m_primaryKeyData;
    std::optional<IDBKeyPath> m_keyPath;
    Vector<IDBCursorRecord> m_prefetchedRecords;
    bool m_isDefined { true };
};

} // namespace WebCore
