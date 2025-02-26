/*
 * Copyright (C) 2019-2021 Apple Inc. All rights reserved.
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

#include "RootMarkReason.h"
#include <wtf/text/UniquedStringImpl.h>
#include <wtf/text/WTFString.h>

namespace JSC {

class JSCell;

class JS_EXPORT_PRIVATE HeapAnalyzer {
public:
    virtual ~HeapAnalyzer() = default;

    // A root or marked cell.
    virtual void analyzeNode(JSCell*) = 0;

    // A reference from one cell to another.
    virtual void analyzeEdge(JSCell* from, JSCell* to, RootMarkReason) = 0;
    virtual void analyzePropertyNameEdge(JSCell* from, JSCell* to, UniquedStringImpl* propertyName) = 0;
    virtual void analyzeVariableNameEdge(JSCell* from, JSCell* to, UniquedStringImpl* variableName) = 0;
    virtual void analyzeIndexEdge(JSCell* from, JSCell* to, uint32_t index) = 0;

    virtual void setOpaqueRootReachabilityReasonForCell(JSCell*, ASCIILiteral) = 0;
    virtual void setWrappedObjectForCell(JSCell*, void*) = 0;
    virtual void setLabelForCell(JSCell*, const String&) = 0;
};

} // namespace JSC
