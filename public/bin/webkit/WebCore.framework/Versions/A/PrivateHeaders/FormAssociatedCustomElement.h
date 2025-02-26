/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "CustomElementFormValue.h"
#include "HTMLMaybeFormAssociatedCustomElement.h"
#include "ValidatedFormListedElement.h"
#include "ValidityStateFlags.h"
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class FormAssociatedCustomElement final : public ValidatedFormListedElement {
    WTF_MAKE_TZONE_ALLOCATED(FormAssociatedCustomElement);
    WTF_MAKE_NONCOPYABLE(FormAssociatedCustomElement);
public:
    static Ref<FormAssociatedCustomElement> create(HTMLMaybeFormAssociatedCustomElement&);

    FormAssociatedCustomElement(HTMLMaybeFormAssociatedCustomElement&);
    virtual ~FormAssociatedCustomElement();

    bool isFormListedElement() const final { return true; }
    bool isValidatedFormListedElement() const final { return true; }

    FormAssociatedElement* asFormAssociatedElement() final { return this; }
    FormListedElement* asFormListedElement() final { return this; }
    ValidatedFormListedElement* asValidatedFormListedElement() final { return this; }

    HTMLElement& asHTMLElement() final { return *m_element.get(); }
    const HTMLElement& asHTMLElement() const final { return *m_element.get(); }

    void reset() final;
    bool isEnumeratable() const final;

    void setFormValue(CustomElementFormValue&& submissionValue, std::optional<CustomElementFormValue>&& state);
    ExceptionOr<void> setValidity(ValidityStateFlags, String&& message, HTMLElement* validationAnchor);
    String validationMessage() const final;

    void finishParsingChildren();

    bool computeValidity() const final;
    bool appendFormData(DOMFormData&) final;

    void willUpgrade();
    void didUpgrade();

    const AtomString& formControlType() const final;
    bool shouldSaveAndRestoreFormControlState() const final;
    FormControlState saveFormControlState() const final;
    void restoreFormControlState(const FormControlState&) final;

protected:
    void disabledStateChanged() final;
    bool readOnlyBarsFromConstraintValidation() const final { return true; }

private:
    void refFormAssociatedElement() const final { m_element->ref(); }
    void derefFormAssociatedElement() const final { m_element->deref(); }

    HTMLElement* validationAnchorElement() final;
    void didChangeForm() final;
    void invalidateElementsCollectionCachesInAncestors();

    bool hasBadInput() const final { return m_validityStateFlags.badInput; }
    bool patternMismatch() const final { return m_validityStateFlags.patternMismatch; }
    bool rangeOverflow() const final { return m_validityStateFlags.rangeOverflow; }
    bool rangeUnderflow() const final { return m_validityStateFlags.rangeUnderflow; }
    bool stepMismatch() const final { return m_validityStateFlags.stepMismatch; }
    bool tooShort() const final { return m_validityStateFlags.tooShort; }
    bool tooLong() const final { return m_validityStateFlags.tooLong; }
    bool typeMismatch() const final { return m_validityStateFlags.typeMismatch; }
    bool valueMissing() const final { return m_validityStateFlags.valueMissing; }

    WeakPtr<HTMLMaybeFormAssociatedCustomElement, WeakPtrImplWithEventTargetData> m_element;
    ValidityStateFlags m_validityStateFlags;
    WeakPtr<HTMLElement, WeakPtrImplWithEventTargetData> m_validationAnchor { nullptr };
    CustomElementFormValue m_submissionValue { nullptr };
    CustomElementFormValue m_state { nullptr };
};

} // namespace WebCore
