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

#if ENABLE(ACCESSIBILITY_ISOLATED_TREE)

#include "AXCoreObject.h"
#include "AXTextMarker.h"
#include "AXTextRun.h"
#include "AXTreeStore.h"
#include "ColorHash.h"
#include "PageIdentifier.h"
#include "RenderStyleConstants.h"
#include <wtf/HashMap.h>
#include <wtf/Lock.h>
#include <wtf/RefPtr.h>
#include <wtf/RetainPtr.h>
#include <wtf/RuntimeApplicationChecks.h>
#include <wtf/ThreadSafeRefCounted.h>
#include <wtf/ThreadSafeWeakPtr.h>

namespace WTF {
class TextStream;
}

namespace WebCore {

class AXIsolatedObject;
class AXGeometryManager;
class AXObjectCache;
class AccessibilityObject;
class Page;
enum class AXStreamOptions : uint8_t;

// The most common boolean properties are stored in a bitfield rather than in a UncheckedKeyHashMap.
// If you edit these, update AXIsolatedObject::boolAttributeValue and AXIsolatedObject::setProperty.
enum class AXPropertyFlag : uint32_t {
    CanSetFocusAttribute                          = 1 << 0,
    CanSetSelectedAttribute                       = 1 << 1,
    CanSetValueAttribute                          = 1 << 2,
    HasBoldFont                                   = 1 << 3,
    HasItalicFont                                 = 1 << 4,
    HasPlainText                                  = 1 << 5,
    IsEnabled                                     = 1 << 6,
    IsExposedTableCell                            = 1 << 7,
    IsGrabbed                                     = 1 << 8,
    IsIgnored                                     = 1 << 9,
    IsInlineText                                  = 1 << 10,
    IsKeyboardFocusable                           = 1 << 11,
    IsNonLayerSVGObject                           = 1 << 12,
    IsTableColumn                                 = 1 << 13,
    IsTableRow                                    = 1 << 14,
    SupportsCheckedState                          = 1 << 15,
    SupportsDragging                              = 1 << 16,
    SupportsExpanded                              = 1 << 17,
    SupportsPath                                  = 1 << 18,
    SupportsPosInSet                              = 1 << 19,
    SupportsSetSize                               = 1 << 20
};

enum class AXPropertyName : uint16_t {
    ARIATreeRows,
    AttributedText,
    AXColumnCount,
    AXColumnIndex,
    AXRowCount,
    AXRowIndex,
    AccessKey,
    AccessibilityText,
    ActionVerb,
    AncestorFlags,
    AutoCompleteValue,
    BackgroundColor,
    BlockquoteLevel,
    BrailleLabel,
    BrailleRoleDescription,
    ButtonState,
    CanBeMultilineTextField,
    CanSetFocusAttribute,
    CanSetSelectedAttribute,
    CanSetValueAttribute,
#if PLATFORM(MAC)
    CaretBrowsingEnabled,
#endif
    Cells,
    CellScope,
    CellSlots,
    ColorValue,
    Columns,
    ColumnHeader,
    ColumnIndex,
    ColumnIndexRange,
    CurrentState,
    DateTimeComponentsType,
    DateTimeValue,
    DatetimeAttributeValue,
    DecrementButton,
    Description,
    DisclosedByRow,
    DisclosedRows,
    DocumentEncoding,
    DocumentLinks,
    DocumentURI,
    EmbeddedImageDescription,
    EmitTextAfterBehavior,
    ExpandedTextValue,
    ExtendedDescription,
#if PLATFORM(COCOA)
    Font,
#endif
    TextColor,
    HasApplePDFAnnotationAttribute,
    HasBoldFont,
    HasBodyTag,
    HasClickHandler,
    HasHighlighting,
    HasItalicFont,
    HasLinethrough,
    HasMarkTag,
    HasPlainText,
    HasRemoteFrameChild,
    IsSubscript,
    IsSuperscript,
    HasTextShadow,
    HasUnderline,
    HeaderContainer,
    HeadingLevel,
    HierarchicalLevel,
    HorizontalScrollBar,
    IdentifierAttribute,
    IncrementButton,
    InitialFrameRect,
    InnerHTML,
    InternalLinkElement,
    InsideLink,
    InvalidStatus,
    IsGrabbed,
    IsARIATreeGridRow,
    IsAttachment,
    IsBusy,
    IsChecked,
    IsColumnHeader,
    IsEnabled,
    IsExpanded,
    IsExposable,
    IsExposedTableCell,
    IsFieldset,
    IsFileUploadButton,
    IsIgnored,
    IsIndeterminate,
    IsInlineText,
    IsRadioInput,
    IsInputImage,
    IsKeyboardFocusable,
    IsListBox,
    IsMathElement,
    IsMathFraction,
    IsMathFenced,
    IsMathSubscriptSuperscript,
    IsMathRow,
    IsMathUnderOver,
    IsMathRoot,
    IsMathSquareRoot,
    IsMathTable,
    IsMathTableRow,
    IsMathTableCell,
    IsMathMultiscript,
    IsMathToken,
    IsMultiSelectable,
    IsNonLayerSVGObject,
    IsPlugin,
    IsPressed,
    IsRequired,
    IsRowHeader,
    IsSecureField,
    IsSelected,
    IsSelectedOptionActive,
    IsTable,
    IsTableColumn,
    IsTableRow,
    IsTree,
    IsTreeItem,
    IsValueAutofillAvailable,
    IsVisible,
    IsWidget,
    KeyShortcuts,
    Language,
    LinethroughColor,
    LiveRegionAtomic,
    LiveRegionRelevant,
    LiveRegionStatus,
    LocalizedActionVerb,
    MathFencedOpenString,
    MathFencedCloseString,
    MathLineThickness,
    MathPrescripts,
    MathPostscripts,
    MathRadicand,
    MathRootIndexObject,
    MathUnderObject,
    MathOverObject,
    MathNumeratorObject,
    MathDenominatorObject,
    MathBaseObject,
    MathSubscriptObject,
    MathSuperscriptObject,
    MaxValueForRange,
    MinValueForRange,
    NameAttribute,
    Orientation,
    OuterHTML,
    Path,
    PlaceholderValue,
    PopupValue,
    PosInSet,
    PreventKeyboardDOMEventDispatch,
    RadioButtonGroup,
    RelativeFrame,
    RemoteFrameOffset,
    RemoteFramePlatformElement,
    RoleValue,
    RolePlatformString,
    RoleDescription,
    Rows,
    RowGroupAncestorID,
    RowHeader,
    RowHeaders,
    RowIndex,
    RowIndexRange,
    ScreenRelativePosition,
    SelectedChildren,
    SelectedTextRange,
    SetSize,
    SortDirection,
    SpeechHint,
    StringValue,
    SubrolePlatformString,
    SupportsDragging,
    SupportsDropping,
    SupportsARIAOwns,
    SupportsCheckedState,
    SupportsCurrent,
    SupportsDatetimeAttribute,
    SupportsExpanded,
    SupportsExpandedTextValue,
    SupportsKeyShortcuts,
    SupportsPath,
    SupportsPosInSet,
    SupportsRangeValue,
    SupportsSetSize,
    TextContent,
    TextInputMarkedTextMarkerRange,
#if ENABLE(AX_THREAD_TEXT_APIS)
    TextRuns,
#endif
    Title,
    TitleAttributeValue,
    URL,
    UnderlineColor,
    ValueAutofillButtonType,
    ValueDescription,
    ValueForRange,
    VerticalScrollBar,
    VisibleChildren,
    VisibleRows,
};
WTF::TextStream& operator<<(WTF::TextStream&, AXPropertyName);

using AXPropertyNameSet = HashSet<AXPropertyName, IntHash<AXPropertyName>, WTF::StrongEnumHashTraits<AXPropertyName>>;

// If this type is modified, the switchOn statment in AXIsolatedObject::setProperty must be updated as well.
using AXPropertyValueVariant = std::variant<std::nullptr_t, Markable<AXID>, String, bool, int, unsigned, double, float, uint64_t, WallTime, DateComponentsType, AccessibilityButtonState, Color, std::shared_ptr<URL>, LayoutRect, FloatPoint, FloatRect, IntPoint, IntRect, std::pair<unsigned, unsigned>, Vector<AccessibilityText>, Vector<AXID>, Vector<std::pair<Markable<AXID>, Markable<AXID>>>, Vector<String>, std::shared_ptr<Path>, OptionSet<AXAncestorFlag>, InsideLink, Vector<Vector<Markable<AXID>>>, CharacterRange, std::pair<Markable<AXID>, CharacterRange>
#if PLATFORM(COCOA)
    , RetainPtr<NSAttributedString>
    , RetainPtr<id>
#endif
#if ENABLE(AX_THREAD_TEXT_APIS)
    , RetainPtr<CTFontRef>
    , AXTextRuns
    , TextEmissionBehavior
#endif
>;
using AXPropertyMap = UncheckedKeyHashMap<AXPropertyName, AXPropertyValueVariant, IntHash<AXPropertyName>, WTF::StrongEnumHashTraits<AXPropertyName>>;
WTF::TextStream& operator<<(WTF::TextStream&, const AXPropertyMap&);

struct AXPropertyChange {
    AXID axID; // ID of the object whose properties changed.
    AXPropertyMap properties; // Changed properties.
};

struct NodeUpdateOptions {
    AXPropertyNameSet properties;
    bool shouldUpdateNode { false };
    bool shouldUpdateChildren { false };

