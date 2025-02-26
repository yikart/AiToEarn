/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

#include "CacheUpdate.h"
#include "LeafExecutable.h"
#include "ParserModes.h"
#include <wtf/MallocSpan.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>

namespace JSC {

class UnlinkedFunctionExecutable;

class CachedBytecode : public RefCounted<CachedBytecode> {
    WTF_MAKE_NONCOPYABLE(CachedBytecode);

public:
    static Ref<CachedBytecode> create()
    {
        return adoptRef(*new CachedBytecode(CachePayload::makeEmptyPayload()));
    }

    static Ref<CachedBytecode> create(FileSystem::MappedFileData&& data, LeafExecutableMap&& leafExecutables = { })
    {
        return adoptRef(*new CachedBytecode(CachePayload::makeMappedPayload(WTFMove(data)), WTFMove(leafExecutables)));
    }

    static Ref<CachedBytecode> create(MallocSpan<uint8_t, VMMalloc>&& data, LeafExecutableMap&& leafExecutables)
    {
        return adoptRef(*new CachedBytecode(CachePayload::makeMallocPayload(WTFMove(data)), WTFMove(leafExecutables)));
    }

    LeafExecutableMap& leafExecutables() { return m_leafExecutables; }

    JS_EXPORT_PRIVATE void addGlobalUpdate(Ref<CachedBytecode>);
    JS_EXPORT_PRIVATE void addFunctionUpdate(const UnlinkedFunctionExecutable*, CodeSpecializationKind, Ref<CachedBytecode>);

    using ForEachUpdateCallback = Function<void(off_t, std::span<const uint8_t>)>;
    JS_EXPORT_PRIVATE void commitUpdates(const ForEachUpdateCallback&) const;

    std::span<const uint8_t> span() const { return m_payload.span(); }
    size_t size() const { return m_payload.size(); }
    bool hasUpdates() const { return !m_updates.isEmpty(); }
    size_t sizeForUpdate() const { return m_size; }

private:
    CachedBytecode(CachePayload&& payload, LeafExecutableMap&& leafExecutables = { })
        : m_size(payload.size())
        , m_payload(WTFMove(payload))
        , m_leafExecutables(WTFMove(leafExecutables))
    {
    }

    void copyLeafExecutables(const CachedBytecode&);

    size_t m_size { 0 };
    CachePayload m_payload;
    LeafExecutableMap m_leafExecutables;
    Vector<CacheUpdate> m_updates;
};


} // namespace JSC
