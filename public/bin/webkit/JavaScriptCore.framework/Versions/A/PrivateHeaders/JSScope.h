/*
 * Copyright (C) 2012-2021 Apple Inc. All Rights Reserved.
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

#include "GetPutInfo.h"
#include "JSObject.h"
#include "VariableEnvironment.h"

namespace JSC {

class ScopeChainIterator;
class SymbolTable;
class WatchpointSet;

using TDZEnvironment = HashSet<RefPtr<UniquedStringImpl>, IdentifierRepHash>;

class JSScope : public JSNonFinalObject {
public:
    using Base = JSNonFinalObject;
    static constexpr unsigned StructureFlags = Base::StructureFlags;

    template<typename, SubspaceAccess>
    static void subspaceFor(VM&)
    {
        RELEASE_ASSERT_NOT_REACHED();
    }

    DECLARE_EXPORT_INFO;

    friend class LLIntOffsetsExtractor;
    static size_t offsetOfNext();

    static JSObject* objectAtScope(JSScope*);

    static JSObject* resolve(JSGlobalObject*, JSScope*, const Identifier&);
    static JSValue resolveScopeForHoistingFuncDeclInEval(JSGlobalObject*, JSScope*, const Identifier&);
    static ResolveOp abstractResolve(JSGlobalObject*, size_t depthOffset, JSScope*, const Identifier&, GetOrPut, ResolveType, InitializationMode);

    static bool hasConstantScope(ResolveType);
    static JSScope* constantScopeForCodeBlock(ResolveType, CodeBlock*);

    static void collectClosureVariablesUnderTDZ(JSScope*, TDZEnvironment& result, PrivateNameEnvironment&);

    DECLARE_VISIT_CHILDREN;

    bool isVarScope();
    bool isLexicalScope();
    bool isModuleScope();
    bool isCatchScope();
    bool isCatchScopeWithSimpleParameter();
    bool isFunctionNameScopeObject();

    bool isNestedLexicalScope();

    ScopeChainIterator begin();
    ScopeChainIterator end();
    JSScope* next();

    JSObject* globalThis();

    SymbolTable* symbolTable();

protected:
    JSScope(VM&, Structure*, JSScope* next);

    template<typename ReturnPredicateFunctor, typename SkipPredicateFunctor>
    static JSObject* resolve(JSGlobalObject*, JSScope*, const Identifier&, ReturnPredicateFunctor, SkipPredicateFunctor);

private:
    WriteBarrier<JSScope> m_next;
};

inline JSScope::JSScope(VM& vm, Structure* structure, JSScope* next)
    : Base(vm, structure)
    , m_next(next, WriteBarrierEarlyInit)
{
}

class ScopeChainIterator {
public:
    ScopeChainIterator(JSScope* node)
        : m_node(node)
    {
    }

    JSObject* get() const { return JSScope::objectAtScope(m_node); }
    JSObject* operator->() const { return JSScope::objectAtScope(m_node); }
    JSScope* scope() const { return m_node; }

    ScopeChainIterator& operator++() { m_node = m_node->next(); return *this; }

    // postfix ++ intentionally omitted

    friend bool operator==(const ScopeChainIterator&, const ScopeChainIterator&) = default;

private:
    JSScope* m_node;
};

inline ScopeChainIterator JSScope::begin()
{
    return ScopeChainIterator(this); 
}

inline ScopeChainIterator JSScope::end()
{ 
    return ScopeChainIterator(nullptr); 
}

inline JSScope* JSScope::next()
{ 
    return m_next.get();
}

inline size_t JSScope::offsetOfNext()
{
    return OBJECT_OFFSETOF(JSScope, m_next);
}

} // namespace JSC
