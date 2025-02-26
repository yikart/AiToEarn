/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2024 Apple Inc. All rights reserved.
 * Copyright (C) 2012 Samsung Electronics. All rights reserved.
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

#include "HTMLTextFormControlElement.h"
#include <memory>

namespace WebCore {

class Decimal;
class DragData;
class FileList;
class HTMLDataListElement;
class HTMLImageLoader;
class HTMLOptionElement;
class Icon;
class InputType;
class ListAttributeTargetObserver;
class RadioButtonGroups;
class StepRange;

struct FileChooserFileInfo;

enum class AnyStepHandling : bool;
enum class DateComponentsType : uint8_t;
enum class MediaCaptureType : uint8_t;
enum class SelectionRestorationMode : uint8_t;

struct InputElementClickState {
    bool stateful { false };
    bool checked { false };
    bool indeterminate { false };
    bool trusted { false };
    RefPtr<HTMLInputElement> checkedRadioButton;
};

enum class WasSetByJavaScript : bool { No, Yes };

class HTMLInputElement final : public HTMLTextFormControlElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLInputElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLInputElement);
public:
    static Ref<HTMLInputElement> create(const QualifiedName&, Document&, HTMLFormElement*, bool createdByParser);
    virtual ~HTMLInputElement();

#if ENABLE(INPUT_TYPE_COLOR)
    WEBCORE_EXPORT bool alpha();
#endif
    bool checked() const { return m_isChecked; }
    WEBCORE_EXPORT void setChecked(bool, WasSetByJavaScript = WasSetByJavaScript::Yes);
#if ENABLE(INPUT_TYPE_COLOR)
    String colorSpace();
    void setColorSpace(const AtomString&);
#endif
    WEBCORE_EXPORT FileList* files();
    WEBCORE_EXPORT void setFiles(RefPtr<FileList>&&, WasSetByJavaScript = WasSetByJavaScript::No);
    FileList* filesForBindings() { return files(); }
    void setFilesForBindings(RefPtr<FileList>&& fileList) { return setFiles(WTFMove(fileList), WasSetByJavaScript::Yes); }
    WEBCORE_EXPORT unsigned height() const;
    WEBCORE_EXPORT void setHeight(unsigned);
    bool indeterminate() const { return m_isIndeterminate; }
    WEBCORE_EXPORT void setIndeterminate(bool);
#if ENABLE(DATALIST_ELEMENT)
    WEBCORE_EXPORT RefPtr<HTMLElement> list() const;
#endif
    unsigned size() const { return m_size; }
    WEBCORE_EXPORT ExceptionOr<void> setSize(unsigned);
    WEBCORE_EXPORT const AtomString& defaultValue() const;
    WEBCORE_EXPORT void setDefaultValue(const AtomString&);
    WEBCORE_EXPORT void setType(const AtomString&);
    WEBCORE_EXPORT String value() const final;
    WEBCORE_EXPORT ExceptionOr<void> setValue(const String&, TextFieldEventBehavior = DispatchNoEvent, TextControlSetValueSelection = TextControlSetValueSelection::SetSelectionToEnd) final;
    void setValueForUser(const String& value) { setValue(value, DispatchInputAndChangeEvent); }
    WEBCORE_EXPORT WallTime valueAsDate() const;
    WEBCORE_EXPORT ExceptionOr<void> setValueAsDate(WallTime);
    WallTime accessibilityValueAsDate() const;
    WEBCORE_EXPORT double valueAsNumber() const;
    WEBCORE_EXPORT ExceptionOr<void> setValueAsNumber(double, TextFieldEventBehavior = DispatchNoEvent);
    WEBCORE_EXPORT ExceptionOr<void> stepUp(int = 1);
    WEBCORE_EXPORT ExceptionOr<void> stepDown(int = 1);
    WEBCORE_EXPORT unsigned width() const;
    WEBCORE_EXPORT void setWidth(unsigned);
    bool hasSwitchAttribute() const { return m_hasSwitchAttribute; }
    WEBCORE_EXPORT String validationMessage() const final;
    std::optional<unsigned> selectionStartForBindings() const;
    ExceptionOr<void> setSelectionStartForBindings(std::optional<unsigned>);
    std::optional<unsigned> selectionEndForBindings() const;
    ExceptionOr<void> setSelectionEndForBindings(std::optional<unsigned>);
    ExceptionOr<String> selectionDirectionForBindings() const;
    ExceptionOr<void> setSelectionDirectionForBindings(const String&);
    using HTMLTextFormControlElement::setRangeText;
    WEBCORE_EXPORT ExceptionOr<void> setRangeText(StringView, unsigned start, unsigned end, const String& selectionMode) final;
    ExceptionOr<void> setSelectionRangeForBindings(unsigned start, unsigned end, const String& direction);
    ExceptionOr<void> showPicker();

    WEBCORE_EXPORT bool shouldAutocomplete() const final;

    // For ValidityState
    bool hasBadInput() const final;
    bool patternMismatch() const final;
    bool rangeUnderflow() const final;
    bool rangeOverflow() const final;
    bool stepMismatch() const final;
    bool tooShort() const final;
    bool tooLong() const final;
    bool typeMismatch() const final;
    bool valueMissing() const final;
    bool computeValidity() const final;

    // Returns the minimum value for type=date, number, or range.  Don't call this for other types.
    double minimum() const;
    // Returns the maximum value for type=date, number, or range.  Don't call this for other types.
    // This always returns a value which is >= minimum().
    double maximum() const;
    // Sets the "allowed value step" defined in the HTML spec to the specified double pointer.
    // Returns false if there is no "allowed value step."
    bool getAllowedValueStep(Decimal*) const;
    StepRange createStepRange(AnyStepHandling) const;

