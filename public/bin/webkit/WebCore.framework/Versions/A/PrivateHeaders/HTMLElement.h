/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 * Copyright (C) 2004-2018 Apple Inc. All rights reserved.
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

#include "ColorTypes.h"
#include "Document.h"
#include "HTMLNames.h"
#include "InputMode.h"
#include "StyledElement.h"

#if ENABLE(AUTOCAPITALIZE)
#include "Autocapitalize.h"
#endif

namespace WebCore {

class ElementInternals;
class FormListedElement;
class FormAssociatedElement;
class HTMLFormControlElement;
class HTMLFormElement;
class VisibleSelection;

struct SimpleRange;
struct TextRecognitionResult;

enum class EnterKeyHint : uint8_t;
enum class PageIsEditable : bool;
enum class PopoverVisibilityState : bool;
enum class ToggleState : bool;

#if PLATFORM(IOS_FAMILY)
enum class SelectionRenderingBehavior : bool;
#endif

enum class FireEvents : bool { No, Yes };
enum class FocusPreviousElement : bool { No, Yes };
enum class PopoverState : uint8_t {
    None,
    Auto,
    Manual,
};

class HTMLElement : public StyledElement {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(HTMLElement);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(HTMLElement);
public:
    static Ref<HTMLElement> create(const QualifiedName& tagName, Document&);

    WEBCORE_EXPORT String title() const final;

    WEBCORE_EXPORT ExceptionOr<void> setInnerText(String&&);
    WEBCORE_EXPORT ExceptionOr<void> setOuterText(String&&);

    virtual bool hasCustomFocusLogic() const;
    bool supportsFocus() const override;

    WEBCORE_EXPORT String contentEditable() const;
    WEBCORE_EXPORT ExceptionOr<void> setContentEditable(const String&);

    static Editability editabilityFromContentEditableAttr(const Node&, PageIsEditable);

    virtual bool draggable() const;
    WEBCORE_EXPORT void setDraggable(bool);
    virtual bool isDraggableIgnoringAttributes() const { return false; }

    WEBCORE_EXPORT bool spellcheck() const;
    WEBCORE_EXPORT void setSpellcheck(bool);

    WEBCORE_EXPORT bool writingsuggestions() const;
    WEBCORE_EXPORT void setWritingsuggestions(bool);

    WEBCORE_EXPORT bool translate() const;
    WEBCORE_EXPORT void setTranslate(bool);

    WEBCORE_EXPORT void click();

    bool accessKeyAction(bool sendMouseEvents) override;

    String accessKeyLabel() const;

    WEBCORE_EXPORT const AtomString& dir() const;
    WEBCORE_EXPORT void setDir(const AtomString&);

    virtual bool isTextControlInnerTextElement() const { return false; }
    virtual bool isSearchFieldResultsButtonElement() const { return false; }

    bool willRespondToMouseMoveEvents() const override;
    bool willRespondToMouseClickEventsWithEditability(Editability) const override;

    // Represents "labelable element": https://html.spec.whatwg.org/multipage/forms.html#category-label
    virtual bool isLabelable() const { return false; }
    WEBCORE_EXPORT RefPtr<NodeList> labels();

    virtual FormAssociatedElement* asFormAssociatedElement();

    virtual bool isInteractiveContent() const { return false; }

    bool hasTagName(const HTMLQualifiedName& name) const { return hasLocalName(name.localName()); }

    static const AtomString& eventNameForEventHandlerAttribute(const QualifiedName& attributeName);

    // Only some element types can be disabled: https://html.spec.whatwg.org/multipage/scripting.html#concept-element-disabled
    bool canBeActuallyDisabled() const;
    virtual bool isActuallyDisabled() const;

#if ENABLE(AUTOCAPITALIZE)
    WEBCORE_EXPORT virtual AutocapitalizeType autocapitalizeType() const;
    WEBCORE_EXPORT const AtomString& autocapitalize() const;
    WEBCORE_EXPORT void setAutocapitalize(const AtomString& value);
#endif

#if ENABLE(AUTOCORRECT)
    bool autocorrect() const { return shouldAutocorrect(); }
    WEBCORE_EXPORT virtual bool shouldAutocorrect() const;
    WEBCORE_EXPORT void setAutocorrect(bool);
#endif

    WEBCORE_EXPORT InputMode canonicalInputMode() const;
    const AtomString& inputMode() const;
    void setInputMode(const AtomString& value);

    WEBCORE_EXPORT EnterKeyHint canonicalEnterKeyHint() const;
    String enterKeyHint() const;
    void setEnterKeyHint(const AtomString& value);

    WEBCORE_EXPORT static bool shouldExtendSelectionToTargetNode(const Node& targetNode, const VisibleSelection& selectionBeforeUpdate);

    WEBCORE_EXPORT ExceptionOr<Ref<ElementInternals>> attachInternals();

    struct ShowPopoverOptions {
        RefPtr<HTMLElement> source;
    };

