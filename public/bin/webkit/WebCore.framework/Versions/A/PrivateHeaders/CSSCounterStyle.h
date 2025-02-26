/*
 * Copyright (C) 2022-2024 Apple Inc.  All rights reserved.
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

#include "CSSCounterStyleDescriptors.h"
#include "WritingMode.h"
#include <wtf/Forward.h>
#include <wtf/RefCountedAndCanMakeWeakPtr.h>
#include <wtf/WeakPtr.h>
#include <wtf/text/AtomString.h>

namespace WebCore {

class StyleRuleCounterStyle;

class CSSCounterStyle : public RefCountedAndCanMakeWeakPtr<CSSCounterStyle> {
public:
    static Ref<CSSCounterStyle> create(const CSSCounterStyleDescriptors&, bool isPredefinedCounterStyle);

    bool operator==(const CSSCounterStyle& other) const
    {
        return m_descriptors == other.m_descriptors
            && m_predefinedCounterStyle == other.m_predefinedCounterStyle;
    }

    String text(int, WritingMode);
    const CSSCounterStyleDescriptors::Name& name() const { return m_descriptors.m_name; }
    CSSCounterStyleDescriptors::System system() const { return m_descriptors.m_system; }
    const CSSCounterStyleDescriptors::NegativeSymbols& negative() const { return m_descriptors.m_negativeSymbols; }
    const CSSCounterStyleDescriptors::Symbol& prefix() const { return m_descriptors.m_prefix; }
    const CSSCounterStyleDescriptors::Symbol& suffix() const { return m_descriptors.m_suffix; }
    const CSSCounterStyleDescriptors::Ranges& ranges() const { return m_descriptors.m_ranges; }
    const CSSCounterStyleDescriptors::Pad& pad() const { return m_descriptors.m_pad; }
    const CSSCounterStyleDescriptors::Name& fallbackName() const { return m_descriptors.m_fallbackName; }
    const Vector<CSSCounterStyleDescriptors::Symbol>& symbols() const { return m_descriptors.m_symbols; }
    const CSSCounterStyleDescriptors::AdditiveSymbols& additiveSymbols() const { return m_descriptors.m_additiveSymbols; }
    CSSCounterStyleDescriptors::SpeakAs speakAs() const { return m_descriptors.m_speakAs; }
    const CSSCounterStyleDescriptors::Name extendsName() const { return m_descriptors.m_extendsName; }
    int firstSymbolValueForFixedSystem() const { return m_descriptors.m_fixedSystemFirstSymbolValue; }
    const OptionSet<CSSCounterStyleDescriptors::ExplicitlySetDescriptors>& explicitlySetDescriptors() const { return m_descriptors.m_explicitlySetDescriptors; }

    void setSystem(CSSCounterStyleDescriptors::System system) { m_descriptors.m_system = system; }
    void setNegative(const CSSCounterStyleDescriptors::NegativeSymbols& negative) { m_descriptors.m_negativeSymbols = negative; }
    void setPrefix(const CSSCounterStyleDescriptors::Symbol& prefix) { m_descriptors.m_prefix = prefix; }
    void setSuffix(const CSSCounterStyleDescriptors::Symbol& suffix) { m_descriptors.m_suffix = suffix; }
    void setRanges(const CSSCounterStyleDescriptors::Ranges& ranges) { m_descriptors.m_ranges = ranges; }
    void setPad(const CSSCounterStyleDescriptors::Pad& pad) { m_descriptors.m_pad = pad; }
    void setFallbackName(const CSSCounterStyleDescriptors::Name& fallbackName) { m_descriptors.m_fallbackName = fallbackName; }
    void setSymbols(const Vector<CSSCounterStyleDescriptors::Symbol>& symbols) { m_descriptors.m_symbols = symbols; }
    void setAdditiveSymbols(const CSSCounterStyleDescriptors::AdditiveSymbols& additiveSymbols) { m_descriptors.m_additiveSymbols = additiveSymbols; }
    void setSpeakAs(CSSCounterStyleDescriptors::SpeakAs speakAs) { m_descriptors.m_speakAs = speakAs; }
    void setFirstSymbolValueForFixedSystem(int firstSymbolValue) { m_descriptors.m_fixedSystemFirstSymbolValue = firstSymbolValue; }

    void setFallbackReference(RefPtr<CSSCounterStyle>&&);
    bool isFallbackUnresolved() { return !m_fallbackReference; }
    bool isExtendsUnresolved() { return !m_descriptors.m_isExtendedResolved; };
    bool isExtendsSystem() const { return system() == CSSCounterStyleDescriptors::System::Extends; }
    void extendAndResolve(const CSSCounterStyle&);

    static String counterForSystemSimplifiedChineseInformal(int);
    static String counterForSystemSimplifiedChineseFormal(int);
    static String counterForSystemTraditionalChineseInformal(int);
    static String counterForSystemTraditionalChineseFormal(int);
    static String counterForSystemEthiopicNumeric(unsigned);
    static String counterForSystemDisclosureClosed(WritingMode);
    static String counterForSystemDisclosureOpen(WritingMode);

private:
    CSSCounterStyle(const CSSCounterStyleDescriptors&, bool isPredefinedCounterStyle);

    // https://www.w3.org/TR/css-counter-styles-3/#counter-style-range
    bool isInRange(int) const;
    // https://www.w3.org/TR/css-counter-styles-3/#counter-style-negative
    bool usesNegativeSign();
    bool shouldApplyNegativeSymbols(int) const;
    // https://www.w3.org/TR/css-counter-styles-3/#counter-style-fallback
    WeakPtr<CSSCounterStyle> fallback() const { return m_fallbackReference; };
    String fallbackText(int, WritingMode);
    // Generates a CSSCounterStyle object as it was defined by a 'decimal' descriptor. It is used as a last-resource in case we can't resolve fallback references.
    void applyPadSymbols(String&, int) const;
    void applyNegativeSymbols(String&) const;
    // Initial text representation for the counter, before applying pad and/or negative symbols. Suffix and Prefix are also not considered as described by https://www.w3.org/TR/css-counter-styles-3/#counter-styles.
    String initialRepresentation(int, WritingMode) const;

    String counterForSystemCyclic(int) const;
    String counterForSystemFixed(int) const;
    String counterForSystemSymbolic(unsigned) const;
    String counterForSystemAlphabetic(unsigned) const;
    String counterForSystemNumeric(unsigned) const;
    String counterForSystemAdditive(unsigned) const;

    bool isPredefinedCounterStyle() const { return m_predefinedCounterStyle; }
    bool isAutoRange() const { return ranges().isEmpty(); }

    // Fixed and Extends system can/must have extra data in the system descriptor (https://www.w3.org/TR/css-counter-styles-3/#fixed-system and https://www.w3.org/TR/css-counter-styles-3/#extends-system).
    void extractDataFromSystemDescriptor(const StyleRuleCounterStyle&);

    CSSCounterStyleDescriptors m_descriptors;
    bool m_predefinedCounterStyle { false };
    CSSCounterStyleDescriptors::Name m_fallbackName;
    WeakPtr<const CSSCounterStyle> m_fallbackReference { nullptr };
    WeakPtr<const CSSCounterStyle> m_extendsReference { nullptr };
    bool m_isFallingBack { false };
    bool m_isExtendedUnresolved { true };
};
} // namespace WebCore
