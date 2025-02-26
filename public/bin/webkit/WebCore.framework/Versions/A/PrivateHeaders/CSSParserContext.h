/*
 * Copyright (C) 2018-2023 Apple Inc. All rights reserved.
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

#include "CSSParserMode.h"
#include "CSSPropertyNames.h"
#include "StyleRuleType.h"
#include <pal/text/TextEncoding.h>
#include <wtf/HashFunctions.h>
#include <wtf/Hasher.h>
#include <wtf/URL.h>

namespace WebCore {

class Document;

struct ResolvedURL {
    String specifiedURLString;
    URL resolvedURL;

    bool isLocalURL() const;
};

inline ResolvedURL makeResolvedURL(URL&& resolvedURL)
{
    auto string = resolvedURL.string();
    return { WTFMove(string), WTFMove(resolvedURL) };
}

inline bool operator==(const ResolvedURL& a, const ResolvedURL& b)
{
    return a.specifiedURLString == b.specifiedURLString && a.resolvedURL == b.resolvedURL;
}

bool mayDependOnBaseURL(const ResolvedURL&);

struct CSSParserContext {
    WTF_MAKE_STRUCT_FAST_ALLOCATED;

    URL baseURL;
    ASCIILiteral charset;
    CSSParserMode mode { HTMLStandardMode };
    std::optional<StyleRuleType> enclosingRuleType;
    bool isHTMLDocument : 1 { false };

    // This is only needed to support getMatchedCSSRules.
    bool hasDocumentSecurityOrigin : 1 { false };

    bool isContentOpaque : 1 { false };
    bool useSystemAppearance : 1 { false };
    bool shouldIgnoreImportRules : 1 { false };

    // Settings, excluding those affecting properties.
    bool counterStyleAtRuleImageSymbolsEnabled : 1 { false };
    bool springTimingFunctionEnabled : 1 { false };
#if HAVE(CORE_ANIMATION_SEPARATED_LAYERS)
    bool cssTransformStyleSeparatedEnabled : 1 { false };
#endif
    bool masonryEnabled : 1 { false };
    bool cssAppearanceBaseEnabled : 1 { false };
    bool cssNestingEnabled : 1 { false };
    bool cssPaintingAPIEnabled : 1 { false };
    bool cssScopeAtRuleEnabled : 1 { false };
    bool cssShapeFunctionEnabled : 1 { false };
    bool cssStartingStyleAtRuleEnabled : 1 { false };
    bool cssStyleQueriesEnabled : 1 { false };
    bool cssTextUnderlinePositionLeftRightEnabled : 1 { false };
    bool cssBackgroundClipBorderAreaEnabled : 1 { false };
    bool cssWordBreakAutoPhraseEnabled : 1 { false };
    bool popoverAttributeEnabled : 1 { false };
    bool sidewaysWritingModesEnabled : 1 { false };
    bool cssTextWrapPrettyEnabled : 1 { false };
    bool thumbAndTrackPseudoElementsEnabled : 1 { false };
#if ENABLE(SERVICE_CONTROLS)
    bool imageControlsEnabled : 1 { false };
#endif
    bool colorLayersEnabled : 1 { false };
    bool lightDarkColorEnabled : 1 { false };
    bool contrastColorEnabled : 1 { false };
    bool targetTextPseudoElementEnabled : 1 { false };
    bool viewTransitionTypesEnabled : 1 { false };
    bool cssProgressFunctionEnabled : 1 { false };
    bool cssMediaProgressFunctionEnabled : 1 { false };
    bool cssContainerProgressFunctionEnabled : 1 { false };

    // Settings, those affecting properties.
    CSSPropertySettings propertySettings;

    CSSParserContext(CSSParserMode, const URL& baseURL = URL());
    WEBCORE_EXPORT CSSParserContext(const Document&);
    CSSParserContext(const Document&, const URL& baseURL, ASCIILiteral charset = ""_s);
    ResolvedURL completeURL(const String&) const;

    bool operator==(const CSSParserContext&) const = default;
};

void add(Hasher&, const CSSParserContext&);

WEBCORE_EXPORT const CSSParserContext& strictCSSParserContext();

struct CSSParserContextHash {
    static unsigned hash(const CSSParserContext& context) { return computeHash(context); }
    static bool equal(const CSSParserContext& a, const CSSParserContext& b) { return a == b; }
    static const bool safeToCompareToEmptyOrDeleted = false;
};

} // namespace WebCore

namespace WTF {

template<> struct HashTraits<WebCore::CSSParserContext> : GenericHashTraits<WebCore::CSSParserContext> {
    static void constructDeletedValue(WebCore::CSSParserContext& slot) { new (NotNull, &slot.baseURL) URL(WTF::HashTableDeletedValue); }
    static bool isDeletedValue(const WebCore::CSSParserContext& value) { return value.baseURL.isHashTableDeletedValue(); }
    static WebCore::CSSParserContext emptyValue() { return WebCore::CSSParserContext(WebCore::HTMLStandardMode); }
};

template<> struct DefaultHash<WebCore::CSSParserContext> : WebCore::CSSParserContextHash { };

} // namespace WTF
