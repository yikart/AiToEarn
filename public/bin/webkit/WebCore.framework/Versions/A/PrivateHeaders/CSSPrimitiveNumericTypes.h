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

#include "CSSNone.h"
#include "CSSSymbol.h"
#include "CSSPrimitiveNumericRange.h"
#include "CSSUnevaluatedCalc.h"
#include "CSSUnits.h"
#include "CSSValueTypes.h"
#include "CalculationCategory.h"
#include <wtf/Brigand.h>

namespace WebCore {
namespace CSS {

// Concept for use in generic contexts to filter on *Raw types.
template<typename T> concept RawNumeric = requires(T raw) {
    { raw.type } -> std::convertible_to<CSSUnitType>;
    { raw.value } -> std::convertible_to<typename T::ValueType>;
};

// MARK: Number Primitives Raw

template<Range R = All, typename T = int> struct IntegerRaw {
    using ValueType = T;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Integer;
    static constexpr auto type = CSSUnitType::CSS_INTEGER;
    ValueType value;

    constexpr IntegerRaw(ValueType value)
        : value { value }
    {
    }

    // Constructor is required to allow generic code to uniformly initialize primitives with a CSSUnitType.
    constexpr IntegerRaw(CSSUnitType, ValueType value)
        : value { value }
    {
    }

    constexpr bool operator==(const IntegerRaw<R, T>&) const = default;
};

template<Range R = All> struct NumberRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Number;
    static constexpr auto type = CSSUnitType::CSS_NUMBER;
    ValueType value;

    constexpr NumberRaw(ValueType value)
        : value { value }
    {
    }

    // Constructor is required to allow generic code to uniformly initialize primitives with a CSSUnitType.
    constexpr NumberRaw(CSSUnitType, ValueType value)
        : value { value }
    {
    }

    constexpr bool operator==(const NumberRaw<R>&) const = default;
};

// MARK: Percentage Primitive Raw

template<Range R = All> struct PercentageRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Percentage;
    static constexpr auto type = CSSUnitType::CSS_PERCENTAGE;
    ValueType value;

    constexpr PercentageRaw(ValueType value)
        : value { value }
    {
    }

    // Constructor is required to allow generic code to uniformly initialize primitives with a CSSUnitType.
    constexpr PercentageRaw(CSSUnitType, ValueType value)
        : value { value }
    {
    }

    constexpr bool operator==(const PercentageRaw<R>&) const = default;
};

// MARK: Dimension Primitives Raw

template<Range R = All> struct AngleRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Angle;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const AngleRaw<R>&) const = default;
};

template<Range R = All> struct LengthRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Length;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const LengthRaw<R>&) const = default;
};

template<Range R = All> struct TimeRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Time;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const TimeRaw<R>&) const = default;
};

template<Range R = All> struct FrequencyRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Frequency;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const FrequencyRaw<R>&) const = default;
};

template<Range R = Nonnegative> struct ResolutionRaw {
    using ValueType = double;
    static_assert(R.min >= 0, "<resolution> values must always have a minimum range of at least 0.");
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Resolution;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const ResolutionRaw<R>&) const = default;
};

template<Range R = All> struct FlexRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::Flex;
    static constexpr auto type = CSSUnitType::CSS_FR;
    ValueType value;

    constexpr bool operator==(const FlexRaw<R>&) const = default;
};

// MARK: Dimension + Percentage Primitives Raw

template<Range R = All> struct AnglePercentageRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::AnglePercentage;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const AnglePercentageRaw<R>&) const = default;
};

template<Range R = All> struct LengthPercentageRaw {
    using ValueType = double;
    static constexpr auto range = R;
    static constexpr auto category = Calculation::Category::LengthPercentage;
    CSSUnitType type;
    ValueType value;

    constexpr bool operator==(const LengthPercentageRaw<R>&) const = default;
};

// MARK: - Numeric Primitives (Raw + UnevaluatedCalc)

// Concept for use in generic contexts to filter on CSS types.
template<typename T> concept CSSNumeric = requires(T css) {
    typename T::Raw;
    requires RawNumeric<typename T::Raw>;
};

// Checks if the unit type is supported by the category.
bool isSupportedUnitForCategory(CSSUnitType, Calculation::Category);

