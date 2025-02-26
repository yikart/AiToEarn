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

#include "IDBIndexIdentifier.h"
#include "IDBKeyRangeData.h"
#include "IDBObjectStoreIdentifier.h"
#include "IDBResourceIdentifier.h"
#include <wtf/ArgumentCoder.h>

namespace WebCore {

class IDBTransaction;

namespace IndexedDB {
enum class CursorDirection : uint8_t;
enum class CursorSource : bool;
enum class CursorType : bool;
}

struct IDBKeyRangeData;

enum class CursorDuplicity {
    Duplicates,
    NoDuplicates,
};

class IDBCursorInfo {
public:
    static IDBCursorInfo objectStoreCursor(IDBTransaction&, IDBObjectStoreIdentifier, const IDBKeyRangeData&, IndexedDB::CursorDirection, IndexedDB::CursorType);
    static IDBCursorInfo indexCursor(IDBTransaction&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const IDBKeyRangeData&, IndexedDB::CursorDirection, IndexedDB::CursorType);

    IDBResourceIdentifier identifier() const { return m_cursorIdentifier; }
    IDBResourceIdentifier transactionIdentifier() const { return m_transactionIdentifier; }
    std::variant<IDBObjectStoreIdentifier, IDBIndexIdentifier> sourceIdentifier() const { return m_sourceIdentifier; }
    std::optional<IDBIndexIdentifier> sourceIndexIdentifier() const;
    IDBObjectStoreIdentifier objectStoreIdentifier() const { return m_objectStoreIdentifier; }

    IndexedDB::CursorSource cursorSource() const { return m_source; }
    IndexedDB::CursorDirection cursorDirection() const { return m_direction; }
    IndexedDB::CursorType cursorType() const { return m_type; }
    const IDBKeyRangeData& range() const { return m_range; }

    bool isDirectionForward() const;
    CursorDuplicity duplicity() const;

    WEBCORE_EXPORT IDBCursorInfo isolatedCopy() const;

#if !LOG_DISABLED
    String loggingString() const;
#endif

private:
    friend struct IPC::ArgumentCoder<IDBCursorInfo, void>;
    WEBCORE_EXPORT IDBCursorInfo(const IDBResourceIdentifier&, const IDBResourceIdentifier&, IDBObjectStoreIdentifier, std::variant<IDBObjectStoreIdentifier, IDBIndexIdentifier>, const IDBKeyRangeData&, IndexedDB::CursorSource, IndexedDB::CursorDirection, IndexedDB::CursorType);
    IDBCursorInfo(IDBTransaction&, IDBObjectStoreIdentifier, const IDBKeyRangeData&, IndexedDB::CursorDirection, IndexedDB::CursorType);
    IDBCursorInfo(IDBTransaction&, IDBObjectStoreIdentifier, IDBIndexIdentifier, const IDBKeyRangeData&, IndexedDB::CursorDirection, IndexedDB::CursorType);

    IDBResourceIdentifier m_cursorIdentifier;
    IDBResourceIdentifier m_transactionIdentifier;
    IDBObjectStoreIdentifier m_objectStoreIdentifier;
    std::variant<IDBObjectStoreIdentifier, IDBIndexIdentifier> m_sourceIdentifier;

    IDBKeyRangeData m_range;

    IndexedDB::CursorSource m_source;
    IndexedDB::CursorDirection m_direction;
    IndexedDB::CursorType m_type;
};

} // namespace WebCore
