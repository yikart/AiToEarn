/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003, 2005, 2006, 2007, 2008 Apple Inc. All rights reserved.
 * Copyright (C) 2006 Graham Dennis (graham.dennis@gmail.com)
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
 *
 */

#pragma once

#include "IntPoint.h"
#include "StyleImage.h"

namespace WebCore {

class CursorData {
public:
    CursorData(RefPtr<StyleImage>&& image, const IntPoint& hotSpot)
        : m_image(WTFMove(image))
        , m_hotSpot(hotSpot)
    {
    }

    friend bool operator==(const CursorData&, const CursorData&) = default;

    StyleImage* image() const { return m_image.get(); }    
    void setImage(RefPtr<StyleImage>&& image) { m_image = WTFMove(image); }

    // Hot spot in the image in logical pixels.
    const IntPoint& hotSpot() const { return m_hotSpot; }
    
private:
    RefPtr<StyleImage> m_image;
    IntPoint m_hotSpot; // for CSS3 support
};

} // namespace WebCore