template<RawNumeric T> struct PrimitiveNumeric {
    static constexpr auto range = T::range;
    static constexpr auto category = T::category;
    using Raw = T;
    using Calc = UnevaluatedCalc<T>;

    PrimitiveNumeric(Raw raw)
    {
        type = raw.type;
        value.number = raw.value;
    }

    PrimitiveNumeric(UnevaluatedCalc<T> calc)
    {
        type = CSSUnitType::CSS_CALC;
        value.calc = &calc.protectedCalc().leakRef();
    }

    PrimitiveNumeric(CSSUnitType unit, typename Raw::ValueType value)
        : PrimitiveNumeric { Raw { unit, value } }
    {
    }

    PrimitiveNumeric(typename Raw::ValueType value) requires (requires { { Raw(value) }; })
        : PrimitiveNumeric { Raw { value } }
    {
    }

    PrimitiveNumeric(const PrimitiveNumeric& other)
    {
        if (other.isCalc()) {
            type = CSSUnitType::CSS_CALC;
            value.calc = other.value.calc;
            value.calc->ref();
        } else {
            type = other.type;
            value.number = other.value.number;
        }
    }

    PrimitiveNumeric(PrimitiveNumeric&& other)
    {
        if (other.isCalc()) {
            type = CSSUnitType::CSS_CALC;
            value.calc = other.value.calc;

            // Setting this to anything so that value is not double deref'd.
            other.type = CSSUnitType::CSS_UNKNOWN;
            other.value.calc = nullptr;
        } else {
            type = other.type;
            value.number = other.value.number;
        }
    }

    PrimitiveNumeric& operator=(const PrimitiveNumeric& other)
    {
        if (isCalc())
            value.calc->deref();

        if (other.isCalc()) {
            type = CSSUnitType::CSS_CALC;
            value.calc = other.value.calc;
            value.calc->ref();
        } else {
            type = other.type;
            value.number = other.value.number;
        }

        return *this;
    }

    PrimitiveNumeric& operator=(PrimitiveNumeric&& other)
    {
        if (isCalc())
            value.calc->deref();

        if (other.isCalc()) {
            type = CSSUnitType::CSS_CALC;
            value.calc = other.value.calc;

            // Setting this to anything so that value is not double deref'd.
            other.type = CSSUnitType::CSS_UNKNOWN;
            other.value.calc = nullptr;
        } else {
            type = other.type;
            value.number = other.value.number;
        }

        return *this;
    }

    ~PrimitiveNumeric()
    {
        if (isCalc())
            value.calc->deref();
    }

    bool operator==(const PrimitiveNumeric<T>& other) const
    {
        if (type != other.type)
            return false;

        if (isCalc())
            return protectedCalc()->equals(other.protectedCalc());
        return value.number == other.value.number;
    }

    std::optional<Raw> raw() const
    {
        if (!isCalc())
            return asRaw();
        return std::nullopt;
    }

    std::optional<Calc> calc() const
    {
        if (isCalc())
            return asCalc();
        return std::nullopt;
    }

    template<typename F> decltype(auto) visit(F&& functor) const
    {
        if (isCalc())
            return std::invoke(std::forward<F>(functor), asCalc());
        return std::invoke(std::forward<F>(functor), asRaw());
    }

    template<typename... F> decltype(auto) switchOn(F&&... functors) const
    {
        return visit(WTF::makeVisitor(std::forward<F>(functors)...));
    }

    bool isKnownZero() const { return !isCalc() && value.number == 0; }
    bool isKnownNotZero() const { return !isCalc() && value.number != 0; }

    bool isCalc() const { return type == CSSUnitType::CSS_CALC; }

    static bool isSupported(CSSUnitType unit) { return isSupportedUnitForCategory(unit, category); }

    struct MarkableTraits {
        static bool isEmptyValue(const PrimitiveNumeric& value) { return value.isEmpty(); }
        static PrimitiveNumeric emptyValue() { return PrimitiveNumeric(EmptyToken()); }
    };

private:
    friend struct MarkableTraits;

    struct EmptyToken { constexpr bool operator==(const EmptyToken&) const = default; };
    PrimitiveNumeric(EmptyToken)
    {
        type = CSSUnitType::CSS_UNKNOWN;
        value.number = 0;
    }

    bool isEmpty() const { return type == CSSUnitType::CSS_UNKNOWN; }

    Ref<CSSCalcValue> protectedCalc() const
    {
        ASSERT(isCalc());
        return Ref(*value.calc);
    }

    Raw asRaw() const
    {
        ASSERT(!isCalc());
        return Raw { type, value.number };
    }

    Calc asCalc() const
    {
        ASSERT(isCalc());
        return Calc { protectedCalc() };
    }

    // A std::variant is not used here to allow tighter packing.
    // When type == CSSUnitType::CSS_CALC, value is calc.
    // When type == CSSUnitType::CSS_UNKNOWN, value is empty (used by Markable).
    // When type == anything else, value is number.

    // FIXME: This could be even more packed types with only a single alternative (e.g. CSS::Number/CSS::Percentage/CSS::Flex),
    // by using NaN encoding scheme for the `calc` case.

    CSSUnitType type;
    union {
        typename Raw::ValueType number;
        CSSCalcValue* calc;
    } value;
};

