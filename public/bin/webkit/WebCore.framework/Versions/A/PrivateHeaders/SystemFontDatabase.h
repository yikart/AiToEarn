/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

#include "FontSelectionAlgorithm.h"
#include <array>
#include <optional>
#include <wtf/EnumeratedArray.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class SystemFontDatabase {
public:
    WEBCORE_EXPORT static SystemFontDatabase& singleton();

    enum class FontShorthand {
        // This needs to be kept in sync with CSSValue and CSSPropertyParserHelpers::lowerFontShorthand().
        Caption,
        Icon,
        Menu,
        MessageBox,
        SmallCaption,
        WebkitMiniControl,
        WebkitSmallControl,
        WebkitControl,
#if PLATFORM(COCOA)
        AppleSystemHeadline,
        AppleSystemBody,
        AppleSystemSubheadline,
        AppleSystemFootnote,
        AppleSystemCaption1,
        AppleSystemCaption2,
        AppleSystemShortHeadline,
        AppleSystemShortBody,
        AppleSystemShortSubheadline,
        AppleSystemShortFootnote,
        AppleSystemShortCaption1,
        AppleSystemTallBody,
        AppleSystemTitle0,
        AppleSystemTitle1,
        AppleSystemTitle2,
        AppleSystemTitle3,
        AppleSystemTitle4,
#endif
        StatusBar, // This has to be kept in sync with SystemFontShorthandCache below.
    };
    using FontShorthandUnderlyingType = std::underlying_type<FontShorthand>::type;

    const AtomString& systemFontShorthandFamily(FontShorthand);
    float systemFontShorthandSize(FontShorthand);
    FontSelectionValue systemFontShorthandWeight(FontShorthand);

protected:
    SystemFontDatabase();

private:
    friend class FontCache;

    void invalidate();
    void platformInvalidate();

    struct SystemFontShorthandInfo {
        AtomString family;
        float size;
        FontSelectionValue weight;
    };
    const SystemFontShorthandInfo& systemFontShorthandInfo(FontShorthand);
    static SystemFontShorthandInfo platformSystemFontShorthandInfo(FontShorthand);

    using SystemFontShorthandCache = EnumeratedArray<FontShorthand, std::optional<SystemFontShorthandInfo>, FontShorthand::StatusBar>;
    SystemFontShorthandCache m_systemFontShorthandCache;
};

} // namespace WebCore
