/*
 * Copyright (C) 2006-2016 Apple Inc. All rights reserved.
 * Copyright (C) 2008 Nokia Corporation and/or its subsidiary(-ies)
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

#include "EditorInsertAction.h"
#include "FrameIdentifier.h"
#include "SerializedAttachmentData.h"
#include "TextAffinity.h"
#include "TextChecking.h"
#include "UndoStep.h"
#include <wtf/CheckedPtr.h>
#include <wtf/Forward.h>
#include <wtf/TZoneMallocInlines.h>
#include <wtf/Vector.h>
#include <wtf/WeakPtr.h>

namespace WebCore {

enum class DOMPasteAccessCategory : uint8_t;
enum class DOMPasteAccessResponse : uint8_t;

#if ENABLE(ATTACHMENT_ELEMENT)
enum class AttachmentAssociatedElementType : uint8_t;
#endif

class SharedBuffer;
class Document;
class DocumentFragment;
class Element;
class KeyboardEvent;
class LocalFrame;
class Node;
class FragmentedSharedBuffer;
class StyleProperties;
class TextCheckerClient;
class VisibleSelection;

struct GapRects;
struct GrammarDetail;
struct SimpleRange;

class EditorClient : public CanMakeWeakPtr<EditorClient>, public CanMakeCheckedPtr<EditorClient> {
    WTF_MAKE_TZONE_ALLOCATED_INLINE(EditorClient);
    WTF_OVERRIDE_DELETE_FOR_CHECKED_PTR(EditorClient);
public:
    virtual ~EditorClient() = default;

    virtual bool shouldDeleteRange(const std::optional<SimpleRange>&) = 0;
    virtual bool smartInsertDeleteEnabled() = 0; 
    virtual bool isSelectTrailingWhitespaceEnabled() const = 0;
    virtual bool isContinuousSpellCheckingEnabled() = 0;
    virtual void toggleContinuousSpellChecking() = 0;
    virtual bool isGrammarCheckingEnabled() = 0;
    virtual void toggleGrammarChecking() = 0;
    virtual int spellCheckerDocumentTag() = 0;

    virtual bool shouldBeginEditing(const SimpleRange&) = 0;
    virtual bool shouldEndEditing(const SimpleRange&) = 0;
    virtual bool shouldInsertNode(Node&, const std::optional<SimpleRange>&, EditorInsertAction) = 0;
    virtual bool shouldInsertText(const String&, const std::optional<SimpleRange>&, EditorInsertAction) = 0;
    virtual bool shouldChangeSelectedRange(const std::optional<SimpleRange>& fromRange, const std::optional<SimpleRange>& toRange, Affinity, bool stillSelecting) = 0;
    virtual bool shouldRevealCurrentSelectionAfterInsertion() const { return true; };
    virtual bool shouldSuppressPasswordEcho() const { return false; };
    virtual bool shouldRemoveDictationAlternativesAfterEditing() const { return true; }
    
    virtual bool shouldApplyStyle(const StyleProperties&, const std::optional<SimpleRange>&) = 0;
    virtual void didApplyStyle() = 0;
    virtual bool shouldMoveRangeAfterDelete(const SimpleRange&, const SimpleRange&) = 0;

#if ENABLE(ATTACHMENT_ELEMENT)
    virtual void registerAttachmentIdentifier(const String& /* identifier */, const String& /* contentType */, const String& /* preferredFileName */, Ref<FragmentedSharedBuffer>&&) { }
    virtual void registerAttachmentIdentifier(const String& /* identifier */, const String& /* contentType */, const String& /* filePath */) { }
    virtual void registerAttachments(Vector<SerializedAttachmentData>&&) { }
    virtual void registerAttachmentIdentifier(const String& /* identifier */) { }
    virtual void cloneAttachmentData(const String& /* fromIdentifier */, const String& /* toIdentifier */) { }
    virtual void didInsertAttachmentWithIdentifier(const String& /* identifier */, const String& /* source */, AttachmentAssociatedElementType /* associatedElementType */) { }
    virtual void didRemoveAttachmentWithIdentifier(const String&) { }
    virtual bool supportsClientSideAttachmentData() const { return false; }
    virtual Vector<SerializedAttachmentData> serializedAttachmentDataForIdentifiers(const Vector<String>&) { return { }; }
