/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
 * Copyright (C) 2007 Alexey Proskuryakov <ap@webkit.org>
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

#include "CSSAttrValue.h"
#include "CSSPropertyNames.h"
#include "CSSUnits.h"
#include "CSSValue.h"
#include "CSSValueKeywords.h"
#include "ExceptionOr.h"
#include "LayoutUnit.h"
#include <utility>
#include <wtf/Forward.h>
#include <wtf/MathExtras.h>

namespace WebCore {

class CSSCalcValue;
class CSSToLengthConversionData;
class FontCascade;
class RenderStyle;
class RenderView;

struct Length;

// Max/min values for CSS, needs to slightly smaller/larger than the true max/min values to allow for rounding without overflowing.
// Subtract two (rather than one) to allow for values to be converted to float and back without exceeding the LayoutUnit::max.
constexpr float maxValueForCssLength = static_cast<float>(intMaxForLayoutUnit - 2);
constexpr float minValueForCssLength = static_cast<float>(intMinForLayoutUnit + 2);

// Dimension calculations are imprecise, often resulting in values of e.g.
// 44.99998. We need to round if we're really close to the next integer value.
template<typename T> inline T roundForImpreciseConversion(double value)
{
    value += (value < 0) ? -0.01 : +0.01;
    return ((value > std::numeric_limits<T>::max()) || (value < std::numeric_limits<T>::min())) ? 0 : static_cast<T>(value);
}

template<> inline float roundForImpreciseConversion(double value)
{
    double ceiledValue = ceil(value);
    double proximityToNextInt = ceiledValue - value;
    if (proximityToNextInt <= 0.01 && value > 0)
        return static_cast<float>(ceiledValue);
    if (proximityToNextInt >= 0.99 && value < 0)
        return static_cast<float>(floor(value));
    return static_cast<float>(value);
}

class CSSPrimitiveValue final : public CSSValue {
public:
    static constexpr bool isLength(CSSUnitType);

    enum class AngleUnit { Degrees, Radians, Gradians, Turns, Canonical = Degrees };
    template<AngleUnit, typename T = double> static T computeAngle(CSSUnitType, T angle);
    static double computeDegrees(CSSUnitType unit, double angle) { return computeAngle<AngleUnit::Degrees>(unit, angle); }
    static double computeRadians(CSSUnitType unit, double angle) { return computeAngle<AngleUnit::Radians>(unit, angle); }

    enum class TimeUnit { Seconds, Milliseconds, Canonical = Seconds };
    template<TimeUnit, typename T = double> static T computeTime(CSSUnitType, T time);

    enum class FrequencyUnit { Hz, Khz, Canonical = Hz };
    template<FrequencyUnit, typename T = double> static T computeFrequency(CSSUnitType, T frequency);

    enum class ResolutionUnit { Dppx, X, Dpi, Dpcm, Canonical = Dppx };
    template<ResolutionUnit, typename T = double> static T computeResolution(CSSUnitType, T resolution);

