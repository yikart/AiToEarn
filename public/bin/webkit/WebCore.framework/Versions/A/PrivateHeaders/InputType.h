/*
 * Copyright (C) 2010-2021 Google Inc. All rights reserved.
 * Copyright (C) 2011-2021 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include "HTMLInputElement.h"
#include "HTMLTextFormControlElement.h"
#include "RenderPtr.h"
#include <wtf/Forward.h>
#include <wtf/OptionSet.h>
#include <wtf/RefCounted.h>
#include <wtf/RefPtr.h>
#include <wtf/TZoneMalloc.h>

namespace WebCore {

class BeforeTextInsertedEvent;
class Chrome;
class DOMFormData;
class DateComponents;
class DragData;
class Event;
class FileList;
class HTMLElement;
class HTMLFormElement;
class Icon;
class KeyboardEvent;
class MouseEvent;
class Node;
class RenderStyle;
class StepRange;
class TextControlInnerTextElement;
class TouchEvent;

struct InputElementClickState;

enum class AnyStepHandling : bool;
enum class DateComponentsType : uint8_t;

// An InputType object represents the type-specific part of an HTMLInputElement.
// Do not expose instances of InputType and classes derived from it to classes
// other than HTMLInputElement.
class InputType : public RefCounted<InputType> {
    WTF_MAKE_TZONE_ALLOCATED(InputType);
public:
    enum class Type : uint32_t {
        Button          = 1 << 0,
        Checkbox        = 1 << 1,
        Color           = 1 << 2,
        Date            = 1 << 3,
        DateTimeLocal   = 1 << 4,
        Email           = 1 << 5,
        File            = 1 << 6,
        Hidden          = 1 << 7,
        Image           = 1 << 8,
        Month           = 1 << 9,
        Number          = 1 << 10,
        Password        = 1 << 11,
        Radio           = 1 << 12,
        Range           = 1 << 13,
        Reset           = 1 << 14,
        Search          = 1 << 15,
        Submit          = 1 << 16,
        Telephone       = 1 << 17,
        Time            = 1 << 18,
        URL             = 1 << 19,
        Week            = 1 << 20,
        Text            = 1 << 21,
    };
    
    static constexpr OptionSet<Type> textTypes = {
        Type::Email,
        Type::Password,
        Type::Search,
        Type::Telephone,
        Type::Text,
        Type::URL,
    };

    static constexpr OptionSet<Type> textFieldTypes = {
        Type::Email,
        Type::Number,
        Type::Password,
        Type::Search,
        Type::Telephone,
        Type::Text,
        Type::URL,
    };

    static constexpr OptionSet<Type> textButtonTypes = {
        Type::Button,
        Type::Reset,
        Type::Submit,
    };

    static constexpr OptionSet<Type> checkableTypes = {
        Type::Checkbox,
        Type::Radio,
    };

    static constexpr OptionSet<Type> steppableTypes = {
        Type::Date,
        Type::DateTimeLocal,
        Type::Month,
        Type::Time,
        Type::Week,
        Type::Number,
        Type::Range,
    };

    static constexpr OptionSet<Type> nonValidatingTypes = {
        Type::Button,
        Type::Hidden,
        Type::Image,
        Type::Reset,
    };

    static constexpr OptionSet<Type> nonShadowRootTypes = {
        Type::Button,
        Type::Checkbox,
        Type::Hidden,
        Type::Image,
        Type::Radio,
        Type::Reset,
        Type::Submit,
    };

    static RefPtr<InputType> createIfDifferent(HTMLInputElement&, const AtomString&, InputType* currentInputType = nullptr);

    virtual ~InputType();

    void detachFromElement() { m_element = nullptr; }

    static bool themeSupportsDataListUI(InputType*);

    virtual const AtomString& formControlType() const = 0;

    bool isValidValue(const String&) const;

    // Type query functions.

    // Any time we are using one of these functions it's best to refactor
    // to add a virtual function to allow the input type object to do the
    // work instead, or at least make a query function that asks a higher
    // level question. These functions make the HTMLInputElement class
    // inflexible because it's harder to add new input types if there is
    // scattered code with special cases for various types.

    bool isCheckbox() const { return m_type == Type::Checkbox; }
    bool isSwitch() const { return isCheckbox() && m_element && m_element->hasSwitchAttribute(); }
    bool isColorControl() const { return m_type == Type::Color; }
    bool isDateField() const { return m_type == Type::Date; }
    bool isDateTimeLocalField() const { return m_type == Type::DateTimeLocal; }
    bool isEmailField() const { return m_type == Type::Email; }
    bool isFileUpload() const { return m_type == Type::File; }
    bool isHiddenType() const { return m_type == Type::Hidden; }
    bool isImageButton() const { return m_type == Type::Image; }
    bool isMonthField() const { return m_type == Type::Month; }
    bool isNumberField() const { return m_type == Type::Number; }
    bool isPasswordField() const { return m_type == Type::Password; }
    bool isRadioButton() const { return m_type == Type::Radio; }
    bool isRangeControl() const { return m_type == Type::Range; }
    bool isSearchField() const { return m_type == Type::Search; }
    bool isSubmitButton() const { return m_type == Type::Submit || m_type == Type::Image; }
    bool isTelephoneField() const { return m_type == Type::Telephone; }
    bool isTimeField() const { return m_type == Type::Time; }
    bool isURLField() const { return m_type == Type::URL; }
    bool isWeekField() const { return m_type == Type::Week; }

    bool isTextButton() const { return textButtonTypes.contains(m_type); }
    bool isTextField() const { return textFieldTypes.contains(m_type); }
    bool isTextType() const { return textTypes.contains(m_type); }

    bool isCheckable() const { return checkableTypes.contains(m_type); }
    bool isSteppable() const { return steppableTypes.contains(m_type); }
    bool supportsValidation() const { return !nonValidatingTypes.contains(m_type); }

    Type type() const { return m_type; }

    bool isInteractiveContent() const;
    bool isLabelable() const;
    bool isEnumeratable() const;
    bool needsShadowSubtree() const { return !nonShadowRootTypes.contains(m_type) || isSwitch(); }
    bool hasCreatedShadowSubtree() const { return m_hasCreatedShadowSubtree; }

#if ENABLE(TOUCH_EVENTS)
    bool hasTouchEventHandler() const;
#endif

    // Form value functions.

    virtual bool shouldSaveAndRestoreFormControlState() const;
    virtual FormControlState saveFormControlState() const;
    virtual void restoreFormControlState(const FormControlState&);
    virtual bool isFormDataAppendable() const;
    virtual bool appendFormData(DOMFormData&) const;

    // DOM property functions.

    virtual String fallbackValue() const; // Checked last, if both internal storage and value attribute are missing.
    virtual String defaultValue() const; // Checked after even fallbackValue, only when the valueWithDefault function is called.
    virtual WallTime valueAsDate() const;
    virtual ExceptionOr<void> setValueAsDate(WallTime) const;
    virtual WallTime accessibilityValueAsDate() const;
    virtual double valueAsDouble() const;
    virtual ExceptionOr<void> setValueAsDouble(double, TextFieldEventBehavior) const;
    virtual ExceptionOr<void> setValueAsDecimal(const Decimal&, TextFieldEventBehavior) const;

    // Validation functions.

    virtual String validationMessage() const;
    virtual bool typeMismatchFor(const String&) const { return false; }
    virtual bool supportsRequired() const;
    virtual bool valueMissing(const String&) const { return false; }
    virtual bool hasBadInput() const { return false; }
    virtual bool patternMismatch(const String&) const { return false; }
    bool rangeUnderflow(const String&) const;
    bool rangeOverflow(const String&) const;
    bool isInRange(const String&) const;
    bool isOutOfRange(const String&) const;
    virtual Decimal defaultValueForStepUp() const;
    double minimum() const;
    double maximum() const;
    virtual bool sizeShouldIncludeDecoration(int defaultSize, int& preferredSize) const;
    virtual float decorationWidth() const;
    bool stepMismatch(const String&) const;
    virtual bool getAllowedValueStep(Decimal*) const;
    virtual StepRange createStepRange(AnyStepHandling) const;
    virtual ExceptionOr<void> stepUp(int);
    virtual void stepUpFromRenderer(int);
    virtual String badInputText() const;
    virtual String typeMismatchText() const;
    virtual String valueMissingText() const;
    virtual bool canSetStringValue() const;
    virtual String localizeValue(const String&) const;
    virtual String visibleValue() const;
    virtual bool isEmptyValue() const;

    // Type check for the current input value. We do nothing for some types
    // though typeMismatchFor() does something for them because of value sanitization.
    virtual bool typeMismatch() const { return false; }

    // Return value of null string means "use the default value".
    // This function must be called only by HTMLInputElement::sanitizeValue().
    virtual String sanitizeValue(const String&) const;

    // Event handlers.

    virtual void handleClickEvent(MouseEvent&) { }
    virtual void handleMouseDownEvent(MouseEvent&) { }
    virtual void handleMouseMoveEvent(MouseEvent&) { }
    virtual void willDispatchClick(InputElementClickState&) { }
    virtual void didDispatchClick(Event&, const InputElementClickState&) { }
    virtual void handleDOMActivateEvent(Event&) { }

    virtual bool allowsShowPickerAcrossFrames();
    virtual void showPicker();

    enum ShouldCallBaseEventHandler : bool { No, Yes };
    virtual ShouldCallBaseEventHandler handleKeydownEvent(KeyboardEvent&);

    virtual void handleKeypressEvent(KeyboardEvent&);
    virtual void handleKeyupEvent(KeyboardEvent&);
    virtual void handleBeforeTextInsertedEvent(BeforeTextInsertedEvent&);
    virtual void forwardEvent(Event&);

#if ENABLE(TOUCH_EVENTS)
    virtual void handleTouchEvent(TouchEvent&) { }
#endif

    // Helpers for event handlers.

    virtual bool shouldSubmitImplicitly(Event&);
    virtual bool hasCustomFocusLogic() const;
    virtual bool isKeyboardFocusable(KeyboardEvent*) const;
    virtual bool isMouseFocusable() const;
    virtual bool shouldUseInputMethod() const;
    virtual void handleFocusEvent(Node* oldFocusedNode, FocusDirection);
    virtual void handleBlurEvent();
    virtual bool accessKeyAction(bool sendMouseEvents);
    virtual bool canBeSuccessfulSubmitButton();
    virtual void subtreeHasChanged();
    virtual void blur();

    virtual void elementDidBlur() { }

    // Shadow tree handling.

    void createShadowSubtreeIfNeeded();
    virtual void createShadowSubtree();
    virtual void removeShadowSubtree();

    virtual HTMLElement* containerElement() const { return nullptr; }
    virtual HTMLElement* innerBlockElement() const { return nullptr; }
    virtual RefPtr<TextControlInnerTextElement> innerTextElement() const;
    virtual HTMLElement* innerSpinButtonElement() const { return nullptr; }
    virtual HTMLElement* autoFillButtonElement() const { return nullptr; }
    virtual HTMLElement* resultsButtonElement() const { return nullptr; }
    virtual HTMLElement* cancelButtonElement() const { return nullptr; }
    virtual HTMLElement* sliderThumbElement() const { return nullptr; }
    virtual HTMLElement* sliderTrackElement() const { return nullptr; }
    virtual HTMLElement* placeholderElement() const;
#if ENABLE(DATALIST_ELEMENT)
    virtual HTMLElement* dataListButtonElement() const { return nullptr; }
#endif
    RefPtr<TextControlInnerTextElement> innerTextElementCreatingShadowSubtreeIfNeeded();

    // Miscellaneous functions.

    virtual bool rendererIsNeeded();
    virtual RenderPtr<RenderElement> createInputRenderer(RenderStyle&&);
    virtual void addSearchResult();
    virtual void attach();
    virtual void detach();
    virtual bool shouldRespectAlignAttribute();
    virtual Icon* icon() const;
    virtual bool shouldSendChangeEventAfterCheckedChanged();
    virtual bool storesValueSeparateFromAttribute();
    virtual void setValue(const String&, bool valueChanged, TextFieldEventBehavior, TextControlSetValueSelection);
    virtual bool shouldResetOnDocumentActivation();
    virtual bool shouldRespectListAttribute();
    virtual bool shouldRespectHeightAndWidthAttributes();
    virtual bool supportsPlaceholder() const;
    virtual bool supportsReadOnly() const;
    virtual void updateInnerTextValue();
    virtual void updatePlaceholderText();
    virtual void attributeChanged(const QualifiedName&) { }
    virtual void disabledStateChanged() { }
    virtual void readOnlyStateChanged() { }
    virtual void requiredStateChanged() { }
    virtual void capsLockStateMayHaveChanged();
    virtual void updateAutoFillButton();
    virtual String defaultToolTip() const;
    virtual bool matchesIndeterminatePseudoClass() const;
    virtual bool isPresentingAttachedView() const;
    virtual bool supportsSelectionAPI() const;
    virtual bool dirAutoUsesValue() const;
#if ENABLE(DATALIST_ELEMENT)
    virtual bool isFocusingWithDataListDropdown() const { return false; };
#endif
    virtual void willUpdateCheckedness(bool /*nowChecked*/, WasSetByJavaScript) { }

    // Parses the specified string for the type, and return
    // the Decimal value for the parsing result if the parsing
    // succeeds; Returns defaultValue otherwise. This function can
    // return NaN or Infinity only if defaultValue is NaN or Infinity.
    virtual Decimal parseToNumber(const String&, const Decimal& defaultValue) const;

    // Create a string representation of the specified Decimal value for the
    // input type. If NaN or Infinity is specified, this returns an empty
    // string. This should not be called for types without valueAsNumber.
    virtual String serialize(const Decimal&) const;

    // Gets width and height of the input element if the type of the
    // element is image. It returns 0 if the element is not image type.
    virtual unsigned height() const;
    virtual unsigned width() const;

    bool isInvalid(const String&) const;

    void dispatchSimulatedClickIfActive(KeyboardEvent&) const;

