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

#include "IDBCursorInfo.h"
#include "IDBKeyData.h"
#include "IndexValueEntry.h"
#include <wtf/CheckedPtr.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class IDBError;

struct IDBKeyRangeData;

namespace IDBServer {

class MemoryIndex;

typedef HashMap<IDBKeyData, std::unique_ptr<IndexValueEntry>, IDBKeyDataHash, IDBKeyDataHashTraits> IndexKeyValueMap;

class IndexValueStore final : public CanMakeThreadSafeCheckedPtr<IndexValueStore> {
    WTF_MAKE_TZONE_ALLOCATED(IndexValueStore);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(IndexValueStore);
public:
    explicit IndexValueStore(bool unique);

    const IDBKeyData* lowestValueForKey(const IDBKeyData&) const;
    Vector<IDBKeyData> allValuesForKey(const IDBKeyData&, uint32_t limit) const;
    uint64_t countForKey(const IDBKeyData&) const;
    IDBKeyData lowestKeyWithRecordInRange(const IDBKeyRangeData&) const;
    bool contains(const IDBKeyData&) const;

    IDBError addRecord(const IDBKeyData& indexKey, const IDBKeyData& valueKey);
    void removeRecord(const IDBKeyData& indexKey, const IDBKeyData& valueKey);

    void removeEntriesWithValueKey(MemoryIndex&, const IDBKeyData& valueKey);

    class Iterator {
        friend class IndexValueStore;
    public:
        Iterator()
        {
        }

        Iterator(IndexValueStore&, IDBKeyDataSet::iterator, IndexValueEntry::Iterator);
        Iterator(IndexValueStore&, CursorDuplicity, IDBKeyDataSet::reverse_iterator, IndexValueEntry::Iterator);

        void invalidate();
        bool isValid();

        const IDBKeyData& key();
        const IDBKeyData& primaryKey();
        const ThreadSafeDataBuffer& value();

        Iterator& operator++();
        Iterator& nextIndexEntry();

    private:
        CheckedPtr<IndexValueStore> m_store;
        bool m_forward { true };
        CursorDuplicity m_duplicity { CursorDuplicity::Duplicates };
        IDBKeyDataSet::iterator m_forwardIterator;
        IDBKeyDataSet::reverse_iterator m_reverseIterator;

        IndexValueEntry::Iterator m_primaryKeyIterator;
    };

    // Returns an iterator pointing to the first primaryKey record in the requested key, or the next key if it doesn't exist.
    Iterator find(const IDBKeyData&, bool open = false);
    Iterator reverseFind(const IDBKeyData&, CursorDuplicity, bool open = false);

    // Returns an iterator pointing to the key/primaryKey record, or the next one after it if it doesn't exist.
    Iterator find(const IDBKeyData&, const IDBKeyData& primaryKey);
    Iterator reverseFind(const IDBKeyData&, const IDBKeyData& primaryKey, CursorDuplicity);

#if !LOG_DISABLED
    String loggingString() const;
#endif

private:
    IDBKeyDataSet::iterator lowestIteratorInRange(const IDBKeyRangeData&) const;
    IDBKeyDataSet::reverse_iterator highestReverseIteratorInRange(const IDBKeyRangeData&) const;

    IndexKeyValueMap m_records;
    IDBKeyDataSet m_orderedKeys;
    
    bool m_unique;
};

} // namespace IDBServer
} // namespace WebCore
