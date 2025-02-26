/*
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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

#include "ColorConversion.h"
#include "ColorSpace.h"
#include "ColorUtilities.h"
#include "DestinationColorSpace.h"
#include <functional>
#include <wtf/Forward.h>
#include <wtf/HashFunctions.h>
#include <wtf/Hasher.h>
#include <wtf/OptionSet.h>
#include <wtf/Ref.h>
#include <wtf/StdLibExtras.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/ThreadSafeRefCounted.h>

#if USE(SKIA)
WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN
#include <skia/core/SkColor.h>
WTF_ALLOW_UNSAFE_BUFFER_USAGE_END
#endif

#if USE(CG)
typedef struct CGColor* CGColorRef;
#endif

#if PLATFORM(GTK)
typedef struct _GdkRGBA GdkRGBA;
#endif

namespace WebCore {

struct OutOfLineColorDataForIPC {
    ColorSpace colorSpace;
    float c1;
    float c2;
    float c3;
    float alpha;
};

struct ColorDataForIPC {
    bool isSemantic;
    bool usesFunctionSerialization;
    std::variant<PackedColor::RGBA, OutOfLineColorDataForIPC> data;
};

// Able to represent:
//    - Special "invalid color" state, treated as transparent black but distinguishable
//    - 4x 8-bit (0-255) sRGBA, stored inline, no allocation
//    - 4x float color components + color space, stored in a reference counted sub-object

class Color {
    WTF_MAKE_TZONE_ALLOCATED(Color);
public:
    enum class Flags {
        Semantic                        = 1 << 0,
        UseColorFunctionSerialization   = 1 << 1,
    };

    Color() = default;

    WEBCORE_EXPORT Color(SRGBA<uint8_t>, OptionSet<Flags> = { });
    Color(std::optional<SRGBA<uint8_t>>, OptionSet<Flags> = { });
    WEBCORE_EXPORT Color(std::optional<ColorDataForIPC>&&);

    template<typename ColorType, typename std::enable_if_t<IsColorTypeWithComponentType<ColorType, float>>* = nullptr>
    Color(const ColorType&, OptionSet<Flags> = { });
    
    template<typename ColorType, typename std::enable_if_t<IsColorTypeWithComponentType<ColorType, float>>* = nullptr>
    Color(const std::optional<ColorType>&, OptionSet<Flags> = { });

    explicit Color(WTF::HashTableEmptyValueType);
    explicit Color(WTF::HashTableDeletedValueType);
    bool isHashTableDeletedValue() const;
    bool isHashTableEmptyValue() const;

    WEBCORE_EXPORT Color(const Color&);
    WEBCORE_EXPORT Color(Color&&);

    WEBCORE_EXPORT Color& operator=(const Color&);
    WEBCORE_EXPORT Color& operator=(Color&&);

    ~Color();

    bool isValid() const;
    bool isSemantic() const;
    bool usesColorFunctionSerialization() const;

    ColorSpace colorSpace() const;
    WEBCORE_EXPORT std::optional<ColorDataForIPC> data() const;

    bool isOpaque() const { return isOutOfLine() ? asOutOfLine().resolvedAlpha() == 1.0 : asInline().resolved().alpha == 255; }
    bool isVisible() const { return isOutOfLine() ? asOutOfLine().resolvedAlpha() > 0.0 : asInline().resolved().alpha > 0; }
    uint8_t alphaByte() const { return isOutOfLine() ? convertFloatAlphaTo<uint8_t>(asOutOfLine().resolvedAlpha()) : asInline().resolved().alpha; }
    float alphaAsFloat() const { return isOutOfLine() ? asOutOfLine().resolvedAlpha() : convertByteAlphaTo<float>(asInline().resolved().alpha); }

    WEBCORE_EXPORT double luminance() const;
    WEBCORE_EXPORT double lightness() const; // FIXME: Replace remaining uses with luminance.

    bool anyComponentIsNone() const;

    template<typename Functor> decltype(auto) callOnUnderlyingType(Functor&&) const;

    // This will convert the underlying color into ColorType, potentially lossily if the gamut
    // or precision of ColorType is smaller than the current underlying type.
    template<typename ColorType> ColorType toColorTypeLossy() const;

    // This acts just like toColorTypeLossy(), but will carry forward missing components
    // from the underlying type into any analogous components in ColorType.
    template<typename ColorType> ColorType toColorTypeLossyCarryingForwardMissing() const;

    ColorComponents<float, 4> toResolvedColorComponentsInColorSpace(ColorSpace) const;
    ColorComponents<float, 4> toResolvedColorComponentsInColorSpace(const DestinationColorSpace&) const;

    WEBCORE_EXPORT std::pair<ColorSpace, ColorComponents<float, 4>> colorSpaceAndResolvedColorComponents() const;

    WEBCORE_EXPORT Color lightened() const;
    WEBCORE_EXPORT Color darkened() const;

    Color invertedColorWithAlpha(std::optional<float> alpha) const;
    Color invertedColorWithAlpha(float alpha) const;

    Color colorWithAlphaMultipliedBy(std::optional<float>) const;
    Color colorWithAlphaMultipliedBy(float) const;

    Color colorWithAlpha(std::optional<float>) const;
    WEBCORE_EXPORT Color colorWithAlpha(float) const;

    Color opaqueColor() const { return colorWithAlpha(1.0f); }

    Color semanticColor() const;

    // Returns the underlying color if its type is inline.
    std::optional<PackedColor::RGBA> tryGetAsPackedInline() const;
    std::optional<SRGBA<uint8_t>> tryGetAsSRGBABytes() const;

#if PLATFORM(GTK)
    Color(const GdkRGBA&);
    operator GdkRGBA() const;
#endif

#if USE(SKIA)
    Color(const SkColor&);
    WEBCORE_EXPORT operator SkColor() const;

    Color(const SkColor4f&);
    operator SkColor4f() const;
#endif

#if USE(CG)
    WEBCORE_EXPORT static Color createAndPreserveColorSpace(CGColorRef, OptionSet<Flags> = { });
#endif

    static constexpr auto transparentBlack = SRGBA<uint8_t> { };
    static constexpr auto black = SRGBA<uint8_t> { 0, 0, 0 };
    static constexpr auto white = SRGBA<uint8_t> { 255, 255, 255 };
    static constexpr auto darkGray = SRGBA<uint8_t> { 128, 128, 128 };
    static constexpr auto gray = SRGBA<uint8_t> { 160, 160, 160 };
    static constexpr auto lightGray = SRGBA<uint8_t> { 192, 192, 192 };
    static constexpr auto cyan = SRGBA<uint8_t> { 0, 255, 255 };
    static constexpr auto yellow = SRGBA<uint8_t> { 255, 255, 0 };
    static constexpr auto red = SRGBA<uint8_t> { 255, 0, 0 };
    static constexpr auto magenta = SRGBA<uint8_t> { 255, 0, 255 };
    static constexpr auto blue = SRGBA<uint8_t> { 0, 0, 255 };
    static constexpr auto green = SRGBA<uint8_t> { 0, 255, 0 };
    static constexpr auto darkGreen = SRGBA<uint8_t> { 0, 128, 0 };
    static constexpr auto orange = SRGBA<uint8_t> { 255, 128, 0 };
    static constexpr auto purple = SRGBA<uint8_t> { 128, 0, 255 };

    static bool isBlackColor(const Color&);
    static bool isWhiteColor(const Color&);

    // Out of line and inline colors will always be non-equal.
    friend bool operator==(const Color& a, const Color& b);
    friend bool equalIgnoringSemanticColor(const Color& a, const Color& b);
    friend bool outOfLineComponentsEqual(const Color&, const Color&);
    friend bool outOfLineComponentsEqualIgnoringSemanticColor(const Color&, const Color&);

    // Returns the underlying color converted to pre-resolved 8-bit sRGBA, useful for debugging purposes.
    struct DebugRGBA {
        unsigned red;
        unsigned green;
        unsigned blue;
        unsigned alpha;
    };
    DebugRGBA debugRGBA() const;

    String debugDescription() const;

private:
    friend void add(Hasher&, const Color&);

    class OutOfLineComponents : public ThreadSafeRefCounted<OutOfLineComponents> {
        WTF_MAKE_FAST_COMPACT_ALLOCATED;
    public:
        static Ref<OutOfLineComponents> create(ColorComponents<float, 4>&& components)
        {
            return adoptRef(*new OutOfLineComponents(WTFMove(components)));
        }

        float unresolvedAlpha() const { return m_components[3]; }
        float resolvedAlpha() const { return std::isnan(m_components[3]) ? 0 : m_components[3]; }
        ColorComponents<float, 4> unresolvedComponents() const { return m_components; }
        ColorComponents<float, 4> resolvedComponents() const { return resolveColorComponents(m_components); }

    private:
        OutOfLineComponents(ColorComponents<float, 4>&& components)
            : m_components(WTFMove(components))
        {
        }

        ColorComponents<float, 4> m_components;
    };
    Color(Ref<OutOfLineComponents>&&, ColorSpace, OptionSet<Flags> = { });

#if USE(CG)
    WEBCORE_EXPORT static Color createAndLosslesslyConvertToSupportedColorSpace(CGColorRef, OptionSet<Flags> = { });
#endif

    enum class FlagsIncludingPrivate : uint8_t {
        Semantic                        = static_cast<uint8_t>(Flags::Semantic),
        UseColorFunctionSerialization   = static_cast<uint8_t>(Flags::UseColorFunctionSerialization),
        Valid                           = 1 << 2,
        OutOfLine                       = 1 << 3,
        HashTableEmptyValue             = 1 << 4,
        HashTableDeletedValue           = 1 << 5,
    };
    static OptionSet<FlagsIncludingPrivate> toFlagsIncludingPrivate(OptionSet<Flags> flags) { return OptionSet<FlagsIncludingPrivate>::fromRaw(flags.toRaw()); }

    OptionSet<FlagsIncludingPrivate> flags() const;
    bool isOutOfLine() const;
    bool isInline() const;

    void setColor(SRGBA<uint8_t>, OptionSet<FlagsIncludingPrivate> = { });
    void setOutOfLineComponents(Ref<OutOfLineComponents>&&, ColorSpace, OptionSet<FlagsIncludingPrivate> = { });

    SRGBA<uint8_t> asInline() const;
    PackedColor::RGBA asPackedInline() const;

    const OutOfLineComponents& asOutOfLine() const;
    Ref<OutOfLineComponents> asOutOfLineRef() const;

#if CPU(ADDRESS64)
    static constexpr unsigned maxNumberOfBitsInPointer = 48;
#else
    static constexpr unsigned maxNumberOfBitsInPointer = 32;
#endif
    static constexpr uint64_t colorValueMask = (1ULL << maxNumberOfBitsInPointer) - 1;
    static constexpr uint64_t flagsSize = sizeof(FlagsIncludingPrivate) * 8;
    static constexpr uint64_t flagsShift = maxNumberOfBitsInPointer;
    static constexpr uint64_t colorSpaceSize = sizeof(ColorSpace) * 8;
    static constexpr uint64_t colorSpaceShift = flagsShift + flagsSize;
    static_assert(flagsSize + colorSpaceSize + maxNumberOfBitsInPointer <= 64);

    static uint64_t encodedFlags(OptionSet<FlagsIncludingPrivate>);
    static uint64_t encodedColorSpace(ColorSpace);
    static uint64_t encodedInlineColor(SRGBA<uint8_t>);
    static uint64_t encodedPackedInlineColor(PackedColor::RGBA);
    static uint64_t encodedOutOfLineComponents(Ref<OutOfLineComponents>&&);

    static OptionSet<FlagsIncludingPrivate> decodedFlags(uint64_t);
    static ColorSpace decodedColorSpace(uint64_t);
    static SRGBA<uint8_t> decodedInlineColor(uint64_t);
    static PackedColor::RGBA decodedPackedInlineColor(uint64_t);
    static OutOfLineComponents& decodedOutOfLineComponents(uint64_t);

    static constexpr uint64_t invalidColorAndFlags = 0;
    uint64_t m_colorAndFlags { invalidColorAndFlags };
};

inline void add(Hasher& hasher, const Color& color)
{
    if (color.isOutOfLine())
        add(hasher, color.asOutOfLine().unresolvedComponents(), color.colorSpace(), color.flags());
    else
        add(hasher, color.asPackedInline().value, color.flags());
}

bool operator==(const Color&, const Color&);

// One or both must be out of line colors.
bool outOfLineComponentsEqual(const Color&, const Color&);
bool outOfLineComponentsEqualIgnoringSemanticColor(const Color&, const Color&);

#if USE(CG)
WEBCORE_EXPORT RetainPtr<CGColorRef> cachedCGColor(const Color&);
WEBCORE_EXPORT ColorComponents<float, 4> platformConvertColorComponents(ColorSpace, ColorComponents<float, 4>, const DestinationColorSpace&);
WEBCORE_EXPORT std::optional<SRGBA<uint8_t>> roundAndClampToSRGBALossy(CGColorRef);
#endif

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const Color&);

inline bool operator==(const Color& a, const Color& b)
{
    if (a.isOutOfLine() || b.isOutOfLine())
        return outOfLineComponentsEqual(a, b);
    return a.m_colorAndFlags == b.m_colorAndFlags;
}

inline bool outOfLineComponentsEqual(const Color& a, const Color& b)
{
    if (a.isOutOfLine() && b.isOutOfLine())
        return a.asOutOfLine().unresolvedComponents() == b.asOutOfLine().unresolvedComponents() && a.colorSpace() == b.colorSpace() && a.flags() == b.flags();

    ASSERT(a.isOutOfLine() || b.isOutOfLine());
    return false;
}

inline bool outOfLineComponentsEqualIgnoringSemanticColor(const Color& a, const Color& b)
{
    if (a.isOutOfLine() && b.isOutOfLine()) {
        auto aFlags = a.flags() - Color::FlagsIncludingPrivate::Semantic;
        auto bFlags = b.flags() - Color::FlagsIncludingPrivate::Semantic;
        return a.asOutOfLine().unresolvedComponents() == b.asOutOfLine().unresolvedComponents() && a.colorSpace() == b.colorSpace() && aFlags == bFlags;
    }

    ASSERT(a.isOutOfLine() || b.isOutOfLine());
    return false;
}

inline bool equalIgnoringSemanticColor(const Color& a, const Color& b)
{
    if (a.isOutOfLine() || b.isOutOfLine())
        return outOfLineComponentsEqualIgnoringSemanticColor(a, b);

    auto aFlags = a.flags() - Color::FlagsIncludingPrivate::Semantic;
    auto bFlags = b.flags() - Color::FlagsIncludingPrivate::Semantic;
    return a.asPackedInline().value == b.asPackedInline().value && aFlags == bFlags;
}

inline Color::Color(SRGBA<uint8_t> color, OptionSet<Flags> flags)
{
    setColor(color, toFlagsIncludingPrivate(flags));
}

inline Color::Color(std::optional<SRGBA<uint8_t>> color, OptionSet<Flags> flags)
{
    if (color)
        setColor(*color, toFlagsIncludingPrivate(flags));
}

template<typename ColorType, typename std::enable_if_t<IsColorTypeWithComponentType<ColorType, float>>*>
inline Color::Color(const ColorType& color, OptionSet<Flags> flags)
{
    setOutOfLineComponents(OutOfLineComponents::create(asColorComponents(color.unresolved())), ColorSpaceFor<ColorType>, toFlagsIncludingPrivate(flags));
}

template<typename ColorType, typename std::enable_if_t<IsColorTypeWithComponentType<ColorType, float>>*>
inline Color::Color(const std::optional<ColorType>& color, OptionSet<Flags> flags)
{
    if (color)
        setOutOfLineComponents(OutOfLineComponents::create(asColorComponents(color->unresolved())), ColorSpaceFor<ColorType>, toFlagsIncludingPrivate(flags));
}

inline Color::Color(Ref<OutOfLineComponents>&& outOfLineComponents, ColorSpace colorSpace, OptionSet<Flags> flags)
{
    setOutOfLineComponents(WTFMove(outOfLineComponents), colorSpace, toFlagsIncludingPrivate(flags));
}

inline Color::Color(WTF::HashTableEmptyValueType)
{
    m_colorAndFlags = encodedFlags({ FlagsIncludingPrivate::HashTableEmptyValue });
}

inline Color::Color(WTF::HashTableDeletedValueType)
{
    m_colorAndFlags = encodedFlags({ FlagsIncludingPrivate::HashTableDeletedValue });
}

inline bool Color::isHashTableDeletedValue() const
{
    return flags().contains(FlagsIncludingPrivate::HashTableDeletedValue);
}

inline bool Color::isHashTableEmptyValue() const
{
    return flags().contains(FlagsIncludingPrivate::HashTableEmptyValue);
}

inline Color::~Color()
{
    if (isOutOfLine())
        asOutOfLine().deref();
}

inline bool Color::isValid() const
{
    return flags().contains(FlagsIncludingPrivate::Valid);
}

inline bool Color::isSemantic() const
{
    return flags().contains(FlagsIncludingPrivate::Semantic);
}

inline bool Color::usesColorFunctionSerialization() const
{
    return flags().contains(FlagsIncludingPrivate::UseColorFunctionSerialization);
}

inline ColorSpace Color::colorSpace() const
{
    return decodedColorSpace(m_colorAndFlags);
}

template<typename Functor> decltype(auto) Color::callOnUnderlyingType(Functor&& functor) const
{
    if (isOutOfLine())
        return callWithColorType(asOutOfLine().unresolvedComponents(), colorSpace(), std::forward<Functor>(functor));
    return std::invoke(std::forward<Functor>(functor), asInline());
}

template<typename ColorType> ColorType Color::toColorTypeLossy() const
{
    return callOnUnderlyingType([] (const auto& underlyingColor) {
        return convertColor<ColorType>(underlyingColor);
    });
}

template<typename ColorType> ColorType Color::toColorTypeLossyCarryingForwardMissing() const
{
    return callOnUnderlyingType([] (const auto& underlyingColor) {
        return convertColorCarryingForwardMissing<ColorType>(underlyingColor);
    });
}

inline Color Color::invertedColorWithAlpha(std::optional<float> alpha) const
{
    return alpha ? invertedColorWithAlpha(alpha.value()) : *this;
}

inline Color Color::colorWithAlphaMultipliedBy(float amount) const
{
    return colorWithAlpha(amount * alphaAsFloat());
}

inline Color Color::colorWithAlphaMultipliedBy(std::optional<float> alpha) const
{
    return alpha ? colorWithAlphaMultipliedBy(alpha.value()) : *this;
}

inline Color Color::colorWithAlpha(std::optional<float> alpha) const
{
    return alpha ? colorWithAlpha(alpha.value()) : *this;
}

inline OptionSet<Color::FlagsIncludingPrivate> Color::flags() const
{
    return decodedFlags(m_colorAndFlags);
}

inline bool Color::isOutOfLine() const
{
    return flags().contains(FlagsIncludingPrivate::OutOfLine);
}

inline bool Color::isInline() const
{
    return !flags().contains(FlagsIncludingPrivate::OutOfLine);
}

inline const Color::OutOfLineComponents& Color::asOutOfLine() const
{
    ASSERT(isOutOfLine());
    return decodedOutOfLineComponents(m_colorAndFlags);
}

inline Ref<Color::OutOfLineComponents> Color::asOutOfLineRef() const
{
    ASSERT(isOutOfLine());
    return decodedOutOfLineComponents(m_colorAndFlags);
}

inline SRGBA<uint8_t> Color::asInline() const
{
    ASSERT(isInline());
    return asSRGBA(asPackedInline());
}

inline PackedColor::RGBA Color::asPackedInline() const
{
    ASSERT(isInline());
    return decodedPackedInlineColor(m_colorAndFlags);
}

inline std::optional<PackedColor::RGBA> Color::tryGetAsPackedInline() const
{
    if (isInline())
        return asPackedInline();
    return std::nullopt;
}

inline std::optional<SRGBA<uint8_t>> Color::tryGetAsSRGBABytes() const
{
    if (isInline())
        return asInline();
    return std::nullopt;
}

inline uint64_t Color::encodedFlags(OptionSet<FlagsIncludingPrivate> flags)
{
    return static_cast<uint64_t>(flags.toRaw()) << flagsShift;
}

inline uint64_t Color::encodedColorSpace(ColorSpace colorSpace)
{
    return static_cast<uint64_t>(colorSpace) << colorSpaceShift;
}

inline uint64_t Color::encodedInlineColor(SRGBA<uint8_t> color)
{
    return encodedPackedInlineColor(PackedColor::RGBA { color });
}

inline uint64_t Color::encodedPackedInlineColor(PackedColor::RGBA color)
{
    return color.value;
}

inline uint64_t Color::encodedOutOfLineComponents(Ref<OutOfLineComponents>&& outOfLineComponents)
{
#if CPU(ADDRESS64)
    return std::bit_cast<uint64_t>(&outOfLineComponents.leakRef());
#else
    return std::bit_cast<uint32_t>(&outOfLineComponents.leakRef());
#endif
}

inline OptionSet<Color::FlagsIncludingPrivate> Color::decodedFlags(uint64_t value)
{
    return OptionSet<Color::FlagsIncludingPrivate>::fromRaw(static_cast<uint8_t>(value >> flagsShift));
}

inline ColorSpace Color::decodedColorSpace(uint64_t value)
{
    return static_cast<ColorSpace>(static_cast<uint8_t>(value >> colorSpaceShift));
}

inline SRGBA<uint8_t> Color::decodedInlineColor(uint64_t value)
{
    return asSRGBA(decodedPackedInlineColor(value));
}

inline PackedColor::RGBA Color::decodedPackedInlineColor(uint64_t value)
{
    return PackedColor::RGBA { static_cast<uint32_t>(value & colorValueMask) };
}

inline Color::OutOfLineComponents& Color::decodedOutOfLineComponents(uint64_t value)
{
#if CPU(ADDRESS64)
    return *std::bit_cast<OutOfLineComponents*>(value & colorValueMask);
#else
    return *std::bit_cast<OutOfLineComponents*>(static_cast<uint32_t>(value & colorValueMask));
#endif
}

inline void Color::setColor(SRGBA<uint8_t> color, OptionSet<FlagsIncludingPrivate> flags)
{
    flags.add({ FlagsIncludingPrivate::Valid });
    m_colorAndFlags = encodedInlineColor(color) | encodedColorSpace(ColorSpace::SRGB) | encodedFlags(flags);
    ASSERT(isInline());
}

inline void Color::setOutOfLineComponents(Ref<OutOfLineComponents>&& color, ColorSpace colorSpace, OptionSet<FlagsIncludingPrivate> flags)
{
    flags.add({ FlagsIncludingPrivate::Valid, FlagsIncludingPrivate::OutOfLine });
    m_colorAndFlags = encodedOutOfLineComponents(WTFMove(color)) | encodedColorSpace(colorSpace) | encodedFlags(flags);
    ASSERT(isOutOfLine());
}

} // namespace WebCore

namespace WTF {
template<> struct DefaultHash<WebCore::Color>;
template<> struct HashTraits<WebCore::Color>;
}
