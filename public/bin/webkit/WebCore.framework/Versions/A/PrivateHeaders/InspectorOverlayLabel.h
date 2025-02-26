/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "Color.h"
#include "FloatPoint.h"
#include <wtf/ArgumentCoder.h>
#include <wtf/TZoneMalloc.h>
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

class FloatSize;
class GraphicsContext;
class Path;

class InspectorOverlayLabel {
    WTF_MAKE_TZONE_ALLOCATED(InspectorOverlayLabel);
public:
    struct Arrow {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        enum class Direction : uint8_t {
            None,
            Down,
            Up,
            Left,
            Right,
        };

        enum class Alignment : uint8_t {
            None,
            Leading, // Positioned at the left/top side of edge.
            Middle, // Positioned at the center on the edge.
            Trailing, // Positioned at the right/bottom side of the edge.
        };

        Direction direction;
        Alignment alignment;

        Arrow(Direction direction, Alignment alignment)
            : direction(direction)
            , alignment(alignment)
        {
            ASSERT(alignment != Alignment::None || direction == Direction::None);
        }
    };

    struct Content {
        WTF_MAKE_STRUCT_FAST_ALLOCATED;

        struct Decoration {
            enum class Type : uint8_t {
                None,
                Bordered,
            };

            Type type;
            Color color;
        };

        String text;
        Color textColor;
        Decoration decoration { Decoration::Type::None, Color::transparentBlack };
    };

    WEBCORE_EXPORT InspectorOverlayLabel(Vector<Content>&&, FloatPoint, Color backgroundColor, Arrow);
    InspectorOverlayLabel(const String&, FloatPoint, Color backgroundColor, Arrow);

    Path draw(GraphicsContext&, float maximumLineWidth = 0);

    static FloatSize expectedSize(const Vector<Content>&, Arrow::Direction);
    static FloatSize expectedSize(const String&, Arrow::Direction);

private:
    friend struct IPC::ArgumentCoder<InspectorOverlayLabel, void>;
    Vector<Content> m_contents;
    FloatPoint m_location;
    Color m_backgroundColor;
    Arrow m_arrow;
};

} // namespace WebCore
