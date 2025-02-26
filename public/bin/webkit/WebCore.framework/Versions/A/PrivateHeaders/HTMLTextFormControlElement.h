/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2000 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2004-2018 Apple Inc. All rights reserved.
 * Copyright (C) 2009, 2010, 2011 Google Inc. All rights reserved.
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

#include "HTMLFormControlElement.h"
#include "PointerEventTypeNames.h"

namespace WebCore {

class Position;
class RenderTextControl;
class TextControlInnerTextElement;
class VisiblePosition;

struct SimpleRange;

enum class AutoFillButtonType : uint8_t { None, Credentials, Contacts, StrongPassword, CreditCard, Loading };
enum class ForBindings : bool { No, Yes };
enum TextFieldSelectionDirection { SelectionHasNoDirection, SelectionHasForwardDirection, SelectionHasBackwardDirection };
enum TextFieldEventBehavior { DispatchNoEvent, DispatchChangeEvent, DispatchInputAndChangeEvent };
enum TextControlSetValueSelection { SetSelectionToEnd, Clamp, DoNotSet };

class HTMLTextFormControlElement : public HTMLFormControlElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLTextFormControlElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLTextFormControlElement);
public:
    // Common flag for HTMLInputElement::tooLong() / tooShort() and HTMLTextAreaElement::tooLong() / tooShort().
    enum NeedsToCheckDirtyFlag {CheckDirtyFlag, IgnoreDirtyFlag};

    virtual ~HTMLTextFormControlElement();

    void didEditInnerTextValue();
    void forwardEvent(Event&);

    int maxLength() const { return m_maxLength; }
    WEBCORE_EXPORT ExceptionOr<void> setMaxLength(int);
    int minLength() const { return m_minLength; }
    ExceptionOr<void> setMinLength(int);

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;

    // The derived class should return true if placeholder processing is needed.
    bool isPlaceholderVisible() const { return m_isPlaceholderVisible; }
    virtual bool supportsPlaceholder() const = 0;
    virtual HTMLElement* placeholderElement() const = 0;
    void updatePlaceholderVisibility();

    WEBCORE_EXPORT void setCanShowPlaceholder(bool);
    bool canShowPlaceholder() const { return m_canShowPlaceholder; }

    int indexForVisiblePosition(const VisiblePosition&) const;
    WEBCORE_EXPORT VisiblePosition visiblePositionForIndex(int index) const;
    WEBCORE_EXPORT unsigned selectionStart() const;
    WEBCORE_EXPORT unsigned selectionEnd() const;
    WEBCORE_EXPORT const AtomString& selectionDirection() const;
    WEBCORE_EXPORT void setSelectionStart(unsigned);
    WEBCORE_EXPORT void setSelectionEnd(unsigned);
    WEBCORE_EXPORT void setSelectionDirection(const String&);
    WEBCORE_EXPORT void select(SelectionRevealMode = SelectionRevealMode::DoNotReveal, const AXTextStateChangeIntent& = AXTextStateChangeIntent());
    WEBCORE_EXPORT ExceptionOr<void> setRangeText(StringView replacement);
    WEBCORE_EXPORT virtual ExceptionOr<void> setRangeText(StringView replacement, unsigned start, unsigned end, const String& selectionMode);
    void setSelectionRange(unsigned start, unsigned end, const String& direction, const AXTextStateChangeIntent& = AXTextStateChangeIntent(), ForBindings = ForBindings::No);
    WEBCORE_EXPORT bool setSelectionRange(unsigned start, unsigned end, TextFieldSelectionDirection = SelectionHasNoDirection, SelectionRevealMode = SelectionRevealMode::DoNotReveal, const AXTextStateChangeIntent& = AXTextStateChangeIntent(), ForBindings = ForBindings::No);

    void scheduleSelectionChangeEvent();

    TextFieldSelectionDirection computeSelectionDirection() const;

    std::optional<SimpleRange> selection() const;
    String selectedText() const;

    void dispatchFormControlChangeEvent() final;
    void scheduleSelectEvent();

    virtual String value() const = 0;

    virtual ExceptionOr<void> setValue(const String&, TextFieldEventBehavior = DispatchNoEvent, TextControlSetValueSelection = TextControlSetValueSelection::SetSelectionToEnd) = 0;
    virtual RefPtr<TextControlInnerTextElement> innerTextElement() const = 0;
    virtual RefPtr<TextControlInnerTextElement> innerTextElementCreatingShadowSubtreeIfNeeded() = 0;
    virtual RenderStyle createInnerTextStyle(const RenderStyle&) = 0;

    virtual bool dirAutoUsesValue() const = 0;

    bool selectionChanged(bool shouldFireSelectEvent);
    WEBCORE_EXPORT bool lastChangeWasUserEdit() const;
    void setInnerTextValue(String&&);
    String innerTextValue() const;

    String directionForFormData() const;

    void setTextAsOfLastFormControlChangeEvent(const String& text) { m_textAsOfLastFormControlChangeEvent = text; }

    WEBCORE_EXPORT virtual bool isInnerTextElementEditable() const;

    bool canContainRangeEndPoint() const override { return false; }

