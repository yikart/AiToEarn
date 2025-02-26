/*
 * Copyright (C) 2008 Nikolas Zimmermann <zimmermann@kde.org>
 * Copyright (C) 2009-2022 Apple Inc. All rights reserved.
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

#include "ContainerNode.h"
#include "ContentSecurityPolicy.h"
#include "LoadableScript.h"
#include "ReferrerPolicy.h"
#include "RequestPriority.h"
#include "ScriptExecutionContextIdentifier.h"
#include "ScriptType.h"
#include "UserGestureIndicator.h"
#include <JavaScriptCore/Forward.h>
#include <wtf/MonotonicTime.h>
#include <wtf/text/TextPosition.h>

namespace WebCore {

class CachedScript;
class ContainerNode;
class Element;
class LoadableModuleScript;
class PendingScript;
class ScriptSourceCode;

class ScriptElement {
public:
    virtual ~ScriptElement() = default;

    Element& element() { return m_element.get(); }
    const Element& element() const { return m_element.get(); }
    Ref<Element> protectedElement() const { return m_element.get(); }

    bool prepareScript(const TextPosition& scriptStartPosition = TextPosition());

    const AtomString& scriptCharset() const { return m_characterEncoding; }
    WEBCORE_EXPORT String scriptContent() const;
    void executeClassicScript(const ScriptSourceCode&);
    void executeModuleScript(LoadableModuleScript&);
    void registerImportMap(const ScriptSourceCode&);

    void executePendingScript(PendingScript&);

    virtual bool hasAsyncAttribute() const = 0;
    virtual bool hasDeferAttribute() const = 0;
    virtual bool hasSourceAttribute() const = 0;
    virtual bool hasNoModuleAttribute() const = 0;

    // XML parser calls these
    virtual void dispatchLoadEvent() = 0;
    virtual void dispatchErrorEvent();

    bool haveFiredLoadEvent() const { return m_haveFiredLoad; }
    bool errorOccurred() const { return m_errorOccurred; }
    bool willBeParserExecuted() const { return m_willBeParserExecuted; }
    bool readyToBeParserExecuted() const { return m_readyToBeParserExecuted; }
    bool willExecuteWhenDocumentFinishedParsing() const { return m_willExecuteWhenDocumentFinishedParsing; }
    bool willExecuteInOrder() const { return m_willExecuteInOrder; }
    LoadableScript* loadableScript() { return m_loadableScript.get(); }

    ScriptType scriptType() const { return m_scriptType; }

    JSC::SourceTaintedOrigin sourceTaintedOrigin() const { return m_taintedOrigin; }

    void ref() const;
    void deref() const;

    static std::optional<ScriptType> determineScriptType(const String& typeAttribute, const String& languageAttribute, bool isHTMLDocument = true);

protected:
    ScriptElement(Element&, bool createdByParser, bool isEvaluated);

    void setHaveFiredLoadEvent(bool haveFiredLoad) { m_haveFiredLoad = haveFiredLoad; }
    void setErrorOccurred(bool errorOccurred) { m_errorOccurred = errorOccurred; }
    ParserInserted isParserInserted() const { return m_parserInserted; }
    bool alreadyStarted() const { return m_alreadyStarted; }
    bool forceAsync() const { return m_forceAsync; }

    // Helper functions used by our parent classes.
    Node::InsertedIntoAncestorResult insertedIntoAncestor(Node::InsertionType insertionType, ContainerNode&) const
    {
        if (insertionType.connectedToDocument && m_parserInserted == ParserInserted::No)
            return Node::InsertedIntoAncestorResult::NeedsPostInsertionCallback;
        return Node::InsertedIntoAncestorResult::Done;
    }

    void didFinishInsertingNode();
    void childrenChanged(const ContainerNode::ChildChange&);
    void finishParsingChildren();
    void handleSourceAttribute(const String& sourceURL);
    void handleAsyncAttribute();

    void setTrustedScriptText(const String&);

    virtual void potentiallyBlockRendering() { }
    virtual void unblockRendering() { }

private:
    void executeScriptAndDispatchEvent(LoadableScript&);

    std::optional<ScriptType> determineScriptType() const;
    bool ignoresLoadRequest() const;
    void dispatchLoadEventRespectingUserGestureIndicator();

    bool requestClassicScript(const String& sourceURL);
    bool requestModuleScript(const TextPosition& scriptStartPosition);

    void updateTaintedOriginFromSourceURL();

    virtual String sourceAttributeValue() const = 0;
    virtual AtomString charsetAttributeValue() const = 0;
    virtual String typeAttributeValue() const = 0;
    virtual String languageAttributeValue() const = 0;
    virtual ReferrerPolicy referrerPolicy() const = 0;
    virtual RequestPriority fetchPriorityHint() const { return RequestPriority::Auto; }

    virtual bool isScriptPreventedByAttributes() const { return false; }

    WeakRef<Element, WeakPtrImplWithEventTargetData> m_element;
    OrdinalNumber m_startLineNumber { OrdinalNumber::beforeFirst() };
    JSC::SourceTaintedOrigin m_taintedOrigin;
    ParserInserted m_parserInserted : bitWidthOfParserInserted;
    bool m_isExternalScript : 1 { false };
    bool m_alreadyStarted : 1;
    bool m_haveFiredLoad : 1 { false };
    bool m_errorOccurred : 1 { false };
    bool m_willBeParserExecuted : 1 { false }; // Same as "The parser will handle executing the script."
    bool m_readyToBeParserExecuted : 1 { false };
    bool m_willExecuteWhenDocumentFinishedParsing : 1 { false };
    bool m_forceAsync : 1;
    bool m_willExecuteInOrder : 1 { false };
    bool m_childrenChangedByAPI : 1 { false };
    ScriptType m_scriptType : bitWidthOfScriptType { ScriptType::Classic };
    AtomString m_characterEncoding;
    AtomString m_fallbackCharacterEncoding;
    RefPtr<LoadableScript> m_loadableScript;

    // https://html.spec.whatwg.org/multipage/scripting.html#preparation-time-document
    Markable<ScriptExecutionContextIdentifier> m_preparationTimeDocumentIdentifier;

    MonotonicTime m_creationTime;
    RefPtr<UserGestureToken> m_userGestureToken;

    // https://w3c.github.io/trusted-types/dist/spec/#slots-with-trusted-values
    String m_trustedScriptText { emptyString() };
};

// FIXME: replace with is/downcast<ScriptElement>.
bool isScriptElement(Element&);
ScriptElement* dynamicDowncastScriptElement(Element&);

}
