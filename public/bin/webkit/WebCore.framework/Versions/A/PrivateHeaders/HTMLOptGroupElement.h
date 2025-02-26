/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004, 2005, 2006, 2007, 2010 Apple Inc. All rights reserved.
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

#include "HTMLElement.h"

namespace WebCore {
    
class HTMLSelectElement;

class HTMLOptGroupElement final : public HTMLElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLOptGroupElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLOptGroupElement);
public:
    static Ref<HTMLOptGroupElement> create(const QualifiedName&, Document&);

    bool isDisabledFormControl() const final;
    WEBCORE_EXPORT HTMLSelectElement* ownerSelectElement() const;
    
    WEBCORE_EXPORT String groupLabelText() const;

private:
    HTMLOptGroupElement(const QualifiedName&, Document&);

    const AtomString& formControlType() const;
    bool isFocusable() const final;
    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) final;
    bool rendererIsNeeded(const RenderStyle&) final { return false; }

    void childrenChanged(const ChildChange&) final;

    bool accessKeyAction(bool sendMouseEvents) final;

    void recalcSelectOptions();

    bool m_isDisabled { false };
};

} // namespace WebCore