    // FIXME: Some of these use primitiveUnitType() and some use primitiveType(). Many that use primitiveUnitType() are likely broken with calc().
    bool isAngle() const { return unitCategory(primitiveType()) == CSSUnitCategory::Angle; }
    bool isAttr() const { return primitiveUnitType() == CSSUnitType::CSS_ATTR; }
    bool isFontIndependentLength() const { return isFontIndependentLength(primitiveUnitType()); }
    bool isFontRelativeLength() const { return isFontRelativeLength(primitiveUnitType()); }
    bool isParentFontRelativeLength() const { return isPercentage() || (isFontRelativeLength() && !isRootFontRelativeLength()); }
    bool isRootFontRelativeLength() const { return isRootFontRelativeLength(primitiveUnitType()); }
    bool isQuirkyEms() const { return primitiveType() == CSSUnitType::CSS_QUIRKY_EM; }
    bool isLength() const { return isLength(static_cast<CSSUnitType>(primitiveType())); }
    bool isNumber() const { return primitiveType() == CSSUnitType::CSS_NUMBER; }
    bool isInteger() const { return primitiveType() == CSSUnitType::CSS_INTEGER; }
    bool isNumberOrInteger() const { return isNumber() || isInteger(); }
    bool isPercentage() const { return primitiveType() == CSSUnitType::CSS_PERCENTAGE; }
    bool isPx() const { return primitiveType() == CSSUnitType::CSS_PX; }
    bool isTime() const { return unitCategory(primitiveType()) == CSSUnitCategory::Time; }
    bool isFrequency() const { return unitCategory(primitiveType()) == CSSUnitCategory::Frequency; }
    bool isCalculated() const { return primitiveUnitType() == CSSUnitType::CSS_CALC; }
    bool isCalculatedPercentageWithLength() const { return primitiveType() == CSSUnitType::CSS_CALC_PERCENTAGE_WITH_LENGTH; }
    bool isDotsPerInch() const { return primitiveType() == CSSUnitType::CSS_DPI; }
    bool isDotsPerPixel() const { return primitiveType() == CSSUnitType::CSS_DPPX; }
    bool isDotsPerCentimeter() const { return primitiveType() == CSSUnitType::CSS_DPCM; }
    bool isX() const { return primitiveType() == CSSUnitType::CSS_X; }
    bool isResolution() const { return unitCategory(primitiveType()) == CSSUnitCategory::Resolution; }
    bool isViewportPercentageLength() const { return isViewportPercentageLength(primitiveUnitType()); }
    bool isContainerPercentageLength() const { return isContainerPercentageLength(primitiveUnitType()); }
    bool isFlex() const { return primitiveType() == CSSUnitType::CSS_FR; }

    bool conversionToCanonicalUnitRequiresConversionData() const;

    static Ref<CSSPrimitiveValue> create(double);
    static Ref<CSSPrimitiveValue> create(double, CSSUnitType);
    static Ref<CSSPrimitiveValue> createInteger(double);
    static Ref<CSSPrimitiveValue> create(const Length&);
    static Ref<CSSPrimitiveValue> create(const Length&, const RenderStyle&);
    static Ref<CSSPrimitiveValue> create(Ref<CSSCalcValue>);
    static Ref<CSSPrimitiveValue> create(Ref<CSSAttrValue>);

    static inline Ref<CSSPrimitiveValue> create(CSSValueID);
    bool isValueID() const { return primitiveUnitType() == CSSUnitType::CSS_VALUE_ID; }
    CSSValueID valueID() const { return isValueID() ? m_value.valueID : CSSValueInvalid; }

    static Ref<CSSPrimitiveValue> create(CSSPropertyID);
    bool isPropertyID() const { return primitiveUnitType() == CSSUnitType::CSS_PROPERTY_ID; }
    CSSPropertyID propertyID() const { return isPropertyID() ? m_value.propertyID : CSSPropertyInvalid; }

    bool isString() const { return primitiveUnitType() == CSSUnitType::CSS_STRING; }
    static Ref<CSSPrimitiveValue> create(String);

    static Ref<CSSPrimitiveValue> createCustomIdent(String);
    bool isCustomIdent() const { return primitiveUnitType() == CSSUnitType::CustomIdent; }

    static Ref<CSSPrimitiveValue> createFontFamily(String);
    bool isFontFamily() const { return primitiveUnitType() == CSSUnitType::CSS_FONT_FAMILY; }

    static Ref<CSSPrimitiveValue> createURI(String);
    bool isURI() const { return primitiveUnitType() == CSSUnitType::CSS_URI; }

    static inline CSSPrimitiveValue& implicitInitialValue();

    ~CSSPrimitiveValue();

    WEBCORE_EXPORT CSSUnitType primitiveType() const;

    // Exposed for DeprecatedCSSOMPrimitiveValue. Throws if conversion to `targetUnit` is not allowed.
    ExceptionOr<float> getFloatValueDeprecated(CSSUnitType targetUnit) const;

    // MARK: Integer (requires `isInteger() == true`)
    template<typename T = int> T resolveAsInteger(const CSSToLengthConversionData&) const;
    template<typename T = int> T resolveAsIntegerNoConversionDataRequired() const;
    template<typename T = int> T resolveAsIntegerDeprecated() const;
    template<typename T = int> std::optional<T> resolveAsIntegerIfNotCalculated() const;

    // MARK: Number (requires `isNumberOrInteger() == true`)
    template<typename T = double> T resolveAsNumber(const CSSToLengthConversionData&) const;
    template<typename T = double> T resolveAsNumberNoConversionDataRequired() const;
    template<typename T = double> T resolveAsNumberDeprecated() const;
    template<typename T = double> std::optional<T> resolveAsNumberIfNotCalculated() const;

