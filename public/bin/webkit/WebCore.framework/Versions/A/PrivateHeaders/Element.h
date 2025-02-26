/*
 * Copyright (C) 1999 Lars Knoll (knoll@kde.org)
 *           (C) 1999 Antti Koivisto (koivisto@kde.org)
 *           (C) 2001 Peter Kelly (pmk@post.com)
 *           (C) 2001 Dirk Mueller (mueller@kde.org)
 * Copyright (C) 2003-2024 Apple Inc. All rights reserved.
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

#include "AXTextStateChangeIntent.h"
#include "ContainerNode.h"
#include "ElementIdentifier.h"
#include "EventOptions.h"
#include "FocusOptions.h"
#include "HitTestRequest.h"
#include "QualifiedName.h"
#include "RenderPtr.h"
#include "ScrollTypes.h"
#include "ShadowRootMode.h"
#include "SimulatedClickOptions.h"
#include "WebAnimationTypes.h"
#include <JavaScriptCore/Forward.h>

#define DUMP_NODE_STATISTICS 0

namespace JSC {
class JSGlobalObject;
class JSValue;
}

namespace WebCore {

class Attr;
class Attribute;
class AttributeIteratorAccessor;
class CustomElementDefaultARIA;
class CustomElementReactionQueue;
class CustomStateSet;
class DatasetDOMStringMap;
class DOMRect;
class DOMRectList;
class DOMTokenList;
class DeferredPromise;
class Document;
class ElementAnimationRareData;
class ElementData;
class ElementRareData;
class FormAssociatedCustomElement;
class FormListedElement;
class HTMLDocument;
class HTMLElement;
class HTMLFormControlElement;
class IntSize;
class JSCustomElementInterface;
class KeyframeEffectStack;
class KeyboardEvent;
class LocalFrame;
class Locale;
class PlatformKeyboardEvent;
class PlatformMouseEvent;
class PlatformWheelEvent;
class PopoverData;
class PseudoElement;
class RenderStyle;
class RenderTreePosition;
class SpaceSplitString;
class StylePropertyMap;
class StylePropertyMapReadOnly;
class Text;
class TrustedHTML;
class TrustedScript;
class TrustedScriptURL;
class UniqueElementData;
class ValidatedFormListedElement;
class WebAnimation;

#if ENABLE(ATTACHMENT_ELEMENT)
class AttachmentAssociatedElement;
#endif

enum class AnimationImpact : uint8_t;
enum class EventHandling : uint8_t;
enum class EventProcessing : uint8_t;
enum class FullscreenNavigationUI : uint8_t;
enum class FullscreenKeyboardLock : uint8_t;
enum class IsSyntheticClick : bool { No, Yes };
enum class ParserContentPolicy : uint8_t;
enum class ResolveURLs : uint8_t { No, NoExcludingURLsForPrivacy, Yes, YesExcludingURLsForPrivacy };
enum class SelectionRestorationMode : uint8_t;
enum class ShadowRootDelegatesFocus : bool { No, Yes };
enum class ShadowRootClonable : bool { No, Yes };
enum class ShadowRootSerializable : bool { No, Yes };
enum class VisibilityAdjustment : uint8_t;

// https://github.com/whatwg/html/pull/9841
enum class CommandType: uint8_t {
    Invalid,

    Custom,

    TogglePopover,
    HidePopover,
    ShowPopover,

    ShowModal,
    Close,
};

struct CheckVisibilityOptions;
struct FullscreenOptions;
struct GetAnimationsOptions;
struct GetHTMLOptions;
struct IntersectionObserverData;
struct KeyframeAnimationOptions;
struct PointerLockOptions;
struct ResizeObserverData;
struct ScrollIntoViewOptions;
struct ScrollToOptions;
struct SecurityPolicyViolationEventInit;
struct ShadowRootInit;

using ElementName = NodeName;
using ExplicitlySetAttrElementsMap = UncheckedKeyHashMap<QualifiedName, Vector<WeakPtr<Element, WeakPtrImplWithEventTargetData>>>;
using TrustedTypeOrString = std::variant<RefPtr<TrustedHTML>, RefPtr<TrustedScript>, RefPtr<TrustedScriptURL>, AtomString>;

// https://drafts.csswg.org/css-contain/#relevant-to-the-user
enum class ContentRelevancy : uint8_t {
    OnScreen = 1 << 0,
    Focused = 1 << 1,
    IsInTopLayer = 1 << 2,
    Selected = 1 << 3,
};

namespace Style {
class Resolver;
enum class Change : uint8_t;
struct PseudoElementIdentifier;
struct ResolutionContext;
struct ResolvedStyle;
}

class Element : public ContainerNode {
    WTF_MAKE_TZONE_OR_ISO_ALLOCATED(Element);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(Element);
public:
    static Ref<Element> create(const QualifiedName&, Document&);
    virtual ~Element();

    WEBCORE_EXPORT bool hasAttribute(const QualifiedName&) const;
    WEBCORE_EXPORT const AtomString& getAttribute(const QualifiedName&) const;
    AtomString getAttributeForBindings(const QualifiedName&, ResolveURLs = ResolveURLs::NoExcludingURLsForPrivacy) const;
    template<typename... QualifiedNames>
    inline const AtomString& getAttribute(const QualifiedName&, const QualifiedNames&...) const;
    WEBCORE_EXPORT ExceptionOr<void> setAttribute(const QualifiedName&, const AtomString& value, bool enforceTrustedTypes = false);
    void setAttributeWithoutOverwriting(const QualifiedName&, const AtomString& value);
    WEBCORE_EXPORT void setAttributeWithoutSynchronization(const QualifiedName&, const AtomString& value);
    void setSynchronizedLazyAttribute(const QualifiedName&, const AtomString& value);
    bool removeAttribute(const QualifiedName&);
    Vector<String> getAttributeNames() const;

    // Typed getters and setters for language bindings.
    WEBCORE_EXPORT int getIntegralAttribute(const QualifiedName& attributeName) const;
    WEBCORE_EXPORT void setIntegralAttribute(const QualifiedName& attributeName, int value);
    WEBCORE_EXPORT unsigned getUnsignedIntegralAttribute(const QualifiedName& attributeName) const;
    WEBCORE_EXPORT void setUnsignedIntegralAttribute(const QualifiedName& attributeName, unsigned value);
    WEBCORE_EXPORT RefPtr<Element> getElementAttribute(const QualifiedName& attributeName) const;
    WEBCORE_EXPORT void setElementAttribute(const QualifiedName& attributeName, Element* value);
    WEBCORE_EXPORT std::optional<Vector<Ref<Element>>> getElementsArrayAttribute(const QualifiedName& attributeName) const;
    WEBCORE_EXPORT void setElementsArrayAttribute(const QualifiedName& attributeName, std::optional<Vector<Ref<Element>>>&& value);
    static bool isElementReflectionAttribute(const Settings&, const QualifiedName&);
    static bool isElementsArrayReflectionAttribute(const QualifiedName&);

    WEBCORE_EXPORT void setUserInfo(JSC::JSGlobalObject&, JSC::JSValue);
    WEBCORE_EXPORT String userInfo() const;

    // Call this to get the value of an attribute that is known not to be the style
    // attribute or one of the SVG animatable attributes.
    inline bool hasAttributeWithoutSynchronization(const QualifiedName&) const;
    inline const AtomString& attributeWithoutSynchronization(const QualifiedName&) const;
    inline const AtomString& attributeWithDefaultARIA(const QualifiedName&) const;
    inline String attributeTrimmedWithDefaultARIA(const QualifiedName&) const;

    enum class TopLayerElementType : bool { Other, Popover };
    HTMLElement* topmostPopoverAncestor(TopLayerElementType topLayerType);

#if DUMP_NODE_STATISTICS
    bool hasNamedNodeMap() const;
#endif

    WEBCORE_EXPORT bool hasAttributes() const;

    // This variant will not update the potentially invalid attributes. To be used when not interested
    // in style attribute or one of the SVG animation attributes.
    bool hasAttributesWithoutUpdate() const;

    WEBCORE_EXPORT bool hasAttribute(const AtomString& qualifiedName) const;
    WEBCORE_EXPORT bool hasAttributeNS(const AtomString& namespaceURI, const AtomString& localName) const;

    WEBCORE_EXPORT const AtomString& getAttribute(const AtomString& qualifiedName) const;
    WEBCORE_EXPORT const AtomString& getAttributeNS(const AtomString& namespaceURI, const AtomString& localName) const;
    AtomString getAttributeForBindings(const AtomString& qualifiedName, ResolveURLs = ResolveURLs::NoExcludingURLsForPrivacy) const;
    inline AtomString getAttributeNSForBindings(const AtomString& namespaceURI, const AtomString& localName, ResolveURLs = ResolveURLs::NoExcludingURLsForPrivacy) const;

    WEBCORE_EXPORT ExceptionOr<void> setAttribute(const AtomString& qualifiedName, const AtomString& value);
    ExceptionOr<void> setAttribute(const AtomString& qualifiedName, const TrustedTypeOrString& value);
    unsigned validateAttributeIndex(unsigned index, const QualifiedName& qname) const;
    static ExceptionOr<QualifiedName> parseAttributeName(const AtomString& namespaceURI, const AtomString& qualifiedName);
    WEBCORE_EXPORT ExceptionOr<void> setAttributeNS(const AtomString& namespaceURI, const AtomString& qualifiedName, const AtomString& value);
    ExceptionOr<void> setAttributeNS(const AtomString& namespaceURI, const AtomString& qualifiedName, const TrustedTypeOrString& value);

    ExceptionOr<bool> toggleAttribute(const AtomString& qualifiedName, std::optional<bool> force);

    inline const AtomString& getIdAttribute() const;
    inline void setIdAttribute(const AtomString&);

    inline const AtomString& getNameAttribute() const;

    // Call this to get the value of the id attribute for style resolution purposes.
    // The value will already be lowercased if the document is in compatibility mode,
    // so this function is not suitable for non-style uses.
    inline const AtomString& idForStyleResolution() const;

    // Internal methods that assume the existence of attribute storage, one should use hasAttributes()
    // before calling them.
    inline AttributeIteratorAccessor attributesIterator() const;
    inline unsigned attributeCount() const;
    inline const Attribute& attributeAt(unsigned index) const;
    inline const Attribute* findAttributeByName(const QualifiedName&) const;
    inline unsigned findAttributeIndexByName(const QualifiedName&) const;
    inline unsigned findAttributeIndexByName(const AtomString&, bool shouldIgnoreAttributeCase) const;

    bool checkVisibility(const CheckVisibilityOptions&);

    WEBCORE_EXPORT void scrollIntoView(std::optional<std::variant<bool, ScrollIntoViewOptions>>&& arg);
    WEBCORE_EXPORT void scrollIntoView(bool alignToTop = true);
    WEBCORE_EXPORT void scrollIntoViewIfNeeded(bool centerIfNeeded = true);
    WEBCORE_EXPORT void scrollIntoViewIfNotVisible(bool centerIfNotVisible = true);

    void scrollBy(const ScrollToOptions&);
    void scrollBy(double x, double y);
    virtual void scrollTo(const ScrollToOptions&, ScrollClamping = ScrollClamping::Clamped, ScrollSnapPointSelectionMethod = ScrollSnapPointSelectionMethod::Closest, std::optional<FloatSize> originalScrollDelta = std::nullopt);
    void scrollTo(double x, double y);

    WEBCORE_EXPORT int offsetLeftForBindings();
    WEBCORE_EXPORT int offsetLeft();
    WEBCORE_EXPORT int offsetTopForBindings();
    WEBCORE_EXPORT int offsetTop();
    WEBCORE_EXPORT int offsetWidth();
    WEBCORE_EXPORT int offsetHeight();

    bool mayCauseRepaintInsideViewport(const IntRect* visibleRect = nullptr) const;

    // FIXME: Replace uses of offsetParent in the platform with calls
    // to the render layer and merge bindingsOffsetParent and offsetParent.
    WEBCORE_EXPORT RefPtr<Element> offsetParentForBindings();

    inline const Element* rootElement() const;

    Element* offsetParent();
    WEBCORE_EXPORT int clientLeft();
    WEBCORE_EXPORT int clientTop();
    WEBCORE_EXPORT int clientWidth();
    WEBCORE_EXPORT int clientHeight();

    virtual int scrollLeft();
    virtual int scrollTop();
    virtual void setScrollLeft(int);
    virtual void setScrollTop(int);
    virtual int scrollWidth();
    virtual int scrollHeight();

    // This updates layout, and has custom handling for SVG.
    WEBCORE_EXPORT IntRect boundsInRootViewSpace();
    // This does not update layout, and uses absoluteBoundingBoxRect().
    WEBCORE_EXPORT IntRect boundingBoxInRootViewCoordinates() const;

    WEBCORE_EXPORT std::optional<std::pair<CheckedPtr<RenderObject>, FloatRect>> boundingAbsoluteRectWithoutLayout() const;

    WEBCORE_EXPORT FloatRect boundingClientRect();

    WEBCORE_EXPORT Ref<DOMRectList> getClientRects();
    Ref<DOMRect> getBoundingClientRect();

    // Returns the absolute bounding box translated into screen coordinates.
    WEBCORE_EXPORT IntRect screenRect() const;

    WEBCORE_EXPORT bool removeAttribute(const AtomString& qualifiedName);
    WEBCORE_EXPORT bool removeAttributeNS(const AtomString& namespaceURI, const AtomString& localName);
    void removeAttributeForBindings(const AtomString& qualifiedName) { removeAttribute(qualifiedName); }
    void removeAttributeNSForBindings(const AtomString& namespaceURI, const AtomString& localName) { removeAttributeNS(namespaceURI, localName); }

    Ref<Attr> detachAttribute(unsigned index);

    WEBCORE_EXPORT RefPtr<Attr> getAttributeNode(const AtomString& qualifiedName);
    WEBCORE_EXPORT RefPtr<Attr> getAttributeNodeNS(const AtomString& namespaceURI, const AtomString& localName);
    WEBCORE_EXPORT ExceptionOr<RefPtr<Attr>> setAttributeNode(Attr&);
    WEBCORE_EXPORT ExceptionOr<RefPtr<Attr>> setAttributeNodeNS(Attr&);
    WEBCORE_EXPORT ExceptionOr<Ref<Attr>> removeAttributeNode(Attr&);

    RefPtr<Attr> attrIfExists(const QualifiedName&);
    Ref<Attr> ensureAttr(const QualifiedName&);

    const Vector<RefPtr<Attr>>& attrNodeList();

    const QualifiedName& tagQName() const { return m_tagName; }
#if ENABLE(JIT)
    static constexpr ptrdiff_t tagQNameMemoryOffset() { return OBJECT_OFFSETOF(Element, m_tagName); }
#endif
    String tagName() const { return nodeName(); }
    bool hasTagName(const QualifiedName& tagName) const { return m_tagName.matches(tagName); }
    bool hasTagName(const HTMLQualifiedName& tagName) const { return ContainerNode::hasTagName(tagName); }
    bool hasTagName(const MathMLQualifiedName& tagName) const { return ContainerNode::hasTagName(tagName); }
    inline bool hasTagName(const SVGQualifiedName& tagName) const;

    bool hasLocalName(const AtomString& other) const { return m_tagName.localName() == other; }

    const AtomString& localName() const final { return m_tagName.localName(); }
    const AtomString& prefix() const final { return m_tagName.prefix(); }
    const AtomString& namespaceURI() const final { return m_tagName.namespaceURI(); }

    const AtomString& localNameLowercase() const { return m_tagName.localNameLowercase(); }

    ElementName elementName() const { return m_tagName.nodeName(); }
    Namespace nodeNamespace() const { return m_tagName.nodeNamespace(); }

    ExceptionOr<void> setPrefix(const AtomString&) final;

    String nodeName() const override;

    Ref<Element> cloneElementWithChildren(TreeScope&);
    Ref<Element> cloneElementWithoutChildren(TreeScope&);

    void normalizeAttributes();

    WEBCORE_EXPORT void setBooleanAttribute(const QualifiedName& name, bool);

    // For exposing to DOM only.
    WEBCORE_EXPORT NamedNodeMap& attributes() const;

    enum class AttributeModificationReason : uint8_t { Directly, ByCloning, Parser };
    // This function is called whenever an attribute is added, changed or removed.
    // Do not call this function directly. notifyAttributeChanged() should be used instead
    // in order to update state dependent on attribute changes.
    virtual void attributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason = AttributeModificationReason::Directly);

    // Only called by the parser immediately after element construction.
    void parserSetAttributes(std::span<const Attribute>);

    bool isEventHandlerAttribute(const Attribute&) const;
    virtual FormListedElement* asFormListedElement();
    virtual ValidatedFormListedElement* asValidatedFormListedElement();
    virtual bool attributeContainsJavaScriptURL(const Attribute&) const;

#if ENABLE(ATTACHMENT_ELEMENT)
    virtual AttachmentAssociatedElement* asAttachmentAssociatedElement();
#endif

    // Remove attributes that might introduce scripting from the vector leaving the element unchanged.
    void stripScriptingAttributes(Vector<Attribute>&) const;

    const ElementData* elementData() const { return m_elementData.get(); }
    static constexpr ptrdiff_t elementDataMemoryOffset() { return OBJECT_OFFSETOF(Element, m_elementData); }
    inline UniqueElementData& ensureUniqueElementData();

    void synchronizeAllAttributes() const;

    // Clones attributes only.
    void cloneAttributesFromElement(const Element&);

    // Clones all attribute-derived data, including subclass specifics (through copyNonAttributeProperties.)
    void cloneDataFromElement(const Element&);

    virtual void didMoveToNewDocument(Document& oldDocument, Document& newDocument);

    bool hasEquivalentAttributes(const Element& other) const;

    virtual void copyNonAttributePropertiesFromElement(const Element&) { }

    virtual RenderPtr<RenderElement> createElementRenderer(RenderStyle&&, const RenderTreePosition&);
    virtual bool rendererIsNeeded(const RenderStyle&);
    virtual bool isReplaced(const RenderStyle&) const { return false; }

    inline ShadowRoot* shadowRoot() const; // Defined in ElementRareData.h
    RefPtr<ShadowRoot> shadowRootForBindings(JSC::JSGlobalObject&) const;

    WEBCORE_EXPORT ExceptionOr<ShadowRoot&> attachShadow(const ShadowRootInit&);
    ExceptionOr<ShadowRoot&> attachDeclarativeShadow(ShadowRootMode, ShadowRootDelegatesFocus, ShadowRootClonable, ShadowRootSerializable);

    WEBCORE_EXPORT ShadowRoot* userAgentShadowRoot() const;
    RefPtr<ShadowRoot> protectedUserAgentShadowRoot() const;
    WEBCORE_EXPORT ShadowRoot& ensureUserAgentShadowRoot();
    WEBCORE_EXPORT ShadowRoot& createUserAgentShadowRoot();

    void setIsDefinedCustomElement(JSCustomElementInterface&);
    void setIsFailedCustomElement();
    void setIsFailedOrPrecustomizedCustomElementWithoutClearingReactionQueue();
    void clearReactionQueueFromFailedCustomElement();
    void setIsCustomElementUpgradeCandidate();
    void enqueueToUpgrade(JSCustomElementInterface&);
    CustomElementReactionQueue* reactionQueue() const;

    CustomElementDefaultARIA& customElementDefaultARIA();
    CheckedRef<CustomElementDefaultARIA> checkedCustomElementDefaultARIA();
    CustomElementDefaultARIA* customElementDefaultARIAIfExists() const;

    bool isInActiveChain() const { return isUserActionElement() && isUserActionElementInActiveChain(); }
    bool active() const { return isUserActionElement() && isUserActionElementActive(); }
    bool hovered() const { return isUserActionElement() && isUserActionElementHovered(); }
    bool focused() const { return isUserActionElement() && isUserActionElementFocused(); }
    bool isBeingDragged() const { return isUserActionElement() && isUserActionElementDragged(); }
    bool hasFocusVisible() const { return isUserActionElement() && isUserActionElementHasFocusVisible(); }
    bool hasFocusWithin() const { return isUserActionElement() && isUserActionElementHasFocusWithin(); };

    virtual void setActive(bool = true, Style::InvalidationScope = Style::InvalidationScope::All);
    virtual void setHovered(bool = true, Style::InvalidationScope = Style::InvalidationScope::All, HitTestRequest = {});
    virtual void setFocus(bool, FocusVisibility = FocusVisibility::Invisible);
    void setBeingDragged(bool);
    void setHasFocusVisible(bool);
    void setHasFocusWithin(bool);
    void setHasTentativeFocus(bool);

    std::optional<int> tabIndexSetExplicitly() const;
    bool shouldBeIgnoredInSequentialFocusNavigation() const { return defaultTabIndex() < 0 && !supportsFocus(); }
    bool hasFocusableStyle() const;
    virtual bool supportsFocus() const;
    virtual bool isFocusable() const;
    virtual bool isKeyboardFocusable(KeyboardEvent*) const;
    virtual bool isMouseFocusable() const;

    virtual bool shouldUseInputMethod();

    virtual int tabIndexForBindings() const;
    WEBCORE_EXPORT void setTabIndexForBindings(int);

    // Used by the HTMLElement and SVGElement IDLs.
    WEBCORE_EXPORT const AtomString& nonce() const;
    WEBCORE_EXPORT void setNonce(const AtomString&);
    inline void hideNonce(); // Defined in ElementInlines.h.

    ExceptionOr<void> insertAdjacentHTML(const String& where, const String& html, NodeVector* addedNodes);

    WEBCORE_EXPORT ExceptionOr<Element*> insertAdjacentElement(const String& where, Element& newChild);
    WEBCORE_EXPORT ExceptionOr<void> insertAdjacentHTML(const String& where, std::variant<RefPtr<TrustedHTML>, String>&&);
    WEBCORE_EXPORT ExceptionOr<void> insertAdjacentText(const String& where, String&& text);

    using Node::computedStyle;
    const RenderStyle* computedStyle(const std::optional<Style::PseudoElementIdentifier>&) override;
    const RenderStyle* computedStyleForEditability();

    bool needsStyleInvalidation() const;

    // Methods for indicating the style is affected by dynamic updates (e.g., children changing, our position changing in our sibling list, etc.)
    bool styleAffectedByEmpty() const { return hasStyleFlag(NodeStyleFlag::StyleAffectedByEmpty); }
    bool descendantsAffectedByPreviousSibling() const { return hasStyleFlag(NodeStyleFlag::DescendantsAffectedByPreviousSibling); }
    bool childrenAffectedByFirstChildRules() const { return hasStyleFlag(NodeStyleFlag::ChildrenAffectedByFirstChildRules); }
    bool childrenAffectedByLastChildRules() const { return hasStyleFlag(NodeStyleFlag::ChildrenAffectedByLastChildRules); }
    bool childrenAffectedByForwardPositionalRules() const { return hasStyleFlag(NodeStyleFlag::ChildrenAffectedByForwardPositionalRules); }
    bool descendantsAffectedByForwardPositionalRules() const { return hasStyleFlag(NodeStyleFlag::DescendantsAffectedByForwardPositionalRules); }
    bool childrenAffectedByBackwardPositionalRules() const { return hasStyleFlag(NodeStyleFlag::ChildrenAffectedByBackwardPositionalRules); }
    bool descendantsAffectedByBackwardPositionalRules() const { return hasStyleFlag(NodeStyleFlag::DescendantsAffectedByBackwardPositionalRules); }
    bool affectsNextSiblingElementStyle() const { return hasStyleFlag(NodeStyleFlag::AffectsNextSiblingElementStyle); }
    bool styleIsAffectedByPreviousSibling() const { return hasStyleFlag(NodeStyleFlag::StyleIsAffectedByPreviousSibling); }
    bool affectedByHasWithPositionalPseudoClass() const { return hasStyleFlag(NodeStyleFlag::AffectedByHasWithPositionalPseudoClass); }
    unsigned childIndex() const { return hasRareData() ? rareDataChildIndex() : 0; }

    bool hasFlagsSetDuringStylingOfChildren() const;

    void setStyleAffectedByEmpty() { setStyleFlag(NodeStyleFlag::StyleAffectedByEmpty); }
    void setDescendantsAffectedByPreviousSibling() { setStyleFlag(NodeStyleFlag::DescendantsAffectedByPreviousSibling); }
    void setChildrenAffectedByFirstChildRules() { setStyleFlag(NodeStyleFlag::ChildrenAffectedByFirstChildRules); }
    void setChildrenAffectedByLastChildRules() { setStyleFlag(NodeStyleFlag::ChildrenAffectedByLastChildRules); }
    void setChildrenAffectedByForwardPositionalRules() { setStyleFlag(NodeStyleFlag::ChildrenAffectedByForwardPositionalRules); }
    void setDescendantsAffectedByForwardPositionalRules() { setStyleFlag(NodeStyleFlag::DescendantsAffectedByForwardPositionalRules); }
    void setChildrenAffectedByBackwardPositionalRules() { setStyleFlag(NodeStyleFlag::ChildrenAffectedByBackwardPositionalRules); }
    void setDescendantsAffectedByBackwardPositionalRules() { setStyleFlag(NodeStyleFlag::DescendantsAffectedByBackwardPositionalRules); }
    void setAffectsNextSiblingElementStyle() { setStyleFlag(NodeStyleFlag::AffectsNextSiblingElementStyle); }
    void setStyleIsAffectedByPreviousSibling() { setStyleFlag(NodeStyleFlag::StyleIsAffectedByPreviousSibling); }
    void setAffectedByHasWithPositionalPseudoClass() { setStyleFlag(NodeStyleFlag::AffectedByHasWithPositionalPseudoClass); }
    void setChildIndex(unsigned);

    const AtomString& effectiveLang() const;
    const AtomString& langFromAttribute() const;
    Locale& locale() const;

    void updateEffectiveLangStateAndPropagateToDescendants();

    virtual bool accessKeyAction(bool /*sendToAnyEvent*/) { return false; }

    virtual bool isURLAttribute(const Attribute&) const { return false; }
    virtual bool attributeContainsURL(const Attribute& attribute) const { return isURLAttribute(attribute); }
    String resolveURLStringIfNeeded(const String& urlString, ResolveURLs = ResolveURLs::Yes, const URL& base = URL()) const;
    virtual String completeURLsInAttributeValue(const URL& base, const Attribute&, ResolveURLs = ResolveURLs::Yes) const;
    virtual Attribute replaceURLsInAttributeValue(const Attribute&, const UncheckedKeyHashMap<String, String>&) const;
    virtual bool isHTMLContentAttribute(const Attribute&) const { return false; }

    WEBCORE_EXPORT URL getURLAttribute(const QualifiedName&) const;
    inline URL getURLAttributeForBindings(const QualifiedName&) const;
    URL getNonEmptyURLAttribute(const QualifiedName&) const;

    virtual const AtomString& imageSourceURL() const;
    virtual AtomString target() const { return nullAtom(); }

    static RefPtr<Element> findFocusDelegateForTarget(ContainerNode&, FocusTrigger);
    RefPtr<Element> findFocusDelegate(FocusTrigger = FocusTrigger::Other);
    RefPtr<Element> findAutofocusDelegate(FocusTrigger = FocusTrigger::Other);

    static AXTextStateChangeIntent defaultFocusTextStateChangeIntent() { return AXTextStateChangeIntent(AXTextStateChangeTypeSelectionMove, AXTextSelection { AXTextSelectionDirectionDiscontiguous, AXTextSelectionGranularityUnknown, true }); }
    virtual void focus(const FocusOptions& = { });
    virtual void focusForBindings(FocusOptions&&);
    void findTargetAndUpdateFocusAppearance(SelectionRestorationMode, SelectionRevealMode = SelectionRevealMode::Reveal);
    virtual RefPtr<Element> focusAppearanceUpdateTarget();
    virtual void updateFocusAppearance(SelectionRestorationMode, SelectionRevealMode = SelectionRevealMode::Reveal);
    virtual void blur();
    virtual void runFocusingStepsForAutofocus();

    ExceptionOr<void> setHTMLUnsafe(std::variant<RefPtr<TrustedHTML>, String>&&);
    String getHTML(GetHTMLOptions&&) const;

    WEBCORE_EXPORT String innerHTML() const;
    WEBCORE_EXPORT String outerHTML() const;
    WEBCORE_EXPORT ExceptionOr<void> setInnerHTML(std::variant<RefPtr<TrustedHTML>, String>&&);
    WEBCORE_EXPORT ExceptionOr<void> setOuterHTML(std::variant<RefPtr<TrustedHTML>, String>&&);
    WEBCORE_EXPORT String innerText();
    WEBCORE_EXPORT String outerText();
 
    virtual String title() const;

    WEBCORE_EXPORT const AtomString& userAgentPart() const;
    WEBCORE_EXPORT void setUserAgentPart(const AtomString&);

    // Use Document::registerForDocumentActivationCallbacks() to subscribe to these
    virtual void prepareForDocumentSuspension() { }
    virtual void resumeFromDocumentSuspension() { }

    void willBecomeFullscreenElement();
    virtual void ancestorWillEnterFullscreen() { }
    virtual void didBecomeFullscreenElement() { }
    virtual void willStopBeingFullscreenElement() { }
    virtual void didStopBeingFullscreenElement() { }

    bool isFinishedParsingChildren() const { return isParsingChildrenFinished(); }
    // Overriding these functions to make parsing a special case should be avoided if possible
    // as that could lead to elements responding differently to the parser vs. other kinds of DOM mutations.
    void beginParsingChildren() { clearIsParsingChildrenFinished(); }
    virtual void finishParsingChildren();

    PseudoElement& ensurePseudoElement(PseudoId);
    WEBCORE_EXPORT PseudoElement* beforePseudoElement() const;
    WEBCORE_EXPORT PseudoElement* afterPseudoElement() const;
    bool childNeedsShadowWalker() const;
    void didShadowTreeAwareChildrenChange();

    virtual bool matchesValidPseudoClass() const;
    virtual bool matchesInvalidPseudoClass() const;
    virtual bool matchesUserValidPseudoClass() const;
    virtual bool matchesUserInvalidPseudoClass() const;
    virtual bool matchesReadWritePseudoClass() const;
    virtual bool matchesIndeterminatePseudoClass() const;
    virtual bool matchesDefaultPseudoClass() const;
    WEBCORE_EXPORT ExceptionOr<bool> matches(const String& selectors);
    WEBCORE_EXPORT ExceptionOr<Element*> closest(const String& selectors);

    WEBCORE_EXPORT DOMTokenList& classList();

    SpaceSplitString partNames() const;
    DOMTokenList& part();

    DatasetDOMStringMap& dataset();