#endif

    virtual void didBeginEditing() = 0;
    virtual void respondToChangedContents() = 0;
    virtual void respondToChangedSelection(LocalFrame*) = 0;
    virtual void didEndUserTriggeredSelectionChanges() = 0;
    virtual void updateEditorStateAfterLayoutIfEditabilityChanged() = 0;
    virtual void didEndEditing() = 0;
    virtual void willWriteSelectionToPasteboard(const std::optional<SimpleRange>&) = 0;
    virtual void didWriteSelectionToPasteboard() = 0;
    virtual void getClientPasteboardData(const std::optional<SimpleRange>&, Vector<std::pair<String, RefPtr<WebCore::SharedBuffer>>>& pasteboardTypesAndData) = 0;
    virtual void requestCandidatesForSelection(const VisibleSelection&) { }
    virtual void handleAcceptedCandidateWithSoftSpaces(TextCheckingResult) { }

    virtual DOMPasteAccessResponse requestDOMPasteAccess(DOMPasteAccessCategory, FrameIdentifier, const String& originIdentifier) = 0;

    // Notify an input method that a composition was voluntarily discarded by WebCore, so that it could clean up too.
    // This function is not called when a composition is closed per a request from an input method.
    virtual void discardedComposition(const Document&) = 0;
    virtual void canceledComposition() = 0;
    virtual void didUpdateComposition() = 0;

    virtual void registerUndoStep(UndoStep&) = 0;
    virtual void registerRedoStep(UndoStep&) = 0;
    virtual void clearUndoRedoOperations() = 0;

    virtual bool canCopyCut(LocalFrame*, bool defaultValue) const = 0;
    virtual bool canPaste(LocalFrame*, bool defaultValue) const = 0;
    virtual bool canUndo() const = 0;
    virtual bool canRedo() const = 0;
    
    virtual void undo() = 0;
    virtual void redo() = 0;

    virtual void handleKeyboardEvent(KeyboardEvent&) = 0;
    virtual void handleInputMethodKeydown(KeyboardEvent&) = 0;
    virtual void didDispatchInputMethodKeydown(KeyboardEvent&) { }
    
    virtual void textFieldDidBeginEditing(Element&) = 0;
    virtual void textFieldDidEndEditing(Element&) = 0;
    virtual void textDidChangeInTextField(Element&) = 0;
    virtual bool doTextFieldCommandFromEvent(Element&, KeyboardEvent*) = 0;
    virtual void textWillBeDeletedInTextField(Element&) = 0;
    virtual void textDidChangeInTextArea(Element&) = 0;
    virtual void overflowScrollPositionChanged() = 0;
    virtual void subFrameScrollPositionChanged() = 0;

#if PLATFORM(IOS_FAMILY)
    virtual void startDelayingAndCoalescingContentChangeNotifications() = 0;
    virtual void stopDelayingAndCoalescingContentChangeNotifications() = 0;
    virtual bool hasRichlyEditableSelection() = 0;
    virtual int getPasteboardItemsCount() = 0;
    virtual RefPtr<DocumentFragment> documentFragmentFromDelegate(int index) = 0;
    virtual bool performsTwoStepPaste(DocumentFragment*) = 0;
    virtual void updateStringForFind(const String&) = 0;
#endif

#if PLATFORM(COCOA)
    virtual void setInsertionPasteboard(const String& pasteboardName) = 0;
#endif

#if USE(APPKIT)
    virtual void uppercaseWord() = 0;
    virtual void lowercaseWord() = 0;
    virtual void capitalizeWord() = 0;
#endif

#if USE(AUTOMATIC_TEXT_REPLACEMENT)
    virtual void showSubstitutionsPanel(bool show) = 0;
    virtual bool substitutionsPanelIsShowing() = 0;
    virtual void toggleSmartInsertDelete() = 0;
    virtual bool isAutomaticQuoteSubstitutionEnabled() = 0;
    virtual void toggleAutomaticQuoteSubstitution() = 0;
    virtual bool isAutomaticLinkDetectionEnabled() = 0;
    virtual void toggleAutomaticLinkDetection() = 0;
    virtual bool isAutomaticDashSubstitutionEnabled() = 0;
    virtual void toggleAutomaticDashSubstitution() = 0;
    virtual bool isAutomaticTextReplacementEnabled() = 0;
    virtual void toggleAutomaticTextReplacement() = 0;
    virtual bool isAutomaticSpellingCorrectionEnabled() = 0;
    virtual void toggleAutomaticSpellingCorrection() = 0;
#endif
    
#if PLATFORM(GTK)
    virtual bool shouldShowUnicodeMenu() = 0;
#endif

    virtual TextCheckerClient* textChecker() = 0;

    virtual void updateSpellingUIWithGrammarString(const String&, const GrammarDetail& detail) = 0;
    virtual void updateSpellingUIWithMisspelledWord(const String&) = 0;
    virtual void showSpellingUI(bool show) = 0;
    virtual bool spellingUIIsShowing() = 0;
    virtual void setInputMethodState(Element*) = 0;

    // Support for global selections, used on platforms like the X Window System that treat
    // selection as a type of clipboard.
    virtual bool supportsGlobalSelection() { return false; }

    virtual bool performTwoStepDrop(DocumentFragment&, const SimpleRange& destination, bool isMove) = 0;

    virtual bool shouldAllowSingleClickToChangeSelection(Node&, const VisibleSelection&) const { return true; }

    virtual void willChangeSelectionForAccessibility() { }
    virtual void didChangeSelectionForAccessibility() { }

#if PLATFORM(IOS_FAMILY)
    virtual bool shouldDrawVisuallyContiguousBidiSelection() const { return false; }
#endif
};

}