    // MARK: Percentage (requires `isPercentage() == true`)
    template<typename T = double> T resolveAsPercentage(const CSSToLengthConversionData&) const;
    template<typename T = double> T resolveAsPercentageNoConversionDataRequired() const;
    template<typename T = double> T resolveAsPercentageDeprecated() const;
    template<typename T = double> std::optional<T> resolveAsPercentageIfNotCalculated() const;

    // MARK: Angle (requires `isAngle() == true`)
    template<typename T = double, AngleUnit = AngleUnit::Canonical> T resolveAsAngle(const CSSToLengthConversionData&) const;
    template<typename T = double, AngleUnit = AngleUnit::Canonical> T resolveAsAngleNoConversionDataRequired() const;
    template<typename T = double, AngleUnit = AngleUnit::Canonical> T resolveAsAngleDeprecated() const;

    // MARK: Time (requires `isTime() == true`)
    template<typename T = double, TimeUnit = TimeUnit::Canonical> T resolveAsTime(const CSSToLengthConversionData&) const;
    template<typename T = double, TimeUnit = TimeUnit::Canonical> T resolveAsTimeNoConversionDataRequired() const;

    // MARK: Resolution (requires `isResolution() == true`)
    template<typename T = double, ResolutionUnit = ResolutionUnit::Canonical> T resolveAsResolution(const CSSToLengthConversionData&) const;
    template<typename T = double, ResolutionUnit = ResolutionUnit::Canonical> T resolveAsResolutionNoConversionDataRequired() const;
    template<typename T = double, ResolutionUnit = ResolutionUnit::Canonical> T resolveAsResolutionDeprecated() const;

    // MARK: Flex (requires `isFlex() == true`)
    template<typename T = double> T resolveAsFlex(const CSSToLengthConversionData&) const;
    template<typename T = double> T resolveAsFlexNoConversionDataRequired() const;

    // MARK: Length (requires `isLength() == true`)
    template<typename T = double> T resolveAsLength(const CSSToLengthConversionData&) const;
    template<typename T = double> T resolveAsLengthNoConversionDataRequired() const;
    template<typename T = double> T resolveAsLengthDeprecated() const;
    bool convertingToLengthHasRequiredConversionData(int lengthConversion, const CSSToLengthConversionData&) const;
    template<int> Length convertToLength(const CSSToLengthConversionData&) const;

    // MARK: Non-converting
    template<typename T = double> T value(const CSSToLengthConversionData& conversionData) const { return clampTo<T>(doubleValue(conversionData)); }
    template<typename T = double> T valueNoConversionDataRequired() const { return clampTo<T>(doubleValueNoConversionDataRequired()); }
    template<typename T = double> std::optional<T> valueIfNotCalculated() const;

    // MARK: Divides value by 100 if percentage.
    template<typename T = double> T valueDividingBy100IfPercentage(const CSSToLengthConversionData& conversionData) const { return clampTo<T>(doubleValueDividingBy100IfPercentage(conversionData)); }
    template<typename T = double> T valueDividingBy100IfPercentageNoConversionDataRequired() const { return clampTo<T>(doubleValueDividingBy100IfPercentageNoConversionDataRequired()); }
    template<typename T = double> T valueDividingBy100IfPercentageDeprecated() const { return clampTo<T>(doubleValueDividingBy100IfPercentageDeprecated()); }

    // These return nullopt for calc, for which range checking is not done at parse time: <https://www.w3.org/TR/css3-values/#calc-range>.
    std::optional<bool> isZero() const;
    std::optional<bool> isOne() const;
    std::optional<bool> isPositive() const;
    std::optional<bool> isNegative() const;

    WEBCORE_EXPORT String stringValue() const;
    const CSSCalcValue* cssCalcValue() const { return isCalculated() ? m_value.calc : nullptr; }
    const CSSAttrValue* cssAttrValue() const { return isAttr() ? m_value.attr : nullptr; }

    String customCSSText() const;

    bool equals(const CSSPrimitiveValue&) const;

    static std::optional<double> conversionToCanonicalUnitsScaleFactor(CSSUnitType);
    static ASCIILiteral unitTypeString(CSSUnitType);