#if ENABLE(VIDEO)
    virtual bool isMediaElement() const { return false; }
#endif

    virtual bool isFormListedElement() const { return false; }
    virtual bool isValidatedFormListedElement() const { return false; }
    virtual bool isMaybeFormAssociatedCustomElement() const { return false; }
    virtual bool isSpinButtonElement() const { return false; }
    virtual bool isTextFormControlElement() const { return false; }
    virtual bool isTextField() const { return false; }
    virtual bool isTextPlaceholderElement() const { return false; }
    virtual bool isOptionalFormControl() const { return false; }
    virtual bool isRequiredFormControl() const { return false; }
    virtual bool isInRange() const { return false; }
    virtual bool isOutOfRange() const { return false; }
    virtual bool isUploadButton() const { return false; }
    virtual bool isSliderContainerElement() const { return false; }
    virtual bool isSliderThumbElement() const { return false; }
    virtual bool isHTMLTablePartElement() const { return false; }

    virtual bool isDevolvableWidget() const { return false; }

    bool canContainRangeEndPoint() const override;

    // Used for disabled form elements; if true, prevents mouse events from being dispatched
    // to event listeners, and prevents DOMActivate events from being sent at all.
    virtual bool isDisabledFormControl() const { return false; }

    virtual bool childShouldCreateRenderer(const Node&) const;

    KeyframeEffectStack* keyframeEffectStack(const std::optional<Style::PseudoElementIdentifier>&) const;
    KeyframeEffectStack& ensureKeyframeEffectStack(const std::optional<Style::PseudoElementIdentifier>&);
    bool hasKeyframeEffects(const std::optional<Style::PseudoElementIdentifier>&) const;

    const AnimationCollection* animations(const std::optional<Style::PseudoElementIdentifier>&) const;
    bool hasCompletedTransitionForProperty(const std::optional<Style::PseudoElementIdentifier>&, const AnimatableCSSProperty&) const;
    bool hasRunningTransitionForProperty(const std::optional<Style::PseudoElementIdentifier>&, const AnimatableCSSProperty&) const;
    bool hasRunningTransitions(const std::optional<Style::PseudoElementIdentifier>&) const;
    AnimationCollection& ensureAnimations(const std::optional<Style::PseudoElementIdentifier>&);

    const AnimatableCSSPropertyToTransitionMap* completedTransitionsByProperty(const std::optional<Style::PseudoElementIdentifier>&) const;
    const AnimatableCSSPropertyToTransitionMap* runningTransitionsByProperty(const std::optional<Style::PseudoElementIdentifier>&) const;

    AnimatableCSSPropertyToTransitionMap& ensureCompletedTransitionsByProperty(const std::optional<Style::PseudoElementIdentifier>&);
    AnimatableCSSPropertyToTransitionMap& ensureRunningTransitionsByProperty(const std::optional<Style::PseudoElementIdentifier>&);
    CSSAnimationCollection& animationsCreatedByMarkup(const std::optional<Style::PseudoElementIdentifier>&);
    void setAnimationsCreatedByMarkup(const std::optional<Style::PseudoElementIdentifier>&, CSSAnimationCollection&&);

    const RenderStyle* lastStyleChangeEventStyle(const std::optional<Style::PseudoElementIdentifier>&) const;
    void setLastStyleChangeEventStyle(const std::optional<Style::PseudoElementIdentifier>&, std::unique_ptr<const RenderStyle>&&);
    bool hasPropertiesOverridenAfterAnimation(const std::optional<Style::PseudoElementIdentifier>&) const;
    void setHasPropertiesOverridenAfterAnimation(const std::optional<Style::PseudoElementIdentifier>&, bool);

    void cssAnimationsDidUpdate(const std::optional<Style::PseudoElementIdentifier>&);
    void keyframesRuleDidChange(const std::optional<Style::PseudoElementIdentifier>&);
    bool hasPendingKeyframesUpdate(const std::optional<Style::PseudoElementIdentifier>&) const;
    // FIXME: do we need a counter style didChange here? (rdar://103018993).

    bool isLink() const { return hasStateFlag(StateFlag::IsLink); }
    void setIsLink(bool flag);

    bool isInTopLayer() const { return hasEventTargetFlag(EventTargetFlag::IsInTopLayer); }
    void addToTopLayer();
    void removeFromTopLayer();

