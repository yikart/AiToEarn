/*
 * Copyright (C) 2011-2020 Apple Inc. All rights reserved.
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

#include "Color.h"
#include "LayoutSize.h"
#include "LengthBox.h"
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/TypeCasts.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

// CSS Filters

struct BlendingContext;
class CachedResourceLoader;
class CachedSVGDocumentReference;
class FilterEffect;
struct ResourceLoaderOptions;

class FilterOperation : public ThreadSafeRefCounted<FilterOperation> {
public:
    enum class Type : uint8_t {
        Reference, // url(#somefilter)
        Grayscale,
        Sepia,
        Saturate,
        HueRotate,
        Invert,
        AppleInvertLightness,
        Opacity,
        Brightness,
        Contrast,
        Blur,
        DropShadow,
        Passthrough,
        Default,
        None
    };

    virtual ~FilterOperation() = default;

    virtual Ref<FilterOperation> clone() const = 0;

    virtual bool operator==(const FilterOperation&) const = 0;

    virtual RefPtr<FilterOperation> blend(const FilterOperation* /*from*/, const BlendingContext&, bool /*blendToPassthrough*/ = false)
    {
        return nullptr;
    }
    
    virtual bool transformColor(SRGBA<float>&) const { return false; }
    virtual bool inverseTransformColor(SRGBA<float>&) const { return false; }

    Type type() const { return m_type; }

    static bool isBasicColorMatrixFilterOperationType(Type type)
    {
        return type == Type::Grayscale || type == Type::Sepia || type == Type::Saturate || type == Type::HueRotate;
    }

    bool isBasicColorMatrixFilterOperation() const
    {
        return isBasicColorMatrixFilterOperationType(m_type);
    }

    static bool isBasicComponentTransferFilterOperationType(Type type)
    {
        return type == Type::Invert || type == Type::Brightness || type == Type::Contrast || type == Type::Opacity;
    }

    bool isBasicComponentTransferFilterOperation() const
    {
        return isBasicComponentTransferFilterOperationType(m_type);
    }

    bool isSameType(const FilterOperation& o) const { return o.type() == m_type; }

    virtual bool isIdentity() const { return false; }

    virtual IntOutsets outsets() const { return { }; }

    // True if the alpha channel of any pixel can change under this operation.
    virtual bool affectsOpacity() const { return false; }
    // True if the value of one pixel can affect the value of another pixel under this operation, such as blur.
    virtual bool movesPixels() const { return false; }
    // True if the filter should not be allowed to work on content that is not available from this security origin.
    virtual bool shouldBeRestrictedBySecurityOrigin() const { return false; }

protected:
    FilterOperation(Type type)
        : m_type(type)
    {
    }

    double blendAmounts(double from, double to, const BlendingContext&) const;

    Type m_type;
};

class WEBCORE_EXPORT DefaultFilterOperation : public FilterOperation {
public:
    static Ref<DefaultFilterOperation> create(Type representedType)
    {
        return adoptRef(*new DefaultFilterOperation(representedType));
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new DefaultFilterOperation(representedType()));
    }

    Type representedType() const;

private:
    bool operator==(const FilterOperation&) const override;

    DefaultFilterOperation(Type representedType)
        : FilterOperation(Type::Default)
        , m_representedType(representedType)
    {
    }

    Type m_representedType;
};

class PassthroughFilterOperation : public FilterOperation {
public:
    static Ref<PassthroughFilterOperation> create()
    {
        return adoptRef(*new PassthroughFilterOperation());
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new PassthroughFilterOperation());
    }

private:
    bool operator==(const FilterOperation& o) const override
    {
        return isSameType(o);
    }

    PassthroughFilterOperation()
        : FilterOperation(Type::Passthrough)
    {
    }
};

class ReferenceFilterOperation : public FilterOperation {
public:
    static Ref<ReferenceFilterOperation> create(const String& url, AtomString&& fragment)
    {
        return adoptRef(*new ReferenceFilterOperation(url, WTFMove(fragment)));
    }
    virtual ~ReferenceFilterOperation();

    Ref<FilterOperation> clone() const final
    {
        // Reference filters cannot be cloned.
        RELEASE_ASSERT_NOT_REACHED();
    }

    bool affectsOpacity() const override { return true; }
    bool movesPixels() const override { return true; }
    // FIXME: This only needs to return true for graphs that include ConvolveMatrix, DisplacementMap, Morphology and possibly Lighting.
    // https://bugs.webkit.org/show_bug.cgi?id=171753
    bool shouldBeRestrictedBySecurityOrigin() const override { return true; }

    const String& url() const { return m_url; }
    const AtomString& fragment() const { return m_fragment; }

    void loadExternalDocumentIfNeeded(CachedResourceLoader&, const ResourceLoaderOptions&);

    CachedSVGDocumentReference* cachedSVGDocumentReference() const { return m_cachedSVGDocumentReference.get(); }

private:
    ReferenceFilterOperation(const String& url, AtomString&& fragment);

    bool operator==(const FilterOperation&) const override;

    bool isIdentity() const override;
    IntOutsets outsets() const override;

    String m_url;
    AtomString m_fragment;
    std::unique_ptr<CachedSVGDocumentReference> m_cachedSVGDocumentReference;
};

// Grayscale, Sepia, Saturate and HueRotate are variations on a basic color matrix effect.
// For HueRotate, the angle of rotation is stored in m_amount.
class WEBCORE_EXPORT BasicColorMatrixFilterOperation : public FilterOperation {
public:
    static Ref<BasicColorMatrixFilterOperation> create(double amount, Type type)
    {
        return adoptRef(*new BasicColorMatrixFilterOperation(amount, type));
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new BasicColorMatrixFilterOperation(amount(), type()));
    }

    double amount() const { return m_amount; }

    RefPtr<FilterOperation> blend(const FilterOperation* from, const BlendingContext&, bool blendToPassthrough = false) override;

