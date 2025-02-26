/*
 * Copyright (C) 2000 Lars Knoll (knoll@kde.org)
 *           (C) 2000 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2017 Apple Inc. All rights reserved.
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

#include "FillLayer.h"
#include "OutlineValue.h"
#include "StyleColor.h"
#include <wtf/DataRef.h>
#include <wtf/RefCounted.h>
#include <wtf/Ref.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(StyleBackgroundData);
class StyleBackgroundData : public RefCounted<StyleBackgroundData> {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(StyleBackgroundData);
public:
    static Ref<StyleBackgroundData> create() { return adoptRef(*new StyleBackgroundData); }
    Ref<StyleBackgroundData> copy() const;

    bool operator==(const StyleBackgroundData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleBackgroundData&) const;
#endif

    bool isEquivalentForPainting(const StyleBackgroundData&, bool currentColorDiffers) const;

    DataRef<FillLayer> background;
    Style::Color color;
    OutlineValue outline;

    void dump(TextStream&, DumpStyleValues = DumpStyleValues::All) const;

private:
    StyleBackgroundData();
    StyleBackgroundData(const StyleBackgroundData&);
};

WTF::TextStream& operator<<(WTF::TextStream&, const StyleBackgroundData&);

} // namespace WebCore