#if ENABLE(DATALIST_ELEMENT)
    std::optional<Decimal> findClosestTickMarkValue(const Decimal&);
    std::optional<double> listOptionValueAsDouble(const HTMLOptionElement&);
#endif

    bool isPresentingAttachedView() const;

    bool isSteppable() const; // stepUp()/stepDown() for user-interaction.
    WEBCORE_EXPORT bool isTextButton() const;
    bool isRadioButton() const;
    WEBCORE_EXPORT bool isTextField() const final;
    WEBCORE_EXPORT bool isSearchField() const;
    bool isInputTypeHidden() const;
    WEBCORE_EXPORT bool isPasswordField() const;
    bool isSecureField() const { return isPasswordField() || autofilledAndObscured(); }
    bool isCheckbox() const;
    bool isSwitch() const;
    bool isRangeControl() const;
#if ENABLE(INPUT_TYPE_COLOR)
    WEBCORE_EXPORT bool isColorControl() const;
#endif
    // FIXME: It's highly likely that any call site calling this function should instead
    // be using a different one. Many input elements behave like text fields, and in addition
    // any unknown input type is treated as text. Consider, for example, isTextField or
    // isTextField && !isPasswordField.
    WEBCORE_EXPORT bool isText() const;
    bool isTextType() const;
    bool supportsWritingSuggestions() const;
    WEBCORE_EXPORT bool isEmailField() const;
    WEBCORE_EXPORT bool isFileUpload() const;
    bool isImageButton() const;
    WEBCORE_EXPORT bool isNumberField() const;
    WEBCORE_EXPORT bool isSubmitButton() const final;
    WEBCORE_EXPORT bool isTelephoneField() const;
    WEBCORE_EXPORT bool isURLField() const;
    WEBCORE_EXPORT bool isDateField() const;
    WEBCORE_EXPORT bool isDateTimeLocalField() const;
    WEBCORE_EXPORT bool isMonthField() const;
    WEBCORE_EXPORT bool isTimeField() const;
    WEBCORE_EXPORT bool isWeekField() const;

    bool isDevolvableWidget() const override;

    DateComponentsType dateType() const;

    HTMLElement* containerElement() const;

    RefPtr<TextControlInnerTextElement> innerTextElement() const final;
    RefPtr<TextControlInnerTextElement> innerTextElementCreatingShadowSubtreeIfNeeded() final;
    RenderStyle createInnerTextStyle(const RenderStyle&) final;

    HTMLElement* innerBlockElement() const;
    HTMLElement* innerSpinButtonElement() const;
    HTMLElement* resultsButtonElement() const;
    HTMLElement* cancelButtonElement() const;
    HTMLElement* sliderThumbElement() const;
    HTMLElement* sliderTrackElement() const;
    HTMLElement* placeholderElement() const final;
    WEBCORE_EXPORT HTMLElement* autoFillButtonElement() const;
#if ENABLE(DATALIST_ELEMENT)
    WEBCORE_EXPORT HTMLElement* dataListButtonElement() const;
