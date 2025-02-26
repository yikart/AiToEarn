/*
* Copyright (C) 2019 Apple Inc. All rights reserved.
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

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)

#include "AXCoreObject.h"
#include "AXIsolatedTree.h"
#include "AXObjectCache.h"
#include "IntPoint.h"
#include "LayoutRect.h"
#include "Path.h"
#include "RenderStyleConstants.h"
#include <variant>
#include <wtf/Forward.h>
#include <wtf/HashMap.h>
#include <wtf/RefPtr.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

class AXIsolatedTree;
#if ENABLE(AX_THREAD_TEXT_APIS)
struct AXTextRuns;
#endif

class AXIsolatedObject final : public AXCoreObject {
    friend class AXIsolatedTree;
public:
    static Ref<AXIsolatedObject> create(const Ref<AccessibilityObject>&, AXIsolatedTree*);
    ~AXIsolatedObject();

    std::optional<AXID> treeID() const final { return tree()->treeID(); }
    String dbgInternal(bool, OptionSet<AXDebugStringOption>) const final;

    AccessibilityRole roleValue() const final { return static_cast<AccessibilityRole>(intAttributeValue(AXPropertyName::RoleValue)); }

    void attachPlatformWrapper(AccessibilityObjectWrapper*);
    bool isDetached() const final;
    bool isTable() const final { return boolAttributeValue(AXPropertyName::IsTable); }
    bool isExposable() const final { return boolAttributeValue(AXPropertyName::IsExposable); }
    bool hasClickHandler() const final { return boolAttributeValue(AXPropertyName::HasClickHandler); }

    bool hasBodyTag() const final { return boolAttributeValue(AXPropertyName::HasBodyTag); }
    bool hasMarkTag() const final { return boolAttributeValue(AXPropertyName::HasMarkTag); }

    const AccessibilityChildrenVector& children(bool updateChildrenIfNeeded = true) final;
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    AXIsolatedObject* parentObject() const final { return tree()->objectForID(parent()); }
    AXIsolatedObject* parentObjectUnignored() const final { return downcast<AXIsolatedObject>(AXCoreObject::parentObjectUnignored()); }
#else
    AXIsolatedObject* parentObject() const final { return parentObjectUnignored(); }
    AXIsolatedObject* parentObjectUnignored() const final { return tree()->objectForID(parent()); }
#endif // ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    AXIsolatedObject* clickableSelfOrAncestor(ClickHandlerFilter filter = ClickHandlerFilter::ExcludeBody) const final { return Accessibility::clickableSelfOrAncestor(*this, filter); };
    AXIsolatedObject* editableAncestor() const final { return Accessibility::editableAncestor(*this); };
    bool canSetFocusAttribute() const final { return boolAttributeValue(AXPropertyName::CanSetFocusAttribute); }
    AttributedStringStyle stylesForAttributedString() const final;

#if ENABLE(AX_THREAD_TEXT_APIS)
    const AXTextRuns* textRuns() const;
    bool hasTextRuns() final
    {
        const auto* runs = textRuns();
        return runs && runs->size();
    }
    TextEmissionBehavior emitTextAfterBehavior() const final { return propertyValue<TextEmissionBehavior>(AXPropertyName::EmitTextAfterBehavior); }
#endif // ENABLE(AX_THREAD_TEXT_APIS)

    AXTextMarkerRange textMarkerRange() const final;

private:
    constexpr ProcessID processID() const final { return tree()->processID(); }
    void detachRemoteParts(AccessibilityDetachmentType) final;
    void detachPlatformWrapper(AccessibilityDetachmentType) final;

    std::optional<AXID> parent() const { return m_parentID; }
    void setParent(std::optional<AXID> axID) { m_parentID = axID; }

    AXIsolatedTree* tree() const { return m_cachedTree.get(); }

    AXIsolatedObject(const Ref<AccessibilityObject>&, AXIsolatedTree*);
    bool isAXIsolatedObjectInstance() const final { return true; }
    AccessibilityObject* associatedAXObject() const;

    void initializeProperties(const Ref<AccessibilityObject>&);
    void initializePlatformProperties(const Ref<const AccessibilityObject>&);

    void setProperty(AXPropertyName, AXPropertyValueVariant&&);
    void setObjectProperty(AXPropertyName, AXCoreObject*);
    void setObjectVectorProperty(AXPropertyName, const AccessibilityChildrenVector&);

    void setPropertyFlag(AXPropertyFlag, bool);
    bool hasPropertyFlag(AXPropertyFlag) const;

    static bool canBeMultilineTextField(AccessibilityObject&);

    // FIXME: consolidate all AttributeValue retrieval in a single template method.
    bool boolAttributeValue(AXPropertyName) const;
    String stringAttributeValue(AXPropertyName) const;
    String stringAttributeValueNullIfMissing(AXPropertyName) const;
    int intAttributeValue(AXPropertyName) const;
    unsigned unsignedAttributeValue(AXPropertyName) const;
    double doubleAttributeValue(AXPropertyName) const;
    float floatAttributeValue(AXPropertyName) const;
    AXIsolatedObject* objectAttributeValue(AXPropertyName) const;
    IntPoint intPointAttributeValue(AXPropertyName) const;
    Color colorAttributeValue(AXPropertyName) const;
    URL urlAttributeValue(AXPropertyName) const;
    uint64_t uint64AttributeValue(AXPropertyName) const;
    Path pathAttributeValue(AXPropertyName) const;
    std::pair<unsigned, unsigned> indexRangePairAttributeValue(AXPropertyName) const;
    template<typename T> T rectAttributeValue(AXPropertyName) const;
    template<typename T> Vector<T> vectorAttributeValue(AXPropertyName) const;
    template<typename T> OptionSet<T> optionSetAttributeValue(AXPropertyName) const;
    template<typename T> std::optional<T> optionalAttributeValue(AXPropertyName) const;
    template<typename T> T propertyValue(AXPropertyName) const;

    // The following method performs a lazy caching of the given property.
    // If the property is already in m_propertyMap, returns the existing value.
    // If not, retrieves the property from the main thread and cache it for later use.
    template<typename T> T getOrRetrievePropertyValue(AXPropertyName);

    void fillChildrenVectorForProperty(AXPropertyName, AccessibilityChildrenVector&) const;
    void setMathscripts(AXPropertyName, AccessibilityObject&);
    void insertMathPairs(Vector<std::pair<Markable<AXID>, Markable<AXID>>>&, AccessibilityMathMultiscriptPairs&);
    template<typename U> void performFunctionOnMainThreadAndWait(U&& lambda) const
    {
        Accessibility::performFunctionOnMainThreadAndWait([&lambda, this] {
            if (RefPtr object = associatedAXObject())
                lambda(object.get());
        });
    }
    template<typename U> void performFunctionOnMainThread(U&& lambda) const
    {
        Accessibility::performFunctionOnMainThread([lambda = WTFMove(lambda), protectedThis = Ref { *this }] () mutable {
            if (RefPtr object = protectedThis->associatedAXObject())
                lambda(object.get());
        });
    }

    // Attribute retrieval overrides.
    bool isSecureField() const final { return boolAttributeValue(AXPropertyName::IsSecureField); }
    bool isAttachment() const final { return boolAttributeValue(AXPropertyName::IsAttachment); }
    bool isInputImage() const final { return boolAttributeValue(AXPropertyName::IsInputImage); }
    bool isRadioInput() const final { return boolAttributeValue(AXPropertyName::IsRadioInput); }

    bool isKeyboardFocusable() const final { return boolAttributeValue(AXPropertyName::IsKeyboardFocusable); }
    
    // Table support.
    AXIsolatedObject* exposedTableAncestor(bool includeSelf = false) const final { return Accessibility::exposedTableAncestor(*this, includeSelf); }
    AccessibilityChildrenVector columns() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::Columns)); }
    AccessibilityChildrenVector rows() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::Rows)); }
    unsigned columnCount() final { return static_cast<unsigned>(columns().size()); }
    unsigned rowCount() final { return static_cast<unsigned>(rows().size()); }
    AccessibilityChildrenVector cells() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::Cells)); }
    AXIsolatedObject* cellForColumnAndRow(unsigned, unsigned) final;
    AccessibilityChildrenVector rowHeaders() final;
    AccessibilityChildrenVector visibleRows() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::VisibleRows)); }
    AXIsolatedObject* headerContainer() final { return objectAttributeValue(AXPropertyName::HeaderContainer); }
    int axColumnCount() const final { return intAttributeValue(AXPropertyName::AXColumnCount); }
    int axRowCount() const final { return intAttributeValue(AXPropertyName::AXRowCount); }

    // Table cell support.
    bool isTableCell() const final;
    bool isExposedTableCell() const final { return boolAttributeValue(AXPropertyName::IsExposedTableCell); }
    // Returns the start location and row span of the cell.
    std::pair<unsigned, unsigned> rowIndexRange() const final { return indexRangePairAttributeValue(AXPropertyName::RowIndexRange); }
    // Returns the start location and column span of the cell.
    std::pair<unsigned, unsigned> columnIndexRange() const final { return indexRangePairAttributeValue(AXPropertyName::ColumnIndexRange); }
    int axColumnIndex() const final { return intAttributeValue(AXPropertyName::AXColumnIndex); }
    int axRowIndex() const final { return intAttributeValue(AXPropertyName::AXRowIndex); }
    bool isColumnHeader() const final { return boolAttributeValue(AXPropertyName::IsColumnHeader); }
    bool isRowHeader() const final { return boolAttributeValue(AXPropertyName::IsRowHeader); }
    String cellScope() const final { return stringAttributeValue(AXPropertyName::CellScope); }
    std::optional<AXID> rowGroupAncestorID() const final { return propertyValue<Markable<AXID>>(AXPropertyName::RowGroupAncestorID); }

    // Table column support.
    bool isTableColumn() const final { return boolAttributeValue(AXPropertyName::IsTableColumn); }
    unsigned columnIndex() const final { return unsignedAttributeValue(AXPropertyName::ColumnIndex); }
    AXIsolatedObject* columnHeader() final { return objectAttributeValue(AXPropertyName::ColumnHeader); }

    // Table row support.
    bool isTableRow() const final { return boolAttributeValue(AXPropertyName::IsTableRow); }
    unsigned rowIndex() const final { return unsignedAttributeValue(AXPropertyName::RowIndex); }
    AXIsolatedObject* rowHeader() final { return objectAttributeValue(AXPropertyName::RowHeader); };

    // ARIA tree/grid row support.
    bool isARIATreeGridRow() const final { return boolAttributeValue(AXPropertyName::IsARIATreeGridRow); }
    AccessibilityChildrenVector disclosedRows() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::DisclosedRows)); }
    AXIsolatedObject* disclosedByRow() const final { return objectAttributeValue(AXPropertyName::DisclosedByRow); }

    bool isFieldset() const final { return boolAttributeValue(AXPropertyName::IsFieldset); }
    bool isChecked() const final { return boolAttributeValue(AXPropertyName::IsChecked); }
    bool isEnabled() const final { return boolAttributeValue(AXPropertyName::IsEnabled); }
    bool isSelected() const final { return boolAttributeValue(AXPropertyName::IsSelected); }
    bool isFocused() const final { return tree()->focusedNodeID() == objectID(); }
    bool isMultiSelectable() const final { return boolAttributeValue(AXPropertyName::IsMultiSelectable); }
    InsideLink insideLink() const final { return propertyValue<InsideLink>(AXPropertyName::InsideLink); }
    bool isRequired() const final { return boolAttributeValue(AXPropertyName::IsRequired); }
    bool isExpanded() const final { return boolAttributeValue(AXPropertyName::IsExpanded); }
    bool isFileUploadButton() const final { return boolAttributeValue(AXPropertyName::IsFileUploadButton); }
    FloatPoint screenRelativePosition() const final;
    IntPoint remoteFrameOffset() const final;
    FloatRect relativeFrame() const final;
    bool hasCachedRelativeFrame() const { return optionalAttributeValue<IntRect>(AXPropertyName::RelativeFrame).has_value(); }
#if PLATFORM(MAC)
    FloatRect primaryScreenRect() const final;
#endif
    IntSize size() const final { return snappedIntRect(LayoutRect(relativeFrame())).size(); }
    FloatRect relativeFrameFromChildren() const;
    WallTime dateTimeValue() const final { return propertyValue<WallTime>(AXPropertyName::DateTimeValue); }
    DateComponentsType dateTimeComponentsType() const final { return propertyValue<DateComponentsType>(AXPropertyName::DateTimeComponentsType); }
    bool supportsDatetimeAttribute() const final { return boolAttributeValue(AXPropertyName::SupportsDatetimeAttribute); }
    String datetimeAttributeValue() const final { return stringAttributeValue(AXPropertyName::DatetimeAttributeValue); }
    bool canSetValueAttribute() const final { return boolAttributeValue(AXPropertyName::CanSetValueAttribute); }
    bool canSetSelectedAttribute() const final { return boolAttributeValue(AXPropertyName::CanSetSelectedAttribute); }
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    bool isIgnored() const final { return boolAttributeValue(AXPropertyName::IsIgnored); }
#else
    // When not including ignored objects in the core tree, we should never create an isolated object from
    // an ignored live object, so we can hardcode this to false.
    bool isIgnored() const final { return false; }
#endif // ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    unsigned blockquoteLevel() const final { return unsignedAttributeValue(AXPropertyName::BlockquoteLevel); }
    unsigned headingLevel() const final { return unsignedAttributeValue(AXPropertyName::HeadingLevel); }
    AccessibilityButtonState checkboxOrRadioValue() const final { return propertyValue<AccessibilityButtonState>(AXPropertyName::ButtonState); }
    String valueDescription() const final { return stringAttributeValue(AXPropertyName::ValueDescription); }
    float valueForRange() const final { return floatAttributeValue(AXPropertyName::ValueForRange); }
    float maxValueForRange() const final { return floatAttributeValue(AXPropertyName::MaxValueForRange); }
    float minValueForRange() const final { return floatAttributeValue(AXPropertyName::MinValueForRange); }
    int layoutCount() const final;
    double loadingProgress() const final { return tree()->loadingProgress(); }
    bool supportsARIAOwns() const final { return boolAttributeValue(AXPropertyName::SupportsARIAOwns); }
    String popupValue() const final { return stringAttributeValue(AXPropertyName::PopupValue); }
    bool pressedIsPresent() const final;
    String invalidStatus() const final { return stringAttributeValue(AXPropertyName::InvalidStatus); }
    bool supportsExpanded() const final { return boolAttributeValue(AXPropertyName::SupportsExpanded); }
    AccessibilitySortDirection sortDirection() const final { return static_cast<AccessibilitySortDirection>(intAttributeValue(AXPropertyName::SortDirection)); }
    bool supportsRangeValue() const final { return boolAttributeValue(AXPropertyName::SupportsRangeValue); }
    String identifierAttribute() const final;
    String linkRelValue() const final;
    Vector<String> classList() const final;
    AccessibilityCurrentState currentState() const final { return static_cast<AccessibilityCurrentState>(intAttributeValue(AXPropertyName::CurrentState)); }
    bool supportsCurrent() const final { return boolAttributeValue(AXPropertyName::SupportsCurrent); }
    bool supportsKeyShortcuts() const final { return boolAttributeValue(AXPropertyName::SupportsKeyShortcuts); }
    String keyShortcuts() const final { return stringAttributeValue(AXPropertyName::KeyShortcuts); }
    bool supportsSetSize() const final { return boolAttributeValue(AXPropertyName::SupportsSetSize); }
    bool supportsPosInSet() const final { return boolAttributeValue(AXPropertyName::SupportsPosInSet); }
    int setSize() const final { return intAttributeValue(AXPropertyName::SetSize); }
    int posInSet() const final { return intAttributeValue(AXPropertyName::PosInSet); }
    bool supportsDropping() const final { return boolAttributeValue(AXPropertyName::SupportsDropping); }
    bool supportsDragging() const final { return boolAttributeValue(AXPropertyName::SupportsDragging); }
    bool isGrabbed() final { return boolAttributeValue(AXPropertyName::IsGrabbed); }
    Vector<String> determineDropEffects() const final;
    AXIsolatedObject* accessibilityHitTest(const IntPoint&) const final;
    AXIsolatedObject* focusedUIElement() const final;
    AXIsolatedObject* internalLinkElement() const final { return objectAttributeValue(AXPropertyName::InternalLinkElement); }
    AccessibilityChildrenVector radioButtonGroup() const final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::RadioButtonGroup)); }
    AXIsolatedObject* scrollBar(AccessibilityOrientation) final;
    const String placeholderValue() const final { return stringAttributeValue(AXPropertyName::PlaceholderValue); }
    String expandedTextValue() const final { return stringAttributeValue(AXPropertyName::ExpandedTextValue); }
    bool supportsExpandedTextValue() const final { return boolAttributeValue(AXPropertyName::SupportsExpandedTextValue); }
    SRGBA<uint8_t> colorValue() const final;
    String rolePlatformString() const final { return stringAttributeValue(AXPropertyName::RolePlatformString); }
    String roleDescription() const final { return stringAttributeValue(AXPropertyName::RoleDescription); }
    String subrolePlatformString() const final { return stringAttributeValue(AXPropertyName::SubrolePlatformString); }
    LayoutRect elementRect() const final;
    IntPoint clickPoint() final;
    void accessibilityText(Vector<AccessibilityText>& texts) const final;
    String brailleLabel() const final { return stringAttributeValue(AXPropertyName::BrailleLabel); }
    String brailleRoleDescription() const final { return stringAttributeValue(AXPropertyName::BrailleRoleDescription); }
    String embeddedImageDescription() const final { return stringAttributeValue(AXPropertyName::EmbeddedImageDescription); }
    std::optional<AccessibilityChildrenVector> imageOverlayElements() final { return std::nullopt; }
    String extendedDescription() const final { return stringAttributeValue(AXPropertyName::ExtendedDescription); }
    String computedRoleString() const final;
    bool isValueAutofillAvailable() const final { return boolAttributeValue(AXPropertyName::IsValueAutofillAvailable); }
    AutoFillButtonType valueAutofillButtonType() const final { return static_cast<AutoFillButtonType>(intAttributeValue(AXPropertyName::ValueAutofillButtonType)); }
    AccessibilityChildrenVector ariaTreeRows() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::ARIATreeRows)); }
    URL url() const final { return urlAttributeValue(AXPropertyName::URL); }
    String accessKey() const final { return stringAttributeValueNullIfMissing(AXPropertyName::AccessKey); }
    String localizedActionVerb() const final { return stringAttributeValue(AXPropertyName::LocalizedActionVerb); }
    String actionVerb() const final { return stringAttributeValue(AXPropertyName::ActionVerb); }
    String autoCompleteValue() const final { return stringAttributeValue(AXPropertyName::AutoCompleteValue); }
    bool isMathElement() const final { return boolAttributeValue(AXPropertyName::IsMathElement); }
    bool isMathFraction() const final { return boolAttributeValue(AXPropertyName::IsMathFraction); }
    bool isMathFenced() const final { return boolAttributeValue(AXPropertyName::IsMathFenced); }
    bool isMathSubscriptSuperscript() const final { return boolAttributeValue(AXPropertyName::IsMathSubscriptSuperscript); }
    bool isMathRow() const final { return boolAttributeValue(AXPropertyName::IsMathRow); }
    bool isMathUnderOver() const final { return boolAttributeValue(AXPropertyName::IsMathUnderOver); }
    bool isMathRoot() const final { return boolAttributeValue(AXPropertyName::IsMathRoot); }
    bool isMathSquareRoot() const final { return boolAttributeValue(AXPropertyName::IsMathSquareRoot); }
    bool isMathTable() const final { return boolAttributeValue(AXPropertyName::IsMathTable); }
    bool isMathTableRow() const final { return boolAttributeValue(AXPropertyName::IsMathTableRow); }
    bool isMathTableCell() const final { return boolAttributeValue(AXPropertyName::IsMathTableCell); }
    bool isMathMultiscript() const final { return boolAttributeValue(AXPropertyName::IsMathMultiscript); }
    bool isMathToken() const final { return boolAttributeValue(AXPropertyName::IsMathToken); }
    std::optional<AccessibilityChildrenVector> mathRadicand() final;
    AXIsolatedObject* mathRootIndexObject() final { return objectAttributeValue(AXPropertyName::MathRootIndexObject); }
    AXIsolatedObject* mathUnderObject() final { return objectAttributeValue(AXPropertyName::MathUnderObject); }
    AXIsolatedObject* mathOverObject() final { return objectAttributeValue(AXPropertyName::MathOverObject); }
    AXIsolatedObject* mathNumeratorObject() final { return objectAttributeValue(AXPropertyName::MathNumeratorObject); }
    AXIsolatedObject* mathDenominatorObject() final { return objectAttributeValue(AXPropertyName::MathDenominatorObject); }
    AXIsolatedObject* mathBaseObject() final { return objectAttributeValue(AXPropertyName::MathBaseObject); }
    AXIsolatedObject* mathSubscriptObject() final { return objectAttributeValue(AXPropertyName::MathSubscriptObject); }
    AXIsolatedObject* mathSuperscriptObject() final { return objectAttributeValue(AXPropertyName::MathSuperscriptObject); }
    String mathFencedOpenString() const final { return stringAttributeValue(AXPropertyName::MathFencedOpenString); }
    String mathFencedCloseString() const final { return stringAttributeValue(AXPropertyName::MathFencedCloseString); }
    int mathLineThickness() const final { return intAttributeValue(AXPropertyName::MathLineThickness); }
    void mathPrescripts(AccessibilityMathMultiscriptPairs&) final;
    void mathPostscripts(AccessibilityMathMultiscriptPairs&) final;
#if PLATFORM(COCOA)
    String speechHintAttributeValue() const final { return stringAttributeValue(AXPropertyName::SpeechHint); }
#endif
    bool fileUploadButtonReturnsValueInTitle() const final;
#if PLATFORM(MAC)
    bool caretBrowsingEnabled() const final { return boolAttributeValue(AXPropertyName::CaretBrowsingEnabled); }
#endif
    AXIsolatedObject* focusableAncestor() final { return Accessibility::focusableAncestor(*this); }
    AXIsolatedObject* highestEditableAncestor() final { return Accessibility::highestEditableAncestor(*this); }
    AccessibilityOrientation orientation() const final { return static_cast<AccessibilityOrientation>(intAttributeValue(AXPropertyName::Orientation)); }
    unsigned hierarchicalLevel() const final { return unsignedAttributeValue(AXPropertyName::HierarchicalLevel); }
    String language() const final { return stringAttributeValue(AXPropertyName::Language); }
    std::optional<AccessibilityChildrenVector> selectedChildren() final;
    void setSelectedChildren(const AccessibilityChildrenVector&) final;
    AccessibilityChildrenVector visibleChildren() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::VisibleChildren)); }
    void setChildrenIDs(Vector<AXID>&&);
    void updateChildrenIfNecessary() final;
    bool isDetachedFromParent() final;
    AXIsolatedObject* liveRegionAncestor(bool excludeIfOff = true) const final { return Accessibility::liveRegionAncestor(*this, excludeIfOff); }
    const String liveRegionStatus() const final { return stringAttributeValue(AXPropertyName::LiveRegionStatus); }
    const String liveRegionRelevant() const final { return stringAttributeValue(AXPropertyName::LiveRegionRelevant); }
    bool liveRegionAtomic() const final { return boolAttributeValue(AXPropertyName::LiveRegionAtomic); }
    bool isBusy() const final { return boolAttributeValue(AXPropertyName::IsBusy); }
    bool isInlineText() const final { return boolAttributeValue(AXPropertyName::IsInlineText); }
    // Spin button support.
    AXIsolatedObject* incrementButton() final { return objectAttributeValue(AXPropertyName::IncrementButton); }
    AXIsolatedObject* decrementButton() final { return objectAttributeValue(AXPropertyName::DecrementButton); }
    AccessibilityChildrenVector documentLinks() final { return tree()->objectsForIDs(vectorAttributeValue<AXID>(AXPropertyName::DocumentLinks)); }
    bool supportsCheckedState() const final { return boolAttributeValue(AXPropertyName::SupportsCheckedState); }

    String stringValue() const final;
    std::optional<String> platformStringValue() const;

    // Parameterized attribute retrieval.
    Vector<SimpleRange> findTextRanges(const AccessibilitySearchTextCriteria&) const final;
    Vector<String> performTextOperation(const AccessibilityTextOperation&) final;
    AccessibilityChildrenVector findMatchingObjects(AccessibilitySearchCriteria&&) final;

#if PLATFORM(COCOA)
    bool preventKeyboardDOMEventDispatch() const final { return boolAttributeValue(AXPropertyName::PreventKeyboardDOMEventDispatch); }
#endif

    // CharacterRange support.
    CharacterRange selectedTextRange() const final { return propertyValue<CharacterRange>(AXPropertyName::SelectedTextRange); }
    int insertionPointLineNumber() const final;
    CharacterRange doAXRangeForLine(unsigned) const final;
    String doAXStringForRange(const CharacterRange&) const final;
    CharacterRange characterRangeForPoint(const IntPoint&) const final;
    CharacterRange doAXRangeForIndex(unsigned) const final;
    CharacterRange doAXStyleRangeForIndex(unsigned) const final;
    IntRect doAXBoundsForRangeUsingCharacterOffset(const CharacterRange&) const final;
    IntRect doAXBoundsForRange(const CharacterRange&) const final;
    unsigned doAXLineForIndex(unsigned) final;

    VisibleSelection selection() const final;
    void setSelectedVisiblePositionRange(const VisiblePositionRange&) const final;

    std::optional<SimpleRange> simpleRange() const final;
    VisiblePositionRange visiblePositionRange() const final;

    String selectedText() const final;
    VisiblePositionRange visiblePositionRangeForLine(unsigned) const final;
    VisiblePositionRange visiblePositionRangeForUnorderedPositions(const VisiblePosition&, const VisiblePosition&) const final;
    VisiblePositionRange leftLineVisiblePositionRange(const VisiblePosition&) const final;
    VisiblePositionRange rightLineVisiblePositionRange(const VisiblePosition&) const final;
    VisiblePositionRange styleRangeForPosition(const VisiblePosition&) const final;
    VisiblePositionRange lineRangeForPosition(const VisiblePosition&) const final;
    std::optional<SimpleRange> rangeForCharacterRange(const CharacterRange&) const final;
#if PLATFORM(COCOA)
    AXTextMarkerRange textMarkerRangeForNSRange(const NSRange&) const final;
#endif
#if PLATFORM(MAC)
    AXTextMarkerRange selectedTextMarkerRange() const final;
#endif
    String stringForRange(const SimpleRange&) const final;
    IntRect boundsForRange(const SimpleRange&) const final;
    VisiblePosition visiblePositionForPoint(const IntPoint&) const final;
    VisiblePosition nextLineEndPosition(const VisiblePosition&) const final;
    VisiblePosition previousLineStartPosition(const VisiblePosition&) const final;
    VisiblePosition visiblePositionForIndex(unsigned, bool lastIndexOK) const final;
    VisiblePosition visiblePositionForIndex(int) const final;
    int indexForVisiblePosition(const VisiblePosition&) const final;
    int lineForPosition(const VisiblePosition&) const final;
    std::optional<SimpleRange> visibleCharacterRange() const final;
    
    // Attribute setters.
    void setARIAGrabbed(bool) final;
    void setIsExpanded(bool) final;
    bool setValue(float) final;
    void setValueIgnoringResult(float) final;
    void setSelected(bool) final;
    void setSelectedRows(AccessibilityChildrenVector&&) final;
    void setFocused(bool) final;
    void setSelectedText(const String&) final;
    void setSelectedTextRange(CharacterRange&&) final;
    bool setValue(const String&) final;
    void setValueIgnoringResult(const String&) final;
#if PLATFORM(MAC)
    void setCaretBrowsingEnabled(bool) final;
#endif
#if PLATFORM(COCOA)
    void setPreventKeyboardDOMEventDispatch(bool) final;
#endif

    String textUnderElement(TextUnderElementMode = { }) const final;
    std::optional<SimpleRange> misspellingRange(const SimpleRange&, AccessibilitySearchDirection) const final;
    FloatRect convertFrameToSpace(const FloatRect&, AccessibilityConversionSpace) const final;
    void increment() final;
    void decrement() final;
    bool performDismissAction() final;
    void performDismissActionIgnoringResult() final;
    void scrollToMakeVisible() const final;
    void scrollToMakeVisibleWithSubFocus(IntRect&&) const final;
    void scrollToGlobalPoint(IntPoint&&) const final;
    bool replaceTextInRange(const String&, const CharacterRange&) final;
    bool insertText(const String&) final;
    bool press() final;

    bool isAccessibilityObject() const final { return false; }

    // Functions that should never be called on an isolated tree object. ASSERT that these are not reached;
    bool isAccessibilityRenderObject() const final;
    bool isAccessibilityTableInstance() const final;
    bool isAccessibilityARIAGridRowInstance() const final { return false; }
    bool isAccessibilityARIAGridCellInstance() const final { return false; }
    bool isAXRemoteFrame() const final { return false; }
    bool isNativeTextControl() const final;
    bool isMockObject() const final;
    bool isNonNativeTextControl() const final;
    bool isIndeterminate() const final { return boolAttributeValue(AXPropertyName::IsIndeterminate); }
    bool isLoaded() const final { return loadingProgress() >= 1; }
    bool isOnScreen() const final;
    bool isOffScreen() const final;
    bool isPressed() const final;
    bool isNonLayerSVGObject() const { return boolAttributeValue(AXPropertyName::IsNonLayerSVGObject); }
    // FIXME: isVisible should be accurate for all objects, not just widgets, on COCOA.
    bool isVisible() const final { return boolAttributeValue(AXPropertyName::IsVisible); }
    bool isSelectedOptionActive() const final;
    bool hasBoldFont() const final { return boolAttributeValue(AXPropertyName::HasBoldFont); }
    bool hasItalicFont() const final { return boolAttributeValue(AXPropertyName::HasItalicFont); }
    Vector<AXTextMarkerRange> misspellingRanges() const final;
    bool hasPlainText() const final { return boolAttributeValue(AXPropertyName::HasPlainText); }
    bool hasSameFont(AXCoreObject&) final;
    bool hasSameFontColor(AXCoreObject&) final;
    bool hasSameStyle(AXCoreObject&) final;
    bool hasUnderline() const final { return boolAttributeValue(AXPropertyName::HasUnderline); }
    bool hasHighlighting() const final { return boolAttributeValue(AXPropertyName::HasHighlighting); }
    AXTextMarkerRange textInputMarkedTextMarkerRange() const final;
    Element* element() const final;
    Node* node() const final;
    RenderObject* renderer() const final;

    AccessibilityChildrenVector relatedObjects(AXRelationType) const final;

    bool supportsHasPopup() const final;
    bool supportsChecked() const final;
    bool isModalNode() const final;
    bool isDescendantOfRole(AccessibilityRole) const final;
    bool inheritsPresentationalRole() const final;
    void setAccessibleName(const AtomString&) final;

    String titleAttributeValue() const final;
    String title() const final { return stringAttributeValue(AXPropertyName::Title); }
    String description() const final { return stringAttributeValue(AXPropertyName::Description); }

    std::optional<String> textContent() const final;

    String text() const final;
    unsigned textLength() const final;
#if PLATFORM(COCOA)
    RetainPtr<NSAttributedString> attributedStringForTextMarkerRange(AXTextMarkerRange&&, SpellCheck) const final;
    RetainPtr<CTFontRef> font() const final { return propertyValue<RetainPtr<CTFontRef>>(AXPropertyName::Font); }
#endif
    AXObjectCache* axObjectCache() const final;
    Element* actionElement() const final;
    Path elementPath() const final { return pathAttributeValue(AXPropertyName::Path); };
    bool supportsPath() const final { return boolAttributeValue(AXPropertyName::SupportsPath); }

    bool isWidget() const final { return boolAttributeValue(AXPropertyName::IsWidget); }
    Widget* widget() const final;
    PlatformWidget platformWidget() const final;
    Widget* widgetForAttachmentView() const final;
    bool isPlugin() const final { return boolAttributeValue(AXPropertyName::IsPlugin); }

    UncheckedKeyHashMap<String, AXEditingStyleValueVariant> resolvedEditingStyles() const final;
#if PLATFORM(COCOA)
    RemoteAXObjectRef remoteParentObject() const final;
    FloatRect convertRectToPlatformSpace(const FloatRect&, AccessibilityConversionSpace) const final;
#endif
    Page* page() const final;
    Document* document() const final;
    LocalFrameView* documentFrameView() const final;
    ScrollView* scrollView() const final;
    void detachFromParent() final;

    OptionSet<AXAncestorFlag> ancestorFlags() const;

    bool hasDocumentRoleAncestor() const final { return ancestorFlags().contains(AXAncestorFlag::HasDocumentRoleAncestor); }
    bool hasWebApplicationAncestor() const final { return ancestorFlags().contains(AXAncestorFlag::HasWebApplicationAncestor); }
    bool isInDescriptionListDetail() const final { return ancestorFlags().contains(AXAncestorFlag::IsInDescriptionListDetail); }
    bool isInDescriptionListTerm() const final { return ancestorFlags().contains(AXAncestorFlag::IsInDescriptionListTerm); }
    bool isInCell() const final { return ancestorFlags().contains(AXAncestorFlag::IsInCell); }

    String nameAttribute() const final { return stringAttributeValue(AXPropertyName::NameAttribute); }
#if PLATFORM(COCOA)
    bool hasApplePDFAnnotationAttribute() const final { return boolAttributeValue(AXPropertyName::HasApplePDFAnnotationAttribute); }
    RetainPtr<id> remoteFramePlatformElement() const final;
#endif
    bool hasRemoteFrameChild() const final { return boolAttributeValue(AXPropertyName::HasRemoteFrameChild); }

#if PLATFORM(COCOA) && ENABLE(MODEL_ELEMENT)
    Vector<RetainPtr<id>> modelElementChildren() final;
#endif
    
    void updateBackingStore() final;

    String innerHTML() const final;
    String outerHTML() const final;

    // FIXME: Make this a ThreadSafeWeakPtr<AXIsolatedTree>.
    RefPtr<AXIsolatedTree> m_cachedTree;
    Markable<AXID> m_parentID;
    bool m_childrenDirty { true };
    Vector<AXID> m_childrenIDs;
    Vector<Ref<AXCoreObject>> m_children;
    AXPropertyMap m_propertyMap;
    OptionSet<AXPropertyFlag> m_propertyFlags;
    // Some objects (e.g. display:contents) form their geometry through their children.
    bool m_getsGeometryFromChildren { false };

#if PLATFORM(COCOA)
    RetainPtr<NSView> m_platformWidget;
    RetainPtr<RemoteAXObjectRef> m_remoteParent;
#else
    PlatformWidget m_platformWidget;
#endif
};

template<typename T>
inline T AXIsolatedObject::propertyValue(AXPropertyName propertyName) const
{
    auto it = m_propertyMap.find(propertyName);
    if (it == m_propertyMap.end())
        return { };

    auto value = it->value;
    return WTF::switchOn(value,
        [] (T& typedValue) { return typedValue; },
        [] (auto&) { ASSERT_NOT_REACHED();
            return T(); }
    );
}

inline void AXIsolatedObject::setPropertyFlag(AXPropertyFlag flag, bool set)
{
    if (set)
        m_propertyFlags.add(flag);
    else
        m_propertyFlags.remove(flag);
}

inline bool AXIsolatedObject::hasPropertyFlag(AXPropertyFlag flag) const
{
    return m_propertyFlags.contains(flag);
}

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_ACCESSIBILITY(AXIsolatedObject, isAXIsolatedObjectInstance())

#endif // ENABLE((ACCESSIBILITY_ISOLATED_TREE))
