/*
 * Copyright (C) 2007-2014 Apple Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 59 Temple Place - Suite 330,
 * Boston, MA 02111-1307, USA.
 *
 */

#pragma once

#include <wtf/MainThread.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/AtomString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

namespace WebCore {

class SpaceSplitStringData {
    WTF_MAKE_TZONE_ALLOCATED(SpaceSplitStringData);
    WTF_MAKE_NONCOPYABLE(SpaceSplitStringData);
public:
    static RefPtr<SpaceSplitStringData> create(const AtomString&);

    auto begin() const { return tokenArrayStart(); }
    auto end() const { return tokenArrayStart() + size(); }
    auto begin() { return tokenArrayStart(); }
    auto end() { return tokenArrayStart() + size(); }

    bool contains(const AtomString& string)
    {
        const AtomString* data = tokenArrayStart();
        unsigned i = 0;
        do {
            if (data[i] == string)
                return true;
            ++i;
        } while (i < m_size);
        return false;
    }

    bool containsAll(SpaceSplitStringData&);

    unsigned size() const { return m_size; }
    static constexpr ptrdiff_t sizeMemoryOffset() { return OBJECT_OFFSETOF(SpaceSplitStringData, m_size); }

    const AtomString& operator[](unsigned i)
    {
        RELEASE_ASSERT(i < m_size);
        return tokenArrayStart()[i];
    }

    void ref()
    {
        ASSERT(isMainThread());
        ASSERT(m_refCount);
        ++m_refCount;
    }

    void deref()
    {
        ASSERT(isMainThread());
        ASSERT(m_refCount);
        unsigned tempRefCount = m_refCount - 1;
        if (!tempRefCount) {
            destroy(this);
            return;
        }
        m_refCount = tempRefCount;
    }

    const AtomString& keyString() const { return m_keyString; }

    static constexpr ptrdiff_t tokensMemoryOffset() { return sizeof(SpaceSplitStringData); }

private:
    static Ref<SpaceSplitStringData> create(const AtomString&, unsigned tokenCount);
    SpaceSplitStringData(const AtomString& string, unsigned size)
        : m_keyString(string)
        , m_refCount(1)
        , m_size(size)
    {
        ASSERT(!string.isEmpty());
        ASSERT_WITH_MESSAGE(m_size, "SpaceSplitStringData should never be empty by definition. There is no difference between empty and null.");
    }

    ~SpaceSplitStringData() = default;
    static void destroy(SpaceSplitStringData*);

    AtomString* tokenArrayStart() { return reinterpret_cast<AtomString*>(this + 1); }
    const AtomString* tokenArrayStart() const { return reinterpret_cast<const AtomString*>(this + 1); }

    AtomString m_keyString;
    unsigned m_refCount;
    unsigned m_size;
};

class SpaceSplitString {
public:
    SpaceSplitString() = default;

    enum class ShouldFoldCase : bool { No, Yes };
    SpaceSplitString(const AtomString&, ShouldFoldCase);

    const AtomString& keyString() const
    {
        if (m_data)
            return m_data->keyString();
        return nullAtom();
    }

    friend bool operator==(const SpaceSplitString&, const SpaceSplitString&) = default;
    void set(const AtomString&, ShouldFoldCase);
    void clear() { m_data = nullptr; }

    bool contains(const AtomString& string) const { return m_data && m_data->contains(string); }
    bool containsAll(const SpaceSplitString& names) const { return !names.m_data || (m_data && m_data->containsAll(*names.m_data)); }

    unsigned size() const { return m_data ? m_data->size() : 0; }
    bool isEmpty() const { return !m_data; }
    const AtomString& operator[](unsigned i) const
    {
        ASSERT_WITH_SECURITY_IMPLICATION(m_data);
        return (*m_data)[i];
    }

    auto begin() const { return m_data ? m_data->begin() : nullptr; }
    auto end() const { return m_data ? m_data->end() : nullptr; }
    auto begin() { return m_data ? m_data->begin() : nullptr; }
    auto end() { return m_data ? m_data->end() : nullptr; }

    static bool spaceSplitStringContainsValue(StringView spaceSplitString, StringView value, ShouldFoldCase);

private:
    RefPtr<SpaceSplitStringData> m_data;
};

inline SpaceSplitString::SpaceSplitString(const AtomString& string, ShouldFoldCase shouldFoldCase)
    : m_data(!string.isEmpty() ? SpaceSplitStringData::create(shouldFoldCase == ShouldFoldCase::Yes ? string.convertToASCIILowercase() : string) : nullptr)
{
}

} // namespace WebCore

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
