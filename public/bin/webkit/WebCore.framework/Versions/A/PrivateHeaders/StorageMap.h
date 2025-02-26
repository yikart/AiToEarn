/*
 * Copyright (C) 2008-2021 Apple Inc. All Rights Reserved.
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

#include <wtf/HashMap.h>
#include <wtf/RefCounted.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/StringHash.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

// This class uses copy-on-write semantics.
class StorageMap {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(StorageMap, WEBCORE_EXPORT);
public:
    // Quota size measured in bytes.
    WEBCORE_EXPORT explicit StorageMap(unsigned quotaSize);

    WEBCORE_EXPORT unsigned length() const;
    WEBCORE_EXPORT String key(unsigned index);
    WEBCORE_EXPORT String getItem(const String&) const;
    WEBCORE_EXPORT void setItem(const String& key, const String& value, String& oldValue, bool& quotaException);
    WEBCORE_EXPORT void setItemIgnoringQuota(const String& key, const String& value);
    WEBCORE_EXPORT void removeItem(const String&, String& oldValue);
    WEBCORE_EXPORT void clear();

    WEBCORE_EXPORT bool contains(const String& key) const;

    WEBCORE_EXPORT void importItems(HashMap<String, String>&&);
    const HashMap<String, String>& items() const { return m_impl->map; }

    unsigned quota() const { return m_quotaSize; }

    bool isShared() const { return !m_impl->hasOneRef(); }

    static constexpr unsigned noQuota = std::numeric_limits<unsigned>::max();

private:
    void invalidateIterator();
    void setIteratorToIndex(unsigned);

    struct Impl : public RefCounted<Impl> {
        static Ref<Impl> create()
        {
            return adoptRef(*new Impl);
        }

        Ref<Impl> copy() const;

        HashMap<String, String> map;
        HashMap<String, String>::iterator iterator { map.end() };
        unsigned iteratorIndex { std::numeric_limits<unsigned>::max() };
        unsigned currentSize { 0 };
    };

    Ref<Impl> m_impl;
    unsigned m_quotaSize { noQuota }; // Measured in bytes.
};

} // namespace WebCore