// MARK: Number Primitive

template<Range R = All, typename IntType = int> using Integer = PrimitiveNumeric<IntegerRaw<R, IntType>>;

template<Range R = All> using Number = PrimitiveNumeric<NumberRaw<R>>;

// MARK: Percentage Primitive

template<Range R = All> using Percentage = PrimitiveNumeric<PercentageRaw<R>>;

// MARK: Dimension Primitives

template<Range R = All> using Angle = PrimitiveNumeric<AngleRaw<R>>;
template<Range R = All> using Length = PrimitiveNumeric<LengthRaw<R>>;
template<Range R = All> using Time = PrimitiveNumeric<TimeRaw<R>>;
template<Range R = All> using Frequency = PrimitiveNumeric<FrequencyRaw<R>>;
template<Range R = Nonnegative> using Resolution = PrimitiveNumeric<ResolutionRaw<R>>;
template<Range R = All> using Flex = PrimitiveNumeric<FlexRaw<R>>;

// MARK: Dimension + Percentage Primitives

template<Range R = All> using AnglePercentage = PrimitiveNumeric<AnglePercentageRaw<R>>;
template<Range R = All> using LengthPercentage = PrimitiveNumeric<LengthPercentageRaw<R>>;

// MARK: Additional Common Groupings

// NOTE: This is spelled with an explicit "Or" to distinguish it from types like AnglePercentage/LengthPercentage that have behavior distinctions beyond just being a union of the two types (specifically, calc() has specific behaviors for those types).
template<Range nR = All, Range pR = nR> struct NumberOrPercentage {
    NumberOrPercentage(std::variant<Number<nR>, Percentage<pR>> value)
    {
        WTF::switchOn(WTFMove(value), [this](auto&& alternative) { this->value = WTFMove(alternative); });
    }

    NumberOrPercentage(NumberRaw<nR> value)
        : value { Number<nR> { WTFMove(value) } }
    {
    }

    NumberOrPercentage(Number<nR> value)
        : value { WTFMove(value) }
    {
    }

    NumberOrPercentage(PercentageRaw<pR> value)
        : value { Percentage<pR> { WTFMove(value) } }
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

template<Range nR = All, Range pR = nR> struct NumberOrPercentageResolvedToNumber {
    NumberOrPercentageResolvedToNumber(std::variant<Number<nR>, Percentage<pR>> value)
    {
        WTF::switchOn(WTFMove(value), [this](auto&& alternative) { this->value = WTFMove(alternative); });
    }

    NumberOrPercentageResolvedToNumber(NumberRaw<nR> value)
        : value { Number<nR> { WTFMove(value) } }
    {
    }

    NumberOrPercentageResolvedToNumber(Number<nR> value)
        : value { WTFMove(value) }
    {
    }

    NumberOrPercentageResolvedToNumber(PercentageRaw<pR> value)
        : value { Percentage<pR> { WTFMove(value) } }
    {
    }

    NumberOrPercentageResolvedToNumber(Percentage<pR> value)
        : value { WTFMove(value) }
    {
    }

    bool operator==(const NumberOrPercentageResolvedToNumber&) const = default;

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
        static bool isEmptyValue(const NumberOrPercentageResolvedToNumber& value) { return value.isEmpty(); }
        static NumberOrPercentageResolvedToNumber emptyValue() { return NumberOrPercentageResolvedToNumber(EmptyToken()); }
    };

private:
    struct EmptyToken { constexpr bool operator==(const EmptyToken&) const = default; };
    NumberOrPercentageResolvedToNumber(EmptyToken token)
        : value { WTFMove(token) }
    {
    }

    bool isEmpty() const { return std::holds_alternative<EmptyToken>(value); }

    std::variant<EmptyToken, Number<nR>, Percentage<pR>> value;
};

// MARK: - Type List Modifiers

template<typename... Ts>
using VariantWrapper = typename std::variant<Ts...>;

template<typename TypeList>
using VariantOrSingle = std::conditional_t<
    brigand::size<TypeList>::value == 1,
    brigand::front<TypeList>,
    brigand::wrap<TypeList, VariantWrapper>