#if ENABLE(FULLSCREEN_API)
    bool hasFullscreenFlag() const { return hasElementStateFlag(ElementStateFlag::IsFullscreen); }
    void setFullscreenFlag(bool);
    WEBCORE_EXPORT void webkitRequestFullscreen();
    virtual void requestFullscreen(FullscreenOptions&&, RefPtr<DeferredPromise>&&);
#endif

    PopoverData* popoverData() const;
    PopoverData& ensurePopoverData();
    void clearPopoverData();
    bool isPopoverShowing() const;

    virtual bool isValidCommandType(const CommandType) { return false; }
    virtual bool handleCommandInternal(const HTMLFormControlElement&, const CommandType&) { return false; }

    ExceptionOr<void> setPointerCapture(int32_t);
    ExceptionOr<void> releasePointerCapture(int32_t);
    bool hasPointerCapture(int32_t);

#if ENABLE(POINTER_LOCK)
    JSC::JSValue requestPointerLock(JSC::JSGlobalObject& lexicalGlobalObject, PointerLockOptions&&);
    WEBCORE_EXPORT void requestPointerLock();
#endif

    OptionSet<VisibilityAdjustment> visibilityAdjustment() const;
    void setVisibilityAdjustment(OptionSet<VisibilityAdjustment>);
    bool isInVisibilityAdjustmentSubtree() const;

    bool isSpellCheckingEnabled() const;
    WEBCORE_EXPORT bool isWritingSuggestionsEnabled() const;

    inline bool hasID() const;
    inline bool hasClass() const;
    inline bool hasName() const;
    inline const SpaceSplitString& classNames() const;
    inline bool hasClassName(const AtomString& className) const;

    ScrollPosition savedLayerScrollPosition() const;
    void setSavedLayerScrollPosition(const ScrollPosition&);

    enum class EventIsDefaultPrevented : bool { No, Yes };
    enum class EventIsDispatched : bool { No, Yes };
    using DispatchMouseEventResult = std::pair<EventIsDispatched, EventIsDefaultPrevented>;
    DispatchMouseEventResult dispatchMouseEvent(const PlatformMouseEvent& platformEvent, const AtomString& eventType, int clickCount = 0, Element* relatedTarget = nullptr, IsSyntheticClick = IsSyntheticClick::No);
    bool dispatchWheelEvent(const PlatformWheelEvent&, OptionSet<EventHandling>&, EventIsCancelable = EventIsCancelable::Yes);
    bool dispatchKeyEvent(const PlatformKeyboardEvent&);
    bool dispatchSimulatedClick(Event* underlyingEvent, SimulatedClickMouseEventOptions = SendNoEvents, SimulatedClickVisualOptions = ShowPressedLook);

    // FIXME: Consider changing signature to accept Element* because all callers perform copyRef().
    void dispatchFocusInEventIfNeeded(RefPtr<Element>&& oldFocusedElement);
    void dispatchFocusOutEventIfNeeded(RefPtr<Element>&& newFocusedElement);
    virtual void dispatchFocusEvent(RefPtr<Element>&& oldFocusedElement, const FocusOptions&);
    virtual void dispatchBlurEvent(RefPtr<Element>&& newFocusedElement);
    void dispatchWebKitImageReadyEventForTesting();

    WEBCORE_EXPORT bool dispatchMouseForceWillBegin();

    void enqueueSecurityPolicyViolationEvent(SecurityPolicyViolationEventInit&&);

    virtual void willRecalcStyle(Style::Change);
    virtual void didRecalcStyle(Style::Change);
    virtual void willResetComputedStyle();
    virtual void willAttachRenderers();
    virtual void didAttachRenderers();
    virtual void willDetachRenderers();
    virtual void didDetachRenderers();
    virtual std::optional<Style::ResolvedStyle> resolveCustomStyle(const Style::ResolutionContext&, const RenderStyle* shadowHostStyle);

    LayoutRect absoluteEventHandlerBounds(bool& includesFixedPositionElements) override;

    const RenderStyle* existingComputedStyle() const;
    WEBCORE_EXPORT const RenderStyle* renderOrDisplayContentsStyle() const;
    WEBCORE_EXPORT const RenderStyle* renderOrDisplayContentsStyle(const std::optional<Style::PseudoElementIdentifier>&) const;

    void clearBeforePseudoElement();
    void clearAfterPseudoElement();
    void resetComputedStyle();
    void resetStyleRelations();
    void resetChildStyleRelations();
    void resetAllDescendantStyleRelations();
    void clearHoverAndActiveStatusBeforeDetachingRenderer();

    WEBCORE_EXPORT URL absoluteLinkURL() const;