#endif

    bool matchesCheckedPseudoClass() const;
    bool matchesIndeterminatePseudoClass() const final;
    void setDefaultCheckedState(bool);

    bool sizeShouldIncludeDecoration(int& preferredSize) const;
    float decorationWidth() const;

    // Checks if the specified string would be a valid value.
    // We should not call this for types with no string value such as CHECKBOX and RADIO.
    bool isValidValue(const String&) const;
    bool hasDirtyValue() const { return !m_valueIfDirty.isNull(); }

    String placeholder() const;

    String sanitizeValue(const String&) const;

    String localizeValue(const String&) const;

    // The value which is drawn by a renderer.
    WEBCORE_EXPORT String visibleValue() const;

    String valueWithDefault() const;

    // This function dispatches 'input' event for non-textfield types. Callers
    // need to handle any DOM structure changes by event handlers, or need to
    // delay the 'input' event with EventQueueScope.
    void setValueFromRenderer(const String&);

    bool rendererIsNeeded(const RenderStyle&) final;
    RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&) final;
    bool isReplaced(const RenderStyle&) const final;
    void willAttachRenderers() final;
    void didAttachRenderers() final;
    void didDetachRenderers() final;

    bool isActivatedSubmit() const final;
    void setActivatedSubmit(bool flag) final;

    String altText() const;

    void willDispatchEvent(Event&, InputElementClickState&);
    void didDispatchClickEvent(Event&, const InputElementClickState&);

    void didBlur();

    int maxResults() const { return m_maxResults; }

    Vector<String> acceptMIMETypes() const;
    Vector<String> acceptFileExtensions() const;
    WEBCORE_EXPORT String alt() const;

    URL src() const;

    unsigned effectiveMaxLength() const;

    WEBCORE_EXPORT bool multiple() const;

    // AutoFill.
    using AutofillButtonType = WebCore::AutoFillButtonType;
    bool autofilled() const { return m_isAutoFilled; }
    WEBCORE_EXPORT void setAutofilled(bool = true);
    bool autofilledAndViewable() const { return m_isAutoFilledAndViewable; }
    WEBCORE_EXPORT void setAutofilledAndViewable(bool = true);
    bool autofilledAndObscured() const { return m_isAutoFilledAndObscured; }
    WEBCORE_EXPORT void setAutofilledAndObscured(bool = true);
    AutoFillButtonType lastAutofillButtonType() const { return static_cast<AutoFillButtonType>(m_lastAutoFillButtonType); }
    AutoFillButtonType autofillButtonType() const { return static_cast<AutoFillButtonType>(m_autoFillButtonType); }
    WEBCORE_EXPORT void setAutofillButtonType(AutoFillButtonType);
    bool hasAutofillStrongPasswordButton() const  { return autofillButtonType() == AutoFillButtonType::StrongPassword; }
    bool autofillAvailable() const { return m_isAutoFillAvailable; }
    void setAutofillAvailable(bool autoFillAvailable) { m_isAutoFillAvailable = autoFillAvailable; }
    enum class AutofillVisibility : uint8_t {
        Normal,
        Visible,
        Hidden,
    };
    AutofillVisibility autofillVisibility() const;
    void setAutofillVisibility(AutofillVisibility);
    bool autofillSpellcheck() const { return !m_isSpellcheckDisabledExceptTextReplacement; }
    void setAutofillSpellcheck(bool value) { m_isSpellcheckDisabledExceptTextReplacement = !value; }

#if ENABLE(DRAG_SUPPORT)
    // Returns true if the given DragData has more than one dropped file.
    bool receiveDroppedFiles(const DragData&);
#endif

    Icon* icon() const;
    String displayString() const;

    // These functions are used for rendering the input active during a drag-and-drop operation.
    bool canReceiveDroppedFiles() const { return m_canReceiveDroppedFiles; }
    void setCanReceiveDroppedFiles(bool);

    void addSearchResult();

    bool willRespondToMouseClickEventsWithEditability(Editability) const final;

#if ENABLE(DATALIST_ELEMENT)
    WEBCORE_EXPORT bool isFocusingWithDataListDropdown() const;
    RefPtr<HTMLDataListElement> dataList() const;
    void dataListMayHaveChanged();
