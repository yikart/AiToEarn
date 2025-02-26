/*
 * Copyright (C) 2024 Samuel Weinig <sam@webkit.org>
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
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CSSPrimitiveNumericTypes.h"
#include "CalculationValue.h"
#include "StyleNone.h"
#include "StyleValueTypes.h"
#include <variant>
#include <wtf/Forward.h>

namespace WebCore {
namespace Style {

// Concept for use in generic contexts to filter on Numeric Style types.
template<typename T> concept StyleNumeric = requires {
    typename T::CSS;
    typename T::Raw;
};

// Concept for use in generic contexts to filter on base, single type
// primitives, excluding "dimension-percentage" types.
template<typename T> concept StyleNumericPrimitive = StyleNumeric<T> && requires {
    T::unit;
};

// Concept for use in generic contexts to filter on "dimension-percentage"
// types such as `<length-percentage>`.
template<typename T> concept StyleDimensionPercentage = StyleNumeric<T> && requires {
    typename T::Dimension;
};

// MARK: Number Primitive

template<CSS::Range R = CSS::All, typename T = int> struct Integer {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_INTEGER;
    using CSS = WebCore::CSS::Integer<R, T>;
    using Raw = WebCore::CSS::IntegerRaw<R, T>;
    using ValueType = T;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Integer<R, T>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::All> struct Number {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_NUMBER;
    using CSS = WebCore::CSS::Number<R>;
    using Raw = WebCore::CSS::NumberRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Number<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

// MARK: Percentage Primitive

template<CSS::Range R = CSS::All> struct Percentage {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_PERCENTAGE;
    using CSS = WebCore::CSS::Percentage<R>;
    using Raw = WebCore::CSS::PercentageRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Percentage<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

// MARK: Dimension Primitives

template<CSS::Range R = CSS::All> struct Angle {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_DEG;
    using CSS = WebCore::CSS::Angle<R>;
    using Raw = WebCore::CSS::AngleRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Angle<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::All> struct Length {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_PX;
    using CSS = WebCore::CSS::Length<R>;
    using Raw = WebCore::CSS::LengthRaw<R>;

    // NOTE: Unlike the other primitive numeric types, Length<> uses a `float`,
    // not a `double` for its value type.
    using ValueType = float;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Length<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::All> struct Time {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_S;
    using CSS = WebCore::CSS::Time<R>;
    using Raw = WebCore::CSS::TimeRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Time<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::All> struct Frequency {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_HZ;
    using CSS = WebCore::CSS::Frequency<R>;
    using Raw = WebCore::CSS::FrequencyRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Frequency<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::Nonnegative> struct Resolution {
    static_assert(R.min >= 0, "<resolution> values must always have a minimum range of at least 0.");
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_DPPX;
    using CSS = WebCore::CSS::Resolution<R>;
    using Raw = WebCore::CSS::ResolutionRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Resolution<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

template<CSS::Range R = CSS::All> struct Flex {
    static constexpr auto range = R;
    static constexpr auto unit = CSSUnitType::CSS_FR;
    using CSS = WebCore::CSS::Flex<R>;
    using Raw = WebCore::CSS::FlexRaw<R>;
    using ValueType = double;

    ValueType value { 0 };

    constexpr bool isZero() const { return !value; }

    constexpr bool operator==(const Flex<R>&) const = default;
    constexpr bool operator==(ValueType other) const { return value == other; };
};

// MARK: Dimension + Percentage Primitives

template<typename T> struct PrimitiveDimensionPercentageCategory;

template<auto R> struct PrimitiveDimensionPercentageCategory<Angle<R>> {
    static constexpr auto category = Calculation::Category::AnglePercentage;
};

template<auto R> struct PrimitiveDimensionPercentageCategory<Length<R>> {
    static constexpr auto category = Calculation::Category::LengthPercentage;
};

// Compact representation of std::variant<Dimension<R>, Percentage<R>, Ref<CalculationValue>> that
// takes up only 64 bits. To make this possible, the Dimension and Percentage are both stored as
// float values, matching the precedent set by WebCore::Length. Additionally, it utilizes the knowledge
// that pointers are at most 48 bits, allowing for the storage of the type tag in the remaining space.
//
// FIXME: Abstract into a generic CompactPointerVariant<Ts...> type.

template<typename D> class PrimitiveDimensionPercentage {
public:
    static constexpr auto R = D::range;

    enum class Tag : uint8_t { Dimension, Percentage, CalculationValue };

    constexpr PrimitiveDimensionPercentage(D dimension)
        : m_data { encodedPayload(dimension) | encodedTag(Tag::Dimension) }
    {
    }

    constexpr PrimitiveDimensionPercentage(Percentage<R> percentage)
        : m_data { encodedPayload(percentage) | encodedTag(Tag::Percentage) }
    {
    }

    PrimitiveDimensionPercentage(Ref<CalculationValue>&& calculationValue)
        : m_data { encodedPayload(WTFMove(calculationValue)) | encodedTag(Tag::CalculationValue) }
    {
    }

    PrimitiveDimensionPercentage(Calculation::Child&& root)
        : PrimitiveDimensionPercentage(makeCalculationValue(WTFMove(root)))
    {
    }

    PrimitiveDimensionPercentage(const PrimitiveDimensionPercentage<D>& other)
        : m_data { other.m_data }
    {
        if (isCalculationValue())
            refCalculationValue(); // Balanced by deref() in destructor.
    }

    PrimitiveDimensionPercentage(PrimitiveDimensionPercentage<D>&& other)
    {
        *this = WTFMove(other);
    }

    PrimitiveDimensionPercentage<D>& operator=(const PrimitiveDimensionPercentage<D>& other)
    {
        if (*this == other)
            return *this;

        if (isCalculationValue())
            derefCalculationValue();

        m_data = other.m_data;

        if (isCalculationValue())
            refCalculationValue();

        return *this;
    }

    PrimitiveDimensionPercentage<D>& operator=(PrimitiveDimensionPercentage<D>&& other)
    {
        if (*this == other)
            return *this;

        if (isCalculationValue())
            derefCalculationValue();

        m_data = other.m_data;
        other.m_data = movedFromValue();

        return *this;
    }

    ~PrimitiveDimensionPercentage()
    {
        if (isCalculationValue())
            derefCalculationValue(); // Balanced by leakRef() in encodedCalculationValue.
    }

    constexpr Tag tag() const { return decodedTag(m_data); }

    constexpr bool isDimension() const { return tag() == Tag::Dimension; }
    constexpr bool isPercentage() const { return tag() == Tag::Percentage; }
    constexpr bool isCalculationValue() const { return tag() == Tag::CalculationValue; }

    constexpr D asDimension() const
    {
        ASSERT(isDimension());
        return decodedDimension(m_data);
    }

    constexpr Percentage<R> asPercentage() const
    {
        ASSERT(isPercentage());
        return decodedPercentage(m_data);
    }

    Ref<CalculationValue> asCalculationValue() const
    {
        ASSERT(isCalculationValue());
        return decodedCalculationValue(m_data);
    }

    template<typename F> decltype(auto) visit(F&& functor) const
    {
        switch (tag()) {
        case Tag::Dimension:
            return std::invoke(std::forward<F>(functor), asDimension());
        case Tag::Percentage:
            return std::invoke(std::forward<F>(functor), asPercentage());
        case Tag::CalculationValue:
            return std::invoke(std::forward<F>(functor), asCalculationValue());
        }
        WTF_UNREACHABLE();
    }

    template<typename... F> decltype(auto) switchOn(F&&... functors) const
    {
        return visit(WTF::makeVisitor(std::forward<F>(functors)...));
    }

    constexpr bool isZero() const
    {
        switch (tag()) {
        case Tag::Dimension:
            return asDimension().isZero();
        case Tag::Percentage:
            return asPercentage().isZero();
        case Tag::CalculationValue:
            return false;
        }
        WTF_UNREACHABLE();
    }

    bool operator==(const PrimitiveDimensionPercentage<D>& other) const
    {
        if (tag() != other.tag())
            return false;

        switch (tag()) {
        case Tag::Dimension:
            return asDimension() == other.asDimension();
        case Tag::Percentage:
            return asPercentage() == other.asPercentage();
        case Tag::CalculationValue:
            return asCalculationValue().get() == other.asCalculationValue().get();
        }
        WTF_UNREACHABLE();
    }

private:
#if CPU(ADDRESS64)
    static constexpr unsigned maxNumberOfBitsInPointer = 48;
#else
    static constexpr unsigned maxNumberOfBitsInPointer = 32;
#endif
    static constexpr uint64_t dimensionSize = sizeof(float) * 8;
    static constexpr uint64_t dimensionMask = (1ULL << dimensionSize) - 1;
    static constexpr uint64_t percentageSize = sizeof(float) * 8;
    static constexpr uint64_t percentageMask = (1ULL << percentageSize) - 1;
    static constexpr uint64_t calculationValueSize = maxNumberOfBitsInPointer;
    static constexpr uint64_t calculationValueMask = (1ULL << calculationValueSize) - 1;
    static constexpr uint64_t tagSize = sizeof(Tag) * 8;
    static constexpr uint64_t tagShift = std::max({ dimensionSize, percentageSize, calculationValueSize });
    static_assert(tagShift + tagSize <= 64);

    static constexpr uint64_t movedFromValue()
    {
        return encodedPayload(D { 0 }) | encodedTag(Tag::Dimension);
    }

    static constexpr uint64_t encodedPayload(D dimension)
    {
        return static_cast<uint64_t>(std::bit_cast<uint32_t>(clampTo<float>(dimension.value)));
    }

    static constexpr uint64_t encodedPayload(Percentage<R> percentage)
    {
        return static_cast<uint64_t>(std::bit_cast<uint32_t>(clampTo<float>(percentage.value)));
    }

    static uint64_t encodedPayload(Ref<CalculationValue>&& calculationValue)
    {
#if CPU(ADDRESS64)
        return std::bit_cast<uint64_t>(&calculationValue.leakRef()); // Balanced by deref() in destructor.
#else
        return std::bit_cast<uint32_t>(&calculationValue.leakRef()); // Balanced by deref() in destructor.
#endif
    }

    static constexpr uint64_t encodedTag(Tag tag)
    {
        return static_cast<uint64_t>(tag) << tagShift;
    }

    static constexpr Tag decodedTag(uint64_t value)
    {
        return static_cast<Tag>(static_cast<uint8_t>(value >> tagShift));
    }

    // Payload specific decoding.

    static constexpr D decodedDimension(uint64_t value)
    {
        return { std::bit_cast<float>(static_cast<uint32_t>(value & dimensionMask)) };
    }

    static constexpr Percentage<R> decodedPercentage(uint64_t value)
    {
        return { std::bit_cast<float>(static_cast<uint32_t>(value & percentageMask)) };
    }

    static Ref<CalculationValue> decodedCalculationValue(uint64_t value)
    {
#if CPU(ADDRESS64)
        Ref<CalculationValue> calculation = *std::bit_cast<CalculationValue*>(value & calculationValueMask);
#else
        Ref<CalculationValue> calculation = *std::bit_cast<CalculationValue*>(static_cast<uint32_t>(value & calculationValueMask));
#endif
        return calculation;
    }

    // CalculationValue specific handling.

    void refCalculationValue()
    {
        ASSERT(isCalculationValue());
#if CPU(ADDRESS64)
        std::bit_cast<CalculationValue*>(m_data & calculationValueMask)->ref();
#else
        std::bit_cast<CalculationValue*>(static_cast<uint32_t>(m_data & calculationValueMask))->ref();
#endif
    }

    void derefCalculationValue()
    {
        ASSERT(isCalculationValue());
#if CPU(ADDRESS64)
        std::bit_cast<CalculationValue*>(m_data & calculationValueMask)->deref();
#else
        std::bit_cast<CalculationValue*>(static_cast<uint32_t>(m_data & calculationValueMask))->deref();
#endif
    }

    static Ref<CalculationValue> makeCalculationValue(Calculation::Child&& root)
    {
        return CalculationValue::create(
            Calculation::Tree {
                .root = WTFMove(root),
                .category = PrimitiveDimensionPercentageCategory<D>::category,
                .range = { R.min, R.max }
            }
        );
    }

    uint64_t m_data { 0 };
};

template<CSS::Range R = CSS::All> struct AnglePercentage {
    static constexpr auto range = R;
    using CSS = WebCore::CSS::AnglePercentage<R>;
    using Raw = WebCore::CSS::AnglePercentageRaw<R>;
    using Dimension = Angle<R>;

    PrimitiveDimensionPercentage<Angle<R>> value;

    AnglePercentage(Angle<R> angle)
        : value { WTFMove(angle) }
    {
    }

    AnglePercentage(Percentage<R> percentage)
        : value { WTFMove(percentage) }
    {
    }

    AnglePercentage(Ref<CalculationValue> calculationValue)
        : value { WTFMove(calculationValue) }
    {
    }

    AnglePercentage(Calculation::Child calculationValue)
        : value { WTFMove(calculationValue) }
    {
    }

    bool isAngle() const { return value.isDimension(); }
    bool isPercentage() const { return value.isPercentage(); }
    bool isCalculationValue() const { return value.isCalculationValue(); }

    auto asAngle() const -> Angle<R> { return value.asDimension(); }
    auto asPercentage() const -> Percentage<R> { return value.asPercentage(); }
    auto asCalculationValue() const -> Ref<CalculationValue> { return value.asCalculationValue(); }

    template<typename... F> decltype(auto) switchOn(F&&... functors) const
    {
        return value.switchOn(std::forward<F>(functors)...);
    }

    constexpr bool isZero() const { return value.isZero(); }

    bool operator==(const AnglePercentage<R>&) const = default;
};

template<CSS::Range R = CSS::All> struct LengthPercentage {
    static constexpr auto range = R;
    using CSS = WebCore::CSS::LengthPercentage<R>;
    using Raw = WebCore::CSS::LengthPercentageRaw<R>;
    using Dimension = Length<R>;

    PrimitiveDimensionPercentage<Length<R>> value;

    LengthPercentage(Length<R> length)
        : value { WTFMove(length) }
    {
    }

    LengthPercentage(Percentage<R> percentage)
        : value { WTFMove(percentage) }
    {
    }

    LengthPercentage(Ref<CalculationValue> calculationValue)
        : value { WTFMove(calculationValue) }
    {
    }

    LengthPercentage(Calculation::Child calculationValue)
        : value { WTFMove(calculationValue) }
    {
    }

    // CalculatedValue is intentionally not part of IPCData.
    using IPCData = std::variant<Length<R>, Percentage<R>>;
    LengthPercentage(IPCData&& data)
        : value { WTF::switchOn(data, [&](auto&& data) -> PrimitiveDimensionPercentage<Length<R>> { return { data }; }) }
    {
    }

    IPCData ipcData() const
    {
        switch (value.tag()) {
        case PrimitiveDimensionPercentage<Length<R>>::Tag::Dimension:
            return asLength();
        case PrimitiveDimensionPercentage<Length<R>>::Tag::Percentage:
            return asPercentage();
        case PrimitiveDimensionPercentage<Length<R>>::Tag::CalculationValue:
            ASSERT_NOT_REACHED();
            return Length<R> { 0 };
        }
        WTF_UNREACHABLE();
    }

    bool isLength() const { return value.isDimension(); }
    bool isPercentage() const { return value.isPercentage(); }
    bool isCalculationValue() const { return value.isCalculationValue(); }

    auto asLength() const -> Length<R> { return value.asDimension(); }
    auto asPercentage() const -> Percentage<R> { return value.asPercentage(); }
    auto asCalculationValue() const -> Ref<CalculationValue> { return value.asCalculationValue(); }

    template<typename... F> decltype(auto) switchOn(F&&... functors) const
    {
        return value.switchOn(std::forward<F>(functors)...);
    }

    constexpr bool isZero() const { return value.isZero(); }

    bool operator==(const LengthPercentage<R>&) const = default;
};

// MARK: Additional Common Type and Groupings

// NOTE: This is spelled with an explicit "Or" to distinguish it from types like AnglePercentage/LengthPercentage that have behavior distinctions beyond just being a union of the two types (specifically, calc() has specific behaviors for those types).
template<CSS::Range nR = CSS::All, CSS::Range pR = nR> struct NumberOrPercentage {
    NumberOrPercentage(std::variant<Number<nR>, Percentage<pR>> value)
    {
        WTF::switchOn(WTFMove(value), [this](auto&& alternative) { this->value = WTFMove(alternative); });
    }

    NumberOrPercentage(Number<nR> value)
        : value { WTFMove(value) }
    {
    }

    NumberOrPercentage(Percentage<pR> value)
        : value { WTFMove(value) }
    {
    }

    bool operator==(const NumberOrPercentage&) const = default;

    template<typename... F> decltype(auto) switchOn(F&&... f) const
    {
        auto visitor = WTF::makeVisitor(std::forward<F>(f)...);
        using ResultType = decltype(visitor(std::declval<Number<nR>>()));

        return WTF::switchOn(value,
            [](EmptyToken) -> ResultType {
                RELEASE_ASSERT_NOT_REACHED();
            },
            [&](const Number<nR>& number) -> ResultType {
                return visitor(number);
            },
            [&](const Percentage<pR>& percentage) -> ResultType {
                return visitor(percentage);
            }
        );
    }

    struct MarkableTraits {
        static bool isEmptyValue(const NumberOrPercentage& value) { return value.isEmpty(); }
        static NumberOrPercentage emptyValue() { return NumberOrPercentage(EmptyToken()); }
    };

private:
    struct EmptyToken { constexpr bool operator==(const EmptyToken&) const = default; };
    NumberOrPercentage(EmptyToken token)
        : value { WTFMove(token) }
    {
    }

    bool isEmpty() const { return std::holds_alternative<EmptyToken>(value); }

    std::variant<EmptyToken, Number<nR>, Percentage<pR>> value;
};


template<CSS::Range nR = CSS::All, CSS::Range pR = nR> struct NumberOrPercentageResolvedToNumber {
    Number<nR> value { 0 };

    constexpr NumberOrPercentageResolvedToNumber(typename Number<nR>::ValueType value)
        : value { value }
    {
    }

    constexpr NumberOrPercentageResolvedToNumber(Number<nR> number)
        : value { number }
    {
    }

    constexpr NumberOrPercentageResolvedToNumber(Percentage<pR> percentage)
        : value { percentage.value / 100.0 }
    {
    }

    constexpr bool isZero() const { return value.isZero(); }

    constexpr bool operator==(const NumberOrPercentageResolvedToNumber<nR, pR>&) const = default;
    constexpr bool operator==(typename Number<nR>::ValueType other) const { return value.value == other; };
};

// Standard Numbers
using NumberAll = Number<CSS::All>;
using NumberNonnegative = Number<CSS::Nonnegative>;

// Standard Angles
using AngleAll = Length<CSS::All>;

// Standard Lengths
using LengthAll = Length<CSS::All>;
using LengthNonnegative = Length<CSS::Nonnegative>;

// Standard LengthPercentages
using LengthPercentageAll = LengthPercentage<CSS::All>;
using LengthPercentageNonnegative = LengthPercentage<CSS::Nonnegative>;

// Standard Percentages
using Percentage0To100 = LengthPercentage<CSS::Range{0,100}>;

// Standard Points
using LengthPercentageSpaceSeparatedPointAll = SpaceSeparatedPoint<LengthPercentageAll>;
using LengthPercentageSpaceSeparatedPointNonnegative = SpaceSeparatedPoint<LengthPercentageNonnegative>;

// Standard Sizes
using LengthPercentageSpaceSeparatedSizeAll = SpaceSeparatedSize<LengthPercentageAll>;
using LengthPercentageSpaceSeparatedSizeNonnegative = SpaceSeparatedSize<LengthPercentageNonnegative>;

// MARK: CSS type -> Style type mapping

template<auto R, typename T> struct ToStyleMapping<CSS::Integer<R, T>> { using type = Integer<R, T>; };
template<auto R> struct ToStyleMapping<CSS::Number<R>>                 { using type = Number<R>; };
template<auto R> struct ToStyleMapping<CSS::Percentage<R>>             { using type = Percentage<R>; };
template<auto R> struct ToStyleMapping<CSS::Angle<R>>                  { using type = Angle<R>; };
template<auto R> struct ToStyleMapping<CSS::Length<R>>                 { using type = Length<R>; };
template<auto R> struct ToStyleMapping<CSS::Time<R>>                   { using type = Time<R>; };
template<auto R> struct ToStyleMapping<CSS::Frequency<R>>              { using type = Frequency<R>; };
template<auto R> struct ToStyleMapping<CSS::Resolution<R>>             { using type = Resolution<R>; };
template<auto R> struct ToStyleMapping<CSS::Flex<R>>                   { using type = Flex<R>; };
template<auto R> struct ToStyleMapping<CSS::AnglePercentage<R>>        { using type = AnglePercentage<R>; };
template<auto R> struct ToStyleMapping<CSS::LengthPercentage<R>>       { using type = LengthPercentage<R>; };

template<auto nR, auto pR> struct ToStyleMapping<CSS::NumberOrPercentage<nR, pR>>                 { using type = NumberOrPercentage<nR, pR>; };
template<auto nR, auto pR> struct ToStyleMapping<CSS::NumberOrPercentageResolvedToNumber<nR, pR>> { using type = NumberOrPercentageResolvedToNumber<nR, pR>; };

// MARK: Style type mapping -> CSS type mappings

template<StyleNumeric T> struct ToCSSMapping<T>                        { using type = typename T::CSS; };

template<auto nR, auto pR> struct ToCSSMapping<NumberOrPercentage<nR, pR>>                 { using type = CSS::NumberOrPercentage<nR, pR>; };
template<auto nR, auto pR> struct ToCSSMapping<NumberOrPercentageResolvedToNumber<nR, pR>> { using type = CSS::NumberOrPercentageResolvedToNumber<nR, pR>; };

} // namespace Style

namespace CSS {
namespace TypeTransform {

// MARK: - Type transforms

namespace Type {

// MARK: Transform CSS type -> Style type.

// Transform `css1`  -> `style1`
template<typename T> struct CSSToStyleLazy {
    using type = typename Style::ToStyleMapping<T>::type;
};
template<typename T> using CSSToStyle = typename CSSToStyleLazy<T>::type;

// MARK: Transform Raw type -> Style type.

// Transform `raw1`  -> `style1`
template<typename T> struct RawToStyleLazy {
    using type = typename Style::ToStyleMapping<typename RawToCSSMapping<T>::CSS>::type;
};
template<typename T> using RawToStyle = typename RawToStyleLazy<T>::type;

} // namespace Type

namespace List {

// MARK: - List transforms

// MARK: Transform CSS type list -> Style type list.

// Transform `brigand::list<css1, css2, ...>`  -> `brigand::list<style1, style2, ...>`
template<typename TypeList> struct CSSToStyleLazy {
    using type = brigand::transform<TypeList, Type::CSSToStyleLazy<brigand::_1>>;
};
template<typename TypeList> using CSSToStyle = typename CSSToStyleLazy<TypeList>::type;

// MARK: Transform Raw type list -> Style type list.

// Transform `brigand::list<raw1, raw2, ...>`  -> `brigand::list<style1, style2, ...>`
template<typename TypeList> struct RawToStyleLazy {
    using type = brigand::transform<TypeList, Type::RawToStyleLazy<brigand::_1>>;
};
template<typename TypeList> using RawToStyle = typename RawToStyleLazy<TypeList>::type;

} // namespace List
} // namespace TypeTransform

} // namespace CSS
} // namespace WebCore

template<WebCore::Style::StyleDimensionPercentage T> inline constexpr auto WebCore::TreatAsVariantLike<T> = true;
template<auto nR, auto pR> inline constexpr auto WebCore::TreatAsVariantLike<WebCore::Style::NumberOrPercentage<nR, pR>> = true;
