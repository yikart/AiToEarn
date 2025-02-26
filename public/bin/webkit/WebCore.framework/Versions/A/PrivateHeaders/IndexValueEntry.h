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

#include "IDBKeyData.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class ThreadSafeDataBuffer;

enum class CursorDuplicity;

namespace IDBServer {

class IndexValueEntry {
    WTF_MAKE_TZONE_ALLOCATED(IndexValueEntry);
public:
    explicit IndexValueEntry(bool unique);
    ~IndexValueEntry();

    void addKey(const IDBKeyData&);

    // Returns true if a key was actually removed.
    bool removeKey(const IDBKeyData&);

    const IDBKeyData* getLowest() const;

    uint64_t getCount() const;

    class Iterator {
    public:
        Iterator()
        {
        }

        Iterator(IndexValueEntry&);
        Iterator(IndexValueEntry&, IDBKeyDataSet::iterator);
        Iterator(IndexValueEntry&, IDBKeyDataSet::reverse_iterator);

        bool isValid() const;
        void invalidate();

        const IDBKeyData& key() const;
        const ThreadSafeDataBuffer& value() const;

        Iterator& operator++();

    private:
        IndexValueEntry* m_entry { nullptr };
        bool m_forward { true };
        IDBKeyDataSet::iterator m_forwardIterator;
        IDBKeyDataSet::reverse_iterator m_reverseIterator;
    };

    Iterator begin();
    Iterator reverseBegin(CursorDuplicity);

    // Finds the key, or the next higher record after the key.
    Iterator find(const IDBKeyData&);
    // Finds the key, or the next lowest record before the key.
    Iterator reverseFind(const IDBKeyData&, CursorDuplicity);

    bool unique() const { return m_unique; }

private:
    union {
        IDBKeyDataSet* m_orderedKeys;
        IDBKeyData* m_key;
    };

    bool m_unique;
};

} // namespace IDBServer
} // namespace WebCore
