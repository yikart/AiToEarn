/*
 * Copyright (C) 2014, 2015 Apple Inc. All rights reserved.
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

#include "ObjectPropertyConditionSet.h"
#include "PropertyOffset.h"

namespace JSC {

class CodeBlock;
class StructureChain;

// This class is useful for figuring out how to inline a cached get-like access. We
// say "get-like" because this is appropriate for loading the GetterSetter object in
// a put_by_id that hits a setter. Notably, this doesn't figure out how to call
// accessors, or even whether they should be called. What it gives us, is a way of
// determining how to load the value from the requested property (identified by a
// StringImpl* uid) from an object of the given structure in the given CodeBlock,
// assuming that such an access had already been cached by Repatch (and so Repatch had
// already done a bunch of safety checks). This doesn't reexecute any checks that
// Repatch would have executed, and for prototype chain accesses, it doesn't ask the
// objects in the prototype chain whether their getOwnPropertySlot would attempt to
// intercept the access - so this really is only appropriate if you already know that
// one of the JITOperations had OK'd this for caching and that Repatch concurred.
//
// The typical use pattern is something like:
//
//     ComplexGetStatus status = ComplexGetStatus::computeFor(...);
//     switch (status.kind()) {
//     case ComplexGetStatus::ShouldSkip:
//         // Handle the case where this kind of access is possibly safe but wouldn't
//         // pass the required safety checks. For example, if an IC gives us a list of
//         // accesses and one of them is ShouldSkip, then we should pretend as if it
//         // wasn't even there.
//         break;
//     case ComplexGetStatus::TakesSlowPath:
//         // This kind of access is not safe to inline. Bail out of any attempst to
//         // inline.
//         break;
//     case ComplexGetStatus::Inlineable:
//         // The good stuff goes here. If it's Inlineable then the other properties of
//         // the 'status' object will tell you everything you need to know about how
//         // to execute the get-like operation.
//         break;
//     }

class ComplexGetStatus final {
public:
    enum Kind {
        ShouldSkip,
        TakesSlowPath,
        Inlineable
    };
    
    ComplexGetStatus()
        : m_kind(ShouldSkip)
        , m_offset(invalidOffset)
    {
    }
    
    static ComplexGetStatus skip()
    {
        return ComplexGetStatus();
    }
    
    static ComplexGetStatus takesSlowPath()
    {
        ComplexGetStatus result;
        result.m_kind = TakesSlowPath;
        return result;
    }
    
    static ComplexGetStatus computeFor(
        Structure* headStructure, const ObjectPropertyConditionSet&, UniquedStringImpl* uid);
    
    Kind kind() const { return m_kind; }
    PropertyOffset offset() const { return m_offset; }
    const ObjectPropertyConditionSet& conditionSet() const { return m_conditionSet; }
    
private:
    Kind m_kind;
    PropertyOffset m_offset;
    ObjectPropertyConditionSet m_conditionSet;
};

} // namespace JSC