#if ENABLE(TOUCH_EVENTS)
    bool allowsDoubleTapGesture() const override;
#endif

    Style::Resolver& styleResolver();
    Style::ResolvedStyle resolveStyle(const Style::ResolutionContext&);

    // Invalidates the style of a single element. Style is resolved lazily.
    // Descendant elements are resolved as needed, for example if an inherited property changes.
    // This should be called whenever an element changes in a manner that can affect its style.
    void invalidateStyle();

    // As above but also call RenderElement::setStyle with StyleDifference::RecompositeLayer flag for
    // the element even when the style doesn't change. This is mostly needed by the animation code.
    WEBCORE_EXPORT void invalidateStyleAndLayerComposition();

    // Invalidate the element and all its descendants. This is used when there is some sort of change
    // in the tree that may affect the style of any of the descendants and we don't know how to optimize
    // the case to limit the scope. This is expensive and should be avoided.
    void invalidateStyleForSubtree();

    // Invalidates renderers for the element and all its descendants causing them to be torn down
    // and rebuild during style resolution. Style is also recomputed. This is used in code dealing with
    // custom (not style based) renderers. This is expensive and should be avoided.
    // Elements newly added to the tree are also in this state.
    void invalidateStyleAndRenderersForSubtree();
    void invalidateRenderer();

    void invalidateStyleInternal();
    void invalidateStyleForAnimation();
    void invalidateStyleForSubtreeInternal();
    void invalidateForQueryContainerSizeChange();
    void invalidateForResumingQueryContainerResolution();
    void invalidateForResumingAnchorPositionedElementResolution();

    bool needsUpdateQueryContainerDependentStyle() const;
    void clearNeedsUpdateQueryContainerDependentStyle();

    void invalidateEventListenerRegions();

    bool hasDisplayContents() const;
    bool hasDisplayNone() const;
    void storeDisplayContentsOrNoneStyle(std::unique_ptr<RenderStyle>);
    void clearDisplayContentsOrNoneStyle();

    using ContainerNode::setAttributeEventListener;
    void setAttributeEventListener(const AtomString& eventType, const QualifiedName& attributeName, const AtomString& value);

    virtual IntersectionObserverData& ensureIntersectionObserverData();
    virtual IntersectionObserverData* intersectionObserverDataIfExists();

    ResizeObserverData& ensureResizeObserverData();
    ResizeObserverData* resizeObserverDataIfExists();

    std::optional<LayoutUnit> lastRememberedLogicalWidth() const;
    std::optional<LayoutUnit> lastRememberedLogicalHeight() const;
    void setLastRememberedLogicalWidth(LayoutUnit);
    void clearLastRememberedLogicalWidth();
    void setLastRememberedLogicalHeight(LayoutUnit);
    void clearLastRememberedLogicalHeight();

    RefPtr<Element> findAnchorElementForLink(String& outAnchorName);

    ExceptionOr<Ref<WebAnimation>> animate(JSC::JSGlobalObject&, JSC::Strong<JSC::JSObject>&&, std::optional<std::variant<double, KeyframeAnimationOptions>>&&);
    Vector<RefPtr<WebAnimation>> getAnimations(std::optional<GetAnimationsOptions>);

    WEBCORE_EXPORT ElementIdentifier identifier() const;
    WEBCORE_EXPORT static Element* fromIdentifier(ElementIdentifier);

    String description() const override;
    String debugDescription() const override;

    bool hasDuplicateAttribute() const;
    void setHasDuplicateAttribute(bool);

    virtual void updateUserAgentShadowTree() { }

    StylePropertyMapReadOnly* computedStyleMap();

    ExplicitlySetAttrElementsMap& explicitlySetAttrElementsMap();
    ExplicitlySetAttrElementsMap* explicitlySetAttrElementsMapIfExists() const;

    bool isRelevantToUser() const;

    std::optional<OptionSet<ContentRelevancy>> contentRelevancy() const;
    void setContentRelevancy(OptionSet<ContentRelevancy>);

    bool hasCustomState(const AtomString& state) const;
    CustomStateSet& ensureCustomStateSet();

    bool hasValidTextDirectionState() const;
    bool hasAutoTextDirectionState() const;

    void updateEffectiveTextDirection();
    void updateEffectiveTextDirectionIfNeeded();

    AtomString viewTransitionCapturedName(const std::optional<Style::PseudoElementIdentifier>&) const;
    void setViewTransitionCapturedName(const std::optional<Style::PseudoElementIdentifier>&, AtomString);