#if ENABLE(DATALIST_ELEMENT)
    virtual void dataListMayHaveChanged();
    virtual std::optional<Decimal> findClosestTickMarkValue(const Decimal&);
#endif

#if ENABLE(DRAG_SUPPORT)
    virtual bool receiveDroppedFiles(const DragData&);
#endif

    virtual DateComponentsType dateType() const;

    virtual String displayString() const;

    virtual String resultForDialogSubmit() const;

protected:
    InputType(Type type, HTMLInputElement& element)
        : m_type(type)
        , m_element(element)
    {
    }

    HTMLInputElement* element() const { return m_element.get(); }
    RefPtr<HTMLInputElement> protectedElement() const { return m_element.get(); }
    Chrome* chrome() const;
    Decimal parseToNumberOrNaN(const String&) const;

    // Derive the step base, following the HTML algorithm steps.
    Decimal findStepBase(const Decimal&) const;

private:
    // Helper for stepUp()/stepDown(). Adds step value * count to the current value.
    ExceptionOr<void> applyStep(int count, AnyStepHandling, TextFieldEventBehavior);

    const Type m_type;
    bool m_hasCreatedShadowSubtree { false };
    // m_element is null if this InputType is no longer associated with an element (either the element died or changed input type).
    WeakPtr<HTMLInputElement, WeakPtrImplWithEventTargetData> m_element;
};

} // namespace WebCore

#define SPECIALIZE_TYPE_TRAITS_INPUT_TYPE(ToValueTypeName, TypeEnumValue) \
SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::ToValueTypeName) \
static bool isType(const WebCore::InputType& input) { return input.type() == WebCore::InputType::TypeEnumValue; } \
SPECIALIZE_TYPE_TRAITS_END()
