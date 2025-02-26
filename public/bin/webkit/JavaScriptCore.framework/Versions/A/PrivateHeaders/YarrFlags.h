/*
 * Copyright (C) 2019 Sony Interactive Entertainment Inc.
 * Copyright (C) 2021 Apple Inc.
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

#include <optional>
#include <wtf/Forward.h>

namespace JSC { namespace Yarr {

// Flags must be ordered in alphabet ordering.
#define JSC_REGEXP_FLAGS(macro) \
    macro('d', HasIndices, hasIndices, 0) \
    macro('g', Global, global, 1) \
    macro('i', IgnoreCase, ignoreCase, 2) \
    macro('m', Multiline, multiline, 3) \
    macro('s', DotAll, dotAll, 4) \
    macro('u', Unicode, unicode, 5) \
    macro('v', UnicodeSets, unicodeSets, 6) \
    macro('y', Sticky, sticky, 7) \

#define JSC_COUNT_REGEXP_FLAG(key, name, lowerCaseName, index) + 1
static constexpr unsigned numberOfFlags = 0 JSC_REGEXP_FLAGS(JSC_COUNT_REGEXP_FLAG);
#undef JSC_COUNT_REGEXP_FLAG

enum class Flags : uint16_t {
#define JSC_DEFINE_REGEXP_FLAG(key, name, lowerCaseName, index) name = 1 << index,
    JSC_REGEXP_FLAGS(JSC_DEFINE_REGEXP_FLAG)
#undef JSC_DEFINE_REGEXP_FLAG
    DeletedValue = 1 << numberOfFlags,
};

JS_EXPORT_PRIVATE std::optional<OptionSet<Flags>> parseFlags(StringView);
using FlagsString = std::array<char, Yarr::numberOfFlags + 1>; // numberOfFlags + null-terminator
JS_EXPORT_PRIVATE FlagsString flagsString(OptionSet<Flags>);

} } // namespace JSC::Yarr