protected:
    Element(const QualifiedName&, Document&, OptionSet<TypeFlag>);

    InsertedIntoAncestorResult insertedIntoAncestor(InsertionType, ContainerNode&) override;
    void removedFromAncestor(RemovalType, ContainerNode&) override;
    void childrenChanged(const ChildChange&) override;
    void removeAllEventListeners() override;

    void setTabIndexExplicitly(std::optional<int>);

    void classAttributeChanged(const AtomString& newClassString, AttributeModificationReason);
    void partAttributeChanged(const AtomString& newValue);

    void addShadowRoot(Ref<ShadowRoot>&&);

    ExceptionOr<void> replaceChildrenWithMarkup(const String&, OptionSet<ParserContentPolicy>);

    static ExceptionOr<void> mergeWithNextTextNode(Text&);

    StylePropertyMap* attributeStyleMap();
    void setAttributeStyleMap(Ref<StylePropertyMap>&&);

    FormAssociatedCustomElement& formAssociatedCustomElementUnsafe() const;
    void ensureFormAssociatedCustomElement();

    void disconnectFromIntersectionObservers();
    static AtomString makeTargetBlankIfHasDanglingMarkup(const AtomString& target);

private:
    LocalFrame* documentFrameWithNonNullView() const;
    void hideNonceSlow();

    bool isTextNode() const;

    bool isUserActionElementInActiveChain() const;
    bool isUserActionElementActive() const;
    bool isUserActionElementFocused() const;
    bool isUserActionElementHovered() const;
    bool isUserActionElementDragged() const;
    bool isUserActionElementHasFocusVisible() const;
    bool isUserActionElementHasFocusWithin() const;

    bool isNonceable() const;

    virtual void didAddUserAgentShadowRoot(ShadowRoot&) { }

    void didAddAttribute(const QualifiedName&, const AtomString&);
    void willModifyAttribute(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue);
    void didModifyAttribute(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue);
    void didRemoveAttribute(const QualifiedName&, const AtomString& oldValue);

    void synchronizeAttribute(const QualifiedName&) const;
    void synchronizeAttribute(const AtomString& localName) const;

    inline const Attribute* getAttributeInternal(const QualifiedName&) const;
    inline const Attribute* getAttributeInternal(const AtomString& qualifiedName) const;

    void updateName(const AtomString& oldName, const AtomString& newName);
    void updateNameForTreeScope(TreeScope&, const AtomString& oldName, const AtomString& newName);
    void updateNameForDocument(HTMLDocument&, const AtomString& oldName, const AtomString& newName);

    enum class NotifyObservers : bool { No, Yes };
    void updateId(const AtomString& oldId, const AtomString& newId, NotifyObservers = NotifyObservers::Yes);
    void updateIdForTreeScope(TreeScope&, const AtomString& oldId, const AtomString& newId, NotifyObservers = NotifyObservers::Yes);

    enum class HTMLDocumentNamedItemMapsUpdatingCondition : bool { Always, UpdateOnlyIfDiffersFromNameAttribute };
    void updateIdForDocument(HTMLDocument&, const AtomString& oldId, const AtomString& newId, HTMLDocumentNamedItemMapsUpdatingCondition);

    ExceptionOr<Node*> insertAdjacent(const String& where, Ref<Node>&& newChild);

    bool childTypeAllowed(NodeType) const final;

    void notifyAttributeChanged(const QualifiedName&, const AtomString& oldValue, const AtomString& newValue, AttributeModificationReason = AttributeModificationReason::Directly);
    enum class InSynchronizationOfLazyAttribute : bool { No, Yes };
    void setAttributeInternal(unsigned index, const QualifiedName&, const AtomString& value, InSynchronizationOfLazyAttribute);
    void addAttributeInternal(const QualifiedName&, const AtomString& value, InSynchronizationOfLazyAttribute);
    void removeAttributeInternal(unsigned index, InSynchronizationOfLazyAttribute);

    void setSavedLayerScrollPositionSlow(const ScrollPosition&);
    void clearBeforePseudoElementSlow();
    void clearAfterPseudoElementSlow();

    LayoutRect absoluteEventBounds(bool& boundsIncludeAllDescendantElements, bool& includesFixedPositionElements);
    LayoutRect absoluteEventBoundsOfElementAndDescendants(bool& includesFixedPositionElements);

    void disconnectFromIntersectionObserversSlow(IntersectionObserverData&);

    void disconnectFromResizeObservers();
    void disconnectFromResizeObserversSlow(ResizeObserverData&);

    // The cloneNode function is private so that non-virtual cloneElementWith/WithoutChildren are used instead.
    Ref<Node> cloneNodeInternal(TreeScope&, CloningOperation) override;
    void cloneShadowTreeIfPossible(Element& newHost);
    virtual Ref<Element> cloneElementWithoutAttributesAndChildren(TreeScope&);

    inline void removeShadowRoot(); // Defined in ElementRareData.h.
    void removeShadowRootSlow(ShadowRoot&);

    enum class ResolveComputedStyleMode : uint8_t { Normal, RenderedOnly, Editability };
    const RenderStyle* resolveComputedStyle(ResolveComputedStyleMode = ResolveComputedStyleMode::Normal);
    const RenderStyle& resolvePseudoElementStyle(const Style::PseudoElementIdentifier&);

    unsigned rareDataChildIndex() const;

    void createUniqueElementData();

    inline ElementRareData* elementRareData() const;
    ElementRareData& ensureElementRareData();

    ElementAnimationRareData* animationRareData(const std::optional<Style::PseudoElementIdentifier>&) const;
    ElementAnimationRareData& ensureAnimationRareData(const std::optional<Style::PseudoElementIdentifier>&);

    virtual int defaultTabIndex() const;

    void detachAllAttrNodesFromElement();
    void detachAttrNodeFromElementWithValue(Attr*, const AtomString& value);

    // Anyone thinking of using this should call document instead of ownerDocument.
    void ownerDocument() const = delete;
    
    void attachAttributeNodeIfNeeded(Attr&);
    
