/*
 * Copyright (C) 2006-2020 Apple Inc. All rights reserved.
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

#include "CompositionUnderline.h"
#include "EditAction.h"
#include "EditingBehavior.h"
#include "EditingStyle.h"
#include "EditorInsertAction.h"
#include "FindOptions.h"
#include "FrameSelection.h"
#include "LocalFrame.h"
#include "PasteboardWriterData.h"
#include <wtf/RobinHoodHashSet.h>
#include "ScrollView.h"
#include "TextChecking.h"
#include "TextEventInputType.h"
#include "TextIteratorBehavior.h"
#include "VisibleSelection.h"
#include "WritingDirection.h"
#include <memory>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/WeakPtr.h>

#if PLATFORM(COCOA)
OBJC_CLASS NSAttributedString;
OBJC_CLASS NSDictionary;
OBJC_CLASS NSMutableDictionary;
#endif

namespace PAL {
class KillRing;
}

namespace WebCore {

class AlternativeTextController;
class ArchiveResource;
class CompositeEditCommand;
class SharedBuffer;
class CustomUndoStep;
class DataTransfer;
class DeleteButtonController;
class DocumentMarker;
class EditCommand;
class EditCommandComposition;
class EditorClient;
class EditorInternalCommand;
class File;
class HTMLElement;
class HitTestResult;
class KeyboardEvent;
class KillRing;
class LocalFrame;
class Pasteboard;
class PasteboardWriterData;
class RenderInline;
class RenderLayer;
class FragmentedSharedBuffer;
class Font;
class SpellCheckRequest;
class SpellChecker;
class StaticRange;
class StyleProperties;
class Text;
class TextCheckerClient;
class TextEvent;
class TextPlaceholderElement;
class WritingSuggestionData;

struct CompositionHighlight;
struct DictationAlternative;
struct FontAttributes;
struct PasteboardPlainText;
struct PasteboardURL;
struct TextCheckingResult;

enum class DocumentMarkerType : uint32_t;

#if ENABLE(ATTACHMENT_ELEMENT)
struct PromisedAttachmentInfo;
struct SerializedAttachmentData;
#endif

enum class EditorCommandSource : uint8_t { MenuOrKeyBinding, DOM, DOMWithUserInterface };
enum class EditorParagraphSeparator : bool { div, p };

enum class MailBlockquoteHandling : bool {
    RespectBlockquote,
    IgnoreBlockquote,
};

#if ENABLE(ATTACHMENT_ELEMENT)
class AttachmentAssociatedElement;
class HTMLAttachmentElement;
#endif

enum class TemporarySelectionOption : uint16_t {
    RevealSelection = 1 << 0,
    DoNotSetFocus = 1 << 1,

    // Don't propagate selection changes to the client layer.
    IgnoreSelectionChanges = 1 << 2,

    // Force the render tree to update selection state. Only respected on iOS.
    EnableAppearanceUpdates = 1 << 3,
    
    SmoothScroll = 1 << 4,
    
    DelegateMainFrameScroll = 1 << 5,
    
    RevealSelectionBounds = 1 << 6,

    UserTriggered = 1 << 7,
    
    ForceCenterScroll = 1 << 8,
};

class TemporarySelectionChange {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(TemporarySelectionChange, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(TemporarySelectionChange);
public:
    WEBCORE_EXPORT TemporarySelectionChange(Document&, std::optional<VisibleSelection> = std::nullopt, OptionSet<TemporarySelectionOption> = { });
    WEBCORE_EXPORT ~TemporarySelectionChange();

    WEBCORE_EXPORT void invalidate();

private:
    enum class IsTemporarySelection : bool { No, Yes };

    void setSelection(const VisibleSelection&, IsTemporarySelection);

    RefPtr<Document> m_document;
    OptionSet<TemporarySelectionOption> m_options;
    bool m_wasIgnoringSelectionChanges;
#if PLATFORM(IOS_FAMILY)
    bool m_appearanceUpdatesWereEnabled;
#endif
    std::optional<VisibleSelection> m_selectionToRestore;
};

class IgnoreSelectionChangeForScope {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(IgnoreSelectionChangeForScope, WEBCORE_EXPORT);
    WTF_MAKE_NONCOPYABLE(IgnoreSelectionChangeForScope);
public:
    IgnoreSelectionChangeForScope(LocalFrame& frame)
        : m_selectionChange(*frame.document(), std::nullopt, TemporarySelectionOption::IgnoreSelectionChanges)
    {
    }

    void invalidate() { m_selectionChange.invalidate(); }

    ~IgnoreSelectionChangeForScope() = default;

private:
    TemporarySelectionChange m_selectionChange;
};

class Editor final : public CanMakeWeakPtr<Editor> {
    WTF_MAKE_TZONE_ALLOCATED_EXPORT(Editor, WEBCORE_EXPORT);
public:
    explicit Editor(Document&);
    ~Editor();

    enum class PasteOption : uint8_t {
        AllowPlainText = 1 << 0,
        IgnoreMailBlockquote = 1 << 1,
        AsQuotation = 1 << 2,
    };

    WEBCORE_EXPORT EditorClient* client() const;
    WEBCORE_EXPORT TextCheckerClient* textChecker() const;

    CompositeEditCommand* lastEditCommand() { return m_lastEditCommand.get(); }

    Document& document() const { return m_document.get(); }
    Ref<Document> protectedDocument() const { return m_document.get(); }

    WEBCORE_EXPORT void ref() const;
    WEBCORE_EXPORT void deref() const;

    void handleKeyboardEvent(KeyboardEvent&);
    void handleInputMethodKeydown(KeyboardEvent&);
    void didDispatchInputMethodKeydown(KeyboardEvent&);
    bool handleTextEvent(TextEvent&);

    WEBCORE_EXPORT bool canEdit() const;
    WEBCORE_EXPORT bool canEditRichly() const;

    WEBCORE_EXPORT bool canDHTMLCut();
    WEBCORE_EXPORT bool canDHTMLCopy();
    WEBCORE_EXPORT bool canDHTMLPaste();
    bool tryDHTMLCopy();
    bool tryDHTMLCut();

    WEBCORE_EXPORT bool canCut() const;
    WEBCORE_EXPORT bool canCopy() const;
    WEBCORE_EXPORT bool canDelete() const;
    WEBCORE_EXPORT bool canSmartCopyOrDelete();
    bool shouldSmartDelete();
    bool canCopyFont() const;

    enum class FromMenuOrKeyBinding : bool { No, Yes };
    WEBCORE_EXPORT void cut(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    WEBCORE_EXPORT void copy(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    void copyFont(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);

    WEBCORE_EXPORT void paste(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    void paste(Pasteboard&, FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    WEBCORE_EXPORT void pasteAsPlainText(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    void pasteAsQuotation(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    void pasteFont(FromMenuOrKeyBinding = FromMenuOrKeyBinding::No);
    WEBCORE_EXPORT void performDelete();

    WEBCORE_EXPORT void copyURL(const URL&, const String& title);
    void copyURL(const URL&, const String& title, Pasteboard&);
    PasteboardWriterData::URLData pasteboardWriterURL(const URL&, const String& title);
#if !PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void copyImage(const HitTestResult&);
#endif

    void renderLayerDidScroll(const RenderLayer&);
    void revealSelectionIfNeededAfterLoadingImageForElement(HTMLImageElement&);

    String readPlainTextFromPasteboard(Pasteboard&);

    void transpose();

    bool shouldInsertFragment(DocumentFragment&, const std::optional<SimpleRange>&, EditorInsertAction);
    bool shouldInsertText(const String&, const std::optional<SimpleRange>&, EditorInsertAction) const;
    WEBCORE_EXPORT bool shouldDeleteRange(const std::optional<SimpleRange>&) const;
    bool shouldApplyStyle(const StyleProperties&, const SimpleRange&);

    void respondToChangedContents(const VisibleSelection& endingSelection);

    bool selectionStartHasStyle(CSSPropertyID, const String& value) const;
    WEBCORE_EXPORT TriState selectionHasStyle(CSSPropertyID, const String& value) const;
    String selectionStartCSSPropertyValue(CSSPropertyID);
    
    TriState selectionUnorderedListState() const;
    TriState selectionOrderedListState() const;
    WEBCORE_EXPORT RefPtr<Node> insertOrderedList();
    WEBCORE_EXPORT RefPtr<Node> insertUnorderedList();
    WEBCORE_EXPORT bool canIncreaseSelectionListLevel();
    WEBCORE_EXPORT bool canDecreaseSelectionListLevel();
    WEBCORE_EXPORT RefPtr<Node> increaseSelectionListLevel();
    WEBCORE_EXPORT RefPtr<Node> increaseSelectionListLevelOrdered();
    WEBCORE_EXPORT RefPtr<Node> increaseSelectionListLevelUnordered();
    WEBCORE_EXPORT void decreaseSelectionListLevel();
    WEBCORE_EXPORT void changeSelectionListType();
   
    void removeFormattingAndStyle();

    void clearLastEditCommand();
#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void ensureLastEditCommandHasCurrentSelectionIfOpenForMoreTyping();
#endif

    WEBCORE_EXPORT bool deleteWithDirection(SelectionDirection, TextGranularity, bool killRing, bool isTypingAction);
    WEBCORE_EXPORT void deleteSelectionWithSmartDelete(bool smartDelete, EditAction = EditAction::Delete);
    void clearText();
#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void removeUnchangeableStyles();
#endif

    WEBCORE_EXPORT void applyStyle(StyleProperties*, EditAction = EditAction::Unspecified);
    enum class ColorFilterMode { InvertColor, UseOriginalColor };
    void applyStyle(RefPtr<EditingStyle>&&, EditAction, ColorFilterMode);
    void applyParagraphStyle(StyleProperties*, EditAction = EditAction::Unspecified);
    WEBCORE_EXPORT void applyStyleToSelection(StyleProperties*, EditAction);
    WEBCORE_EXPORT void applyStyleToSelection(Ref<EditingStyle>&&, EditAction, ColorFilterMode);
    void applyParagraphStyleToSelection(StyleProperties*, EditAction);

#if ENABLE(WRITING_TOOLS)
    bool suppressEditingForWritingTools() const { return m_suppressEditingForWritingTools; }
    void setSuppressEditingForWritingTools(bool suppress) { m_suppressEditingForWritingTools = suppress; }
#endif

    // Returns whether or not we should proceed with editing.
    bool willApplyEditing(CompositeEditCommand&, Vector<RefPtr<StaticRange>>&&);
    bool willUnapplyEditing(const EditCommandComposition&) const;
    bool willReapplyEditing(const EditCommandComposition&) const;

    void appliedEditing(CompositeEditCommand&);
    void unappliedEditing(EditCommandComposition&);
    void reappliedEditing(EditCommandComposition&);
    void unappliedSpellCorrection(const VisibleSelection& selectionOfCorrected, const String& corrected, const String& correction);

    // This is off by default, since most editors want this behavior (originally matched IE but not Firefox).
    void setShouldStyleWithCSS(bool flag) { m_shouldStyleWithCSS = flag; }
    bool shouldStyleWithCSS() const { return m_shouldStyleWithCSS; }

    class Command {
    public:
        WEBCORE_EXPORT Command();
        Command(const EditorInternalCommand*, EditorCommandSource, Document&);

        WEBCORE_EXPORT bool execute(const String& parameter = String(), Event* triggeringEvent = nullptr) const;
        WEBCORE_EXPORT bool execute(Event* triggeringEvent) const;

        WEBCORE_EXPORT bool isSupported() const;
        WEBCORE_EXPORT bool isEnabled(Event* triggeringEvent = nullptr) const;

        WEBCORE_EXPORT TriState state(Event* triggeringEvent = nullptr) const;
        String value(Event* triggeringEvent = nullptr) const;

        WEBCORE_EXPORT bool isTextInsertion() const;
        WEBCORE_EXPORT bool allowExecutionWhenDisabled() const;

    private:
        const EditorInternalCommand* m_command { nullptr };
        EditorCommandSource m_source;
        RefPtr<Document> m_document;
        RefPtr<LocalFrame> m_frame;
    };
    WEBCORE_EXPORT Command command(const String& commandName); // Command source is EditorCommandSource::MenuOrKeyBinding.
    Command command(const String& commandName, EditorCommandSource);
    WEBCORE_EXPORT static bool commandIsSupportedFromMenuOrKeyBinding(const String& commandName); // Works without a frame.

    WEBCORE_EXPORT bool insertText(const String&, Event* triggeringEvent, TextEventInputType = TextEventInputKeyboard);
    bool insertTextForConfirmedComposition(const String& text);
    WEBCORE_EXPORT bool insertDictatedText(const String&, const Vector<DictationAlternative>& dictationAlternatives, Event* triggeringEvent);
    bool insertTextWithoutSendingTextEvent(const String&, bool selectInsertedText, TextEvent* triggeringEvent);
    bool insertLineBreak();
    bool insertParagraphSeparator();
    WEBCORE_EXPORT bool insertParagraphSeparatorInQuotedContent();

    WEBCORE_EXPORT bool isContinuousSpellCheckingEnabled() const;
    WEBCORE_EXPORT void toggleContinuousSpellChecking();
    bool isGrammarCheckingEnabled();
    void toggleGrammarChecking();
    void ignoreSpelling();
    void learnSpelling();
    int spellCheckerDocumentTag();
    WEBCORE_EXPORT bool isSelectionUngrammatical();
    String misspelledSelectionString() const;
    String misspelledWordAtCaretOrRange(Node* clickedNode) const;
    Vector<String> guessesForMisspelledWord(const String&) const;
    TextCheckingGuesses guessesForMisspelledOrUngrammatical();
    bool isSpellCheckingEnabledInFocusedNode() const;
    bool isSpellCheckingEnabledFor(Node*) const;
    WEBCORE_EXPORT void markMisspellingsAfterTypingToWord(const VisiblePosition& wordStart, const VisibleSelection& selectionAfterTyping, bool doReplacement);
    std::optional<SimpleRange> markMisspellings(const VisibleSelection&); // Returns first misspelling range.
    void markBadGrammar(const VisibleSelection&);
    void markMisspellingsAndBadGrammar(const VisibleSelection& spellingSelection, bool markGrammar, const VisibleSelection& grammarSelection);
    void markAndReplaceFor(const SpellCheckRequest&, const Vector<TextCheckingResult>&);
    WEBCORE_EXPORT void replaceRangeForSpellChecking(const SimpleRange&, const String&);

    bool isOverwriteModeEnabled() const { return m_overwriteModeEnabled; }
    WEBCORE_EXPORT void toggleOverwriteModeEnabled();

    void markAllMisspellingsAndBadGrammarInRanges(OptionSet<TextCheckingType>, const std::optional<SimpleRange>& spellingRange, const std::optional<SimpleRange>& automaticReplacementRange, const std::optional<SimpleRange>& grammarRange);
#if PLATFORM(IOS_FAMILY)
    NO_RETURN_DUE_TO_ASSERT
#endif
    WEBCORE_EXPORT void changeBackToReplacedString(const String& replacedString);

#if !PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void advanceToNextMisspelling(bool startBeforeSelection = false);
#endif
    void showSpellingGuessPanel();
    bool spellingPanelIsShowing();

    bool shouldBeginEditing(const SimpleRange&);
    bool shouldEndEditing(const SimpleRange&);

    WEBCORE_EXPORT void clearUndoRedoOperations();
    bool canUndo() const;
    void undo();
    bool canRedo() const;
    void redo();

    void registerCustomUndoStep(Ref<CustomUndoStep>&&);

    void didBeginEditing();
    void didEndEditing();
    void willWriteSelectionToPasteboard(const std::optional<SimpleRange>&);
    void didWriteSelectionToPasteboard();

    void toggleBold();
    void toggleUnderline();
    WEBCORE_EXPORT void setBaseWritingDirection(WritingDirection);

    // smartInsertDeleteEnabled and selectTrailingWhitespaceEnabled are 
    // mutually exclusive, meaning that enabling one will disable the other.
    bool smartInsertDeleteEnabled();
    bool isSelectTrailingWhitespaceEnabled() const;
    
    WEBCORE_EXPORT bool hasBidiSelection() const;

    // international text input composition
    bool hasComposition() const { return m_compositionNode; }
    WEBCORE_EXPORT void setComposition(const String&, const Vector<CompositionUnderline>&, const Vector<CompositionHighlight>&, const HashMap<String, Vector<CharacterRange>>&, unsigned selectionStart, unsigned selectionEnd);
#if PLATFORM(COCOA)
    WEBCORE_EXPORT void setWritingSuggestion(const String&, const CharacterRange& selection);
#endif
    WEBCORE_EXPORT void setOffset(uint64_t);
    WEBCORE_EXPORT void confirmComposition();
    WEBCORE_EXPORT void confirmComposition(const String&); // if no existing composition, replaces selection
    void confirmOrCancelCompositionAndNotifyClient();
    WEBCORE_EXPORT void cancelComposition();
    WEBCORE_EXPORT bool cancelCompositionIfSelectionIsInvalid();
    WEBCORE_EXPORT std::optional<SimpleRange> compositionRange() const;
    WEBCORE_EXPORT bool getCompositionSelection(unsigned& selectionStart, unsigned& selectionEnd) const;

    // getting international text input composition state (for use by LegacyInlineTextBox)
    Text* compositionNode() const { return m_compositionNode.get(); }
    RefPtr<Text> protectedCompositionNode() const { return m_compositionNode; }
    unsigned compositionStart() const { return m_compositionStart; }
    unsigned compositionEnd() const { return m_compositionEnd; }
    bool compositionUsesCustomUnderlines() const { return !m_customCompositionUnderlines.isEmpty(); }
    const Vector<CompositionUnderline>& customCompositionUnderlines() const { return m_customCompositionUnderlines; }
    bool compositionUsesCustomHighlights() const { return !m_customCompositionHighlights.isEmpty(); }
    const Vector<CompositionHighlight>& customCompositionHighlights() const { return m_customCompositionHighlights; }
    bool compositionUsesCustomAnnotations() const { return !m_customCompositionAnnotations.isEmpty(); }
    const HashMap<String, Vector<CharacterRange>>& customCompositionAnnotations() const { return m_customCompositionAnnotations; }

    // FIXME: This should be a page-level concept (i.e. on EditorClient) instead of on the Editor, which
    // is a frame-specific concept, because executing an editing command can run JavaScript that can do
    // anything, including changing the focused frame. That is, it is not enough to set this setting on
    // one Editor to disallow selection changes in all frames.
    enum class RevealSelection : bool { No, Yes };
    WEBCORE_EXPORT void setIgnoreSelectionChanges(bool, RevealSelection shouldRevealExistingSelection = RevealSelection::Yes);
    bool ignoreSelectionChanges() const { return m_ignoreSelectionChanges; }

    WEBCORE_EXPORT std::optional<SimpleRange> rangeForPoint(const IntPoint& windowPoint);

    void clear();

    VisibleSelection selectionForCommand(Event*);

    PAL::KillRing& killRing() const { return *m_killRing; }
    SpellChecker& spellChecker() const { return *m_spellChecker; }

    EditingBehavior behavior() const;

    WEBCORE_EXPORT std::optional<SimpleRange> selectedRange();

#if PLATFORM(IOS_FAMILY)
    WEBCORE_EXPORT void confirmMarkedText();
    WEBCORE_EXPORT void setTextAsChildOfElement(String&&, Element&);
    WEBCORE_EXPORT void setTextAlignmentForChangedBaseWritingDirection(WritingDirection);
    WEBCORE_EXPORT void insertDictationPhrases(Vector<Vector<String>>&& dictationPhrases, id metadata);
    WEBCORE_EXPORT void setDictationPhrasesAsChildOfElement(const Vector<Vector<String>>& dictationPhrases, id metadata, Element&);
#endif
    
    enum class KillRingInsertionMode { PrependText, AppendText };
    void addRangeToKillRing(const SimpleRange&, KillRingInsertionMode);
    void addTextToKillRing(const String&, KillRingInsertionMode);
    void setStartNewKillRingSequence(bool);

    void startAlternativeTextUITimer();
    // If user confirmed a correction in the correction panel, correction has non-zero length, otherwise it means that user has dismissed the panel.
    WEBCORE_EXPORT void handleAlternativeTextUIResult(const String& correction);
    void dismissCorrectionPanelAsIgnored();

    WEBCORE_EXPORT void pasteAsFragment(Ref<DocumentFragment>&&, bool smartReplace, bool matchStyle, MailBlockquoteHandling = MailBlockquoteHandling::RespectBlockquote, EditAction = EditAction::Paste);
    WEBCORE_EXPORT void pasteAsPlainText(const String&, bool smartReplace);

    // This is only called on the mac where paste is implemented primarily at the WebKit level.
    WEBCORE_EXPORT void pasteAsPlainTextBypassingDHTML();
 
    void clearMisspellingsAndBadGrammar(const VisibleSelection&);
    void markMisspellingsAndBadGrammar(const VisibleSelection&);

    RefPtr<Element> findEventTargetFrom(const VisibleSelection&) const;

    WEBCORE_EXPORT String selectedText() const;
    String selectedTextForDataTransfer() const;
    WEBCORE_EXPORT bool findString(const String&, FindOptions);

    WEBCORE_EXPORT std::optional<SimpleRange> rangeOfString(const String&, const std::optional<SimpleRange>& searchRange, FindOptions);

    const VisibleSelection& mark() const; // Mark, to be used as emacs uses it.
    void setMark(const VisibleSelection&);

    void computeAndSetTypingStyle(EditingStyle& , EditAction = EditAction::Unspecified);
    WEBCORE_EXPORT void computeAndSetTypingStyle(StyleProperties& , EditAction = EditAction::Unspecified);
    WEBCORE_EXPORT void applyEditingStyleToBodyElement() const;

    WEBCORE_EXPORT IntRect firstRectForRange(const SimpleRange&) const;

    void selectionWillChange();
    void respondToChangedSelection(const VisibleSelection& oldSelection, OptionSet<FrameSelection::SetSelectionOption>);
    WEBCORE_EXPORT void updateEditorUINowIfScheduled();
    bool shouldChangeSelection(const VisibleSelection& oldSelection, const VisibleSelection& newSelection, Affinity, bool stillSelecting) const;
    WEBCORE_EXPORT unsigned countMatchesForText(const String&, const std::optional<SimpleRange>&, FindOptions, unsigned limit, bool markMatches, Vector<SimpleRange>*);
    bool markedTextMatchesAreHighlighted() const;
    WEBCORE_EXPORT void setMarkedTextMatchesAreHighlighted(bool);

    void textFieldDidBeginEditing(Element&);
    void textFieldDidEndEditing(Element&);
    void textDidChangeInTextField(Element&);
    bool doTextFieldCommandFromEvent(Element&, KeyboardEvent*);
    void textWillBeDeletedInTextField(Element& input);
    void textDidChangeInTextArea(Element&);
    WEBCORE_EXPORT WritingDirection baseWritingDirectionForSelectionStart() const;

    enum class SelectReplacement : bool { No, Yes };
    enum class SmartReplace : bool { No, Yes };
    enum class MatchStyle : bool { No, Yes };
    WEBCORE_EXPORT void replaceSelectionWithFragment(DocumentFragment&, SelectReplacement, SmartReplace, MatchStyle, EditAction = EditAction::Insert, MailBlockquoteHandling = MailBlockquoteHandling::RespectBlockquote);
    WEBCORE_EXPORT void replaceSelectionWithText(const String&, SelectReplacement, SmartReplace, EditAction = EditAction::Insert);
    WEBCORE_EXPORT bool selectionStartHasMarkerFor(DocumentMarkerType, int from, int length) const;
    WEBCORE_EXPORT void selectionStartSetMarkerForTesting(DocumentMarkerType, int from, int length, const String&);
    void updateMarkersForWordsAffectedByEditing(bool doNotRemoveIfSelectionAtWordBoundary);
    void deletedAutocorrectionAtPosition(const Position&, const String& originalString);
    
    WEBCORE_EXPORT void simplifyMarkup(Node* startNode, Node* endNode);

    EditorParagraphSeparator defaultParagraphSeparator() const { return m_defaultParagraphSeparator; }
    void setDefaultParagraphSeparator(EditorParagraphSeparator separator) { m_defaultParagraphSeparator = separator; }
    Vector<String> dictationAlternativesForMarker(const DocumentMarker&);
    void applyDictationAlternative(const String& alternativeString);

#if USE(APPKIT)
    WEBCORE_EXPORT void uppercaseWord();
    WEBCORE_EXPORT void lowercaseWord();
    WEBCORE_EXPORT void capitalizeWord();
#endif

#if USE(AUTOMATIC_TEXT_REPLACEMENT)
    WEBCORE_EXPORT void showSubstitutionsPanel();
    WEBCORE_EXPORT bool substitutionsPanelIsShowing();
    WEBCORE_EXPORT void toggleSmartInsertDelete();
    WEBCORE_EXPORT bool isAutomaticQuoteSubstitutionEnabled();
    WEBCORE_EXPORT void toggleAutomaticQuoteSubstitution();
    WEBCORE_EXPORT bool isAutomaticLinkDetectionEnabled();
    WEBCORE_EXPORT void toggleAutomaticLinkDetection();
    WEBCORE_EXPORT bool isAutomaticDashSubstitutionEnabled();
    WEBCORE_EXPORT void toggleAutomaticDashSubstitution();
    WEBCORE_EXPORT bool isAutomaticTextReplacementEnabled();
    WEBCORE_EXPORT void toggleAutomaticTextReplacement();
    WEBCORE_EXPORT bool isAutomaticSpellingCorrectionEnabled();
    WEBCORE_EXPORT void toggleAutomaticSpellingCorrection();
    WEBCORE_EXPORT bool canEnableAutomaticSpellingCorrection() const;
#endif

    RefPtr<DocumentFragment> webContentFromPasteboard(Pasteboard&, const SimpleRange& context, bool allowPlainText, bool& chosePlainText);

    WEBCORE_EXPORT RefPtr<Font> fontForSelection(bool& hasMultipleFonts);
    WEBCORE_EXPORT const RenderStyle* styleForSelectionStart(RefPtr<Node>& nodeToRemove);
    WEBCORE_EXPORT FontAttributes fontAttributesAtSelectionStart();

#if PLATFORM(COCOA)
    WEBCORE_EXPORT String stringSelectionForPasteboard();
    String stringSelectionForPasteboardWithImageAltText();
    void takeFindStringFromSelection();
    WEBCORE_EXPORT void replaceSelectionWithAttributedString(NSAttributedString *, MailBlockquoteHandling = MailBlockquoteHandling::RespectBlockquote);
    WEBCORE_EXPORT void readSelectionFromPasteboard(const String& pasteboardName);
    WEBCORE_EXPORT void replaceNodeFromPasteboard(Node&, const String& pasteboardName, EditAction = EditAction::Paste);

#if ENABLE(MULTI_REPRESENTATION_HEIC)
    WEBCORE_EXPORT void insertMultiRepresentationHEIC(const std::span<const uint8_t>&, const String&);
#endif

    static RefPtr<SharedBuffer> dataInRTFDFormat(NSAttributedString *);
    static RefPtr<SharedBuffer> dataInRTFFormat(NSAttributedString *);

    static bool writingSuggestionsSupportsSuffix();
#endif

#if PLATFORM(MAC)
    WEBCORE_EXPORT RefPtr<SharedBuffer> dataSelectionForPasteboard(const String& pasteboardName);
#endif

    bool canCopyExcludingStandaloneImages() const;

#if !PLATFORM(WIN)
    WEBCORE_EXPORT void writeSelectionToPasteboard(Pasteboard&);
    WEBCORE_EXPORT void writeImageToPasteboard(Pasteboard&, Element& imageElement, const URL&, const String& title);
    void writeSelection(PasteboardWriterData&);
#endif

#if ENABLE(TELEPHONE_NUMBER_DETECTION) && PLATFORM(MAC)
    void scanSelectionForTelephoneNumbers();
    const Vector<SimpleRange>& detectedTelephoneNumberRanges() const { return m_detectedTelephoneNumberRanges; }
#endif

    WEBCORE_EXPORT String stringForCandidateRequest() const;
    WEBCORE_EXPORT void handleAcceptedCandidate(TextCheckingResult);
    WEBCORE_EXPORT std::optional<SimpleRange> contextRangeForCandidateRequest() const;
    std::optional<SimpleRange> rangeForTextCheckingResult(const TextCheckingResult&) const;
    bool isHandlingAcceptedCandidate() const { return m_isHandlingAcceptedCandidate; }

    void setIsGettingDictionaryPopupInfo(bool b) { m_isGettingDictionaryPopupInfo = b; }
    bool isGettingDictionaryPopupInfo() const { return m_isGettingDictionaryPopupInfo; }

#if ENABLE(ATTACHMENT_ELEMENT)
    WEBCORE_EXPORT void insertAttachment(const String& identifier, std::optional<uint64_t>&& fileSize, const AtomString& fileName, const AtomString& contentType);
    void registerAttachmentIdentifier(const String&, const String& contentType, const String& preferredFileName, Ref<FragmentedSharedBuffer>&& fileData);
    void registerAttachments(Vector<SerializedAttachmentData>&&);
    void registerAttachmentIdentifier(const String&, const String& contentType, const String& filePath);
    void registerAttachmentIdentifier(const String&, const AttachmentAssociatedElement&);
    void cloneAttachmentData(const String& fromIdentifier, const String& toIdentifier);
    void didInsertAttachmentElement(HTMLAttachmentElement&);
    void didRemoveAttachmentElement(HTMLAttachmentElement&);

    WEBCORE_EXPORT PromisedAttachmentInfo promisedAttachmentInfo(Element&);
#if PLATFORM(COCOA)
    void getPasteboardTypesAndDataForAttachment(Element&, Vector<std::pair<String, RefPtr<SharedBuffer>>>& outTypesAndData);
#endif
#endif

    WEBCORE_EXPORT RefPtr<TextPlaceholderElement> insertTextPlaceholder(const IntSize&);
    WEBCORE_EXPORT void removeTextPlaceholder(TextPlaceholderElement&);

    bool isPastingFromMenuOrKeyBinding() const { return m_pastingFromMenuOrKeyBinding; }
    bool isCopyingFromMenuOrKeyBinding() const { return m_copyingFromMenuOrKeyBinding; }

    WEBCORE_EXPORT Node* nodeBeforeWritingSuggestions() const;
    Element* writingSuggestionsContainerElement() const;
    WritingSuggestionData* writingSuggestionData() const { return m_writingSuggestionData.get(); }
    bool isInsertingTextForWritingSuggestion() const { return m_isInsertingTextForWritingSuggestion; }

    RenderInline* writingSuggestionRenderer() const;
    void setWritingSuggestionRenderer(RenderInline&);

    WEBCORE_EXPORT void closeTyping();

#if PLATFORM(IOS_FAMILY)
    bool shouldDrawVisuallyContiguousBidiSelection() const;
#endif

private:
    bool canDeleteRange(const SimpleRange&) const;
    bool canSmartReplaceWithPasteboard(Pasteboard&);
    void pasteAsPlainTextWithPasteboard(Pasteboard&);
    void pasteWithPasteboard(Pasteboard*, OptionSet<PasteOption>);
    String plainTextFromPasteboard(const PasteboardPlainText&);

    void platformCopyFont();
    void platformPasteFont();

    void quoteFragmentForPasting(DocumentFragment&);

    void revealSelectionAfterEditingOperation(const ScrollAlignment& = ScrollAlignment::alignCenterIfNeeded, RevealExtentOption = RevealExtentOption::DoNotRevealExtent);
    std::optional<SimpleRange> markMisspellingsOrBadGrammar(const VisibleSelection&, bool checkSpelling);
    OptionSet<TextCheckingType> resolveTextCheckingTypeMask(const Node& rootEditableElement, OptionSet<TextCheckingType>);

    WEBCORE_EXPORT String selectedText(TextIteratorBehaviors) const;

    void selectComposition();
    enum SetCompositionMode { ConfirmComposition, CancelComposition };
    void setComposition(const String&, SetCompositionMode);

    void changeSelectionAfterCommand(const VisibleSelection& newSelection, OptionSet<FrameSelection::SetSelectionOption>);

    enum EditorActionSpecifier { CutAction, CopyAction };
    void performCutOrCopy(EditorActionSpecifier);

    void editorUIUpdateTimerFired();

    RefPtr<Element> findEventTargetFromSelection() const;

    bool unifiedTextCheckerEnabled() const;

    std::optional<SimpleRange> adjustedSelectionRange();

#if PLATFORM(COCOA)
    RefPtr<SharedBuffer> selectionInWebArchiveFormat();
    String selectionInHTMLFormat();
    RefPtr<SharedBuffer> imageInWebArchiveFormat(Element&);
    static String userVisibleString(const URL&);
#endif

    void scheduleEditorUIUpdate();

#if ENABLE(ATTACHMENT_ELEMENT)
    void notifyClientOfAttachmentUpdates();
#endif

    String platformContentTypeForBlobType(const String& type) const;

    void postTextStateChangeNotificationForCut(const String&, const VisibleSelection&);

    void removeWritingSuggestionIfNeeded();

    WeakPtr<EditorClient> m_client;
    WeakRef<Document, WeakPtrImplWithEventTargetData> m_document;
    RefPtr<CompositeEditCommand> m_lastEditCommand;
    RefPtr<Text> m_compositionNode;
    unsigned m_compositionStart;
    unsigned m_compositionEnd;
    Vector<CompositionUnderline> m_customCompositionUnderlines;
    Vector<CompositionHighlight> m_customCompositionHighlights;
    HashMap<String, Vector<CharacterRange>> m_customCompositionAnnotations;
    bool m_ignoreSelectionChanges { false };
    bool m_shouldStartNewKillRingSequence { false };
    bool m_shouldStyleWithCSS { false };
    const UniqueRef<PAL::KillRing> m_killRing;
    const UniqueRef<SpellChecker> m_spellChecker;
    const UniqueRef<AlternativeTextController> m_alternativeTextController;
    EditorParagraphSeparator m_defaultParagraphSeparator { EditorParagraphSeparator::div };
    bool m_overwriteModeEnabled { false };

#if ENABLE(WRITING_TOOLS)
    bool m_suppressEditingForWritingTools { false };
#endif

#if ENABLE(ATTACHMENT_ELEMENT)
    MemoryCompactRobinHoodHashSet<String> m_insertedAttachmentIdentifiers;
    MemoryCompactRobinHoodHashSet<String> m_removedAttachmentIdentifiers;
#endif

    std::unique_ptr<WritingSuggestionData> m_writingSuggestionData;
    SingleThreadWeakPtr<RenderInline> m_writingSuggestionRenderer;
    bool m_isInsertingTextForWritingSuggestion { false };

    VisibleSelection m_mark;
    bool m_areMarkedTextMatchesHighlighted { false };

    VisibleSelection m_oldSelectionForEditorUIUpdate;
    Timer m_editorUIUpdateTimer;
    bool m_editorUIUpdateTimerShouldCheckSpellingAndGrammar { false };
    bool m_editorUIUpdateTimerWasTriggeredByDictation { false };
    bool m_isHandlingAcceptedCandidate { false };
    bool m_copyingFromMenuOrKeyBinding { false };
    bool m_pastingFromMenuOrKeyBinding { false };

#if ENABLE(TELEPHONE_NUMBER_DETECTION) && PLATFORM(MAC)
    bool shouldDetectTelephoneNumbers() const;

    DeferrableOneShotTimer m_telephoneNumberDetectionUpdateTimer;
    Vector<SimpleRange> m_detectedTelephoneNumberRanges;
#endif

    mutable std::unique_ptr<ScrollView::ProhibitScrollingWhenChangingContentSizeForScope> m_prohibitScrollingDueToContentSizeChangesWhileTyping;

    bool m_isGettingDictionaryPopupInfo { false };
    bool m_hasHandledAnyEditing { false };
    HashSet<RefPtr<HTMLImageElement>> m_imageElementsToLoadBeforeRevealingSelection;
};

inline void Editor::setStartNewKillRingSequence(bool flag)
{
    m_shouldStartNewKillRingSequence = flag;
}

inline const VisibleSelection& Editor::mark() const
{
    return m_mark;
}

inline void Editor::setMark(const VisibleSelection& selection)
{
    m_mark = selection;
}

inline bool Editor::markedTextMatchesAreHighlighted() const
{
    return m_areMarkedTextMatchesHighlighted;
}

} // namespace WebCore
