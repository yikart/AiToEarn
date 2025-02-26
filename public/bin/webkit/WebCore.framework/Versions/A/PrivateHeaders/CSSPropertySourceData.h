/*
 * Copyright (c) 2010 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "StyleRuleType.h"
#include <utility>
#include <wtf/Forward.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class StyleRuleBase;

struct SourceRange {
    SourceRange();
    SourceRange(unsigned start, unsigned end);
    unsigned length() const;

    unsigned start;
    unsigned end;
};

struct CSSPropertySourceData {
    CSSPropertySourceData(const String& name, const String& value, bool important, bool disabled, bool parsedOk, const SourceRange&);
    CSSPropertySourceData(const CSSPropertySourceData& other);
    CSSPropertySourceData();

    String toString() const;
    unsigned hash() const;

    String name;
    String value;
    bool important { false };
    bool disabled { false };
    bool parsedOk { false };
    SourceRange range;
};

struct CSSStyleSourceData : public RefCounted<CSSStyleSourceData> {
    static Ref<CSSStyleSourceData> create()
    {
        return adoptRef(*new CSSStyleSourceData);
    }

    Vector<CSSPropertySourceData> propertyData;
};

struct CSSRuleSourceData;
typedef Vector<Ref<CSSRuleSourceData>> RuleSourceDataList;
typedef Vector<SourceRange> SelectorRangeList;

struct CSSRuleSourceData : public RefCounted<CSSRuleSourceData> {
    static Ref<CSSRuleSourceData> create(StyleRuleType type)
    {
        return adoptRef(*new CSSRuleSourceData(type));
    }

    static Ref<CSSRuleSourceData> createUnknown()
    {
        return adoptRef(*new CSSRuleSourceData(StyleRuleType::Unknown));
    }

    CSSRuleSourceData(StyleRuleType type)
        : type(type)
        , styleSourceData(CSSStyleSourceData::create())
    {
    }

    StyleRuleType type;

    // Range of the selector list in the enclosing source.
    SourceRange ruleHeaderRange;

    // Range of the rule body (e.g. style text for style rules) in the enclosing source.
    SourceRange ruleBodyRange;

    // Only for CSSStyleRules. Not applicable if `isImplicitlyNested`.
    SelectorRangeList selectorRanges;

    RefPtr<CSSStyleSourceData> styleSourceData;

    RuleSourceDataList childRules;

    bool isImplicitlyNested { false };
    bool containsImplicitlyNestedProperties { false };
};

} // namespace WebCore
