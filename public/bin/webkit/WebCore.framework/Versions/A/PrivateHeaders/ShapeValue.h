/*
 * Copyright (C) 2012 Adobe Systems Incorporated. All rights reserved.
 * Copyright (C) 2014-2017 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDER "AS IS" AND ANY
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

#include "RenderStyleConstants.h"
#include "StyleBasicShape.h"
#include "StyleImage.h"

namespace WebCore {

struct BlendingContext;

class ShapeValue : public RefCounted<ShapeValue> {
public:
    static Ref<ShapeValue> create(Style::BasicShape&& shape, CSSBoxType cssBox)
    {
        return adoptRef(*new ShapeValue(WTFMove(shape), cssBox));
    }

    static Ref<ShapeValue> create(CSSBoxType boxShape)
    {
        return adoptRef(*new ShapeValue(boxShape));
    }

    static Ref<ShapeValue> create(Ref<StyleImage>&& image)
    {
        return adoptRef(*new ShapeValue(WTFMove(image)));
    }

    enum class Type { Shape, Box, Image };
    Type type() const;

    const Style::BasicShape* shape() const;
    CSSBoxType cssBox() const;
    CSSBoxType effectiveCSSBox() const;
    StyleImage* image() const;
    RefPtr<StyleImage> protectedImage() const;
    bool isImageValid() const;

    void setImage(Ref<StyleImage>&& image)
    {
        ASSERT(type() == Type::Image);
        m_value = WTFMove(image);
    }

    bool canBlend(const ShapeValue&) const;
    Ref<ShapeValue> blend(const ShapeValue&, const BlendingContext&) const;

    bool operator==(const ShapeValue&) const;

private:
    struct ShapeAndBox {
        Style::BasicShape shape;
        CSSBoxType box;

        bool operator==(const ShapeAndBox&) const = default;
    };

    ShapeValue(Style::BasicShape&& shape, CSSBoxType cssBox)
        : m_value(ShapeAndBox { WTFMove(shape), cssBox })
    {
    }

    explicit ShapeValue(Ref<StyleImage>&& image)
        : m_value(WTFMove(image))
    {
    }

    explicit ShapeValue(CSSBoxType cssBox)
        : m_value(cssBox)
    {
    }

    std::variant<ShapeAndBox, Ref<StyleImage>, CSSBoxType> m_value;
};

inline ShapeValue::Type ShapeValue::type() const
{
    return WTF::switchOn(m_value,
        [](const ShapeAndBox&) { return Type::Shape; },
        [](const Ref<StyleImage>&) { return Type::Image; },
        [](const CSSBoxType&) { return Type::Box; }
    );
}

inline const Style::BasicShape* ShapeValue::shape() const
{
    return WTF::switchOn(m_value,
        [](const ShapeAndBox& shape) -> const Style::BasicShape* { return &shape.shape; },
        [](const Ref<StyleImage>&) -> const Style::BasicShape* { return nullptr; },
        [](const CSSBoxType&) -> const Style::BasicShape* { return nullptr; }
    );
}

inline CSSBoxType ShapeValue::cssBox() const
{
    return WTF::switchOn(m_value,
        [](const ShapeAndBox& shape) { return shape.box; },
        [](const Ref<StyleImage>&) { return CSSBoxType::BoxMissing; },
        [](const CSSBoxType& box) { return box; }
    );
}

inline StyleImage* ShapeValue::image() const
{
    return WTF::switchOn(m_value,
        [](const ShapeAndBox&) -> StyleImage* { return nullptr; },
        [](const Ref<StyleImage>& image) -> StyleImage* { return image.ptr(); },
        [](const CSSBoxType&) -> StyleImage* { return nullptr; }
    );
}

inline RefPtr<StyleImage> ShapeValue::protectedImage() const
{
    return WTF::switchOn(m_value,
        [](const ShapeAndBox&) -> RefPtr<StyleImage> { return nullptr; },
        [](const Ref<StyleImage>& image) -> RefPtr<StyleImage> { return image.ptr(); },
        [](const CSSBoxType&) -> RefPtr<StyleImage> { return nullptr; }
    );
}

} // namespace WebCore
