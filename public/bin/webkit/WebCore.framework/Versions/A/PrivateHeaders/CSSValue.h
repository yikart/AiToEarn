/*
 * (C) 1999-2003 Lars Knoll (knoll@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
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

#include <wtf/IterationStatus.h>
#include <wtf/Noncopyable.h>
#include <wtf/RefPtr.h>
#include <wtf/TypeCasts.h>
#include <wtf/Vector.h>
#include <wtf/text/ASCIILiteral.h>

namespace WTF {
class Hasher;
}

namespace WebCore {

class CSSPrimitiveValue;
class CSSStyleDeclaration;
class CSSToLengthConversionData;
class CachedResource;
class DeprecatedCSSOMValue;
class Quad;
class Rect;

struct ComputedStyleDependencies;
struct Counter;

enum CSSPropertyID : uint16_t;
enum CSSValueID : uint16_t;

DECLARE_COMPACT_ALLOCATOR_WITH_HEAP_IDENTIFIER(CSSValue);
class CSSValue {
    WTF_MAKE_NONCOPYABLE(CSSValue);
    WTF_MAKE_FAST_COMPACT_ALLOCATED_WITH_HEAP_IDENTIFIER(CSSValue);
public:
    static constexpr unsigned refCountFlagIsStatic = 0x1;
    static constexpr unsigned refCountIncrement = 0x2; // This allows us to ref / deref without disturbing the static CSSValue flag.
    void ref() const { m_refCount += refCountIncrement; }
    void deref() const;
    bool hasOneRef() const { return m_refCount == refCountIncrement; }
    unsigned refCount() const { return m_refCount / refCountIncrement; }
    bool hasAtLeastOneRef() const { return m_refCount; }

    WEBCORE_EXPORT String cssText() const;

    bool isAppleColorFilterPropertyValue() const { return m_classType == ClassType::AppleColorFilterProperty; }
    bool isAttrValue() const { return m_classType == ClassType::Attr; }
    bool isAspectRatioValue() const { return m_classType == ClassType::AspectRatio; }
    bool isBackgroundRepeatValue() const { return m_classType == ClassType::BackgroundRepeat; }
    bool isBasicShape() const { return m_classType == ClassType::BasicShape; }
    bool isBorderImageSliceValue() const { return m_classType == ClassType::BorderImageSlice; }
    bool isBorderImageWidthValue() const { return m_classType == ClassType::BorderImageWidth; }
    bool isBoxShadowPropertyValue() const { return m_classType == ClassType::BoxShadowProperty; }
    bool isCalcValue() const { return m_classType == ClassType::Calculation; }
    bool isCanvasValue() const { return m_classType == ClassType::Canvas; }
    bool isColor() const { return m_classType == ClassType::Color; }
#if ENABLE(DARK_MODE_CSS)
    bool isColorScheme() const { return m_classType == ClassType::ColorScheme; }
#endif
    bool isContentDistributionValue() const { return m_classType == ClassType::ContentDistribution; }
    bool isCounter() const { return m_classType == ClassType::Counter; }
    bool isCrossfadeValue() const { return m_classType == ClassType::Crossfade; }
    bool isCursorImageValue() const { return m_classType == ClassType::CursorImage; }
    bool isCustomPropertyValue() const { return m_classType == ClassType::CustomProperty; }
    bool isEasingFunctionValue() const { return m_classType == ClassType::EasingFunction; }
    bool isFilterImageValue() const { return m_classType == ClassType::FilterImage; }
    bool isFilterPropertyValue() const { return m_classType == ClassType::FilterProperty; }
    bool isFontFaceSrcLocalValue() const { return m_classType == ClassType::FontFaceSrcLocal; }
    bool isFontFaceSrcResourceValue() const { return m_classType == ClassType::FontFaceSrcResource; }
    bool isFontFeatureValue() const { return m_classType == ClassType::FontFeature; }
    bool isFontPaletteValuesOverrideColorsValue() const { return m_classType == ClassType::FontPaletteValuesOverrideColors; }
    bool isFontStyleRangeValue() const { return m_classType == ClassType::FontStyleRange; }
    bool isFontStyleWithAngleValue() const { return m_classType == ClassType::FontStyleWithAngle; }
    bool isFontValue() const { return m_classType == ClassType::Font; }
    bool isFontVariantAlternatesValue() const { return m_classType == ClassType::FontVariantAlternates; }
    bool isFontVariationValue() const { return m_classType == ClassType::FontVariation; }
    bool isFunctionValue() const { return m_classType == ClassType::Function; }
    bool isGradientValue() const { return m_classType == ClassType::Gradient; }
    bool isGridAutoRepeatValue() const { return m_classType == ClassType::GridAutoRepeat; }
    bool isGridIntegerRepeatValue() const { return m_classType == ClassType::GridIntegerRepeat; }
    bool isGridLineNamesValue() const { return m_classType == ClassType::GridLineNames; }
    bool isGridLineValue() const { return m_classType == ClassType::GridLineValue; }
    bool isGridTemplateAreasValue() const { return m_classType == ClassType::GridTemplateAreas; }
    bool isImageSetOptionValue() const { return m_classType == ClassType::ImageSetOption; }
    bool isImageSetValue() const { return m_classType == ClassType::ImageSet; }
    bool isImageValue() const { return m_classType == ClassType::Image; }
    bool isLineBoxContainValue() const { return m_classType == ClassType::LineBoxContain; }
    bool isNamedImageValue() const { return m_classType == ClassType::NamedImage; }
    bool isOffsetRotateValue() const { return m_classType == ClassType::OffsetRotate; }
    bool isPair() const { return m_classType == ClassType::ValuePair; }
    bool isPath() const { return m_classType == ClassType::Path; }
    bool isPendingSubstitutionValue() const { return m_classType == ClassType::PendingSubstitutionValue; }
    bool isPrimitiveValue() const { return m_classType == ClassType::Primitive; }
    bool isQuad() const { return m_classType == ClassType::Quad; }
    bool isRayValue() const { return m_classType == ClassType::Ray; }
    bool isRect() const { return m_classType == ClassType::Rect; }
    bool isReflectValue() const { return m_classType == ClassType::Reflect; }
    bool isScrollValue() const { return m_classType == ClassType::Scroll; }
    bool isSubgridValue() const { return m_classType == ClassType::Subgrid; }
    bool isTextShadowPropertyValue() const { return m_classType == ClassType::TextShadowProperty; }
    bool isTransformListValue() const { return m_classType == ClassType::TransformList; }
    bool isUnicodeRangeValue() const { return m_classType == ClassType::UnicodeRange; }
    bool isValueList() const { return m_classType == ClassType::ValueList; }
    bool isVariableReferenceValue() const { return m_classType == ClassType::VariableReference; }
    bool isViewValue() const { return m_classType == ClassType::View; }
    bool isPaintImageValue() const { return m_classType == ClassType::PaintImage; }

    bool hasVariableReferences() const { return isVariableReferenceValue() || isPendingSubstitutionValue(); }
    bool isImageGeneratorValue() const { return m_classType >= ClassType::Canvas && m_classType <= ClassType::Gradient; }
    bool isImplicitInitialValue() const { return m_isImplicitInitialValue; }
    bool containsVector() const { return m_classType >= ClassType::ValueList; }

    // NOTE: This returns true for all image-like values except CSSCursorImageValues; these are the values that correspond to the CSS <image> production.
    bool isImage() const { return isImageValue() || isImageSetValue() || isImageGeneratorValue(); }

    Ref<DeprecatedCSSOMValue> createDeprecatedCSSOMWrapper(CSSStyleDeclaration&) const;

    // FIXME: These three traversing functions are buggy. It should be rewritten with visitChildren.
    // https://bugs.webkit.org/show_bug.cgi?id=270600
    bool traverseSubresources(const Function<bool(const CachedResource&)>&) const;
    void setReplacementURLForSubresources(const UncheckedKeyHashMap<String, String>&);
    void clearReplacementURLForSubresources();

    IterationStatus visitChildren(const Function<IterationStatus(CSSValue&)>&) const;

    bool mayDependOnBaseURL() const;

    // What properties does this value rely on (eg, font-size for em units)
    ComputedStyleDependencies computedStyleDependencies() const;
    void collectComputedStyleDependencies(ComputedStyleDependencies&) const;

    // Checks to see if the provided conversion data is sufficient to resolve the dependencies of the CSSValue.
    bool canResolveDependenciesWithConversionData(const CSSToLengthConversionData&) const;

    bool equals(const CSSValue&) const;
    bool operator==(const CSSValue& other) const { return equals(other); }

    // Returns false if the hash is computed from the CSSValue pointer instead of the underlying values.
    bool addHash(Hasher&) const;

    // https://www.w3.org/TR/css-values-4/#local-urls
    // Empty URLs and fragment-only URLs should not be resolved relative to the base URL.
    static bool isCSSLocalURL(StringView relativeURL);

    enum StaticCSSValueTag { StaticCSSValue };

    static constexpr size_t ValueSeparatorBits = 2;
    enum ValueSeparator : uint8_t { SpaceSeparator, CommaSeparator, SlashSeparator };

    inline bool isCustomIdent() const;
    inline String customIdent() const;

    inline bool isInteger() const;
    inline int integer(const CSSToLengthConversionData&) const;
    inline int integerDeprecated() const;

    inline const CSSValue& first() const; // CSSValuePair
    Ref<CSSValue> protectedFirst() const; // CSSValuePair
    inline const CSSValue& second() const; // CSSValuePair
    Ref<CSSValue> protectedSecond() const; // CSSValuePair
    inline const Quad& quad() const; // CSSValueQuad
    inline const Rect& rect() const; // CSSSValueRect

    // FIXME: Should these be named isIdent and ident instead?
    inline bool isValueID() const;
    inline CSSValueID valueID() const;

    void customSetReplacementURLForSubresources(const UncheckedKeyHashMap<String, String>&) { }
    void customClearReplacementURLForSubresources() { }
    bool customMayDependOnBaseURL() const { return false; }
    IterationStatus customVisitChildren(const Function<IterationStatus(CSSValue&)>&) const { return IterationStatus::Continue; }

protected:
    static const size_t ClassTypeBits = 7;

    enum class ClassType : uint8_t {
        Primitive,

        // Image classes.
        Image,
        ImageSetOption,
        CursorImage,
        // Image generator classes.
        Canvas,
        PaintImage,
        NamedImage,
        Crossfade,
        FilterImage,
        Gradient,

        // Other non-list classes.
        AppleColorFilterProperty,
        AspectRatio,
        Attr,
        BackgroundRepeat,
        BasicShape,
        BorderImageSlice,
        BorderImageWidth,
        BoxShadowProperty,
        Calculation,
        Color,
#if ENABLE(DARK_MODE_CSS)
        ColorScheme,
#endif
        ContentDistribution,
        Counter,
        CustomProperty,
        EasingFunction,
        FilterProperty,
        Font,
        FontFaceSrcLocal,
        FontFaceSrcResource,
        FontFeature,
        FontPaletteValuesOverrideColors,
        FontStyleRange,
        FontStyleWithAngle,
        FontVariantAlternates,
        FontVariation,
        GridLineNames,
        GridLineValue,
        GridTemplateAreas,
        LineBoxContain,
        OffsetRotate,
        Path,
        PendingSubstitutionValue,
        Quad,
        Ray,
        Rect,
        Reflect,
        Scroll,
        TextShadowProperty,
        UnicodeRange,
        ValuePair,
        VariableReference,
        View,

        // Classes that contain vectors, which derive from CSSValueContainingVector.
        ValueList,
        Function,
        GridAutoRepeat,
        GridIntegerRepeat,
        ImageSet,
        Subgrid,
        TransformList,
        // Do not append classes here unless they derive from CSSValueContainingVector.
    };

    constexpr ClassType classType() const { return m_classType; }

    explicit CSSValue(ClassType classType)
        : m_classType(classType)
    {
    }

    void makeStatic()
    {
        m_refCount |= refCountFlagIsStatic;
    }

    // NOTE: This class is non-virtual for memory and performance reasons.
    // Don't go making it virtual again unless you know exactly what you're doing!
    ~CSSValue() = default;
    WEBCORE_EXPORT void operator delete(CSSValue*, std::destroying_delete_t);

    ValueSeparator separator() const { return static_cast<ValueSeparator>(m_valueSeparator); }
    static ASCIILiteral separatorCSSText(ValueSeparator);
    ASCIILiteral separatorCSSText() const { return separatorCSSText(separator()); };

private:
    template<typename Visitor> constexpr decltype(auto) visitDerived(Visitor&&);
    template<typename Visitor> constexpr decltype(auto) visitDerived(Visitor&&) const;

    static inline bool customTraverseSubresources(const Function<bool(const CachedResource&)>&);
    bool addDerivedHash(Hasher&) const;

    mutable unsigned m_refCount { refCountIncrement };

protected:
    // These data members are used by derived classes but here to maximize struct packing.

    // CSSPrimitiveValue:
    uint8_t m_primitiveUnitType : 7 { 0 }; // CSSUnitType
    mutable uint8_t m_hasCachedCSSText : 1 { false };
    uint8_t m_isImplicitInitialValue : 1 { false };

    // CSSValueList and CSSValuePair:
    uint8_t m_valueSeparator : ValueSeparatorBits { 0 };

private:
    ClassType m_classType : ClassTypeBits;
};

inline void CSSValue::deref() const
{
    unsigned tempRefCount = m_refCount - refCountIncrement;

    if (!tempRefCount) {
IGNORE_GCC_WARNINGS_BEGIN("free-nonheap-object")
        delete this;
IGNORE_GCC_WARNINGS_END
        return;
    }

    m_refCount = tempRefCount;
}

template<typename CSSValueType>
inline bool compareCSSValueVector(const Vector<Ref<CSSValueType>>& firstVector, const Vector<Ref<CSSValueType>>& secondVector)
{
    size_t size = firstVector.size();
    if (size != secondVector.size())
        return false;

    for (size_t i = 0; i < size; ++i) {
        auto& firstPtr = firstVector[i];
        auto& secondPtr = secondVector[i];
        if (firstPtr.ptr() == secondPtr.ptr() || firstPtr->equals(secondPtr))
            continue;
        return false;
    }
    return true;
}

template<typename CSSValueType>
inline bool compareCSSValuePtr(const RefPtr<CSSValueType>& first, const RefPtr<CSSValueType>& second)
{
    return first ? second && first->equals(*second) : !second;
}

template<typename CSSValueType>
inline bool compareCSSValue(const Ref<CSSValueType>& first, const Ref<CSSValueType>& second)
{
    return first.get().equals(second);
}

void add(Hasher&, const CSSValue&);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CSS_VALUE(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::CSSValue& value) { return value.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()
