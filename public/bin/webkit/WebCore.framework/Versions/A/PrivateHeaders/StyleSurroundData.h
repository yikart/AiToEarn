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

#include "BorderData.h"
#include "LengthBox.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleSurroundData);
class StyleSurroundData : public RefCounted<StyleSurroundData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleSurroundData);
public:
    static Ref<StyleSurroundData> create() { return adoptRef(*new StyleSurroundData); }
    Ref<StyleSurroundData> copy() const;
    
    bool operator==(const StyleSurroundData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleSurroundData&) const;
#endif

    // Here instead of in BorderData to pack up against the refcount.
    bool hasExplicitlySetBorderBottomLeftRadius : 1;
    bool hasExplicitlySetBorderBottomRightRadius : 1;
    bool hasExplicitlySetBorderTopLeftRadius : 1;
    bool hasExplicitlySetBorderTopRightRadius : 1;

    LengthBox offset;
    LengthBox margin;
    LengthBox padding;
    BorderData border;
    
private:
    StyleSurroundData();
    StyleSurroundData(const StyleSurroundData&);    
};

} // namespace WebCore