>;

namespace TypeTransform {

// MARK: - Type transforms

namespace Type {

// MARK: Raw type -> CSS type mapping (CSS type -> Raw type directly available via typename CSSType::Raw).

template<typename> struct RawToCSSMapping;
template<auto R, typename T> struct RawToCSSMapping<IntegerRaw<R, T>> { using CSS = Integer<R, T>; };
template<auto R> struct RawToCSSMapping<NumberRaw<R>>                 { using CSS = Number<R>; };
template<auto R> struct RawToCSSMapping<PercentageRaw<R>>             { using CSS = Percentage<R>; };
template<auto R> struct RawToCSSMapping<AngleRaw<R>>                  { using CSS = Angle<R>; };
template<auto R> struct RawToCSSMapping<LengthRaw<R>>                 { using CSS = Length<R>; };
template<auto R> struct RawToCSSMapping<TimeRaw<R>>                   { using CSS = Time<R>; };
template<auto R> struct RawToCSSMapping<FrequencyRaw<R>>              { using CSS = Frequency<R>; };
template<auto R> struct RawToCSSMapping<ResolutionRaw<R>>             { using CSS = Resolution<R>; };
template<auto R> struct RawToCSSMapping<FlexRaw<R>>                   { using CSS = Flex<R>; };
template<auto R> struct RawToCSSMapping<AnglePercentageRaw<R>>        { using CSS = AnglePercentage<R>; };
template<auto R> struct RawToCSSMapping<LengthPercentageRaw<R>>       { using CSS = LengthPercentage<R>; };
template<> struct RawToCSSMapping<NoneRaw>                            { using CSS = None; };
template<> struct RawToCSSMapping<SymbolRaw>                          { using CSS = Symbol; };

// MARK: Transform Raw type -> CSS type

template<typename T> struct RawToCSSLazy {
    using type = typename RawToCSSMapping<T>::CSS;
};
template<typename T> using RawToCSS = typename RawToCSSLazy<T>::type;

} // namespace Type

// MARK: - List transforms

namespace List {

// MARK: Transform Raw type list -> CSS type list

// Transform `brigand::list<raw1, raw2, ...>`  -> `brigand::list<css1, css2, ...>`
template<typename TypeList> struct RawToCSSLazy {
    using type = brigand::transform<TypeList, Type::RawToCSSLazy<brigand::_1>>;
};
template<typename TypeList> using RawToCSS = typename RawToCSSLazy<TypeList>::type;

// MARK: Add/Remove Symbol

// MARK: Transform Raw type list -> CSS type list + Symbol

// Transform `brigand::list<raw1, raw2, ...>`  -> `brigand::list<css1, css2, ..., symbol>`
template<typename TypeList> struct RawToCSSPlusSymbolLazy {
    using type = brigand::append<brigand::transform<TypeList, Type::RawToCSSLazy<brigand::_1>>, brigand::list<Symbol>>;
};
template<typename TypeList> using RawToCSSPlusSymbol = typename RawToCSSPlusSymbolLazy<TypeList>::type;

// MARK: Transform CSS type list -> CSS type list + Symbol

// Transform `brigand::list<css1, css2, ...>`  -> `brigand::list<css1, css2, ..., symbol>`
template<typename TypeList> struct PlusSymbolLazy {
    using type = brigand::append<TypeList, brigand::list<Symbol>>;
};
template<typename TypeList> using PlusSymbol = typename PlusSymbolLazy<TypeList>::type;

// MARK: Transform CSS type list + Symbol -> CSS type list - Symbol

// Transform `brigand::list<css1, css2, ..., symbol>`  -> `brigand::list<css1, css2, ...>`
template<typename TypeList> struct MinusSymbolLazy {
    using type = brigand::remove_if<TypeList, IsSymbol<brigand::_1>>;
};
template<typename TypeList> using MinusSymbol = typename MinusSymbolLazy<TypeList>::type;

} // namespace List
} // namespace TypeTransform

} // namespace CSS
} // namespace WebCore

template<WebCore::CSS::RawNumeric Raw> inline constexpr auto WebCore::TreatAsVariantLike<WebCore::CSS::PrimitiveNumeric<Raw>> = true;
template<auto nR, auto pR> inline constexpr auto WebCore::TreatAsVariantLike<WebCore::CSS::NumberOrPercentage<nR, pR>> = true;
template<auto nR, auto pR> inline constexpr auto WebCore::TreatAsVariantLike<WebCore::CSS::NumberOrPercentageResolvedToNumber<nR, pR>> = true;