#endif

    Vector<Ref<HTMLInputElement>> radioButtonGroup() const;
    RefPtr<HTMLInputElement> checkedRadioButtonForGroup() const;
    // Returns null if this isn't associated with any radio button group.
    RadioButtonGroups* radioButtonGroups() const;
    // Functions for InputType classes.
    void setValueInternal(const String&, TextFieldEventBehavior);
    bool isTextFormControlFocusable() const;
    bool isTextFormControlKeyboardFocusable(KeyboardEvent*) const;
    bool isTextFormControlMouseFocusable() const;
    bool valueAttributeWasUpdatedAfterParsing() const { return m_valueAttributeWasUpdatedAfterParsing; }

    void cacheSelectionInResponseToSetValue(int caretOffset) { cacheSelection(caretOffset, caretOffset, SelectionHasNoDirection); }

    WEBCORE_EXPORT Color valueAsColor() const; // Returns transparent color if not type=color.
    WEBCORE_EXPORT void selectColor(StringView); // Does nothing if not type=color. Simulates user selection of color; intended for testing.
    WEBCORE_EXPORT Vector<Color> suggestedColors() const;

    String defaultToolTip() const;

#if ENABLE(MEDIA_CAPTURE)
    MediaCaptureType mediaCaptureType() const;
#endif

    // FIXME: According to HTML4, the length attribute's value can be arbitrarily
    // large. However, due to https://bugs.webkit.org/show_bug.cgi?id=14536 things
    // get rather sluggish when a text field has a larger number of characters than
    // this, even when just clicking in the text field.
    static constexpr unsigned maxEffectiveLength = 524288;

    void blur() final;
    void defaultBlur();

    const AtomString& name() const final;

    void endEditing();

    void setSpellcheckDisabledExceptTextReplacement(bool disabled) { m_isSpellcheckDisabledExceptTextReplacement = disabled; }
    bool isSpellcheckDisabledExceptTextReplacement() const { return m_isSpellcheckDisabledExceptTextReplacement; }

    static Vector<FileChooserFileInfo> filesFromFileInputFormControlState(const FormControlState&);

    bool matchesReadWritePseudoClass() const final;

    HTMLImageLoader* imageLoader() { return m_imageLoader.get(); }
    HTMLImageLoader& ensureImageLoader();

    void capsLockStateMayHaveChanged();

    bool shouldTruncateText(const RenderStyle&) const;

    String resultForDialogSubmit() const final;

    bool isInnerTextElementEditable() const final { return !hasAutofillStrongPasswordButton() && HTMLTextFormControlElement::isInnerTextElementEditable(); }
    void finishParsingChildren() final;

    bool hasEverBeenPasswordField() const { return m_hasEverBeenPasswordField; }

    float switchAnimationVisuallyOnProgress() const;
    bool isSwitchVisuallyOn() const;
    float switchAnimationHeldProgress() const;
    bool isSwitchHeld() const;

    void initializeInputTypeAfterParsingOrCloning();

private:
    enum class CreationType : uint8_t { Normal, ByParser, ByCloning };
    HTMLInputElement(const QualifiedName&, Document&, HTMLFormElement*, CreationType);

    void defaultEventHandler(Event&) final;

    Ref<Element> cloneElementWithoutAttributesAndChildren(TreeScope&) override;

    enum AutoCompleteSetting : uint8_t { Uninitialized, On, Off };
    static constexpr int defaultSize = 20;

    void willChangeForm() final;
    void didChangeForm() final;
    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) final;
    void didFinishInsertingNode() final;
    void removedFromAncestor(RemovalType, ContainerNode&) final;
    void didMoveToNewDocument(Document& oldDocument, Document& newDocument) final;

    int defaultTabIndex() const final;
    bool hasCustomFocusLogic() const final;
    bool isKeyboardFocusable(KeyboardEvent*) const final;
    bool isMouseFocusable() const final;
    bool isEnumeratable() const final;
    bool isLabelable() const final;
    void updateFocusAppearance(SelectionRestorationMode, SelectionRevealMode) final;
    bool shouldUseInputMethod() final;

    bool isInteractiveContent() const final;

    bool canTriggerImplicitSubmission() const final { return isTextField(); }

    const AtomString& formControlType() const final;

    bool shouldSaveAndRestoreFormControlState() const final;
    FormControlState saveFormControlState() const final;
    void restoreFormControlState(const FormControlState&) final;

    void resignStrongPasswordAppearance();

    bool canHaveSelection() const;
    bool canStartSelection() const final;

    bool accessKeyAction(bool sendMouseEvents) final;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason = AttributeModificationReason::Directly) final;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const final;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) final;

    void copyNonAttributePropertiesFromElement(const Element&) final;

    bool appendFormData(DOMFormData&) final;

    bool isSuccessfulSubmitButton() const final;
    bool matchesDefaultPseudoClass() const final;

    void reset() final;

    bool isURLAttribute(const Attribute&) const final;
    bool isInRange() const final;
    bool isOutOfRange() const final;

    void resumeFromDocumentSuspension() final;
