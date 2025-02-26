/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

#include "DOMJITHeapRange.h"
#include <wtf/Vector.h>
#include <wtf/text/WTFString.h>

#if ENABLE(JIT)

namespace JSC { namespace DOMJIT {

class AbstractHeap {
public:
    AbstractHeap(const String& name)
        : m_name(name)
    {
    }

    void setParent(AbstractHeap* parent)
    {
        ASSERT(!m_parent);
        parent->m_children.append(this);
        m_parent = parent;
    }

    bool isRoot() const { return !m_parent; }

    JS_EXPORT_PRIVATE void compute(unsigned begin);

    bool isComputed() const { return !!m_range; }
    HeapRange range() const { return m_range; }

    JS_EXPORT_PRIVATE void dump(PrintStream&) const;
    JS_EXPORT_PRIVATE void shallowDump(PrintStream&) const;
    JS_EXPORT_PRIVATE void deepDump(PrintStream&, unsigned indent = 0) const;

private:
    String m_name;
    AbstractHeap* m_parent { nullptr };
    Vector<AbstractHeap*> m_children { };
    HeapRange m_range;
};

} }

#endif
