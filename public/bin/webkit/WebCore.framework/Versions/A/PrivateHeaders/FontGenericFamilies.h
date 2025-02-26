/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "WebKitFontFamilyNames.h"
#include <unicode/uscript.h>
#include <wtf/HashMap.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/text/AtomString.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

// UScriptCode uses -1 and 0 for UScriptInvalidCode and UScriptCommon.
// We need to use -2 and -3 for empty value and deleted value.
struct UScriptCodeHashTraits : HashTraits<int> {
    static const bool emptyValueIsZero = false;
    static int emptyValue() { return -2; }
    static void constructDeletedValue(int& slot) { slot = -3; }
    static bool isDeletedValue(int value) { return value == -3; }
};

typedef UncheckedKeyHashMap<int, String, DefaultHash<int>, UScriptCodeHashTraits> ScriptFontFamilyMap;

class FontGenericFamilies {
    WTF_MAKE_TZONE_ALLOCATED(FontGenericFamilies);
public:
    FontGenericFamilies();

    FontGenericFamilies isolatedCopy() const &;
    FontGenericFamilies isolatedCopy() &&;

    const String& standardFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& fixedFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& serifFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& sansSerifFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& cursiveFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& fantasyFontFamily(UScriptCode = USCRIPT_COMMON) const;
    const String& pictographFontFamily(UScriptCode = USCRIPT_COMMON) const;

    const String* fontFamily(WebKitFontFamilyNames::FamilyNamesIndex, UScriptCode = USCRIPT_COMMON) const;

    bool setStandardFontFamily(const String&, UScriptCode);
    bool setFixedFontFamily(const String&, UScriptCode);
    bool setSerifFontFamily(const String&, UScriptCode);
    bool setSansSerifFontFamily(const String&, UScriptCode);
    bool setCursiveFontFamily(const String&, UScriptCode);
    bool setFantasyFontFamily(const String&, UScriptCode);
    bool setPictographFontFamily(const String&, UScriptCode);

private:
    ScriptFontFamilyMap m_standardFontFamilyMap;
    ScriptFontFamilyMap m_serifFontFamilyMap;
    ScriptFontFamilyMap m_fixedFontFamilyMap;
    ScriptFontFamilyMap m_sansSerifFontFamilyMap;
    ScriptFontFamilyMap m_cursiveFontFamilyMap;
    ScriptFontFamilyMap m_fantasyFontFamilyMap;
    ScriptFontFamilyMap m_pictographFontFamilyMap;
};

}