#if ENABLE(INPUT_TYPE_COLOR)
    void prepareForDocumentSuspension() final;
#endif

    void addSubresourceAttributeURLs(ListHashSet<URL>&) const final;

    bool needsSuspensionCallback();
    void registerForSuspensionCallbackIfNeeded();
    void unregisterForSuspensionCallbackIfNeeded();

    bool supportsReadOnly() const final;
    bool supportsMinLength() const { return isTextType(); }
    bool supportsMaxLength() const { return isTextType(); }
    bool tooShort(StringView, NeedsToCheckDirtyFlag) const;
    bool tooLong(StringView, NeedsToCheckDirtyFlag) const;

    bool supportsPlaceholder() const final;
    void updatePlaceholderText() final;
    bool isEmptyValue() const final;
    void handleFocusEvent(Node* oldFocusedNode, FocusDirection) final;
    void handleBlurEvent() final;

    bool isOptionalFormControl() const final { return !isRequiredFormControl(); }
    bool isRequiredFormControl() const final;
    bool computeWillValidate() const final;
    void requiredStateChanged() final;

    void updateType(const AtomString& typeAttributeValue);
    void runPostTypeUpdateTasks();

#if ENABLE(TOUCH_EVENTS)
    void updateTouchEventHandler();
#endif

    void subtreeHasChanged() final;
    void disabledStateChanged() final;
    void readOnlyStateChanged() final;

#if ENABLE(DATALIST_ELEMENT)
    void resetListAttributeTargetObserver();
#endif
    void maxLengthAttributeChanged(const AtomString& newValue);
    void minLengthAttributeChanged(const AtomString& newValue);
    void updateValueIfNeeded();

    void addToRadioButtonGroup();
    void removeFromRadioButtonGroup();

    void setDefaultSelectionAfterFocus(SelectionRestorationMode, SelectionRevealMode);
    void invalidateStyleOnFocusChangeIfNeeded();

    void updateUserAgentShadowTree() final;

    bool dirAutoUsesValue() const final;

    AtomString m_name;
    String m_valueIfDirty;
    unsigned m_size { defaultSize };
    short m_maxResults { -1 };
    bool m_isChecked : 1 { false };
    bool m_dirtyCheckednessFlag : 1 { false };
    bool m_isDefaultChecked : 1 { false };
    bool m_isIndeterminate : 1 { false };
    bool m_hasType : 1 { false };
    bool m_isActivatedSubmit : 1 { false };
    unsigned m_autocomplete : 2 { Uninitialized }; // AutoCompleteSetting
    bool m_isAutoFilled : 1 { false };
    bool m_isAutoFilledAndViewable : 1 { false };
    bool m_isAutoFilledAndObscured : 1 { false };
    unsigned m_autoFillButtonType : 3 { enumToUnderlyingType(AutoFillButtonType::None) }; // AutoFillButtonType
    unsigned m_lastAutoFillButtonType : 3 { enumToUnderlyingType(AutoFillButtonType::None) }; // AutoFillButtonType
    bool m_isAutoFillAvailable : 1 { false };
#if ENABLE(DATALIST_ELEMENT)
    bool m_hasNonEmptyList : 1 { false };
#endif
    bool m_stateRestored : 1 { false };
    bool m_parsingInProgress : 1;
    bool m_valueAttributeWasUpdatedAfterParsing : 1 { false };
    bool m_wasModifiedByUser : 1 { false };
    bool m_canReceiveDroppedFiles : 1 { false };
#if ENABLE(TOUCH_EVENTS)
    bool m_hasTouchEventHandler : 1 { false };
#endif
    bool m_isSpellcheckDisabledExceptTextReplacement : 1 { false };
    bool m_hasPendingUserAgentShadowTreeUpdate : 1 { false };
    bool m_hasSwitchAttribute : 1 { false };
    bool m_hasEverBeenPasswordField : 1 { false };
    RefPtr<InputType> m_inputType;
    // The ImageLoader must be owned by this element because the loader code assumes
    // that it lives as long as its owning element lives. If we move the loader into
    // the ImageInput object we may delete the loader while this element lives on.
    std::unique_ptr<HTMLImageLoader> m_imageLoader;
#if ENABLE(DATALIST_ELEMENT)
    std::unique_ptr<ListAttributeTargetObserver> m_listAttributeTargetObserver;
#endif
};

}
