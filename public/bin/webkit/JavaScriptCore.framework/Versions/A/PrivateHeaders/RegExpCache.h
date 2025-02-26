/*
 * Copyright (C) 2010 University of Szeged
 * Copyright (C) 2010 Renata Hodovan (hodovan@inf.u-szeged.hu)
 * All rights reserved.
 * Copyright (C) 2019-2023 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY UNIVERSITY OF SZEGED ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL UNIVERSITY OF SZEGED OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "RegExp.h"
#include "RegExpKey.h"
#include "Strong.h"
#include "Weak.h"
#include <array>
#include <wtf/RobinHoodHashMap.h>
#include <wtf/TZoneMalloc.h>

namespace JSC {

namespace Yarr {
enum class Flags : uint16_t;
}

class RegExpCache final : private WeakHandleOwner {
    WTF_MAKE_TZONE_ALLOCATED(RegExpCache);

    friend class RegExp;
    typedef MemoryCompactRobinHoodHashMap<RegExpKey, Weak<RegExp>> RegExpCacheMap;

public:
    RegExpCache() = default;
    void deleteAllCode();

    RegExp* ensureEmptyRegExp(VM& vm)
    {
        if (LIKELY(m_emptyRegExp))
            return m_emptyRegExp;
        return ensureEmptyRegExpSlow(vm);
    }

    DECLARE_VISIT_AGGREGATE;

private:
    static constexpr unsigned maxStrongCacheablePatternLength = 256;

    static constexpr int maxStrongCacheableEntries = 64;

    void finalize(Handle<Unknown>, void* context) final;

    RegExp* ensureEmptyRegExpSlow(VM&);

    RegExp* lookupOrCreate(VM&, const WTF::String& patternString, OptionSet<Yarr::Flags>);
    void addToStrongCache(RegExp*);

    RegExpCacheMap m_weakCache; // Holds all regular expressions currently live.
    unsigned m_nextEntryInStrongCache { 0 };
    std::array<RegExp*, maxStrongCacheableEntries> m_strongCache { }; // Holds a select few regular expressions that have compiled and executed
    RegExp* m_emptyRegExp { nullptr };
};

} // namespace JSC
