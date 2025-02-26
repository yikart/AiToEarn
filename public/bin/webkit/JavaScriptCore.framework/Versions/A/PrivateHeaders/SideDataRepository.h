/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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
#include <wtf/Locker.h>
#include <wtf/NeverDestroyed.h>

namespace JSC {

class SideDataRepository {
public:
    class SideData {
        WTF_MAKE_FAST_ALLOCATED;
    public:
        virtual ~SideData() = default;
    };

    template<typename Type, typename Functor>
    Type& ensure(void* owner, void* key, const Functor& functor)
    {
        static_assert(std::is_base_of_v<SideData, Type>);
        Locker lock { m_lock };
        auto result = add(owner, key, nullptr);
        if (result.isNewEntry)
            result.iterator->value = functor();
        return *reinterpret_cast<Type*>(result.iterator->value.get());
    }

    void deleteAll(void* owner);

protected:
    using KeyValueStore = UncheckedKeyHashMap<void*, std::unique_ptr<SideData>>;
    using AddResult = KeyValueStore::AddResult;

    SideDataRepository() = default;

    JS_EXPORT_PRIVATE AddResult add(void* owner, void* key, std::unique_ptr<SideData>) WTF_REQUIRES_LOCK(m_lock);

    UncheckedKeyHashMap<void*, KeyValueStore> m_ownerStore WTF_GUARDED_BY_LOCK(m_lock);
    Lock m_lock;

    friend class LazyNeverDestroyed<SideDataRepository>;
};

JS_EXPORT_PRIVATE SideDataRepository& sideDataRepository();

} // namespace JSC