#if ASSERT_ENABLED
    WEBCORE_EXPORT bool fastAttributeLookupAllowed(const QualifiedName&) const;
#endif

    void dirAttributeChanged(const AtomString& newValue);

    bool hasEffectiveLangState() const;
    void updateEffectiveLangState();
    void updateEffectiveLangStateFromParent();
    void setEffectiveLangStateOnOldDocumentElement();
    void clearEffectiveLangStateOnNewDocumentElement();

    bool hasLangAttr() const { return hasEventTargetFlag(EventTargetFlag::HasLangAttr); }
    void setHasLangAttr(bool has) { setEventTargetFlag(EventTargetFlag::HasLangAttr, has); }

    bool hasXMLLangAttr() const { return hasEventTargetFlag(EventTargetFlag::HasXMLLangAttr); }
    void setHasXMLLangAttr(bool has) { setEventTargetFlag(EventTargetFlag::HasXMLLangAttr, has); }

    bool effectiveLangKnownToMatchDocumentElement() const { return hasStateFlag(StateFlag::EffectiveLangKnownToMatchDocumentElement); }
    void setEffectiveLangKnownToMatchDocumentElement(bool matches) { setStateFlag(StateFlag::EffectiveLangKnownToMatchDocumentElement, matches); }

    bool hasLanguageAttribute() const { return hasLangAttr() || hasXMLLangAttr(); }
    bool hasLangAttrKnownToMatchDocumentElement() const { return hasLanguageAttribute() && effectiveLangKnownToMatchDocumentElement(); }

    bool hasEverHadSmoothScroll() const { return hasElementStateFlag(ElementStateFlag::EverHadSmoothScroll); }
    void setHasEverHadSmoothScroll(bool value) { return setElementStateFlag(ElementStateFlag::EverHadSmoothScroll, value); }

    void parentOrShadowHostNode() const = delete; // Call parentNode() instead.

    QualifiedName m_tagName;
    RefPtr<ElementData> m_elementData;
};

