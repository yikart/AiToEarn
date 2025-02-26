/*
 * Copyright (C) 2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2022 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Eric Seidel <eric@webkit.org>
 * Copyright (C) 2009 - 2010  Torch Mobile (Beijing) Co. Ltd. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public
 * License as published by the Free Software Foundation; either
 * version 2 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Library General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public License
 * along with this library; see the file COPYING.LIB.  If not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor,
 * Boston, MA 02110-1301, USA.
 */

#pragma once

#include "CSSParserContext.h"
#include "CSSParserEnum.h"
#include "CSSProperty.h"
#include "CSSSelectorParser.h"
#include "CSSValue.h"
#include "ColorTypes.h"
#include "WritingMode.h"
#include <wtf/text/WTFString.h>

namespace WebCore {

class CSSParserObserver;
class CSSSelectorList;
class Color;
class Element;
class ImmutableStyleProperties;
class MutableStyleProperties;
class StyleRuleBase;
class StyleRuleNestedDeclarations;
class StyleRuleKeyframe;
class StyleSheetContents;

class CSSParser {
public:
    enum class ParseResult {
        Changed,
        Unchanged,
        Error
    };

    WEBCORE_EXPORT explicit CSSParser(const CSSParserContext&);
    WEBCORE_EXPORT ~CSSParser();

    void parseSheet(StyleSheetContents&, const String&);
    
    static RefPtr<StyleRuleBase> parseRule(const CSSParserContext&, StyleSheetContents*, const String&, CSSParserEnum::NestedContext = { });
    
    RefPtr<StyleRuleKeyframe> parseKeyframeRule(const String&);
    static Vector<double> parseKeyframeKeyList(const String&);

    bool parseSupportsCondition(const String&);

    static void parseSheetForInspector(const CSSParserContext&, StyleSheetContents&, const String&, CSSParserObserver&);
    static void parseDeclarationForInspector(const CSSParserContext&, const String&, CSSParserObserver&);

    static ParseResult parseValue(MutableStyleProperties&, CSSPropertyID, const String&, IsImportant, const CSSParserContext&);
    static ParseResult parseCustomPropertyValue(MutableStyleProperties&, const AtomString& propertyName, const String&, IsImportant, const CSSParserContext&);
    
    static RefPtr<CSSValue> parseSingleValue(CSSPropertyID, const String&, const CSSParserContext& = strictCSSParserContext());

    WEBCORE_EXPORT bool parseDeclaration(MutableStyleProperties&, const String&);
    static Ref<ImmutableStyleProperties> parseInlineStyleDeclaration(const String&, const Element&);

    WEBCORE_EXPORT std::optional<CSSSelectorList> parseSelectorList(const String&, StyleSheetContents* = nullptr, CSSParserEnum::NestedContext = { });

    // FIXME: All callers are not getting the right Settings, keyword resolution and calc resolution when using this
    // function and should switch to the parseColorRaw() function in CSSPropertyParserConsumer+Color.h.
    WEBCORE_EXPORT static Color parseColorWithoutContext(const String&, bool strict = false);

    static std::optional<SRGBA<uint8_t>> parseNamedColor(StringView);
    static std::optional<SRGBA<uint8_t>> parseHexColor(StringView);

private:
    ParseResult parseValue(MutableStyleProperties&, CSSPropertyID, const String&, IsImportant);

    CSSParserContext m_context;
};

} // namespace WebCore