    struct TogglePopoverOptions : public ShowPopoverOptions {
        std::optional<bool> force;
    };

    void queuePopoverToggleEventTask(ToggleState oldState, ToggleState newState);
    ExceptionOr<void> showPopover(const ShowPopoverOptions&);
    ExceptionOr<void> showPopoverInternal(const HTMLElement* = nullptr);
    ExceptionOr<void> hidePopover();
    ExceptionOr<void> hidePopoverInternal(FocusPreviousElement, FireEvents);
    ExceptionOr<bool> togglePopover(std::optional<std::variant<WebCore::HTMLElement::TogglePopoverOptions, bool>>);

    PopoverState popoverState() const;
    const AtomString& popover() const;
    void setPopover(const AtomString& value) { setAttributeWithoutSynchronization(HTMLNames::popoverAttr, value); };
    void popoverAttributeChanged(const AtomString& value);

    bool isValidCommandType(const CommandType) override;
    bool handleCommandInternal(const HTMLFormControlElement& invoker, const CommandType&) override;

#if PLATFORM(IOS_FAMILY)
    static SelectionRenderingBehavior selectionRenderingBehavior(const Node*);
#endif

protected:
    HTMLElement(const QualifiedName& tagName, Document&, OptionSet<TypeFlag>);

    enum class AllowZeroValue : bool { No, Yes };
    void addHTMLLengthToStyle(MutableStyleProperties&, CSSPropertyID, StringView value, AllowZeroValue = AllowZeroValue::Yes);
    void addHTMLMultiLengthToStyle(MutableStyleProperties&, CSSPropertyID, StringView value);
    void addHTMLPixelsToStyle(MutableStyleProperties&, CSSPropertyID, StringView value);
    void addHTMLNumberToStyle(MutableStyleProperties&, CSSPropertyID, StringView value);

    static std::optional<SRGBA<uint8_t>> parseLegacyColorValue(StringView);
    void addHTMLColorToStyle(MutableStyleProperties&, CSSPropertyID, const AtomString& color);

    void applyAspectRatioFromWidthAndHeightAttributesToStyle(StringView widthAttribute, StringView heightAttribute, MutableStyleProperties&);
    void applyAspectRatioWithoutDimensionalRulesFromWidthAndHeightAttributesToStyle(StringView widthAttribute, StringView heightAttribute, MutableStyleProperties&);
    void addParsedWidthAndHeightToAspectRatioList(double width, double height, MutableStyleProperties&);
    
    void applyAlignmentAttributeToStyle(const AtomString&, MutableStyleProperties&);
    void applyBorderAttributeToStyle(const AtomString&, MutableStyleProperties&);

    bool matchesReadWritePseudoClass() const override;
    void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason) override;
    Node::InsertedIntoAncestorResult insertedIntoAncestor(InsertionType , ContainerNode& parentOfInsertedTree) override;
    void removedFromAncestor(RemovalType, ContainerNode& oldParentOfRemovedTree) override;
    bool hasPresentationalHintsForAttribute(const QualifiedName&) const override;
    void collectPresentationalHintsForAttribute(const QualifiedName&, const AtomString&, MutableStyleProperties&) override;
    unsigned parseBorderWidthAttribute(const AtomString&) const;

    virtual void effectiveSpellcheckAttributeChanged(bool);

    using EventHandlerNameMap = UncheckedKeyHashMap<AtomString, AtomString>;
    static const AtomString& eventNameForEventHandlerAttribute(const QualifiedName& attributeName, const EventHandlerNameMap&);

private:
    String nodeName() const final;

    void mapLanguageAttributeToLocale(const AtomString&, MutableStyleProperties&);

    enum class AllowPercentage : bool { No, Yes };
    enum class UseCSSPXAsUnitType : bool { No, Yes };
    enum class IsMultiLength : bool { No, Yes };
    void addHTMLLengthToStyle(MutableStyleProperties&, CSSPropertyID, StringView value, AllowPercentage, UseCSSPXAsUnitType, IsMultiLength, AllowZeroValue = AllowZeroValue::Yes);
};

inline HTMLElement::HTMLElement(const QualifiedName& tagName, Document& document, OptionSet<TypeFlag> type = { })
    : StyledElement(tagName, document, type | TypeFlag::IsHTMLElement)
{
    ASSERT(tagName.localName().impl());
}

inline bool Node::hasTagName(const HTMLQualifiedName& name) const
{
    auto* htmlElement = dynamicDowncast<HTMLElement>(*this);
    return htmlElement && htmlElement->hasTagName(name);
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::HTMLElement)
    static bool isType(const WebCore::Node& node) { return node.isHTMLElement(); }
    static bool isType(const WebCore::EventTarget& target)
    {
        auto* node = dynamicDowncast<WebCore::Node>(target);
        return node && isType(*node);
    }
SPECIALIZE_TYPE_TRAITS_END()

#include "HTMLElementTypeHelpers.h"