inline void Element::setSavedLayerScrollPosition(const ScrollPosition& position)
{
    if (position.isZero() && !hasRareData())
        return;
    setSavedLayerScrollPositionSlow(position);
}

inline void Element::clearBeforePseudoElement()
{
    if (hasRareData())
        clearBeforePseudoElementSlow();
}

inline void Element::clearAfterPseudoElement()
{
    if (hasRareData())
        clearAfterPseudoElementSlow();
}

inline void Element::disconnectFromIntersectionObservers()
{
    auto* observerData = intersectionObserverDataIfExists();
    if (LIKELY(!observerData))
        return;
    disconnectFromIntersectionObserversSlow(*observerData);
}

inline void Element::disconnectFromResizeObservers()
{
    auto* observerData = resizeObserverDataIfExists();
    if (LIKELY(!observerData))
        return;
    disconnectFromResizeObserversSlow(*observerData);
}

void invalidateForSiblingCombinators(Element* sibling);
inline bool isInTopLayerOrBackdrop(const RenderStyle&, const Element*);

WEBCORE_EXPORT WTF::TextStream& operator<<(WTF::TextStream&, ContentRelevancy);

} // namespace WebCore

SPECIALIZE_TYPE_TRAITS_BEGIN(WebCore::Element)
    static bool isType(const WebCore::Node& node) { return node.isElementNode(); }
    static bool isType(const WebCore::EventTarget& target)
    {
        auto* node = dynamicDowncast<WebCore::Node>(target);
        return node && isType(*node);
    }
SPECIALIZE_TYPE_TRAITS_END()
