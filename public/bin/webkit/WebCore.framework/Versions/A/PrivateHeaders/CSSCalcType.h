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

#include <array>
#include <optional>
#include <wtf/Forward.h>

namespace WebCore {

namespace Calculation {
enum class Category : uint8_t;
}

enum class CSSUnitType : uint8_t;

namespace CSSCalc {

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-base-type
enum class BaseType : uint8_t {
    Length,
    Angle,
    Time,
    Frequency,
    Resolution,
    Flex,
    Percent
};

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-percent-hint
enum class PercentHint : uint8_t {
    Length = 1,
    Angle,
    Time,
    Frequency,
    Resolution,
    Flex
};

// https://drafts.css-houdini.org/css-typed-om-1/#cssnumericvalue-type
struct Type {
    using Exponent = int8_t;

    struct PercentHintValue {
    private:
        enum class InternalValue : uint8_t {
            None = 0,
            Length = static_cast<uint8_t>(PercentHint::Length),
            Angle = static_cast<uint8_t>(PercentHint::Angle),
            Time = static_cast<uint8_t>(PercentHint::Time),
            Frequency = static_cast<uint8_t>(PercentHint::Frequency),
            Resolution = static_cast<uint8_t>(PercentHint::Resolution),
            Flex = static_cast<uint8_t>(PercentHint::Flex)
        };

    public:
        constexpr PercentHintValue()
            : m_value { InternalValue::None }
        {
        }

        constexpr PercentHintValue(PercentHint hint)
            : m_value { static_cast<InternalValue>(hint) }
        {
        }

        constexpr bool operator==(const PercentHintValue&) const = default;
        constexpr explicit operator bool() const { return m_value != InternalValue::None; }
        constexpr PercentHint operator*() const { ASSERT(m_value != InternalValue::None); return static_cast<PercentHint>(m_value); }

    private:
        InternalValue m_value;
    };

    Exponent length = 0;
    Exponent angle = 0;
    Exponent time = 0;
    Exponent frequency = 0;
    Exponent resolution = 0;
    Exponent flex = 0;
    Exponent percent = 0;
    PercentHintValue percentHint = { };

    constexpr bool operator==(const Type&) const = default;

    static constexpr Type makeNumber() { return { }; }
    static constexpr Type makeLength() { return { .length = 1 }; }
    static constexpr Type makeAngle() { return { .angle = 1 }; }
    static constexpr Type makeTime() { return { .time = 1 }; }
    static constexpr Type makeFrequency() { return { .frequency = 1 }; }
    static constexpr Type makeResolution() { return { .resolution = 1 }; }
    static constexpr Type makeFlex() { return { .flex = 1 }; }
    static constexpr Type makePercent() { return { .percent = 1 }; }

    static Type determineType(CSSUnitType);
    static PercentHintValue determinePercentHint(Calculation::Category);

    static std::optional<Type> add(Type, Type);
    static std::optional<Type> add(std::optional<Type> a, Type b) { if (!a) return a; return add(*a, b); }
    static std::optional<Type> multiply(Type, Type);
    static std::optional<Type> multiply(std::optional<Type> a, Type b) { if (!a) return a; return multiply(*a, b); }
    static Type invert(Type);

    static std::optional<Type> sameType(Type, Type);
    static std::optional<Type> consistentType(Type, Type);
    static std::optional<Type> madeConsistent(Type base, Type input);

    static constexpr decltype(auto) allBaseTypes();
    static constexpr decltype(auto) allPotentialPercentHintTypes();

    constexpr Exponent& operator[](BaseType);
    constexpr Exponent operator[](BaseType) const;
    constexpr Exponent& operator[](PercentHint);
    constexpr Exponent operator[](PercentHint) const;

    constexpr void applyPercentHint(PercentHint);

    constexpr bool hasNonPercentEntry() const;
    constexpr bool allNonZeroValuesEqual(Type) const;

    struct MatchingContext {
        bool allowsPercentHint;
    };
    enum class Match : uint8_t {
        Number,
        Percent,
        Length,
        Angle,
        Time,
        Frequency,
        Resolution,
        Flex
    };
    template<Match...> constexpr bool matchesAny(MatchingContext = { .allowsPercentHint = false }) const;

