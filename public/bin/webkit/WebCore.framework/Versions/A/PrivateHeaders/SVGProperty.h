/*
 * Copyright (C) Research In Motion Limited 2010. All rights reserved.
 * Copyright (C) 2018-2019 Apple Inc. All rights reserved.
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
 */

#pragma once

#include "SVGPropertyOwner.h"
#include <wtf/RefCounted.h>
#include <wtf/text/WTFString.h>

namespace WebCore {

enum class SVGPropertyAccess : uint8_t { ReadWrite, ReadOnly };
enum class SVGPropertyState : uint8_t { Clean, Dirty };

class SVGProperty : public RefCounted<SVGProperty> {
public:
    virtual ~SVGProperty() = default;

    // Managing the relationship with the owner.
    bool isAttached() const { return m_owner; }
    virtual void attach(SVGPropertyOwner* owner, SVGPropertyAccess access)
    {
        ASSERT(!m_owner);
        ASSERT(m_state == SVGPropertyState::Clean);
        m_owner = owner;
        m_access = access;
    }

    virtual void detach()
    {
        m_owner = nullptr;
        m_access = SVGPropertyAccess::ReadWrite;
        m_state = SVGPropertyState::Clean;
    }

    void reattach(SVGPropertyOwner* owner, SVGPropertyAccess access)
    {
        ASSERT_UNUSED(owner, owner == m_owner);
        m_access = access;
        m_state = SVGPropertyState::Clean;
    }

    const SVGElement* contextElement() const
    {
        if (!m_owner)
            return nullptr;
        return m_owner->attributeContextElement();
    }

    void commitChange()
    {
        if (!m_owner)
            return;
        m_owner->commitPropertyChange(this);
    }

    // DOM access.
    SVGPropertyAccess access() const { return m_access; }
    bool isReadOnly() const { return m_access == SVGPropertyAccess::ReadOnly; }

    // Synchronizing the SVG attribute and its reflection here.
    bool isDirty() const { return m_state == SVGPropertyState::Dirty; }
    void setDirty() { m_state = SVGPropertyState::Dirty; }
    std::optional<String> synchronize()
    {
        if (m_state == SVGPropertyState::Clean)
            return std::nullopt;
        m_state = SVGPropertyState::Clean;
        return valueAsString();
    }

    // This is used when calling setAttribute().
    virtual String valueAsString() const { return emptyString(); }

protected:
    SVGProperty(SVGPropertyOwner* owner = nullptr, SVGPropertyAccess access = SVGPropertyAccess::ReadWrite)
        : m_owner(owner)
        , m_access(access)
    {
    }

    SVGPropertyOwner* m_owner { nullptr };
    SVGPropertyAccess m_access { SVGPropertyAccess::ReadWrite };
    SVGPropertyState m_state { SVGPropertyState::Clean };
};

} // namespace WebCore