    static double computeUnzoomedNonCalcLengthDouble(CSSUnitType, double value, CSSPropertyID, const FontCascade* = nullptr, const RenderView* = nullptr);
    static double computeNonCalcLengthDouble(const CSSToLengthConversionData&, CSSUnitType, double value);
    // True if computeNonCalcLengthDouble would produce identical results when resolved against both these styles.
    static bool equalForLengthResolution(const RenderStyle&, const RenderStyle&);

    void collectComputedStyleDependencies(ComputedStyleDependencies&) const;

    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>&) const;

private:
    friend class CSSValuePool;
    friend class StaticCSSValuePool;
    friend LazyNeverDestroyed<CSSPrimitiveValue>;
    friend bool CSSValue::addHash(Hasher&) const;

    explicit CSSPrimitiveValue(CSSPropertyID);
    explicit CSSPrimitiveValue(const Length&);
    CSSPrimitiveValue(const Length&, const RenderStyle&);
    CSSPrimitiveValue(const String&, CSSUnitType);
    CSSPrimitiveValue(double, CSSUnitType);
    explicit CSSPrimitiveValue(Ref<CSSCalcValue>);
    explicit CSSPrimitiveValue(Ref<CSSAttrValue>);

    CSSPrimitiveValue(StaticCSSValueTag, CSSValueID);
    CSSPrimitiveValue(StaticCSSValueTag, double, CSSUnitType);
    enum ImplicitInitialValueTag { ImplicitInitialValue };
    CSSPrimitiveValue(StaticCSSValueTag, ImplicitInitialValueTag);

    CSSUnitType primitiveUnitType() const { return static_cast<CSSUnitType>(m_primitiveUnitType); }
    void setPrimitiveUnitType(CSSUnitType type) { m_primitiveUnitType = enumToUnderlyingType(type); }

    // MARK: Length converting
    double resolveAsLengthDouble(const CSSToLengthConversionData&) const;

    // MARK: Arbitrarily converting
    double doubleValue(CSSUnitType targetUnit, const CSSToLengthConversionData&) const;
    double doubleValueNoConversionDataRequired(CSSUnitType targetUnit) const;
    double doubleValueDeprecated(CSSUnitType targetUnit) const;

    template<typename T = double> inline T value(CSSUnitType targetUnit, const CSSToLengthConversionData& conversionData) const { return clampTo<T>(doubleValue(targetUnit, conversionData)); }
    template<typename T = double> inline T valueNoConversionDataRequired(CSSUnitType targetUnit) const { return clampTo<T>(doubleValueNoConversionDataRequired(targetUnit)); }
    template<typename T = double> inline T valueDeprecated(CSSUnitType targetUnit) const { return clampTo<T>(doubleValueDeprecated(targetUnit)); }

    // MARK: Non-converting
    double doubleValue(const CSSToLengthConversionData&) const;
    double doubleValueNoConversionDataRequired() const { ASSERT(!isCalculated()); return m_value.number; }
    double doubleValueDeprecated() const;
    double doubleValueDividingBy100IfPercentage(const CSSToLengthConversionData&) const;
    double doubleValueDividingBy100IfPercentageNoConversionDataRequired() const;
    double doubleValueDividingBy100IfPercentageDeprecated() const;
    template<typename T = double> inline T valueDeprecated() const { return clampTo<T>(doubleValueDeprecated()); }

    std::optional<double> doubleValueInternal(CSSUnitType targetUnit, const CSSToLengthConversionData&) const;
    std::optional<double> doubleValueInternalDeprecated(CSSUnitType targetUnit) const;

    bool addDerivedHash(Hasher&) const;

    ALWAYS_INLINE String serializeInternal() const;
    NEVER_INLINE String formatNumberValue(ASCIILiteral suffix) const;
    NEVER_INLINE String formatIntegerValue(ASCIILiteral suffix) const;
    static constexpr bool isFontIndependentLength(CSSUnitType);
    static constexpr bool isFontRelativeLength(CSSUnitType);
    static constexpr bool isRootFontRelativeLength(CSSUnitType);
    static constexpr bool isContainerPercentageLength(CSSUnitType);
    static constexpr bool isViewportPercentageLength(CSSUnitType);

    union {
        CSSPropertyID propertyID;
        CSSValueID valueID;
        double number;
        StringImpl* string;
        const CSSCalcValue* calc;
        const CSSAttrValue* attr;
    } m_value;
};

