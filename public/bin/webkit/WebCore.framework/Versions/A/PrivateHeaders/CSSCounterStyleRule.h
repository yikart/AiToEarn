/*
 * Copyright (C) 2021 Tyler Wilcock <twilco.o@protonmail.com>.
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

#include "CSSCounterStyle.h"
#include "CSSRule.h"
#include "StyleProperties.h"
#include "StyleRule.h"
#include <wtf/text/AtomString.h>

namespace WebCore {
class StyleRuleCounterStyle final : public StyleRuleBase {
public:
    static Ref<StyleRuleCounterStyle> create(const AtomString&, CSSCounterStyleDescriptors&&);
    ~StyleRuleCounterStyle();

    Ref<StyleRuleCounterStyle> copy() const { return adoptRef(*new StyleRuleCounterStyle(*this)); }

    const CSSCounterStyleDescriptors& descriptors() const { return m_descriptors; };
    CSSCounterStyleDescriptors& mutableDescriptors() { return m_descriptors; };

    const AtomString& name() const { return m_name; }
    String system() const { return m_descriptors.systemCSSText(); }
    String negative() const { return m_descriptors.negativeCSSText(); }
    String prefix() const { return m_descriptors.prefixCSSText(); }
    String suffix() const { return m_descriptors.suffixCSSText(); }
    String range() const { return { m_descriptors.rangesCSSText() }; }
    String pad() const { return m_descriptors.padCSSText(); }
    String fallback() const { return m_descriptors.fallbackCSSText(); }
    String symbols() const { return m_descriptors.symbolsCSSText(); }
    String additiveSymbols() const { return m_descriptors.additiveSymbolsCSSText(); }
    String speakAs() const { return { }; }
    bool newValueInvalidOrEqual(CSSPropertyID, const RefPtr<CSSValue> newValue) const;

    void setName(const AtomString& name) { m_name = name; }

private:
    explicit StyleRuleCounterStyle(const AtomString&, CSSCounterStyleDescriptors&&);
    StyleRuleCounterStyle(const StyleRuleCounterStyle&) = default;

    AtomString m_name;
    CSSCounterStyleDescriptors m_descriptors;
};

class CSSCounterStyleRule final : public CSSRule {
public:
    static Ref<CSSCounterStyleRule> create(StyleRuleCounterStyle&, CSSStyleSheet*);
    virtual ~CSSCounterStyleRule();

    String cssText() const final;
    void reattach(StyleRuleBase&) final;
    StyleRuleType styleRuleType() const final { return StyleRuleType::CounterStyle; }

    String name() const { return m_counterStyleRule->name(); }
    String system() const { return m_counterStyleRule->system(); }
    String negative() const { return m_counterStyleRule->negative(); }
    String prefix() const { return m_counterStyleRule->prefix(); }
    String suffix() const { return m_counterStyleRule->suffix(); }
    String range() const { return m_counterStyleRule->range(); }
    String pad() const { return m_counterStyleRule->pad(); }
    String fallback() const { return m_counterStyleRule->fallback(); }
    String symbols() const { return m_counterStyleRule->symbols(); }
    String additiveSymbols() const { return m_counterStyleRule->additiveSymbols(); }
    String speakAs() const { return m_counterStyleRule->speakAs(); }

    void setName(const String&);
    void setSystem(const String&);
    void setNegative(const String&);
    void setPrefix(const String&);
    void setSuffix(const String&);
    void setRange(const String&);
    void setPad(const String&);
    void setFallback(const String&);
    void setSymbols(const String&);
    void setAdditiveSymbols(const String&);
    void setSpeakAs(const String&);

private:
    CSSCounterStyleRule(StyleRuleCounterStyle&, CSSStyleSheet* parent);

    bool setterInternal(CSSPropertyID, const String&);
    RefPtr<CSSValue> cssValueFromText(CSSPropertyID, const String&);
    const CSSCounterStyleDescriptors& descriptors() const { return m_counterStyleRule->descriptors(); }
    CSSCounterStyleDescriptors& mutableDescriptors() { return m_counterStyleRule->mutableDescriptors(); }

    Ref<StyleRuleCounterStyle> m_counterStyleRule;
};

CSSCounterStyleDescriptors::System toCounterStyleSystemEnum(const CSSValue*);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_RULE(CSSCounterStyleRule, StyleRuleType::CounterStyle)

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::StyleRuleCounterStyle)
static bool isType(const WebCore::StyleRuleBase& rule) { return rule.isCounterStyleRule(); }
SPECIALIZE_TYPE_TRAITS_END()
