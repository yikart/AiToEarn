/*
 * Copyright (C) 2005, 2006, 2008 Apple Inc. All rights reserved.
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

#include "AXTextStateChangeIntent.h"
#include "EditAction.h"
#include "VisibleSelection.h"
#include <wtf/WeakPtr.h>

#ifndef NDEBUG
#include <wtf/HashSet.h>
#endif

namespace WebCore {

class CompositeEditCommand;
class Document;
class Element;

ASCIILiteral inputTypeNameForEditingAction(EditAction);
bool isInputMethodComposingForEditingAction(EditAction);

class EditCommand : public RefCounted<EditCommand> {
public:
    virtual ~EditCommand();

    void setParent(RefPtr<CompositeEditCommand>&&);

    virtual EditAction editingAction() const;

    const VisibleSelection& startingSelection() const { return m_startingSelection; }
    const VisibleSelection& endingSelection() const { return m_endingSelection; }

    virtual bool isInsertTextCommand() const { return false; }    
    virtual bool isSimpleEditCommand() const { return false; }
    virtual bool isCompositeEditCommand() const { return false; }
    bool isTopLevelCommand() const { return !m_parent; }

    virtual void doApply() = 0;

protected:
    explicit EditCommand(Ref<Document>&&, EditAction = EditAction::Unspecified);
    EditCommand(Ref<Document>&&, const VisibleSelection&, const VisibleSelection&);

    Ref<Document> protectedDocument() const { return m_document.copyRef(); }
    const Document& document() const { return m_document; }
    Document& document() { return m_document; }
    CompositeEditCommand* parent() const { return m_parent.get(); }
    void setStartingSelection(const VisibleSelection&);
    WEBCORE_EXPORT void setEndingSelection(const VisibleSelection&);

    bool isEditingTextAreaOrTextInput() const;

    void postTextStateChangeNotification(AXTextEditType, const String&);
    void postTextStateChangeNotification(AXTextEditType, const String&, const VisiblePosition&);

private:
    Ref<Document> m_document;
    VisibleSelection m_startingSelection;
    VisibleSelection m_endingSelection;
    WeakPtr<CompositeEditCommand> m_parent;
    EditAction m_editingAction { EditAction::Unspecified };
};

enum ShouldAssumeContentIsAlwaysEditable {
    AssumeContentIsAlwaysEditable,
    DoNotAssumeContentIsAlwaysEditable,
};

class SimpleEditCommand : public EditCommand {
public:
    virtual void doUnapply() = 0;
    virtual void doReapply(); // calls doApply()

#ifndef NDEBUG
    virtual void getNodesInCommand(HashSet<Ref<Node>>&) = 0;
#endif

protected:
    explicit SimpleEditCommand(Ref<Document>&&, EditAction = EditAction::Unspecified);

#ifndef NDEBUG
    void addNodeAndDescendants(Node*, HashSet<Ref<Node>>&);
#endif

private:
    bool isSimpleEditCommand() const override { return true; }
};

inline SimpleEditCommand* toSimpleEditCommand(EditCommand* command)
{
    ASSERT(command);
    ASSERT_WITH_SECURITY_IMPLICATION(command->isSimpleEditCommand());
    return static_cast<SimpleEditCommand*>(command);
}

} // namespace WebCore