void formatCSSNumberValue(StringBuilder&, double, ASCIILiteral suffix);
String formatCSSNumberValue(double, ASCIILiteral suffix);

template<typename TargetType> constexpr TargetType fromCSSValueID(CSSValueID);

constexpr bool CSSPrimitiveValue::isFontIndependentLength(CSSUnitType type)
{
    return type == CSSUnitType::CSS_PX
        || type == CSSUnitType::CSS_CM
        || type == CSSUnitType::CSS_MM
        || type == CSSUnitType::CSS_IN
        || type == CSSUnitType::CSS_PT
        || type == CSSUnitType::CSS_PC;
}

constexpr bool CSSPrimitiveValue::isRootFontRelativeLength(CSSUnitType type)
{
    return type == CSSUnitType::CSS_RCAP
        || type == CSSUnitType::CSS_RCH
        || type == CSSUnitType::CSS_REM
        || type == CSSUnitType::CSS_REX
        || type == CSSUnitType::CSS_RIC
        || type == CSSUnitType::CSS_RLH;
}

constexpr bool CSSPrimitiveValue::isFontRelativeLength(CSSUnitType type)
{
    return type == CSSUnitType::CSS_EM
        || type == CSSUnitType::CSS_EX
        || type == CSSUnitType::CSS_LH
        || type == CSSUnitType::CSS_CAP
        || type == CSSUnitType::CSS_CH
        || type == CSSUnitType::CSS_IC
        || type == CSSUnitType::CSS_QUIRKY_EM
        || isRootFontRelativeLength(type);
}

constexpr bool CSSPrimitiveValue::isContainerPercentageLength(CSSUnitType type)
{
    return type == CSSUnitType::CSS_CQW
        || type == CSSUnitType::CSS_CQH
        || type == CSSUnitType::CSS_CQI
        || type == CSSUnitType::CSS_CQB
        || type == CSSUnitType::CSS_CQMIN
        || type == CSSUnitType::CSS_CQMAX;
}

constexpr bool CSSPrimitiveValue::isLength(CSSUnitType type)
{
    return type == CSSUnitType::CSS_EM
        || type == CSSUnitType::CSS_EX
        || type == CSSUnitType::CSS_PX
        || type == CSSUnitType::CSS_CM
        || type == CSSUnitType::CSS_MM
        || type == CSSUnitType::CSS_IN
        || type == CSSUnitType::CSS_PT
        || type == CSSUnitType::CSS_PC
        || type == CSSUnitType::CSS_Q
        || isFontRelativeLength(type)
        || isViewportPercentageLength(type)
        || isContainerPercentageLength(type)
        || type == CSSUnitType::CSS_QUIRKY_EM;
}

constexpr bool CSSPrimitiveValue::isViewportPercentageLength(CSSUnitType type)
{
    return type >= CSSUnitType::FirstViewportCSSUnitType && type <= CSSUnitType::LastViewportCSSUnitType;
}

template<typename T> std::optional<T> CSSPrimitiveValue::valueIfNotCalculated() const
{
    if (isCalculated())
        return std::nullopt;
    return m_value.number;
}

// MARK: Integer

template<typename T> T CSSPrimitiveValue::resolveAsInteger(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isInteger());
    return value<T>(conversionData);
}

template<typename T> T CSSPrimitiveValue::resolveAsIntegerNoConversionDataRequired() const
{
    ASSERT(isInteger());
    return valueNoConversionDataRequired<T>();
}

template<typename T> T CSSPrimitiveValue::resolveAsIntegerDeprecated() const
{
    ASSERT(isInteger());
    return valueDeprecated<T>();
}

template<typename T> std::optional<T> CSSPrimitiveValue::resolveAsIntegerIfNotCalculated() const
{
    ASSERT(isInteger());
    return valueIfNotCalculated<T>();
}

// MARK: Number

template<typename T> T CSSPrimitiveValue::resolveAsNumber(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isNumberOrInteger());
    return value<T>(CSSUnitType::CSS_NUMBER, conversionData);
}

template<typename T> T CSSPrimitiveValue::resolveAsNumberNoConversionDataRequired() const
{
    ASSERT(isNumberOrInteger());
    return valueNoConversionDataRequired<T>(CSSUnitType::CSS_NUMBER);
}

