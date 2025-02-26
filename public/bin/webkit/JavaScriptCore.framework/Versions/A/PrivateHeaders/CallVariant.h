/*
 * Copyright (C) 2014-2023 Apple Inc. All rights reserved.
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

#include "ExecutableBase.h"
#include "FunctionExecutable.h"
#include "JSCast.h"
#include "JSFunction.h"
#include "NativeExecutable.h"
#include <wtf/TZoneMalloc.h>

namespace JSC {

// The CallVariant class is meant to encapsulate a callee in a way that is useful for call linking
// and inlining. Because JavaScript has closures, and because JSC implements the notion of internal
// non-function objects that nevertheless provide call traps, the call machinery wants to see a
// callee in one of the following four forms:
//
// JSFunction callee: This means that we expect the callsite to always call a particular function
//     instance, that is associated with a particular lexical environment. This pinpoints not
//     just the code that will be called (i.e. the executable) but also the scope within which
//     the code runs.
//
// Executable callee: This corresponds to a call to a closure. In this case, we know that the
//     callsite will call a JSFunction, but we do not know which particular JSFunction. We do know
//     what code will be called - i.e. we know the executable.
//
// InternalFunction callee: JSC supports a special kind of native functions that support bizarre
//     semantics. These are always singletons. If we know that the callee is an InternalFunction
//     then we know both the code that will be called and the scope; in fact the "scope" is really
//     just the InternalFunction itself.
//
// Something else: It's possible call all manner of rubbish in JavaScript. This implicitly supports
//     bizarre object callees, but it can't really tell you anything interesting about them other
//     than the fact that they don't fall into any of the above categories.
//
// This class serves as a kind of union over these four things. It does so by just holding a
// JSCell*. We determine which of the modes its in by doing type checks on the cell. Note that we
// cannot use WriteBarrier<> here because this gets used inside the compiler.

class CallVariant {
    WTF_MAKE_TZONE_ALLOCATED(CallVariant);
public:
    explicit CallVariant(JSCell* callee = nullptr)
        : m_callee(callee)
    {
    }
    
    CallVariant(WTF::HashTableDeletedValueType)
        : m_callee(deletedToken())
    {
    }
    
    explicit operator bool() const { return !!m_callee; }
    
    // If this variant refers to a function, change it to refer to its executable.
    ALWAYS_INLINE CallVariant despecifiedClosure() const
    {
        if (m_callee->type() == JSFunctionType)
            return CallVariant(jsCast<JSFunction*>(m_callee)->executable());
        return *this;
    }
    
    JSCell* rawCalleeCell() const { return m_callee; }
    
    InternalFunction* internalFunction() const
    {
        return jsDynamicCast<InternalFunction*>(m_callee);
    }
    
    JSFunction* function() const
    {
        return jsDynamicCast<JSFunction*>(m_callee);
    }
    
    bool isClosureCall() const { return !!jsDynamicCast<ExecutableBase*>(m_callee); }
    
    ExecutableBase* executable() const
    {
        if (JSFunction* function = this->function())
            return function->executable();
        return jsDynamicCast<ExecutableBase*>(m_callee);
    }
    
    JSCell* nonExecutableCallee() const
    {
        RELEASE_ASSERT(!isClosureCall());
        return m_callee;
    }
    
    inline Intrinsic intrinsicFor(CodeSpecializationKind) const;
    
    FunctionExecutable* functionExecutable() const
    {
        if (ExecutableBase* executable = this->executable())
            return jsDynamicCast<FunctionExecutable*>(executable);
        return nullptr;
    }

    NativeExecutable* nativeExecutable() const
    {
        if (ExecutableBase* executable = this->executable())
            return jsDynamicCast<NativeExecutable*>(executable);
        return nullptr;
    }

    const DOMJIT::Signature* signatureFor(CodeSpecializationKind kind) const
    {
        if (NativeExecutable* nativeExecutable = this->nativeExecutable())
            return nativeExecutable->signatureFor(kind);
        return nullptr;
    }
    
    bool finalize(VM&);
    
    bool merge(const CallVariant&);
    
    void filter(JSValue);
    
    void dump(PrintStream& out) const;
    
    bool isHashTableDeletedValue() const
    {
        return m_callee == deletedToken();
    }
    
    friend bool operator==(const CallVariant&, const CallVariant&) = default;
    
    bool operator<(const CallVariant& other) const
    {
        return m_callee < other.m_callee;
    }
    
    bool operator>(const CallVariant& other) const
    {
        return other < *this;
    }
    
    bool operator<=(const CallVariant& other) const
    {
        return !(*this < other);
    }
    
    bool operator>=(const CallVariant& other) const
    {
        return other <= *this;
    }
    
    unsigned hash() const
    {
        return WTF::PtrHash<JSCell*>::hash(m_callee);
    }
    
private:
    static JSCell* deletedToken() { return std::bit_cast<JSCell*>(static_cast<uintptr_t>(1)); }
    
    JSCell* m_callee;
};

struct CallVariantHash {
    static unsigned hash(const CallVariant& key) { return key.hash(); }
    static bool equal(const CallVariant& a, const CallVariant& b) { return a == b; }
    static constexpr bool safeToCompareToEmptyOrDeleted = true;
};

typedef Vector<CallVariant, 1> CallVariantList;

// Returns a new variant list by attempting to either append the given variant or merge it with one
// of the variants we already have by despecifying closures.
CallVariantList variantListWithVariant(const CallVariantList&, CallVariant);

// Returns a new list where every element is despecified, and the list is deduplicated.
CallVariantList despecifiedVariantList(const CallVariantList&);

} // namespace JSC

namespace WTF {

template<typename T> struct DefaultHash;
template<> struct DefaultHash<JSC::CallVariant> : JSC::CallVariantHash { };

template<typename T> struct HashTraits;
template<> struct HashTraits<JSC::CallVariant> : SimpleClassHashTraits<JSC::CallVariant> { };

} // namespace WTF