    bool matches(Calculation::Category) const;

    // Returns the Calculation::Category for Type, if there is one.
    std::optional<Calculation::Category> calculationCategory() const;
};

static_assert(sizeof(Type) == 8);

TextStream& operator<<(TextStream&, BaseType);
TextStream& operator<<(TextStream&, PercentHint);
TextStream& operator<<(TextStream&, Type::PercentHintValue);
TextStream& operator<<(TextStream&, Type);

constexpr decltype(auto) Type::allBaseTypes()
{
    return std::array {
        BaseType::Length,
        BaseType::Angle,
        BaseType::Time,
        BaseType::Frequency,
        BaseType::Resolution,
        BaseType::Flex,
        BaseType::Percent
    };
}

constexpr decltype(auto) Type::allPotentialPercentHintTypes()
{
    return std::array {
        PercentHint::Length,
        PercentHint::Angle,
        PercentHint::Time,
        PercentHint::Frequency,
        PercentHint::Resolution,
        PercentHint::Flex
    };
}

constexpr bool Type::hasNonPercentEntry() const
{
    return length || angle || time || frequency || resolution || flex;
}

constexpr Type::Exponent& Type::operator[](BaseType baseType)
{
    switch (baseType) {
    case BaseType::Length: return length;
    case BaseType::Angle: return angle;
    case BaseType::Time: return time;
    case BaseType::Frequency: return frequency;
    case BaseType::Resolution: return resolution;
    case BaseType::Flex: return flex;
    case BaseType::Percent: return percent;
    }

    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return length;
}

constexpr Type::Exponent Type::operator[](BaseType baseType) const
{
    switch (baseType) {
    case BaseType::Length: return length;
    case BaseType::Angle: return angle;
    case BaseType::Time: return time;
    case BaseType::Frequency: return frequency;
    case BaseType::Resolution: return resolution;
    case BaseType::Flex: return flex;
    case BaseType::Percent: return percent;
    }

    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return length;
}

constexpr Type::Exponent& Type::operator[](PercentHint percentHint)
{
    switch (percentHint) {
    case PercentHint::Length: return length;
    case PercentHint::Angle: return angle;
    case PercentHint::Time: return time;
    case PercentHint::Frequency: return frequency;
    case PercentHint::Resolution: return resolution;
    case PercentHint::Flex: return flex;
    }

    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return length;
}

constexpr Type::Exponent Type::operator[](PercentHint percentHint) const
{
    switch (percentHint) {
    case PercentHint::Length: return length;
    case PercentHint::Angle: return angle;
    case PercentHint::Time: return time;
    case PercentHint::Frequency: return frequency;
    case PercentHint::Resolution: return resolution;
    case PercentHint::Flex: return flex;
    }

    ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
    return length;
}

constexpr void Type::applyPercentHint(PercentHint hint)
{
    // https://drafts.css-houdini.org/css-typed-om-1/#apply-the-percent-hint

    // 1. If type doesn’t contain `hint`, set type[hint] to 0.
    //
    //   No work required as we represent "doesn't contain" as `0`.

    // 2. If type contains "percent", add type["percent"] to type[hint], then set type["percent"] to 0.
    (*this)[hint] += (*this)[BaseType::Percent];
    (*this)[BaseType::Percent] = 0;

    // 3. Set type’s percent hint to `hint`.
    this->percentHint = hint;
}

constexpr bool Type::allNonZeroValuesEqual(Type otherType) const
{
    for (auto baseType : allBaseTypes()) {
        auto value = (*this)[baseType];
        if (!value)
            continue;
        if (value != otherType[baseType])
            return false;
    }
    return true;
}

template<Type::Match... M> struct TypeMatcher {
    enum class Check { MustBeZero, MustBeOneOrZero, MustBeOne };

    template<Type::Match match> static constexpr bool containsMatch()
    {
        return ((M == match) || ...);
    }

    template<Type::Match match> static constexpr Check computeCheck()
    {
        if constexpr (containsMatch<match>()) {
            if constexpr (sizeof...(M) == 1)
                return Check::MustBeOne;
            else
                return Check::MustBeOneOrZero;
        } else
            return Check::MustBeZero;
    }

    static constexpr Check computeCheck(BaseType baseType)
    {
        switch (baseType) {
        case BaseType::Length:
            return computeCheck<Type::Match::Length>();
        case BaseType::Angle:
            return computeCheck<Type::Match::Angle>();
        case BaseType::Time:
            return computeCheck<Type::Match::Time>();
        case BaseType::Frequency:
            return computeCheck<Type::Match::Frequency>();
        case BaseType::Resolution:
            return computeCheck<Type::Match::Resolution>();
        case BaseType::Flex:
            return computeCheck<Type::Match::Flex>();
        case BaseType::Percent:
            return computeCheck<Type::Match::Percent>();
        }
        ASSERT_NOT_REACHED_UNDER_CONSTEXPR_CONTEXT();
        return Check::MustBeZero;
    }

    static bool matchesAny(Type type)
    {
        bool foundMatch = false;
        for (auto baseType : Type::allBaseTypes()) {
            switch (computeCheck(baseType)) {
            case Check::MustBeZero:
                if (type[baseType] != 0)
                    return false;
                break;

            case Check::MustBeOneOrZero:
                if (type[baseType] != 1 && type[baseType] != 0)
                    return false;
                if (type[baseType] == 1)
                    foundMatch = true;
                break;

            case Check::MustBeOne:
                if (type[baseType] != 1)
                    return false;
                foundMatch = true;
                break;
            }
        }

        // If any of the match requests were `Number`, its ok if no match was found.
        if constexpr (containsMatch<Type::Match::Number>())
            return true;
        else
            return foundMatch;
    }
};

template<Type::Match... M> constexpr bool Type::matchesAny(MatchingContext matchingContext) const
{
    if (!TypeMatcher<M...>::matchesAny(*this))
        return false;

    // If the context in which the value is used does not allow <percentage> values, then the type must additionally have a null percent hint to be considered matching.
    if (percentHint && !matchingContext.allowsPercentHint)
        return false;

    return true;
}

// Policy to apply to validate argument types.
enum class AllowedTypes {
    Any,
    Number,
    NumberOrAngle
};
template<AllowedTypes allowed> inline bool validateType(Type a)
{
    if constexpr (allowed == AllowedTypes::Any)
        return true;
    else if constexpr (allowed == AllowedTypes::Number)
        return a.matchesAny<Type::Match::Number>({ .allowsPercentHint = true });
    else if constexpr (allowed == AllowedTypes::NumberOrAngle)
        return a.matchesAny<Type::Match::Number, Type::Match::Angle>({ .allowsPercentHint = true });
}

// Policy used to merge argument types.
enum class MergePolicy {
    Same,
    Consistent
};
template<MergePolicy policy> inline std::optional<Type> mergeTypes(Type a, Type b)
{
    if constexpr (policy == MergePolicy::Same)
        return Type::sameType(a, b);
    else if constexpr (policy == MergePolicy::Consistent)
        return Type::consistentType(a, b);
}
template<MergePolicy policy> inline std::optional<Type> mergeTypes(std::optional<Type> a, Type b)
{
    if (!a)
        return std::nullopt;
    return mergeTypes<policy>(*a, b);
}

template<MergePolicy policy> inline std::optional<Type> mergeTypes(std::optional<Type> a, std::optional<Type> b)
{
    if (!a || !b)
        return std::nullopt;
    return mergeTypes<policy>(*a, *b);
}

// Transform to apply on operation type.
enum class OutputTransform {
    None,
    NumberMadeConsistent,
    AngleMadeConsistent,
};
template<OutputTransform transform> inline std::optional<Type> transformType(Type a)
{
    if constexpr (transform == OutputTransform::None)
        return a;
    else if constexpr (transform == OutputTransform::NumberMadeConsistent)
        return Type::madeConsistent(Type::makeNumber(), a);
    else if constexpr (transform == OutputTransform::AngleMadeConsistent)
        return Type::madeConsistent(Type::makeAngle(), a);
}

template<OutputTransform transform> inline std::optional<Type> transformType(std::optional<Type> a)
{
    if (!a)
        return std::nullopt;
    return transformType<transform>(*a);
}

} // namespace CSSCalc
} // namespace WebCore
