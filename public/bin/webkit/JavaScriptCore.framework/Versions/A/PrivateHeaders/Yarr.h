/*
 * Copyright (C) 2009-2019 Apple Inc. All rights reserved.
 * Copyright (C) 2010 Peter Varga (pvarga@inf.u-szeged.hu), University of Szeged
 * All rights reserved.
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

#include <limits.h>
#include "YarrErrorCode.h"

namespace JSC { namespace Yarr {

#define YarrStackSpaceForBackTrackInfoPatternCharacter 2 // Only for !fixed quantifiers.
#define YarrStackSpaceForBackTrackInfoCharacterClass 2 // Only for !fixed quantifiers.
#define YarrStackSpaceForBackTrackInfoBackReference 3
#define YarrStackSpaceForBackTrackInfoAlternative 1 // One per alternative.
#define YarrStackSpaceForBackTrackInfoParentheticalAssertion 1
#define YarrStackSpaceForBackTrackInfoParenthesesOnce 2
#define YarrStackSpaceForBackTrackInfoParenthesesTerminal 1
#define YarrStackSpaceForBackTrackInfoParentheses 4
#define YarrStackSpaceForDotStarEnclosure 1

static constexpr unsigned quantifyInfinite = UINT_MAX;
static constexpr uint64_t quantifyInfinite64 = std::numeric_limits<uint64_t>::max();
static constexpr unsigned offsetNoMatch = std::numeric_limits<unsigned>::max();

// The below limit restricts the number of "recursive" match calls in order to
// avoid spending exponential time on complex regular expressions.
static constexpr unsigned matchLimit = 1000000;

enum class MatchFrom { VMThread, CompilerThread };

enum class JSRegExpResult {
    Match = 1,
    NoMatch = 0,
    ErrorNoMatch = -1,
    JITCodeFailure = -2,
    ErrorHitLimit = -3,
    ErrorNoMemory = -4,
    ErrorInternal = -5,
};

enum class CharSize : uint8_t {
    Char8,
    Char16
};

enum class BuiltInCharacterClassID : unsigned {
    DigitClassID,
    SpaceClassID,
    WordClassID,
    DotClassID,
    BaseUnicodePropertyID,
};

struct BytecodePattern;

} } // namespace JSC::Yarr
