/*
 * Copyright (C) 2004, 2006, 2023 Apple Inc. All rights reserved.
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

#include <unicode/uchar.h>
#include <wtf/Forward.h>

namespace WebCore {

inline bool requiresContextForWordBoundary(char32_t character)
{
    // FIXME: This function won't be needed when https://bugs.webkit.org/show_bug.cgi?id=120656 is fixed.

    // We can get rid of this constant if we require a newer version of the ICU headers, which has U_LB_CONDITIONAL_JAPANESE_STARTER.
    constexpr int lineBreakConditionalJapaneseStarter = 37;

    int lineBreak = u_getIntPropertyValue(character, UCHAR_LINE_BREAK);
    return lineBreak == U_LB_COMPLEX_CONTEXT || lineBreak == lineBreakConditionalJapaneseStarter || lineBreak == U_LB_IDEOGRAPHIC;
}

unsigned endOfFirstWordBoundaryContext(StringView);
unsigned startOfLastWordBoundaryContext(StringView);

WEBCORE_EXPORT void findWordBoundary(StringView, int position, int* start, int* end);
void findEndWordBoundary(StringView, int position, int* end);
int findNextWordFromIndex(StringView, int position, bool forward);

}