private:
    bool operator==(const FilterOperation&) const override;

    double passthroughAmount() const;

    BasicColorMatrixFilterOperation(double amount, Type type)
        : FilterOperation(type)
        , m_amount(amount)
    {
    }

    bool isIdentity() const override;
    bool transformColor(SRGBA<float>&) const override;

    double m_amount;
};

// Invert, Brightness, Contrast and Opacity are variations on a basic component transfer effect.
class WEBCORE_EXPORT BasicComponentTransferFilterOperation : public FilterOperation {
public:
    static Ref<BasicComponentTransferFilterOperation> create(double amount, Type type)
    {
        return adoptRef(*new BasicComponentTransferFilterOperation(amount, type));
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new BasicComponentTransferFilterOperation(amount(), type()));
    }

    double amount() const { return m_amount; }

    bool affectsOpacity() const override;

    RefPtr<FilterOperation> blend(const FilterOperation* from, const BlendingContext&, bool blendToPassthrough = false) override;

private:
    bool operator==(const FilterOperation&) const override;

    double passthroughAmount() const;

    BasicComponentTransferFilterOperation(double amount, Type type)
        : FilterOperation(type)
        , m_amount(amount)
    {
    }

    bool isIdentity() const override;
    bool transformColor(SRGBA<float>&) const override;

    double m_amount;
};

class WEBCORE_EXPORT InvertLightnessFilterOperation : public FilterOperation {
public:
    static Ref<InvertLightnessFilterOperation> create()
    {
        return adoptRef(*new InvertLightnessFilterOperation());
    }

    Ref<FilterOperation> clone() const final
    {
        return adoptRef(*new InvertLightnessFilterOperation());
    }

    RefPtr<FilterOperation> blend(const FilterOperation* from, const BlendingContext&, bool blendToPassthrough = false) override;

private:
    bool operator==(const FilterOperation&) const final;

    InvertLightnessFilterOperation()
        : FilterOperation(Type::AppleInvertLightness)
    {
    }

    bool transformColor(SRGBA<float>&) const final;
    bool inverseTransformColor(SRGBA<float>&) const final;
};

class WEBCORE_EXPORT BlurFilterOperation : public FilterOperation {
public:
    static Ref<BlurFilterOperation> create(Length stdDeviation)
    {
        return adoptRef(*new BlurFilterOperation(WTFMove(stdDeviation)));
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new BlurFilterOperation(stdDeviation()));
    }

    const Length& stdDeviation() const { return m_stdDeviation; }

    bool affectsOpacity() const override { return true; }
    bool movesPixels() const override { return true; }

    RefPtr<FilterOperation> blend(const FilterOperation* from, const BlendingContext&, bool blendToPassthrough = false) override;

private:
    bool operator==(const FilterOperation&) const override;

    BlurFilterOperation(Length stdDeviation)
        : FilterOperation(Type::Blur)
        , m_stdDeviation(WTFMove(stdDeviation))
    {
    }

    bool isIdentity() const override;
    IntOutsets outsets() const override;

    Length m_stdDeviation;
};

class WEBCORE_EXPORT DropShadowFilterOperation : public FilterOperation {
public:
    static Ref<DropShadowFilterOperation> create(const IntPoint& location, int stdDeviation, const Color& color)
    {
        return adoptRef(*new DropShadowFilterOperation(location, stdDeviation, color));
    }

    Ref<FilterOperation> clone() const override
    {
        return adoptRef(*new DropShadowFilterOperation(location(), stdDeviation(), color()));
    }

    int x() const { return m_location.x(); }
    int y() const { return m_location.y(); }
    IntPoint location() const { return m_location; }
    int stdDeviation() const { return m_stdDeviation; }
    const Color& color() const { return m_color; }

    bool affectsOpacity() const override { return true; }
    bool movesPixels() const override { return true; }

    RefPtr<FilterOperation> blend(const FilterOperation* from, const BlendingContext&, bool blendToPassthrough = false) override;

private:
    bool operator==(const FilterOperation&) const override;

    DropShadowFilterOperation(const IntPoint& location, int stdDeviation, const Color& color)
        : FilterOperation(Type::DropShadow)
        , m_location(location)
        , m_stdDeviation(stdDeviation)
        , m_color(color)
    {
    }

    bool isIdentity() const override;
    IntOutsets outsets() const override;

    IntPoint m_location; // FIXME: should location be in Lengths?
    int m_stdDeviation;
    Color m_color;
};

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, const FilterOperation&);

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::FilterOperation& operation) { return operation.predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(DefaultFilterOperation, type() == WebCore::FilterOperation::Type::Default)
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(PassthroughFilterOperation, type() == WebCore::FilterOperation::Type::Passthrough)
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(ReferenceFilterOperation, type() == WebCore::FilterOperation::Type::Reference)
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(BasicColorMatrixFilterOperation, isBasicColorMatrixFilterOperation())
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(BasicComponentTransferFilterOperation, isBasicComponentTransferFilterOperation())
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(InvertLightnessFilterOperation, type() == WebCore::FilterOperation::Type::AppleInvertLightness)
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(BlurFilterOperation, type() == WebCore::FilterOperation::Type::Blur)
SPECIALIZE_TYPE_TRAITS_FILTEROPERATION(DropShadowFilterOperation, type() == WebCore::FilterOperation::Type::DropShadow)
