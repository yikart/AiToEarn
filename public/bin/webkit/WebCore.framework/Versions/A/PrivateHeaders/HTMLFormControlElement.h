/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2023 Apple Inc. All rights reserved.
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

#include "Autofill.h"
#include "HTMLElement.h"
#include "ValidatedFormListedElement.h"

#if ENABLE(AUTOCAPITALIZE)
#include "Autocapitalize.h"
#endif

namespace WebCore {

class HTMLFormControlElement : public HTMLElement, public ValidatedFormListedElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLFormControlElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLFormControlElement);
public:
    virtual ~HTMLFormControlElement();

    bool isValidatedFormListedElement() const final { return true; }
    bool isFormListedElement() const final { return true; }

    bool matchesValidPseudoClass() const override { return ValidatedFormListedElement::matchesValidPseudoClass(); }
    bool matchesInvalidPseudoClass() const override { return ValidatedFormListedElement::matchesInvalidPseudoClass(); }
    bool matchesUserValidPseudoClass() const override { return ValidatedFormListedElement::matchesUserValidPseudoClass(); }
    bool matchesUserInvalidPseudoClass() const override { return ValidatedFormListedElement::matchesUserInvalidPseudoClass(); }

    bool isDisabledFormControl() const override { return isDisabled(); }
    bool supportsFocus() const override { return !isDisabled(); }

    WEBCORE_EXPORT String formEnctype() const;
    WEBCORE_EXPORT void setFormEnctype(const AtomString&);
    WEBCORE_EXPORT String formMethod() const;
    WEBCORE_EXPORT void setFormMethod(const AtomString&);
    bool formNoValidate() const;
    WEBCORE_EXPORT String formAction() const;
    WEBCORE_EXPORT void setFormAction(const AtomString&);

    bool formControlValueMatchesRenderer() const { return m_valueMatchesRenderer; }
    void setFormControlValueMatchesRenderer(bool b) { m_valueMatchesRenderer = b; }

    bool wasChangedSinceLastFormControlChangeEvent() const { return m_wasChangedSinceLastFormControlChangeEvent; }
    void setChangedSinceLastFormControlChangeEvent(bool);

    virtual void dispatchFormControlChangeEvent();
    void dispatchChangeEvent();
    void dispatchCancelEvent();
    void dispatchFormControlInputEvent();

    bool isRequired() const { return m_isRequired; }

    const AtomString& type() const { return formControlType(); }

    virtual bool canTriggerImplicitSubmission() const { return false; }

    virtual bool isSuccessfulSubmitButton() const { return false; }
    virtual bool isActivatedSubmit() const { return false; }
    virtual void setActivatedSubmit(bool) { }
    void finishParsingChildren() override;

#if ENABLE(AUTOCORRECT)
    WEBCORE_EXPORT bool shouldAutocorrect() const final;
#endif

#if ENABLE(AUTOCAPITALIZE)
    WEBCORE_EXPORT AutocapitalizeType autocapitalizeType() const final;
#endif

    WEBCORE_EXPORT String autocomplete() const;
    WEBCORE_EXPORT void setAutocomplete(const AtomString&);

    AutofillMantle autofillMantle() const;

    WEBCORE_EXPORT AutofillData autofillData() const;

    virtual bool isSubmitButton() const { return false; }

    virtual String resultForDialogSubmit() const;

    RefPtr<HTMLElement> popoverTargetElement() const;
    const AtomString& popoverTargetAction() const;
    void setPopoverTargetAction(const AtomString& value);

    RefPtr<Element> commandForElement() const;

    bool isKeyboardFocusable(KeyboardEvent*) const override;

    using Node::ref;
    using Node::deref;

protected:
    HTMLFormControlElement(const QualifiedName& tagName, Document&, HTMLFormElement*);

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void didFinishInsertingNode() override;
    void didAttachRenderers() override;
    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) override;
    void removedFromAncestor(RemovalType, ContainerNode&) override;
    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) override;

    void disabledStateChanged() override;
    void readOnlyStateChanged() override;
    virtual void requiredStateChanged();

    bool isMouseFocusable() const override;

    void didRecalcStyle(Style::Change) override;

    void dispatchBlurEvent(RefPtr<Element>&& newFocusedElement) override;

    void handlePopoverTargetAction(const EventTarget*) const;

    CommandType commandType() const;
    void handleCommand();

private:
    void refFormAssociatedElement() const final { ref(); }
    void derefFormAssociatedElement() const final { deref(); }

    void runFocusingStepsForAutofocus() final;
    HTMLElement* validationAnchorElement() final { return this; }

    // These functions can be called concurrently for ValidityState.
    HTMLElement& asHTMLElement() final { return *this; }
    const HTMLFormControlElement& asHTMLElement() const final { return *this; }

    FormAssociatedElement* asFormAssociatedElement() final { return this; }
    FormListedElement* asFormListedElement() final { return this; }
    ValidatedFormListedElement* asValidatedFormListedElement() final { return this; }

    unsigned m_isRequired : 1;
    unsigned m_valueMatchesRenderer : 1;
    unsigned m_wasChangedSinceLastFormControlChangeEvent : 1;
};

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLFormControlElement)
    static bool isType(const WebCore::Element& element) { return element.isFormControlElement(); }
    static bool isType(const WebCore::Node& node) { return node.isFormControlElement(); }
    static bool isType(const WebCore::FormListedElement& listedElement) { return listedElement.asHTMLElement().isFormControlElement(); }
SPECIALIZE_TYPE_TRAITS_END()
