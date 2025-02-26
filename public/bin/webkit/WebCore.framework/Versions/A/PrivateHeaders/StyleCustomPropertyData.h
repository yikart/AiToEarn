/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Google Inc. All rights reserved.
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

#include "CSSCustomPropertyValue.h"
#include <wtf/Function.h>
#include <wtf/HashMap.h>
#include <wtf/IterationStatus.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/text/AtomStringHash.h>

namespace WebCore {

class StyleCustomPropertyData : public RefCounted<StyleCustomPropertyData> {
private:
    using CustomPropertyValueMap = UncheckedKeyHashMap<AtomString, RefPtr<const CSSCustomPropertyValue>>;

public:
    static Ref<StyleCustomPropertyData> create() { return adoptRef(*new StyleCustomPropertyData); }
    Ref<StyleCustomPropertyData> copy() const { return adoptRef(*new StyleCustomPropertyData(*this)); }

    bool operator==(const StyleCustomPropertyData&) const;

#if !LOG_DISABLED
    void dumpDifferences(TextStream&, const StyleCustomPropertyData&) const;
#endif

    const CSSCustomPropertyValue* get(const AtomString&) const;
    void set(const AtomString&, Ref<const CSSCustomPropertyValue>&&);

    unsigned size() const { return m_size; }
    bool mayHaveAnimatableProperties() const { return m_mayHaveAnimatableProperties; }

    void forEach(const Function<IterationStatus(const KeyValuePair<AtomString, RefPtr<const CSSCustomPropertyValue>>&)>&) const;
    AtomString findKeyAtIndex(unsigned) const;

private:
    StyleCustomPropertyData() = default;
    StyleCustomPropertyData(const StyleCustomPropertyData&);

    template<typename Callback> void forEachInternal(Callback&&) const;

    RefPtr<const StyleCustomPropertyData> m_parentValues;
    CustomPropertyValueMap m_ownValues;
    unsigned m_size { 0 };
    unsigned m_ancestorCount { 0 };
    bool m_mayHaveAnimatableProperties { false };
#if ASSERT_ENABLED
    mutable bool m_hasChildren { false };
#endif
};

} // namespace WebCore