protected:
    HTMLTextFormControlElement(const QualifiedName&, Document&, HTMLFormElement*);
    bool isPlaceholderEmpty() const;
    virtual void updatePlaceholderText() = 0;

    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) override;

    void disabledStateChanged() override;
    void readOnlyStateChanged() override;
    bool readOnlyBarsFromConstraintValidation() const final { return true; }

    void updateInnerTextElementEditability();

    bool cacheSelection(unsigned start, unsigned end, TextFieldSelectionDirection);

    void restoreCachedSelection(SelectionRevealMode, const AXTextStateChangeIntent& = AXTextStateChangeIntent());
    bool hasCachedSelection() const { return m_hasCachedSelection; }

    unsigned computeSelectionStart() const;
    unsigned computeSelectionEnd() const;

    virtual void subtreeHasChanged() = 0;

    void setLastChangeWasNotUserEdit() { m_lastChangeWasUserEdit = false; }

    String valueWithHardLineBreaks() const;

    void adjustInnerTextStyle(const RenderStyle& parentStyle, RenderStyle& textBlockStyle) const;

    void internalSetMaxLength(int maxLength) { m_maxLength = maxLength; }
    void internalSetMinLength(int minLength) { m_minLength = minLength; }

private:
    TextFieldSelectionDirection cachedSelectionDirection() const { return static_cast<TextFieldSelectionDirection>(m_cachedSelectionDirection); }

    bool isTextFormControlElement() const final { return true; }

    void dispatchFocusEvent(RefPtr<Element>&& oldFocusedElement, const FocusOptions&) final;
    void dispatchBlurEvent(RefPtr<Element>&& newFocusedElement) final;
    bool childShouldCreateRenderer(const Node&) const override;
    
    void setHovered(bool, Style::InvalidationScope, HitTestRequest) final;

    void effectiveSpellcheckAttributeChanged(bool) final;

    unsigned indexForPosition(const Position&) const;

    // Returns true if user-editable value is empty. Used to check placeholder visibility.
    virtual bool isEmptyValue() const = 0;
    // Called in dispatchFocusEvent(), after placeholder process, before calling parent's dispatchFocusEvent().
    virtual void handleFocusEvent(Node* /* oldFocusedNode */, FocusDirection) { }
    // Called in dispatchBlurEvent(), after placeholder process, before calling parent's dispatchBlurEvent().
    virtual void handleBlurEvent() { }

    bool placeholderShouldBeVisible() const;

    unsigned m_cachedSelectionDirection : 2;
    unsigned m_lastChangeWasUserEdit : 1 { false };
    unsigned m_isPlaceholderVisible : 1 { false };
    unsigned m_canShowPlaceholder : 1 { true };

    int m_maxLength { -1 };
    int m_minLength { -1 };

    unsigned m_cachedSelectionStart { 0 };
    unsigned m_cachedSelectionEnd { 0 };

    bool m_hasCachedSelection { false };
    bool m_hasScheduledSelectionChangeEvent { false };

    String m_pointerType { mousePointerEventType() };

    String m_textAsOfLastFormControlChangeEvent;
};

WEBCORE_EXPORT HTMLTextFormControlElement* enclosingTextFormControl(const Position&);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLTextFormControlElement)
    static bool isType(const WebCore::Element& element) { return element.isTextFormControlElement(); }
    static bool isType(const WebCore::Node& node)
    {
        auto* element = dynamicDowncast<WebCore::Element>(node);
        return element && isType(*element);
    }
    static bool isType(const WebCore::EventTarget& target)
    {
        auto* node = dynamicDowncast<WebCore::Node>(target);
        return node && isType(*node);
    }
SPECIALIZE_TYPE_TRAITS_END()