template<typename T> T CSSPrimitiveValue::resolveAsNumberDeprecated() const
{
    ASSERT(isNumberOrInteger());
    return valueDeprecated<T>(CSSUnitType::CSS_NUMBER);
}

template<typename T> std::optional<T> CSSPrimitiveValue::resolveAsNumberIfNotCalculated() const
{
    ASSERT(isNumberOrInteger());
    return valueIfNotCalculated<T>();
}

// MARK: Percentage

template<typename T> T CSSPrimitiveValue::resolveAsPercentage(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isPercentage());
    return value<T>(conversionData);
}

template<typename T> T CSSPrimitiveValue::resolveAsPercentageNoConversionDataRequired() const
{
    ASSERT(isPercentage());
    return valueNoConversionDataRequired<T>();
}

template<typename T> T CSSPrimitiveValue::resolveAsPercentageDeprecated() const
{
    ASSERT(isPercentage());
    return valueDeprecated<T>();
}

template<typename T> std::optional<T> CSSPrimitiveValue::resolveAsPercentageIfNotCalculated() const
{
    ASSERT(isPercentage());
    return valueIfNotCalculated<T>();
}

// MARK: Angle

template<CSSPrimitiveValue::AngleUnit angleUnit, typename T> T CSSPrimitiveValue::computeAngle(CSSUnitType type, T angle)
{
    if constexpr (angleUnit == AngleUnit::Degrees) {
        switch (type) {
        case CSSUnitType::CSS_DEG:
            return angle;
        case CSSUnitType::CSS_RAD:
            return rad2deg(angle);
        case CSSUnitType::CSS_GRAD:
            return grad2deg(angle);
        case CSSUnitType::CSS_TURN:
            return turn2deg(angle);
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (angleUnit == AngleUnit::Radians) {
        switch (type) {
        case CSSUnitType::CSS_DEG:
            return deg2rad(angle);
        case CSSUnitType::CSS_RAD:
            return angle;
        case CSSUnitType::CSS_GRAD:
            return grad2rad(angle);
        case CSSUnitType::CSS_TURN:
            return turn2rad(angle);
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (angleUnit == AngleUnit::Gradians) {
        switch (type) {
        case CSSUnitType::CSS_DEG:
            return deg2grad(angle);
        case CSSUnitType::CSS_RAD:
            return rad2grad(angle);
        case CSSUnitType::CSS_GRAD:
            return angle;
        case CSSUnitType::CSS_TURN:
            return turn2grad(angle);
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (angleUnit == AngleUnit::Turns) {
        switch (type) {
        case CSSUnitType::CSS_DEG:
            return deg2turn(angle);
        case CSSUnitType::CSS_RAD:
            return rad2Turn(angle);
        case CSSUnitType::CSS_GRAD:
            return grad2turn(angle);
        case CSSUnitType::CSS_TURN:
            return angle;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    }
}

template<typename T, CSSPrimitiveValue::AngleUnit angleUnit> T CSSPrimitiveValue::resolveAsAngle(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isAngle());
    return clampTo<T>(computeAngle<angleUnit>(primitiveType(), value<double>(conversionData)));
}

template<typename T, CSSPrimitiveValue::AngleUnit angleUnit> T CSSPrimitiveValue::resolveAsAngleNoConversionDataRequired() const
{
    ASSERT(isAngle());
    return clampTo<T>(computeAngle<angleUnit>(primitiveType(), valueNoConversionDataRequired<double>()));
}

template<typename T, CSSPrimitiveValue::AngleUnit angleUnit> T CSSPrimitiveValue::resolveAsAngleDeprecated() const
{
    ASSERT(isAngle());
    return clampTo<T>(computeAngle<angleUnit>(primitiveType(), valueDeprecated<double>()));
}

// MARK: Time

template<CSSPrimitiveValue::TimeUnit timeUnit, typename T> inline T CSSPrimitiveValue::computeTime(CSSUnitType type, T value)
{
    if constexpr (timeUnit == TimeUnit::Seconds) {
        switch (type) {
        case CSSUnitType::CSS_S:
            return value;
        case CSSUnitType::CSS_MS:
            return value * CSS::secondsPerMillisecond;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (timeUnit == TimeUnit::Milliseconds) {
        switch (type) {
        case CSSUnitType::CSS_S:
            return value / CSS::secondsPerMillisecond;
        case CSSUnitType::CSS_MS:
            return value;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    }
}

template<typename T, CSSPrimitiveValue::TimeUnit timeUnit> T CSSPrimitiveValue::resolveAsTime(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isTime());
    return clampTo<T>(computeTime<timeUnit>(primitiveType(), value<double>(conversionData)));
}

template<typename T, CSSPrimitiveValue::TimeUnit timeUnit> T CSSPrimitiveValue::resolveAsTimeNoConversionDataRequired() const
{
    ASSERT(isTime());
    return clampTo<T>(computeTime<timeUnit>(primitiveType(), valueNoConversionDataRequired<double>()));
}

// MARK: Frequency

template<CSSPrimitiveValue::FrequencyUnit frequencyUnit, typename T> inline T CSSPrimitiveValue::computeFrequency(CSSUnitType type, T value)
{
    if constexpr (frequencyUnit == FrequencyUnit::Hz) {
        switch (type) {
        case CSSUnitType::CSS_HZ:
            return value;
        case CSSUnitType::CSS_KHZ:
            return value * CSS::hertzPerKilohertz;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (frequencyUnit == FrequencyUnit::Khz) {
        switch (type) {
        case CSSUnitType::CSS_HZ:
            return value / CSS::hertzPerKilohertz;
        case CSSUnitType::CSS_KHZ:
            return value;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    }
}


// MARK: Resolution

template<CSSPrimitiveValue::ResolutionUnit resolutionUnit, typename T> inline T CSSPrimitiveValue::computeResolution(CSSUnitType type, T resolution)
{
    if constexpr (resolutionUnit == ResolutionUnit::Dppx) {
        switch (type) {
        case CSSUnitType::CSS_DPPX:
            return resolution;
        case CSSUnitType::CSS_X:
            return resolution * CSS::dppxPerX;
        case CSSUnitType::CSS_DPI:
            return resolution * CSS::dppxPerDpi;
        case CSSUnitType::CSS_DPCM:
            return resolution * CSS::dppxPerDpcm;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (resolutionUnit == ResolutionUnit::X) {
        switch (type) {
        case CSSUnitType::CSS_DPPX:
            return resolution / CSS::dppxPerX;
        case CSSUnitType::CSS_X:
            return resolution;
        case CSSUnitType::CSS_DPI:
            return resolution * CSS::dppxPerDpi / CSS::dppxPerX;
        case CSSUnitType::CSS_DPCM:
            return resolution * CSS::dppxPerDpcm / CSS::dppxPerX;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (resolutionUnit == ResolutionUnit::Dpi) {
        switch (type) {
        case CSSUnitType::CSS_DPPX:
            return resolution / CSS::dppxPerDpi;
        case CSSUnitType::CSS_X:
            return resolution * CSS::dppxPerX / CSS::dppxPerDpi;
        case CSSUnitType::CSS_DPI:
            return resolution;
        case CSSUnitType::CSS_DPCM:
            return resolution * CSS::dppxPerDpcm / CSS::dppxPerDpi;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    } else if constexpr (resolutionUnit == ResolutionUnit::Dpcm) {
        switch (type) {
        case CSSUnitType::CSS_DPPX:
            return resolution / CSS::dppxPerDpcm;
        case CSSUnitType::CSS_X:
            return resolution * CSS::dppxPerX / CSS::dppxPerDpcm;
        case CSSUnitType::CSS_DPI:
            return resolution * CSS::dppxPerDpi / CSS::dppxPerDpcm;
        case CSSUnitType::CSS_DPCM:
            return resolution;
        default:
            ASSERT_NOT_REACHED();
            return 0;
        }
    }

    ASSERT_NOT_REACHED();
    return 0;
}

template<typename T, CSSPrimitiveValue::ResolutionUnit resolutionUnit> T CSSPrimitiveValue::resolveAsResolution(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isResolution());
    return clampTo<T>(computeResolution<resolutionUnit>(primitiveType(), value<double>(conversionData)));
}

template<typename T, CSSPrimitiveValue::ResolutionUnit resolutionUnit> T CSSPrimitiveValue::resolveAsResolutionNoConversionDataRequired() const
{
    ASSERT(isResolution());
    return clampTo<T>(computeResolution<resolutionUnit>(primitiveType(), valueNoConversionDataRequired<double>()));
}

template<typename T, CSSPrimitiveValue::ResolutionUnit resolutionUnit> T CSSPrimitiveValue::resolveAsResolutionDeprecated() const
{
    ASSERT(isResolution());
    return clampTo<T>(computeResolution<resolutionUnit>(primitiveType(), valueDeprecated<double>()));
}

// MARK: Flex

template<typename T> T CSSPrimitiveValue::resolveAsFlex(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isFlex());
    return value<T>(conversionData);
}

template<typename T> T CSSPrimitiveValue::resolveAsFlexNoConversionDataRequired() const
{
    ASSERT(isFlex());
    return valueNoConversionDataRequired<T>();
}

// MARK: Length

template<typename T> T CSSPrimitiveValue::resolveAsLengthNoConversionDataRequired() const
{
    ASSERT(isLength());
    return valueNoConversionDataRequired<T>(CSSUnitType::CSS_PX);
}

template<typename T> T CSSPrimitiveValue::resolveAsLengthDeprecated() const
{
    ASSERT(isLength());
    return valueDeprecated<T>(CSSUnitType::CSS_PX);
}

// MARK: valueID(...)

inline CSSValueID valueID(const CSSPrimitiveValue& value)
{
    return value.valueID();
}

inline CSSValueID valueID(const CSSPrimitiveValue* value)
{
    return value ? valueID(*value) : CSSValueInvalid;
}

inline CSSValueID valueID(const CSSValue& value)
{
    auto* primitiveValue = dynamicDowncast<CSSPrimitiveValue>(value);
    return primitiveValue ? valueID(*primitiveValue) : CSSValueInvalid;
}

inline CSSValueID valueID(const CSSValue* value)
{
    return value ? valueID(*value) : CSSValueInvalid;
}

inline bool isValueID(const CSSPrimitiveValue& value, CSSValueID id)
{
    return valueID(value) == id;
}

inline bool isValueID(const CSSPrimitiveValue* value, CSSValueID id)
{
    return valueID(value) == id;
}

inline bool isValueID(const RefPtr<CSSPrimitiveValue>& value, CSSValueID id)
{
    return valueID(value.get()) == id;
}

inline bool isValueID(const Ref<CSSPrimitiveValue>& value, CSSValueID id)
{
    return valueID(value.get()) == id;
}

inline bool isValueID(const CSSValue& value, CSSValueID id)
{
    return valueID(value) == id;
}

inline bool isValueID(const CSSValue* value, CSSValueID id)
{
    return valueID(value) == id;
}

inline bool isValueID(const RefPtr<CSSValue>& value, CSSValueID id)
{
    return isValueID(value.get(), id);
}

inline bool isValueID(const Ref<CSSValue>& value, CSSValueID id)
{
    return isValueID(value.get(), id);
}

inline bool CSSValue::isValueID() const
{
    auto* value = dynamicDowncast<CSSPrimitiveValue>(*this);
    return value && value->isValueID();
}

inline CSSValueID CSSValue::valueID() const
{
    auto* value = dynamicDowncast<CSSPrimitiveValue>(*this);
    return value ? value->valueID() : CSSValueInvalid;
}

inline bool CSSValue::isCustomIdent() const
{
    auto* value = dynamicDowncast<CSSPrimitiveValue>(*this);
    return value && value->isCustomIdent();
}

inline String CSSValue::customIdent() const
{
    ASSERT(isCustomIdent());
    return downcast<CSSPrimitiveValue>(*this).stringValue();
}

inline bool CSSValue::isInteger() const
{
    auto* value = dynamicDowncast<CSSPrimitiveValue>(*this);
    return value && value->isInteger();
}

inline int CSSValue::integer(const CSSToLengthConversionData& conversionData) const
{
    ASSERT(isInteger());
    return downcast<CSSPrimitiveValue>(*this).resolveAsInteger(conversionData);
}

inline int CSSValue::integerDeprecated() const
{
    ASSERT(isInteger());
    return downcast<CSSPrimitiveValue>(*this).resolveAsIntegerDeprecated();
}

void add(Hasher&, const CSSPrimitiveValue&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_CSS_VALUE(CSSPrimitiveValue, isPrimitiveValue())
