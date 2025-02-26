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

#include "Animation.h"
#include <wtf/Ref.h>
#include <wtf/RefCounted.h>
#include <wtf/Vector.h>

namespace WebCore {

class AnimationList : public RefCounted<AnimationList> {
public:
    static Ref<AnimationList> create() { return adoptRef(*new AnimationList); }

    Ref<AnimationList> copy() const { return adoptRef(*new AnimationList(*this, CopyBehavior::Clone)); }
    Ref<AnimationList> shallowCopy() const { return adoptRef(*new AnimationList(*this, CopyBehavior::Reference)); }

    void fillUnsetProperties();
    bool operator==(const AnimationList&) const;
    
    size_t size() const { return m_animations.size(); }
    bool isEmpty() const { return m_animations.isEmpty(); }
    
    void resize(size_t n) { m_animations.resize(n); }
    void remove(size_t i) { m_animations.remove(i); }
    void append(Ref<Animation>&& animation) { m_animations.append(WTFMove(animation)); }

    Animation& animation(size_t i) { return m_animations[i].get(); }
    const Animation& animation(size_t i) const { return m_animations[i].get(); }

    auto begin() const { return m_animations.begin(); }
    auto end() const { return m_animations.end(); }

    using const_reverse_iterator = Vector<Ref<Animation>>::const_reverse_iterator;
    const_reverse_iterator rbegin() const { return m_animations.rbegin(); }
    const_reverse_iterator rend() const { return m_animations.rend(); }

private:
    AnimationList();

    enum class CopyBehavior : uint8_t { Clone, Reference };
    AnimationList(const AnimationList&, CopyBehavior);

    AnimationList& operator=(const AnimationList&);

    Vector<Ref<Animation>, 0, CrashOnOverflow, 0> m_animations;
};    

WTF::TextStream& operator<<(WTF::TextStream&, const AnimationList&);

} // namespace WebCore
