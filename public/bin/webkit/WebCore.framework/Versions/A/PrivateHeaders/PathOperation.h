/*
 * Copyright (C) 2012, 2013 Adobe Systems Incorporated. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1. Redistributions of source code must retain the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer.
 * 2. Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials
 *    provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER “AS IS” AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#pragma once

#include "MotionPath.h"
#include "Path.h"
#include "RenderStyleConstants.h"
#include "StyleBasicShape.h"
#include "StyleRayFunction.h"
#include "TransformOperationData.h"
#include <wtf/RefCounted.h>
#include <wtf/TypeCasts.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class SVGElement;
struct BlendingContext;

class PathOperation : public RefCounted<PathOperation> {
public:
    enum class Type : uint8_t {
        Reference,
        Shape,
        Box,
        Ray
    };

    virtual ~PathOperation();

    virtual Ref<PathOperation> clone() const = 0;

    virtual bool operator==(const PathOperation&) const = 0;

    virtual bool canBlend(const PathOperation&) const { return false; }
    virtual RefPtr<PathOperation> blend(const PathOperation*, const BlendingContext&) const { return nullptr; }
    virtual std::optional<Path> getPath(const TransformOperationData&) const = 0;

    Type type() const { return m_type; }

    void setReferenceBox(CSSBoxType type) { m_referenceBox = type; }
    CSSBoxType referenceBox() const { return m_referenceBox; }

    bool isSameType(const PathOperation& o) const { return o.type() == m_type; }

protected:
    explicit PathOperation(Type type)
        : m_type(type)
        , m_referenceBox(CSSBoxType::BoxMissing)
    {
    }
    explicit PathOperation(Type type, CSSBoxType referenceBox)
        : m_type(type)
        , m_referenceBox(referenceBox)
    {
    }
    const Type m_type;
    CSSBoxType m_referenceBox;
};

class ReferencePathOperation final : public PathOperation {
public:
    static Ref<ReferencePathOperation> create(const String& url, const AtomString& fragment, const RefPtr<SVGElement>);
    WEBCORE_EXPORT static Ref<ReferencePathOperation> create(std::optional<Path>&&);

    Ref<PathOperation> clone() const final;

    const String& url() const { return m_url; }
    const AtomString& fragment() const { return m_fragment; }

    std::optional<Path> getPath(const TransformOperationData&) const final { return m_path; }
    std::optional<Path> path() const { return m_path; }

private:
    bool operator==(const PathOperation& other) const override
    {
        if (!isSameType(other))
            return false;
        auto& referenceClip = uncheckedDowncast<ReferencePathOperation>(other);
        return m_url == referenceClip.m_url;
    }

    ReferencePathOperation(const String& url, const AtomString& fragment, const RefPtr<SVGElement>);
    ReferencePathOperation(std::optional<Path>&&);

    String m_url;
    AtomString m_fragment;
    std::optional<Path> m_path;
};

class ShapePathOperation final : public PathOperation {
public:
    WEBCORE_EXPORT static Ref<ShapePathOperation> create(Style::BasicShape, CSSBoxType = CSSBoxType::BoxMissing);

    Ref<PathOperation> clone() const final;

    bool canBlend(const PathOperation&) const final;
    RefPtr<PathOperation> blend(const PathOperation*, const BlendingContext&) const final;

    const Style::BasicShape& shape() const { return m_shape; }
    WindRule windRule() const { return Style::windRule(m_shape); }
    Path pathForReferenceRect(const FloatRect& boundingRect) const { return Style::path(m_shape, boundingRect); }

    std::optional<Path> getPath(const TransformOperationData&) const final;

private:
    bool operator==(const PathOperation& other) const override
    {
        if (!isSameType(other))
            return false;

        auto& otherOperation = uncheckedDowncast<ShapePathOperation>(other);
        return m_shape == otherOperation.m_shape
            && m_referenceBox == otherOperation.m_referenceBox;
    }

    ShapePathOperation(Style::BasicShape shape, CSSBoxType referenceBox)
        : PathOperation(Type::Shape, referenceBox)
        , m_shape(WTFMove(shape))
    {
    }

    Style::BasicShape m_shape;
};

class BoxPathOperation final : public PathOperation {
public:
    WEBCORE_EXPORT static Ref<BoxPathOperation> create(CSSBoxType);

    Ref<PathOperation> clone() const final;

    Path pathForReferenceRect(const FloatRoundedRect& boundingRect) const
    {
        Path path;
        path.addRoundedRect(boundingRect);
        return path;
    }
    
    std::optional<Path> getPath(const TransformOperationData&) const final;

private:
    bool operator==(const PathOperation& other) const override
    {
        if (!isSameType(other))
            return false;
        auto& boxClip = uncheckedDowncast<BoxPathOperation>(other);
        return referenceBox() == boxClip.referenceBox();
    }

    explicit BoxPathOperation(CSSBoxType referenceBox)
        : PathOperation(Type::Box, referenceBox)
    {
    }
};

class RayPathOperation final : public PathOperation {
public:
    WEBCORE_EXPORT static Ref<RayPathOperation> create(Style::RayFunction, CSSBoxType = CSSBoxType::BoxMissing);

    Ref<PathOperation> clone() const final;

    const Style::RayFunction& ray() const { return m_ray; }

    WEBCORE_EXPORT bool canBlend(const PathOperation&) const final;
    RefPtr<PathOperation> blend(const PathOperation*, const BlendingContext&) const final;

    double lengthForPath() const;
    double lengthForContainPath(const FloatRect& elementRect, double computedPathLength) const;
    std::optional<Path> getPath(const TransformOperationData&) const final;

private:
    bool operator==(const PathOperation& other) const override
    {
        if (!isSameType(other))
            return false;

        auto& otherCasted = uncheckedDowncast<RayPathOperation>(other);
        return m_ray == otherCasted.m_ray;
    }

    RayPathOperation(Style::RayFunction ray, CSSBoxType referenceBox)
        : PathOperation(Type::Ray, referenceBox)
        , m_ray(WTFMove(ray))
    {
    }

    Style::RayFunction m_ray;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_CLIP_PATH_OPERATION(ToValueTypeName, predicate) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
    static bool isType(const WebCore::PathOperation& operation) { return operation.type() == WebCore::predicate; } \
SPECIALIZE_TYPE_TRAITS_END()

SPECIALIZE_TYPE_TRAITS_CLIP_PATH_OPERATION(ReferencePathOperation, PathOperation::Type::Reference)
SPECIALIZE_TYPE_TRAITS_CLIP_PATH_OPERATION(ShapePathOperation, PathOperation::Type::Shape)
SPECIALIZE_TYPE_TRAITS_CLIP_PATH_OPERATION(BoxPathOperation, PathOperation::Type::Box)
SPECIALIZE_TYPE_TRAITS_CLIP_PATH_OPERATION(RayPathOperation, PathOperation::Type::Ray)
