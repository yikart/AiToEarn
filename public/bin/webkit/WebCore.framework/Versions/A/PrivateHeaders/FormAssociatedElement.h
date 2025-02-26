/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "HTMLFormElement.h"

namespace WebCore {

// https://html.spec.whatwg.org/multipage/forms.html#form-associated-element
class FormAssociatedElement {
public:
    void ref() const { refFormAssociatedElement(); }
    void deref() const { derefFormAssociatedElement(); }

    virtual ~FormAssociatedElement() { RELEASE_ASSERT(!m_form); }
    virtual HTMLElement& asHTMLElement() = 0;
    virtual const HTMLElement& asHTMLElement() const = 0;
    virtual bool isFormListedElement() const = 0;

    virtual void formWillBeDestroyed() { m_form = nullptr; }

    HTMLFormElement* form() const { return m_form.get(); }

    void setForm(RefPtr<HTMLFormElement>&&);
    virtual void elementInsertedIntoAncestor(Element&, Node::InsertionType);
    virtual void elementRemovedFromAncestor(Element&, Node::RemovalType);

    virtual FormAssociatedElement* asFormAssociatedElement() = 0;

protected:
    explicit FormAssociatedElement(HTMLFormElement*);

    virtual void resetFormOwner() = 0;
    virtual void setFormInternal(RefPtr<HTMLFormElement>&&);

private:
    virtual void refFormAssociatedElement() const = 0;
    virtual void derefFormAssociatedElement() const = 0;

    WeakPtr<HTMLFormElement, WeakPtrImplWithEventTargetData> m_form;
    WeakPtr<HTMLFormElement, WeakPtrImplWithEventTargetData> m_formSetByParser;
};

inline void FormAssociatedElement::setForm(RefPtr<HTMLFormElement>&& newForm)
{
    if (m_form.get() != newForm)
        setFormInternal(WTFMove(newForm));
}

} // namespace WebCore
