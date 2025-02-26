/*
 * Copyright (C) 2022 Apple Inc.  All rights reserved.
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

#include <wtf/Forward.h>
#include <wtf/OptionSet.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class CSSValue;
class StyleProperties;

struct CSSCounterStyleDescriptors {
    using Name = AtomString;
    using Ranges = Vector<std::pair<int, int>>;
    using SystemData = std::pair<CSSCounterStyleDescriptors::Name, int>;
    // The keywords that can be used as values for the counter-style `system` descriptor.
    // https://www.w3.org/TR/css-counter-styles-3/#counter-style-system
    struct Symbol {
        bool isCustomIdent { false };
        String text;
        friend bool operator==(const Symbol&, const Symbol&) = default;
        String cssText() const;
    };
    using AdditiveSymbols = Vector<std::pair<Symbol, unsigned>>;
    enum class System : uint8_t {
        Cyclic,
        Numeric,
        Alphabetic,
        Symbolic,
        Additive,
        Fixed,
        DisclosureClosed,
        DisclosureOpen,
        SimplifiedChineseInformal,
        SimplifiedChineseFormal,
        TraditionalChineseInformal,
        TraditionalChineseFormal,
        EthiopicNumeric,
        Extends
    };
    enum class SpeakAs : uint8_t {
        Auto,
        Bullets,
        Numbers,
        Words,
        SpellOut,
        CounterStyleNameReference,
    };
    struct Pad {
        unsigned m_padMinimumLength = 0;
        Symbol m_padSymbol;
        friend bool operator==(const Pad&, const Pad&) = default;
        String cssText() const;
    };
    struct NegativeSymbols {
        Symbol m_prefix = { false, "-"_s };
        Symbol m_suffix;
        friend bool operator==(const NegativeSymbols&, const NegativeSymbols&) = default;
    };
    enum class ExplicitlySetDescriptors: uint16_t {
        System = 1 << 0,
        Negative = 1 << 1,
        Prefix = 1 << 2,
        Suffix = 1 << 3,
        Range = 1 << 4,
        Pad = 1 << 5,
        Fallback = 1 << 6,
        Symbols = 1 << 7,
        AdditiveSymbols = 1 << 8,
        SpeakAs = 1 << 9
    };

    // create() is prefered here rather than a custom constructor, so that the Struct still classifies as an aggregate.
    static CSSCounterStyleDescriptors create(AtomString name, const StyleProperties&);
    bool operator==(const CSSCounterStyleDescriptors& other) const
    {
        // Intentionally doesn't check m_isExtendedResolved.
        return m_name == other.m_name
            && m_system == other.m_system
            && m_negativeSymbols == other.m_negativeSymbols
            && m_prefix == other.m_prefix
            && m_suffix == other.m_suffix
            && m_ranges == other.m_ranges
            && m_pad == other.m_pad
            && m_fallbackName == other.m_fallbackName
            && m_symbols == other.m_symbols
            && m_additiveSymbols == other.m_additiveSymbols
            && m_speakAs == other.m_speakAs
            && m_extendsName == other.m_extendsName
            && m_fixedSystemFirstSymbolValue == other.m_fixedSystemFirstSymbolValue
            && m_explicitlySetDescriptors == other.m_explicitlySetDescriptors;
    }
    void setExplicitlySetDescriptors(const StyleProperties&);
    bool isValid() const;
    static bool areSymbolsValidForSystem(System, const Vector<Symbol>&, const AdditiveSymbols&);

    void setName(Name);
    void setSystem(System);
    void setSystemData(SystemData);
    void setNegative(NegativeSymbols);
    void setPrefix(Symbol);
    void setSuffix(Symbol);
    void setRanges(Ranges);
    void setPad(Pad);
    void setFallbackName(Name);
    void setSymbols(Vector<Symbol>);
    void setAdditiveSymbols(AdditiveSymbols);

    String nameCSSText() const;
    String systemCSSText() const;
    String negativeCSSText() const;
    String prefixCSSText() const;
    String suffixCSSText() const;
    String rangesCSSText() const;
    String padCSSText() const;
    String fallbackCSSText() const;
    String symbolsCSSText() const;
    String additiveSymbolsCSSText() const;

    Name m_name;
    System m_system;
    NegativeSymbols m_negativeSymbols;
    Symbol m_prefix;
    Symbol m_suffix;
    Ranges m_ranges;
    Pad m_pad;
    Name m_fallbackName;
    Vector<Symbol> m_symbols;
    AdditiveSymbols m_additiveSymbols;
    SpeakAs m_speakAs;
    Name m_extendsName;
    int m_fixedSystemFirstSymbolValue;
    OptionSet<ExplicitlySetDescriptors> m_explicitlySetDescriptors;
    bool m_isExtendedResolved { false };
};

CSSCounterStyleDescriptors::Ranges rangeFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::AdditiveSymbols additiveSymbolsFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::Pad padFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::NegativeSymbols negativeSymbolsFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::Symbol symbolFromCSSValue(RefPtr<CSSValue>);
Vector<CSSCounterStyleDescriptors::Symbol> symbolsFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::Name fallbackNameFromCSSValue(Ref<CSSValue>);
CSSCounterStyleDescriptors::SystemData extractSystemDataFromCSSValue(RefPtr<CSSValue>, CSSCounterStyleDescriptors::System);
} // namespace WebCore
