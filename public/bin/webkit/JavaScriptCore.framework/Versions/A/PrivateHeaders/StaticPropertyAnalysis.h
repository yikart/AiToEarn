/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

#include "InstructionStream.h"
#include <wtf/HashSet.h>

namespace JSC {

// Reference count indicates number of live registers that alias this object.
class StaticPropertyAnalysis : public RefCounted<StaticPropertyAnalysis> {
public:
    static Ref<StaticPropertyAnalysis> create(JSInstructionStream::MutableRef&& instructionRef)
    {
        return adoptRef(*new StaticPropertyAnalysis(WTFMove(instructionRef)));
    }

    void addPropertyIndex(unsigned propertyIndex) { m_propertyIndexes.add(propertyIndex); }

    void record();

    int propertyIndexCount() { return m_propertyIndexes.size(); }

private:
    StaticPropertyAnalysis(JSInstructionStream::MutableRef&& instructionRef)
        : m_instructionRef(WTFMove(instructionRef))
    {
    }

    JSInstructionStream::MutableRef m_instructionRef;
    typedef HashSet<unsigned, WTF::IntHash<unsigned>, WTF::UnsignedWithZeroKeyHashTraits<unsigned>> PropertyIndexSet;
    PropertyIndexSet m_propertyIndexes;
};

} // namespace JSC
