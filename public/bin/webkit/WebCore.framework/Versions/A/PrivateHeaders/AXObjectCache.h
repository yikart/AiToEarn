/*
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#pragma once

#include <wtf/Compiler.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_BEGIN

#include "AXGeometryManager.h"
#include "AXIsolatedTree.h"
#include "AXTextMarker.h"
#include "AXTextStateChangeIntent.h"
#include "AXTreeStore.h"
#include "AccessibilityObject.h"
#include "SimpleRange.h"
#include "StyleChange.h"
#include "Timer.h"
#include "VisibleUnits.h"
#include <limits.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/ListHashSet.h>
#include <wtf/WeakHashMap.h>
#include <wtf/WeakHashSet.h>
#include <wtf/text/MakeString.h>

WTF_ALLOW_UNSAFE_BUFFER_USAGE_END

OBJC_CLASS NSMutableArray;

namespace WTF {
class TextStream;
}

namespace WebCore {

class AXRemoteFrame;
class AccessibilityNodeObject;
class AccessibilityRenderObject;
class AccessibilityTable;
class AccessibilityTableCell;
class Document;
class HTMLAreaElement;
class HTMLDetailsElement;
class HTMLTableElement;
class HTMLTextFormControlElement;
class Node;
class Page;
class RenderBlock;
class RenderObject;
class RenderStyle;
class RenderText;
class RenderWidget;
class Scrollbar;
class ScrollView;
class VisiblePosition;
class Widget;

struct CharacterOffset {
    RefPtr<Node> node;
    int startIndex;
    int offset;
    int remainingOffset;

    CharacterOffset(Node* n = nullptr, int startIndex = 0, int offset = 0, int remaining = 0)
        : node(n)
        , startIndex(startIndex)
        , offset(offset)
        , remainingOffset(remaining)
    { }

    int remaining() const { return remainingOffset; }
    bool isNull() const { return !node; }
    bool isEqual(const CharacterOffset& other) const
    {
        if (isNull() || other.isNull())
            return false;
        return node == other.node && startIndex == other.startIndex && offset == other.offset;
    }

    String debugDescription()
    {
        return makeString("CharacterOffset {node: "_s, node ? node->debugDescription() : "null"_s, ", startIndex: "_s, startIndex, ", offset: "_s, offset, ", remainingOffset: "_s, remainingOffset, '}');
    }
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(AXComputedObjectAttributeCache);
class AXComputedObjectAttributeCache {
    WTF_MAKE_FAST_ALLOCATED_WITH_HEAP_IDENTIFIER(AXComputedObjectAttributeCache);
public:
    AccessibilityObjectInclusion getIgnored(AXID) const;
    void setIgnored(AXID, AccessibilityObjectInclusion);

private:
    struct CachedAXObjectAttributes {
        CachedAXObjectAttributes()
            : ignored(AccessibilityObjectInclusion::DefaultBehavior)
        { }

        AccessibilityObjectInclusion ignored;
    };

    UncheckedKeyHashMap<AXID, CachedAXObjectAttributes> m_idMapping;
};

struct VisiblePositionIndex {
    int value = -1;
    RefPtr<ContainerNode> scope;
};

struct VisiblePositionIndexRange {
    VisiblePositionIndex startIndex;
    VisiblePositionIndex endIndex;
    bool isNull() const { return startIndex.value == -1 || endIndex.value == -1; }
};

struct AXTreeData {
    String liveTree;
    String isolatedTree;
};

class AccessibilityReplacedText {
public:
    AccessibilityReplacedText() = default;
    AccessibilityReplacedText(const VisibleSelection&);
    void postTextStateChangeNotification(AXObjectCache*, AXTextEditType, const String&, const VisibleSelection&);
    const VisiblePositionIndexRange& replacedRange() { return m_replacedRange; }
protected:
    String m_replacedText;
    VisiblePositionIndexRange m_replacedRange;
};

#define WEBCORE_AXNOTIFICATION_KEYS_DEFAULT(macro) \
    macro(AccessKeyChanged) \
    macro(ActiveDescendantChanged) \
    macro(AnnouncementRequested) \
    macro(AutocorrectionOccured) \
    macro(AutofillTypeChanged) \
    macro(ARIAColumnIndexChanged) \
    macro(ARIARowIndexChanged) \
    macro(BrailleLabelChanged) \
    macro(BrailleRoleDescriptionChanged) \
    macro(CellSlotsChanged) \
    macro(CheckedStateChanged) \
    macro(ChildrenChanged) \
    macro(ColumnCountChanged) \
    macro(ColumnIndexChanged) \
    macro(ColumnSpanChanged) \
    macro(ContentEditableAttributeChanged) \
    macro(ControlledObjectsChanged) \
    macro(CurrentStateChanged) \
    macro(DescribedByChanged) \
    macro(DisabledStateChanged) \
    macro(DropEffectChanged) \
    macro(ExtendedDescriptionChanged) \
    macro(FlowToChanged) \
    macro(FocusableStateChanged) \
    macro(FocusedUIElementChanged) \
    macro(FrameLoadComplete) \
    macro(GrabbedStateChanged) \
    macro(HasPopupChanged) \
    macro(IdAttributeChanged) \
    macro(ImageOverlayChanged) \
    macro(IsAtomicChanged) \
    macro(KeyShortcutsChanged) \
    macro(LabelChanged) \
    macro(LanguageChanged) \
    macro(LayoutComplete) \
    macro(LevelChanged) \
    macro(LoadComplete) \
    macro(NameChanged) \
    macro(NewDocumentLoadComplete) \
    macro(PageScrolled) \
    macro(PlaceholderChanged) \
    macro(PopoverTargetChanged) \
    macro(PositionInSetChanged) \
    macro(RoleChanged) \
    macro(RoleDescriptionChanged) \
    macro(RowIndexChanged) \
    macro(RowSpanChanged) \
    macro(CellScopeChanged) \
    macro(SelectedChildrenChanged) \
    macro(SelectedCellsChanged) \
    macro(SelectedStateChanged) \
    macro(SelectedTextChanged) \
    macro(SetSizeChanged) \
    macro(TextCompositionBegan) \
    macro(TextCompositionEnded) \
    macro(URLChanged) \
    macro(ValueChanged) \
    macro(VisibilityChanged) \
    macro(ScrolledToAnchor) \
    macro(LiveRegionCreated) \
    macro(LiveRegionChanged) \
    macro(LiveRegionRelevantChanged) \
    macro(LiveRegionStatusChanged) \
    macro(MaximumValueChanged) \
    macro(MenuListItemSelected) \
    macro(MenuListValueChanged) \
    macro(MenuClosed) \
    macro(MenuOpened) \
    macro(MinimumValueChanged) \
    macro(MultiSelectableStateChanged) \
    macro(OrientationChanged) \
    macro(RowCountChanged) \
    macro(RowCollapsed) \
    macro(RowExpanded) \
    macro(ExpandedChanged) \
    macro(InvalidStatusChanged) \
    macro(PressDidSucceed) \
    macro(PressDidFail) \
    macro(PressedStateChanged) \
    macro(ReadOnlyStatusChanged) \
    macro(RequiredStatusChanged) \
    macro(SortDirectionChanged) \
    macro(TextChanged) \
    macro(TextCompositionChanged) \
    macro(TextUnderElementChanged) \
    macro(TextSecurityChanged) \
    macro(ElementBusyChanged) \
    macro(DraggingStarted) \
    macro(DraggingEnded) \
    macro(DraggingEnteredDropZone) \
    macro(DraggingDropped) \
    macro(DraggingExitedDropZone) \

#if ENABLE(AX_THREAD_TEXT_APIS)
#define WEBCORE_AXNOTIFICATION_KEYS(macro) \
    WEBCORE_AXNOTIFICATION_KEYS_DEFAULT(macro) \
    macro(TextRunsChanged)
#else
#define WEBCORE_AXNOTIFICATION_KEYS(macro) \
    WEBCORE_AXNOTIFICATION_KEYS_DEFAULT(macro)
#endif

enum class AXNotification {
#define WEBCORE_DEFINE_AXNOTIFICATION_ENUM(name) name,
WEBCORE_AXNOTIFICATION_KEYS(WEBCORE_DEFINE_AXNOTIFICATION_ENUM)
#undef WEBCORE_DEFINE_AXNOTIFICATION_ENUM
};

enum class AXLoadingEvent : uint8_t {
    Started,
    Reloaded,
    Failed,
    Finished
};

#if !PLATFORM(COCOA)
enum class AXTextChange : uint8_t { Inserted, Deleted, AttributesChanged };
#endif

enum class PostTarget { Element, ObservableParent };

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(AXObjectCache);
class AXObjectCache final : public CanMakeWeakPtr<AXObjectCache>, public CanMakeCheckedPtr<AXObjectCache>
    , public AXTreeStore<AXObjectCache> {
    WTF_MAKE_NONCOPYABLE(AXObjectCache);
    WTF_MAKE_TZONE_ALLOCATED(AXObjectCache);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(AXObjectCache);
    friend class AXIsolatedTree;
    friend class AXTextMarker;
    friend WTF::TextStream& operator<<(WTF::TextStream&, AXObjectCache&);
public:
    explicit AXObjectCache(Document&);
    ~AXObjectCache();

    // Returns the root object for the entire document.
    WEBCORE_EXPORT AXCoreObject* rootObject();
    // Returns the root object for a specific frame.
    WEBCORE_EXPORT AccessibilityObject* rootObjectForFrame(LocalFrame*);

    // Creation/retrieval of AX objects associated with a DOM or RenderTree object.
    inline AccessibilityObject* getOrCreate(RenderObject* renderer)
    {
        return renderer ? getOrCreate(*renderer) : nullptr;
    }
    AccessibilityObject* getOrCreate(RenderObject&);

    inline AccessibilityObject* getOrCreate(Widget* widget)
    {
        return widget ? getOrCreate(*widget) : nullptr;
    }
    AccessibilityObject* getOrCreate(Widget&);

    enum class IsPartOfRelation : bool { No, Yes };
    inline AccessibilityObject* getOrCreate(Node* node, IsPartOfRelation isPartOfRelation = IsPartOfRelation::No)
    {
        return node ? getOrCreate(*node, isPartOfRelation) : nullptr;
    }
    WEBCORE_EXPORT AccessibilityObject* getOrCreate(Node&, IsPartOfRelation = IsPartOfRelation::No);

    // used for objects without backing elements
    AccessibilityObject* create(AccessibilityRole);

    // Will only return the AccessibilityObject if it already exists.
    inline AccessibilityObject* get(RenderObject* renderer)
    {
        return renderer ? get(*renderer) : nullptr;
    }
    AccessibilityObject* get(RenderObject&) const;

    inline AccessibilityObject* get(Widget* widget) const
    {
        return widget ? get(*widget) : nullptr;
    }
    AccessibilityObject* get(Widget&) const;

    inline AccessibilityObject* get(Node* node) const
    {
        return node ? get(*node) : nullptr;
    }
    AccessibilityObject* get(Node&) const;

    void remove(RenderObject*);
    void remove(Node&);
    void remove(Widget*);
    void remove(std::optional<AXID>);

#if !PLATFORM(COCOA) && !USE(ATSPI)
    void detachWrapper(AXCoreObject*, AccessibilityDetachmentType);
#endif
private:
    using DOMObjectVariant = std::variant<std::nullptr_t, RenderObject*, Node*, Widget*>;
    void cacheAndInitializeWrapper(AccessibilityObject&, DOMObjectVariant = nullptr);
    void attachWrapper(AccessibilityObject&);

public:
    void onPageActivityStateChange(OptionSet<ActivityState>);
    void setPageActivityState(OptionSet<ActivityState> state) { m_pageActivityState = state; }
    OptionSet<ActivityState> pageActivityState() const { return m_pageActivityState; }

    void childrenChanged(Node*, Element* newChild = nullptr);
    void childrenChanged(RenderObject*, RenderObject* newChild = nullptr);
    void childrenChanged(AccessibilityObject*);
    void onEventListenerAdded(Node&, const AtomString& eventType);
    void onEventListenerRemoved(Node&, const AtomString& eventType);
    void onExpandedChanged(HTMLDetailsElement&);
    void onFocusChange(Element* oldElement, Element* newElement);
    void onInertOrVisibilityChange(RenderElement&);
    void onPopoverToggle(const HTMLElement&);
    void onScrollbarFrameRectChange(const Scrollbar&);
    void onSelectedChanged(Element&);
    void onStyleChange(Element&, Style::Change, const RenderStyle* oldStyle, const RenderStyle* newStyle);
    void onStyleChange(RenderText&, StyleDifference, const RenderStyle* oldStyle, const RenderStyle& newStyle);
    void onTextSecurityChanged(HTMLInputElement&);
    void onTitleChange(Document&);
    void onValidityChange(Element&);
    void onTextCompositionChange(Node&, CompositionState, bool, const String&, size_t, bool);
    void onWidgetVisibilityChanged(RenderWidget&);
    void valueChanged(Element&);
    void checkedStateChanged(Element&);
    void autofillTypeChanged(HTMLInputElement&);
    void handleRoleChanged(AccessibilityObject&);

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void columnIndexChanged(AccessibilityObject&);
    void rowIndexChanged(AccessibilityObject&);
#endif

    // Called when a RenderObject is created for an Element. Depending on the
    // presence of a RenderObject, we may have instatiated an AXRenderObject or
    // an AXNodeObject. This occurs when an Element with no renderer is
    // re-parented into a subtree that does have a renderer.
    void onRendererCreated(Element&);
#if PLATFORM(MAC)
    void onSelectedTextChanged(const VisiblePositionRange&);
#endif
#if ENABLE(AX_THREAD_TEXT_APIS)
    void onTextRunsChanged(const RenderObject&);
#endif
    void updateLoadingProgress(double);
    void loadingFinished() { updateLoadingProgress(1); }
    double loadingProgress() const { return m_loadingProgress; }

    struct AttributeChange {
        WeakPtr<Element, WeakPtrImplWithEventTargetData> element { nullptr };
        QualifiedName attrName;
        AtomString oldValue;
        AtomString newValue;
    };
    using DeferredCollection = std::variant<UncheckedKeyHashMap<Element*, String>
        , HashSet<AXID>
        , ListHashSet<Node*>
        , ListHashSet<Ref<AccessibilityObject>>
        , Vector<AttributeChange>
        , Vector<std::pair<Node*, Node*>>
        , WeakHashSet<Element, WeakPtrImplWithEventTargetData>
        , WeakHashSet<HTMLTableElement, WeakPtrImplWithEventTargetData>
        , WeakHashSet<AccessibilityObject>
        , WeakHashSet<AccessibilityTable>
        , WeakHashSet<AccessibilityTableCell>
        , WeakListHashSet<Node, WeakPtrImplWithEventTargetData>
        , WeakListHashSet<Element, WeakPtrImplWithEventTargetData>
        , WeakHashMap<Element, String, WeakPtrImplWithEventTargetData>>;
    void deferFocusedUIElementChangeIfNeeded(Node* oldFocusedNode, Node* newFocusedNode);
    void deferModalChange(Element&);
    void deferMenuListValueChange(Element*);
    void deferElementAddedOrRemoved(Element*);
    void handleScrolledToAnchor(const Node& anchorNode);
    void onScrollbarUpdate(ScrollView&);
    void onRemoteFrameInitialized(AXRemoteFrame&);

    bool isRetrievingCurrentModalNode() { return m_isRetrievingCurrentModalNode; }
    Node* modalNode();

    void deferAttributeChangeIfNeeded(Element&, const QualifiedName&, const AtomString&, const AtomString&);
    void recomputeIsIgnored(RenderObject&);
    void recomputeIsIgnored(Node*);

    static void enableAccessibility();
    static void disableAccessibility();
    static bool forceDeferredSpellChecking();
    static void setForceDeferredSpellChecking(bool);
#if PLATFORM(MAC)
    static bool shouldSpellCheck();
#else
    static bool shouldSpellCheck() { return true; }
#endif

    WEBCORE_EXPORT AccessibilityObject* focusedObjectForPage(const Page*);

    // Enhanced user interface accessibility can be toggled by the assistive technology.
    WEBCORE_EXPORT static void setEnhancedUserInterfaceAccessibility(bool flag);

    static bool accessibilityEnabled();
    WEBCORE_EXPORT static bool accessibilityEnhancedUserInterfaceEnabled();
#if ENABLE(AX_THREAD_TEXT_APIS)
    static bool useAXThreadTextApis() { return gAccessibilityThreadTextApisEnabled && !isMainThread(); }
#endif

    static bool forceInitialFrameCaching() { return gForceInitialFrameCaching; }
    WEBCORE_EXPORT static void setForceInitialFrameCaching(bool);
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    static bool shouldServeInitialCachedFrame();
#endif

    const Element* rootAXEditableElement(const Node*);
    bool elementIsTextControl(const Element&);

    AccessibilityObject* objectForID(const AXID id) const { return m_objects.get(id); }
    template<typename U> Vector<Ref<AXCoreObject>> objectsForIDs(const U&) const;
    Node* nodeForID(std::optional<AXID>) const;

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void onPaint(const RenderObject&, IntRect&&) const;
    void onPaint(const Widget&, IntRect&&) const;
#else
    NO_RETURN_DUE_TO_ASSERT void onPaint(const RenderObject&, IntRect&&) const { ASSERT_NOT_REACHED(); }
    NO_RETURN_DUE_TO_ASSERT void onPaint(const Widget&, IntRect&&) const { ASSERT_NOT_REACHED(); }
#endif

    // Text marker utilities.
    std::optional<TextMarkerData> textMarkerDataForVisiblePosition(const VisiblePosition&);
    TextMarkerData textMarkerDataForCharacterOffset(const CharacterOffset&);
    TextMarkerData textMarkerDataForNextCharacterOffset(const CharacterOffset&);
    AXTextMarker nextTextMarker(const AXTextMarker&);
    TextMarkerData textMarkerDataForPreviousCharacterOffset(const CharacterOffset&);
    AXTextMarker previousTextMarker(const AXTextMarker&);
    VisiblePosition visiblePositionForTextMarkerData(const TextMarkerData&);
    CharacterOffset characterOffsetForTextMarkerData(const TextMarkerData&);
    // Use ignoreNextNodeStart/ignorePreviousNodeEnd to determine the behavior when we are at node boundary.
    CharacterOffset nextCharacterOffset(const CharacterOffset&, bool ignoreNextNodeStart = true);
    CharacterOffset previousCharacterOffset(const CharacterOffset&, bool ignorePreviousNodeEnd = true);
    TextMarkerData startOrEndTextMarkerDataForRange(const SimpleRange&, bool);
    CharacterOffset startOrEndCharacterOffsetForRange(const SimpleRange&, bool, bool enterTextControls = false);
    AccessibilityObject* objectForTextMarkerData(const TextMarkerData&);
    std::optional<SimpleRange> rangeForUnorderedCharacterOffsets(const CharacterOffset&, const CharacterOffset&);
    static SimpleRange rangeForNodeContents(Node&);
    static unsigned lengthForRange(const SimpleRange&);

    // Word boundary
    CharacterOffset nextWordEndCharacterOffset(const CharacterOffset&);
    CharacterOffset previousWordStartCharacterOffset(const CharacterOffset&);
    std::optional<SimpleRange> leftWordRange(const CharacterOffset&);
    std::optional<SimpleRange> rightWordRange(const CharacterOffset&);
    
    // Paragraph
    std::optional<SimpleRange> paragraphForCharacterOffset(const CharacterOffset&);
    CharacterOffset nextParagraphEndCharacterOffset(const CharacterOffset&);
    CharacterOffset previousParagraphStartCharacterOffset(const CharacterOffset&);
    
    // Sentence
    std::optional<SimpleRange> sentenceForCharacterOffset(const CharacterOffset&);
    CharacterOffset nextSentenceEndCharacterOffset(const CharacterOffset&);
    CharacterOffset previousSentenceStartCharacterOffset(const CharacterOffset&);
    
    // Bounds
    CharacterOffset characterOffsetForPoint(const IntPoint&, AXCoreObject*);
    IntRect absoluteCaretBoundsForCharacterOffset(const CharacterOffset&);
    CharacterOffset characterOffsetForBounds(const IntRect&, bool);
    
    // Lines
    CharacterOffset endCharacterOffsetOfLine(const CharacterOffset&);
    CharacterOffset startCharacterOffsetOfLine(const CharacterOffset&);
    
    // Index
    CharacterOffset characterOffsetForIndex(int, const AXCoreObject*);

    void postNotification(RenderObject*, AXNotification, PostTarget = PostTarget::Element);
    void postNotification(Node*, AXNotification, PostTarget = PostTarget::Element);
    void postNotification(AccessibilityObject*, Document*, AXNotification, PostTarget = PostTarget::Element);
    void postNotification(AccessibilityObject* object, AXNotification notification)
    {
        if (object)
            postNotification(*object, notification);
    }
    void postNotification(AccessibilityObject&, AXNotification);
    // Requests clients to announce to the user the given message in the way they deem appropriate.
    WEBCORE_EXPORT void announce(const String&);

#ifndef NDEBUG
    void showIntent(const AXTextStateChangeIntent&);
#endif

    void setTextSelectionIntent(const AXTextStateChangeIntent&);
    void setIsSynchronizingSelection(bool);

    void postTextStateChangeNotification(Node*, AXTextEditType, const String&, const VisiblePosition&);
    void postTextReplacementNotification(Node*, AXTextEditType deletionType, const String& deletedText, AXTextEditType insertionType, const String& insertedText, const VisiblePosition&);
    void postTextReplacementNotificationForTextControl(HTMLTextFormControlElement&, const String& deletedText, const String& insertedText);
    void postTextStateChangeNotification(Node*, const AXTextStateChangeIntent&, const VisibleSelection&);
    void postTextStateChangeNotification(const Position&, const AXTextStateChangeIntent&, const VisibleSelection&);
    void postLiveRegionChangeNotification(AccessibilityObject&);

    void frameLoadingEventNotification(LocalFrame*, AXLoadingEvent);

    void prepareForDocumentDestruction(const Document&);

    void startCachingComputedObjectAttributesUntilTreeMutates();
    void stopCachingComputedObjectAttributes();

    AXComputedObjectAttributeCache* computedObjectAttributeCache() { return m_computedObjectAttributeCache.get(); }

    Document& document() const { return const_cast<Document&>(m_document.get()); }
    Ref<Document> protectedDocument() const;
    constexpr const std::optional<PageIdentifier>& pageID() const { return m_pageID; }

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void objectBecameIgnored(const AccessibilityObject& object)
    {
        if (RefPtr tree = AXIsolatedTree::treeForPageID(m_pageID))
            tree->objectBecameIgnored(object);
    }

    void objectBecameUnignored(const AccessibilityObject& object)
    {
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
        if (RefPtr tree = AXIsolatedTree::treeForPageID(m_pageID))
            tree->objectBecameUnignored(object);
#else
        UNUSED_PARAM(object);
#endif // ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    }
#endif // ENABLE(ACCESSIBILITY_ISOLATED_TREE)

#if PLATFORM(MAC)
    static void setShouldRepostNotificationsForTests(bool);
#endif
    void deferRecomputeIsIgnoredIfNeeded(Element*);
    void deferRecomputeIsIgnored(Element*);
    void deferRecomputeTableIsExposed(Element*);
    void deferRecomputeTableCellSlots(AccessibilityTable&);
    void deferTextChangedIfNeeded(Node*);
    void deferSelectedChildrenChangedIfNeeded(Element&);
    WEBCORE_EXPORT void performDeferredCacheUpdate(ForceLayout);
    void deferTextReplacementNotificationForTextControl(HTMLTextFormControlElement&, const String& previousValue);

    std::optional<SimpleRange> rangeMatchesTextNearRange(const SimpleRange&, const String&);

    static ASCIILiteral notificationPlatformName(AXNotification);

    AXTreeData treeData();

    enum class UpdateRelations : bool { No, Yes };
    // Returns the IDs of the objects that relate to the given object with the specified relationship.
    std::optional<ListHashSet<AXID>> relatedObjectIDsFor(const AXCoreObject&, AXRelationType, UpdateRelations = UpdateRelations::Yes);
    void updateRelations(Element&, const QualifiedName&);

#if PLATFORM(IOS_FAMILY)
    void relayNotification(const String&, RetainPtr<NSData>);
#endif

#if PLATFORM(MAC)
    static bool clientIsInTestMode();
#endif

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void scheduleObjectRegionsUpdate(bool scheduleImmediately = false) { m_geometryManager->scheduleObjectRegionsUpdate(scheduleImmediately); }
    void willUpdateObjectRegions() { m_geometryManager->willUpdateObjectRegions(); }
    WEBCORE_EXPORT static bool isIsolatedTreeEnabled();
    WEBCORE_EXPORT static void initializeAXThreadIfNeeded();
private:
    static bool clientSupportsIsolatedTree();
    AXCoreObject* isolatedTreeRootObject();
    // Propagates the root of the isolated tree back into the Core and WebKit.
    void setIsolatedTreeRoot(AXCoreObject*);
    void setIsolatedTreeFocusedObject(AccessibilityObject*);
    RefPtr<AXIsolatedTree> getOrCreateIsolatedTree();
    void buildIsolatedTree();
    void updateIsolatedTree(AccessibilityObject&, AXNotification);
    void updateIsolatedTree(AccessibilityObject*, AXNotification);
    void updateIsolatedTree(const Vector<std::pair<Ref<AccessibilityObject>, AXNotification>>&);
    void updateIsolatedTree(AccessibilityObject*, AXPropertyName) const;
    void updateIsolatedTree(AccessibilityObject&, AXPropertyName) const;
    void startUpdateTreeSnapshotTimer();
#endif

protected:
    void postPlatformNotification(AccessibilityObject&, AXNotification);
    void platformHandleFocusedUIElementChanged(Element* oldFocus, Element* newFocus);

    void platformPerformDeferredCacheUpdate();

#if PLATFORM(COCOA) || USE(ATSPI)
    void postTextStateChangePlatformNotification(AccessibilityObject*, const AXTextStateChangeIntent&, const VisibleSelection&);
    void postTextStateChangePlatformNotification(AccessibilityObject*, AXTextEditType, const String&, const VisiblePosition&);
    void postTextReplacementPlatformNotificationForTextControl(AccessibilityObject*, const String& deletedText, const String& insertedText);
    void postTextReplacementPlatformNotification(AccessibilityObject*, AXTextEditType, const String&, AXTextEditType, const String&, const VisiblePosition&);
#else // PLATFORM(COCOA) || USE(ATSPI)
    static AXTextChange textChangeForEditType(AXTextEditType);
    void nodeTextChangePlatformNotification(AccessibilityObject*, AXTextChange, unsigned, const String&);
#endif

#if PLATFORM(MAC)
    void postUserInfoForChanges(AccessibilityObject&, AccessibilityObject&, RetainPtr<NSMutableArray>);
#endif

#if PLATFORM(COCOA)
    WEBCORE_EXPORT void postPlatformAnnouncementNotification(const String&);
#else
    void postPlatformAnnouncementNotification(const String&) { }
#endif

    void frameLoadingEventPlatformNotification(AccessibilityObject*, AXLoadingEvent);
    void handleLabelChanged(AccessibilityObject*);

    // CharacterOffset functions.
    enum TraverseOption { TraverseOptionDefault = 1 << 0, TraverseOptionToNodeEnd = 1 << 1, TraverseOptionIncludeStart = 1 << 2, TraverseOptionValidateOffset = 1 << 3, TraverseOptionDoNotEnterTextControls = 1 << 4 };
    Node* nextNode(Node*) const;
    Node* previousNode(Node*) const;
    CharacterOffset traverseToOffsetInRange(const SimpleRange&, int, TraverseOption = TraverseOptionDefault, bool stayWithinRange = false);
public:
    VisiblePosition visiblePositionFromCharacterOffset(const CharacterOffset&);
protected:
    CharacterOffset characterOffsetFromVisiblePosition(const VisiblePosition&);
    char32_t characterAfter(const CharacterOffset&);
    char32_t characterBefore(const CharacterOffset&);
    CharacterOffset characterOffsetForNodeAndOffset(Node&, int, TraverseOption = TraverseOptionDefault);

    enum class NeedsContextAtParagraphStart : bool { No, Yes };
    CharacterOffset previousBoundary(const CharacterOffset&, BoundarySearchFunction, NeedsContextAtParagraphStart = NeedsContextAtParagraphStart::No);
    CharacterOffset nextBoundary(const CharacterOffset&, BoundarySearchFunction);
    CharacterOffset startCharacterOffsetOfWord(const CharacterOffset&, WordSide = WordSide::RightWordIfOnBoundary);
    CharacterOffset endCharacterOffsetOfWord(const CharacterOffset&, WordSide = WordSide::RightWordIfOnBoundary);
    CharacterOffset startCharacterOffsetOfParagraph(const CharacterOffset&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
    CharacterOffset endCharacterOffsetOfParagraph(const CharacterOffset&, EditingBoundaryCrossingRule = CannotCrossEditingBoundary);
    CharacterOffset startCharacterOffsetOfSentence(const CharacterOffset&);
    CharacterOffset endCharacterOffsetOfSentence(const CharacterOffset&);
    CharacterOffset characterOffsetForPoint(const IntPoint&);
    LayoutRect localCaretRectForCharacterOffset(RenderObject*&, const CharacterOffset&);
    bool shouldSkipBoundary(const CharacterOffset&, const CharacterOffset&);
private:
    AccessibilityObject* rootWebArea();

    // The AX focus is more finegrained than the notion of focused Node. This method handles those cases where the focused AX object is a descendant or a sub-part of the focused Node.
    AccessibilityObject* focusedObjectForNode(Node*);
    static AccessibilityObject* focusedImageMapUIElement(HTMLAreaElement&);

    void notificationPostTimerFired();

    void liveRegionChangedNotificationPostTimerFired();

    void focusCurrentModal();
    
    void performCacheUpdateTimerFired() { performDeferredCacheUpdate(ForceLayout::No); }

    void postTextStateChangeNotification(AccessibilityObject*, const AXTextStateChangeIntent&, const VisibleSelection&);

    bool enqueuePasswordValueChangeNotification(AccessibilityObject&);
    void passwordNotificationPostTimerFired();

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void selectedTextRangeTimerFired();
    Seconds platformSelectedTextRangeDebounceInterval() const;
    void updateTreeSnapshotTimerFired();
    void processQueuedIsolatedNodeUpdates();

    void deferAddUnconnectedNode(AccessibilityObject&);
#if PLATFORM(MAC)
    void createIsolatedObjectIfNeeded(AccessibilityObject&);
#endif
#endif // ENABLE(ACCESSIBILITY_ISOLATED_TREE)

    void deferRowspanChange(AccessibilityObject*);
    void handleChildrenChanged(AccessibilityObject&);
    void handleAllDeferredChildrenChanged();
    void handleRoleChanged(Element&, const AtomString&, const AtomString&);
    void handleRoleDescriptionChanged(Element&);
    void handleMenuOpened(Element&);
    void handleLiveRegionCreated(Element&);
    void handleMenuItemSelected(Element*);
    void handleTabPanelSelected(Element*, Element*);
    void handleRowCountChanged(AccessibilityObject*, Document*);
    void handleAttributeChange(Element*, const QualifiedName&, const AtomString&, const AtomString&);
    bool shouldProcessAttributeChange(Element*, const QualifiedName&);
    void selectedChildrenChanged(Node*);
    void selectedChildrenChanged(RenderObject*);
    void handleScrollbarUpdate(ScrollView&);
    void handleActiveDescendantChange(Element&, const AtomString&, const AtomString&);
    void handleAriaExpandedChange(Element&);
    enum class UpdateModal : bool { No, Yes };
    void handleFocusedUIElementChanged(Element* oldFocus, Element* newFocus, UpdateModal = UpdateModal::Yes);
    void handleMenuListValueChanged(Element&);
    void handleTextChanged(AccessibilityObject*);
    void handleRecomputeCellSlots(AccessibilityTable&);
#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    void handleRowspanChanged(AccessibilityTableCell&);
#endif

    // aria-modal or modal <dialog> related
    bool isModalElement(Element&) const;
    void findModalNodes();
    enum class WillRecomputeFocus : bool { No, Yes };
    void updateCurrentModalNode(WillRecomputeFocus = WillRecomputeFocus::No);
    bool isNodeVisible(Node*) const;
    bool modalElementHasAccessibleContent(Element&);

    // Relationships between objects.
    static Vector<QualifiedName>& relationAttributes();
    static AXRelationType attributeToRelationType(const QualifiedName&);
    enum class AddSymmetricRelation : bool { No, Yes };
    static AXRelationType symmetricRelation(AXRelationType);
    bool addRelation(Element&, Element&, AXRelationType);
    bool addRelation(AccessibilityObject*, AccessibilityObject*, AXRelationType, AddSymmetricRelation = AddSymmetricRelation::Yes);
    bool addRelation(Element&, const QualifiedName&);
    void addLabelForRelation(Element&);
    bool removeRelation(Element&, AXRelationType);
    void removeAllRelations(AXID);
    void removeRelationByID(AXID originID, AXID targetID, AXRelationType);
    void updateLabelFor(HTMLLabelElement&);
    void updateLabeledBy(Element*);
    void updateRelationsIfNeeded();
    void updateRelationsForTree(ContainerNode&);
    void relationsNeedUpdate(bool);
    void dirtyIsolatedTreeRelations();
    UncheckedKeyHashMap<AXID, AXRelations> relations();
    const HashSet<AXID>& relationTargetIDs();
    bool isDescendantOfRelatedNode(Node&);

#if PLATFORM(MAC)
    AXTextStateChangeIntent inferDirectionFromIntent(AccessibilityObject&, const AXTextStateChangeIntent&, const VisibleSelection&);
#endif

    // Object creation.
    Ref<AccessibilityRenderObject> createObjectFromRenderer(RenderObject&);
    Ref<AccessibilityNodeObject> createFromNode(Node&);

    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;
    const std::optional<PageIdentifier> m_pageID; // constant for object's lifetime.
    OptionSet<ActivityState> m_pageActivityState;
    UncheckedKeyHashMap<AXID, Ref<AccessibilityObject>> m_objects;

    // The pointers in these mapping HashMaps should never be dereferenced.
    UncheckedKeyHashMap<SingleThreadWeakRef<RenderObject>, AXID> m_renderObjectMapping;
    UncheckedKeyHashMap<SingleThreadWeakRef<Widget>, AXID> m_widgetObjectMapping;
    UncheckedKeyHashMap<WeakRef<Node, WeakPtrImplWithEventTargetData>, AXID> m_nodeObjectMapping;

    std::unique_ptr<AXComputedObjectAttributeCache> m_computedObjectAttributeCache;

    WEBCORE_EXPORT static std::atomic<bool> gAccessibilityEnabled;
    static bool gAccessibilityEnhancedUserInterfaceEnabled;
    WEBCORE_EXPORT static std::atomic<bool> gForceDeferredSpellChecking;

    // FIXME: since the following only affects the behavior of isolated objects, we should move it into AXIsolatedTree in order to keep this class main thread only.
    static std::atomic<bool> gForceInitialFrameCaching;

#if ENABLE(AX_THREAD_TEXT_APIS)
    // Accessed on and off the main thread.
    static std::atomic<bool> gAccessibilityThreadTextApisEnabled;
#endif

    Timer m_notificationPostTimer;
    Vector<std::pair<Ref<AccessibilityObject>, AXNotification>> m_notificationsToPost;

    Timer m_passwordNotificationPostTimer;

    ListHashSet<Ref<AccessibilityObject>> m_passwordNotificationsToPost;
    
    Timer m_liveRegionChangedPostTimer;
    ListHashSet<Ref<AccessibilityObject>> m_liveRegionObjects;

    WeakPtr<Element, WeakPtrImplWithEventTargetData> m_currentModalElement;
    // Multiple aria-modals behavior is undefined by spec. We keep them sorted based on DOM order here.
    Vector<WeakPtr<Element, WeakPtrImplWithEventTargetData>> m_modalElements;
    bool m_modalNodesInitialized { false };
    bool m_isRetrievingCurrentModalNode { false };

    Timer m_performCacheUpdateTimer;

    AXTextStateChangeIntent m_textSelectionIntent;
    // An object can be "replaced" when we create an AX object from the backing element before it has
    // attached a renderer, but then want to replace it with a new AX object after the renderer has been attached.
    HashSet<AXID> m_deferredReplacedObjects;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_deferredRecomputeIsIgnoredList;
    WeakHashSet<HTMLTableElement, WeakPtrImplWithEventTargetData> m_deferredRecomputeTableIsExposedList;
    WeakHashSet<AccessibilityTable> m_deferredRecomputeTableCellSlotsList;
    WeakHashSet<AccessibilityTableCell> m_deferredRowspanChanges;
    WeakListHashSet<Node, WeakPtrImplWithEventTargetData> m_deferredTextChangedList;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_deferredSelectedChildredChangedList;
    ListHashSet<Ref<AccessibilityObject>> m_deferredChildrenChangedList;
    WeakListHashSet<Element, WeakPtrImplWithEventTargetData> m_deferredElementAddedOrRemovedList;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_deferredModalChangedList;
    WeakHashSet<Element, WeakPtrImplWithEventTargetData> m_deferredMenuListChange;
    SingleThreadWeakHashSet<ScrollView> m_deferredScrollbarUpdateChangeList;
    WeakHashMap<Element, String, WeakPtrImplWithEventTargetData> m_deferredTextFormControlValue;
    Vector<AttributeChange> m_deferredAttributeChange;
    std::optional<std::pair<WeakPtr<Element, WeakPtrImplWithEventTargetData>, WeakPtr<Element, WeakPtrImplWithEventTargetData>>> m_deferredFocusedNodeChange;
    WeakHashSet<AccessibilityObject> m_deferredUnconnectedObjects;

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)
    Timer m_buildIsolatedTreeTimer;
    bool m_deferredRegenerateIsolatedTree { false };
    Ref<AXGeometryManager> m_geometryManager;
    DeferrableOneShotTimer m_selectedTextRangeTimer;
    Markable<AXID> m_lastDebouncedTextRangeObject;

    Timer m_updateTreeSnapshotTimer;
#endif
    bool m_isSynchronizingSelection { false };
    bool m_performingDeferredCacheUpdate { false };
    double m_loadingProgress { 0 };

    unsigned m_cacheUpdateDeferredCount { 0 };

    // Relationships between objects.
    UncheckedKeyHashMap<AXID, AXRelations> m_relations;
    bool m_relationsNeedUpdate { true };
    HashSet<AXID> m_relationTargets;
    UncheckedKeyHashMap<AXID, AXRelations> m_recentlyRemovedRelations;

#if USE(ATSPI)
    ListHashSet<RefPtr<AXCoreObject>> m_deferredParentChangedList;
#endif

#if PLATFORM(MAC)
    Markable<AXID> m_lastTextFieldAXID;
    VisibleSelection m_lastSelection;
#endif
};

template<typename U>
inline Vector<Ref<AXCoreObject>> AXObjectCache::objectsForIDs(const U& axIDs) const
{
    ASSERT(isMainThread());

    return WTF::compactMap(axIDs, [&](auto& axID) -> std::optional<Ref<AXCoreObject>> {
        if (auto* object = objectForID(axID))
            return Ref { *object };
        return std::nullopt;
    });
}

inline Node* AXObjectCache::nodeForID(std::optional<AXID> axID) const
{
    if (!axID)
        return nullptr;

    auto* object = m_objects.get(*axID);
    return object ? object->node() : nullptr;
}

inline bool AXObjectCache::accessibilityEnabled()
{
    return gAccessibilityEnabled;
}

inline void AXObjectCache::enableAccessibility()
{
    gAccessibilityEnabled = true;
}

inline void AXObjectCache::disableAccessibility()
{
    gAccessibilityEnabled = false;
}

inline bool AXObjectCache::forceDeferredSpellChecking()
{
    return gForceDeferredSpellChecking;
}

inline void AXObjectCache::setForceDeferredSpellChecking(bool shouldForce)
{
    gForceDeferredSpellChecking = shouldForce;
}

class AXAttributeCacheEnabler final
{
public:
    explicit AXAttributeCacheEnabler(AXObjectCache *cache);
    ~AXAttributeCacheEnabler();

private:
    AXObjectCache* m_cache;
    bool m_wasAlreadyCaching { false };
};

bool hasRole(Element&, StringView role);
bool hasAnyRole(Element&, Vector<StringView>&& roles);
bool hasAnyRole(Element*, Vector<StringView>&& roles);
bool hasCellARIARole(Element&);
bool hasPresentationRole(Element&);
bool hasTableRole(Element&);
bool isRowGroup(Element&);
bool isRowGroup(Node*);
ContainerNode* composedParentIgnoringDocumentFragments(Node&);
ContainerNode* composedParentIgnoringDocumentFragments(Node*);

// Returns true if the element has an attribute that will result in an accname being computed.
// https://www.w3.org/TR/accname-1.2/
bool hasAccNameAttribute(Element&);

bool isNodeFocused(Node&);

bool isRenderHidden(const RenderStyle*);
bool isRenderHidden(const RenderStyle&);

WTF::TextStream& operator<<(WTF::TextStream&, AXNotification);

} // namespace WebCore
