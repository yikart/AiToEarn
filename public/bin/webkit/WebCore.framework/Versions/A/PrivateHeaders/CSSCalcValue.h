/*
 * Copyright (C) 2011, 2012 Google Inc. All rights reserved.
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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

#include "CSSCalcTree.h"
#include "CSSValue.h"
#include <wtf/Forward.h>
#include <wtf/Ref.h>

namespace WebCore {

namespace Calculation {
enum class Category : uint8_t;
}

namespace CSS {
struct Range;
}

class CSSCalcSymbolTable;
class CSSCalcSymbolsAllowed;
class CSSParserTokenRange;
class CSSToLengthConversionData;
class CalculationValue;
class RenderStyle;

struct CSSParserContext;
struct CSSPropertyParserOptions;
struct Length;
struct NoConversionDataRequiredToken;

enum CSSValueID : uint16_t;

enum class CSSUnitType : uint8_t;

class CSSCalcValue final : public CSSValue {
public:
    static RefPtr<CSSCalcValue> parse(CSSParserTokenRange&, const CSSParserContext&, Calculation::Category, CSS::Range, CSSCalcSymbolsAllowed, CSSPropertyParserOptions);

    static Ref<CSSCalcValue> create(const CalculationValue&, const RenderStyle&);
    static Ref<CSSCalcValue> create(CSSCalc::Tree&&);

    ~CSSCalcValue();

    // Creates a copy of the CSSCalc::Tree with non-canonical dimensions and any symbols present in the provided symbol table resolved.
    Ref<CSSCalcValue> copySimplified(const CSSToLengthConversionData&) const;
    Ref<CSSCalcValue> copySimplified(const CSSToLengthConversionData&, const CSSCalcSymbolTable&) const;

    Calculation::Category category() const { return m_tree.category; }
    CSSUnitType primitiveType() const;

    // Returns whether the CSSCalc::Tree requires `CSSToLengthConversionData` to fully resolve.
    bool requiresConversionData() const;

    double doubleValue(const CSSToLengthConversionData&) const;
    double doubleValue(const CSSToLengthConversionData&, const CSSCalcSymbolTable&) const;
    double doubleValue(NoConversionDataRequiredToken) const;
    double doubleValue(NoConversionDataRequiredToken, const CSSCalcSymbolTable&) const;
    double doubleValueDeprecated() const;

    double computeLengthPx(const CSSToLengthConversionData&) const;
    double computeLengthPx(const CSSToLengthConversionData&, const CSSCalcSymbolTable&) const;

    Ref<CalculationValue> createCalculationValue(NoConversionDataRequiredToken) const;
    Ref<CalculationValue> createCalculationValue(NoConversionDataRequiredToken, const CSSCalcSymbolTable&) const;
    Ref<CalculationValue> createCalculationValue(const CSSToLengthConversionData&) const;
    Ref<CalculationValue> createCalculationValue(const CSSToLengthConversionData&, const CSSCalcSymbolTable&) const;

    void collectComputedStyleDependencies(ComputedStyleDependencies&) const;

    String customCSSText() const;
    bool equals(const CSSCalcValue&) const;

    void dump(TextStream&) const;

    const CSSCalc::Tree& tree() const { return m_tree; }

private:
    explicit CSSCalcValue(CSSCalc::Tree&&);

    double clampToPermittedRange(double) const;

    CSSCalc::Tree m_tree;
};

TextStream& operator<<(TextStream&, const CSSCalcValue&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSCalcValue, isCalcValue())
