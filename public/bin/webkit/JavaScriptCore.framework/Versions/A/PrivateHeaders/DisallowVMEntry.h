/*
 * Copyright (C) 2017-2020 Apple Inc. All rights reserved.
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

#include <wtf/ForbidHeapAllocation.h>

namespace JSC {

class VM;

// The only reason we implement DisallowVMEntry as specialization of a template
// is so that we can work around having to #include VM.h, which can hurt build
// time. This defers the cost of #include'ing VM.h to only the clients that
// need it.

template<typename VMType = VM>
class DisallowVMEntryImpl {
    WTF_FORBID_HEAP_ALLOCATION;
public:
    DisallowVMEntryImpl(VMType& vm)
        : m_vm(&vm)
    {
        m_vm->disallowVMEntryCount++;
    }

    DisallowVMEntryImpl(const DisallowVMEntryImpl& other)
        : m_vm(other.m_vm)
    {
        m_vm->disallowVMEntryCount++;
    }

    ~DisallowVMEntryImpl()
    {
        RELEASE_ASSERT(m_vm->disallowVMEntryCount);
        m_vm->disallowVMEntryCount--;
        m_vm = nullptr;
    }

    DisallowVMEntryImpl& operator=(const DisallowVMEntryImpl& other)
    {
        RELEASE_ASSERT(m_vm && m_vm == other.m_vm);
        RELEASE_ASSERT(m_vm->disallowVMEntryCount);
        // Conceptually, we need to decrement the disallowVMEntryCount of the
        // old m_vm, and increment the disallowVMEntryCount of the new m_vm.
        // But since the old and the new m_vm should always be the same, the
        // decrementing and incrementing cancels out, and there's nothing more
        // to do here.
        return *this;
    }

private:
    VMType* m_vm;
};

using DisallowVMEntry = DisallowVMEntryImpl<VM>;

} // namespace JSC