    NodeUpdateOptions(const AXPropertyNameSet& propertyNames, bool shouldUpdateNode, bool shouldUpdateChildren)
        : properties(propertyNames)
        , shouldUpdateNode(shouldUpdateNode)
        , shouldUpdateChildren(shouldUpdateChildren)
    { }

    NodeUpdateOptions(const AXPropertyNameSet& propertyNames)
        : properties(propertyNames)
    { }

    NodeUpdateOptions(AXPropertyName propertyName)
        : properties({ propertyName })
    { }

    static NodeUpdateOptions nodeUpdate()
    {
        return { { }, true, false };
    }

    static NodeUpdateOptions childrenUpdate()
    {
        return { { }, false, true };
    }
};

DECLARE_ALLOCATOR_WITH_HEAP_IDENTIFIER(AXIsolatedTree);
class AXIsolatedTree : public ThreadSafeRefCountedAndCanMakeThreadSafeWeakPtr<AXIsolatedTree>
    , public AXTreeStore<AXIsolatedTree> {
    WTF_MAKE_NONCOPYABLE(AXIsolatedTree);
    WTF_MAKE_TZONE_ALLOCATED(AXIsolatedTree);
    friend WTF::TextStream& operator<<(WTF::TextStream&, AXIsolatedTree&);
    friend void streamIsolatedSubtreeOnMainThread(TextStream&, const AXIsolatedTree&, AXID, const OptionSet<AXStreamOptions>&);
public:
    static Ref<AXIsolatedTree> create(AXObjectCache&);
    // Creates a tree consisting of only the Scrollview and the WebArea objects. This tree is used as a temporary placeholder while the whole tree is being built.
    static Ref<AXIsolatedTree> createEmpty(AXObjectCache&);
    constexpr bool isEmptyContentTree() const { return m_isEmptyContentTree; }
    virtual ~AXIsolatedTree();

    static void removeTreeForPageID(PageIdentifier);

    static RefPtr<AXIsolatedTree> treeForPageID(std::optional<PageIdentifier>);
    static RefPtr<AXIsolatedTree> treeForPageID(PageIdentifier);
    AXObjectCache* axObjectCache() const;
    constexpr AXGeometryManager* geometryManager() const { return m_geometryManager.get(); }

    AXIsolatedObject* rootNode() { return m_rootNode.get(); }
    RefPtr<AXIsolatedObject> rootWebArea();
    std::optional<AXID> focusedNodeID();
    WEBCORE_EXPORT RefPtr<AXIsolatedObject> focusedNode();

    AXIsolatedObject* objectForID(AXID) const;
    inline AXIsolatedObject* objectForID(std::optional<AXID> axID) const
    {
        return axID ? objectForID(*axID) : nullptr;
    }
    template<typename U> Vector<Ref<AXCoreObject>> objectsForIDs(const U&);

    void generateSubtree(AccessibilityObject&);
    bool shouldCreateNodeChange(AccessibilityObject&);
    void updateNode(AccessibilityObject&);
    enum class ResolveNodeChanges : bool { No, Yes };
    void updateChildren(AccessibilityObject&, ResolveNodeChanges = ResolveNodeChanges::Yes);
    void updateChildrenForObjects(const ListHashSet<Ref<AccessibilityObject>>&);
    void updateNodeProperty(AccessibilityObject& object, AXPropertyName property) { updateNodeProperties(object, { property }); }
    void updateNodeProperties(AccessibilityObject&, const AXPropertyNameSet&);
    void updateNodeProperties(AccessibilityObject* axObject, const AXPropertyNameSet& properties)
    {
        if (axObject)
            updateNodeProperties(*axObject, properties);
    }
    void updateDependentProperties(AccessibilityObject&);
    void updatePropertiesForSelfAndDescendants(AccessibilityObject&, const AXPropertyNameSet&);
    void updateFrame(AXID, IntRect&&);
    void updateRootScreenRelativePosition();
    void overrideNodeProperties(AXID, AXPropertyMap&&);

    double loadingProgress();
    void updateLoadingProgress(double);

    void addUnconnectedNode(Ref<AccessibilityObject>);
    bool isUnconnectedNode(std::optional<AXID> axID) const { return axID && m_unconnectedNodes.contains(*axID); }
    // Removes the corresponding isolated object and all descendants from the m_nodeMap and queues their removal from the tree.
    void removeNode(const AccessibilityObject&);
    // Removes the given node and all its descendants from m_nodeMap.
    void removeSubtreeFromNodeMap(std::optional<AXID>, AccessibilityObject*);

    void objectBecameIgnored(const AccessibilityObject& object)
    {
#if !ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
        // When an object becomes ignored, we should immediately remove it from the nodemap.
        // This is critical because objects can become ignored at any point, including in the
        // middle of AXObjectCache::handleChildrenChanged(). Consider this tree structure:
        //   <main> (not ignored)
        //   ++<div> (not ignored)
        // Imagine <div> gains new children, and we run handleChildrenChanged() for it. However,
        // it becomes ignored in the middle of handleChildrenChanged(). We will still call
        // AXIsolatedTree::updateChildren for this <div>, and because it isn't yet removed from
        // the nodemap, we will run the children update on the <div> rather than the <main>.
        // Eagerly removing <div> from the nodemap when it becomes ignored prevents this by
        // allowing us to ascend up the nodemap to the <main>, which can properly scoop up <div>s children.

        // Note that this problem is only relevant in a world where !ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE),
        // because when that flag is on, is-ignored doesn't matter when building the core-tree.

        // Normally, when removing things from the nodemap, we want to use removeSubtreeFromNodeMap because
        // it removes both the given object, and all its descendants, as the descendants should not be in the
        // tree without some parent. However, when something becomes ignored, those descendants still exist,
        // just with a different parent (the next unignored ancestor). So we can safely only remove the given
        // object from the nodemap, and rely on the normal updateChildren flow to repair parent relationships
        // as needed.
        m_nodeMap.remove(object.objectID());
        // Any queued parent updates no longer need to happen (and if we do try to process them, we'll crash,
        // since this object is no longer in the node map).
        m_needsParentUpdate.remove(object.objectID());
#endif // !ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)

#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
        objectChangedIgnoredState(object);
        queueNodeUpdate(object.objectID(), { AXPropertyName::IsIgnored });
#endif // ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    }
    void objectBecameUnignored(const AccessibilityObject& object)
    {
#if ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
        // We only cache minimal properties for ignored objects, so do a full node update to ensure all properties are cached.
        queueNodeUpdate(object.objectID(), NodeUpdateOptions::nodeUpdate());
        objectChangedIgnoredState(object);
#else
        UNUSED_PARAM(object);
#endif // ENABLE(INCLUDE_IGNORED_IN_CORE_AX_TREE)
    }

    // Both setPendingRootNodeLocked and setFocusedNodeID are called during the generation
    // of the IsolatedTree.
    // Focused node updates in AXObjectCache use setFocusNodeID.
    void setPendingRootNodeLocked(AXIsolatedObject&) WTF_REQUIRES_LOCK(m_changeLogLock);
    void setFocusedNodeID(std::optional<AXID>);
    void applyPendingRootNode();

    // Relationships between objects.
    std::optional<ListHashSet<AXID>> relatedObjectIDsFor(const AXIsolatedObject&, AXRelationType);
    void relationsNeedUpdate(bool needUpdate) { m_relationsNeedUpdate = needUpdate; }
    void updateRelations(const UncheckedKeyHashMap<AXID, AXRelations>&);

    // Called on AX thread from WebAccessibilityObjectWrapper methods.
    // During layout tests, it is called on the main thread.
    void applyPendingChanges();

    constexpr AXID treeID() const { return m_id; }
    constexpr ProcessID processID() const { return m_processID; }
    void setPageActivityState(OptionSet<ActivityState>);
    OptionSet<ActivityState> pageActivityState() const;
    // Use only if the s_storeLock is already held like in findAXTree.
    WEBCORE_EXPORT OptionSet<ActivityState> lockedPageActivityState() const;

    AXTextMarkerRange selectedTextMarkerRange();
    void setSelectedTextMarkerRange(AXTextMarkerRange&&);

    void queueNodeUpdate(AXID, const NodeUpdateOptions&);
    void processQueuedNodeUpdates();

#if ENABLE(AX_THREAD_TEXT_APIS)
    AXTextMarker firstMarker();
    AXTextMarker lastMarker();
#endif

private:
    AXIsolatedTree(AXObjectCache&);
    static void storeTree(AXObjectCache&, const Ref<AXIsolatedTree>&);
    void reportLoadingProgress(double);

    // Queue this isolated tree up to destroy itself on the secondary thread.
    // We can't destroy the tree on the main-thread (by removing all `Ref`s to it)
    // because it could be being used by the secondary thread to service an AX request.
    void queueForDestruction();

    static UncheckedKeyHashMap<PageIdentifier, Ref<AXIsolatedTree>>& treePageCache() WTF_REQUIRES_LOCK(s_storeLock);

    void createEmptyContent(AccessibilityObject&);
    constexpr bool isUpdatingSubtree() const { return m_rootOfSubtreeBeingUpdated; }
    constexpr void updatingSubtree(AccessibilityObject* axObject) { m_rootOfSubtreeBeingUpdated = axObject; }

    enum class AttachWrapper : bool { OnMainThread, OnAXThread };
    struct NodeChange {
        Ref<AXIsolatedObject> isolatedObject;
#if PLATFORM(COCOA)
        RetainPtr<AccessibilityObjectWrapper> wrapper;
#elif USE(ATSPI)
        RefPtr<AccessibilityObjectWrapper> wrapper;
#endif
        AttachWrapper attachWrapper { AttachWrapper::OnMainThread };
    };

    std::optional<NodeChange> nodeChangeForObject(Ref<AccessibilityObject>, AttachWrapper = AttachWrapper::OnMainThread);
    void collectNodeChangesForSubtree(AccessibilityObject&);
    bool isCollectingNodeChanges() const { return m_collectingNodeChangesAtTreeLevel > 0; }
    void queueChange(const NodeChange&) WTF_REQUIRES_LOCK(m_changeLogLock);
    void queueRemovals(Vector<AXID>&&);
    void queueRemovalsLocked(Vector<AXID>&&) WTF_REQUIRES_LOCK(m_changeLogLock);
    void queueRemovalsAndUnresolvedChanges();
    Vector<NodeChange> resolveAppends();
    void queueAppendsAndRemovals(Vector<NodeChange>&&, Vector<AXID>&&);

    void objectChangedIgnoredState(const AccessibilityObject&);

    const ProcessID m_processID { legacyPresentingApplicationPID() };
    unsigned m_maxTreeDepth { 0 };
    WeakPtr<AXObjectCache> m_axObjectCache;
    OptionSet<ActivityState> m_pageActivityState;
    RefPtr<AXGeometryManager> m_geometryManager;
    bool m_isEmptyContentTree { false };
    // Reference to a temporary, empty content tree that this tree will replace. Used for updating the empty content tree while this is built.
    RefPtr<AXIsolatedTree> m_replacingTree;
    RefPtr<AccessibilityObject> m_rootOfSubtreeBeingUpdated;

    // Stores the parent ID and children IDs for a given IsolatedObject.
    struct ParentChildrenIDs {
        Markable<AXID> parentID;
        Vector<AXID> childrenIDs;
    };
    // Only accessed on the main thread.
    // A representation of the tree's parent-child relationships. Each
    // IsolatedObject must have one and only one entry in this map, that maps
    // its ObjectID to its ParentChildrenIDs struct.
    UncheckedKeyHashMap<AXID, ParentChildrenIDs> m_nodeMap;

    // Only accessed on the main thread.
    // Stores all nodes that are added via addUnconnectedNode, which do not get stored in m_nodeMap.
    HashSet<AXID> m_unconnectedNodes;

    // Only accessed on the main thread.
    // The key is the ID of the object that will be resolved into an m_pendingAppends NodeChange.
    // The value is whether the wrapper should be attached on the main thread or the AX thread.
    UncheckedKeyHashMap<AXID, AttachWrapper> m_unresolvedPendingAppends;
    // Only accessed on the main thread.
    // While performing tree updates, we append nodes to this list that are no longer connected
    // in the tree and should be removed. This list turns into m_pendingSubtreeRemovals when
    // handed off to the secondary thread.
    Vector<AXID> m_subtreesToRemove;
    // Only accessed on the main thread.
    // This is used when updating the isolated tree in response to dynamic children changes.
    // It is required to protect objects from being incorrectly deleted when they are re-parented,
    // as the original parent will want to queue it for removal, but we need to keep the object around
    // for the new parent.
    HashSet<AXID> m_protectedFromDeletionIDs;
    // Only accessed on the main thread.
    // Objects whose parent has changed, and said change needs to be synced to the secondary thread.
    HashSet<AXID> m_needsParentUpdate;
    // 1-based tree level, 0 = not collecting. Only accessed on the main thread.
    unsigned m_collectingNodeChangesAtTreeLevel { 0 };

    // Only accessed on AX thread.
    UncheckedKeyHashMap<AXID, Ref<AXIsolatedObject>> m_readerThreadNodeMap;
    RefPtr<AXIsolatedObject> m_rootNode;

    // Written to by main thread under lock, accessed and applied by AX thread.
    RefPtr<AXIsolatedObject> m_pendingRootNode WTF_GUARDED_BY_LOCK(m_changeLogLock);
    Vector<NodeChange> m_pendingAppends WTF_GUARDED_BY_LOCK(m_changeLogLock); // Nodes to be added to the tree and platform-wrapped.
    Vector<AXPropertyChange> m_pendingPropertyChanges WTF_GUARDED_BY_LOCK(m_changeLogLock);
    Vector<AXID> m_pendingSubtreeRemovals WTF_GUARDED_BY_LOCK(m_changeLogLock); // Nodes whose subtrees are to be removed from the tree.
    Vector<std::pair<AXID, Vector<AXID>>> m_pendingChildrenUpdates WTF_GUARDED_BY_LOCK(m_changeLogLock);
    HashSet<AXID> m_pendingProtectedFromDeletionIDs WTF_GUARDED_BY_LOCK(m_changeLogLock);
    UncheckedKeyHashMap<AXID, AXID> m_pendingParentUpdates WTF_GUARDED_BY_LOCK(m_changeLogLock);
    Markable<AXID> m_pendingFocusedNodeID WTF_GUARDED_BY_LOCK(m_changeLogLock);
    bool m_queuedForDestruction WTF_GUARDED_BY_LOCK(m_changeLogLock) { false };
    Markable<AXID> m_focusedNodeID;
    std::atomic<double> m_loadingProgress { 0 };
    std::atomic<double> m_processingProgress { 1 };

    // Relationships between objects.
    UncheckedKeyHashMap<AXID, AXRelations> m_relations WTF_GUARDED_BY_LOCK(m_changeLogLock);
    // Set to true by the AXObjectCache and false by AXIsolatedTree.
    bool m_relationsNeedUpdate { true };

    Lock m_changeLogLock;
    AXTextMarkerRange m_selectedTextMarkerRange WTF_GUARDED_BY_LOCK(m_changeLogLock);

    // Queued node updates used for building a new tree snapshot.
    ListHashSet<AXID> m_needsUpdateChildren;
    ListHashSet<AXID> m_needsUpdateNode;
    UncheckedKeyHashMap<AXID, AXPropertyNameSet> m_needsPropertyUpdates;
};

inline AXObjectCache* AXIsolatedTree::axObjectCache() const
{
    ASSERT(isMainThread());
    return m_axObjectCache.get();
}

inline RefPtr<AXIsolatedTree> AXIsolatedTree::treeForPageID(std::optional<PageIdentifier> pageID)
{
    return pageID ? treeForPageID(*pageID) : nullptr;
}

template<typename U>
inline Vector<Ref<AXCoreObject>> AXIsolatedTree::objectsForIDs(const U& axIDs)
{
    ASSERT(!isMainThread());

    Vector<Ref<AXCoreObject>> result;
    result.reserveInitialCapacity(axIDs.size());
    for (const auto& axID : axIDs) {
        if (RefPtr object = objectForID(axID))
            result.append(object.releaseNonNull());
    }
    result.shrinkToFit();
    return result;
}

} // namespace WebCore

#endif
