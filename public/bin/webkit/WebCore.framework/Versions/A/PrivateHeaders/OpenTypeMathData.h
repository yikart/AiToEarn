/*
 * Copyright (C) 2014 Frederic Wang (fred.wang@free.fr). All rights reserved.
 * Copyright (C) 2016 Igalia S.L. All rights reserved.
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

#if ENABLE(MATHML)

#include "Glyph.h"
#include <wtf/Forward.h>
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>

#if USE(HARFBUZZ)
#include "HbUniquePtr.h"
#include <hb-ot.h>
#endif

namespace WebCore {

class FontPlatformData;
class SharedBuffer;
class Font;

class OpenTypeMathData : public RefCounted<OpenTypeMathData> {
public:
    static Ref<OpenTypeMathData> create(const FontPlatformData& font)
    {
        return adoptRef(*new OpenTypeMathData(font));
    }
    ~OpenTypeMathData();

#if ENABLE(OPENTYPE_MATH)
    bool hasMathData() const { return m_mathBuffer; }
#elif USE(HARFBUZZ)
    bool hasMathData() const { return m_mathFont.get(); }
#else
    bool hasMathData() const { return false; }
#endif

    // These constants are defined in the MATH table.
    // The implementation of OpenTypeMathData::getMathConstant assumes that they correspond to the indices of the MathContant table.
    enum MathConstant {
        ScriptPercentScaleDown,
        ScriptScriptPercentScaleDown,
        DelimitedSubFormulaMinHeight,
        DisplayOperatorMinHeight,
        MathLeading,
        AxisHeight,
        AccentBaseHeight,
        FlattenedAccentBaseHeight,
        SubscriptShiftDown,
        SubscriptTopMax,
        SubscriptBaselineDropMin,
        SuperscriptShiftUp,
        SuperscriptShiftUpCramped,
        SuperscriptBottomMin,
        SuperscriptBaselineDropMax,
        SubSuperscriptGapMin,
        SuperscriptBottomMaxWithSubscript,
        SpaceAfterScript,
        UpperLimitGapMin,
        UpperLimitBaselineRiseMin,
        LowerLimitGapMin,
        LowerLimitBaselineDropMin,
        StackTopShiftUp,
        StackTopDisplayStyleShiftUp,
        StackBottomShiftDown,
        StackBottomDisplayStyleShiftDown,
        StackGapMin,
        StackDisplayStyleGapMin,
        StretchStackTopShiftUp,
        StretchStackBottomShiftDown,
        StretchStackGapAboveMin,
        StretchStackGapBelowMin,
        FractionNumeratorShiftUp,
        FractionNumeratorDisplayStyleShiftUp,
        FractionDenominatorShiftDown,
        FractionDenominatorDisplayStyleShiftDown,
        FractionNumeratorGapMin,
        FractionNumDisplayStyleGapMin,
        FractionRuleThickness,
        FractionDenominatorGapMin,
        FractionDenomDisplayStyleGapMin,
        SkewedFractionHorizontalGap,
        SkewedFractionVerticalGap,
        OverbarVerticalGap,
        OverbarRuleThickness,
        OverbarExtraAscender,
        UnderbarVerticalGap,
        UnderbarRuleThickness,
        UnderbarExtraDescender,
        RadicalVerticalGap,
        RadicalDisplayStyleVerticalGap,
        RadicalRuleThickness,
        RadicalExtraAscender,
        RadicalKernBeforeDegree,
        RadicalKernAfterDegree,
        RadicalDegreeBottomRaisePercent
    };

    struct AssemblyPart {
        Glyph glyph;
        bool isExtender;
    };

    float getMathConstant(const Font&, MathConstant) const;
    float getItalicCorrection(const Font&, Glyph) const;
    void getMathVariants(Glyph, bool isVertical, Vector<Glyph>& sizeVariants, Vector<AssemblyPart>& assemblyParts) const;

private:
    explicit OpenTypeMathData(const FontPlatformData&);

#if ENABLE(OPENTYPE_MATH)
    RefPtr<SharedBuffer> m_mathBuffer;
#elif USE(HARFBUZZ)
    HbUniquePtr<hb_font_t> m_mathFont;
#endif
};

} // namespace WebCore

#endif // ENABLE(MATHML)
