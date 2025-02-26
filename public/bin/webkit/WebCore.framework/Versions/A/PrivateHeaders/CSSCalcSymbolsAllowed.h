/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

#include "CSSValueKeywords.h"
#include <optional>
#include <wtf/HashMap.h>

namespace WebCore {

enum class CSSUnitType : uint8_t;

class CSSCalcSymbolsAllowed {
public:
    CSSCalcSymbolsAllowed() = default;
    CSSCalcSymbolsAllowed(std::initializer_list<std::tuple<CSSValueID, CSSUnitType>>);

    CSSCalcSymbolsAllowed& operator=(const CSSCalcSymbolsAllowed&) = default;
    CSSCalcSymbolsAllowed(const CSSCalcSymbolsAllowed&) = default;
    CSSCalcSymbolsAllowed& operator=(CSSCalcSymbolsAllowed&&) = default;
    CSSCalcSymbolsAllowed(CSSCalcSymbolsAllowed&&) = default;

    std::optional<CSSUnitType> get(CSSValueID) const;
    bool contains(CSSValueID) const;

private:
    // FIXME: A UncheckedKeyHashMap here is not ideal, as these tables are always constant expressions
    // and always quite small (currently always 4, but in the future will include one that
    // is 5 elements, hard coding a size of 4 would be unfortunate. A more ideal solution
    // would be to have this be a SortedArrayMap, but it currently has the restriction that
    // that both the type and size of the storage is fixed. I can probably be updated to
    // use the size only at construction and store store a std::span instead (or a variant
    // version could be made).

    UncheckedKeyHashMap<CSSValueID, CSSUnitType> m_table;
};

}
